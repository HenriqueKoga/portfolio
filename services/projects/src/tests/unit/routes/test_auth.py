import pytest
from unittest.mock import patch
from fastapi import HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from jose import jwt
from jose.exceptions import ExpiredSignatureError, JWTError
from app.routes.auth import get_current_user

@pytest.fixture
def mock_credentials():
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials="test_token")

@pytest.mark.asyncio
async def test_get_current_user_success(mock_credentials):
    with patch('os.getenv', return_value="test_secret"), \
         patch('jose.jwt.decode', return_value={"id": "123", "name": "test_user"}):
        user = get_current_user(mock_credentials)
        assert user == {"id": "123", "name": "test_user"}

@pytest.mark.asyncio
async def test_get_current_user_no_secret(mock_credentials):
    with patch('os.getenv', return_value=None):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(mock_credentials)
        assert exc_info.value.status_code == 500
        assert exc_info.value.detail == "JWT_SECRET not set"

@pytest.mark.asyncio
async def test_get_current_user_expired_token(mock_credentials):
    with patch('os.getenv', return_value="test_secret"), \
         patch('jose.jwt.decode', side_effect=jwt.ExpiredSignatureError):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(mock_credentials)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail == "Token expired"

@pytest.mark.asyncio
async def test_get_current_user_invalid_token(mock_credentials):
    with patch('os.getenv', return_value="test_secret"), \
         patch('jose.jwt.decode', side_effect=JWTError):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(mock_credentials)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail == "Invalid token"
