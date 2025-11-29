"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Mail, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck, 
  KeyRound,
  Fingerprint
} from "lucide-react";
import Logo from "@/components/Logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulasi API Call
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-white font-sans selection:bg-slate-900 selection:text-white">
      
      {/* --- LEFT SIDE: THE FORM (Functional) --- */}
      <div className="flex flex-col h-full min-h-screen px-6 md:px-12 lg:px-24 py-10 bg-white overflow-y-auto">
        
        {/* 1. HEADER LOGO */}
        <div className="flex-none mb-10 lg:mb-0">
           <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
             <Logo variant="full" height={32} />
           </Link>
        </div>

        {/* 2. CENTER CONTENT */}
        <div className="flex-1 flex flex-col justify-center max-w-[400px] w-full mx-auto">
           
           {isSuccess ? (
             /* SUCCESS STATE */
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border border-emerald-100">
                   <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-4">Cek email Anda.</h1>
                <p className="text-slate-500 leading-relaxed mb-8">
                   Kami telah mengirimkan instruksi reset password ke <span className="font-bold text-slate-900">{email}</span>. Link tersebut akan kadaluwarsa dalam 1 jam.
                </p>
                
                <div className="space-y-4">
                   <button 
                      onClick={() => window.open('https://gmail.com', '_blank')}
                      className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:-translate-y-0.5"
                   >
                      Buka Email App
                   </button>
                   
                   <button 
                      onClick={() => setIsSuccess(false)} 
                      className="w-full text-sm font-medium text-slate-500 hover:text-slate-900 py-2"
                   >
                      Salah email? Coba lagi
                   </button>
                </div>
             </div>
           ) : (
             /* FORM STATE */
             <div className="animate-in fade-in duration-500">
                <div className="mb-8">
                   <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
                      <KeyRound className="w-6 h-6" />
                   </div>
                   <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                      Lupa password?
                   </h1>
                   <p className="text-slate-500 text-sm leading-relaxed">
                      Jangan khawatir. Masukkan email yang terdaftar dan kami akan membantu Anda memulihkan akun.
                   </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="space-y-1">
                      <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wide ml-1">
                         Email Terdaftar
                      </label>
                      <div className="relative group">
                         <input 
                            type="email" 
                            id="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nama@email.com" 
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-sm"
                         />
                         <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                            <Mail className="w-4 h-4" />
                         </div>
                      </div>
                   </div>

                   <button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-[#0B0C0E] hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                   >
                      {isLoading ? (
                         <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                         "Kirim Link Reset"
                      )}
                   </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                   <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors group">
                      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                      Kembali ke halaman Login
                   </Link>
                </div>
             </div>
           )}
        </div>

        {/* 3. FOOTER SECURITY */}
        <div className="flex-none mt-10 text-center flex justify-center gap-2 text-[10px] uppercase tracking-widest text-slate-400">
           <ShieldCheck className="w-3 h-3" />
           <span>Secure Recovery Protocol</span>
        </div>
      </div>

      {/* --- RIGHT SIDE: SECURITY VISUAL (Sticky) --- */}
      <div className="hidden lg:flex relative bg-[#050505] items-center justify-center overflow-hidden h-screen sticky top-0">
         
         {/* Background Ambient */}
         <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-slate-800/30 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px]"></div>
         
         {/* Grid Texture */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>

         {/* VISUAL: ENCRYPTION VAULT */}
         <div className="relative z-10">
            <div className="relative w-64 h-64">
               
               {/* Center Icon */}
               <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="w-24 h-24 bg-slate-900 rounded-2xl border border-slate-700 flex items-center justify-center shadow-2xl">
                     <Fingerprint className="w-12 h-12 text-emerald-500" />
                  </div>
               </div>

               {/* Rotating Rings */}
               <div className="absolute inset-0 border border-slate-800 rounded-full animate-[spin_10s_linear_infinite]"></div>
               <div className="absolute inset-4 border border-dashed border-slate-700 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
               <div className="absolute inset-12 border border-slate-800 rounded-full"></div>

               {/* Orbiting Elements */}
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1.5 w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1.5 w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
            </div>

            <div className="mt-12 text-center">
               <h3 className="text-white font-bold text-lg mb-2">Keamanan Prioritas Utama</h3>
               <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                  Kami menggunakan enkripsi tingkat militer untuk memastikan akun dan jurnal pribadi Anda tetap aman.
               </p>
            </div>
         </div>

      </div>

    </div>
  );
}