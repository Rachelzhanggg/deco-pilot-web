"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SpecuroArchive() {
  const [authorized, setAuthorized] = useState(false);
  const [code, setCode] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 筛选状态
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeStyle, setActiveStyle] = useState('ALL');

  // 1. 检查内测权限
  useEffect(() => {
    if (localStorage.getItem("specuro_beta_access") === "true") {
      setAuthorized(true);
    }
  }, []);

  // 2. 核心数据获取与筛选
  useEffect(() => {
    if (authorized) {
      fetchData();
    }
  }, [authorized, activeCategory, activeStyle]);

  const fetchData = async () => {
    setLoading(true);
    console.log("Attempting to fetch data from Supabase...");

    // 获取所有数据，不带任何 UID 过滤
    const { data, error } = await supabase
      .from('furniture')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase Error:", error);
      alert("Database error. Check your Vercel Environment Variables.");
      setLoading(false);
      return;
    }

    if (data) {
      console.log("Successfully fetched items:", data);
      
      // 执行筛选过滤
      let result = data;

      if (activeCategory !== 'ALL') {
        result = result.filter(i => 
          i.type && i.type.toUpperCase().includes(activeCategory.toUpperCase())
        );
      }

      if (activeStyle !== 'ALL') {
        result = result.filter(i => 
          i.style && i.style.toUpperCase() === activeStyle.toUpperCase()
        );
      }

      setItems(data);
      setFilteredItems(result);
    }
    setLoading(false);
  };

  // 3. 一键清空库 (内测调试用)
  const handleClear = async () => {
    if (!window.confirm("ARE YOU SURE YOU WANT TO CLEAR ALL DATA?")) return;
    const { error } = await supabase.from('furniture').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (!error) {
      setItems([]);
      setFilteredItems([]);
      alert("ARCHIVE CLEARED.");
    }
  };

  // --- 场景 A: 内测码拦截 ---
  if (!authorized) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white text-black">
        <h1 className="text-6xl font-black italic tracking-tighter mb-10">SPECURO.</h1>
        <div className="w-64 space-y-4 text-center">
          <input 
            type="text" placeholder="BETA ACCESS CODE"
            className="w-full border-b-2 border-black p-3 text-center outline-none font-bold uppercase placeholder:text-gray-200"
            value={code} onChange={e => setCode(e.target.value)}
          />
          <button 
            onClick={() => { 
              if(code.toUpperCase()==="SPECURO-BETA") { 
                setAuthorized(true); 
                localStorage.setItem("specuro_beta_access", "true"); 
              } else alert("INVALID CODE"); 
            }}
            className="w-full bg-black text-white py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-800"
          >Enter the Archive</button>
        </div>
      </div>
    );
  }

  // --- 场景 B: 核心展示界面 ---
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      {/* 顶部导航 */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-black px-10 py-6 flex justify-between items-center">
        <div className="text-2xl font-black italic tracking-tighter uppercase leading-none">SPECURO.</div>
        <div className="flex items-center gap-10">
            <button onClick={handleClear} className="text-[9px] font-bold text-gray-300 hover:text-red-600 uppercase transition-colors">Clear Data</button>
            <a href="/specuro-clipper.zip" download className="text-[10px] font-black border-b-2 border-red-600 pb-0.5 text-red-600 hover:tracking-widest transition-all">DOWNLOAD CLIPPER V1.0</a>
        </div>
      </nav>

      {/* 底部悬浮控制台 */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex bg-black text-white px-8 py-4 gap-10 shadow-2xl items-center">
        <div className="flex gap-6 border-r border-gray-800 pr-10">
          {['ALL', 'SEATING', 'TABLES', 'LIGHTS', 'STORAGE'].map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)} 
              className={`text-[9px] font-black tracking-widest ${activeCategory === cat ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex gap-6">
          {['ALL', 'MODERN', 'MINIMAL', 'INDUSTRIAL'].map(style => (
            <button 
              key={style} 
              onClick={() => setActiveStyle(style)} 
              className={`text-[9px] font-black tracking-widest ${activeStyle === style ? 'text-white' : 'text-gray-500 hover:text-white'}`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      <main className="pt-40 pb-40 px-10 max-w-[1600px] mx-auto">
        <header className="mb-20">
          <h2 className="text-7xl font-black tracking-tighter uppercase mb-4">The Archive.</h2>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em]">
            {loading ? "SYNCING_DATA..." : `Global Sourcing Library / ${filteredItems.length} items`}
          </p>
        </header>

        {filteredItems.length === 0 && !loading ? (
          <div className="py-20 border-2 border-dashed border-gray-100 text-center text-gray-300 italic text-sm">
            No items match the current filter. Click "ALL" or capture new specs.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-24">
            {filteredItems.map((item) => (
              <div key={item.id} className="group">
                {/* 图片展示 - 彩色 + Hover 效果 */}
                <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden mb-6 border border-transparent group-hover:border-black transition-all duration-500">
                  <img 
                    src={item.image_url || 'https://via.placeholder.com/400x500'} 
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                  />
                  <a href={item.source_url} target="_blank" className="absolute top-4 right-4 bg-black text-white text-[8px] p-2 font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                    Source ↗
                  </a>
                </div>

                {/* 文字详情 */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-sm font-black leading-tight uppercase line-clamp-2">{item.name}</h3>
                    <span className="font-bold text-xs italic whitespace-nowrap">{item.price || 'TBD'}</span>
                  </div>

                  <div className="grid grid-cols-2 border-t border-gray-100 pt-4 gap-4 text-left">
                    <div className="space-y-1">
                      <label className="block">Finish</label>
                      <p className="text-[11px] font-bold uppercase">{item.color || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="block">Delivery</label>
                      <p className="text-[11px] font-bold uppercase">{item.lead_time || 'TBD'}</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="block">Technical Specs</label>
                    <p className="text-[11px] font-medium font-mono leading-relaxed">{item.dimensions}</p>
                  </div>

                  {item.pdf_url && (
                    <a 
                      href={item.pdf_url} 
                      target="_blank" 
                      className="inline-flex items-center gap-2 bg-red-50 px-3 py-1.5 border border-red-100 group/pdf transition-all hover:bg-red-600"
                    >
                      <div className="w-1.5 h-1.5 bg-red-600 group-hover/pdf:bg-white transition-colors"></div>
                      <span className="text-[9px] font-black text-red-600 group-hover/pdf:text-white uppercase tracking-tighter">
                        PDF SPEC SHEET
                      </span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      <footer className="mt-40 py-20 text-center border-t border-gray-50 text-[9px] font-bold text-gray-200 uppercase tracking-[0.5em]">
        SPECURO.DESIGN © 2026 / BEYOND MINIMALISM
      </footer>
    </div>
  );
}
