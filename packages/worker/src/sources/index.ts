import type { PrismaClient, ReportSources } from '@report-platform/shared';
import { createApiSource } from './api.js';
import { createDatabaseSource } from './database.js';
import { createMockApiSource, createMockDatabaseSource } from './mock.js';
import { createUserRepository } from '../repositories/user-repository.js';
import { createSalesRepository } from '../repositories/sales-repository.js';
import { createCatalogRepository } from '../repositories/catalog-repository.js';

export { createDatabaseSource } from './database.js';
export { createApiSource } from './api.js';
export { createFileSource } from './file.js';
export {
  createMockApiSource,
  createMockDatabaseSource,
  createMockFileSource,
} from './mock.js';

export interface DefaultSourcesOptions {
  prisma: PrismaClient;
  salesApiBaseUrl?: string;
}

export function createDefaultSources(options: DefaultSourcesOptions): ReportSources {
  const db = createDatabaseSource(options.prisma);
  const salesApi = createApiSource({
    baseUrl: options.salesApiBaseUrl ?? 'https://jsonplaceholder.typicode.com',
  });
  return {
    users: createUserRepository(db),
    sales: createSalesRepository(salesApi),
    catalog: createCatalogRepository(),
  };
}

export function createMockSources(): ReportSources {
  return {
    users: createUserRepository(createMockDatabaseSource()),
    sales: createSalesRepository(createMockApiSource()),
    catalog: createCatalogRepository(),
  };
}
