"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SpecuroArchive() {
  const [authorized, setAuthorized] = useState(false);
  const [code, setCode] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeStyle, setActiveStyle] = useState('ALL');

  useEffect(() => {
    if (localStorage.getItem("specuro_beta_access") === "true") setAuthorized(true);
  }, []);

  useEffect(() => {
    if (authorized) fetchData();
  }, [authorized, activeCategory, activeStyle]);

  const fetchData = async () => {
    setLoading(true);
    // 直接获取所有数据
    const { data, error } = await supabase
      .from('furniture')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
    }

    if (data) {
      console.log("Fetched data:", data); // 调试：在浏览器控制台看数据
      let result = data;

      // 更加宽松的筛选逻辑
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
      
      setFilteredItems(result);
      setItems(data);
    }
    setLoading(false);
  };
  
  
  
  if (!authorized) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
        <h1 className="text-5xl font-black italic mb-10">SPECURO.</h1>
        <input 
          type="text" placeholder="BETA CODE"
          className="border-b-2 border-black p-2 text-center outline-none mb-4 uppercase font-bold"
          value={code} onChange={e => setCode(e.target.value)}
        />
        <button 
          onClick={() => { if(code.toUpperCase()==="SPECURO-BETA") { setAuthorized(true); localStorage.setItem("specuro_beta_access", "true"); } else alert("WRONG CODE"); }}
          className="bg-black text-white px-10 py-3 text-[10px] font-black uppercase tracking-widest"
        >Enter Archive</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased">
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-black px-10 py-6 flex justify-between items-center">
        <div className="text-2xl font-black italic tracking-tighter uppercase">SPECURO.</div>
        <a href="/specuro-clipper.zip" download className="text-[10px] font-black border-b-2 border-red-600 pb-0.5 text-red-600">DOWNLOAD CLIPPER V1.0</a>
      </nav>

      {/* 筛选控制台 */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex bg-black text-white px-8 py-4 gap-10 shadow-2xl items-center">
        <div className="flex gap-6 border-r border-gray-800 pr-10">
          {['ALL', 'SEATING', 'TABLES', 'LIGHTS', 'STORAGE'].map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`text-[9px] font-black tracking-widest ${activeCategory === cat ? 'text-red-500' : 'text-gray-400'}`}>{cat}</button>
          ))}
        </div>
        <div className="flex gap-6">
          {['ALL', 'MODERN', 'MINIMAL', 'INDUSTRIAL'].map(style => (
            <button key={style} onClick={() => setActiveStyle(style)} className={`text-[9px] font-black tracking-widest ${activeStyle === style ? 'text-white' : 'text-gray-500'}`}>{style}</button>
          ))}
        </div>
      </div>

      <main className="pt-40 pb-40 px-10 max-w-[1600px] mx-auto">
        <header className="mb-20">
          <h2 className="text-7xl font-black tracking-tighter uppercase mb-4">The Archive.</h2>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em]">Shared Sourcing Library / {filteredItems.length} items</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-24">
          {filteredItems.map((item) => (
            <div key={item.id} className="group">
              <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden mb-6 border border-transparent group-hover:border-black transition-all">
                <img src={item.image_url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                <a href={item.source_url} target="_blank" className="absolute top-4 right-4 bg-black text-white text-[8px] p-2 font-bold opacity-0 group-hover:opacity-100 uppercase tracking-widest">Source ↗</a>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-sm font-black leading-tight uppercase">{item.name}</h3>
                  <span className="font-bold text-xs italic">{item.price}</span>
                </div>
                <div className="grid grid-cols-2 border-t border-gray-100 pt-4 gap-4">
                  <div><label className="text-[9px] font-bold text-gray-400 block uppercase">Finish</label><p className="text-[11px] font-bold uppercase">{item.color || 'N/A'}</p></div>
                  <div><label className="text-[9px] font-bold text-gray-400 block uppercase">Lead Time</label><p className="text-[11px] font-bold uppercase">{item.lead_time || 'TBD'}</p></div>
                </div>
                <div><label className="text-[9px] font-bold text-gray-400 block uppercase">Specs</label><p className="text-[11px] font-medium font-mono leading-relaxed">{item.dimensions}</p></div>
                {item.pdf_url && (
                  <a href={item.pdf_url} target="_blank" className="inline-flex items-center gap-2 bg-red-50 px-3 py-1.5 border border-red-100">
                    <div className="w-1.5 h-1.5 bg-red-600"></div>
                    <span className="text-[9px] font-black text-red-600 uppercase">PDF SPEC SHEET</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
