import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ՕՊՏԻՄԱԼԱՑՈՒՄ: Ստիպում ենք Prisma-ին չօգտագործել Prepared Statements, 
// ինչը լիովին կվերացնի DEALLOCATE ALL հրամանները տերմինալից:
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl: process.env.DATABASE_URL 
      ? `${process.env.DATABASE_URL}${process.env.DATABASE_URL.includes('?') ? '&' : '?'}statement_cache_size=0`
      : undefined
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;