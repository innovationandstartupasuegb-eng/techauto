'use client';

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createReservation } from "@/app/actions/reservation";

interface ReservePageProps {
  assets: any[];
  canIndefinite: boolean; 
  isActualAdmin: boolean; 
}

export default function ReservePage({ 
  assets = [], 
  canIndefinite = false, 
  isActualAdmin = false 
}: ReservePageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    assetId: "",
    date: "",
    startTime: "09:00",
    endTime: "09:20"
  });

  // 1. Սկզբի ժամերը (09:00, 09:30 ... մինչև 17:00)
  const startTimeSlots = useMemo(() => {
    const slots = [];
    for (let h = 9; h <= 17; h++) {
      const hour = h.toString().padStart(2, '0');
      slots.push(`${hour}:00`);
      if (h < 17) {
        slots.push(`${hour}:30`);
      }
    }
    return slots;
  }, []);

  // 2. Ավարտի ժամերը (09:20, 09:50 ... մինչև 17:20)
  const endTimeSlots = useMemo(() => {
    const slots = [];
    for (let h = 9; h <= 17; h++) {
      const hour = h.toString().padStart(2, '0');
      slots.push(`${hour}:20`);
      if (h < 17) {
        slots.push(`${hour}:50`);
      }
    }
    return slots;
  }, []);

  // 3. Ֆիլտրում ենք ավարտի ժամերը՝ ըստ ընտրված սկզբի
  const availableEndTimes = useMemo(() => {
    return endTimeSlots.filter(time => time > formData.startTime);
  }, [formData.startTime, endTimeSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.assetId || !formData.endTime) {
      setMessage("❌ Խնդրում եմ լրացնել բոլոր դաշտերը։");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const startDateTime = `${formData.date}T${formData.startTime}:00`;
      const endDateTime = `${formData.date}T${formData.endTime}:00`;

      await createReservation({
        assetId: formData.assetId,
        start_time: startDateTime,
        end_time: endDateTime
      });

      setMessage("✅ Ամրագրումը հաջողությամբ կատարվեց");
      
      const destination = isActualAdmin ? '/admin' : '/myreservations'; 
      
      setTimeout(() => {
        router.push(destination);
      }, 2000);

    } catch (err: any) {
      setMessage("❌ " + (err.message || "Տեղի ունեցավ սխալ։"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100 mt-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Ամրագրել տեխնիկա</h1>
      
      {message && (
        <div className={`p-4 mb-6 text-center rounded-lg font-medium border ${
          message.includes('✅') 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Սարքը</label>
          <select 
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setFormData({...formData, assetId: e.target.value})}
            value={formData.assetId}
          >
            <option value="">Ընտրեք սարքը</option>
            {(assets || []).map((asset) => (
              <option key={asset.id} value={asset.id}>{asset.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Օրը</label>
          <input 
            required
            type="date"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Սկիզբ</label>
            <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              value={formData.startTime}
            >
              {startTimeSlots.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ավարտ</label>
            <select 
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={(e) => setFormData({...formData, endTime: e.target.value})}
              value={formData.endTime}
            >
              <option value="">Ընտրել...</option>
              {availableEndTimes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <button 
          disabled={loading}
          type="submit" 
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-400"
        >
          {loading ? "Կատարվում է..." : "Հաստատել ամրագրումը"}
        </button>
      </form>
    </div>
  );
}