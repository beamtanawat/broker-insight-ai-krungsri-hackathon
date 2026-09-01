"""
Mock Integration Clients for Broker Insight AI.
Simulates downstream internal enterprise bank/insurance systems.
NOTE: These are demonstration mock adapters and do NOT connect to real Krungsri production systems.
"""
from app.integrations.crm_client import crm_client
from app.integrations.kyc_client import kyc_client
from app.integrations.financial_client import financial_client
from app.integrations.insurance_client import insurance_client
from app.integrations.transaction_client import transaction_client

__all__ = [
    "crm_client",
    "kyc_client",
    "financial_client",
    "insurance_client",
    "transaction_client",
]
