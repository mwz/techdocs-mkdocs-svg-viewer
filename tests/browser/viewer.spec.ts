import { expect, test, type Page } from '@playwright/test';
const open = async (page: Page) => {
  await page.goto('/');
  await page
    .getByRole('button', {
      name: 'Expand Order processing architecture',
      exact: true,
    })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
};
const transform = (page: Page) =>
  page.locator('.tdsv-canvas').evaluate((el) => getComputedStyle(el).transform);

test('opens from a diagram background and restores the exact original node and styles', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#architecture').evaluate((svg) => {
    (window as any).originalSvg = svg;
    (window as any).originalMarkup = svg.outerHTML;
  });
  await page.locator('#architecture').click({ position: { x: 20, y: 20 } });
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('#architecture')).toHaveCount(1);
  await expect(page.locator('#arrow')).toHaveCount(1);
  await expect(page.locator('.tdsv #architecture')).toHaveAttribute(
    'viewBox',
    '-20 -20 840 360',
  );
  expect(
    await page
      .locator('.tdsv .node-label')
      .first()
      .evaluate((el) => getComputedStyle(el).fontWeight),
  ).toBe('600');
  await page
    .getByRole('button', { name: 'Close viewer (Escape)', exact: true })
    .click();
  expect(
    await page
      .locator('#architecture')
      .evaluate(
        (svg) =>
          svg === (window as any).originalSvg &&
          svg.outerHTML === (window as any).originalMarkup,
      ),
  ).toBe(true);
  await expect(
    page.getByRole('button', {
      name: 'Expand Order processing architecture',
      exact: true,
    }),
  ).toBeFocused();
});

test('ignores theme icons and opt-outs; whole-image links get an independent expand button', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.tdsv-expand')).toHaveCount(2);
  await expect(page.locator('#wrapped-link .tdsv-expand')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Expand Linked overview', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('clicking a link in the original SVG does not open a viewer', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .context()
    .route('https://backstage.io/**', (route) =>
      route.fulfill({ body: '<h1>External destination</h1>' }),
    );
  const popupPromise = page.waitForEvent('popup');
  await page
    .getByRole('link', { name: 'Open Backstage documentation' })
    .click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL('https://backstage.io/');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('external links retain targets and work with mouse and keyboard in the viewer', async ({
  page,
}) => {
  await open(page);
  await page
    .context()
    .route('https://backstage.io/**', (route) =>
      route.fulfill({ body: '<h1>External destination</h1>' }),
    );
  const link = page.getByRole('link', { name: 'Open Backstage documentation' });
  for (const keyboard of [false, true]) {
    const popupPromise = page.waitForEvent('popup');
    if (keyboard) {
      await link.focus();
      await page.keyboard.press('Enter');
    } else await link.click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL('https://backstage.io/');
    await popup.close();
  }
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('legacy xlink:href preserves its relative path, query and fragment', async ({
  page,
}) => {
  await open(page);
  await page.route('**/guide/?from=diagram*', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<h1>Order guide</h1>' }),
  );
  await page.locator('a[aria-label="Read order service guide"]').click();
  await expect(page).toHaveURL(/\/guide\/\?from=diagram#orders$/);
});

test('fragment links keep their href and close on hash navigation', async ({
  page,
}) => {
  await open(page);
  await expect(
    page.getByRole('link', { name: 'Jump to queue note' }),
  ).toHaveAttribute('href', '#queue-note');
  await page.getByRole('link', { name: 'Jump to queue note' }).click();
  await expect(page).toHaveURL(/#queue-note$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('zoom controls, wheel focal point, pan buttons, keyboard and Fit work', async ({
  page,
}) => {
  await open(page);
  const initial = await transform(page);
  await expect(page.getByLabel('Zoom relative to fit')).toHaveText('100%');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(page.getByLabel('Zoom relative to fit')).toHaveText('125%');
  await page.getByRole('button', { name: 'Pan right', exact: true }).click();
  expect(await transform(page)).not.toBe(initial);
  await page.keyboard.press('0');
  expect(await transform(page)).toBe(initial);
  const stage = await page.locator('.tdsv-stage').boundingBox();
  const point = {
    x: Math.floor(stage!.x + stage!.width * 0.3),
    y: Math.floor(stage!.y + stage!.height * 0.4),
  };
  const coordinate = () =>
    page.locator('.tdsv-canvas').evaluate((el, point) => {
      const rect = el.parentElement!.getBoundingClientRect();
      const m = new DOMMatrix(getComputedStyle(el).transform);
      return {
        x: (point.x - rect.x - m.e) / m.a,
        y: (point.y - rect.y - m.f) / m.d,
      };
    }, point);
  const before = await coordinate();
  await page.mouse.move(point.x, point.y);
  await page.mouse.wheel(0, -200);
  await expect(page.getByLabel('Zoom relative to fit')).not.toHaveText('100%');
  const after = await coordinate();
  expect(after.x).toBeCloseTo(before.x, 2);
  expect(after.y).toBeCloseTo(before.y, 2);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Home');
  expect(await transform(page)).toBe(initial);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('dragging from a link pans without opening it, next normal click still works', async ({
  page,
}) => {
  await open(page);
  await page
    .context()
    .route('https://backstage.io/**', (route) =>
      route.fulfill({ body: 'Destination' }),
    );
  const initial = await transform(page);
  const link = page.getByRole('link', { name: 'Open Backstage documentation' });
  const box = await link.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box!.x + box!.width / 2 + 60,
    box!.y + box!.height / 2 + 40,
    { steps: 10 },
  );
  await page.mouse.up();
  expect(page.context().pages()).toHaveLength(1);
  expect(await transform(page)).not.toBe(initial);
  const popupPromise = page.waitForEvent('popup');
  await link.click();
  await (await popupPromise).close();
});

test('modal traps focus and closes with Escape, returning focus to its trigger', async ({
  page,
}) => {
  await open(page);
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    expect(
      await page.locator('#docs').evaluate((host) => {
        const active = host.shadowRoot!.activeElement;
        return !!active?.closest('dialog');
      }),
    ).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', {
      name: 'Expand Order processing architecture',
      exact: true,
    }),
  ).toBeFocused();
});

test('page replacement closes the viewer and enhances new diagrams once', async ({
  page,
}) => {
  await open(page);
  // Background is intentionally inert; simulate a router-driven content update.
  await page
    .locator('#replace')
    .evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Expand Next diagram', exact: true }),
  ).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Expand Next diagram', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('unmount while open restores SVG and removes controls, observers and styles', async ({
  page,
}) => {
  await open(page);
  await page
    .locator('#dispose')
    .evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.tdsv-expand')).toHaveCount(0);
  await expect(page.locator('article > #architecture')).toHaveCount(1);
  await expect(page.locator('#architecture')).not.toHaveAttribute(
    'data-techdocs-svg-viewer-ready',
  );
  await page.locator('#install').click();
  await expect(page.locator('.tdsv-expand')).toHaveCount(2);
});

test('touch pinch zooms and a touch tap still follows a link', async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await open(page);
  const cdp = await context.newCDPSession(page);
  const stage = await page.locator('.tdsv-stage').boundingBox();
  const x = stage!.x + stage!.width / 2;
  const y = stage!.y + stage!.height / 2;
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { x: x - 25, y, id: 1 },
      { x: x + 25, y, id: 2 },
    ],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [
      { x: x - 65, y, id: 1 },
      { x: x + 65, y, id: 2 },
    ],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await expect(page.getByLabel('Zoom relative to fit')).not.toHaveText('100%');
  await page
    .getByRole('button', { name: 'Fit diagram (0)', exact: true })
    .tap();
  await page
    .context()
    .route('https://backstage.io/**', (route) =>
      route.fulfill({ body: 'Destination' }),
    );
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Open Backstage documentation' }).tap();
  await (await popupPromise).close();
  const dialog = await page.getByRole('dialog').boundingBox();
  expect(dialog!.width).toBe(390);
  expect(dialog!.height).toBe(844);
  await context.close();
});

