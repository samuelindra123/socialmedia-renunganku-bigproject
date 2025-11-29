"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  Mail,
  Lock,
  Command
} from "lucide-react";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulasi Login
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-white font-sans selection:bg-slate-900 selection:text-white">
      
      {/* --- LEFT SIDE: LOGIN FORM (Scrollable Area) --- */}
      <div className="flex flex-col h-full min-h-screen px-6 md:px-12 lg:px-24 py-10 bg-white overflow-y-auto">
        
        {/* 1. HEADER LOGO (Static Flow - Tidak akan nabrak) */}
        <div className="flex-none mb-10 lg:mb-0">
           <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
             <Logo variant="full" height={32} />
           </Link>
        </div>

        {/* 2. CENTER CONTENT (Push Up & Down) */}
        <div className="flex-1 flex flex-col justify-center max-w-[400px] w-full mx-auto">
           
           <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                 Selamat datang kembali.
              </h1>
              <p className="text-slate-500 text-sm">
                 Lanjutkan perjalanan refleksi Anda hari ini.
              </p>
           </div>

           {/* --- GOOGLE LOGIN ONLY --- */}
           <div className="mb-8">
              <button className="relative w-full flex items-center justify-center gap-3 h-12 px-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] shadow-sm group">
                 {/* Google Icon SVG */}
                 <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                 </svg>
                 <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                    Masuk dengan Google
                 </span>
              </button>
           </div>

           {/* DIVIDER */}
           <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                 <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center">
                 <span className="bg-white px-3 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                    Atau dengan email
                 </span>
              </div>
           </div>

           {/* FORM */}
           <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                 <div className="relative group">
                    <input 
                       type="email" 
                       required
                       placeholder="Email address" 
                       className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-sm"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                       <Mail className="w-4 h-4" />
                    </div>
                 </div>

                 <div className="relative group">
                    <input 
                       type="password" 
                       required
                       placeholder="Password" 
                       className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-sm"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                       <Lock className="w-4 h-4" />
                    </div>
                 </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                 <label className="flex items-center gap-2 cursor-pointer group select-none">
                    <div className="relative flex items-center">
                        <input type="checkbox" className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 shadow-sm checked:bg-slate-900 checked:border-slate-900 transition-all" />
                        <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <span className="text-slate-500 font-medium group-hover:text-slate-700">Ingat saya</span>
                 </label>
                 <Link href="/forgot-password" className="font-semibold text-slate-900 hover:underline decoration-slate-300 underline-offset-4">
                    Lupa password?
                 </Link>
              </div>

              <button 
                 type="submit" 
                 disabled={isLoading}
                 className="w-full bg-[#0B0C0E] hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                 {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                 ) : (
                    <>
                      Masuk
                      <ArrowRight className="w-4 h-4" />
                    </>
                 )}
              </button>
           </form>

           <div className="mt-8 text-center text-sm text-slate-500">
              Belum punya akun?{' '}
              <Link href="/signup" className="font-bold text-slate-900 hover:underline">
                 Daftar gratis
              </Link>
           </div>
        </div>

        {/* 3. FOOTER SECURITY (Sticky at bottom if space permits, else pushed down) */}
        <div className="flex-none mt-10 text-center flex justify-center gap-2 text-[10px] uppercase tracking-widest text-slate-400">
           <ShieldCheck className="w-3 h-3" />
           <span>Secure SSL Connection</span>
        </div>
      </div>

      {/* --- RIGHT SIDE: BRAND MOMENT (Fixed/Sticky) --- */}
      <div className="hidden lg:flex relative bg-[#050505] items-center justify-center overflow-hidden h-screen sticky top-0">
         
         {/* Background Ambient */}
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px]"></div>
         
         {/* Grid Texture */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>

         {/* The "Daily Insight" Card */}
         <div className="relative z-10 w-full max-w-md p-8">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all duration-500">
               
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-emerald-500"></div>

               <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-widest">
                     <Command className="w-3 h-3" />
                     Daily Insight
                  </div>
                  <div className="text-xs text-slate-500">Nov 29</div>
               </div>

               <blockquote className="text-2xl font-serif leading-relaxed mb-6 text-slate-200">
                  "Ketenangan bukanlah saat tidak ada badai, melainkan ketenangan di tengah badai itu sendiri."
               </blockquote>

               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-[10px] font-bold">
                     AI
                  </div>
                  <div className="text-xs text-slate-400">
                     Generated by <span className="text-indigo-400">Reflector AI</span>
                  </div>
               </div>

               <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            </div>

            {/* Dashboard Preview Elements */}
            <div className="absolute -z-10 top-[-20px] right-[-20px] w-32 h-32 bg-slate-800 rounded-xl border border-white/5 opacity-50 transform rotate-6 transition-transform duration-700 group-hover:rotate-12"></div>
            <div className="absolute -z-10 bottom-[-20px] left-[-20px] w-48 h-12 bg-slate-800 rounded-lg border border-white/5 opacity-50 transform -rotate-3 flex items-center px-4 gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <div className="h-2 w-20 bg-slate-700 rounded-full"></div>
            </div>
         </div>

      </div>

    </div>
  );
}