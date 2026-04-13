import { test, expect } from '@playwright/test';

test('API todos endpoint returns 200 via Nginx proxy', async ({ request }) => {
  const res = await request.get('/api/todos');
  expect(res.status()).toBe(200);
});

test('React app HTML is served at root', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});
