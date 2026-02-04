from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True) 
    provider = Column(String, default="email") 
    
    # 🔗 RELATIONSHIP: One User has Many Messages
    # 'back_populates' creates a virtual link so we can access user.messages
    messages = relationship("Message", back_populates="owner")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    # 🔑 FOREIGN KEY: This links the message to a specific User ID
    user_id = Column(Integer, ForeignKey("users.id")) 
    
    role = Column(String) # "user" or "assistant"
    content = Column(Text) # We use Text instead of String for long paragraphs
    timestamp = Column(DateTime, default=datetime.utcnow) # Auto-timestamp
    
    # Link back to the User
    owner = relationship("User", back_populates="messages")