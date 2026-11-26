// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ELF_BONUS_SKILLS, getAllowedWeaponMasteries, getStandardArrayAssignments,
  isOriginFeatDistinct, isSpeciesSkillAllowed, isValidAbilityIncreases,
  isValidUniqueSelection, selectDistinctChoices
} from '../src/builderRules.mjs';

const app = fs.readFileSync('src/App.svelte', 'utf8');
function extractConstant(name) {
  const startMatch = new RegExp('const\\s+' + name + '(?:\\s*:[^=]+)?\\s*=\\s*([\\[{])').exec(app);
  assert.ok(startMatch, 'No se encontró la constante ' + name);
  const start = startMatch.index + startMatch[0].lastIndexOf(startMatch[1]);
  const opener = app[start];
  const closer = opener === '{' ? '}' : ']';
  let depth = 0, quote = '', escaped = false;
  for (let i = start; i < app.length; i++) {
    const char = app[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === "'" || char === '"') { quote = char; continue; }
    if (char === opener) depth++;
    else if (char === closer) {
      depth--;
      if (depth === 0) return Function('return (' + app.slice(start, i + 1) + ')')();
    }
  }
  throw new Error('No se pudo extraer la constante ' + name);
}

const classSkills = extractConstant('BUILDER_CLASS_SKILLS');
const backgrounds = extractConstant('BUILDER_BACKGROUND_DATA');
const speciesChoices = extractConstant('BUILDER_SPECIES_CHOICES');
const skillOptions = extractConstant('BUILDER_SKILL_OPTIONS');
const featOptions = extractConstant('BUILDER_FEATS');
const allWeapons = extractConstant('BUILDER_WEAPON_MASTERY_OPTIONS');
const backgroundTools = extractConstant('BUILDER_BACKGROUND_TOOL_OPTIONS');
const classData = extractConstant('BUILDER_CLASS_DATA');
const musicalInstruments = extractConstant('BUILDER_MUSICAL_INSTRUMENTS');
const artisanTools = extractConstant('BUILDER_ARTISAN_TOOLS');
const gamingSets = extractConstant('BUILDER_GAMING_SETS');
const featTools = [...artisanTools,...musicalInstruments,...gamingSets,
  'Suministros de alquimista','Suministros de calígrafo','Suministros de cervecero',
  'Suministros de pintor','Útiles de cocinero','Herramientas de ladrón',
  'Herramientas de navegante','Útiles de envenenador','Útiles de herborista',
  'Útiles para disfrazarse','Útiles para falsificar'];

function optionsForFeat(feat) {
  if (feat === 'Habilidoso') return [...skillOptions, ...featTools];
  if (feat === 'Fabricante') return artisanTools;
  if (feat === 'Músico') return musicalInstruments;
  return [];
}

test('arreglo estándar: las 12 clases reciben seis valores únicos en el orden de prioridad', () => {
  const priorities = extractConstant('BUILDER_STANDARD_PRIORITY');
  const standard = extractConstant('BUILDER_STANDARD');
  assert.equal(Object.keys(classSkills).length, 12);
  for (const className of Object.keys(classSkills)) {
    const assigned = getStandardArrayAssignments(className, priorities, standard);
    assert.deepEqual(Object.values(assigned).sort((a,b)=>a-b), [8,10,12,13,14,15]);
    assert.equal(assigned[priorities[className][0]], 15, className + ' debe recibir 15 en su primera característica');
  }
});

test('restricciones de armas: Bárbaro y Pícaro solo reciben maestrías permitidas', () => {
  const barbarian = getAllowedWeaponMasteries('Bárbaro', allWeapons);
  const rogue = getAllowedWeaponMasteries('Pícaro', allWeapons);
  assert.ok(barbarian.includes('Alabarda'));
  assert.ok(!barbarian.includes('Arco corto'));
  assert.ok(rogue.includes('Estoque'));
  assert.ok(!rogue.includes('Espadón'));
  assert.ok(!rogue.includes('Arco largo'));
});

