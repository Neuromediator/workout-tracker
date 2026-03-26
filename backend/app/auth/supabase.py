import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt, jwk
from functools import lru_cache
from sqlmodel import Session
from app.config import get_settings
from app.database import get_session
from app.models.user import User

security = HTTPBearer()


@lru_cache
def get_jwks():
    """Fetch Supabase JWKS public keys (cached for app lifetime)."""
    settings = get_settings()
    url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    response = httpx.get(url)
    response.raise_for_status()
    return response.json()


def get_public_key(token: str):
    """Get the matching public key from JWKS for the token."""
    header = jwt.get_unverified_header(token)
    jwks = get_jwks()
    for key_data in jwks["keys"]:
        if key_data.get("kid") == header.get("kid"):
            return jwk.construct(key_data, algorithm=header["alg"])
    raise ValueError("No matching key found in JWKS")


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    try:
        header = jwt.get_unverified_header(credentials.credentials)
        alg = header.get("alg", "HS256")

        if alg == "HS256":
            settings = get_settings()
            payload = jwt.decode(
                credentials.credentials,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
        else:
            # ES256 / asymmetric — use JWKS
            public_key = get_public_key(credentials.credentials)
            payload = jwt.decode(
                credentials.credentials,
                public_key,
                algorithms=[alg],
                audience="authenticated",
            )

        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing sub",
            )
        return user_id
    except JWTError as e:
        print(f"JWT ERROR: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def ensure_user_exists(
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> str:
    user = session.get(User, user_id)
    if not user:
        user = User(id=user_id)
        session.add(user)
        session.commit()
    return user_id
