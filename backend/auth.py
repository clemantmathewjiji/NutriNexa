import hashlib
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import get_db_connection

security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> tuple[str, str]:
    """Generates a secure salt and PBKDF2-HMAC-SHA256 password hash."""
    salt = secrets.token_hex(16)
    pwd_bytes = password.encode('utf-8')
    salt_bytes = salt.encode('utf-8')
    pwd_hash = hashlib.pbkdf2_hmac('sha256', pwd_bytes, salt_bytes, 100000).hex()
    return pwd_hash, salt

def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    """Verifies a password against the stored salt and hash."""
    pwd_bytes = password.encode('utf-8')
    salt_bytes = salt.encode('utf-8')
    pwd_hash = hashlib.pbkdf2_hmac('sha256', pwd_bytes, salt_bytes, 100000).hex()
    return secrets.compare_digest(pwd_hash, expected_hash)

def create_user_token(user_id: int) -> str:
    """Creates and persists a secure session token."""
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=7)
    conn = get_db_connection()
    conn.execute(
        "INSERT INTO auth_tokens (token, user_id, expires_at) VALUES (?, ?, ?)",
        (token, user_id, expires_at.isoformat())
    )
    conn.commit()
    conn.close()
    return token

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> dict:
    """Dependency that returns the authenticated user dictionary, or raises 401."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication token required")
    
    token = credentials.credentials
    conn = get_db_connection()
    row = conn.execute(
        """
        SELECT u.id, u.name, u.email, u.role, u.institution, t.expires_at
        FROM auth_tokens t
        JOIN users u ON t.user_id = u.id
        WHERE t.token = ?
        """,
        (token,)
    ).fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token")

    expires_at = datetime.fromisoformat(row["expires_at"])
    if datetime.utcnow() > expires_at:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")

    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "role": row["role"],
        "institution": row["institution"]
    }

def get_optional_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> Optional[dict]:
    """Dependency that returns user if logged in, otherwise None (useful for public/demo endpoints)."""
    if not credentials:
        return None
    try:
        return get_current_user(credentials)
    except HTTPException:
        return None
