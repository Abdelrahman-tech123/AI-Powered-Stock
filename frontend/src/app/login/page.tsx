"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowLeft, TrendingUp, ShieldCheck, HelpCircle } from "lucide-react";
import NavbarControls from "../components/NavbarControls";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await signIn("credentials", { email, password, redirect: false });

        if (res?.error) {
            setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
            setLoading(false);
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] text-slate-900 flex flex-col lg:flex-row relative overflow-hidden font-sans selection:bg-slate-900 selection:text-white" dir="rtl">

            {/* Ambient Background Radial Blurs */}
            <div className="absolute top-[-20%] right-[-10%] w-[1000px] h-[800px] rounded-full bg-gradient-to-bl from-slate-200/40 via-neutral-100/10 to-transparent blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-emerald-50/30 to-transparent blur-[100px] pointer-events-none" />

            {/* Right Panel: Minimal Branding & Architecture (Takes 55% Width on Desktop) */}
            <div className="flex-1 flex flex-col justify-between p-8 lg:p-16 relative z-10 lg:max-w-[55%]">
                {/* Header Brand */}
                <header className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="h-10 w-10 rounded-xl bg-slate-950 flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-105">
                            <TrendingUp size={20} className="text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-base tracking-tight text-slate-900 leading-tight">دليلك بورصة</span>
                            <span className="text-[10px] text-slate-400 font-medium tracking-wider">PREMIUM PLATFORM</span>
                        </div>
                    </div>
                </header>

                {/* Center Content Editorial Text */}
                <div className="my-auto max-w-xl space-y-6 pt-16 lg:pt-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium bg-white border border-slate-200/80 text-slate-700 shadow-sm">
                        <ShieldCheck size={13} className="text-emerald-600" />
                        {/* اتصال مشفر وآمن بالكامل */}
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-[1.2]">
                        منصة التحليل المالي والذكاء الاصطناعي
                    </h1>
                    <p className="text-slate-500 text-sm leading-relaxed font-light max-w-lg">
                        بيئة عمل متكاملة مصممة خصيصاً لقراءة مؤشرات الأسواق وتحليل حركات التداول بدقة متناهية، تمنحك الرؤية الشاملة لإدارة أصولك الاستثمارية ومدعمة بأدوات الذكاء الاصطناعي .
                    </p>
                </div>

                {/* Left Minimal Footer */}
                <footer className="flex items-center gap-6 text-[11px] text-slate-400 pt-12 lg:pt-0">
                    <span>&copy; {new Date().getFullYear()} دليلك بورصة.</span>
                    <Link href="#" className="hover:text-slate-900 transition-colors">الشروط والسياسات</Link>
                    <Link href="#" className="hover:text-slate-900 transition-colors flex items-center gap-1">
                        <HelpCircle size={12} />
                        الدعم الفني
                    </Link>
                </footer>
            </div>

            {/* Left Panel: The Elegant Full-Height Login Sheet (Takes 45% Width on Desktop) */}
            <div className="w-full lg:w-[45%] bg-white lg:border-r border-slate-200/80 shadow-[-10px_0_50px_rgba(0,0,0,0.02)] flex flex-col justify-center relative z-20 min-h-[600px] lg:min-h-screen">

                {/* Embedded Navbar Controls inside the structural column */}
                <div className="absolute top-6 left-6 z-30">
                    <NavbarControls />
                </div>

                <div className="max-w-md w-full mx-auto px-8 py-16 lg:py-24 flex flex-col justify-center">

                    {/* Header Heading */}
                    <div className="mb-10">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
                            تسجيل الدخول
                        </h2>
                        <p className="text-slate-400 text-xs font-light">
                            الرجاء إدخال بيانات الاعتماد للوصول إلى محفظتك الاستثمارية.
                        </p>
                    </div>

                    {/* Error Alerts */}
                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 rounded-xl p-3.5 text-xs mb-6 text-center font-medium shadow-sm">
                            {error}
                        </div>
                    )}

                    {/* Form Layout */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-slate-700 text-xs font-semibold mb-2 pr-0.5">البريد الإلكتروني</label>
                            <div className="relative group">
                                <Mail className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400 group-focus-within:text-slate-900 transition-colors duration-200" size={15} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3.5 pr-11 pl-4 text-xs focus:outline-none focus:border-slate-950 focus:bg-white text-slate-900 placeholder-slate-400 transition-all text-right font-medium"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2 pr-0.5">
                                <label className="block text-slate-700 text-xs font-semibold">كلمة المرور</label>
                                <Link href="#" className="text-xs text-slate-400 hover:text-slate-900 hover:underline transition-colors font-medium">نسيت كلمة السر؟</Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400 group-focus-within:text-slate-900 transition-colors duration-200" size={15} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3.5 pr-11 pl-4 text-xs focus:outline-none focus:border-slate-950 focus:bg-white text-slate-900 placeholder-slate-400 transition-all text-right font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Solid Institutional Action Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-950 hover:bg-slate-900 text-white font-medium py-4 rounded-xl text-xs transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 mt-8 shadow-sm group/btn active:scale-[0.99]"
                        >
                            <span>{loading ? "جاري التحقق من الهوية..." : "تسجيل الدخول"}</span>
                            <ArrowLeft size={14} className="transition-transform duration-300 group-hover/btn:-translate-x-1" />
                        </button>
                    </form>

                    {/* Clean Simple Registration Invitation Footer */}
                    <div className="text-center text-xs mt-12 border-t border-slate-100 pt-6">
                        <span className="text-slate-400">ليس لديك حساب؟</span>{" "}
                        <Link href="/register" className="text-slate-950 font-bold hover:underline ml-1">
                            انشاء حساب
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}