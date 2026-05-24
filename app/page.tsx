"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SpecuroApp() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  
  // 登录/注册表单状态
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInvitationCode] = useState("");
  const [view, setView] = useState("login"); // login | signup

  useEffect(() => {
    // 检查登录状态
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchData();
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchData();
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // 这里的查询不需要手动带 user_id，Supabase RLS 会自动帮你过滤
    const { data } = await supabase.from('furniture').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const handleSignUp = async () => {
    if (inviteCode.toUpperCase() !== "SPECURO-BETA") {
      alert("INVALID INVITATION CODE.");
      return;
    }
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check your email for confirmation!");
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  // --- 场景 A: 登录/注册界面 ---
  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white text-black p-6">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black italic tracking-tighter">SPECURO.</h1>
          <p className="text-[10px] tracking-[0.3em] text-gray-400 uppercase mt-2">Private Sourcing Library</p>
        </div>
        
        <div className="w-full max-w-sm space-y-4">
          <input type="email" placeholder="EMAIL" className="w-full border-b border-black py-3 text-sm font-bold outline-none" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="PASSWORD" className="w-full border-b border-black py-3 text-sm font-bold outline-none" value={password} onChange={e => setPassword(e.target.value)} />
          
          {view === "signup" && (
            <input type="text" placeholder="INVITATION CODE" className="w-full border-b border-black py-3 text-sm font-bold outline-none text-red-600" value={inviteCode} onChange={e => setInvitationCode(e.target.value)} />
          )}

          <button onClick={view === "login" ? handleLogin : handleSignUp} className="w-full bg-black text-white py-4 text-[11px] font-black tracking-widest uppercase hover:bg-gray-800 transition-all">
            {view === "login" ? "Sign In" : "Request Access"}
          </button>

          <button onClick={() => setView(view === "login" ? "signup" : "login")} className="w-full text-[9px] font-bold text-gray-400 uppercase tracking-tighter hover:text-black">
            {view === "login" ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    );
  }

  // --- 场景 B: 个人看板界面 ---
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-black px-10 py-6 flex justify-between items-center">
        <div className="text-2xl font-black italic tracking-tighter uppercase">SPECURO.</div>
        <div className="flex items-center gap-8">
           <span className="text-[10px] font-bold text-gray-400">{user.email}</span>
           <button onClick={() => supabase.auth.signOut()} className="text-[10px] font-bold border border-black px-2 py-1 hover:bg-black hover:text-white">LOGOUT</button>
        </div>
      </nav>

      <main className="pt-40 pb-40 px-10 max-w-[1600px] mx-auto">
        <header className="mb-20 flex justify-between items-end">
          <div>
            <h2 className="text-6xl font-black tracking-tighter mb-4">MY ARCHIVE.</h2>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Personal Collection / {items.length} items</p>
          </div>
          <a href="/specuro-clipper.zip" download className="bg-black text-white text-[10px] font-black px-6 py-3 tracking-widest uppercase hover:bg-red-600 transition-colors">Download Clipper</a>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-20">
          {items.map((item) => (
            <div key={item.id} className="group">
              {/* 取消了 grayscale (灰度)，直接显示原图颜色 */}
              <div className="aspect-[3/4] bg-gray-50 border border-transparent group-hover:border-black transition-all overflow-hidden mb-6 relative">
                <img src={item.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <a href={item.source_url} target="_blank" className="absolute top-4 right-4 bg-black text-white text-[8px] p-2 font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase">Source ↗</a>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-sm font-black leading-tight uppercase">{item.name}</h3>
                  <span className="font-bold text-xs italic">{item.price}</span>
                </div>
                <div className="grid grid-cols-2 border-t border-gray-100 pt-4 gap-4">
                  <div><label className="text-[9px] font-bold text-gray-400 block uppercase">Finish</label><p className="text-[11px] font-bold uppercase">{item.color}</p></div>
                  <div><label className="text-[9px] font-bold text-gray-400 block uppercase">Lead Time</label><p className="text-[11px] font-bold uppercase">{item.lead_time}</p></div>
                </div>
                <div><label className="text-[9px] font-bold text-gray-400 block uppercase">Specs</label><p className="text-[11px] font-medium font-mono">{item.dimensions}</p></div>
                {item.pdf_url && (
                  <a href={item.pdf_url} target="_blank" className="inline-flex items-center gap-2 bg-red-50 px-2 py-1">
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
