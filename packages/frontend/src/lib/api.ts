import type { ReportMeta, TaskDTO, ReportFormat } from '@report-platform/shared';

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function listReports(): Promise<ReportMeta[]> {
  return http<ReportMeta[]>('/api/reports');
}

export interface RunReportInput {
  parameters: Record<string, unknown>;
  format?: ReportFormat;
}

export async function runReport(
  id: string,
  input: RunReportInput,
): Promise<{ taskId: string; status: string }> {
  return http(`/api/reports/${id}/run`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getTask(id: string): Promise<TaskDTO> {
  return http<TaskDTO>(`/api/tasks/${id}`);
}

export async function listTasks(
  params: { limit?: number; offset?: number } = {},
): Promise<{ items: TaskDTO[]; total: number; limit: number; offset: number }> {
  const q = new URLSearchParams();
  if (params.limit) q.set('limit', String(params.limit));
  if (params.offset) q.set('offset', String(params.offset));
  return http(`/api/tasks${q.toString() ? `?${q}` : ''}`);
}

export function taskDownloadUrl(id: string): string {
  return `${BASE}/api/tasks/${id}/download`;
}
