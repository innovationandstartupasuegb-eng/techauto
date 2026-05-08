'use client';

import { requestPickup, requestReturn } from "@/app/actions/reservation";
import { useState, useEffect } from "react";

export default function PickupButton({ 
  resId, 
  startTime, 
  pickupStatus 
}: { 
  resId: number, 
  startTime: Date | string, 
  pickupStatus: string 
}) {
  const [canPickup, setCanPickup] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      
      // 1. Ստեղծում ենք բազայի ժամի օբյեկտը
      const s = new Date(startTime);

      // 2. Քանի որ բազայում ժամը արդեն +4 է, մենք վերցնում ենք 
      // դրա UTC թվերը (տարի, ամիս, օր, ժամ, րոպե) և սարքում տեղական Date:
      // Սա չեզոքացնում է բոլոր տեսակի timezone-ի շեղումները։
      const pureStart = new Date(
        s.getUTCFullYear(),
        s.getUTCMonth(),
        s.getUTCDate(),
        s.getUTCHours(),
        s.getUTCMinutes()
      );

      const nowMs = now.getTime();
      const startMs = pureStart.getTime();
      const expirationMs = startMs + (30 * 60 * 1000); // +30 րոպե

      // --- ՏՐԱՄԱԲԱՆՈՒԹՅՈՒՆ ---

      // Եթե ներկա պահը անցել է սկիզբ + 30 րոպեն
      if (nowMs > expirationMs && pickupStatus === 'PENDING') {
        setIsExpired(true);
        setCanPickup(false);
      } else {
        setIsExpired(false);
        // Կարելի է վերցնել, եթե հիմա գոնե սկսվելու ժամն է (կամ 1ր շուտ)
        // ԵՎ դեռ 30 րոպեն չի լրացել
        const isTimeArrived = nowMs >= (startMs - 60000);
        const isStillValid = nowMs <= expirationMs;
        setCanPickup(isTimeArrived && isStillValid);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 3000);
    return () => clearInterval(interval);
  }, [startTime, pickupStatus]);

  // --- RENDERING ---

  if (isExpired && pickupStatus === 'PENDING') {
    return (
      <span className="text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200 text-[10px] font-bold uppercase italic">
        Ժամկետնանց
      </span>
    );
  }

  if (pickupStatus === 'USER_READY') {
    return (
      <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200 text-[10px] animate-pulse font-medium text-center">
        Սպասեք ադմինին
      </span>
    );
  }

  if (pickupStatus === 'IN_USE') {
    return (
      <button
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          try {
            const res = await requestReturn(resId);
            if (!res.success) alert(res.error);
          } finally {
            setLoading(false);
          }
        }}
        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase transition active:scale-95 cursor-pointer shadow-sm w-full"
      >
        {loading ? "..." : "Վերադարձնել"}
      </button>
    );
  }

  if (pickupStatus === 'RETURN_REQUESTED') return <span className="text-blue-600 text-[10px] animate-pulse">Ստուգվում է...</span>;
  if (pickupStatus === 'RETURNED') return <span className="text-gray-400 text-[10px]">Ավարտված</span>;
  if (pickupStatus === 'CANCELLED') return <span className="text-red-400 text-[10px]">Չեղարկված</span>;

  return (
    <button
      disabled={!canPickup || loading}
      onClick={async () => {
        setLoading(true);
        try {
          const res = await requestPickup(resId);
          if (!res.success) alert(res.error);
        } finally {
          setLoading(false);
        }
      }}
      className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all w-full ${
        canPickup 
          ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-md active:scale-95' 
          : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-70'
      }`}
    >
      {loading ? "..." : "Վերցնել"}
    </button>
  );
}