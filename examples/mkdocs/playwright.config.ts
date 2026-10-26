import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.ts',
  outputDir: '../../test-results/mkdocs',
  use: { baseURL: 'http://127.0.0.1:8001', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'poetry run mkdocs serve --dev-addr 127.0.0.1:8001',
    cwd: fileURLToPath(new URL('.', import.meta.url)),
    url: 'http://127.0.0.1:8001',
    reuseExistingServer: false,
  },
});
