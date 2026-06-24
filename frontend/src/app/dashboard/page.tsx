"use client";

import React, { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import api from "@/lib/api";
import Link from "next/link";
import {
    TrendingUp,
    LogOut,
    Plus,
    X,
    DollarSign,
    BarChart3,
    PieChart,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    RefreshCw,
    ChevronLeft
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, Tooltip, YAxis, XAxis } from "recharts";

// ─── Cache Utility ────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

function getCached<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const entry: CacheEntry<T> = JSON.parse(raw);
        if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
            localStorage.removeItem(key);
            return null;
        }
        return entry.data;
    } catch {
        return null;
    }
}

function setCached<T>(key: string, data: T): void {
    try {
        const entry: CacheEntry<T> = { data, timestamp: Date.now() };
        localStorage.setItem(key, JSON.stringify(entry));
    } catch {
        // localStorage full or unavailable
    }
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChartPoint {
    day: string;
    price: number;
}

interface StockData {
    company_name?: string;
    current_price?: number;
    market_cap?: number;
    pe_ratio?: number;
    dividend_yield?: number;
    fifty_two_week_high?: number;
    fifty_two_week_low?: number;
    industry?: string;
    summary?: string;
    historical_chart?: ChartPoint[];
    error?: string;
}

interface DashboardStocks {
    [ticker: string]: StockData;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const { data: session, status } = useSession();
    const [stocks, setStocks] = useState<DashboardStocks>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isFromCache, setIsFromCache] = useState<boolean>(false);

    const cacheKey = `dashboard_stocks_${(session as any)?.user?.id || "guest"}`;

    const fetchStockDetailsFromYFinance = async (tickersList: string[], forceRefresh = false) => {
        if (tickersList.length === 0) { setStocks({}); return; }

        if (!forceRefresh) {
            const cached = getCached<DashboardStocks>(cacheKey);
            if (cached) {
                setStocks(cached);
                setIsFromCache(true);
                return;
            }
        }

        setIsFromCache(false);
        try {
            const response = await api.post<DashboardStocks>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/services/stock/search`,
                { tickers: tickersList }
            );
            setStocks(response.data);
            setCached(cacheKey, response.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || "حدث خطأ أثناء تحديث بيانات الأسهم");
        }
    };

    const handleForceRefresh = async () => {
        setLoading(true);
        setError(null);
        try {
            localStorage.removeItem(cacheKey);
            const res = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/api/services/tickers`);
            const tickers = res.data?.tickers?.length > 0 ? res.data.tickers : ["AAPL", "MSFT", "KO"];
            await fetchStockDetailsFromYFinance(tickers, true);
        } catch {
            await fetchStockDetailsFromYFinance(["AAPL", "MSFT", "KO"], true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadDashboard = async () => {
            if (status === "loading") return;
            setLoading(true);
            try {
                const res = await api.get(`${process.env.NEXT_PUBLIC_API_URL}/api/services/tickers`);
                const tickers = res.data?.tickers?.length > 0 ? res.data.tickers : ["AAPL", "MSFT", "KO"];
                await fetchStockDetailsFromYFinance(tickers);
            } catch {
                await fetchStockDetailsFromYFinance(["AAPL", "MSFT", "KO"]);
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, [status]);

    const syncTickersWithBackend = async (updatedTickers: string[]) => {
        try {
            await api.post(`${process.env.NEXT_PUBLIC_API_URL}/api/services/tickers`, { tickers: updatedTickers });
        } catch (err: any) {
            setError("تم التعديل على الشاشة ولكن فشل الحفظ في السيرفر");
        }
    };

    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanTicker = searchQuery.trim().toUpperCase();
        if (!cleanTicker) return;
        if (stocks[cleanTicker]) { setError("هذا السهم موجود بالفعل في لوحة التحكم"); return; }

        try {
            setLoading(true);
            setError(null);
            const response = await api.post<DashboardStocks>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/services/stock/search`,
                { tickers: [cleanTicker] }
            );
            if (response.data?.[cleanTicker] && !response.data[cleanTicker].error) {
                setStocks((prev) => {
                    const updated = { ...prev, [cleanTicker]: response.data[cleanTicker] };
                    setCached(cacheKey, updated);
                    syncTickersWithBackend(Object.keys(updated));
                    return updated;
                });
                setSearchQuery("");
            } else {
                setError("لم يتم العثور على سهم بهذا الرمز أو الرمز غير صحيح");
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || "فشل البحث عن السهم");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveTicker = async (tickerToRemove: string) => {
        setStocks((prev) => {
            const updated = { ...prev };
            delete updated[tickerToRemove];
            setCached(cacheKey, updated);
            syncTickersWithBackend(Object.keys(updated));
            return updated;
        });
    };

    const validStocksArray = Object.values(stocks).filter(s => s && !s.error && s.current_price);
    const totalMarketCap = validStocksArray.reduce((acc, curr) => acc + (curr.market_cap || 0), 0);
    const avgPeRatio = validStocksArray.length
        ? validStocksArray.reduce((acc, curr) => acc + (curr.pe_ratio || 0), 0) / validStocksArray.length
        : 0;

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-sans" dir="rtl">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-6 w-6 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-400 font-medium">جاري تهيئة الرسوم والتحليلات البيانية...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] text-slate-900 flex flex-col font-sans relative overflow-hidden" dir="rtl">
            {/* Background glow */}
            <div className="absolute top-[-30%] left-[-10%] w-[1200px] h-[900px] rounded-full bg-gradient-to-br from-slate-100 via-neutral-50/20 to-transparent blur-[130px] pointer-events-none z-0" />

            {/* ── Navbar ── */}
            <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-slate-950 to-slate-800 flex items-center justify-center shadow-sm">
                        <TrendingUp size={18} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-tight text-slate-900">دليلك بورصة</span>
                        <span className="text-[9px] text-slate-400 font-bold tracking-widest">REALTIME SYSTEM</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Cache status badge */}
                    {/* {isFromCache && (
                        <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />
                            بيانات مؤقتة · اضغط تحديث
                        </div>
                    )} */}
                    <span className="text-xs text-slate-500 hidden sm:inline">
                        مرحباً، <strong className="text-slate-900 font-semibold">{session?.user?.name || "المستخدم"}</strong>
                    </span>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100/70 px-3.5 py-2 rounded-xl hover:bg-rose-100/80 transition-all active:scale-[0.98]"
                    >
                        <LogOut size={13} />
                        <span>خروج</span>
                    </button>
                </div>
            </nav>

            {/* ── Main ── */}
            <main className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto space-y-8 relative z-10">

                {/* Stats row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[
                        {
                            label: "مجموع الشركات المتابعة",
                            value: Object.keys(stocks).length,
                            icon: <Activity size={18} />,
                            iconBg: "bg-slate-50 border-slate-100 text-slate-900",
                            bg: <BarChart3 size={90} />,
                        },
                        {
                            label: "حجم التداول الكلي للأصول",
                            value: `$${totalMarketCap.toLocaleString()}`,
                            icon: <DollarSign size={18} />,
                            iconBg: "bg-emerald-50 border-emerald-100 text-emerald-600",
                            bg: <DollarSign size={90} />,
                        },
                        {
                            label: "وسيط مضاعف القيمة P/E",
                            value: avgPeRatio ? avgPeRatio.toFixed(2) : "0.00",
                            icon: <PieChart size={18} />,
                            iconBg: "bg-indigo-50 border-indigo-100 text-indigo-600",
                            bg: <PieChart size={90} />,
                        },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex items-center justify-between relative overflow-hidden group">
                            <div className="absolute -right-4 -bottom-4 text-slate-50/50 group-hover:text-slate-100/80 transition-colors duration-300 pointer-events-none">
                                {stat.bg}
                            </div>
                            <div className="space-y-1 z-10">
                                <span className="text-[11px] text-slate-400 font-bold block">{stat.label}</span>
                                <strong className="text-2xl text-slate-900 font-black block truncate max-w-[200px]">{stat.value}</strong>
                            </div>
                            <div className={`h-11 w-11 rounded-xl border flex items-center justify-center shadow-inner z-10 ${stat.iconBg}`}>
                                {stat.icon}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search bar */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 items-center">
                        <div className="relative w-full flex-1 group">
                            <Search className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="ابحث وأضف رمز سهمك إلى اللوحة (مثال: AAPL, MSFT)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50/70 border border-slate-200/80 rounded-xl py-3 pr-11 pl-4 text-xs focus:outline-none focus:border-slate-950 focus:bg-white text-slate-900 placeholder-slate-400 font-medium tracking-wide uppercase transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto bg-slate-950 hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98] shrink-0"
                        >
                            <Plus size={15} />
                            <span>إدراج السهم</span>
                        </button>
                        <button
                            onClick={handleForceRefresh}
                            disabled={loading}
                            title="تحديث البيانات الآن"
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-40"
                        >
                            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                        </button>
                    </form>
                </div>

                {/* Section header */}
                <div className="border-b border-slate-200/60 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-black text-slate-950 tracking-tight sm:text-2xl">
                            المحفظة الاستثمارية والأصول الحية
                        </h2>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                            شاشة مراقبة تفاعلية لتحليل مؤشرات السوق، الأسعار الحالية ونطاقات الحركة السنوية.
                        </p>
                    </div>
                    {/* <div className="flex items-center gap-2 text-[10px] font-bold self-start md:self-auto">
                        {isFromCache ? (
                            <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />
                                بيانات مخزنة مؤقتاً · أقل من 5 دقائق
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5">
                                <RefreshCw size={11} className="animate-spin text-emerald-500" />
                                بيانات حية محدثة الآن
                            </span>
                        )}
                    </div> */}
                </div>

                {/* Feedback */}
                {loading && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm inline-flex max-w-max animate-pulse">
                        <div className="h-1.5 w-1.5 bg-slate-950 rounded-full animate-ping" />
                        <span>جاري تحديث الرسوم البيانية وقراءة مؤشرات التداول الحية...</span>
                    </div>
                )}
                {error && (
                    <div className="flex items-center justify-between text-xs text-rose-600 bg-rose-50 border border-rose-100/80 rounded-xl px-4 py-3 font-semibold shadow-sm max-w-max gap-4">
                        <span>⚠️ {error}</span>
                        <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* Stock grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(stocks).map(([ticker, data]) => {
                        if (data.error) {
                            return (
                                <div key={ticker} className="bg-rose-50/30 border border-rose-200/50 rounded-2xl p-6 relative flex flex-col justify-between min-h-[260px] shadow-sm">
                                    <button
                                        onClick={() => handleRemoveTicker(ticker)}
                                        className="absolute top-4 left-4 h-6 w-6 rounded-full bg-white border border-rose-100 flex items-center justify-center text-rose-400 hover:text-rose-600 transition-colors shadow-sm"
                                    >
                                        <X size={12} />
                                    </button>
                                    <div>
                                        <div className="h-7 w-14 bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center rounded-lg mb-3 tracking-wider">{ticker}</div>
                                        <p className="text-xs text-rose-600/90 font-medium leading-relaxed">{data.error}</p>
                                    </div>
                                </div>
                            );
                        }

                        const low = data.fifty_two_week_low || 0;
                        const high = data.fifty_two_week_high || 1;
                        const current = data.current_price || 0;
                        const range = high - low;
                        const percentage = range > 0 ? ((current - low) / range) * 100 : 0;
                        const chartData = data.historical_chart || [];
                        const isUp = chartData.length >= 2
                            ? chartData[chartData.length - 1].price >= chartData[chartData.length - 2].price
                            : current >= (low + (high - low) / 2);

                        return (
                            <div
                                key={ticker}
                                className="bg-white border border-slate-200/80 rounded-2xl p-5 relative shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between group min-h-[520px]"
                            >
                                {/* Remove button */}
                                <button
                                    onClick={() => handleRemoveTicker(ticker)}
                                    className="absolute top-4 left-4 h-6 w-6 rounded-full bg-slate-50 border border-slate-100 sm:opacity-0 group-hover:opacity-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all z-20 shadow-sm"
                                >
                                    <X size={12} />
                                </button>

                                <div>
                                    {/* Header row */}
                                    <div className="flex justify-between items-center mb-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-slate-950 text-white font-black text-xs px-3 py-1 rounded-lg tracking-wide shadow-sm">
                                                {ticker}
                                            </div>
                                            <span className="text-[10px] bg-slate-50 text-slate-500 border border-slate-100 px-2 py-0.5 rounded-full font-bold truncate max-w-[125px]">
                                                {data.industry || "General"}
                                            </span>
                                        </div>
                                        <div className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full ${isUp ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                            {isUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                                            <span>{isUp ? "صاعد مؤخراً" : "هابط مؤخراً"}</span>
                                        </div>
                                    </div>

                                    <h4 className="text-xs font-bold text-slate-400 truncate max-w-[210px] mb-4">{data.company_name}</h4>

                                    {/* Price */}
                                    <div className="flex items-baseline gap-1.5 mb-2">
                                        <strong className="text-3xl font-black text-slate-950 tracking-tight">${current.toFixed(2)}</strong>
                                        <span className="text-[10px] text-slate-400 font-bold">USD</span>
                                    </div>

                                    {/* Chart */}
                                    <div className="w-full h-28 my-2 pb-2">
                                        {chartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: "600" }} dy={8} />
                                                    <YAxis domain={["dataMin - 2", "dataMax + 2"]} hide />
                                                    <Tooltip
                                                        contentStyle={{ background: "#0f172a", borderRadius: "10px", border: "none", color: "#fff", fontSize: "10px" }}
                                                        itemStyle={{ color: isUp ? "#10b981" : "#f43f5e", fontWeight: "bold" }}
                                                        labelStyle={{ color: "#94a3b8", marginBottom: "2px" }}
                                                        formatter={(value: any) => [`$${value}`, "السعر"]}
                                                    />
                                                    <defs>
                                                        <linearGradient id={`colorPrice-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={isUp ? "#10b981" : "#f43f5e"} stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor={isUp ? "#10b981" : "#f43f5e"} stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <Area type="monotone" dataKey="price" stroke={isUp ? "#10b981" : "#f43f5e"} strokeWidth={2} fillOpacity={1} fill={`url(#colorPrice-${ticker})`} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-[10px] text-slate-400">
                                                لا توجد بيانات مخطط متوفرة
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Metrics */}
                                <div className="border-t border-slate-100 pt-3.5 space-y-2.5 text-xs text-slate-600 font-medium">
                                    <div className="flex justify-between items-center">
                                        <span>القيمة الرأسمالية:</span>
                                        <strong className="text-slate-950 font-bold">{data.market_cap ? (data.market_cap / 1e9).toFixed(1) + "B" : "N/A"}</strong>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>مكرر الربحية الاستثماري P/E:</span>
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${data.pe_ratio && data.pe_ratio < 20 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-700"}`}>
                                            {data.pe_ratio ? data.pe_ratio.toFixed(2) : "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>عوائد توزيع الأرباح:</span>
                                        <strong className="text-slate-900 font-bold">{data.dividend_yield ? `${data.dividend_yield}%` : "0%"}</strong>
                                    </div>
                                </div>

                                {/* 52-week range */}
                                <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2">
                                    <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                                        <span>نطاق الحركة السنوي</span>
                                        <span dir="ltr" className="font-bold text-slate-500">${low.toFixed(2)} – ${high.toFixed(2)}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full relative">
                                        <div className="absolute top-0 bottom-0 bg-slate-900 rounded-full" style={{ right: 0, left: `${100 - percentage}%` }} />
                                        <div className="absolute h-3 w-3 bg-white border-2 border-slate-950 rounded-full top-1/2 -translate-y-1/2 shadow-sm" style={{ right: `${percentage}%`, marginRight: "-6px" }} />
                                    </div>
                                    <div className="text-[9px] text-slate-400 text-center font-bold">
                                        يتموضع السعر الحالي بنسبة <span className="text-slate-800">{percentage.toFixed(0)}%</span> من قاع النطاق.
                                    </div>
                                </div>

                                {/* Detail link */}
                                <div className="mt-4 pt-2.5 border-t border-slate-100/60">
                                    <Link
                                        href={`/stock/${ticker.toLowerCase()}`}
                                        className="w-full bg-slate-50 hover:bg-slate-950 text-slate-700 hover:text-white border border-slate-200/70 rounded-xl py-2 px-3 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all group/btn"
                                    >
                                        <span>تحليل المؤشرات والبيانات التفصيلية لـ {ticker}</span>
                                        <ChevronLeft size={11} className="text-slate-400 group-hover/btn:text-white mr-auto transition-colors" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty state */}
                {!loading && Object.keys(stocks).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <BarChart3 size={24} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-bold text-slate-500">لا توجد أسهم في محفظتك بعد</p>
                        <p className="text-xs text-slate-400">ابحث عن رمز سهم وأضفه باستخدام الشريط أعلاه</p>
                    </div>
                )}
            </main>
        </div>
    );
}