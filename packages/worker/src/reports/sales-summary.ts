import path from 'node:path';
import fs from 'node:fs';
import PDFDocument from 'pdfkit';
import {
  type ReportDefinition,
  type GenerateContext,
  type SalesPeriod,
  REPORTS_META,
} from '@report-platform/shared';
import { createMockSources } from '../sources/index.js';

const meta = REPORTS_META.find((r) => r.id === 'sales-summary')!;

function normalizePeriod(raw: unknown): SalesPeriod {
  return raw === 'day' || raw === 'week' || raw === 'month' ? raw : 'week';
}

const report: ReportDefinition = {
  ...meta,
  async generate(ctx: GenerateContext): Promise<string> {
    const period = normalizePeriod(ctx.parameters.period);
    const sources = ctx.sources ?? createMockSources();
    const aggregates = await sources.sales.summarize(period);

    const filePath = path.join(ctx.outputDir, `${ctx.taskId}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).text('Sales Summary', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Period: ${period}`);
    doc.moveDown();
    for (const row of aggregates) {
      doc.text(`${row.label}: ${row.value}`);
    }
    doc.end();

    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });
    return filePath;
  },
};

export default report;
