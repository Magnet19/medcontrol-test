# Combined Dashboard Report — Implementation Guide

## Цель

Демонстрация архитектуры источников данных: один отчёт использует **три разных источника одновременно** — БД, внешний API и моковые данные.

## Шаги реализации

### 1. Расширить типы (packages/shared/src/types.ts)

Добавлены три новых типа:

```typescript
export interface CatalogRecord {
  categoryId: number;
  categoryName: string;
  region: string;
}

export interface CatalogRepository {
  getCategories(): Promise<CatalogRecord[]>;
}
```

Поле `catalog` добавлено в `ReportSources`:
```typescript
export interface ReportSources {
  users: UserRepository;      // существовал
  sales: SalesRepository;     // существовал
  catalog: CatalogRepository; // новое
}
```

### 2. Создать репозиторий (packages/worker/src/repositories/catalog-repository.ts)

Mock-источник со справочными данными (в production — читал бы из файла / CMS / MDM):

```typescript
export function createCatalogRepository(): CatalogRepository {
  return {
    async getCategories(): Promise<CatalogRecord[]> {
      return CATALOG_FIXTURE; // 7 записей о категориях и регионах
    },
  };
}
```

### 3. Обновить фабрики источников (packages/worker/src/sources/index.ts)

Обе фабрики теперь возвращают `catalog`:

```typescript
export function createDefaultSources(options): ReportSources {
  return {
    users: createUserRepository(db),
    sales: createSalesRepository(salesApi),
    catalog: createCatalogRepository(), // добавлено
  };
}

export function createMockSources(): ReportSources {
  return {
    users: createUserRepository(createMockDatabaseSource()),
    sales: createSalesRepository(createMockApiSource()),
    catalog: createCatalogRepository(), // добавлено
  };
}
```

### 4. Добавить метаданные отчёта (packages/shared/src/registry-meta.ts)

```typescript
{
  id: "combined-dashboard",
  name: "Сводный дашборд",
  description: "Три источника в одном отчёте: ...",
  formats: ["xlsx"],
  parametersSchema: {
    dateFrom: { type: "date", label: "Пользователи: дата начала", required: true },
    dateTo: { type: "date", label: "Пользователи: дата окончания", required: true },
    period: { type: "string", label: "Продажи: период", required: true, ... },
  },
}
```

### 5. Реализовать отчёт (packages/worker/src/reports/combined-dashboard.ts)

Отчёт получает `ctx.sources` и вызывает все три репозитория параллельно:

```typescript
// Источник 1: БД
const users = await sources.users.findInRange(dateFrom, dateTo);

// Источник 2: API
const salesAggregates = await sources.sales.summarize(period);

// Источник 3: Mock
const categories = await sources.catalog.getCategories();
```

Результат записывается в три листа Excel:
- **Пользователи (БД)** — id, email, createdAt из PostgreSQL
- **Продажи (API)** — метрики (Выручка, Продаж, Продавцов, Средний чек) из jsonplaceholder
- **Каталог (Mock)** — id, название, регион из fixtures

### 6. Написать тесты (packages/worker/src/reports/combined-dashboard.test.ts)

Три теста проверяют:
1. Все три листа создаются с правильными заголовками и данными ✅
2. Fallback на mock-источники работает, когда `ctx.sources` не передан ✅
3. Метаданные зарегистрированы в `REPORTS_META` ✅

## Что это демонстрирует

| Концепция | Реализация |
|---|---|
| **Инверсия зависимостей** | Отчёт не знает о Prisma / fetch / fs — зависит только от репозиториев |
| **Dependency Injection** | Источники инжектируются в `GenerateContext.sources` при запуске |
| **Single Responsibility** | Каждый источник / репозиторий отвечает за одну задачу |
| **Тестируемость** | В тестах подставляются мок-источники без реальной БД и API |
| **Масштабируемость** | Новый источник добавляется без изменения логики отчёта |

## Как запустить

```bash
# Пересобрать shared (важно для dist/)
cd packages/shared && npm run build

# Запустить тесты отчёта
cd packages/worker && npm test -- combined-dashboard

# Запустить отчёт через API
curl -X POST http://localhost:3000/api/reports/combined-dashboard/run \
  -H "Content-Type: application/json" \
  -d '{
    "parameters": {
      "dateFrom": "2026-01-01",
      "dateTo": "2026-03-01",
      "period": "week"
    },
    "format": "xlsx"
  }'
```

Отчёт появляется в UI сразу — фронтенд получит его через `GET /api/reports`.
