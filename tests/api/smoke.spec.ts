import { test, expect } from '@playwright/test';

test('API Smoke test: GET /api/presentations returns empty list or valid data', async ({ request }) => {
  const response = await request.get('/api/presentations');
  expect(response.ok()).toBeTruthy();
  
  const data = await response.json();
  expect(data).toHaveProperty('presentations');
  expect(Array.isArray(data.presentations)).toBeTruthy();
});
