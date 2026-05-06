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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedAssetName, setSelectedAssetName] = useState("");
  const [serialSearch, setSerialSearch] = useState("");

  // Փոփոխված՝ Տեղական ժամը ճիշտ ֆորմատով ստանալու համար
  const getNow = () => new Date().toLocaleString('sv-SE').slice(0, 16).replace(' ', 'T');

  const [formData, setFormData] = useState({
    userId: "",
    assetId: "",
    start_time: getNow(),
  });

  const [userSearch, setUserSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assetNameFilter, setAssetNameFilter] = useState("all");

  const loadInitialData = async () => {
    try {
      const [resData, namesData, staffData, assetsData] = await Promise.all([
        getReservations(),
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
    loadInitialData();
  }, []);

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
      const matchesUser = fullName.toLowerCase().includes(userSearch.toLowerCase());
      const matchesStatus = statusFilter === "all" || res.status === statusFilter;
      const matchesAssetName = assetNameFilter === "all" || assetName === assetNameFilter;
      return matchesUser && matchesStatus && matchesAssetName;
    });
  }, [userSearch, statusFilter, assetNameFilter, reservations]);

  const handleDelete = async (id: number) => {
    if (confirm("Վստա՞հ եք, որ ուզում եք չեղարկել ամրագրումը և ազատել սարքը։")) {
      try {
        await deleteReservation(id);
        setReservations(prev => prev.filter(r => r.id !== id));
        loadInitialData();
      } catch (err) {
        alert("Չհաջողվեց ջնջել");
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
      start_time: getNow(), // Փոփոխված
    });
  };

  if (loading) return <div className="p-8 text-center font-medium text-black">Բեռնվում է...</div>;

  return (
    <div className="p-8 text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Բոլոր ամրագրումները</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all text-sm"
        >
          + Ստեղծել անժամկետ ամրագրում
        </button>
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2 text-blue-800">Նոր անժամկետ կցում</h2>
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Աշխատակից</label>
                <select 
                  className="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                  required
                  value={formData.userId}
                  onChange={(e) => setFormData({...formData, userId: e.target.value})}
                >
                  <option value="">Ընտրել վարչական աշխատողին</option>
                  {staff.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Սարքի տեսակ</label>
                <select 
                  className="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                  required
                  value={selectedAssetName}
                  onChange={(e) => {
                    setSelectedAssetName(e.target.value);
                    setFormData({...formData, assetId: ""});
                  }}
                >
                  <option value="">Ընտրել սարքի անվանումը</option>
                  {assetNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {selectedAssetName && (
                <div className="pt-2 border-t">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Որոնել սերիական համարը</label>
                  <input 
                    type="text"
                    placeholder="Մուտքագրեք սերիական համարը..."
                    className="w-full border border-blue-200 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 mb-2 bg-blue-50/20 text-black"
                    value={serialSearch}
                    onChange={(e) => setSerialSearch(e.target.value)}
                  />
                  <select 
                    className="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white text-black"
                    required
                    size={4}
                    value={formData.assetId}
                    onChange={(e) => setFormData({...formData, assetId: e.target.value})}
                  >
                    {filteredSerials.map(a => (
                      <option key={a.id} value={a.id} className="p-1">
                        {a.serial_number}
                      </option>
                    ))}
                    {filteredSerials.length === 0 && <option disabled>Ազատ սարք չկա</option>}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Կցման սկիզբ</label>
                <input 
                  type="datetime-local"
                  className="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                  value={formData.start_time}
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                />
                <p className="text-[10px] text-gray-400 mt-1 italic">* Այս ամրագրումը չունի ավարտի ժամկետ</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetModal(); }}
                  className="flex-1 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Չեղարկել
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {isSubmitting ? "Կատարվում է..." : "Հաստատել"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ԱՂՅՈՒՍԱԿ (Անփոփոխ՝ ձեր ֆորմատով) --- */}
      <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-4 text-left align-top">
                <span className="block text-xs font-bold text-gray-500 uppercase mb-2">Օգտատեր</span>
                <input 
                  type="text"
                  placeholder="🔍 որոնել..."
                  className="block w-full border border-gray-300 rounded px-2 py-1 text-sm font-normal outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white text-black"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase align-top">Հեռախոս</th>
              <th className="px-4 py-4 text-left align-top">
                <span className="block text-xs font-bold text-gray-500 uppercase mb-2">Սարք</span>
                <select 
                  className="block w-full border border-gray-300 rounded px-1 py-1 text-sm font-normal outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 shadow-sm bg-white text-black"
                  value={assetNameFilter}
                  onChange={(e) => setAssetNameFilter(e.target.value)}
                >
                  <option value="all">Բոլորը</option>
                  {assetNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase align-top">Սերիա</th>
              <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase align-top">Ժամանակաշրջան</th>
              <th className="px-4 py-4 text-left align-top">
                <span className="block text-xs font-bold text-gray-500 uppercase mb-2">Ստատուս</span>
                <select 
                  className="block w-full border border-gray-300 rounded px-1 py-1 text-sm font-normal outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white text-black"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Բոլորը</option>
                  <option value="Reserved">Ամրագրված</option>
                  <option value="Assigned">Տրամադրված</option>
                </select>
              </th>
              <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase align-top">Գործողություն</th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200 text-black">
            {filteredData.map((res: any) => (
              <tr key={res.id} className="hover:bg-blue-50/50 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold">
                  {res.users?.full_name}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                  {res.users?.phone_number || "—"}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                  {res.assets?.name}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                  {res.assets?.serial_number}
                </td>
                
                <td className="px-4 py-4 whitespace-nowrap text-xs text-center text-gray-700">
                  <div className="font-bold text-blue-700">
                    {new Date(res.start_time).toLocaleString('hy-AM', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit',
                      timeZone: 'UTC' 
                    })}
                  </div>
                  <div className="text-gray-400 mt-1">
                    {res.end_time && new Date(res.end_time).getFullYear() < 9000 
                      ? new Date(res.end_time).toLocaleString('hy-AM', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit',
                          timeZone: 'UTC' 
                        }) 
                      : "— անժամկետ —"}
                  </div>
                </td>

                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    res.status === 'Assigned' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {res.status === 'Assigned' ? 'Տրամադրված' : 'Ամրագրված'}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <button 
                    onClick={() => handleDelete(res.id)}
                    className="text-red-600 font-bold hover:underline cursor-pointer"
                  >
                    Չեղարկել
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}