test('SVG without viewBox gets temporary scaling coordinates, restored on close', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .locator('#architecture')
    .evaluate((svg) => svg.removeAttribute('viewBox'));
  await page
    .getByRole('button', {
      name: 'Expand Order processing architecture',
      exact: true,
    })
    .click();
  await expect(page.locator('#architecture')).toHaveAttribute('viewBox', /0 0/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#architecture')).not.toHaveAttribute('viewBox');
});

test('fit follows viewport resize and zoom limits are enforced', async ({
  page,
}) => {
  await open(page);
  await page.setViewportSize({ width: 500, height: 700 });
  await expect(page.getByLabel('Zoom relative to fit')).toHaveText('100%');
  const svg = await page.locator('#architecture').boundingBox();
  const stage = await page.locator('.tdsv-stage').boundingBox();
  expect(svg!.width).toBeLessThanOrEqual(stage!.width);
  expect(svg!.height).toBeLessThanOrEqual(stage!.height);
  for (let i = 0; i < 13; i++) await page.keyboard.press('+');
  await expect(page.getByLabel('Zoom relative to fit')).toHaveText('1600%');
  await expect(
    page.getByRole('button', { name: 'Zoom in', exact: true }),
  ).toBeDisabled();
  for (let i = 0; i < 20; i++) await page.keyboard.press('-');
  await expect(page.getByLabel('Zoom relative to fit')).toHaveText('25%');
});

test('optional browser fullscreen retains the controls and exits cleanly', async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole('button', { name: 'Enter fullscreen', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Exit fullscreen', exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator('#docs')
      .evaluate((host) =>
        host.shadowRoot!.fullscreenElement?.classList.contains('tdsv-shell'),
      ),
  ).toBe(true);
  await page
    .getByRole('button', { name: 'Exit fullscreen', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Enter fullscreen', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Close viewer (Escape)', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
