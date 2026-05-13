import { getReservations, deleteReservation } from "@/app/actions/reservation";
import PickupButton from "@/app/myreservations/PickupButton";
import { ChevronLeft, Calendar, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default async function MyReservationsPage() {
  const reservations = await getReservations('all');

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return "-";
    const d = new Date(date);
    if (d.getFullYear() > 9000) return "— անժամկետ —";

    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = d.getUTCFullYear();
    const hours = d.getUTCHours().toString().padStart(2, '0');
    const minutes = d.getUTCMinutes().toString().padStart(2, '0');

    return `${day}.${month}.${year}, ${hours}:${minutes}`;
  };

  return (
    <div className="bg-slate-200 min-h-screen font-sans text-slate-900 pb-12">
      
      {/* Թարմացված Navbar՝ ամբողջ լայնությամբ */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-300 px-6 py-6 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <Link 
            href="/dashboard"
            className="flex items-center text-slate-500 hover:text-indigo-600 transition-all font-black uppercase text-[10px] tracking-widest group"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="ml-1">Հետ դեպի գլխավոր</span>
          </Link>

          <div className="text-right">
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2 justify-end">
              <LayoutDashboard size={20} className="text-indigo-600" />
              Իմ Ամրագրումները
            </h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Ձեր կողմից ամրագրված սարքավորումների ցանկը
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-[1400px] mx-auto">
        {reservations.length === 0 ? (
          <div className="bg-white/50 backdrop-blur-sm p-12 rounded-[2.5rem] border border-slate-300 text-center shadow-xl">
             <p className="text-slate-400 font-black uppercase tracking-[0.2em] italic text-sm">
              Դեռևս ամրագրումներ չկան
            </p>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-[2.5rem] shadow-2xl border border-slate-300 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100/80 border-b border-slate-200">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <th className="p-6">Սարքավորում</th>
                  <th className="p-6 text-left">Սկիզբ</th>
                  <th className="p-6 text-left">Ավարտ</th>
                  <th className="p-6 text-center">Կարգավիճակ</th>
                  <th className="p-6 text-right">Գործողություն</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/30 backdrop-blur-sm">
                {reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-indigo-50/50 transition-all duration-300 group text-black">
                    <td className="p-6">
                      <div className="text-sm font-black text-slate-800">
                        {res.assets?.name || "Անհայտ"}
                      </div>
                      <div className="text-[10px] font-mono font-bold text-slate-400 tracking-tighter uppercase">
                        {res.assets?.serial_number}
                      </div>
                    </td>
                    
                    <td className="p-6 text-sm font-black text-indigo-600">
                      {formatDateTime(res.start_time)}
                    </td>
                    
                    <td className="p-6 text-sm font-bold text-slate-500">
                      {res.end_time ? formatDateTime(res.end_time) : <span className="italic text-slate-400">Անժամկետ</span>}
                    </td>
                    
                    <td className="p-6 text-center">
                      <PickupButton 
                        resId={res.id} 
                        startTime={res.start_time!} 
                        pickupStatus={(res as any).pickupStatus || "PENDING"} 
                      />
                    </td>

                    <td className="p-6 text-right">
                      {res.status === 'Reserved' && (res as any).pickupStatus === 'PENDING' && (
                        <form action={async () => {
                          "use server";
                          await deleteReservation(res.id);
                        }}>
                          <button 
                            type="submit" 
                            className="text-red-500 hover:text-red-700 font-black text-[10px] uppercase tracking-widest transition-colors"
                          >
                            Չեղարկել
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}