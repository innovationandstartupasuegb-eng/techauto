import { getReservations, deleteReservation } from "@/app/actions/reservation";
import PickupButton from "@/app/myreservations/PickupButton";

export default async function MyReservationsPage() {
  const reservations = await getReservations();

  // Այս ֆունկցիան պետք է լինի այստեղ, որպեսզի TypeScript-ը տեսնի այն
  const formatDateTime = (date: Date | string | null) => {
    if (!date) return "-";
    const d = new Date(date);
    if (d.getFullYear() > 9000) return "— անժամկետ —";

    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = d.getUTCFullYear();
    const hours = d.getUTCHours().toString().padStart(2, '0');
    const minutes = d.getUTCMinutes().toString().padStart(2, '0');

    return `${day}.${month}.${year}, ${hours}:${minutes}`;
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Իմ ամրագրումները</h1>
      
      {reservations.length === 0 ? (
        <p className="text-gray-500 font-medium">Դեռևս ամրագրումներ չկան։</p>
      ) : (
        <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-200">
          <table className="min-w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-1/4 px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase italic">Սարք</th>
                <th className="w-1/4 px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase italic">Սկիզբ</th>
                <th className="w-1/4 px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase italic">Ավարտ</th>
                <th className="w-1/6 px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase italic">Ստացում</th>
                <th className="w-1/6 px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase italic">Գործողություն</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reservations.map((res) => (
                <tr key={res.id} className="hover:bg-gray-50 transition-colors text-left">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{res.assets?.name || "Անհայտ"}</div>
                    <div className="text-[10px] font-mono text-gray-400">{res.assets?.serial_number}</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700 font-semibold">
                    {formatDateTime(res.start_time)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">
                    {res.end_time ? formatDateTime(res.end_time) : (
                      <span className="italic text-gray-400">Անժամկետ</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <PickupButton 
                      resId={res.id} 
                      startTime={res.start_time!} 
                      // Ուշադրություն. օգտագործիր այն անունը, որը Prisma-ն ընդունել է (pickupStatus)
                      pickupStatus={(res as any).pickupStatus || "PENDING"} 
                    />
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-left">
                    {/* Չեղարկել կարելի է միայն եթե դեռ PENDING է */}
                    {(res as any).pickupStatus === 'PENDING' && (
                      <form action={async () => {
                        "use server";
                        await deleteReservation(res.id);
                      }}>
                        <button 
                          type="submit" 
                          className="text-red-600 hover:text-red-900 font-bold text-sm transition-colors cursor-pointer"
                        >
                          Չեղարկել
                        </button>
                      </form>
                    )}
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