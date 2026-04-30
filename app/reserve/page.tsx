import ReservePage from "@/components/ReservePage";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Page() {
  const session = await getServerSession(authOptions);
  
  // Ստուգում ենք՝ արդյոք դերը 'admin' է կամ 'staff'
  // (Համոզվիր, որ ստուգում ես հենց այն արժեքները, որոնք կան քո Prisma enum-ում)
  const userRole = session?.user?.role;
  const isAdminOrStaff = userRole === 'admin' || userRole === 'staff';

  const allAssets = await prisma.assets.findMany();
  
  const uniqueAssetsMap = new Map();
  allAssets.forEach(asset => {
    if (!uniqueAssetsMap.has(asset.name)) {
      uniqueAssetsMap.set(asset.name, asset);
    }
  });

  const uniqueAssets = Array.from(uniqueAssetsMap.values());

  // isAdmin անվանումը պահում ենք, որ քո ReservePage կոմպոնենտում ոչինչ չփոխվի, 
  // բայց հիմա այն իրականում նշանակում է "ունի անժամկետ ամրագրման իրավունք"
  return <ReservePage assets={uniqueAssets} isAdmin={isAdminOrStaff} />;
}