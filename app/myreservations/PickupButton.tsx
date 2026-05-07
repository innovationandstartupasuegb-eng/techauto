'use client';

import { requestPickup } from "@/app/actions/reservation";
import { useState, useEffect } from "react";

export default function PickupButton({ resId, startTime, pickupStatus }: { resId: number, startTime: Date, pickupStatus: string }) {
  const [canPickup, setCanPickup] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      // Թույլ տալ սեղմել, եթե հիմա սկսվելու ժամն է կամ արդեն անցել է
      setCanPickup(now >= new Date(startTime));
    };

    checkTime();
    const interval = setInterval(checkTime, 10000); // Ստուգել յուրաքանչյուր 10 վայրկյանը մեկ
    return () => clearInterval(interval);
  }, [startTime]);

  if (pickupStatus === 'USER_READY') {
    return (
      <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200 text-[10px] animate-pulse">
        Սպասեք ադմինին
      </span>
    );
  }

  if (pickupStatus === 'IN_USE') {
    return (
      <span className="text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200 text-[10px]">
        Ձեզ մոտ է
      </span>
    );
  }

  return (
    <button
      disabled={!canPickup || loading}
      onClick={async () => {
        setLoading(true);
        await requestPickup(resId);
        setLoading(false);
      }}
      className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition ${
        canPickup 
          ? 'bg-blue-600 text-white hover:bg-blue-700' 
          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
      }`}
    >
      {loading ? "..." : "Վերցնել"}
    </button>
  );
}