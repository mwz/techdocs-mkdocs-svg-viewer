import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

export default defineConfig({
  testDir: './tests',
  testIgnore: 'demo.spec.ts',
  outputDir: '../../test-results/backstage',
  timeout: 120_000,
  expect: { timeout: 30_000 },
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm example:backstage:dev',
    cwd: resolve(__dirname, '../..'),
    url: 'http://localhost:3000',
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
    env: { BROWSER: 'none' },
  },
});
