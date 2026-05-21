import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ՕՊՏԻՄԱԼԱՑՈՒՄ + TYPE SAFETY: Ստիպում ենք Prisma-ին չօգտագործել Prepared Statements
// և ավելացնում ենք "as string", որպեսզի Vercel-ի build-ը TypeScript-ի սխալ չտա:
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl: process.env.DATABASE_URL 
      ? `${process.env.DATABASE_URL as string}${
          (process.env.DATABASE_URL as string).includes('?') ? '&' : '?'
        }statement_cache_size=0`
      : undefined,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;