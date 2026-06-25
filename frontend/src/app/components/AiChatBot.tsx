"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api"; // adjust to your axios instance path

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface AiChatBotProps {
    /** Live stock data from the parent page. Excluded fields: chart_history. */
    currentStockData?: Record<string, any>;
}

export default function AiChatBot({ currentStockData }: AiChatBotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [requestsLeft, setRequestsLeft] = useState<number>(10);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const params = useParams();

    // Support both /stock/[ticker] and /stock/[id] route shapes
    const ticker = ((params?.ticker ?? params?.id) as string | undefined) ?? "";
    const isStockPage = ticker.length > 0;

    // Fetch the real daily limit from the backend whenever the panel opens
    useEffect(() => {
        if (!isOpen) return;

        const fetchChatLimit = async () => {
            try {
                const response = await api.get("/api/services/ai/chat/limit");
                if (response.data) {
                    setRequestsLeft(response.data.requests_left);
                }
            } catch (error) {
                console.error("🚨 فشل في جلب حد الاستهلاك اليومي:", error);
            }
        };

        fetchChatLimit();
    }, [isOpen]);

    // Auto-scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || requestsLeft <= 0) return;

        const userMessage = input.trim();
        setInput("");

        // Snapshot history *before* appending the new user message
        const historySnapshot: Message[] = [...messages];

        // Optimistic update — show the user's message immediately
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await api.post("/api/services/ai/chat/send", {
                message: userMessage,
                // Send null when not on a stock page so the backend uses the general prompt
                ticker: isStockPage ? ticker.toUpperCase() : null,
                // Full conversation history excluding the message we just sent
                history: historySnapshot,
                // Live stock metrics from the parent page (undefined → null on the wire)
                stock_data: isStockPage ? (currentStockData ?? null) : null,
            });

            if (response.data) {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: response.data.reply },
                ]);
                setRequestsLeft(response.data.requests_left);
            }
        } catch (error: any) {
            console.error("🚨 خطأ أثناء إرسال الرسالة للبوت:", error);
            const errorMessage =
                error?.response?.data?.detail ||
                "عذراً، حدث خطأ أثناء الاتصال بالمساعد الذكي.";
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: errorMessage },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating trigger button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-6 md:left-auto md:right-8 bg-slate-950 text-white p-4 rounded-full shadow-xl hover:bg-slate-900 hover:scale-105 active:scale-95 transition-all z-50 flex items-center justify-center border border-slate-800"
                title="المساعد المالي الذكي"
                aria-label="فتح المساعد المالي الذكي"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6 text-white"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.813 15.904 9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.096.813ZM18.25 5.25 17.5 9l-.75-3.75L13 4.5l3.75-.75.75-3.75.75 3.75L22 4.5l-3.75.75ZM11.25 2.25l-.5 2.5-2.5.5 2.5.5.5 2.5.5-2.5 2.5-.5-2.5-.5-.5-2.5Z"
                    />
                </svg>
            </button>

            {/* Chat panel */}
            {isOpen && (
                <div
                    className="fixed bottom-0 right-0 z-50 w-full h-full
                        md:w-[32vw] md:min-w-[550px] md:max-w-[650px] md:h-[82vh] md:bottom-6 md:right-8
                        bg-white dark:bg-slate-900 shadow-2xl flex flex-col md:rounded-2xl
                        border border-slate-200 dark:border-slate-800
                        transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 font-sans"
                    dir="rtl"
                >
                    {/* Header */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center md:rounded-t-2xl">
                        <div className="flex items-center gap-2.5 text-slate-900 dark:text-slate-100">
                            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <h3 className="font-bold text-sm md:text-base">
                                {isStockPage
                                    ? `محلل الأسهم الذكي (${ticker.toUpperCase()})`
                                    : "المساعد المالي الذكي"}
                            </h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 text-base font-bold"
                            aria-label="إغلاق"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages area */}
                    <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-white dark:bg-slate-900 text-sm flex flex-col">
                        {/* Welcome message */}
                        {messages.length === 0 && (
                            <div className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 max-w-[90%] leading-relaxed shadow-sm self-start">
                                {isStockPage
                                    ? `مرحباً بك! لقد قمت بقراءة مؤشرات سهم ${ticker.toUpperCase()} الحالية من لوحة التحكم. كيف يمكنني مساعدتك في تحليله ماليًا أو استخراج التوصيات اليوم؟`
                                    : "مرحباً بك! أنا مساعدك المالي. يمكنك سؤالي عن أداء الأسهم، مقارنة المؤشرات، أو طلب تحليلات عامة عن حركة الأسواق."}
                            </div>
                        )}

                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                dir={msg.role === "user" ? "ltr" : "rtl"}
                                className={`p-4 rounded-2xl max-w-[88%] leading-relaxed shadow-sm border text-xs md:text-sm whitespace-pre-line ${msg.role === "user"
                                    ? "bg-slate-950 text-white border-slate-900 self-end text-left rounded-tl-none"
                                    : "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-100 dark:border-slate-800/50 self-start text-right rounded-tr-none"
                                    }`}
                            >
                                {msg.content}
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {isLoading && (
                            <div className="bg-slate-50 dark:bg-slate-800 text-slate-400 p-4 rounded-2xl border border-slate-100 max-w-[60px] self-start flex gap-1.5 justify-center items-center">
                                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" />
                                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer / input */}
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 md:rounded-b-2xl">
                        <div className="flex justify-between items-center mb-2.5 px-1 text-xs text-slate-400 font-medium">
                            <span>الرصيد اليومي </span>
                            <span
                                className={
                                    requestsLeft === 0
                                        ? "text-red-500 font-bold"
                                        : "text-slate-600 dark:text-slate-300 font-bold"
                                }
                            >
                                {requestsLeft} / 10 رسائل متبقية
                            </span>
                        </div>

                        <form onSubmit={handleSendMessage} className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={
                                    requestsLeft > 0
                                        ? "اكتب استفسارك المالي هنا..."
                                        : "لقد نفذ رصيدك المتاح لهذا اليوم."
                                }
                                disabled={isLoading || requestsLeft <= 0}
                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-500 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim() || requestsLeft <= 0}
                                className="absolute left-2 bg-slate-950 text-white p-2 rounded-lg hover:bg-slate-900 transition-colors shadow-sm disabled:opacity-30"
                                aria-label="إرسال"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className="w-4 h-4"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                                    />
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}