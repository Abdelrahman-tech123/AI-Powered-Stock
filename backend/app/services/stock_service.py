import yfinance as yf
from typing import List, Dict, Any
from app.config import debug_print

# Translation Libraries
from deep_translator import GoogleTranslator
import os
import json
import time

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

            days_translation = {
            "Sunday": "الأحد",
            "Monday": "الإثنين",
            "Tuesday": "الثلاثاء",
            "Wednesday": "الأربعاء",
            "Thursday": "الخميس",
            "Friday": "الجمعة",
            "Saturday": "السبت"
            }

            for ticker in clean_tickers_list:
                try:
                    stock_instance = multiple_tickers.tickers[ticker]
                    info = stock_instance.info

                    if not info or ('regularMarketPrice' not in info and 'currentPrice' not in info):
                        results[ticker] = {"error": "لم يتم العثور على بيانات"}
                        continue
                    
                    hist = stock_instance.history(period="7d")
                    historical_data = []
                
                    if not hist.empty:
                        for date, row in hist.iterrows():
                            day_name_en = date.strftime('%A') # type: ignore
                            day_name_ar = days_translation.get(day_name_en, day_name_en)

                            historical_data.append({
                                "day": day_name_ar,
                                "price": round(float(row['Close']), 2)
                            })

                    results[ticker] = {
                        "company_name": info.get("longName"),
                        "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
                        "market_cap": info.get("marketCap"),
                        "pe_ratio": info.get("trailingPE"),
                        "dividend_yield": info.get("dividendYield"),
                        "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
                        "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
                        "industry": info.get("industry"),
                        "summary": info.get("longBusinessSummary"),
                        "historical_chart": historical_data
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

            if not isinstance(info, dict) or not info:
                return {"error": f"الرمز '{clean_ticker}' غير موجود في أسواق المال أو لا تتوفر له بيانات حالياً"}

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
                            
                            click_through = content.get("clickThroughUrl")
                            if isinstance(click_through, dict):
                                news_link = click_through.get("url")
                            else:
                                news_link = None
                                
                            final_link = news_link or content.get("link")

                            news_list.append({
                                "title": content.get("title"),
                                "publisher": publisher_name,
                                "link": final_link,
                                "publish_time": content.get("pubDate") or content.get("providerPublishTime")
                            })

            english_summary = info.get("longBusinessSummary")
            arabic_summary = ""

            if english_summary:
                try:
                    arabic_summary = GoogleTranslator(source='en', target='ar').translate(english_summary)
                except Exception as translation_error:
                    arabic_summary = english_summary
                    debug_print(f"Translation failed: {translation_error}")

            current_price = info.get("currentPrice") or info.get("regularMarketPrice") or 0
            previous_close = info.get("previousClose") or current_price
            
            price_change = round(current_price - previous_close, 2)
            price_change_percent = round((price_change / previous_close) * 100, 2) if previous_close else 0

            low_52 = info.get("fiftyTwoWeekLow") or 1
            high_52 = info.get("fiftyTwoWeekHigh") or 1
            current_position_percent = round(((current_price - low_52) / (high_52 - low_52)) * 100, 2) if (high_52 - low_52) else 0

            target_mean = info.get("targetMeanPrice")
            upside_potential_percent = 0
            if target_mean and current_price:
                upside_potential_percent = round(((target_mean - current_price) / current_price) * 100, 2)

            detailed_results = {
                    "ticker": clean_ticker,
                    "company_name": info.get("longName"),
                    "summary": arabic_summary,
                    "sector": info.get("sector"),
                    "industry": info.get("industry"),
                    "website": info.get("website"),
                    "full_time_employees": info.get("fullTimeEmployees"),
                    "country": info.get("country"),
                    "currency": info.get("currency"),
                    "exchange": info.get("exchange"),
                    "current_price": current_price,
                    "previous_close": previous_close,
                    "price_change": price_change,
                    "price_change_percent": price_change_percent,
                    "open": info.get("open"),
                    "day_low": info.get("dayLow"),
                    "day_high": info.get("dayHigh"),
                    "volume": info.get("volume"),
                    "average_volume": info.get("averageVolume"),
                    "market_cap": info.get("marketCap"),
                    "trailing_pe": info.get("trailingPE"),     
                    "forward_pe": info.get("forwardPE"),       
                    "price_to_book": info.get("priceToBook"),   
                    "beta": info.get("beta"),                   
                    "dividend_yield": info.get("dividendYield"), 
                    "dividend_rate": info.get("dividendRate"),   
                    "fifty_two_week_high": high_52,
                    "fifty_two_week_low": low_52,
                    "year_range_position_percent": current_position_percent,
                    "profit_margins": info.get("profitMargins"),
                    "revenue_growth": info.get("revenueGrowth"),
                    "earnings_growth": info.get("earningsGrowth"),
                    "return_on_equity": info.get("returnOnEquity"),
                    "debt_to_equity": info.get("debtToEquity"),
                    "total_cash": info.get("totalCash"),
                    "free_cashflow": info.get("freeCashflow"),
                    "target_mean_price": target_mean,   
                    "upside_potential_percent": upside_potential_percent,
                    "recommendation_key": info.get("recommendationKey"), 
                    "chart_history": chart_history,
                    "news": news_list
            }

            return detailed_results
    
        except Exception as e:
            import traceback
            debug_print(f"Error fetching stock {ticker}: {str(e)}")
            debug_print(traceback.format_exc())
            return {"error": "حدث خطأ غير متوقع أثناء معالجة تفاصيل السهم"}
        

    ###

class AddonServices:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    CACHE_DIR = os.path.join(BASE_DIR, "cache_files")
    
    if not os.path.exists(CACHE_DIR):
        os.makedirs(CACHE_DIR)

    CACHE_EXPIRE_TIME = 7200 # two hours

    @staticmethod
    def translate_news_in_background(ticker : str , news_list: List[dict] ):
        if not news_list:
            return
        
        try:
            titles = [news_item["title"] for news_item in news_list]
            translated_titles = GoogleTranslator(source='en', target='ar').translate_batch(titles)

            for i, news_item in enumerate(news_list):
                news_item["title"] = translated_titles[i]


            cache_data = {
                "timestamp": time.time(),
                "news": news_list
            }

            file_path = os.path.join(AddonServices.CACHE_DIR , f"{ticker}.json")
            with open(file_path , "w" , encoding="utf-8") as f:
                json.dump(cache_data , f , ensure_ascii=False , indent=4)

            debug_print(f"⚡ تم تحديث وترجمة ملف {ticker}.json بنجاح!")
        except Exception as e:
            debug_print(f"Error in background translation: {e}")


    @staticmethod
    def get_cached_news_from_json(ticker : str):
        file_path = os.path.join(AddonServices.CACHE_DIR , f"{ticker}.json")

        if not os.path.exists(file_path):
            return None
        
        try:
            with open(file_path , "r" , encoding="utf-8") as f:
                cache_data = json.load(f)

                if (time.time() - cache_data['timestamp'] > AddonServices.CACHE_EXPIRE_TIME):
                    return None
                
                return cache_data["news"]
            
        except:
            return None
        

    ###
