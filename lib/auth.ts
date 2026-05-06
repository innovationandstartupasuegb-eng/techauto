import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt"; // 1. Անպայման ներմուծիր bcrypt-ը

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 1. Բազայից փնտրում ենք user-ին
        const user = await prisma.users.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        // 2. ՈՒՂՂՈՒՄ. Համեմատում ենք հեշավորված գաղտնաբառերը bcrypt-ի միջոցով
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!isPasswordValid) return null;

        // 3. Եթե ամեն ինչ ճիշտ է, վերադարձնում ենք user-ին
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.full_name, // Ավելացրու նաև անունը
          role: user.role,
        };
      }
    })
  ],
  // Cookies-ի հատվածը կարող ես թողնել նույնը կամ հեռացնել, եթե default-ը հերիքում է
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role; 
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as any; 
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/sign/sign/login", // Նշիր քո լոգինի էջի ճիշտ հասցեն
  }
};