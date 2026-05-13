'use client'
import { useActionState } from 'react';
import { registerUser } from "@/app/actions/auth";
import Link from 'next/link';

export default function SignupPage() {
  // Ավելացնում ենք isPending-ը՝ կոճակի վիճակը կառավարելու համար
  const [state, formAction, isPending] = useActionState(registerUser, null);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-200 p-6 font-sans text-slate-900 relative overflow-hidden">
      
      {/* Դեկորատիվ էլեմենտներ ֆոնի համար */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px]" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[80px]" />

      <div className="w-full max-w-lg bg-slate-50 border border-slate-300 rounded-[3.5rem] p-12 shadow-2xl relative z-10">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white border border-slate-200 rounded-2xl mb-4 shadow-sm text-indigo-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-widest mb-2">Գրանցում</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Ստեղծել նոր հաշիվ համակարգում</p>
        </div>
        
        <form action={formAction} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Անուն Ազգանուն */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest">Անուն Ազգանուն</label>
            <input 
              name="full_name" 
              type="text" 
              placeholder="Արամ Արամյան" 
              required 
              className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-sm placeholder:text-slate-300" 
            />
          </div>

          {/* Հեռախոսահամար */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest">Հեռախոս</label>
            <input 
              name="phone_number" 
              type="tel" 
              placeholder="094..." 
              required 
              className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-sm placeholder:text-slate-300" 
            />
          </div>

          {/* Դեր (Role) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest">Կարգավիճակ</label>
            <select name="role" className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-sm appearance-none cursor-pointer">
              <option value="student">Ուսանող</option>
              <option value="lecturer">Դասախոս</option>
              <option value="staff">Աշխատակից</option>
            </select>
          </div>

          {/* Էլ-փոստ */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest">Էլ-փոստ</label>
            <input 
              name="email" 
              type="email" 
              placeholder="example@asue.am" 
              required 
              className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-sm placeholder:text-slate-300" 
            />
          </div>

          {/* Գաղտնաբառ */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest">Գաղտնաբառ</label>
            <input 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              required 
              className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-sm placeholder:text-slate-300" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isPending}
            className="md:col-span-2 bg-indigo-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all mt-4 disabled:opacity-50"
          >
            {isPending ? 'Գրանցվում է...' : 'Ստեղծել հաշիվ'}
          </button>
        </form>

        <div className="mt-10 text-center">
          <Link href="/sign/sign/login" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors border-b-2 border-slate-200 hover:border-indigo-100 pb-1">
            ← Արդեն ունե՞ք հաշիվ։ Մուտք
          </Link>
        </div>

        {state && (
          <div className={`mt-8 p-4 rounded-2xl text-center border animate-in fade-in slide-in-from-top-2 ${
            state.success ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'
          }`}>
            <p className="text-[10px] font-black uppercase tracking-wider">{state.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}