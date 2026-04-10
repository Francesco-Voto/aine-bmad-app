import { test, expect } from '@playwright/test';
import { resetDb } from '../fixtures/db';

test.beforeEach(async () => {
  await resetDb();
});

test('shows empty state when no todos exist', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('No tasks yet. Add one above.')).toBeVisible();
});
