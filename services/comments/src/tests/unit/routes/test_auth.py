import os
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException, status
from jose import jwt
from jose.exceptions import ExpiredSignatureError, JWTError

from app.routes.auth import get_current_user


@pytest.fixture
def mock_http_authorization_credentials():
    mock_creds = MagicMock()
    mock_creds.credentials = "mock_token"
    return mock_creds


@pytest.fixture(autouse=True)
def mock_os_getenv_jwt_secret():
    with patch('os.getenv') as mock_getenv:
        mock_getenv.return_value = "test_secret"
        yield mock_getenv


@pytest.fixture(autouse=True)
def mock_jwt_decode():
    with patch('jose.jwt.decode') as mock_decode:
        mock_decode.return_value = {"id": "test_user_id", "name": "Test User"}
        yield mock_decode


def test_get_current_user_success(mock_http_authorization_credentials, mock_os_getenv_jwt_secret, mock_jwt_decode):
    user = get_current_user(mock_http_authorization_credentials)
    assert user == {"id": "test_user_id", "name": "Test User"}
    mock_jwt_decode.assert_called_once_with("mock_token", "test_secret", algorithms=["HS256"])


def test_get_current_user_no_jwt_secret(mock_http_authorization_credentials):
    with patch('os.getenv', return_value=None):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(mock_http_authorization_credentials)
        assert exc_info.value.status_code == 500
        assert exc_info.value.detail == "JWT_SECRET not set"


def test_get_current_user_expired_token(mock_http_authorization_credentials):
    with patch('jose.jwt.decode', side_effect=ExpiredSignatureError):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(mock_http_authorization_credentials)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail == "Token expired"


def test_get_current_user_invalid_token(mock_http_authorization_credentials):
    with patch('jose.jwt.decode', side_effect=JWTError):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(mock_http_authorization_credentials)
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail == "Invalid token"
