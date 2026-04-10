import { test, expect } from '@playwright/test';
import { resetDb } from '../fixtures/db';

test.beforeEach(async () => {
  await resetDb();
});

test('adds a todo and sees it in the list', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Add a task…').fill('Buy milk');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Buy milk')).toBeVisible();
  await expect(page.getByPlaceholder('Add a task…')).toHaveValue('');
});

test('added todo persists after reload', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Add a task…').fill('Persistent task');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Persistent task')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Persistent task')).toBeVisible();
});
