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

report('fighter-fighting-style-progression', app.includes('needsFighterStyle=isFighter') && app.includes("fighterStyleTarget=isFighter && selectedSubclassKey==='campeon' && nextLevel>=7?2:1") && app.includes("'Estilos de combate',fighterStyleChoices.join") && app.includes('al subir de nivel puedes sustituir como máximo una'), 'Guerrero puede sustituir un estilo al subir de nivel y Campeón obtiene un segundo estilo a nivel 7.');
report('fighter-weapon-mastery-progression', app.includes("getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Guerrero'") && app.includes('BUILDER_WEAPON_MASTERY_OPTIONS as weapon') && app.toLowerCase().includes('conserva las anteriores y añade las nuevas'), 'Guerrero elige maestrías de armas de toda la lista y conserva las anteriores al alcanzar 4, 5 y 6.');
report('fighter-eldritch-knight-replacements', app.includes('retainedSubclassCantrips<') && app.includes('retainedSubclassSpells<') && app.includes('solo puedes sustituir uno de los que ya conoces'), 'Caballero Arcano valida la lista completa, evita duplicados y limita a un reemplazo de truco y conjuro por nivel.');
report('fighter-battle-master-choices', app.includes('needsBattleMasterTraining=isBattleMaster && nextLevel===3') && app.includes('needsBattleManeuvers=isBattleMaster && [3,7,10,15].includes(nextLevel)') && app.includes('setCharacterStat(updated,\'RASGOS Y DOTES\',\'Maniobras de maestro del combate\',maneuverChoices.join'), 'Maestro del combate registra herramienta, habilidad y maniobras de forma acumulativa.');

const fighterRows=progression.classes['Guerrero']?.rows || [];
const fighterSubs=subclasses.classes['Guerrero'] || {};
report('fighter-creation-style-and-mastery',app.includes("'Guerrero':{equipmentA:")&&app.includes("specialLabel:'Estilo de combate'")&&app.includes("weaponCount:3")&&app.includes('const specialOk = cls.specialOptions.length === 0 || cls.specialOptions.includes(builderData.classSpecialChoice)')&&app.includes('const masteriesOk = builderData.weaponMasteries.length === cls.weaponCount'),'La creación exige elegir un estilo de combate válido y tres maestrías de armas, y registra ambas elecciones en la ficha.');
report('fighter-weapon-mastery-level-up-ui',app.includes("getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Guerrero' && Number(getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestría con armas'] || getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestrías con armas'] || 0) > splitChoiceList(getCharacterStat(levelUpEntry.sheet,'ATAQUES','Maestrías con armas')).length")&&app.includes('Maestrías con armas: conserva las anteriores y añade las nuevas'),'El selector de maestrías aparece en los niveles en que aumenta el cupo del Guerrero (4, 10 y 16), y permite añadir las nuevas armas.');
report('fighter-resource-progression',fighterRows.length===20&&fighterRows.every(row=>Number(row.resources?.['Tomar aliento'])===(row.level>=10?4:row.level>=4?3:2)&&Number(row.resources?.['Maestría con armas'])===(row.level>=16?6:row.level>=10?5:row.level>=4?4:3)),'Tomar aliento progresa 2/3/4 usos y Maestría con armas 3/4/5/6 tipos en los niveles correctos.');
report('fighter-subclass-feature-levels',Object.keys(fighterSubs).length===4&&Object.values(fighterSubs).every(sub=>JSON.stringify(sub.features.map(feature=>feature.level))===JSON.stringify([3,3,7,10,15,18])||JSON.stringify(sub.features.map(feature=>feature.level))===JSON.stringify([3,7,10,15,18])),'Las cuatro subclases incorporan sus rasgos en los niveles correctos: 3, 7, 10, 15 y 18.');
const eldritchTable=fighterSubs['CABALLERO ARCANO']?.tables?.find(table=>norm(table.name).includes('lanzamientodeconjuros'));
const psiTable=fighterSubs['GUERRERO PSIÓNICO']?.tables?.find(table=>norm(table.name).includes('dadosdeenergia'));
report('fighter-eldritch-knight-spell-progression',eldritchTable?.rows?.length===18&&JSON.stringify(eldritchTable.rows[0])===JSON.stringify(['3','3','2','—','—','—'])&&JSON.stringify(eldritchTable.rows.at(-1))===JSON.stringify(['20','13','4','3','3','1'])&&app.includes("className==='Guerrero'?(nextLevel>=10?3:2):className==='Pícaro'?(nextLevel>=10?4:3):0")&&app.includes("const subclassMagicAbility=(className==='Guerrero'||className==='Pícaro')?'Inteligencia'"),'Caballero Arcano registra trucos, conjuros preparados, espacios de nivel 1–4 e Inteligencia como aptitud mágica.');
report('fighter-psychic-warrior-dice-progression',JSON.stringify(psiTable?.rows)===JSON.stringify([['3','d6','4'],['5','d8','6'],['9','d8','8'],['11','d10','8'],['13','d10','10'],['17','d12','12']]),'Guerrero psiónico conserva la progresión de tamaño y cantidad de dados de energía psiónica.');
report('fighter-battle-master-maneuver-counts',app.includes('maneuverTarget=nextLevel>=15?9:nextLevel>=10?7:nextLevel>=7?5:3')&&app.includes('retainedManeuvers<oldManeuvers.length-1')&&app.includes('BUILDER_BATTLE_MANEUVER_OPTIONS.some'),'Maestro del combate registra 3, 5, 7 y 9 maniobras, permite sustituir como máximo una y valida las opciones.');

