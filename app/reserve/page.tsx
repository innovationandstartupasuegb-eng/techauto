import ReservePage from "@/components/ReservePage";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await getServerSession(authOptions);
  
  // Եթե օգտատերը մուտք չի գործել, վերահասցեավորում ենք login էջ
  if (!session?.user) {
    redirect("/auth/signin"); // կամ քո login էջի հասցեն
  }

  const user = session.user as { id: string; role: string };
  const userRole = user.role;

  // Իրավասությունների ստուգում
  const canIndefinite = userRole === 'admin' || userRole === 'staff';
  const isActualAdmin = userRole === 'admin';

  // 1. Վերցնում ենք ԲՈԼՈՐ սարքերը բազայից
  const allAssets = await prisma.assets.findMany({
    orderBy: { name: 'asc' }
  });

  // 2. Ստեղծում ենք եզակի ԱՆՈՒՆՆԵՐՈՎ ցուցակ (առաջին dropdown-ի համար)
  // map-ով վերցնում ենք միայն այն սարքերը, որոնց անունն առաջին անգամ է հանդիպում
  const uniqueAssetTypes = allAssets.filter((asset, index, self) =>
    index === self.findIndex((t) => t.name === asset.name)
  );

  return (
    <div className="container mx-auto p-4">
      <ReservePage 
        assets={uniqueAssetTypes} 
        allAssets={allAssets}     
        canIndefinite={canIndefinite} 
        isActualAdmin={isActualAdmin} 
      />
    </div>
  );
}