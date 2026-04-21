export type ReportFormat = 'xlsx' | 'pdf';

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ParameterField {
  type: 'string' | 'number' | 'date';
  label: string;
  required: boolean;
  default?: string | number;
}

export interface GenerateContext {
  parameters: Record<string, unknown>;
  format: ReportFormat;
  outputDir: string;
  taskId: string;
}

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  formats: ReportFormat[];
  parametersSchema: Record<string, ParameterField> | null;
  generate(context: GenerateContext): Promise<string>;
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
