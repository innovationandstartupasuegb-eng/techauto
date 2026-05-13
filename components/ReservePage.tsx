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
  Info,
  Settings2
} from 'lucide-react';

interface ReservePageProps {
  assets: any[];
  allAssets: any[];
  canIndefinite?: boolean; 
  isActualAdmin?: boolean; 
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
    assetName: "",
    assetId: "any",
    date: "",
    startTime: "09:00",
    endTime: "09:20"
  });

  const serialNumbers = useMemo(() => {
    if (!formData.assetName) return [];
    return allAssets.filter(a => a.name === formData.assetName);
  }, [formData.assetName, allAssets]);

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
    <div className="bg-slate-200 min-h-screen font-sans text-slate-900 pb-12">
      
      {/* Ճշգրիտ պատճենված Navbar ManageClient-ից */}
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
              <Calendar size={20} className="text-indigo-600" />
              Նոր Ամրագրում
            </h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Սարքավորումների ամրագրման համակարգ
            </p>
          </div>
        </div>
      </div>

      {/* Մեջտեղի հատված - Ձեռք չի տրվել (բացի վերևի padding-ից) */}
      <div className="max-w-3xl mx-auto px-6 pt-10">
        {message && (
          <div className={`mb-8 p-5 rounded-[1.5rem] flex items-center gap-4 border shadow-xl animate-in fade-in slide-in-from-top-4 ${
            message.includes('✅') 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {message.includes('✅') ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            <p className="font-black uppercase text-[11px] tracking-wider">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Սեկցիա 1. Սարքի ընտրություն */}
          <div className="bg-slate-50 rounded-[2.5rem] shadow-2xl border border-slate-300 p-8 space-y-6">
            <div className="flex items-center gap-3 text-indigo-600 border-b border-slate-200 pb-4">
              <Monitor size={20} strokeWidth={3} />
              <h2 className="font-black text-xs uppercase tracking-[0.2em] text-slate-800">Ընտրեք սարքավորումը</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Տեսակը</label>
                <select 
                  required
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all cursor-pointer shadow-sm appearance-none hover:border-indigo-300"
                  onChange={(e) => setFormData({...formData, assetName: e.target.value, assetId: "any"})}
                  value={formData.assetName}
                >
                  <option value="">Ընտրեք տեսակը...</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.name}>{asset.name}</option>
                  ))}
                </select>
              </div>

              {formData.assetName && (
                <div className="space-y-2 animate-in fade-in zoom-in-95">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Կոնկրետ սարք (S/N)</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-4.5 text-slate-300" size={16} />
                    <select 
                      className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all cursor-pointer shadow-sm appearance-none"
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
          <div className="bg-slate-50 rounded-[2.5rem] shadow-2xl border border-slate-300 p-8 space-y-6">
            <div className="flex items-center gap-3 text-indigo-600 border-b border-slate-200 pb-4">
              <Calendar size={20} strokeWidth={3} />
              <h2 className="font-black text-xs uppercase tracking-[0.2em] text-slate-800">Ամսաթիվ և Ժամանակ</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ամսաթիվ</label>
                <input 
                  required
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Սկիզբ</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-4 text-slate-300" size={16} />
                  <select 
                    className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm appearance-none" 
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    value={formData.startTime}
                  >
                    {startTimeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ավարտ</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-4 text-slate-300" size={16} />
                  <select 
                    required
                    className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm appearance-none font-black text-indigo-600"
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    value={formData.endTime}
                  >
                    <option value="">Ժամը...</option>
                    {availableEndTimes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {reservedSlots.length > 0 && (
              <div className="mt-6 p-5 bg-orange-100/50 rounded-[1.5rem] border border-orange-200">
                <div className="flex items-center gap-2 text-orange-800 mb-4 font-black uppercase text-[9px] tracking-widest">
                  <Info size={14} />
                  Այս սարքի զբաղված ժամերը
                </div>
                <div className="flex flex-wrap gap-2">
                  {reservedSlots.map((slot, i) => (
                    <span key={i} className="px-4 py-2 bg-white text-orange-700 border border-orange-100 rounded-xl text-[10px] font-black shadow-sm tracking-tighter">
                      {formatTime(slot.start_time)} — {formatTime(slot.end_time)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="max-w-md mx-auto">
            <button 
              disabled={loading || !formData.assetName}
              type="submit" 
              className={`w-full py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] text-white shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 ${
                loading || !formData.assetName
                  ? 'bg-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 size={20} strokeWidth={3} />
                  Հաստատել ամրագրումը
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}