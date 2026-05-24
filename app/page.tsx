"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SpecuroApp() {
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToken, setShowToken] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeStyle, setActiveStyle] = useState('ALL');

  // ... 之前的 Auth 逻辑保持不变 (getEmail, getPassword, handleAuth) ...

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) fetchData();
  }, [user, activeCategory, activeStyle]);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('furniture').select('*').order('created_at', { ascending: false });
    if (data) {
      let result = data;
      if (activeCategory !== 'ALL') result = result.filter(i => i.type === activeCategory);
      if (activeStyle !== 'ALL') result = result.filter(i => i.style === activeStyle);
      setFilteredItems(result);
      setItems(data);
    }
    setLoading(false);
  };

  // --- 新增：一键清空功能 ---
  const handleClearAll = async () => {
    const confirmed = window.confirm("CRITICAL: ARE YOU SURE YOU WANT TO CLEAR YOUR ENTIRE ARCHIVE? THIS ACTION CANNOT BE UNDONE.");
    if (!confirmed) return;

    // Supabase RLS 策略会确保你只能删除自己的数据
    const { error } = await supabase
      .from('furniture')
      .delete()
      .not('id', 'is', null); // 这是一个小技巧，表示删除所有匹配当前用户权限的行

    if (error) {
      alert("Error: " + error.message);
    } else {
      setItems([]);
      setFilteredItems([]);
      alert("ARCHIVE CLEARED.");
    }
  };

  // --- 登录 UI (保持原有风格) ---
  if (!user) {
    /* ... 保持之前给你的登录代码不变 ... */
  }

  // --- 主看板界面 ---
  return (
    <div className="min-h-screen bg-white">
      {/* 顶部导航 */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-black px-10 py-6 flex justify-between items-center">
        <div className="text-2xl font-black italic tracking-tighter uppercase leading-none">Specuro.</div>
        
        <div className="flex items-center gap-10">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[8px] text-gray-400 font-bold uppercase mb-1 tracking-tighter">Plugin Token:</span>
            <div className="flex items-center gap-2">
                <code className="text-[9px] font-black text-black bg-gray-50 px-2 py-1 border border-dashed border-gray-200 cursor-pointer"
                  onClick={() => { if(!showToken) return; navigator.clipboard.writeText(user.id); alert("COPIED"); }}>
                  {showToken ? user.id : "••••••••-••••-••••-••••"}
                </code>
                <button onClick={() => setShowToken(!showToken)} className="text-[8px] font-bold border border-black px-1.5 py-0.5 uppercase hover:bg-black hover:text-white">
                    {showToken ? "Hide" : "Show"}
                </button>
            </div>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-[9px] font-black border border-black px-3 py-2 uppercase">Logout</button>
        </div>
      </nav>

      {/* 底部悬浮筛选 */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex bg-black text-white px-8 py-4 gap-10 shadow-2xl items-center">
        <div className="flex gap-6 border-r border-gray-800 pr-10">
          {['ALL', 'SEATING', 'TABLES', 'LIGHTS', 'STORAGE'].map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`text-[9px] font-black tracking-widest ${activeCategory === cat ? 'text-red-500' : 'text-gray-500 hover:text-white'}`}>{cat}</button>
          ))}
        </div>
        <div className="flex gap-6">
          {['ALL', 'MODERN', 'MINIMAL', 'INDUSTRIAL'].map(style => (
            <button key={style} onClick={() => setActiveStyle(style)} className={`text-[9px] font-black tracking-widest ${activeStyle === style ? 'text-white' : 'text-gray-500 hover:text-white'}`}>{style}</button>
          ))}
        </div>
      </div>

      <main className="pt-40 pb-40 px-10 max-w-[1600px] mx-auto">
        <header className="mb-20 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-6 mb-4">
               <h2 className="text-7xl font-black tracking-tighter uppercase leading-none">Archive.</h2>
               {/* 一键清空按钮 - 调性：极小、灰色、带警告色彩 */}
               <button onClick={handleClearAll} className="text-[9px] font-bold text-gray-300 hover:text-red-600 transition-colors uppercase border-b border-transparent hover:border-red-600 pb-0.5">
                 Clear Archive
               </button>
            </div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em]">Curated Library / {filteredItems.length} items</p>
          </div>
          <a href="/specuro-clipper.zip" download="specuro-clipper.zip" className="bg-red-600 text-white text-[10px] font-black px-6 py-3 tracking-widest uppercase hover:bg-black transition-all flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            Download Clipper
          </a>
        </header>

        {/* 家具展示 Grid (保持原有彩色、Hover缩放风格) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-24">
          {filteredItems.map((item) => (
            <div key={item.id} className="group">
              <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden mb-6 border border-transparent group-hover:border-black transition-all duration-500">
                <img src={item.image_url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                <a href={item.source_url} target="_blank" className="absolute top-4 right-4 bg-black text-white text-[8px] p-2 font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Source ↗</a>
              </div>
              <div className="space-y-4 text-black text-left">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-sm font-black leading-tight uppercase line-clamp-2">{item.name}</h3>
                  <span className="font-bold text-xs italic whitespace-nowrap">{item.price}</span>
                </div>
                {/* ... 其他字段展示保持不变 (Color, Lead Time, Dimensions, PDF) ... */}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
