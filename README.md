# Report Platform

Платформа для генерации отчётов: каталог отчётов, асинхронный запуск через очередь, скачивание результатов (XLSX, PDF).

## Стек

| Слой        | Технологии                                |
| ----------- | ----------------------------------------- |
| Backend API | Node.js, Express, Prisma, BullMQ          |
| Worker      | Node.js, BullMQ consumer, ExcelJS, PDFKit |
| Frontend    | React 18, Vite, Tailwind, TanStack Query  |
| Инфра       | PostgreSQL 15, Redis 7, Docker Compose    |
| E2E         | Playwright                                |

## Быстрый старт (Docker)

Требования: [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```bash
cp .env.example .env
make up-all
```

Открой [http://localhost:5173](http://localhost:5173).

> Первый запуск дольше — Docker собирает образы.

## Локальный dev (без контейнеров)

Требования: Node.js 20+, локальные PostgreSQL 15 и Redis 7 (или `make up`).

```bash
# 1. Установить зависимости
npm install

# 2. Скопировать окружение
cp .env.example .env  # при необходимости отредактировать

# 3. Поднять postgres + redis
make up

# 4. Применить миграции
make migrate

# В четырёх отдельных терминалах:
make -C packages/backend dev    # API → http://localhost:3000
make -C packages/worker dev     # Worker слушает Redis
make -C packages/frontend dev   # UI  → http://localhost:5173
```

## Команды

| Команда          | Описание                                          |
| ---------------- | ------------------------------------------------- |
| `make up-all`    | Весь стек в Docker (собрать + поднять)            |
| `make up`        | Только postgres + redis                           |
| `make down`      | Остановить контейнеры                             |
| `make down-v`    | Остановить + удалить volumes                      |
| `make logs`      | Логи всех сервисов                                |
| `make check`     | Typecheck + unit-тесты                            |
| `make test`      | Unit-тесты                                        |
| `make e2e`       | E2E тесты (поднимает Docker сам)                  |
| `make e2e-local` | E2E тесты против уже запущенного стека            |
| `make migrate`   | Применить Prisma-миграции                         |
| `make seed`      | Засидить БД демо-пользователями для `user-export` |
| `make clean`     | Удалить node_modules и dist                       |

## Структура

```
packages/
├── shared/    # TypeScript-типы, Prisma-схема
├── backend/   # Express API (порт 3000)
├── worker/    # BullMQ consumer + генераторы отчётов
└── frontend/  # Vite + React SPA (порт 5173)
e2e/           # Playwright E2E сценарии
```

## Добавить новый отчёт

Два шага:

### Шаг 1 — зарегистрировать метаданные в `packages/shared/src/registry-meta.ts`

```ts
// Добавить в массив REPORTS_META:
{
  id: 'my-report',
  name: 'Мой отчёт',
  description: 'Краткое описание',
  formats: ['xlsx'],                   // 'xlsx' | 'pdf'
  parametersSchema: {
    dateFrom: { type: 'date', label: 'Дата начала', required: true },
    limit:    { type: 'number', label: 'Лимит строк', required: false, default: 100 },
  },
},
```

Backend начнёт отдавать новый отчёт в каталоге сразу после перезапуска.

### Шаг 2 — создать генератор `packages/worker/src/reports/my-report.ts`

```ts
import type { ReportDefinition } from "@report-platform/shared";
import { REPORTS_META } from "@report-platform/shared";
import { createMockSources } from "../sources/index.js";

const meta = REPORTS_META.find((r) => r.id === "my-report")!;

const report: ReportDefinition = {
  ...meta,
  async generate(ctx) {
    // ctx.outputDir    — директория для файла результата
    // ctx.taskId       — уникальный ID задачи (используй как имя файла)
    // ctx.parameters   — провалидированные параметры из шага 1
    // ctx.sources      — репозитории данных (БД, API, файлы). В тестах — не передаётся
    const sources = ctx.sources ?? createMockSources();
    const users = await sources.users.findInRange(
      new Date(String(ctx.parameters.dateFrom)),
      new Date(String(ctx.parameters.dateTo)),
    );

    const filePath = `${ctx.outputDir}/${ctx.taskId}.xlsx`;
    // ... генерация через ExcelJS / PDFKit / etc ...
    return filePath;
  },
};

export default report;
```

Worker обнаружит файл автоматически при следующем запуске.

## Источники данных

Отчёты получают данные через **репозитории** (`ctx.sources.users`, `ctx.sources.sales`, …), не обращаясь к Prisma / `fetch` / `fs` напрямую. Это позволяет подменять источник (БД ↔ API ↔ файл ↔ мок) без переписывания отчёта.

| Источник           | Реализация                        | Используется в                                      |
| ------------------ | --------------------------------- | --------------------------------------------------- |
| **DatabaseSource** | Prisma → PostgreSQL               | `user-export` (таблица `User`)                      |
| **ApiSource**      | `fetch` → публичный API           | `sales-summary` (jsonplaceholder.typicode.com)      |
| **FileSource**     | `fs` → JSON/CSV в `data/sources/` | — (готов к использованию)                           |
| **MockSource**     | фикстуры в памяти                 | Unit-тесты, fallback когда `ctx.sources` не передан |

Полный обзор слоёв и гайд «как добавить новый источник/репозиторий» — в [ARCHITECTURE.md § 2. Источники данных](ARCHITECTURE.md#2-источники-данных).

> **Демо-данные для БД:** после `make migrate` запусти `make seed` — вставит 40 тестовых пользователей, чтобы `user-export` вернул непустой XLSX.

## E2E тесты

```bash
# Полный прогон (Docker поднимается и гасится автоматически)
make e2e

# Против уже запущенного стека
make up-all
make e2e-local
```

## Полезные команды

```bash
# Статус контейнеров
docker compose ps

# Логи бэкенда
docker compose logs backend --tail=50

# Логи воркера
docker compose logs worker --tail=50

# Если воркер упал — перезапустить:
docker compose up -d worker

# Логи Redis / Postgres
docker compose logs redis postgres --tail=20
```
