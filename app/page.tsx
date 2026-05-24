"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. 初始化 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- 艺术感手写 Logo 组件 ---
const SpecuroLogo = ({ size = 24, bracketOpacity = "0.3" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      {/* 高级感渐变：模拟拉丝金属或深色皮革反光 */}
      <linearGradient id="premiumMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#000000" />
        <stop offset="30%" stopColor="#444444" />
        <stop offset="50%" stopColor="#111111" />
        <stop offset="70%" stopColor="#333333" />
        <stop offset="100%" stopColor="#000000" />
      </linearGradient>
    </defs>

    {/* 建筑感角括号：极致纤细 */}
    <path d="M12 2H2V12" stroke="black" strokeWidth="1.5" /> {/* 左上 */}
    <path d="M52 2H62V12" stroke="black" strokeWidth="1.5" opacity={bracketOpacity} /> {/* 右上 */}
    <path d="M62 52V62H52" stroke="black" strokeWidth="1.5" /> {/* 右下 */}
    <path d="M2 52V62H12" stroke="black" strokeWidth="1.5" opacity={bracketOpacity} /> {/* 左下 */}

    {/* 艺术手写风格的 S - 采用流动的路径而非标准字体 */}
    <path 
      d="M44 14.5C44 14.5 43 9 34 9C24 9 20 18 31 27C42 36 40 52 28 52C18 52 16 46 16 46M38 12L31 22" 
      stroke="url(#premiumMetallic)" 
      strokeWidth="5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{ filter: 'drop-shadow(0px 0.5px 0.5px rgba(255,255,255,0.4))' }}
    />
  </svg>
);

export default function SpecuroApp() {
  // --- 状态管理 ---
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToken, setShowToken] = useState(false);
  
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeStyle, setActiveStyle] = useState('ALL');

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInvitationCode] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // --- 核心逻辑 ---

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
    else { setItems([]); setFilteredItems([]); }
  }, [user, activeCategory, activeStyle]);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('furniture')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      let result = data;
      if (activeCategory !== 'ALL') result = result.filter(i => i.type === activeCategory);
      if (activeStyle !== 'ALL') result = result.filter(i => i.style === activeStyle);
      setFilteredItems(result);
      setItems(data);
    }
    setLoading(false);
  };

  const handleAuth = async () => {
    if (isSignUp) {
      if (inviteCode.toUpperCase() !== "SPECURO-BETA") {
        alert("INVALID INVITATION CODE.");
        return;
      }
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("CRITICAL: CLEAR ENTIRE ARCHIVE?")) return;
    const { error } = await supabase.from('furniture').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (!error) fetchData();
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`DELETE ${selectedIds.length} ITEMS?`)) return;
    const { error } = await supabase.from('furniture').delete().in('id', selectedIds);
    if (!error) {
      setSelectedIds([]);
      fetchData();
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // --- 场景 A: 登录/注册界面 ---
  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white text-black p-10 font-sans">
        <div className="mb-20 text-center flex flex-col items-center">
          <div className="mb-10 scale-150">
            <SpecuroLogo size={80} />
          </div>
          <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">Specuro.</h1>
          <p className="text-[9px] tracking-[0.6em] text-gray-400 uppercase mt-8 font-bold italic">Capture. Curate. Source.</p>
        </div>

        <div className="w-full max-w-xs space-y-4">
          <input type="email" placeholder="EMAIL" className="w-full border-b border-black py-3 text-sm font-bold outline-none caret-red-600 uppercase" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="PASSWORD" className="w-full border-b border-black py-3 text-sm font-bold outline-none caret-red-600" value={password} onChange={e => setPassword(e.target.value)} />
          {isSignUp && <input type="text" placeholder="BETA CODE" className="w-full border-b border-black py-3 text-sm font-bold outline-none text-red-600 uppercase font-black" value={inviteCode} onChange={e => setInvitationCode(e.target.value)} />}
          <button onClick={handleAuth} className="w-full bg-black text-white py-4 text-[10px] font-black tracking-widest uppercase hover:opacity-80 transition-all">{isSignUp ? "Register Account" : "Access Archive"}</button>
          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-[9px] font-bold text-gray-300 uppercase tracking-tighter hover:text-black">{isSignUp ? "Back to Login" : "Need access? Request Code"}</button>
        </div>
        <footer className="absolute bottom-10 text-[8px] text-gray-200 font-bold uppercase tracking-[0.4em]">Architecture & Interiors Edition</footer>
      </div>
    );
  }

  // --- 场景 B: 核心看板界面 ---
  return (
    <div className="min-h-screen bg-white text-black antialiased">
      {/* 顶部导航 */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-black px-10 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <SpecuroLogo size={32} />
          <div className="text-2xl font-black italic tracking-tighter uppercase leading-none">Specuro.</div>
        </div>
        
        <div className="flex items-center gap-10">
          <div className="hidden md:flex flex-col items-end mr-4">
            <span className="text-[8px] text-gray-400 font-bold uppercase mb-1 tracking-tighter">Your Plugin Token:</span>
            <div className="flex items-center gap-2">
                <code 
                  className="text-[9px] font-black text-black bg-gray-50 px-2 py-1 border border-dashed border-gray-200 cursor-pointer"
                  onClick={() => {
                      if(!showToken) return alert("CLICK 'SHOW' TO REVEAL");
                      navigator.clipboard.writeText(user.id);
                      alert("TOKEN COPIED");
                  }}
                >
                  {showToken ? user.id : "••••••••-••••-••••-••••"}
                </code>
                <button onClick={() => setShowToken(!showToken)} className="text-[8px] font-bold border border-black px-1.5 py-0.5 uppercase hover:bg-black hover:text-white transition-all">
                    {showToken ? "Hide" : "Show"}
                </button>
            </div>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-[9px] font-black border border-black px-3 py-2 uppercase hover:bg-black hover:text-white transition-all">Logout</button>
        </div>
      </nav>

      {/* 底部悬浮筛选 */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex bg-black text-white px-8 py-4 gap-10 shadow-2xl items-center border border-gray-800">
        <div className="flex gap-6 border-r border-gray-800 pr-10 text-gray-500">
          {['ALL', 'SEATING', 'TABLES', 'LIGHTS', 'STORAGE'].map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`text-[9px] font-black tracking-widest transition-colors ${activeCategory === cat ? 'text-red-500' : 'hover:text-white'}`}>{cat}</button>
          ))}
        </div>
        <div className="flex gap-6 text-gray-500">
          {['ALL', 'MODERN', 'MINIMAL', 'INDUSTRIAL'].map(style => (
            <button key={style} onClick={() => setActiveStyle(style)} className={`text-[9px] font-black tracking-widest transition-colors ${activeStyle === style ? 'text-white' : 'hover:text-white'}`}>{style}</button>
          ))}
        </div>
      </div>

      <main className="pt-40 pb-40 px-10 max-w-[1600px] mx-auto">
        <header className="mb-20 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-6 mb-4">
               <h2 className="text-7xl font-black tracking-tighter uppercase leading-none">Archive.</h2>
               {selectedIds.length > 0 ? (
                 <button onClick={handleDeleteSelected} className="text-[9px] font-black text-white bg-red-600 px-3 py-1 uppercase tracking-widest animate-pulse">Delete Selected ({selectedIds.length})</button>
               ) : (
                 <button onClick={handleClearAll} className="text-[9px] font-bold text-gray-300 hover:text-red-600 transition-colors uppercase border-b border-transparent hover:border-red-600 pb-0.5">Clear All</button>
               )}
            </div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em]">Curated Specifications / {filteredItems.length} items</p>
          </div>
          <a href="/specuro-clipper.zip" download="specuro-clipper.zip" className="bg-red-600 text-white text-[10px] font-black px-6 py-4 tracking-widest uppercase hover:bg-black transition-all flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            Download Clipper v1.0
          </a>
        </header>

        {loading ? (
          <div className="text-[10px] font-bold tracking-widest animate-pulse uppercase">Syncing_Database...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-24">
            {filteredItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div key={item.id} className="group relative">
                  {/* 高对比度勾选框 */}
                  <div 
                    onClick={() => toggleSelect(item.id)} 
                    className={`absolute top-4 left-4 z-20 w-5 h-5 border-[1.5px] cursor-pointer transition-all flex items-center justify-center shadow-[0_0_0_1px_rgba(255,255,255,0.8)]
                      ${isSelected ? 'bg-black border-black scale-110' : 'bg-white/80 border-black group-hover:opacity-100 opacity-0'}`}
                  >
                    {isSelected && <div className="w-2 h-2 bg-white" />}
                  </div>

                  <div className={`aspect-[3/4] bg-gray-50 relative overflow-hidden mb-6 border transition-all duration-500 ${isSelected ? 'border-black ring-1 ring-black' : 'border-transparent group-hover:border-black'}`}>
                    <img src={item.image_url} alt={item.name} className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 ${isSelected ? 'opacity-80' : ''}`} />
                    <a href={item.source_url} target="_blank" className="absolute top-4 right-4 bg-black text-white text-[8px] p-2 font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest z-10">Source ↗</a>
                  </div>

                  <div className="space-y-4 text-left">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-sm font-black leading-tight uppercase line-clamp-2">{item.name}</h3>
                      <span className="font-bold text-xs italic whitespace-nowrap">{item.price}</span>
                    </div>
                    <div className="grid grid-cols-2 border-t border-gray-100 pt-4 gap-4">
                      <div><label className="block mb-1">Color</label><p className="text-[11px] font-bold uppercase">{item.color || 'N/A'}</p></div>
                      <div><label className="block mb-1">Delivery</label><p className="text-[11px] font-bold uppercase">{item.lead_time || 'TBD'}</p></div>
                    </div>
                    <div><label className="block mb-1">Specs</label><p className="text-[11px] font-medium font-mono leading-relaxed">{item.dimensions}</p></div>
                    {item.pdf_url && (
                      <a href={item.pdf_url} target="_blank" className="inline-flex items-center gap-2 bg-red-50 px-3 py-1.5 border border-red-100 transition-all hover:bg-red-600 group/pdf">
                        <div className="w-1.5 h-1.5 bg-red-600 group-hover/pdf:bg-white transition-colors"></div>
                        <span className="text-[9px] font-black text-red-600 group-hover/pdf:text-white uppercase tracking-tighter">PDF SPEC SHEET</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="mt-40 py-20 text-center border-t border-gray-50 text-[9px] font-bold text-gray-200 uppercase tracking-[0.5em]">
        SPECURO.DESIGN © 2026 / BEYOND MINIMALISM
      </footer>
    </div>
  );
}
