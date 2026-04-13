import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { resetDb, seedTodo } from '../fixtures/db';

test.describe('Accessibility — axe-core WCAG 2.1 AA', () => {
  test.beforeEach(async () => {
    await resetDb();
  });

  test('empty list state has no serious/critical violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('No tasks yet. Add one above.')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(serious, JSON.stringify(serious, null, 2)).toHaveLength(0);
  });

  test('populated list state has no serious/critical violations', async ({ page }) => {
    await seedTodo('First axe test task');
    await seedTodo('Second axe test task');

    await page.goto('/');
    await expect(page.getByText('First axe test task')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(serious, JSON.stringify(serious, null, 2)).toHaveLength(0);
  });

  test('completed todo state has no serious/critical violations', async ({ page }) => {
    await seedTodo('Task to complete');

    await page.goto('/');
    const checkbox = page.getByRole('checkbox', { name: /Complete: Task to complete/ });
    await expect(checkbox).toBeVisible();
    await checkbox.click();
    await expect(checkbox).toBeChecked();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(serious, JSON.stringify(serious, null, 2)).toHaveLength(0);
  });
});
