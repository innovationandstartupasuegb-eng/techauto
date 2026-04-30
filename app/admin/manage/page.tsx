import ManageClient from "@/components/ManageClient";
import { prisma } from "@/lib/prisma";

export default async function ManagePage() {
  // Տվյալների բերումը ուղղակիորեն
  const assets = await prisma.assets.findMany({
    orderBy: { id: 'desc' }
  });

  // Էջի ցուցադրումը
  return <ManageClient assets={assets} />;
}