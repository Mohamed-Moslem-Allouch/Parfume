import { PrismaClient } from "./lib/generated/prisma-client-v3";
const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.visualCategory.deleteMany({});
  console.log(`Deleted ${deleted.count} collections.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
