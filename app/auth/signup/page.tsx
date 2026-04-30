'use client'
import { useActionState } from 'react'; // Համոզվիր, որ սա ներմուծված է
import { registerUser } from "@/app/actions/auth";

export default function SignupPage() {
  // 1. Ստեղծում ենք useActionState
  // registerUser-ը քո սերվերային ֆունկցիան է, null-ը՝ սկզբնական վիճակը
  const [state, formAction] = useActionState(registerUser, null);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Գրանցում</h1>
      
      {/* 2. action={formAction} - Սա է ճիշտը */}
      <form action={formAction} className="flex flex-col gap-4 w-80">
        <input name="email" type="email" placeholder="Էլ-փոստ" required className="border p-2" />
        <input name="password" type="password" placeholder="Գաղտնաբառ" required className="border p-2" />
        
        <select name="role" className="border p-2">
          <option value="STUDENT">Ուսանող</option>
          <option value="LECTURER">Դասախոս</option>
          <option value="STAFF">Վարչական աշխատող</option>
        </select>
        
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">Գրանցվել</button>
      </form>

      {/* 3. Ցույց տալ հաղորդագրությունը, եթե այն գոյություն ունի */}
      {state && (
        <p className={`mt-4 ${state.success ? 'text-green-600' : 'text-red-600'}`}>
          {state.message}
        </p>
      )}
    </div>
  );
}