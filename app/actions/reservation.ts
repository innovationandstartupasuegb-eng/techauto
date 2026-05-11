'use server'

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Օգնող ֆունկցիա՝ ամսաթիվը UTC ձևաչափի բերելու համար։
 * Հեռացրել ենք ստիպողաբար 'Z' ավելացնելը, որպեսզի JS-ը ճիշտ հասկանա տեղական ժամը։
 */
const parseToUTC = (isoString: string) => {
  if (!isoString) return new Date("Invalid");
  return new Date(isoString);
};

// --- ՎԱԼԻԴԱՑԻԱՅԻ ՖՈՒՆԿՑԻԱՆԵՐ ---

export async function requestPickup(reservationId: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Մուտք գործած չեք։");

    await prisma.reservations.update({
      where: { id: reservationId },
      data: { pickupStatus: 'USER_READY' }
    });
    
    revalidatePath('/myreservations');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Չհաջողվեց ուղարկել հարցումը" };
  }
}

export async function getAssets() {
  try {
    return await prisma.assets.findMany({ 
      orderBy: { 
        name: 'asc' 
      } 
    });
  } catch (error) {
    console.error("Error fetching assets:", error);
    return [];
  }
}

export async function confirmAdminHandover(reservationId: number) {
  try {
    await prisma.reservations.update({
      where: { id: reservationId },
      data: { pickupStatus: 'IN_USE' },
    });

    revalidatePath('/admin/reservations');
    revalidatePath('/myreservations');
    
    return { success: true };
  } catch (error) {
    console.error("Հանձնման սխալ:", error);
    return { success: false, error: "Չհաջողվեց հաստատել հանձնումը" };
  }
}

