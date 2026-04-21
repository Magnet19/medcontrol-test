import express, { type Express, type NextFunction, type Request, type Response } from 'express';

export function createApp(): Express {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'not_found', path: req.path });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    const status = err instanceof HttpError ? err.status : 500;
    if (status >= 500) {
      console.error('[error]', err);
    }
    res.status(status).json({ error: message });
  });

  return app;
}

export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}
