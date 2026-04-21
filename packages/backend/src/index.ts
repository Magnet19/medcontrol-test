import { createApp } from './app.js';
import { loadEnv } from './env.js';
import { prisma } from './db.js';

async function main() {
  const env = loadEnv();
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`[backend] listening on :${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[backend] received ${signal}, shutting down`);
    server.close(() => console.log('[backend] http server closed'));
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[backend] fatal startup error:', err);
  process.exit(1);
});
