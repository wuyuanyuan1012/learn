import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120000,
  expect: { timeout: 15000 },
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:3000',
    channel: 'chrome',
    viewport: { width: 390, height: 844 },
    screenshot: 'only-on-failure',
    trace: 'off',
  },
});
