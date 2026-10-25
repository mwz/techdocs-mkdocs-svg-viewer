import { expect, test } from '@playwright/test';

// Exercises the built drop-in script (dist/svg-viewer.js) on a plain page, as
// MkDocs `extra_javascript` would load it outside Backstage.
const url = '/dev/standalone.html';

test('the open viewer follows the MkDocs palette without changing SVG artwork', async ({
  page,
}) => {
  await page.goto(url);
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = `
      body { --md-default-bg-color: #ffffff; --md-default-fg-color: #192338; }
      body[data-md-color-scheme="slate"] {
        --md-default-bg-color: #20242c;
        --md-default-fg-color: #eeeeee;
        --md-default-fg-color--light: #bbbbbb;
      }
    `;
    document.head.append(style);
  });
  const svg = page.locator('#standalone');
  const original = await svg.evaluate((element) => element.outerHTML);
  await page
    .getByRole('button', { name: 'Expand Standalone diagram', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  );
  await page.evaluate(() =>
    document.body.setAttribute('data-md-color-scheme', 'slate'),
  );
  await expect(page.getByRole('dialog')).toHaveCSS(
    'background-color',
    'rgb(32, 36, 44)',
  );
  await expect(
    page.getByRole('button', { name: 'Zoom in', exact: true }),
  ).toHaveCSS('color', 'rgb(238, 238, 238)');
  await expect(page.locator('.tdsv-canvas svg > rect')).toHaveCSS(
    'fill',
    'rgb(237, 244, 255)',
  );
  await page.evaluate(() =>
    document.body.removeAttribute('data-md-color-scheme'),
  );
  await expect(page.getByRole('dialog')).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  );
  await page.keyboard.press('Escape');
  expect(await svg.evaluate((element) => element.outerHTML)).toBe(original);
});

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
