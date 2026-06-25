from fastapi import APIRouter, Depends, Body, HTTPException , status
from fastapi.responses import JSONResponse
from typing import Any, Dict
from app.auth import get_current_user
from app.models import User

#

from sqlalchemy.orm import Session
from app.services.ai_services import AI_analyze , AI_chatBot
from app.auth import get_current_user
from app.database import get_db
from app.schemas import ChatRequest , ChatResponse
from app.config import debug_print


router = APIRouter()

##############
# AI analyze #
##############

@router.post("/info/analyze" , response_class=JSONResponse)
def send_stock_ai_analysis(
    stock_data: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user)
):
    ai_string_report = AI_analyze.generate_stock_ai_report(stock_data)
    return ai_string_report

##############
# AI ChatBot #
##############

@router.get("/chat/limit")
async def get_chat_limit(
    db : Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    AI_chatBot.verify_and_lazy_reset_limit(current_user , db)
    return {"requests_left": current_user.ai_requests_left}

@router.post("/chat/send" , response_model=ChatResponse)
def handle_ai_chat(
    payload : ChatRequest,
    db : Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    AI_chatBot.verify_and_lazy_reset_limit(current_user , db)

    if current_user.ai_requests_left <= 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="لقد استهلكت جميع رسائلك المتاحة لليوم. يتجدد العداد تلقائياً غداً!"
        )
    
    try:
        reply_content = AI_chatBot.generate_chat_reply(
            user_message=payload.message,
            ticker=payload.ticker,
            history_messages=payload.history,
            stock_data=payload.stock_data
        )

        current_user.ai_requests_left -= 1
        db.commit()

        return{
            "reply" : reply_content,
            "requests_left" : current_user.ai_requests_left
        }
    
    except Exception as e:
        db.rollback()
        debug_print(f"Chat Route Error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="حدث خطأ أثناء معالجة رد الذكاء الاصطناعي.")
    

###