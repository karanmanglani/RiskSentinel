import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# 1. Load the URL from .env (Security First!)
load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Fallback for safety (prevents crashing if you forget the .env)
if not SQLALCHEMY_DATABASE_URL:
    print("⚠️ WARNING: No DATABASE_URL found. Using local SQLite for backup.")
    SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

# 2. CREATE THE ENGINE
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    # SQLite settings (Local backup)
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL settings (Cloud Production)
    # We remove 'check_same_thread' because Postgres handles threads natively
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()