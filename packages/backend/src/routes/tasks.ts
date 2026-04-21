import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';

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
