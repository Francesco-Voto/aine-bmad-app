import { test, expect } from '@playwright/test';
import { resetDb } from '../fixtures/db';

test.beforeEach(async () => {
  await resetDb();
});

test('todos persist across page reloads', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Add a task…').fill('Alpha task');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Alpha task')).toBeVisible();
  await page.getByPlaceholder('Add a task…').fill('Beta task');
  await page.keyboard.press('Enter');

  await expect(page.getByText('Alpha task')).toBeVisible();
  await expect(page.getByText('Beta task')).toBeVisible();

  await page.reload();

  await expect(page.getByText('Alpha task')).toBeVisible();
  await expect(page.getByText('Beta task')).toBeVisible();
});
