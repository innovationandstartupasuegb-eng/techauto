'use client';

import { requestPickup, requestReturn } from "@/app/actions/reservation";
import { useState, useEffect } from "react";

export default function PickupButton({ resId, startTime, pickupStatus }: { resId: number, startTime: Date | string, pickupStatus: string }) {
  const [canPickup, setCanPickup] = useState(false);
  const [isExpired, setIsExpired] = useState(false); // Ավելացրինք ուշացման վիճակը
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const start = new Date(startTime);
      
      // Հաշվի ենք առնում 4 ժամվա շեղումը (UTC+4)
      const timezoneOffset = 4 * 60 * 60 * 1000;
      const startTimeAdjusted = start.getTime() - timezoneOffset;

      // 1. Ստուգում ենք՝ արդյո՞ք ժամանակը եկել է (Վերցնելու համար)
      const isTimeReady = now.getTime() >= (startTimeAdjusted - 60000); 
      setCanPickup(isTimeReady);

      // 2. Ստուգում ենք ուշացումը (30 րոպե անց)
      const diffInMinutes = (now.getTime() - startTimeAdjusted) / 60000;
      if (diffInMinutes > 30 && pickupStatus === 'PENDING') {
        setIsExpired(true);
      } else {
        setIsExpired(false);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 5000); 
    return () => clearInterval(interval);
  }, [startTime, pickupStatus]);

  // --- ՍՏԱՏՈՒՍՆԵՐԻ ՏՐԱՄԱԲԱՆՈՒԹՅՈՒՆ ---

  // ՆՈՐ: Եթե ժամանակը սպառվել է (30 րոպեից ավել) և դեռ չի վերցրել
  if (isExpired && pickupStatus === 'PENDING') {
    return (
      <span className="text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200 text-[10px] font-bold uppercase italic">
        Չեղարկված
      </span>
    );
  }

  // 1. Եթե օգտատերը սեղմել է "Վերցնել", բայց ադմինը դեռ չի հաստատել
  if (pickupStatus === 'USER_READY') {
    return (
      <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200 text-[10px] animate-pulse font-medium">
        Սպասեք ադմինին
      </span>
    );
  }

  // 2. Եթե ադմինը հաստատել է՝ սարքը ձեզ մոտ է
  if (pickupStatus === 'IN_USE') {
    return (
      <button
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          try {
            const res = await requestReturn(resId);
            if (!res.success) alert(res.error);
          } catch (e) {
            console.error("Return error:", e);
          } finally {
            setLoading(false);
          }
        }}
        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase transition shadow-sm active:scale-95 cursor-pointer"
      >
        {loading ? "..." : "Վերադարձնել"}
      </button>
    );
  }

  // 3. Եթե սեղմել եք "Վերադարձնել", բայց ադմինը դեռ չի ընդունել
  if (pickupStatus === 'RETURN_REQUESTED') {
    return (
      <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200 text-[10px] animate-pulse font-medium">
        Վերադարձի ստուգում...
      </span>
    );
  }

  // 4. Եթե ամեն ինչ ավարտված է
  if (pickupStatus === 'RETURNED') {
    return (
      <span className="text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-200 text-[10px] font-medium">
        Ավարտված է
      </span>
    );
  }

  // 5. Սկզբնական վիճակ՝ "Վերցնել" կոճակը
  return (
    <button
      disabled={!canPickup || loading}
      onClick={async () => {
        setLoading(true);
        try {
          const res = await requestPickup(resId);
          if (!res.success) alert(res.error);
        } catch (e) {
          console.error("Pickup error:", e);
        } finally {
          setLoading(false);
        }
      }}
      className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all duration-200 ${
        canPickup 
          ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-md active:scale-95' 
          : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-70'
      }`}
    >
      {loading ? "..." : "Վերցնել"}
    </button>
  );
}