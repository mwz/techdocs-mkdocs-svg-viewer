import { expect, test } from '@playwright/test';

for (const failure of ['connection', 'unavailable'] as const) {
  test(`automatic guest sign-in recovers from ${failure} when the backend starts later`, async ({
    page,
  }) => {
    let ready = false;
    let attempts = 0;
    await page.route('**/api/auth/guest/refresh', async (route) => {
      attempts++;
      if (ready) await route.continue();
      else if (failure === 'connection') await route.abort('connectionrefused');
      else
        await route.fulfill({
          status: 503,
          json: { error: { message: 'Starting' } },
        });
    });
    await page.goto(
      '/docs/default/component/svg-viewer-example/order-service/#orders',
    );
    await page.evaluate(() => Object.assign(window, { signInTest: true }));
    await expect.poll(() => attempts).toBeGreaterThanOrEqual(2);
    await expect(page.getByRole('status')).toHaveText(
      'Waiting for Backstage to start…',
    );
    ready = true;
    await expect(
      page.getByRole('heading', { name: /^Orders/, level: 2 }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/order-service\/#orders$/);
    expect(await page.evaluate(() => 'signInTest' in window)).toBe(true);
  });
}

for (const failure of ['connection', 'unauthorised'] as const) {
  test(`sign-in stops retrying ${failure} and offers manual recovery`, async ({
    page,
  }) => {
    await page.clock.install();
    let ready = false;
    let attempts = 0;
    await page.route('**/api/auth/guest/refresh', async (route) => {
      attempts++;
      if (ready) await route.continue();
      else if (failure === 'connection') await route.abort('connectionrefused');
      else
        await route.fulfill({
          status: 401,
          json: { error: { message: 'Unauthorised' } },
        });
    });
    await page.goto('/');
    await expect.poll(() => attempts).toBeGreaterThan(0);
    if (failure === 'connection') {
      await expect(page.getByRole('status')).toHaveText(
        'Waiting for Backstage to start…',
      );
      await page.clock.fastForward(31_000);
    }
    await expect(
      page.getByText('Unable to sign in to the example'),
    ).toBeVisible();
    const stoppedAt = attempts;
    if (failure === 'unauthorised') expect(stoppedAt).toBe(1);
    await page.clock.fastForward(5_000);
    expect(attempts).toBe(stoppedAt);
    ready = true;
    await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await expect(
      page.getByRole('button', {
        name: 'Expand Order processing architecture',
        exact: true,
      }),
    ).toBeVisible();
  });
}
