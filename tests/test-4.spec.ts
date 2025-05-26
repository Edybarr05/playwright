import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://www.youtube.com/');
  await page.getByRole('combobox', { name: 'Search' }).click();
  await page.getByRole('combobox', { name: 'Search' }).fill('imagine');
  await page.getByRole('button', { name: 'imagine dragons believer' }).click();
  await page.locator('#inline-preview-player').click();
  await page.getByRole('button', { name: 'Pause keyboard shortcut k' }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await page.getByRole('button', { name: 'Full screen keyboard shortcut' }).click();
  await page.getByRole('button', { name: 'Pause keyboard shortcut k' }).click();
});