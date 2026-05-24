"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DecorPilotDashboard() {
  const [authorized, setAuthorized] = useState(false);
  const [code, setCode] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. 邀请码校验逻辑 (内测专用)
  const handleAuth = () => {
    const validCodes = ["DP-BETA-2024", "DUBAI-DESIGN", "NYC-CREATIVE"];
    if (validCodes.includes(code.toUpperCase())) {
      setAuthorized(true);
      localStorage.setItem("dp_session", "active");
    } else {
      alert("INVALID INVITATION CODE.");
    }
  };

  useEffect(() => {
    if (localStorage.getItem("dp_session") === "active") setAuthorized(true);
    fetchData();
  }, [authorized]);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('furniture')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  // --- 场景 A: 邀请码拦截界面 ---
  if (!authorized) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
        <div className="mb-20 text-center">
          <h1 className="text-5xl italic mb-2">DecorPilot.</h1>
          <p className="text-[10px] tracking-[0.4em] font-bold text-gray-400">PRIVATE BETA ACCESS</p>
        </div>
        <div className="w-64 space-y-6">
          <input 
            type="text" 
            placeholder="INVITATION CODE"
            className="w-full border-b-2 border-black py-2 text-center text-sm font-bold outline-none placeholder:text-gray-200"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button 
            onClick={handleAuth}
            className="w-full bg-black text-white py-4 text-[10px] font-black tracking-widest hover:bg-gray-800 transition-all"
          >
            ENTER THE ARCHIVE
          </button>
        </div>
        <footer className="absolute bottom-10 text-[9px] text-gray-300 font-bold uppercase tracking-widest">
          USA / MIDDLE EAST EDITION © 2026
        </footer>
      </div>
    );
  }

  // --- 场景 B: 核心看板界面 ---
  return (
    <div className="min-h-screen bg-white">
      {/* 顶部导航与插件下载 */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-black px-10 py-6 flex justify-between items-center">
        <div className="text-2xl font-black italic tracking-tighter uppercase">DecorPilot.</div>
        
        <div className="flex items-center gap-12">
          {/* 插件下载入口 */}
          <a 
            href="/decorpilot-clipper.zip" 
            download 
            className="flex items-center gap-3 group"
          >
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black border-b border-black group-hover:text-red-600 group-hover:border-red-600 transition-all">
              GET CLIPPER v1.0
            </span>
          </a>
          <div className="text-[10px] font-black text-gray-300">USER_BETA_ACCESS</div>
        </div>
      </nav>

      {/* 悬浮分类控制台 (Bauhaus Floating Menu) */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-black text-white px-10 py-4 flex items-center gap-10 shadow-2xl">
          <div className="flex gap-6 border-r border-gray-800 pr-10">
            {['ALL', 'SEATING', 'LIGHTS', 'TABLES'].map(cat => (
              <button key={cat} className="text-[9px] font-black tracking-widest hover:text-red-500 transition-colors">{cat}</button>
            ))}
          </div>
          <div className="flex gap-6">
            {['MODERN', 'INDUSTRIAL', 'MINIMAL'].map(style => (
              <button key={style} className="text-[9px] font-black tracking-widest text-gray-500 hover:text-white transition-colors">{style}</button>
            ))}
          </div>
        </div>
      </div>

      <main className="pt-40 pb-40 px-10 max-w-[1600px] mx-auto">
        <header className="mb-20">
          <h2 className="text-6xl font-black tracking-tighter mb-4">The Archive.</h2>
          <div className="h-[1px] w-20 bg-black"></div>
        </header>

        {loading ? (
          <div className="text-[10px] font-bold tracking-widest animate-pulse">LOADING_DATABASE...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-1 gap-y-20">
            {items.map((item) => (
              <div key={item.id} className="group">
                {/* 1:1 或 3:4 比例图片，极致去装饰 */}
                <div className="aspect-[3/4] bg-gray-50 border border-transparent group-hover:border-black transition-all overflow-hidden mb-6 relative">
                  <img 
                    src={item.image_url || '/placeholder.jpg'} 
                    alt={item.name} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
                  />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                     <a href={item.source_url} target="_blank" className="bg-black text-white text-[8px] p-2 font-bold uppercase tracking-widest">
                        Source ↗
                     </a>
                  </div>
                </div>

                {/* 家具详细参数 - 严格遵循插件返回字段 */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-sm font-black leading-tight truncate">{item.name}</h3>
                    <span className="font-bold text-xs italic whitespace-nowrap">{item.price || 'TBD'}</span>
                  </div>

                  <div className="grid grid-cols-2 border-t border-gray-100 pt-4 gap-4">
                    <div className="space-y-1">
                      <label>Color/Finish</label>
                      <p className="text-[11px] font-bold uppercase">{item.color || 'Default'}</p>
                    </div>
                    <div className="space-y-1">
                      <label>Lead Time</label>
                      <p className="text-[11px] font-bold uppercase">{item.lead_time || 'Check Stock'}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label>Dimensions</label>
                    <p className="text-[11px] font-medium leading-relaxed font-mono">{item.dimensions}</p>
                  </div>

                  {/* 针对 PDF 的醒目视觉提示 */}
                  {item.pdf_url && (
                    <a 
                      href={item.pdf_url} 
                      target="_blank" 
                      className="inline-flex items-center gap-2 bg-red-50 px-2 py-1 group/pdf"
                    >
                      <div className="w-1.5 h-1.5 bg-red-600"></div>
                      <span className="text-[9px] font-black text-red-600 uppercase tracking-tighter group-hover/pdf:tracking-widest transition-all">
                        Technical Spec Available
                      </span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
