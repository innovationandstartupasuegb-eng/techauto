'use client';

import { useEffect, useState, useRef } from 'react';
import { Bell, RefreshCw, CheckCircle2, XCircle, User, HardDrive } from 'lucide-react';
import { confirmAdminHandover, confirmReturn, getPendingRequests } from '@/app/actions/reservation';

export default function AdminNotificationModal() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);
  
  // useRef-ի միջոցով պահում ենք թարմ dismissedIds-ը, որպեսզի useEffect-ը անընդհատ չվերագործարկվի
  const dismissedIdsRef = useRef<number[]>([]);
  
  useEffect(() => {
    dismissedIdsRef.current = dismissedIds;
  }, [dismissedIds]);

  useEffect(() => {
    let isMounted = true; // Կանխում է state-ի թարմացումը, եթե կոմպոնենտը փակվի
    let timerId: NodeJS.Timeout;

    const fetchUpdates = async () => {
      try {
        const data = await getPendingRequests();
        
        // Եթե կապի խնդիր կա կամ տվյալներ չկան, կանգնեցնում ենք
        if (!isMounted || !data || !Array.isArray(data)) return;

        // Ֆիլտրում ենք՝ օգտագործելով useRef-ի ընթացիկ արժեքը
        const pendingActions = data.filter((res: any) => {
          const currentStatus = (res.pickupStatus || res.status || '').toUpperCase();
          const isNotDismissed = !dismissedIdsRef.current.includes(res.id);

          return (currentStatus === 'USER_READY' || currentStatus === 'RETURN_REQUESTED') && isNotDismissed;
        });
        
        if (isMounted) {
          setNotifications(pendingActions);
        }
      } catch (err) {
        console.error("Error fetching updates:", err);
      } finally {
        // Փոխանակ setInterval անելու, հաջորդ հարցումը պլանավորում ենք ՄԻԱՅՆ նախորդի ավարտից հետո
        if (isMounted) {
          timerId = setTimeout(fetchUpdates, 5000);
        }
      }
    };

    fetchUpdates();

    return () => {
      isMounted = false;
      clearTimeout(timerId);
    };
  }, []); // ԶԱՆԳՎԱԾԸ ՄՆՈՒՄ Է ԴԱՏԱՐԿ. Սա երաշխավորում է, որ ոչ մի Failed to fetch էլ չի լինի

  if (notifications.length === 0) return null;

  const currentRequest = notifications[0];
  const currentStatus = (currentRequest.pickupStatus || currentRequest.status || '').toUpperCase();
  const isReturn = currentStatus === 'RETURN_REQUESTED';

  const handleDismiss = () => {
    setDismissedIds(prev => [...prev, currentRequest.id]);
    setNotifications(prev => prev.filter(n => n.id !== currentRequest.id));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 antialiased">
      <div className={`bg-white rounded-[2.5rem] overflow-hidden max-w-md w-full shadow-2xl border-b-8 transition-all animate-in zoom-in duration-300 
        ${isReturn ? 'border-indigo-600' : 'border-amber-500'}`}>
        
        <div className={`p-8 text-center ${isReturn ? 'bg-indigo-50/50' : 'bg-amber-50/50'}`}>
          <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-4 rotate-3 shadow-lg 
            ${isReturn ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white'}`}>
            {isReturn ? <RefreshCw size={40} className="animate-spin" /> : <Bell size={40} className="animate-bounce" />}
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            {isReturn ? 'Վերադարձի հարցում' : 'Հանձնման հարցում'}
          </h2>
        </div>

        <div className="px-8 py-6 space-y-4">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="bg-white p-2 rounded-lg shadow-sm text-slate-400">
              <HardDrive size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Սարքավորում</p>
              <p className="text-sm font-black text-slate-800">{currentRequest.assets?.name}</p>
              {currentRequest.assets?.serial_number && (
                <p className="text-[10px] font-mono font-bold text-indigo-500 mt-0.5 bg-indigo-50 px-1.5 py-0.5 rounded inline-block">
                  SN: {currentRequest.assets.serial_number}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="bg-white p-2 rounded-lg shadow-sm text-slate-400">
              <User size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Օգտատեր</p>
              <p className="text-sm font-black text-slate-800">{currentRequest.users?.full_name}</p>
            </div>
          </div>
        </div>

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
            className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-[0.1em] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl
              ${isReturn ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
          >
            {loading ? "Մշակվում է..." : (
              <>
                <CheckCircle2 size={18} />
                {isReturn ? "Հաստատել Վերադարձը" : "Հաստատել Հանձնումը"}
              </>
            )}
          </button>
          
          <button
            onClick={handleDismiss}
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