import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import report from './sales-summary.js';
import { REPORTS_META } from '@report-platform/shared';

describe('sales-summary report', () => {
  it('writes a non-empty PDF with the %PDF- signature', async () => {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ss-'));
    const filePath = await report.generate({
      parameters: { period: 'week' },
      format: 'pdf',
      outputDir,
      taskId: 't',
    });
    expect(filePath).toBe(path.join(outputDir, 't.pdf'));
    const bytes = fs.readFileSync(filePath);
    expect(bytes.length).toBeGreaterThan(0);
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    fs.rmSync(outputDir, { recursive: true, force: true });
  });

  it('registers its meta with a period parameter', () => {
    const m = REPORTS_META.find((r) => r.id === 'sales-summary');
    expect(m).toBeDefined();
    expect(m!.formats).toEqual(['pdf']);
    expect(m!.parametersSchema?.period.default).toBe('week');
  });
});
