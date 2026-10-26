import { expect, test } from '@playwright/test';

// Exercises the built drop-in script (dist/svg-viewer.js) on a plain page, as
// MkDocs `extra_javascript` would load it outside Backstage.
const url = '/tests/fixtures/standalone.html';

for (const example of [
  {
    url: '/tests/fixtures/minimal.html',
    title: 'Example diagram',
    svg: 'body > svg',
  },
  { url, title: 'Standalone diagram', svg: '#standalone' },
  {
    url: '/tests/fixtures/viewer.html',
    title: 'Order processing architecture',
    svg: '#architecture',
  },
]) {
  test(`expand button has a centred default and accepts earlier host CSS on ${example.url}`, async ({
    page,
  }) => {
    await page.goto(example.url);
    const button = page.getByRole('button', {
      name: `Expand ${example.title}`,
      exact: true,
    });
    await expect(button).toBeVisible();
    const bounds = () =>
      button.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const parent = element.parentElement!;
        const parentRect = parent.getBoundingClientRect();
        const style = getComputedStyle(parent);
        const left =
          parentRect.left +
          parseFloat(style.borderLeftWidth) +
          parseFloat(style.paddingLeft);
        const right =
          parentRect.right -
          parseFloat(style.borderRightWidth) -
          parseFloat(style.paddingRight);
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          centre: rect.left + rect.width / 2,
          parentLeft: left,
          parentRight: right,
        };
      });
    const expectDiagramAlignment = async () => {
      await expect
        .poll(async () => {
          const control = await bounds();
          const diagram = (await page.locator(example.svg).boundingBox())!;
          return Math.abs(control.centre - (diagram.x + diagram.width / 2));
        })
        .toBeLessThan(1);
      const control = await bounds();
      const diagram = (await page.locator(example.svg).boundingBox())!;
      expect(control.top).toBeGreaterThanOrEqual(diagram.y + diagram.height);
    };
    await expectDiagramAlignment();

    await page.locator(example.svg).evaluate((svg) => {
      svg.style.cssText =
        'display:block;width:50%;max-width:300px;height:auto;margin-inline:0';
    });
    await expectDiagramAlignment();
    await page.locator(example.svg).evaluate((svg) => {
      svg.style.marginInline = 'auto';
    });
    await expectDiagramAlignment();
    // A container resize can move a fixed-width diagram without resizing it.
    await button.evaluate((element) => {
      element.parentElement!.style.width = '600px';
    });
    await expectDiagramAlignment();
    await button.evaluate((element) => {
      element.parentElement!.style.width = '800px';
    });
    await expectDiagramAlignment();
    await button.evaluate((element) => {
      element.parentElement!.style.width = '420px';
    });
    await expectDiagramAlignment();

    // Insert host CSS BEFORE the viewer stylesheet. A class selector must win
    // without !important, including inside the TechDocs shadow root.
    for (const alignment of ['left', 'right'] as const) {
      await button.evaluate((element, side) => {
        const root = element.getRootNode() as Document | ShadowRoot;
        const host = root instanceof Document ? root.head : root;
        let style = host.querySelector<HTMLStyleElement>(
          'style[data-expand-layout]',
        );
        if (!style) {
          style = document.createElement('style');
          style.dataset.expandLayout = '';
          host.prepend(style);
        }
        style.textContent = `.tdsv-expand { margin-inline: ${side === 'left' ? '0 auto' : 'auto 0'}; }`;
      }, alignment);
      const aligned = await bounds();
      expect(
        Math.abs(
          alignment === 'left'
            ? aligned.left - aligned.parentLeft
            : aligned.right - aligned.parentRight,
        ),
      ).toBeLessThan(1);
    }
  });
}

test('expand alignment follows a scaled RTL container and recovers after closing', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/minimal.html');
  const button = page.getByRole('button', {
    name: 'Expand Example diagram',
    exact: true,
  });
  await expect(button).toBeVisible();
  await page.locator('body > svg').evaluate((svg) => {
    svg.style.cssText =
      'display:block;width:50%;height:auto;margin-inline:auto';
    svg.parentElement!.style.cssText =
      'width:600px;direction:rtl;transform:scale(0.8);transform-origin:top left';
  });
  const centreOffset = () =>
    button.evaluate((element) => {
      const buttonRect = element.getBoundingClientRect();
      const svgRect = element.previousElementSibling!.getBoundingClientRect();
      return Math.abs(
        buttonRect.left +
          buttonRect.width / 2 -
          svgRect.left -
          svgRect.width / 2,
      );
    });
  await expect.poll(centreOffset).toBeLessThan(1);
  await button.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.locator('body').evaluate((body) => {
    body.style.width = '440px';
  });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(centreOffset).toBeLessThan(1);
  await expect(button).toBeFocused();
});

for (const entry of ['script', 'module']) {
  test(`${entry} finds SVGs without documentation containers`, async ({
    page,
  }) => {
    if (entry === 'module') {
      await page.route('**/dist/svg-viewer.js', (route) =>
        route.fulfill({ contentType: 'text/javascript', body: '' }),
      );
    }
    await page.goto('/tests/fixtures/minimal.html');
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
  await page.goto('/tests/fixtures/minimal.html');
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
  await page.goto('/tests/fixtures/minimal.html');
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
