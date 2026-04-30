'use client'
import { useActionState } from 'react';
import { registerUser } from "@/app/actions/auth";
import Link from 'next/link'; // 1. Ավելացրել ենք Link-ի import-ը

export default function SignupPage() {
  const [state, formAction] = useActionState(registerUser, null);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Գրանցում</h1>
      
      <form action={formAction} className="flex flex-col gap-4 w-80">
        <input name="email" type="email" placeholder="Էլ-փոստ" required className="border p-2 rounded" />
        <input name="password" type="password" placeholder="Գաղտնաբառ" required className="border p-2 rounded" />
        
        <select name="role" className="border p-2 rounded">
          <option value="student">Ուսանող</option>
          <option value="lecturer">Դասախոս</option>
          <option value="staff">Վարչական աշխատող</option>
        </select>
        
        <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition">
          Գրանցվել
        </button>
      </form>

      {/* 2. Ավելացրել ենք վերադարձի հղումը */}
      <div className="mt-4">
        <Link href="/sign/sign/login" className="text-sm text-gray-500 hover:text-blue-600 underline">
          ← Վերադառնալ
        </Link>
      </div>

      {/* Ցույց ենք տալիս արդյունքը */}
      {state && (
        <p className={`mt-4 ${state.success ? 'text-green-600' : 'text-red-600'}`}>
          {state.message}
        </p>
      )}
    </div>
  );
}