'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import AssetModal from "./AssetModal";
import { deleteAsset } from "@/app/actions/assets";
import { ChevronLeft, Plus, Monitor, Settings2 } from 'lucide-react';

export default function ManageClient({ assets }: { assets: any[] }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);

  const [nameFilter, setNameFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");

  const filteredAssets = assets.filter(asset => {
    const matchName = nameFilter === "All" || asset.name === nameFilter;
    const matchStatus = statusFilter === "All" || asset.status === statusFilter;
    const matchLocation = locationFilter === "All" || asset.current_location === locationFilter;
    return matchName && matchStatus && matchLocation;
  });

  const uniqueNames = Array.from(new Set(assets.map(a => a.name)));
  const uniqueStatuses = Array.from(new Set(assets.map(a => a.status)));
  const uniqueLocations = Array.from(new Set(assets.map(a => a.current_location)));

  return (
    <div className="bg-slate-200 min-h-screen font-sans text-slate-900 pb-12">
      
      {/* Թարմացված Navbar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-300 px-6 py-6 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-slate-500 hover:text-indigo-600 transition-all font-black uppercase text-[10px] tracking-widest group"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="ml-1">Հետ դեպի գլխավոր</span>
          </button>

          <div className="text-right">
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2 justify-end">
              <Settings2 size={20} className="text-indigo-600" />
              Տեխնիկայի Կառավարում
            </h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Հաշվառված սարքավորումների ամբողջական բազա
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-[1400px] mx-auto">
        
        {/* Ավելացնել կոճակը և վերնագիրը (տողի տակ) */}
        <div className="flex justify-end mb-8">
          <button 
            onClick={() => { setEditingAsset(null); setIsModalOpen(true); }} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-[1.5rem] font-black shadow-xl shadow-indigo-200 transition-all active:scale-95 text-[11px] uppercase tracking-widest flex items-center gap-2"
          >
            <Plus size={16} strokeWidth={3} />
            Ավելացնել նոր սարք
          </button>
        </div>

        {/* Աղյուսակի բլոկը */}
        <div className="bg-slate-50 rounded-[2.5rem] shadow-2xl border border-slate-300 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100/80 border-b border-slate-200">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="p-6">Անվանում</th>
                <th className="p-6">Մոդել</th>
                <th className="p-6">Սերիական համար</th>
                <th className="p-6">Վայրը</th>
                <th className="p-6">Կարգավիճակ</th>
                <th className="p-6 w-[200px]">Գործողություն</th>
              </tr>
              {/* Ֆիլտրման տող */}
              <tr className="bg-white/50 border-b border-slate-100">
                <th className="px-6 pb-4 pt-2">
                  <select 
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black outline-none focus:ring-2 focus:ring-indigo-500/10 bg-white transition-all shadow-sm cursor-pointer"
                    onChange={(e) => setNameFilter(e.target.value)}
                  >
                    <option value="All">Բոլորը</option>
                    {uniqueNames.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                </th>
                <th colSpan={2}></th>
                <th className="px-6 pb-4 pt-2">
                  <select 
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black outline-none focus:ring-2 focus:ring-indigo-500/10 bg-white transition-all shadow-sm cursor-pointer"
                    onChange={(e) => setLocationFilter(e.target.value)}
                  >
                    <option value="All">Բոլորը</option>
                    {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </th>
                <th className="px-6 pb-4 pt-2">
                  <select 
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black outline-none focus:ring-2 focus:ring-indigo-500/10 bg-white transition-all shadow-sm cursor-pointer"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">Բոլորը</option>
                    {uniqueStatuses.map(s => <option key={s} value={s}>{s === 'Available' ? 'Ազատ' : 'Զբաղված'}</option>)}
                  </select>
                </th>
                <th></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white/30 backdrop-blur-sm">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-32 text-center text-slate-300 font-black uppercase tracking-[0.3em] italic">
                    Սարքավորումներ չեն գտնվել
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-indigo-50/50 transition-all duration-300 group">
                    <td className="p-6 text-sm font-black text-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                          <Monitor size={14} className="text-slate-400 group-hover:text-indigo-600" />
                        </div>
                        {asset.name}
                      </div>
                    </td>
                    <td className="p-6 text-sm font-bold text-slate-500">{asset.model}</td>
                    <td className="p-6 text-xs font-mono font-bold text-slate-400 tracking-tighter">{asset.serial_number}</td>
                    <td className="p-6 text-[11px] font-black text-slate-600 uppercase tracking-wider">{asset.current_location}</td>
                    <td className="p-6">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border shadow-sm inline-block tracking-widest ${
                        asset.status === 'Available' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {asset.status === 'Available' ? 'Ազատ' : 'Զբաղված'}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex gap-5 items-center">
                        <button 
                          onClick={() => { setEditingAsset(asset); setIsModalOpen(true); }} 
                          className="text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-widest transition-colors"
                        >
                          Խմբագրել
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm('Վստա՞հ եք, որ ուզում եք ջնջել սարքը:')) deleteAsset(asset.id);
                          }} 
                          className="text-slate-400 hover:text-red-500 font-black text-[10px] uppercase tracking-widest transition-colors"
                        >
                          Ջնջել
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && <AssetModal asset={editingAsset} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}