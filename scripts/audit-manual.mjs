// @ts-nocheck
import fs from 'node:fs';

const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const manual = fs.readFileSync('DND_2024_Reglas_del_Manual_del_Jugador.txt', 'utf8');
const app = fs.readFileSync('src/App.svelte', 'utf8');
const progression = readJson('src/levelProgression.json');
const classFeatures = readJson('src/classFeatures.json');
const subclasses = readJson('src/subclassProgression.json');
const choiceFile = readJson('src/levelUpChoiceDefinitions.json');
const errors = [];
const warnings = [];
const checks = [];
const norm = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const report = (name, ok, detail = '') => {
  checks.push({ name, status: ok ? 'OK' : 'ERROR', detail });
  if (!ok) errors.push(name + (detail ? ': ' + detail : ''));
};
const escapeRegExp = (value) => value.replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&');
const classNames = Object.keys(progression.classes ?? {});
const manualAttributeTables = [...manual.matchAll(/^TABLA:\s*ATRIBUTOS BÁSICOS DE\s+([^\n]+)$/gim)];
const manualClasses = new Map(manualAttributeTables.map((match) => [norm(match[1]), match.index]));
const findLinePosition = (source, title, from = 0) => {
  const re = new RegExp('^' + escapeRegExp(title) + '\\s*$', 'gm');
  re.lastIndex = from;
  const match = re.exec(source);
  return match ? match.index : -1;
};
const getClassSection = (className) => {
  const tableStart = manualClasses.get(norm(className));
  if (tableStart === undefined) return null;
  const sorted = [...manualClasses.values()].sort((a, b) => a - b);
  const nextTable = sorted.find((position) => position > tableStart);
  const title = className.toLocaleUpperCase('es');
  const titleStart = manual.lastIndexOf('\n\n' + title + '\n\n', tableStart);
  const start = titleStart >= 0 ? titleStart + 2 : tableStart;
  return { text: manual.slice(start, nextTable ?? manual.length) };
};

