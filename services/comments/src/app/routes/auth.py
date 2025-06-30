import os

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from jose.exceptions import ExpiredSignatureError, JWTError

security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    secret = os.getenv("JWT_SECRET")

    if not secret:
        raise HTTPException(status_code=500, detail="JWT_SECRET not set")

    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        return {
            "id": payload.get("id"),
            "name": payload.get("name")
        }
    except jwt.ExpiredSignatureError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired") from e
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from e
