'use client';
import AdminNotificationModal from "@/components/AdminNotificationModal";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CalendarCheck2, PlusCircle } from 'lucide-react';
import { 
  getReservations, 
  deleteReservation, 
  getUniqueAssetNames, 
  getStaffUsers, 
  getAssets, 
  createPermanentAssignment,
  confirmReturn,
  confirmAdminHandover,
  cleanupExpiredReservations // ՈՒՂՂՎԱԾ Է. Ավելացվել է մաքրման ֆունկցիան
} from "@/app/actions/reservation";

export default function AllReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [assetNames, setAssetNames] = useState<string[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'active' | 'permanent' | 'archive'>('active');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAssetName, setSelectedAssetName] = useState("");
  const [serialSearch, setSerialSearch] = useState("");

  const getNow = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    userId: "",
    assetId: "",
    start_time: getNow(),
  });

  const [userSearch, setUserSearch] = useState("");
  const [idSearch, setIdSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assetNameFilter, setAssetNameFilter] = useState("all");

  const loadInitialData = async (tab: 'active' | 'permanent' | 'archive' = currentTab) => {
    setLoading(true);
    try {
      const [resData, namesData, staffData, assetsData] = await Promise.all([
        getReservations(tab), 
        getUniqueAssetNames(),
        getStaffUsers(),
        getAssets()
      ]);
      setReservations(resData || []);
      setAssetNames(namesData || []);
      setStaff(staffData || []);
      setAllAssets(assetsData?.filter(a => a.status === 'Available') || []);
    } catch (error) {
      console.error("Տվյալների բեռնման սխալ:", error);
    } finally {
      setLoading(false);
    }
  };

  // ՈՒՂՂՎԱԾ Է. Մաքրումն ու տվյալների բեռնումը համակցված են՝ կրկնակի հարցումներից խուսափելու համար
  useEffect(() => {
    const runBackgroundCleanup = async () => {
      try {
        setLoading(true);
        // Նախ ետնաբեմում կատարում ենք հին տվյալների մաքրումը
        await cleanupExpiredReservations();
      } catch (error) {
        console.error("Ֆոնային մաքրման սխալ:", error);
      } finally {
        // Վերջում ՄԵԿ ԱՆԳԱՄ բեռնում ենք աղյուսակի վերջնական թարմ տվյալները
        await loadInitialData(currentTab);
      }
    };

    runBackgroundCleanup();
  }, [currentTab]);

  const formatDateTime = (dateVal: any) => {
    if (!dateVal) return "—";
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return "—";
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${day}.${month}.${year}, ${hours}:${minutes}`;
  };

  const filteredSerials = useMemo(() => {
    if (!selectedAssetName) return [];
    return allAssets.filter(a => 
      a.name === selectedAssetName && 
      a.serial_number.toLowerCase().includes(serialSearch.toLowerCase())
    );
  }, [allAssets, selectedAssetName, serialSearch]);

  const filteredData = useMemo(() => {
    return reservations.filter((res) => {
      const fullName = res.users?.full_name || "";
      const assetName = res.assets?.name || "";
      const resId = res.id.toString();
      const matchesUser = fullName.toLowerCase().includes(userSearch.toLowerCase());
      const matchesStatus = statusFilter === "all" || res.status === statusFilter;
      const matchesAssetName = assetNameFilter === "all" || assetName === assetNameFilter;
      const matchesId = idSearch === "" || resId.includes(idSearch);
      return matchesUser && matchesStatus && matchesAssetName && matchesId;
    });
  }, [userSearch, statusFilter, assetNameFilter, idSearch, reservations]);

  const handleDelete = async (id: number) => {
    const message = currentTab === 'permanent' ? "Ազատե՞լ սարքը:" : "Չեղարկե՞լ ամրագրումը:";
    if (confirm(message)) {
      try {
        await deleteReservation(id);
        loadInitialData();
      } catch (err) { alert("Սխալ"); }
    }
  };

  const handleConfirmReturn = async (id: number) => {
    if (!window.confirm("Հաստատո՞ւմ եք սարքի վերադարձը դեպի պահեստ:")) return;
    
    try {
      const res = await confirmReturn(id);
      if (res && res.success) {
        await loadInitialData();
      } else {
        alert("Սերվերը չկարողացավ հաստատել վերադարձը։");
      }
    } catch (err: any) { 
      console.error("Վերադարձի սխալ:", err);
      alert("Տեղի ունեցավ սխալ. " + (err.message || "Կապի խնդիր")); 
    }
  };

  const handleAdminHandover = async (id: number) => {
    if (confirm("Հաստատո՞ւմ եք հանձնումը:")) {
      try {
        const res = await confirmAdminHandover(id);
        if (res.success) loadInitialData();
      } catch (err) { alert("Սխալ"); }
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId || !formData.assetId) return alert("Լրացրեք դաշտերը");
    setIsSubmitting(true);
    try {
      await createPermanentAssignment({
        userId: parseInt(formData.userId),
        assetId: parseInt(formData.assetId),
        start_time: formData.start_time
      });
      setIsModalOpen(false);
      resetModal();
      await loadInitialData();
    } catch (err: any) { alert(err.message); } finally { setIsSubmitting(false); }
  };

  const resetModal = () => {
    setSelectedAssetName("");
    setSerialSearch("");
    setFormData({ userId: "", assetId: "", start_time: getNow() });
  };

  const getStatusBadge = (res: any) => {
    const s = res.pickupStatus;
    const commonStyle = "px-2 py-1 rounded-lg text-[10px] font-bold uppercase border shadow-sm inline-block";
    
    if (currentTab === 'active') {
     if (s === 'USER_READY') return <span className={`${commonStyle} bg-purple-50 text-purple-700 border-purple-200`}>Պատրաստ է</span>;
     if (s === 'IN_USE') return <span className={`${commonStyle} bg-blue-600 text-white border-blue-700 shadow-md`}>Վերցված է</span>;
     return <span className={`${commonStyle} bg-indigo-50 text-indigo-500 border-indigo-100`}>Ամրագրված</span>;
    }
    switch (s) {
      case 'RETURNED': return <span className={`${commonStyle} bg-slate-100 text-slate-600 border-slate-200`}>Վերադարձված</span>;
      case 'CANCELLED': return <span className={`${commonStyle} bg-red-50 text-red-600 border-red-100`}>Չեղարկված</span>;
      case 'IN_USE': return <span className={`${commonStyle} bg-blue-50 text-blue-700 border-blue-200`}>Օգտագործվում է</span>;
      case 'RETURN_REQUESTED': return <span className={`${commonStyle} bg-amber-50 text-amber-700 border-amber-200 animate-pulse`}>Վերադարձի հայտ</span>;
      default: return <span className={`${commonStyle} bg-emerald-50 text-emerald-700 border-emerald-200`}>Կցված է</span>;
    }
  };

  return (
    <div className="bg-slate-200 min-h-screen font-sans text-slate-900 pb-12">
      <AdminNotificationModal />
      
      {/* Navbar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-300 px-6 py-6 sticky top-0 z-20 shadow-sm mb-6">
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
              <CalendarCheck2 size={20} className="text-indigo-600" />
              Ամրագրումներ
            </h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Կառավարման վահանակ</p>
          </div>
        </div>
      </div>

      <div className="px-8 max-w-[1400px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2 bg-slate-300/50 p-1.5 rounded-2xl w-fit border border-slate-300">
            {['active', 'permanent', 'archive'].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setCurrentTab(tab as any)} 
                className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.1em] transition-all duration-300 ${currentTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}
              >
                {tab === 'active' ? 'Ակտիվ' : tab === 'permanent' ? 'Անժամկետ' : 'Արխիվ'}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 text-[11px] uppercase tracking-wider flex items-center gap-2"
          >
            <PlusCircle size={16} />
            Նոր անժամկետ կցում
          </button>
        </div>

        <div className="bg-slate-50 rounded-[2.5rem] shadow-2xl border border-slate-300 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100/80 border-b border-slate-200">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="p-5 w-24">ID</th>
                <th className="p-5">Օգտատեր</th>
                <th className="p-5">Հեռախոս</th>
                <th className="p-5">Սարք</th>
                <th className="p-5">Սերիա</th>
                <th className="p-5 text-center">Ժամանակաշրջան</th>
                <th className="p-5 text-center">Կարգավիճակ</th>
                <th className="p-5">Գործողություն</th>
              </tr>
              <tr className="bg-white/50 border-b border-slate-100">
                <th className="px-5 pb-4">
                  <input type="text" className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-400 bg-white" placeholder="ID" value={idSearch} onChange={e => setIdSearch(e.target.value)} />
                </th>
                <th className="px-5 pb-4">
                  <input type="text" className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-400 bg-white" placeholder="Անուն" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                </th>
                <th colSpan={6}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/30 backdrop-blur-sm">
              {loading ? (
                <tr><td colSpan={8} className="p-32 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">Բեռնվում է...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={8} className="p-32 text-center text-slate-300 font-bold italic">Տվյալներ չկան</td></tr>
              ) : filteredData.map((res) => {
                const hasConfirmAction = 
                  res.pickupStatus === 'USER_READY' || 
                  res.pickupStatus === 'RETURN_REQUESTED';

                return (
                  <tr key={res.id} className="hover:bg-indigo-50/30 transition-all duration-300">
                    <td className="p-5 text-xs font-black text-indigo-600">#{res.id}</td>
                    <td className="p-5 text-sm font-black text-slate-800">{res.users?.full_name}</td>
                    <td className="p-5 text-xs font-mono font-bold text-slate-500">{res.users?.phone_number || "—"}</td>
                    <td className="p-5 text-sm font-black text-slate-700">{res.assets?.name}</td>
                    <td className="p-5 text-xs font-mono font-bold text-slate-400">{res.assets?.serial_number}</td>
                    <td className="p-5 text-center">
                      <div className="text-[11px] font-black text-slate-700 bg-slate-100 rounded-md py-1 px-2 inline-block mb-1">{formatDateTime(res.start_time)}</div>
                      <div className="text-[11px] font-black text-slate-500 block uppercase">
                        {res.end_time && new Date(res.end_time).getUTCFullYear() < 9000 ? formatDateTime(res.end_time) : "— անժամկետ —"}
                      </div>
                    </td>
                    <td className="p-5 text-center">{getStatusBadge(res)}</td>
                    <td className="p-5">
                      <div className="flex flex-col gap-2">
                        {res.pickupStatus === 'USER_READY' && (
                          <button onClick={() => handleAdminHandover(res.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] px-4 py-2 rounded-xl uppercase shadow-md transition-all active:scale-95">Հաստատել հանձնումը</button>
                        )}
                        
                        {res.pickupStatus === 'RETURN_REQUESTED' && (
                          <button onClick={() => handleConfirmReturn(res.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] px-4 py-2 rounded-xl uppercase shadow-md animate-pulse transition-all active:scale-95">Հաստատել վերադարձը</button>
                        )}

                        {!hasConfirmAction && currentTab !== 'archive' && (
                          <button onClick={() => handleDelete(res.id)} className="text-red-500 font-black text-[10px] uppercase text-left">
                            {currentTab === 'permanent' ? 'Ազատել սարքը' : 'Չեղարկել'}
                          </button>
                        )}
                        {currentTab === 'archive' && <span className="text-slate-300 font-bold uppercase text-[10px]">Արխիվ</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-50 rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 border border-white relative overflow-hidden">
            <h2 className="text-2xl font-black mb-8 text-slate-800 uppercase tracking-tight border-b border-slate-200 pb-4">Կցել սարքը</h2>
            <form onSubmit={handleAdminSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Աշխատակից</label>
                <select className="w-full border border-slate-200 rounded-2xl p-4 text-sm font-bold bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm" required value={formData.userId} onChange={e => setFormData({...formData, userId: e.target.value})}>
                  <option value="">Ընտրել աշխատակից</option>
                  {staff.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Սարքի տեսակ</label>
                <select className="w-full border border-slate-200 rounded-2xl p-4 text-sm font-bold bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm" required value={selectedAssetName} onChange={e => { setSelectedAssetName(e.target.value); setFormData({...formData, assetId: ""}); }}>
                  <option value="">Ընտրել սարքը</option>
                  {assetNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              {selectedAssetName && (
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 shadow-inner">
                  <input type="text" placeholder="Որոնել սերիան..." className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold mb-3 outline-none focus:border-indigo-400 bg-white" value={serialSearch} onChange={e => setSerialSearch(e.target.value)} />
                  <select className="w-full border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold bg-white outline-none h-32" required size={4} value={formData.assetId} onChange={e => setFormData({...formData, assetId: e.target.value})}>
                    {filteredSerials.map(a => <option key={a.id} value={a.id} className="p-2 hover:bg-indigo-100 rounded-lg cursor-pointer"># {a.serial_number}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Կցման սկիզբ</label>
                <input type="datetime-local" className="w-full border border-slate-200 rounded-2xl p-4 text-sm font-bold bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
              </div>
              <div className="flex gap-6 pt-6">
                <button type="button" onClick={() => { setIsModalOpen(false); resetModal(); }} className="flex-1 text-slate-400 font-black hover:text-slate-600 transition-colors uppercase text-xs tracking-widest">Չեղարկել</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all uppercase text-[11px] tracking-widest">
                  {isSubmitting ? "..." : "Հաստատել"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}