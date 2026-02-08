import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# 1. Load Environment Variables
load_dotenv()

# 2. Get the URL
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# --- DEBUGGING BLOCK ---
print(f"------------ DOCKER DATABASE DEBUG ------------")
print(f"Raw URL value: '{SQLALCHEMY_DATABASE_URL}'")
print(f"Type: {type(SQLALCHEMY_DATABASE_URL)}")
print(f"-----------------------------------------------")

# 3. Validation Logic
if not SQLALCHEMY_DATABASE_URL or SQLALCHEMY_DATABASE_URL == "None":
    print("⚠️  URL is missing. Switching to SQLite.")
    SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

# 4. Fix Postgres Protocol
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 5. Create Engine
try:
    if "sqlite" in SQLALCHEMY_DATABASE_URL:
        engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
    print("✅ Database Engine Created Successfully.")
except Exception as e:
    print(f"❌ CRITICAL ERROR creating engine: {e}")
    # We exit here so the logs show the error clearly
    sys.exit(1)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()