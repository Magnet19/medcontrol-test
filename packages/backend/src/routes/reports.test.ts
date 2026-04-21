import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { REPORTS_META, registerReportMeta } from '@report-platform/shared';

describe('GET /api/reports', () => {
  beforeEach(() => {
    REPORTS_META.length = 0;
  });

  it('returns an empty array when no reports are registered', async () => {
    const res = await request(createApp()).get('/api/reports');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toEqual([]);
  });

  it('returns registered reports in ReportMeta shape (no generate)', async () => {
    registerReportMeta({
      id: 'demo',
      name: 'Demo',
      description: 'A demo report',
      formats: ['xlsx'],
      parametersSchema: {
        dateFrom: { type: 'date', label: 'From', required: true },
      },
    });

    const res = await request(createApp()).get('/api/reports');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    const [first] = res.body;
    expect(first.id).toBe('demo');
    expect(first.formats).toEqual(['xlsx']);
    expect(first).not.toHaveProperty('generate');
    expect(first.parametersSchema.dateFrom).toMatchObject({
      type: 'date',
      required: true,
    });
  });
});