test('especie y dote: limita la habilidad élfica y evita repetir la dote del trasfondo', () => {
  assert.deepEqual([...ELF_BONUS_SKILLS], ['Percepción','Perspicacia','Supervivencia']);
  assert.ok(isSpeciesSkillAllowed('Elfo','Percepción',skillOptions));
  assert.ok(!isSpeciesSkillAllowed('Elfo','Atletismo',skillOptions));
  assert.ok(isSpeciesSkillAllowed('Humano','Atletismo',skillOptions));
  assert.ok(!isSpeciesSkillAllowed('Humano','Habilidad inventada',skillOptions));
  assert.ok(!isOriginFeatDistinct('Humano','Iniciado en la magia (Mago)','Iniciado en la magia (Mago)',featOptions));
  assert.ok(isOriginFeatDistinct('Humano','Iniciado en la magia (Mago)','Alerta',featOptions));
});

test('aumentos de característica: valida opciones, duplicados y límite 20', () => {
  const abilities = ['Fuerza','Destreza','Constitución','Inteligencia','Sabiduría','Carisma'];
  const base = {Fuerza:19,Destreza:14,Constitución:13,Inteligencia:12,Sabiduría:10,Carisma:8};
  assert.ok(!isValidAbilityIncreases({mode:'two',choices:['Fuerza','Destreza'],allowed:abilities,baseAbilities:base,abilityNames:abilities}));
  assert.ok(!isValidAbilityIncreases({mode:'two',choices:['Destreza','Destreza'],allowed:abilities,baseAbilities:base,abilityNames:abilities}));
  assert.ok(isValidAbilityIncreases({mode:'two',choices:['Destreza','Fuerza'],allowed:abilities,baseAbilities:base,abilityNames:abilities}));
});

test('matriz exhaustiva de 1.920 combinaciones clase × trasfondo × especie', () => {
  const classes = Object.keys(classSkills);
  const backgroundsList = Object.entries(backgrounds);
  const speciesList = Object.entries(speciesChoices);
  assert.equal(classes.length * backgroundsList.length * speciesList.length, 1920);
  let tested = 0;

  for (const className of classes) {
    const cls = classSkills[className];
    for (const [backgroundName, background] of backgroundsList) {
      const bgToolOptions = backgroundTools[backgroundName] || [];
      const backgroundTool = bgToolOptions[0] || '';
      const backgroundFeat = background.feat;
      const backgroundFeatOptions = optionsForFeat(backgroundFeat);
      const backgroundFeatCandidates = backgroundFeat === 'Habilidoso' ? [...featTools,...skillOptions] : backgroundFeatOptions;
      const backgroundFeatChoices = ['Habilidoso','Fabricante','Músico'].includes(backgroundFeat)
        ? selectDistinctChoices(backgroundFeatCandidates.filter(choice => !background.skills.includes(choice)), [backgroundTool], 3)
        : [];
      assert.ok(backgroundFeatChoices, 'Dote del trasfondo no permite tres elecciones: ' + backgroundName);

      for (const [speciesName] of speciesList) {
        let speciesSkill = '';
        if (speciesName === 'Elfo' || speciesName === 'Humano') {
          const allowedSpeciesSkills = speciesName === 'Elfo' ? ELF_BONUS_SKILLS : skillOptions;
          speciesSkill = selectDistinctChoices(allowedSpeciesSkills, [...background.skills,...backgroundFeatChoices.filter(choice=>skillOptions.includes(choice))], 1)?.[0] || '';
          assert.ok(speciesSkill, speciesName + ' sin habilidad disponible para ' + backgroundName);
        }

        let speciesExtraFeat = '';
        let speciesFeatChoices = [];
        if (speciesName === 'Humano') {
          speciesExtraFeat = featOptions.find(feat => feat !== backgroundFeat);
          assert.ok(isOriginFeatDistinct(speciesName, backgroundFeat, speciesExtraFeat, featOptions));
          if (['Habilidoso','Fabricante','Músico'].includes(speciesExtraFeat)) {
            speciesFeatChoices = selectDistinctChoices(optionsForFeat(speciesExtraFeat).filter(choice =>
              !background.skills.includes(choice) && choice !== speciesSkill && !backgroundFeatChoices.includes(choice)
            ), [backgroundTool], 3);
            assert.ok(speciesFeatChoices, 'Dote humana sin elecciones distintas para ' + backgroundName);
          }
        }

        const allFeatSkillChoices = [...backgroundFeatChoices,...speciesFeatChoices].filter(choice => skillOptions.includes(choice));
        const selectedClassSkills = selectDistinctChoices(cls.options,
          [...background.skills,speciesSkill,...allFeatSkillChoices], cls.count);
        assert.ok(selectedClassSkills, 'No hay habilidades de clase disponibles: ' + className + ' / ' + backgroundName + ' / ' + speciesName);
        assert.ok(isValidUniqueSelection(selectedClassSkills,cls.options,cls.count,[...background.skills,speciesSkill,...allFeatSkillChoices]));

        const featToolChoices = [...backgroundFeatChoices,...speciesFeatChoices].filter(choice=>featTools.includes(choice));
        const expectedTools = className === 'Bardo' ? 3 : className === 'Monje' ? 1 : 0;
        const classToolOptions = className === 'Bardo' ? musicalInstruments : className === 'Monje' ? [...artisanTools,...musicalInstruments] : [];
        const classToolChoices = selectDistinctChoices(classToolOptions,[backgroundTool,...featToolChoices],expectedTools);
        assert.ok(classToolChoices, 'No hay herramientas de clase disponibles: ' + className + ' / ' + backgroundName + ' / ' + speciesName);
        assert.ok(isValidUniqueSelection(classToolChoices,classToolOptions,expectedTools,[backgroundTool,...featToolChoices]));

        const weaponCount = classData[className].weaponCount;
        const allowedWeapons = getAllowedWeaponMasteries(className,allWeapons);
        const masteries = selectDistinctChoices(allowedWeapons,[],weaponCount);
        assert.ok(masteries, 'No hay suficientes maestrías de armas: ' + className);
        assert.ok(isValidUniqueSelection(masteries,allowedWeapons,weaponCount));
        tested++;
      }
    }
  }
  assert.equal(tested,1920);
});

