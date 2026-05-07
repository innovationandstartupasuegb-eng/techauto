'use client';

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createReservation, getAvailableSlots } from "@/app/actions/reservation";
import { 
  Calendar, 
  Clock, 
  Monitor, 
  Hash, 
  AlertCircle, 
  ChevronLeft, 
  CheckCircle2,
  Info
} from 'lucide-react';

interface ReservePageProps {
  assets: any[];      // Եզակի անուններով սարքեր
  allAssets: any[];   // Բոլոր սարքերը (սերիական համարների համար)
  canIndefinite: boolean; 
  isActualAdmin: boolean; 
}

export default function ReservePage({ 
  assets = [], 
  allAssets = [],
  canIndefinite = false, 
  isActualAdmin = false 
}: ReservePageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reservedSlots, setReservedSlots] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    assetName: "",    // Տեսակը (օր. Laptop HP)
    assetId: "any",   // Կոնկրետ ID-ն կամ "any"
    date: "",
    startTime: "09:00",
    endTime: "09:20"
  });

  // Ֆիլտրում ենք սերիական համարները ըստ ընտրված տեսակի
  const serialNumbers = useMemo(() => {
    if (!formData.assetName) return [];
    return allAssets.filter(a => a.name === formData.assetName);
  }, [formData.assetName, allAssets]);

  // Ստանում ենք արդեն զբաղված ժամերը
  useEffect(() => {
    async function fetchSlots() {
      if (formData.assetId !== "any" && formData.date) {
        const res = await getAvailableSlots(parseInt(formData.assetId), formData.date);
        if (res) setReservedSlots(res.reservations);
      } else {
        setReservedSlots([]);
      }
    }
    fetchSlots();
  }, [formData.assetId, formData.date]);

  const startTimeSlots = useMemo(() => {
    const slots = [];
    for (let h = 9; h <= 17; h++) {
      const hour = h.toString().padStart(2, '0');
      slots.push(`${hour}:00`, `${hour}:30`);
    }
    return slots.filter(s => s <= "17:00");
  }, []);

  const endTimeSlots = useMemo(() => {
    const slots = [];
    for (let h = 9; h <= 17; h++) {
      const hour = h.toString().padStart(2, '0');
      slots.push(`${hour}:20`, `${hour}:50`);
    }
    return slots.filter(s => s <= "17:20");
  }, []);

  const availableEndTimes = useMemo(() => {
    return endTimeSlots.filter(time => time > formData.startTime);
  }, [formData.startTime, endTimeSlots]);

  const formatTime = (date: Date | string | null) => {
    if (!date) return "Անժամկետ";
    const d = new Date(date);
    return d.toISOString().substring(11, 16);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.assetName || !formData.endTime) {
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
        assetName: formData.assetName,
        start_time: startDateTime,
        end_time: endDateTime
      });

      setMessage("✅ Ամրագրումը հաջողությամբ կատարվեց");
      setTimeout(() => {
        router.push(isActualAdmin ? '/admin' : '/myreservations');
      }, 2000);

    } catch (err: any) {
      setMessage("❌ " + (err.message || "Տեղի ունեցավ սխալ։"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Վերնագիր և Navigation */}
      <div className="bg-white border-b px-4 py-4 sm:px-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="ml-1 font-medium">Հետ</span>
          </button>
          <h1 className="text-xl font-bold text-gray-800">Նոր Ամրագրում</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-8">
        {/* Հաղորդագրությունների բլոկ */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border animate-in fade-in slide-in-from-top-4 ${
            message.includes('✅') 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {message.includes('✅') ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <p className="font-medium">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Սեկցիա 1. Սարքի տվյալներ */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
            <div className="flex items-center gap-2 text-blue-600 border-b pb-3">
              <Monitor size={22} />
              <h2 className="font-semibold text-lg text-gray-800">Ի՞նչ սարք է հարկավոր</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600 ml-1">Սարքի տեսակը</label>
                <select 
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer hover:border-blue-300"
                  onChange={(e) => setFormData({...formData, assetName: e.target.value, assetId: "any"})}
                  value={formData.assetName}
                >
                  <option value="">Ընտրեք տեսակը</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.name}>{asset.name}</option>
                  ))}
                </select>
              </div>

              {formData.assetName && (
                <div className="space-y-1.5 animate-in fade-in zoom-in-95">
                  <label className="text-sm font-semibold text-gray-600 ml-1">Սերիական համար (ըստ ցանկության)</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <select 
                      className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer hover:border-blue-300"
                      onChange={(e) => setFormData({...formData, assetId: e.target.value})}
                      value={formData.assetId}
                    >
                      <option value="any">Ցանկացած ազատ սարք</option>
                      {serialNumbers.map((s) => (
                        <option key={s.id} value={s.id}>{s.serial_number || `ID: ${s.id}`}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Սեկցիա 2. Ժամանակացույց */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
            <div className="flex items-center gap-2 text-blue-600 border-b pb-3">
              <Calendar size={22} />
              <h2 className="font-semibold text-lg text-gray-800">Ամսաթիվ և Ժամ</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600 ml-1">Օրը</label>
                <input 
                  required
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600 ml-1">Սկիզբ</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <select 
                    className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    value={formData.startTime}
                  >
                    {startTimeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600 ml-1">Ավարտ</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <select 
                    required
                    className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    value={formData.endTime}
                  >
                    <option value="">Ընտրել...</option>
                    {availableEndTimes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Զբաղված ժամերի տեղեկատվական բլոկ */}
            {reservedSlots.length > 0 && (
              <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center gap-2 text-amber-800 mb-2 font-semibold text-sm">
                  <Info size={16} />
                  Այս սարքի զբաղված ժամերը (տվյալ օրը)
                </div>
                <div className="flex flex-wrap gap-2">
                  {reservedSlots.map((slot, i) => (
                    <span key={i} className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-medium">
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Հաստատման կոճակ */}
          <button 
            disabled={loading || !formData.assetName}
            type="submit" 
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
              loading || !formData.assetName
                ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] hover:shadow-blue-200'
            }`}
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <CheckCircle2 size={22} />
                Հաստատել ամրագրումը
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}