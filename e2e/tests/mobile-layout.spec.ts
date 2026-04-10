import { test, expect } from '@playwright/test';
import { resetDb, seedTodo } from '../fixtures/db';

test.beforeEach(async () => {
  await resetDb();
  await seedTodo('Mobile task');
});

test('renders without horizontal scroll at 375x812', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  const hasHScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(hasHScroll).toBe(false);
});

test('input and list are visible at mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page.getByPlaceholder('Add a task…')).toBeVisible();
  await expect(page.getByText('Mobile task')).toBeVisible();
});
