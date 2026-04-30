'use client'

import { useActionState } from "react";
import { addAsset } from "@/app/actions/assets";

export default function AddAssetForm() {
  const [state, action] = useActionState(addAsset, { message: "", success: false });

  return (
    <>
      {/* Ծանուցումը երևում է միայն այն ժամանակ, երբ state-ը հաղորդագրություն է ստանում */}
      {state.message && (
        <div className={`p-4 mb-4 rounded border ${state.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {state.message}
        </div>
      )}

      <form action={action} className="bg-white p-6 rounded-xl shadow-md border mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="name" placeholder="Սարքի անուն" className="p-2 border rounded" required />
        <input name="model" placeholder="Մոդել" className="p-2 border rounded" required />
        <input name="serial_number" placeholder="Սերիական համար" className="p-2 border rounded" required />
        
        <select name="status" className="p-2 border rounded">
          <option value="Available">Ազատ (Available)</option>
          <option value="Reserved">Զբաղված (Reserved)</option>
        </select>

        <select name="current_location" className="p-2 border rounded">
          <option value="TechSupport">Tech Support</option>
          <option value="Department">Ամբիոն</option>
        </select>

        <button type="submit" className="md:col-span-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
          Ավելացնել տեխնիկան
        </button>
      </form>
    </>
  );
}