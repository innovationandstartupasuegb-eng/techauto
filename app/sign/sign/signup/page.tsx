'use client'
import { useActionState } from 'react';
import { registerUser } from "@/app/actions/auth";
import Link from 'next/link';

export default function SignupPage() {
  const [state, formAction] = useActionState(registerUser, null);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Գրանցում</h1>
      
      <form action={formAction} className="flex flex-col gap-4 w-80">
        {/* Անուն Ազգանուն */}
        <input 
          name="full_name" 
          type="text" 
          placeholder="Անուն Ազգանուն" 
          required 
          className="border p-2 rounded focus:outline-blue-500" 
        />

        {/* Հեռախոսահամար */}
        <input 
          name="phone_number" 
          type="tel" 
          placeholder="Հեռախոսահամար" 
          required 
          className="border p-2 rounded focus:outline-blue-500" 
        />

        {/* Էլ-փոստ */}
        <input 
          name="email" 
          type="email" 
          placeholder="Էլ-փոստ" 
          required 
          className="border p-2 rounded focus:outline-blue-500" 
        />

        {/* Գաղտնաբառ */}
        <input 
          name="password" 
          type="password" 
          placeholder="Գաղտնաբառ" 
          required 
          className="border p-2 rounded focus:outline-blue-500" 
        />
        
        {/* Դեր (Role) */}
        <select name="role" className="border p-2 rounded focus:outline-blue-500 bg-white">
          <option value="student">Ուսանող</option>
          <option value="lecturer">Դասախոս</option>
          <option value="staff">Վարչական աշխատող</option>
        </select>
        
        <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition font-medium">
          Գրանցվել
        </button>
      </form>

      {/* Վերադարձի հղում */}
      <div className="mt-4">
        <Link href="/sign/sign/login" className="text-sm text-gray-500 hover:text-blue-600 underline">
          ← Արդեն ունե՞ք հաշիվ։ Մուտք գործել
        </Link>
      </div>

      {/* Հաղորդագրություն սերվերից */}
      {state && (
        <p className={`mt-4 text-sm font-medium ${state.success ? 'text-green-600' : 'text-red-600'}`}>
          {state.message}
        </p>
      )}
    </div>
  );
}