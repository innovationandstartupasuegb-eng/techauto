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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-50 rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 border border-white relative overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Վերնագիր */}
        <h2 className="text-2xl font-black mb-8 text-slate-800 uppercase tracking-tight border-b border-slate-200 pb-4">
          {asset ? "Խմբագրել սարքը" : "Նոր սարքավորում"}
        </h2>
        
        <form action={action} className="space-y-5">
          {/* Անվանում */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Անվանում</label>
            <input 
              name="name" 
              defaultValue={asset?.name} 
              placeholder="Օր. Laptop, Projector..." 
              className="w-full border border-slate-200 rounded-2xl p-4 text-sm font-bold bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm" 
              required 
            />
          </div>

          {/* Մոդել */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Մոդել</label>
            <input 
              name="model" 
              defaultValue={asset?.model} 
              placeholder="Օր. MacBook Pro, Dell XPS..." 
              className="w-full border border-slate-200 rounded-2xl p-4 text-sm font-bold bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm" 
              required 
            />
          </div>

          {/* Սերիական համար */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Սերիական համար</label>
            <input 
              name="serial_number" 
              defaultValue={asset?.serial_number} 
              placeholder="S/N: XXXXXXXX" 
              className="w-full border border-slate-200 rounded-2xl p-4 text-xs font-mono font-bold bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm" 
              required 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Կարգավիճակ */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Կարգավիճակ</label>
              <select 
                name="status" 
                defaultValue={asset?.status || "Available"} 
                className="w-full border border-slate-200 rounded-2xl p-4 text-xs font-black bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm cursor-pointer"
              >
                <option value="Available">Ազատ</option>
                <option value="Reserved">Զբաղված</option>
              </select>
            </div>

            {/* Տեղակայում */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Վայրը</label>
              <select 
                name="current_location" 
                defaultValue={asset?.current_location || "TechSupport"} 
                className="w-full border border-slate-200 rounded-2xl p-4 text-xs font-black bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm cursor-pointer"
              >
                <option value="TechSupport">Tech Support</option>
                <option value="Department">Ամբիոն</option>
              </select>
            </div>
          </div>

          {/* Գործողության կոճակներ */}
          <div className="flex gap-6 pt-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 text-slate-400 font-black hover:text-slate-600 transition-colors uppercase text-xs tracking-widest"
            >
              Չեղարկել
            </button>
            <button 
              type="submit" 
              className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all uppercase text-[11px] tracking-widest"
            >
              Պահպանել
            </button>
          </div>

          {/* Հաղորդագրություն */}
          {state.message && (
            <div className={`text-center p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border animate-pulse ${
              state.success ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
            }`}>
              {state.message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}