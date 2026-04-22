import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ExcelJS from 'exceljs';
import report from './user-export.js';
import { REPORTS_META } from '@report-platform/shared';

describe('user-export report', () => {
  it('generates a readable xlsx with id/email/createdAt headers and data rows', async () => {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ue-'));
    const taskId = 'test-task';
    const filePath = await report.generate({
      parameters: { dateFrom: '2026-01-01', dateTo: '2026-02-01' },
      format: 'xlsx',
      outputDir,
      taskId,
    });
    expect(filePath).toBe(path.join(outputDir, `${taskId}.xlsx`));
    expect(fs.existsSync(filePath)).toBe(true);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(filePath);
    const sheet = wb.worksheets[0];
    const headers = (sheet.getRow(1).values as (string | undefined)[]).filter(Boolean);
    expect(headers).toEqual(['id', 'email', 'createdAt']);
    expect(sheet.rowCount).toBeGreaterThan(1);

    fs.rmSync(outputDir, { recursive: true, force: true });
  });

  it('registers its meta in REPORTS_META with the correct schema', () => {
    const m = REPORTS_META.find((r) => r.id === 'user-export');
    expect(m).toBeDefined();
    expect(m!.formats).toEqual(['xlsx', 'pdf']);
    expect(m!.parametersSchema?.dateFrom.required).toBe(true);
  });
});