report('sorcerer-cantrip-replacement', app.includes('isSorcererSpellProgression && oldClassCantripNames.length') && app.includes('solo puedes sustituir un truco que ya conozcas'), 'Hechicero conserva todos sus trucos salvo un posible reemplazo en cada subida y obtiene el número correcto de trucos.');
report('sorcerer-spell-replacement', app.includes('isSorcererSpellProgression && oldClassSpellNames.length') && app.includes('solo puedes sustituir un conjuro preparado que ya conozcas') && app.includes('classSpellNames.length!==classPreparedTarget'), 'Hechicero valida el total de conjuros preparados, los duplicados y un único reemplazo por nivel.');
report('sorcerer-metamagic', app.includes('metamagicTarget=nextLevel>=17?6:nextLevel>=10?4:2'), 'Metamagia registra 2 opciones al nivel 2, 4 al 10 y 6 al 17, con sustitución limitada a una.');
report('sorcerer-draconic-affinity', app.includes('needsDraconicAffinity') && app.includes('Afinidad elemental dracónica') && app.includes("['Ácido','Frío','Fuego','Relámpago','Veneno']"), 'Hechicería dracónica exige elegir una afinidad elemental al nivel 6.');
report('sorcerer-draconic-resilience', app.includes('draconicHpBonus') && app.includes('Resistencia dracónica: 10 + modificador de Destreza + modificador de Carisma'), 'Resistencia dracónica añade 3 PG al nivel 3, 1 PG por nivel posterior y registra su fórmula de CA sin armadura.');
report('sorcerer-subclass-spell-tables', subclasses.classes['Hechicero'] && Object.values(subclasses.classes['Hechicero']).filter(sub=>sub.tables?.some(table=>table.columns?.some(col=>norm(col)==='conjuros'))).length===3, 'Las tres subclases con listas de conjuros tienen sus tablas progresivas registradas.');
report('warlock-cantrip-replacement', app.includes("isWarlockSpellProgression && oldClassCantripNames.length") && app.includes("puedes sustituir uno al subir de nivel"), 'El Brujo puede sustituir un truco en cada subida de nivel.');
report('cleric-cantrip-replacement', app.includes("isClericCantripProgression=className==='Clérigo' && nextLevel>=2") && app.includes('Al subir de nivel de clérigo puedes sustituir como máximo un truco') && app.includes("getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Clérigo'"), 'El Clérigo puede revisar sus trucos en cada subida y sustituir como máximo uno.');
report('cleric-protector-proficiencies', app.includes("b.className==='Clérigo' && b.classSpecialChoice==='Protector'?'Armaduras ligeras, medias y pesadas; escudos'") && app.includes("b.className==='Clérigo' && b.classSpecialChoice==='Protector'?'Armas sencillas y marciales'"), 'Protector registra armaduras pesadas y armas marciales en la ficha.');
report('druid-cantrip-replacement', app.includes("isDruidCantripProgression=className==='Druida' && nextLevel>=2") && app.includes('Al subir de nivel de druida puedes sustituir como máximo un truco') && app.includes("getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Druida'"), 'El Druida puede revisar sus trucos en cada subida y sustituir como máximo uno.');
report('druid-warden-proficiencies', app.includes("b.className==='Druida' && b.classSpecialChoice==='Guardián'?'Armaduras ligeras y medias; escudos'") && app.includes("b.className==='Druida' && b.classSpecialChoice==='Guardián'?'Armas sencillas y marciales'"), 'Guardián registra armaduras medias y armas marciales en la ficha.');
report('druid-speak-with-animals', app.includes('Hablar con los animales (siempre preparado por Druídico)') && app.includes('Druídico (siempre tienes Hablar con los animales preparado)'), 'Druídico añade Hablar con los animales a los conjuros siempre preparados de la ficha.');
report('druid-wild-shape-retention', app.includes('oldWildShapeForms.length>0 && retainedWildShapeForms<oldWildShapeForms.length-1') && app.includes('solo puedes sustituir una tras un descanso largo'), 'La subida de formas conocidas conserva las anteriores salvo una sustitución por descanso largo.');
report('wizard-school-spells-progression', app.includes('wizardSchoolBySubclass') && app.includes('wizardSchoolLevels=[3,5,7,9,11,13,15,17]') && app.includes('wizardSchoolTarget=oldWizardSchoolSpells.length+(nextLevel===3?3:1)') && app.includes("'Conjuros de escuela',wizardSchoolChoices.join(', ')"), 'El Mago añade tres conjuros de su escuela al nivel 3 y uno al desbloquear cada nuevo nivel de espacios, conservándolos en el libro.');
report('wizard-spellbook-unique-additions', app.includes('new Set(wizardBookAdditions.map(name=>normalizeLevelText(name))).size!==2') && app.includes('wizardSchoolNewChoices.some(name=>currentWizardBook.some'), 'El Mago no puede duplicar conjuros existentes al añadir los dos conjuros de nivel ni los conjuros de escuela.');
report('wizard-illusionist-bonus-cantrip', app.includes("needsWizardIllusionCantrip=className==='Mago' && wizardSubclassKey==='ilusionista' && nextLevel===3") && app.includes("setCharacterStat(updated,'CONJUROS','Trucos de subclase',bonusCantrip)") && app.includes('bind:value={levelUpWizardIllusionCantrip}'), 'Ilusionista obtiene Ilusión menor como truco adicional o elige otro truco de Mago si ya lo conoce.');
report('monk-body-and-mind-capstone', app.includes("if(className==='Monje' && nextLevel===20)") && app.includes("for(const ability of ['Destreza','Sabiduría'])") && app.includes('Math.min(25,value+4)') && app.includes('Cuerpo y mente: +4 Destreza y +4 Sabiduría (máximo 25)'), 'Monje aplica Cuerpo y mente al nivel 20: +4 a Destreza y Sabiduría, sin superar 25, y lo registra en el historial.');
report('paladin-fighting-style-choice', app.includes("needsPaladinStyle=className==='Paladín' && nextLevel>=2") && app.includes("'Estilo de combate de paladín',levelUpPaladinStyle") && app.includes('BUILDER_CLASS_DATA[\'Guerrero\'].specialOptions'), 'Paladín exige un estilo de combate al nivel 2 y permite sustituirlo al subir de nivel.');
report('paladin-lay-on-hands-pool', app.includes("setCharacterStat(result,'RASGOS Y DOTES','Reserva de Imposición de manos','5 PG')") && app.includes("setCharacterStat(updated,'RASGOS Y DOTES','Reserva de Imposición de manos',(5*nextLevel)+' PG')"), 'La reserva de Imposición de manos queda calculada en 5 PG por nivel, desde nivel 1 y en cada subida.');
report('paladin-always-prepared-spells', app.includes("nextLevel===2?['Castigo divino']") && app.includes("nextLevel===5?['Hallar corcel']") && app.includes("'Conjuros siempre preparados de clase'"), 'Castigo divino y Hallar corcel se registran como conjuros siempre preparados sin consumir el cupo de preparación.');
report('paladin-prepared-spell-validation', app.includes("isPaladinSpellProgression=className==='Paladín' && nextLevel>=2") && app.includes('isPaladinSpellProgression) && (new Set(classCantripNames.map(name=>normalizeLevelText(name))).size!==classCantripNames.length'), 'La progresión de conjuros del paladín rechaza duplicados y valida la lista de conjuros preparada.');
report('ranger-fighting-style', app.includes("needsRangerStyle=className==='Explorador' && nextLevel===2") && app.includes('Guerrero druídico · aprende dos trucos de Druida') && app.includes("'Estilo de combate',levelUpRangerStyle"), 'El Explorador elige una dote de Estilo de combate o Guerrero druídico al nivel 2.');
report('ranger-druidic-warrior-cantrips', app.includes('BUILDER_SPELL_LISTS.Druida.cantrips') && app.includes('oldRangerCantrips.length>0') && app.includes("'Trucos de estilo de combate',rangerCantripChoices.join"), 'Guerrero druídico registra dos trucos de Druida y permite sustituir uno por subida.');
report('ranger-hunter-choices', app.includes("needsHunterPrey=className==='Explorador'") && app.includes("needsHunterDefense=className==='Explorador'") && app.includes("'Opción de Cazador · nivel 3'") && app.includes("'Opción de Cazador · nivel 7'"), 'Cazador registra las elecciones de El cazador y la presa y Tácticas defensivas.');
report('ranger-fey-gift', app.includes('BUILDER_RANGER_FEY_GIFTS') && app.includes("'Bendición feérica',levelUpRangerFeyGift"), 'Errante feérico registra una dádiva de los Parajes Feéricos.');
report('ranger-beast-companion', app.includes('BUILDER_RANGER_BEAST_PROFILES') && app.includes("'Compañero primigenio','Perfil: '+levelUpRangerBeastProfile") && app.includes('Animal del compañero primigenio'), 'Señor de las bestias registra perfil, animal y estadísticas de la bestia primigenia.');

