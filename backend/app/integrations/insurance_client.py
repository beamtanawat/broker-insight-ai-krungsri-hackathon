"""
Mock Policy Administration System (PAS) Client.
Simulates downstream Life & Non-Life Insurance Core Systems for policy inquiry.
"""
from typing import Any, Dict, List
import structlog

logger = structlog.get_logger()


class MockInsuranceClient:
    """Mock adapter for Insurance Policy Administration System."""

    def __init__(self, base_url: str = "https://mock-pas.internal"):
        self.base_url = base_url

    async def get_policies_for_customer(self, customer_ref: str) -> List[Dict[str, Any]]:
        """Simulates GET /api/v1/pas/policies?holder_ref={ref}"""
        logger.info("mock_pas_get_policies", customer_ref=customer_ref)
        return [
            {
                "policy_number": "POL-2024-88991",
                "product_code": "KRUNGSRI-LIFE-01",
                "plan_name": "กรุงศรี ไลฟ์ พลัส",
                "coverage_type": "Life",
                "sum_assured": 1000000.0,
                "annual_premium": 28000.0,
                "effective_date": "2024-05-01",
                "expiry_date": "2044-05-01",
                "renewal_due_date": "2027-05-01",
                "policy_status": "Active",
                "payment_status": "paid",
            }
        ]


insurance_client = MockInsuranceClient()
