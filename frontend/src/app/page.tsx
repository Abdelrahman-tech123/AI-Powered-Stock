"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center">
      <div className="animate-pulse text-xs text-slate-400 dark:text-zinc-500 font-mono">
        جاري التحميل...
      </div>
    </div>
  );
}