test('la pestaña Conjuros contiene el compendio y ya no existe el botón de cambiar conjuros', () => {
  const tabsMatch = /const\\s+playerSheetTabs\\s*=\\s*\\[([^\\]]+)\\]/.exec(app);
  assert.ok(tabsMatch, 'No se encontró la lista de pestañas de la ficha');
  assert.match(tabsMatch[1], /'Conjuros'/);
  assert.doesNotMatch(tabsMatch[1], /'Compendio de conjuros'/);

  const spellsTabStart = app.indexOf("{:else if playerSheetTab === 'Conjuros'}");
  const nextTabStart = app.indexOf("{:else if playerSheetTab === 'Reglas'}", spellsTabStart);
  assert.ok(spellsTabStart >= 0 && nextTabStart > spellsTabStart, 'No se pudo delimitar la pestaña Conjuros');
  const spellsTab = app.slice(spellsTabStart, nextTabStart);
  assert.match(spellsTab, /<h3>Conjuros<\\/h3>/);
  assert.match(spellsTab, /<h3>Compendio de conjuros<\\/h3>/);
  assert.match(spellsTab, /bind:value=\\{spellSearch\\}/);
  assert.match(spellsTab, /bind:value=\\{spellLevelFilter\\}/);
  assert.match(spellsTab, /bind:value=\\{spellClassFilter\\}/);
  assert.doesNotMatch(spellsTab, /Cambiar conjuros/);
  assert.doesNotMatch(app, /on:click=\\{openSpellChange\\}/);
});

test('la interfaz y la ficha final están conectadas a las reglas revisadas', () => {
  assert.match(app,/builderData\.method === 'standard'\) builderApplyStandardArray\(\)/);
  assert.match(app,/isOriginFeatDistinct\(builderData\.species,backgroundFeat,builderData\.speciesExtraFeat,BUILDER_FEATS\)/);
  assert.match(app,/getAllowedWeaponMasteries\(builderData\.className,BUILDER_WEAPON_MASTERY_OPTIONS\)/);
  assert.match(app,/isSpeciesSkillAllowed\(builderData\.species,builderData\.speciesSkill,BUILDER_SKILL_OPTIONS\)/);
  assert.match(app,/put\(0,9,b\.age \|\| '—'\); put\(0,10,b\.height \|\| '—'\)/);
  assert.match(app,/put\(9,0,b\.appearance \|\| '—'\); put\(9,1,b\.personality \|\| '—'\); put\(9,2,b\.ideals \|\| '—'\); put\(9,3,b\.bonds \|\| '—'\); put\(9,4,b\.flaws \|\| '—'\)/);
});
