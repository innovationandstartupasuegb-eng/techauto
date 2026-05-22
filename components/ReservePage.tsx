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
        router.back();
      }, 2000);

    } catch (err: any) {
      setMessage("❌ " + (err.message || "Տեղի ունեցավ սխալ։"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-200 min-h-screen font-sans text-slate-900 pb-12 w-full overflow-x-hidden">
      
      {/* 📱 ՌԵՍՊՈՆՍԻՎ NAVBAR */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-300 px-4 py-4 md:px-6 md:py-6 sticky top-0 z-20 shadow-sm w-full">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-slate-500 hover:text-indigo-600 transition-all font-black uppercase text-[10px] tracking-widest group self-start"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="ml-1">Հետ դեպի գլխավոր</span>
          </button>

          <div className="text-left sm:text-right">
            <h1 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2 sm:justify-end">
              <Calendar size={20} className="text-indigo-600" />
              Նոր Ամրագրում
            </h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Սարքավորումների ամրագրման համակարգ
            </p>
          </div>
        </div>
      </div>

      {/* 📱 ՄԵՋՏԵՂԻ ՀԱՏՎԱԾ - Լիարժեք էկրանի կառավարում */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-6 md:pt-10 w-full box-border overflow-hidden">
        {message && (
          <div className={`mb-6 md:mb-8 p-4 md:p-5 rounded-2xl md:rounded-[1.5rem] flex items-center gap-3 md:gap-4 border shadow-xl animate-in fade-in slide-in-from-top-4 ${
            message.includes('✅') 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {message.includes('✅') ? <CheckCircle2 className="shrink-0" size={22} /> : <AlertCircle className="shrink-0" size={22} />}
            <p className="font-black uppercase text-[10px] md:text-[11px] tracking-wider break-words flex-1">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 w-full box-border">
          
          {/* Սեկցիա 1. Սարքի ընտրություն */}
          <div className="bg-slate-50 rounded-2xl md:rounded-[2.5rem] shadow-2xl border border-slate-300 p-4 md:p-8 space-y-6 w-full box-border">
            <div className="flex items-center gap-3 text-indigo-600 border-b border-slate-200 pb-3 md:pb-4">
              <Monitor size={18} strokeWidth={3} />
              <h2 className="font-black text-[11px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] text-slate-800">Ընտրեք սարքավորումը</h2>
            </div>

            {/* 📱 ՈՒՂՂՈՒՄ: grid-ը դարձվել է լիարժեք ռեսպոնսիվ `grid-cols-1`, որ հեռախոսով չպատռի */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full box-border">
              <div className="space-y-2 w-full min-w-0">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Տեսակը</label>
                <div className="w-full">
                  <select 
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl md:rounded-2xl p-3.5 md:p-4 font-bold text-xs md:text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all cursor-pointer shadow-sm hover:border-indigo-300 text-ellipsis overflow-hidden"
                    onChange={(e) => setFormData({...formData, assetName: e.target.value, assetId: "any"})}
                    value={formData.assetName}
                  >
                    <option value="">Ընտրեք տեսակը...</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.name}>{asset.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.assetName && (
                <div className="space-y-2 w-full min-w-0 animate-in fade-in zoom-in-95">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Կոնկրետ սարք (S/N)</label>
                  <div className="relative w-full flex items-center">
                    {/* 📱 ՈՒՂՂՈՒՄ: Icon-ի դիրքը ֆիքսվեց `inset-y-0`-ով, որ միշտ լինի ճիշտ կենտրոնում */}
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <Hash className="text-slate-400" size={14} />
                    </div>
                    <select 
                      className="w-full bg-white border border-slate-200 rounded-xl md:rounded-2xl p-3.5 md:p-4 pl-10 pr-8 font-bold text-xs md:text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all cursor-pointer shadow-sm text-ellipsis overflow-hidden"
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
          <div className="bg-slate-50 rounded-2xl md:rounded-[2.5rem] shadow-2xl border border-slate-300 p-4 md:p-8 space-y-6 w-full box-border">
            <div className="flex items-center gap-3 text-indigo-600 border-b border-slate-200 pb-3 md:pb-4">
              <Calendar size={18} strokeWidth={3} />
              <h2 className="font-black text-[11px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] text-slate-800">Ամսաթիվ և Ժամանակ</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full box-border">
              <div className="space-y-2 w-full min-w-0">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ամսաթիվ</label>
                <input 
                  required
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3.5 md:p-4 bg-white border border-slate-200 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div className="space-y-2 w-full min-w-0">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Սկիզբ</label>
                <div className="relative w-full flex items-center">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Clock className="text-slate-400" size={14} />
                  </div>
                  <select 
                    className="w-full bg-white border border-slate-200 rounded-xl md:rounded-2xl p-3.5 md:p-4 pl-10 pr-8 font-bold text-xs md:text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm" 
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    value={formData.startTime}
                  >
                    {startTimeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2 w-full min-w-0">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ավարտ</label>
                <div className="relative w-full flex items-center">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Clock className="text-slate-400" size={14} />
                  </div>
                  <select 
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl md:rounded-2xl p-3.5 md:p-4 pl-10 pr-8 font-bold text-xs md:text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm font-black text-indigo-600"
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
              <div className="mt-4 p-4 bg-orange-100/50 rounded-xl md:rounded-[1.5rem] border border-orange-200 w-full box-border">
                <div className="flex items-center gap-2 text-orange-800 mb-3 font-black uppercase text-[9px] tracking-widest">
                  <Info size={14} />
                  Այս սարքի զբաղված ժամերը
                </div>
                <div className="flex flex-wrap gap-1.5 w-full">
                  {reservedSlots.map((slot, i) => (
                    <span key={i} className="px-2.5 py-1.5 bg-white text-orange-700 border border-orange-100 rounded-lg text-[9px] font-black shadow-sm tracking-tighter whitespace-nowrap">
                      {formatTime(slot.start_time)} — {formatTime(slot.end_time)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Հաստատելու կոճակ */}
          <div className="max-w-md mx-auto px-2 w-full box-border">
            <button 
              disabled={loading || !formData.assetName}
              type="submit" 
              className={`w-full py-4 md:py-5 rounded-xl md:rounded-[2rem] font-black uppercase text-[10px] md:text-xs tracking-[0.15em] md:tracking-[0.3em] text-white shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 ${
                loading || !formData.assetName
                  ? 'bg-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 size={18} strokeWidth={3} />
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