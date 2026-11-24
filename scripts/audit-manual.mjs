// @ts-nocheck
import fs from 'node:fs';
import assert from 'node:assert/strict';

const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const manual = fs.readFileSync('DND_2024_Reglas_del_Manual_del_Jugador.txt', 'utf8');
const app = fs.readFileSync('src/App.svelte', 'utf8');
const progression = readJson('src/levelProgression.json');
const classFeatures = readJson('src/classFeatures.json');
const subclasses = readJson('src/subclassProgression.json');
const choiceFile = readJson('src/levelUpChoiceDefinitions.json');
const className = 'Bárbaro';
const errors = [];
const checks = [];
const report = (name, ok, detail = '') => {
  checks.push({ name, status: ok ? 'OK' : 'ERROR', detail });
  if (!ok) errors.push(name + (detail ? ': ' + detail : ''));
};
const norm = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const splitList = (value) => String(value ?? '').split(',').map((item) => norm(item)).filter(Boolean);
const findSection = (source, start, end) => {
  const a = source.indexOf(start);
  if (a < 0) throw new Error('No se encontró en el manual: ' + start);
  const b = source.indexOf(end, a + start.length);
  if (b < 0) throw new Error('No se encontró el límite de sección: ' + end);
  return source.slice(a, b);
};

