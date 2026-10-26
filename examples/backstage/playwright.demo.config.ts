import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

export default defineConfig({
  testDir: './tests',
  testMatch: 'demo.spec.ts',
  outputDir: '../../test-results/backstage-demo',
  timeout: 60_000,
  expect: { timeout: 20_000 },
  workers: 1,
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node examples/backstage/scripts/serve-demo.mjs',
    cwd: resolve(__dirname, '../..'),
    url: 'http://localhost:4173/techdocs-mkdocs-svg-viewer/',
    timeout: 30_000,
    reuseExistingServer: false,
  },
});
