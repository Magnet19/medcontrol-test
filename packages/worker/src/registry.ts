import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import type { ReportDefinition, ReportMeta } from '@report-platform/shared';

const parameterFieldSchema = z.object({
  type: z.enum(['string', 'number', 'date']),
  label: z.string(),
  required: z.boolean(),
  default: z.union([z.string(), z.number()]).optional(),
});

const reportDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  formats: z.array(z.enum(['xlsx', 'pdf'])).nonempty(),
  parametersSchema: z.record(parameterFieldSchema).nullable(),
  generate: z
    .function()
    .args(z.any())
    .returns(z.union([z.promise(z.string()), z.any()])),
});

const registry = new Map<string, ReportDefinition>();

export function clearRegistry(): void {
  registry.clear();
}

function isReportFile(file: string): boolean {
  if (file.endsWith('.d.ts')) return false;
  if (file.includes('.test.')) return false;
  return file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.mjs');
}

export async function loadReports(reportsDir: string): Promise<void> {
  if (!fs.existsSync(reportsDir)) return;
  const files = fs.readdirSync(reportsDir).filter(isReportFile);
  for (const file of files) {
    const absolute = path.join(reportsDir, file);
    const mod = await import(pathToFileURL(absolute).href);
    const candidate = mod.default ?? mod.report;
    const parsed = reportDefinitionSchema.safeParse(candidate);
    if (!parsed.success) {
      throw new Error(
        `Invalid report module ${file}: ${parsed.error.issues
          .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
          .join(', ')}`,
      );
    }
    const report = candidate as ReportDefinition;
    if (registry.has(report.id)) {
      throw new Error(`duplicate report id "${report.id}" (file ${file})`);
    }
    registry.set(report.id, report);
  }
}

export function getReport(id: string): ReportDefinition | undefined {
  return registry.get(id);
}

export function getAllReports(): ReportDefinition[] {
  return Array.from(registry.values());
}

export function getReportsMeta(): ReportMeta[] {
  return getAllReports().map(({ generate: _g, ...meta }) => meta);
}
