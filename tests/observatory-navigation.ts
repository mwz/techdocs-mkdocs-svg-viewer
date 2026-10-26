import { expect, type Page } from '@playwright/test';

/** Exercise real links in both directions, with and without an open viewer. */
export async function checkObservatoryNavigation(
  page: Page,
  overview: string,
  processing: string,
  clientRouting = false,
) {
  await page.goto(overview);
  const expandOverview = page.getByRole('button', {
    name: 'Expand Space observatory architecture',
    exact: true,
  });
  const expandProcessing = page.getByRole('button', {
    name: 'Expand Calibration and quality review',
    exact: true,
  });
  await expect(expandOverview).toHaveCount(1);
  await page.evaluate(() =>
    Object.assign(window, { observatoryNavigation: true }),
  );

  // Regular href navigation from the inline overview.
  await page.locator('a[aria-label="Read quality review guide"]').click();
  await expect(page).toHaveURL(`${processing}#quality-review`);
  await expect(expandProcessing).toHaveCount(1);
  await expect(page.locator('dialog.tdsv')).toHaveCount(0);
  await expandProcessing.click();
  await page.locator('a[aria-label="Jump to calibration"]').click();
  await expect(page).toHaveURL(`${processing}#calibration`);
  await expect(page.locator('dialog.tdsv')).toHaveCount(0);

  // Legacy xlink navigation from the smaller diagram back to the overview.
  await expandProcessing.click();
  await page.locator('a[aria-label="Return to observatory overview"]').click();
  await expect(page).toHaveURL(`${overview}?from=processing#archive-access`);
  await expect(expandOverview).toHaveCount(1);
  await expect(page.locator('dialog.tdsv')).toHaveCount(0);
  if (clientRouting) {
    expect(await page.evaluate(() => 'observatoryNavigation' in window)).toBe(
      true,
    );
  }

  // The main diagram needs both zoom and pan, then Fit restores the overview.
  await expandOverview.click();
  for (let i = 0; i < 4; i++)
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  const canvas = page.locator('.tdsv-canvas');
  const before = await canvas.evaluate((el) => getComputedStyle(el).transform);
  await page.getByRole('button', { name: 'Pan right', exact: true }).click();
  await expect(canvas).not.toHaveCSS('transform', before);
  await page
    .getByRole('button', { name: 'Fit diagram (0)', exact: true })
    .click();
  await expect(page.getByLabel('Zoom relative to fit')).toHaveText('100%');

  // Legacy xlink from an open overview preserves the query and fragment.
  await page.locator('a[aria-label="Read calibration guide"]').click();
  await expect(page).toHaveURL(`${processing}?from=observatory#calibration`);
  await expect(page.locator('dialog.tdsv')).toHaveCount(0);
  await expect(expandProcessing).toHaveCount(1);
  if (clientRouting) {
    expect(await page.evaluate(() => 'observatoryNavigation' in window)).toBe(
      true,
    );
  }
  await page.reload();
  await expect(page).toHaveURL(`${processing}?from=observatory#calibration`);
  await expect(expandProcessing).toHaveCount(1);

  // Regular href from the inline smaller diagram, followed by browser history.
  await page.locator('a[aria-label="Return to raw data overview"]').click();
  await expect(page).toHaveURL(`${overview}#data-note`);
  await expect(expandOverview).toHaveCount(1);
  await page.goBack();
  await expect(expandProcessing).toHaveCount(1);
  await expandProcessing.click();
  await expect(page.locator('dialog.tdsv')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(expandProcessing).toBeFocused();
}
