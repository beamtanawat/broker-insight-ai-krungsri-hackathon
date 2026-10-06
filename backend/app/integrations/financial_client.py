"""
Mock Core Banking & Financial Account Client.
Simulates downstream Core Banking deposit, lending, and investment asset balances.
"""
from typing import Any, Dict, List, Optional
import structlog

logger = structlog.get_logger()


class MockFinancialClient:
    """Mock adapter for Core Banking Financial API."""

    def __init__(self, base_url: str = "https://mock-banking.internal"):
        self.base_url = base_url

    async def get_financial_summary(self, customer_ref: str) -> Dict[str, Any]:
        """Simulates GET /api/v1/core-banking/accounts/{ref}/summary"""
        logger.info("mock_banking_financial_summary", customer_ref=customer_ref)
        return {
            "customer_ref": customer_ref,
            "total_deposits": 2500000.0,
            "total_mutual_funds": 500000.0,
            "total_liabilities": 1200000.0,
            "active_loans": [
                {
                    "loan_type": "Housing Loan",
                    "account_no": "987-123456-7",
                    "outstanding_balance": 1200000.0,
                    "monthly_installment": 14500.0,
                    "maturity_date": "2040-12-31",
                }
            ],
            "estimated_monthly_savings": 25000.0,
            "primary_account_status": "Active",
        }


financial_client = MockFinancialClient()
