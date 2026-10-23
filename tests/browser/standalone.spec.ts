import { expect, test } from '@playwright/test';

// Exercises the built drop-in script (dist/svg-viewer.js) on a plain page, as
// MkDocs `extra_javascript` would load it outside Backstage.
const url = '/dev/standalone.html';

test('drop-in script installs once and opens the viewer', async ({ page }) => {
  await page.goto(url);
  await expect(page.locator('.tdsv-expand')).toHaveCount(1);
  expect(await page.evaluate(() => typeof window.disposeSvgViewer)).toBe(
    'function',
  );
  await page
    .getByRole('button', { name: 'Expand Standalone diagram', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('article #standalone')).toHaveCount(1);
});

test('links keep native browser handling and fragments close the viewer', async ({
  page,
}) => {
  await page.goto(url);
  await expect(page.locator('a[aria-label="Read guide"]')).not.toHaveAttribute(
    'href',
  );
  await page
    .getByRole('button', { name: 'Expand Standalone diagram', exact: true })
    .click();
  // xlink-only anchors have no link role in Chromium, so select by attribute.
  await page.locator('a[aria-label="Jump to note"]').click();
  await expect(page).toHaveURL(/#note$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('content swapped by instant navigation is enhanced', async ({ page }) => {
  await page.goto(url);
  await page
    .getByRole('button', { name: 'Simulate instant navigation' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Expand Next page diagram', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.tdsv-expand')).toHaveCount(1);
});

test('disposeSvgViewer removes the viewer', async ({ page }) => {
  await page.goto(url);
  await expect(page.locator('.tdsv-expand')).toHaveCount(1);
  await page.evaluate(() => window.disposeSvgViewer!());
  await expect(page.locator('.tdsv-expand')).toHaveCount(0);
});
