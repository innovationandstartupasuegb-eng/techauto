'use server'

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

/**
 * Օգնող ֆունկցիա՝ ամսաթիվը UTC ձևաչափի բերելու համար
 */
const parseToUTC = (isoString: string) => {
  if (!isoString) return new Date("Invalid");
  const cleanIso = isoString.endsWith('Z') ? isoString : `${isoString}Z`;
  return new Date(cleanIso);
};

// --- ՆՈՐ ԱՎԵԼԱՑՎԱԾ։ ՍՏԱՑՄԱՆ ՎԱԼԻԴԱՑԻԱՅԻ ՖՈՒՆԿՑԻԱՆԵՐ ---

/**
 * Օգտատերը հայտնում է, որ պատրաստ է վերցնել սարքը
 */
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

/**
 * Ադմինը հաստատում է սարքի ֆիզիկական հանձնումը
 */
export async function confirmAdminHandover(reservationId: number) {
  try {
    // Թարմացնում ենք միայն ամրագրումը (Reservation)
    await prisma.reservations.update({
      where: { id: reservationId },
      data: {
        // Սա ցույց է տալիս, որ սարքը ֆիզիկապես հանձնվել է
        pickupStatus: 'IN_USE', 
      },
    });

    // Մենք ՉԵՆՔ փոխում Ակտիվի (Asset) status-ը 'Assigned'-ի,
    // որովհետև ըստ քո կանոնի՝ Assigned-ը միայն անժամկետների համար է։
    // Այն կմնա 'Reserved' (կամ ինչպես կար մինչ այդ)։

    revalidatePath('/admin/reservations');
    revalidatePath('/myreservations');
    
    return { success: true };
  } catch (error) {
    console.error("Հանձնման սխալ:", error);
    return { success: false, error: "Չհաջողվեց հաստատել հանձնումը" };
  }
}


/**
 * Բերում է տվյալ սարքի ամրագրված ժամերը տվյալ օրվա համար (մինչև 17:20)
 */
export async function getAvailableSlots(assetId: number, dateString: string) {
  try {
    const reservations = await prisma.reservations.findMany({
      where: {
        asset_id: assetId,
        status: { in: ['Reserved', 'Assigned'] },
        start_time: { 
          gte: new Date(`${dateString}T00:00:00.000Z`),
          lte: new Date(`${dateString}T23:59:59.999Z`)
        }
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
    
    const newStartTime = parseToUTC(data.start_time);
    const newEndTime = data.end_time ? parseToUTC(data.end_time) : new Date("2099-12-31T23:59:59Z");

    if (isNaN(newStartTime.getTime()) || isNaN(newEndTime.getTime())) {
      throw new Error("Ամսաթվի ձևաչափը սխալ է։");
    }

    if (data.end_time) {
      const limit = new Date(newStartTime);
      limit.setUTCHours(17, 20, 0, 0); 
      if (newEndTime > limit) {
        throw new Error("Ամրագրումը հնարավոր է միայն մինչև ժամը 17:20։");
      }
    }

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
          pickup_status: 'PENDING', // Ապահովության համար նախնական արժեքը
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
    return assets.map((a: any) => a.name);
  } catch (error) {
    return [];
  }
}


/**
 * Օգտատերը հայտնում է, որ ուզում է վերադարձնել սարքը
 */
export async function requestReturn(reservationId: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Մուտք գործած չեք։");

    await prisma.reservations.update({
      where: { id: reservationId },
      data: { pickupStatus: 'RETURN_REQUESTED' } // Նոր կարգավիճակ հարցման համար
    });
    
    revalidatePath('/myreservations');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Չհաջողվեց ուղարկել վերադարձի հարցումը" };
  }
}

/**
 * Ադմինը հաստատում է սարքի ֆիզիկական ստացումը և ազատում է սարքը
 */
export async function confirmReturn(reservationId: number) {
  try {
    const reservation = await prisma.reservations.findUnique({
      where: { id: reservationId }
    });

    if (!reservation) throw new Error("Ամրագրումը չի գտնվել");

    await prisma.$transaction([
      // 1. Թարմացնում ենք ամրագրման կարգավիճակը
      prisma.reservations.update({
        where: { id: reservationId },
        data: { 
          pickupStatus: 'RETURNED',
          status: 'Available' // Եթե քո status enum-ում կա այսպիսի դաշտ
        }
      }),
      // 2. Ազատում ենք սարքը (Asset), որպեսզի ուրիշները կարողանան ամրագրել
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