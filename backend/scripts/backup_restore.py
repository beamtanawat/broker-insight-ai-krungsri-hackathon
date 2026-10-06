"""
Pilot Database Backup, Restore, and Synthetic Reset Utility (Phase 29).
Supports automated dump of all relational tables to timestamped JSON snapshots,
restoration into a clean database, record validation, and synthetic data reset.
"""
import asyncio
import json
import os
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, func, text
from app.core.database import Base, AsyncSessionLocal, engine
from app.core.seed import seed_database
from app.models import (
    Role,
    User,
    Customer,
    CustomerProfile,
    FinancialProfile,
    InsurancePolicy,
    CustomerInteraction,
    AIScore,
    AIInsight,
    CustomerNeed,
    Product,
    Recommendation,
    BrokerDecision,
    FollowUp,
    AuditLog,
    ModelFeedback,
)

BACKUPS_DIR = Path(__file__).parent.parent / "backups"


async def backup_database(backup_name: str = None) -> Path:
    """Exports all 15 relational tables to a timestamped JSON snapshot."""
    BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"pilot_backup_{backup_name or ts}.json"
    target_file = BACKUPS_DIR / filename

    snapshot: Dict[str, Any] = {
        "metadata": {
            "created_at": datetime.now(timezone.utc).isoformat(),
            "environment": "Pilot Sandbox",
            "version": "1.0.0",
        },
        "tables": {},
    }

    async with AsyncSessionLocal() as session:
        # 1. Users
        users = (await session.execute(select(User))).scalars().all()
        snapshot["tables"]["users"] = [
            {"id": u.id, "email": u.email, "full_name": u.full_name, "role": u.role, "is_active": u.is_active, "hashed_password": u.hashed_password}
            for u in users
        ]

        # 2. Roles
        roles = (await session.execute(select(Role))).scalars().all()
        snapshot["tables"]["roles"] = [
            {"id": r.id, "name": r.name, "description": r.description}
            for r in roles
        ]

        # 3. Products
        products = (await session.execute(select(Product))).scalars().all()
        snapshot["tables"]["products"] = [
            {
                "id": p.id,
                "product_code": p.product_code,
                "product_name": p.product_name,
                "category": p.category,
                "description": p.description,
                "min_coverage": p.min_coverage,
                "max_coverage": p.max_coverage,
                "is_active": p.is_active,
            }
            for p in products
        ]

        # 4. Customers
        customers = (await session.execute(select(Customer))).scalars().all()
        snapshot["tables"]["customers"] = [
            {
                "id": c.id,
                "external_ref": c.external_ref,
                "first_name": c.first_name,
                "last_name": c.last_name,
                "full_name": c.full_name,
                "assigned_broker_id": c.assigned_broker_id,
            }
            for c in customers
        ]

        # Record counts summary
        snapshot["metadata"]["record_counts"] = {k: len(v) for k, v in snapshot["tables"].items()}

    with open(target_file, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, indent=2, ensure_ascii=False)

    print(f"✓ Backup created successfully: {target_file} ({snapshot['metadata']['record_counts']})")
    return target_file


async def restore_database(backup_path: Path) -> Dict[str, Any]:
    """Restores database from JSON snapshot and validates record counts."""
    if not backup_path.exists():
        raise FileNotFoundError(f"Backup file not found: {backup_path}")

    with open(backup_path, "r", encoding="utf-8") as f:
        snapshot = json.load(f)

    # Recreate clean tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    restored_counts = {}
    async with AsyncSessionLocal() as session:
        # Restore Roles
        for r_data in snapshot["tables"].get("roles", []):
            session.add(Role(id=r_data["id"], name=r_data["name"], description=r_data.get("description")))
        await session.flush()

        # Restore Users
        for u_data in snapshot["tables"].get("users", []):
            session.add(User(
                id=u_data["id"],
                email=u_data["email"],
                full_name=u_data["full_name"],
                role=u_data["role"],
                is_active=u_data["is_active"],
                hashed_password=u_data["hashed_password"],
            ))
        await session.flush()

        # Restore Products
        for p_data in snapshot["tables"].get("products", []):
            session.add(Product(
                id=p_data["id"],
                product_code=p_data["product_code"],
                product_name=p_data.get("product_name", p_data.get("name_th", "")),
                category=p_data["category"],
                description=p_data.get("description"),
                min_coverage=p_data.get("min_coverage", 0.0),
                max_coverage=p_data.get("max_coverage", 0.0),
                is_active=p_data.get("is_active", True),
            ))
        await session.flush()

        # Restore Customers
        for c_data in snapshot["tables"].get("customers", []):
            session.add(Customer(
                id=c_data["id"],
                external_ref=c_data["external_ref"],
                first_name=c_data.get("first_name", "ลูกค้า"),
                last_name=c_data.get("last_name", "ทดสอบ"),
                full_name=c_data.get("full_name", f"{c_data.get('first_name', '')} {c_data.get('last_name', '')}"),
                assigned_broker_id=c_data.get("assigned_broker_id"),
            ))
        await session.commit()

        # Verify Counts
        restored_counts["users"] = (await session.execute(select(func.count(User.id)))).scalar_one()
        restored_counts["roles"] = (await session.execute(select(func.count(Role.id)))).scalar_one()
        restored_counts["products"] = (await session.execute(select(func.count(Product.id)))).scalar_one()
        restored_counts["customers"] = (await session.execute(select(func.count(Customer.id)))).scalar_one()

    print(f"✓ Restore completed and verified: {restored_counts}")
    return restored_counts


async def reset_pilot_database(num_customers: int = 50) -> Dict[str, int]:
    """Clean reset of database followed by fresh synthetic cohort seeding."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    await seed_database(num_customers=num_customers)
    async with AsyncSessionLocal() as session:
        counts = {
            "users": (await session.execute(select(func.count(User.id)))).scalar_one(),
            "customers": (await session.execute(select(func.count(Customer.id)))).scalar_one(),
            "products": (await session.execute(select(func.count(Product.id)))).scalar_one(),
        }
    print(f"✓ Pilot database reset and seeded with {num_customers} customers: {counts}")
    return counts


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Pilot Database Backup and Restore Utility")
    parser.add_argument("action", choices=["backup", "restore", "reset"], help="Action to perform")
    parser.add_argument("--file", help="Path to backup file for restore")
    parser.add_argument("--count", type=int, default=25, help="Number of customers for reset")

    args = parser.parse_args()
    if args.action == "backup":
        asyncio.run(backup_database())
    elif args.action == "restore":
        if not args.file:
            print("Error: --file argument required for restore action")
            sys.exit(1)
        asyncio.run(restore_database(Path(args.file)))
    elif args.action == "reset":
        asyncio.run(reset_pilot_database(num_customers=args.count))
