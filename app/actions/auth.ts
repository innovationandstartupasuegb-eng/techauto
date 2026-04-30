'use server'

import { prisma } from "@/lib/prisma";
import { redirect } from 'next/navigation';
import { users_role } from "@prisma/client"; // 1. Ավելացրու այս import-ը
import bcrypt from "bcrypt";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const user = await prisma.users.findUnique({
    where: { email: email },
  });

  if (!user || user.password_hash !== password) {
    return { success: false, message: "Սխալ էլ-փոստ կամ գաղտնաբառ" };
  }

  // 2. Հիմա համեմատում ենք հենց Role.ADMIN-ի հետ
  if (user.role === users_role.admin) {
    redirect('/admin'); 
  } else {
    redirect('/dashboard');
  }
}

export async function registerUser(prevState: any, formData: FormData) {
  // 1. Ստանում ենք տվյալները ֆորմայից
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  // 2. Պարզունակ ստուգում (Frontend-ի կողքին սա լավ պաշտպանություն է)
  if (!email || !password || !role) {
    return { success: false, message: "Խնդրում ենք լրացնել բոլոր դաշտերը" };
  }

  // 3. Հեշավորում ենք գաղտնաբառը
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // 4. Փորձում ենք գրանցել օգտատիրոջը
    await prisma.users.create({
      data: {
        email,
        password_hash: hashedPassword,
        role: role as any, // Եթե ունես TypeScript enum, ավելի լավ է օգտագործել այն
      },
    });

    return { success: true, message: "Գրանցումը հաջողվեց" };

  } catch (error: any) {
    // 5. Սխալների մշակում
    
    // P2002-ը Prisma-ի սխալի կոդն է, որը նշանակում է՝ "Unique constraint violation"
    // (այսինքն՝ էլ-փոստը արդեն կա բազայում)
    if (error.code === 'P2002') {
      return { success: false, message: "Այս էլ-փոստով օգտատեր արդեն գրանցված է։" };
    }

    // Ցանկացած այլ սխալի դեպքում (օրինակ՝ բազայի կապի խնդիր)
    console.error("Գրանցման սխալ:", error);
    return { success: false, message: "Տեղի ունեցավ սխալ. խնդրում ենք փորձել ավելի ուշ։" };
  }
}