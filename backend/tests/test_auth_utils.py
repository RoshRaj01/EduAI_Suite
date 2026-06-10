import pytest
from app.utils.auth import get_password_hash, verify_password, create_access_token
from jose import jwt
from app.utils.auth import SECRET_KEY, ALGORITHM

def test_password_hashing():
    password = "supersecretpassword"
    hashed = get_password_hash(password)
    
    # Ensure hash is different from plain text
    assert hashed != password
    
    # Verify correctly matches
    assert verify_password(password, hashed) is True
    
    # Verify wrong password fails
    assert verify_password("wrongpassword", hashed) is False

def test_create_access_token():
    data = {"sub": "testuser@example.com"}
    token = create_access_token(data)
    
    # Ensure token is generated
    assert isinstance(token, str)
    assert len(token) > 0
    
    # Decode token to verify payload
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload.get("sub") == "testuser@example.com"
    assert "exp" in payload
