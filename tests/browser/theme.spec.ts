import { expect, test } from '@playwright/test';

for (const [url, diagram, heading] of [
  ['/', 'Order processing architecture', 'Service architecture'],
  ['/dev/standalone.html', 'Standalone diagram', 'Standalone site'],
] as const) {
  test(`theme selection colours the page and viewer and survives reload at ${url}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(url);
    await expect(
      page.getByRole('button', { name: 'Switch to dark mode', exact: true }),
    ).toBeVisible();
    await expect(page.locator('body')).toHaveCSS('color', 'rgb(25, 35, 56)');

    for (const [choice, nextChoice, background, foreground] of [
      ['dark', 'light', 'rgb(30, 33, 41)', 'rgb(226, 228, 233)'],
      ['light', 'dark', 'rgb(255, 255, 255)', 'rgb(25, 35, 56)'],
    ] as const) {
      const originalDocument = await page.locator('body').elementHandle();
      await page
        .getByRole('button', { name: `Switch to ${choice} mode`, exact: true })
        .click();
      expect(await originalDocument!.evaluate((body) => body.isConnected)).toBe(
        true,
      );
      await expect(
        page.getByRole('heading', { name: heading, exact: true }),
      ).toHaveCSS('color', foreground);
      await page.reload();
      await expect(
        page.getByRole('button', {
          name: `Switch to ${nextChoice} mode`,
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.locator('body')).toHaveCSS('color', foreground);
      await page
        .getByRole('button', { name: `Expand ${diagram}`, exact: true })
        .click();
      await expect(page.getByRole('dialog')).toHaveCSS(
        'background-color',
        background,
      );
      await expect(
        page.getByRole('button', { name: 'Zoom in', exact: true }),
      ).toHaveCSS('color', foreground);
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
    }
  });

  test(`white viewer theme overrides the page without changing the diagram at ${url}`, async ({
    page,
  }) => {
    await page.goto(url);
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    const svg = page.locator('svg').filter({
      has: page.locator('title', { hasText: new RegExp(`^${diagram}$`) }),
    });
    const originalMarkup = await svg.evaluate((element) => element.outerHTML);
    const source = await svg.elementHandle();
    const expand = page.getByRole('button', {
      name: `Expand ${diagram}`,
      exact: true,
    });
    await expand.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toHaveCSS('background-color', 'rgb(30, 33, 41)');
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await page.getByRole('button', { name: 'Pan right', exact: true }).click();
    const transform = await page
      .locator('.tdsv-canvas')
      .evaluate((element) => getComputedStyle(element).transform);
    const expandedMarkup = await svg.evaluate((element) => element.outerHTML);

    const white = page.getByRole('button', {
      name: 'Use white theme',
      exact: true,
    });
    await white.focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toHaveCSS('background-color', 'rgb(242, 244, 248)');
    await expect(dialog).toHaveCSS('color-scheme', 'light');
    for (const selector of [
      '.tdsv-toolbar',
      '.tdsv-canvas',
      '.tdsv-help',
      '.tdsv button',
    ]) {
      await expect(page.locator(selector).first()).toHaveCSS(
        'background-color',
        'rgb(255, 255, 255)',
      );
    }
    await expect(
      page.getByRole('button', { name: 'Zoom in', exact: true }),
    ).toHaveCSS('color', 'rgb(25, 35, 56)');
    await expect(page.locator('body')).toHaveAttribute(
      'data-md-color-scheme',
      'slate',
    );
    await expect(page.locator('body')).toHaveCSS('color', 'rgb(226, 228, 233)');
    expect(await svg.evaluate((element) => element.outerHTML)).toBe(
      expandedMarkup,
    );
    await expect(page.locator('.tdsv-canvas')).toHaveCSS(
      'transform',
      transform,
    );
    await expect(page.getByLabel('Zoom relative to fit')).toHaveText('125%');

    // The white override stays independent of live host palette changes.
    await page.evaluate(() =>
      document.body.style.setProperty('--md-default-bg-color', '#273545'),
    );
    await expect(page.locator('.tdsv-canvas')).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)',
    );
    await page
      .getByRole('button', { name: 'Use page theme', exact: true })
      .click();
    await expect(dialog).toHaveCSS('background-color', 'rgb(39, 53, 69)');
    await expect(page.locator('.tdsv-canvas')).toHaveCSS(
      'transform',
      transform,
    );

    // Closing while white mode is active restores the original node and styles.
    await white.click();
    await page.keyboard.press('Escape');
    expect(
      await source!.evaluate(
        (element) => element.isConnected && element.outerHTML,
      ),
    ).toBe(originalMarkup);
    await expect(expand).toBeFocused();
    await expand.click();
    await expect(dialog).toHaveCSS('background-color', 'rgb(242, 244, 248)');
    await page
      .getByRole('button', { name: 'Use page theme', exact: true })
      .click();
    await page.keyboard.press('Escape');
    await expand.click();
    await expect(dialog).toHaveCSS('background-color', 'rgb(39, 53, 69)');
    await expect(white).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test(`viewer preference survives navigation and reload independently of page theme at ${url}`, async ({
    page,
  }) => {
    await page.goto(url);
    await page
      .getByRole('button', { name: 'Switch to dark mode', exact: true })
      .click();
    const expand = page.getByRole('button', {
      name: `Expand ${diagram}`,
      exact: true,
    });
    await expand.click();
    await page
      .getByRole('button', { name: 'Use white theme', exact: true })
      .click();
    await page.keyboard.press('Escape');

    await page
      .getByRole('button', {
        name:
          url === '/'
            ? 'Simulate a TechDocs page change'
            : 'Simulate instant navigation',
        exact: true,
      })
      .click();
    await page
      .getByRole('button', {
        name: url === '/' ? 'Expand Next diagram' : 'Expand Next page diagram',
        exact: true,
      })
      .click();
    await expect(page.getByRole('dialog')).toHaveCSS(
      'background-color',
      'rgb(242, 244, 248)',
    );
    await expect(
      page.getByRole('button', { name: 'Use page theme', exact: true }),
    ).toBeVisible();
    await page.reload();
    await expand.click();
    await expect(page.locator('.tdsv-canvas')).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)',
    );
    await page
      .getByRole('button', { name: 'Use page theme', exact: true })
      .click();
    await expect(page.getByRole('dialog')).toHaveCSS(
      'background-color',
      'rgb(30, 33, 41)',
    );
    await page.reload();
    await expand.click();
    await expect(page.getByRole('dialog')).toHaveCSS(
      'background-color',
      'rgb(30, 33, 41)',
    );
    await expect(
      page.getByRole('button', { name: 'Use white theme', exact: true }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('button', { name: 'Switch to light mode', exact: true }),
    ).toBeVisible();
  });
}

for (const failure of ['read', 'write'] as const) {
  test(`viewer theme remains usable when storage ${failure} access fails`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript((failure) => {
      if (failure === 'read') {
        Object.defineProperty(window, 'localStorage', {
          get() {
            throw new DOMException('Storage blocked', 'SecurityError');
          },
        });
      } else {
        Storage.prototype.setItem = () => {
          throw new DOMException('Storage full', 'QuotaExceededError');
        };
        Storage.prototype.removeItem = () => {
          throw new DOMException('Storage blocked', 'SecurityError');
        };
      }
    }, failure);
    await page.goto('/dev/standalone.html');
    await page
      .getByRole('button', { name: 'Switch to dark mode', exact: true })
      .click();
    const expand = page.getByRole('button', {
      name: 'Expand Standalone diagram',
      exact: true,
    });
    await expand.click();
    await page
      .getByRole('button', { name: 'Use white theme', exact: true })
      .click();
    await expect(page.getByRole('dialog')).toHaveCSS(
      'background-color',
      'rgb(242, 244, 248)',
    );
    await page
      .getByRole('button', { name: 'Use page theme', exact: true })
      .click();
    await expect(page.getByRole('dialog')).toHaveCSS(
      'background-color',
      'rgb(30, 33, 41)',
    );
    await page
      .getByRole('button', { name: 'Use white theme', exact: true })
      .click();
    await page.keyboard.press('Escape');
    await expand.click();
    await expect(page.getByRole('dialog')).toHaveCSS(
      'background-color',
      'rgb(30, 33, 41)',
    );
    await page.keyboard.press('Escape');
    expect(errors).toEqual([]);
  });
}
