'use client';

import { useEffect, useState } from 'react';
import { Bell, RefreshCw, CheckCircle2, XCircle, User, HardDrive, Info } from 'lucide-react';
import { confirmAdminHandover, confirmReturn, getPendingRequests } from '@/app/actions/reservation';

export default function AdminNotificationModal() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const data = await getPendingRequests();
        if (data) {
          // Ֆիլտրում ենք հանձնման (USER_READY) և վերադարձի (RETURN_REQUESTED) հարցումները
          const pendingActions = data.filter(
            (res: any) => res.pickupStatus === 'USER_READY' || res.pickupStatus === 'RETURN_REQUESTED'
          );
          setNotifications(pendingActions);
        }
      } catch (err) {
        console.error("Error fetching updates:", err);
      }
    };

    fetchUpdates();
    const interval = setInterval(fetchUpdates, 5000); // Յուրաքանչյուր 5 վայրկյանը մեկ թարմացում
    return () => clearInterval(interval);
  }, []);

  if (notifications.length === 0) return null;

  const currentRequest = notifications[0];
  const isReturn = currentRequest.pickupStatus === 'RETURN_REQUESTED';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 antialiased">
      
      <div className={`bg-white rounded-[2.5rem] overflow-hidden max-w-md w-full shadow-2xl border-b-8 transition-all animate-in zoom-in duration-300 
        ${isReturn ? 'border-indigo-600' : 'border-amber-500'}`}>
        
        {/* Վերնագրի հատված */}
        <div className={`p-8 text-center ${isReturn ? 'bg-indigo-50/50' : 'bg-amber-50/50'}`}>
          <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-4 rotate-3 shadow-lg 
            ${isReturn ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white'}`}>
            {isReturn ? <RefreshCw size={40} className="animate-spin-slow" /> : <Bell size={40} className="animate-bounce" />}
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            {isReturn ? 'Վերադարձի հարցում' : 'Հանձնման հարցում'}
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
            Անհրաժեշտ է ադմինիստրատորի հաստատում
          </p>
        </div>

        {/* Տվյալների հատված */}
        <div className="px-8 py-6 space-y-4">
          
          {/* Սարքի տվյալներ */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="bg-white p-2 rounded-lg shadow-sm text-slate-400">
              <HardDrive size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Սարքավորում</p>
              <p className="text-sm font-black text-slate-800">{currentRequest.assets?.name || 'Անհայտ սարք'}</p>
              
              {/* Սերիական համարի ավելացված հատվածը */}
              {currentRequest.assets?.serial_number && (
                <p className="text-[10px] font-mono font-bold text-indigo-500 mt-0.5 bg-indigo-50 px-1.5 py-0.5 rounded inline-block">
                  SN: {currentRequest.assets.serial_number}
                </p>
              )}
            </div>
          </div>

          {/* Օգտատիրոջ տվյալներ */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="bg-white p-2 rounded-lg shadow-sm text-slate-400">
              <User size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Օգտատեր</p>
              <p className="text-sm font-black text-slate-800">{currentRequest.users?.full_name || 'Անհայտ օգտատեր'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-center py-2">
             <Info size={14} className="text-slate-400" />
             <p className="text-[10px] font-bold text-slate-400 uppercase">Հայտի ID: {currentRequest.id}</p>
          </div>
        </div>

        {/* Գործողությունների կոճակներ */}
        <div className="p-8 pt-0 flex flex-col gap-3">
          <button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                const result = isReturn 
                  ? await confirmReturn(currentRequest.id) 
                  : await confirmAdminHandover(currentRequest.id);

                if (result?.success) {
                  setNotifications(prev => prev.filter(n => n.id !== currentRequest.id));
                }
              } catch (e) {
                console.error("Action failed:", e);
              } finally {
                setLoading(false);
              }
            }}
            className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-[0.1em] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-slate-200
              ${isReturn 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
          >
            {loading ? "Մշակվում է..." : (
              <>
                <CheckCircle2 size={18} />
                {isReturn ? "Հաստատել Վերադարձը" : "Հաստատել Հանձնումը"}
              </>
            )}
          </button>
          
          <button
            onClick={() => setNotifications(prev => prev.filter(n => n.id !== currentRequest.id))} 
            className="w-full py-3 text-slate-400 hover:text-slate-600 font-black uppercase text-[10px] tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            <XCircle size={16} />
            Անտեսել հիմա
          </button>
        </div>
      </div>
    </div>
  );
}