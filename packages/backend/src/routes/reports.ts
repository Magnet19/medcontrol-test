import { Router } from 'express';
import { getReportsMeta } from '@report-platform/shared';

export const reportsRouter = Router();

reportsRouter.get('/', (_req, res) => {
  res.json(getReportsMeta());
});
