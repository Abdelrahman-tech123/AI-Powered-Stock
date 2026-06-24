"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function AiChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const params = useParams();

    // قراءة الـ ticker ديناميكياً من الـ URL
    const ticker = (params?.ticker || params?.id || "") as string;
    const isStockPage = ticker.length > 0;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-6 md:left-auto md:right-8 bg-slate-950 hover:bg-slate-900 p-3 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-50 flex items-center justify-center border border-slate-800"
                title="المساعد الذكي"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.096.813ZM18.25 5.25 17.5 9l-.75-3.75L13 4.5l3.75-.75.75-3.75.75 3.75L22 4.5l-3.75.75ZM11.25 2.25l-.5 2.5-2.5.5 2.5.5.5 2.5.5-2.5 2.5-.5-2.5-.5-.5-2.5Z" />
                </svg>
            </button>

            {/* نافذة الشات الذكية المتجاوبة */}
            {isOpen && (
                <div className="fixed bottom-0 right-0 z-50 
                    w-full h-full                 {/* ملء الشاشة على الموبايل */}
                    md:w-[380px] md:h-[550px] md:bottom-24 md:right-8 {/* صندوق محدد للشاشات الكبيرة */}
                    bg-white dark:bg-slate-900 shadow-2xl flex flex-col md:rounded-2xl border border-slate-200 dark:border-slate-800 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 font-sans"
                >
                    {/* الرأس - Header (بنفس الهوية البصرية البيضاء النقية للداشبورد) */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center md:rounded-t-2xl">
                        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                            <span className="flex h-2 w-2 rounded-full bg-slate-900 dark:bg-emerald-500 animate-pulse" />
                            <h3 className="font-bold text-xs md:text-sm">
                                {isStockPage ? `مساعد أسواق الأسهم (${ticker.toUpperCase()})` : "مساعد أسواق الأسهم الذكي"}
                            </h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 text-sm font-bold"
                        >
                            ✕
                        </button>
                    </div>

                    {/* منطقة الرسائل - Messages Area */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white dark:bg-slate-900 text-xs md:text-sm">
                        <div className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/50 max-w-[85%] leading-relaxed shadow-sm">
                            {isStockPage
                                ? `مرحباً بك! أنا مساعدك المالي الذكي. كيف يمكنني مساعدتك في تحليل سهم ${ticker.toUpperCase()} أو قراءة مؤشراته الفنية الحالية اليوم؟`
                                : "مرحباً بك في لوحة التحكم! أنا مساعدك المالي الذكي، يمكنك سؤالي عن أي سهم، أو طلب مقارنات وتحليلات مخصصة للأسواق."}
                        </div>
                    </div>

                    {/* مدخل البيانات - Input (مطابق تماماً لـ Input البحث الموجود بالصورة) */}
                    <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 md:rounded-b-2xl">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                placeholder="اكتب استفسارك هنا..."
                                className="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-500 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all"
                            />
                            {/* زر إرسال أسود صغير متناسق مع الواجهة */}
                            <button className="absolute left-2 bg-slate-950 text-white p-1.5 rounded-lg hover:bg-slate-900 transition-colors shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}