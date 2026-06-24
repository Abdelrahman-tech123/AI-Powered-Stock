"use client";

import React, { useEffect, useState, use } from "react";
import api from "@/lib/api"
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    TrendingUp,
    LogOut,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Globe,
    Users,
    FileText,
    ExternalLink,
    RefreshCw,
    ArrowRight,
    DollarSign,
    PieChart,
    Percent,
    ShieldAlert,
    Gauge
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, Tooltip, YAxis, XAxis } from "recharts";

interface ChartHistoryPoint {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface NewsItem {
    title: string;
    publisher: string | null;
    link: string;
    publish_time: string;
}

interface SingleStockData {
    ticker: string;
    company_name: string;
    summary: string;
    sector: string;
    industry: string;
    website: string;
    full_time_employees: number;
    country: string;
    currency: string;
    exchange: string;
    current_price: number;
    previous_close: number;
    price_change: number;
    price_change_percent: number;
    open: number;
    day_low: number;
    day_high: number;
    volume: number;
    average_volume: number;
    market_cap: number;
    trailing_pe: number;
    forward_pe: number;
    price_to_book: number;
    beta: number;
    dividend_yield: number;
    dividend_rate: number;
    fifty_two_week_high: number;
    fifty_two_week_low: number;
    year_range_position_percent: number;
    profit_margins: number;
    revenue_growth: number;
    earnings_growth: number;
    return_on_equity: number;
    debt_to_equity: number;
    total_cash: number;
    free_cashflow: number;
    target_mean_price: number;
    upside_potential_percent: number;
    recommendation_key: string;
    chart_history: ChartHistoryPoint[];
    news: NewsItem[];
}

interface PageProps {
    params: Promise<{ ticker: string }>;
}

export default function StockDetailPage({ params }: PageProps) {
    const resolvedParams = use(params);
    const ticker = resolvedParams.ticker.toUpperCase();

    const { data: session, status } = useSession();
    const router = useRouter();

    const [stock, setStock] = useState<SingleStockData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStockData = async () => {
        if (!session) return;

        try {
            setLoading(true);
            setError(null);

            const response = await api.get<SingleStockData>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/services/stock/info/${ticker}`);

            if (response.data) {
                setStock(response.data);
            } else {
                setError(`لم يتم العثور على بيانات خاصة بالرمز ${ticker}`);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || "حدث خطأ أثناء تحميل بيانات السهم الحية");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            fetchStockData();
        }
    }, [status, ticker]);

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center font-sans" dir="rtl">
                <RefreshCw className="animate-spin text-slate-800 mb-4" size={32} />
                <p className="text-sm font-semibold text-slate-600">جاري جلب تحديثات الأسهم الفورية والتحليلات المتقدمة...</p>
            </div>
        );
    }

    if (error || !stock) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center font-sans p-6" dir="rtl">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-center max-w-md w-full">
                    <p className="text-red-600 font-bold mb-4">{error || "لم يتم العثور على السهم المطلوب."}</p>
                    <button
                        onClick={() => router.back()}
                        className="text-xs font-bold px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition"
                    >
                        العودة للخلف
                    </button>
                </div>
            </div>
        );
    }

    const isPositive = stock.price_change_percent >= 0;

    const chartData = stock.chart_history?.map((pt) => ({
        day: new Date(pt.date).toLocaleDateString("ar-EG", { day: "numeric", month: "short" }),
        "السعر": pt.close,
    })) || [];

    const formatCurrency = (val: number | undefined) => {
        if (val === undefined || val === null) return "N/A";
        return new Intl.NumberFormat("en-US", { style: "currency", currency: stock.currency || "USD", maximumFractionDigits: 0 }).format(val);
    };

    const formatPercent = (val: number | undefined) => {
        if (val === undefined || val === null) return "N/A";
        return `${(val * 100).toFixed(2)}%`;
    };

    return (
        <div className="min-h-screen bg-[#fafafa] text-slate-900 flex flex-col font-sans relative overflow-hidden" dir="rtl">
            <div className="absolute top-[-30%] left-[-10%] w-[1200px] h-[900px] rounded-full bg-gradient-to-br from-slate-100 via-neutral-50/20 to-transparent blur-[130px] pointer-events-none z-0" />

            {/* Navbar */}
            <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push("/dashboard")} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition">
                        <ArrowRight size={18} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-slate-950 to-slate-800 flex items-center justify-center shadow-sm">
                            <TrendingUp size={18} className="text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm tracking-tight text-slate-900">دليلك بورصة</span>
                            <span className="text-[9px] text-slate-400 font-bold tracking-widest">PORTFOLIO & ANALYTICS</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500 hidden sm:inline">
                        مرحباً، <strong className="text-slate-900 font-semibold">{session?.user?.name || "المستخدم"}</strong>
                    </span>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="تسجيل الخروج"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </nav>

            {/* Layout (30% News Right / 70% Analytics Left) */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-10 gap-6 z-10">

                {/* الجزء الأيمن (30%) - الأخبار والتغطية الفورية في اليمين دائماً */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm h-fit">
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                <span className="w-1.5 h-3.5 bg-slate-900 rounded-full" />
                                التغطية الإخبارية والتقارير
                            </h2>
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                                مباشر
                            </span>
                        </div>

                        <div className="flex flex-col gap-3 max-h-[110vh] overflow-y-auto pr-1">
                            {stock.news && stock.news.length > 0 ? (
                                stock.news.map((item, index) => (
                                    <a
                                        key={index}
                                        href={item.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="group p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-sm transition flex flex-col gap-2"
                                    >
                                        <h4 className="text-xs font-bold leading-relaxed text-slate-800 group-hover:text-slate-900 break-words transition-colors">
                                            {item.title}
                                        </h4>
                                        <span className="text-[10px] font-medium text-slate-400 self-end mt-1">
                                            {new Date(item.publish_time).toLocaleDateString('ar-EG', {
                                                day: 'numeric',
                                                month: 'long',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </a>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 text-center py-4">لا توجد أخبار حديثة متاحة حالياً لهذا السهم.</p>
                            )}
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-white-900/20 to-indigo-900/20 border border-black-500/30 rounded-xl p-5 my-6">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">✨</span>
                            <h3 className="text-lg font-bold">صندوق التقرير الذكي (AI Summary)</h3>
                        </div>
                        {/* استخدام style الـ white-space: pre-line ليحافظ على تقسيم الأسطر الثلاثة كما جاءت من الباكيند */}
                        <p className=" text-sm leading-relaxed whitespace-pre-line">
                            {"لا يتوفر تحليل بالذكاء الاصطناعي الآن"}
                        </p>
                    </div>
                </div>

                {/* الجزء الأيسر (70%) - لوحة تحكم السهم والتحليلات المعمقة المحترفة */}
                <div className="lg:col-span-7 flex flex-col gap-6">

                    {/* بطاقة السعر والبيانات الفورية الحالية */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-xs font-bold px-2.5 py-1 bg-slate-900 text-white rounded-md tracking-wider">
                                    {stock.ticker}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                    {stock.exchange} · {stock.currency}
                                </span>
                            </div>
                            <h1 className="text-2xl font-black text-slate-900">{stock.company_name}</h1>
                            <p className="text-xs text-slate-500 mt-1">
                                {stock.sector} • {stock.industry}
                            </p>
                        </div>

                        <div className="flex flex-row sm:flex-col items-baseline sm:items-end justify-between sm:justify-center gap-2 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <div className="text-3xl font-black text-slate-900">
                                ${stock.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <div className={`flex items-center text-xs font-bold px-2.5 py-1 rounded-lg ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                }`}>
                                {isPositive ? <ArrowUpRight size={14} className="ml-1" /> : <ArrowDownRight size={14} className="ml-1" />}
                                <span>{isPositive ? '+' : ''}{stock.price_change} ({isPositive ? '+' : ''}{stock.price_change_percent}%)</span>
                            </div>
                        </div>
                    </div>

                    {/* الرسم البياني والتاريخ السعري */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Activity size={16} className="text-slate-500" />
                                <span>الرسم البياني للتطور السعري (4 أشهر الماضية)</span>
                            </h3>
                            <button onClick={fetchStockData} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition">
                                <RefreshCw size={14} />
                            </button>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={isPositive ? "#10b981" : "#f43f5e"} stopOpacity={0.2} />
                                            <stop offset="95%" stopColor={isPositive ? "#10b981" : "#f43f5e"} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                    <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "12px" }} />
                                    <Area type="monotone" dataKey="السعر" stroke={isPositive ? "#10b981" : "#f43f5e"} strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* بار تقدم النطاق السنوي وقيمة المحللين المستهدفة */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* النطاق السنوي 52 أسبوع بصرياً */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-500">موقع السعر الحالي من نطاق 52 أسبوعاً</span>
                                <span className="text-xs font-black text-slate-800">{stock.year_range_position_percent}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full relative my-2 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-slate-700 to-slate-900 h-full rounded-full transition-all"
                                    style={{ width: `${stock.year_range_position_percent}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                                <span>أدنى سعر: ${stock.fifty_two_week_low}</span>
                                <span>أعلى سعر: ${stock.fifty_two_week_high}</span>
                            </div>
                        </div>

                        {/* قيمة المحللين المستهدفة وفرص الصعود والنمو */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                    <Gauge size={14} /> مستهدف السعر العادل (المحللين)
                                </span>
                                <div className="text-xl font-black text-slate-900">
                                    {stock.target_mean_price ? `$${stock.target_mean_price}` : "N/A"}
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">التوصية العامة: <strong className="text-slate-800 uppercase font-semibold">{stock.recommendation_key || "N/A"}</strong></span>
                            </div>
                            {stock.upside_potential_percent !== 0 && (
                                <div className={`text-center p-3 rounded-xl ${stock.upside_potential_percent >= 0 ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
                                    <div className="text-xs font-black">{stock.upside_potential_percent >= 0 ? "+" : ""}{stock.upside_potential_percent}%</div>
                                    <div className="text-[9px] font-bold tracking-tight">العائد المتوقع</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* الصحة المالية وعوائد التشغيل والنمو (Financial Health) */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <PieChart size={16} className="text-slate-500" />
                            <span>مؤشرات الكفاءة والصحة المالية للشركة</span>
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-100 text-center">
                                <Percent size={16} className="mx-auto mb-1 text-slate-400" />
                                <div className="text-[10px] font-bold text-slate-500">هامش الربح</div>
                                <div className="text-sm font-black text-slate-800 mt-0.5">{formatPercent(stock.profit_margins)}</div>
                            </div>
                            <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-100 text-center">
                                <TrendingUp size={16} className="mx-auto mb-1 text-slate-400" />
                                <div className="text-[10px] font-bold text-slate-500">نمو الإيرادات</div>
                                <div className="text-sm font-black text-slate-800 mt-0.5">{formatPercent(stock.revenue_growth)}</div>
                            </div>
                            <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-100 text-center">
                                <DollarSign size={16} className="mx-auto mb-1 text-slate-400" />
                                <div className="text-[10px] font-bold text-slate-500">الكاش المتوفر</div>
                                <div className="text-sm font-black text-slate-800 mt-0.5">{formatCurrency(stock.total_cash)}</div>
                            </div>
                            <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-100 text-center">
                                <ShieldAlert size={16} className="mx-auto mb-1 text-slate-400" />
                                <div className="text-[10px] font-bold text-slate-500">نسبة الديون/الحقوق</div>
                                <div className="text-sm font-black text-slate-800 mt-0.5">{stock.debt_to_equity ? `${stock.debt_to_equity.toFixed(1)}%` : "N/A"}</div>
                            </div>
                        </div>
                    </div>

                    {/* جدول البيانات اليومية ومؤشرات التقييم التقليدية */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <span>جدول النطاق اليومي ومؤشرات التقييم التقليدية</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs">
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500">سعر الافتتاح اليومي</span>
                                <span className="font-semibold text-slate-800">${stock.open}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500">الإغلاق السابق</span>
                                <span className="font-semibold text-slate-800">${stock.previous_close}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500">أعلى سعر لليوم</span>
                                <span className="font-semibold text-slate-800">${stock.day_high}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500">أدنى سعر لليوم</span>
                                <span className="font-semibold text-slate-800">${stock.day_low}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500">مكرر الربحية (P/E Ratio)</span>
                                <span className="font-semibold text-slate-800">{stock.trailing_pe?.toFixed(2) || "N/A"}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500">مضاعف الدفترية (P/B)</span>
                                <span className="font-semibold text-slate-800">{stock.price_to_book?.toFixed(2) || "N/A"}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100 md:border-0">
                                <span className="text-slate-500">القيمة السوقية الكلية</span>
                                <span className="font-semibold text-slate-800">${stock.market_cap?.toLocaleString() || "N/A"}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100 md:border-0">
                                <span className="text-slate-500">العائد على التوزيعات</span>
                                <span className="font-semibold text-slate-800">{stock.dividend_yield ? `${stock.dividend_yield}%` : "0.00%"}</span>
                            </div>
                        </div>
                    </div>

                    {/* حول الشركة والملخص المترجم للعربية */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <FileText size={16} className="text-slate-500" />
                            <span>الملف الشخصي والنشاط التجاري للشركة</span>
                        </h3>
                        <p className="text-xs leading-relaxed text-slate-600 text-justify mb-4">
                            {stock.summary || "لا يتوفر ملخص عربي للشركة حالياً."}
                        </p>
                        <div className="flex flex-wrap gap-x-6 gap-y-3 pt-4 border-t border-slate-100 text-[11px] font-medium text-slate-500">
                            <div className="flex items-center gap-1.5">
                                <Users size={14} />
                                <span>الموظفون بدوام كامل: {stock.full_time_employees?.toLocaleString() || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Globe size={14} />
                                <span>المنطقة والبلد الأساسي: {stock.country || "N/A"}</span>
                            </div>
                            {stock.website && (
                                <div className="flex items-center gap-1.5">
                                    <Globe size={14} />
                                    <a href={stock.website} target="_blank" rel="noreferrer" className="hover:underline text-slate-900 flex items-center gap-0.5">
                                        الموقع الرسمي للشركة <ExternalLink size={10} />
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}