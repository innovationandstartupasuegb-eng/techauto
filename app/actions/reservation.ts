'use server'

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { cache } from 'react'; // ԱՎԵԼԱՑՐՈՒ ԱՅՍ ՏՈՂԸ ՖԱՅԼԻ ԱՄԵՆԱՎԵՐԵՎՈՒՄ
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
    const reservation = await prisma.reservations.findUnique({
      where: { id: reservationId },
      select: { end_time: true }
    });

    if (!reservation) throw new Error("Ամրագրումը չի գտնվել");

    await prisma.reservations.update({
      where: { id: reservationId },
      data: { 
        pickupStatus: 'IN_USE',
        status: reservation.end_time === null ? 'Assigned' : 'Reserved'
      },
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
          {
            AND: [
              { start_time: { lte: endOfDay } },
              { 
                OR: [
                  { end_time: { gte: startOfDay } },
                  { end_time: null }
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

// ՈՒՂՂՎԱԾ. Ավելացվել է ժամանակի խիստ ստուգում անցյալի դեմ
export async function createPermanentAssignment(data: {
  assetId: number;
  userId: number;
  start_time: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      throw new Error("Այս գործողությունը թույլատրված է միայն ադմինին։");
    }

    const checkStartTime = new Date(data.start_time);
    
    // ՍՏՈՒԳՈՒՄ. Եթե ընտրված ժամը հետ է ընթացիկ պահից (5 րոպեի թույլտվությամբ)
    const now = new Date();
    if (checkStartTime.getTime() < now.getTime() - (5 * 60 * 1000)) {
      throw new Error("Հնարավոր չէ սարքը կցել անցյալ ժամանակով։");
    }

    const offset = 4 * 60 * 60 * 1000; 
    const newStartTime = new Date(checkStartTime.getTime() + offset);

    if (isNaN(newStartTime.getTime())) {
      throw new Error("Ամսաթվի ձևաչափը սխալ է։");
    }

    const result = await prisma.$transaction(async (tx) => {
      const conflict = await tx.reservations.findFirst({
        where: {
          asset_id: Number(data.assetId),
          status: { in: ['Reserved', 'Assigned'] },
          pickupStatus: { not: 'CANCELLED' },
          AND: [
            { OR: [{ end_time: { gt: newStartTime } }, { end_time: null }] }
          ]
        }
      });

      if (conflict) {
        throw new Error("Այս սարքն արդեն զբաղված է նշված ժամին:");
      }

      const reservation = await tx.reservations.create({
        data: {
          asset_id: Number(data.assetId),
          user_id: Number(data.userId),
          start_time: newStartTime,
          end_time: null, 
          status: 'Reserved', 
          pickupStatus: 'PENDING'
        },
      });

      await tx.assets.update({
        where: { id: Number(data.assetId) },
        data: { status: 'Assigned' },
      });

      return reservation;
    });

    revalidatePath('/admin/reservations');
    revalidatePath('/myreservations');
    
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Permanent Assignment Error:", error);
    return { success: false, error: error.message };
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
    
    const checkStartTime = new Date(data.start_time);
    const checkEndTime = data.end_time ? new Date(data.end_time) : null;

    // 1. Հաշվարկում ենք ճիշտ ժամային գոտու offset-ը (+4 ժամ)
    const offset = 4 * 60 * 60 * 1000; 
    const newStartTime = new Date(checkStartTime.getTime() + offset);
    const newEndTime = data.end_time 
      ? new Date(checkEndTime!.getTime() + offset) 
      : new Date("2099-12-31T23:59:59Z"); // Մշտական (Permanent) ամրագրման համար դնում ենք հեռու ապագա

    if (isNaN(newStartTime.getTime()) || (data.end_time && isNaN(newEndTime.getTime()))) {
      throw new Error("Ամսաթվի ձևաչափը սխալ է։");
    }

    // 2. Ընթացիկ ժամը բերում ենք նույն ժամային գոտուն
    const now = new Date(new Date().getTime() + offset);

    // 3. ՈՒՂՂՎԱԾ ՍՏՈՒԳՈՒՄ. Արգելում ենք միայն այն դեպքում, եթե ԱՎԱՐՏԻ ժամն էլ է անցել
    if (newEndTime.getTime() < now.getTime()) {
      throw new Error("Ամրագրումը հնարավոր չէ, քանի որ ընտրված ժամանակահատվածն արդեն ավարտվել է։");
    }

    // 4. ՍՏՈՒԳՈՒՄ 2. 17:20-ի սահմանափակում
    if (data.end_time && checkEndTime) {
      const limit = new Date(checkStartTime);
      limit.setHours(17, 20, 0, 0); 
      
      if (checkEndTime > limit) {
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
          // Եթե սկզբի ժամն անցել է, բայց ավարտին դեռ կա, բազայում սկիզբը դնում ենք հենց «հիմա»-ն
          start_time: newStartTime < now ? now : newStartTime, 
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
    
    // Հաջողության դեպքում վերադարձնում ենք ճիշտ օբյեկտը
    return { success: true, data: result };

  } catch (error: any) {
    // ՓՈՓՈԽՈՒԹՅՈՒՆ. return-ի փոխարեն անում ենք throw, որ Frontend-ի catch-ը ճիշտ աշխատի
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

    await prisma.$transaction(async (tx) => {
      await tx.reservations.delete({ 
        where: { id: id } 
      });

      if (reservation.asset_id) {
        await tx.assets.update({
          where: { id: reservation.asset_id },
          data: { status: 'Available' }
        });
      }
    });

    revalidatePath('/myreservations'); 
    revalidatePath('/admin/reservations');
    revalidatePath('/reserve'); 
    
    return { success: true };
  } catch (error: any) {
    console.error("Delete Error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function getReservations(type: 'active' | 'permanent' | 'archive' | 'all' = 'active') {
  try {
    const session = await getServerSession(authOptions); //
    if (!session?.user) return []; //

    const userRole = (session.user as any).role; //
    const userId = parseInt((session.user as any).id); //

    if (isNaN(userId)) { //
      return []; //
    } //

    // ՈՒՂՂՎԱԾ Է. Ծանր cleanup ֆունկցիայի սինխրոն կանչը հեռացված է այստեղից:
    // Այժմ թե՛ ադմինի, թե՛ օգտատերերի էջերը կբացվեն ակնթարթորեն (առանց 7-8 վայրկյան սպասելու):

    let whereClause: any = {}; //

    if (userRole !== 'admin') { //
      whereClause.user_id = userId; //
    } //

    switch (type) { //
      case 'active': //
        whereClause.status = 'Reserved'; //
        whereClause.pickupStatus = { notIn: ['RETURNED', 'CANCELLED'] }; //
        break; //
      case 'permanent': //
        whereClause.status = 'Assigned'; //
        whereClause.pickupStatus = { not: 'RETURNED' }; //
        break; //
      case 'archive': //
        whereClause.pickupStatus = { in: ['RETURNED', 'CANCELLED'] }; //
        break; //
      case 'all': //
        whereClause.pickupStatus = { notIn: ['RETURNED', 'CANCELLED'] }; //
        break; //
    } //

    const data = await prisma.reservations.findMany({ //
      where: whereClause, //
      include: { //
        assets: true, //
        users: { select: { id: true, full_name: true, phone_number: true } }   //
      }, //
      orderBy: { start_time: 'desc' }, //
    }); //

    return data; //
  } catch (error) { //
    console.error("getReservations error:", error); //
    return []; //
  } //
}

export async function getUniqueAssetNames() {
  try {
    const assets = await prisma.assets.findMany({ //
      distinct: ['name'], //
      select: { name: true }, //
      orderBy: { name: 'asc' } //
    }); //
    return assets.map((a: any) => a.name); //
  } catch (error) { //
    return []; //
  } //
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
    console.error("Confirm return error:", error);
    return { success: false, error: "Չհաջողվեց հաստատել վերադարձը" };
  }
}

export async function cleanupExpiredReservations() {
  try {
    const now = new Date();
    const startThreshold = new Date(now.getTime() - (30 * 60 * 1000));

    const adminToActivate = await prisma.reservations.findMany({
      where: {
        pickupStatus: 'PENDING',
        start_time: { lte: now }, 
        end_time: { not: null },  
        users: { role: 'admin' }
      }
    });

    if (adminToActivate.length > 0) {
      await prisma.reservations.updateMany({
        where: { id: { in: adminToActivate.map(r => r.id) } },
        data: { pickupStatus: 'IN_USE' }
      });
    }

    const adminToFinish = await prisma.reservations.findMany({
      where: {
        pickupStatus: 'IN_USE',
        end_time: { 
          not: null, 
          lt: now    
        },
        users: { role: 'admin' }
      }
    });

    if (adminToFinish.length > 0) {
      const resIds = adminToFinish.map(r => r.id);
      const assetIds = adminToFinish.map(r => r.asset_id).filter(id => id !== null) as number[];

      await prisma.$transaction([
        prisma.reservations.updateMany({
          where: { id: { in: resIds } },
          data: { pickupStatus: 'RETURNED', status: 'Available' }
        }),
        prisma.assets.updateMany({
          where: { id: { in: assetIds } },
          data: { status: 'Available' }
        })
      ]);
    }

    const expiredStudent = await prisma.reservations.findMany({
      where: {
        pickupStatus: 'PENDING',
        NOT: { end_time: null }, 
        OR: [
          { end_time: { lt: now } },          
          { start_time: { lt: startThreshold } }
        ]
      }
    });
    
    if (expiredStudent.length > 0) {
      const resIds = expiredStudent.map(r => r.id);
      const assetIds = expiredStudent.map(r => r.asset_id).filter(id => id !== null) as number[];

      await prisma.$transaction([
        prisma.reservations.updateMany({
          where: { id: { in: resIds } },
          data: { pickupStatus: 'CANCELLED', status: 'Available' }
        }),
        prisma.assets.updateMany({
          where: { id: { in: assetIds } },
          data: { status: 'Available' }
        })
      ]);
    }

  } catch (error) {
    console.error("Cleanup error:", error);
  }
}

export const getPendingRequests = cache(async () => {
  try {
    const data = await prisma.reservations.findMany({
      where: {
        pickupStatus: { in: ['USER_READY', 'RETURN_REQUESTED'] }
      },
      select: {
        id: true,
        pickupStatus: true,
        assets: {
          select: {
            name: true,
            serial_number: true
          }
        },
        users: {
          select: {
            full_name: true
          }
        }
      }
    });

    return data;
  } catch (error: any) {
    console.error("Error fetching pending requests via Prisma Cache:", error.message);
    return [];
  }
});