'use client';

import Link from 'next/link'; 
import AdminNotificationModal from "@/components/AdminNotificationModal"; 

export default function AdminDashboard() {
  const menuItems = [
    { 
      title: 'Ամրագրել տեխնիկա', 
      path: '/reserve', 
      icon: (
        <div className="p-4 bg-indigo-500/10 rounded-2xl group-hover:bg-indigo-600 transition-all duration-500 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      ),
      description: 'Նոր հայտերի գրանցում' 
    },
    { 
      title: 'Բոլոր ամրագրումները', 
      path: '/admin/reservations', 
      icon: (
        <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-600 transition-all duration-500 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
      ),
      description: 'Ընթացիկ և արխիվային կցումներ' 
    },
    { 
      title: 'Տեխնիկայի բազա', 
      path: '/admin/manage', 
      icon: (
        <div className="p-4 bg-slate-200/50 rounded-2xl group-hover:bg-slate-800 transition-all duration-500 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-700 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
      ),
      description: 'Գույքի ցանկ և խմբագրում' 
    },
  ];

  return (
    <div className="p-8 bg-slate-200 min-h-screen flex flex-col items-center justify-center font-sans relative">
      <AdminNotificationModal />

      {/* Վերնագրի հատված նոր Indigo շեշտադրմամբ */}
      <div className="w-full max-w-4xl text-center mb-16 relative z-10">
        <div className="inline-block">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-[0.2em] mb-4">
            Կառավարման վահանակ
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-[2px] w-12 bg-indigo-600" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.4em]">
              Գույքի վերահսկման համակարգ
            </span>
            <div className="h-[2px] w-12 bg-indigo-600" />
          </div>
        </div>
      </div>

      {/* Քարտերի ցանց (3 սյունակ ադմինի համար) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl relative z-10">
        {menuItems.map((item) => (
          <Link href={item.path} key={item.title} className="group">
            {/* Քարտերը՝ Slate-50 (մոխրագույն երանգով), որը տարբերվում է ֆոնից */}
            <div className="bg-slate-50 border border-slate-300 p-10 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:border-indigo-400 hover:-translate-y-3 transition-all duration-700 flex flex-col items-center text-center h-full relative overflow-hidden">
              
              <div className="mb-8 transform group-hover:scale-110 transition-transform duration-500 relative z-10">
                {item.icon}
              </div>
              
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-3 px-2 group-hover:text-indigo-600 transition-colors duration-300">
                {item.title}
              </h2>
              
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-10 opacity-75">
                {item.description}
              </p>

              {/* Կոճակի դինամիկան */}
              <div className="mt-auto w-full px-4 relative z-10">
                <div className="bg-slate-200 text-slate-500 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] 
                  transition-all duration-500 border border-slate-300/50
                  group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-emerald-200 group-hover:border-transparent text-center">
                  Բացել
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Ներքևի դեկորատիվ գիծ */}
      <div className="mt-20 opacity-20">
        <div className="h-1 w-24 bg-gradient-to-r from-transparent via-slate-500 to-transparent rounded-full" />
      </div>
    </div>
  );
}