import { test, expect } from '@playwright/test';
import { resetDb, seedTodo } from '../fixtures/db';

test.beforeEach(async () => {
  await resetDb();
  await seedTodo('Call the dentist');
});

test('toggles a todo complete and sees strikethrough', async ({ page }) => {
  await page.goto('/');
  const checkbox = page.getByRole('checkbox', { name: /Complete: Call the dentist/i });
  await checkbox.click();
  const taskText = page.getByText('Call the dentist');
  await expect(taskText).toHaveCSS('text-decoration-line', 'line-through');
});

test('completed state persists after reload', async ({ page }) => {
  await page.goto('/');
  const checkbox = page.getByRole('checkbox', { name: /Complete: Call the dentist/i });
  await checkbox.click();
  await page.reload();
  await expect(page.getByRole('checkbox', { name: /Complete: Call the dentist/i })).toBeChecked();
});
