from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.stock_service import StockService
from pydantic import BaseModel
from typing import List, Dict, Any
from app.database import get_db
from app import auth
from app.config import debug_print

router = APIRouter()

class StockSearchRequest(BaseModel):
    tickers: List[str]

@router.post("/search", response_model=Dict[str,Any])
async def get_dashboard_stocks(
    request_data : StockSearchRequest,
    current_user = Depends(auth.get_current_user)
):
    if not request_data.tickers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="قائمة الرموز (tickers) لا يمكن أن تكون فارغة."
        )
    
    results = StockService.get_stock_data_search(request_data.tickers)

    if "error" in results and len(results) == 1:
        debug_print(results["error"])
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="حدث خطأ ما يرجى اعادة المحاولة")
    return results
    
