import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://www.youtube.com/');
  await page.getByRole('combobox', { name: 'Search' }).click();
  await page.getByRole('combobox', { name: 'Search' }).fill('im');
  await page.getByRole('button', { name: 'imagine dragons' }).click();
  await page.getByRole('link', { name: 'Imagine Dragons - Believer (Official Music Video) 3 minutes, 37 seconds' }).click();
  await page.locator('#inline-preview-player video').click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
});
await page.getByRole('button', { name: 'Pause keyboard shortcut k' }).click();