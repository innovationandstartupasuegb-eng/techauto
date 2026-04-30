'use client'

import { useState } from "react";
import AssetModal from "./AssetModal";
import { deleteAsset } from "@/app/actions/assets";

export default function ManageClient({ assets }: { assets: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);

  // Ֆիլտրերի state-երը
  const [nameFilter, setNameFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");

  // Ֆիլտրման տրամաբանություն
  const filteredAssets = assets.filter(asset => {
    const matchName = nameFilter === "All" || asset.name === nameFilter;
    const matchStatus = statusFilter === "All" || asset.status === statusFilter;
    const matchLocation = locationFilter === "All" || asset.current_location === locationFilter;
    return matchName && matchStatus && matchLocation;
  });

  // Ստանում ենք եզակի (unique) արժեքները
  const uniqueNames = Array.from(new Set(assets.map(a => a.name)));
  const uniqueStatuses = Array.from(new Set(assets.map(a => a.status)));
  const uniqueLocations = Array.from(new Set(assets.map(a => a.current_location)));

  return (
    <div className="p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800">Տեխնիկայի կառավարում</h1>
        <button 
          onClick={() => { setEditingAsset(null); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg shadow-lg"
        >
          + Ավելացնել սարք
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 text-gray-600 uppercase text-sm font-semibold">
            <tr>
              {/* Անունի ֆիլտր (Dropdown) */}
              <th className="p-4">
                <select className="bg-transparent border-none cursor-pointer" onChange={(e) => setNameFilter(e.target.value)}>
                  <option value="All">Անուն</option>
                  {uniqueNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </th>
              
              <th className="p-4">Մոդել</th>
              <th className="p-4">Սերիական համար</th>
              
              {/* Վայրի ֆիլտր */}
              <th className="p-4">
                <select className="bg-transparent border-none cursor-pointer" onChange={(e) => setLocationFilter(e.target.value)}>
                  <option value="All">Վայրը</option>
                  {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </th>
              
              {/* Ստատուսի ֆիլտր */}
              <th className="p-4">
                <select className="bg-transparent border-none cursor-pointer" onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">Կարգավիճակ</option>
                  {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </th>
              
              <th className="p-4 text-right">Գործողություններ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredAssets.map((asset) => (
              <tr key={asset.id} className="hover:bg-blue-50 transition-colors">
                <td className="p-4 font-medium text-gray-900">{asset.name}</td>
                <td className="p-4 text-gray-600">{asset.model}</td>
                <td className="p-4 text-gray-600">{asset.serial_number}</td>
                <td className="p-4">{asset.current_location}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${asset.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {asset.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-3">
                  <button onClick={() => { setEditingAsset(asset); setIsModalOpen(true); }} className="text-blue-600 hover:underline">Խմբագրել</button>
                  <button onClick={() => deleteAsset(asset.id)} className="text-red-500 hover:underline">Ջնջել</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && <AssetModal asset={editingAsset} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}