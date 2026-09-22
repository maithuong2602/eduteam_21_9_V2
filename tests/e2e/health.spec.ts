import { test, expect } from '@playwright/test';

test('Health check: App loads successfully', async ({ page }) => {
  const response = await page.goto('/');
  // Basic health checks
  expect(response?.status()).toBe(200);
  
  // Wait for body to be attached to ensure the app is running
  await expect(page.locator('body')).toBeAttached();
});
