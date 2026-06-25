from app.ai_client import ai_manager
from app.config import debug_print
import re
from typing import Optional , List

from groq.types.chat import ChatCompletionMessageParam
from datetime import date
from sqlalchemy.orm import Session

class AI_analyze :

    @staticmethod
    def _extract_buy_score(text: str) -> int | None:
        normalized = text.translate(str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789'))
        match = re.search(r'نسبة أمان الشراء[^%٪]*?(\d+)[%٪]', normalized)
        return int(match.group(1)) if match else None

    ###

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
                "buy_score": AI_analyze._extract_buy_score(report)
            }

        except Exception as e:
            debug_print(f"❌ Groq AI Generation Error: {type(e).__name__}: {str(e)}")
            import traceback
            debug_print(traceback.format_exc())
            return placeholder_res
        


class AI_chatBot :

    @staticmethod
    def generate_chat_reply(
        user_message: str,
        ticker: Optional[str] = None,
        history_messages: list = [],
        stock_data: Optional[dict] = None
    ) -> str:

        assert ai_manager.client is not None, "AI Client has not been initialized via lifespan!"

        if ticker and ticker.strip():
            data_summary = ""
            if stock_data:
                data_summary = "\n".join([f"- {key}: {value}" for key, value in stock_data.items()])

            system_prompt = (
                f"أنت محلل مالي أول (Lead Portfolio Analyst) في منصة 'دليلك بورصة'، متخصص في تحليل أسهم الأسواق العالمية.\n"
                f"المستخدم يتصفح الآن صفحة سهم {ticker.upper()} ويريد فهماً عميقاً ومخصصاً.\n\n"
        
                f"📊 البيانات الحية للسهم المسحوبة من المنصة الآن:\n"
                f"{data_summary}\n\n"
        
                f"كيف تفكر وتجيب:\n"
                f"- أنت لا تحفظ إجابات جاهزة. أنت تقرأ الأرقام أمامك وتستنتج منها.\n"
                f"- عندما يسألك المستخدم عن رأيك في السهم، افتح تحليلاً حقيقياً: كيف يبدو التقييم الحالي؟ هل السعر مبرر بالنسبة للنمو؟ ما الذي تقوله الأرقام فعلاً؟\n"
                f"- إذا طُلبت نسبة اقتراح شراء، احسبها من المؤشرات المتاحة واذكر سبب الوصول لها بجملة أو جملتين.\n"
                f"- إذا سأل عن أسهم مشابهة، اقترح 2-3 منافسين حقيقيين في نفس القطاع مع سبب المقارنة.\n"
                f"- اربط الأرقام بالسياق دائماً: P/E مرتفع لا يعني بالضرورة سهماً غالياً إذا كان النمو مرتفعاً.\n"
                f"- تحدث كمستشار يجلس مع عميله، وليس كنظام يطبع تقريراً.\n"
                f"- كن مختصراً وحازماً. لا حشو، لا تكرار، لا عبارات تمهيدية فارغة.\n"
                f"- اللغة العربية الفصحى المالية فقط. لا ترجمة حرفية للمصطلحات الإنجليزية دون شرح.\n\n"
        
                f"تذكر: المستخدم رأى الأرقام بنفسه في الصفحة. هو يريد تفسيرك وحكمك، لا إعادة سرد البيانات."
            )

        else:
            system_prompt = (
                f"أنت كبير المستشارين الماليين في منصة 'دليلك بورصة' — منصة تحليل الأسواق العالمية.\n"
                f"المستخدم يتصفح لوحة التحكم الرئيسية ويريد مساعدة استثمارية عامة.\n\n"
        
                f"كيف تفكر وتجيب:\n"
                f"- أنت لا تتهرب من الأسئلة الاستثمارية. إذا طُلب منك ترشيح أسهم أو قطاعات، قدّم رأياً حقيقياً مع مبرره.\n"
                f"- فكّر في السياق: ما القطاعات القوية حالياً؟ ما الأسهم التي تُظهر زخماً؟ ما المؤشرات التي تستحق الانتباه؟\n"
                f"- إذا سألك عن مفهوم مالي، اشرحه بمثال واقعي لا بتعريف قاموسي.\n"
                f"- إذا سألك عن مقارنة بين قطاعين أو سهمين، قدّم رأياً واضحاً لا إجابة 'يعتمد على...' مبهمة.\n"
                f"- تحدث كمستشار يعرف السوق ويحترم وقت العميل. مختصر، حازم، ومفيد.\n"
                f"- اللغة العربية الفصحى المالية فقط.\n\n"
        
                f"تذكر: المستخدم يريد قيمة حقيقية من كل رسالة، لا ردوداً دبلوماسية فارغة."
            )

        formatted_messages: List[ChatCompletionMessageParam] = [
            {"role": "system", "content": system_prompt}
        ]

        for msg in history_messages:
            if hasattr(msg, "model_dump"):
                msg_dict = msg.model_dump()
            elif hasattr(msg, "dict"):
                msg_dict = msg.dict()
            else:
                msg_dict = msg

            formatted_messages.append({
                "role": msg_dict.get("role", "user"),
                "content": msg_dict.get("content", "")
            })

        formatted_messages.append({"role": "user", "content": user_message})

        try:
            chat_completion = ai_manager.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=formatted_messages,
                temperature=0.4,
                max_tokens=500
            )

            reply = chat_completion.choices[0].message.content
            return reply if reply is not None else ""

        except Exception as e:
            debug_print(f"Groq API Error: {str(e)}")    
            raise Exception("Groq API Error")

    @staticmethod
    def verify_and_lazy_reset_limit(user, db: Session):
        today = date.today()
        if user.last_chat_date != today:
            user.ai_requests_left = 10
            user.last_chat_date = today
            db.commit()
            db.refresh(user)

###
