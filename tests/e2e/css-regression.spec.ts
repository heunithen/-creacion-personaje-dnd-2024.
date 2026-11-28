import { test, expect, type Page } from '@playwright/test';

async function assertNoHorizontalOverflow(page: Page, width: number, stage: string) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(dimensions.document, `${stage}: document overflow at ${width}px`).toBeLessThanOrEqual(width);
  expect(dimensions.body, `${stage}: body overflow at ${width}px`).toBeLessThanOrEqual(width);
}

test('creador de personajes de nivel 1: smoke visual y responsive', async ({ page }, testInfo) => {
  test.setTimeout(120000);
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'Creación de personaje · Nivel 1' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '01. Concepto del personaje' })).toBeVisible();
    await assertNoHorizontalOverflow(page, width, 'concepto');

    if (width === 320 || width === 1440) {
      await page.screenshot({ path: testInfo.outputPath(`nivel-1-${width}-concepto.png`), fullPage: true });
    }

    await page.locator('.builder-actions button.primary').click();
    await expect(page.getByRole('heading', { name: '02. Elige tu clase' })).toBeVisible();
    const classFlyer = page.locator('.builder-class-flyer');
    await expect(classFlyer).toBeVisible();
    await expect(page.locator('.builder-class-information')).toBeVisible();
    const classCardLayout = await classFlyer.evaluate(el => {
      const labels = Array.from(el.querySelectorAll('.builder-class-topline span'));
      const first = labels[0]?.getBoundingClientRect();
      const second = labels[1]?.getBoundingClientRect();
      return {
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight,
        headerGap: first && second ? second.left - first.right : -1,
      };
    });
    expect(classCardLayout.scrollHeight, `class card content clipped at ${width}px`).toBeLessThanOrEqual(classCardLayout.clientHeight + 1);
    expect(classCardLayout.headerGap, `class card header labels overlap at ${width}px`).toBeGreaterThan(4);
    await assertNoHorizontalOverflow(page, width, 'clase');
    if (width === 320 || width === 1440) {
      await page.screenshot({ path: testInfo.outputPath(`nivel-1-${width}-clase.png`), fullPage: true });
    }

    await page.locator('.builder-actions button.primary').click();
    await expect(page.getByRole('heading', { name: '03. Elige tu trasfondo' })).toBeVisible();
    await expect(page.locator('.builder-background-flyer')).toBeVisible();
    await assertNoHorizontalOverflow(page, width, 'trasfondo');

    await page.locator('.builder-actions button.primary').click();
    await expect(page.getByRole('heading', { name: '03.1. Elecciones del trasfondo' })).toBeVisible();
    const backgroundTool = page.getByLabel('Competencia con herramienta del trasfondo');
    if (await backgroundTool.count()) await backgroundTool.selectOption({ index: 1 });
    await page.locator('.builder-actions button.primary').click();
    await expect(page.getByRole('heading', { name: '04. Elige tu especie' })).toBeVisible();
    await expect(page.locator('.builder-species-flyer')).toBeVisible();
    await assertNoHorizontalOverflow(page, width, 'especie');
    if (width === 320 || width === 1440) {
      await page.screenshot({ path: testInfo.outputPath(`nivel-1-${width}-especie.png`), fullPage: true });
    }
  }

  expect(pageErrors, 'Errores JavaScript durante el recorrido del creador').toEqual([]);
});
