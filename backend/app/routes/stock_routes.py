from fastapi import APIRouter, Depends, HTTPException, status
from app.services.stock_service import StockService , AddonServices
from pydantic import BaseModel
from typing import List, Dict, Any
from app.auth import get_current_user
from app.config import debug_print

router = APIRouter()

class StockSearchRequest(BaseModel):
    tickers: List[str]

@router.post("/search", response_model=Dict[str,Any])
async def get_dashboard_stocks(
    request_data : StockSearchRequest,
    current_user = Depends(get_current_user)
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


@router.get("/info/{ticker}", response_model=Dict[str, Any])
async def get_ticker_info(
    ticker: str,
    current_user = Depends(get_current_user)
):
        if not ticker:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="يرجى ادخال كلمة سهم صحيحة"
            )
        
        result = StockService.get_single_stock_data(ticker)

        if "error" in result:
            if "غير موجود" in result["error"] or "غير صالح" in result["error"]:
                raise HTTPException(
                     status_code=status.HTTP_404_NOT_FOUND,
                     detail=result["error"]
                )
            
            raise HTTPException(
                 status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                 detail="حدثت مشكلة ما , يرجى اعادة المحاولة"
            )
        
        cached_arabic_news = AddonServices.get_cached_news_from_json(ticker)

        if cached_arabic_news:
            result["news"] = cached_arabic_news
        else:
            raw_news = result.get("news", [])
            if raw_news:
                AddonServices.translate_news_in_background(ticker, raw_news)
                result["news"] = raw_news
        
        return result



###
        
        

    