const rangerRows=progression.classes['Explorador']?.rows || [];
const rangerFeatures=classFeatures.classes['Explorador'] || [];
const rangerSubclasses=subclasses.classes['Explorador'] || {};
const rangerFeatureNames=(level)=>rangerFeatures.filter(feature=>feature.level===level).map(feature=>norm(feature.name));
const rangerExpectedFeatureLevels={1:['ENEMIGO PREDILECTO','LANZAMIENTO DE CONJUROS','MAESTRÍA CON ARMAS'],2:['ESTILO DE COMBATE','EXPLORADOR HÁBIL'],3:['SUBCLASE DE EXPLORADOR'],5:['ATAQUE ADICIONAL'],6:['ERRANTE'],9:['PERICIA'],10:['INFATIGABLE'],13:['CAZADOR PERSISTENTE'],14:['VELO DE LA NATURALEZA'],17:['CAZADOR PRECISO'],18:['SENTIDOS SALVAJES'],19:['DON ÉPICO'],20:['AZOTE DE ENEMIGOS']};
report('ranger-core-feature-levels',Object.entries(rangerExpectedFeatureLevels).every(([level,names])=>names.every(name=>rangerFeatureNames(Number(level)).includes(norm(name)))),'Los rasgos centrales del Explorador aparecen en los niveles correctos.');
const rangerPrepared=[2,3,4,5,6,6,7,7,9,9,10,10,11,11,12,12,14,14,15,15];
const rangerSlots={1:[2,0,0,0,0],2:[2,0,0,0,0],3:[3,0,0,0,0],4:[3,0,0,0,0],5:[4,2,0,0,0],6:[4,2,0,0,0],7:[4,3,0,0,0],8:[4,3,0,0,0],9:[4,3,2,0,0],10:[4,3,2,0,0],11:[4,3,3,0,0],12:[4,3,3,0,0],13:[4,3,3,1,0],14:[4,3,3,1,0],15:[4,3,3,2,0],16:[4,3,3,2,0],17:[4,3,3,3,1],18:[4,3,3,3,1],19:[4,3,3,3,2],20:[4,3,3,3,2]};
report('ranger-spell-slot-and-prepared-progression',rangerRows.length===20&&rangerRows.every((row,index)=>Number(row.resources?.['Conjuros preparados'])===rangerPrepared[index]&&[1,2,3,4,5].every((level)=>(row.resources?.['Espacios nivel '+level]==='—'?0:Number(row.resources?.['Espacios nivel '+level]||0))===rangerSlots[row.level][level-1])),'La cantidad de conjuros preparados y los espacios de nivel 1–5 coinciden con la tabla del Explorador.');
report('ranger-spellcasting-and-hunters-mark',app.includes("'Explorador':'Sabiduría'")&&app.includes('Marca del cazador (siempre preparado)')&&app.includes("b.className==='Explorador'?['Marca del cazador']:[]")&&app.includes("setCharacterStat(updated,'CONJUROS','Conjuros preparados máximos',classPreparedCount)"),'El Explorador usa Sabiduría, registra Marca del cazador como siempre preparado y actualiza el cupo al subir de nivel.');
report('ranger-explorador-habil-and-expertise',app.includes("const needsNewLanguages=/idiomas conoces dos idiomas/.test(normalizeLevelText(nextFeatureDescription))")&&app.includes('if(needsNewLanguages && (languageChoices.length!==2')&&app.includes("description.includes('ganas pericia en esa habilidad')")&&app.includes("setCharacterStat(updated,'COMPETENCIAS','Idiomas',[oldLanguages,...languageChoices]"),'Explorador hábil exige dos idiomas nuevos y registra la Pericia; el nivel 9 concede dos pericias adicionales.');
const rangerSubclassKeys=Object.keys(rangerSubclasses);
const rangerSubclassExpected={'ACECHADOR EN LA PENUMBRA':[3,3,3,7,11,15],'CAZADOR':[3,3,7,11,15],'ERRANTE FEÉRICO':[3,3,3,7,11,15],'SEÑOR DE LAS BESTIAS':[3,7,11,15]};
report('ranger-four-subclasses-and-levels',rangerSubclassKeys.length===4&&Object.entries(rangerSubclassExpected).every(([name,levels])=>{const sub=rangerSubclasses[name];return Boolean(sub)&&JSON.stringify(sub.features.map(feature=>feature.level))===JSON.stringify(levels); }),'Las cuatro subclases del Explorador contienen todos sus rasgos en los niveles 3, 7, 11 y 15 que corresponden.');
report('ranger-subclass-spell-lists',rangerSubclasses['ACECHADOR EN LA PENUMBRA']?.tables?.some(table=>JSON.stringify(table.rows)==='[["3","Disfrazarse"],["5","Truco de la cuerda"],["9","Terror"],["13","Invisibilidad mejorada"],["17","Apariencia"]]')&&rangerSubclasses['ERRANTE FEÉRICO']?.tables?.some(table=>JSON.stringify(table.rows)==='[["3","Hechizar persona"],["5","Paso brumoso"],["9","Invocar feérico"],["13","Puerta dimensional"],["17","Engañar"]]'),'Acechador en la penumbra y Errante feérico tienen sus cinco conjuros siempre preparados en los niveles correctos.');
report('ranger-fey-wanderer-choices',app.includes("needsFeySkill=isFeyWanderer && nextLevel===3")&&app.includes("['Engaño','Interpretación','Persuasión'].includes(levelUpSubclassSkill)")&&app.includes("if(needsBattleMasterTraining || needsFeySkill)")&&app.includes("setCharacterStat(updated,'RASGOS Y DOTES','Bendición feérica',levelUpRangerFeyGift)"),'Errante feérico exige la habilidad de Glamur sobrenatural y guarda la dádiva feérica elegida.');
report('ranger-hunter-advanced-features',norm(rangerSubclasses['CAZADOR']?.features?.find(feature=>feature.level===11)?.description).includes(norm('una vez por turno'))&&norm(rangerSubclasses['CAZADOR']?.features?.find(feature=>feature.level===15)?.description).includes(norm('resistencia a ese daño')),'Cazador incluye El cazador experto y la presa al nivel 11 y Defensa de cazador experto al 15.');
report('ranger-gloom-stalker-features',rangerSubclasses['ACECHADOR EN LA PENUMBRA']?.features?.some(feature=>feature.level===3&&norm(feature.name)==='emboscadorpavoroso')&&rangerSubclasses['ACECHADOR EN LA PENUMBRA']?.features?.some(feature=>feature.level===7&&norm(feature.name)==='mentedehierro')&&rangerSubclasses['ACECHADOR EN LA PENUMBRA']?.features?.some(feature=>feature.level===11&&norm(feature.name)==='oleadadelacechador')&&rangerSubclasses['ACECHADOR EN LA PENUMBRA']?.features?.some(feature=>feature.level===15&&norm(feature.name)==='esquivadelassombras'),'Acechador en la penumbra contiene Emboscador pavoroso, Mente de hierro, Oleada del acechador y Esquiva de las sombras.');
report('ranger-beast-companion-profiles',Object.keys(app.match(/const BUILDER_RANGER_BEAST_PROFILES[^;]+/s)?.[0]||'').length>0&&['Bestia de los mares','Bestia de tierra firme','Bestia del cielo'].every(name=>app.includes("'"+name+"'"))&&app.includes('PG 5 + cinco veces tu nivel de Explorador')&&app.includes('PG 4 + cuatro veces tu nivel de Explorador'),'Señor de las bestias dispone de los tres perfiles de compañero y escala sus puntos de golpe con el nivel.');

