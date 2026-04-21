import { Router } from 'express';
import { getReportsMeta, REPORTS_META, Prisma, type ReportFormat } from '@report-platform/shared';
import { prisma } from '../db.js';
import { enqueueReport } from '../services/queue.js';
import { validateParameters, ValidationError } from '../services/validator.js';

export const reportsRouter = Router();

reportsRouter.get('/', (_req, res) => {
  res.json(getReportsMeta());
});

reportsRouter.post('/:id/run', async (req, res, next) => {
  const reportId = req.params.id;
  const report = REPORTS_META.find((r) => r.id === reportId);
  if (!report) {
    res.status(404).json({ error: 'report_not_found', reportId });
    return;
  }

  let parameters: Record<string, unknown>;
  try {
    parameters = validateParameters(report.parametersSchema, req.body?.parameters);
  } catch (e) {
    if (e instanceof ValidationError) {
      res.status(400).json({ error: 'invalid_parameters', fields: e.fields });
      return;
    }
    next(e);
    return;
  }

  const requestedFormat = (req.body?.format as ReportFormat | undefined) ?? report.formats[0];
  if (!report.formats.includes(requestedFormat)) {
    res.status(400).json({
      error: 'unsupported_format',
      format: requestedFormat,
      supported: report.formats,
    });
    return;
  }

  const task = await prisma.task.create({
    data: {
      reportId,
      status: 'pending',
      parameters: parameters as Prisma.InputJsonValue,
    },
  });

  try {
    await enqueueReport({
      taskId: task.id,
      reportId,
      parameters,
      format: requestedFormat,
    });
  } catch (err) {
    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
        completedAt: new Date(),
      },
    });
    res.status(500).json({ error: 'enqueue_failed', taskId: task.id });
    return;
  }

  res.status(201).json({ taskId: task.id, status: 'pending' });
});
