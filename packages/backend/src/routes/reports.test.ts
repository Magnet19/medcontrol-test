import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { REPORTS_META, registerReportMeta } from '@report-platform/shared';

const taskCreate = vi.fn();
const taskUpdate = vi.fn();
const enqueueMock = vi.fn();

vi.mock('../db.js', () => ({
  prisma: {
    task: {
      create: (...args: unknown[]) => taskCreate(...args),
      update: (...args: unknown[]) => taskUpdate(...args),
    },
  },
}));

vi.mock('../services/queue.js', () => ({
  enqueueReport: (...args: unknown[]) => enqueueMock(...args),
  closeQueue: vi.fn(),
}));

const { createApp } = await import('../app.js');

describe('GET /api/reports', () => {
  beforeEach(() => {
    REPORTS_META.length = 0;
    taskCreate.mockReset();
    taskUpdate.mockReset();
    enqueueMock.mockReset();
  });

  it('returns an empty array when no reports are registered', async () => {
    const res = await request(createApp()).get('/api/reports');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns registered reports in ReportMeta shape (no generate)', async () => {
    registerReportMeta({
      id: 'demo',
      name: 'Demo',
      description: 'A demo',
      formats: ['xlsx'],
      parametersSchema: { x: { type: 'string', label: 'X', required: true } },
    });
    const res = await request(createApp()).get('/api/reports');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).not.toHaveProperty('generate');
  });
});

describe('POST /api/reports/:id/run', () => {
  beforeEach(() => {
    REPORTS_META.length = 0;
    taskCreate.mockReset();
    taskUpdate.mockReset();
    enqueueMock.mockReset();
    registerReportMeta({
      id: 'user-export',
      name: 'User Export',
      description: 'Export users',
      formats: ['xlsx'],
      parametersSchema: {
        dateFrom: { type: 'date', label: 'From', required: true },
        dateTo: { type: 'date', label: 'To', required: true },
      },
    });
  });

  it('201 on valid request — creates Task(pending) and enqueues', async () => {
    taskCreate.mockResolvedValue({ id: 'task-1' });
    enqueueMock.mockResolvedValue(undefined);

    const res = await request(createApp())
      .post('/api/reports/user-export/run')
      .send({ parameters: { dateFrom: '2026-01-01', dateTo: '2026-01-31' } });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ taskId: 'task-1', status: 'pending' });
    expect(taskCreate).toHaveBeenCalledWith({
      data: {
        reportId: 'user-export',
        status: 'pending',
        parameters: { dateFrom: '2026-01-01', dateTo: '2026-01-31' },
      },
    });
    expect(enqueueMock).toHaveBeenCalledWith({
      taskId: 'task-1',
      reportId: 'user-export',
      parameters: { dateFrom: '2026-01-01', dateTo: '2026-01-31' },
      format: 'xlsx',
    });
  });

  it('400 on invalid parameters (missing required field)', async () => {
    const res = await request(createApp())
      .post('/api/reports/user-export/run')
      .send({ parameters: { dateFrom: '2026-01-01' } });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_parameters');
    expect(res.body.fields.some((f: { path: string }) => f.path === 'dateTo')).toBe(true);
    expect(taskCreate).not.toHaveBeenCalled();
  });

  it('404 on unknown reportId', async () => {
    const res = await request(createApp()).post('/api/reports/ghost/run').send({});
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('report_not_found');
    expect(taskCreate).not.toHaveBeenCalled();
  });

  it('500 when enqueue fails — Task is marked failed', async () => {
    taskCreate.mockResolvedValue({ id: 'task-2' });
    enqueueMock.mockRejectedValue(new Error('Redis down'));

    const res = await request(createApp())
      .post('/api/reports/user-export/run')
      .send({ parameters: { dateFrom: '2026-01-01', dateTo: '2026-01-31' } });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('enqueue_failed');
    expect(taskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'task-2' },
        data: expect.objectContaining({ status: 'failed', error: 'Redis down' }),
      }),
    );
  });
});
