import uuid
from sqlalchemy import Column, String, DateTime, Integer, Boolean , ARRAY
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(100), default="User", nullable=False)
    
    email = Column(String(255), unique=True, index=True, nullable=False)
    tickers = Column(ARRAY(String), default=lambda: ["AAPL", "MSFT", "KO"], nullable=False)
    hashed_password = Column(String(255), nullable=False)
    ai_requests_left = Column(Integer, default=10, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)