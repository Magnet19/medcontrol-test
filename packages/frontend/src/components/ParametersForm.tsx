import { useState, type FormEvent } from 'react';
import type { ParameterField } from '@report-platform/shared';
import { Button, Input, Label, Select } from './ui';

export interface ParametersFormProps {
  schema: Record<string, ParameterField> | null;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  submitLabel?: string;
}

function inputTypeFor(f: ParameterField): string {
  if (f.type === 'number') return 'number';
  if (f.type === 'date') return 'date';
  return 'text';
}

function initialValues(
  schema: Record<string, ParameterField> | null,
): Record<string, string> {
  const v: Record<string, string> = {};
  for (const [key, f] of Object.entries(schema ?? {})) {
    v[key] = f.default !== undefined ? String(f.default) : '';
  }
  return v;
}

export function ParametersForm({
  schema,
  onSubmit,
  submitLabel = 'Запустить',
}: ParametersFormProps) {
  const entries = Object.entries(schema ?? {});
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(schema));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    for (const [key, f] of entries) {
      const raw = values[key] ?? '';
      if (f.required && raw.trim() === '') {
        errs[key] = 'обязательно';
        continue;
      }
      if (raw !== '') {
        if (f.type === 'number' && Number.isNaN(Number(raw))) {
          errs[key] = 'должно быть числом';
        }
        if (f.type === 'date' && Number.isNaN(Date.parse(raw))) {
          errs[key] = 'некорректная дата';
        }
      }
    }
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const parsed: Record<string, unknown> = {};
    for (const [key, f] of entries) {
      const raw = values[key];
      if (raw === undefined || raw === '') continue;
      parsed[key] = f.type === 'number' ? Number(raw) : raw;
    }
    setSubmitting(true);
    try {
      await onSubmit(parsed);
    } finally {
      setSubmitting(false);
    }
  }

  if (entries.length === 0) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-500">У этого отчёта нет параметров.</p>
        <Button type="submit" disabled={submitting}>
          {submitLabel}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {entries.map(([key, field]) => (
        <div key={key} className="space-y-1">
          <Label htmlFor={key}>
            {field.label}
            {field.required && <span className="text-red-600"> *</span>}
          </Label>
          {field.options ? (
            <Select
              id={key}
              value={values[key] ?? ''}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [key]: e.target.value }))
              }
            >
              {field.options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </Select>
          ) : (
            <Input
              id={key}
              type={inputTypeFor(field)}
              value={values[key] ?? ''}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [key]: e.target.value }))
              }
            />
          )}
          {errors[key] && <p className="text-sm text-red-600">{errors[key]}</p>}
        </div>
      ))}
      <Button type="submit" disabled={submitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
