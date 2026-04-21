import { execSync } from 'node:child_process';

const BACKEND_URL = process.env.E2E_BACKEND_URL ?? 'http://localhost:3000';
const FRONTEND_URL = process.env.E2E_FRONTEND_URL ?? 'http://localhost:5173';
const SKIP_COMPOSE = process.env.E2E_SKIP_COMPOSE === '1';

async function waitFor(url: string, timeoutMs = 120_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastErr: unknown = null;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) return;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Timed out waiting for ${url}: ${String(lastErr)}`);
}

export default async function globalSetup(): Promise<void> {
  if (!SKIP_COMPOSE) {
    console.log('[e2e] docker compose up -d --build');
    execSync('docker compose up -d --build', { stdio: 'inherit' });
  } else {
    console.log('[e2e] E2E_SKIP_COMPOSE=1 — using already-running stack');
  }
  console.log(`[e2e] waiting for backend ${BACKEND_URL}/health`);
  await waitFor(`${BACKEND_URL}/health`);
  console.log(`[e2e] waiting for frontend ${FRONTEND_URL}`);
  await waitFor(FRONTEND_URL);
  console.log('[e2e] stack is ready');
}
