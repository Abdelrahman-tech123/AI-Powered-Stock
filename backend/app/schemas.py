from pydantic import BaseModel, EmailStr, Field
from typing import Optional , List
from datetime import datetime
import uuid

# ============================
# 🔐 AUTH SCHEMAS (المستخدمين)
# ============================

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="الاسم يجب أن يكون بين حرفين و 100 حرف")
    email: EmailStr
    password: str = Field(..., min_length=6, description="كلمة المرور يجب ألا تقل عن 6 أحرف")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    ai_requests_left: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ============================
# 🪙 TOKEN SCHEMAS (الـ JWT)
# ============================

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    id: Optional[str] = None


# ============================
# 🪙 TICKERS & STOCK SCHEMAS
# ============================

class TickersUpdate(BaseModel):
    tickers: List[str] = Field(..., description="قائمة برموز الأسهم الجديدة بالكامل")
