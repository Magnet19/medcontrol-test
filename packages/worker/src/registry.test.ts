import { describe, it, expect, beforeEach } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadReports,
  clearRegistry,
  getAllReports,
  getReport,
  getReportsMeta,
} from './registry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesRoot = path.resolve(__dirname, '..', 'test-fixtures');

describe('worker registry', () => {
  beforeEach(() => {
    clearRegistry();
  });

  it('is empty by default', () => {
    expect(getAllReports()).toEqual([]);
  });

  it('discovers and registers every valid module in the directory', async () => {
    await loadReports(path.join(fixturesRoot, 'valid'));
    const all = getAllReports();
    expect(all).toHaveLength(2);
    const ids = all.map((r) => r.id).sort();
    expect(ids).toEqual(['alpha', 'beta']);
    expect(getReport('alpha')).toBeDefined();
    expect(typeof getReport('alpha')!.generate).toBe('function');
  });

  it('throws when two modules share an id', async () => {
    await expect(loadReports(path.join(fixturesRoot, 'duplicate'))).rejects.toThrow(
      /duplicate report id/,
    );
  });

  it('throws with the filename when a module has an invalid shape', async () => {
    await expect(loadReports(path.join(fixturesRoot, 'invalid'))).rejects.toThrow(
      /Invalid report module bad\.mjs/,
    );
  });

  it('getReportsMeta strips generate from each entry', async () => {
    await loadReports(path.join(fixturesRoot, 'valid'));
    const meta = getReportsMeta();
    expect(meta).toHaveLength(2);
    for (const m of meta) {
      expect(m).not.toHaveProperty('generate');
    }
  });
});
