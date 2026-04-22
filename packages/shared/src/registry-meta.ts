import type { ReportMeta } from "./types.js";

/**
 * Static catalog — single source of truth for report metadata.
 *
 * Backend reads this array directly (GET /api/reports).
 * Worker auto-discovers the matching generate() from packages/worker/src/reports/<id>.ts.
 *
 * To add a new report:
 *   1. Add its ReportMeta entry to REPORTS_META below.
 *   2. Create packages/worker/src/reports/<id>.ts with a matching default export ReportDefinition.
 */
export const REPORTS_META: ReportMeta[] = [
  {
    id: "user-export",
    name: "Выгрузка пользователей",
    description: "Список зарегистрированных пользователей за период",
    formats: ["xlsx", "pdf"],
    parametersSchema: {
      dateFrom: { type: "date", label: "Дата начала", required: true },
      dateTo: { type: "date", label: "Дата окончания", required: true },
    },
  },
  {
    id: "sales-summary",
    name: "Сводка по продажам",
    description: "Агрегаты продаж за выбранный период",
    formats: ["pdf"],
    parametersSchema: {
      period: {
        type: "string",
        label: "Период",
        required: true,
        default: "week",
        options: ["day", "week", "month"],
      },
    },
  },
  {
    id: "combined-dashboard",
    name: "Сводный дашборд",
    description:
      "Три источника в одном отчёте: пользователи из БД, продажи из внешнего API, справочник категорий из моковых данных",
    formats: ["xlsx"],
    parametersSchema: {
      dateFrom: { type: "date", label: "Пользователи: дата начала", required: true },
      dateTo: { type: "date", label: "Пользователи: дата окончания", required: true },
      period: {
        type: "string",
        label: "Продажи: период",
        required: true,
        default: "week",
        options: ["day", "week", "month"],
      },
    },
  },
];

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
