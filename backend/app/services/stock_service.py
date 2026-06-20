import yfinance as yf
from typing import List, Dict, Any

class StockService:
    @staticmethod

    def get_stock_data_search(tickers : List[str]) -> Dict[str , Any]:
        try:
            results = {}

            if not tickers:
                return results
            
            clean_tickers_list = [t.upper().strip() for t in tickers if t]
            tickers_string = " ".join(clean_tickers_list)

            if not tickers_string:
                return results
            
            multiple_tickers = yf.Tickers(tickers_string)

            for ticker in clean_tickers_list:
                try:
                    stock_instance = multiple_tickers.tickers[ticker]
                    info = stock_instance.info

                    if not info or ('regularMarketPrice' not in info and 'currentPrice' not in info):
                        results[ticker] = {"error": "لم يتم العثور على بيانات"}
                        continue
                    
                    results[ticker] = {
                        "company_name": info.get("longName"),
                        "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
                        "market_cap": info.get("marketCap"),
                        "pe_ratio": info.get("trailingPE"),
                        "dividend_yield": info.get("dividendYield"),
                        "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
                        "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
                        "industry": info.get("industry"),
                        "summary": info.get("longBusinessSummary")
                    }

                except Exception:
                    results[ticker] = {"error": "فشل أثناء معالجة بيانات هذا السهم"}

            return results
            
        except Exception as e:
            return {"error": f"حدث خطأ غير متوقع أثناء جلب البيانات: {str(e)}"}

            