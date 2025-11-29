"use client";

import { 
  Layers, 
  Plus, 
  Database, 
  Server, 
  Terminal,
  Cpu
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function FeaturesPage() {
  // Simulasi state data kosong
  const features = []; 

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-[#FAFAFA] pt-32 pb-24 selection:bg-black selection:text-white">
        
        {/* --- BACKGROUND ENGINEERING --- */}
        <div className="absolute inset-0 -z-20 h-full w-full bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-50 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* --- PAGE HEADER --- */}
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider mb-6">
              <Layers className="w-3 h-3 text-slate-900" />
              Feature Catalog
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.03em] text-slate-900 mb-6 leading-[1.1]">
              Kapabilitas Platform
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed max-w-xl font-medium">
              Eksplorasi fitur-fitur yang dirancang untuk mendukung ekosistem Renunganku.
            </p>
          </div>

          {/* --- DYNAMIC CONTENT AREA (Currently Empty) --- */}
          <div className="relative w-full min-h-[400px] bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center p-12 text-center overflow-hidden group">
            
            {/* Background Pattern inside the card */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            
            {/* --- EMPTY STATE VISUALIZATION --- */}
            <div className="relative z-10 flex flex-col items-center">
               
               {/* Icon Stack Animation */}
               <div className="relative mb-8">
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center relative z-10 shadow-sm group-hover:scale-110 transition-transform duration-500">
                     <Database className="w-8 h-8 text-slate-400" />
                  </div>
                  {/* Decorative Elements underneath */}
                  <div className="absolute top-0 left-0 w-20 h-20 bg-slate-100/50 rounded-2xl border border-slate-200 transform rotate-6 -z-0"></div>
                  <div className="absolute top-0 left-0 w-20 h-20 bg-slate-200/30 rounded-2xl border border-slate-200 transform -rotate-6 -z-10"></div>
               </div>

               <h3 className="text-xl font-bold text-slate-900 mb-3">
                 Sistem Siap Digunakan
               </h3>
               
               <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
                 Database fitur saat ini belum diisi. Halaman ini siap menerima konten dinamis melalui Dashboard Admin (CRUD).
               </p>

               {/* Developer / Admin Indicator Badge */}
               <div className="flex flex-col gap-3 items-center w-full max-w-sm">
                  
                  {/* Status Indicator */}
                  <div className="w-full bg-slate-50 rounded-lg border border-slate-200 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center">
                              <Server className="w-4 h-4 text-slate-500" />
                          </div>
                          <div className="text-left">
                              <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Backend Connection</div>
                              <div className="text-[10px] text-emerald-600 font-mono flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  Active_Standby
                              </div>
                          </div>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">ms_latency: 24ms</div>
                  </div>

                  {/* Placeholder Action for Dev */}
                  <div className="w-full bg-black/5 rounded-lg border border-dashed border-slate-300 p-4 flex items-center justify-center gap-2 text-slate-500 cursor-not-allowed">
                      <Terminal className="w-4 h-4" />
                      <span className="text-xs font-mono">Waiting for admin input...</span>
                  </div>

               </div>
            </div>

            {/* --- PLACEHOLDER GRID (GHOST UI) --- */}
            {/* Ini memberikan efek visual bahwa "seharusnya ada konten di sini" */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex gap-4 p-8 blur-[1px]">
                {[1,2,3].map(i => (
                    <div key={i} className="flex-1 bg-black rounded-xl h-full w-full"></div>
                ))}
            </div>

          </div>

          {/* --- INFO STRIP (Tech Stack) --- */}
          <div className="mt-8 flex justify-center">
              <div className="inline-flex items-center gap-6 px-6 py-3 rounded-full bg-white border border-slate-100 shadow-sm text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" />
                      Next.js 16 Ready
                  </span>
                  <span className="w-px h-3 bg-slate-200"></span>
                  <span className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5" />
                      Dynamic Rendering
                  </span>
              </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}