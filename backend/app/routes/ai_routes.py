from fastapi import APIRouter, Depends, Body
from fastapi.responses import JSONResponse
from typing import Any, Dict
from app.auth import get_current_user
from app.models import User
from app.services.ai_services import AI_services


router = APIRouter()

@router.post("/info/analyze" , response_class=JSONResponse)
def send_stock_ai_analysis(
    stock_data: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user)
):
    ai_string_report = AI_services.generate_stock_ai_report(stock_data)
    return ai_string_report