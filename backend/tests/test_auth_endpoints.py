import pytest
from app.models.user import User

async def test_health_check(async_client):
    response = await async_client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "main_api"}

async def test_login_mock_endpoint(async_client):
    response = await async_client.post("/api/auth/login")
    assert response.status_code == 200
    assert "token" in response.json()
