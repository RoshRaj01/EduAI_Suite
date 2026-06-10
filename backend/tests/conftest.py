import pytest
import os

# Force testing database name before imports
os.environ["MONGODB_DB"] = "eduai_test_db"
# Fallback to local mongo if TEST_MONGODB_URL isn't set
os.environ["MONGODB_URL"] = os.getenv("TEST_MONGODB_URL", "mongodb://localhost:27017")

from httpx import AsyncClient, ASGITransport
from app.main import app
# We no longer need manual db_setup because FastAPI's Lifespan handles init_db()

@pytest.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
