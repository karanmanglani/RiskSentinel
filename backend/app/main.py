from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

# Import our infrastructure
from app.database import engine, get_db
from app import models, auth
from app.services.rag_service import query_rag

# 1. CREATE TABLES IN CLOUD DB (Run migrations)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="RiskSentinel API")

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PYDANTIC SCHEMAS ---
class UserCreate(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class RiskQuery(BaseModel):
    question: str

class MessageHistory(BaseModel):
    role: str
    content: str
    
    class Config:
        orm_mode = True

# --- AUTH ENDPOINTS ---

@app.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # 1. Check if email exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Create User (Email Provider)
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email, 
        hashed_password=hashed_password,
        provider="email" # Mark as standard user
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 3. Auto-login
    access_token = auth.create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 1. Find User
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    # 2. Check Password
    if not user or not user.hashed_password:
        # If user exists but has no password, they might be a Google user trying to login normally
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect password")
    
    # 3. Mint Token
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- GOOGLE OAUTH PLACEHOLDER (We will add logic here next) ---
# For now, we focus on getting Standard Auth working first.

# --- PROTECTED APP ENDPOINTS ---

@app.get("/")
def health_check():
    return {"status": "active", "service": "RiskSentinel Brain"}

@app.get("/api/history", response_model=List[MessageHistory])
def get_chat_history(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # SQL: SELECT * FROM messages WHERE user_id = {current_user.id} ORDER BY timestamp ASC
    messages = db.query(models.Message)\
        .filter(models.Message.user_id == current_user.id)\
        .order_by(models.Message.timestamp.asc())\
        .all()
    return messages

@app.post("/api/analyze")
def analyze_risk(
    query: RiskQuery, 
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db) # <--- Need DB access here now
):
    # 1. Save User Message
    user_msg = models.Message(user_id=current_user.id, role="user", content=query.question)
    db.add(user_msg)
    db.commit() # Commit immediately so it's safe

    try:
        # 2. Get AI Response
        ai_response_text = query_rag(query.question)
        
        # 3. Save AI Message
        ai_msg = models.Message(user_id=current_user.id, role="assistant", content=ai_response_text)
        db.add(ai_msg)
        db.commit()
        
        return {"answer": ai_response_text}
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))