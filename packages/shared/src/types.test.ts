import { describe, it, expectTypeOf } from 'vitest';
import type {
  TaskStatus,
  ReportDefinition,
  ReportMeta,
  ParameterField,
  GenerateContext,
} from './types.js';

describe('TaskStatus', () => {
  it('accepts the four canonical literals', () => {
    expectTypeOf<'pending'>().toMatchTypeOf<TaskStatus>();
    expectTypeOf<'processing'>().toMatchTypeOf<TaskStatus>();
    expectTypeOf<'completed'>().toMatchTypeOf<TaskStatus>();
    expectTypeOf<'failed'>().toMatchTypeOf<TaskStatus>();
  });

  it('rejects any other literal', () => {
    expectTypeOf<'queued'>().not.toMatchTypeOf<TaskStatus>();
    expectTypeOf<'done'>().not.toMatchTypeOf<TaskStatus>();
    expectTypeOf<''>().not.toMatchTypeOf<TaskStatus>();
  });
});

describe('ReportDefinition', () => {
  it('requires a generate method returning Promise<string>', () => {
    expectTypeOf<ReportDefinition['generate']>()
      .parameter(0)
      .toMatchTypeOf<GenerateContext>();
    expectTypeOf<ReportDefinition['generate']>()
      .returns.resolves.toEqualTypeOf<string>();
  });

  it('has formats limited to xlsx and pdf', () => {
    expectTypeOf<ReportDefinition['formats']>().toEqualTypeOf<('xlsx' | 'pdf')[]>();
  });
});

describe('ReportMeta', () => {
  it('omits generate from ReportDefinition', () => {
    expectTypeOf<ReportMeta>().not.toHaveProperty('generate');
    expectTypeOf<ReportMeta>().toHaveProperty('id');
    expectTypeOf<ReportMeta>().toHaveProperty('parametersSchema');
  });
});

describe('ParameterField', () => {
  it('supports string, number, date types', () => {
    const p: ParameterField = { type: 'string', label: 'x', required: true };
    expectTypeOf(p).toMatchTypeOf<ParameterField>();
    expectTypeOf<ParameterField['type']>().toEqualTypeOf<'string' | 'number' | 'date'>();
  });
});
