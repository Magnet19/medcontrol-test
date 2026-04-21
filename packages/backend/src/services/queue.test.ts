import { describe, it, expect, vi } from 'vitest';
import { enqueueReport } from './queue.js';
import type { Queue } from 'bullmq';
import type { ReportJob } from '@report-platform/shared';

function makeFakeQueue() {
  const add = vi.fn().mockResolvedValue({ id: 'stub' });
  return { add } as unknown as Queue<ReportJob> & { add: typeof add };
}

describe('enqueueReport', () => {
  it('adds a job with taskId as jobId and the expected payload', async () => {
    const q = makeFakeQueue();
    await enqueueReport(
      {
        taskId: 't-1',
        reportId: 'user-export',
        parameters: { dateFrom: '2026-01-01', dateTo: '2026-01-31' },
        format: 'xlsx',
      },
      q,
    );

    expect(q.add).toHaveBeenCalledTimes(1);
    const [name, payload, opts] = q.add.mock.calls[0];
    expect(name).toBe('generate');
    expect(payload).toEqual({
      taskId: 't-1',
      reportId: 'user-export',
      parameters: { dateFrom: '2026-01-01', dateTo: '2026-01-31' },
      format: 'xlsx',
    });
    expect(opts).toMatchObject({ jobId: 't-1' });
  });

  it('is idempotent per taskId (second call with same taskId still uses that jobId)', async () => {
    const q = makeFakeQueue();
    await enqueueReport({ taskId: 'same', reportId: 'r', parameters: {}, format: 'pdf' }, q);
    await enqueueReport({ taskId: 'same', reportId: 'r', parameters: {}, format: 'pdf' }, q);
    expect(q.add.mock.calls[0][2]).toMatchObject({ jobId: 'same' });
    expect(q.add.mock.calls[1][2]).toMatchObject({ jobId: 'same' });
  });

  it('propagates queue.add rejection (e.g. Redis unavailable)', async () => {
    const failing = {
      add: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    } as unknown as Queue<ReportJob>;
    await expect(
      enqueueReport({ taskId: 'x', reportId: 'r', parameters: {}, format: 'xlsx' }, failing),
    ).rejects.toThrow(/ECONNREFUSED/);
  });
});
