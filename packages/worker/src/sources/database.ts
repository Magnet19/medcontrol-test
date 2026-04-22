import type { DatabaseSource, UserRecord } from '@report-platform/shared';
import type { PrismaClient } from '@report-platform/shared';

export function createDatabaseSource(prisma: PrismaClient): DatabaseSource {
  return {
    async findUsers(dateFrom: Date, dateTo: Date): Promise<UserRecord[]> {
      const rows = await prisma.$queryRaw<
        { id: number; email: string; created_at: Date }[]
      >`
        SELECT id, email, created_at
        FROM "User"
        WHERE created_at BETWEEN ${dateFrom} AND ${dateTo}
        ORDER BY created_at ASC
      `;
      return rows.map((r) => ({
        id: r.id,
        email: r.email,
        createdAt: r.created_at.toISOString(),
      }));
    },
  };
}
