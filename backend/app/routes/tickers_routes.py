from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.database import get_db
from app import auth
from app.schemas import TickersUpdate
from app.models import User

router = APIRouter()





@router.post("" , status_code=status.HTTP_200_OK)
async def update_user_tickers(
    data: TickersUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    clean_tickers = [ticker.strip().upper() for ticker in data.tickers if ticker.strip()]

    current_user.tickers = clean_tickers # type: ignore
    db.commit()
    db.refresh(current_user)

    return {
        "status": "success",
        "details": "تم تحديث قائمة الأسهم بنجاح",
    }


@router.get("", status_code=status.HTTP_200_OK)
async def get_user_tickers(
    current_user: User = Depends(auth.get_current_user)
):
    user_tickers = current_user.tickers if current_user.tickers else ["AAPL", "MSFT", "KO"] # type: ignore
    
    return {
        "status": "success",
        "tickers": user_tickers
    }
    