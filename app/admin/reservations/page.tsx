import { getReservations, deleteReservation } from "@/app/actions/reservation";

export default async function AllReservationsPage() {
  const reservations = await getReservations();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Բոլոր ամրագրումները</h1>
      
      {reservations.length === 0 ? (
        <p className="text-gray-500">Դեռևս ամրագրումներ չկան։</p>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Օգտատեր</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Սարք</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Սկիզբ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ավարտ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ստատուս</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Գործողություն</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reservations.map((res: any) => (
                <tr key={res.id}>
                  {/* Ամրագրողի անունը */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {res.users?.full_name || res.users?.name || "Անհայտ օգտատեր"}
                  </td>

                  {/* Սարք */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {res.assets?.name || "Անհայտ սարք"}
                  </td>
                  
                  {/* Սկիզբ (առանց հավելյալ հաշվարկների) */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {res.start_time ? (
                      new Date(res.start_time).toLocaleString('hy-AM', { 
                        dateStyle: 'short', 
                        timeStyle: 'short' 
                      })
                    ) : "-"}
                  </td>
                  
                  {/* Ավարտ (առանց հավելյալ հաշվարկների) */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {res.end_time ? (
                      new Date(res.end_time).toLocaleString('hy-AM', { 
                        dateStyle: 'short', 
                        timeStyle: 'short' 
                      })
                    ) : (
                      <span className="italic text-gray-400">Անժամկետ</span>
                    )}
                  </td>
                  
                  {/* Ստատուս */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${res.status === 'Assigned' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {res.status}
                    </span>
                  </td>

                  {/* Ջնջելու կոճակ */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <form action={async () => {
                      "use server";
                      await deleteReservation(res.id);
                    }}>
                      <button 
                        type="submit" 
                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                      >
                        Չեղարկել
                      </button>
                    </form>
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