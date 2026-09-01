"""Customer endpoints: list, detail, profile, follow-ups, conversation, and ML analysis with RBAC and Audit Logging."""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.audit import log_audit_event
from app.core.masking import mask_policy_number, mask_account_number
from app.core.rate_limiter import rate_limit
from app.models.user import User
from app.models.customer import Customer, CustomerProfile
from app.models.financial import FinancialProfile
from app.models.insurance import InsurancePolicy
from app.models.interaction import CustomerInteraction
from app.models.followup import FollowUp
from app.models.ai_score import AIScore
from app.models.customer_need import CustomerNeed
from app.models.audit_log import AuditLog
from app.models.product import Product
from app.ml.predict import predictor
from app.services.conversation_service import conversation_service
from app.schemas.customer import (
    CustomerListResponse,
    CustomerListItem,
    CustomerDetailOut,
    CustomerFullProfileResponse,
    CustomerProfileOut,
    FinancialProfileOut,
    InsurancePolicyOut,
    AIScoreSummaryOut,
    CustomerNeedOut,
    FollowUpSummaryOut,
    AnalyzeCustomerResponse,
    SHAPFactor,
    ModelMetadataOut,
)
from app.schemas.followup import FollowUpListResponse, FollowUpOut
from app.schemas.conversation import (
    ConversationAssistantResponse,
    FollowUpCreate,
    FollowUpUpdate,
    CustomerAuditHistoryResponse,
    AuditLogOut,
)

router = APIRouter()


