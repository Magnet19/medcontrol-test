import type { ApiSource } from '@report-platform/shared';

export interface ApiSourceOptions {
  baseUrl: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export function createApiSource(options: ApiSourceOptions): ApiSource {
  const { baseUrl, timeoutMs = 10_000, headers = {} } = options;

  return {
    async get<T>(path: string, query?: Record<string, string | number>): Promise<T> {
      const url = new URL(path.replace(/^\//, ''), baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
      if (query) {
        for (const [k, v] of Object.entries(query)) {
          url.searchParams.set(k, String(v));
        }
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url.toString(), {
          headers: { Accept: 'application/json', ...headers },
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`ApiSource GET ${url.pathname} → ${res.status} ${res.statusText}`);
        }
        return (await res.json()) as T;
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
