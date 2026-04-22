export type ReportFormat = 'xlsx' | 'pdf';

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ParameterField {
  type: 'string' | 'number' | 'date';
  label: string;
  required: boolean;
  default?: string | number;
  options?: string[];
}

export interface GenerateContext {
  parameters: Record<string, unknown>;
  format: ReportFormat;
  outputDir: string;
  taskId: string;
  sources?: ReportSources;
}

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  formats: ReportFormat[];
  parametersSchema: Record<string, ParameterField> | null;
  generate(context: GenerateContext): Promise<string>;
}

// ============================================================================
// Data sources — low-level adapters to concrete storage/transport
// ============================================================================

export interface DatabaseSource {
  findUsers(dateFrom: Date, dateTo: Date): Promise<UserRecord[]>;
}

export interface ApiSource {
  get<T>(path: string, query?: Record<string, string | number>): Promise<T>;
}

export interface FileSource {
  readJson<T>(relativePath: string): Promise<T>;
  readCsv(relativePath: string): Promise<string[][]>;
}

// ============================================================================
// Domain records — shared shapes between reports and repositories
// ============================================================================

export interface UserRecord {
  id: number;
  email: string;
  createdAt: string;
}

export interface SalesAggregate {
  label: string;
  value: number;
}

export type SalesPeriod = 'day' | 'week' | 'month';

// ============================================================================
// Repositories — high-level domain abstractions injected into reports
// ============================================================================

export interface UserRepository {
  findInRange(dateFrom: Date, dateTo: Date): Promise<UserRecord[]>;
}

export interface SalesRepository {
  summarize(period: SalesPeriod): Promise<SalesAggregate[]>;
}

export interface CatalogRecord {
  categoryId: number;
  categoryName: string;
  region: string;
}

export interface CatalogRepository {
  getCategories(): Promise<CatalogRecord[]>;
}

export interface ReportSources {
  users: UserRepository;
  sales: SalesRepository;
  catalog: CatalogRepository;
}

export type ReportMeta = Omit<ReportDefinition, 'generate'>;

export interface TaskDTO {
  id: string;
  reportId: string;
  status: TaskStatus;
  parameters: Record<string, unknown> | null;
  resultUrl: string | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}
