'use client'

import { useState } from "react";
import { deleteAsset } from "@/app/actions/assets";
import AddAssetForm from "./AddAssetForm";

export default function AssetTable({ assets }: { assets: any[] }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Տեխնիկայի կառավարում</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`px-4 py-2 rounded text-white ${showForm ? 'bg-red-500' : 'bg-blue-600'}`}
        >
          {showForm ? "Փակել ֆորման" : "+ Ավելացնել սարք"}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 p-4 border border-blue-200 bg-blue-50 rounded-lg">
          <AddAssetForm />
        </div>
      )}

      <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="p-3 text-left">Անուն</th>
            <th className="p-3 text-left">Մոդել</th>
            <th className="p-3 text-left">Սերիական</th>
            <th className="p-3 text-left">Կարգավիճակ</th>
            <th className="p-3 text-right">Գործողություններ</th>
          </tr>
        </thead>
        <tbody>
          {/* Այստեղ assets-ը գալիս է որպես պարամետր, սխալ չի լինի */}
          {assets.map((asset) => (
            <tr key={asset.id} className="border-b">
              <td className="p-3">{asset.name}</td>
              <td className="p-3">{asset.model}</td>
              <td className="p-3">{asset.serial_number}</td>
              <td className="p-3">{asset.status}</td>
              <td className="p-3 text-right">
                <button onClick={() => deleteAsset(asset.id)} className="text-red-500 hover:underline">Ջնջել</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}