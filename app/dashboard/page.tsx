'use client';

import Link from 'next/link';

export default function UserDashboard() {
  const menuItems = [
    { 
      title: 'Ամրագրել տեխնիկա', 
      path: '/reserve', 
      icon: (
        <div className="p-4 bg-indigo-500/10 rounded-2xl group-hover:bg-indigo-600 transition-all duration-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      ),
      description: 'Ընտրել և ամրագրել նոր սարք' 
    },
    { 
      title: 'Իմ ամրագրումները', 
      path: '/myreservations', 
      icon: (
        <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-600 transition-all duration-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      ),
      description: 'Դիտել կցված սարքերի ցանկը' 
    },
  ];

  return (
    // Ֆոնը՝ հանգիստ Slate-100/200, որը սպիտակ չէ
    <div className="p-8 bg-slate-200 min-h-screen flex flex-col items-center justify-center font-sans relative">
      
      {/* Վերնագրի հատված */}
      <div className="w-full max-w-4xl text-center mb-16 relative z-10">
        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-[0.2em] mb-4">
          Անձնական էջ
        </h1>
        <div className="flex items-center justify-center gap-4">
          <div className="h-[2px] w-12 bg-indigo-600" />
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.4em]">
            Օգտատիրոջ վահանակ
          </span>
          <div className="h-[2px] w-12 bg-indigo-600" />
        </div>
      </div>

      {/* Քարտերի ցանց */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-4xl relative z-10">
        {menuItems.map((item) => (
          <Link href={item.path} key={item.title} className="group">
            {/* Քարտերը՝ բաց մոխրագույն/կապտավուն երանգով, ոչ սպիտակ */}
            <div className="bg-slate-50 border border-slate-300 p-12 rounded-[3rem] shadow-xl hover:shadow-2xl hover:border-indigo-400 hover:-translate-y-3 transition-all duration-500 flex flex-col items-center text-center h-full relative overflow-hidden">
              
              <div className="mb-8 transform group-hover:scale-110 transition-all duration-500 relative z-10">
                {item.icon}
              </div>
              
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 px-2 group-hover:text-indigo-600 transition-colors">
                {item.title}
              </h2>
              
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-12 opacity-80">
                {item.description}
              </p>

              {/* Կոճակը սկզբում՝ Slate-200 */}
              <div className="mt-auto w-full px-6 relative z-10">
                <div className="bg-slate-200 text-slate-500 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] 
                  transition-all duration-500 border border-slate-300/50
                  group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-indigo-200 group-hover:border-transparent">
                  Բացել
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}