try {
  report('Las 12 clases están en los tres archivos de datos',
    classNames.length === 12 &&
    classNames.every((name) => classFeatures.classes?.[name] && subclasses.classes?.[name] && progression.classes?.[name]),
    'Progresión=' + classNames.length + '; rasgos=' + Object.keys(classFeatures.classes ?? {}).length +
      '; clases con subclases=' + Object.keys(subclasses.classes ?? {}).length);

  const allChoiceIds = new Set();
  for (const choice of choiceFile.choices ?? []) {
    const valid = Boolean(choice.id && !allChoiceIds.has(choice.id) &&
      classNames.includes(choice.class) && ['single', 'multiple'].includes(choice.kind) &&
      Array.isArray(choice.options) && choice.options.length > 0 &&
      choice.options.every((option) => typeof option === 'string' && option.trim()) &&
      choice.storage?.section && choice.storage?.field);
    report('Definición de elección ' + (choice.id ?? '(sin id)'), valid,
      valid ? '' : 'ID duplicado o ausente, clase desconocida, tipo/opciones/almacenamiento inválidos');
    if (choice.id) allChoiceIds.add(choice.id);
  }

  for (const className of classNames) {
    const section = getClassSection(className);
    if (!section) {
      report(className + ' · sección de clase encontrada en el manual', false, 'No se encontró su tabla de atributos básicos');
      continue;
    }
    const sectionText = section.text;
    const slug = className.toLocaleLowerCase('es');
    const basicTableMatch = sectionText.match(/TABLA:\s*ATRIBUTOS BÁSICOS DE[^\n]*\n([\s\S]*?)FIN DE TABLA/i);
    const basicRows = Object.fromEntries([...(basicTableMatch?.[1] ?? '').matchAll(/^FILA:\s*([^|]+)\|([^\n]+)$/gim)]
      .map((match) => [norm(match[1]), match[2].trim()]));
    const hitDie = basicRows[norm('Dado de puntos de golpe')] ?? '';
    report(className + ' · datos básicos y dado de golpe', Boolean(basicTableMatch && /\b1d(?:4|6|8|10|12)\b/i.test(hitDie)),
      basicTableMatch ? 'Dado=' + hitDie : 'No se pudo extraer la tabla de atributos básicos');

    const tableRe = new RegExp('TABLA:\\s*RASGOS DE\\s+' + escapeRegExp(slug) + '\\s*\\n([\\s\\S]*?)FIN DE TABLA', 'i');
    const tableMatch = sectionText.match(tableRe);
    const manualRows = [...(tableMatch?.[1] ?? '').matchAll(/^FILA:\s*([^\n]+)$/gim)]
      .map((match) => match[1].split('|').map((value) => value.trim()));
    const data = progression.classes[className];
    const dataRows = data?.rows ?? [];
    report(className + ' · tabla completa de 20 niveles',
      Boolean(tableMatch && manualRows.length === 20 && dataRows.length === 20),
      'Manual=' + manualRows.length + '; JSON=' + dataRows.length);

    if (tableMatch) {
      const headers = data?.columns ?? [];
      for (const cells of manualRows) {
        const level = Number(cells[0]);
        const actual = dataRows.find((row) => row.level === level);
        const validShape = cells.length === headers.length && headers.length >= 3;
        let equal = Boolean(actual && validShape &&
          Number(actual.level) === level &&
          norm(actual.proficiency) === norm(cells[1]) &&
          norm(actual.features) === norm(cells[2]));
        if (equal) {
          for (let i = 3; i < headers.length; i++) {
            if (norm(actual.resources?.[headers[i]]) !== norm(cells[i])) equal = false;
          }
        }
        report(className + ' · nivel ' + level + ' tabla', equal,
          equal ? '' : 'Diferencia en columnas, rasgos o recursos; manual=' + JSON.stringify(cells));
      }
      report(className + ' · encabezados de tabla y recursos', Boolean(
        manualRows.every((cells) => cells.length === (data?.columns ?? []).length) &&
        dataRows.every((row) => (data?.columns ?? []).slice(3).every((column) => Object.hasOwn(row.resources ?? {}, column)))
      ));
    }

    const classFeatureMarker = 'RASGOS DE CLASE DE ' + className.toLocaleUpperCase('es');
    const classFeatureStart = sectionText.toLocaleUpperCase('es').indexOf(classFeatureMarker);
    const subclassMap = subclasses.classes?.[className] ?? {};
    const subclassTitles = Object.keys(subclassMap);
    const subclassHeadingPositions = subclassTitles
      .map((title) => findLinePosition(sectionText, title, Math.max(0, classFeatureStart)))
      .filter((position) => position >= 0);
    const subclassStart = subclassHeadingPositions.length ? Math.min(...subclassHeadingPositions) : sectionText.length;
    const classText = classFeatureStart >= 0 ? sectionText.slice(classFeatureStart, subclassStart) : '';
    report(className + ' · encabezado de rasgos de clase y cuatro subclases',
      classFeatureStart >= 0 && subclassTitles.length === 4 && subclassHeadingPositions.length === 4,
      'Subclases JSON=' + subclassTitles.length + '; títulos localizados en manual=' + subclassHeadingPositions.length);

    const jsonFeatures = classFeatures.classes?.[className] ?? [];
    const featureMismatches = [];
    for (const cells of manualRows) {
      const level = Number(cells[0]);
      const expectedNames = String(cells[2] ?? '').split(',').map((name) => norm(name)).filter((name) => name && name !== norm('Rasgo de subclase'));
      const actualNames = jsonFeatures.filter((feature) => Number(feature.level) === level).map((feature) => norm(feature.name));
      for (const expected of expectedNames) {
        if (!actualNames.some((actual) => actual.startsWith(expected) || expected.startsWith(actual))) {
          featureMismatches.push({ level, missing: expected });
        }
      }
      for (const actual of actualNames) {
        if (!expectedNames.some((expected) => actual.startsWith(expected) || expected.startsWith(actual))) {
          featureMismatches.push({ level, extra: actual });
        }
      }
    }
    report(className + ' · rasgos de clase contrastados con la tabla',
      classFeatureStart >= 0 && featureMismatches.length === 0,
      'Diferencias=' + JSON.stringify(featureMismatches));

    for (const subclassName of subclassTitles) {
      const start = findLinePosition(sectionText, subclassName, Math.max(0, classFeatureStart));
      const later = subclassTitles.filter((title) => title !== subclassName)
        .map((title) => findLinePosition(sectionText, title, start + subclassName.length))
        .filter((position) => position > start);
      const end = later.length ? Math.min(...later) : sectionText.length;
      const subclassText = start >= 0 ? sectionText.slice(start, end) : '';
      const manualPairs = [...subclassText.matchAll(/^\s*NIVEL\s+(\d+):\s*([^\n]+)/gim)]
        .map((match) => [Number(match[1]), norm(match[2])])
        .filter(([, name]) => name && !name.startsWith(norm('TABLA:')) && !name.startsWith(norm('CONJUROS DEL')) && !name.startsWith(norm('CONJUROS DE')));
      const jsonPairs = (subclassMap[subclassName]?.features ?? [])
        .map((feature) => [Number(feature.level), norm(feature.name)])
        .filter(([, name]) => !name.startsWith(norm('conjurosdel')));
      const pairKey = ([level, name]) => level + ':' + name;
      const missing = manualPairs.filter(([level, name]) => !jsonPairs.some(([jsonLevel, jsonName]) =>
        jsonLevel === level && (jsonName.startsWith(name) || name.startsWith(jsonName))));
      const extra = jsonPairs.filter(([level, name]) => !manualPairs.some(([manualLevel, manualName]) =>
        manualLevel === level && (name.startsWith(manualName) || manualName.startsWith(name))));
      const tablesValid = (subclassMap[subclassName]?.tables ?? []).every((table) =>
        norm(sectionText).includes(norm(table.name)));
      report(className + ' · subclase ' + subclassName,
        start >= 0 && manualPairs.length > 0 && missing.length === 0 && extra.length === 0 && tablesValid,
        'Manual=' + JSON.stringify(manualPairs) + '; JSON=' + JSON.stringify(jsonPairs) +
          '; faltan=' + JSON.stringify(missing) + '; sobran=' + JSON.stringify(extra) +
          '; tablas=' + (tablesValid ? 'OK' : 'no localizadas'));
    }

    for (const [subclassName, subclassData] of Object.entries(subclassMap)) {
      let valid = dataRows.length === 20;
      let finalSheet = null;
      for (let level = 1; level <= 20 && valid; level++) {
        const row = dataRows.find((item) => item.level === level);
        if (!row) { valid = false; break; }
        const sheet = {
          level,
          proficiency: row.proficiency,
          resources: { ...(row.resources ?? {}) },
          classFeatures: (classFeatures.classes[className] ?? [])
            .filter((feature) => feature.level <= level)
            .map((feature) => ({ ...feature })),
          subclassFeatures: (subclassData.features ?? [])
            .filter((feature) => feature.level <= level)
            .map((feature) => ({ ...feature }))
        };
        if (!sheet.proficiency || sheet.classFeatures.some((feature) => !feature.description?.trim()) ||
            sheet.subclassFeatures.some((feature) => !feature.description?.trim())) valid = false;
        finalSheet = sheet;
      }
      valid = Boolean(valid && finalSheet?.level === 20 &&
        finalSheet.classFeatures.length === (classFeatures.classes[className] ?? []).length &&
        finalSheet.subclassFeatures.length === (subclassData.features ?? []).length);
      report(className + ' · simulación 1–20 · ' + subclassName, valid,
        'Nivel final=' + (finalSheet?.level ?? 'incompleto') +
          '; rasgos clase=' + (finalSheet?.classFeatures.length ?? 0) +
          '; rasgos subclase=' + (finalSheet?.subclassFeatures.length ?? 0));
    }
  }

  report('Motor común de elecciones conectado',
    app.includes('validateSingleLevelUpChoice') &&
    app.includes('validateMultipleLevelUpChoice') &&
    app.includes('getLevelUpChoiceOptions'));
  report('La subida de nivel escribe rasgos, recursos y progresión en la ficha',
    app.includes("'Rasgos de clase del nivel '+nextLevel") &&
    app.includes("'Rasgos de subclase acumulados'") &&
    app.includes("'Recursos según tabla de clase'") &&
    app.includes("'Nivel de clase',nextLevel"));

  const passed = checks.filter((item) => item.status === 'OK').length;
  console.log(JSON.stringify({
    audit: 'D&D 2024 · todas las clases',
    manual: 'DND_2024_Reglas_del_Manual_del_Jugador.txt',
    classes: classNames.length,
    subclasses: Object.values(subclasses.classes ?? {}).reduce((sum, value) => sum + Object.keys(value).length, 0),
    simulatedBuilds: Object.values(subclasses.classes ?? {}).reduce((sum, value) => sum + Object.keys(value).length, 0),
    passed,
    failed: errors.length,
    warnings,
    checks
  }, null, 2));
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
