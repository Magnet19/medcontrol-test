import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ExcelJS from 'exceljs';
import report from './combined-dashboard.js';
import { REPORTS_META } from '@report-platform/shared';
import { createMockSources } from '../sources/index.js';

describe('combined-dashboard report', () => {
  it('generates xlsx with 3 sheets — each from a different source', async () => {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cd-'));
    const taskId = 'test-combined';

    const filePath = await report.generate({
      parameters: { dateFrom: '2026-01-01', dateTo: '2026-03-01', period: 'week' },
      format: 'xlsx',
      outputDir,
      taskId,
      sources: createMockSources(),
    });

    expect(filePath).toBe(path.join(outputDir, `${taskId}.xlsx`));
    expect(fs.existsSync(filePath)).toBe(true);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(filePath);

    // Лист 1: Пользователи (источник: БД)
    const usersSheet = wb.getWorksheet('Пользователи (БД)');
    expect(usersSheet).toBeDefined();
    const userHeaders = (usersSheet!.getRow(1).values as (string | undefined)[]).filter(Boolean);
    expect(userHeaders).toEqual(['ID', 'Email', 'Дата регистрации']);
    expect(usersSheet!.rowCount).toBeGreaterThan(1);

    // Лист 2: Продажи (источник: API)
    const salesSheet = wb.getWorksheet('Продажи (API)');
    expect(salesSheet).toBeDefined();
    const salesHeaders = (salesSheet!.getRow(1).values as (string | undefined)[]).filter(Boolean);
    expect(salesHeaders).toEqual(['Метрика', 'Значение']);

    // Лист 3: Каталог (источник: Mock)
    const catalogSheet = wb.getWorksheet('Каталог (Mock)');
    expect(catalogSheet).toBeDefined();
    const catalogHeaders = (catalogSheet!.getRow(1).values as (string | undefined)[]).filter(Boolean);
    expect(catalogHeaders).toEqual(['ID категории', 'Категория', 'Регион']);
    expect(catalogSheet!.rowCount).toBeGreaterThan(1);

    fs.rmSync(outputDir, { recursive: true, force: true });
  });

  it('falls back to mock sources when ctx.sources is not provided', async () => {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cd-'));
    const filePath = await report.generate({
      parameters: { dateFrom: '2026-01-01', dateTo: '2026-02-01', period: 'day' },
      format: 'xlsx',
      outputDir,
      taskId: 'fallback-test',
    });
    expect(fs.existsSync(filePath)).toBe(true);
    fs.rmSync(outputDir, { recursive: true, force: true });
  });

  it('registers meta in REPORTS_META with correct schema', () => {
    const m = REPORTS_META.find((r) => r.id === 'combined-dashboard');
    expect(m).toBeDefined();
    expect(m!.formats).toEqual(['xlsx']);
    expect(m!.parametersSchema?.dateFrom.required).toBe(true);
    expect(m!.parametersSchema?.period.required).toBe(true);
    expect(m!.parametersSchema?.period.options).toEqual(['day', 'week', 'month']);
  });
});
