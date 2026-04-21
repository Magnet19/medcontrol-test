import path from 'node:path';
import fs from 'node:fs';
import PDFDocument from 'pdfkit';
import {
  type ReportDefinition,
  type GenerateContext,
  registerReportMeta,
} from '@report-platform/shared';

const meta = {
  id: 'sales-summary',
  name: 'Сводка по продажам',
  description: 'Агрегаты продаж за выбранный период',
  formats: ['pdf'] as ('xlsx' | 'pdf')[],
  parametersSchema: {
    period: {
      type: 'string' as const,
      label: 'Период (day | week | month)',
      required: true,
      default: 'week',
    },
  },
};

registerReportMeta(meta);

function mockAggregates(period: string): { label: string; value: number }[] {
  const base: Record<string, number> = { day: 1, week: 7, month: 30 };
  const days = base[period] ?? 7;
  return [
    { label: 'Выручка', value: days * 12345 },
    { label: 'Заказов', value: days * 42 },
    { label: 'Средний чек', value: Math.round((days * 12345) / (days * 42)) },
  ];
}

const report: ReportDefinition = {
  ...meta,
  async generate(ctx: GenerateContext): Promise<string> {
    const period = String(ctx.parameters.period ?? 'week');
    const filePath = path.join(ctx.outputDir, `${ctx.taskId}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).text('Sales Summary', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Period: ${period}`);
    doc.moveDown();
    for (const row of mockAggregates(period)) {
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
