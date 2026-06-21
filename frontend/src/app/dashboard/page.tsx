"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link"
import { TrendingUp, LogOut, Plus, X, DollarSign, BarChart3, PieChart, Activity, ArrowUpRight, ArrowDownRight, Search, ChevronLeft, RefreshCw } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, Tooltip, YAxis, XAxis } from "recharts";

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
    error?: string;
}

interface DashboardStocks {
    [ticker: string]: StockData;
}

interface ChartPoint {
    day: string;
    price: number;
}

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const [stocks, setStocks] = useState<DashboardStocks>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");

    // دالة جلب البيانات الحية من yfinance بناءً على مصفوفة الأكواد
    const fetchStockDetailsFromYFinance = async (tickersList: string[]) => {
        if (tickersList.length === 0) {
            setStocks({});
            return;
        }
        const token = (session as any)?.accessToken;
        try {
            const response = await axios.post<DashboardStocks>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/services/stock/search`,
                { tickers: tickersList },
                {
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                }
            );
            setStocks(response.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || "حدث خطأ أثناء تحديث بيانات الأسهم");
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            const loadDashboard = async () => {
                const token = (session as any)?.accessToken;
                try {
                    setLoading(true);
                    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/services/stock/tickers`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (res.data?.tickers) {
                        await fetchStockDetailsFromYFinance(res.data.tickers);
                    }
                } catch (err) {
                    await fetchStockDetailsFromYFinance(["AAPL", "MSFT", "KO"]);
                } finally {
                    setLoading(false);
                }
            };

            loadDashboard();
        }
    }, [status]);

    // دالة مزامنة وحفظ مصفوفة الأكواد سحابياً
    const syncTickersWithBackend = async (updatedTickers: string[]) => {
        const token = (session as any)?.accessToken;
        if (!token) return;

        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/services/stock/tickers`,
                { tickers: updatedTickers },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log("تم تحديث المحفظة سحابياً بنجاح");
        } catch (err: any) {
            console.error("فشل الحفظ السحابي:", err.message);
            setError("تم التعديل على الشاشة ولكن فشل الحفظ في السيرفر");
        }
    };

    // معالجة إضافة سهم جديد عبر البحث
    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanTicker = searchQuery.trim().toUpperCase();
        const token = (session as any)?.accessToken;

        if (!cleanTicker) return;

        if (stocks[cleanTicker]) {
            setError("هذا السهم موجود بالفعل في لوحة التحكم");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await axios.post<DashboardStocks>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/services/stock/search`,
                { tickers: [cleanTicker] },
                {
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                }
            );

            if (response.data && response.data[cleanTicker] && !response.data[cleanTicker].error) {
                setStocks((prev) => ({
                    ...prev,
                    [cleanTicker]: response.data[cleanTicker],
                }));
                setSearchQuery("");

                const updatedTickers = [...Object.keys(stocks), cleanTicker];
                await syncTickersWithBackend(updatedTickers);
            } else {
                setError("لم يتم العثور على سهم بهذا الرمز أو الرمز غير صحيح");
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || "فشل البحث عن السهم");
        } finally {
            setLoading(false);
        }
    };

    // معالجة حذف سهم ومزامنته فوراً
    const handleRemoveTicker = async (tickerToRemove: string) => {
        setStocks((prev) => {
            const updated = { ...prev };
            delete updated[tickerToRemove];
            return updated;
        });

        const remainingTickers = Object.keys(stocks).filter(t => t !== tickerToRemove);
        await syncTickersWithBackend(remainingTickers);
    };

    const DAYS_OF_WEEK = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

    const generateHistoricalData = (current: number, low: number, high: number): ChartPoint[] => {
        const points = 7;
        const data: ChartPoint[] = [];
        let basePrice = low + (high - low) * 0.4;
        const todayIndex = new Date().getDay();

        for (let i = 0; i < points - 1; i++) {
            const randomVolatility = (Math.random() - 0.48) * (current * 0.03);
            basePrice = Math.min(Math.max(basePrice + randomVolatility, low), high);
            const dayName = DAYS_OF_WEEK[(todayIndex - (points - 1 - i) + 7 * 2) % 7];
            data.push({ day: dayName, price: parseFloat(basePrice.toFixed(2)) });
        }

        data.push({ day: "اليوم", price: current });
        return data;
    };

    const validStocksArray = Object.values(stocks).filter(s => s && !s.error && s.current_price);
    const totalMarketCap = validStocksArray.reduce((acc, curr) => acc + (curr.market_cap || 0), 0);
    const avgPeRatio = validStocksArray.length ? validStocksArray.reduce((acc, curr) => acc + (curr.pe_ratio || 0), 0) / validStocksArray.length : 0;

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-sans" dir="rtl">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-6 w-6 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-slate-400 font-medium">جاري تهيئة الرسوم والتحليلات البيانية...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] text-slate-900 flex flex-col font-sans relative overflow-hidden" dir="rtl">
            <div className="absolute top-[-30%] left-[-10%] w-[1200px] h-[900px] rounded-full bg-gradient-to-br from-slate-100 via-neutral-50/20 to-transparent blur-[130px] pointer-events-none z-0" />

            {/* Navbar */}
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

                <div className="flex items-center gap-4">
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

            {/* Main Content Area */}
            <main className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto space-y-8 relative z-10">

                {/* Statistical Control Boxes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 text-slate-50/50 group-hover:text-slate-100/80 transition-colors duration-300 pointer-events-none">
                            <BarChart3 size={90} />
                        </div>
                        <div className="space-y-1 z-10">
                            <span className="text-[11px] text-slate-400 font-bold block">مجموع الشركات المتابعة</span>
                            <strong className="text-3xl text-slate-900 font-black block">{Object.keys(stocks).length}</strong>
                        </div>
                        <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 shadow-inner z-10">
                            <Activity size={18} />
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 text-slate-50/50 group-hover:text-slate-100/80 transition-colors duration-300 pointer-events-none">
                            <DollarSign size={90} />
                        </div>
                        <div className="space-y-1 z-10">
                            <span className="text-[11px] text-slate-400 font-bold block">حجم التداول الكلي للأصول</span>
                            <strong className="text-xl text-slate-900 font-black block truncate max-w-[190px]">${totalMarketCap.toLocaleString()}</strong>
                        </div>
                        <div className="h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner z-10">
                            <DollarSign size={18} />
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 text-slate-50/50 group-hover:text-slate-100/80 transition-colors duration-300 pointer-events-none">
                            <PieChart size={90} />
                        </div>
                        <div className="space-y-1 z-10">
                            <span className="text-[11px] text-slate-400 font-bold block">وسيط مضاعف القيمة الاستثمارية P/E</span>
                            <strong className="text-3xl text-slate-900 font-black block">{avgPeRatio ? avgPeRatio.toFixed(2) : "0.00"}</strong>
                        </div>
                        <div className="h-11 w-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner z-10">
                            <PieChart size={18} />
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 items-center">
                        <div className="relative w-full flex-1 group">
                            <Search className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="ابحث وأضف رمز سهمك إلى اللوحة (مثال: AAPL, MSFT)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50/70 border border-slate-200/80 rounded-xl py-3 pr-11 pl-4 text-xs focus:outline-none focus:border-slate-950 focus:bg-white text-slate-900 placeholder-slate-400 font-medium tracking-wide uppercase"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto bg-slate-950 hover:bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98] shrink-0"
                        >
                            <Plus size={15} />
                            <span>إدراج السهم</span>
                        </button>
                    </form>
                </div>

                {/* --- التعديل الجديد: العنوان الديناميكي القوي والملهم --- */}
                <div className="border-b border-slate-200/60 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-black text-slate-950 tracking-tight sm:text-2xl">
                            المحفظة الاستثمارية والأصول الحية
                        </h2>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                            شاشة مراقبة تفاعلية مخصصة لتحليل مؤشرات السوق، الأسعار الحالية ونطاقات الحركة السنوية.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold bg-slate-100 rounded-lg px-2.5 py-1.5 self-start md:self-auto">
                        <RefreshCw size={11} className="animate-spin text-slate-500" />
                        <span>مزامنة سحابية نشطة</span>
                    </div>
                </div>

                {/* Loading & Errors */}
                {loading && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm inline-flex max-w-max animate-pulse">
                        <div className="h-1.5 w-1.5 bg-slate-950 rounded-full animate-ping"></div>
                        <span>جاري تحديث الرسوم البيانية وقراءة مؤشرات التداول الحية...</span>
                    </div>
                )}
                {error && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100/80 rounded-xl px-4 py-3 inline-block font-semibold shadow-sm">⚠️ {error}</div>}

                {/* Stock Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(stocks).map(([ticker, data]) => {
                        if (data.error) {
                            return (
                                <div key={ticker} className="bg-rose-50/30 border border-rose-200/50 rounded-2xl p-6 relative flex flex-col justify-between min-h-[260px] shadow-sm">
                                    <button onClick={() => handleRemoveTicker(ticker)} className="absolute top-4 left-4 h-6 w-6 rounded-full bg-white border border-rose-100 flex items-center justify-center text-rose-400 hover:text-rose-600 transition-colors shadow-sm">
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
                        const percentage = Math.min(Math.max(((current - low) / (high - low)) * 100, 0), 100);

                        const chartData = generateHistoricalData(current, low, high);
                        const isUp = current >= low + (high - low) / 2;

                        return (
                            <div key={ticker} className="bg-white border border-slate-200/80 rounded-2xl p-5 relative shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between group min-h-[520px]">
                                <button
                                    onClick={() => handleRemoveTicker(ticker)}
                                    className="absolute top-4 left-4 h-6 w-6 rounded-full bg-slate-50 border border-slate-100 sm:opacity-0 group-hover:opacity-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all z-20 shadow-sm"
                                >
                                    <X size={12} />
                                </button>

                                <div>
                                    <div className="flex justify-between items-center mb-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-slate-950 text-white font-black text-xs px-3 py-1 rounded-lg tracking-wide shadow-sm">
                                                {ticker}
                                            </div>
                                            <span className="text-[10px] bg-slate-50 text-slate-500 border border-slate-100 px-2 py-0.5 rounded-full font-bold truncate max-w-[125px]">
                                                {data.industry || "General"}
                                            </span>
                                        </div>
                                        <div className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full ${isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}`}>
                                            {isUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                                            <span>{isUp ? "نشط صاعد" : "مستقر النطاق"}</span>
                                        </div>
                                    </div>

                                    <h4 className="text-xs font-bold text-slate-400 truncate max-w-[210px] mb-4">{data.company_name}</h4>

                                    <div className="flex items-baseline gap-1.5 mb-2">
                                        <strong className="text-3xl font-black text-slate-950 tracking-tight">${current.toFixed(2)}</strong>
                                        <span className="text-[10px] text-slate-400 font-bold">USD</span>
                                    </div>

                                    {/* الرسم البياني التفاعلي */}
                                    <div className="w-full h-28 my-2 opacity-95 transition-opacity pb-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                                <XAxis
                                                    dataKey="day"
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: '600' }}
                                                    dy={8}
                                                />
                                                <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide={true} />
                                                <Tooltip
                                                    contentStyle={{ background: '#0f172a', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '10px', fontFamily: 'sans-serif' }}
                                                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                                                    labelStyle={{ color: '#94a3b8', marginBottom: '2px', textAlign: 'right' }}
                                                    formatter={(value: any) => [`$${value}`, "السعر"]}
                                                />
                                                <defs>
                                                    <linearGradient id={`colorPrice-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={isUp ? "#10b981" : "#694847ff"} stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor={isUp ? "#10b981" : "#694747ff"} stopOpacity={0.0} />
                                                    </linearGradient>
                                                </defs>
                                                <Area
                                                    type="monotone"
                                                    dataKey="price"
                                                    stroke={isUp ? "#10b981" : "#f5412dff"}
                                                    strokeWidth={2}
                                                    fillOpacity={1}
                                                    fill={`url(#colorPrice-${ticker})`}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* المؤشرات والبيانات */}
                                <div className="border-t border-slate-100 pt-3.5 space-y-2.5 text-xs text-slate-600 font-medium">
                                    <div className="flex justify-between items-center">
                                        <span>القيمة الرأسمالية:</span>
                                        <strong className="text-slate-950 font-bold">{data.market_cap ? (data.market_cap / 1e9).toFixed(1) + 'B' : 'N/A'}</strong>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>مكرر الربحية الاستثماري P/E:</span>
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${data.pe_ratio && data.pe_ratio < 20 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700'}`}>
                                            {data.pe_ratio ? data.pe_ratio.toFixed(2) : "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>عوائد توزيع الأرباح:</span>
                                        <strong className="text-slate-900 font-bold">{data.dividend_yield ? `${data.dividend_yield}%` : "0%"}</strong>
                                    </div>
                                </div>

                                {/* نطاق الحركة السنوي */}
                                <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2">
                                    <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                                        <span>نطاق الحركة السنوي</span>
                                        <span dir="ltr" className="font-bold text-slate-500">${low.toFixed(2)} - ${high.toFixed(2)}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full relative">
                                        <div
                                            className="absolute top-0 bottom-0 bg-slate-900 rounded-full"
                                            style={{ right: 0, left: `${100 - percentage}%` }}
                                        ></div>
                                        <div
                                            className="absolute h-3 w-3 bg-white border-2 border-slate-950 rounded-full top-1/2 -translate-y-1/2 shadow-sm"
                                            style={{ right: `${percentage}%`, marginRight: '-6px' }}
                                        ></div>
                                    </div>
                                    <div className="text-[9px] text-slate-400 text-center font-bold">
                                        يتموضع السعر الحالي بنسبة <span className="text-slate-800">{percentage.toFixed(0)}%</span> من قاع النطاق.
                                    </div>
                                </div>

                                {/* --- التعديل الجديد: رابط تفاصيل السهم الاحترافي التفاعلي --- */}
                                <div className="mt-4 pt-2.5 border-t border-slate-100/60">
                                    <Link
                                        href={`/${ticker.toLowerCase()}/info`}
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
            </main>
        </div>
    );
}