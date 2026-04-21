import { Router } from 'express';
import { z } from 'zod';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../db.js';

const MIME_BY_EXT: Record<string, string> = {
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pdf': 'application/pdf',
};

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const tasksRouter = Router();

tasksRouter.get('/', async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: 'invalid_query',
      fields: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
    return;
  }
  const { limit, offset } = parsed.data;
  const [items, total] = await Promise.all([
    prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.task.count(),
  ]);
  res.json({ items, total, limit, offset });
});

tasksRouter.get('/:id', async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) {
    res.status(404).json({ error: 'task_not_found', taskId: req.params.id });
    return;
  }
  res.json(task);
});

tasksRouter.get('/:id/download', async (req, res, next) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) {
    res.status(404).json({ error: 'task_not_found', taskId: req.params.id });
    return;
  }
  if (task.status !== 'completed') {
    res.status(409).json({ error: 'task_not_completed', status: task.status });
    return;
  }
  if (!task.resultUrl) {
    res.status(404).json({ error: 'result_missing' });
    return;
  }
  try {
    await fsp.access(task.resultUrl);
  } catch {
    res.status(404).json({ error: 'file_missing' });
    return;
  }
  const ext = path.extname(task.resultUrl).toLowerCase();
  const mime = MIME_BY_EXT[ext] ?? 'application/octet-stream';
  const filename = `${task.reportId}-${task.id}${ext}`;
  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  const stream = fs.createReadStream(task.resultUrl);
  stream.on('error', next);
  stream.pipe(res);
});
