"""Helper script to seed synthetic demonstration data."""
import asyncio
from app.core.seed import seed_database

if __name__ == "__main__":
    print("Seeding synthetic demo data...")
    asyncio.run(seed_database())
    print("✓ Seeding completed successfully.")
