"use client";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Layers, LogOut } from "lucide-react";
import NavbarControls from "../components/NavbarControls";

export default function DashboardPage() {
    const router = useRouter();

    // require session and redirect immediately when unauthenticated
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            router.push('/login');
        }
    });

    useEffect(() => {
        if (status === "loading") return;

        if (status === "authenticated") {
            console.log("User is Authenicated")
        }

    }, [status]);

    return (
        <div className="min-h-screen bg-white dark:bg-[#030407] text-slate-900 dark:text-slate-100 antialiased font-sans transition-colors duration-300">

            <header className="bg-white/50 dark:bg-[#080b11]/60 border-b border-slate-200/60 dark:border-slate-900/60 px-4 sm:px-8 py-5 flex justify-between items-center sticky top-0 z-40 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
                        <Layers size={18} className="text-white relative z-10" />
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="font-black text-lg bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400 bg-clip-text text-transparent tracking-tight">
                            logo
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">أهلا</span>
                        <span className="text-sm font-black text-slate-800 dark:text-slate-200">{session?.user?.name}</span>
                    </div>
                    <NavbarControls />
                    <button
                        onClick={() => signOut()}
                        className="p-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#0e1217] dark:hover:bg-[#131920] text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-900 transition-all flex items-center gap-2 text-sm font-black shadow-sm group hover:border-rose-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <LogOut size={15} className="text-rose-500 group-hover:translate-x-0.5 transition-transform" />
                        <span className="hidden sm:inline text-slate-700 dark:text-slate-300">تسجيل الخروج</span>
                    </button>
                </div>
            </header>
        </div>
    );
}