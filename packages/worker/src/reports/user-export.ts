import path from 'node:path';
import ExcelJS from 'exceljs';
import { type ReportDefinition, type GenerateContext, REPORTS_META } from '@report-platform/shared';
import { createMockSources } from '../sources/index.js';

const meta = REPORTS_META.find((r) => r.id === 'user-export')!;

const report: ReportDefinition = {
  ...meta,
  async generate(ctx: GenerateContext): Promise<string> {
    const dateFrom = new Date(String(ctx.parameters.dateFrom ?? '2026-01-01'));
    const dateTo = new Date(String(ctx.parameters.dateTo ?? '2026-12-31'));

    const sources = ctx.sources ?? createMockSources();
    const users = await sources.users.findInRange(dateFrom, dateTo);

    if (ctx.format === 'pdf') {
      // TODO: PDF с инфографикой (таблица пользователей + диаграмма регистраций по дням)
      throw new Error('user-export: PDF format is not yet implemented');
    }

    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Users');
    sheet.columns = [
      { header: 'id', key: 'id', width: 10 },
      { header: 'email', key: 'email', width: 30 },
      { header: 'createdAt', key: 'createdAt', width: 30 },
    ];
    for (const row of users) {
      sheet.addRow(row);
    }
    const filePath = path.join(ctx.outputDir, `${ctx.taskId}.xlsx`);
    await wb.xlsx.writeFile(filePath);
    return filePath;
  },
};

export default report;
