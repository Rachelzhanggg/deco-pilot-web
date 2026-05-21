import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase 客户端
const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

export default async function HomePage() {
  const supabase = getSupabase();
  
  if (!supabase) {
    return (
      <div className="p-20 text-center text-gray-500">
        <h1 className="text-xl font-bold">Configuration Missing</h1>
        <p>Please check your Vercel Environment Variables.</p>
      </div>
    );
  }

  // 获取数据库中的家具数据
  const { data: items, error } = await supabase
    .from('furniture')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#121212]">
      {/* 顶部导航 */}
      <nav className="border-b border-gray-200 px-8 py-6 flex justify-between items-center bg-white">
        <div className="text-xl font-bold tracking-tighter italic">DecorPilot <span className="text-xs font-normal text-gray-400 not-italic">Archive</span></div>
        <div className="text-xs text-gray-400 font-medium uppercase tracking-widest">Global Sourcing Tool</div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-16">
        <header className="mb-16">
          <h1 className="text-5xl font-serif mb-4 tracking-tight">Collection</h1>
          <p className="text-gray-400 text-lg">Your curated library of sourced furniture pieces.</p>
        </header>

        {error || !items || items.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-gray-100 rounded-3xl">
            <p className="text-gray-300 italic">No pieces collected yet. Start clipping!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {items.map((item) => (
              <div key={item.id} className="group transition-all">
                <div className="aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden mb-4 shadow-sm">
                  <img 
                    src={item.image_url || 'https://via.placeholder.com/400x500'} 
                    alt={item.type}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">{item.style}</p>
                  <h3 className="text-lg font-medium text-gray-900 leading-tight">{item.type}</h3>
                  <p className="text-sm text-gray-500 mt-1 font-mono">{item.dimensions}</p>
                  <a 
                    href={item.source_url} 
                    target="_blank" 
                    className="mt-4 inline-block text-[10px] font-bold uppercase tracking-tighter border-b border-black pb-0.5 hover:text-gray-400 hover:border-gray-400 transition-colors"
                  >
                    Source Link
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="mt-40 py-20 text-center border-t border-gray-50">
        <p className="text-[10px] text-gray-300 uppercase tracking-[0.2em]">Powered by DecorPilot AI Agent</p>
      </footer>
    </div>
  );
}
