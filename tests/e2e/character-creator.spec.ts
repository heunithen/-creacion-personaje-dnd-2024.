import { test, expect } from '@playwright/test';

const nextButton = (page) => page.locator('.builder-actions button.primary');

test('recorre clase, trasfondo y especie; completa sus pasos internos y llega a características', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Creación de personaje · Nivel 1' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '01. Concepto del personaje' })).toBeVisible();

  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '02. Elige tu clase' })).toBeVisible();

  const classTitle = page.locator('.builder-class-title');
  const initialClass = await classTitle.innerText();
  await page.getByRole('button', { name: 'Clase siguiente' }).click();
  await expect(classTitle).not.toHaveText(initialClass);
  await page.getByRole('button', { name: 'Clase anterior' }).click();
  await expect(classTitle).toHaveText(initialClass);
  await expect(page.locator('.builder-class-emblem')).toHaveJSProperty('complete', true);
  await expect.poll(() => page.locator('.builder-class-emblem').evaluate(img => img.naturalWidth)).toBeGreaterThan(0);

  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '03. Elige tu trasfondo' })).toBeVisible();

  const backgroundTitle = page.locator('.builder-background-title');
  const initialBackground = await backgroundTitle.innerText();
  const progressBeforeSetup = await page.locator('.builder-progress span').getAttribute('style');
  await page.getByRole('button', { name: 'Trasfondo siguiente' }).click();
  await expect(backgroundTitle).not.toHaveText(initialBackground);
  await page.getByRole('button', { name: 'Trasfondo anterior' }).click();
  await expect(backgroundTitle).toHaveText(initialBackground);

  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '03.1. Elecciones del trasfondo' })).toBeVisible();
  await expect(page.locator('.builder-progress span')).toHaveAttribute('style', progressBeforeSetup);

  const backgroundTool = page.getByLabel('Competencia con herramienta del trasfondo');
  if (await backgroundTool.count()) {
    await backgroundTool.selectOption({ index: 1 });
  }

  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '04. Elige tu especie' })).toBeVisible();

  const speciesTitle = page.locator('.builder-species-title-row h4');
  const initialSpecies = await speciesTitle.innerText();
  await page.getByRole('button', { name: 'Especie siguiente' }).click();
  await expect(speciesTitle).not.toHaveText(initialSpecies);
  await page.getByRole('button', { name: 'Especie anterior' }).click();
  await expect(speciesTitle).toHaveText(initialSpecies);

  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '04.1. Elecciones de especie' })).toBeVisible();

  await page.getByLabel('Nombre del personaje').fill('Prueba de navegador');
  await page.getByLabel('Tamaño').selectOption({ label: 'Mediano' });
  await page.getByLabel('Habilidad adicional humana').selectOption({ index: 1 });
  await page.getByLabel('Dote de origen adicional humana').selectOption({ label: 'Habilidoso' });

  const humanFeatChoices = page
    .locator('.builder-choice-wrapper')
    .filter({ hasText: 'Opciones de la dote adicional humana' })
    .locator('input[type="checkbox"]');
  await expect(humanFeatChoices).toHaveCountGreaterThan(2);
  await humanFeatChoices.nth(0).check();
  await humanFeatChoices.nth(1).check();
  await humanFeatChoices.nth(2).check();

  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '05. Distribuye tus características' })).toBeVisible();
  await expect(page.locator('.builder-step-error')).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test('la interfaz inicial cabe en una pantalla móvil y conserva visible el selector de clase', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page.getByRole('heading', { name: '01. Concepto del personaje' })).toBeVisible();
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '02. Elige tu clase' })).toBeVisible();

  const flyer = page.locator('.builder-class-flyer');
  await expect(flyer).toBeVisible();
  const bounds = await flyer.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(376);

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
  expect(pageErrors).toEqual([]);
});
