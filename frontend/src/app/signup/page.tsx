"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  Mail,
  Lock,
  User,
  Activity,
  TrendingUp
} from "lucide-react";
import Logo from "@/components/Logo";

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulasi Register
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-white font-sans selection:bg-slate-900 selection:text-white">
      
      {/* --- LEFT SIDE: SIGNUP FORM (Scrollable) --- */}
      <div className="flex flex-col h-full min-h-screen px-6 md:px-12 lg:px-24 py-10 bg-white overflow-y-auto">
        
        {/* 1. HEADER LOGO */}
        <div className="flex-none mb-10 lg:mb-0">
           <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
             <Logo variant="full" height={32} />
           </Link>
        </div>

        {/* 2. CENTER CONTENT */}
        <div className="flex-1 flex flex-col justify-center max-w-[420px] w-full mx-auto">
           
           <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                 Mulai perjalanan baru.
              </h1>
              <p className="text-slate-500 text-sm">
                 Bergabung dengan 10k+ pemikir yang membangun kebiasaan refleksi.
              </p>
           </div>

           {/* GOOGLE SIGNUP */}
           <div className="mb-8">
              <button className="relative w-full flex items-center justify-center gap-3 h-12 px-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] shadow-sm group">
                 <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                 </svg>
                 <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                    Daftar dengan Google
                 </span>
              </button>
           </div>

           <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                 <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center">
                 <span className="bg-white px-3 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                    Atau buat akun manual
                 </span>
              </div>
           </div>

           <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div className="relative group">
                 <input 
                    type="text" 
                    required
                    placeholder="Nama Lengkap" 
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-sm"
                 />
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                    <User className="w-4 h-4" />
                 </div>
              </div>

              {/* Email Field */}
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

              {/* Password Field */}
              <div className="relative group">
                 <input 
                    type="password" 
                    required
                    placeholder="Password (min. 8 karakter)" 
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-sm"
                 />
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                    <Lock className="w-4 h-4" />
                 </div>
              </div>

              {/* Legal Terms Checkbox */}
              <div className="flex items-start gap-3 pt-2">
                 <div className="relative flex items-center mt-1">
                     <input type="checkbox" required className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 shadow-sm checked:bg-slate-900 checked:border-slate-900 transition-all" />
                     <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                         <polyline points="20 6 9 17 4 12"></polyline>
                     </svg>
                 </div>
                 <p className="text-xs text-slate-500 leading-relaxed">
                    Saya menyetujui <Link href="/terms" className="text-slate-900 hover:underline font-medium">Syarat & Ketentuan</Link> serta <Link href="/privacy" className="text-slate-900 hover:underline font-medium">Kebijakan Privasi</Link> Renunganku.
                 </p>
              </div>

              <button 
                 type="submit" 
                 disabled={isLoading}
                 className="w-full bg-[#0B0C0E] hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                 {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                 ) : (
                    <>
                      Buat Akun
                      <ArrowRight className="w-4 h-4" />
                    </>
                 )}
              </button>
           </form>

           <div className="mt-8 text-center text-sm text-slate-500">
              Sudah punya akun?{' '}
              <Link href="/login" className="font-bold text-slate-900 hover:underline">
                 Masuk sekarang
              </Link>
           </div>
        </div>

        {/* 3. FOOTER */}
        <div className="flex-none mt-10 text-center flex justify-center gap-2 text-[10px] uppercase tracking-widest text-slate-400">
           <ShieldCheck className="w-3 h-3" />
           <span>Encrypted End-to-End</span>
        </div>
      </div>

      {/* --- RIGHT SIDE: VALUE PROPOSITION (Fixed/Sticky) --- */}
      <div className="hidden lg:flex relative bg-[#050505] items-center justify-center overflow-hidden h-screen sticky top-0">
         
         {/* Background Ambient */}
         <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-slate-800/20 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px]"></div>
         
         {/* Grid Texture */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>

         {/* VISUAL: Growth Chart Card */}
         <div className="relative z-10 w-full max-w-md p-8">
            <div className="bg-[#0F0F0F]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all duration-500">
               
               {/* Header */}
               <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-widest">
                     <Activity className="w-3 h-3" />
                     Your Growth
                  </div>
                  <div className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-400 font-bold border border-white/5">
                     THIS WEEK
                  </div>
               </div>

               {/* Metric */}
               <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold font-mono">85%</span>
                  <span className="text-sm text-slate-400">Clarity Score</span>
               </div>
               <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                  Konsistensi menulis jurnal meningkatkan kejernihan mental Anda secara signifikan minggu ini.
               </p>

               {/* Abstract Chart Visualization */}
               <div className="flex items-end justify-between gap-2 h-24 w-full">
                  {[40, 65, 45, 80, 55, 90, 85].map((height, i) => (
                     <div key={i} className="w-full bg-slate-800/50 rounded-t-sm relative group/bar overflow-hidden">
                        <div 
                           className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-900 to-indigo-500 transition-all duration-1000 ease-out"
                           style={{ height: `${height}%` }}
                        ></div>
                        {/* Hover Tooltip Effect */}
                        <div className="absolute inset-0 bg-white/0 group-hover/bar:bg-white/10 transition-colors"></div>
                     </div>
                  ))}
               </div>
               
               <div className="flex justify-between mt-4 text-[10px] text-slate-500 font-mono uppercase">
                  <span>Mon</span>
                  <span>Sun</span>
               </div>

               {/* Shine Effect */}
               <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            </div>

            {/* Floating Element: Streak Badge */}
            <div className="absolute -top-6 -right-6 bg-white text-slate-900 px-4 py-2 rounded-lg shadow-xl transform rotate-6 border border-slate-200 flex items-center gap-2">
               <div className="p-1 bg-orange-100 rounded-full">
                  <TrendingUp className="w-3 h-3 text-orange-600" />
               </div>
               <div className="text-xs font-bold">
                  <span className="text-orange-600">7 Day</span> Streak
               </div>
            </div>
         </div>

      </div>

    </div>
  );
}