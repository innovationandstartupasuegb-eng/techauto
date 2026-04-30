import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma"; // Համոզվիր, որ ճիշտ ես իմպորտ արել prisma-ն
console.log("SECRET CHECK:", process.env.NEXTAUTH_SECRET);
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

        // 2. Ստուգում ենք՝ արդյոք կա այդպիսի user և գաղտնաբառը ճիշտ է
        // (Իրական նախագծում օգտագործիր bcrypt.compare, սա պարզ օրինակ է)
        if (user && user.password_hash === credentials.password) {
          return {
            id: user.id.toString(),
            email: user.email,
            role: user.role, // Այստեղ մենք ստանում ենք դերը բազայից
          };
        }
        return null;
      }
    })
  ],
cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production', // Թող լինի false, եթե development է
      },
    },
  },
  session: {
    strategy: "jwt", // Սա շատ կարևոր է Server Actions-ի համար
  },
  callbacks: {
    // 3. JWT-ի մեջ ավելացնում ենք role-ը
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role; 
      }
      return token;
    },
    // 4. Սեսիայի մեջ ավելացնում ենք role-ը, որ հասանելի լինի ամենուր
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any; 
      }
      return session;
    },
  },
  
  secret: process.env.NEXTAUTH_SECRET,
};