export async function getAvailableSlots(assetId: number, dateString: string) {
  try {
    const startOfDay = new Date(`${dateString}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateString}T23:59:59.999Z`);

    const reservations = await prisma.reservations.findMany({
      where: {
        asset_id: assetId,
        status: { in: ['Reserved', 'Assigned'] },
        OR: [
          // 1. Սովորական ամրագրումներ, որոնք ինչ-որ կերպ հատվում են այս օրվա հետ
          {
            AND: [
              { start_time: { lte: endOfDay } },
              { 
                OR: [
                  { end_time: { gte: startOfDay } },
                  { end_time: null } // Սա ընդգրկում է անժամկետները
                ] 
              }
            ]
          }
        ]
      },
      orderBy: { start_time: 'asc' }
    });

    return { reservations, workEnd: "17:20" };
  } catch (error) {
    console.error("Error fetching slots:", error);
    return null;
  }
}

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
    
    if (isNaN(newStartTime.getTime())) {
      throw new Error("Սկզբնաժամկետի ձևաչափը սխալ է:");
    }

    const result = await prisma.$transaction(async (tx: any) => {
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
          pickupStatus: 'IN_USE'
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

export async function createReservation(data: {
  assetId: string;
  assetName?: string;
  start_time: string;
  end_time: string | null;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Դուք մուտք գործած չեք։");

    const user = session.user as any;
    
    // 1. Ստեղծում ենք ժամանակավոր Date օբյեկտներ՝ ստուգման համար
    const checkStartTime = new Date(data.start_time);
    const checkEndTime = data.end_time ? new Date(data.end_time) : null;

    // 2. ՍՏՈՒԳՈՒՄ (Անում ենք սա նախքան 4 ժամ ավելացնելը)
    if (data.end_time && checkEndTime) {
      const limit = new Date(checkStartTime);
      limit.setHours(17, 20, 0, 0); 
      
      if (checkEndTime > limit) {
        throw new Error("Ամրագրումը հնարավոր է միայն մինչև ժամը 17:20։");
      }
    }

    // 3. Պատրաստում ենք վերջնական ժամերը բազայի համար (UTC+4 ուղղումով)
    const offset = 4 * 60 * 60 * 1000; 
    const newStartTime = new Date(checkStartTime.getTime() + offset);
    const newEndTime = data.end_time 
      ? new Date(checkEndTime!.getTime() + offset) 
      : new Date("2099-12-31T23:59:59Z");

    if (isNaN(newStartTime.getTime()) || (data.end_time && isNaN(newEndTime.getTime()))) {
      throw new Error("Ամսաթվի ձևաչափը սխալ է։");
    }

    // --- ՄՆԱՑԱԾԸ ՄՆՈՒՄ Է ԱՆՓՈՓՈԽ ---
    const result = await prisma.$transaction(async (tx: any) => {
      let targetAssetId: number;

      if (data.assetId === "any" && data.assetName) {
        const availableAsset = await tx.assets.findFirst({
          where: {
            name: data.assetName,
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
          throw new Error(`Ներողություն, բոլոր «${data.assetName}» տեսակի սարքերը զբաղված են։`);
        }
        targetAssetId = availableAsset.id;
      } else {
        targetAssetId = parseInt(data.assetId);
        
        const conflict = await tx.reservations.findFirst({
          where: {
            asset_id: targetAssetId,
            status: { in: ['Reserved', 'Assigned'] },
            AND: [
              { start_time: { lt: newEndTime } },
              { OR: [{ end_time: { gt: newStartTime } }, { end_time: null }] }
            ]
          }
        });

        if (conflict) {
          throw new Error("Այս սերիական համարով սարքն արդեն զբաղված է նշված ժամերին:");
        }
      }

      const isPermanent = data.end_time === null;

      const reservation = await tx.reservations.create({
        data: {
          asset_id: targetAssetId,
          user_id: parseInt(user.id),
          start_time: newStartTime, 
          end_time: isPermanent ? null : newEndTime,
          status: isPermanent ? 'Assigned' : 'Reserved',
          pickupStatus: 'PENDING', 
        },
      });
      
      if (isPermanent) {
        await tx.assets.update({
          where: { id: targetAssetId },
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


export async function deleteReservation(id: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Մուտք գործած չեք");

    const user = session.user as any;
    
    const reservation = await prisma.reservations.findUnique({ 
      where: { id: id } 
    });

    if (!reservation) return { success: false, error: "Ամրագրումը չի գտնվել" };

    if (reservation.user_id !== parseInt(user.id) && user.role !== 'admin') {
      throw new Error("Իրավասություն չունեք");
    }

    // Օգտագործում ենք տրանզակցիա, որպեսզի թե՛ ջնջվի, թե՛ սարքը ազատվի միաժամանակ
    await prisma.$transaction(async (tx) => {
      // 1. Ջնջում ենք ամրագրումը
      await tx.reservations.delete({ 
        where: { id: id } 
      });

      // 2. Եթե ամրագրումը կապված էր սարքի հետ, սարքը սարքում ենք Available
      if (reservation.asset_id) {
        await tx.assets.update({
          where: { id: reservation.asset_id },
          data: { status: 'Available' }
        });
      }
    });

    // ԿԱՐԵՎՈՐ: revalidatePath-ը պետք է կանչվի տրանզակցիայից ԴՈՒՐՍ
    revalidatePath('/myreservations'); 
    revalidatePath('/admin/reservations');
    revalidatePath('/reserve'); // Ավելացրու սա, որ ամրագրման էջն էլ թարմանա
    
    return { success: true };
  } catch (error: any) {
    console.error("Delete Error:", error.message);
    throw error;
  }
}

export async function getReservations(type: 'active' | 'permanent' | 'archive' = 'active') {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return [];

    const userRole = (session.user as any).role;
    // Դարձնում ենք թիվ, որպեսզի Prisma-ն չբողոքի
    const userId = parseInt((session.user as any).id);

    if (isNaN(userId)) {
      console.error("Invalid User ID format");
      return [];
    }

    await cleanupExpiredReservations();

    let whereClause: any = {};

    // Եթե ադմին չէ, ֆիլտրում ենք ըստ իր ID-ի
    if (userRole !== 'admin') {
      whereClause.user_id = userId; // Հիմա սա արդեն թիվ է (Int)
    }

    // Մնացած ֆիլտրերը...
    switch (type) {
      case 'active':
        whereClause.status = 'Reserved';
        whereClause.pickupStatus = { notIn: ['RETURNED', 'CANCELLED'] };
        break;
      case 'permanent':
        whereClause.status = 'Assigned';
        whereClause.pickupStatus = { not: 'RETURNED' };
        break;
      case 'archive':
        whereClause.pickupStatus = { in: ['RETURNED', 'CANCELLED'] };
        break;
    }

    const data = await prisma.reservations.findMany({
      where: whereClause,
      include: { 
        assets: true, 
        users: { select: { id: true, full_name: true, phone_number: true } }   
      },
      orderBy: { start_time: 'desc' },
    });

    return data;
  } catch (error) {
    console.error("getReservations error:", error);
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
    return assets.map((a: any) => a.name);
  } catch (error) {
    return [];
  }
}

export async function requestReturn(reservationId: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Մուտք գործած չեք։");

    await prisma.reservations.update({
      where: { id: reservationId },
      data: { pickupStatus: 'RETURN_REQUESTED' }
    });
    
    revalidatePath('/myreservations');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Չհաջողվեց ուղարկել վերադարձի հարցումը" };
  }
}

export async function confirmReturn(reservationId: number) {
  try {
    const reservation = await prisma.reservations.findUnique({
      where: { id: reservationId }
    });

    if (!reservation) throw new Error("Ամրագրումը չի գտնվել");

    await prisma.$transaction([
      prisma.reservations.update({
        where: { id: reservationId },
        data: { 
          pickupStatus: 'RETURNED',
          // Փոխում ենք ստատուսը 'Returned', որպեսզի այն այլևս չերևա որպես զբաղված սլոթ
          status: 'Available' 
        }
      }),
      prisma.assets.update({
        where: { id: reservation.asset_id! },
        data: { status: 'Available' }
      })
    ]);

    revalidatePath('/admin/reservations');
    revalidatePath('/myreservations');
    
    return { success: true };
  } catch (error: any) {
    console.error("Վերադարձի հաստատման սխալ:", error);
    return { success: false, error: "Չհաջողվեց հաստատել վերադարձը" };
  }
}

// ... (նախորդ կոդը մնում է նույնը մինչև cleanupExpiredReservations ֆունկցիան)

export async function cleanupExpiredReservations() {
  try {
    const now = new Date();
    
    // Շեմը՝ 30 րոպե սկզբից անցած
    const startThreshold = new Date(now.getTime() - (30 * 60 * 1000));

    const expiredReservations = await prisma.reservations.findMany({
      where: {
        status: 'Reserved',
        pickupStatus: 'PENDING',
        OR: [
          {
            // Պայման 1: Ավարտի ժամը անցել է
            end_time: {
              lt: now
            }
          },
          {
            // Պայման 2: Սկզբից անցել է 30 րոպե, բայց դեռ չի վերցվել
            start_time: {
              lt: startThreshold
            }
          }
        ]
      }
    });

    if (expiredReservations.length > 0) {
      const reservationIds = expiredReservations.map(r => r.id);
      const assetIds = expiredReservations
        .map(r => r.asset_id)
        .filter((id): id is number => id !== null);

      await prisma.$transaction([
        prisma.reservations.updateMany({
          where: { id: { in: reservationIds } },
          data: {
            pickupStatus: 'CANCELLED',
            status: 'Cancelled' 
          }
        }),
        prisma.assets.updateMany({
          where: { id: { in: assetIds } },
          data: { status: 'Available' }
        })
      ]);
      
      console.log(`Cleanup: ${expiredReservations.length} գործարք չեղարկվեց:`);
    }
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}