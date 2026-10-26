import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// An opt-in capture task, separate from the browser regression suite.
// Playwright gives every capture task a fresh browser context and stops servers.
const output = new URL('../img/', import.meta.url);
const backstage = 'http://localhost:4173/techdocs-mkdocs-svg-viewer';
const expand = (page: Page) =>
  page.getByRole('button', {
    name: 'Expand Space observatory architecture',
    exact: true,
  });

async function capture(page: Page, filename: string) {
  await page.mouse.move(0, 0);
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Let font metrics and sticky navigation settle before recording the page.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
  });
  await mkdir(output, { recursive: true });
  await page.screenshot({
    path: fileURLToPath(new URL(filename, output)),
    fullPage: false,
    animations: 'disabled',
    caret: 'hide',
    scale: 'css',
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`capture MkDocs in ${theme} mode`, async ({ page }) => {
    await page.goto('http://127.0.0.1:8001/');
    await expect(expand(page)).toBeVisible();
    if (theme === 'dark')
      await page.locator('label[title="Switch to dark mode"]').click();
    await expect(page.locator('body')).toHaveAttribute(
      'data-md-color-scheme',
      theme === 'dark' ? 'slate' : 'default',
    );
    await capture(page, `mkdocs-${theme}.png`);
  });

  test(`capture Backstage and the viewer in ${theme} mode`, async ({
    page,
  }) => {
    await page.goto(`${backstage}/settings/`);
    const choice = page.getByRole('button', {
      name: new RegExp(`^${theme}$`, 'i'),
    });
    await choice.click();
    await expect(choice).toHaveAttribute('aria-pressed', 'true');
    await page.goto(`${backstage}/docs/default/component/svg-viewer-example/`);
    // A fresh document avoids retaining TechDocs' previous sticky-nav position.
    await page.reload();
    await expect(expand(page)).toBeVisible();
    await capture(page, `backstage-${theme}.png`);

    await page.setViewportSize({ width: 1600, height: 1050 });
    await expand(page).click();
    await expect(page.locator('dialog.tdsv')).toBeVisible();
    for (let step = 0; step < 3; step++)
      await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await expect(page.getByLabel('Zoom relative to fit')).toHaveText('195%');
    await capture(page, `svg-viewer-${theme}.png`);
  });
}
