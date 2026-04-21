import { test, expect, request } from '@playwright/test';

const BACKEND_URL = process.env.E2E_BACKEND_URL ?? 'http://localhost:3000';

test('user-export: full cycle catalog → run → completed → download xlsx', async ({
  page,
}) => {
  await page.goto('/');

  const card = page.locator('h2', { hasText: /пользовател/i }).first();
  await expect(card).toBeVisible({ timeout: 20_000 });

  await page
    .locator('div', { has: card })
    .getByRole('link', { name: /запустить/i })
    .first()
    .click();

  await expect(page).toHaveURL(/\/reports\/user-export$/);

  await page.locator('#dateFrom').fill('2026-01-01');
  await page.locator('#dateTo').fill('2026-01-31');

  await page.getByRole('button', { name: /запустить/i }).click();

  await expect(page).toHaveURL(/\/tasks\/[0-9a-f-]+$/, { timeout: 15_000 });

  const downloadBtn = page.getByRole('button', { name: /скачать/i });
  await expect(downloadBtn).toBeEnabled({ timeout: 60_000 });

  const taskId = page.url().split('/').pop()!;

  const api = await request.newContext();
  const res = await api.get(`${BACKEND_URL}/api/tasks/${taskId}/download`);
  expect(res.status()).toBe(200);
  const contentType = res.headers()['content-type'] ?? '';
  expect(contentType).toContain('spreadsheetml');

  const buf = await res.body();
  expect(buf.length).toBeGreaterThan(0);
  expect(buf[0]).toBe(0x50);
  expect(buf[1]).toBe(0x4b);
  expect(buf[2]).toBe(0x03);
  expect(buf[3]).toBe(0x04);
});
