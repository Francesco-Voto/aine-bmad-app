import { test, expect } from '@playwright/test';
import { resetDb, seedTodo } from '../fixtures/db';

test.beforeEach(async () => {
  await resetDb();
  await seedTodo('Should not appear');
});

test('shows list error state when GET /api/todos returns 503', async ({ page }) => {
  test.setTimeout(30000);
  await page.route('**/api/todos', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({ status: 503, body: JSON.stringify({ message: 'Service unavailable' }) });
    } else {
      route.continue();
    }
  });

  await page.goto('/');

  await expect(page.getByRole('alert')).toBeVisible({ timeout: 20000 });
  expect(await page.getByRole('alert').textContent()).toContain("Couldn't load your tasks");
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible({ timeout: 20000 });
});

test('recovers after clicking Retry when connection is restored', async ({ page }) => {
  test.setTimeout(30000);
  let block = true;
  await page.route('**/api/todos', (route) => {
    if (route.request().method() === 'GET' && block) {
      route.fulfill({ status: 503, body: JSON.stringify({ message: 'Service unavailable' }) });
    } else {
      route.continue();
    }
  });

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible({ timeout: 20000 });

  block = false;
  await page.getByRole('button', { name: 'Retry' }).click();

  await expect(page.getByText('Should not appear')).toBeVisible();
  await expect(page.getByRole('alert')).not.toBeVisible();
});
