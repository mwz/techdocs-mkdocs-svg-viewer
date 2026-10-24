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
}
