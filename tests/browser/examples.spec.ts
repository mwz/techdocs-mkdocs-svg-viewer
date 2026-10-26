import { expect, test } from '@playwright/test';
import { checkObservatoryNavigation } from '../observatory-navigation';

for (const url of [
  '/',
  '/dev/standalone.html',
  '/examples/standalone/index.html',
]) {
  test(`the default at ${url} is the large observatory with a working guide link`, async ({
    page,
  }) => {
    await page.goto(url);
    await expect(page.locator('#observatory')).toHaveAttribute(
      'viewBox',
      '-20 -20 3100 2060',
    );
    await page
      .getByRole('button', {
        name: 'Expand Space observatory architecture',
        exact: true,
      })
      .click();
    await page.locator('a[aria-label="Read calibration guide"]').click();
    await expect(page).toHaveURL(
      /\/examples\/standalone\/processing.html\?from=observatory#calibration$/,
    );
    await page
      .getByRole('button', {
        name: 'Expand Calibration and quality review',
        exact: true,
      })
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
}

test('standalone diagrams navigate between pages and sections', async ({
  page,
}) => {
  await checkObservatoryNavigation(
    page,
    '/examples/standalone/index.html',
    '/examples/standalone/processing.html',
  );
});
