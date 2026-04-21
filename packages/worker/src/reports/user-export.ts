import path from 'node:path';
import ExcelJS from 'exceljs';
import {
  type ReportDefinition,
  type GenerateContext,
  registerReportMeta,
} from '@report-platform/shared';

const meta = {
  id: 'user-export',
  name: 'Выгрузка пользователей',
  description: 'Список зарегистрированных пользователей за период',
  formats: ['xlsx'] as ('xlsx' | 'pdf')[],
  parametersSchema: {
    dateFrom: { type: 'date' as const, label: 'Дата начала', required: true },
    dateTo: { type: 'date' as const, label: 'Дата окончания', required: true },
  },
};

registerReportMeta(meta);

interface UserRow {
  id: number;
  email: string;
  createdAt: string;
}

function mockUsers(dateFrom: string, dateTo: string): UserRow[] {
  const from = new Date(dateFrom).getTime();
  const to = new Date(dateTo).getTime();
  const count = 25;
  const rows: UserRow[] = [];
  for (let i = 0; i < count; i++) {
    const ts = from + ((to - from) * i) / count;
    rows.push({
      id: i + 1,
      email: `user${i + 1}@example.com`,
      createdAt: new Date(ts).toISOString(),
    });
  }
  return rows;
}

const report: ReportDefinition = {
  ...meta,
  async generate(ctx: GenerateContext): Promise<string> {
    const dateFrom = String(ctx.parameters.dateFrom ?? '2026-01-01');
    const dateTo = String(ctx.parameters.dateTo ?? '2026-12-31');
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Users');
    sheet.columns = [
      { header: 'id', key: 'id', width: 10 },
      { header: 'email', key: 'email', width: 30 },
      { header: 'createdAt', key: 'createdAt', width: 30 },
    ];
    for (const row of mockUsers(dateFrom, dateTo)) {
      sheet.addRow(row);
    }
    const filePath = path.join(ctx.outputDir, `${ctx.taskId}.xlsx`);
    await wb.xlsx.writeFile(filePath);
    return filePath;
  },
};

export default report;
