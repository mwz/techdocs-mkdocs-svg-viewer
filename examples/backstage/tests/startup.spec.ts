import { expect, test } from '@playwright/test';

for (const status of [404, 500]) {
  test(`reports a persistent ${status} and allows retry without reloading`, async ({
    page,
  }) => {
    await page.clock.install();
    let ready = false;
    let attempts = 0;
    await page.route(
      '**/api/techdocs/metadata/entity/default/component/svg-viewer-example',
      async (route) => {
        attempts++;
        if (ready) await route.continue();
        else
          await route.fulfill({
            status,
            json: { error: { message: 'Example unavailable' } },
          });
      },
    );
    await page.goto('/');
    await expect.poll(() => attempts).toBeGreaterThan(0);
    if (status === 404) {
      await expect(page.getByRole('status')).toHaveText(
        'Waiting for the example documentation…',
      );
      await page.clock.fastForward(31_000);
    }
    await expect(
      page.getByText('The example documentation is not ready'),
    ).toBeVisible();
    const stoppedAt = attempts;
    if (status === 500) expect(stoppedAt).toBe(1);
    await page.clock.fastForward(5_000);
    expect(attempts).toBe(stoppedAt);
    ready = true;
    await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await expect(
      page.getByRole('button', {
        name: 'Expand Space observatory architecture',
        exact: true,
      }),
    ).toBeVisible();
  });
}

for (const path of [
  '/',
  '/docs/default/component/svg-viewer-example/processing/?from=observatory#calibration',
]) {
  test(`waits for catalogue ingestion on first visit to ${path}`, async ({
    page,
  }) => {
    let attempts = 0;
    let ready = false;
    const prematureRequests: string[] = [];
    page.on('request', (request) => {
      if (
        !ready &&
        /\/api\/techdocs\/(sync|static\/docs)\//.test(request.url())
      ) {
        prematureRequests.push(request.url());
      }
    });
    await page.route(
      '**/api/techdocs/metadata/entity/default/component/svg-viewer-example',
      async (route) => {
        attempts++;
        if (!ready) {
          await route.fulfill({
            status: 404,
            json: {
              error: { name: 'NotFoundError', message: 'Entity not found' },
            },
          });
        } else {
          await route.continue();
        }
      },
    );
    await page.goto(path);
    await page.evaluate(() => {
      Object.assign(window, { startupTest: true });
    });
    await expect.poll(() => attempts).toBeGreaterThanOrEqual(2);
    await expect(
      page.getByText('Waiting for the example documentation…'),
    ).toBeVisible();
    await expect(
      page.getByText('Looks like someone dropped the mic!'),
    ).toHaveCount(0);
    expect(prematureRequests).toEqual([]);
    ready = true;
    if (path === '/') {
      await expect(
        page.getByRole('button', {
          name: 'Expand Space observatory architecture',
          exact: true,
        }),
      ).toBeVisible();
    } else {
      await expect(
        page.getByRole('heading', { name: /^Calibration/, level: 2 }),
      ).toBeVisible();
      await expect(page).toHaveURL(
        /\/processing\/\?from=observatory#calibration$/,
      );
    }
    expect(await page.evaluate(() => 'startupTest' in window)).toBe(true);
  });
}
