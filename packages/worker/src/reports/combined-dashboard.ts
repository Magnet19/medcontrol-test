import path from 'node:path';
import ExcelJS from 'exceljs';
import { type ReportDefinition, type GenerateContext, REPORTS_META } from '@report-platform/shared';
import { createMockSources } from '../sources/index.js';

const meta = REPORTS_META.find((r) => r.id === 'combined-dashboard')!;

const report: ReportDefinition = {
  ...meta,
  async generate(ctx: GenerateContext): Promise<string> {
    const sources = ctx.sources ?? createMockSources();

    const dateFrom = new Date(String(ctx.parameters.dateFrom ?? '2026-01-01'));
    const dateTo = new Date(String(ctx.parameters.dateTo ?? '2026-12-31'));
    const period = String(ctx.parameters.period ?? 'week') as 'day' | 'week' | 'month';

    // Источник 1: БД — пользователи за период
    const users = await sources.users.findInRange(dateFrom, dateTo);

    // Источник 2: внешний API — агрегаты продаж
    const salesAggregates = await sources.sales.summarize(period);

    // Источник 3: Mock — справочник категорий (в production: файл / CMS / MDM)
    const categories = await sources.catalog.getCategories();

    const wb = new ExcelJS.Workbook();

    // Лист 1: Пользователи (источник: PostgreSQL)
    const usersSheet = wb.addWorksheet('Пользователи (БД)');
    usersSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Email', key: 'email', width: 35 },
      { header: 'Дата регистрации', key: 'createdAt', width: 25 },
    ];
    usersSheet.getRow(1).font = { bold: true };
    for (const user of users) {
      usersSheet.addRow(user);
    }

    // Лист 2: Продажи (источник: внешний API jsonplaceholder)
    const salesSheet = wb.addWorksheet('Продажи (API)');
    salesSheet.columns = [
      { header: 'Метрика', key: 'label', width: 25 },
      { header: 'Значение', key: 'value', width: 20 },
    ];
    salesSheet.getRow(1).font = { bold: true };
    for (const agg of salesAggregates) {
      salesSheet.addRow(agg);
    }

    // Лист 3: Категории (источник: Mock / справочные данные)
    const catalogSheet = wb.addWorksheet('Каталог (Mock)');
    catalogSheet.columns = [
      { header: 'ID категории', key: 'categoryId', width: 15 },
      { header: 'Категория', key: 'categoryName', width: 25 },
      { header: 'Регион', key: 'region', width: 20 },
    ];
    catalogSheet.getRow(1).font = { bold: true };
    for (const cat of categories) {
      catalogSheet.addRow(cat);
    }

    const filePath = path.join(ctx.outputDir, `${ctx.taskId}.xlsx`);
    await wb.xlsx.writeFile(filePath);
    return filePath;
  },
};

export default report;
