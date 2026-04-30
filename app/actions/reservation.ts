'use server'

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Ժամանակի փոխակերպում UTC-ի՝ շփոթմունքներից խուսափելու համար
const parseToUTC = (isoString: string) => {
  const date = new Date(isoString);
  return new Date(Date.UTC(
    date.getFullYear(), 
    date.getMonth(), 
    date.getDate(), 
    date.getHours(), 
    date.getMinutes()
  ));
};

export async function getReservations() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return [];

    // Ստուգում ենք՝ արդյոք օգտատերը ադմին է
    const isAdmin = (session.user as any).role === 'admin';

    // Եթե ադմին է, where-ը դատարկ է (բերում է բոլորը), եթե ոչ՝ ֆիլտրում ենք user_id-ով
    const whereClause = isAdmin ? {} : { user_id: parseInt(session.user.id) };

    const reservations = await prisma.reservations.findMany({
      where: whereClause,
      include: { 
        assets: true, 
        users: true // Սա անհրաժեշտ է, որ ադմինի էջում ամրագրողի անունը երևա
      },
      orderBy: { start_time: 'desc' },
    });
    
    return reservations;
  } catch (error) {
    console.error("Error fetching reservations:", error);
    throw new Error("Ամրագրումները չհաջողվեց բեռնել։");
  }
}

export async function createReservation(data: {
  assetId: string;
  start_time: string;
  end_time: string | null;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new Error("Դուք մուտք գործած չեք։");
    }

    const requestedAssetId = parseInt(data.assetId);
    
    // 1. Ստանում ենք ընտրված սարքի տվյալները (որպեսզի իմանանք սարքի տեսակը/անունը)
    const requestedAsset = await prisma.assets.findUnique({
      where: { id: requestedAssetId },
    });

    if (!requestedAsset) throw new Error("Սարքը չի գտնվել։");

    const newStartTime = parseToUTC(data.start_time);
    const newEndTime = data.end_time ? parseToUTC(data.end_time) : new Date("9999-12-31");

    // 2. Տրանզակցիա՝ սարք գտնելու և ամրագրելու համար
    const result = await prisma.$transaction(async (tx) => {
      
      // Փնտրում ենք ազատ սարք նույն անունով
      const availableAsset = await tx.assets.findFirst({
        where: {
          name: requestedAsset.name, // Փնտրում ենք նույն տեսակի սարքեր
          NOT: {
            reservations: {
              some: {
                // Եթե կա ամրագրում, որը հատվում է մեր նշած ժամերի հետ
                AND: [
                  { start_time: { lt: newEndTime } },
                  { OR: [{ end_time: { gt: newStartTime } }, { end_time: null }] }
                ]
              }
            }
          }
        }
      });

      if (!availableAsset) {
        throw new Error(`Ներողություն, բոլոր «${requestedAsset.name}» տեսակի սարքերը զբաղված են այդ ժամանակահատվածում։`);
      }

      // Ամրագրում ենք այն սարքը, որը գտանք (կամ նույնը, կամ ուրիշ ազատը)
      const status = data.end_time === null ? "Assigned" : "Reserved";

      const reservation = await tx.reservations.create({
        data: {
          asset_id: availableAsset.id,
          user_id: parseInt(session.user.id),
          start_time: newStartTime,
          end_time: data.end_time ? newEndTime : null,
          status: status,
          verification_token: Math.random().toString(36).substring(7),
        },
      });

      // Եթե անժամկետ է, թարմացնում ենք սարքի ստատուսը
      if (data.end_time === null) {
        await tx.assets.update({
          where: { id: availableAsset.id },
          data: { status: 'Assigned' },
        });
      }

      return reservation;
    });

    revalidatePath('/myreservations');
    return { success: true, data: result };

  } catch (error: any) {
    console.error("Reservation Error:", error);
    throw new Error(error.message || "Ամրագրումը ձախողվեց։");
  }
}

export async function deleteReservation(id: number) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Դուք մուտք գործած չեք");
  }

  const reservation = await prisma.reservations.findUnique({ where: { id } });
  
  if (reservation?.user_id !== parseInt(session.user.id)) {
    throw new Error("Դուք իրավունք չունեք ջնջել այս ամրագրումը");
  }

  await prisma.reservations.delete({
    where: { id },
  });

  revalidatePath('/myreservations'); 
}