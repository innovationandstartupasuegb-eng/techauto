import { getReservations, deleteReservation } from "@/app/actions/reservation";
import PickupButton from "@/app/myreservations/PickupButton";

export default async function MyReservationsPage() {
  const reservations = await getReservations('all');

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return "-";
    const d = new Date(date);
    if (d.getFullYear() > 9000) return "— անժամկետ —";

    // Օգտագործում ենք UTC մեթոդները, որպեսզի JS-ը չավելացնի տեղական +4 շեղումը
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = d.getUTCFullYear();
    const hours = d.getUTCHours().toString().padStart(2, '0');
    const minutes = d.getUTCMinutes().toString().padStart(2, '0');

    return `${day}.${month}.${year}, ${hours}:${minutes}`;
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Իմ ամրագրումները</h1>
      
      {reservations.length === 0 ? (
        <p className="text-gray-500 font-medium bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          Դեռևս ամրագրումներ չկան։
        </p>
      ) : (
        <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-200">
          <table className="min-w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-1/4 px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Սարք</th>
                <th className="w-1/4 px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Սկիզբ</th>
                <th className="w-1/4 px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ավարտ</th>
                <th className="w-1/6 px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Կարգավիճակ</th>
                <th className="w-1/6 px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Գործողություն</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-black">
              {reservations.map((res) => (
                <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{res.assets?.name || "Անհայտ"}</div>
                    <div className="text-[10px] font-mono text-gray-400">{res.assets?.serial_number}</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700 font-semibold text-left">
                    {formatDateTime(res.start_time)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">
                    {res.end_time ? formatDateTime(res.end_time) : <span className="italic text-gray-400">Անժամկետ</span>}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {/* PickupButton-ը կառավարում է "Ստացել եմ" և "Վերադարձնել" կոճակները */}
                    <PickupButton 
                      resId={res.id} 
                      startTime={res.start_time!} 
                      pickupStatus={(res as any).pickupStatus || "PENDING"} 
                    />
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {/* Չեղարկել կոճակը երևում է միայն PENDING վիճակում գտնվող սովորական (Reserved) հայտերի համար */}
                    {res.status === 'Reserved' && (res as any).pickupStatus === 'PENDING' && (
                      <form action={async () => {
                        "use server";
                        await deleteReservation(res.id);
                      }}>
                        <button 
                          type="submit" 
                          className="text-red-600 hover:text-red-900 font-bold text-sm cursor-pointer"
                        >
                          Չեղարկել
                        </button>
                      </form>
                    )}
                    {/* Անժամկետի դեպքում (Assigned) այստեղ կոճակ չի լինի, քանի որ աշխատողը պետք է օգտվի "Վերադարձնել"-ից */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}