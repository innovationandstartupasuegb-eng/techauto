'use client';

import { requestPickup, requestReturn } from "@/app/actions/reservation";
import { useState, useEffect } from "react";
import { Clock, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';

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

  const isPermanent = new Date(startTime).getUTCFullYear() > 9000;

  useEffect(() => {
    const checkTime = () => {
      if (isPermanent) {
        setCanPickup(true);
        return;
      }

      const now = new Date();
      const s = new Date(startTime);
      const pureStart = new Date(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate(), s.getUTCHours(), s.getUTCMinutes());

      const nowMs = now.getTime();
      const startMs = pureStart.getTime();
      const expirationMs = startMs + (30 * 60 * 1000);

      if (nowMs > expirationMs && pickupStatus === 'PENDING') {
        setIsExpired(true);
        setCanPickup(false);
      } else {
        setIsExpired(false);
        const isTimeArrived = nowMs >= (startMs - 60000);
        const isStillValid = nowMs <= expirationMs;
        setCanPickup(isTimeArrived && isStillValid);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 3000);
    return () => clearInterval(interval);
  }, [startTime, pickupStatus, isPermanent]);

  // --- RENDERING HELPER ---
  const StatusBadge = ({ children, className }: { children: React.ReactNode, className: string }) => (
    <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 border ${className}`}>
      {children}
    </span>
  );

  // 1. Եթե սարքն օգտագործման մեջ է
  if (pickupStatus === 'IN_USE') {
    return (
      <button
        disabled={loading}
        onClick={async () => {
          if (!confirm("Հաստատո՞ւմ եք վերադարձի հարցումը:")) return;
          setLoading(true);
          try {
            const res = await requestReturn(resId);
            if (!res.success) alert(res.error);
          } finally {
            setLoading(false);
          }
        }}
        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer shadow-lg shadow-orange-200 w-full flex items-center justify-center gap-2"
      >
        {loading ? "..." : <><RotateCcw size={14} /> Վերադարձնել</>}
      </button>
    );
  }

  // 2. Մնացած կարգավիճակները
  if (isExpired && pickupStatus === 'PENDING') {
    return (
      <StatusBadge className="text-red-500 bg-red-50 border-red-100 italic">
        <AlertCircle size={12} /> Ժամկետնանց
      </StatusBadge>
    );
  }

  if (pickupStatus === 'USER_READY') {
    return (
      <StatusBadge className="text-amber-600 bg-amber-50 border-amber-200 animate-pulse">
        <Clock size={12} /> Սպասեք ադմինին
      </StatusBadge>
    );
  }

  if (pickupStatus === 'RETURN_REQUESTED') {
    return (
      <StatusBadge className="text-blue-600 bg-blue-50 border-blue-100 animate-pulse">
        <RotateCcw size={12} className="animate-spin-slow" /> Ստուգվում է...
      </StatusBadge>
    );
  }

  if (pickupStatus === 'RETURNED') {
    return (
      <StatusBadge className="text-slate-400 bg-slate-50 border-slate-200 opacity-60">
        <CheckCircle2 size={12} /> Ավարտված
      </StatusBadge>
    );
  }

  if (pickupStatus === 'CANCELLED') {
    return (
      <StatusBadge className="text-red-300 bg-transparent border-red-100">
        Չեղարկված
      </StatusBadge>
    );
  }

  // 3. Վերցնելու կոճակը
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
      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all w-full flex items-center justify-center gap-2 ${
        canPickup 
          ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer shadow-lg shadow-indigo-200 active:scale-95' 
          : 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200'
      }`}
    >
      {loading ? "..." : "Վերցնել"}
    </button>
  );
}