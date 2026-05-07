'use client';

import { useEffect, useState } from 'react';
// Ներմուծում ենք confirmReturn-ը և getReservations-ը
import { confirmAdminHandover, confirmReturn, getReservations } from '@/app/actions/reservation';

export default function AdminNotificationModal() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const data = await getReservations();

        if (data) {
          // Ֆիլտրում ենք և՛ հանձնման (USER_READY), և՛ վերադարձի (RETURN_REQUESTED) հարցումները
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
    const interval = setInterval(fetchUpdates, 5000);
    return () => clearInterval(interval);
  }, []);

  if (notifications.length === 0) return null;

  const currentRequest = notifications[0];
  
  // Պարզում ենք՝ սա վերադարձի հարցում է, թե հանձնման
  const isReturn = currentRequest.pickupStatus === 'RETURN_REQUESTED';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      {/* Գույնը փոխվում է ըստ տիպի՝ Amber (հանձնում), Blue (վերադարձ) */}
      <div className={`bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border-2 animate-in zoom-in duration-300 ${isReturn ? 'border-blue-500' : 'border-amber-500'}`}>
        
        <div className={`flex items-center gap-3 mb-4 ${isReturn ? 'text-blue-600' : 'text-amber-600'}`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center animate-bounce text-2xl ${isReturn ? 'bg-blue-100' : 'bg-amber-100'}`}>
            {isReturn ? '🔄' : '🔔'}
          </div>
          <h2 className="text-xl font-bold italic">
            {isReturn ? 'Սարքի վերադարձի հարցում' : 'Սարքի հանձնման հարցում'}
          </h2>
        </div>
        
        <div className={`p-4 rounded-lg mb-6 border ${isReturn ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
          <div className="text-sm space-y-2">
            <p><strong>ID:</strong> <span className="text-xs font-mono">{currentRequest.id}</span></p>
            <p><strong>Սարք:</strong> {currentRequest.assets?.name || 'Անունը նշված չէ'}</p>
            <p><strong>Ուսանող:</strong> {currentRequest.users?.full_name || 'Անհայտ օգտատեր'}</p>
            
            <div className={`mt-2 py-1 px-2 text-[10px] font-bold rounded uppercase inline-block ${isReturn ? 'bg-blue-200 text-blue-900' : 'bg-amber-200 text-amber-900'}`}>
              Կարգավիճակ: {currentRequest.pickupStatus}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                // Կախված ստատուսից՝ կանչում ենք համապատասխան Action-ը
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
            className={`flex-1 text-white py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 ${isReturn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {loading ? "Մշակվում է..." : isReturn ? "Հաստատել վերադարձը" : "Հաստատել հանձնումը"}
          </button>
          
          <button
            onClick={() => setNotifications(prev => prev.filter(n => n.id !== currentRequest.id))} 
            className="px-4 py-3 text-gray-400 hover:text-gray-600 font-medium transition-colors"
          >
            Փակել
          </button>
        </div>
      </div>
    </div>
  );
}