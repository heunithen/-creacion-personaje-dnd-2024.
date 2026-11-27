import { test, expect, type Page } from '@playwright/test';

test.describe.configure({ retries: 0 });
const classes = ['Bárbaro','Bardo','Brujo','Clérigo','Druida','Explorador','Guerrero','Hechicero','Mago','Monje','Paladín','Pícaro'];
const backgrounds = ['Acólito','Animador','Artesano','Campesino','Charlatán','Comerciante','Criminal','Ermitaño','Erudito','Escriba','Guardia','Guía','Marinero','Noble','Soldado','Vagabundo'];
const species = ['Aasimar','Dracónido','Enano','Elfo','Gnomo','Goliat','Mediano','Humano','Orco','Tiefling'];
const next = (page: Page) => page.locator('.builder-actions button.primary');

async function moveTo(page: Page, selector: string, target: string, button: string, max: number) {
  const title = page.locator(selector);
  for (let i = 0; i < max && (await title.innerText()) !== target; i++) await page.getByRole('button', { name: button }).click();
  await expect(title).toHaveText(target);
}
async function checkFirst(wrapperText: string, count: number, page: Page) {
  const wrapper = page.locator('.builder-choice-wrapper').filter({ hasText: wrapperText }).first();
  const choices = wrapper.locator('input[type="checkbox"]');
  const total = await choices.count();
  if (total < count) throw new Error(`Opciones insuficientes en ${wrapperText}: ${total}/${count}`);
  for (let i = 0; i < count; i++) await choices.nth(i).check({ force: true });
}
async function completeFeat(page: Page, feat: string, human = false) {
  if (['Habilidoso','Fabricante','Músico'].includes(feat)) {
    await checkFirst(human ? 'Opciones de la dote adicional humana' : 'Opciones de la dote del trasfondo', 3, page);
    return;
  }
  const magicClass = feat.includes('(Clérigo)') ? 'Clérigo' : feat.includes('(Druida)') ? 'Druida' : feat.includes('(Mago)') ? 'Mago' : '';
  if (!magicClass) return;
  const abilityLabel = human ? 'Aptitud mágica de la dote adicional' : 'Aptitud mágica de la dote';
  await page.getByLabel(abilityLabel).selectOption({ label: 'Inteligencia' });
  await checkFirst(human ? 'Trucos de la dote adicional humana' : 'Trucos de Iniciado en la magia', 2, page);
  await page.getByLabel(human ? 'Un conjuro de nivel 1 de la dote adicional' : 'Un conjuro de nivel 1 de la dote').selectOption({ index: 1 });
}
async function prepareBackground(page: Page, background: string) {
  await moveTo(page, '.builder-background-title', background, 'Trasfondo siguiente', backgrounds.length);
  const skillText = await page.locator('.builder-background-details .builder-class-flyer-detail')
    .filter({ hasText: 'Habilidades' }).locator('strong').innerText();
  const skills = skillText.split('·').map(x => x.trim()).filter(Boolean);
  const feat = await page.locator('.builder-background-details .builder-class-flyer-detail')
    .filter({ hasText: 'Dote de origen' }).locator('strong').innerText();
  await next(page).click();
  await expect(page.getByRole('heading', { name: '03.1. Elecciones del trasfondo' })).toBeVisible();
  await completeFeat(page, feat);
  const checkedFeatSkills = await page.locator('.builder-choice-wrapper input[type="checkbox"]:checked').evaluateAll(nodes =>
    nodes.map(n => n.closest('label')?.querySelector('span')?.textContent?.trim() || '').filter(Boolean)
  );
  const tool = page.getByLabel('Competencia con herramienta del trasfondo');
  if (await tool.count()) await tool.selectOption({ index: 1 });
  await next(page).click();
  await expect(page.getByRole('heading', { name: '04. Elige tu especie' })).toBeVisible();
  return { skills, featSkills: checkedFeatSkills, feat };
}
async function prepareSpecies(page: Page, selected: string, background: {skills:string[];featSkills:string[];feat:string}) {
  await moveTo(page, '.builder-species-title-row h4', selected, 'Especie siguiente', species.length);
  await next(page).click();
  await expect(page.getByRole('heading', { name: '04.1. Elecciones de especie' })).toBeVisible();
  await page.getByLabel('Nombre del personaje').fill('Prueba matriz');

  const variant = page.locator('label').filter({ hasText: /Linaje dracónico|Linaje élfico|Linaje gnomo|Linaje gigante|Legado infernal/ }).locator('select').first();
  if (await variant.count()) await variant.selectOption({ index: 1 });
  const size = page.getByLabel('Tamaño');
  if (await size.count()) await size.selectOption({ label: 'Mediano' });
  const magic = page.getByLabel('Aptitud mágica de linaje');
  if (await magic.count()) await magic.selectOption({ label: 'Inteligencia' });

  const skillLabel = selected === 'Elfo' ? 'Competencia adicional del elfo' : 'Habilidad adicional humana';
  const skill = page.getByLabel(skillLabel);
  if (await skill.count()) {
    const opts = await skill.locator('option').evaluateAll(ns => ns.map(n => (n as HTMLOptionElement).value).filter(Boolean));
    const blocked = new Set([...background.skills, ...background.featSkills]);
    const choice = opts.find(x => !blocked.has(x));
    if (!choice) throw new Error(`No hay habilidad adicional válida para ${selected}`);
    await skill.selectOption({ label: choice });
  }

  if (selected === 'Humano') {
    const featSelect = page.getByLabel('Dote de origen adicional humana');
    const feats = await featSelect.locator('option').evaluateAll(ns => ns.map(n => n.textContent?.trim() || '').filter(x => x && !x.includes('Elige')));
    const extraFeat = feats[0];
    if (!extraFeat) throw new Error('El humano no tiene dote adicional seleccionable');
    await featSelect.selectOption({ label: extraFeat });
    await completeFeat(page, extraFeat, true);
  }
  await next(page).click();
  await expect(page.getByRole('heading', { name: '05. Distribuye tus características' })).toBeVisible();
  await expect(page.locator('.builder-step-error')).toHaveCount(0);
}

test('matriz real de navegador: 1.920 combinaciones clase × trasfondo × especie alcanzan características', async ({ page }) => {
  test.setTimeout(3600000);
  let completed = 0;
  const failures: string[] = [];
  for (const className of classes) {
    for (const backgroundName of backgrounds) {
      for (const speciesName of species) {
        const label = `${className} / ${backgroundName} / ${speciesName}`;
        try {
          await page.goto('./');
          await expect(page.getByRole('heading', { name: '01. Concepto del personaje' })).toBeVisible();
          await next(page).click();
          await moveTo(page, '.builder-class-title', className, 'Clase siguiente', classes.length);
          await next(page).click();
          await expect(page.getByRole('heading', { name: '03. Elige tu trasfondo' })).toBeVisible();
          const background = await prepareBackground(page, backgroundName);
          await prepareSpecies(page, speciesName, background);
          completed++;
        } catch (error) {
          failures.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
          if (failures.length >= 20) break;
        }
      }
      if (failures.length >= 20) break;
    }
    if (failures.length >= 20) break;
  }
  expect(failures, `Completadas: ${completed}/1920. Fallos:\n${failures.join('\n')}`).toEqual([]);
  expect(completed).toBe(1920);
});
