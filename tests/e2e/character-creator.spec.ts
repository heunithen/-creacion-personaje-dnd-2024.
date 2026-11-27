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
    .locator('label.builder-checkbox');
  expect(await humanFeatChoices.count()).toBeGreaterThan(2);
  await humanFeatChoices.nth(0).click();
  await humanFeatChoices.nth(1).click();
  await humanFeatChoices.nth(2).click();

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
  const pointsStatus = page.locator('.builder-panel p.hint').filter({ hasText: 'Puntos utilizados:' });
  await expect(pointsStatus).toContainText('0 / 27');
  const raiseStrength = page.getByRole('button', { name: 'Subir Fuerza' });
  await expect(raiseStrength).toBeEnabled();
  await raiseStrength.click();
  await expect(page.locator('.builder-ability-card').filter({ hasText: 'Fuerza' }).locator('.builder-ability-stepper strong')).toHaveText('9');
  await expect(pointsStatus).toContainText('1 / 27');
  await page.getByRole('button', { name: 'Bajar Fuerza' }).click();
  await expect(pointsStatus).toContainText('0 / 27');
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


async function reachClassSkillsStep(page: Page, className: string) {
  await page.goto('./');
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '02. Elige tu clase' })).toBeVisible();

  const title = page.locator('.builder-class-title');
  for (let i = 0; i < 12 && (await title.innerText()) !== className; i++) {
    await page.getByRole('button', { name: 'Clase siguiente' }).click();
  }
  await expect(title).toHaveText(className);
  await nextButton(page).click();

  await expect(page.getByRole('heading', { name: '03. Elige tu trasfondo' })).toBeVisible();
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '03.1. Elecciones del trasfondo' })).toBeVisible();
  const backgroundTool = page.getByLabel('Competencia con herramienta del trasfondo');
  if (await backgroundTool.count()) await backgroundTool.selectOption({ index: 1 });
  await nextButton(page).click();

  await expect(page.getByRole('heading', { name: '04. Elige tu especie' })).toBeVisible();
  const speciesTitle = page.locator('.builder-species-title-row h4');
  for (let i = 0; i < 10 && (await speciesTitle.innerText()) !== 'Enano'; i++) {
    await page.getByRole('button', { name: 'Especie anterior' }).click();
  }
  await expect(speciesTitle).toHaveText('Enano');
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '04.1. Elecciones de especie' })).toBeVisible();
  await page.getByLabel('Nombre del personaje').fill('Prueba Playwright');
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '05. Distribuye tus características' })).toBeVisible();
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '06. Aumentos de características del trasfondo' })).toBeVisible();
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '07. Competencias' })).toBeVisible();
}

test('Mago: valida competencias, equipo, libro de conjuros, preparación, idiomas y revisión', async ({ page }) => {
  test.setTimeout(120000);
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await reachClassSkillsStep(page, 'Mago');

  const skills = page.locator('.builder-choice-wrapper').filter({ hasText: 'Competencias de clase: elige 2 habilidades' }).locator('label.builder-checkbox');
  await expect(skills).toHaveCount(7);
  await skills.nth(0).check({ force: true });
  await skills.nth(1).check({ force: true });
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '08. Equipo inicial' })).toBeVisible();

  await page.locator('input[name="background-equipment"][value="B"]').check({ force: true });
  await page.locator('input[name="class-equipment"][value="A"]').check({ force: true });
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '09. Magia y conjuros' })).toBeVisible();

  const cantrips = page.locator('.builder-choice-wrapper').filter({ hasText: 'Trucos de clase' }).first().locator('label.builder-checkbox');
  await expect(cantrips).toHaveCount(20);
  await nextButton(page).click();
  await expect(page.getByRole('alert')).toContainText('Trucos de clase');
  for (let i = 0; i < 3; i++) await cantrips.nth(i).check({ force: true });

  const spellbook = page.locator('.builder-choice-wrapper').filter({ hasText: 'Libro de conjuros: elige 6 conjuros de nivel 1' }).locator('label.builder-checkbox');
  await expect(spellbook).toHaveCount(31);
  for (let i = 0; i < 6; i++) await spellbook.nth(i).check({ force: true });

  const prepared = page.locator('.builder-choice-wrapper').filter({ hasText: 'Conjuros preparados' }).locator('label.builder-checkbox');
  await expect(prepared).toHaveCount(6);
  for (let i = 0; i < 4; i++) await prepared.nth(i).check({ force: true });
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '10. Idiomas' })).toBeVisible();

  const languages = page.locator('.builder-choice-wrapper').filter({ hasText: 'Dos idiomas adicionales' }).locator('input[type="checkbox"]');
  await languages.nth(0).check({ force: true });
  await languages.nth(1).check({ force: true });
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '11. Detalles del personaje' })).toBeVisible();

  await page.getByLabel('Edad').fill('120');
  await page.getByLabel('Altura').fill('1,35 m');
  await page.getByLabel('Apariencia').fill('Barba plateada y túnica azul.');
  await page.getByLabel('Personalidad').fill('Metódico.');
  await page.getByLabel('Ideales').fill('El conocimiento.');
  await page.getByLabel('Vínculos').fill('Su antigua biblioteca.');
  await page.getByLabel('Defectos').fill('Desconfiado.');
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '12. Revisión y creación' })).toBeVisible();
  await expect(page.locator('.builder-review')).toContainText('Prueba Playwright');
  await expect(page.locator('.builder-review')).toContainText('Mago');
  await expect(page.locator('.builder-review')).toContainText('Enano');
  await expect(pageErrors).toEqual([]);
});

test('Pícaro: exige cuatro habilidades, dos pericias, dos maestrías y un idioma adicional', async ({ page }) => {
  test.setTimeout(120000);
  await reachClassSkillsStep(page, 'Pícaro');

  const skills = page.locator('.builder-choice-wrapper').filter({ hasText: 'Competencias de clase: elige 4 habilidades' }).locator('input[type="checkbox"]');
  await expect(skills).toHaveCount(8);
  for (let i = 0; i < 4; i++) await skills.nth(i).check({ force: true });

  const expertise = page.locator('.builder-choice-wrapper').filter({ hasText: 'Pericia: elige 2 habilidades' }).locator('label.builder-checkbox');
  await expect(expertise.count()).resolves.toBeGreaterThanOrEqual(2);
  await expertise.nth(0).check({ force: true });
  await expertise.nth(1).check({ force: true });

  const masteries = page.locator('.builder-choice-wrapper').filter({ hasText: 'Maestrías con armas (2)' }).locator('label.builder-checkbox');
  await expect(masteries.count()).resolves.toBeGreaterThan(2);
  await masteries.nth(0).check({ force: true });
  await masteries.nth(1).check({ force: true });
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '08. Equipo inicial' })).toBeVisible();

  await page.locator('input[name="background-equipment"][value="A"]').check({ force: true });
  await page.locator('input[name="class-equipment"][value="B"]').check({ force: true });
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '09. Magia y conjuros' })).toBeVisible();
  await expect(page.locator('.builder-choice-wrapper')).toHaveCount(0);
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '10. Idiomas' })).toBeVisible();

  const languages = page.locator('.builder-choice-wrapper').filter({ hasText: 'Dos idiomas adicionales' }).locator('input[type="checkbox"]');
  await languages.nth(0).check({ force: true });
  await languages.nth(1).check({ force: true });
  const rogueLanguage = page.getByLabel(/Idioma adicional de pícaro/);
  await rogueLanguage.selectOption({ index: 1 });
  await nextButton(page).click();
  await expect(page.getByRole('heading', { name: '11. Detalles del personaje' })).toBeVisible();
});
