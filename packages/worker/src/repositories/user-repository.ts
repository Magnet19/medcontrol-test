import type { DatabaseSource, UserRepository } from '@report-platform/shared';

export function createUserRepository(db: DatabaseSource): UserRepository {
  return {
    async findInRange(dateFrom: Date, dateTo: Date) {
      return db.findUsers(dateFrom, dateTo);
    },
  };
}
