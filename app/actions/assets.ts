'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Փոխիր ֆունկցիայի սկիզբը՝ ավելացնելով prevState
export async function addAsset(prevState: any, formData: FormData) {
  // Հիմա արդեն formData-ն երկրորդն է, և .get()-ը կաշխատի
  const name = formData.get("name") as string;
  const model = formData.get("model") as string;
  const serial_number = formData.get("serial_number") as string;
  const status = formData.get("status") as any;
  const current_location = formData.get("current_location") as any;

  try {
    await prisma.assets.create({
      data: { name, model, serial_number, status, current_location },
    });
    
    revalidatePath("/dashboard/manage");
    return { message: "Սարքը հաջողությամբ ավելացվեց", success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { message: "Սխալ. Այս սերիական համարով սարքն արդեն գոյություն ունի!", success: false };
    }
    return { message: "Տեղի ունեցավ սխալ։", success: false };
  }
}

export async function deleteAsset(id: number) {
  await prisma.assets.delete({ where: { id } });
  revalidatePath("/dashboard/manage");
}

export async function editAsset(id: number, prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const model = formData.get("model") as string;
  const serial_number = formData.get("serial_number") as string;
  const status = formData.get("status") as any;
  const current_location = formData.get("current_location") as any;

  try {
    await prisma.assets.update({
      where: { id },
      data: { name, model, serial_number, status, current_location },
    });
    
    revalidatePath("/dashboard/manage");
    return { message: "Սարքը թարմացվեց!", success: true };
  } catch (error) {
    return { message: "Սխալ թարմացման ժամանակ", success: false };
  }
}