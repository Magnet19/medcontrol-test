import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const findMany = vi.fn();
const count = vi.fn();
const findUnique = vi.fn();

vi.mock('../db.js', () => ({
  prisma: {
    task: {
      findMany: (...a: unknown[]) => findMany(...a),
      count: (...a: unknown[]) => count(...a),
      findUnique: (...a: unknown[]) => findUnique(...a),
    },
  },
}));

vi.mock('../services/queue.js', () => ({
  enqueueReport: vi.fn(),
  closeQueue: vi.fn(),
}));

const { createApp } = await import('../app.js');

const sampleTask = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 't-1',
  reportId: 'user-export',
  status: 'pending',
  parameters: null,
  resultUrl: null,
  error: null,
  createdAt: new Date('2026-04-20T10:00:00Z').toISOString(),
  completedAt: null,
  ...over,
});

describe('GET /api/tasks', () => {
  beforeEach(() => {
    findMany.mockReset();
    count.mockReset();
    findUnique.mockReset();
  });

  it('returns paginated items with total/limit/offset and default limit=50', async () => {
    findMany.mockResolvedValue([sampleTask()]);
    count.mockResolvedValue(1);
    const res = await request(createApp()).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 1, limit: 50, offset: 0 });
    expect(res.body.items).toHaveLength(1);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      }),
    );
  });

  it('honours limit and offset from query', async () => {
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(10);
    const res = await request(createApp()).get('/api/tasks?limit=3&offset=6');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ limit: 3, offset: 6, total: 10 });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3, skip: 6 }),
    );
  });

  it('rejects invalid limit', async () => {
    const res = await request(createApp()).get('/api/tasks?limit=9999');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_query');
  });
});

describe('GET /api/tasks/:id', () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it('200 with the Task when found', async () => {
    findUnique.mockResolvedValue(sampleTask({ id: 'abc', status: 'completed' }));
    const res = await request(createApp()).get('/api/tasks/abc');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 'abc', status: 'completed' });
  });

  it('404 when absent', async () => {
    findUnique.mockResolvedValue(null);
    const res = await request(createApp()).get('/api/tasks/nope');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('task_not_found');
  });
});

describe('GET /api/tasks/:id/download', () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it('streams the file with correct Content-Type and Disposition for xlsx', async () => {
    const tmp = path.join(os.tmpdir(), `download-test-${Date.now()}.xlsx`);
    fs.writeFileSync(tmp, Buffer.from('PKfake-xlsx-body'));
    findUnique.mockResolvedValue(
      sampleTask({ id: 'done', status: 'completed', resultUrl: tmp }),
    );
    const res = await request(createApp())
      .get('/api/tasks/done/download')
      .buffer(true)
      .parse((response, cb) => {
        const chunks: Buffer[] = [];
        response.on('data', (c: Buffer) => chunks.push(c));
        response.on('end', () => cb(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('spreadsheetml');
    expect(res.headers['content-disposition']).toContain('.xlsx');
    expect((res.body as Buffer).toString()).toContain('PKfake-xlsx-body');
    fs.unlinkSync(tmp);
  });

  it('409 when task is still pending', async () => {
    findUnique.mockResolvedValue(sampleTask({ status: 'pending' }));
    const res = await request(createApp()).get('/api/tasks/t/download');
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('task_not_completed');
  });

  it('404 when the stored resultUrl does not exist on disk', async () => {
    findUnique.mockResolvedValue(
      sampleTask({ status: 'completed', resultUrl: '/tmp/definitely-not-here.pdf' }),
    );
    const res = await request(createApp()).get('/api/tasks/t/download');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('file_missing');
  });

  it('404 when task does not exist', async () => {
    findUnique.mockResolvedValue(null);
    const res = await request(createApp()).get('/api/tasks/ghost/download');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('task_not_found');
  });
});