report('warlock-spell-replacement', app.includes("isWarlockSpellProgression && oldClassSpellNames.length") && app.includes("solo puedes sustituir un conjuro que ya conozcas"), 'El Brujo puede sustituir como máximo un conjuro conocido por nivel.');
const rogueRows=progression.classes['Pícaro']?.rows || [];
const rogueFeatures=classFeatures.classes['Pícaro'] || [];
const rogueSubclasses=subclasses.classes['Pícaro'] || {};
const rogueSneakAttack=[1,3,5,7,9,11,13,15,17,19].every((level,index)=>String(rogueRows.find(row=>row.level===level)?.resources?.['Ataque furtivo']||'')===`${index+1}d6`);
const arcaneTrickster=rogueSubclasses['EMBAUCADOR ARCANO'];
const arcaneTable=arcaneTrickster?.tables?.find(table=>table.name==='LANZAMIENTO DE CONJUROS DEL EMBAUCADOR ARCANO');
report('rogue-expertise-creation', app.includes("builderData.className === 'Pícaro'") && app.includes('builderData.classExpertise.length}/{2}') && app.includes("'Pericia: ' + b.classExpertise.join"), 'La creación del pícaro exige dos pericias entre habilidades en las que ya tiene competencia y las guarda en la ficha.');
report('rogue-expertise-level-six', app.includes("name.includes('pericia')?2") && app.includes("'Pericia: '+[...oldExpertiseList,...expertiseChoices].join(', ')"), 'La subida al nivel 6 solicita dos pericias adicionales, conserva las anteriores y evita repetir habilidades.');
report('rogue-sneak-attack-progression', rogueRows.length===20 && rogueSneakAttack && app.includes("for (const [resourceName,resourceValue] of resourceEntries) setCharacterStat(updated,'PROGRESIÓN',resourceName,String(resourceValue ?? '—'))"), 'Ataque furtivo progresa de 1d6 a 10d6 en los niveles impares del pícaro y se refleja en la ficha.');
report('rogue-arcane-trickster-spellcasting', !!arcaneTable && arcaneTable.rows.length===18 && arcaneTable.rows[0][1]==='3' && arcaneTable.rows[17][1]==='13' && app.includes("className==='Pícaro'?(nextLevel>=10?4:3):0") && app.includes('subclassSpellNames.some(name=>!isValidClassSpell(name,subclassList,subclassMaxSpellLevel))'), 'Embaucador arcano valida trucos, conjuros, espacios y progresión de conjuros preparados del nivel 3 al 20.');
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
        .filter(([, name]) => !name.startsWith(norm('conjurosdel')) &&
          name !== norm('Conjuros de acechador') && name !== norm('Conjuros de errante feérico'));
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


  const barbarianAspectChoice = choiceFile.choices.find((choice) => choice.id === 'barbarian.wildHeart.aspect');
  const wildHeartSubclass = Object.keys(subclasses.classes?.['Bárbaro'] ?? {}).find((name) => norm(name) === norm('SENDA DEL CORAZÓN SALVAJE'));
  const levelTextNorm = (value) => String(value ?? '').normalize('NFD').split('').filter((character) => character.charCodeAt(0) < 768 || character.charCodeAt(0) > 879).join('').toLowerCase().trim();
  report('barbarian-wild-heart-aspect-level-six',
    Boolean(barbarianAspectChoice && wildHeartSubclass &&
      levelTextNorm(barbarianAspectChoice.subclass) === levelTextNorm(wildHeartSubclass) &&
      barbarianAspectChoice.level === 6 &&
      app.includes('needsBarbarianWildAspect') &&
      app.includes('levelUpBarbarianAspect')),
    'Aspecto de lo salvaje debe mostrarse, validarse y guardarse al subir al nivel 6 de la Senda del corazón salvaje.');

  report('builder-creation-validation-and-preview',
    app.includes('function builderStepCanAdvance()') &&
    app.includes('function builderCanFinish()') &&
    app.includes('disabled={!builderCanFinish()}') &&
    app.includes('function finishBuilder()') &&
    app.includes('builderStep = 6'),
    'La creación valida los seis pasos, bloquea la generación incompleta y permite revisar la ficha antes de exportarla.');

  report('builder-equipment-options-explicit',
    app.includes('<b>A — Equipo inicial:</b>') &&
    app.includes("builderData.className === 'Guerrero' ? 'Equipo alternativo' : 'Oro'") &&
    app.includes('C — Oro:</b> 155 po') &&
    app.includes('recibes estas monedas en lugar de los objetos del equipo A'),
    'Las opciones de equipo A, B y C explican qué objetos o monedas recibe el personaje.');

  report('level-up-preserves-and-records-progression',
    app.includes("setCharacterStat(updated,'PROGRESIÓN','Historial de niveles'") &&
    app.includes("setCharacterStat(updated,'PROGRESIÓN','Recursos según tabla de clase'") &&
    app.includes("setCharacterStat(updated,'PROGRESIÓN','Rasgos de subclase acumulados'") &&
    app.includes("setCharacterStat(updated,'PERSONAJE','Nivel'") &&
    app.includes('refreshDerivedCharacterSheet(updated)'),
    'La subida conserva el historial, actualiza recursos y rasgos de subclase y recalcula los valores derivados de la ficha.');

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
