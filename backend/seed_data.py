"""Helper script to seed high-fidelity synthetic demonstration data."""
import asyncio
from app.core.seed import seed_database

if __name__ == "__main__":
    print("Seeding high-fidelity synthetic demo data with force reseed...")
    asyncio.run(seed_database(num_customers=250, force_reseed=True))
    print("✓ Seeding completed successfully.")
