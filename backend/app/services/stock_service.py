import yfinance as yf
from typing import List, Dict, Any
from app.config import debug_print

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
            debug_print(str(e))
            return {"error": "حدث خطأ غير متوقع أثناء جلب البيانات"}


    @staticmethod

    def get_single_stock_data(ticker : str) -> Dict[str,Any]:
        try:
            clean_ticker = ticker.upper().strip()
            if not clean_ticker:
                return{"error" : "رمز السهم غير صالح او فارغ"}
            
            stock = yf.Ticker(clean_ticker)
            info = stock.info

            if not info or ('regularMarketPrice' not in info and 'currentPrice' not in info):
                return {"error": f"الرمز '{clean_ticker}' غير موجود في أسواق المال أو لا تتوفر له بيانات حالياً"}
            
            historical_data = stock.history(period="4mo")
            chart_history = []

            if historical_data is not None and not historical_data.empty:
                historical_data = historical_data.reset_index()
                
                date_column = "Date" if "Date" in historical_data.columns else ("Datetime" if "Datetime" in historical_data.columns else None)
                
                if date_column:
                    historical_data[date_column] = historical_data[date_column].astype(str)

                    for _, row in historical_data.iterrows():
                        chart_history.append({
                            "date": str(row[date_column]), 
                            "open": round(float(row.get("Open", 0)), 2),
                            "high": round(float(row.get("High", 0)), 2),
                            "low": round(float(row.get("Low", 0)), 2),
                            "close": round(float(row.get("Close", 0)), 2),
                            "volume": int(row.get("Volume", 0))
                        })


            raw_news = stock.news
            news_list = []
            
            if isinstance(raw_news, list):
                for item in raw_news[:5]:
                    if isinstance(item, dict):
                        content = item.get("content") if "content" in item else item
                        if isinstance(content, dict):
                            publisher_data = content.get("publisher")
                            publisher_name = (
                                publisher_data.get("displayName") 
                                if isinstance(publisher_data, dict) 
                                else publisher_data
                            )
                            
                            news_list.append({
                                "title": content.get("title"),
                                "publisher": publisher_name,
                                "link": content.get("clickThroughUrl", {}).get("url") or content.get("link"),
                                "publish_time": content.get("pubDate") or content.get("providerPublishTime")
                            })

            detailed_results = {
                    "ticker": clean_ticker,

                    # معلومات الشركة والملف الشخصي (Profile)
                    "company_name": info.get("longName"),
                    "summary": info.get("longBusinessSummary"),
                    "sector": info.get("sector"),
                    "industry": info.get("industry"),
                    "website": info.get("website"),
                    "full_time_employees": info.get("fullTimeEmployees"),
                    "country": info.get("country"),
                    "currency": info.get("currency"),
                    "exchange": info.get("exchange"),

                    # بيانات التداول الفورية والحالية (Market Data)
                    "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
                    "previous_close": info.get("previousClose"),
                    "open": info.get("open"),
                    "day_low": info.get("dayLow"),
                    "day_high": info.get("dayHigh"),
                    "volume": info.get("volume"),
                    "average_volume": info.get("averageVolume"),

                    # مؤشرات تقييم السهم المتقدمة (Valuation & Ratios)
                    "market_cap": info.get("marketCap"),
                    "trailing_pe": info.get("trailingPE"),     # مكرر الربحية الحالي
                    "forward_pe": info.get("forwardPE"),       # مكرر الربحية المستقبلي
                    "price_to_book": info.get("priceToBook"),   # مضاعف القيمة الدفترية
                    "beta": info.get("beta"),                   # معامل المخاطرة مقارنة بالسوق
                    "dividend_yield": info.get("dividendYield"), # عائد التوزيعات
                    "dividend_rate": info.get("dividendRate"),   # قيمة التوزيع الكاش
                    "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
                    "fifty_two_week_low": info.get("fiftyTwoWeekLow"),

                    # توقعات وتقييمات المحللين (Analyst Estimates)
                    "target_mean_price": info.get("targetMeanPrice"),   # متوسط السعر المستهدف من المحللين
                    "recommendation_key": info.get("recommendationKey"), # التوصية الحالية (buy, hold, sell)

                    "chart_history": chart_history,
                    "news": news_list
            }

            return detailed_results
    
        except Exception as e:
            debug_print(str(e))
            return {"error": "حدث خطأ غير متوقع أثناء معالجة تفاصيل السهم"}
        

    ###
