import { execSync } from 'node:child_process';

const SKIP_COMPOSE = process.env.E2E_SKIP_COMPOSE === '1';
const KEEP_STACK = process.env.E2E_KEEP_STACK === '1';

export default async function globalTeardown(): Promise<void> {
  if (SKIP_COMPOSE || KEEP_STACK) {
    console.log('[e2e] skipping teardown (SKIP_COMPOSE or KEEP_STACK set)');
    return;
  }
  console.log('[e2e] docker compose down -v');
  execSync('docker compose down -v', { stdio: 'inherit' });
}
