"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowLeft } from "lucide-react";
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
        <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300" dir="rtl">
            <header className="p-4 flex justify-between items-center max-w-7xl w-full mx-auto border-b border-slate-200/50 dark:border-slate-900 bg-white/50 dark:bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">موقع الكتروني</span>
                <NavbarControls />
            </header>

            <div className="flex-1 flex items-center justify-center px-4 py-16">
                <div className="max-w-md w-full bg-white dark:bg-slate-900/40 rounded-2xl p-8 shadow-sm dark:shadow-[0_0_50px_-12px_rgba(255,255,255,0.02)] border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm transition-all duration-300">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white mb-1.5 text-center">تسجيل الدخول</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-center text-xs mb-8">مرحباً بك مجدداً، أدخل بياناتك للوصول إلى لوحة التحكم</p>

                    {error && (
                        <div className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl p-3 text-xs mb-5 text-center font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-2">البريد الإلكتروني</label>
                            <div className="relative">
                                <Mail className="absolute top-3 right-3 text-slate-400" size={16} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-slate-100/60 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-xl py-2.5 pr-10 pl-4 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-700 text-slate-900 dark:text-white transition-all text-right"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-2">كلمة المرور</label>
                            <div className="relative">
                                <Lock className="absolute top-3 right-3 text-slate-400" size={16} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-slate-100/60 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 rounded-xl py-2.5 pr-10 pl-4 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-700 text-slate-900 dark:text-white transition-all text-right"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-950 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black font-semibold py-2.5 rounded-xl text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 mt-4 border border-slate-900 dark:border-white shadow-sm"
                        >
                            <span>{loading ? "جاري تسجيل الدخول..." : "متابعة"}</span>
                            <ArrowLeft size={14} />
                        </button>
                    </form>

                    <p className="text-slate-500 dark:text-slate-400 text-center text-xs mt-8 border-t border-slate-100 dark:border-slate-800/50 pt-5">
                        ليس لديك حساب؟{" "}
                        <Link href="/register" className="text-slate-950 dark:text-white font-semibold hover:underline">إنشاء حساب جديد</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}