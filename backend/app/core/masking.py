"""
Data Masking utilities for PII and financial identifier governance.
Provides field-level obfuscation based on role authorization and data protection principles.
"""
from typing import Any, Optional


def mask_policy_number(policy_number: Optional[str]) -> str:
    """Masks middle section of an insurance policy number. e.g. POL-2024-88991 -> POL-****-88991"""
    if not policy_number or len(policy_number) <= 6:
        return policy_number or ""
    parts = policy_number.split("-")
    if len(parts) >= 3:
        return f"{parts[0]}-****-{parts[-1]}"
    return f"{policy_number[:4]}****{policy_number[-4:]}"


def mask_account_number(account_number: Optional[str]) -> str:
    """Masks middle section of bank account or loan identifier. e.g. 987-123456-7 -> 987-***-7"""
    if not account_number or len(account_number) <= 5:
        return account_number or ""
    parts = account_number.split("-")
    if len(parts) == 3:
        return f"{parts[0]}-***-{parts[2]}"
    return f"{account_number[:3]}***{account_number[-2:]}"


def mask_phone_number(phone: Optional[str]) -> str:
    """Masks middle section of phone number. e.g. 0812345678 -> 081-***-5678"""
    if not phone or len(phone) < 9:
        return phone or ""
    clean = phone.replace("-", "").strip()
    return f"{clean[:3]}-***-{clean[-4:]}"


def mask_national_id(national_id: Optional[str]) -> str:
    """Masks Thai Citizen ID. e.g. 1100400123456 -> 1-1004-*****-56"""
    if not national_id or len(national_id) < 13:
        return national_id or ""
    clean = national_id.replace("-", "").strip()
    return f"{clean[0]}-{clean[1:5]}-*****-{clean[-2:]}"


def mask_customer_sensitive_fields(customer_dict: dict, user_role: str = "broker") -> dict:
    """
    Applies governance masking to dictionary payload based on user role.
    Managers / Admins get full access; unprivileged contexts get masked identifiers.
    """
    masked = dict(customer_dict)
    
    # Mask policies
    if "insurance_policies" in masked and isinstance(masked["insurance_policies"], list):
        masked["insurance_policies"] = [
            {
                **p,
                "policy_number": mask_policy_number(p.get("policy_number"))
                if user_role not in ("admin", "manager")
                else p.get("policy_number"),
            }
            for p in masked["insurance_policies"]
        ]
        
    # Mask loan details in financial profile
    if "financial_profile" in masked and masked["financial_profile"]:
        fp = dict(masked["financial_profile"])
        if fp.get("loan_details") and user_role not in ("admin", "manager"):
            fp["loan_details"] = mask_account_number(fp["loan_details"])
        masked["financial_profile"] = fp

    return masked
