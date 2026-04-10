import { test, expect } from '@playwright/test';
import { resetDb, seedTodo } from '../fixtures/db';

test.beforeEach(async () => {
  await resetDb();
  await seedTodo('Task to delete');
});

test('deletes a todo by hovering and clicking delete', async ({ page }) => {
  await page.goto('/');
  await page.locator('.todo-card', { hasText: 'Task to delete' }).hover();
  await page.getByRole('button', { name: /Delete: Task to delete/i }).click();
  await expect(page.getByText('Task to delete')).not.toBeVisible();
});

test('deleted todo is absent after reload', async ({ page }) => {
  await page.goto('/');
  await page.locator('.todo-card', { hasText: 'Task to delete' }).hover();
  await page.getByRole('button', { name: /Delete: Task to delete/i }).click();
  await expect(page.getByText('Task to delete')).not.toBeVisible();
  await page.reload();
  await expect(page.getByText('Task to delete')).not.toBeVisible();
});
