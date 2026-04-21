import path from 'node:path';
import IORedis from 'ioredis';
import { Worker } from 'bullmq';
import { REPORTS_QUEUE_NAME, type ReportJob } from '@report-platform/shared';
import { loadReports } from './registry.js';
import { createProcessor } from './processor.js';
import { prisma } from './db.js';

async function main(): Promise<void> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) throw new Error('REDIS_URL is not set');

  const reportsDir = path.resolve(
    process.env.REPORTS_DIR ?? path.join(process.cwd(), 'dist', 'reports'),
  );
  await loadReports(reportsDir);
  console.log(`[worker] reports loaded from ${reportsDir}`);

  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  const concurrency = Number.parseInt(process.env.WORKER_CONCURRENCY ?? '2', 10);
  const worker = new Worker<ReportJob>(
    REPORTS_QUEUE_NAME,
    createProcessor({ outputDir: process.env.OUTPUT_DIR }),
    { connection, concurrency },
  );

  worker.on('completed', (job) => {
    console.log(`[worker] job ${job.id} completed (task ${job.data.taskId})`);
  });
  worker.on('failed', (job, err) => {
    console.error(`[worker] job ${job?.id} failed:`, err?.message ?? err);
  });
  worker.on('error', (err) => {
    console.error('[worker] error:', err);
  });

  const shutdown = async (signal: string) => {
    console.log(`[worker] received ${signal}, shutting down`);
    await worker.close();
    await connection.quit();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  console.log(`[worker] listening on queue "${REPORTS_QUEUE_NAME}" (concurrency=${concurrency})`);
}

main().catch((err) => {
  console.error('[worker] fatal startup error:', err);
  process.exit(1);
});
