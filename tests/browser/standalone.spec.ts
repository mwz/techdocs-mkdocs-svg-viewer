import { expect, test } from '@playwright/test';

// Exercises the built drop-in script (dist/svg-viewer.js) on a plain page, as
// MkDocs `extra_javascript` would load it outside Backstage.
const url = '/dev/standalone.html';

for (const entry of ['script', 'module']) {
  test(`${entry} finds SVGs without documentation containers`, async ({
    page,
  }) => {
    if (entry === 'module') {
      await page.route('**/dist/svg-viewer.js', (route) =>
        route.fulfill({ contentType: 'text/javascript', body: '' }),
      );
    }
    await page.goto('/examples/standalone/index.html');
    if (entry === 'module') {
      await page.evaluate(async () => {
        const modulePath = '/dist/viewer/index.js';
        const { installSvgViewer } = await import(modulePath);
        window.disposeSvgViewer = installSvgViewer(document.body);
      });
    }
    await expect(page.locator('article, .md-content__inner')).toHaveCount(0);
    await page
      .getByRole('button', { name: 'Expand Example diagram', exact: true })
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('body > svg')).toHaveCount(1);

    await page.evaluate(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        `<svg width="200" height="100"><title>Later diagram</title><svg width="100" height="50"></svg></svg>
         <svg width="20" height="20"><title>Small icon</title></svg>
         <div data-svg-viewer="off"><svg width="200" height="100"></svg></div>
         <div class="mermaid"><svg width="200" height="100"></svg></div>
         <button><svg width="200" height="100"></svg></button>`,
      );
    });
    await expect(
      page.getByRole('button', { name: 'Expand Later diagram', exact: true }),
    ).toBeVisible();
    await expect(page.locator('.tdsv-expand')).toHaveCount(2);
  });
}

test('script configuration controls selection, size thresholds and zoom limits', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.svgViewerOptions = {
      selector: 'svg[data-diagram]',
      minWidth: 40,
      minHeight: 20,
      minZoom: 0.5,
      maxZoom: 1.25,
    };
  });
  await page.goto('/examples/standalone/index.html');
  await expect(page.locator('.tdsv-expand')).toHaveCount(0);
  await page.evaluate(() => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `<svg data-diagram width="60" height="30" viewBox="0 0 60 30"><title>Selected diagram</title><rect width="60" height="30" /></svg>
       <svg data-diagram width="30" height="30"><title>Too narrow</title></svg>
       <svg data-diagram width="60" height="10"><title>Too short</title></svg>`,
    );
  });
  // Repeated script loads keep the original configuration and installation.
  await page.addScriptTag({ url: '/dist/svg-viewer.js' });
  await expect(page.locator('.tdsv-expand')).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Expand Selected diagram', exact: true })
    .click();
  const zoomIn = page.getByRole('button', { name: 'Zoom in', exact: true });
  const zoomOut = page.getByRole('button', { name: 'Zoom out', exact: true });
  await zoomIn.click();
  await expect(page.getByLabel('Zoom relative to fit')).toHaveText('125%');
  await expect(zoomIn).toBeDisabled();
  for (let step = 0; step < 5; step++) await zoomOut.click();
  await expect(page.getByLabel('Zoom relative to fit')).toHaveText('50%');
  await expect(zoomOut).toBeDisabled();
  await page.evaluate(() => window.disposeSvgViewer!());
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.tdsv-expand')).toHaveCount(0);
  await expect(page.locator('body > svg[data-diagram]')).toHaveCount(3);
});

test('script configuration keeps standalone defaults for omitted options', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.svgViewerOptions = { maxZoom: 1 };
  });
  await page.goto('/examples/standalone/index.html');
  await page
    .getByRole('button', { name: 'Expand Example diagram', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Zoom in', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Zoom out', exact: true }),
  ).toBeEnabled();
});

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
