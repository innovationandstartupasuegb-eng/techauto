'use client'
import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react'; // Ավելացրել ենք getSession
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // 1. Մուտք գործելու փորձ
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Սխալ էլ-փոստ կամ գաղտնաբառ");
    } else {
      // 2. Մուտքը հաջողվեց, ստանում ենք թարմ սեսիան
      const session = await getSession();
      
      // 3. Ստուգում ենք դերը
      const role = (session?.user as any)?.role;

      // 4. Ըստ դերի ուղղորդում ենք
      if (role === 'admin') {
        router.push("/admin"); // Ադմինի էջը
      } else {
        router.push("/dashboard"); // Սովորական օգտատիրոջ էջը
      }
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Մուտք համակարգ</h1>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Էլ-փոստ</label>
            <input name="email" type="email" className="w-full p-3 rounded-lg border border-gray-200" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Գաղտնաբառ</label>
            <input name="password" type="password" className="w-full p-3 rounded-lg border border-gray-200" required />
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition">
            Մուտք գործել
          </button>
        </form>

        {error && <p className="mt-4 text-center text-sm font-medium text-red-600">{error}</p>}

        <div className="mt-6 text-center text-sm text-gray-600">
          Դեռ հաշիվ չունե՞ք <Link href="/sign/sign/signup" className="text-blue-600 font-semibold hover:underline">Գրանցվել</Link>
        </div>
      </div>
    </div>
  );
}