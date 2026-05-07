import Link from 'next/link'; 
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ManageClient from "@/components/ManageClient";
import { prisma } from "@/lib/prisma";
// 1. Ներմուծիր քո Modal կոմպոնենտը
import AdminNotificationModal from "@/components/AdminNotificationModal"; 

export default function AdminDashboard() {
  const menuItems = [
    { title: 'Ամրագրել տեխնիկա', path: '/reserve', color: 'bg-blue-500' },
    { title: 'Բոլոր ամրագրումները', path: '/admin/reservations', color: 'bg-green-500' },
    { title: 'Տեխնիկայի բազա', path: '/admin/manage', color: 'bg-purple-600' },
  ];

  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-screen">
      {/* 2. Տեղադրիր Modal-ը այստեղ: Այն տեսանելի չի լինի, քանի դեռ ազդակ չի ստացել */}
      <AdminNotificationModal />

      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        {menuItems.map((item) => (
          <Link href={item.path} key={item.title} className="w-full">
            <div className={`${item.color} text-white p-6 rounded-xl shadow-lg hover:scale-105 transition duration-300 text-center`}>
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <p className="mt-2 text-white/80">Սեղմեք բաժինն անցնելու համար</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}