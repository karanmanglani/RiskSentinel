from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
import os
from dotenv import load_dotenv
import hashlib
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

load_dotenv()

# --- CONFIGURATION ---
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
GOOGLE_CLIENT_ID = "326829570192-gf6boa8bms63jcg4atn3iapdcqjapmdu.apps.googleusercontent.com"

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Helpers ---
# we hash the password with SHA256 first.
def _pre_hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# --- UTILS ---
def verify_password(plain_password, hashed_password):
    # Hash the input first, THEN check against the stored Bcrypt hash
    pre_hashed = _pre_hash(plain_password)
    return pwd_context.verify(pre_hashed, hashed_password)

def get_password_hash(password):
    # Hash the input first, THEN generate the Bcrypt hash
    pre_hashed = _pre_hash(password)
    return pwd_context.hash(pre_hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- PROTECTOR FUNCTION ---
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def verify_google_token(token: str):
    try:
        # Verify the token with Google's public keys
        id_info = id_token.verify_oauth2_token(
            token, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        # Google returns the user's email inside the token
        return id_info['email']
    except Exception as e:
        print(f"Google Auth Error: {e}")
        return None