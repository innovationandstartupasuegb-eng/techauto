'use client'
import { useActionState } from 'react';
import { registerUser } from "@/app/actions/auth";
import Link from 'next/link';

export default function SignupPage() {
  // state-ը կպահի սերվերից եկած պատասխանը (success կամ message)
  const [state, formAction, isPending] = useActionState(registerUser, null);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-200 p-4 font-sans">
      
      {/* Գրանցման քարտը */}
      <div className="w-full max-w-md bg-slate-50 border border-slate-300 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
        
        {/* Դեկորատիվ Indigo տարր */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-widest mb-2">
            Գրանցում
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
            Ստեղծել նոր հաշիվ
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-5">
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest">Անուն Ազգանուն</label>
            <input 
              name="full_name" 
              placeholder="Արամ Արամյան" 
              className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm text-slate-800 placeholder:text-slate-300" 
              required 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest">Էլ-փոստ</label>
            <input 
              name="email" 
              type="email" 
              placeholder="example@asue.am" 
              className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm text-slate-800 placeholder:text-slate-300" 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest">Հեռախոս</label>
              <input 
                name="phone_number" 
                type="tel" 
                placeholder="094..." 
                className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm text-slate-800" 
                required 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest">Կարգավիճակ</label>
              <select 
                name="role" 
                className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm text-slate-800 appearance-none"
              >
                <option value="STUDENT">Ուսանող</option>
                <option value="LECTURER">Դասախոս</option>
                <option value="STAFF">Աշխատակից</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest">Գաղտնաբառ</label>
            <input 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm text-slate-800 placeholder:text-slate-300" 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-100 transition-all active:scale-95 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Մշակվում է...' : 'Գրանցվել'}
          </button>
        </form>

        {/* Սխալների կամ հաջողության հաղորդագրություն */}
        {state && (
          <div className={`mt-6 p-4 rounded-xl text-center text-[10px] font-black uppercase tracking-widest border ${
            state.success ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
          }`}>
            {state.message}
          </div>
        )}

        <div className="text-center mt-8">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Արդեն ունե՞ք հաշիվ: {' '}
            <Link href="/login" className="text-indigo-600 hover:underline">Մուտք գործել</Link>
          </p>
        </div>
      </div>
    </div>
  );
}