@router.get("", response_model=CustomerListResponse)
async def list_customers(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name or ref"),
    priority: Optional[str] = Query(None, description="Filter by priority level: high, medium, low"),
    kyc_status: Optional[str] = Query(None, description="Filter by KYC status: verified, pending, rejected"),
    assigned_only: bool = Query(False, description="Filter to assigned broker customers only"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List customers with pagination, search, priority filter, and broker assignment."""
    query = (
        select(Customer)
        .options(
            selectinload(Customer.profile),
            selectinload(Customer.ai_scores),
            selectinload(Customer.insurance_policies),
            selectinload(Customer.follow_ups),
        )
    )

    if assigned_only and current_user.role == "broker":
        query = query.where(Customer.assigned_broker_id == current_user.id)

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Customer.full_name.ilike(search_pattern),
                Customer.external_ref.ilike(search_pattern),
            )
        )

    count_stmt = select(func.count(Customer.id))
    if assigned_only and current_user.role == "broker":
        count_stmt = count_stmt.where(Customer.assigned_broker_id == current_user.id)
    if search:
        count_stmt = count_stmt.where(
            or_(
                Customer.full_name.ilike(f"%{search}%"),
                Customer.external_ref.ilike(f"%{search}%"),
            )
        )
    total_res = await db.execute(count_stmt)
    total = total_res.scalar_one()

    offset = (page - 1) * page_size
    query = query.order_by(Customer.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    customers = result.scalars().all()

    items = []
    for c in customers:
        latest_score = c.ai_scores[0] if c.ai_scores else None
        
        if priority and (not latest_score or latest_score.priority_level != priority):
            continue
        if kyc_status and (not c.profile or c.profile.kyc_status != kyc_status):
            continue

        short_reason = None
        if latest_score and latest_score.feature_importance:
            top = latest_score.feature_importance[0]
            short_reason = top.get("label", top.get("feature", ""))

        has_overdue = any(
            f.payment_status == "overdue" or f.status == "open" for f in c.follow_ups
        )

        items.append(
            CustomerListItem(
                id=c.id,
                external_ref=c.external_ref,
                full_name=c.full_name,
                kyc_status=c.profile.kyc_status if c.profile else "pending",
                relationship_tier=c.profile.relationship_tier if c.profile else "Standard",
                score_display=latest_score.score_display if latest_score else None,
                priority_level=latest_score.priority_level if latest_score else None,
                score_short_reason=short_reason,
                active_policies_count=len([p for p in c.insurance_policies if p.status == "Active"]),
                has_overdue_followup=has_overdue,
            )
        )

    return CustomerListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{id}", response_model=CustomerDetailOut)
async def get_customer(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get complete customer detail and log audit event."""
    result = await db.execute(
        select(Customer)
        .options(
            selectinload(Customer.profile),
            selectinload(Customer.financial_profile),
            selectinload(Customer.insurance_policies),
            selectinload(Customer.ai_scores),
            selectinload(Customer.needs),
            selectinload(Customer.follow_ups),
        )
        .where(Customer.id == id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with id '{id}' not found",
        )

    # Log audit event
    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="CUSTOMER_VIEWED",
        entity_type="CUSTOMER",
        entity_id=customer.id,
        metadata={"external_ref": customer.external_ref},
    )

    latest_score = customer.ai_scores[0] if customer.ai_scores else None

    # Apply data masking for non-admin/non-manager roles
    policies_out = []
    for p in customer.insurance_policies:
        p_dict = {
            "id": p.id,
            "customer_id": p.customer_id,
            "policy_number": mask_policy_number(p.policy_number) if current_user.role not in ("admin", "manager") else p.policy_number,
            "policy_type": p.policy_type,
            "coverage_amount": p.coverage_amount,
            "premium_amount": p.premium_amount,
            "start_date": p.start_date,
            "renewal_date": p.renewal_date,
            "status": p.status,
            "payment_status": p.payment_status,
            "remarks": p.remarks,
        }
        policies_out.append(InsurancePolicyOut(**p_dict))

    fin_out = None
    if customer.financial_profile:
        fin_dict = {
            "id": customer.financial_profile.id,
            "customer_id": customer.financial_profile.customer_id,
            "total_assets": customer.financial_profile.total_assets,
            "total_liabilities": customer.financial_profile.total_liabilities,
            "monthly_savings": customer.financial_profile.monthly_savings,
            "has_active_loan": customer.financial_profile.has_active_loan,
            "loan_details": mask_account_number(customer.financial_profile.loan_details) if current_user.role not in ("admin", "manager") else customer.financial_profile.loan_details,
            "products_held": customer.financial_profile.products_held or [],
            "transaction_frequency_90d": customer.financial_profile.transaction_frequency_90d,
            "last_financial_activity": customer.financial_profile.last_financial_activity,
        }
        fin_out = FinancialProfileOut(**fin_dict)

    return CustomerDetailOut(
        id=customer.id,
        external_ref=customer.external_ref,
        first_name=customer.first_name,
        last_name=customer.last_name,
        full_name=customer.full_name,
        assigned_broker_id=customer.assigned_broker_id,
        created_at=customer.created_at,
        updated_at=customer.updated_at,
        profile=CustomerProfileOut.model_validate(customer.profile) if customer.profile else None,
        financial_profile=fin_out,
        insurance_policies=policies_out,
        latest_score=AIScoreSummaryOut.model_validate(latest_score) if latest_score else None,
        needs=[CustomerNeedOut.model_validate(n) for n in customer.needs],
        follow_ups=[FollowUpSummaryOut.model_validate(f) for f in customer.follow_ups],
    )


@router.get("/{id}/profile", response_model=CustomerFullProfileResponse)
async def get_customer_profile(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get customer demographic and financial profile with active policies overview."""
    result = await db.execute(
        select(Customer)
        .options(
            selectinload(Customer.profile),
            selectinload(Customer.financial_profile),
            selectinload(Customer.insurance_policies),
        )
        .where(Customer.id == id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with id '{id}' not found",
        )

    active_policies = [p for p in customer.insurance_policies if p.status == "Active"]
    total_cov = sum(p.coverage_amount for p in active_policies)

    # Mask policies for broker
    policies_out = [
        InsurancePolicyOut(
            id=p.id,
            customer_id=p.customer_id,
            policy_number=mask_policy_number(p.policy_number) if current_user.role not in ("admin", "manager") else p.policy_number,
            policy_type=p.policy_type,
            coverage_amount=p.coverage_amount,
            premium_amount=p.premium_amount,
            start_date=p.start_date,
            renewal_date=p.renewal_date,
            status=p.status,
            payment_status=p.payment_status,
            remarks=p.remarks,
        )
        for p in active_policies
    ]

    fin_out = None
    if customer.financial_profile:
        fin_dict = {
            "id": customer.financial_profile.id,
            "customer_id": customer.financial_profile.customer_id,
            "total_assets": customer.financial_profile.total_assets,
            "total_liabilities": customer.financial_profile.total_liabilities,
            "monthly_savings": customer.financial_profile.monthly_savings,
            "has_active_loan": customer.financial_profile.has_active_loan,
            "loan_details": mask_account_number(customer.financial_profile.loan_details) if current_user.role not in ("admin", "manager") else customer.financial_profile.loan_details,
            "products_held": customer.financial_profile.products_held or [],
            "transaction_frequency_90d": customer.financial_profile.transaction_frequency_90d,
            "last_financial_activity": customer.financial_profile.last_financial_activity,
        }
        fin_out = FinancialProfileOut(**fin_dict)

    return CustomerFullProfileResponse(
        customer_id=customer.id,
        external_ref=customer.external_ref,
        full_name=customer.full_name,
        profile=CustomerProfileOut.model_validate(customer.profile) if customer.profile else None,
        financial_profile=fin_out,
        active_policies=policies_out,
        total_coverage=total_cov,
    )


@router.get("/{id}/follow-ups", response_model=FollowUpListResponse)
async def get_customer_followups(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all follow-up history and scheduled items for a customer."""
    cust_check = await db.execute(select(Customer.id).where(Customer.id == id))
    if not cust_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with id '{id}' not found",
        )

    result = await db.execute(
        select(FollowUp)
        .where(FollowUp.customer_id == id)
        .order_by(desc(FollowUp.created_at))
    )
    follow_ups = result.scalars().all()

    return FollowUpListResponse(
        items=[FollowUpOut.model_validate(f) for f in follow_ups],
        total=len(follow_ups),
    )


@router.post("/{id}/follow-ups", response_model=FollowUpOut, status_code=status.HTTP_201_CREATED)
async def create_customer_followup(
    id: str,
    body: FollowUpCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new scheduled follow-up for a customer and record audit log."""
    cust_check = await db.execute(select(Customer).where(Customer.id == id))
    customer = cust_check.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Customer '{id}' not found")

    followup = FollowUp(
        customer_id=id,
        broker_id=current_user.id,
        scheduled_date=body.scheduled_date,
        follow_up_window=body.follow_up_window,
        status=body.status,
        priority=body.priority,
        payment_status=body.payment_status,
        notes=body.notes,
        created_at=datetime.now(timezone.utc),
    )
    db.add(followup)
    await db.flush()

    # Log audit event
    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="FOLLOW_UP_CREATED",
        entity_type="FOLLOW_UP",
        entity_id=followup.id,
        metadata={"customer_id": id, "status": body.status, "scheduled_date": str(body.scheduled_date)},
    )
    await db.commit()

    return FollowUpOut.model_validate(followup)


@router.patch("/{id}/follow-ups/{followup_id}", response_model=FollowUpOut)
async def update_customer_followup(
    id: str,
    followup_id: str,
    body: FollowUpUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update follow-up notes, status, or date and record audit log."""
    result = await db.execute(
        select(FollowUp).where(FollowUp.id == followup_id, FollowUp.customer_id == id)
    )
    followup = result.scalar_one_or_none()
    if not followup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"FollowUp '{followup_id}' not found")

    if body.status is not None:
        followup.status = body.status
    if body.notes is not None:
        followup.notes = body.notes
    if body.scheduled_date is not None:
        followup.scheduled_date = body.scheduled_date
    if body.priority is not None:
        followup.priority = body.priority
    if body.payment_status is not None:
        followup.payment_status = body.payment_status
    if body.follow_up_window is not None:
        followup.follow_up_window = body.follow_up_window

    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="FOLLOW_UP_UPDATED",
        entity_type="FOLLOW_UP",
        entity_id=followup.id,
        metadata={"customer_id": id, "updated_fields": body.model_dump(exclude_unset=True)},
    )
    await db.commit()

    return FollowUpOut.model_validate(followup)


@router.post(
    "/{id}/analyze",
    response_model=AnalyzeCustomerResponse,
    dependencies=[Depends(rate_limit(max_requests=30, window_seconds=60, key_prefix="ai_analyze"))],
)
async def analyze_customer(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Real ML Priority Scoring & TreeSHAP Explanation with Audit Logging."""
    result = await db.execute(
        select(Customer)
        .options(
            selectinload(Customer.profile),
            selectinload(Customer.financial_profile),
            selectinload(Customer.insurance_policies),
            selectinload(Customer.interactions),
            selectinload(Customer.follow_ups),
        )
        .where(Customer.id == id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Customer with id '{id}' not found")

    # Run real ML prediction and SHAP explanation
    pred = predictor.predict_customer(customer)

    # Persist score to database
    ai_score = AIScore(
        customer_id=customer.id,
        score=pred["raw_probability"],
        score_display=pred["score"],
        priority_level=pred["priority_level"],
        shap_values={f["feature"]: f["shap_value"] for f in pred["factors"]},
        feature_importance=pred["factors"],
        model_version=pred["model_version"],
        scored_at=datetime.now(timezone.utc),
    )
    db.add(ai_score)
    await db.flush()

    # Log audit event
    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="AI_ANALYSIS_REQUESTED",
        entity_type="AI_SCORE",
        entity_id=ai_score.id,
        metadata={
            "customer_id": customer.id,
            "score": pred["score"],
            "priority_level": pred["priority_level"],
            "model_name": pred["model_name"],
            "model_version": pred["model_version"],
        },
    )
    await db.commit()

    return AnalyzeCustomerResponse(
        customer_id=customer.id,
        external_ref=customer.external_ref,
        full_name=customer.full_name,
        score=pred["score"],
        probability=pred["raw_probability"],
        raw_probability=pred["raw_probability"],
        calibrated_probability=pred["calibrated_probability"],
        priority=pred["priority_level"],
        priority_level=pred["priority_level"],
        calibration_method=pred.get("calibration_method", "platt_sigmoid"),
        calibration_explanation=pred.get(
            "calibration_explanation",
            "Priority Score is derived from the validated model probability.",
        ),
        factors=[SHAPFactor(**f) for f in pred["factors"]],
        model_metadata=ModelMetadataOut(
            model_name=pred["model_name"],
            model_version=pred["model_version"],
            timestamp=pred["timestamp"],
        ),
        features_used=pred["features_used"],
    )


@router.post(
    "/{id}/conversation",
    response_model=ConversationAssistantResponse,
    dependencies=[Depends(rate_limit(max_requests=30, window_seconds=60, key_prefix="ai_conversation"))],
)
async def generate_customer_conversation(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate structured AI Conversation Guide (objective, suggested opening, questions,
    topics, potential concerns, and follow-up questions) with Audit Logging.
    """
    result = await db.execute(
        select(Customer)
        .options(
            selectinload(Customer.profile),
            selectinload(Customer.financial_profile),
            selectinload(Customer.insurance_policies),
            selectinload(Customer.ai_scores),
            selectinload(Customer.needs),
        )
        .where(Customer.id == id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Customer with id '{id}' not found")

    prof = customer.profile
    fin = customer.financial_profile
    latest_score = customer.ai_scores[0] if customer.ai_scores else None

    # Load active product names for recommendation context
    prod_res = await db.execute(select(Product.product_name).where(Product.is_active == True).limit(3))
    prod_names = prod_res.scalars().all()

    context = {
        "full_name": customer.full_name,
        "external_ref": customer.external_ref,
        "age": prof.age if prof else 40,
        "occupation": prof.occupation if prof else "ไม่ระบุ",
        "total_assets": fin.total_assets if fin else 0.0,
        "total_liabilities": fin.total_liabilities if fin else 0.0,
        "has_active_loan": fin.has_active_loan if fin else False,
        "policies": [p.policy_type for p in customer.insurance_policies if p.status == "Active"],
        "score": latest_score.score_display if latest_score else 50,
        "priority_level": latest_score.priority_level if latest_score else "medium",
        "top_factors": [f.get("label", f.get("feature", "")) for f in (latest_score.feature_importance if latest_score else [])[:3]],
        "needs": [n.description for n in customer.needs],
        "recommended_products": prod_names,
    }

    guide = conversation_service.generate_conversation_guide(customer.id, context)

    # Log audit event
    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="CONVERSATION_ASSISTANT_REQUEST",
        entity_type="CUSTOMER",
        entity_id=customer.id,
        metadata={
            "model_name": guide.model_metadata.model_name,
            "model_version": guide.model_metadata.model_version,
            "provider": guide.model_metadata.provider,
        },
    )

    return guide


@router.get("/{id}/audit-logs", response_model=CustomerAuditHistoryResponse)
async def get_customer_audit_logs(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve complete audit and activity timeline for a customer."""
    cust_check = await db.execute(select(Customer.id).where(Customer.id == id))
    if not cust_check.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Customer with id '{id}' not found")

    # Match events where entity_id == customer_id OR metadata contains customer_id
    stmt = (
        select(AuditLog)
        .options(selectinload(AuditLog.user))
        .where(
            or_(
                AuditLog.entity_id == id,
                AuditLog.metadata_["customer_id"].as_string() == id,
            )
        )
        .order_by(desc(AuditLog.timestamp))
        .limit(50)
    )
    result = await db.execute(stmt)
    logs = result.scalars().all()

    items = []
    for l in logs:
        items.append(
            AuditLogOut(
                id=l.id,
                user_id=l.user_id,
                action=l.action,
                entity_type=l.entity_type,
                entity_id=l.entity_id,
                metadata=l.metadata_ or {},
                timestamp=l.timestamp,
                user_name=l.user.full_name if l.user else "System",
            )
        )

    return CustomerAuditHistoryResponse(
        customer_id=id,
        total_events=len(items),
        events=items,
    )
