import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

test('addon keeps its defaults independently of standalone configuration', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.assign(window, {
      svgViewerOptions: {
        selector: 'svg',
        minWidth: 0,
        minHeight: 0,
        minZoom: 1,
        maxZoom: 1,
        resolveXlinkHref: false,
      },
    });
  });
  await page.goto('/docs/default/component/svg-viewer-example');
  await page.getByRole('button', { name: /enter|sign in/i }).click();
  await expect(
    page.getByRole('button', {
      name: 'Expand Order processing architecture',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator('#architecture a[aria-label="Read order service guide"]'),
  ).toHaveAttribute('href', /order-service\/#orders$/);

  await page.locator('#architecture').evaluate((source) => {
    const root = source.getRootNode() as ShadowRoot;
    const diagram = (title: string, width: number, height: number) => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', String(width));
      svg.setAttribute('height', String(height));
      svg.setAttribute('aria-label', title);
      svg.style.cssText = `display:block;width:${width}px;height:${height}px`;
      return svg;
    };
    const article = document.createElement('article');
    article.append(
      diagram('At size threshold', 80, 40),
      diagram('Below width threshold', 79, 40),
      diagram('Below height threshold', 80, 39),
    );
    const content = document.createElement('div');
    content.className = 'md-content__inner';
    content.append(diagram('In documentation content', 200, 100));
    root.append(diagram('Outside documentation', 200, 100), article, content);
  });
  await expect(
    page.getByRole('button', {
      name: 'Expand In documentation content',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator('.tdsv-expand')).toHaveCount(3);
  for (const title of [
    'Outside documentation',
    'Below width threshold',
    'Below height threshold',
  ]) {
    await expect(
      page.locator(`svg[aria-label="${title}"]`),
    ).not.toHaveAttribute('data-techdocs-svg-viewer-ready');
  }

  await page
    .getByRole('button', { name: 'Expand At size threshold', exact: true })
    .click();
  for (let step = 0; step < 20; step++) await page.keyboard.press('+');
  await expect(page.getByLabel('Zoom relative to fit')).toHaveText('1600%');
  await expect(
    page.getByRole('button', { name: 'Zoom in', exact: true }),
  ).toBeDisabled();
  for (let step = 0; step < 40; step++) await page.keyboard.press('-');
  await expect(page.getByLabel('Zoom relative to fit')).toHaveText('25%');
  await expect(
    page.getByRole('button', { name: 'Zoom out', exact: true }),
  ).toBeDisabled();
});

test('Settings switches the TechDocs viewer between dark and light themes', async ({
  page,
}) => {
  await page.goto('/settings');
  await page.getByRole('button', { name: /enter|sign in/i }).click();

  for (const theme of ['dark', 'light'] as const) {
    // The explicit Backstage choice must win over the operating system setting.
    await page.emulateMedia({
      colorScheme: theme === 'dark' ? 'light' : 'dark',
    });
    await page
      .getByTestId('sidebar-root')
      .getByRole('link', { name: 'Settings', exact: true })
      .click();
    const choice = page.getByRole('button', {
      name: new RegExp(`^${theme}$`, 'i'),
    });
    await choice.click();
    await expect(choice).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    await expect(choice).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/docs/default/component/svg-viewer-example');
    await page
      .getByRole('button', {
        name: 'Expand Order processing architecture',
        exact: true,
      })
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    for (const selector of [
      'dialog.tdsv',
      '.tdsv-toolbar',
      '.tdsv-stage',
      '.tdsv-canvas',
      '.tdsv-help',
      '.tdsv button',
    ]) {
      const colours = await page
        .locator(selector)
        .first()
        .evaluate((element) => {
          const style = getComputedStyle(element);
          const brightness = (colour: string) =>
            colour
              .match(/[\d.]+/g)!
              .slice(0, 3)
              .reduce((sum, channel) => sum + Number(channel), 0) / 3;
          return {
            background: brightness(style.backgroundColor),
            foreground: brightness(style.color),
          };
        });
      if (theme === 'dark') {
        expect(colours.background, selector).toBeLessThan(128);
        expect(colours.foreground, selector).toBeGreaterThan(128);
      } else {
        expect(colours.background, selector).toBeGreaterThan(128);
        expect(colours.foreground, selector).toBeLessThan(128);
      }
    }
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await expect(page.getByLabel('Zoom relative to fit')).toHaveText('125%');
    const pageBackground = await dialog.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    await page
      .getByRole('button', { name: 'Use white theme', exact: true })
      .click();
    await expect(dialog).toHaveCSS('background-color', 'rgb(242, 244, 248)');
    await expect(page.locator('.tdsv-canvas')).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)',
    );
    await expect(
      page.getByRole('button', { name: 'Zoom in', exact: true }),
    ).toHaveCSS('color', 'rgb(25, 35, 56)');
    await page
      .getByRole('button', { name: 'Use page theme', exact: true })
      .click();
    await expect(dialog).toHaveCSS('background-color', pageBackground);
    await expect(page.getByLabel('Zoom relative to fit')).toHaveText('125%');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  }
});

