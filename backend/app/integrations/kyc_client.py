"""
Mock KYC & Identity Verification Client.
Simulates downstream Identity / NDID / e-KYC Verification Gateway.
"""
from typing import Any, Dict, Optional
import structlog

logger = structlog.get_logger()


class MockKYCClient:
    """Mock adapter for Identity & KYC Verification Service."""

    def __init__(self, base_url: str = "https://mock-kyc.internal"):
        self.base_url = base_url

    async def get_kyc_status(self, national_id_or_ref: str) -> Dict[str, Any]:
        """Simulates GET /api/v1/kyc/status/{id}"""
        logger.info("mock_kyc_status_check", ref=national_id_or_ref)
        return {
            "identifier": national_id_or_ref,
            "kyc_status": "verified",
            "verification_channel": "NDID / Branch Dip-Chip",
            "verified_at": "2026-01-10T09:30:00Z",
            "risk_tolerance_level": "Moderate-High",
            "suitability_score": 4,
            "aml_sanction_clear": True,
        }


kyc_client = MockKYCClient()
