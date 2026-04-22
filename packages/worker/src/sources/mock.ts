import type {
  ApiSource,
  DatabaseSource,
  FileSource,
  UserRecord,
} from '@report-platform/shared';

export function createMockDatabaseSource(fixture?: UserRecord[]): DatabaseSource {
  return {
    async findUsers(dateFrom, dateTo) {
      if (fixture) return fixture;
      const from = dateFrom.getTime();
      const to = dateTo.getTime();
      const count = 25;
      const rows: UserRecord[] = [];
      for (let i = 0; i < count; i++) {
        const ts = from + ((to - from) * i) / count;
        rows.push({
          id: i + 1,
          email: `user${i + 1}@example.com`,
          createdAt: new Date(ts).toISOString(),
        });
      }
      return rows;
    },
  };
}

export function createMockApiSource(responses: Record<string, unknown> = {}): ApiSource {
  return {
    async get<T>(path: string): Promise<T> {
      if (path in responses) return responses[path] as T;
      return [] as unknown as T;
    },
  };
}

export function createMockFileSource(files: Record<string, string> = {}): FileSource {
  return {
    async readJson<T>(relativePath: string): Promise<T> {
      const raw = files[relativePath];
      if (raw === undefined) throw new Error(`MockFileSource: "${relativePath}" not found`);
      return JSON.parse(raw) as T;
    },
    async readCsv(relativePath: string): Promise<string[][]> {
      const raw = files[relativePath];
      if (raw === undefined) throw new Error(`MockFileSource: "${relativePath}" not found`);
      return raw
        .split(/\r?\n/)
        .filter((line) => line.length > 0)
        .map((line) => line.split(','));
    },
  };
}
