import { z, type ZodTypeAny } from 'zod';
import type { ParameterField } from '@report-platform/shared';

export class ValidationError extends Error {
  constructor(public readonly fields: { path: string; message: string }[]) {
    super(
      `Invalid parameters: ${fields.map((f) => `${f.path}: ${f.message}`).join('; ')}`,
    );
  }
}

function fieldSchema(field: ParameterField): ZodTypeAny {
  let base: ZodTypeAny;
  switch (field.type) {
    case 'string':
      base = z.string();
      break;
    case 'number':
      base = z.coerce.number();
      break;
    case 'date':
      base = z
        .string()
        .refine((v) => !Number.isNaN(Date.parse(v)), 'expected ISO date string');
      break;
  }
  return field.required ? base : base.optional();
}

export function validateParameters(
  schema: Record<string, ParameterField> | null,
  input: unknown,
): Record<string, unknown> {
  if (!schema) {
    return (input ?? {}) as Record<string, unknown>;
  }
  const shape: Record<string, ZodTypeAny> = {};
  for (const [key, field] of Object.entries(schema)) {
    shape[key] = fieldSchema(field);
  }
  const parsed = z.object(shape).strict().safeParse(input ?? {});
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    );
  }
  const result: Record<string, unknown> = { ...(parsed.data as Record<string, unknown>) };
  for (const [key, field] of Object.entries(schema)) {
    if (result[key] === undefined && field.default !== undefined) {
      result[key] = field.default;
    }
  }
  return result;
}
