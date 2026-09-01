#!/bin/sh
set -e

echo "=== Broker Insight AI Backend Startup ==="

# Wait for PostgreSQL
if [ -n "$DATABASE_URL" ]; then
    echo "Waiting for database connection..."
    python -c '
import os, time, sys
from urllib.parse import urlparse

db_url = os.getenv("DATABASE_URL", "")
# Wait up to 30s
for i in range(30):
    try:
        import socket
        parsed = urlparse(db_url.replace("+asyncpg", ""))
        host = parsed.hostname or "localhost"
        port = parsed.port or 5432
        s = socket.create_connection((host, port), timeout=2)
        s.close()
        print(f"✓ Database reachable at {host}:{port}")
        break
    except Exception as e:
        print(f"Waiting for database... ({i+1}/30)")
        time.sleep(1)
'
fi

# Run database migrations
echo "Running Alembic migrations..."
alembic upgrade head || echo "Migration skipped or already up to date"

# Generate ML model if missing
if [ ! -f "app/ml/artifacts/model.pkl" ]; then
    echo "Training LightGBM model on synthetic customer data..."
    python -m app.ml.train
fi

# Seed database if needed
echo "Checking and seeding demo data..."
python -m app.core.seed || echo "Seeding skipped or already populated"

echo "=== Starting FastAPI Server ==="
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
