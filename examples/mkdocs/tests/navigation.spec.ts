import { expect, test } from '@playwright/test';
import { checkObservatoryNavigation } from '../../../tests/observatory-navigation';

test('MkDocs diagrams navigate between pages and sections in both themes', async ({
  page,
}) => {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400)
      failures.push(`${response.status()} ${response.url()}`);
  });
  for (const scheme of ['default', 'slate']) {
    await page.goto('/');
    if (scheme === 'slate')
      await page.locator('label[title="Switch to dark mode"]').click();
    await checkObservatoryNavigation(page, '/', '/processing/');
    await expect(page.locator('body')).toHaveAttribute(
      'data-md-color-scheme',
      scheme,
    );
  }
  expect(failures).toEqual([]);
});
