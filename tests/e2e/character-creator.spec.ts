import { test, expect, type Page } from '@playwright/test';

const nextButton = (page: Page) => page.locator('.builder-actions button.primary');

test('recorre clase, trasfondo y especie; completa sus pasos internos y llega a características', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('./');
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
  await expect.poll(() => page.locator('.builder-class-emblem').evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);

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
  expect(progressBeforeSetup).not.toBeNull();
  await expect(page.locator('.builder-progress span')).toHaveAttribute('style', progressBeforeSetup ?? '');

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
  expect(await humanFeatChoices.count()).toBeGreaterThan(2);
  await humanFeatChoices.nth(0).check({ force: true });
  await humanFeatChoices.nth(1).check({ force: true });
  await humanFeatChoices.nth(2).check({ force: true });

  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '05. Distribuye tus características' })).toBeVisible();
  await expect(page.locator('.builder-step-error')).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test('la interfaz inicial cabe en una pantalla móvil y conserva visible el selector de clase', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('./');
  await expect(page.getByRole('heading', { name: '01. Concepto del personaje' })).toBeVisible();
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '02. Elige tu clase' })).toBeVisible();

  const flyer = page.locator('.builder-class-flyer');
  await expect(flyer).toBeVisible();
  const bounds = await flyer.boundingBox();
  if (!bounds) throw new Error('El flyer de clase no tiene dimensiones visibles.');
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

test('recorre las doce clases y verifica que cada emblema cargue correctamente', async ({ page }) => {
  await page.goto('./');
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '02. Elige tu clase' })).toBeVisible();

  const expectedClasses = ['Bárbaro','Bardo','Brujo','Clérigo','Druida','Explorador','Guerrero','Hechicero','Mago','Monje','Paladín','Pícaro'];
  const title = page.locator('.builder-class-title');
  const emblem = page.locator('.builder-class-emblem');

  for (const className of expectedClasses) {
    await expect(title).toHaveText(className);
    await expect(emblem).toHaveJSProperty('complete', true);
    await expect.poll(() => emblem.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Clase siguiente' }).click();
  }
  await expect(title).toHaveText(expectedClasses[0]);
});

test('compra de puntos actualiza el gasto y permite recuperar puntos; creación libre acepta valores editables', async ({ page }) => {
  await page.goto('./');
  await nextButton(page).click();
  await nextButton(page).click();
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '03.1. Elecciones del trasfondo' })).toBeVisible();

  const backgroundTool = page.getByLabel('Competencia con herramienta del trasfondo');
  if (await backgroundTool.count()) await backgroundTool.selectOption({ index: 1 });

  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '04. Elige tu especie' })).toBeVisible();
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '04.1. Elecciones de especie' })).toBeVisible();

  await page.getByLabel('Nombre del personaje').fill('Prueba de puntos');
  await page.getByLabel('Habilidad adicional humana').selectOption({ index: 1 });
  await page.getByLabel('Dote de origen adicional humana').selectOption({ label: 'Alerta' });
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '05. Distribuye tus características' })).toBeVisible();

  const method = page.getByLabel('Método para determinar las puntuaciones');
  await method.selectOption('pointBuy');
  await expect(page.getByText(/Puntos utilizados:\s*0 \/ 27/)).toBeVisible();
  await page.getByRole('button', { name: 'Subir Fuerza' }).click();
  await expect(page.getByText(/Puntos utilizados:\s*1 \/ 27/)).toBeVisible();
  await expect(page.locator('.builder-ability-card').filter({ hasText: 'Fuerza' }).locator('.builder-ability-stepper strong')).toHaveText('9');
  await page.getByRole('button', { name: 'Bajar Fuerza' }).click();
  await expect(page.getByText(/Puntos utilizados:\s*0 \/ 27/)).toBeVisible();
  await expect(page.locator('.builder-ability-card').filter({ hasText: 'Fuerza' }).locator('.builder-ability-stepper strong')).toHaveText('8');

  await method.selectOption('free');
  const strength = page.getByRole('spinbutton').first();
  await strength.fill('17');
  await expect(strength).toHaveValue('17');

  await method.selectOption('standard');
  const standardScores = await Promise.all(['Fuerza','Destreza','Constitución','Inteligencia','Sabiduría','Carisma'].map(async ability =>
    Number(await page.getByLabel('Puntuación de ' + ability).inputValue())
  ));
  expect([...standardScores].sort((a,b)=>a-b)).toEqual([8,10,12,13,14,15]);
});

test('el selector de clase no desborda en distintos anchos móviles', async ({ page }) => {
  for (const width of [320, 360, 375, 390, 430, 768]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('./');
    await nextButton(page).click();
    await expect(page.getByRole('heading', { name: '02. Elige tu clase' })).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      flyer: document.querySelector('.builder-class-flyer')?.getBoundingClientRect(),
    }));
    expect(dimensions.document, 'desbordamiento del documento a ' + width + 'px').toBeLessThanOrEqual(width);
    expect(dimensions.body, 'desbordamiento del body a ' + width + 'px').toBeLessThanOrEqual(width);
    expect(dimensions.flyer?.left ?? -1, 'el flyer queda fuera por la izquierda a ' + width + 'px').toBeGreaterThanOrEqual(0);
    expect(dimensions.flyer?.right ?? width + 1, 'el flyer queda fuera por la derecha a ' + width + 'px').toBeLessThanOrEqual(width + 1);
  }
});
