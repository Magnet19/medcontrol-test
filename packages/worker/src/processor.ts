import type { Job } from 'bullmq';
import type { ReportJob, ReportSources } from '@report-platform/shared';
import { prisma } from './db.js';
import { getReport } from './registry.js';
import { createDefaultSources } from './sources/index.js';

export interface ProcessorDeps {
  prisma?: typeof prisma;
  resolveReport?: (id: string) => ReturnType<typeof getReport>;
  outputDir?: string;
  sources?: ReportSources;
}

export function createProcessor(deps: ProcessorDeps = {}) {
  const db = deps.prisma ?? prisma;
  const resolve = deps.resolveReport ?? getReport;
  const outputDir = deps.outputDir ?? process.env.OUTPUT_DIR ?? './data';
  const sources = deps.sources ?? createDefaultSources({ prisma: db });

  return async function processJob(job: Job<ReportJob>): Promise<void> {
    const { taskId, reportId, parameters, format } = job.data;

    await db.task.update({
      where: { id: taskId },
      data: { status: 'processing' },
    });

    const report = resolve(reportId);
    if (!report) {
      await db.task.update({
        where: { id: taskId },
        data: {
          status: 'failed',
          error: `Unknown report id "${reportId}"`,
          completedAt: new Date(),
        },
      });
      return;
    }

    try {
      const resultUrl = await report.generate({
        parameters,
        format,
        outputDir,
        taskId,
        sources,
      });
      await db.task.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          resultUrl,
          completedAt: new Date(),
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db.task.update({
        where: { id: taskId },
        data: {
          status: 'failed',
          error: message,
          completedAt: new Date(),
        },
      });
    }
  };
}