test('viewer theme persists across TechDocs navigation and reloads', async ({
  page,
}) => {
  await page.goto('/settings');
  await page.getByRole('button', { name: /enter|sign in/i }).click();
  const dark = page.getByRole('button', { name: /^dark$/i });
  await dark.click();
  await expect(dark).toHaveAttribute('aria-pressed', 'true');
  const docs = '/docs/default/component/svg-viewer-example';
  await page.goto(docs);
  const expand = page.getByRole('button', {
    name: 'Expand Order processing architecture',
    exact: true,
  });
  await expand.click();
  const dialog = page.getByRole('dialog');
  const pageBackground = await dialog.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  await page
    .getByRole('button', { name: 'Use white theme', exact: true })
    .click();
  await page.keyboard.press('Escape');
  await expand.click();
  await expect(dialog).toHaveCSS('background-color', 'rgb(242, 244, 248)');
  await page.keyboard.press('Escape');

  await page
    .getByTestId('sidebar-root')
    .getByRole('link', { name: 'Settings', exact: true })
    .click();
  await expect(dark).toHaveAttribute('aria-pressed', 'true');
  await page.goto(docs);
  await expand.click();
  await expect(
    page.getByRole('button', { name: 'Use page theme', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.tdsv-canvas')).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  );
  await page.reload();
  await expand.click();
  await expect(dialog).toHaveCSS('background-color', 'rgb(242, 244, 248)');
  await page
    .getByRole('button', { name: 'Use page theme', exact: true })
    .click();
  await expect(dialog).toHaveCSS('background-color', pageBackground);
  await page.reload();
  await expand.click();
  await expect(dialog).toHaveCSS('background-color', pageBackground);
  await expect(
    page.getByRole('button', { name: 'Use white theme', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
});

test('the local addon runs in TechDocs and routes SVG links without reloading', async ({
  page,
}) => {
  const mkdocsPath = resolve(__dirname, '../../mkdocs/mkdocs.yml');
  const originalMkdocs = await readFile(mkdocsPath, 'utf8');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/docs/default/component/svg-viewer-example');
  await page.getByRole('button', { name: /enter|sign in/i }).click();

  const expand = page.getByRole('button', {
    name: 'Expand Order processing architecture',
    exact: true,
  });
  await expect(expand).toHaveCount(1);
  await expand.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.tdsv #architecture')).toHaveAttribute(
    'viewBox',
    '-20 -20 840 360',
  );
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(page.getByLabel('Zoom relative to fit')).toHaveText('125%');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(expand).toBeFocused();

  // A marker survives client-side navigation, but disappears on a full reload.
  await page.evaluate(() => {
    Object.assign(window, { backstageSvgTest: true });
  });
  await expand.click();
  const link = page.getByRole('link', { name: 'Read order service guide' });
  await expect(link).toHaveAttribute('href', /order-service\/#orders$/);
  await link.click();
  await expect(page).toHaveURL(/\/order-service\/#orders$/);
  await expect(
    page.getByRole('heading', { name: /^Orders/, level: 2 }),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => 'backstageSvgTest' in window)).toBe(true);

  await page.goBack();
  await expect(expand).toHaveCount(1);
  await expand.click();
  await page.getByRole('link', { name: 'Jump to queue note' }).click();
  await expect(page).toHaveURL(/#queue-note$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => 'backstageSvgTest' in window)).toBe(true);
  expect(errors).toEqual([]);
  expect(await readFile(mkdocsPath, 'utf8')).toBe(originalMkdocs);
});
