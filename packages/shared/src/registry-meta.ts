import type { ReportMeta } from './types.js';

/**
 * Catalog metadata consumed by the backend (GET /api/reports) and the frontend.
 * Populated incrementally as each report file under packages/worker/src/reports/
 * registers its metadata here.
 *
 * The worker owns the executable `generate` (see packages/worker/src/registry.ts);
 * this array carries only the shape needed to render a catalog and a form.
 */
export const REPORTS_META: ReportMeta[] = [];

export function registerReportMeta(meta: ReportMeta): void {
  const existing = REPORTS_META.findIndex((m) => m.id === meta.id);
  if (existing >= 0) {
    REPORTS_META[existing] = meta;
  } else {
    REPORTS_META.push(meta);
  }
}

export function getReportsMeta(): ReportMeta[] {
  return [...REPORTS_META];
}
