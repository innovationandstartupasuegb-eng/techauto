'use client';

import { useState, useEffect, useMemo } from "react";
import { 
  getReservations, 
  deleteReservation, 
  getUniqueAssetNames, 
  getStaffUsers, 
  getAssets, 
  createPermanentAssignment 
} from "@/app/actions/reservation";

export default function AllReservationsPage() {
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

  // Ստեղծում ենք ընթացիկ ժամը տեղական ֆորմատով (YYYY-MM-DDTHH:mm) input-ի համար
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

  useEffect(() => {
    loadInitialData(currentTab);
  }, [currentTab]);

  // --- ԺԱՄԻ ՈՒՂՂՎԱԾ ՖՈՒՆԿՑԻԱ ---
const formatDateTime = (dateVal: any) => {
  if (!dateVal) return "—";
  
  try {
    // Ստեղծում ենք Date օբյեկտ
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return "—";

    // Prisma-ն տալիս է UTC: Ստուգում ենք՝ արդյոք տեքստի մեջ կա 'Z' կամ timezone:
    // Եթե չկա, ստիպում ենք JS-ին հասկանալ, որ սա UTC է:
    let d = date;
    if (typeof dateVal === 'string' && !dateVal.includes('Z') && !dateVal.includes('+')) {
      d = new Date(dateVal + 'Z');
    }

    return d.toLocaleString('hy-AM', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Yerevan' // Սա կավելացնի անհրաժեշտ 4 ժամը
    });
  } catch (e) {
    return "—";
  }
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
    const message = currentTab === 'permanent' 
      ? "Վստա՞հ եք, որ ուզում եք ազատել այս սարքը աշխատակցից:" 
      : "Վստա՞հ եք, որ ուզում եք չեղարկել ամրագրումը և ազատել սարքը։";
      
    if (confirm(message)) {
      try {
        await deleteReservation(id);
        setReservations(prev => prev.filter(r => r.id !== id));
        loadInitialData();
      } catch (err) {
        alert("Գործողությունը չհաջողվեց");
      }
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId || !formData.assetId) return alert("Խնդրում ենք լրացնել բոլոր դաշտերը");
    
    setIsSubmitting(true);
    try {
      await createPermanentAssignment({
        userId: parseInt(formData.userId),
        assetId: parseInt(formData.assetId),
        start_time: formData.start_time
      });
      alert("Սարքը հաջողությամբ կցվեց աշխատակցին (Անժամկետ):");
      setIsModalOpen(false);
      resetModal();
      await loadInitialData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setSelectedAssetName("");
    setSerialSearch("");
    setFormData({
      userId: "",
      assetId: "",
      start_time: getNow(),
    });
  };

  const getStatusBadge = (res: any) => {
    const s = res.pickupStatus;
    const commonStyle = "px-2 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm border";
    
    switch (s) {
      case 'RETURNED': return <span className={`${commonStyle} bg-gray-100 text-gray-600 border-gray-200`}>Վերադարձված</span>;
      case 'CANCELLED': return <span className={`${commonStyle} bg-red-50 text-red-600 border-red-100`}>Չեղարկված</span>;
      case 'IN_USE': return <span className={`${commonStyle} bg-blue-100 text-blue-800 border-blue-200`}>Վերցված է</span>;
      case 'RETURN_REQUESTED': return <span className={`${commonStyle} bg-yellow-100 text-yellow-800 border-yellow-200`}>Վերադարձի հայտ</span>;
      case 'USER_READY': return <span className={`${commonStyle} bg-purple-100 text-purple-800 border-purple-200`}>Պատրաստ է</span>;
      default: return <span className={`${commonStyle} bg-green-100 text-green-800 border-green-200`}>Ամրագրված</span>;
    }
  };

  return (
    <div className="p-8 text-black bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6 text-black">
        <h1 className="text-2xl font-bold text-gray-800">Ամրագրումների Կառավարում</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all text-sm"
        >
          + Ստեղծել անժամկետ ամրագրում
        </button>
      </div>

      <div className="flex gap-8 mb-6 border-b border-gray-200 bg-white px-6 rounded-t-xl shadow-sm">
        {['active', 'permanent', 'archive'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setCurrentTab(tab as any)}
            className={`py-4 px-2 text-sm font-bold transition-all relative ${currentTab === tab ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {tab === 'active' ? 'Ակտիվ ամրագրումներ' : tab === 'permanent' ? 'Անժամկետ (Assigned)' : 'Արխիվ'}
            {currentTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full"></div>}
          </button>
        ))}
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2 text-blue-800">Նոր անժամկետ կցում</h2>
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Աշխատակից</label>
                <select className="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black" required value={formData.userId} onChange={(e) => setFormData({...formData, userId: e.target.value})}>
                  <option value="">Ընտրել վարչական աշխատողին</option>
                  {staff.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Սարքի տեսակ</label>
                <select className="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black" required value={selectedAssetName} onChange={(e) => { setSelectedAssetName(e.target.value); setFormData({...formData, assetId: ""}); }}>
                  <option value="">Ընտրել սարքի անվանումը</option>
                  {assetNames.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              {selectedAssetName && (
                <div className="pt-2 border-t">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Որոնել սերիական համարը</label>
                  <input type="text" placeholder="Մուտքագրեք սերիան..." className="w-full border border-blue-200 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 mb-2 bg-blue-50/20 text-black font-mono" value={serialSearch} onChange={(e) => setSerialSearch(e.target.value)} />
                  <select className="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white text-black" required size={4} value={formData.assetId} onChange={(e) => setFormData({...formData, assetId: e.target.value})}>
                    {filteredSerials.map(a => <option key={a.id} value={a.id} className="p-1">{a.serial_number}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Կցման սկիզբ</label>
                <input type="datetime-local" className="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black" value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setIsModalOpen(false); resetModal(); }} className="flex-1 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg">Չեղարկել</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg">{isSubmitting ? "..." : "Հաստատել"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white shadow-xl rounded-b-xl overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-4 text-left align-top w-20">
                <span className="block text-xs font-bold text-gray-500 uppercase mb-2">ID</span>
                <input type="text" placeholder="#" className="block w-full border border-gray-300 rounded px-1 py-1 text-sm bg-white text-black" value={idSearch} onChange={(e) => setIdSearch(e.target.value)} />
              </th>
              <th className="px-4 py-4 text-left align-top">
                <span className="block text-xs font-bold text-gray-500 uppercase mb-2">Օգտատեր</span>
                <input type="text" placeholder="🔍 որոնել..." className="block w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white text-black" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase align-top">Հեռախոս</th>
              <th className="px-4 py-4 text-left align-top">
                <span className="block text-xs font-bold text-gray-500 uppercase mb-2">Սարք</span>
                <select className="block w-full border border-gray-300 rounded px-1 py-1 text-sm bg-white text-black" value={assetNameFilter} onChange={(e) => setAssetNameFilter(e.target.value)}>
                  <option value="all">Բոլորը</option>
                  {assetNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase align-top">Սերիա</th>
              <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase align-top">Ժամանակաշրջան</th>
              <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase align-top">Կարգավիճակ</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase align-top">Գործողություն</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-black">
            {loading && reservations.length === 0 ? (
               <tr><td colSpan={8} className="py-20 text-center text-gray-400 font-bold">Բեռնվում է...</td></tr>
            ) : filteredData.map((res: any) => (
              <tr key={res.id} className="hover:bg-blue-50/50 transition-colors">
                <td className="px-3 py-4 text-xs font-bold text-blue-600 bg-blue-50/30">#{res.id}</td>
                <td className="px-4 py-4 text-sm font-semibold">{res.users?.full_name}</td>
                <td className="px-4 py-4 text-sm text-gray-600 font-mono">{res.users?.phone_number || "—"}</td>
                <td className="px-4 py-4 text-sm font-bold text-gray-800">{res.assets?.name}</td>
                <td className="px-4 py-4 text-xs font-mono text-gray-500">{res.assets?.serial_number}</td>
                <td className="px-4 py-4 text-xs text-center text-gray-700">
                  <div className="font-bold text-blue-700">{formatDateTime(res.start_time)}</div>
                  <div className="text-gray-400 mt-1">
                    {res.end_time && new Date(res.end_time).getFullYear() < 9000 ? formatDateTime(res.end_time) : "— անժամկետ —"}
                  </div>
                </td>
                <td className="px-4 py-4 text-center">{getStatusBadge(res)}</td>
                <td className="px-4 py-4 text-sm">
                  {currentTab !== 'archive' && (
                    <button onClick={() => handleDelete(res.id)} className="text-red-600 font-bold hover:underline cursor-pointer">
                      {currentTab === 'permanent' ? 'Ազատել' : 'Չեղարկել'}
                    </button>
                  )}
                  {currentTab === 'archive' && <span className="text-gray-400 italic text-xs">Արխիվացված</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}