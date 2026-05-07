import { PrismaClient } from "./generated/prisma-client-v5";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Detection logic to force refresh if schema changed
const isStale = globalForPrisma.prisma && 
  (globalForPrisma.prisma as any).visualCategory && 
  !(globalForPrisma.prisma as any)._page_v5_synced; // Custom flag

export const prisma =
  (globalForPrisma.prisma && !isStale)
    ? globalForPrisma.prisma
    : new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
      });

// Mark as synced if the new model fields are expected to be there
if (prisma && (prisma as any).visualCategory) {
  (prisma as any)._page_v5_synced = true;
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
