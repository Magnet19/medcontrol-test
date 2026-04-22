import fs from 'node:fs/promises';
import path from 'node:path';
import type { FileSource } from '@report-platform/shared';

export interface FileSourceOptions {
  baseDir: string;
}

export function createFileSource(options: FileSourceOptions): FileSource {
  const { baseDir } = options;

  function resolve(relativePath: string): string {
    const resolved = path.resolve(baseDir, relativePath);
    if (!resolved.startsWith(path.resolve(baseDir))) {
      throw new Error(`FileSource: path "${relativePath}" escapes base dir`);
    }
    return resolved;
  }

  return {
    async readJson<T>(relativePath: string): Promise<T> {
      const raw = await fs.readFile(resolve(relativePath), 'utf8');
      return JSON.parse(raw) as T;
    },
    async readCsv(relativePath: string): Promise<string[][]> {
      const raw = await fs.readFile(resolve(relativePath), 'utf8');
      return raw
        .split(/\r?\n/)
        .filter((line) => line.length > 0)
        .map((line) => line.split(','));
    },
  };
}
