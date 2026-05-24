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

  // 注册/登录表单
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInvitationCode] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // 1. 监听登录态
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  // 2. 登录后获取数据
  useEffect(() => {
    if (user) fetchData();
    else { setItems([]); setFilteredItems([]); }
  }, [user, activeCategory, activeStyle]);

  const fetchData = async () => {
    setLoading(true);
    // 关键：由于开启了 RLS，Supabase 会自动根据当前登录的 Session 过滤数据
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
      if (inviteCode.toUpperCase() !== "SPECURO-BETA") { alert("INVALID CODE"); return; }
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else if (data.user) setUser(data.user);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
  };

  // --- 登录界面 ---
  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white text-black p-10">
        <h1 className="text-6xl font-black italic tracking-tighter uppercase mb-10">Specuro.</h1>
        <div className="w-full max-w-xs space-y-4">
          <input type="email" placeholder="EMAIL" className="w-full border-b border-black py-3 text-sm font-bold outline-none" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="PASSWORD" className="w-full border-b border-black py-3 text-sm font-bold outline-none" value={password} onChange={e => setPassword(e.target.value)} />
          {isSignUp && <input type="text" placeholder="BETA CODE" className="w-full border-b border-black py-3 text-sm font-bold outline-none text-red-600 uppercase" value={inviteCode} onChange={e => setInvitationCode(e.target.value)} />}
          <button onClick={handleAuth} className="w-full bg-black text-white py-4 text-[10px] font-black tracking-widest uppercase">{isSignUp ? "Register" : "Sign In"}</button>
          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{isSignUp ? "Back" : "Need access? Request Code"}</button>
        </div>
      </div>
    );
  }

  // --- 主 Archive 界面 ---
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-black px-10 py-6 flex justify-between items-center">
        <div className="text-2xl font-black italic tracking-tighter uppercase">Specuro.</div>
        
        <div className="flex items-center gap-10">
          {/* 隐私 Token 显示 */}
          <div className="flex flex-col items-end mr-4">
            <span className="text-[8px] text-gray-400 font-bold uppercase mb-1 tracking-tighter">Plugin Token:</span>
            <div className="flex items-center gap-2">
                <code 
                  className="text-[9px] font-black text-black bg-gray-50 px-2 py-1 border border-dashed border-gray-200 cursor-pointer"
                  onClick={() => { if(!showToken) return; navigator.clipboard.writeText(user.id); alert("COPIED"); }}
                >
                  {showToken ? user.id : "••••••••-••••-••••-••••"}
                </code>
                <button onClick={() => setShowToken(!showToken)} className="text-[8px] font-bold border border-black px-1.5 py-0.5 uppercase">
                    {showToken ? "Hide" : "Show"}
                </button>
            </div>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-[9px] font-black border border-black px-3 py-2 uppercase">Logout</button>
        </div>
      </nav>

      {/* 筛选控制台 */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex bg-black text-white px-8 py-4 gap-10 shadow-2xl items-center">
        <div className="flex gap-6 border-r border-gray-800 pr-10">
          {['ALL', 'SEATING', 'TABLES', 'LIGHTS', 'STORAGE'].map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`text-[9px] font-black tracking-widest ${activeCategory === cat ? 'text-red-500' : 'text-gray-500'}`}>{cat}</button>
          ))}
        </div>
        <div className="flex gap-6">
          {['ALL', 'MODERN', 'MINIMAL', 'INDUSTRIAL'].map(style => (
            <button key={style} onClick={() => setActiveStyle(style)} className={`text-[9px] font-black tracking-widest ${activeStyle === style ? 'text-white' : 'text-gray-500'}`}>{style}</button>
          ))}
        </div>
      </div>

      <main className="pt-40 pb-40 px-10 max-w-[1600px] mx-auto">
        <header className="mb-20 flex justify-between items-end">
          <div>
            <h2 className="text-7xl font-black tracking-tighter uppercase mb-4">My Archive.</h2>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em]">Personal Collection / {filteredItems.length} items</p>
          </div>
          <a href="/specuro-clipper.zip" download className="bg-red-600 text-white text-[10px] font-black px-6 py-3 tracking-widest uppercase hover:bg-black transition-all">Download Clipper</a>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-24">
          {filteredItems.map((item) => (
            <div key={item.id} className="group">
              <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden mb-6 border border-transparent group-hover:border-black transition-all duration-500">
                <img src={item.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <a href={item.source_url} target="_blank" className="absolute top-4 right-4 bg-black text-white text-[8px] p-2 font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Source ↗</a>
              </div>
              <div className="space-y-4 text-black text-left">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-sm font-black leading-tight uppercase line-clamp-2">{item.name}</h3>
                  <span className="font-bold text-xs italic whitespace-nowrap">{item.price}</span>
                </div>
                <div className="grid grid-cols-2 border-t border-gray-100 pt-4 gap-4">
                  <div><label className="block mb-1 text-[9px] text-gray-400 uppercase">Finish</label><p className="text-[11px] font-bold uppercase">{item.color || 'N/A'}</p></div>
                  <div><label className="block mb-1 text-[9px] text-gray-400 uppercase">Delivery</label><p className="text-[11px] font-bold uppercase">{item.lead_time || 'TBD'}</p></div>
                </div>
                <div><label className="block mb-1 text-[9px] text-gray-400 uppercase">Technical Specs</label><p className="text-[11px] font-medium font-mono leading-relaxed">{item.dimensions}</p></div>
                {item.pdf_url && (
                  <a href={item.pdf_url} target="_blank" className="inline-flex items-center gap-2 bg-red-50 px-3 py-1.5 border border-red-100 transition-all hover:bg-red-600 group/pdf">
                    <div className="w-1.5 h-1.5 bg-red-600 group-hover/pdf:bg-white"></div>
                    <span className="text-[9px] font-black text-red-600 group-hover/pdf:text-white uppercase tracking-tighter">PDF SPEC SHEET</span>
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
