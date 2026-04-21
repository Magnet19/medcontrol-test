import type { ReportFormat } from './types.js';

export const REPORTS_QUEUE_NAME = 'reports';

export interface ReportJob {
  taskId: string;
  reportId: string;
  parameters: Record<string, unknown>;
  format: ReportFormat;
}
