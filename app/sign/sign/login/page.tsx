'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Սխալ էլ-փոստ կամ գաղտնաբառ");
        setIsLoading(false);
      } else {
        const session = await getSession();
        const role = (session?.user as any)?.role;

        if (role === 'admin') {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      }
    } catch (err) {
      setError("Տեղի է ունեցել անսպասելի սխալ");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-200 p-4 font-sans text-slate-900 relative overflow-hidden">
      
      {/* Ֆոնային դեկորատիվ էլեմենտ */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-400 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[450px] bg-slate-50 p-12 rounded-[3.5rem] shadow-2xl border border-slate-300 relative z-10">
        
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-500/10 rounded-[2rem] mb-6 border border-indigo-100 shadow-inner">
            <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-[0.2em] mb-3">Մուտք</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">Կառավարման համակարգ</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">
              Էլ-փոստ
            </label>
            <input 
              name="email" 
              type="email" 
              placeholder="example@asue.am"
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all bg-white text-slate-900 font-bold text-sm shadow-sm placeholder:text-slate-300" 
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">
              Գաղտնաբառ
            </label>
            <input 
              name="password" 
              type="password" 
              placeholder="••••••••"
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all bg-white text-slate-900 font-bold text-sm shadow-sm placeholder:text-slate-300" 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 flex justify-center items-center gap-3 mt-8
              ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Մշակվում է...
              </>
            ) : "Մուտք գործել"}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 text-center animate-shake">
            <p className="text-[10px] font-black text-red-600 uppercase tracking-wider">{error}</p>
          </div>
        )}

        <div className="mt-10 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">
            Դեռ հաշիվ չունե՞ք <br />
            <Link href="/sign/sign/signup" className="text-indigo-600 hover:text-indigo-800 transition-colors border-b-2 border-indigo-100 pb-0.5">
              Ստեղծել նոր հաշիվ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}