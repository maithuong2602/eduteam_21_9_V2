import { defineConfig, devices } from '@playwright/test';

const TEST_PORT = process.env.TEST_PORT || '3005';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${TEST_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
  },
  expect: {
    timeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
  webServer: {
    command: `npx cross-env USE_TEST_DB=true PORT=${TEST_PORT} ADMIN_TOKEN=test-secret-token-123 node server.js`,
    url: `http://localhost:${TEST_PORT}`,
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
  globalSetup: require.resolve('./tests/global-setup.ts'),
});
