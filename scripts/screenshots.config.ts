import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const backstage = 'http://localhost:4173/techdocs-mkdocs-svg-viewer';

export default defineConfig({
  testDir: '.',
  testMatch: 'capture-screenshots.ts',
  outputDir: '../test-results/screenshots',
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 20_000 },
  use: {
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1400, height: 1050 },
    deviceScaleFactor: 1,
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    colorScheme: 'light',
    contextOptions: { reducedMotion: 'reduce' },
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      // This also builds and copies the standalone script into the MkDocs site.
      command:
        'pnpm example:backstage-demo:build && node examples/backstage/scripts/serve-demo.mjs',
      cwd: root,
      url: `${backstage}/`,
      env: { DEMO_BASE_URL: backstage, DEMO_PORT: '4173' },
      timeout: 240_000,
      reuseExistingServer: false,
    },
    {
      command: 'poetry run mkdocs serve --dev-addr 127.0.0.1:8001',
      cwd: fileURLToPath(new URL('../examples/mkdocs/', import.meta.url)),
      url: 'http://127.0.0.1:8001/',
      reuseExistingServer: false,
    },
  ],
});
