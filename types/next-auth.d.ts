import NextAuth from "next-auth";
import { DefaultSession } from "next-auth";
import { users_role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: users_role;
    } & DefaultSession["user"];
  }
}