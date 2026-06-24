from app.ai_client import ai_manager
from app.config import debug_print
import re

class AI_services :

    @staticmethod
    def _extract_buy_score(text: str) -> int | None:
        normalized = text.translate(str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789'))
        match = re.search(r'نسبة أمان الشراء[^%٪]*?(\d+)[%٪]', normalized)
        return int(match.group(1)) if match else None

    @staticmethod
    def generate_stock_ai_report(stock_data: dict) -> dict:
        assert ai_manager.client is not None, "AI Client has not been initialized via lifespan!"

                
        placeholder_res = {
            "report": (
                "حدثت مشكلة في برنامج الذكاء الاصطناعي\n"
                "صندوق التقرير الذكي: يتداول السهم حالياً ضمن نطاقاته الفنية الطبيعية.\n"
                "نسبة أمان الشراء اليوم: يُنصح بمتابعة الشموع اليابانية وحركة السيولة نظراً لعدم استجابة خادم التحليل اللحظي.\n"
                "نصيحة: راقب مستويات الدعم والمقاومة الأساسية قبل اتخاذ القرار الاستثماري."
            ),
            "buy_score": None
        }

        try:
            extracted_news = stock_data.get("news" , [])
            news_bullets = ""

            if extracted_news:
                for i , item in enumerate(extracted_news):
                    title = item.get("title" , "Unkown") 
                    publisher = item.get("publisher" , "Unkown")
                    if title:
                        news_bullets += f"{i}. {title} (المصدر: {publisher})\n             "
            else:
                news_bullets = "لا توجد أخبار عاجلة متاحة حالياً للسهم.\n"

            #__________________________#

            prompt = f"""
                    أنت محلل مالي ومستشار استثماري متمكن. قم بتحليل سهم {stock_data['ticker']} ({stock_data['company_name']}) بناءً على البيانات الفنية والأخبار الحالية:

                    [البيانات الفنية المالية]:
                    - السعر الحالي: {stock_data['current_price']} {stock_data['currency']}
                    - التغير السعري اليومي: {stock_data['price_change_percent']}%
                    - مكرر الربحية (P/E Ratio): {stock_data['trailing_pe']}
                    - أعلى وأدنى سعر في 52 أسبوع: {stock_data['fifty_two_week_high']} / {stock_data['fifty_two_week_low']}

                    [أحدث الأخبار المستجدة عن الشركة]:
                    {news_bullets}

                    المطلوب منك بدقة بالغة:
                    توليد "صندوق التقرير الذكي" باللغة العربية الفصحى، يتكون من 3 أسطر نصية منفصلة فقط (كل سطر ينتهي بنقطة وسطر جديد):
                    السطر 1: تلخيص مالي وفني سريع يعكس حالة السهم ونظرة السوق الجارية بناءً على الأخبار المطروحة والأرقام الفنية.
                    السطر 2: تحديد "نسبة أمان الشراء اليوم" كرقم مئوي واضح (مثال: نسبة أمان الشراء اليوم هي 65%) مع ذكر السبب الفني أو التأثير الإخباري المباشر باختصار شديد.
                    السطر 3: نصيحة استثمارية واضحة وموجهة للمستثمر (هل السهم مناسب للمضاربة اللحظية أم الاستثمار طويل الأجل).

                    شروط صارمة لمنع انهيار الواجهة:
                    - لا تضع أي عناوين فرعية (مثل لا تكتب "السطر الأول:").
                    - لا تستخدم الرموز التعبيرية المعقدة أو التنسيقات مثل النجوم (**) أو علامات الهاشتاج (#).
                    - التزم بـ 3 أسطر فقط لا تزد ولا تنقص عنها.
                """
            
            chat_completion = ai_manager.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "أنت محلل مالي محترف تتحدث العربية الفصحى بإيجاز شديد وتلتزم بعدد الأسطر المطلوبة دون أي تنسيقات markdown."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.2,
                max_tokens=350
            )

            content = chat_completion.choices[0].message.content
            report = content.strip() if content else placeholder_res["report"]

            # debug_print(f"🔍 ai_manager.client: {ai_manager.client}")
            # debug_print(f"🔍 stock_data keys: {list(stock_data.keys())}")
            # debug_print(f"✅ AI Response: {content}")

            return {
                "report": report.split("\n"),
                "buy_score": AI_services._extract_buy_score(report)
            }

        except Exception as e:
            debug_print(f"❌ Groq AI Generation Error: {type(e).__name__}: {str(e)}")
            import traceback
            debug_print(traceback.format_exc())
            return placeholder_res
                

