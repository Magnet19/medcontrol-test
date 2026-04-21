import { Queue, type QueueOptions } from 'bullmq';
import IORedis, { type Redis } from 'ioredis';
import { REPORTS_QUEUE_NAME, type ReportJob, type ReportFormat } from '@report-platform/shared';

let _connection: Redis | null = null;
let _queue: Queue<ReportJob> | null = null;

export function getConnection(url = process.env.REDIS_URL): Redis {
  if (!_connection) {
    if (!url) throw new Error('REDIS_URL is not set');
    _connection = new IORedis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return _connection;
}

export function getReportsQueue(opts?: Partial<QueueOptions>): Queue<ReportJob> {
  if (!_queue) {
    _queue = new Queue<ReportJob>(REPORTS_QUEUE_NAME, {
      connection: getConnection(),
      ...opts,
    });
  }
  return _queue;
}

export interface EnqueueParams {
  taskId: string;
  reportId: string;
  parameters: Record<string, unknown>;
  format: ReportFormat;
}

export async function enqueueReport(
  params: EnqueueParams,
  queue: Queue<ReportJob> = getReportsQueue(),
): Promise<void> {
  const job: ReportJob = {
    taskId: params.taskId,
    reportId: params.reportId,
    parameters: params.parameters,
    format: params.format,
  };
  await queue.add('generate', job, {
    jobId: params.taskId,
    removeOnComplete: { age: 24 * 3600, count: 1000 },
    removeOnFail: { age: 7 * 24 * 3600 },
  });
}

export async function closeQueue(): Promise<void> {
  if (_queue) {
    await _queue.close();
    _queue = null;
  }
  if (_connection) {
    await _connection.quit();
    _connection = null;
  }
}
