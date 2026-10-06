"""
Mock Payment & Transaction Engine Client.
Simulates downstream payment gateways and 90-day transaction frequency feeds.
"""
from typing import Any, Dict, List
import structlog

logger = structlog.get_logger()


class MockTransactionClient:
    """Mock adapter for Transaction & Payment Gateway."""

    def __init__(self, base_url: str = "https://mock-tx.internal"):
        self.base_url = base_url

    async def get_transaction_activity(self, customer_ref: str) -> Dict[str, Any]:
        """Simulates GET /api/v1/payments/activity?ref={ref}&window=90d"""
        logger.info("mock_tx_get_activity", customer_ref=customer_ref)
        return {
            "customer_ref": customer_ref,
            "window_days": 90,
            "transaction_count": 34,
            "digital_channel_ratio": 0.92,
            "has_recurrent_auto_debit": True,
            "last_transaction_timestamp": "2026-08-28T14:22:00Z",
            "overdue_payments_count": 0,
        }


transaction_client = MockTransactionClient()
