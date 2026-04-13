import { test, expect } from '@playwright/test';
import { resetDb } from '../fixtures/db';

test.beforeEach(async () => {
  await resetDb();
});

test('todos persist across page reloads', async ({ page }) => {
  const input = page.getByPlaceholder('Add a task…');
  await page.goto('/');

  await input.fill('Alpha task');
  await page.keyboard.press('Enter');
  // Wait for the mutation to complete — input clears on onSuccess
  await expect(input).toHaveValue('');
  await expect(page.getByText('Alpha task')).toBeVisible();

  await input.fill('Beta task');
  await page.keyboard.press('Enter');
  // Wait for the mutation to complete before asserting or reloading
  await expect(input).toHaveValue('');
  await expect(page.getByText('Alpha task')).toBeVisible();
  await expect(page.getByText('Beta task')).toBeVisible();

  await page.reload();

  await expect(page.getByText('Alpha task')).toBeVisible();
  await expect(page.getByText('Beta task')).toBeVisible();
});
