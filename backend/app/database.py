import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# 1. LOAD CONFIG
load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# --- SAFETY CHECKS ---
if not SQLALCHEMY_DATABASE_URL:
    print("⚠️ WARNING: No DATABASE_URL found in .env. Using local SQLite.")
    SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

# 2. URL FIXER (Critical for Neon/Render)
# SQLAlchemy requires 'postgresql://', but some providers give 'postgres://'
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 3. CREATE ENGINE WITH ROBUSTNESS
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # POSTGRES SETTINGS
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,  # <--- FIX: Auto-reconnect if Neon closes the connection
        pool_size=10,        # Keep 10 connections open
        max_overflow=20      # Allow spikes
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()