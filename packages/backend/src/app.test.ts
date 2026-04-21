import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { loadEnv } from './env.js';

describe('createApp', () => {
  it('GET /health → 200 { status: "ok" }', async () => {
    const app = createApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('unknown route → 404 with error body', async () => {
    const app = createApp();
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: 'not_found' });
  });
});

describe('loadEnv', () => {
  it('accepts a valid env', () => {
    const env = loadEnv({
      DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
      REDIS_URL: 'redis://localhost:6379',
      PORT: '4000',
      OUTPUT_DIR: '/tmp',
    } as NodeJS.ProcessEnv);
    expect(env.PORT).toBe(4000);
    expect(env.DATABASE_URL).toBe('postgresql://u:p@localhost:5432/db');
  });

  it('throws on missing DATABASE_URL', () => {
    expect(() =>
      loadEnv({ REDIS_URL: 'redis://localhost:6379' } as NodeJS.ProcessEnv),
    ).toThrow(/DATABASE_URL/);
  });

  it('throws on invalid URL', () => {
    expect(() =>
      loadEnv({
        DATABASE_URL: 'not-a-url',
        REDIS_URL: 'redis://localhost:6379',
      } as NodeJS.ProcessEnv),
    ).toThrow(/Invalid/);
  });
});
