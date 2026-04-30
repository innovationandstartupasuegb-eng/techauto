'use client'

import { useActionState, useEffect } from "react";
import { addAsset, editAsset } from "@/app/actions/assets";

export default function AssetModal({ asset, onClose }: { asset?: any, onClose: () => void }) {
  const actionWithId = asset ? editAsset.bind(null, asset.id) : addAsset;
  const [state, action] = useActionState(actionWithId, { message: "", success: false });

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{asset ? "Խմբագրել սարքը" : "Նոր սարք"}</h2>
        
        <form action={action} className="flex flex-col gap-4">
          <input name="name" defaultValue={asset?.name} placeholder="Անուն" className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
          <input name="model" defaultValue={asset?.model} placeholder="Մոդել" className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
          <input name="serial_number" defaultValue={asset?.serial_number} placeholder="Սերիական համար" className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
          
          <select name="status" defaultValue={asset?.status || "Available"} className="p-3 border rounded-lg outline-none">
            <option value="Available">Ազատ (Available)</option>
            <option value="Reserved">Զբաղված (Reserved)</option>
          </select>

          <select name="current_location" defaultValue={asset?.current_location || "TechSupport"} className="p-3 border rounded-lg outline-none">
            <option value="TechSupport">Tech Support</option>
            <option value="Department">Ամբիոն</option>
          </select>

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition">Չեղարկել</button>
            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition">Պահպանել</button>
          </div>
          {state.message && <p className={`text-sm ${state.success ? 'text-green-600' : 'text-red-600'}`}>{state.message}</p>}
        </form>
      </div>
    </div>
  );
}