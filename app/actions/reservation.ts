'use server'

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Օգնող ֆունկցիա՝ ամսաթիվը UTC ձևաչափի բերելու համար
 */
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

// --- ԱԴՄԻՆԻ ՖՈՒՆԿՑԻԱՆԵՐ ---

/**
 * Բերում է միայն 'staff' դեր ունեցող օգտատերերին
 */
export async function getStaffUsers() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!session || user?.role !== 'admin') return [];

    return await prisma.users.findMany({
      where: { role: 'staff' },
      select: { id: true, full_name: true },
      orderBy: { full_name: 'asc' }
    });
  } catch (error) {
    console.error("Error fetching staff users:", error);
    return [];
  }
}

/**
 * Ադմինի կողմից սարքի անժամկետ կցում աշխատակցին
 */
export async function createPermanentAssignment(data: {
  assetId: number;
  userId: number;
  start_time: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    const adminUser = session?.user as any;

    if (!session || adminUser?.role !== 'admin') {
      throw new Error("Այս գործողությունը թույլատրված է միայն ադմինին։");
    }

    const newStartTime = parseToUTC(data.start_time);

    const result = await prisma.$transaction(async (tx) => {
      const conflict = await tx.reservations.findFirst({
        where: {
          asset_id: data.assetId,
          status: { in: ["Reserved", "Assigned"] },
          AND: [
            { OR: [{ end_time: { gt: newStartTime } }, { end_time: null }] }
          ]
        }
      });

      if (conflict) {
        throw new Error("Այս սարքը ներկայումս զբաղված է կամ արդեն կցված է մեկ այլ անձի։");
      }

      const reservation = await tx.reservations.create({
        data: {
          asset_id: data.assetId,
          user_id: data.userId,
          start_time: newStartTime,
          end_time: null,
          status: 'Assigned',
        },
      });

      await tx.assets.update({
        where: { id: data.assetId },
        data: { status: 'Assigned' },
      });

      return reservation;
    });

    revalidatePath('/admin/reservations');
    revalidatePath('/myreservations');
    return { success: true, data: result };
  } catch (error: any) {
    throw new Error(error.message || "Անժամկետ կցումը ձախողվեց։");
  }
}

// --- ՀԻՄՆԱԿԱՆ ՖՈՒՆԿՑԻԱՆԵՐ ---

/**
 * Ստեղծում է ամրագրում (ժամանակավոր կամ անժամկետ)
 */
export async function createReservation(data: {
  assetId: string;
  start_time: string;
  end_time: string | null;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Դուք մուտք գործած չեք։");

    const user = session.user as any;
    const requestedAssetId = parseInt(data.assetId);
    
    const requestedAsset = await prisma.assets.findUnique({ where: { id: requestedAssetId } });
    if (!requestedAsset) throw new Error("Սարքը չի գտնվել։");

    const newStartTime = parseToUTC(data.start_time);
    const newEndTime = data.end_time ? parseToUTC(data.end_time) : new Date("2099-12-31");

    const result = await prisma.$transaction(async (tx) => {
      const availableAsset = await tx.assets.findFirst({
        where: {
          name: requestedAsset.name,
          NOT: {
            reservations: { 
              some: {
                status: { in: ['Reserved', 'Assigned'] },
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
        throw new Error(`Ներողություն, բոլոր «${requestedAsset.name}» տեսակի սարքերը զբաղված են։`);
      }

      const isPermanent = data.end_time === null;

      const reservation = await tx.reservations.create({
        data: {
          asset_id: availableAsset.id,
          user_id: parseInt(user.id),
          start_time: newStartTime,
          end_time: isPermanent ? null : newEndTime,
          status: isPermanent ? 'Assigned' : 'Reserved',
        },
      });
      
      if (isPermanent) {
        await tx.assets.update({
          where: { id: availableAsset.id },
          data: { status: 'Assigned' },
        });
      }

      return reservation;
    });

    revalidatePath('/myreservations');
    revalidatePath('/admin/reservations');
    return { success: true, data: result };

  } catch (error: any) {
    throw new Error(error.message || "Ամրագրումը ձախողվեց։");
  }
}

/**
 * Ջնջում է ամրագրումը և ազատում սարքը
 */
export async function deleteReservation(id: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Մուտք գործած չեք");

    const user = session.user as any;
    
    const reservation = await prisma.reservations.findUnique({ 
      where: { id: id } 
    });

    if (!reservation) return;

    if (reservation.user_id !== parseInt(user.id) && user.role !== 'admin') {
      throw new Error("Իրավասություն չունեք");
    }

    if (reservation.asset_id !== null) {
      const assetIdToUpdate: number = reservation.asset_id;

      await prisma.$transaction([
        prisma.reservations.delete({ where: { id: id } }),
        prisma.assets.update({
          where: { id: assetIdToUpdate },
          data: { status: 'Available' }
        })
      ]);
    } else {
      await prisma.reservations.delete({ where: { id: id } });
    }

    revalidatePath('/myreservations'); 
    revalidatePath('/admin/reservations');
  } catch (error: any) {
    console.error("Delete Error:", error.message);
    throw error;
  }
}

export async function getReservations() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return [];

    const user = session.user as any;
    const currentUserId = parseInt(user.id);

    if (isNaN(currentUserId)) return [];

    const whereClause = user.role === 'admin' ? {} : { user_id: currentUserId };

    return await prisma.reservations.findMany({
      where: whereClause,
      include: { 
        assets: true, 
        users: { select: { id: true, full_name: true, phone_number: true } }   
      },
      orderBy: { start_time: 'desc' },
    });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return [];
  }
}

export async function getAssets() {
  try {
    return await prisma.assets.findMany({ orderBy: { name: 'asc' } });
  } catch (error) {
    return [];
  }
}

export async function getUniqueAssetNames() {
  try {
    const assets = await prisma.assets.findMany({
      distinct: ['name'],
      select: { name: true },
      orderBy: { name: 'asc' }
    });
    return assets.map(a => a.name);
  } catch (error) {
    return [];
  }
}