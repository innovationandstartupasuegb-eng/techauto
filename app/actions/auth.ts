'use server'

import { prisma } from "@/lib/prisma";
import { redirect } from 'next/navigation';
import { users_role } from "@prisma/client";
import bcrypt from "bcrypt";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const user = await prisma.users.findUnique({
    where: { email: email },
  });

  // 1. Ստուգում ենք՝ արդյոք օգտատերը կա և արդյոք հեշավորված գաղտնաբառը համընկնում է
  if (!user) {
    return { success: false, message: "Սխալ էլ-փոստ կամ գաղտնաբառ" };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  
  if (!isPasswordValid) {
    return { success: false, message: "Սխալ էլ-փոստ կամ գաղտնաբառ" };
  }

  // 2. Ուղղորդում ըստ դերի
  if (user.role === users_role.admin) {
    redirect('/admin'); 
  } else {
    redirect('/dashboard');
  }
}

export async function registerUser(prevState: any, formData: FormData) {
  // 1. Ստանում ենք բոլոր տվյալները ֆորմայից
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const full_name = formData.get("full_name") as string; // Ավելացված
  const phone_number = formData.get("phone_number") as string; // Ավելացված
  const role = formData.get("role") as string;

  // 2. Ստուգում ենք՝ արդյոք դաշտերը լրացված են
  if (!email || !password || !full_name || !phone_number || !role) {
    return { success: false, message: "Խնդրում ենք լրացնել բոլոր դաշտերը" };
  }

  try {
    // 3. Հեշավորում ենք գաղտնաբառը
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Ստեղծում ենք օգտատիրոջը բազայում
    await prisma.users.create({
      data: {
        email,
        password_hash: hashedPassword,
        full_name,     // Համոզվիր, որ Prisma schema-ում սա կա
        phone_number,  // Համոզվիր, որ Prisma schema-ում սա կա
        role: role as any,
      },
    });

    return { success: true, message: "Գրանցումը հաջողվեց" };

  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, message: "Այս էլ-փոստով օգտատեր արդեն գրանցված է։" };
    }

    console.error("Գրանցման սխալ:", error);
    return { success: false, message: "Տեղի ունեցավ սխալ. խնդրում ենք փորձել ավելի ուշ։" };
  }
}