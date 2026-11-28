const REQUIRED_SECTIONS = ['PERSONAJE','ATRIBUTOS','COMBATE','HABILIDADES','COMPETENCIAS','RASGOS Y DOTES','EQUIPO','HISTORIA','PROGRESIÓN'];
const REQUIRED_IDENTITY = ['Nombre','Clase','Especie','Trasfondo'];
const ABILITIES = ['Fuerza','Destreza','Constitución','Inteligencia','Sabiduría','Carisma'];

/** @param {unknown} value */
const clean = value => String(value ?? '').trim();
/** @param {unknown} value */
const sectionName = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();

/** @param {any} sheet */
export function auditCharacterSheet(sheet) {
  const errors = /** @type {{code: string, message: string}[]} */ ([]);
  const warnings = /** @type {{code: string, message: string}[]} */ ([]);
  /** @param {string} code @param {string} message */
  const addError = (code, message) => errors.push({ code, message });
  /** @param {string} code @param {string} message */
  const addWarning = (code, message) => warnings.push({ code, message });

  if (!sheet || typeof sheet !== 'object' || Array.isArray(sheet)) {
    return { valid: false, errors: [{ code: 'sheet_not_object', message: 'La ficha no es un objeto válido.' }], warnings: [] };
  }
  if (!Array.isArray(sheet.sections) || sheet.sections.length === 0) {
    return { valid: false, errors: [{ code: 'sections_missing', message: 'La ficha no contiene secciones.' }], warnings: [] };
  }

  const sections = /** @type {Map<string, any[]>} */ (new Map());
  for (const [index, section] of sheet.sections.entries()) {
    if (!section || typeof section !== 'object' || Array.isArray(section)) {
      addError('section_invalid', 'La sección ' + (index + 1) + ' no tiene una estructura válida.');
      continue;
    }
    const key = sectionName(section.name);
    if (!key) {
      addError('section_name_missing', 'Hay una sección sin nombre.');
      continue;
    }
    if (!Array.isArray(section.stats)) {
      addError('section_stats_invalid', 'La sección ' + clean(section.name) + ' no contiene una lista de datos válida.');
      continue;
    }
    if (!sections.has(key)) sections.set(key, []);
    sections.get(key)?.push(section);
    for (const [statIndex, stat] of section.stats.entries()) {
      if (!stat || typeof stat !== 'object' || Array.isArray(stat) || !clean(stat.name)) {
        addError('stat_invalid', 'Hay un dato sin estructura o nombre válido en ' + clean(section.name) + ' (' + (statIndex + 1) + ').');
      }
    }
  }

  for (const required of REQUIRED_SECTIONS) {
    const matches = sections.get(sectionName(required)) || [];
    if (matches.length === 0) addError('required_section_missing', 'Falta la sección obligatoria ' + required + '.');
    else if (matches.length > 1) addError('required_section_duplicated', 'La sección obligatoria ' + required + ' aparece más de una vez.');
  }

  const identity = (sections.get('PERSONAJE') || [])[0];
  /** @param {{stats: any[]} | undefined} section @param {string} name */
  const readValue = (section, name) => clean(section?.stats?.find(stat => clean(stat?.name) === name)?.value);
  for (const field of REQUIRED_IDENTITY) {
    if (!readValue(identity, field)) addError('identity_field_missing', 'Falta el dato obligatorio «' + field + '».');
  }

  const abilities = /** @type {{stats: any[]} | undefined} */ ((sections.get('ATRIBUTOS') || [])[0]);
  if (abilities) {
    const names = new Set(abilities.stats.map(stat => clean(stat?.name)));
    for (const ability of ABILITIES) {
      if (!names.has(ability)) addError('ability_missing', 'Falta la característica ' + ability + '.');
      else {
        const raw = readValue(abilities, ability);
        const match = raw.match(/-?\d+/);
        if (!match || Number(match[0]) < 1 || Number(match[0]) > 30) {
          addWarning('ability_value_unusual', 'El valor de ' + ability + ' está vacío o fuera del intervalo esperado.');
        }
      }
    }
  }

  const combat = /** @type {{stats: any[]} | undefined} */ ((sections.get('COMBATE') || [])[0]);
  for (const field of ['Puntos de golpe máximos','Armor Class','Speed']) {
    if (combat && !combat.stats.some(stat => clean(stat?.name) === field)) {
      addWarning('combat_field_missing', 'Falta el dato de combate «' + field + '».');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: { sectionCount: sheet.sections.length, errorCount: errors.length, warningCount: warnings.length }
  };
}

/** @param {{className: string, backgroundName: string, speciesName: string, caseKey: string}} options */
export function buildSyntheticAuditSheet({ className, backgroundName, speciesName, caseKey }) {
  /** @param {string} name @param {unknown} value */
  const stat = (name, value) => ({ name, value: String(value) });
  return {
    id: caseKey,
    name: 'Personaje sintético de diagnóstico',
    sections: [
      { name: 'PERSONAJE', stats: [stat('Nombre','Personaje sintético'),stat('Clase',className),stat('Subclase',''),stat('Nivel',1),stat('Especie',speciesName),stat('Trasfondo',backgroundName)] },
      { name: 'ATRIBUTOS', stats: ABILITIES.map((name,index) => stat(name,[15,14,13,12,10,8][index])) },
      { name: 'COMBATE', stats: [stat('Puntos de golpe máximos',10),stat('Armor Class',10),stat('Speed','30 pies')] },
      { name: 'HABILIDADES', stats: [stat('Acrobacias','+2')] },
      { name: 'COMPETENCIAS', stats: [stat('Skills','')] },
      { name: 'RASGOS Y DOTES', stats: [stat('Rasgos de clase',''),stat('Rasgos de especie','')] },
      { name: 'CONJUROS', stats: [] },
      { name: 'EQUIPO', stats: [stat('Equipo inicial','')] },
      { name: 'HISTORIA', stats: [stat('Apariencia','')] },
      { name: 'PROGRESIÓN', stats: [stat('Nivel de clase',1)] }
    ]
  };
}
