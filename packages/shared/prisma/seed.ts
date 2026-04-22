import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log(`[seed] users table already has ${existing} rows — skipping`);
    return;
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const rows = Array.from({ length: 40 }).map((_, i) => {
    const ratio = i / 40;
    const createdAt = new Date(
      thirtyDaysAgo.getTime() + (now.getTime() - thirtyDaysAgo.getTime()) * ratio,
    );
    return {
      email: `seed-user-${i + 1}@example.com`,
      createdAt,
    };
  });

  await prisma.user.createMany({ data: rows });
  console.log(`[seed] inserted ${rows.length} users`);
}

main()
  .catch((err) => {
    console.error('[seed] fatal:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
