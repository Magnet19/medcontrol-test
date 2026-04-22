import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Job } from 'bullmq';
import type { ReportDefinition, ReportJob } from '@report-platform/shared';
import { createProcessor } from './processor.js';

function makeJob(data: ReportJob): Job<ReportJob> {
  return { id: 'j', data } as unknown as Job<ReportJob>;
}

function makeDb() {
  const update = vi.fn().mockResolvedValue({});
  return {
    update,
    asDeps: {
      prisma: { task: { update: (...a: unknown[]) => update(...a) } } as unknown as any,
    },
  };
}

describe('createProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('moves a task pending → processing → completed and writes resultUrl', async () => {
    const db = makeDb();
    const report: ReportDefinition = {
      id: 'r',
      name: 'r',
      description: '',
      formats: ['xlsx'],
      parametersSchema: null,
      generate: vi.fn().mockResolvedValue('/data/abc.xlsx'),
    };
    const processor = createProcessor({
      ...db.asDeps,
      resolveReport: () => report,
      outputDir: '/data',
    });
    await processor(
      makeJob({ taskId: 'abc', reportId: 'r', parameters: { x: 1 }, format: 'xlsx' }),
    );

    expect(db.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'abc' },
      data: { status: 'processing' },
    });
    expect(report.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        parameters: { x: 1 },
        format: 'xlsx',
        outputDir: '/data',
        taskId: 'abc',
        sources: expect.objectContaining({
          users: expect.any(Object),
          sales: expect.any(Object),
        }),
      }),
    );
    expect(db.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: 'abc' },
        data: expect.objectContaining({ status: 'completed', resultUrl: '/data/abc.xlsx' }),
      }),
    );
  });

  it('marks task failed when generate throws and keeps processing other jobs', async () => {
    const db = makeDb();
    const report: ReportDefinition = {
      id: 'r',
      name: 'r',
      description: '',
      formats: ['pdf'],
      parametersSchema: null,
      generate: vi.fn().mockRejectedValue(new Error('boom')),
    };
    const processor = createProcessor({
      ...db.asDeps,
      resolveReport: () => report,
      outputDir: '/tmp',
    });
    await processor(
      makeJob({ taskId: 'x', reportId: 'r', parameters: {}, format: 'pdf' }),
    );

    expect(db.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: 'x' },
        data: expect.objectContaining({ status: 'failed', error: 'boom' }),
      }),
    );
  });

  it('marks task failed when report id is unknown (never calls generate)', async () => {
    const db = makeDb();
    const processor = createProcessor({
      ...db.asDeps,
      resolveReport: () => undefined,
      outputDir: '/tmp',
    });
    await processor(
      makeJob({ taskId: 'y', reportId: 'missing', parameters: {}, format: 'xlsx' }),
    );
    expect(db.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'failed',
          error: expect.stringContaining('missing'),
        }),
      }),
    );
  });
});
