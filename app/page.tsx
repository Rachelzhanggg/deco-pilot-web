"use client";
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- 艺术感手写 Logo 组件 ---
const SpecuroLogo = ({ size = 24, bracketOpacity = "0.3" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="premiumMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#000000" /><stop offset="30%" stopColor="#444444" />
        <stop offset="50%" stopColor="#111111" /><stop offset="70%" stopColor="#333333" />
        <stop offset="100%" stopColor="#000000" />
      </linearGradient>
    </defs>
    <path d="M12 2H2V12" stroke="black" strokeWidth="1.5" />
    <path d="M52 2H62V12" stroke="black" strokeWidth="1.5" opacity={bracketOpacity} />
    <path d="M62 52V62H52" stroke="black" strokeWidth="1.5" />
    <path d="M2 52V62H12" stroke="black" strokeWidth="1.5" opacity={bracketOpacity} />
    <path 
      d="M48 12C42 10 32 10 26 18C18 30 42 30 38 44C34 56 16 52 12 48" 
      stroke="url(#premiumMetallic)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
      style={{ filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.1))' }}
    />
    <circle cx="50" cy="14" r="2.5" fill="#E60000" />
  </svg>
);

export default function SpecuroApp() {
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToken, setShowToken] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeStyle, setActiveStyle] = useState('ALL');

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInvitationCode] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    // RLS 开启后，这里只会拿到属于当前 user 的数据
    const { data } = await supabase.from('furniture').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const catMatch = activeCategory === 'ALL' || item.type === activeCategory;
      const styleMatch = activeStyle === 'ALL' || item.style === activeStyle;
      return catMatch && styleMatch;
    });
  }, [items, activeCategory, activeStyle]);

  const handleAuth = async () => {
    if (isSignUp) {
      if (inviteCode.toUpperCase() !== "SPECURO-BETA") { alert("INVALID CODE"); return; }
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
  };

  const handleDeleteBatch = async () => {
    if (!window.confirm(`DELETE ${selectedIds.length} ITEMS?`)) return;
    const idsToRemove = [...selectedIds];
    // 乐观更新
    const remaining = items.filter(i => !idsToRemove.includes(i.id));
    setItems(remaining);
    setSelectedIds([]);
    
    const { error } = await supabase.from('furniture').delete().in('id', idsToRemove);
    if (error) { alert("SYNC ERROR"); fetchData(); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white text-black p-10">
        <div className="mb-20 text-center flex flex-col items-center">
          <div className="mb-12"><SpecuroLogo size={100} /></div>
          <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">Specuro.</h1>
          <p className="text-[9px] tracking-[0.6em] text-gray-400 uppercase mt-8 font-bold italic">Capture. Curate. Source.</p>
        </div>
        <div className="w-full max-w-xs space-y-4">
          <input type="email" placeholder="EMAIL" className="w-full border-b border-black py-3 text-sm font-bold outline-none caret-red-600 uppercase" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="PASSWORD" className="w-full border-b border-black py-3 text-sm font-bold outline-none caret-red-600" value={password} onChange={e => setPassword(e.target.value)} />
          {isSignUp && <input type="text" placeholder="BETA CODE" className="w-full border-b border-black py-3 text-sm font-bold outline-none text-red-600 uppercase font-black" value={inviteCode} onChange={e => setInvitationCode(e.target.value)} />}
          
          <button onClick={handleAuth} className="w-full bg-black text-white py-4 text-[10px] font-black tracking-widest uppercase hover:opacity-80 transition-all">{isSignUp ? "Register" : "Access Archive"}</button>
          
          {/* Guest Demo Login */}
          {!isSignUp && (
            <button 
              onClick={() => supabase.auth.signInWithPassword({ email: "demo@specuro.design", password: "guest123456" })}
              className="w-full border border-black/10 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
            >
              Browse as Guest (Demo)
            </button>
          )}

          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-[9px] font-bold text-gray-300 uppercase tracking-tighter hover:text-black">{isSignUp ? "Back to Login" : "Need access? Request Code"}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black antialiased font-sans">
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-black px-10 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3"><SpecuroLogo size={32} /> <div className="text-2xl font-black italic tracking-tighter uppercase leading-none">Specuro.</div></div>
        <div className="flex items-center gap-10">
          <div className="hidden md:flex flex-col items-end mr-4">
            <span className="text-[8px] text-gray-400 font-bold uppercase mb-1 tracking-tighter">Plugin Token:</span>
            <div className="flex items-center gap-2">
                <code className="text-[9px] font-black text-black bg-gray-50 px-2 py-1 border border-dashed border-gray-200 cursor-pointer" onClick={() => { if(!showToken) return alert("SHOW FIRST"); navigator.clipboard.writeText(user.id); alert("COPIED"); }}>
                  {showToken ? user.id : "••••••••-••••-••••"}
                </code>
                <button onClick={() => setShowToken(!showToken)} className="text-[8px] font-bold border border-black px-1.5 py-0.5 uppercase transition-all">{showToken ? "Hide" : "Show"}</button>
            </div>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-[9px] font-black border border-black px-3 py-2 uppercase hover:bg-black hover:text-white transition-all">Logout</button>
        </div>
      </nav>

      {/* 悬浮管理条 */}
      {selectedIds.length > 0 && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] bg-red-600 text-white px-6 py-3 shadow-2xl flex items-center gap-10 animate-in slide-in-from-top-4 duration-300">
           <div className="text-[10px] font-black uppercase tracking-widest">{selectedIds.length} items selected</div>
           <div className="flex gap-4">
             <button onClick={handleDeleteBatch} className="bg-white text-red-600 text-[10px] font-black px-4 py-2 uppercase hover:bg-black hover:text-white transition-all">Delete Forever</button>
             <button onClick={() => setSelectedIds([])} className="text-white text-[10px] font-black uppercase border-b border-white">Cancel</button>
           </div>
        </div>
      )}

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
            <h2 className="text-7xl font-black tracking-tighter uppercase mb-4 leading-none">Archive.</h2>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em]">Personal Collection / {filteredItems.length} items</p>
          </div>
          <a href="/specuro-clipper.zip" download className="bg-red-600 text-white text-[10px] font-black px-6 py-4 tracking-widest uppercase hover:bg-black transition-all flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div> Download Clipper v1.0
          </a>
        </header>

        {loading ? (
          <div className="text-[10px] font-bold tracking-widest animate-pulse uppercase">Syncing...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-24">
            {filteredItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div key={item.id} className="group relative flex flex-col">
                  <div onClick={() => toggleSelect(item.id)} className={`absolute top-4 left-4 z-20 w-6 h-6 border-2 cursor-pointer transition-all flex items-center justify-center ${isSelected ? 'bg-black border-black scale-110 shadow-xl' : 'bg-white/90 border-black opacity-0 group-hover:opacity-100 shadow-sm'}`}>
                    {isSelected && <div className="w-2.5 h-2.5 bg-white" />}
                  </div>
                  <div className={`aspect-[3/4] bg-gray-50 relative overflow-hidden mb-6 border transition-all duration-500 ${isSelected ? 'border-black ring-4 ring-black/5' : 'border-transparent group-hover:border-black'}`}>
                    <img src={item.image_url} alt={item.name} className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 ${isSelected ? 'opacity-50' : ''}`} />
                    <a href={item.source_url} target="_blank" className="absolute top-4 right-4 bg-black text-white text-[8px] p-2 font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest z-10">Source ↗</a>
                  </div>
                  <div className={`space-y-4 text-left transition-opacity ${isSelected ? 'opacity-30' : 'opacity-100'}`}>
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-sm font-black leading-tight uppercase line-clamp-2">{item.name}</h3>
                      <span className="font-bold text-xs italic whitespace-nowrap">{item.price}</span>
                    </div>
                    <div className="grid grid-cols-2 border-t border-gray-100 pt-4 gap-4">
                      <div><label className="block mb-1 text-gray-400">Color</label><p className="text-[11px] font-bold uppercase">{item.color || 'N/A'}</p></div>
                      <div><label className="block mb-1 text-gray-400">Delivery</label><p className="text-[11px] font-bold uppercase">{item.lead_time || 'TBD'}</p></div>
                    </div>
                    <div><label className="block mb-1 text-gray-400 font-bold uppercase text-[9px] tracking-widest">Specs</label><p className="text-[11px] font-medium font-mono leading-relaxed">{item.dimensions}</p></div>
                    {item.pdf_url && (
                      <a href={item.pdf_url} target="_blank" className="inline-flex items-center gap-2 bg-red-50 px-3 py-1.5 border border-red-100 hover:bg-red-600 hover:text-white transition-all group/pdf">
                        <div className="w-1.5 h-1.5 bg-red-600 group-hover/pdf:bg-white transition-colors"></div>
                        <span className="text-[9px] font-black uppercase">PDF SPEC SHEET</span>
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
