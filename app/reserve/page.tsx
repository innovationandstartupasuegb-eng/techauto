import ReservePage from "@/components/ReservePage";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Page() {
  const session = await getServerSession(authOptions);
  
  // Ստուգում ենք սեսիան և դերը
  const user = session?.user as any;
  const userRole = user?.role;

  // 1. canIndefinite - ով կարող է անժամկետ վերցնել
  const canIndefinite = userRole === 'admin' || userRole === 'staff';

  // 2. isActualAdmin - արդյոք ադմին է
  const isActualAdmin = userRole === 'admin';

  // Վերցնում ենք սարքերը
  const allAssets = await prisma.assets.findMany();
  
  // Ֆիլտրում ենք, որպեսզի նույնանուն սարքերը չկրկնվեն ցուցակում
  const uniqueAssetsMap = new Map();
  allAssets.forEach(asset => {
    if (!uniqueAssetsMap.has(asset.name)) {
      uniqueAssetsMap.set(asset.name, asset);
    }
  });

  const uniqueAssets = Array.from(uniqueAssetsMap.values());

  return (
    <div className="container mx-auto p-4">
      {/* Վերնագիրը հեռացված է այստեղից */}
      <ReservePage 
        assets={uniqueAssets} 
        canIndefinite={canIndefinite} 
        isActualAdmin={isActualAdmin} 
      />
    </div>
  );
}