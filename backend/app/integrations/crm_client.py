"""
Mock CRM Client.
Simulates downstream Core CRM System retrieving customer profile, relationship tier, and broker assignment.
"""
from typing import Any, Dict, Optional
import structlog

logger = structlog.get_logger()


class MockCRMClient:
    """Mock adapter for Enterprise CRM API."""

    def __init__(self, base_url: str = "https://mock-crm.internal"):
        self.base_url = base_url

    async def get_customer(self, customer_ref: str) -> Optional[Dict[str, Any]]:
        """Simulates GET /api/v1/crm/customers/{ref}"""
        logger.info("mock_crm_get_customer", customer_ref=customer_ref)
        return {
            "external_ref": customer_ref,
            "system_source": "Mock Core CRM",
            "relationship_tier": "Gold",
            "assigned_branch": "Bangkok Main Branch",
            "preferred_channel": "Branch / Mobile",
            "last_contact_date": "2026-07-15",
            "contact_consent": True,
        }

    async def update_contact_history(self, customer_ref: str, notes: str) -> bool:
        """Simulates POST /api/v1/crm/customers/{ref}/interactions"""
        logger.info("mock_crm_update_interaction", customer_ref=customer_ref, notes=notes)
        return True


crm_client = MockCRMClient()
