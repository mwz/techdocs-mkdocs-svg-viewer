import { checkObservatoryNavigation } from '../../../tests/observatory-navigation';
import { expect, test as base } from '@playwright/test';

const prefix = '/techdocs-mkdocs-svg-viewer';
const docs = `${prefix}/docs/default/component/svg-viewer-example`;

const test = base.extend<{ staticRequests: void }>({
  staticRequests: [
    async ({ page }, use) => {
      const failures: string[] = [];
      page.on('pageerror', (error) => failures.push(error.message));
      page.on('response', (response) => {
        if (response.status() >= 400)
          failures.push(`${response.status()} ${response.url()}`);
      });
      // Reject external hosts, backend calls, and requests that escape the Pages
      // prefix. Nothing is mocked: successful requests must reach the static server.
      await page.route('**/*', (route) => {
        const url = new URL(route.request().url());
        if (
          url.origin !== 'http://localhost:4173' ||
          !url.pathname.startsWith(`${prefix}/`) ||
          url.pathname.includes('/api/')
        ) {
          failures.push(`Unexpected request: ${url.href}`);
          return route.abort();
        }
        return route.continue();
      });
      page.on('requestfailed', (request) =>
        failures.push(`Failed request: ${request.url()}`),
      );
      await use();
      expect(failures).toEqual([]);
    },
    { auto: true },
  ],
});

test('home loads the real TechDocs addon and SVG links navigate without a reload', async ({
  page,
}) => {
  expect((await page.goto(`${prefix}/`))?.status()).toBe(200);
  const expand = page.getByRole('button', {
    name: 'Expand Space observatory architecture',
    exact: true,
  });
  await expect(expand).toHaveCount(1);
  await expect(
    page.getByRole('button', { name: /sign in|enter/i }),
  ).toHaveCount(0);
  await expand.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(page.getByLabel('Zoom relative to fit')).toHaveText('125%');
  await page.keyboard.press('Escape');
  await expect(expand).toBeFocused();
  await page.evaluate(() =>
    Object.assign(window, { demoNavigationMarker: true }),
  );
  await expand.click();
  await page.getByRole('link', { name: 'Read calibration guide' }).click();
  await expect(page).toHaveURL(
    `${docs}/processing/?from=observatory#calibration`,
  );
  await expect(
    page.getByRole('heading', { name: /^Calibration/, level: 2 }),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => 'demoNavigationMarker' in window)).toBe(
    true,
  );
  await page.goBack();
  await expand.click();
  await page.getByRole('link', { name: 'Read raw data note' }).click();
  await expect(page).toHaveURL(/#data-note$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => 'demoNavigationMarker' in window)).toBe(
    true,
  );
});

test('bookmarks and refreshes work for nested documentation with fragments and queries', async ({
  page,
}) => {
  const url = `${docs}/processing/?from=bookmark#calibration`;
  expect((await page.goto(url))?.status()).toBe(200);
  await expect(
    page.getByRole('heading', { name: /^Calibration/, level: 2 }),
  ).toBeVisible();
  await expect(page).toHaveURL(url);
  expect((await page.reload())?.status()).toBe(200);
  await expect(
    page.getByRole('heading', { name: /^Calibration/, level: 2 }),
  ).toBeVisible();
  await expect(page).toHaveURL(url);
  // A URL without a trailing slash gets a directory redirect, not a 404.
  expect((await page.goto(docs))?.status()).toBe(200);
  await expect(
    page.getByRole('button', {
      name: 'Expand Space observatory architecture',
      exact: true,
    }),
  ).toBeVisible();
});

test('appearance works without authentication and survives refreshes', async ({
  page,
}) => {
  expect((await page.goto(`${prefix}/settings/general/`))?.status()).toBe(200);
  for (const theme of ['dark', 'light']) {
    await page.goto(`${prefix}/settings/`);
    const choice = page.getByRole('button', {
      name: new RegExp(`^${theme}$`, 'i'),
    });
    await choice.click();
    await expect(choice).toHaveAttribute('aria-pressed', 'true');
    expect((await page.reload())?.status()).toBe(200);
    await expect(choice).toHaveAttribute('aria-pressed', 'true');
    await page.goto(`${docs}/`);
    await page
      .getByRole('button', {
        name: 'Expand Space observatory architecture',
        exact: true,
      })
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const brightness = await dialog.evaluate((element) => {
      return (
        getComputedStyle(element)
          .backgroundColor.match(/[\d.]+/g)!
          .slice(0, 3)
          .reduce((sum, channel) => sum + Number(channel), 0) / 3
      );
    });
    if (theme === 'dark') expect(brightness).toBeLessThan(128);
    else expect(brightness).toBeGreaterThan(128);
    await page.keyboard.press('Escape');
  }
});

test('both observatory diagrams support page and fragment navigation without reloading', async ({
  page,
}) => {
  await checkObservatoryNavigation(
    page,
    `${docs}/`,
    `${docs}/processing/`,
    true,
  );
});
