"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Rss,
  PenTool,
  Server,
  Database,
  Loader2,
  FileText
} from "lucide-react";

export default function BlogPage() {
  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-[#FDFDFD] pt-32 pb-24 selection:bg-black selection:text-white font-sans relative">
        
        {/* --- BACKGROUND TEXTURE --- */}
        <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        {/* --- PAGE HEADER --- */}
        <div className="max-w-7xl mx-auto px-6 mb-16 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-200 pb-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider mb-6">
                <Rss className="w-3 h-3" />
                The Journal
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6">
                Perspektif & <br/>
                <span className="text-slate-400">Pembaruan.</span>
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed font-medium">
                Catatan harian tentang engineering, desain, dan filosofi di balik pembangunan Renunganku.
              </p>
            </div>
          </div>
        </div>

        {/* --- EMPTY STATE / CMS WAITING MODE --- */}
        <section className="max-w-7xl mx-auto px-6 relative z-10">
            
            <div className="w-full min-h-[500px] rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center p-12 relative overflow-hidden group">
                
                {/* Background Animation inside Card */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                
                {/* Central Visual */}
                <div className="relative mb-8">
                    <div className="w-24 h-24 bg-white rounded-2xl border border-slate-200 shadow-xl flex items-center justify-center relative z-10">
                        <PenTool className="w-10 h-10 text-slate-300" />
                    </div>
                    {/* Orbiting Elements */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-slate-200 rounded-full animate-[spin_10s_linear_infinite]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-slate-200 rounded-full"></div>
                    </div>
                </div>

                <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
                    Sistem Editorial Siap
                </h3>
                
                <p className="text-slate-500 max-w-md mb-10 leading-relaxed">
                    Database jurnal saat ini kosong. Menunggu publikasi pertama dari panel Admin untuk mengisi feed ini.
                </p>

                {/* Technical Status Indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                    
                    {/* Status 1: CMS */}
                    <div className="bg-white px-4 py-3 rounded-lg border border-slate-200 flex items-center gap-3 shadow-sm">
                        <div className="p-2 bg-emerald-50 rounded-md">
                            <Database className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="text-left">
                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">CMS Connection</div>
                            <div className="text-xs font-mono font-medium text-slate-700 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                ESTABLISHED
                            </div>
                        </div>
                    </div>

                    {/* Status 2: Pipeline */}
                    <div className="bg-white px-4 py-3 rounded-lg border border-slate-200 flex items-center gap-3 shadow-sm">
                        <div className="p-2 bg-blue-50 rounded-md">
                            <Server className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-left">
                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rendering</div>
                            <div className="text-xs font-mono font-medium text-slate-700">SSR_ACTIVE</div>
                        </div>
                    </div>

                    {/* Status 3: Content */}
                    <div className="bg-white px-4 py-3 rounded-lg border border-slate-200 flex items-center gap-3 shadow-sm">
                        <div className="p-2 bg-amber-50 rounded-md">
                            <FileText className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="text-left">
                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Posts</div>
                            <div className="text-xs font-mono font-medium text-slate-700">0_ENTRIES</div>
                        </div>
                    </div>

                </div>

                {/* Simulate Loading / Waiting */}
                <div className="mt-12 flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Listening for new content...
                </div>

            </div>

        </section>

      </main>
      <Footer />
    </>
  );
}