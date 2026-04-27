import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

// «Բռնի» բեռնում ենք .env ֆայլը պրոյեկտի արմատից
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Ստուգենք, արդյոք կարդացվել է
if (!process.env.DATABASE_URL) {
  console.error("❌ ԶԳՈՒՇԱՑՈՒՄ: DATABASE_URL-ը չի հայտնաբերվել!");
} else {
  console.log("✅ DATABASE_URL-ը հաջողությամբ կարդացվեց:");
}

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}