try {
  const manualClass = findSection(manual, 'BÁRBARO\n\nTABLA: Atributos básicos de bárbaro', '\nBARDO\n\nTABLA: Atributos básicos de bardo');
  const basics = findSection(manualClass, 'TABLA: Atributos básicos de bárbaro', 'FIN DE TABLA');
  const basicRows = Object.fromEntries([...basics.matchAll(/^FILA: ([^|]+)\|(.+)$/gm)].map((m) => [norm(m[1]), m[2].trim()]));
  report('Dado de golpe d12', /1d12 por nivel de bárbaro/i.test(basicRows[norm('Dado de puntos de golpe')] || ''));
  report('Salvaciones Fuerza y Constitución', norm(basicRows[norm('Competencias en tiradas de salvación')]).includes(norm('Fuerza y Constitución')));
  report('Lista de seis habilidades de Bárbaro', ['Atletismo','Intimidación','Naturaleza','Percepción','Supervivencia','Trato con animales'].every((skill) => norm(basicRows[norm('Competencias en habilidades')]).includes(norm(skill))));
  report('Armas sencillas y marciales', norm(basicRows[norm('Competencias con armas')]).includes(norm('Armas sencillas y marciales')));
  report('Armaduras ligeras, medias y escudos', ['Armaduras ligeras','medias','escudos'].every((word) => norm(basicRows[norm('Entrenamiento con armaduras')]).includes(norm(word))));

  const table = findSection(manualClass, 'TABLA: Rasgos de bárbaro', 'FIN DE TABLA');
  const manualRows = [...table.matchAll(/^FILA: (\d+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*(\d+)\s*\|\s*([^|]+)\|\s*(\d+)/gm)]
    .map((m) => ({ level: Number(m[1]), proficiency: m[2].trim(), features: m[3].trim(), rages: m[4], rageDamage: m[5].trim(), masteries: m[6] }));
  const dataRows = progression.classes[className]?.rows ?? [];
  report('Tabla de progresión: 20 niveles', manualRows.length === 20 && dataRows.length === 20, 'Manual=' + manualRows.length + ', JSON=' + dataRows.length);
  for (const expected of manualRows) {
    const actual = dataRows.find((row) => row.level === expected.level);
    const ok = actual &&
      norm(actual.proficiency) === norm(expected.proficiency) &&
      norm(actual.features) === norm(expected.features) &&
      String(actual.resources?.['N.º de furias']) === expected.rages &&
      norm(actual.resources?.['Daño por furia']) === norm(expected.rageDamage) &&
      String(actual.resources?.['Maestría con armas']) === expected.masteries;
    report('Nivel ' + expected.level + ' tabla', Boolean(ok), ok ? '' : 'Los rasgos, competencia o recursos no coinciden con el manual');
  }

  const classText = findSection(manualClass, 'RASGOS DE CLASE DE BÁRBARO', 'SUBCLASES DE BÁRBARO');
  const manualFeaturePairs = [...classText.matchAll(/^NIVEL (\d+): ([^\n]+)/gm)].map((m) => [Number(m[1]), norm(m[2])]);
  const normalizedClassText = classText.replace(/\s+/g, ' ');
  const asiText = normalizedClassText.match(/Vuelves a obtener este rasgo en los niveles de bárbaro ([^.]+)\./i)?.[1] ?? '';
  for (const level of [...asiText.matchAll(/\d+/g)].map((m) => Number(m[0]))) manualFeaturePairs.push([level, norm('Mejora de característica')]);
  const jsonFeaturePairs = (classFeatures.classes[className] ?? []).map((feature) => [Number(feature.level), norm(feature.name)]);
  const pairKey = ([level, name]) => level + ':' + name;
  const missingClass = manualFeaturePairs.filter((pair) => !jsonFeaturePairs.some((item) => pairKey(item) === pairKey(pair)));
  const extraClass = jsonFeaturePairs.filter((pair) => !manualFeaturePairs.some((item) => pairKey(item) === pairKey(pair)));
  report('Rasgos de clase cotejados con el texto del manual', missingClass.length === 0 && extraClass.length === 0,
    'Faltan=' + JSON.stringify(missingClass) + '; sobran=' + JSON.stringify(extraClass));

  const subclassStart = manualClass.indexOf('SUBCLASES DE BÁRBARO');
  if (subclassStart < 0) throw new Error('No se encontró SUBCLASES DE BÁRBARO en el manual.');
  const subclassText = manualClass.slice(subclassStart);
  const manualSubclassSections = [...subclassText.matchAll(/^(SENDA DEL [^\n]+)$/gm)];
  const jsonSubclassMap = subclasses.classes[className] ?? {};
  const manualSubclassNames = manualSubclassSections.map((m) => m[1].trim());
  const jsonSubclassNames = Object.keys(jsonSubclassMap);
  report('Cuatro subclases de Bárbaro', manualSubclassNames.length === 4 && jsonSubclassNames.length === 4 &&
    manualSubclassNames.every((name) => jsonSubclassNames.some((item) => norm(item) === norm(name))),
    'Manual=' + manualSubclassNames.join(', ') + '; JSON=' + jsonSubclassNames.join(', '));

  for (let i = 0; i < manualSubclassSections.length; i++) {
    const start = manualSubclassSections[i].index;
    const end = i + 1 < manualSubclassSections.length ? manualSubclassSections[i + 1].index : subclassText.indexOf('FIN PÁGINA PDF', start) > -1 ? subclassText.indexOf('FIN PÁGINA PDF', start) : subclassText.length;
    const section = subclassText.slice(start, end);
    const manualName = manualSubclassSections[i][1].trim();
    const manualPairs = [...section.matchAll(/^NIVEL (\d+): ([^\n]+)/gm)].map((m) => [Number(m[1]), norm(m[2])]);
    const jsonName = jsonSubclassNames.find((name) => norm(name) === norm(manualName));
    const jsonPairs = (jsonSubclassMap[jsonName]?.features ?? []).map((feature) => [Number(feature.level), norm(feature.name)]);
    const missing = manualPairs.filter((pair) => !jsonPairs.some((item) => pairKey(item) === pairKey(pair)));
    const extra = jsonPairs.filter((pair) => !manualPairs.some((item) => pairKey(item) === pairKey(pair)));
    report('Rasgos subclase ' + manualName, missing.length === 0 && extra.length === 0,
      'Faltan=' + JSON.stringify(missing) + '; sobran=' + JSON.stringify(extra));
  }

  const choices = choiceFile.choices ?? [];
  const primal = choices.find((choice) => choice.id === 'barbarian.primalKnowledge.skill');
  const mastery = choices.find((choice) => choice.id === 'barbarian.weaponMastery');
  const wild = choices.find((choice) => choice.id === 'barbarian.wildHeart.aspect');
  const skillList = ['Atletismo','Intimidación','Naturaleza','Percepción','Supervivencia','Trato con animales'];
  report('Definición de Conocimiento primigenio', Boolean(primal && primal.level === 3 && primal.kind === 'single' && primal.excludeExisting &&
    skillList.every((skill) => primal.options.some((option) => norm(option) === norm(skill))) && primal.options.length === 6));
  report('Definición de maestrías con armas', Boolean(mastery && mastery.level === 'progression' && mastery.kind === 'multiple' &&
    mastery.retainExisting && mastery.countFromResource === 'Maestría con armas' && mastery.options.length === 28));

  const simpleStart = manual.lastIndexOf('ARMAS CUERPO A CUERPO SENCILLAS');
  const simpleEnd = manual.indexOf('ARMAS A DISTANCIA SENCILLAS', simpleStart);
  const martialStart = manual.lastIndexOf('ARMAS CUERPO A CUERPO MARCIALES');
  const martialEnd = manual.indexOf('ARMAS A DISTANCIA MARCIALES', martialStart);
  const simpleMelee = manual.slice(simpleStart, simpleEnd);
  const martialMelee = manual.slice(martialStart, martialEnd);
  const weaponNames = (section) => [...section.matchAll(/^([^:\n]+):/gm)].map((m) => norm(m[1].trim()));
  const allowedWeapons = [...weaponNames(simpleMelee), ...weaponNames(martialMelee)];
  const configuredWeapons = (mastery?.options ?? []).map(norm);
  const missingWeapons = allowedWeapons.filter((name) => !configuredWeapons.includes(name));
  const invalidWeapons = configuredWeapons.filter((name) => !allowedWeapons.includes(name));
  report('Lista de maestrías coincide con armas cuerpo a cuerpo del manual',
    missingWeapons.length === 0 && invalidWeapons.length === 0 && allowedWeapons.length === 28,
    'Faltan=' + JSON.stringify(missingWeapons) + '; no permitidas=' + JSON.stringify(invalidWeapons));

  const aspectSection = findSection(subclassText, 'NIVEL 6: ASPECTO DE LO SALVAJE', 'NIVEL 10: HABLANTE DE LA NATURALEZA');
  const manualAspects = ['Búho','Pantera','Salmón'];
  report('Definición de Aspecto de lo salvaje', Boolean(wild && wild.level === 6 &&
    norm(wild.subclass) === norm('sendadelcorazonsalvaje') &&
    manualAspects.every((option) => wild.options.some((item) => norm(item) === norm(option))) &&
    manualAspects.every((option) => norm(aspectSection).includes(norm(option))) && wild.options.length === 3));

  report('Motor común de elecciones conectado', app.includes('validateSingleLevelUpChoice') &&
    app.includes('validateMultipleLevelUpChoice') && app.includes('getLevelUpChoiceOptions'));
  report('Creación inicial muestra Maestría con armas', app.includes("'Bárbaro':'Defensa sin armadura; Furia; Maestría con armas"));
  report('Subida de nivel contempla maestrías y Conocimiento primigenio',
    app.includes('barbarian.primalKnowledge.skill') && app.includes('barbarian.weaponMastery') && app.includes('levelUpWeaponMasteries'));
  report('Subida de nivel contempla Aspecto de lo salvaje',
    app.includes('barbarian.wildHeart.aspect') && app.includes('levelUpBarbarianAspect'));

  const skillBlock = app.match(/const BUILDER_CLASS_SKILLS:[\s\S]*?= \{([\s\S]*?)\n  \};/)?.[1] ?? '';
  const barbarianSkillLine = skillBlock.match(/'Bárbaro':\{count:(\d+),options:\[([^\]]*)\]\}/);
  const builderSkills = barbarianSkillLine?.[2].match(/'([^']+)'/g)?.map((value) => value.slice(1, -1)) ?? [];
  report('Creador: dos habilidades de clase y opciones oficiales',
    Boolean(barbarianSkillLine && Number(barbarianSkillLine[1]) === 2 &&
      skillList.every((skill) => builderSkills.some((item) => norm(item) === norm(skill))) && builderSkills.length === 6));

  const builderClassBlock = app.match(/const BUILDER_CLASS_DATA:[\s\S]*?= \{([\s\S]*?)\n  \};/)?.[1] ?? '';
  const barbarianBuilderLine = builderClassBlock.split('\n').find((line) => line.includes("'Bárbaro':"));
  report('Creador: equipo A/B, dos maestrías y rasgos iniciales',
    Boolean(barbarianBuilderLine &&
      ['Hacha a dos manos','4 hachas de mano','paquete de explorador','15 po','75 po'].every((item) => norm(barbarianBuilderLine).includes(norm(item))) &&
      /weaponCount:2/.test(barbarianBuilderLine) &&
      ['Defensa sin armadura','Furia','Maestría con armas'].every((item) => norm(barbarianBuilderLine).includes(norm(item)))));

  const barbarianClassRows = progression.classes[className].rows;
  const barbarianClassFeatures = classFeatures.classes[className];
  for (const [subclassName, subclassData] of Object.entries(jsonSubclassMap)) {
    const simulatedSheet = {
      level: 0,
      proficiency: '',
      classFeatures: [],
      subclassFeatures: [],
      resources: {}
    };
    let valid = true;
    for (let level = 1; level <= 20; level++) {
      const row = barbarianClassRows.find((item) => item.level === level);
      if (!row) { valid = false; break; }
      simulatedSheet.level = level;
      simulatedSheet.proficiency = row.proficiency;
      simulatedSheet.classFeatures = barbarianClassFeatures
        .filter((feature) => feature.level <= level)
        .map((feature) => ({ level: feature.level, name: feature.name, description: feature.description }));
      simulatedSheet.subclassFeatures = subclassData.features
        .filter((feature) => feature.level <= level)
        .map((feature) => ({ level: feature.level, name: feature.name, description: feature.description }));
      simulatedSheet.resources = { ...row.resources };
      if (simulatedSheet.level !== level ||
          simulatedSheet.proficiency !== row.proficiency ||
          Object.keys(simulatedSheet.resources).length !== 3 ||
          simulatedSheet.classFeatures.some((feature) => !feature.description) ||
          simulatedSheet.subclassFeatures.some((feature) => !feature.description)) {
        valid = false;
        break;
      }
    }
    const expectedClassCount = barbarianClassFeatures.length;
    const expectedSubclassCount = subclassData.features.length;
    valid = valid && simulatedSheet.level === 20 &&
      simulatedSheet.classFeatures.length === expectedClassCount &&
      simulatedSheet.subclassFeatures.length === expectedSubclassCount &&
      simulatedSheet.resources['N.º de furias'] === '6' &&
      simulatedSheet.resources['Daño por furia'] === '+4' &&
      simulatedSheet.resources['Maestría con armas'] === '4';
    report('Simulación de ficha niveles 1–20 · ' + subclassName, Boolean(valid),
      'Nivel final=' + simulatedSheet.level +
      '; rasgos de clase=' + simulatedSheet.classFeatures.length +
      '; rasgos de subclase=' + simulatedSheet.subclassFeatures.length);
  }

  report('La subida de nivel escribe rasgos, recursos y progresión en la ficha',
    app.includes("'Rasgos de clase del nivel '+nextLevel") &&
    app.includes("'Rasgos de subclase acumulados'") &&
    app.includes("'Recursos según tabla de clase'") &&
    app.includes("'Nivel de clase',nextLevel"));

  const passed = checks.filter((item) => item.status === 'OK').length;
  console.log(JSON.stringify({ audit: 'D&D 2024 · Bárbaro', manual: 'DND_2024_Reglas_del_Manual_del_Jugador.txt', passed, failed: errors.length, checks }, null, 2));
  if (errors.length) {
    console.error('\nAUDITORÍA FALLIDA:\n- ' + errors.join('\n- '));
    process.exitCode = 1;
  } else {
    console.log('\nAUDITORÍA SUPERADA: sin discrepancias en los controles implementados.');
  }
} catch (error) {
  console.error('No se pudo completar la auditoría:', error);
  process.exitCode = 1;
}
