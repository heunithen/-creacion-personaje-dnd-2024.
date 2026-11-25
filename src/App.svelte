<script lang="ts">
  import { onMount } from 'svelte';
  import OBR from '@owlbear-rodeo/sdk';

  const KEY = 'com.heunithen.dnd2024-character-builder/character';
  const CHANNEL = 'com.heunithen.dnd2024-character-builder/character-sync';

  type RawStat = { id?: number; name?: string; value?: unknown; [key: string]: unknown };
  type RawSection = { id?: number; name?: string; stats?: RawStat[]; [key: string]: unknown };
  type RawSheet = { id?: number; name?: string; notes?: string; sections?: RawSection[]; [key: string]: unknown };
  type RoomEntry = { playerId: string; playerName: string; sheet: RawSheet };

  let sheet: RawSheet | null = null;
  let roomSheets: RoomEntry[] = [];
  let importOpen = false;
  let notice = '';
  let obrReady = false;
  let obrRole = '';
  let playerName = '';
  let activeTab = 'Todas';
  let monsterCrFilter = 'Todos';
  let monsterSearch = '';
  let itemSearch = '';
  let itemTypeFilter = 'Todos';
  let itemPriceMin = '';
  let itemPriceMax = '';
  let itemWeightMin = '';
  let itemWeightMax = '';
  let spellSearch = '';
  let rulesSearch = '';
  let rulesCategoryFilter = 'Todas';
  let spellLevelFilter = 'Todos';
  let spellClassFilter = 'Todas';
  let spellSchoolFilter = 'Todas';

  let syncStatus = 'Owlbear Rodeo no está conectado.';
  let autoSyncTimer: ReturnType<typeof setTimeout>;
  let syncInProgress = false;
  let syncPending = false;
  let fileInput: HTMLInputElement;
  type RollPart = { id: string; name: string; die: number; bonus: number };
  type CustomRoll = { id: string; name: string; parts: RollPart[] };
  const CHEST_LOOT = [
  {
    "number": 1,
    "category": "Poción",
    "name": "Poción de curación suprema",
    "price": 20000,
    "priceLabel": "20.000 po"
  },
  {
    "number": 2,
    "category": "Poción",
    "name": "Poción de velocidad",
    "price": 20000,
    "priceLabel": "20.000 po"
  },
  {
    "number": 3,
    "category": "Poción",
    "name": "Poción de vuelo",
    "price": 20000,
    "priceLabel": "20.000 po"
  },
  {
    "number": 4,
    "category": "Poción",
    "name": "Poción de curación superior",
    "price": 2000,
    "priceLabel": "2.000 po"
  },
  {
    "number": 5,
    "category": "Poción",
    "name": "Poción de invisibilidad",
    "price": 2000,
    "priceLabel": "2.000 po"
  },
  {
    "number": 6,
    "category": "Armadura",
    "name": "Armadura de placas",
    "price": 1500,
    "priceLabel": "1.500 po"
  },
  {
    "number": 7,
    "category": "Armadura",
    "name": "Media armadura",
    "price": 750,
    "priceLabel": "750 po"
  },
  {
    "number": 8,
    "category": "Armadura",
    "name": "Coraza",
    "price": 400,
    "priceLabel": "400 po"
  },
  {
    "number": 9,
    "category": "Pergamino",
    "name": "Pergamino de conjuro de nivel 3",
    "price": 300,
    "priceLabel": "300 po"
  },
  {
    "number": 10,
    "category": "Monedas",
    "name": "Montículo de 200 monedas de oro",
    "price": 200,
    "priceLabel": "200 po"
  },
  {
    "number": 11,
    "category": "Pergamino",
    "name": "Pergamino de conjuro de nivel 2",
    "price": 200,
    "priceLabel": "200 po"
  },
  {
    "number": 12,
    "category": "Poción",
    "name": "Poción de curación mayor",
    "price": 200,
    "priceLabel": "200 po"
  },
  {
    "number": 13,
    "category": "Poción",
    "name": "Poción de fuerza de gigante de las colinas",
    "price": 200,
    "priceLabel": "200 po"
  },
  {
    "number": 14,
    "category": "Poción",
    "name": "Poción de resistencia al ácido",
    "price": 200,
    "priceLabel": "200 po"
  },
  {
    "number": 15,
    "category": "Poción",
    "name": "Poción de resistencia al rayo",
    "price": 200,
    "priceLabel": "200 po"
  },
  {
    "number": 16,
    "category": "Poción",
    "name": "Poción de resistencia al daño necrótico",
    "price": 200,
    "priceLabel": "200 po"
  },
  {
    "number": 17,
    "category": "Poción",
    "name": "Poción de resistencia al daño radiante",
    "price": 200,
    "priceLabel": "200 po"
  },
  {
    "number": 18,
    "category": "Poción",
    "name": "Poción de resistencia al frío",
    "price": 200,
    "priceLabel": "200 po"
  },
  {
    "number": 19,
    "category": "Poción",
    "name": "Poción de resistencia al fuego",
    "price": 200,
    "priceLabel": "200 po"
  },
  {
    "number": 20,
    "category": "Poción",
    "name": "Poción de resistencia al trueno",
    "price": 200,
    "priceLabel": "200 po"
  },
  {
    "number": 21,
    "category": "Poción",
    "name": "Poción de resistencia al veneno",
    "price": 200,
    "priceLabel": "200 po"
  },
  {
    "number": 22,
    "category": "Poción",
    "name": "Poción de respiración acuática",
    "price": 200,
    "priceLabel": "200 po"
  },
  {
    "number": 23,
    "category": "Monedas",
    "name": "Montículo de 150 monedas de oro",
    "price": 150,
    "priceLabel": "150 po"
  },
  {
    "number": 24,
    "category": "Monedas",
    "name": "Montículo de 125 monedas de oro",
    "price": 125,
    "priceLabel": "125 po"
  },
  {
    "number": 25,
    "category": "Monedas",
    "name": "Montículo de 100 monedas de oro",
    "price": 100,
    "priceLabel": "100 po"
  },
  {
    "number": 26,
    "category": "Consumible",
    "name": "Veneno básico (vial)",
    "price": 100,
    "priceLabel": "100 po"
  },
  {
    "number": 27,
    "category": "Armadura",
    "name": "Cota de malla",
    "price": 75,
    "priceLabel": "75 po"
  },
  {
    "number": 28,
    "category": "Monedas",
    "name": "Montículo de 75 monedas de oro",
    "price": 75,
    "priceLabel": "75 po"
  },
  {
    "number": 29,
    "category": "Monedas",
    "name": "Montículo de 60 monedas de oro",
    "price": 60,
    "priceLabel": "60 po"
  },
  {
    "number": 30,
    "category": "Armadura",
    "name": "Camisote de malla",
    "price": 50,
    "priceLabel": "50 po"
  },
  {
    "number": 31,
    "category": "Armadura",
    "name": "Cota de escamas",
    "price": 50,
    "priceLabel": "50 po"
  },
  {
    "number": 32,
    "category": "Consumible",
    "name": "Fuego de alquimista (frasco)",
    "price": 50,
    "priceLabel": "50 po"
  },
  {
    "number": 33,
    "category": "Monedas",
    "name": "Montículo de 50 monedas de oro",
    "price": 50,
    "priceLabel": "50 po"
  },
  {
    "number": 34,
    "category": "Pergamino",
    "name": "Pergamino de conjuro de nivel 1",
    "price": 50,
    "priceLabel": "50 po"
  },
  {
    "number": 35,
    "category": "Poción",
    "name": "Poción de curación",
    "price": 50,
    "priceLabel": "50 po"
  },
  {
    "number": 36,
    "category": "Poción",
    "name": "Poción de escalada",
    "price": 50,
    "priceLabel": "50 po"
  },
  {
    "number": 37,
    "category": "Herramienta",
    "name": "Suministros de alquimista",
    "price": 50,
    "priceLabel": "50 po"
  },
  {
    "number": 38,
    "category": "Armadura",
    "name": "Armadura de cuero tachonado",
    "price": 45,
    "priceLabel": "45 po"
  },
  {
    "number": 39,
    "category": "Monedas",
    "name": "Montículo de 40 monedas de oro",
    "price": 40,
    "priceLabel": "40 po"
  },
  {
    "number": 40,
    "category": "Monedas",
    "name": "Montículo de 30 monedas de oro",
    "price": 30,
    "priceLabel": "30 po"
  },
  {
    "number": 41,
    "category": "Arma",
    "name": "Arco corto",
    "price": 25,
    "priceLabel": "25 po"
  },
  {
    "number": 42,
    "category": "Arma",
    "name": "Ballesta ligera",
    "price": 25,
    "priceLabel": "25 po"
  },
  {
    "number": 43,
    "category": "Consumible",
    "name": "Frasco de ácido",
    "price": 25,
    "priceLabel": "25 po"
  },
  {
    "number": 44,
    "category": "Consumible",
    "name": "Frasco de agua bendita",
    "price": 25,
    "priceLabel": "25 po"
  },
  {
    "number": 45,
    "category": "Herramienta",
    "name": "Herramientas de ladrón",
    "price": 25,
    "priceLabel": "25 po"
  },
  {
    "number": 46,
    "category": "Equipo",
    "name": "Kit de disfraz",
    "price": 25,
    "priceLabel": "25 po"
  },
  {
    "number": 47,
    "category": "Equipo",
    "name": "Kit de escalada",
    "price": 25,
    "priceLabel": "25 po"
  },
  {
    "number": 48,
    "category": "Monedas",
    "name": "Montículo de 25 monedas de oro",
    "price": 25,
    "priceLabel": "25 po"
  },
  {
    "number": 49,
    "category": "Monedas",
    "name": "Montículo de 20 monedas de oro",
    "price": 20,
    "priceLabel": "20 po"
  },
  {
    "number": 50,
    "category": "Arma",
    "name": "Espada larga",
    "price": 15,
    "priceLabel": "15 po"
  },
  {
    "number": 51,
    "category": "Consumible",
    "name": "Antorcha",
    "price": 0.01,
    "priceLabel": "1 pc"
  },
  {
    "number": 52,
    "category": "Munición",
    "name": "20 balas de honda",
    "price": 0.04,
    "priceLabel": "4 pc"
  },
  {
    "number": 53,
    "category": "Consumible",
    "name": "Aceite (frasco)",
    "price": 0.1,
    "priceLabel": "10 pc"
  },
  {
    "number": 54,
    "category": "Equipo",
    "name": "Escalera (3 m)",
    "price": 0.1,
    "priceLabel": "10 pc"
  },
  {
    "number": 55,
    "category": "Arma",
    "name": "Honda",
    "price": 0.1,
    "priceLabel": "10 pc"
  },
  {
    "number": 56,
    "category": "Arma",
    "name": "Bastón",
    "price": 0.2,
    "priceLabel": "20 pc"
  },
  {
    "number": 57,
    "category": "Arma",
    "name": "Garrote grande",
    "price": 0.2,
    "priceLabel": "20 pc"
  },
  {
    "number": 58,
    "category": "Equipo",
    "name": "Frasco de aceite x5",
    "price": 0.5,
    "priceLabel": "50 pc"
  },
  {
    "number": 59,
    "category": "Arma",
    "name": "Jabalina",
    "price": 0.5,
    "priceLabel": "50 pc"
  },
  {
    "number": 60,
    "category": "Equipo",
    "name": "Lámpara",
    "price": 0.5,
    "priceLabel": "50 pc"
  },
  {
    "number": 61,
    "category": "Equipo",
    "name": "Manta",
    "price": 0.5,
    "priceLabel": "50 pc"
  },
  {
    "number": 62,
    "category": "Equipo",
    "name": "Yesquero",
    "price": 0.5,
    "priceLabel": "50 pc"
  },
  {
    "number": 63,
    "category": "Munición",
    "name": "20 flechas",
    "price": 1,
    "priceLabel": "1 po"
  },
  {
    "number": 64,
    "category": "Munición",
    "name": "20 virotes",
    "price": 1,
    "priceLabel": "1 po"
  },
  {
    "number": 65,
    "category": "Equipo",
    "name": "Abrojos (bolsa)",
    "price": 1,
    "priceLabel": "1 po"
  },
  {
    "number": 66,
    "category": "Equipo",
    "name": "Bolas de metal (bolsa)",
    "price": 1,
    "priceLabel": "1 po"
  },
  {
    "number": 67,
    "category": "Equipo",
    "name": "Campana de alarma",
    "price": 1,
    "priceLabel": "1 po"
  },
  {
    "number": 68,
    "category": "Equipo",
    "name": "Capa",
    "price": 1,
    "priceLabel": "1 po"
  },
  {
    "number": 69,
    "category": "Equipo",
    "name": "Cuerda de cáñamo (15 m)",
    "price": 1,
    "priceLabel": "1 po"
  },
  {
    "number": 70,
    "category": "Arma",
    "name": "Lanza",
    "price": 1,
    "priceLabel": "1 po"
  },
  {
    "number": 71,
    "category": "Equipo",
    "name": "Martillo",
    "price": 1,
    "priceLabel": "1 po"
  },
  {
    "number": 72,
    "category": "Equipo",
    "name": "Red",
    "price": 1,
    "priceLabel": "1 po"
  },
  {
    "number": 73,
    "category": "Arma",
    "name": "Daga",
    "price": 2,
    "priceLabel": "2 po"
  },
  {
    "number": 74,
    "category": "Equipo",
    "name": "Garfio",
    "price": 2,
    "priceLabel": "2 po"
  },
  {
    "number": 75,
    "category": "Equipo",
    "name": "Grilletes",
    "price": 2,
    "priceLabel": "2 po"
  },
  {
    "number": 76,
    "category": "Equipo",
    "name": "Pala",
    "price": 2,
    "priceLabel": "2 po"
  },
  {
    "number": 77,
    "category": "Equipo",
    "name": "Palanqueta",
    "price": 2,
    "priceLabel": "2 po"
  },
  {
    "number": 78,
    "category": "Equipo",
    "name": "Pico de minero",
    "price": 2,
    "priceLabel": "2 po"
  },
  {
    "number": 79,
    "category": "Equipo",
    "name": "Cuerno",
    "price": 3,
    "priceLabel": "3 po"
  },
  {
    "number": 80,
    "category": "Armadura",
    "name": "Armadura acolchada",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 81,
    "category": "Equipo",
    "name": "Bolsa de abrojos reforzada",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 82,
    "category": "Equipo",
    "name": "Cadena (3 m)",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 83,
    "category": "Equipo",
    "name": "Espejo de acero",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 84,
    "category": "Arma",
    "name": "Hacha de mano",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 85,
    "category": "Equipo",
    "name": "Kit de sanador",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 86,
    "category": "Equipo",
    "name": "Linterna sorda",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 87,
    "category": "Arma",
    "name": "Maza",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 88,
    "category": "Monedas",
    "name": "Puñado de 5 monedas de oro",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 89,
    "category": "Herramienta",
    "name": "Suministros de herborista",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 90,
    "category": "Equipo",
    "name": "Trampa de caza",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 91,
    "category": "Arma",
    "name": "Tridente",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 92,
    "category": "Armadura",
    "name": "Armadura de cuero",
    "price": 10,
    "priceLabel": "10 po"
  },
  {
    "number": 93,
    "category": "Equipo",
    "name": "Cuerda de seda (15 m)",
    "price": 10,
    "priceLabel": "10 po"
  },
  {
    "number": 94,
    "category": "Armadura",
    "name": "Escudo",
    "price": 10,
    "priceLabel": "10 po"
  },
  {
    "number": 95,
    "category": "Arma",
    "name": "Espada corta",
    "price": 10,
    "priceLabel": "10 po"
  },
  {
    "number": 96,
    "category": "Arma",
    "name": "Hacha de batalla",
    "price": 10,
    "priceLabel": "10 po"
  },
  {
    "number": 97,
    "category": "Equipo",
    "name": "Linterna de ojo de buey",
    "price": 10,
    "priceLabel": "10 po"
  },
  {
    "number": 98,
    "category": "Monedas",
    "name": "Pequeño montículo de 10 monedas de oro",
    "price": 10,
    "priceLabel": "10 po"
  },
  {
    "number": 99,
    "category": "Arma",
    "name": "Martillo de guerra",
    "price": 15,
    "priceLabel": "15 po"
  },
  {
    "number": 100,
    "category": "Monedas",
    "name": "Montículo de 15 monedas de oro",
    "price": 15,
    "priceLabel": "15 po"
  }
];
  import LEVEL_PROGRESSION from './levelProgression.json';
  import SUBCLASS_PROGRESSION from './subclassProgression.json';
  import CLASS_FEATURES from './classFeatures.json';
  import LEVEL_UP_CHOICE_DEFINITIONS from './levelUpChoiceDefinitions.json';
  import { findLevelUpChoice, getLevelUpChoiceOptions, validateSingleLevelUpChoice, validateMultipleLevelUpChoice, type LevelUpChoiceDefinition } from './levelUpChoiceEngine';
  function levelUpChoice(id:string):LevelUpChoiceDefinition|undefined { return findLevelUpChoice((LEVEL_UP_CHOICE_DEFINITIONS as any).choices as LevelUpChoiceDefinition[],id); }
  let levelUpEntry: RoomEntry | null = null;
  let levelUpDecision = '';
  let levelUpClassCantrips = '';
  let levelUpClassSpells = '';
  let levelUpWizardBookAdditions = '';
  let levelUpExpertise = '';
  let levelUpNewSkill = '';
  let levelUpLanguages = '';
  let levelUpMetamagic = '';
  let levelUpInvocations = '';
  let levelUpMysticArcanum = '';
  let levelUpElementalFury = '';
  let levelUpSorcererAffinity = '';
  let levelUpBlessedStrikes = '';
  let levelUpWizardMastery1 = '';
  let levelUpWizardMastery2 = '';
  let levelUpWizardSignatureSpells = '';
  let levelUpSubclassSkill = '';
  let levelUpSubclassSkills = '';
  let levelUpSubclassTool = '';
  let levelUpManeuvers = '';
  let levelUpWizardSchoolSpells = '';
  let levelUpWizardIllusionCantrip = '';
  let levelUpWildShapeForms = '';
  let levelUpWeaponMasteries = '';
  let levelUpSubclass = '';
  let levelUpSubclassVariant = '';
  let levelUpBarbarianAspect = '';
  let levelUpRangerStyle = '';
  let levelUpPaladinStyle = '';
  let levelUpFighterStyles = '';
  let levelUpRangerCantrips = '';
  let levelUpRangerHunterPrey = '';
  let levelUpRangerHunterDefense = '';
  let levelUpRangerFeyGift = '';
  let levelUpRangerBeastProfile = '';
  let levelUpRangerBeastAnimal = '';
  let levelUpSubclassCantrips = '';
  let levelUpSubclassSpells = '';
  let levelUpAsiMode = 'asi';
  let levelUpAbility1 = 'Fuerza';
  let levelUpAbility2 = 'Destreza';
  let levelUpIncrease1 = '2';
  let levelUpIncrease2 = '0';
  let levelUpFeat = '';
  let levelUpEpicFeatAbility = 'Fuerza';
  let levelUpHpMode = 'average';
  let levelUpHpRoll = '';
  let lastChestRoll: { total: number; dice: number[]; lootNumber: number; category: string; name: string; priceLabel: string } | null = null;
  function rollChestLoot() {
    const dice = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10) + 1);
    const total = dice.reduce((sum, value) => sum + value, 0);
    // Los extremos (10 y 100) apuntan a los extremos de la tabla.
    // El centro (55) apunta a los objetos más baratos del centro.
    const lootNumber = Math.min(100, Math.max(1, Math.round(((total - 10) / 90) * 99) + 1));
    const loot = CHEST_LOOT[lootNumber - 1];
    lastChestRoll = { total, dice, lootNumber, category: loot.category, name: loot.name, priceLabel: loot.priceLabel };
  }

  let masterTab = 'Personajes';
  const masterTabs = ['Personajes', 'Tiradas', 'Cofres', 'Objetos', 'Monstruos ordenados', 'Conjuros', 'Reglas'];
  type BuilderData = {
    name: string; player: string; className: string; species: string; background: string;
    alignment: string; method: string; abilities: Record<string, number>; feat: string;
    abilityIncreaseMode: 'two' | 'three'; abilityIncrease2: string; abilityIncrease1: string;
    abilityIncrease3: string; backgroundEquipment: 'A' | 'B'; backgroundToolChoice: string; classEquipmentChoice: string;
    classSkillChoices: string[]; classToolsChoices: string[]; classSpecialChoice: string; classExpertise: string[];
    weaponMasteries: string[]; selectedCantrips: string[]; selectedSpells: string[];
    wizardSpellbook: string[]; speciesChoice: string; speciesMagicAbility: string;
    speciesSkill: string; speciesExtraFeat: string; speciesSize: string; speciesBreathShape: string;
    backgroundFeatChoices: string[]; speciesFeatChoices: string[]; languages: string[]; rogueLanguage: string;
    backgroundMagicCantrips: string[]; backgroundMagicSpell: string; backgroundMagicAbility: string;
    warlockTomeCantrips: string[]; warlockTomeRituals: string[];
    speciesMagicCantrips: string[]; speciesMagicSpell: string; speciesFeatMagicAbility: string; skills: string; tools: string; equipment: string; traits: string; spells: string; notes: string;
  };

  // Listas originales inspiradas en las tradiciones onomásticas de cada especie.
  // El Manual del Jugador 2024 no incluye tablas oficiales de nombres.
  const CHARACTER_NAME_POOLS: Record<string, Record<string, string[]>> = {
  "Aasimar": {
    "Hombre": [
      "Aurelian",
      "Cael",
      "Elyon",
      "Ithriel",
      "Lucan",
      "Seraphel"
    ],
    "Mujer": [
      "Aurelia",
      "Celestine",
      "Elaria",
      "Ilyana",
      "Liora",
      "Seraphine"
    ],
    "Otro": [
      "Auren",
      "Caelis",
      "Elyris",
      "Iriel",
      "Lumen",
      "Solari"
    ]
  },
  "Dracónido": {
    "Hombre": [
      "Arjhan",
      "Balasar",
      "Kriv",
      "Rhazien",
      "Torinn",
      "Verth"
    ],
    "Mujer": [
      "Akra",
      "Biri",
      "Daar",
      "Kava",
      "Mishann",
      "Sora"
    ],
    "Otro": [
      "Arix",
      "Keth",
      "Riven",
      "Sszar",
      "Vaerix",
      "Zyr"
    ]
  },
  "Enano": {
    "Hombre": [
      "Balin",
      "Dain",
      "Eberk",
      "Fargrim",
      "Harbek",
      "Tordek"
    ],
    "Mujer": [
      "Amber",
      "Diesa",
      "Eldeth",
      "Gunnloda",
      "Kathra",
      "Vistra"
    ],
    "Otro": [
      "Bryn",
      "Durna",
      "Kelda",
      "Orin",
      "Runa",
      "Thrain"
    ]
  },
  "Elfo": {
    "Hombre": [
      "Aelar",
      "Erevan",
      "Galinndan",
      "Hadarai",
      "Immeral",
      "Theren"
    ],
    "Mujer": [
      "Adrie",
      "Althaea",
      "Anastrianna",
      "Leshanna",
      "Quelenna",
      "Shava"
    ],
    "Otro": [
      "Aeris",
      "Eirian",
      "Lethar",
      "Nim",
      "Sael",
      "Vaelis"
    ]
  },
  "Gnomo": {
    "Hombre": [
      "Alston",
      "Boddynock",
      "Fonkin",
      "Gimble",
      "Namfoodle",
      "Zook"
    ],
    "Mujer": [
      "Bimpnottin",
      "Caramip",
      "Duvamil",
      "Loopmottin",
      "Nissa",
      "Roywyn"
    ],
    "Otro": [
      "Bree",
      "Dimble",
      "Nackle",
      "Pip",
      "Quill",
      "Wizzle"
    ]
  },
  "Goliat": {
    "Hombre": [
      "Aukan",
      "Eglath",
      "Gae-Al",
      "Ilikan",
      "Kavaki",
      "Thalai"
    ],
    "Mujer": [
      "Araki",
      "Bera",
      "Golka",
      "Ira",
      "Keothi",
      "Manath"
    ],
    "Otro": [
      "Asha",
      "Eryx",
      "Kori",
      "Maka",
      "Rokan",
      "Tala"
    ]
  },
  "Mediano": {
    "Hombre": [
      "Alton",
      "Beau",
      "Cade",
      "Eldon",
      "Garret",
      "Milo"
    ],
    "Mujer": [
      "Andry",
      "Bree",
      "Callie",
      "Kithri",
      "Lidda",
      "Rosie"
    ],
    "Otro": [
      "Ash",
      "Bramble",
      "Merry",
      "Perrin",
      "Reed",
      "Tumble"
    ]
  },
  "Humano": {
    "Hombre": [
      "Aldric",
      "Darian",
      "Edric",
      "Gareth",
      "Jonas",
      "Tomas"
    ],
    "Mujer": [
      "Alda",
      "Elena",
      "Isabel",
      "Mara",
      "Sofia",
      "Talia"
    ],
    "Otro": [
      "Ari",
      "Ciel",
      "Morgan",
      "Noa",
      "Ren",
      "Sasha"
    ]
  },
  "Orco": {
    "Hombre": [
      "Drog",
      "Grommash",
      "Korg",
      "Mauhur",
      "Thokk",
      "Urzog"
    ],
    "Mujer": [
      "Baggi",
      "Eri",
      "Grisha",
      "Myev",
      "Neega",
      "Ovak"
    ],
    "Otro": [
      "Ashnak",
      "Gor",
      "Krag",
      "Ruk",
      "Sharn",
      "Zog"
    ]
  },
  "Tiefling": {
    "Hombre": [
      "Akmenos",
      "Damaks",
      "Kairon",
      "Morthos",
      "Therai",
      "Zariel"
    ],
    "Mujer": [
      "Akta",
      "Bryseis",
      "Criella",
      "Lerissa",
      "Makaria",
      "Nemeia"
    ],
    "Otro": [
      "Astar",
      "Ixis",
      "Keryx",
      "Nym",
      "Riven",
      "Zareth"
    ]
  }
};
  let nameGender = 'Hombre';
  let lastGeneratedName = '';
  function generateCharacterName() {
    const options = CHARACTER_NAME_POOLS[builderData.species]?.[nameGender] || CHARACTER_NAME_POOLS['Humano'][nameGender];
    const name = options[Math.floor(Math.random() * options.length)];
    builderData.name = name;
    lastGeneratedName = name;
  }
  let builderStep = 0;
  let builderRolledScores: number[] = [];
  let builderPreview: RawSheet | null = null;

  let playerCreating = false;
  let demoPreview = false;
  let builderSaving = false;
  const createInitialBuilderData = (): BuilderData => ({
    name: '', player: '', className: 'Guerrero', species: 'Humano', background: 'Soldado',
    alignment: 'Neutral', method: 'standard',
    abilities: { Fuerza: 15, Destreza: 14, Constitución: 13, Inteligencia: 12, Sabiduría: 10, Carisma: 8 },
    feat: 'Atacante salvaje', abilityIncreaseMode: 'two', abilityIncrease2: 'Fuerza', abilityIncrease1: 'Destreza', abilityIncrease3: 'Constitución', backgroundEquipment: 'A', backgroundToolChoice: '', classEquipmentChoice: 'A', classSkillChoices: [], classToolsChoices: [], classSpecialChoice: '', classExpertise: [], weaponMasteries: [], selectedCantrips: [], selectedSpells: [], wizardSpellbook: [], speciesChoice: '', speciesMagicAbility: '', speciesSkill: '', speciesExtraFeat: 'Habilidoso', speciesSize: '', speciesBreathShape: 'Cono', backgroundFeatChoices: [], speciesFeatChoices: [], languages: [], rogueLanguage: '', backgroundMagicCantrips: [], backgroundMagicSpell: '', backgroundMagicAbility: 'Inteligencia', warlockTomeCantrips: [], warlockTomeRituals: [], speciesMagicCantrips: [], speciesMagicSpell: '', speciesFeatMagicAbility: 'Inteligencia', skills: '', tools: '', equipment: '', traits: '', spells: '', notes: ''
  });
  let builderData: BuilderData = createInitialBuilderData();
  function resetBuilder() {
    builderData = createInitialBuilderData();
    builderData.player = playerName || '';
    builderStep = 0; builderRolledScores = []; builderPreview = null; builderStepError = ''; lastGeneratedName = '';
  }
  const BUILDER_CLASSES = ['Bárbaro','Bardo','Brujo','Clérigo','Druida','Explorador','Guerrero','Hechicero','Mago','Monje','Paladín','Pícaro'];
  const BUILDER_SPECIES = ['Aasimar','Dracónido','Enano','Elfo','Gnomo','Goliat','Mediano','Humano','Orco','Tiefling'];
  const BUILDER_BACKGROUNDS = ['Acólito','Animador','Artesano','Campesino','Charlatán','Comerciante','Criminal','Ermitaño','Erudito','Escriba','Guardia','Guía','Marinero','Noble','Soldado','Vagabundo'];
  const BUILDER_FEATS = ['Alerta','Afortunado','Atacante salvaje','Duro','Fabricante','Habilidoso','Iniciado en la magia (Clérigo)','Iniciado en la magia (Druida)','Iniciado en la magia (Mago)','Matón de taberna','Músico','Sanador'];
  const BUILDER_EPIC_FEATS = ['Don de la fortaleza','Don de la habilidad','Don de la pericia en combate','Don de la recuperación','Don de la resistencia a energías','Don de la velocidad','Don de la visión verdadera','Don del ataque imparable','Don del destino','Don del espíritu de la noche','Don del recuerdo de conjuros','Don del viaje dimensional'];
  function builderEpicFeatAbilities(feat:string):string[] {
    const key=normalizeLevelText(feat);
    if(key==='don del ataque imparable') return ['Fuerza','Destreza'];
    if(key==='don del recuerdo de conjuros') return ['Inteligencia','Sabiduría','Carisma'];
    return BUILDER_ABILITY_NAMES;
  }
  const BUILDER_BACKGROUND_TOOL_OPTIONS: Record<string,string[]> = {
    'Animador':['Chirimía','Cuerno','Dulcémele','Flauta','Flauta de pan','Gaita','Laúd','Lira','Tambor','Viola'],
    'Artesano':['Herramientas de albañil','Herramientas de alfarero','Herramientas de carpintero','Herramientas de cartógrafo','Herramientas de curtidor','Herramientas de ebanista','Herramientas de herrero','Herramientas de joyero','Herramientas de manitas','Herramientas de soplador de vidrio','Herramientas de tejedor','Herramientas de zapatero'],
    'Guardia':['Ajedrez dragón','Apuesta de los tres dragones','Dados','Naipes'],
    'Noble':['Ajedrez dragón','Apuesta de los tres dragones','Dados','Naipes'],
    'Soldado':['Ajedrez dragón','Apuesta de los tres dragones','Dados','Naipes']
  };
  const BUILDER_CLASS_SKILLS: Record<string,{count:number;options:string[]}> = {
    'Bárbaro':{count:2,options:['Atletismo','Intimidación','Naturaleza','Percepción','Supervivencia','Trato con animales']},
    'Bardo':{count:3,options:['Acrobacias','Atletismo','Conocimiento arcano','Engaño','Historia','Interpretación','Intimidación','Investigación','Juego de manos','Medicina','Naturaleza','Perspicacia','Persuasión','Percepción','Religión','Sigilo','Supervivencia','Trato con animales']},
    'Brujo':{count:2,options:['Conocimiento arcano','Engaño','Historia','Intimidación','Investigación','Naturaleza','Religión']},
    'Clérigo':{count:2,options:['Historia','Medicina','Perspicacia','Persuasión','Religión']},
    'Druida':{count:2,options:['Conocimiento arcano','Medicina','Naturaleza','Percepción','Perspicacia','Religión','Supervivencia','Trato con animales']},
    'Explorador':{count:3,options:['Atletismo','Investigación','Naturaleza','Percepción','Perspicacia','Sigilo','Supervivencia','Trato con animales']},
    'Guerrero':{count:2,options:['Acrobacias','Atletismo','Historia','Intimidación','Percepción','Perspicacia','Persuasión','Supervivencia','Trato con animales']},
    'Hechicero':{count:2,options:['Conocimiento arcano','Engaño','Intimidación','Persuasión','Perspicacia','Religión']},
    'Mago':{count:2,options:['Conocimiento arcano','Historia','Investigación','Medicina','Naturaleza','Perspicacia','Religión']},
    'Monje':{count:2,options:['Acrobacias','Atletismo','Historia','Perspicacia','Religión','Sigilo']},
    'Paladín':{count:2,options:['Atletismo','Intimidación','Medicina','Perspicacia','Persuasión','Religión']},
    'Pícaro':{count:4,options:['Acrobacias','Atletismo','Engaño','Intimidación','Investigación','Juego de manos','Percepción','Perspicacia','Persuasión','Sigilo']}
  };
  const BUILDER_BACKGROUND_DATA: Record<string,{abilities:string[];feat:string;skills:string[];tool:string;equipmentA:string}> = {
    'Acólito':{abilities:['Inteligencia','Sabiduría','Carisma'],feat:'Iniciado en la magia (Clérigo)',skills:['Perspicacia','Religión'],tool:'Suministros de calígrafo',equipmentA:'Suministros de calígrafo, libro de oraciones, 10 hojas de pergamino, símbolo sagrado, túnica y 8 po.'},
    'Animador':{abilities:['Fuerza','Destreza','Carisma'],feat:'Músico',skills:['Acrobacias','Interpretación'],tool:'Un instrumento musical a elección',equipmentA:'Un instrumento musical, 2 disfraces, espejo, perfume, ropas de viaje y 11 po.'},
    'Artesano':{abilities:['Fuerza','Destreza','Inteligencia'],feat:'Fabricante',skills:['Investigación','Persuasión'],tool:'Un tipo de herramientas de artesano a elección',equipmentA:'Herramientas de artesano elegidas, 2 bolsas, ropas de viaje y 32 po.'},
    'Campesino':{abilities:['Fuerza','Constitución','Sabiduría'],feat:'Duro',skills:['Naturaleza','Trato con animales'],tool:'Herramientas de carpintero',equipmentA:'Hoz, herramientas de carpintero, útiles de sanador, olla de hierro, pala, ropas de viaje y 30 po.'},
    'Charlatán':{abilities:['Destreza','Constitución','Carisma'],feat:'Habilidoso',skills:['Engaño','Juego de manos'],tool:'Útiles para falsificar',equipmentA:'Útiles para falsificar, disfraz, ropas de calidad y 15 po.'},
    'Comerciante':{abilities:['Constitución','Inteligencia','Carisma'],feat:'Afortunado',skills:['Persuasión','Trato con animales'],tool:'Herramientas de navegante',equipmentA:'Herramientas de navegante, 2 bolsas, ropas de viaje y 22 po.'},
    'Criminal':{abilities:['Destreza','Constitución','Inteligencia'],feat:'Alerta',skills:['Juego de manos','Sigilo'],tool:'Herramientas de ladrón',equipmentA:'2 dagas, herramientas de ladrón, 2 bolsas, palanqueta, ropas de viaje y 16 po.'},
    'Ermitaño':{abilities:['Constitución','Sabiduría','Carisma'],feat:'Sanador',skills:['Medicina','Religión'],tool:'Útiles de herborista',equipmentA:'Bastón, útiles de herborista, 3 frascos de aceite, lámpara, libro de filosofía, petate, ropas de viaje y 16 po.'},
    'Erudito':{abilities:['Constitución','Inteligencia','Sabiduría'],feat:'Iniciado en la magia (Mago)',skills:['Conocimiento arcano','Historia'],tool:'Suministros de calígrafo',equipmentA:'Bastón, suministros de calígrafo, libro de historia, 8 hojas de pergamino, túnica y 8 po.'},
    'Escriba':{abilities:['Destreza','Inteligencia','Sabiduría'],feat:'Habilidoso',skills:['Investigación','Percepción'],tool:'Suministros de calígrafo',equipmentA:'Suministros de calígrafo, 3 frascos de aceite, lámpara, 12 hojas de pergamino, ropas de calidad y 23 po.'},
    'Guardia':{abilities:['Fuerza','Inteligencia','Sabiduría'],feat:'Alerta',skills:['Atletismo','Percepción'],tool:'Un tipo de juego a elección',equipmentA:'Lanza, ballesta ligera, 20 virotes, un juego elegido, aljaba, esposas, linterna sorda, ropas de viaje y 12 po.'},
    'Guía':{abilities:['Destreza','Constitución','Sabiduría'],feat:'Iniciado en la magia (Druida)',skills:['Sigilo','Supervivencia'],tool:'Herramientas de cartógrafo',equipmentA:'Arco corto, 20 flechas, herramientas de cartógrafo, aljaba, petate, tienda, ropas de viaje y 3 po.'},
    'Marinero':{abilities:['Fuerza','Destreza','Sabiduría'],feat:'Matón de taberna',skills:['Acrobacias','Percepción'],tool:'Herramientas de navegante',equipmentA:'Daga, herramientas de navegante, cuerda, ropas de viaje y 20 po.'},
    'Noble':{abilities:['Fuerza','Inteligencia','Carisma'],feat:'Habilidoso',skills:['Historia','Persuasión'],tool:'Un tipo de juego a elección',equipmentA:'Un juego elegido, perfume, ropas de calidad y 29 po.'},
    'Soldado':{abilities:['Fuerza','Destreza','Constitución'],feat:'Atacante salvaje',skills:['Atletismo','Intimidación'],tool:'Un tipo de juego a elección',equipmentA:'Lanza, arco corto, 20 flechas, aljaba, un juego elegido, útiles de sanador, ropas de viaje y 14 po.'},
    'Vagabundo':{abilities:['Destreza','Sabiduría','Carisma'],feat:'Afortunado',skills:['Perspicacia','Sigilo'],tool:'Herramientas de ladrón',equipmentA:'2 dagas, herramientas de ladrón, un juego a elección, 2 bolsas, petate, ropas de viaje y 16 po.'}
  };

  const BUILDER_CLASS_FEATURES: Record<string,string> = {
    'Bárbaro':'Defensa sin armadura; Furia; Maestría con armas (elige 2 tipos de armas cuerpo a cuerpo sencillas o marciales)',
    'Bardo':'Inspiración bárdica; Lanzamiento de conjuros',
    'Brujo':'Invocaciones sobrenaturales; Magia del pacto',
    'Clérigo':'Lanzamiento de conjuros; Orden divina',
    'Druida':'Druídico (siempre tienes Hablar con los animales preparado); Orden primigenia; Lanzamiento de conjuros',
    'Explorador':'Enemigo predilecto; Maestría con armas; Lanzamiento de conjuros',
    'Guerrero':'Estilo de combate; Tomar aliento; Maestría con armas',
    'Hechicero':'Lanzamiento de conjuros; Hechicería innata',
    'Mago':'Lanzamiento de conjuros; Adepto en rituales; Recuperación arcana',
    'Monje':'Artes marciales; Defensa sin armadura',
    'Paladín':'Imponer las manos; Lanzamiento de conjuros; Maestría con armas',
    'Pícaro':'Pericia; Ataque furtivo; Maestría con armas; Jerga de ladrones'
  };
  const BUILDER_SPECIES_CHOICES: Record<string,string[]> = {
    'Aasimar':[], 'Dracónido':['Azul','Blanco','Bronce','Cobre','Negro','Oro','Oropel','Plata','Rojo','Verde'],
    'Enano':[], 'Elfo':['Alto elfo','Drow','Elfo de los bosques'], 'Gnomo':['Gnomo de las rocas','Gnomo de los bosques'],
    'Goliat':['Abrasión del fuego','Caída de las colinas','Excursión de las nubes','Frío de la escarcha','Resistencia de la piedra','Trueno de la tormenta'], 'Mediano':[], 'Humano':[], 'Orco':[],
    'Tiefling':['Abisal','Ctónico','Infernal']
  };
  const BUILDER_SPECIES_TRAITS: Record<string,string> = {
    'Aasimar':'Tipo de criatura: Humanoide. Manos curativas: acción de magia, cura tantos d4 como tu bonificador por competencia; recuperas el uso tras un descanso largo. Portador de luz: conoces Luz y usas Carisma. Resistencia celestial: resistencia al daño necrótico y radiante. Visión en la oscuridad 18 m. Revelación celestial desde nivel 3.',
    'Dracónido':'Tipo de criatura: Humanoide. Linaje dracónico determina daño y resistencia. Ataque de aliento: al realizar la acción Atacar sustituyes uno de tus ataques por un cono de 4,5 m o una línea de 9 m × 1,5 m (eliges forma en cada uso); salvación de Destreza CD 8 + modificador de Constitución + competencia; 1d10 de daño, mitad con éxito. Aumenta a 2d10 en nivel 5, 3d10 en nivel 11 y 4d10 en nivel 17. Usos iguales a competencia por descanso largo. Visión en la oscuridad 18 m. Vuelo dracónico desde nivel 5.',
    'Enano':'Tipo de criatura: Humanoide. Afinidad con la piedra: como acción adicional, mientras estás sobre piedra o en contacto con ella, sientes vibraciones a 18 m durante 10 minutos; usos iguales a competencia por descanso largo. Aguante enano: +1 PG máximo por nivel de personaje. Resistencia enana: resistencia al daño de veneno y ventaja para evitar o terminar Envenenado. Visión en la oscuridad 36 m.',
    'Elfo':'Tipo de criatura: Humanoide. Linaje feérico: ventaja en salvaciones para evitar o terminar Hechizado. Sentidos agudos: competencia en Percepción, Perspicacia o Supervivencia. Trance: descanso largo en 4 horas de meditación consciente; no necesitas dormir y la magia no puede dormirte. Visión en la oscuridad 18 m. Linaje élfico elegido: truco y conjuros de niveles 3 y 5.',
    'Gnomo':'Tipo de criatura: Humanoide. Astucia gnoma: ventaja en salvaciones de Inteligencia, Sabiduría y Carisma. Linaje gnomo elegido: capacidades mágicas. Visión en la oscuridad 18 m.',
    'Goliat':'Tipo de criatura: Humanoide. Constitución poderosa: ventaja para terminar Agarrado y cuenta como una categoría de tamaño mayor para capacidad de carga. Forma grande desde nivel 5: tamaño Grande durante 10 minutos, ventaja en pruebas de Fuerza y +3 m de velocidad; recuperas el uso tras descanso largo. Linaje gigante: beneficio elegido, usos iguales a competencia por descanso largo.',
    'Mediano':'Tipo de criatura: Humanoide. Agilidad de mediano: atraviesas espacios de criaturas mayores, pero no puedes terminar en ellos. Fortuna: repites un 1 en una prueba con d20 y debes usar el nuevo resultado. Sigiloso por naturaleza: puedes esconderte tras una criatura al menos una categoría mayor. Valiente: ventaja en salvaciones para evitar o terminar Asustado.',
    'Humano':'Tipo de criatura: Humanoide. Diestro: competencia en una habilidad a elección. Ingenioso: obtienes Inspiración heroica tras un descanso largo. Versátil: obtienes una dote de origen a elección.',
    'Orco':'Tipo de criatura: Humanoide. Aguante incansable: al llegar a 0 PG sin morir inmediatamente, recuperas 1 PG; una vez por descanso largo. Descarga de adrenalina: puedes Correr como acción adicional y obtienes PG temporales iguales a competencia; usos iguales a competencia por descanso corto o largo. Visión en la oscuridad 36 m.',
    'Tiefling':'Tipo de criatura: Humanoide. Legado infernal elegido: resistencia y truco de nivel 1, conjuros adicionales en niveles 3 y 5; aptitud mágica elegida. Presencia sobrenatural: conoces Taumaturgia y usas la misma aptitud mágica del legado. Visión en la oscuridad 18 m.'
  };
  function builderSpeciesChoiceDescription(species:string,choice:string,magicAbility=''): string {
    const dragonDamage:Record<string,string>={Azul:'relámpago',Blanco:'frío',Bronce:'relámpago',Cobre:'ácido',Negro:'ácido',Oro:'fuego',Oropel:'fuego',Plata:'frío',Rojo:'fuego',Verde:'veneno'};
    if(species==='Dracónido' && dragonDamage[choice]) return 'Linaje dracónico · '+choice+': resistencia al daño de '+dragonDamage[choice]+'. Ataque de aliento: al realizar Atacar sustituyes uno de tus ataques por 1d10 de '+dragonDamage[choice]+'; cono de 4,5 m o línea de 9 m × 1,5 m, eliges forma en cada uso; salvación de Destreza CD 8 + modificador de Constitución + competencia, mitad de daño si se supera. Usos iguales a competencia por descanso largo. Daño: 2d10 en nivel 5, 3d10 en nivel 11 y 4d10 en nivel 17.';
    const giant:Record<string,string>={
      'Abrasión del fuego':'Cuando aciertas con un ataque, puedes causar 1d10 de daño de fuego adicional.',
      'Caída de las colinas':'Cuando aciertas con un ataque a una criatura Grande o menor, puedes imponerle el estado derribado.',
      'Excursión de las nubes':'Como acción adicional, te teletransportas hasta 9 m a un espacio desocupado que puedas ver.',
      'Frío de la escarcha':'Cuando aciertas con un ataque, puedes causar 1d6 de daño de frío adicional y reducir la velocidad del objetivo en 3 m hasta el inicio de tu siguiente turno.',
      'Resistencia de la piedra':'Cuando recibes daño, puedes usar una reacción para reducirlo en 1d12 + tu modificador por Constitución.',
      'Trueno de la tormenta':'Cuando una criatura a 18 m o menos te causa daño, puedes usar una reacción para infligirle 1d8 de daño de trueno.'
    };
    if(species==='Goliat' && giant[choice]) return 'Linaje gigante · '+choice+': '+giant[choice]+' Usos iguales al bonificador por competencia; recuperas todos tras un descanso largo.';
    if(species==='Elfo') {
      if(choice==='Alto elfo') return 'Linaje élfico · Alto elfo: conoces Prestidigitación; tras un descanso largo puedes sustituirlo por otro truco de la lista de mago. En nivel 3 aprendes Detectar magia y en nivel 5 Paso brumoso. Siempre preparados; puedes lanzar cada uno una vez sin espacio por descanso largo o usando un espacio apropiado. Aptitud mágica: '+(magicAbility||'por elegir')+'.';
      if(choice==='Drow') return 'Linaje élfico · Drow: visión en la oscuridad de 36 m y conoces Luces danzantes. En nivel 3 aprendes Fuego feérico y en nivel 5 Oscuridad. Siempre preparados; puedes lanzar cada uno una vez sin espacio por descanso largo o usando un espacio apropiado. Aptitud mágica: '+(magicAbility||'por elegir')+'.';
      return 'Linaje élfico · Elfo de los bosques: velocidad 10,5 m y conoces Saber druídico. En nivel 3 aprendes Zancada prodigiosa y en nivel 5 Pasar sin rastro. Siempre preparados; puedes lanzar cada uno una vez sin espacio por descanso largo o usando un espacio apropiado. Aptitud mágica: '+(magicAbility||'por elegir')+'.';
    }
    if(species==='Gnomo') {
      if(choice==='Gnomo de las rocas') return 'Linaje gnomo · Gnomo de las rocas: conoces Prestidigitación y Reparar. Tras 10 minutos lanzando Prestidigitación creas un dispositivo Diminuto (CA 5, 1 PG) que reproduce un efecto elegido de Prestidigitación cuando tú u otra criatura lo activa con una acción adicional y un toque. Si el efecto tiene opciones, eliges una al crearlo. Puedes mantener tres dispositivos activos; se desarman a las 8 horas o cuando los desmontas con un toque como acción de Utilizar. Aptitud mágica: '+(magicAbility||'por elegir')+'.';
      return 'Linaje gnomo · Gnomo de los bosques: conoces Ilusión menor y siempre tienes Hablar con los animales preparado. Puedes lanzarlo sin espacio tantas veces como tu bonificador por competencia por descanso largo, o usando cualquier espacio de conjuro. Aptitud mágica: '+(magicAbility||'por elegir')+'.';
    }
    if(species==='Tiefling') {
      if(choice==='Abisal') return 'Legado infernal · Abisal: resistencia al daño de veneno y conoces Rociada venenosa. En nivel 3 aprendes Rayo nauseabundo y en nivel 5 Inmovilizar persona. Siempre preparados; puedes lanzar cada uno una vez sin espacio por descanso largo o usando un espacio apropiado. Aptitud mágica: '+(magicAbility||'por elegir')+'.';
      if(choice==='Ctónico') return 'Legado infernal · Ctónico: resistencia al daño necrótico y conoces Toque helado. En nivel 3 aprendes Falsa vida y en nivel 5 Rayo debilitador. Siempre preparados; puedes lanzar cada uno una vez sin espacio por descanso largo o usando un espacio apropiado. Aptitud mágica: '+(magicAbility||'por elegir')+'.';
      return 'Legado infernal · Infernal: resistencia al daño de fuego y conoces Descarga de fuego. En nivel 3 aprendes Reprensión infernal y en nivel 5 Oscuridad. Siempre preparados; puedes lanzar cada uno una vez sin espacio por descanso largo o usando un espacio apropiado. Aptitud mágica: '+(magicAbility||'por elegir')+'.';
    }
    return '';
  }
  const BUILDER_CLASS_DATA: Record<string,{equipmentA:string;equipmentB:string;features:string;tool:string;weaponCount:number;cantrips:number;spells:number;slots:number;spellbook:number;specialLabel:string;specialOptions:string[]}> = {
    'Bárbaro':{equipmentA:'Hacha a dos manos, 4 hachas de mano, paquete de explorador y 15 po.',equipmentB:'75 po.',features:'Defensa sin armadura; Furia (2 usos, daño +2 y resistencia a daño contundente, cortante y perforante); Maestría con armas (elige 2 tipos de armas).',tool:'Ninguna competencia con herramientas de clase.',weaponCount:2,cantrips:0,spells:0,slots:0,spellbook:0,specialLabel:'',specialOptions:[]},
    'Bardo':{equipmentA:'Armadura de cuero, 2 dagas, un instrumento musical, paquete de artista y 19 po.',equipmentB:'90 po.',features:'Inspiración bárdica (d6; usos iguales al modificador de Carisma, mínimo 1); Lanzamiento de conjuros.',tool:'Elige 3 instrumentos musicales.',weaponCount:0,cantrips:2,spells:4,slots:2,spellbook:0,specialLabel:'Instrumentos musicales',specialOptions:[]},
    'Brujo':{equipmentA:'Armadura de cuero, hoz, 2 dagas, canalizador arcano (orbe), libro de conocimiento oculto, paquete de erudito y 15 po.',equipmentB:'100 po.',features:'Invocaciones sobrenaturales (elige 1); Magia del pacto (2 trucos, 2 conjuros preparados y 1 espacio de nivel 1).',tool:'Ninguna competencia con herramientas de clase.',weaponCount:0,cantrips:2,spells:2,slots:1,spellbook:0,specialLabel:'Invocación sobrenatural',specialOptions:['Armadura de sombras','Mente sobrenatural','Pacto de la cadena','Pacto del filo','Pacto del grimorio']},
    'Clérigo':{equipmentA:'Camisa de malla, escudo, maza, paquete de sacerdote, símbolo sagrado y 7 po.',equipmentB:'110 po.',features:'Lanzamiento de conjuros (3 trucos, 4 conjuros preparados y 2 espacios de nivel 1); Orden divina.',tool:'Ninguna competencia con herramientas de clase.',weaponCount:0,cantrips:3,spells:4,slots:2,spellbook:0,specialLabel:'Orden divina',specialOptions:['Protector','Taumaturgo']},
    'Druida':{equipmentA:'Armadura de cuero, escudo, hoz, canalizador druídico (bastón), paquete de explorador, útiles de herborista y 9 po.',equipmentB:'50 po.',features:'Lanzamiento de conjuros (2 trucos, 4 conjuros preparados y 2 espacios de nivel 1); Druídico (Hablar con los animales siempre preparado); Orden primigenia.',tool:'Útiles de herborista.',weaponCount:0,cantrips:2,spells:4,slots:2,spellbook:0,specialLabel:'Orden primigenia',specialOptions:['Guardián','Naturalista']},
    'Explorador':{equipmentA:'Armadura de cuero tachonado, cimitarra, espada corta, arco largo, 20 flechas, aljaba, canalizador druídico (rama de muérdago), paquete de explorador y 7 po.',equipmentB:'150 po.',features:'Lanzamiento de conjuros (2 conjuros preparados y 2 espacios de nivel 1); Enemigo predilecto (Marca del cazador siempre preparada); Maestría con armas (2 tipos).',tool:'Ninguna competencia con herramientas de clase.',weaponCount:2,cantrips:0,spells:2,slots:2,spellbook:0,specialLabel:'',specialOptions:[]},
    'Guerrero':{equipmentA:'Cota de malla, espadón, mangual, 8 jabalinas, paquete de explorador de mazmorras y 4 po.',equipmentB:'Armadura de cuero tachonado, cimitarra, espada corta, arco largo, 20 flechas, aljaba, paquete de explorador de mazmorras y 11 po.',features:'Estilo de combate (elige una dote de estilo de combate); Maestría con armas (3 tipos); Tomar aliento (2 usos).',tool:'Ninguna competencia con herramientas de clase.',weaponCount:3,cantrips:0,spells:0,slots:0,spellbook:0,specialLabel:'Estilo de combate',specialOptions:['Combate con armas a dos manos','Combate con armas arrojadizas','Combate con dos armas','Combate sin armas','Defensa','Duelo','Intercepción','Lucha a ciegas','Protección','Tiro con arco']},
    'Hechicero':{equipmentA:'Lanza, 2 dagas, canalizador arcano (cristal), paquete de explorador de mazmorras y 28 po.',equipmentB:'50 po.',features:'Lanzamiento de conjuros (4 trucos, 2 conjuros preparados y 2 espacios de nivel 1); Hechicería innata.',tool:'Ninguna competencia con herramientas de clase.',weaponCount:0,cantrips:4,spells:2,slots:2,spellbook:0,specialLabel:'',specialOptions:[]},
    'Mago':{equipmentA:'2 dagas, canalizador arcano (bastón), libro de conjuros, paquete de erudito, túnica y 5 po.',equipmentB:'55 po.',features:'Lanzamiento de conjuros (3 trucos, libro con 6 conjuros de nivel 1, 4 preparados y 2 espacios); Adepto en rituales; Recuperación arcana.',tool:'Ninguna competencia con herramientas de clase.',weaponCount:0,cantrips:3,spells:4,slots:2,spellbook:6,specialLabel:'',specialOptions:[]},
    'Monje':{equipmentA:'Lanza, 5 dagas, herramientas de artesano o instrumento musical elegido, paquete de explorador y 11 po.',equipmentB:'50 po.',features:'Artes marciales; Defensa sin armadura.',tool:'Elige herramientas de artesano o un instrumento musical.',weaponCount:0,cantrips:0,spells:0,slots:0,spellbook:0,specialLabel:'',specialOptions:[]},
    'Paladín':{equipmentA:'Cota de malla, escudo, espada larga, 6 jabalinas, símbolo sagrado, paquete de sacerdote y 9 po.',equipmentB:'150 po.',features:'Imponer las manos (reserva de 5 PG); Lanzamiento de conjuros (2 conjuros preparados y 2 espacios de nivel 1); Maestría con armas (2 tipos).',tool:'Ninguna competencia con herramientas de clase.',weaponCount:2,cantrips:0,spells:2,slots:2,spellbook:0,specialLabel:'',specialOptions:[]},
    'Pícaro':{equipmentA:'Armadura de cuero, 2 dagas, espada corta, arco corto, 20 flechas, aljaba, herramientas de ladrón, paquete de ladrón y 8 po.',equipmentB:'100 po.',features:'Ataque furtivo (1d6); Jerga de ladrones y otro idioma; Maestría con armas (2 tipos); Pericia en 2 habilidades competentes.',tool:'Herramientas de ladrón.',weaponCount:2,cantrips:0,spells:0,slots:0,spellbook:0,specialLabel:'',specialOptions:[]}
  };
  const BUILDER_MUSICAL_INSTRUMENTS = ['Chirimía','Cuerno','Dulcémele','Flauta','Flauta de pan','Gaita','Laúd','Lira','Tambor','Viola'];
  const BUILDER_ARTISAN_TOOLS = ['Herramientas de albañil','Herramientas de alfarero','Herramientas de carpintero','Herramientas de cartógrafo','Herramientas de curtidor','Herramientas de ebanista','Herramientas de herrero','Herramientas de joyero','Herramientas de manitas','Herramientas de soplador de vidrio','Herramientas de tejedor','Herramientas de zapatero'];
  const BUILDER_LANGUAGES = ['Abisal','Celestial','Dracónico','Druídico','Elfo','Enano','Gigante','Gnomo','Goblin','Habla de las profundidades','Infernal','Infracomún','Jerga de ladrones','Lenguaje de signos común','Mediano','Orco','Primordial','Silvano'];
  const BUILDER_RANGER_FEY_GIFTS = ['Unas mariposas ilusorias revolotean a tu alrededor mientras haces un descanso corto o largo.','Te brotan flores en el pelo cada amanecer.','Emanas un ligero olor a canela, lavanda, nuez moscada u otra hierba o especia agradable.','Tu sombra baila cuando nadie la mira directamente.','De tu cabeza brotan cuernos o astas.','Tu piel y tu cabello cambian de color cada amanecer.'];
  const BUILDER_RANGER_BEAST_PROFILES: Record<string,string> = {
    'Bestia de los mares':'Bestia Mediana. CA 13 + modificador de Sabiduría. PG 5 + cinco veces tu nivel de Explorador; dados de golpe d8 iguales a tu nivel. Velocidad 1,5 m; nadar 18 m. Características: FUE 14 (+2), DES 14 (+2), CON 15 (+2), INT 8 (-1), SAB 14 (+2), CAR 11 (+0). Visión en la oscuridad 27 m; Percepción pasiva 12; entiende los idiomas que conoces. Anfibia: respira dentro y fuera del agua. Vínculo primigenio: suma tu bonificador por competencia a sus pruebas de característica y salvaciones. Golpe de bestia: ataque cuerpo a cuerpo con tu modificador de ataque de conjuros, alcance 1,5 m; daño 1d6 + 2 + tu modificador de Sabiduría contundente o perforante; el objetivo queda agarrado (CD para escapar igual a tu CD de salvación de conjuros).',
    'Bestia de tierra firme':'Bestia Mediana. CA 13 + modificador de Sabiduría. PG 5 + cinco veces tu nivel de Explorador; dados de golpe d8 iguales a tu nivel. Velocidad 12 m; trepar 12 m. Características: FUE 14 (+2), DES 14 (+2), CON 15 (+2), INT 8 (-1), SAB 14 (+2), CAR 11 (+0). Visión en la oscuridad 18 m; Percepción pasiva 12; entiende los idiomas que conoces. Vínculo primigenio: suma tu bonificador por competencia a sus pruebas de característica y salvaciones. Golpe de bestia: ataque cuerpo a cuerpo con tu modificador de ataque de conjuros, alcance 1,5 m; daño 1d8 + 2 + tu modificador de Sabiduría contundente, cortante o perforante. Si recorrió al menos 6 m en línea recta hacia el objetivo antes de acertar, inflige 1d6 adicional y derriba al objetivo si es Grande o más pequeño.',
    'Bestia del cielo':'Bestia Pequeña. CA 13 + modificador de Sabiduría. PG 4 + cuatro veces tu nivel de Explorador; dados de golpe d6 iguales a tu nivel. Velocidad 3 m; volar 18 m. Características: FUE 6 (-2), DES 16 (+3), CON 13 (+1), INT 8 (-1), SAB 14 (+2), CAR 11 (+0). Visión en la oscuridad 18 m; Percepción pasiva 12; entiende los idiomas que conoces. Pasar volando: no provoca ataques de oportunidad cuando vuela para salir del alcance de un enemigo. Vínculo primigenio: suma tu bonificador por competencia a sus pruebas de característica y salvaciones. Golpe de bestia: ataque cuerpo a cuerpo con tu modificador de ataque de conjuros, alcance 1,5 m; daño 1d4 + 3 + tu modificador de Sabiduría cortante.'
  };
  const BUILDER_STANDARD_LANGUAGES = ['Dracónico','Elfo','Enano','Gigante','Gnomo','Goblin','Lenguaje de signos común','Mediano','Orco'];
  const BUILDER_SKILL_OPTIONS = ['Acrobacias','Atletismo','Conocimiento arcano','Engaño','Historia','Interpretación','Intimidación','Investigación','Juego de manos','Medicina','Naturaleza','Perspicacia','Persuasión','Percepción','Religión','Sigilo','Supervivencia','Trato con animales'];
  const BUILDER_BATTLE_MANEUVER_OPTIONS = ['Arremetida','Ataque amenazador','Ataque de barrido','Ataque preciso','Ataque provocador','Ataque y derribo','Ataque y desarme','Ataque y distracción','Ataque y empujón','Ataque y maniobra','Cambio de posición ventajoso','Contraataque','Emboscada','Evaluación táctica','Finta','Juego de pies evasivo','Orden de ataque','Parada','Presencia imponente','Reagrupar'];
  const BUILDER_METAMAGIC_OPTIONS = ['Conjuro acelerado','Conjuro buscador','Conjuro cuidadoso','Conjuro distante','Conjuro extendido','Conjuro gemelo','Conjuro intensificado','Conjuro potenciado','Conjuro sutil','Conjuro transmutado'];
  const BUILDER_WARLOCK_INVOCATIONS = [
    {name:'Armadura de sombras',level:1},
    {name:'Castigo arcano',level:5,pact:'Pacto del filo'},
    {name:'Descarga agónica',level:2,repeatable:true,cantrip:'damage'},
    {name:'Descarga ahuyentadora',level:2,repeatable:true,cantrip:'attack'},
    {name:'Devorador de vida',level:9,pact:'Pacto del filo'},
    {name:'Don de las profundidades',level:5},
    {name:'Don de los protectores',level:9,pact:'Pacto del grimorio'},
    {name:'Filo sediento',level:5,pact:'Pacto del filo'},
    {name:'Hoja devoradora',level:12,pact:'Filo sediento'},
    {name:'Inversión del amo de las cadenas',level:5,pact:'Pacto de la cadena'},
    {name:'Lanza sobrenatural',level:2,repeatable:true,cantrip:'range'},
    {name:'Lecciones de los primeros',level:2,repeatable:true,choice:'feat'},
    {name:'Maestro de las formas innumerables',level:5},
    {name:'Máscara de los mil rostros',level:2},
    {name:'Mente sobrenatural',level:1},
    {name:'Mirada de las dos mentes',level:5},
    {name:'Pacto de la cadena',level:1},
    {name:'Pacto del filo',level:1},
    {name:'Pacto del grimorio',level:1},
    {name:'Paso ascendente',level:5},
    {name:'Salto sobrenatural',level:2},
    {name:'Susurros del sepulcro',level:7},
    {name:'Uno con las sombras',level:5},
    {name:'Vigor infernal',level:2},
    {name:'Visión bruja',level:15},
    {name:'Visiones brumosas',level:2},
    {name:'Visiones de reinos remotos',level:9},
    {name:'Vista del diablo',level:2}
  ];
  const BUILDER_GAMING_SETS = ['Ajedrez dragón','Apuesta de los tres dragones','Dados','Naipes'];
  const BUILDER_FEAT_TOOL_OPTIONS = [...BUILDER_ARTISAN_TOOLS,...BUILDER_MUSICAL_INSTRUMENTS,...BUILDER_GAMING_SETS,'Suministros de alquimista','Suministros de calígrafo','Suministros de cervecero','Suministros de pintor','Útiles de cocinero','Herramientas de ladrón','Herramientas de navegante','Útiles de envenenador','Útiles de herborista','Útiles para disfrazarse','Útiles para falsificar'];
  function builderFeatChoiceOptions(feat:string) {
    if (feat === 'Habilidoso') return [...BUILDER_SKILL_OPTIONS,...BUILDER_FEAT_TOOL_OPTIONS];
    if (feat === 'Fabricante') return BUILDER_ARTISAN_TOOLS;
    if (feat === 'Músico') return BUILDER_MUSICAL_INSTRUMENTS;
    return [];
  }
  function builderMagicInitiateClass(feat:string) {
    return feat.includes('(Clérigo)') ? 'Clérigo' : feat.includes('(Druida)') ? 'Druida' : feat.includes('(Mago)') ? 'Mago' : '';
  }
  function builderWarlockInvocationDescription(entry:string): string {
    const [nameRaw,choiceRaw='']=entry.split(':');
    const name=nameRaw.trim(),choice=choiceRaw.trim();
    const descriptions:Record<string,string>={
      'Armadura de sombras':'Puedes lanzar Armadura de mago sobre ti sin gastar un espacio de conjuro; el conjuro solo te protege mientras no lleves armadura.',
      'Castigo arcano':'Una vez por turno, cuando aciertas con tu arma de pacto, puedes gastar un espacio de Magia del pacto para infligir 1d8 de daño de fuerza adicional por nivel del espacio y derribar a un objetivo Enorme o menor.',
      'Descarga agónica':'Añades tu modificador por Carisma a las tiradas de daño del truco de brujo elegido: '+choice+'.',
      'Descarga ahuyentadora':'Cuando aciertas con el truco de brujo elegido ('+choice+') a una criatura Grande o menor, puedes empujarla hasta 3 m en línea recta alejándola de ti.',
      'Devorador de vida':'Una vez por turno, cuando aciertas con tu arma de pacto, infliges 1d6 de daño necrótico, psíquico o radiante adicional y puedes gastar un dado de golpe para recuperar PG iguales al resultado más tu modificador por Constitución (mínimo 1).',
      'Don de las profundidades':'Puedes respirar bajo el agua, obtienes velocidad nadando igual a tu velocidad y puedes lanzar Respirar bajo el agua una vez por descanso largo sin gastar espacio.',
      'Don de los protectores':'Tu Libro de las sombras puede contener nombres; cuando una criatura inscrita llega a 0 PG sin morir, pasa a tener 1 PG. El efecto se recupera tras un descanso largo.',
      'Filo sediento':'Obtienes Ataque adicional, pero solo para tu arma de pacto.',
      'Hoja devoradora':'El Ataque adicional de Filo sediento te permite realizar dos ataques adicionales en lugar de uno.',
      'Inversión del amo de las cadenas':'Tu familiar obtiene velocidad volando o nadando de 12 m, puede atacar como acción adicional, puede infligir daño necrótico o radiante, usa tu CD de conjuros y puede recibir resistencia al daño mediante tu reacción.',
      'Lanza sobrenatural':'El alcance del truco de brujo elegido ('+choice+') aumenta en 10 veces tu nivel de brujo.',
      'Lecciones de los primeros':'Obtienes la dote de origen '+choice+'. Esta invocación puede elegirse varias veces, con una dote distinta cada vez.',
      'Maestro de las formas innumerables':'Puedes lanzar Alterar el propio aspecto sin gastar un espacio de conjuro.',
      'Máscara de los mil rostros':'Puedes lanzar Disfrazarse sin gastar un espacio de conjuro.',
      'Mente sobrenatural':'Tienes ventaja en las tiradas de salvación de Constitución que realices para mantener la concentración.',
      'Mirada de las dos mentes':'Como acción adicional, tocas a una criatura voluntaria y percibes el mundo a través de sus sentidos; puedes mantener la conexión con acciones adicionales y lanzar conjuros desde tu espacio o el suyo si está a 18 m o menos.',
      'Pacto de la cadena':'Aprendes Encontrar familiar y puedes lanzarlo como acción de magia sin gastar espacio; puedes elegir una forma especial y renunciar a uno de tus ataques para que el familiar ataque con su reacción.',
      'Pacto del filo':'Como acción adicional conjuras o vinculas un arma cuerpo a cuerpo sencilla o marcial; tienes competencia, puedes usarla como canalizador y emplear Carisma para ataque y daño. Puedes elegir daño necrótico, psíquico o radiante.',
      'Pacto del grimorio':'Conjuras tu Libro de las sombras. Eliges tres trucos y dos conjuros de nivel 1 con etiqueta Ritual de cualquier lista; mientras lleves el libro, están preparados y cuentan como conjuros de brujo. Puedes usar el libro como canalizador.',
      'Paso ascendente':'Puedes lanzar Levitar sobre ti sin gastar un espacio de conjuro.',
      'Salto sobrenatural':'Puedes lanzar Salto sobre ti sin gastar un espacio de conjuro.',
      'Susurros del sepulcro':'Puedes lanzar Hablar con los muertos sin gastar un espacio de conjuro.',
      'Uno con las sombras':'Mientras estés en luz tenue u oscuridad, puedes lanzar Invisibilidad sobre ti sin gastar un espacio de conjuro.',
      'Vigor infernal':'Puedes lanzar Falsa vida sobre ti sin gastar un espacio de conjuro y obtienes automáticamente el resultado máximo del dado de PG temporales.',
      'Visión bruja':'Tienes visión verdadera hasta 9 m.',
      'Visiones brumosas':'Puedes lanzar Imagen silenciosa sin gastar un espacio de conjuro.',
      'Visiones de reinos remotos':'Puedes lanzar Ojo arcano sin gastar un espacio de conjuro.',
      'Vista del diablo':'Puedes ver con normalidad en luz tenue y oscuridad, mágicas o no, hasta 36 m.'
    };
    return name+': '+(descriptions[name]||'Consulta la descripción de esta invocación en el Manual del Jugador 2024.');
  }
  function builderClassChoiceDescription(className:string,choice:string): string {
    const fightingStyles:Record<string,string>={
      'Combate con armas a dos manos':'Dote de estilo de combate: cuando tires el daño de un ataque cuerpo a cuerpo con un arma que empuñes con ambas manos, puedes tratar cualquier 1 o 2 de los dados de daño como un 3. El arma debe tener la propiedad a dos manos o versátil.',
      'Combate con armas arrojadizas':'Dote de estilo de combate: cuando aciertes con un ataque a distancia usando un arma arrojadiza, obtienes +2 al daño.',
      'Combate con dos armas':'Dote de estilo de combate: cuando realizas el ataque adicional por usar un arma ligera, puedes sumar tu modificador por característica al daño si todavía no lo sumas.',
      'Combate sin armas':'Dote de estilo de combate: tus ataques sin armas causan 1d6 + Fuerza de daño contundente, o 1d8 + Fuerza si no empuñas armas ni embrazas escudo. Al principio de cada turno puedes causar 1d4 de daño contundente a una criatura que tengas agarrada.',
      'Defensa':'Dote de estilo de combate: mientras lleves armadura ligera, media o pesada, obtienes +1 a la CA.',
      'Duelo':'Dote de estilo de combate: cuando empuñas un arma cuerpo a cuerpo con una mano y ninguna otra arma en la otra, obtienes +2 al daño con esa arma.',
      'Intercepción':'Dote de estilo de combate: cuando una criatura que puedas ver acierta a otra criatura a 1,5 m o menos de ti, puedes usar una reacción para reducir el daño en 1d10 + tu bonificador por competencia. Debes embrazar un escudo o empuñar un arma sencilla o marcial.',
      'Lucha a ciegas':'Dote de estilo de combate: tienes visión ciega hasta 3 m.',
      'Protección':'Dote de estilo de combate: si una criatura que puedas ver ataca a un objetivo distinto de ti a 1,5 m o menos, puedes usar una reacción mientras embrazas un escudo para imponer desventaja a ese ataque y a los ataques posteriores contra ese objetivo hasta el principio de tu siguiente turno, mientras permanezcas a 1,5 m.',
      'Tiro con arco':'Dote de estilo de combate: obtienes +2 a las tiradas de ataque con armas a distancia.'
    };
    if(className==='Guerrero' && fightingStyles[choice]) return fightingStyles[choice];
    if(className==='Clérigo' && choice==='Protector') return 'Orden divina · Protector: obtienes competencia con armas marciales y entrenamiento con armaduras pesadas.';
    if(className==='Clérigo' && choice==='Taumaturgo') return 'Orden divina · Taumaturgo: conoces un truco adicional de la lista de clérigo y sumas tu modificador de Sabiduría (mínimo +1) a las pruebas de Inteligencia (Conocimiento arcano y Religión).';
    if(className==='Druida' && choice==='Guardián') return 'Orden primigenia · Guardián: obtienes competencia con armas marciales y entrenamiento con armaduras medias.';
    if(className==='Druida' && choice==='Naturalista') return 'Orden primigenia · Naturalista: conoces un truco adicional de la lista de druida y sumas tu modificador de Sabiduría (mínimo +1) a las pruebas de Inteligencia (Conocimiento arcano y Naturaleza).';
    if(className==='Brujo') {
      const invocations:Record<string,string>={
        'Armadura de sombras':'Invocación sobrenatural: puedes lanzar Armadura de mago sobre ti sin gastar un espacio de conjuro. El conjuro solo te protege mientras no lleves armadura.',
        'Mente sobrenatural':'Invocación sobrenatural: tienes ventaja en las tiradas de salvación de Constitución que realices para mantener la concentración.',
        'Pacto de la cadena':'Invocación sobrenatural: aprendes Encontrar familiar y puedes lanzarlo como acción de magia sin gastar espacio. Puedes elegir una forma habitual o una forma especial: diablillo, duende, esfinge de las maravillas, esqueleto, pseudodragón, quasit, renacuajo slaad o serpiente venenosa. Cuando realizas Atacar, puedes renunciar a uno de tus ataques para que tu familiar ataque con su reacción.',
        'Pacto del filo':'Invocación sobrenatural: como acción adicional conjuras un arma cuerpo a cuerpo sencilla o marcial y te vinculas a ella, o te vinculas a un arma mágica que toques. Tienes competencia con ella, puedes usarla como canalizador mágico y usar Carisma para ataque y daño. Puedes elegir que cause daño necrótico, psíquico o radiante en vez de su tipo normal. El vínculo termina si lo sustituyes, el arma permanece a más de 1,5 m durante 1 minuto o mueres.',
        'Pacto del grimorio':'Invocación sobrenatural: al terminar un descanso corto o largo conjuras tu Libro de las sombras. Al aparecer, eliges tres trucos y dos conjuros de nivel 1 con la etiqueta Ritual de cualquier lista de clase, que no tengas ya preparados; mientras lleves el libro, están preparados para ti y cuentan como conjuros de brujo. Puedes usar el libro como canalizador mágico. Trucos elegidos: '+(builderData.warlockTomeCantrips||[]).join(', ')+'. Rituales elegidos: '+(builderData.warlockTomeRituals||[]).join(', ')+'.'
      };
      return invocations[choice]||'';
    }
    return '';
  }

  const BUILDER_WEAPON_MASTERY_OPTIONS = ['Alabarda','Arco corto','Arco largo','Ballesta de mano','Ballesta pesada','Ballesta ligera','Bastón','Cerbatana','Cimitarra','Daga','Dardo','Espada corta','Espada larga','Espadón','Estoque','Garrote','Garrote grande','Guja','Honda','Hacha a dos manos','Hacha de mano','Hacha de guerra','Hoz','Jabalina','Lanza','Lanza de caballería','Látigo','Lucero del alba','Mangual','Martillo de guerra','Martillo ligero','Maza','Maza a dos manos','Mosquete','Pica','Pico de guerra','Pistola','Tridente'];
  const BUILDER_SPELL_LISTS: Record<string,{cantrips:string[];level1:string[]}> = {"Bardo":{"cantrips":["Amistad","Burla dañina","Guardia de cuchillas","Ilusión menor","Impacto certero","Luces danzantes","Luz","Mano de mago","Mensaje","Prestidigitación","Reparar","Tronar","Voluta estelar"],"level1":["Caída de pluma","Curar heridas","Detectar magia","Disfrazarse","Dormir","Encantar animal","Entender idiomas","Fuego feérico","Hablar con los animales","Hechizar persona","Heroísmo","Identificar","Imagen silenciosa","Ola atronadora","Orden imperiosa","Palabra de curación","Perdición","Risa horrible de Tasha","Rociada de color","Sirviente invisible","Susurros discordantes","Texto ilusorio","Zancada prodigiosa"]},"Brujo":{"cantrips":["Amistad","Descarga sobrenatural","Fragmento mental","Guardia de cuchillas","Ilusión menor","Impacto certero","Mano de mago","Prestidigitación","Rociada venenosa","Tañido por los muertos","Toque helado","Tronar"],"level1":["Armadura de Agathys","Brazos de Hadar","Detectar magia","Entender idiomas","Hablar con los animales","Hechizar persona","Maleficio","Perdición","Protección contra el bien y el mal","Rayo de hechicería","Reprensión infernal","Retirada expeditiva","Risa horrible de Tasha","Sirviente invisible","Texto ilusorio"]},"Clérigo":{"cantrips":["Guía","Llama sagrada","Luz","Palabra de resplandor","Piedad con los moribundos","Reparar","Resistencia","Tañido por los muertos","Taumaturgia"],"level1":["Bendición","Crear o destruir agua","Curar heridas","Detectar el bien y el mal","Detectar magia","Detectar venenos y enfermedades","Escudo de fe","Infligir heridas","Orden imperiosa","Palabra de curación","Perdición","Protección contra el bien y el mal","Purificar comida y bebida","Saeta guía","Santuario"]},"Druida":{"cantrips":["Crear llama","Elementalismo","Guía","Látigo de espinas","Mensaje","Piedad con los moribundos","Reparar","Resistencia","Rociada venenosa","Saber druídico","Shillelagh","Tronar","Voluta estelar"],"level1":["Buenas bayas","Crear o destruir agua","Cuchillo de hielo","Curar heridas","Detectar magia","Detectar venenos y enfermedades","Encantar animal","Enmarañar","Fuego feérico","Hablar con los animales","Hechizar persona","Nube de oscurecimiento","Ola atronadora","Palabra de curación","Protección contra el bien y el mal","Purificar comida y bebida","Salto","Zancada prodigiosa"]},"Explorador":{"cantrips":[],"level1":["Alarma","Buenas bayas","Curar heridas","Detectar magia","Detectar venenos y enfermedades","Encantar animal","Enmarañar","Golpe apresador","Hablar con los animales","Marca del cazador","Nube de oscurecimiento","Salto","Tormenta de espinas","Zancada prodigiosa"]},"Hechicero":{"cantrips":["Agarre electrizante","Amistad","Descarga de fuego","Elementalismo","Estallido mágico","Fragmento mental","Guardia de cuchillas","Ilusión menor","Impacto certero","Luces danzantes","Luz","Mano de mago","Mensaje","Prestidigitación","Rayo de escarcha","Reparar","Rociada venenosa","Salpicadura ácida","Toque helado","Tronar"],"level1":["Armadura de mago","Caída de pluma","Cuchillo de hielo","Detectar magia","Disfrazarse","Dormir","Entender idiomas","Escudo","Falsa vida","Grasa","Hechizar persona","Imagen silenciosa","Manos ardientes","Nube de oscurecimiento","Ola atronadora","Orbe cromático","Proyectil mágico","Rayo de hechicería","Rayo nauseabundo","Retirada expeditiva","Rociada de color","Salto"]},"Mago":{"cantrips":["Agarre electrizante","Amistad","Descarga de fuego","Elementalismo","Fragmento mental","Guardia de cuchillas","Ilusión menor","Impacto certero","Luces danzantes","Luz","Mano de mago","Mensaje","Prestidigitación","Rayo de escarcha","Reparar","Rociada venenosa","Salpicadura ácida","Tañido por los muertos","Toque helado","Tronar"],"level1":["Alarma","Armadura de mago","Caída de pluma","Cuchillo de hielo","Detectar magia","Disco flotante de Tenser","Disfrazarse","Dormir","Encontrar familiar","Entender idiomas","Escudo","Falsa vida","Grasa","Hechizar persona","Identificar","Imagen silenciosa","Manos ardientes","Nube de oscurecimiento","Ola atronadora","Orbe cromático","Protección contra el bien y el mal","Proyectil mágico","Rayo de hechicería","Rayo nauseabundo","Retirada expeditiva","Risa horrible de Tasha","Rociada de color","Salto","Sirviente invisible","Texto ilusorio","Zancada prodigiosa"]},"Paladín":{"cantrips":[],"level1":["Bendición","Castigo abrasador","Castigo atronador","Castigo divino","Castigo furioso","Curar heridas","Detectar el bien y el mal","Detectar magia","Detectar venenos y enfermedades","Duelo forzado","Escudo de fe","Favor divino","Heroísmo","Orden imperiosa","Protección contra el bien y el mal","Purificar comida y bebida"]}};
  const BUILDER_TOME_CANTRIPS = [...new Set(Object.values(BUILDER_SPELL_LISTS).flatMap(list => list.cantrips))].sort();
  const BUILDER_TOME_RITUALS = ['Alarma','Detectar magia','Detectar venenos y enfermedades','Disco flotante de Tenser','Encontrar familiar','Entender idiomas','Hablar con los animales','Identificar','Purificar comida y bebida','Sirviente invisible','Texto ilusorio'];
  const BUILDER_HIT_DIE: Record<string,number> = {'Bárbaro':12,'Guerrero':10,'Paladín':10,'Explorador':10,'Bardo':8,'Brujo':8,'Clérigo':8,'Druida':8,'Hechicero':6,'Mago':6,'Monje':8,'Pícaro':8};
  const BUILDER_SAVES: Record<string,string> = {
    'Bárbaro':'Fuerza y Constitución','Bardo':'Destreza y Carisma','Brujo':'Sabiduría y Carisma',
    'Clérigo':'Sabiduría y Carisma','Druida':'Inteligencia y Sabiduría','Explorador':'Fuerza y Destreza',
    'Guerrero':'Fuerza y Constitución','Hechicero':'Constitución y Carisma','Mago':'Inteligencia y Sabiduría',
    'Monje':'Fuerza y Destreza','Paladín':'Sabiduría y Carisma','Pícaro':'Destreza e Inteligencia'
  };
  const BUILDER_WEAPON_PROFICIENCIES: Record<string,string> = {
    'Bárbaro':'Armas sencillas y marciales',
    'Bardo':'Armas sencillas',
    'Brujo':'Armas sencillas',
    'Clérigo':'Armas sencillas',
    'Druida':'Armas sencillas',
    'Explorador':'Armas sencillas y marciales',
    'Guerrero':'Armas sencillas y marciales',
    'Hechicero':'Armas sencillas',
    'Mago':'Armas sencillas',
    'Monje':'Armas sencillas y armas marciales cuerpo a cuerpo ligeras',
    'Paladín':'Armas sencillas y marciales',
    'Pícaro':'Armas sencillas; armas marciales con propiedad ligera o sutil'
  };
  const BUILDER_ARMOR: Record<string,string> = {
    'Bárbaro':'Armaduras ligeras y medias; escudos','Bardo':'Armaduras ligeras',
    'Brujo':'Armaduras ligeras','Clérigo':'Armaduras ligeras y medias; escudos (Protector obtiene armaduras pesadas)',
    'Druida':'Armaduras ligeras y escudos (Guardián obtiene armaduras medias)','Explorador':'Armaduras ligeras y medias; escudos',
    'Guerrero':'Todas las armaduras y escudos','Hechicero':'Ninguna','Mago':'Ninguna',
    'Monje':'Ninguna','Paladín':'Todas las armaduras y escudos','Pícaro':'Armaduras ligeras'
  };
  const BUILDER_MAGIC_ABILITY: Record<string,string> = {
    'Bardo':'Carisma','Brujo':'Carisma','Clérigo':'Sabiduría','Druida':'Sabiduría',
    'Explorador':'Sabiduría','Hechicero':'Carisma','Mago':'Inteligencia','Paladín':'Carisma'
  };
  const BUILDER_PRIMARY: Record<string,string> = {'Bárbaro':'Fuerza','Bardo':'Carisma','Brujo':'Carisma','Clérigo':'Sabiduría','Druida':'Sabiduría','Explorador':'Destreza o Sabiduría','Guerrero':'Fuerza o Destreza','Hechicero':'Carisma','Mago':'Inteligencia','Monje':'Destreza y Sabiduría','Paladín':'Fuerza y Carisma','Pícaro':'Destreza'};
  const BUILDER_STANDARD = [15,14,13,12,10,8];
  const BUILDER_ABILITY_NAMES = ['Fuerza','Destreza','Constitución','Inteligencia','Sabiduría','Carisma'];
  const BUILDER_POINT_COST: Record<number,number> = {8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};
  function builderPointCost() { return Object.values(builderData.abilities).reduce((sum,value)=>sum+(BUILDER_POINT_COST[Number(value)] ?? 99),0); }
  function builderRollScores() {
    const scores = Array.from({length:6},()=>Array.from({length:4},()=>Math.floor(Math.random()*6)+1).sort((a,b)=>b-a).slice(0,3).reduce((a,b)=>a+b,0)).sort((a,b)=>b-a);
    builderRolledScores = [...scores];
    builderData.abilities = Object.fromEntries(BUILDER_ABILITY_NAMES.map((name,index)=>[name,scores[index]]));
  }
  function builderSetAbilityMethod() {
    if (builderData.method === 'standard') {
      builderRolledScores = [];
      builderData.abilities = Object.fromEntries(BUILDER_ABILITY_NAMES.map((name,index)=>[name,[15,14,13,12,10,8][index]]));
    } else if (builderData.method === 'pointBuy') {
      builderRolledScores = [];
      builderData.abilities = Object.fromEntries(BUILDER_ABILITY_NAMES.map(name=>[name,8]));
    } else if (builderData.method === 'rolled') builderRollScores();
  }
  function builderAdjustedAbilities() {
    const result = {...builderData.abilities};
    const add = (name:string,amount:number) => { if(name && Object.prototype.hasOwnProperty.call(result,name)) result[name] = Math.min(20,Number(result[name] || 8)+amount); };
    if(builderData.abilityIncreaseMode === 'two') { add(builderData.abilityIncrease2,2); add(builderData.abilityIncrease1,1); }
    else { add(builderData.abilityIncrease2,1); add(builderData.abilityIncrease1,1); add(builderData.abilityIncrease3,1); }
    return result;
  }
  function builderStartingAC() {
    const dex = builderModifier(Number(builderAdjustedAbilities().Destreza));
    const wis = builderModifier(Number(builderAdjustedAbilities().Sabiduría));
    const cls = builderData.className;
    if (cls === 'Brujo' && builderData.classSpecialChoice === 'Armadura de sombras') return 13 + dex;
    if (builderData.classEquipmentChoice !== 'A' && !(cls === 'Guerrero' && builderData.classEquipmentChoice === 'B')) {
      return cls === 'Bárbaro' ? 10 + dex + builderModifier(Number(builderAdjustedAbilities().Constitución))
        : cls === 'Monje' ? 10 + dex + wis : 10 + dex;
    }
    if (cls === 'Bárbaro') return 10 + dex + builderModifier(Number(builderAdjustedAbilities().Constitución));
    if (cls === 'Brujo' && builderData.classSpecialChoice === 'Armadura de sombras') return 13 + dex;
    if (cls === 'Monje') return 10 + dex + wis;
    if (cls === 'Clérigo') return 15 + Math.min(2,dex);
    if (cls === 'Druida') return 13 + dex;
    if (cls === 'Paladín') return 18;
    if (cls === 'Guerrero' && builderData.classEquipmentChoice === 'A') return 16;
    if (cls === 'Guerrero' && builderData.classEquipmentChoice === 'B') return 12 + dex;
    if (cls === 'Explorador') return 12 + dex;
    if (cls === 'Bardo' || cls === 'Brujo' || cls === 'Pícaro') return 11 + dex;
    return 10 + dex;
  }
  function builderStartingACFormula(): string {
    const cls=builderData.className, dex=builderData.classEquipmentChoice;
    if(cls==='Bárbaro') return '10 + DES + CON (Defensa sin armadura)';
    if(cls==='Monje') return '10 + DES + SAB (Defensa sin armadura)';
    if(cls==='Brujo' && builderData.classSpecialChoice==='Armadura de sombras') return '13 + DES (Armadura de mago)';
    if(builderData.classEquipmentChoice!=='A' && !(cls==='Guerrero' && dex==='B')) return '10 + DES (sin armadura)';
    if(cls==='Clérigo') return '13 + DES (máx. +2) + escudo (camisa de malla)';
    if(cls==='Druida') return '11 + DES + escudo (armadura de cuero)';
    if(cls==='Paladín') return '16 + escudo (cota de malla)';
    if(cls==='Guerrero' && dex==='A') return '16 (cota de malla)';
    if(cls==='Guerrero' && dex==='B') return '12 + DES (cuero tachonado)';
    if(cls==='Explorador') return '12 + DES (cuero tachonado)';
    if(cls==='Bardo' || cls==='Brujo' || cls==='Pícaro') return '11 + DES (armadura de cuero)';
    return '10 + DES (sin armadura)';
  }
  function builderModifier(score:number) { return Math.floor((score - 10) / 2); }
  function builderOriginFeatChoicesOk(feat:string,choices:string[],cantrips:string[],spell:string) {
    if (['Habilidoso','Fabricante','Músico'].includes(feat)) {
      const options=builderFeatChoiceOptions(feat);
      return choices.length===3 && new Set(choices).size===3 && choices.every(choice=>options.includes(choice));
    }
    const magicClass=builderMagicInitiateClass(feat);
    if (magicClass) return cantrips.length===2 && new Set(cantrips).size===2 && cantrips.every(name=>BUILDER_SPELL_LISTS[magicClass].cantrips.includes(name)) && BUILDER_SPELL_LISTS[magicClass].level1.includes(spell);
    return true;
  }
  function builderMissingFields(): string[] {
    const missing: string[] = [];
    const cls=BUILDER_CLASS_DATA[builderData.className];
    const backgroundFeat=BUILDER_BACKGROUND_DATA[builderData.background].feat;
    const featSkills=[...builderData.backgroundFeatChoices,...builderData.speciesFeatChoices].filter(choice=>BUILDER_SKILL_OPTIONS.includes(choice));
    if(!['A','B'].includes(builderData.backgroundEquipment)) missing.push('Opción de equipo del trasfondo (paso 3).');
    if(!['A','B',...(builderData.className==='Guerrero'?['C']:[])].includes(builderData.classEquipmentChoice)) missing.push('Opción de equipo de clase (paso 4).');
    if(!builderData.name.trim()) missing.push('Nombre del personaje (paso 2: pulsa «Generar nombre»).');
    if(!builderData.alignment) missing.push('Alineamiento (paso 2).');
    if(BUILDER_SPECIES_CHOICES[builderData.species].length && !BUILDER_SPECIES_CHOICES[builderData.species].includes(builderData.speciesChoice)) missing.push('Linaje o variante de especie (paso 2).');
    if(['Aasimar','Humano','Tiefling'].includes(builderData.species) && !builderData.speciesSize) missing.push('Tamaño de la especie (paso 2).');
    if(['Elfo','Gnomo','Tiefling'].includes(builderData.species) && !['Inteligencia','Sabiduría','Carisma'].includes(builderData.speciesMagicAbility)) missing.push('Aptitud mágica de linaje (paso 2).');
    if(['Elfo','Humano'].includes(builderData.species) && !builderData.speciesSkill) missing.push('Habilidad adicional de especie (paso 2).');
    if(builderData.species==='Humano' && !builderOriginFeatChoicesOk(builderData.speciesExtraFeat,builderData.speciesFeatChoices,builderData.speciesMagicCantrips,builderData.speciesMagicSpell)) missing.push('Elecciones de la dote de origen adicional humana (paso 2).');
    const toolOptions=BUILDER_BACKGROUND_TOOL_OPTIONS[builderData.background]||[];
    if(toolOptions.length && !toolOptions.includes(builderData.backgroundToolChoice)) missing.push('Competencia con herramienta del trasfondo (paso 3).');
    if(!builderOriginFeatChoicesOk(backgroundFeat,builderData.backgroundFeatChoices,builderData.backgroundMagicCantrips,builderData.backgroundMagicSpell)) missing.push('Elecciones de la dote del trasfondo (paso 3).');
    const bgAbilities=BUILDER_BACKGROUND_DATA[builderData.background].abilities;
    const increasesOk=builderData.abilityIncreaseMode==='two'?bgAbilities.includes(builderData.abilityIncrease2)&&bgAbilities.includes(builderData.abilityIncrease1)&&builderData.abilityIncrease1!==builderData.abilityIncrease2:bgAbilities.includes(builderData.abilityIncrease1)&&bgAbilities.includes(builderData.abilityIncrease2)&&bgAbilities.includes(builderData.abilityIncrease3)&&new Set([builderData.abilityIncrease1,builderData.abilityIncrease2,builderData.abilityIncrease3]).size===3;
    if(!increasesOk) missing.push('Distribución de aumentos de característica del trasfondo (paso 3).');
    if(builderData.classSkillChoices.filter(Boolean).length!==BUILDER_CLASS_SKILLS[builderData.className].count) missing.push('Competencias de habilidad de clase: faltan '+(BUILDER_CLASS_SKILLS[builderData.className].count-builderData.classSkillChoices.filter(Boolean).length)+' (paso 4).');
    if(cls.weaponCount && builderData.weaponMasteries.length!==cls.weaponCount) missing.push('Maestrías con armas: faltan '+(cls.weaponCount-builderData.weaponMasteries.length)+' (paso 4).');
    const expectedTools=builderData.className==='Bardo'?3:builderData.className==='Monje'?1:0;
    if(builderData.classToolsChoices.length!==expectedTools) missing.push('Competencias con herramientas de clase: faltan '+(expectedTools-builderData.classToolsChoices.length)+' (paso 4).');
    if(cls.specialOptions.length && !cls.specialOptions.includes(builderData.classSpecialChoice)) missing.push((cls.specialLabel||'Elección especial de clase')+' (paso 4).');
    if(builderData.className==='Pícaro' && builderData.classExpertise.length!==2) missing.push('Pericias de Pícaro: faltan '+(2-builderData.classExpertise.length)+' (paso 4).');
    const bonusCantrip=(builderData.className==='Clérigo'&&builderData.classSpecialChoice==='Taumaturgo')||(builderData.className==='Druida'&&builderData.classSpecialChoice==='Naturalista')?1:0;
    const cantripCount=cls.cantrips+bonusCantrip;
    if(builderData.selectedCantrips.length!==cantripCount) missing.push('Trucos de clase: faltan '+(cantripCount-builderData.selectedCantrips.length)+' (paso 4).');
    if(builderData.className==='Brujo'&&builderData.classSpecialChoice==='Pacto del grimorio'){
      if(builderData.warlockTomeCantrips.length!==3) missing.push('Trucos del Pacto del grimorio: faltan '+(3-builderData.warlockTomeCantrips.length)+' (paso 4).');
      if(builderData.warlockTomeRituals.length!==2) missing.push('Conjuros rituales del Pacto del grimorio: faltan '+(2-builderData.warlockTomeRituals.length)+' (paso 4).');
    }
    if(builderData.selectedSpells.length!==cls.spells) missing.push('Conjuros de nivel 1: faltan '+(cls.spells-builderData.selectedSpells.length)+' (paso 4).');
    if(cls.spellbook && builderData.wizardSpellbook.length!==cls.spellbook) missing.push('Libro de conjuros del Mago: faltan '+(cls.spellbook-builderData.wizardSpellbook.length)+' (paso 4).');
    const values=Object.values(builderData.abilities).map(Number), sorted=[...values].sort((a,b)=>b-a);
    const abilitiesOk=builderData.method==='standard'?JSON.stringify(sorted)===JSON.stringify([15,14,13,12,10,8]):builderData.method==='pointBuy'?values.every(v=>v>=8&&v<=15)&&builderPointCost()===27:builderData.method==='rolled'?builderRolledScores.length===6&&JSON.stringify(sorted)===JSON.stringify([...builderRolledScores].sort((a,b)=>b-a)):BUILDER_ABILITY_NAMES.every(name=>Number.isInteger(Number(builderData.abilities[name]))&&Number(builderData.abilities[name])>=1&&Number(builderData.abilities[name])<=20);
    if(!abilitiesOk) missing.push('Puntuaciones de característica: revisa el método elegido y sus seis valores (paso 5).');
    if(builderData.languages.length!==2) missing.push('Idiomas adicionales: selecciona exactamente 2; actualmente '+builderData.languages.length+' (paso 6).');
    if(builderData.className==='Pícaro' && !builderData.rogueLanguage) missing.push('Idioma adicional de Pícaro (paso 6).');
    if(!builderCanFinish() && !missing.length) missing.push('Hay una elección que no coincide con las opciones permitidas. Revisa los pasos 2 a 6.');
    return missing;
  }
  function builderCanFinish() {
    const cls = BUILDER_CLASS_DATA[builderData.className];
    const selectedClassSkills=builderData.classSkillChoices.filter(Boolean);
    const allFeatSkillChoices=[...builderData.backgroundFeatChoices,...builderData.speciesFeatChoices].filter(choice=>BUILDER_SKILL_OPTIONS.includes(choice));
    const skillsOk = selectedClassSkills.length === BUILDER_CLASS_SKILLS[builderData.className].count && new Set(selectedClassSkills).size===selectedClassSkills.length && selectedClassSkills.every(skill=>BUILDER_CLASS_SKILLS[builderData.className].options.includes(skill) && !BUILDER_BACKGROUND_DATA[builderData.background].skills.includes(skill) && skill!==builderData.speciesSkill && !allFeatSkillChoices.includes(skill));
    const masteriesOk = builderData.weaponMasteries.length === cls.weaponCount && new Set(builderData.weaponMasteries).size===cls.weaponCount && builderData.weaponMasteries.every(name=>BUILDER_WEAPON_MASTERY_OPTIONS.includes(name));
    const expectedTools = builderData.className === 'Bardo' ? 3 : builderData.className === 'Monje' ? 1 : 0;
    const validClassTools=builderData.className==='Bardo'?BUILDER_MUSICAL_INSTRUMENTS:builderData.className==='Monje'?[...BUILDER_ARTISAN_TOOLS,...BUILDER_MUSICAL_INSTRUMENTS]:[];
    const classToolsOk = builderData.classToolsChoices.length === expectedTools && new Set(builderData.classToolsChoices).size===builderData.classToolsChoices.length && builderData.classToolsChoices.every(tool=>validClassTools.includes(tool));
    const backgroundToolOptions=BUILDER_BACKGROUND_TOOL_OPTIONS[builderData.background]||[];
    const backgroundToolOk = !backgroundToolOptions.length || backgroundToolOptions.includes(builderData.backgroundToolChoice);
    const expertiseOk = builderData.className !== 'Pícaro' || (builderData.classExpertise.length === 2 && new Set(builderData.classExpertise).size===2 && builderData.classExpertise.every(skill => [...BUILDER_BACKGROUND_DATA[builderData.background].skills,...builderData.classSkillChoices,builderData.speciesSkill,...builderData.backgroundFeatChoices.filter(choice => BUILDER_SKILL_OPTIONS.includes(choice)),...builderData.speciesFeatChoices.filter(choice => BUILDER_SKILL_OPTIONS.includes(choice))].includes(skill)));
    const specialOk = cls.specialOptions.length === 0 || cls.specialOptions.includes(builderData.classSpecialChoice);
    const bonusCantrip = (builderData.className === 'Clérigo' && builderData.classSpecialChoice === 'Taumaturgo') || (builderData.className === 'Druida' && builderData.classSpecialChoice === 'Naturalista') ? 1 : 0;
    const classCantripOptions=BUILDER_SPELL_LISTS[builderData.className]?.cantrips||[];
    const cantripsOk = builderData.selectedCantrips.length === cls.cantrips + bonusCantrip && new Set(builderData.selectedCantrips).size===builderData.selectedCantrips.length && builderData.selectedCantrips.every(name=>classCantripOptions.includes(name));
    const tomeOk = builderData.className !== 'Brujo' || builderData.classSpecialChoice !== 'Pacto del grimorio' || (builderData.warlockTomeCantrips.length===3 && new Set(builderData.warlockTomeCantrips).size===3 && builderData.warlockTomeCantrips.every(name=>BUILDER_TOME_CANTRIPS.includes(name) && !builderData.selectedCantrips.includes(name)) && builderData.warlockTomeRituals.length===2 && new Set(builderData.warlockTomeRituals).size===2 && builderData.warlockTomeRituals.every(name=>BUILDER_TOME_RITUALS.includes(name) && !builderData.selectedSpells.includes(name)));
    const classLevelOneSpells=BUILDER_SPELL_LISTS[builderData.className]?.level1||[];
    const spellsOk = builderData.selectedSpells.length === cls.spells && new Set(builderData.selectedSpells).size===builderData.selectedSpells.length && builderData.selectedSpells.every(name=>classLevelOneSpells.includes(name));
    const bookOk = cls.spellbook===0 || (builderData.wizardSpellbook.length===cls.spellbook && new Set(builderData.wizardSpellbook).size===cls.spellbook && builderData.wizardSpellbook.every(name=>BUILDER_SPELL_LISTS.Mago.level1.includes(name)) && builderData.selectedSpells.every(name=>builderData.wizardSpellbook.includes(name)));
    const abilityValues = Object.values(builderData.abilities).map(Number);
    const sortedAbilities = [...abilityValues].sort((a,b)=>b-a);
    const standardOk = JSON.stringify(sortedAbilities) === JSON.stringify([15,14,13,12,10,8]);
    const pointBuyOk = abilityValues.every(value=>value>=8 && value<=15) && builderPointCost() === 27;
    const rolledOk = builderRolledScores.length === 6 && JSON.stringify(sortedAbilities) === JSON.stringify([...builderRolledScores].sort((a,b)=>b-a));
    const freeOk = BUILDER_ABILITY_NAMES.every(name => Number.isInteger(Number(builderData.abilities[name])) && Number(builderData.abilities[name]) >= 1 && Number(builderData.abilities[name]) <= 20);
    const abilitiesOk = builderData.method === 'standard' ? standardOk : builderData.method === 'pointBuy' ? pointBuyOk : builderData.method === 'rolled' ? rolledOk : builderData.method === 'free' ? freeOk : false;
    const speciesChoiceOk = BUILDER_SPECIES_CHOICES[builderData.species].length === 0 || BUILDER_SPECIES_CHOICES[builderData.species].includes(builderData.speciesChoice);
    const speciesSkillOk = !['Elfo','Humano'].includes(builderData.species) || (BUILDER_SKILL_OPTIONS.includes(builderData.speciesSkill) && !BUILDER_BACKGROUND_DATA[builderData.background].skills.includes(builderData.speciesSkill) && !builderData.classSkillChoices.includes(builderData.speciesSkill));
    const speciesMagicAbilityOk = !['Elfo','Gnomo','Tiefling'].includes(builderData.species) || ['Inteligencia','Sabiduría','Carisma'].includes(builderData.speciesMagicAbility);
    const speciesSizeOk = !['Aasimar','Humano','Tiefling'].includes(builderData.species) || Boolean(builderData.speciesSize);
    const languagesOk = builderData.languages.length === 2 && new Set(builderData.languages).size===2 && builderData.languages.every(language=>BUILDER_STANDARD_LANGUAGES.includes(language)) && (builderData.className !== 'Pícaro' || (Boolean(builderData.rogueLanguage) && BUILDER_LANGUAGES.includes(builderData.rogueLanguage) && !builderData.languages.includes(builderData.rogueLanguage) && builderData.rogueLanguage!=='Jerga de ladrones'));
    const backgroundFeatName=BUILDER_BACKGROUND_DATA[builderData.background].feat;
    const backgroundFeatOptions=builderFeatChoiceOptions(backgroundFeatName);
    const backgroundFeatOk = builderOriginFeatChoicesOk(backgroundFeatName,builderData.backgroundFeatChoices,builderData.backgroundMagicCantrips,builderData.backgroundMagicSpell) && builderData.backgroundFeatChoices.every(choice=>backgroundFeatOptions.includes(choice) && !BUILDER_BACKGROUND_DATA[builderData.background].skills.includes(choice) && choice!==builderData.speciesSkill && choice!==builderData.backgroundToolChoice);
    const speciesFeatOptions=builderFeatChoiceOptions(builderData.speciesExtraFeat);
    const speciesFeatOk=builderData.species!=='Humano' || (builderOriginFeatChoicesOk(builderData.speciesExtraFeat,builderData.speciesFeatChoices,builderData.speciesMagicCantrips,builderData.speciesMagicSpell) && builderData.speciesFeatChoices.every(choice=>speciesFeatOptions.includes(choice) && !BUILDER_BACKGROUND_DATA[builderData.background].skills.includes(choice) && choice!==builderData.speciesSkill && choice!==builderData.backgroundToolChoice && !builderData.backgroundFeatChoices.includes(choice)));
    return Boolean(builderData.name.trim()) && Boolean(builderData.alignment) && skillsOk && masteriesOk && classToolsOk && backgroundToolOk && expertiseOk && specialOk && cantripsOk && tomeOk && spellsOk && bookOk && abilitiesOk && speciesChoiceOk && speciesSkillOk && speciesMagicAbilityOk && speciesSizeOk && backgroundFeatOk && speciesFeatOk && languagesOk;
  }
  type BuilderChoiceField = 'backgroundFeatChoices'|'backgroundMagicCantrips'|'speciesFeatChoices'|'speciesMagicCantrips'|'languages'|'classExpertise'|'weaponMasteries'|'classToolsChoices'|'classSkillChoices'|'warlockTomeCantrips'|'warlockTomeRituals'|'selectedCantrips'|'wizardSpellbook'|'selectedSpells';
  let builderStepError = '';
  function builderToggleChoice(field:BuilderChoiceField, choice:string, max:number, event:Event) {
    const current=builderData[field] as string[];
    const checked=(event.currentTarget as HTMLInputElement).checked;
    if(checked) { if(current.includes(choice)||current.length>=max) return; builderData={...builderData,[field]:[...current,choice]}; }
    else builderData={...builderData,[field]:current.filter(value=>value!==choice)};
    builderStepError='';
  }
  function builderStepCanAdvance():boolean {
    const cls=BUILDER_CLASS_DATA[builderData.className], backgroundFeat=BUILDER_BACKGROUND_DATA[builderData.background].feat, speciesFeat=builderData.speciesExtraFeat;
    if(builderStep===0) return true;
    if(builderStep===1) {
      const alignmentOk=Boolean(builderData.alignment);
      const choiceOk=BUILDER_SPECIES_CHOICES[builderData.species].length===0 || BUILDER_SPECIES_CHOICES[builderData.species].includes(builderData.speciesChoice);
      const skillOk=!['Elfo','Humano'].includes(builderData.species) || (BUILDER_SKILL_OPTIONS.includes(builderData.speciesSkill) && !BUILDER_BACKGROUND_DATA[builderData.background].skills.includes(builderData.speciesSkill));
      const magicOk=!['Elfo','Gnomo','Tiefling'].includes(builderData.species) || ['Inteligencia','Sabiduría','Carisma'].includes(builderData.speciesMagicAbility);
      const sizeOk=!['Aasimar','Humano','Tiefling'].includes(builderData.species) || Boolean(builderData.speciesSize);
      const featOk=builderData.species!=='Humano' || (builderOriginFeatChoicesOk(speciesFeat,builderData.speciesFeatChoices,builderData.speciesMagicCantrips,builderData.speciesMagicSpell) && builderData.speciesFeatChoices.every(choice=>builderFeatChoiceOptions(speciesFeat).includes(choice)));
      return Boolean(builderData.name.trim())&&alignmentOk&&choiceOk&&skillOk&&magicOk&&sizeOk&&featOk;
    }
    if(builderStep===2) {
      const options=BUILDER_BACKGROUND_TOOL_OPTIONS[builderData.background]||[], toolOk=!options.length||options.includes(builderData.backgroundToolChoice);
      const featOk=builderOriginFeatChoicesOk(backgroundFeat,builderData.backgroundFeatChoices,builderData.backgroundMagicCantrips,builderData.backgroundMagicSpell)&&builderData.backgroundFeatChoices.every(choice=>builderFeatChoiceOptions(backgroundFeat).includes(choice));
      const abilities=BUILDER_BACKGROUND_DATA[builderData.background].abilities;
      const increasesOk=builderData.abilityIncreaseMode==='two'?abilities.includes(builderData.abilityIncrease2)&&abilities.includes(builderData.abilityIncrease1)&&builderData.abilityIncrease1!==builderData.abilityIncrease2:abilities.includes(builderData.abilityIncrease1)&&abilities.includes(builderData.abilityIncrease2)&&abilities.includes(builderData.abilityIncrease3)&&new Set([builderData.abilityIncrease1,builderData.abilityIncrease2,builderData.abilityIncrease3]).size===3;
      return toolOk&&featOk&&increasesOk;
    }
    if(builderStep===3) {
      const selectedSkills=builderData.classSkillChoices.filter(Boolean), featSkills=[...builderData.backgroundFeatChoices,...builderData.speciesFeatChoices].filter(choice=>BUILDER_SKILL_OPTIONS.includes(choice));
      const skillsOk=selectedSkills.length===BUILDER_CLASS_SKILLS[builderData.className].count&&new Set(selectedSkills).size===selectedSkills.length&&selectedSkills.every(skill=>BUILDER_CLASS_SKILLS[builderData.className].options.includes(skill)&&!BUILDER_BACKGROUND_DATA[builderData.background].skills.includes(skill)&&skill!==builderData.speciesSkill&&!featSkills.includes(skill));
      const masteriesOk=builderData.weaponMasteries.length===cls.weaponCount&&new Set(builderData.weaponMasteries).size===cls.weaponCount;
      const expectedTools=builderData.className==='Bardo'?3:builderData.className==='Monje'?1:0, toolsOk=builderData.classToolsChoices.length===expectedTools&&new Set(builderData.classToolsChoices).size===expectedTools;
      const eligibleExpertise=[...BUILDER_BACKGROUND_DATA[builderData.background].skills,...selectedSkills,builderData.speciesSkill,...featSkills], expertiseOk=builderData.className!=='Pícaro'||(builderData.classExpertise.length===2&&new Set(builderData.classExpertise).size===2&&builderData.classExpertise.every(skill=>eligibleExpertise.includes(skill)));
      const specialOk=cls.specialOptions.length===0||cls.specialOptions.includes(builderData.classSpecialChoice), bonusCantrip=(builderData.className==='Clérigo'&&builderData.classSpecialChoice==='Taumaturgo')||(builderData.className==='Druida'&&builderData.classSpecialChoice==='Naturalista')?1:0;
      const cantripsOk=builderData.selectedCantrips.length===cls.cantrips+bonusCantrip&&new Set(builderData.selectedCantrips).size===builderData.selectedCantrips.length;
      const tomeOk=builderData.className!=='Brujo'||builderData.classSpecialChoice!=='Pacto del grimorio'||(builderData.warlockTomeCantrips.length===3&&builderData.warlockTomeRituals.length===2);
      const spellsOk=builderData.selectedSpells.length===cls.spells, bookOk=cls.spellbook===0||(builderData.wizardSpellbook.length===cls.spellbook&&builderData.selectedSpells.every(spell=>builderData.wizardSpellbook.includes(spell)));
      return skillsOk&&masteriesOk&&toolsOk&&expertiseOk&&specialOk&&cantripsOk&&tomeOk&&spellsOk&&bookOk;
    }
    if(builderStep===4) {
      const values=Object.values(builderData.abilities).map(Number), sorted=[...values].sort((a,b)=>b-a);
      return builderData.method==='standard'?JSON.stringify(sorted)===JSON.stringify([15,14,13,12,10,8]):builderData.method==='pointBuy'?values.every(v=>v>=8&&v<=15)&&builderPointCost()===27:builderData.method==='rolled'?builderRolledScores.length===6&&JSON.stringify(sorted)===JSON.stringify([...builderRolledScores].sort((a,b)=>b-a)):BUILDER_ABILITY_NAMES.every(name=>Number.isInteger(Number(builderData.abilities[name]))&&Number(builderData.abilities[name])>=1&&Number(builderData.abilities[name])<=20);
    }
    return builderCanFinish();
  }
  function keepBuilderAtTop() {
    requestAnimationFrame(() => document.querySelector('.builder-panel')?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  }
  function builderNext() {
    if(builderStep<5) {
      if(!builderStepCanAdvance()) {
        const stepFields=builderMissingFields().filter(field=>field.includes('(paso '+(builderStep+1)+')'));
        builderStepError=stepFields.length
          ? 'Falta completar lo siguiente para avanzar:\\n• '+stepFields.join('\\n• ')
          : 'Hay una elección obligatoria incompleta en este paso. Revisa los campos visibles y vuelve a intentarlo.';
        requestAnimationFrame(()=>document.querySelector('.builder-step-error')?.scrollIntoView({block:'center',behavior:'smooth'}));
        return;
      }
      builderStepError=''; builderStep+=1; keepBuilderAtTop();
    }
  }
  function builderBack() { if(builderStep>0){builderStep-=1;builderStepError='';keepBuilderAtTop();} }
  const WEAPON_PROFILES: Record<string,{damage:string;damageType:string;category:'simple'|'martial';ability:'strength'|'dexterity'|'finesse';properties:string}> = {
    'Garrote':{damage:'1d4',damageType:'contundente',category:'simple',ability:'strength',properties:'Ligera'},
    'Daga':{damage:'1d4',damageType:'perforante',category:'simple',ability:'finesse',properties:'Sutil, ligera, arrojadiza (6/18 m)'},
    'Garrote grande':{damage:'1d8',damageType:'contundente',category:'simple',ability:'strength',properties:'A dos manos'},
    'Hacha de mano':{damage:'1d6',damageType:'cortante',category:'simple',ability:'strength',properties:'Ligera, arrojadiza (6/18 m)'},
    'Jabalina':{damage:'1d6',damageType:'perforante',category:'simple',ability:'strength',properties:'Arrojadiza (9/36 m)'},
    'Martillo ligero':{damage:'1d4',damageType:'contundente',category:'simple',ability:'strength',properties:'Ligera, arrojadiza (6/18 m)'},
    'Maza':{damage:'1d6',damageType:'contundente',category:'simple',ability:'strength',properties:'—'},
    'Bastón':{damage:'1d6',damageType:'contundente',category:'simple',ability:'strength',properties:'Versátil (1d8)'},
    'Hoz':{damage:'1d4',damageType:'cortante',category:'simple',ability:'strength',properties:'Ligera'},
    'Lanza':{damage:'1d6',damageType:'perforante',category:'simple',ability:'strength',properties:'Arrojadiza (6/18 m), versátil (1d8)'},
    'Dardo':{damage:'1d4',damageType:'perforante',category:'simple',ability:'finesse',properties:'Arrojadiza (6/18 m)'},
    'Arco corto':{damage:'1d6',damageType:'perforante',category:'simple',ability:'dexterity',properties:'Munición (24/96 m), a dos manos'},
    'Ballesta ligera':{damage:'1d8',damageType:'perforante',category:'simple',ability:'dexterity',properties:'Munición (24/96 m), carga, a dos manos'},
    'Honda':{damage:'1d4',damageType:'contundente',category:'simple',ability:'dexterity',properties:'Munición (9/36 m)'},
    'Hacha de guerra':{damage:'1d8',damageType:'cortante',category:'martial',ability:'strength',properties:'Versátil (1d10)'},
    'Mangual':{damage:'1d8',damageType:'contundente',category:'martial',ability:'strength',properties:'—'},
    'Alabarda':{damage:'1d10',damageType:'cortante',category:'martial',ability:'strength',properties:'Pesada, alcance, a dos manos'},
    'Hacha a dos manos':{damage:'1d12',damageType:'cortante',category:'martial',ability:'strength',properties:'Pesada, a dos manos'},
    'Espadón':{damage:'2d6',damageType:'cortante',category:'martial',ability:'strength',properties:'Pesada, a dos manos'},
    'Guja':{damage:'1d10',damageType:'cortante',category:'martial',ability:'strength',properties:'Pesada, alcance, a dos manos'},
    'Lanza de caballería':{damage:'1d10',damageType:'perforante',category:'martial',ability:'strength',properties:'Alcance, especial'},
    'Espada larga':{damage:'1d8',damageType:'cortante',category:'martial',ability:'strength',properties:'Versátil (1d10)'},
    'Maza a dos manos':{damage:'2d6',damageType:'contundente',category:'martial',ability:'strength',properties:'Pesada, a dos manos'},
    'Lucero del alba':{damage:'1d8',damageType:'perforante',category:'martial',ability:'strength',properties:'—'},
    'Pica':{damage:'1d10',damageType:'perforante',category:'martial',ability:'strength',properties:'Pesada, alcance, a dos manos'},
    'Estoque':{damage:'1d8',damageType:'perforante',category:'martial',ability:'finesse',properties:'Sutil'},
    'Cimitarra':{damage:'1d6',damageType:'cortante',category:'martial',ability:'finesse',properties:'Sutil, ligera'},
    'Espada corta':{damage:'1d6',damageType:'perforante',category:'martial',ability:'finesse',properties:'Sutil, ligera'},
    'Tridente':{damage:'1d8',damageType:'perforante',category:'martial',ability:'strength',properties:'Arrojadiza (6/18 m), versátil (1d10)'},
    'Pico de guerra':{damage:'1d8',damageType:'perforante',category:'martial',ability:'strength',properties:'Versátil (1d10)'},
    'Martillo de guerra':{damage:'1d8',damageType:'contundente',category:'martial',ability:'strength',properties:'Versátil (1d10)'},
    'Látigo':{damage:'1d4',damageType:'cortante',category:'martial',ability:'finesse',properties:'Sutil, alcance'},
    'Arco largo':{damage:'1d8',damageType:'perforante',category:'martial',ability:'dexterity',properties:'Munición (45/180 m), pesada, a dos manos'},
    'Ballesta de mano':{damage:'1d6',damageType:'perforante',category:'martial',ability:'dexterity',properties:'Munición (9/36 m), ligera, carga'},
    'Ballesta pesada':{damage:'1d10',damageType:'perforante',category:'martial',ability:'dexterity',properties:'Munición (30/120 m), pesada, carga, a dos manos'},
    'Cerbatana':{damage:'1',damageType:'perforante',category:'martial',ability:'dexterity',properties:'Munición (7,5/30 m), carga'},
    'Mosquete':{damage:'1d12',damageType:'perforante',category:'martial',ability:'dexterity',properties:'Munición (12/36 m), carga, a dos manos'},
    'Pistola':{damage:'1d10',damageType:'perforante',category:'martial',ability:'dexterity',properties:'Munición (9/27 m), carga'}
  };
  function weaponAttackDetails(target:RawSheet,names:string): string {
    const proficiency=getCharacterNumber(target,'COMBATE','Bonificador por competencia',2);
    const strength=getCharacterNumber(target,'ATRIBUTOS','Fuerza',10);
    const dexterity=getCharacterNumber(target,'ATRIBUTOS','Destreza',10);
    const strengthMod=Math.floor((strength-10)/2), dexterityMod=Math.floor((dexterity-10)/2);
    const profText=normalizeLevelText(getCharacterStat(target,'COMPETENCIAS','Armas'));
    const masteryText=normalizeLevelText(getCharacterStat(target,'ATAQUES','Maestrías con armas'));
    return names.split(/[,;\n]+/).map(name=>name.trim()).filter(Boolean).map(name=>{
      const profile=WEAPON_PROFILES[name];
      if(!profile) return name+': perfil de daño no disponible en los datos de armas.';
      const abilityMod=profile.ability==='finesse'?Math.max(strengthMod,dexterityMod):profile.ability==='dexterity'?dexterityMod:strengthMod;
      const normalizedName=normalizeLevelText(name);
      const proficient=(profile.category==='simple'&&profText.includes('sencillas'))||
        (profile.category==='martial'&&profText.includes('marciales'))||
        profText.includes(normalizedName)||
        (classWeaponSpecialProficiency(profText,profile,name));
      const attackBonus=abilityMod+(proficient?proficiency:0);
      const damageBonus=abilityMod===0?'':(abilityMod>0?'+':'')+abilityMod;
      const mastery=masteryText.includes(normalizedName)?' · Maestría elegida':'';
      return name+': ataque '+signedBonus(attackBonus)+' · '+profile.damage+damageBonus+' '+profile.damageType+
        ' · '+profile.properties+(proficient?'':' · Sin competencia')+mastery;
    }).join('\n');
  }
  function classWeaponSpecialProficiency(profText:string,profile:any,name:string):boolean {
    const n=normalizeLevelText(name);
    if(profText.includes('armas marciales con propiedad ligera o sutil')) return profile.category==='martial'&&/sutil|ligera/i.test(profile.properties);
    if(profText.includes('armas marciales cuerpo a cuerpo ligeras')) return profile.category==='martial'&&/ligera/i.test(profile.properties);
    return false;
  }
  const BUILDER_FIXED_SPECIES_SIZE: Record<string,string> = {
    'Dracónido':'Mediano','Enano':'Mediano','Elfo':'Mediano','Gnomo':'Pequeño',
    'Goliat':'Mediano','Mediano':'Pequeño','Orco':'Mediano'
  };
  const SKILL_ABILITY_MAP: Record<string,string> = {
    'Acrobacias':'Destreza','Atletismo':'Fuerza','Conocimiento arcano':'Inteligencia','Engaño':'Carisma',
    'Historia':'Inteligencia','Interpretación':'Carisma','Intimidación':'Carisma','Investigación':'Inteligencia',
    'Juego de manos':'Destreza','Medicina':'Sabiduría','Naturaleza':'Inteligencia','Perspicacia':'Sabiduría',
    'Persuasión':'Carisma','Percepción':'Sabiduría','Religión':'Inteligencia','Sigilo':'Destreza',
    'Supervivencia':'Sabiduría','Trato con animales':'Sabiduría'
  };
  function signedBonus(value:number): string { return (value>=0?'+':'')+value; }
  function getSpellRecord(name:string): any {
    const clean=String(name||'').replace(/\s*\([^)]*\)\s*$/,'').replace(/^Libro:\s*/i,'').trim();
    return (SPELLS as any[]).find(spell=>normalizeLevelText(spell.name)===normalizeLevelText(clean)) || null;
  }
  function describeSpells(names:string[]): string {
    const unique=[...new Set(names.map(name=>String(name||'').trim()).filter(Boolean))];
    return unique.map(name=>{
      const spell=getSpellRecord(name);
      if(!spell) return name+'\nDatos descriptivos no disponibles en el catálogo de conjuros.';
      return spell.name+' · '+(spell.level===0?'Truco':'Nivel '+spell.level)+' · '+spell.school+
        '\nTiempo: '+(spell.castingTime||'—')+' · Alcance: '+(spell.range||'—')+
        '\nComponentes: '+(spell.components||'—')+' · Duración: '+(spell.duration||'—')+
        '\n'+(spell.description||'Descripción no disponible.');
    }).join('\n\n');
  }
  function equipmentLines(value:string): string {
    return String(value||'').replace(/\b\d+\s*po\b/gi,'').replace(/\.$/,'').split(',').map(item=>item.trim()).filter(Boolean)
      .filter(item=>!(/^\d+\s*po$/i.test(item))).map(item=>'• '+item).join('\n') || '—';
  }
  function refreshDerivedCharacterSheet(target:RawSheet) {
    const proficiency=Math.max(2,getCharacterNumber(target,'COMBATE','Bonificador por competencia',2));
    const scores:Record<string,number>={};
    for(const ability of BUILDER_ABILITY_NAMES) scores[ability]=getCharacterNumber(target,'ATRIBUTOS',ability,10);
    const armorFormula=getCharacterStat(target,'COMBATE','Fórmula de clase de armadura');
    if(armorFormula) {
      const dexMod=Math.floor((scores.Destreza-10)/2),conMod=Math.floor((scores.Constitución-10)/2),wisMod=Math.floor((scores.Sabiduría-10)/2);
      let ac:number|null=null;
      if(armorFormula.startsWith('10 + DES + CON')) ac=10+dexMod+conMod;
      else if(armorFormula.startsWith('10 + DES + SAB')) ac=10+dexMod+wisMod;
      else if(armorFormula.startsWith('13 + DES (máx. +2)')) ac=13+Math.min(2,dexMod)+2;
      else if(armorFormula.startsWith('11 + DES + escudo')) ac=11+dexMod+2;
      else if(armorFormula.startsWith('16 + escudo')) ac=18;
      else if(armorFormula.startsWith('16 (cota de malla)')) ac=16;
      else if(armorFormula.startsWith('12 + DES')) ac=12+dexMod;
      else if(armorFormula.startsWith('13 + DES')) ac=13+dexMod;
      else if(armorFormula.startsWith('11 + DES')) ac=11+dexMod;
      else if(armorFormula.startsWith('10 + DES')) ac=10+dexMod;
      if(ac!==null) setCharacterStat(target,'COMBATE','Clase de armadura',ac+' ('+armorFormula+')');
    }
    const skillRaw=getCharacterStat(target,'COMPETENCIAS','Habilidades');
    const skillText=normalizeLevelText(skillRaw);
    const expertiseMatch=String(skillRaw).match(/pericia\s*:\s*([^\n;]+)/i);
    const expertise=normalizeLevelText(expertiseMatch?.[1]||'');
    for(const [skill,ability] of Object.entries(SKILL_ABILITY_MAP)) {
      const normalized=normalizeLevelText(skill);
      const proficient=skillText.includes(normalized);
      const expert=proficient && expertise.includes(normalized);
      const modifier=Math.floor((scores[ability]-10)/2)+(proficient?proficiency:0)+(expert?proficiency:0);
      setCharacterStat(target,'HABILIDADES',skill,signedBonus(modifier)+(expert?' · Pericia':proficient?' · Competente':''));
    }
    const savesText=normalizeLevelText(getCharacterStat(target,'COMBATE','Salvaciones'));
    for(const ability of BUILDER_ABILITY_NAMES) {
      const proficient=savesText.includes(normalizeLevelText(ability));
      const modifier=Math.floor((scores[ability]-10)/2)+(proficient?proficiency:0);
      setCharacterStat(target,'SALVACIONES',ability,signedBonus(modifier)+(proficient?' · Competente':''));
    }
    const featText=normalizeLevelText([
      getCharacterStat(target,'RASGOS Y DOTES','Dote de origen'),
      getCharacterStat(target,'RASGOS Y DOTES','Dotes adicionales'),
      getCharacterStat(target,'DOTE Y OPCIONES','Dote de origen')
    ].join(' '));
    const initiative=Math.floor((scores.Destreza-10)/2)+(featText.includes('alerta')?proficiency:0);
    setCharacterStat(target,'COMBATE','Iniciativa',signedBonus(initiative));
    const perception=Math.floor((scores.Sabiduría-10)/2)+(skillText.includes('percepcion')?proficiency:0)+
      (expertise.includes('percepcion')&&skillText.includes('percepcion')?proficiency:0);
    setCharacterStat(target,'COMBATE','Percepción pasiva',10+perception);
    const spellAbility=getCharacterStat(target,'CONJUROS','Aptitud mágica');
    if(BUILDER_ABILITY_NAMES.includes(spellAbility)) {
      const spellMod=Math.floor((scores[spellAbility]-10)/2);
      setCharacterStat(target,'CONJUROS','CD de salvación',8+spellMod+proficiency);
      setCharacterStat(target,'CONJUROS','Ataque de conjuro',signedBonus(spellMod+proficiency));
    }
    const speciesSpellAbility=getCharacterStat(target,'CONJUROS','Aptitud mágica de especie');
    if(BUILDER_ABILITY_NAMES.includes(speciesSpellAbility)) {
      const speciesSpellMod=Math.floor((scores[speciesSpellAbility]-10)/2);
      setCharacterStat(target,'CONJUROS','CD de especie',8+speciesSpellMod+proficiency);
      setCharacterStat(target,'CONJUROS','Ataque de conjuro de especie',signedBonus(speciesSpellMod+proficiency));
    }
    for(const [abilityField,dcField,attackField] of [['Aptitud mágica de trasfondo','CD de trasfondo','Ataque de conjuro de trasfondo'],['Aptitud mágica de dote','CD de dote','Ataque de conjuro de dote']]) {
      const ability=getCharacterStat(target,'CONJUROS',abilityField);
      if(BUILDER_ABILITY_NAMES.includes(ability)) {
        const abilityMod=Math.floor((scores[ability]-10)/2);
        setCharacterStat(target,'CONJUROS',dcField,8+abilityMod+proficiency);
        setCharacterStat(target,'CONJUROS',attackField,signedBonus(abilityMod+proficiency));
      }
    }
    const subclassSpellAbility=getCharacterStat(target,'CONJUROS','Aptitud mágica de subclase');
    if(BUILDER_ABILITY_NAMES.includes(subclassSpellAbility)) {
      const subclassSpellMod=Math.floor((scores[subclassSpellAbility]-10)/2);
      setCharacterStat(target,'CONJUROS','CD de subclase',8+subclassSpellMod+proficiency);
      setCharacterStat(target,'CONJUROS','Ataque de conjuro de subclase',signedBonus(subclassSpellMod+proficiency));
    }
    const rangerStyleSpellAbility=getCharacterStat(target,'CONJUROS','Aptitud mágica de estilo de combate');
    if(BUILDER_ABILITY_NAMES.includes(rangerStyleSpellAbility)) {
      const rangerStyleSpellMod=Math.floor((scores[rangerStyleSpellAbility]-10)/2);
      setCharacterStat(target,'CONJUROS','CD de estilo de combate',8+rangerStyleSpellMod+proficiency);
      setCharacterStat(target,'CONJUROS','Ataque de conjuro de estilo de combate',signedBonus(rangerStyleSpellMod+proficiency));
    }
    const spellText=[
      getCharacterStat(target,'CONJUROS','Trucos'),
      getCharacterStat(target,'CONJUROS','Trucos de clase'),
      getCharacterStat(target,'CONJUROS','Conjuros preparados de clase'),
      getCharacterStat(target,'CONJUROS','Libro de conjuros'),
      getCharacterStat(target,'CONJUROS','Conjuros de especie'),
      getCharacterStat(target,'CONJUROS','Conjuros de trasfondo'),
      getCharacterStat(target,'CONJUROS','Conjuros de dote'),
      getCharacterStat(target,'CONJUROS','Arcanum místico'),
      getCharacterStat(target,'CONJUROS','Conjuros de escuela'),
      getCharacterStat(target,'CONJUROS','Maestría sobre conjuros nivel 1'),
      getCharacterStat(target,'CONJUROS','Maestría sobre conjuros nivel 2'),
      getCharacterStat(target,'CONJUROS','Conjuros característicos'),
      getCharacterStat(target,'CONJUROS','Conjuros de nivel 1'),
      getCharacterStat(target,'CONJUROS','Trucos de subclase'),
      getCharacterStat(target,'CONJUROS','Conjuros preparados de subclase'),
      getCharacterStat(target,'CONJUROS','Conjuros adicionales de subclase')
    ].join(',');
    const spellNames=spellText.replace(/Libro:\s*/gi,'').replace(/Preparados:\s*/gi,'')
      .split(/[,;\n]+/).map(value=>value.replace(/\s*\([^)]*\)\s*$/,'').trim())
      .filter(value=>value && !/^(libro:|preparados:)/i.test(value));
    if(spellNames.length) setCharacterStat(target,'DETALLE DE CONJUROS','Conjuros y descripciones',describeSpells(spellNames));
    const weaponNames=getCharacterStat(target,'ATAQUES','Armas incluidas en el equipo');
    if(weaponNames) setCharacterStat(target,'ATAQUES','Perfiles de ataque',weaponAttackDetails(target,weaponNames));
  }
  function buildLevelOneSheet() {
    const b = builderData;
    const mod = (n:number) => (builderModifier(n) >= 0 ? '+' : '') + builderModifier(n);
    const finalAbilities = builderAdjustedAbilities();
    const con = Number(finalAbilities.Constitución) || 10;
    const hp = (BUILDER_HIT_DIE[b.className] || 8) + builderModifier(con) + (b.species === 'Enano' ? 1 : 0) + ([b.feat,b.species === 'Humano' ? b.speciesExtraFeat : ''].includes('Duro') ? 2 : 0);
    const proficiency = '+2';
    const classData = BUILDER_CLASS_DATA[b.className];
    const classEquipment = b.classEquipmentChoice === 'B' ? classData.equipmentB : b.classEquipmentChoice === 'C' && b.className === 'Guerrero' ? '155 po.' : classData.equipmentA;
    const classEquipmentDetail = b.className === 'Bardo' && b.classEquipmentChoice === 'A' && b.classToolsChoices.length ? 'Instrumento incluido: ' + b.classToolsChoices[0] + '.' : '';
    const classChoices = [b.classSpecialChoice ? classData.specialLabel + ': ' + b.classSpecialChoice : '',builderClassChoiceDescription(b.className,b.classSpecialChoice), b.weaponMasteries.length ? 'Maestrías con armas: ' + b.weaponMasteries.join(', ') : '', b.classToolsChoices.length ? 'Competencias de herramientas: ' + b.classToolsChoices.join(', ') : '', b.className === 'Brujo' && b.classSpecialChoice === 'Pacto del grimorio' ? 'Trucos del grimorio: ' + b.warlockTomeCantrips.join(', ') + '; rituales: ' + b.warlockTomeRituals.join(', ') : ''].filter(Boolean).join('\n');
    const speciesChoices = [b.speciesChoice ? 'Elección de especie: ' + b.speciesChoice : '',builderSpeciesChoiceDescription(b.species,b.speciesChoice,b.speciesMagicAbility), ['Elfo','Gnomo','Tiefling'].includes(b.species) ? 'Aptitud mágica de linaje: ' + b.speciesMagicAbility : '', ['Aasimar','Humano','Tiefling'].includes(b.species) ? 'Tamaño: ' + b.speciesSize : ''].filter(Boolean).join('; ');
    const speciesCantrips = b.species === 'Aasimar' ? ['Luz'] : b.species === 'Elfo' ? (b.speciesChoice === 'Alto elfo' ? ['Prestidigitación'] : b.speciesChoice === 'Drow' ? ['Luces danzantes'] : ['Saber druídico']) : b.species === 'Gnomo' ? (b.speciesChoice === 'Gnomo de las rocas' ? ['Prestidigitación','Reparar'] : ['Ilusión menor']) : b.species === 'Tiefling' ? ['Taumaturgia', b.speciesChoice === 'Abisal' ? 'Rociada venenosa' : b.speciesChoice === 'Ctónico' ? 'Toque helado' : 'Descarga de fuego'] : [];
    const features = [classData.features, classChoices, BUILDER_SPECIES_TRAITS[b.species] || '', speciesChoices, b.traits].filter(Boolean).join('\n');
    const general = (name:string, values:string[]) => ({
      heading: { id: 1, name, stats: values.map((label,i)=>({id:i+1,name:label,value:''})) },
      values: { id: 2, name:'VALORES', stats: values.map((_,i)=>({id:i+1,name:'✎',value:''})) }
    });
    const pairs = [
      general('PERSONAJE',['Nombre','Clase','Subclase','Nivel','Especie','Trasfondo','Alineamiento','Experiencia','Jugador']),
      general('ATRIBUTOS',BUILDER_ABILITY_NAMES),
      general('COMBATE',['Puntos de golpe actuales','Puntos de golpe máximos','Dados de golpe','Clase de armadura','Iniciativa','Velocidad','Bonificador por competencia','Salvaciones','Fórmula de clase de armadura']),
      general('SALVACIONES',BUILDER_ABILITY_NAMES),
      general('HABILIDADES',BUILDER_SKILL_OPTIONS),
      general('COMPETENCIAS',['Habilidades','Herramientas','Armaduras','Armas','Idiomas']),
      general('RASGOS Y DOTES',['Rasgos de clase','Rasgos de especie','Dote de origen','Otros rasgos','Formas salvajes conocidas','Opciones de metamagia','Invocaciones sobrenaturales','Detalles de invocaciones','Maniobras de maestro del combate','Estilos de combate']),
      general('CONJUROS',['Aptitud mágica','CD de salvación','Ataque de conjuro','Trucos','Conjuros de nivel 1','Espacios de conjuro','Trucos máximos','Conjuros preparados máximos','Espacios por nivel','Trucos de clase','Conjuros preparados de clase','Libro de conjuros','Conjuros de especie','Aptitud mágica de especie','CD de especie','Ataque de conjuro de especie','Conjuros de trasfondo','Aptitud mágica de trasfondo','CD de trasfondo','Ataque de conjuro de trasfondo','Conjuros de dote','Aptitud mágica de dote','CD de dote','Ataque de conjuro de dote','Trucos de subclase','Conjuros preparados de subclase','Aptitud mágica de subclase','CD de subclase','Ataque de conjuro de subclase','Trucos de estilo de combate','Aptitud mágica de estilo de combate','CD de estilo de combate','Ataque de conjuro de estilo de combate','Lista de conjuros de estilo de combate','Arcanum místico','Conjuros de escuela','Opción de Furia elemental','Opción de Golpes benditos','Maestría sobre conjuros nivel 1','Maestría sobre conjuros nivel 2','Conjuros característicos']),
      general('EQUIPO',['Equipo inicial','Monedas']),
      general('HISTORIA',['Apariencia','Rasgos de personalidad','Ideal','Vínculo','Defecto','Historia','Notas']),
      general('PROGRESIÓN',['Nivel de clase','Rasgos de clase obtenidos']),
      general('DETALLES DEL TRASFONDO',['Aumentos de característica permitidos','Habilidades','Herramienta','Dote de origen','Equipo del trasfondo']),
      general('INVENTARIO',['Equipo de clase','Equipo de trasfondo','Equipo adicional']),
      general('ATAQUES',['Armas incluidas en el equipo','Maestrías con armas','Competencia con armas','Perfiles de ataque']),
      general('DETALLE DE CONJUROS',['Conjuros y descripciones']),
      general('DETALLES DE ESPECIE',['Elección de especie','Rasgos de especie','Competencia adicional','Elecciones mágicas','Tamaño'])
    ];
    const put = (pair:number,index:number,value:string) => {
      const target = pairs[pair];
      if (!target || index < 0) throw new Error('No se encontró la sección o el campo de ficha solicitado (sección ' + pair + ', campo ' + index + ').');
      const headingStats = target.heading.stats || (target.heading.stats = []);
      if (index >= headingStats.length) throw new Error('La sección «' + target.heading.name + '» no contiene el campo esperado en la posición ' + (index + 1) + '.');
      const valueSection = target.values || (target.values = { id: Date.now() + pair, name: 'VALORES', stats: [] });
      const valueStats = valueSection.stats || (valueSection.stats = []);
      if (index >= valueStats.length) throw new Error('La sección de valores «' + target.heading.name + '» no coincide con sus etiquetas.');
      valueStats[index].value = value;
    };
    put(0,0,b.name || 'Personaje sin nombre'); put(0,1,b.className); put(0,2,'No disponible (se elige en nivel 3)'); put(0,3,'1'); put(0,4,b.species); put(0,5,b.background); put(0,6,b.alignment); put(0,7,'0 PX'); put(0,8,b.player || '—');
    BUILDER_ABILITY_NAMES.forEach((a,i)=>put(1,i,String(finalAbilities[a])+' ('+mod(Number(finalAbilities[a]))+')'));
    put(2,0,String(Math.max(1,hp))+' PG'); put(2,1,String(Math.max(1,hp))+' PG'); put(2,2,'1d'+(BUILDER_HIT_DIE[b.className] || 8)); put(2,3,String(builderStartingAC())+' (según equipo inicial y rasgos)'); put(2,8,builderStartingACFormula()); put(2,4,(builderModifier(Number(finalAbilities.Destreza)) + ([b.feat,b.species === 'Humano' ? b.speciesExtraFeat : ''].includes('Alerta') ? 2 : 0) >= 0 ? '+' : '') + (builderModifier(Number(finalAbilities.Destreza)) + ([b.feat,b.species === 'Humano' ? b.speciesExtraFeat : ''].includes('Alerta') ? 2 : 0))); put(2,5,(b.species === 'Goliat' || (b.species === 'Elfo' && b.speciesChoice === 'Elfo de los bosques') ? '10,5 m' : '9 m')); put(2,6,proficiency); put(2,7,BUILDER_SAVES[b.className] || '—');
    const allFeatChoices = [...b.backgroundFeatChoices, ...(b.species === 'Humano' ? b.speciesFeatChoices : [])];
    const featSkills = allFeatChoices.filter(choice => BUILDER_SKILL_OPTIONS.includes(choice));
    const featTools = allFeatChoices.filter(choice => !BUILDER_SKILL_OPTIONS.includes(choice));
    const classArmorProficiency=b.className==='Clérigo' && b.classSpecialChoice==='Protector'?'Armaduras ligeras, medias y pesadas; escudos':b.className==='Druida' && b.classSpecialChoice==='Guardián'?'Armaduras ligeras y medias; escudos':BUILDER_ARMOR[b.className] || 'Según clase'; const classWeaponProficiency=b.className==='Clérigo' && b.classSpecialChoice==='Protector'?'Armas sencillas y marciales':b.className==='Druida' && b.classSpecialChoice==='Guardián'?'Armas sencillas y marciales':BUILDER_WEAPON_PROFICIENCIES[b.className] || 'Consultar clase';
    put(5,0,[...BUILDER_BACKGROUND_DATA[b.background].skills, ...b.classSkillChoices.filter(Boolean), b.speciesSkill, ...featSkills, b.skills, b.classExpertise.length ? 'Pericia: ' + b.classExpertise.join(', ') : ''].filter(Boolean).join('; ')); put(5,1,[BUILDER_BACKGROUND_DATA[b.background].tool.replace(/ a elección|Un tipo de /g,''), b.backgroundToolChoice, classData.tool, ...b.classToolsChoices, ...featTools, b.tools].filter(x=>x && x !== 'Ninguna competencia con herramientas de clase.').join('; ') || '—'); put(5,2,classArmorProficiency); put(5,3,classWeaponProficiency); put(5,4,['Común',...b.languages,b.className === 'Pícaro' ? 'Jerga de ladrones' : '',b.className === 'Pícaro' ? b.rogueLanguage : '', b.className === 'Druida' ? 'Druídico' : ''].filter(Boolean).join('; '));
    put(6,0,features); put(6,9,b.className==='Guerrero'?b.classSpecialChoice:''); put(6,1,[BUILDER_SPECIES_TRAITS[b.species] || '',builderSpeciesChoiceDescription(b.species,b.speciesChoice,b.speciesMagicAbility)].filter(Boolean).join('\n\n')); put(6,2,[b.feat, b.backgroundFeatChoices.length ? 'Opciones de dote: ' + b.backgroundFeatChoices.join(', ') : '', builderMagicInitiateClass(b.feat) ? 'Iniciado en la magia (' + builderMagicInitiateClass(b.feat) + '): trucos ' + b.backgroundMagicCantrips.join(', ') + '; conjuro ' + b.backgroundMagicSpell + '; aptitud ' + b.backgroundMagicAbility : '', b.species === 'Humano' ? 'Dote adicional: ' + b.speciesExtraFeat : '', b.speciesFeatChoices.length ? 'Opciones de dote adicional: ' + b.speciesFeatChoices.join(', ') : '', builderMagicInitiateClass(b.speciesExtraFeat) && b.species === 'Humano' ? 'Iniciado en la magia adicional: trucos ' + b.speciesMagicCantrips.join(', ') + '; conjuro ' + b.speciesMagicSpell + '; aptitud ' + b.speciesFeatMagicAbility : ''].filter(Boolean).join('; ')); put(6,3,b.traits || '—');
    const magicAbility = BUILDER_MAGIC_ABILITY[b.className]; const magicMod = magicAbility ? builderModifier(Number(finalAbilities[magicAbility])) : 0; const classLevelOne = (LEVEL_PROGRESSION as any).classes?.[b.className]?.rows?.[0]; const classResources = classLevelOne?.resources || {}; const classSlots = Object.entries(classResources).filter(([key,value]:any)=>/^Espacios nivel|^Espacios de conjuro$|^Nivel de los espacios$/.test(key) && value && value!=='—').map(([key,value]:any)=>key+': '+value).join(' · '); put(7,0,magicAbility || 'No tiene lanzamiento de conjuros a nivel 1'); put(7,1,magicAbility ? String(8 + magicMod + 2) : '—'); put(7,2,magicAbility ? (magicMod >= 0 ? '+' : '') + (magicMod + 2) : '—'); put(7,3,[...b.selectedCantrips, ...speciesCantrips, ...b.backgroundMagicCantrips, ...(b.species === 'Humano' ? b.speciesMagicCantrips : []), ...b.warlockTomeCantrips].join(', ') || (classData.cantrips ? 'Faltan por elegir ' + classData.cantrips + ' trucos' : 'No obtiene trucos de clase a nivel 1')); put(7,4,(b.className === 'Mago' ? 'Libro: ' + b.wizardSpellbook.join(', ') + '. Preparados: ' : '') + ([...b.selectedSpells, b.backgroundMagicSpell, ...(b.species === 'Humano' ? [b.speciesMagicSpell] : []), ...(b.className === 'Explorador' ? ['Marca del cazador (siempre preparado)'] : []), ...(b.className === 'Druida' ? ['Hablar con los animales (siempre preparado por Druídico)'] : []), ...(b.species === 'Gnomo' && b.speciesChoice === 'Gnomo de los bosques' ? ['Hablar con los animales (siempre preparado)'] : []), ...(b.className === 'Brujo' && b.classSpecialChoice === 'Pacto del grimorio' ? b.warlockTomeRituals : []), ...(b.className === 'Brujo' && b.classSpecialChoice === 'Pacto de la cadena' ? ['Encontrar familiar (Pacto de la cadena)'] : [])].filter(Boolean).join(', ') || (classData.spells ? 'Faltan por elegir ' + classData.spells + ' conjuros' : 'No tiene conjuros de clase a nivel 1'))); put(7,5,classSlots || '—'); put(7,6,classResources['Trucos'] || '—'); put(7,7,classResources['Conjuros preparados'] || '—'); put(7,8,classSlots || '—');
    put(7,9,b.selectedCantrips.join(', ')); put(7,10,b.selectedSpells.join(', ')); put(7,11,b.className==='Mago'?b.wizardSpellbook.join(', '):''); put(7,12,b.species==='Gnomo'&&b.speciesChoice==='Gnomo de los bosques'?'Hablar con los animales':''); put(7,13,b.species==='Aasimar'?'Carisma':(['Elfo','Gnomo','Tiefling'].includes(b.species)?b.speciesMagicAbility:''));
    put(7,16,[...b.backgroundMagicCantrips,b.backgroundMagicSpell].filter(Boolean).join(', ')); put(7,17,builderMagicInitiateClass(b.feat)?b.backgroundMagicAbility:'');
    put(7,20,b.species==='Humano'?[...b.speciesMagicCantrips,b.speciesMagicSpell].filter(Boolean).join(', '):''); put(7,21,b.species==='Humano'&&builderMagicInitiateClass(b.speciesExtraFeat)?b.speciesFeatMagicAbility:'');
    const backgroundEquipmentText=b.backgroundEquipment==='B'?'50 po':BUILDER_BACKGROUND_DATA[b.background].equipmentA;
    put(8,0,[classEquipment, classEquipmentDetail, b.backgroundEquipment === 'B' ? 'Trasfondo: 50 po en lugar del paquete A.' : BUILDER_BACKGROUND_DATA[b.background].equipmentA, b.equipment].filter(Boolean).join(' '));
    const goldTotal=[classEquipment,backgroundEquipmentText].join(' ').match(/\d+\s*po/gi)?.reduce((sum:number,coin:string)=>sum+Number(coin.match(/\d+/)?.[0]||0),0) || 0;
    put(8,1,goldTotal+' po (monedas iniciales de ambos paquetes)');
    put(9,0,''); put(9,1,''); put(9,2,''); put(9,3,''); put(9,4,''); put(9,5,''); put(9,6,b.notes || '');
    const backgroundData=BUILDER_BACKGROUND_DATA[b.background];
    const detailIndex=(name:string)=>pairs.findIndex(pair=>normalizeLevelText(pair.heading.name)===normalizeLevelText(name));
    const backgroundIndex=detailIndex('DETALLES DEL TRASFONDO');
    put(backgroundIndex,0,backgroundData.abilities.join(' / '));
    put(backgroundIndex,1,backgroundData.skills.join(', '));
    put(backgroundIndex,2,[backgroundData.tool,b.backgroundToolChoice].filter(Boolean).join(' · '));
    put(backgroundIndex,3,backgroundData.feat);
    put(backgroundIndex,4,b.backgroundEquipment==='B'?'50 po en lugar del paquete de equipo A':backgroundData.equipmentA);
    const speciesIndex=detailIndex('DETALLES DE ESPECIE');
    put(speciesIndex,0,[b.species,b.speciesChoice].filter(Boolean).join(' · '));
    put(speciesIndex,1,[BUILDER_SPECIES_TRAITS[b.species]||'',builderSpeciesChoiceDescription(b.species,b.speciesChoice,b.speciesMagicAbility)].filter(Boolean).join('\n\n')||'—');
    put(speciesIndex,2,b.speciesSkill||'—');
    put(speciesIndex,3,[b.speciesMagicAbility,b.speciesMagicCantrips.join(', '),b.speciesMagicSpell,b.speciesFeatMagicAbility].filter(Boolean).join(' · ')||'—');
    put(speciesIndex,4,b.speciesSize||BUILDER_FIXED_SPECIES_SIZE[b.species]||'No indicado');
    const inventoryIndex=detailIndex('INVENTARIO');
    put(inventoryIndex,0,equipmentLines(classEquipment+' '+classEquipmentDetail));
    put(inventoryIndex,1,equipmentLines(b.backgroundEquipment==='B'?'50 po':backgroundData.equipmentA));
    put(inventoryIndex,2,equipmentLines(b.equipment));
    const attacksIndex=detailIndex('ATAQUES');
    const backgroundItemsText=b.backgroundEquipment==='B'?'':backgroundData.equipmentA;
    const equipmentText=[classEquipment,backgroundItemsText,b.equipment].join(' ').toLocaleLowerCase('es');
    const weaponNames=BUILDER_WEAPON_MASTERY_OPTIONS.filter(weapon=>equipmentText.includes(weapon.toLocaleLowerCase('es')));
    put(attacksIndex,0,weaponNames.join(', ')||'No se identificaron armas individuales en el paquete seleccionado.');
    put(attacksIndex,1,b.weaponMasteries.join(', ')||'—');
    put(attacksIndex,2,'Bonificador por competencia: '+proficiency);
    put(attacksIndex,3,'');
    const detailSpellsIndex=detailIndex('DETALLE DE CONJUROS');
    const progressionIndex = detailIndex('PROGRESIÓN');
    put(progressionIndex,0,'1');
    const levelOneFeatureDetails=getClassFeaturesAtLevel(b.className,1).map((feature:any)=>feature.name).filter(Boolean).join(', ');
    put(progressionIndex,1,levelOneFeatureDetails || classLevelOne?.features || classData.features || '—');
    put(6,0,[levelOneFeatureDetails,classChoices,BUILDER_SPECIES_TRAITS[b.species]||'',speciesChoices,b.traits].filter(Boolean).join('\n\n'));
    put(6,6,b.className==='Brujo'?b.classSpecialChoice:''); put(6,7,b.className==='Brujo'?builderClassChoiceDescription('Brujo',b.classSpecialChoice):'');

    const spellNames=[...b.selectedCantrips,...speciesCantrips,...(b.species==='Gnomo'&&b.speciesChoice==='Gnomo de los bosques'?['Hablar con los animales']:[]),...b.backgroundMagicCantrips,...(b.species==='Humano'?b.speciesMagicCantrips:[]),...b.warlockTomeCantrips,...b.selectedSpells,...b.wizardSpellbook,b.backgroundMagicSpell,...(b.species==='Humano'?[b.speciesMagicSpell]:[]),...(b.className==='Explorador'?['Marca del cazador']:[]),...(b.className==='Brujo'&&b.classSpecialChoice==='Pacto del grimorio'?b.warlockTomeRituals:[])].filter(Boolean);
    put(detailSpellsIndex,0,describeSpells(spellNames));
    const result={id:Date.now(),name:b.name || 'Personaje sin nombre',notes:'Personaje de nivel 1 creado desde el asistente de creación del jugador. La ficha conserva elecciones, progresión y descripciones disponibles en los datos del Manual del Jugador 2024.',sections:pairs.flatMap(p=>[p.heading,p.values])} as RawSheet;
    if(b.className==='Paladín') setCharacterStat(result,'RASGOS Y DOTES','Reserva de Imposición de manos','5 PG');
    refreshDerivedCharacterSheet(result);
    return result;
  }
  function finishBuilder() {
    builderStepError = '';
    try {
      const missing = builderMissingFields();
      if (missing.length) {
        builderStepError = 'No se puede generar la ficha. Revisa estos campos:\\n• ' + missing.join('\\n• ');
        requestAnimationFrame(() => document.querySelector('.builder-step-error')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
        return;
      }
      const generated = buildLevelOneSheet();
      if (!generated || !Array.isArray(generated.sections) || !generated.sections.length) {
        throw new Error('La ficha se generó sin secciones. Revisa las elecciones y vuelve a intentarlo.');
      }
      builderPreview = generated;
      builderStep = 6;
      keepBuilderAtTop();
    } catch (error) {
      console.error('Error al generar la ficha:', error);
      builderStepError = 'No se pudo generar la ficha: ' + (error instanceof Error ? error.message : String(error));
      requestAnimationFrame(() => document.querySelector('.builder-step-error')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
    }
  }
  async function saveBuilderCharacter() {
    if (!builderPreview || builderSaving) return;
    builderSaving = true;
    try {
      const characterToSave = JSON.parse(JSON.stringify(builderPreview)) as RawSheet;
      localStorage.setItem('forja-raw-character', JSON.stringify(characterToSave));
      sheet = characterToSave;
      builderPreview = null;
      playerCreating = false;
      activeTab = 'Datos';
      if (obrReady && obrRole === 'PLAYER') {
        syncPending = true;
        await flushAutoSync();
        notice = syncStatus === 'Ficha sincronizada con la sala.'
          ? 'Personaje guardado en tu ficha y sincronizado con la sala.'
          : 'Personaje guardado en tu ficha y en este navegador. No se pudo sincronizar con la sala.';
      } else {
        notice = 'Personaje guardado en tu ficha y en este navegador.';
      }
    } catch (error) {
      notice = 'No se pudo guardar el personaje: ' + (error instanceof Error ? error.message : String(error));
    } finally {
      builderSaving = false;
    }
  }
  function startBuilder() { if (demoPreview) sheet = null; demoPreview = false; resetBuilder(); playerCreating = true; }
  function openDemoPreview() {
    const sample = createInitialBuilderData();
    sample.name = 'Aldric Valdemar';
    sample.player = 'Vista de ejemplo';
    sample.className = 'Guerrero';
    sample.species = 'Humano';
    sample.background = 'Soldado';
    sample.alignment = 'Legal bueno';
    sample.classSkillChoices = ['Atletismo', 'Percepción'];
    sample.weaponMasteries = ['Espada larga', 'Jabalina'];
    sample.languages = ['Enano', 'Élfico'];
    sample.equipment = '';
    builderData = sample;
    sheet = buildLevelOneSheet();
    demoPreview = true;
    playerCreating = false;
    playerSheetTab = 'Acciones';
    importOpen = false;
    notice = '';
  }
  function closeDemoPreview() {
    demoPreview = false;
    sheet = null;
    playerCreating = false;
  }
  function downloadBuilderSheet() {
    if (!builderPreview) return;
    const json = JSON.stringify(builderPreview,null,2);
    const blob = new Blob([json],{type:'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=(builderPreview.name || 'personaje').replace(/[^a-z0-9_-]+/gi,'-')+'.json'; a.click();
    URL.revokeObjectURL(url);
  }

  import MONSTERS from './monsters.json';
  import RULES from './rules.json';
import SPELLS from './spells.json';
import ITEMS from './items.json';


  let customRolls: CustomRoll[] = [];
  let lastRollId = '';
  let newRollName = '';
  let newRollParts: RollPart[] = [createRollPart()];
  function createRollPart(): RollPart {
    return { id: String(Date.now()) + Math.random().toString(36).slice(2), name: 'Ataque', die: 20, bonus: 0 };
  }
  function addRollPart() {
    newRollParts = [...newRollParts, { ...createRollPart(), name: 'Daño', die: 4 }];
  }
  function removeRollPart(id: string) {
    if (newRollParts.length > 1) newRollParts = newRollParts.filter(part => part.id !== id);
  }
  const DICE_PLUS_SOURCE = 'com.heunithen.dnd2024-character-builder';
  const MONSTER_CR_FILTERS = ['Todos', ...Array.from(new Set(MONSTERS.map(monster => monster.cr.split(' ')[0]))).sort((a, b) => { const value = (cr: string) => { const [n, d] = cr.split('/').map(Number); return d ? n / d : n; }; return value(a) - value(b); })];
  $: filteredMonsters = MONSTERS.filter(monster => (monsterCrFilter === 'Todos' || monster.cr.startsWith(monsterCrFilter + ' ')) && monster.name.toLowerCase().includes(monsterSearch.trim().toLowerCase()));
  const itemTypes = ['Todos', ...Array.from(new Set(ITEMS.map(item => item.type))).sort((a,b) => a.localeCompare(b,'es'))];
  function itemPriceGold(price: string): number | null {
    const match = price.match(/^([\\d.,]+)\\s*(po|pp|pc|ppt)$/i);
    if (!match) return null;
    const amount = Number(match[1].replace(/\\./g, '').replace(',', '.'));
    return Number.isFinite(amount) ? amount * ({ po: 1, pp: 0.1, pc: 0.01, ppt: 10 } as Record<string, number>)[match[2].toLowerCase()] : null;
  }
  function itemWeightKg(weight: string): number | null {
    const match = weight.match(/^([\\d.,]+)\\s*(kg|g)$/i);
    if (!match) return null;
    const amount = Number(match[1].replace(/\\./g, '').replace(',', '.'));
    return Number.isFinite(amount) ? amount * (match[2].toLowerCase() === 'g' ? 0.001 : 1) : null;
  }
  $: filteredItems = ITEMS.filter(item => {
    const query = itemSearch.trim().toLocaleLowerCase('es');
    const price = itemPriceGold(item.price);
    const weight = itemWeightKg(item.weight);
    return (itemTypeFilter === 'Todos' || item.type === itemTypeFilter) &&
      (!query || (item.name + ' ' + item.type + ' ' + item.source).toLocaleLowerCase('es').includes(query)) &&
      (itemPriceMin === '' || (price !== null && price >= Number(itemPriceMin))) &&
      (itemPriceMax === '' || (price !== null && price <= Number(itemPriceMax))) &&
      (itemWeightMin === '' || (weight !== null && weight >= Number(itemWeightMin))) &&
      (itemWeightMax === '' || (weight !== null && weight <= Number(itemWeightMax)));
  });
  const SPELL_CLASSES = ['Bardo', 'Brujo', 'Clérigo', 'Druida', 'Explorador', 'Hechicero', 'Mago', 'Paladín'];
  const SPELL_SCHOOLS = ['Abjuración', 'Adivinación', 'Conjuración', 'Encantamiento', 'Evocación', 'Ilusionismo', 'Nigromancia', 'Transmutación'];
  $: filteredSpells = SPELLS.filter(spell =>
    (spellLevelFilter === 'Todos' || String(spell.level) === spellLevelFilter) &&
    (spellClassFilter === 'Todas' || spell.classes.includes(spellClassFilter.toLocaleLowerCase('es'))) &&
    (spellSchoolFilter === 'Todas' || spell.school === spellSchoolFilter) &&
    (!spellSearch.trim() || (spell.name + ' ' + spell.description).toLocaleLowerCase('es').includes(spellSearch.trim().toLocaleLowerCase('es')))
  );
  const RULE_CATEGORIES = ['Todas', 'General', 'Acción', 'Estado', 'Área de efecto', 'Actitud', 'Peligro', 'Abreviatura'];
  $: filteredRules = RULES.filter(rule =>
    (rulesCategoryFilter === 'Todas' || rule.category === rulesCategoryFilter) &&
    (!rulesSearch.trim() || (rule.name + ' ' + rule.description + ' ' + rule.category).toLocaleLowerCase('es').includes(rulesSearch.trim().toLocaleLowerCase('es')))
  );

  function persistCustomRolls() {
    localStorage.setItem('forja-custom-rolls', JSON.stringify(customRolls));
  }

  function addCustomRoll() {
    const name = newRollName.trim();
    if (!name) { notice = 'Escribe un nombre para la tirada.'; return; }
    if (!newRollParts.length || newRollParts.some(part => !part.name.trim())) { notice = 'Cada tirada necesita un nombre.'; return; }
    customRolls = [{ id: String(Date.now()) + Math.random().toString(36).slice(2), name, parts: newRollParts.map(part => ({ ...part, name: part.name.trim(), bonus: Number(part.bonus) || 0 })) }, ...customRolls];
    newRollName = '';
    newRollParts = [createRollPart()];
    persistCustomRolls();
  }

  function rollableParts(value: string): { text: string; rollable: boolean; notation: string }[] {
    const parts: { text: string; rollable: boolean; notation: string }[] = [];
    // Detecta dados (incluido d20 sin cantidad) y modificadores aislados como +1/-2.
    // El modificador aislado se interpreta como una prueba d20 con ese bonificador.
    const pattern = /(?<![\w])(?:[+-]?\s*\d+\s*)?d\s*(?:4|6|8|10|12|20|100)(?:(?:kh|kl)\s*\d+)?(?:\s*[+-]\s*\d+(?!\s*d))?|[+\-−]\s*\d+/gi;
    let last = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(value)) !== null) {
      if (match.index > last) parts.push({ text: value.slice(last, match.index), rollable: false, notation: '' });
      const token = match[0].replace(/\s+/g, '').replace(/−/g, '-');
      let notation = token;
      if (/^[+\-]\d+$/.test(token)) notation = '1d20' + token;
      else {
        notation = notation.replace(/^\+/, '');
        if (/^d/i.test(notation)) notation = '1' + notation;
      }
      parts.push({ text: match[0], rollable: true, notation });
      last = match.index + match[0].length;
    }
    if (last < value.length) parts.push({ text: value.slice(last), rollable: false, notation: '' });
    return parts.length ? parts : [{ text: value, rollable: false, notation: '' }];
  }

  async function sendSheetRoll(notation: string, label: string) {
    if (!obrReady || (obrRole !== 'PLAYER' && obrRole !== 'GM')) {
      notice = 'Las tiradas solo pueden enviarse desde Owlbear Rodeo.';
      return;
    }
    if (!/^[+-]?(?:\d+)?d(?:4|6|8|10|12|20|100)(?:(?:kh|kl)\d+)?(?:[+-]\d+)?$/i.test(notation)) {
      notice = 'La notación de dados no es válida: ' + notation;
      return;
    }
    try {
      const ready = await checkDicePlusReady();
      if (!ready) {
        notice = 'Dice+ no está disponible en esta sala. Activa la extensión Dice+ para tirar.';
        return;
      }
      const playerId = await OBR.player.getId();
      const currentPlayerName = await OBR.player.getName();
      const cleanLabel = label.replace(/[#+\-*/(),\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
      const rollId = 'forja_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      lastRollId = rollId;
      await OBR.broadcast.sendMessage('dice-plus/roll-request', {
        rollId, playerId, playerName: currentPlayerName, rollTarget: 'everyone',
        diceNotation: notation + (cleanLabel ? '#' + cleanLabel : ''),
        showResults: true, timestamp: Date.now(), source: DICE_PLUS_SOURCE
      }, { destination: 'ALL' });
      notice = 'Tirada enviada a Dice+: ' + notation;
    } catch {
      notice = 'No se pudo enviar la tirada a Dice+.';
    }
  }

  async function checkDicePlusReady(): Promise<boolean> {
    const requestId = String(Date.now()) + Math.random().toString(36).slice(2);
    return new Promise((resolve) => {
      const unsubscribe = OBR.broadcast.onMessage('dice-plus/isReady', (event: any) => {
        if (event.data?.ready === true && event.data.requestId === requestId) {
          unsubscribe();
          resolve(true);
        }
      });
      OBR.broadcast.sendMessage('dice-plus/isReady', { requestId, timestamp: Date.now() }, { destination: 'ALL' });
      setTimeout(() => { unsubscribe(); resolve(false); }, 1200);
    });
  }

  async function performCustomRoll(group: CustomRoll, roll: RollPart, mode: 'normal' | 'advantage' | 'disadvantage') {
    if (!obrReady || (obrRole !== 'PLAYER' && obrRole !== 'GM')) {
      notice = 'Las tiradas solo pueden enviarse desde Owlbear Rodeo.';
      return;
    }
    try {
      const ready = await checkDicePlusReady();
      if (!ready) {
        notice = 'Dice+ no está disponible en esta sala. Activa la extensión Dice+ para tirar.';
        return;
      }
      const playerId = await OBR.player.getId();
      const currentPlayerName = await OBR.player.getName();
      const die = Number(roll.die);
      const bonus = Number(roll.bonus);
      if (![4, 6, 8, 10, 12, 20, 100].includes(die) || !Number.isFinite(bonus) || !Number.isInteger(bonus)) {
        notice = 'La tirada tiene un dado o bonificador no válido. Revisa su configuración.';
        return;
      }
      const dice = mode === 'normal' ? '1d' + die : '2d' + die + (mode === 'advantage' ? 'kh1' : 'kl1');
      const modifier = bonus === 0 ? '' : (bonus > 0 ? '+' : '') + bonus;
      const label = (group.name + ' ' + roll.name).replace(/[#+\-*/(),\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
      const notation = dice + modifier + (label ? '#' + label : '');
      const rollId = 'forja_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      lastRollId = rollId;
      await OBR.broadcast.sendMessage('dice-plus/roll-request', {
        rollId,
        playerId,
        playerName: currentPlayerName,
        rollTarget: 'everyone',
        diceNotation: notation,
        showResults: true,
        timestamp: Date.now(),
        source: DICE_PLUS_SOURCE
      }, { destination: 'ALL' });
      notice = 'Tirada enviada a Dice+.';
    } catch {
      notice = 'No se pudo enviar la tirada a Dice+.';
    }
  }

  function removeCustomRoll(id: string) {
    customRolls = customRolls.filter(roll => roll.id !== id);
    persistCustomRolls();
  }

  function editField(target: Record<string, unknown>, key: string, event: Event) {
    target[key] = (event.currentTarget as HTMLInputElement | HTMLTextAreaElement).value;
    if (sheet) {
      sheet = { ...sheet };
      scheduleAutoSync();
    }
  }

  function scheduleAutoSync() {
    if (!sheet) return;
    localStorage.setItem('forja-raw-character', JSON.stringify(sheet));
    if (!obrReady || obrRole !== 'PLAYER') return;
    syncStatus = 'Cambios pendientes de sincronizar…';
    clearTimeout(autoSyncTimer);
    autoSyncTimer = setTimeout(() => {
      syncPending = true;
      void flushAutoSync();
    }, 650);
  }

  async function flushAutoSync() {
    if (syncInProgress || !syncPending || !sheet || !obrReady || obrRole !== 'PLAYER') return;
    syncInProgress = true;
    try {
      while (syncPending && sheet) {
        syncPending = false;
        const snapshot = JSON.parse(JSON.stringify(sheet)) as RawSheet;
        const id = await OBR.player.getId();
        const name = await OBR.player.getName();
        await OBR.player.setMetadata({ [KEY]: { character: snapshot, playerName: name, updatedAt: new Date().toISOString() } });
        await OBR.broadcast.sendMessage(CHANNEL, {
          type: 'character-updated', playerId: id, playerName: name, character: snapshot
        }, { destination: 'ALL' });
      }
      syncStatus = 'Ficha sincronizada con la sala.';
    } catch {
      syncStatus = 'No se pudo sincronizar. Los cambios siguen guardados en este navegador.';
    } finally {
      syncInProgress = false;
      if (syncPending) void flushAutoSync();
    }
  }

  function editSheetField(key: string, event: Event) {
    if (sheet) editField(sheet, key, event);
  }

  function editStatValue(pair: { heading: RawSection; values?: RawSection }, stat: RawStat, index: number, event: Event) {
    const valueStat = pair.values?.stats?.[index];
    editField(valueStat || stat, 'value', event);
  }

  function importJson(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    file.text().then(async (contents) => {
      const imported = JSON.parse(contents) as RawSheet;
      if (!imported || typeof imported !== 'object' || !Array.isArray(imported.sections)) {
        throw new Error('Formato de ficha no válido');
      }
      sheet = imported;
      playerCreating = false;
      localStorage.setItem('forja-raw-character', JSON.stringify(sheet));
      importOpen = false;
      if (obrReady && obrRole === 'PLAYER') {
        syncPending = true;
        await flushAutoSync();
        notice = syncStatus === 'Ficha sincronizada con la sala.'
          ? 'Ficha importada y compartida con el director.'
          : 'Ficha importada localmente. No se pudo compartir con la sala; vuelve a intentarlo.';
      } else {
        notice = 'Ficha importada.';
      }
      input.value = '';
    }).catch(() => {
      notice = 'No se pudo leer el archivo JSON.';
      input.value = '';
    });
  }


  const LEVEL_ABILITY_NAMES = ['Fuerza','Destreza','Constitución','Inteligencia','Sabiduría','Carisma'];
  const LEVEL_HIT_DIE: Record<string,number> = { 'Bárbaro':12,'Guerrero':10,'Paladín':10,'Explorador':10,'Bardo':8,'Brujo':8,'Clérigo':8,'Druida':8,'Monje':8,'Pícaro':8,'Hechicero':6,'Mago':6 };
  const LEVEL_FIXED_HP: Record<string,number> = { 'Bárbaro':7,'Guerrero':6,'Paladín':6,'Explorador':6,'Bardo':5,'Brujo':5,'Clérigo':5,'Druida':5,'Monje':5,'Pícaro':5,'Hechicero':4,'Mago':4 };
  function normalizeLevelText(value: unknown) { return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
  function getCharacterNumber(target: RawSheet, sectionName: string, statName: string, fallback = 0): number {
    const raw = getCharacterStat(target,sectionName,statName);
    const match = String(raw).replace(/,/g,'.').match(/[0-9]+(?:[.][0-9]+)?/);
    return match ? Number(match[0]) : fallback;
  }
  function formatAbilityScore(value: number): string {
    const modifier = Math.floor((value-10)/2);
    return value+' ('+(modifier>=0?'+':'')+modifier+')';
  }
  function getCharacterStat(target: RawSheet, sectionName: string, statName: string): string {
    const pair = sectionPairs(target.sections || []).find(p => normalizeLevelText(p.heading.name) === normalizeLevelText(sectionName));
    const index = pair?.heading.stats?.findIndex(st => normalizeLevelText(st.name) === normalizeLevelText(statName)) ?? -1;
    if (!pair || index < 0) return '';
    return displayValue(pair.values?.stats?.[index]?.value ?? pair.heading.stats?.[index]?.value);
  }
  function setCharacterStat(target: RawSheet, sectionName: string, statName: string, value: string | number) {
    let pair = sectionPairs(target.sections || []).find(p => normalizeLevelText(p.heading.name) === normalizeLevelText(sectionName));
    if (!pair) {
      const heading: RawSection = { id: Date.now(), name: sectionName, stats: [] };
      const values: RawSection = { id: Date.now()+1, name: 'VALORES', stats: [] };
      target.sections = [...(target.sections || []), heading, values];
      pair = { heading, values };
    }
    const stats = pair.heading.stats || (pair.heading.stats = []);
    let index = stats.findIndex(st => normalizeLevelText(st.name) === normalizeLevelText(statName));
    if (index < 0) {
      index = stats.length;
      stats.push({ id:index+1, name:statName, value:'' });
      if (pair.values) (pair.values.stats || (pair.values.stats=[])).push({id:index+1,name:'✎',value:''});
    }
    if (pair.values?.stats?.[index]) pair.values.stats[index].value = value;
    else stats[index].value = value;
  }

  function sheetValueByNames(target: RawSheet, names: string[], sections: string[] = []) {
    const wanted = names.map(normalizeLevelText);
    for (const pair of sectionPairs(target.sections || [])) {
      if (sections.length && !sections.some(section => normalizeLevelText(pair.heading.name) === normalizeLevelText(section))) continue;
      for (let i = 0; i < (pair.heading.stats || []).length; i++) {
        if (wanted.includes(normalizeLevelText(pair.heading.stats![i].name))) {
          return displayValue(pair.values?.stats?.[i]?.value ?? pair.heading.stats![i].value);
        }
      }
    }
    return '';
  }
  function sheetClassName(target: RawSheet) {
    return sheetValueByNames(target, ['Clase'], ['PERSONAJE','DATOS','IDENTIDAD']) || sheetValueByNames(target, ['Clase']);
  }
  function sheetLevel(target: RawSheet) {
    return getCharacterNumber(target, 'PROGRESIÓN', 'Nivel de clase',
      getCharacterNumber(target, 'PERSONAJE', 'Nivel',
        getCharacterNumber(target, 'DATOS', 'Nivel', 1))) || 1;
  }
  function readJsonRecord(target: RawSheet, section: string, field: string): Record<string, any> {
    try { const value = JSON.parse(getCharacterStat(target, section, field) || '{}'); return value && typeof value === 'object' ? value : {}; }
    catch { return {}; }
  }
  function saveSheetMutation() {
    if (!sheet) return;
    localStorage.setItem('forja-raw-character', JSON.stringify(sheet));
    if (obrReady && obrRole === 'PLAYER') { syncPending = true; void flushAutoSync(); }
  }
  function featureSourceGroups(target: RawSheet) {
    const className = sheetClassName(target);
    const level = sheetLevel(target);
    const classFeatures = ((CLASS_FEATURES as any).classes?.[className] || []);
    const groups: { level: number; features: any[] }[] = [];
    for (let n = 1; n <= 20; n++) {
      const features = classFeatures.filter((feature: any) => Number(feature.level) === n);
      if (features.length) groups.push({ level: n, features });
    }
    return { className, level, groups };
  }
  function featureKind(name: string) {
    const n = normalizeLevelText(name);
    if (/ataque adicional|maestria|competencia|mejora de caracteristica|subclase/.test(n)) return 'Progresión';
    if (/furia|inspiracion|canalizar|uso|cargas|veces|recuper/.test(n)) return 'Recurso';
    return 'Rasgo';
  }
  function spellClassKey(target: RawSheet) { return normalizeLevelText(sheetClassName(target)); }
  function spellKnownNames(target: RawSheet) {
    const fields = ['Trucos de clase','Trucos','Conjuros preparados de clase','Libro de conjuros','Conjuros de especie','Conjuros de trasfondo','Conjuros de dote','Conjuros preparados de subclase','Conjuros de escuela','Conjuros de nivel 1'];
    const text = fields.map(field => getCharacterStat(target, 'CONJUROS', field)).join(', ');
    return new Set(text.replace(/Libro:\s*/gi,'').replace(/Preparados:\s*/gi,'').split(/[,;\n]+/)
      .map((name: string) => normalizeLevelText(name.replace(/\s*\([^)]*\)\s*$/,'').trim()))
      .filter(Boolean));
  }
  function spellMaxLevel(target: RawSheet) {
    const className = sheetClassName(target);
    const level = sheetLevel(target);
    const row = ((LEVEL_PROGRESSION as any).classes?.[className]?.rows || []).find((item: any) => Number(item.level) === level);
    if (!row?.resources) return 0;
    let max = 0;
    for (const [key, value] of Object.entries(row.resources)) {
      const match = key.match(/Espacios nivel (\d+)/i);
      if (match && value !== '—' && Number(value) > 0) max = Math.max(max, Number(match[1]));
    }
    return max;
  }
  function spellSlotMaximums(target: RawSheet) {
    const className = sheetClassName(target);
    const level = sheetLevel(target);
    const row = ((LEVEL_PROGRESSION as any).classes?.[className]?.rows || []).find((item: any) => Number(item.level) === level);
    const result: Record<string, number> = {};
    for (const [key, value] of Object.entries(row?.resources || {})) {
      const match = key.match(/Espacios nivel (\d+)/i);
      if (match && value !== '—') result[match[1]] = Math.max(0, Number(value) || 0);
    }
    return result;
  }
  function spellStates(target: RawSheet) {
    return readJsonRecord(target, 'GESTIÓN DE FICHA', 'Estados de conjuros');
  }
  function slotUsage(target: RawSheet) {
    return readJsonRecord(target, 'GESTIÓN DE FICHA', 'Espacios gastados');
  }
  function spellIsKnown(target: RawSheet | null, spell: any) {
    if (!target) return false;
    const saved = spellStates(target)[normalizeLevelText(spell.name)];
    return saved?.known === true || spellKnownNames(target).has(normalizeLevelText(spell.name));
  }
  function spellIsPrepared(target: RawSheet | null, spell: any) {
    if (!target) return false;
    const saved = spellStates(target)[normalizeLevelText(spell.name)];
    if (typeof saved?.prepared === 'boolean') return saved.prepared;
    const className = sheetClassName(target);
    let prepared = [
      getCharacterStat(target, 'CONJUROS', 'Conjuros preparados de clase'),
      getCharacterStat(target, 'CONJUROS', 'Conjuros preparados de subclase')
    ].join(', ');
    if (normalizeLevelText(className) === 'mago') {
      const levelText = getCharacterStat(target, 'CONJUROS', 'Conjuros de nivel 1');
      prepared += ', ' + ((levelText.match(/Preparados:\\s*([^.]*)/i) || [])[1] || '');
    }
    return prepared.toLocaleLowerCase('es').includes(spell.name.toLocaleLowerCase('es'));
  }
  function toggleSpellState(spell: any, action: 'known' | 'prepared' | 'cast') {
    if (!sheet) return;
    const key = normalizeLevelText(spell.name);
    const states = spellStates(sheet);
    const current = { ...(states[key] || {}) };
    if (action === 'known') current.known = !spellIsKnown(sheet, spell);
    if (action === 'prepared') {
      current.known = true;
      current.prepared = !spellIsPrepared(sheet, spell);
    }
    if (action === 'cast') current.cast = !current.cast;
    states[key] = current;
    setCharacterStat(sheet, 'GESTIÓN DE FICHA', 'Estados de conjuros', JSON.stringify(states));
    saveSheetMutation();
  }
  function changeSlotUsage(level: string, delta: number) {
    if (!sheet) return;
    const usage = slotUsage(sheet);
    const maximums = spellSlotMaximums(sheet);
    usage[level] = Math.max(0, Math.min(Number(maximums[level] || 0), Number(usage[level] || 0) + delta));
    setCharacterStat(sheet, 'GESTIÓN DE FICHA', 'Espacios gastados', JSON.stringify(usage));
    saveSheetMutation();
  }
  function resetSpellUseStates() {
    if (!sheet) return;
    const states = spellStates(sheet);
    Object.keys(states).forEach(key => { states[key] = { ...states[key], cast: false }; });
    setCharacterStat(sheet, 'GESTIÓN DE FICHA', 'Estados de conjuros', JSON.stringify(states));
    setCharacterStat(sheet, 'GESTIÓN DE FICHA', 'Espacios gastados', '{}');
    saveSheetMutation();
    notice = 'Usos de conjuros y espacios gastados reiniciados. Comprueba que el descanso permita recuperarlos.';
  }
  $: spellClassForSheet = sheet ? spellClassKey(sheet) : '';
  $: sheetSpellCards = sheet ? SPELLS.filter((spell: any) => spell.classes.some((name: string) => normalizeLevelText(name) === spellClassForSheet)) : [];
  $: orderedSheetSpellCards = [...sheetSpellCards].sort((a: any, b: any) =>
    Number(spellIsKnown(sheet, b)) - Number(spellIsKnown(sheet, a)) ||
    Number(a.level) - Number(b.level) ||
    String(a.name).localeCompare(String(b.name), 'es')
  );
  $: sheetSpellSlots = sheet ? spellSlotMaximums(sheet) : {};
  $: sheetSpellUsage = sheet ? slotUsage(sheet) : {};
  $: sheetFeatureData = sheet ? featureSourceGroups(sheet) : { className: '', level: 1, groups: [] };

  function getClassFeaturesAtLevel(className: string, level: number): any[] {
    return ((CLASS_FEATURES as any).classes?.[className] || []).filter((feature:any)=>feature.level===level);
  }
  function getSubclassOptions(className: string): string[] {
    return Object.keys((SUBCLASS_PROGRESSION as any).classes?.[className] || {});
  }
  function formatSubclassName(value: string): string {
    return String(value || '').toLocaleLowerCase('es').replace(/(^|[\\s-])([a-záéíóúüñ])/g, (_m, prefix, letter) => prefix + letter.toLocaleUpperCase('es'));
  }
  function getSubclassData(className: string, value: string): any {
    const options = (SUBCLASS_PROGRESSION as any).classes?.[className] || {};
    const key = Object.keys(options).find(item => normalizeLevelText(item) === normalizeLevelText(value));
    return key ? { key, ...options[key] } : null;
  }
  function getSelectedSubclassData(entry: RoomEntry): any {
    const className = getCharacterStat(entry.sheet,'PERSONAJE','Clase');
    const value = levelUpSubclass || getCharacterStat(entry.sheet,'PERSONAJE','Subclase');
    return getSubclassData(className,value);
  }
  function getSubclassFeaturesForNextLevel(entry: RoomEntry): any[] {
    const data = getSelectedSubclassData(entry);
    const level = Number(getCharacterStat(entry.sheet,'PERSONAJE','Nivel')) + 1;
    return data?.features?.filter((feature:any) => feature.level === level) || [];
  }
  function getSubclassSpellTables(className: string, subclassName: string): any[] {
    const data = getSubclassData(className,subclassName);
    return (data?.tables || []).filter((table:any) => table.columns?.some((column:string) => normalizeLevelText(column).includes('conjuros')));
  }
  function getSubclassCastingTable(className: string, subclassName: string): any {
    return getSubclassSpellTables(className,subclassName).find((table:any) => table.columns?.some((column:string) => normalizeLevelText(column) === 'conjuros preparados')) || null;
  }
  function getLevelUpSubclassSpellTable(entry: RoomEntry): any {
    const className = getCharacterStat(entry.sheet,'PERSONAJE','Clase');
    const data = getSelectedSubclassData(entry);
    const tables = getSubclassSpellTables(className,data?.key || '');
    if (!tables.length) return null;
    return tables.find((table:any) => table.name === levelUpSubclassVariant) || (tables.length === 1 ? tables[0] : null);
  }
  function getNextLevelRowSafe(entry: RoomEntry | null): any { return entry ? getNextLevelRow(entry) : null; }
  function getNextLevelRow(entry: RoomEntry): any {
    const className=getCharacterStat(entry.sheet,'PERSONAJE','Clase');
    const current=Number(getCharacterStat(entry.sheet,'PERSONAJE','Nivel')) || 1;
    return (LEVEL_PROGRESSION as any).classes?.[className]?.rows?.find((r:any)=>r.level===current+1);
  }
  function getNextLevelFeatures(entry: RoomEntry) { return getNextLevelRow(entry)?.features || 'Sin rasgos nuevos registrados'; }
  function getSpeciesLevelUnlock(sheet:RawSheet, level:number): {features:{name:string;description:string}[];spells:string[]} {
    const species=getCharacterStat(sheet,'PERSONAJE','Especie');
    const choiceParts=String(getCharacterStat(sheet,'DETALLES DE ESPECIE','Elección de especie')||'').split(/[·,]/).map(x=>x.trim()).filter(Boolean);
    const choice=choiceParts.length?choiceParts[choiceParts.length-1]:'';
    const result:{features:{name:string;description:string}[];spells:string[]}={features:[],spells:[]};
    if(species==='Aasimar' && level===3) result.features.push({name:'Revelación celestial',description:'Cuando alcanzas el nivel 3, como acción adicional te transformas durante 1 minuto o hasta que pongas fin a la transformación (no requiere acción). Elige una opción en cada transformación. Una vez en cada uno de tus turnos, hasta que termine, cuando dañes a un objetivo con un ataque o conjuro infliges daño adicional igual a tu bonificador por competencia: radiante con Alas celestiales o Fulgor interior, necrótico con Mortaja necrótica. Alas celestiales: obtienes una velocidad volando igual a tu velocidad. Fulgor interior: emites luz brillante en 3 m y luz tenue 3 m más allá; al final de cada uno de tus turnos, cada criatura a 3 m o menos recibe daño radiante igual a tu bonificador por competencia. Mortaja necrótica: brotan alas que no permiten volar; las criaturas que no sean tus aliados a 3 m o menos deben superar una salvación de Carisma CD 8 + tu modificador de Carisma + competencia o quedan Asustadas hasta el final de tu siguiente turno. Recuperas el uso tras un descanso largo.'});
    if(species==='Dracónido' && level===5) result.features.push({name:'Vuelo dracónico',description:'A partir del nivel 5, como acción adicional haces brotar alas espectrales durante 10 minutos. Obtienes una velocidad volando igual a tu velocidad. El efecto termina si las repliegas o quedas incapacitado. Recuperas el uso tras un descanso largo.'});
    if(species==='Dracónido' && [5,11,17].includes(level)) result.features.push({name:'Ataque de aliento · '+(level===5?'2d10':level===11?'3d10':'4d10'),description:'El daño del ataque de aliento aumenta a '+(level===5?'2d10':level===11?'3d10':'4d10')+' del tipo de tu linaje dracónico.'});
    if(species==='Goliat' && level===5) result.features.push({name:'Forma grande',description:'A partir del nivel 5, como acción adicional puedes cambiar a tamaño Grande durante 10 minutos si hay espacio suficiente. Mientras dure, tienes ventaja en las pruebas de Fuerza y tu velocidad aumenta 3 m. Recuperas el uso tras un descanso largo.'});
    if(species==='Elfo' && (level===3 || level===5)) {
      const spell=choice==='Alto elfo'?(level===3?'Detectar magia':'Paso brumoso'):choice==='Drow'?(level===3?'Fuego feérico':'Oscuridad'):(level===3?'Zancada prodigiosa':'Pasar sin rastro');
      result.features.push({name:'Linaje élfico · '+spell,description:'Aprendes '+spell+'. Siempre lo tienes preparado; puedes lanzarlo una vez sin gastar un espacio de conjuro y recuperas esa capacidad tras un descanso largo. También puedes lanzarlo con espacios de conjuro del nivel apropiado.'});
      result.spells.push(spell);
    }
    if(species==='Tiefling' && (level===3 || level===5)) {
      const spell=choice==='Abisal'?(level===3?'Rayo nauseabundo':'Inmovilizar persona'):choice==='Ctónico'?(level===3?'Falsa vida':'Rayo debilitador'):(level===3?'Reprensión infernal':'Oscuridad');
      result.features.push({name:'Legado infernal · '+spell,description:'Aprendes '+spell+'. Siempre lo tienes preparado; puedes lanzarlo una vez sin gastar un espacio de conjuro y recuperas esa capacidad tras un descanso largo. También puedes lanzarlo con espacios de conjuro del nivel apropiado.'});
      result.spells.push(spell);
    }
    return result;
  }
  function splitChoiceList(value:string): string[] {
    return String(value||'').split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean);
  }
  function highestSpellLevel(resources:Record<string,any>): number {
    const levels=Object.entries(resources||{}).flatMap(([key,value])=>{
      const match=String(key).match(/^Espacios nivel (\d+)$/);
      return match && Number(value)>0?[Number(match[1])]:[];
    });
    return Math.max(0,...levels,Number(resources?.['Nivel de los espacios'])||0);
  }
  function isValidClassSpell(name:string,className:string,maxLevel:number,expectedLevel?:number): boolean {
    const spell=getSpellRecord(name);
    if(!spell || !Array.isArray(spell.classes)) return false;
    const classOk=spell.classes.some((value:string)=>normalizeLevelText(value)===normalizeLevelText(className));
    return classOk && spell.level<=maxLevel && (expectedLevel===undefined || spell.level===expectedLevel);
  }
  function isValidWildShapeForm(name:string,maxChallengeRating:number=0.25,allowFlight:boolean=false): boolean {
    const monster=MONSTERS.find((item:any)=>normalizeLevelText(item.name)===normalizeLevelText(name));
    if(!monster) return false;
    const lines=String(monster.statBlock||'').split('\n');
    const typeLine=lines.find((line:string)=>/^(Tiny|Small|Medium|Large|Huge|Gargantuan)\b/.test(line)&&/\bBeast\b/.test(line));
    const speedLine=lines.find((line:string)=>/^Speed\b/i.test(line))||'';
    const cr=String(monster.cr||'').split(' ')[0];
    const parts=cr.split('/').map(Number);
    const value=parts.length===2?parts[0]/parts[1]:parts[0];
    return Boolean(typeLine) && Number.isFinite(value) && value<=maxChallengeRating && (allowFlight || !/\bFly\b/i.test(speedLine));
  }
  function toggleLevelUpWeaponMastery(choice:string,event:Event,max:number) {
    const input=event.currentTarget as HTMLInputElement;
    const current=splitChoiceList(levelUpWeaponMasteries);
    if(input.checked) {
      if(current.length>=max) { input.checked=false; return; }
      if(!current.some(value=>normalizeLevelText(value)===normalizeLevelText(choice))) {
        levelUpWeaponMasteries=[...current,choice].join(', ');
      }
    } else {
      levelUpWeaponMasteries=current.filter(value=>normalizeLevelText(value)!==normalizeLevelText(choice)).join(', ');
    }
  }

  function openLevelUp(entry: RoomEntry) {
    levelUpEntry = entry; levelUpDecision = '';
    levelUpClassCantrips=getCharacterStat(entry.sheet,'CONJUROS','Trucos de clase') || '';
    levelUpClassSpells=getCharacterStat(entry.sheet,'CONJUROS','Conjuros preparados de clase') || '';
    if(!levelUpClassSpells && getCharacterStat(entry.sheet,'PERSONAJE','Clase')==='Mago') levelUpClassSpells=(String(getCharacterStat(entry.sheet,'CONJUROS','Conjuros de nivel 1')).match(/Preparados:\s*([^.]*)/i)||[])[1]||'';
    levelUpWizardBookAdditions=''; levelUpExpertise=''; levelUpNewSkill=''; levelUpLanguages=''; levelUpWildShapeForms=getCharacterStat(entry.sheet,'RASGOS Y DOTES','Formas salvajes conocidas') || '';
    levelUpWeaponMasteries=getCharacterStat(entry.sheet,'ATAQUES','Maestrías con armas') || '';
    levelUpMetamagic=getCharacterStat(entry.sheet,'RASGOS Y DOTES','Opciones de metamagia') || '';
    levelUpInvocations=getCharacterStat(entry.sheet,'RASGOS Y DOTES','Invocaciones sobrenaturales') || ((String(getCharacterStat(entry.sheet,'RASGOS Y DOTES','Rasgos de clase')||'').match(/Invocación sobrenatural:\s*([^\n]+)/i)||[])[1]||'');
    levelUpMysticArcanum=getCharacterStat(entry.sheet,'CONJUROS','Arcanum místico') || '';
    levelUpElementalFury=getCharacterStat(entry.sheet,'RASGOS Y DOTES','Opción de Furia elemental') || '';
    levelUpSorcererAffinity=getCharacterStat(entry.sheet,'RASGOS Y DOTES','Afinidad elemental dracónica') || '';
    levelUpBlessedStrikes=getCharacterStat(entry.sheet,'RASGOS Y DOTES','Opción de Golpes benditos') || '';
    levelUpWizardMastery1=getCharacterStat(entry.sheet,'CONJUROS','Maestría sobre conjuros nivel 1') || '';
    levelUpWizardMastery2=getCharacterStat(entry.sheet,'CONJUROS','Maestría sobre conjuros nivel 2') || '';
    levelUpWizardSignatureSpells=getCharacterStat(entry.sheet,'CONJUROS','Conjuros característicos') || '';
    levelUpSubclassSkill=''; levelUpSubclassSkills=''; levelUpSubclassTool=''; levelUpManeuvers=getCharacterStat(entry.sheet,'RASGOS Y DOTES','Maniobras de maestro del combate') || '';
    levelUpWizardSchoolSpells=getCharacterStat(entry.sheet,'CONJUROS','Conjuros de escuela') || '';
    levelUpWizardIllusionCantrip='';
    const savedSubclass=getCharacterStat(entry.sheet,'PERSONAJE','Subclase');
    levelUpSubclass = getSubclassData(getCharacterStat(entry.sheet,'PERSONAJE','Clase'),savedSubclass) ? savedSubclass : '';
    levelUpSubclassVariant = getCharacterStat(entry.sheet,'PERSONAJE','Opción de subclase');
    levelUpBarbarianAspect = getCharacterStat(entry.sheet,'RASGOS Y DOTES','Aspecto de lo salvaje') || '';
    levelUpRangerStyle = getCharacterStat(entry.sheet,'RASGOS Y DOTES','Estilo de combate') || '';
    levelUpPaladinStyle = getCharacterStat(entry.sheet,'RASGOS Y DOTES','Estilo de combate de paladín') || '';
    levelUpFighterStyles = getCharacterStat(entry.sheet,'RASGOS Y DOTES','Estilos de combate') || ((String(getCharacterStat(entry.sheet,'RASGOS Y DOTES','Rasgos de clase')||'').match(/Estilo de combate:\s*([^\n;]+)/i)||[])[1] || '');
    levelUpRangerCantrips = getCharacterStat(entry.sheet,'CONJUROS','Trucos de estilo de combate') || '';
    levelUpRangerHunterPrey = getCharacterStat(entry.sheet,'RASGOS Y DOTES','Opción de Cazador · nivel 3') || '';
    levelUpRangerHunterDefense = getCharacterStat(entry.sheet,'RASGOS Y DOTES','Opción de Cazador · nivel 7') || '';
    levelUpRangerFeyGift = getCharacterStat(entry.sheet,'RASGOS Y DOTES','Bendición feérica') || '';
    const oldBeastRecord = getCharacterStat(entry.sheet,'RASGOS Y DOTES','Compañero primigenio') || '';
    levelUpRangerBeastProfile = (String(oldBeastRecord).match(/Perfil:\s*([^;\n]+)/i)||[])[1] || '';
    levelUpRangerBeastAnimal = getCharacterStat(entry.sheet,'RASGOS Y DOTES','Animal del compañero primigenio') || '';
    levelUpSubclassCantrips = getCharacterStat(entry.sheet,'CONJUROS','Trucos de subclase');
    levelUpSubclassSpells = getCharacterStat(entry.sheet,'CONJUROS','Conjuros preparados de subclase');
    levelUpAsiMode = 'asi'; levelUpAbility1 = 'Fuerza'; levelUpAbility2 = 'Destreza';
    levelUpIncrease1 = '2'; levelUpIncrease2 = '0'; levelUpFeat = ''; levelUpHpMode = 'average'; levelUpHpRoll = '';
  }
  function closeLevelUp() { levelUpEntry = null; }
  function applyLevelUp() {
    if (!levelUpEntry) return;
    const original = levelUpEntry.sheet;
    const className = getCharacterStat(original,'PERSONAJE','Clase');
    const currentLevel = Number(getCharacterStat(original,'PERSONAJE','Nivel')) || 1;
    const nextLevel = currentLevel + 1;
    if (nextLevel > 20) { notice = 'El personaje ya alcanzó el nivel 20.'; return; }
    const row = (LEVEL_PROGRESSION as any).classes?.[className]?.rows?.find((r:any) => r.level === nextLevel);
    if (!row) { notice = 'No se encontró la progresión de esta clase en el manual.'; return; }
    const features = String(row.features || '').split(',').map((x:string)=>x.trim()).filter((x:string)=>x && x !== '—');
    const needsSubclass = features.some((x:string)=>normalizeLevelText(x).startsWith('subclase de'));
    const needsASI = features.some((x:string)=>normalizeLevelText(x).includes('mejora de caracteristica'));
    const needsEpicFeat = features.some((x:string)=>normalizeLevelText(x)==='don epico');
    const oldSubclassValue = getCharacterStat(original,'PERSONAJE','Subclase');
    const chosenSubclass = levelUpSubclass || oldSubclassValue;
    const subclass = getSubclassData(className,chosenSubclass);
    const isNewSubclass = !!subclass && !getSubclassData(className,oldSubclassValue);
    if ((needsSubclass || currentLevel >= 3) && !subclass) { notice = 'Selecciona una subclase oficial para '+className+'.'; return; }
    if (chosenSubclass && !subclass) { notice = 'La subclase guardada no coincide con las opciones del manual. Selecciónala nuevamente.'; return; }

    const subclassFeatures = subclass?.features?.filter((feature:any) => isNewSubclass ? feature.level <= nextLevel : feature.level === nextLevel) || [];
    const needsDraconicAffinity=className==='Hechicero' && normalizeLevelText(chosenSubclass)==='hechiceria draconica' && nextLevel===6;
    if(needsDraconicAffinity && !['Ácido','Frío','Fuego','Relámpago','Veneno'].includes(levelUpSorcererAffinity)) { notice='Elige el tipo de daño de tu Afinidad elemental dracónica.'; return; }
    const subclassSpellTables = subclass?.tables?.filter((table:any) => table.columns?.some((column:string) => normalizeLevelText(column).includes('conjuros'))) || [];
    if (subclassSpellTables.length > 1 && !subclassSpellTables.some((table:any)=>table.name===levelUpSubclassVariant)) { notice = 'Elige la opción de la subclase que corresponde a la tabla del manual.'; return; }
    const castingTable = subclassSpellTables.find((table:any)=>table.columns?.some((column:string)=>normalizeLevelText(column)==='conjuros preparados'));
    const castingRow = castingTable?.rows?.find((values:string[])=>Number(values[0])===nextLevel);
    const castingPreparedIndex=castingTable?.columns?.findIndex((column:string)=>normalizeLevelText(column)==='conjuros preparados') ?? -1;
    const castingCell=castingRow && castingPreparedIndex>=0 ? String(castingRow[castingPreparedIndex]??'').trim() : '';
    const numericSubclassCasting=!!castingTable && /^\d+$/.test(castingCell);
    const targetSubclassPrepared=numericSubclassCasting?Number(castingCell):0;
    const subclassCantripTarget=className==='Guerrero'?(nextLevel>=10?3:2):className==='Pícaro'?(nextLevel>=10?4:3):0;
    const subclassCantripNames=splitChoiceList(levelUpSubclassCantrips);
    const subclassSpellNames=splitChoiceList(levelUpSubclassSpells);
    const subclassMaxSpellLevel=castingTable && castingRow ? Math.max(0,...castingTable.columns.flatMap((column:string,index:number)=>{const m=normalizeLevelText(column).match(/^espacios nivel (\d+)$/);return m && Number(castingRow[index])>0?[Number(m[1])]:[]})) : 0;
    if(numericSubclassCasting) {
      const oldSubclassPrepared=getCharacterNumber(original,'CONJUROS','Conjuros preparados máximos',0);
      const oldSubclassCantrips=splitChoiceList(getCharacterStat(original,'CONJUROS','Trucos de subclase')).length;
      const oldSubclassSpellNames=splitChoiceList(getCharacterStat(original,'CONJUROS','Conjuros preparados de subclase'));
      const retainedSubclassCantrips=subclassCantripNames.filter(name=>subclassCantripNames.length && splitChoiceList(getCharacterStat(original,'CONJUROS','Trucos de subclase')).some(old=>normalizeLevelText(old)===normalizeLevelText(name))).length;
      const retainedSubclassSpells=subclassSpellNames.filter(name=>oldSubclassSpellNames.some(old=>normalizeLevelText(old)===normalizeLevelText(name))).length;
      if(subclassCantripTarget>0 && (subclassCantripNames.length!==subclassCantripTarget || new Set(subclassCantripNames.map(name=>normalizeLevelText(name))).size!==subclassCantripTarget || (!isNewSubclass && splitChoiceList(getCharacterStat(original,'CONJUROS','Trucos de subclase')).length>0 && retainedSubclassCantrips<splitChoiceList(getCharacterStat(original,'CONJUROS','Trucos de subclase')).length-1))) { notice='La subclase requiere '+subclassCantripTarget+' trucos distintos. Al subir de nivel solo puedes sustituir uno de los que ya conoces.'; return; }
      if(targetSubclassPrepared>0 && (subclassSpellNames.length!==targetSubclassPrepared || new Set(subclassSpellNames.map(name=>normalizeLevelText(name))).size!==targetSubclassPrepared || (!isNewSubclass && oldSubclassSpellNames.length>0 && retainedSubclassSpells<oldSubclassSpellNames.length-1))) { notice='La subclase requiere '+targetSubclassPrepared+' conjuros distintos. Al subir de nivel solo puedes sustituir uno de los que ya conoces.'; return; }
      const subclassList=(className==='Guerrero'||className==='Pícaro')?'Mago':'';
      if(subclassList && subclassCantripNames.some(name=>!isValidClassSpell(name,subclassList,0,0))) { notice='Hay trucos que no pertenecen a la lista de mago.'; return; }
      if(subclassList && subclassSpellNames.some(name=>!isValidClassSpell(name,subclassList,subclassMaxSpellLevel))) { notice='Hay conjuros que no pertenecen a la lista de mago o superan el nivel de espacio disponible.'; return; }
    }

    const classCastingAbility=(BUILDER_MAGIC_ABILITY as any)[className] || '';
    const classSpellResourcesForLevel=row.resources || {};
    const classCantripTarget=Number(classSpellResourcesForLevel['Trucos']);
    const classPreparedTarget=Number(classSpellResourcesForLevel['Conjuros preparados']);
    const classCantripNames=splitChoiceList(levelUpClassCantrips);
    const classSpellNames=splitChoiceList(levelUpClassSpells);
    const oldClassCantripNames=splitChoiceList(getCharacterStat(original,'CONJUROS','Trucos de clase'));
    const oldClassSpellNames=splitChoiceList(getCharacterStat(original,'CONJUROS','Conjuros preparados de clase'));
    const oldClassCantripCount=oldClassCantripNames.length || getCharacterNumber(original,'CONJUROS','Trucos máximos',0);
    const oldClassPreparedCount=getCharacterNumber(original,'CONJUROS','Conjuros preparados máximos',0);
    const maxClassSpellLevel=highestSpellLevel(classSpellResourcesForLevel);
    const isWarlockSpellProgression=className==='Brujo' && nextLevel>=2;
    const isSorcererSpellProgression=className==='Hechicero';
    const isClericCantripProgression=className==='Clérigo' && nextLevel>=2;
    const isDruidCantripProgression=className==='Druida' && nextLevel>=2;
    const isPaladinSpellProgression=className==='Paladín' && nextLevel>=2;
    if(classCastingAbility && Number.isFinite(classCantripTarget) && (classCantripTarget>oldClassCantripCount || isWarlockSpellProgression || isClericCantripProgression || isDruidCantripProgression || isSorcererSpellProgression) && classCantripNames.length!==classCantripTarget) { notice='Debes registrar la lista completa de '+classCantripTarget+' trucos de clase.'; return; }
    if(classCastingAbility && Number.isFinite(classPreparedTarget) && (classPreparedTarget>oldClassPreparedCount || isWarlockSpellProgression || isSorcererSpellProgression) && classSpellNames.length!==classPreparedTarget) { notice='Debes registrar la lista completa de '+classPreparedTarget+' conjuros de clase preparados/conocidos.'; return; }
    if((isWarlockSpellProgression || isSorcererSpellProgression || isPaladinSpellProgression) && (new Set(classCantripNames.map(name=>normalizeLevelText(name))).size!==classCantripNames.length || new Set(classSpellNames.map(name=>normalizeLevelText(name))).size!==classSpellNames.length)) { notice='No puedes repetir trucos ni conjuros en tu lista de clase.'; return; }
    if(isSorcererSpellProgression && oldClassCantripNames.length && classCantripNames.filter(name=>oldClassCantripNames.some(old=>normalizeLevelText(old)===normalizeLevelText(name))).length<oldClassCantripNames.length-1) { notice='Al subir de nivel de hechicero solo puedes sustituir un truco que ya conozcas.'; return; }
    if(isSorcererSpellProgression && oldClassSpellNames.length && classSpellNames.filter(name=>oldClassSpellNames.some(old=>normalizeLevelText(old)===normalizeLevelText(name))).length<oldClassSpellNames.length-1) { notice='Al subir de nivel de hechicero solo puedes sustituir un conjuro preparado que ya conozcas.'; return; }
    if(isClericCantripProgression && new Set(classCantripNames.map(name=>normalizeLevelText(name))).size!==classCantripNames.length) { notice='No puedes repetir trucos en la lista del clérigo.'; return; }
    if(isClericCantripProgression && oldClassCantripNames.length && classCantripNames.filter(name=>oldClassCantripNames.some(old=>normalizeLevelText(old)===normalizeLevelText(name))).length<oldClassCantripNames.length-1) { notice='Al subir de nivel de clérigo puedes sustituir como máximo un truco que ya conozcas.'; return; }
    if(isDruidCantripProgression && new Set(classCantripNames.map(name=>normalizeLevelText(name))).size!==classCantripNames.length) { notice='No puedes repetir trucos en la lista del druida.'; return; }
    if(isDruidCantripProgression && oldClassCantripNames.length && classCantripNames.filter(name=>oldClassCantripNames.some(old=>normalizeLevelText(old)===normalizeLevelText(name))).length<oldClassCantripNames.length-1) { notice='Al subir de nivel de druida puedes sustituir como máximo un truco que ya conozcas.'; return; }
    if(isWarlockSpellProgression && oldClassCantripNames.length && classCantripNames.filter(name=>oldClassCantripNames.some(old=>normalizeLevelText(old)===normalizeLevelText(name))).length<oldClassCantripNames.length-1) { notice='Al subir de nivel de brujo solo puedes sustituir un truco que ya conozcas.'; return; }
    if(isWarlockSpellProgression && oldClassSpellNames.length && classSpellNames.filter(name=>oldClassSpellNames.some(old=>normalizeLevelText(old)===normalizeLevelText(name))).length<oldClassSpellNames.length-1) { notice='Al subir de nivel de brujo solo puedes sustituir un conjuro que ya conozcas.'; return; }
    if(classCastingAbility && classCantripNames.length && classCantripNames.some(name=>!isValidClassSpell(name,className,0,0))) { notice='Hay trucos que no pertenecen a la lista de '+className+'.'; return; }
    if(classCastingAbility && classSpellNames.length && classSpellNames.some(name=>!(className==='Bardo' && nextLevel>=10 ? Boolean(getSpellRecord(name)) && getSpellRecord(name)!.level<=maxClassSpellLevel : isValidClassSpell(name,className,maxClassSpellLevel)))) { notice='Hay conjuros que no pertenecen a la lista permitida o superan el nivel de espacio disponible.'; return; }
    const oldBookText=getCharacterStat(original,'CONJUROS','Libro de conjuros') || (String(getCharacterStat(original,'CONJUROS','Conjuros de nivel 1')).match(/Libro:\s*([^.]*)/i)||[])[1] || '';
    const currentWizardBook=splitChoiceList(oldBookText);
    const wizardBookAdditions=splitChoiceList(levelUpWizardBookAdditions);
    const wizardSubclassKey=normalizeLevelText(levelUpSubclass || getCharacterStat(original,'PERSONAJE','Subclase'));
    const wizardSchoolBySubclass:Record<string,string>={abjurador:'Abjuración',adivino:'Adivinación',evocador:'Evocación',ilusionista:'Ilusionismo'};
    const wizardSchool=wizardSchoolBySubclass[wizardSubclassKey] || '';
    const wizardSchoolLevels=[3,5,7,9,11,13,15,17];
    const needsWizardSchoolSpells=className==='Mago' && Boolean(wizardSchool) && wizardSchoolLevels.includes(nextLevel);
    const oldWizardSchoolSpells=splitChoiceList(getCharacterStat(original,'CONJUROS','Conjuros de escuela'));
    const wizardSchoolChoices=splitChoiceList(levelUpWizardSchoolSpells);
    const wizardSchoolTarget=oldWizardSchoolSpells.length+(nextLevel===3?3:1);
    const wizardSchoolNewChoices=wizardSchoolChoices.filter(name=>!oldWizardSchoolSpells.some(old=>normalizeLevelText(old)===normalizeLevelText(name)));
    if(className==='Mago') {
      if(wizardBookAdditions.length!==2 || new Set(wizardBookAdditions.map(name=>normalizeLevelText(name))).size!==2 || wizardBookAdditions.some(name=>currentWizardBook.some(old=>normalizeLevelText(old)===normalizeLevelText(name)))) { notice='Añade exactamente dos conjuros distintos que todavía no estén en tu libro.'; return; }
      if(wizardBookAdditions.some(name=>!isValidClassSpell(name,'Mago',maxClassSpellLevel)||getSpellRecord(name)?.level===0)) { notice='Los dos conjuros añadidos al libro deben ser conjuros de mago de nivel 1 o superior y no superar el nivel de espacio disponible.'; return; }
      if(needsWizardSchoolSpells && (wizardSchoolChoices.length!==wizardSchoolTarget || new Set(wizardSchoolChoices.map(name=>normalizeLevelText(name))).size!==wizardSchoolTarget || oldWizardSchoolSpells.some(old=>!wizardSchoolChoices.some(name=>normalizeLevelText(name)===normalizeLevelText(old))))) { notice='Registra la lista completa de conjuros de tu escuela: '+wizardSchoolTarget+' en total. Conserva todos los que ya habías añadido.'; return; }
      if(needsWizardSchoolSpells && wizardSchoolChoices.some(name=>{const spell=getSpellRecord(name);return !spell || spell.level===0 || spell.level>maxClassSpellLevel || !spell.classes.some((value:string)=>normalizeLevelText(value)==='mago') || normalizeLevelText(spell.school)!==normalizeLevelText(wizardSchool);})) { notice='Todos los conjuros de escuela deben ser conjuros de mago de nivel 1 o superior, de la escuela '+wizardSchool+', y de un nivel para el que tengas espacios.'; return; }
      if(needsWizardSchoolSpells && wizardSchoolNewChoices.some(name=>currentWizardBook.some(old=>normalizeLevelText(old)===normalizeLevelText(name)) || wizardBookAdditions.some(old=>normalizeLevelText(old)===normalizeLevelText(name)))) { notice='Los nuevos conjuros de escuela no pueden repetirse ni estar ya en tu libro.'; return; }
      const availableBook=[...currentWizardBook,...wizardBookAdditions,...wizardSchoolNewChoices].map(name=>normalizeLevelText(name));
      if(classSpellNames.some(name=>!availableBook.includes(normalizeLevelText(name)))) { notice='Todos los conjuros preparados del mago deben estar en su libro de conjuros.'; return; }
    }

    const nextClassFeatures=getClassFeaturesAtLevel(className,nextLevel);
    const nextFeatureDescription=nextClassFeatures.map((feature:any)=>feature.description||'').join(' ');
    const needsMysticArcanum=className==='Brujo' && nextLevel>=11;
    const arcanumTarget=nextLevel>=17?4:nextLevel>=15?3:nextLevel>=13?2:1;
    const arcanumChoices=splitChoiceList(levelUpMysticArcanum);
    const oldArcanumChoices=splitChoiceList(getCharacterStat(original,'CONJUROS','Arcanum místico'));
    const arcanumLevels=[6,7,8,9].slice(0,arcanumTarget);
    const retainedArcanum=arcanumChoices.filter((spell,index)=>oldArcanumChoices[index] && normalizeLevelText(oldArcanumChoices[index])===normalizeLevelText(spell)).length;
    if(needsMysticArcanum && (arcanumChoices.length!==arcanumTarget || new Set(arcanumChoices.map(spell=>normalizeLevelText(spell))).size!==arcanumTarget || arcanumChoices.some((spell,index)=>!isValidClassSpell(spell,'Brujo',arcanumLevels[index],arcanumLevels[index])) || (oldArcanumChoices.length>0 && retainedArcanum<oldArcanumChoices.length-1))) { notice='Registra '+arcanumTarget+' conjuros de Arcanum místico de brujo, en orden de niveles 6, 7, 8 y 9. Al subir de nivel solo puedes sustituir uno de los arcanum que ya conoces.'; return; }
    const needsWarlockInvocations=className==='Brujo' && nextLevel>=2;
    const invocationTarget=Number(row.resources?.['Invocaciones sobrenaturales']||0);
    const invocationChoices=splitChoiceList(levelUpInvocations);
    const oldInvocationText=getCharacterStat(original,'RASGOS Y DOTES','Invocaciones sobrenaturales') || ((getCharacterStat(original,'RASGOS Y DOTES','Rasgos de clase').match(/Invocación sobrenatural:\s*([^\n]+)/i)||[])[1]||'');
    const oldInvocations=splitChoiceList(oldInvocationText);
    const parsedInvocations=invocationChoices.map(entry=>{const parts=entry.split(':');return {entry,name:parts[0].trim(),choice:parts.slice(1).join(':').trim(),data:BUILDER_WARLOCK_INVOCATIONS.find(item=>normalizeLevelText(item.name)===normalizeLevelText(parts[0].trim()))};});
    const invocationBaseNames=parsedInvocations.map(item=>normalizeLevelText(item.name));
    const knownWarlockCantrips=splitChoiceList(levelUpClassCantrips || getCharacterStat(original,'CONJUROS','Trucos de clase') || getCharacterStat(original,'CONJUROS','Trucos'));
    const qualifiesCantrip=(name:string,kind:string)=>{
      const spell=getSpellRecord(name);if(!spell||spell.level!==0||!spell.classes.some((value:string)=>normalizeLevelText(value)==='brujo'))return false;
      const desc=String(spell.description||'');const damage=/\d+d\d+/.test(desc)&&normalizeLevelText(desc).includes('dano');
      const attack=normalizeLevelText(desc).includes('ataque de conjuro');
      const range=String(spell.range||'').match(/(\d+(?:[.,]\d+)?)\s*m/i);const meters=range?Number(range[1].replace(',','.')):0;
      return kind==='damage'?damage:kind==='attack'?damage&&attack:damage&&meters>=3;
    };
    const invocationCounts=new Map<string,number>();
    const invocationChoicesValid=parsedInvocations.every(item=>{
      const data=item.data;
      if(!data||nextLevel<data.level)return false;
      const base=normalizeLevelText(item.name);const count=(invocationCounts.get(base)||0)+1;invocationCounts.set(base,count);
      if(count>1&&!data.repeatable)return false;
      if(data.repeatable&&!item.choice)return false;
      if(!data.repeatable&&item.choice)return false;
      if(data.choice==='feat'&&!BUILDER_FEATS.some(feat=>normalizeLevelText(feat)===normalizeLevelText(item.choice)))return false;
      if(data.cantrip&&!knownWarlockCantrips.some(cantrip=>normalizeLevelText(cantrip)===normalizeLevelText(item.choice)&&qualifiesCantrip(cantrip,data.cantrip!)))return false;
      if(data.pact&&!invocationBaseNames.includes(normalizeLevelText(data.pact)))return false;
      return true;
    });
    const repeatChoiceKeys=parsedInvocations.filter(item=>item.data?.repeatable).map(item=>normalizeLevelText(item.name)+':'+normalizeLevelText(item.choice));
    const uniqueRepeatChoices=new Set(repeatChoiceKeys).size===repeatChoiceKeys.length;
    const retainedInvocations=invocationChoices.filter(choice=>oldInvocations.some(old=>normalizeLevelText(old)===normalizeLevelText(choice))).length;
    if(needsWarlockInvocations && (!Number.isFinite(invocationTarget)||invocationChoices.length!==invocationTarget||!invocationChoicesValid||!uniqueRepeatChoices||(oldInvocations.length>0&&retainedInvocations<oldInvocations.length-1))) { notice='Registra '+invocationTarget+' invocaciones válidas para tu nivel. Respeta los requisitos del manual; las invocaciones repetibles deben indicar una elección distinta después de dos puntos. Solo puedes sustituir una invocación conocida al subir de nivel.'; return; }
    const selectedSubclassKey=normalizeLevelText(levelUpSubclass || getCharacterStat(original,'PERSONAJE','Subclase'));
    const rangerSubclassKey=selectedSubclassKey.replace(/[\s_-]/g,'');
    const needsRangerStyle=className==='Explorador' && nextLevel===2;
    const rangerStyle=levelUpRangerStyle || getCharacterStat(original,'RASGOS Y DOTES','Estilo de combate');
    const needsPaladinStyle=className==='Paladín' && nextLevel>=2;
    const paladinStyleOptions=BUILDER_CLASS_DATA['Guerrero'].specialOptions||[];
    if(needsPaladinStyle && ((!levelUpPaladinStyle.trim() && nextLevel===2) || (levelUpPaladinStyle.trim() && !paladinStyleOptions.some(option=>normalizeLevelText(option)===normalizeLevelText(levelUpPaladinStyle))))) { notice='Elige una dote válida de Estilo de combate para el paladín.'; return; }
    const isRangerDruidicWarrior=className==='Explorador' && normalizeLevelText(rangerStyle)==='guerrero druidico';
    const rangerCantripChoices=splitChoiceList(levelUpRangerCantrips);
    const oldRangerCantrips=splitChoiceList(getCharacterStat(original,'CONJUROS','Trucos de estilo de combate'));
    if(needsRangerStyle && ![...(BUILDER_CLASS_DATA['Guerrero'].specialOptions||[]),'Guerrero druídico'].some(option=>normalizeLevelText(option)===normalizeLevelText(levelUpRangerStyle))) { notice='Elige una dote de Estilo de combate o Guerrero druídico.'; return; }
    if(isRangerDruidicWarrior && (rangerCantripChoices.length!==2 || new Set(rangerCantripChoices.map(name=>normalizeLevelText(name))).size!==2 || rangerCantripChoices.some(name=>!BUILDER_SPELL_LISTS.Druida.cantrips.some(option=>normalizeLevelText(option)===normalizeLevelText(name))) || (oldRangerCantrips.length>0 && rangerCantripChoices.filter(name=>oldRangerCantrips.some(old=>normalizeLevelText(old)===normalizeLevelText(name))).length<oldRangerCantrips.length-1))) { notice='Guerrero druídico requiere dos trucos distintos de la lista de Druida. Al subir de nivel solo puedes sustituir uno de los dos.'; return; }
    const needsHunterPrey=className==='Explorador' && rangerSubclassKey==='cazador' && nextLevel===3;
    const needsHunterDefense=className==='Explorador' && rangerSubclassKey==='cazador' && nextLevel===7;
    const needsRangerFeyGift=className==='Explorador' && rangerSubclassKey==='errantefeerico' && nextLevel===3;
    const needsRangerBeastCompanion=className==='Explorador' && rangerSubclassKey==='senordelasbestias' && nextLevel===3;
    if(needsHunterPrey && !['Azote de colosos','Destructor de hordas'].includes(levelUpRangerHunterPrey)) { notice='Elige Azote de colosos o Destructor de hordas para El cazador y la presa.'; return; }
    if(needsHunterDefense && !['Defensa contra ataques múltiples','Escapar de la horda'].includes(levelUpRangerHunterDefense)) { notice='Elige Defensa contra ataques múltiples o Escapar de la horda para Tácticas defensivas.'; return; }
    if(needsRangerFeyGift && !BUILDER_RANGER_FEY_GIFTS.includes(levelUpRangerFeyGift)) { notice='Elige una dádiva de los Parajes Feéricos.'; return; }
    if(needsRangerBeastCompanion && (!Object.hasOwn(BUILDER_RANGER_BEAST_PROFILES,levelUpRangerBeastProfile) || !levelUpRangerBeastAnimal.trim())) { notice='Elige el perfil de tu bestia primigenia e indica qué animal representa.'; return; }
    const barbarianAspectChoice=findLevelUpChoice((LEVEL_UP_CHOICE_DEFINITIONS as any).choices as LevelUpChoiceDefinition[],'barbarian.wildHeart.aspect');
    const needsBarbarianWildAspect=className==='Bárbaro' && selectedSubclassKey===(barbarianAspectChoice?.subclass || '') && nextLevel===barbarianAspectChoice?.level;
    if(needsBarbarianWildAspect && !validateSingleLevelUpChoice(barbarianAspectChoice,levelUpBarbarianAspect)) { notice='Elige una opción válida para Aspecto de lo salvaje: '+(barbarianAspectChoice?.options||[]).join(', ')+'.'; return; }
    const isFighter=className==='Guerrero';
    const needsFighterStyle=isFighter;
    const fighterStyleTarget=isFighter && selectedSubclassKey==='campeon' && nextLevel>=7?2:1;
    const fighterStyleChoices=splitChoiceList(levelUpFighterStyles);
    const oldFighterStyles=splitChoiceList(getCharacterStat(original,'RASGOS Y DOTES','Estilos de combate') || ((String(getCharacterStat(original,'RASGOS Y DOTES','Rasgos de clase')||'').match(/Estilo de combate:\s*([^\n;]+)/i)||[])[1]||''));
    const retainedFighterStyles=fighterStyleChoices.filter(choice=>oldFighterStyles.some(old=>normalizeLevelText(old)===normalizeLevelText(choice))).length;
    if(needsFighterStyle && (fighterStyleChoices.length!==fighterStyleTarget || new Set(fighterStyleChoices.map(choice=>normalizeLevelText(choice))).size!==fighterStyleTarget || fighterStyleChoices.some(choice=>!(BUILDER_CLASS_DATA['Guerrero'].specialOptions||[]).some(option=>normalizeLevelText(option)===normalizeLevelText(choice))) || (oldFighterStyles.length>0 && retainedFighterStyles<oldFighterStyles.length-1))) { notice='Registra '+fighterStyleTarget+' dote(s) de estilo de combate válidas. Conserva las anteriores; al subir de nivel puedes sustituir como máximo una. El Campeón obtiene una segunda a nivel 7.'; return; }
    const isBattleMaster=className==='Guerrero' && selectedSubclassKey==='maestrodelcombate';
    const isFeyWanderer=className==='Explorador' && selectedSubclassKey==='errantefeerico';
    const needsBattleMasterTraining=isBattleMaster && nextLevel===3;
    const needsFeySkill=isFeyWanderer && nextLevel===3;
    const isCollegeOfKnowledge=className==='Bardo' && selectedSubclassKey==='colegio del conocimiento';
    const needsCollegeKnowledgeSkills=isCollegeOfKnowledge && nextLevel===3;
    const collegeKnowledgeSkills=splitChoiceList(levelUpSubclassSkills);
    const currentSkillChoices=splitChoiceList(getCharacterStat(original,'COMPETENCIAS','Habilidades'));
    const currentToolChoices=splitChoiceList(getCharacterStat(original,'COMPETENCIAS','Herramientas'));
    if(needsBattleMasterTraining && (!BUILDER_CLASS_SKILLS.Guerrero.options.includes(levelUpSubclassSkill) || currentSkillChoices.some(skill=>normalizeLevelText(skill)===normalizeLevelText(levelUpSubclassSkill)) || !BUILDER_ARTISAN_TOOLS.includes(levelUpSubclassTool) || currentToolChoices.some(tool=>normalizeLevelText(tool)===normalizeLevelText(levelUpSubclassTool)))) { notice='Maestro del combate requiere una habilidad de la lista de guerrero y una herramienta de artesano en las que aún no tengas competencia.'; return; }
    if(needsFeySkill && (!['Engaño','Interpretación','Persuasión'].includes(levelUpSubclassSkill) || currentSkillChoices.some(skill=>normalizeLevelText(skill)===normalizeLevelText(levelUpSubclassSkill)))) { notice='Glamur sobrenatural requiere elegir Engaño, Interpretación o Persuasión, una habilidad en la que aún no tengas competencia.'; return; }
    if(needsCollegeKnowledgeSkills && (collegeKnowledgeSkills.length!==3 || new Set(collegeKnowledgeSkills.map(skill=>normalizeLevelText(skill))).size!==3 || collegeKnowledgeSkills.some(skill=>!BUILDER_SKILL_OPTIONS.some(option=>normalizeLevelText(option)===normalizeLevelText(skill)) || currentSkillChoices.some(old=>normalizeLevelText(old)===normalizeLevelText(skill))))) { notice='El Colegio del Conocimiento requiere tres habilidades distintas en las que todavía no tengas competencia.'; return; }
    const needsBattleManeuvers=isBattleMaster && [3,7,10,15].includes(nextLevel);
    const maneuverTarget=nextLevel>=15?9:nextLevel>=10?7:nextLevel>=7?5:3;
    const maneuverChoices=splitChoiceList(levelUpManeuvers);
    const oldManeuvers=splitChoiceList(getCharacterStat(original,'RASGOS Y DOTES','Maniobras de maestro del combate'));
    const retainedManeuvers=maneuverChoices.filter(choice=>oldManeuvers.some(old=>normalizeLevelText(old)===normalizeLevelText(choice))).length;
    if(needsBattleManeuvers && (maneuverChoices.length!==maneuverTarget || new Set(maneuverChoices.map(choice=>normalizeLevelText(choice))).size!==maneuverTarget || maneuverChoices.some(choice=>!BUILDER_BATTLE_MANEUVER_OPTIONS.some(option=>normalizeLevelText(option)===normalizeLevelText(choice))) || (oldManeuvers.length>0 && retainedManeuvers<oldManeuvers.length-1))) { notice='Registra '+maneuverTarget+' maniobras distintas de Maestro del combate. Al aprender nuevas maniobras solo puedes sustituir una de las que ya conoces.'; return; }
    const needsElementalFury=className==='Druida' && nextLevel===7;
    if(needsElementalFury && !['Golpe primordial','Lanzamiento potente'].includes(levelUpElementalFury)) { notice='Elige Golpe primordial o Lanzamiento potente para Furia elemental.'; return; }
    const needsBlessedStrikes=className==='Clérigo' && nextLevel===7;
    if(needsBlessedStrikes && !['Golpe divino','Lanzamiento potente'].includes(levelUpBlessedStrikes)) { notice='Elige Golpe divino o Lanzamiento potente para Golpes benditos.'; return; }
    const wizardBookForChoices=[...currentWizardBook,...wizardBookAdditions,...wizardSchoolChoices];
    const validWizardBookSpell=(name:string,level:number,actionOnly:boolean=false)=>{
      const spell=getSpellRecord(name);
      return Boolean(spell && spell.level===level && spell.classes.some((value:string)=>normalizeLevelText(value)==='mago') && (!actionOnly || normalizeLevelText(spell.castingTime)==='accion'));
    };
    const needsWizardMastery=className==='Mago' && nextLevel===18;
    if(needsWizardMastery && (!wizardBookForChoices.some(name=>normalizeLevelText(name)===normalizeLevelText(levelUpWizardMastery1)) || !wizardBookForChoices.some(name=>normalizeLevelText(name)===normalizeLevelText(levelUpWizardMastery2)) || !validWizardBookSpell(levelUpWizardMastery1,1,true) || !validWizardBookSpell(levelUpWizardMastery2,2,true))) { notice='Maestría sobre conjuros requiere un conjuro de nivel 1 y otro de nivel 2 de tu libro, ambos con tiempo de lanzamiento de una acción.'; return; }
    const needsWizardIllusionCantrip=className==='Mago' && wizardSubclassKey==='ilusionista' && nextLevel===3;
    const knownWizardCantrips=[...splitChoiceList(getCharacterStat(original,'CONJUROS','Trucos')),...splitChoiceList(getCharacterStat(original,'CONJUROS','Trucos de clase'))];
    const alreadyKnowsMinorIllusion=knownWizardCantrips.some(name=>normalizeLevelText(name)==='ilusionmenor');
    if(needsWizardIllusionCantrip && alreadyKnowsMinorIllusion && (!levelUpWizardIllusionCantrip.trim() || !getSpellRecord(levelUpWizardIllusionCantrip) || getSpellRecord(levelUpWizardIllusionCantrip).level!==0 || !getSpellRecord(levelUpWizardIllusionCantrip).classes.some((value:string)=>normalizeLevelText(value)==='mago') || knownWizardCantrips.some(name=>normalizeLevelText(name)===normalizeLevelText(levelUpWizardIllusionCantrip)))) { notice='Como ya conoces Ilusión menor, elige otro truco de mago que todavía no conozcas.'; return; }
    const needsWizardSignature=className==='Mago' && nextLevel===20;
    const wizardSignatureChoices=splitChoiceList(levelUpWizardSignatureSpells);
    if(needsWizardSignature && (wizardSignatureChoices.length!==2 || new Set(wizardSignatureChoices.map(name=>normalizeLevelText(name))).size!==2 || wizardSignatureChoices.some(name=>!wizardBookForChoices.some(bookName=>normalizeLevelText(bookName)===normalizeLevelText(name)) || !validWizardBookSpell(name,3)))) { notice='Conjuros característicos requiere dos conjuros de nivel 3 distintos que estén en tu libro de conjuros.'; return; }
    const needsMetamagic=className==='Hechicero' && nextLevel>=2;
    const metamagicChoices=splitChoiceList(levelUpMetamagic);
    const oldMetamagicChoices=splitChoiceList(getCharacterStat(original,'RASGOS Y DOTES','Opciones de metamagia'));
    const metamagicTarget=nextLevel>=17?6:nextLevel>=10?4:2;
    const retainedMetamagic=metamagicChoices.filter(choice=>oldMetamagicChoices.some(old=>normalizeLevelText(old)===normalizeLevelText(choice))).length;
    if(needsMetamagic && (metamagicChoices.length!==metamagicTarget || new Set(metamagicChoices.map(choice=>normalizeLevelText(choice))).size!==metamagicTarget || metamagicChoices.some(choice=>!BUILDER_METAMAGIC_OPTIONS.some(option=>normalizeLevelText(option)===normalizeLevelText(choice))) || (oldMetamagicChoices.length>0 && retainedMetamagic<oldMetamagicChoices.length-1))) { notice='Registra '+metamagicTarget+' opciones de metamagia válidas. Al subir de nivel solo puedes sustituir una opción que ya conocías.'; return; }
    const expertiseFeature=nextClassFeatures.some((feature:any)=>normalizeLevelText(feature.name).includes('pericia')) || /ganas pericia/.test(normalizeLevelText(nextFeatureDescription));
    const expertiseCount=nextClassFeatures.reduce((count:number,feature:any)=>{
      const name=normalizeLevelText(feature.name),description=normalizeLevelText(feature.description||'');
      return Math.max(count,name.includes('pericia')?2:description.includes('ganas pericia en dos')?2:description.includes('ganas pericia en esa habilidad')||description.includes('ganas pericia en la habilidad elegida')?1:0);
    },0);
    const needsExpertise=expertiseFeature && expertiseCount>0;
    const expertiseChoices=splitChoiceList(levelUpExpertise);
    const skillRawBefore=getCharacterStat(original,'COMPETENCIAS','Habilidades');
    const existingExpertise=normalizeLevelText((String(skillRawBefore).match(/pericia\s*:\s*([^\n;]+)/i)||[])[1]||'');
    const proficientSkills=BUILDER_SKILL_OPTIONS.filter(skill=>normalizeLevelText(skillRawBefore).includes(normalizeLevelText(skill)));
    const academicSkills=['Conocimiento arcano','Historia','Investigación','Medicina','Naturaleza','Religión'];
    const expertiseAllowed=className==='Mago' && nextClassFeatures.some((feature:any)=>normalizeLevelText(feature.name)==='academico')?academicSkills:proficientSkills;
    if(needsExpertise) {
      if(expertiseChoices.length!==expertiseCount || new Set(expertiseChoices.map(skill=>normalizeLevelText(skill))).size!==expertiseCount) { notice='Debes elegir exactamente '+expertiseCount+' habilidad(es) distinta(s) para obtener Pericia.'; return; }
      if(expertiseChoices.some(skill=>!expertiseAllowed.some(value=>normalizeLevelText(value)===normalizeLevelText(skill)))) { notice='Elige habilidades válidas y competentes para obtener Pericia.'; return; }
      if(expertiseChoices.some(skill=>!proficientSkills.some(value=>normalizeLevelText(value)===normalizeLevelText(skill)))) { notice='Solo puedes elegir habilidades en las que ya tengas competencia para obtener Pericia.'; return; }
      if(expertiseChoices.some(skill=>existingExpertise.includes(normalizeLevelText(skill)))) { notice='No puedes elegir una habilidad que ya tenga Pericia.'; return; }
    }
    const needsNewSkill=/ganas competencia en otra habilidad|ganas competencia en una habilidad|obtienes competencia en una habilidad/.test(normalizeLevelText(nextFeatureDescription));
    const barbarianSkillChoice=findLevelUpChoice((LEVEL_UP_CHOICE_DEFINITIONS as any).choices as LevelUpChoiceDefinition[],'barbarian.primalKnowledge.skill');
    const skillChoiceDefinition=className==='Bárbaro' && nextLevel===barbarianSkillChoice?.level ? barbarianSkillChoice : undefined;
    const validNewSkill=skillChoiceDefinition ? validateSingleLevelUpChoice(skillChoiceDefinition,levelUpNewSkill,currentSkillChoices) : Boolean(levelUpNewSkill) && (BUILDER_CLASS_SKILLS[className]?.options||BUILDER_SKILL_OPTIONS).some((skill:string)=>normalizeLevelText(skill)===normalizeLevelText(levelUpNewSkill)) && !proficientSkills.some(skill=>normalizeLevelText(skill)===normalizeLevelText(levelUpNewSkill));
    if(needsNewSkill && !validNewSkill) { notice='Elige una habilidad válida de la lista de '+className+' en la que aún no tengas competencia.'; return; }
    const needsNewLanguages=/idiomas conoces dos idiomas/.test(normalizeLevelText(nextFeatureDescription));
    const languageChoices=splitChoiceList(levelUpLanguages);
    const currentLanguages=splitChoiceList(getCharacterStat(original,'COMPETENCIAS','Idiomas'));
    if(needsNewLanguages && (languageChoices.length!==2 || new Set(languageChoices.map(x=>normalizeLevelText(x))).size!==2 || languageChoices.some(name=>!BUILDER_LANGUAGES.some(option=>normalizeLevelText(option)===normalizeLevelText(name)) || currentLanguages.some(old=>normalizeLevelText(old)===normalizeLevelText(name))))) { notice='Explorador hábil requiere dos idiomas nuevos y distintos de las listas del manual.'; return; }
    const needsWildShapeForms=className==='Druida' && [2,4,8].includes(nextLevel);
    const wildShapeForms=splitChoiceList(levelUpWildShapeForms);
    const wildShapeTarget=nextLevel===2?4:nextLevel===4?6:8;
    const wildShapeMaxCR=nextLevel===2?0.25:nextLevel===4?0.5:1;
    const wildShapeAllowsFlight=nextLevel>=8;
    const oldWildShapeForms=splitChoiceList(getCharacterStat(original,'RASGOS Y DOTES','Formas salvajes conocidas'));
    const retainedWildShapeForms=wildShapeForms.filter(name=>oldWildShapeForms.some(old=>normalizeLevelText(old)===normalizeLevelText(name))).length;
    if(needsWildShapeForms && (wildShapeForms.length!==wildShapeTarget || new Set(wildShapeForms.map(x=>normalizeLevelText(x))).size!==wildShapeTarget || wildShapeForms.some(name=>!isValidWildShapeForm(name,wildShapeMaxCR,wildShapeAllowsFlight)) || (oldWildShapeForms.length>0 && retainedWildShapeForms<oldWildShapeForms.length-1))) { notice='A nivel '+nextLevel+' Forma salvaje requiere '+wildShapeTarget+' bestias distintas de VD '+(wildShapeMaxCR===0.25?'1/4':wildShapeMaxCR)+' o inferior'+(wildShapeAllowsFlight?' (se permite vuelo)':' y sin velocidad volando')+'. Conserva tus formas conocidas: solo puedes sustituir una tras un descanso largo.'; return; }
    const masteryResource=Object.entries(row.resources||{}).find(([key])=>normalizeLevelText(key).includes('maestria con armas'));
    const targetMasteries=masteryResource?Number(masteryResource[1]):0;
    const masteryChoices=splitChoiceList(levelUpWeaponMasteries);
    const oldMasteryChoices=splitChoiceList(getCharacterStat(original,'ATAQUES','Maestrías con armas'));
    const oldMasteryCount=oldMasteryChoices.length;
    const barbarianMasteryChoice=findLevelUpChoice((LEVEL_UP_CHOICE_DEFINITIONS as any).choices as LevelUpChoiceDefinition[],'barbarian.weaponMastery');
    const masteryDefinition=className==='Bárbaro'?barbarianMasteryChoice:undefined;
    const validMasteries=masteryDefinition ? validateMultipleLevelUpChoice(masteryDefinition,masteryChoices,targetMasteries,oldMasteryChoices) : masteryChoices.length===targetMasteries && new Set(masteryChoices.map(name=>normalizeLevelText(name))).size===targetMasteries && masteryChoices.every(name=>BUILDER_WEAPON_MASTERY_OPTIONS.some((option:string)=>normalizeLevelText(option)===normalizeLevelText(name))) && oldMasteryChoices.every(old=>masteryChoices.some(name=>normalizeLevelText(name)===normalizeLevelText(old)));
    if(targetMasteries>oldMasteryCount && !validMasteries) { notice='Conserva tus maestrías anteriores y añade las nuevas hasta completar '+targetMasteries+'. No repitas armas y elige solo opciones permitidas.'; return; }
    if ((needsEpicFeat || (needsASI && levelUpAsiMode === 'feat')) && !levelUpFeat.trim()) { notice = 'Indica el nombre de la dote elegida.'; return; }
    if(needsEpicFeat && (!BUILDER_EPIC_FEATS.some(feat=>normalizeLevelText(feat)===normalizeLevelText(levelUpFeat)) || !builderEpicFeatAbilities(levelUpFeat).includes(levelUpEpicFeatAbility) || getCharacterNumber(original,'ATRIBUTOS',levelUpEpicFeatAbility,10)>=30)) { notice='Elige un Don épico del manual y una característica permitida que no supere 30.'; return; }
    if (needsASI && levelUpAsiMode === 'asi') {
      const inc1=Number(levelUpIncrease1), inc2=Number(levelUpIncrease2);
      if (![1,2].includes(inc1) || ![0,1,2].includes(inc2) || (inc2>0 && inc1+inc2!==2) || (inc2===0 && inc1!==2) || (inc2>0 && levelUpAbility1===levelUpAbility2)) { notice='La mejora debe ser +2 a una característica o +1 a dos características.'; return; }
      for (const [ability,inc] of [[levelUpAbility1,inc1],[levelUpAbility2,inc2]] as [string,number][]) {
        if (!inc) continue;
        const current=getCharacterNumber(original,'ATRIBUTOS',ability,NaN);
        if (!Number.isFinite(current) || current+inc>20) { notice='La mejora no puede superar 20 en '+ability+'.'; return; }
      }
    }

    const constitution=getCharacterNumber(original,'ATRIBUTOS','Constitución',10);
    const conMod=Math.floor((constitution-10)/2);
    const hitDie=LEVEL_HIT_DIE[className] || 8;
    let hpGain=LEVEL_FIXED_HP[className] || 5;
    if (levelUpHpMode === 'roll') {
      const roll=Number(levelUpHpRoll);
      if (!Number.isInteger(roll) || roll<1 || roll>hitDie) { notice='Introduce una tirada válida de 1 a '+hitDie+'.'; return; }
      hpGain=roll;
    }
    const speciesName=getCharacterStat(original,'PERSONAJE','Especie');
    const originFeatText=normalizeLevelText(getCharacterStat(original,'RASGOS Y DOTES','Dote de origen'));
    const additionalFeatText=normalizeLevelText(getCharacterStat(original,'RASGOS Y DOTES','Dotes adicionales'));
    const dwarfBonus=normalizeLevelText(speciesName)==='enano'?1:0;
    const alreadyTough=(originFeatText+' '+additionalFeatText).includes('duro');
    const gainsToughNow=normalizeLevelText(levelUpFeat)==='duro' && (needsEpicFeat || (needsASI && levelUpAsiMode==='feat')) && !alreadyTough;
    const toughBonus=alreadyTough?2:gainsToughNow?2*nextLevel:0;
    const draconicHpBonus=className==='Hechicero' && normalizeLevelText(chosenSubclass)==='hechiceria draconica' ? (nextLevel===3?3:nextLevel>3?1:0) : 0;
    hpGain=Math.max(1,hpGain+conMod+dwarfBonus+toughBonus+draconicHpBonus);

    const updated=JSON.parse(JSON.stringify(original)) as RawSheet;
    const oldHp=getCharacterNumber(updated,'COMBATE','Puntos de golpe máximos',0);
    const oldCurrentHp=getCharacterNumber(updated,'COMBATE','Puntos de golpe actuales',oldHp);
    const oldHitDice=Number(String(getCharacterStat(updated,'COMBATE','Dados de golpe')).match(/[0-9]+/)?.[0]) || currentLevel;
    setCharacterStat(updated,'PERSONAJE','Nivel',nextLevel);
    // La experiencia es acumulativa y no debe reemplazarse por el umbral del siguiente nivel.
    setCharacterStat(updated,'COMBATE','Puntos de golpe máximos',(oldHp+hpGain)+' PG');
    setCharacterStat(updated,'COMBATE','Puntos de golpe actuales',(oldCurrentHp+hpGain)+' PG');
    setCharacterStat(updated,'COMBATE','Dados de golpe',oldHitDice+1+'d'+hitDie);
    setCharacterStat(updated,'COMBATE','Bonificador por competencia',row.proficiency);
    if (subclass) setCharacterStat(updated,'PERSONAJE','Subclase',subclass.key);
    if(needsDraconicAffinity) setCharacterStat(updated,'RASGOS Y DOTES','Afinidad elemental dracónica',levelUpSorcererAffinity);
    if(className==='Hechicero' && normalizeLevelText(chosenSubclass)==='hechiceria draconica' && nextLevel===3) {
      const dexMod=Math.floor((getCharacterNumber(updated,'ATRIBUTOS','Destreza',10)-10)/2);
      const chaMod=Math.floor((getCharacterNumber(updated,'ATRIBUTOS','Carisma',10)-10)/2);
      setCharacterStat(updated,'COMBATE','Fórmula de clase de armadura','Resistencia dracónica: 10 + modificador de Destreza + modificador de Carisma (sin armadura)');
      setCharacterStat(updated,'COMBATE','Clase de armadura',10+dexMod+chaMod);
    }
    if (numericSubclassCasting && (className==='Guerrero'||className==='Pícaro')) setCharacterStat(updated,'CONJUROS','Aptitud mágica de subclase','Inteligencia');
    if (levelUpSubclassVariant) setCharacterStat(updated,'PERSONAJE','Opción de subclase',levelUpSubclassVariant);

    if (needsASI && levelUpAsiMode==='asi') {
      for (const [ability,inc] of [[levelUpAbility1,Number(levelUpIncrease1)],[levelUpAbility2,Number(levelUpIncrease2)]] as [string,number][]) {
        if (!inc) continue;
        const value=getCharacterNumber(updated,'ATRIBUTOS',ability,10);
        setCharacterStat(updated,'ATRIBUTOS',ability,formatAbilityScore(value+inc));
      }
    }
    if(needsEpicFeat) {
      const epicAbilityValue=getCharacterNumber(updated,'ATRIBUTOS',levelUpEpicFeatAbility,10);
      setCharacterStat(updated,'ATRIBUTOS',levelUpEpicFeatAbility,formatAbilityScore(epicAbilityValue+1));
    }
    if(className==='Bárbaro' && nextLevel===20) {
      for(const ability of ['Fuerza','Constitución']) {
        const value=getCharacterNumber(updated,'ATRIBUTOS',ability,10);
        setCharacterStat(updated,'ATRIBUTOS',ability,formatAbilityScore(Math.min(25,value+4)));
      }
    }
    if(className==='Monje' && nextLevel===20) {
      for(const ability of ['Destreza','Sabiduría']) {
        const value=getCharacterNumber(updated,'ATRIBUTOS',ability,10);
        setCharacterStat(updated,'ATRIBUTOS',ability,formatAbilityScore(Math.min(25,value+4)));
      }
    }
    // Si la mejora aumenta el modificador de Constitución, el máximo de PG
    // aumenta en 1 por cada nivel, incluido el nivel que acaba de alcanzarse.
    const oldConstitutionMod=Math.floor((getCharacterNumber(original,'ATRIBUTOS','Constitución',10)-10)/2);
    const newConstitutionMod=Math.floor((getCharacterNumber(updated,'ATRIBUTOS','Constitución',10)-10)/2);
    const constitutionHpAdjustment=(newConstitutionMod-oldConstitutionMod)*nextLevel;
    if (constitutionHpAdjustment>0) {
      const maxAfterLevelUp=getCharacterNumber(updated,'COMBATE','Puntos de golpe máximos',0);
      setCharacterStat(updated,'COMBATE','Puntos de golpe máximos',(maxAfterLevelUp+constitutionHpAdjustment)+' PG');
      if(oldCurrentHp===oldHp) setCharacterStat(updated,'COMBATE','Puntos de golpe actuales',(oldCurrentHp+hpGain+constitutionHpAdjustment)+' PG');
    }
    if(needsBarbarianWildAspect) setCharacterStat(updated,'RASGOS Y DOTES','Aspecto de lo salvaje',levelUpBarbarianAspect);
    if(needsRangerStyle) setCharacterStat(updated,'RASGOS Y DOTES','Estilo de combate',levelUpRangerStyle);
    if(needsPaladinStyle && levelUpPaladinStyle.trim()) setCharacterStat(updated,'RASGOS Y DOTES','Estilo de combate de paladín',levelUpPaladinStyle);
    if(className==='Paladín') {
      setCharacterStat(updated,'RASGOS Y DOTES','Reserva de Imposición de manos',(5*nextLevel)+' PG');
      const previousAlwaysPrepared=splitChoiceList(getCharacterStat(updated,'CONJUROS','Conjuros siempre preparados de clase'));
      const newAlwaysPrepared=[...(nextLevel===2?['Castigo divino']:[]),...(nextLevel===5?['Hallar corcel']:[])];
      const alwaysPrepared=[...new Map([...previousAlwaysPrepared,...newAlwaysPrepared].map(name=>[normalizeLevelText(name),name])).values()];
      if(alwaysPrepared.length) setCharacterStat(updated,'CONJUROS','Conjuros siempre preparados de clase',alwaysPrepared.join(', '));
    }
    if(needsFighterStyle) setCharacterStat(updated,'RASGOS Y DOTES','Estilos de combate',fighterStyleChoices.join(', '));
    if(isRangerDruidicWarrior) {
      setCharacterStat(updated,'CONJUROS','Trucos de estilo de combate',rangerCantripChoices.join(', '));
      setCharacterStat(updated,'CONJUROS','Aptitud mágica de estilo de combate','Sabiduría');
      setCharacterStat(updated,'CONJUROS','Lista de conjuros de estilo de combate','Druida');
      const allKnownTricks=splitChoiceList(getCharacterStat(updated,'CONJUROS','Trucos'));
      const otherKnownTricks=allKnownTricks.filter(name=>!oldRangerCantrips.some(old=>normalizeLevelText(old)===normalizeLevelText(name)));
      setCharacterStat(updated,'CONJUROS','Trucos',[...otherKnownTricks,...rangerCantripChoices].join(', '));
    }
    if(needsHunterPrey) setCharacterStat(updated,'RASGOS Y DOTES','Opción de Cazador · nivel 3',levelUpRangerHunterPrey);
    if(needsHunterDefense) setCharacterStat(updated,'RASGOS Y DOTES','Opción de Cazador · nivel 7',levelUpRangerHunterDefense);
    if(needsRangerFeyGift) setCharacterStat(updated,'RASGOS Y DOTES','Bendición feérica',levelUpRangerFeyGift);
    if(needsRangerBeastCompanion) {
      setCharacterStat(updated,'RASGOS Y DOTES','Animal del compañero primigenio',levelUpRangerBeastAnimal.trim());
      setCharacterStat(updated,'RASGOS Y DOTES','Compañero primigenio','Perfil: '+levelUpRangerBeastProfile+'; Animal: '+levelUpRangerBeastAnimal.trim()+'\n'+BUILDER_RANGER_BEAST_PROFILES[levelUpRangerBeastProfile]+'\nReglas: actúa durante tu turno; se mueve y usa su reacción por cuenta propia, pero su acción es Esquivar salvo que le ordenes actuar con una acción adicional o sacrifiques uno de tus ataques. Si mueres, desaparece. Si muere, puedes devolverla a la vida durante la hora siguiente gastando un espacio de conjuro; vuelve tras 1 minuto con todos sus PG. Tras un descanso largo puedes invocar otra bestia y elegir de nuevo perfil y aspecto.');
    }
    if (levelUpFeat.trim() && (needsEpicFeat || (needsASI && levelUpAsiMode==='feat'))) {
      const previous=getCharacterStat(updated,'RASGOS Y DOTES','Dotes adicionales');
      setCharacterStat(updated,'RASGOS Y DOTES','Dotes adicionales',[previous,levelUpFeat.trim()].filter(Boolean).join('; '));
    }
    if(needsEpicFeat) {
      const oldOther=getCharacterStat(updated,'RASGOS Y DOTES','Otros rasgos');
      setCharacterStat(updated,'RASGOS Y DOTES','Otros rasgos',[oldOther,'Don épico: '+levelUpFeat+' · Aumento de característica: '+levelUpEpicFeatAbility+' +1'].filter(Boolean).join('\n\n'));
    }

    const resourceEntries=Object.entries(row.resources || {});
    const resourceText=resourceEntries.filter(([key,value]:any)=>value!==undefined && value!==null && value!=='—').map(([key,value]:any)=>key+': '+value).join(' · ');
    setCharacterStat(updated,'PROGRESIÓN','Nivel de clase',nextLevel);
    for (const [resourceName,resourceValue] of resourceEntries) setCharacterStat(updated,'PROGRESIÓN',resourceName,String(resourceValue ?? '—'));
    const classFeatureDetails=getClassFeaturesAtLevel(className,nextLevel).map((feature:any)=>'Nivel '+nextLevel+' · '+feature.name+'\n'+feature.description).join('\n\n');
    const currentClassFeatures=classFeatureDetails || features.map((feature:string)=>'Nivel '+nextLevel+' · '+feature).join('\n');
    const previousClassFeatures=getCharacterStat(updated,'PROGRESIÓN','Rasgos de clase acumulados');
    setCharacterStat(updated,'PROGRESIÓN','Rasgos de clase acumulados',[previousClassFeatures,currentClassFeatures].filter(Boolean).join('\n\n'));
    const existingClassTraitText=getCharacterStat(updated,'RASGOS Y DOTES','Rasgos de clase') || getCharacterStat(updated,'RASGOS Y DOTES','Rasgos de clase (nivel 1)');
    setCharacterStat(updated,'RASGOS Y DOTES','Rasgos de clase',[existingClassTraitText,currentClassFeatures].filter(Boolean).join('\n\n'));
    if(needsExpertise) {
      const oldSkillText=getCharacterStat(updated,'COMPETENCIAS','Habilidades');
      const oldExpertiseList=splitChoiceList((String(oldSkillText).match(/pericia\s*:\s*([^\n;]+)/i)||[])[1]||'');
      const baseSkillText=String(oldSkillText).replace(/;?\s*Pericia\s*:\s*[^\n;]+/i,'').trim();
      setCharacterStat(updated,'COMPETENCIAS','Habilidades',[baseSkillText,'Pericia: '+[...oldExpertiseList,...expertiseChoices].join(', ')].filter(Boolean).join('; '));
    }
    if(needsNewSkill) {
      const oldSkillText=getCharacterStat(updated,'COMPETENCIAS','Habilidades');
      setCharacterStat(updated,'COMPETENCIAS','Habilidades',[oldSkillText,levelUpNewSkill].filter(Boolean).join('; '));
    }
    if(needsNewLanguages) {
      const oldLanguages=getCharacterStat(updated,'COMPETENCIAS','Idiomas');
      setCharacterStat(updated,'COMPETENCIAS','Idiomas',[oldLanguages,...languageChoices].filter(Boolean).join(', '));
    }
    if(needsWildShapeForms) setCharacterStat(updated,'RASGOS Y DOTES','Formas salvajes conocidas',wildShapeForms.join(', '));
    if(needsMetamagic) setCharacterStat(updated,'RASGOS Y DOTES','Opciones de metamagia',metamagicChoices.join(', '));
    if(needsWarlockInvocations) {
      setCharacterStat(updated,'RASGOS Y DOTES','Invocaciones sobrenaturales',invocationChoices.join(', '));
      setCharacterStat(updated,'RASGOS Y DOTES','Detalles de invocaciones',invocationChoices.map(builderWarlockInvocationDescription).join('\n\n'));
    }
    if(needsMysticArcanum) setCharacterStat(updated,'CONJUROS','Arcanum místico',arcanumChoices.join(', '));
    if(needsElementalFury) setCharacterStat(updated,'RASGOS Y DOTES','Opción de Furia elemental',levelUpElementalFury);
    if(needsBlessedStrikes) setCharacterStat(updated,'RASGOS Y DOTES','Opción de Golpes benditos',levelUpBlessedStrikes);
    if(needsWizardMastery) { setCharacterStat(updated,'CONJUROS','Maestría sobre conjuros nivel 1',levelUpWizardMastery1); setCharacterStat(updated,'CONJUROS','Maestría sobre conjuros nivel 2',levelUpWizardMastery2); }
    if(needsWizardIllusionCantrip) {
      const bonusCantrip=alreadyKnowsMinorIllusion?levelUpWizardIllusionCantrip.trim():'Ilusión menor';
      setCharacterStat(updated,'CONJUROS','Trucos de subclase',bonusCantrip);
      const allKnownTricks=[...splitChoiceList(getCharacterStat(updated,'CONJUROS','Trucos')),...splitChoiceList(getCharacterStat(updated,'CONJUROS','Trucos de clase'))];
      if(!allKnownTricks.some(name=>normalizeLevelText(name)===normalizeLevelText(bonusCantrip))) setCharacterStat(updated,'CONJUROS','Trucos',[...allKnownTricks,bonusCantrip].join(', '));
    }
    if(needsWizardSignature) setCharacterStat(updated,'CONJUROS','Conjuros característicos',wizardSignatureChoices.join(', '));
    if(needsBattleMasterTraining || needsFeySkill) {
      const oldSkills=getCharacterStat(updated,'COMPETENCIAS','Habilidades');
      setCharacterStat(updated,'COMPETENCIAS','Habilidades',[oldSkills,levelUpSubclassSkill].filter(Boolean).join('; '));
    }
    if(needsCollegeKnowledgeSkills) {
      const oldSkills=getCharacterStat(updated,'COMPETENCIAS','Habilidades');
      setCharacterStat(updated,'COMPETENCIAS','Habilidades',[oldSkills,...collegeKnowledgeSkills].filter(Boolean).join('; '));
    }
    if(needsBattleMasterTraining) {
      const oldTools=getCharacterStat(updated,'COMPETENCIAS','Herramientas');
      setCharacterStat(updated,'COMPETENCIAS','Herramientas',[oldTools,levelUpSubclassTool].filter(Boolean).join('; '));
    }
    if(needsBattleManeuvers) setCharacterStat(updated,'RASGOS Y DOTES','Maniobras de maestro del combate',maneuverChoices.join(', '));
    if(targetMasteries>0 && masteryChoices.length===targetMasteries) setCharacterStat(updated,'ATAQUES','Maestrías con armas',masteryChoices.join(', '));

    const classMagicAbility=(BUILDER_MAGIC_ABILITY as any)[className] || '';
    const classSpellResources=row.resources || {};
    const classCantripCount=Number(classSpellResources['Trucos']);
    const classPreparedCount=Number(classSpellResources['Conjuros preparados']);
    const classSlotValues=Object.entries(classSpellResources).filter(([key,value]:any)=>String(key).startsWith('Espacios nivel ') && value && value!=='—' && Number(value)>0).map(([key,value]:any)=>key.replace('Espacios ','')+': '+value);
    const pactSlotValues=['Espacios de conjuro','Nivel de los espacios'].filter(key=>classSpellResources[key] && classSpellResources[key]!=='—').map(key=>key+': '+classSpellResources[key]);
    if (classMagicAbility && (Number.isFinite(classCantripCount) || Number.isFinite(classPreparedCount) || classSlotValues.length || pactSlotValues.length)) {
      const abilityScore=getCharacterNumber(updated,'ATRIBUTOS',classMagicAbility,10);
      const abilityMod=Math.floor((abilityScore-10)/2);
      const proficiencyBonus=Number(String(row.proficiency || '+2').replace('+','')) || 2;
      setCharacterStat(updated,'CONJUROS','Lanzamiento de conjuros','Sí');
      setCharacterStat(updated,'CONJUROS','Aptitud mágica',classMagicAbility);
      setCharacterStat(updated,'CONJUROS','CD de salvación',8+abilityMod+proficiencyBonus);
      setCharacterStat(updated,'CONJUROS','Ataque de conjuro',(abilityMod+proficiencyBonus>=0?'+':'')+(abilityMod+proficiencyBonus));
      if (Number.isFinite(classCantripCount)) setCharacterStat(updated,'CONJUROS','Trucos máximos',classCantripCount);
      if (Number.isFinite(classPreparedCount)) setCharacterStat(updated,'CONJUROS','Conjuros preparados máximos',classPreparedCount);
      const slotsSummary=[...classSlotValues,...pactSlotValues].join(' · ');
      if (slotsSummary) {
        setCharacterStat(updated,'CONJUROS','Espacios por nivel',slotsSummary);
        setCharacterStat(updated,'CONJUROS','Espacios de conjuro',slotsSummary);
      }
      setCharacterStat(updated,'CONJUROS','Lista de conjuros de clase',className);
      if(levelUpClassCantrips.trim()) {
        const oldClassTricks=splitChoiceList(getCharacterStat(updated,'CONJUROS','Trucos de clase'));
        const combinedTricks=splitChoiceList(getCharacterStat(updated,'CONJUROS','Trucos'));
        const otherTricks=combinedTricks.filter(name=>!oldClassTricks.some(old=>normalizeLevelText(old)===normalizeLevelText(name)));
        setCharacterStat(updated,'CONJUROS','Trucos de clase',classCantripNames.join(', '));
        setCharacterStat(updated,'CONJUROS','Trucos',[...classCantripNames,...otherTricks].join(', '));
      }
      if(levelUpClassSpells.trim()) {
        const oldClassSpells=splitChoiceList(getCharacterStat(updated,'CONJUROS','Conjuros preparados de clase') || (className==='Mago'?(String(getCharacterStat(updated,'CONJUROS','Conjuros de nivel 1')).match(/Preparados:\s*([^.]*)/i)||[])[1]||'':''));
        const combinedSpells=splitChoiceList(getCharacterStat(updated,'CONJUROS','Conjuros de nivel 1'));
        const oldPreparedText=className==='Mago'?(String(getCharacterStat(updated,'CONJUROS','Conjuros de nivel 1')).split(/Preparados:/i).pop()||''):'';
        const otherSpells=(className==='Mago'?splitChoiceList(oldPreparedText):combinedSpells).filter(name=>!oldClassSpells.some(old=>normalizeLevelText(old)===normalizeLevelText(name)) && !/^libro:|^preparados:/i.test(name));
        setCharacterStat(updated,'CONJUROS','Conjuros preparados de clase',classSpellNames.join(', '));
        if(className==='Mago') {
          const newBook=[...currentWizardBook,...wizardBookAdditions,...wizardSchoolNewChoices];
          setCharacterStat(updated,'CONJUROS','Libro de conjuros',newBook.join(', '));
          setCharacterStat(updated,'CONJUROS','Conjuros de escuela',wizardSchoolChoices.join(', '));
          setCharacterStat(updated,'CONJUROS','Conjuros de nivel 1','Libro: '+newBook.join(', ')+'. Preparados: '+[...classSpellNames,...otherSpells].join(', '));
        } else {
          setCharacterStat(updated,'CONJUROS','Conjuros de nivel 1',[...classSpellNames,...otherSpells].join(', '));
        }
      } else if(className==='Mago' && wizardBookAdditions.length) {
        const newBook=[...currentWizardBook,...wizardBookAdditions,...wizardSchoolNewChoices];
        setCharacterStat(updated,'CONJUROS','Libro de conjuros',newBook.join(', '));
        setCharacterStat(updated,'CONJUROS','Conjuros de escuela',wizardSchoolChoices.join(', '));
      }
    }
    if(castingTable && castingRow && numericSubclassCasting) {
      const slotValues=castingTable.columns.map((column:string,index:number)=>({column,value:castingRow[index]})).filter((x:any)=>normalizeLevelText(x.column).startsWith('espacios nivel')&&x.value!=='—'&&Number(x.value)>0);
      const subclassMagicAbility=(className==='Guerrero'||className==='Pícaro')?'Inteligencia':'Sabiduría';
      setCharacterStat(updated,'CONJUROS','Lanzamiento de conjuros','Sí');
      setCharacterStat(updated,'CONJUROS','Aptitud mágica',subclassMagicAbility);
      setCharacterStat(updated,'CONJUROS','Lista de conjuros de subclase',(className==='Guerrero'||className==='Pícaro')?'Mago':className);
      setCharacterStat(updated,'CONJUROS','Conjuros preparados máximos',targetSubclassPrepared);
      setCharacterStat(updated,'CONJUROS','Espacios por nivel',slotValues.map((x:any)=>x.column.replace('Espacios ','')+': '+x.value).join(' · '));
      if(subclassCantripTarget>0) {
        setCharacterStat(updated,'CONJUROS','Trucos máximos',subclassCantripTarget);
        setCharacterStat(updated,'CONJUROS','Trucos de subclase',levelUpSubclassCantrips.trim());
      }
      if(levelUpSubclassSpells.trim()) setCharacterStat(updated,'CONJUROS','Conjuros preparados de subclase',levelUpSubclassSpells.trim());
    }
    if(castingTable && castingRow && !numericSubclassCasting) {
      const spellList=String(castingCell||'').split(/[,;]+/).map((x:string)=>x.trim()).filter(Boolean);
      const existing=getCharacterStat(updated,'CONJUROS','Conjuros adicionales de subclase');
      const merged=[...new Set([...splitChoiceList(existing),...spellList].filter(Boolean))];
      setCharacterStat(updated,'CONJUROS','Conjuros adicionales de subclase',merged.join(', '));
    }
    const fixedSpellTables=subclassSpellTables.filter((table:any)=>table!==castingTable);
    if (fixedSpellTables.length) {
      const selectedTable=fixedSpellTables.find((table:any)=>table.name===levelUpSubclassVariant)||(fixedSpellTables.length===1?fixedSpellTables[0]:null);
      if (selectedTable) {
        const spellColumn=selectedTable.columns.findIndex((column:string)=>normalizeLevelText(column).includes('conjuros'));
        const spellList=selectedTable.rows.filter((values:string[])=>Number(values[0])<=nextLevel).map((values:string[])=>values[spellColumn]).filter(Boolean);
        const existing=getCharacterStat(updated,'CONJUROS','Conjuros adicionales de subclase');
        const merged=[...new Set([...(existing?existing.split(/[,;\n]+/).map((x:string)=>x.trim()):[]),...spellList.flatMap((x:string)=>x.split(/[,;]+/).map((v:string)=>v.trim()))].filter(Boolean))];
        setCharacterStat(updated,'CONJUROS','Conjuros adicionales de subclase',merged.join(', '));
      }
    }

    const previous=getCharacterStat(updated,'PROGRESIÓN','Historial de niveles');
    const subclassFeatureText=subclassFeatures.map((feature:any)=>'Nivel '+feature.level+' · '+feature.name+'\n'+feature.description).join('\n\n');
    const subclassFeatureNames=subclassFeatures.map((feature:any)=>feature.name);
    const record='Nivel '+nextLevel+': '+features.join(', ')+(subclassFeatureNames.length?' · '+formatSubclassName(subclass?.key || '')+': '+subclassFeatureNames.join(', '):'')+(needsASI?(levelUpAsiMode==='feat'?' · Dote: '+levelUpFeat.trim():' · Mejora: '+levelUpAbility1+' +'+levelUpIncrease1+(Number(levelUpIncrease2)?', '+levelUpAbility2+' +'+levelUpIncrease2:'')):'')+(needsEpicFeat?' · Don épico: '+levelUpFeat.trim()+' · '+levelUpEpicFeatAbility+' +1':'')+(needsBarbarianWildAspect?' · Aspecto de lo salvaje: '+levelUpBarbarianAspect:'')+(needsRangerStyle?' · Estilo de combate: '+levelUpRangerStyle:'')+(needsFighterStyle?' · Estilos de combate: '+fighterStyleChoices.join(', '):'')+(isRangerDruidicWarrior?' · Guerrero druídico: '+rangerCantripChoices.join(', '):'')+(needsHunterPrey?' · Cazador y presa: '+levelUpRangerHunterPrey:'')+(needsHunterDefense?' · Tácticas defensivas: '+levelUpRangerHunterDefense:'')+(needsRangerFeyGift?' · Bendición feérica: '+levelUpRangerFeyGift:'')+(needsRangerBeastCompanion?' · Compañero primigenio: '+levelUpRangerBeastProfile+' · '+levelUpRangerBeastAnimal:'')+(needsExpertise?' · Pericia: '+expertiseChoices.join(', '):'')+(needsNewSkill?' · Competencia: '+levelUpNewSkill:'')+(needsNewLanguages?' · Idiomas: '+languageChoices.join(', '):'')+(needsWildShapeForms?' · Formas salvajes: '+wildShapeForms.join(', '):'')+(needsMetamagic?' · Metamagia: '+metamagicChoices.join(', '):'')+(needsDraconicAffinity?' · Afinidad elemental: '+levelUpSorcererAffinity:'')+(needsWarlockInvocations?' · Invocaciones: '+invocationChoices.join(', '):'')+(needsMysticArcanum?' · Arcanum místico: '+arcanumChoices.join(', '):'')+(needsElementalFury?' · Furia elemental: '+levelUpElementalFury:'')+(needsBlessedStrikes?' · Golpes benditos: '+levelUpBlessedStrikes:'')+(needsWizardMastery?' · Maestría sobre conjuros: '+levelUpWizardMastery1+', '+levelUpWizardMastery2:'')+(needsWizardSignature?' · Conjuros característicos: '+wizardSignatureChoices.join(', '):'')+(className==='Monje' && nextLevel===20?' · Cuerpo y mente: +4 Destreza y +4 Sabiduría (máximo 25)':'')+(needsBattleMasterTraining?' · Estudioso de la guerra: '+levelUpSubclassSkill+', '+levelUpSubclassTool:'')+(needsFeySkill?' · Glamur sobrenatural: '+levelUpSubclassSkill:'')+(needsCollegeKnowledgeSkills?' · Competencias adicionales del Colegio del Conocimiento: '+collegeKnowledgeSkills.join(', '):'')+(needsBattleManeuvers?' · Maniobras: '+maneuverChoices.join(', '):'')+(targetMasteries>oldMasteryCount?' · Maestrías con armas: '+masteryChoices.join(', '):'')+(levelUpDecision.trim()?' · '+levelUpDecision.trim():'');
    setCharacterStat(updated,'PROGRESIÓN','Historial de niveles',[previous,record].filter(Boolean).join('\n'));
    setCharacterStat(updated,'PROGRESIÓN','Rasgos de clase del nivel '+nextLevel,classFeatureDetails || features.join(', ') || 'Sin rasgos nuevos indicados');
    if (subclassFeatureText) {
      setCharacterStat(updated,'PROGRESIÓN','Rasgos de subclase nivel '+nextLevel,subclassFeatureText);
      const previousSubclassFeatures=getCharacterStat(updated,'PROGRESIÓN','Rasgos de subclase acumulados');
      setCharacterStat(updated,'PROGRESIÓN','Rasgos de subclase acumulados',[previousSubclassFeatures,subclassFeatureText].filter(Boolean).join('\n\n'));
      const oldSubclassTraits=getCharacterStat(updated,'RASGOS Y DOTES','Otros rasgos');
      setCharacterStat(updated,'RASGOS Y DOTES','Otros rasgos',[oldSubclassTraits,subclassFeatureText].filter(Boolean).join('\n\n'));
    }
    const speciesUnlock=getSpeciesLevelUnlock(updated,nextLevel);
    if(speciesUnlock.features.length) {
      const speciesFeatureText=speciesUnlock.features.map(feature=>'Nivel '+nextLevel+' · '+feature.name+'\n'+feature.description).join('\n\n');
      const oldSpeciesTraits=getCharacterStat(updated,'RASGOS Y DOTES','Rasgos de especie');
      setCharacterStat(updated,'RASGOS Y DOTES','Rasgos de especie',[oldSpeciesTraits,speciesFeatureText].filter(Boolean).join('\n\n'));
      const oldSpeciesProgression=getCharacterStat(updated,'PROGRESIÓN','Rasgos de especie acumulados');
      setCharacterStat(updated,'PROGRESIÓN','Rasgos de especie nivel '+nextLevel,speciesFeatureText);
      setCharacterStat(updated,'PROGRESIÓN','Rasgos de especie acumulados',[oldSpeciesProgression,speciesFeatureText].filter(Boolean).join('\n\n'));
    }
    if(speciesUnlock.spells.length) {
      const oldSpeciesSpells=splitChoiceList(getCharacterStat(updated,'CONJUROS','Conjuros de especie'));
      setCharacterStat(updated,'CONJUROS','Conjuros de especie',[...new Set([...oldSpeciesSpells,...speciesUnlock.spells])].join(', '));
    }
    if(levelUpDecision.trim()) {
      const oldOtherTraits=getCharacterStat(updated,'RASGOS Y DOTES','Otros rasgos');
      setCharacterStat(updated,'RASGOS Y DOTES','Otros rasgos',[oldOtherTraits,'Nivel '+nextLevel+' · Elecciones: '+levelUpDecision.trim()].filter(Boolean).join('\n\n'));
    }
    setCharacterStat(updated,'PROGRESIÓN','Recursos según tabla de clase',resourceText || 'Sin cambios de recursos tabulados');
    if (subclass) {
      const tableSummary=(subclass.tables || []).map((table:any)=>table.name+'\n'+table.columns.join(' | ')+'\n'+table.rows.map((r:string[])=>r.join(' | ')).join('\n')).join('\n\n');
      if (tableSummary) setCharacterStat(updated,'PROGRESIÓN','Tablas de subclase · '+formatSubclassName(subclass.key),tableSummary);
    }
    refreshDerivedCharacterSheet(updated);
    const playerId=levelUpEntry.playerId;
    roomSheets=[...roomSheets.filter(x=>x.playerId!==playerId),{...levelUpEntry,sheet:updated}];
    void OBR.broadcast.sendMessage(CHANNEL,{type:'character-level-up',playerId,playerName:levelUpEntry.playerName,character:updated},{destination:'ALL'}).catch(()=>{});
    levelUpEntry=null;
    notice='Nivel '+nextLevel+' aplicado a '+updated.name+'. La ficha contiene los datos de clase, subclase, características, puntos de golpe y conjuros del nuevo nivel.';
  }

  function repairGenericStatLabels(target: RawSheet | null | undefined) {
    if (!target?.sections) return target;
    const labels: Record<string, string[]> = {
      CONJUROS: ['Aptitud mágica','CD de salvación','Ataque de conjuro','Trucos','Conjuros de nivel 1','Espacios de conjuro','Trucos máximos','Conjuros preparados máximos','Espacios por nivel','Trucos de clase','Conjuros preparados de clase','Libro de conjuros','Conjuros de especie','Aptitud mágica de especie','CD de especie','Ataque de conjuro de especie','Conjuros de trasfondo','Aptitud mágica de trasfondo','CD de trasfondo','Ataque de conjuro de trasfondo','Conjuros de dote','Aptitud mágica de dote','CD de dote','Ataque de conjuro de dote','Trucos de subclase','Conjuros preparados de subclase','Aptitud mágica de subclase','CD de subclase','Ataque de conjuro de subclase','Trucos de estilo de combate','Aptitud mágica de estilo de combate','CD de estilo de combate','Ataque de conjuro de estilo de combate','Lista de conjuros de estilo de combate','Arcanum místico','Conjuros de escuela','Opción de Furia elemental','Opción de Golpes benditos','Maestría sobre conjuros nivel 1','Maestría sobre conjuros nivel 2','Conjuros característicos']
    };
    for (const section of target.sections) {
      const expected = labels[String(section.name || '').trim().toUpperCase()];
      if (!expected || !Array.isArray(section.stats)) continue;
      section.stats.forEach((stat, index) => {
        if (/^Dato\\s*\\d+$/i.test(String(stat.name || '').trim()) && expected[index]) stat.name = expected[index];
      });
    }
    return target;
  }

  function sectionPairs(sections: RawSection[] = []) {
    const result: { heading: RawSection; values?: RawSection }[] = [];
    for (let i = 0; i < sections.length; i++) {
      const current = sections[i];
      if (String(current.name || '').toUpperCase() === 'VALORES') continue;
      const next = sections[i + 1];
      result.push({
        heading: current,
        values: next && String(next.name || '').toUpperCase() === 'VALORES' ? next : undefined
      });
      if (result[result.length - 1].values) i++;
    }
    return result;
  }

  function sectionTab(name = '') {
    const n = name.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/conjuro|hechizo|spell|magia/.test(n)) return 'Conjuros';
    if (/uso[s]? limitado|limited use|recurso|recarga|cargas|charges/.test(n)) return 'Rasgos y características';
    if (/habilidad|skill|percepcion|investigacion|intuicion|acroba|sigilo|supervivencia/.test(n)) return 'Habilidades';
    if (/inventario|equipo|objeto|inventory|equipment/.test(n)) return 'Inventario';
    if (/velocidad|speed|defensa|defenses|resistencia|inmunidad|vulnerabilidad|puntos de golpe|hit points|armadura|armor class|clase de armadura/.test(n)) return 'Velocidad y defensas';
    if (/rasgo|dote|caracteristica de clase|racial|especie|feature|trait/.test(n)) return 'Rasgos y características';
    if (/competencia|entrenamiento|proficien|idioma|herramienta|tool|weapon training|armor training/.test(n)) return 'Competencias y entrenamiento';
    if (/trasfondo|background|historia|personalidad|apariencia/.test(n)) return 'Trasfondo';
    if (/nota[s]?|notes/.test(n)) return 'Notas';
    if (/extra[s]?|compañero|mascota|familiar|extras/.test(n)) return 'Extras';
    if (/atributo|ability|salvacion|saving throw|personaje|datos/.test(n)) return 'Características y salvaciones';
    if (/combate|ataque|arma|weapon|action|acciones/.test(n)) return 'Acciones';
    return 'Extras';
  }

  function visiblePairs(sections: RawSection[] = [], tab = activeTab) {
    return sectionPairs(sections)
      .filter(pair => sectionTab(String(pair.heading.name || '')) === tab)
      .map(pair => {
        const headingName = String(pair.heading.name || '').toLocaleLowerCase();
        const hideEmpty = /rasgos y dotes|conjuros|detalle de conjuros/.test(headingName);
        if (!hideEmpty) return pair;
        const keptIndexes = (pair.heading.stats || []).map((stat, index) => {
          const value = displayValue(pair.values?.stats?.[index]?.value) || displayValue(stat.value);
          return value && !/^[-—]+$/.test(value.trim()) ? index : -1;
        }).filter(index => index >= 0);
        if (!keptIndexes.length) return null;
        return {
          ...pair,
          heading: { ...pair.heading, stats: keptIndexes.map(index => pair.heading.stats![index]) },
          values: pair.values ? { ...pair.values, stats: keptIndexes.map(index => pair.values!.stats?.[index]).filter(Boolean) } : undefined
        };
      })
      .filter((pair): pair is { heading: RawSection; values?: RawSection } => Boolean(pair));
  }

  function continuousSheetPairs(sections: RawSection[] = []) {
    const order = [
      'Características y salvaciones',
      'Velocidad y defensas',
      'Habilidades',
      'Acciones',
      'Inventario',
      'Conjuros',
      'Rasgos y características',
      'Competencias y entrenamiento',
      'Trasfondo',
      'Notas',
      'Extras'
    ];
    return sectionPairs(sections)
      .map(pair => {
        const headingName = String(pair.heading.name || '').toLocaleLowerCase();
        const hideEmpty = /rasgos y dotes|conjuros|detalle de conjuros/.test(headingName);
        if (!hideEmpty) return pair;
        const keptIndexes = (pair.heading.stats || []).map((stat, index) => {
          const value = displayValue(pair.values?.stats?.[index]?.value) || displayValue(stat.value);
          return value && !/^[-—]+$/.test(value.trim()) ? index : -1;
        }).filter(index => index >= 0);
        if (!keptIndexes.length) return null;
        return {
          ...pair,
          heading: { ...pair.heading, stats: keptIndexes.map(index => pair.heading.stats![index]) },
          values: pair.values ? { ...pair.values, stats: keptIndexes.map(index => pair.values!.stats?.[index]).filter(Boolean) } : undefined
        };
      })
      .filter((pair): pair is { heading: RawSection; values?: RawSection } => Boolean(pair))
      .sort((a, b) => {
        const ai = order.indexOf(sectionTab(String(a.heading.name || '')));
        const bi = order.indexOf(sectionTab(String(b.heading.name || '')));
        return (ai < 0 ? order.length : ai) - (bi < 0 ? order.length : bi);
      });
  }

  let builderPreviewTab = 'Características y salvaciones';
  const builderPreviewTabs = ['Características y salvaciones','Velocidad y defensas','Habilidades','Acciones','Inventario','Conjuros','Rasgos y características','Competencias y entrenamiento','Trasfondo','Notas','Extras'];
  let playerSheetTab = 'Acciones';
  const playerSheetTabs = ['Acciones', 'Conjuros', 'Inventario', 'Rasgos y características', 'Descripción', 'Notas'];

  function playerSheetPairs(tab: string, sections: RawSection[] = sheet?.sections || []) {
    return sectionPairs(sections).filter(pair => {
      const heading = String(pair.heading.name || '');
      const category = sectionTab(heading);
      if (tab === 'Acciones') return category === 'Acciones' || category === 'Velocidad y defensas';
      if (tab === 'Conjuros') return category === 'Conjuros';
      if (tab === 'Inventario') return category === 'Inventario';
      if (tab === 'Rasgos y características') return category === 'Rasgos y características' || category === 'Extras';
      if (tab === 'Descripción') return category === 'Trasfondo';
      if (tab === 'Notas') return category === 'Notas';
      return false;
    });
  }

  function playerSidePairs(kind: 'saves' | 'skills' | 'training', sections: RawSection[] = sheet?.sections || []) {
    return sectionPairs(sections).filter(pair => {
      const heading = String(pair.heading.name || '').toLocaleLowerCase();
      const category = sectionTab(heading);
      if (kind === 'skills') return category === 'Habilidades';
      if (kind === 'training') return category === 'Competencias y entrenamiento';
      return /salvaci|saving throw/.test(heading);
    });
  }

  function playerAttributes(sections: RawSection[] = sheet?.sections || []) {
    return sectionPairs(sections).filter(pair => sectionClass(String(pair.heading.name || '')) === 'attributes-section');
  }

  function sectionClass(name = '') {
    const n = name.toLocaleLowerCase();
    if (/ataque|arma/.test(n)) return 'attacks-section';
    if (/atribut|característic|ability|ability score/.test(n)) return 'attributes-section';
    if (/combate|ataque|armadura|punto de golpe|defensa/.test(n)) return 'combat-section';
    if (/habilidad|salvaci|competenc/.test(n)) return 'skills-section';
    if (/rasgo|dote|característica de clase|especie|racial/.test(n)) return 'features-section';
    if (/conjuro|magia|hechizo/.test(n)) return 'magic-section';
    if (/equipo|inventario|objeto/.test(n)) return 'equipment-section';
    if (/personalidad|historia|trasfondo|apariencia/.test(n)) return 'story-section';
    return 'general-section';
  }

  function displayValue(value: unknown) {
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value).trim() === '' ? '' : String(value);
  }

  function readPlayers(players: any[]) {
    roomSheets = players.flatMap((p: any) => {
      const payload = p.metadata?.[KEY];
      if (!payload || payload.deleted || !payload.character) return [];
      return [{ playerId: p.id, playerName: p.name || payload.playerName || 'Jugador', sheet: repairGenericStatLabels(payload.character as RawSheet) as RawSheet }];
    });
  }

  async function refreshPlayers() {
    try { readPlayers(await OBR.party.getPlayers()); } catch {}
  }

  async function restoreOwnSheet() {
    if (obrRole !== 'PLAYER') return;
    const metadata: any = await OBR.player.getMetadata();
    const payload = metadata?.[KEY];
    if (payload?.deleted) {
      sheet = null;
      localStorage.removeItem('forja-raw-character');
      return;
    }
    if (payload?.character) {
      sheet = repairGenericStatLabels(payload.character as RawSheet) as RawSheet;
      localStorage.setItem('forja-raw-character', JSON.stringify(sheet));
    }
  }



  async function exportSheet() {
    if (!sheet) return;
    const json = JSON.stringify(sheet, null, 2);
    localStorage.setItem('forja-raw-character', json);
    const safeName = (sheet.name || 'personaje')
      .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'personaje';
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeName + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (obrReady && obrRole === 'PLAYER') {
      syncPending = true;
      await flushAutoSync();
    }
    notice = 'Personaje exportado como ' + safeName + '.json';
  }

  async function deleteSheet() {
    sheet = null;
    localStorage.removeItem('forja-raw-character');
    if (obrReady && obrRole === 'PLAYER') {
      try {
        const id = await OBR.player.getId();
        await OBR.player.setMetadata({ [KEY]: { deleted: true, updatedAt: new Date().toISOString() } });
        await OBR.broadcast.sendMessage(CHANNEL, { type: 'character-deleted', playerId: id }, { destination: 'ALL' });
      } catch {}
    }
    notice = 'Ficha eliminada.';
  }

  onMount(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('preview') === '1') openDemoPreview();
      const stored = localStorage.getItem('forja-raw-character');
      if (!demoPreview && stored) sheet = JSON.parse(stored) as RawSheet;
      const storedRolls = localStorage.getItem('forja-custom-rolls');
      if (storedRolls) {
        const saved = JSON.parse(storedRolls) as any[];
        customRolls = saved.map(item => ({
          id: item.id || String(Date.now()) + Math.random().toString(36).slice(2),
          name: item.name || 'Tirada',
          parts: Array.isArray(item.parts) ? item.parts : [{ id: String(Date.now()) + Math.random().toString(36).slice(2), name: item.name || 'Tirada', die: Number(item.die) || 20, bonus: Number(item.bonus) || 0 }]
        }));
        persistCustomRolls();
      }
    } catch {
      localStorage.removeItem('forja-raw-character');
    }
    if (OBR.isAvailable) OBR.onReady(async () => {
      obrReady = true;
      try {
        obrRole = await OBR.player.getRole();
        playerName = await OBR.player.getName();
        syncStatus = 'Conectado a Owlbear Rodeo como ' + (obrRole === 'GM' ? 'Director de juego.' : 'Jugador.');
        if (!demoPreview) await restoreOwnSheet();
        await refreshPlayers();
        OBR.party.onChange((players: any[]) => readPlayers(players));
        OBR.broadcast.onMessage(`${DICE_PLUS_SOURCE}/roll-error`, (event: any) => {
          const failure = event.data;
          if (!failure?.rollId || failure.rollId === lastRollId) {
            notice = 'Dice+ rechazó la notación «' + String(failure?.notation || 'desconocida') + '»: ' + String(failure?.error || 'error de notación');
          }
        });
        OBR.broadcast.onMessage(CHANNEL, (event: any) => {
          const d = event.data;
          if (d?.type === 'character-updated' && d.character) {
            roomSheets = [...roomSheets.filter(x => x.playerId !== d.playerId), {
              playerId: d.playerId, playerName: d.playerName || 'Jugador', sheet: d.character
            }];
          }
          if (d?.type === 'character-deleted') roomSheets = roomSheets.filter(x => x.playerId !== d.playerId);
          if (d?.type === 'character-level-up' && d.character && obrRole === 'PLAYER') {
            void (async () => {
              try {
                const ownId = await OBR.player.getId();
                if (ownId !== d.playerId) return;
                sheet = d.character as RawSheet;
                localStorage.setItem('forja-raw-character',JSON.stringify(sheet));
                await OBR.player.setMetadata({ [KEY]: { character: sheet, playerName, updatedAt: new Date().toISOString() } });
                await OBR.broadcast.sendMessage(CHANNEL,{type:'character-updated',playerId:ownId,playerName,character:sheet},{destination:'ALL'});
                notice = 'El director ha actualizado tu personaje al nivel '+getCharacterStat(sheet,'PERSONAJE','Nivel')+'.';
              } catch { notice = 'No se pudo recibir la subida de nivel. Importa la ficha actualizada desde el director.'; }
            })();
          }
        });
      } catch {
        syncStatus = 'Owlbear está abierto, pero no se pudo leer la sala.';
      }
    });
  });
</script>

<svelte:head><title>Forja de Aventureros — D&D 2024</title></svelte:head>
<div class="app-shell">
  <header class="topbar">
    <a class="brand" href="#inicio"><span class="brand-mark">✦</span><span><strong>FORJA DE AVENTUREROS</strong><small>D&D · 2024</small></span></a>
    {#if obrRole === 'GM'}<nav><span>Director de juego</span></nav>{:else}<nav><span>{playerName || 'Jugador'}</span></nav>{/if}
  </header>

  <main class="main" class:gm-layout={obrRole === 'GM'}>
    {#if obrRole === 'GM'}
      <nav class="master-tabs" role="tablist" aria-label="Herramientas del director">
        {#each masterTabs as tab}
          <button class:active={masterTab === tab} role="tab" aria-selected={masterTab === tab} on:click={() => masterTab = tab}>{tab}</button>
        {/each}
      </nav>
      {#if masterTab === 'Personajes'}
        <section class="panel roster-panel">
          <div class="section-heading"><h2>Personajes de la sala</h2><span class="count">{roomSheets.length}</span></div>
          <div class="actions"><button class="secondary" on:click={refreshPlayers}>Actualizar</button></div>
          {#if !roomSheets.length}<p class="muted">No hay personajes publicados.</p>
          {:else}
            {#each roomSheets as entry}
              <article class="character-card">
                <div class="card-symbol">✧</div>
                <div class="card-identity"><h3>{entry.sheet?.name || 'Personaje sin nombre'}</h3><p>{entry.playerName}</p></div>
                <details class="gm-sheet-details">
                  <summary>Ver ficha</summary>
                  <div class="actions level-up-action"><button class="primary" on:click={() => openLevelUp(entry)} disabled={Number(getCharacterStat(entry.sheet,'PERSONAJE','Nivel'))>=20}>Subir nivel</button></div>
                  <div class="character-sheet gm-character-sheet">
                    <div class="sheet-banner"><h2>{entry.sheet?.name || 'Personaje'}</h2></div>
                    <div class="sheet-grid">
                      {#each sectionPairs(entry.sheet?.sections || []) as pair}
                        <section class="sheet-section {sectionClass(pair.heading.name)}">
                          <div class="sheet-section-title"><h3>{pair.heading.name || 'Sección'}</h3></div>
                          <div class="stats-list">
                            {#each pair.heading.stats || [] as stat, i}
                              <div class="sheet-stat"><span>{stat.name || '—'}</span><strong>{displayValue(pair.values?.stats?.[i]?.value ?? stat.value) || '—'}</strong></div>
                            {/each}
                          </div>
                        </section>
                      {/each}
                    </div>
                  </div>
                </details>
              </article>
            {/each}
          {/if}
          {#if levelUpEntry}
            <section class="level-up-panel">
              <div class="section-heading"><h2>Subir nivel · {levelUpEntry.sheet.name}</h2><span class="count">Nivel {Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1}</span></div>
              <p><strong>{getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')}</strong> · {getNextLevelFeatures(levelUpEntry)}.</p>
              {#if getClassFeaturesAtLevel(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase'),Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).length}
                <div class="subclass-level-preview"><strong>Rasgos de clase que se incorporarán</strong>{#each getClassFeaturesAtLevel(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase'),Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1) as feature}<div><b>{feature.name}</b><p>{feature.description}</p></div>{/each}</div>
              {/if}
              {#if getSpeciesLevelUnlock(levelUpEntry.sheet,Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).features.length || getSpeciesLevelUnlock(levelUpEntry.sheet,Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).spells.length}
                <div class="subclass-level-preview"><strong>Desbloqueo de especie</strong>{#each getSpeciesLevelUnlock(levelUpEntry.sheet,Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).features as feature}<div><b>{feature.name}</b><p>{feature.description}</p></div>{/each}{#if getSpeciesLevelUnlock(levelUpEntry.sheet,Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).spells.length}<p>Conjuros que se añadirán automáticamente: {getSpeciesLevelUnlock(levelUpEntry.sheet,Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).spells.join(', ')}.</p>{/if}</div>
              {/if}
              <label>Método de puntos de golpe<select bind:value={levelUpHpMode}><option value="average">Valor fijo del manual</option><option value="roll">Tirar dado de golpe</option></select></label>
              {#if levelUpHpMode==='roll'}<label>Resultado del dado (1–{LEVEL_HIT_DIE[getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')] || 8})<input type="number" min="1" max={LEVEL_HIT_DIE[getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')] || 8} bind:value={levelUpHpRoll} /></label>{/if}
              {#if String(getNextLevelFeatures(levelUpEntry)).toLowerCase().includes('subclase de') || (Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))>=3 && !getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Subclase'))}
                <label>Subclase · {getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')}<select bind:value={levelUpSubclass}><option value="">Selecciona una subclase</option>{#each getSubclassOptions(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')) as option}<option value={option}>{formatSubclassName(option)}</option>{/each}</select></label>
              {/if}
              {#if levelUpSubclass && getSubclassFeaturesForNextLevel(levelUpEntry).length}
                <div class="subclass-level-preview"><strong>Rasgos de subclase que se incorporarán</strong>{#each getSubclassFeaturesForNextLevel(levelUpEntry) as feature}<div><b>Nivel {feature.level}: {feature.name}</b><p>{feature.description}</p></div>{/each}</div>
              {/if}
              {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Guerrero'}
                <label>Estilos de combate conocidos (lista completa; puedes sustituir uno al subir de nivel){#if normalizeLevelText(levelUpSubclass || getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Subclase'))==='campeon' && Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1>=7} · Campeón: elige dos{/if}<textarea bind:value={levelUpFighterStyles} rows="2" placeholder="Ej. Defensa, Duelo" /></label>
                <small>Opciones: {BUILDER_CLASS_DATA['Guerrero'].specialOptions.join(' · ')}</small>
              {/if}
              {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Explorador' && Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1===2}
                <label>Estilo de combate<select bind:value={levelUpRangerStyle}><option value="">Elige una opción</option>{#each BUILDER_CLASS_DATA['Guerrero'].specialOptions as option}<option value={option}>{option}</option>{/each}<option value="Guerrero druídico">Guerrero druídico · aprende dos trucos de Druida</option></select></label>
              {/if}
              {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Explorador' && (levelUpRangerStyle || getCharacterStat(levelUpEntry.sheet,'RASGOS Y DOTES','Estilo de combate'))==='Guerrero druídico'}
                <label>Trucos de Guerrero druídico (elige dos; puedes sustituir uno al subir de nivel)<textarea bind:value={levelUpRangerCantrips} rows="2" placeholder="Ej. Guía, Voluta estelar" /></label>
                <small>Lista de Druida: {BUILDER_SPELL_LISTS.Druida.cantrips.join(' · ')}</small>
              {/if}
              {#if levelUpChoice('barbarian.wildHeart.aspect') && normalizeLevelText(levelUpSubclass || getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Subclase'))===levelUpChoice('barbarian.wildHeart.aspect')?.subclass && Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1===levelUpChoice('barbarian.wildHeart.aspect')?.level}
                <label>{levelUpChoice('barbarian.wildHeart.aspect')?.label} — {levelUpChoice('barbarian.wildHeart.aspect')?.description}<select bind:value={levelUpBarbarianAspect}><option value="">Elige una opción</option>{#each levelUpChoice('barbarian.wildHeart.aspect')?.options || [] as option}<option value={option}>{option}</option>{/each}</select></label>
              {/if}
              {#if levelUpSubclass && getSubclassSpellTables(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase'),levelUpSubclass).length>1}
                <label>Elección de la subclase<select bind:value={levelUpSubclassVariant}><option value="">Selecciona una opción</option>{#each getSubclassSpellTables(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase'),levelUpSubclass) as table}<option value={table.name}>{formatSubclassName(table.name)}</option>{/each}</select></label>
              {/if}
              {#if levelUpSubclass && getSubclassCastingTable(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase'),levelUpSubclass) && (getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Guerrero' || getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Pícaro')}
                <p class="muted">La subclase usa la lista de mago. Registra la lista completa de trucos y conjuros que conoces según la tabla.</p>
                <label>Trucos de la subclase (lista completa)<textarea bind:value={levelUpSubclassCantrips} rows="2" placeholder="Ej. Agarre electrizante, Rayo de escarcha" /></label>
                <label>Conjuros de la subclase (lista completa)<textarea bind:value={levelUpSubclassSpells} rows="2" placeholder="Ej. Escudo, Manos ardientes, Salto" /></label>
              {/if}
              {#if levelUpSubclass && getSubclassCastingTable(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase'),levelUpSubclass) && (getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Clérigo' || getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Druida')}
                <p class="muted">Los conjuros de dominio o círculo se incorporarán automáticamente desde la tabla de la subclase del manual.</p>
              {/if}
              {#if BUILDER_MAGIC_ABILITY[getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')]}
                {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Brujo' || getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Clérigo' || getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Druida' || (getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')!=='Hechicero' && Number(getNextLevelRowSafe(levelUpEntry)?.resources?.['Trucos']) > getCharacterNumber(levelUpEntry.sheet,'CONJUROS','Trucos máximos',0))}
                  <label>Trucos de clase conocidos (lista completa){#if ['Brujo','Clérigo','Druida'].includes(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase'))} · puedes sustituir uno al subir de nivel{/if}<textarea bind:value={levelUpClassCantrips} rows="2" placeholder="Escribe todos los trucos de clase conocidos, separados por comas" /></label>
                {/if}
                {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Brujo' || (getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')!=='Hechicero' && Number(getNextLevelRowSafe(levelUpEntry)?.resources?.['Conjuros preparados']) > getCharacterNumber(levelUpEntry.sheet,'CONJUROS','Conjuros preparados máximos',0))}
                  <label>Conjuros de clase preparados/conocidos (lista completa){#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Brujo'} · puedes sustituir uno al subir de nivel{/if}<textarea bind:value={levelUpClassSpells} rows="2" placeholder="Escribe la lista completa de conjuros de clase" /></label>
                {/if}
                {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Mago'}
                  <label>Dos conjuros nuevos para el libro del mago<input bind:value={levelUpWizardBookAdditions} placeholder="Dos conjuros separados por comas" /></label>
                  {#if levelUpSubclass && [3,5,7,9,11,13,15,17].includes(Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1)}
                    <label>Conjuros de escuela (lista completa)<textarea bind:value={levelUpWizardSchoolSpells} rows="3" placeholder="Registra todos los conjuros de tu escuela; al nivel 3 son tres y después se añade uno al desbloquear cada nuevo nivel de espacios." /></label>
                    <small>Escuela: {({ABJURADOR:'Abjuración',ADIVINO:'Adivinación',EVOCADOR:'Evocación',ILUSIONISTA:'Ilusionismo'})[levelUpSubclass] || levelUpSubclass}. Conserva los anteriores y añade los nuevos.</small>
                  {/if}
                  {#if normalizeLevelText(levelUpSubclass)==='ilusionista' && Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1===3}
                    {#if ([...splitChoiceList(getCharacterStat(levelUpEntry.sheet,'CONJUROS','Trucos')),...splitChoiceList(getCharacterStat(levelUpEntry.sheet,'CONJUROS','Trucos de clase'))]).some(name=>normalizeLevelText(name)==='ilusionmenor')}
                      <label>Truco adicional de Ilusionista (porque ya conoces Ilusión menor)<input bind:value={levelUpWizardIllusionCantrip} placeholder="Otro truco de mago que aún no conozcas" /></label>
                    {:else}
                      <p class="muted">Ilusión menor se añadirá automáticamente como truco adicional de la subclase; no cuenta para tu límite de trucos.</p>
                    {/if}
                  {/if}
                {/if}
              {/if}
              {#if (getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Guerrero' && Number(getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestría con armas'] || getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestrías con armas'] || 0) > splitChoiceList(getCharacterStat(levelUpEntry.sheet,'ATAQUES','Maestrías con armas')).length) || getClassFeaturesAtLevel(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase'),Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).some((feature)=>/ganas competencia en otra habilidad|ganas competencia en una habilidad|obtienes competencia en una habilidad/.test(normalizeLevelText(feature.description)))}
                {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Guerrero'}
                  <div class="builder-choice-wrapper"><strong>Maestrías con armas: conserva las anteriores y añade las nuevas</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Armas sencillas o marciales</strong><span>{splitChoiceList(levelUpWeaponMasteries).length}/{Number(getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestría con armas'] || getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestrías con armas'])}</span></div><div class="builder-checkbox-grid">{#each BUILDER_WEAPON_MASTERY_OPTIONS as weapon}<label class="builder-checkbox"><input type="checkbox" checked={splitChoiceList(levelUpWeaponMasteries).some(value=>normalizeLevelText(value)===normalizeLevelText(weapon))} on:change={(event)=>toggleLevelUpWeaponMastery(weapon,event,Number(getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestría con armas'] || getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestrías con armas']))} disabled={!splitChoiceList(levelUpWeaponMasteries).some(value=>normalizeLevelText(value)===normalizeLevelText(weapon)) && splitChoiceList(levelUpWeaponMasteries).length>=Number(getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestría con armas'] || getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestrías con armas'])} /><span>{weapon}</span></label>{/each}</div></div></div>
                {:else if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Bárbaro'}
                  {@const primalSkillChoice=levelUpChoice('barbarian.primalKnowledge.skill')}
                  <label>{primalSkillChoice?.label}<select bind:value={levelUpNewSkill}><option value="">Elige una habilidad nueva</option>{#each getLevelUpChoiceOptions(primalSkillChoice,splitChoiceList(getCharacterStat(levelUpEntry.sheet,'COMPETENCIAS','Habilidades'))) as skill}<option value={skill}>{skill}</option>{/each}</select></label>
                {:else}
                  <label>Nueva competencia en habilidad<input bind:value={levelUpNewSkill} placeholder="Elige una habilidad de la lista de tu clase" /></label>
                {/if}
              {/if}
              {#if getClassFeaturesAtLevel(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase'),Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).some((feature)=>normalizeLevelText(feature.name).includes('pericia') || /ganas pericia/.test(normalizeLevelText(feature.description))) }
                <label>Habilidades que obtienen Pericia (elige {getClassFeaturesAtLevel(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase'),Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).some((feature)=>normalizeLevelText(feature.name).includes('pericia'))?'dos':'una'})<input bind:value={levelUpExpertise} placeholder="Habilidades en las que ya tienes competencia" /></label>
              {/if}
              {#if getClassFeaturesAtLevel(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase'),Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).some((feature)=>/idiomas conoces dos idiomas/.test(normalizeLevelText(feature.description)))}
                <label>Dos idiomas nuevos<input bind:value={levelUpLanguages} placeholder="Ej. Dracónico, Gigante" /></label>
              {/if}
              {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Brujo' && Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1>=11}
                <label>Arcanum místico (conjuros de niveles 6, 7, 8 y 9, en ese orden)<textarea bind:value={levelUpMysticArcanum} rows="2" placeholder="Ej. Conjuro de nivel 6, Conjuro de nivel 7, ..." /></label>
              {/if}
              {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Brujo' && Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1>=2}
                <label>Invocaciones sobrenaturales (lista completa; repite las que lo permitan con una elección después de dos puntos)<textarea bind:value={levelUpInvocations} rows="3" placeholder="Ej. Pacto de la cadena, Mente sobrenatural, Descarga agónica: Descarga sobrenatural" /></label>
                <small>Opciones: {BUILDER_WARLOCK_INVOCATIONS.filter(item=>item.level<=(levelUpEntry?.sheet?Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1:1)).map(item=>item.name+' (nivel '+item.level+')').join(' · ')}</small>
              {/if}
              {#if levelUpSubclass==='MAESTRO DEL COMBATE' && Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1===3}
                <label>Habilidad de Estudioso de la guerra<select bind:value={levelUpSubclassSkill}><option value="">Elige una habilidad</option>{#each BUILDER_CLASS_SKILLS.Guerrero.options.filter(skill=>!splitChoiceList(getCharacterStat(levelUpEntry?.sheet||{},'COMPETENCIAS','Habilidades')).includes(skill)) as skill}<option>{skill}</option>{/each}</select></label>
                <label>Herramienta de artesano de Estudioso de la guerra<select bind:value={levelUpSubclassTool}><option value="">Elige una herramienta</option>{#each BUILDER_ARTISAN_TOOLS.filter(tool=>!splitChoiceList(getCharacterStat(levelUpEntry?.sheet||{},'COMPETENCIAS','Herramientas')).includes(tool)) as tool}<option>{tool}</option>{/each}</select></label>
              {/if}
              {#if levelUpSubclass==='ERRANTE FEÉRICO' && Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1===3}
                <label>Habilidad de Glamur sobrenatural<select bind:value={levelUpSubclassSkill}><option value="">Elige una habilidad</option><option>Engaño</option><option>Interpretación</option><option>Persuasión</option></select></label>
              {/if}
              {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Explorador' && normalizeLevelText(levelUpSubclass || getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Subclase')).replace(/[\s_-]/g,'')==='cazador' && Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1===3}
                <label>El cazador y la presa<select bind:value={levelUpRangerHunterPrey}><option value="">Elige una opción</option><option>Azote de colosos</option><option>Destructor de hordas</option></select></label>
              {/if}
              {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Explorador' && normalizeLevelText(levelUpSubclass || getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Subclase')).replace(/[\s_-]/g,'')==='cazador' && Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1===7}
                <label>Tácticas defensivas<select bind:value={levelUpRangerHunterDefense}><option value="">Elige una opción</option><option>Defensa contra ataques múltiples</option><option>Escapar de la horda</option></select></label>
              {/if}
              {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Explorador' && normalizeLevelText(levelUpSubclass || getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Subclase')).replace(/[\s_-]/g,'')==='errantefeerico' && Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1===3}
                <label>Bendición feérica<select bind:value={levelUpRangerFeyGift}><option value="">Elige una dádiva</option>{#each BUILDER_RANGER_FEY_GIFTS as gift}<option value={gift}>{gift}</option>{/each}</select></label>
              {/if}
              {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Explorador' && normalizeLevelText(levelUpSubclass || getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Subclase')).replace(/[\s_-]/g,'')==='senordelasbestias' && Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1===3}
                <label>Perfil de compañero primigenio<select bind:value={levelUpRangerBeastProfile}><option value="">Elige un perfil</option>{#each Object.keys(BUILDER_RANGER_BEAST_PROFILES) as profile}<option value={profile}>{profile}</option>{/each}</select></label>
                <label>Animal que representa a tu compañero<input bind:value={levelUpRangerBeastAnimal} placeholder="Ej. lobo, oso, águila, tiburón…" /></label>
                {#if levelUpRangerBeastProfile}<div class="builder-info"><strong>Estadísticas del perfil</strong><p>{BUILDER_RANGER_BEAST_PROFILES[levelUpRangerBeastProfile]}</p></div>{/if}
              {/if}
              {#if normalizeLevelText(levelUpSubclass)==='colegio del conocimiento' && Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1===3}
                <label>Competencias adicionales del Colegio del Conocimiento (elige tres habilidades nuevas)<textarea bind:value={levelUpSubclassSkills} rows="2" placeholder="Tres habilidades distintas, separadas por comas" /></label>
              {/if}
              {#if levelUpSubclass==='MAESTRO DEL COMBATE' && [3,7,10,15].includes(Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1)}
                <label>Maniobras de Maestro del combate (lista completa)<textarea bind:value={levelUpManeuvers} rows="3" placeholder="Ej. Arremetida, Ataque preciso, Contraataque" /></label>
                <small>Opciones: {BUILDER_BATTLE_MANEUVER_OPTIONS.join(' · ')}</small>
              {/if}
              {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Paladín' && Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1>=2}
                <label>Estilo de combate del paladín<select bind:value={levelUpPaladinStyle}><option value="">Conservar el estilo actual / elegir en nivel 2</option>{#each BUILDER_CLASS_DATA['Guerrero'].specialOptions as style}<option value={style}>{style}</option>{/each}</select></label>
                <small>En nivel 2 debes elegir uno. En niveles posteriores puedes conservarlo o sustituirlo por otro estilo.</small>
              {/if}
              {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Druida' && Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1===7}
                <label>Furia elemental<select bind:value={levelUpElementalFury}><option value="">Elige una opción</option><option>Golpe primordial</option><option>Lanzamiento potente</option></select></label>
              {/if}
              {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Clérigo' && Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1===7}
                <label>Golpes benditos<select bind:value={levelUpBlessedStrikes}><option value="">Elige una opción</option><option>Golpe divino</option><option>Lanzamiento potente</option></select></label>
              {/if}
              {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Mago' && Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1===18}
                <label>Maestría sobre conjuros: conjuro de nivel 1 del libro<input bind:value={levelUpWizardMastery1} placeholder="Conjuro de nivel 1 con lanzamiento de una acción" /></label>
                <label>Maestría sobre conjuros: conjuro de nivel 2 del libro<input bind:value={levelUpWizardMastery2} placeholder="Conjuro de nivel 2 con lanzamiento de una acción" /></label>
              {/if}
              {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Mago' && Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1===20}
                <label>Conjuros característicos (dos conjuros de nivel 3 de tu libro)<input bind:value={levelUpWizardSignatureSpells} placeholder="Conjuro 1, Conjuro 2" /></label>
              {/if}
              {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Hechicero'}
                <label>Trucos de hechicero conocidos (lista completa; puedes sustituir uno en cada subida)<textarea bind:value={levelUpClassCantrips} rows="2" placeholder="Escribe todos tus trucos de hechicero, separados por comas" /></label>
                <label>Conjuros de hechicero preparados (lista completa; puedes sustituir uno en cada subida)<textarea bind:value={levelUpClassSpells} rows="3" placeholder="Escribe todos tus conjuros preparados, separados por comas" /></label>
              {/if}
              {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Hechicero' && Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1>=2}
                <label>Opciones de metamagia (lista completa; puedes sustituir una al subir de nivel)<input bind:value={levelUpMetamagic} placeholder="Ej. Conjuro cuidadoso, Conjuro sutil" /></label>
              {/if}
              {#if normalizeLevelText(levelUpSubclass || getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Subclase'))==='hechiceria draconica' && Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1===6}
                <label>Afinidad elemental dracónica<select bind:value={levelUpSorcererAffinity}><option value="">Elige un tipo de daño</option>{#each ['Ácido','Frío','Fuego','Relámpago','Veneno'] as damage}<option>{damage}</option>{/each}</select></label>
              {/if}
              {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Druida' && [2,4,8].includes(Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1)}
                <label>{Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1===2?4:Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1===4?6:8} formas de bestia conocidas (VD {Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1===2?'1/4':Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1===4?'1/2':'1'} o inferior{Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1===8?', se permite vuelo':', sin vuelo'})<textarea bind:value={levelUpWildShapeForms} rows="2" placeholder="Introduce la lista completa de formas conocidas, separadas por comas" /></label>
              {/if}
              {#if Number(getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestría con armas'] || getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestrías con armas']) > splitChoiceList(getCharacterStat(levelUpEntry.sheet,'ATAQUES','Maestrías con armas')).length}
                {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Bárbaro'}
                  <div class="builder-choice-wrapper"><strong>Maestrías con armas: conserva las anteriores y añade las nuevas</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Armas cuerpo a cuerpo sencillas o marciales</strong><span>{splitChoiceList(levelUpWeaponMasteries).length}/{Number(getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestría con armas'] || getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestrías con armas'])}</span></div><div class="builder-checkbox-grid">{#each getLevelUpChoiceOptions(levelUpChoice('barbarian.weaponMastery')) as weapon}<label class="builder-checkbox"><input type="checkbox" checked={splitChoiceList(levelUpWeaponMasteries).some(value=>normalizeLevelText(value)===normalizeLevelText(weapon))} on:change={(event)=>toggleLevelUpWeaponMastery(weapon,event,Number(getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestría con armas'] || getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestrías con armas']))} disabled={!splitChoiceList(levelUpWeaponMasteries).some(value=>normalizeLevelText(value)===normalizeLevelText(weapon)) && splitChoiceList(levelUpWeaponMasteries).length>=Number(getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestría con armas'] || getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestrías con armas'])} /><span>{weapon}</span></label>{/each}</div></div></div>
                {:else}
                  <label>Maestrías con armas (lista completa)<input bind:value={levelUpWeaponMasteries} placeholder="Escribe todas las maestrías, separadas por comas" /></label>
                {/if}
              {/if}
              {#if String(getNextLevelFeatures(levelUpEntry)).toLowerCase().includes('mejora de característica')}
                <label>Tipo de mejora<select bind:value={levelUpAsiMode}><option value="asi">Aumentar características</option><option value="feat">Elegir una dote</option></select></label>
                {#if levelUpAsiMode==='asi'}
                  <div class="level-up-choice-grid"><label>Primera característica<select bind:value={levelUpAbility1}>{#each LEVEL_ABILITY_NAMES as ability}<option>{ability}</option>{/each}</select></label><label>Aumento<select bind:value={levelUpIncrease1}><option value="2">+2</option><option value="1">+1</option></select></label></div>
                  <div class="level-up-choice-grid"><label>Segunda característica<select bind:value={levelUpAbility2}>{#each LEVEL_ABILITY_NAMES as ability}<option>{ability}</option>{/each}</select></label><label>Aumento<select bind:value={levelUpIncrease2}><option value="0">No aplicar</option><option value="1">+1</option></select></label></div>
                {:else}<label>Dote elegida<input bind:value={levelUpFeat} placeholder="Nombre de la dote" /></label>{/if}
              {/if}
              {#if String(getNextLevelFeatures(levelUpEntry)).toLowerCase().includes('don épico')}
                <label>Don épico<select bind:value={levelUpFeat}><option value="">Elige un Don épico</option>{#each BUILDER_EPIC_FEATS as feat}<option value={feat}>{feat}</option>{/each}</select></label>
                <label>Característica que aumenta +1<select bind:value={levelUpEpicFeatAbility}>{#each builderEpicFeatAbilities(levelUpFeat) as ability}<option value={ability}>{ability}</option>{/each}</select></label>
              {/if}
              <label>Otras decisiones del rasgo (pericia, invocaciones, estilo de combate, conjuros, etc.)<textarea bind:value={levelUpDecision} rows="2" placeholder="Registra las elecciones realizadas para este nivel…" /></label>
              <p class="muted">Se conservarán los datos existentes. Los rasgos, recursos, elecciones de clase y desbloqueos de especie quedarán registrados en la ficha.</p>
              <div class="actions"><button class="secondary" on:click={closeLevelUp}>Cancelar</button><button class="primary" on:click={applyLevelUp}>Aplicar subida de nivel</button></div>
            </section>
          {/if}
        </section>
      {:else if masterTab === 'Tiradas'}
        <section class="panel gm-rolls-panel">
          <div class="section-heading"><h2>Crear tiradas</h2><span class="count">Dice+</span></div>
          <section class="custom-rolls">
            {#if customRolls.length}
              <div class="custom-roll-list">
                {#each customRolls as group (group.id)}
                  <article class="custom-roll-card">
                    <div class="custom-roll-info"><strong>{group.name}</strong><button class="remove-roll" type="button" aria-label="Eliminar grupo" on:click={() => removeCustomRoll(group.id)}>×</button></div>
                    {#each group.parts as part (part.id)}
                      <div class="roll-part">
                        <div class="roll-part-heading"><strong>{part.name}</strong><span class="roll-notation">1d{part.die}{part.bonus === 0 ? '' : (part.bonus > 0 ? '+' : '') + part.bonus}</span></div>
                        <div class="roll-actions">
                          <button type="button" on:click={() => performCustomRoll(group, part, 'normal')}>Tirar</button>
                          <button type="button" on:click={() => performCustomRoll(group, part, 'advantage')}>Ventaja</button>
                          <button type="button" on:click={() => performCustomRoll(group, part, 'disadvantage')}>Desventaja</button>
                        </div>
                      </div>
                    {/each}
                  </article>
                {/each}
              </div>
            {:else}<p class="muted">Todavía no hay tiradas guardadas.</p>{/if}
            <h3>Crear tirada</h3>
            <form class="roll-creator roll-group-creator" on:submit|preventDefault={addCustomRoll}>
              <label>Nombre del grupo<input bind:value={newRollName} placeholder="Ej. Ataque con dagas" /></label>
              {#each newRollParts as part, i (part.id)}
                <div class="new-roll-part">
                  <div class="new-roll-part-title"><strong>Tirada {i + 1}</strong>{#if newRollParts.length > 1}<button type="button" class="remove-roll" on:click={() => removeRollPart(part.id)}>×</button>{/if}</div>
                  <label>Nombre<input bind:value={part.name} placeholder="Ej. Ataque o Daño" /></label>
                  <label>Dado<select bind:value={part.die}>{#each [4,6,8,10,12,20,100] as die}<option value={die}>d{die}</option>{/each}</select></label>
                  <label>Bonificador<input type="number" bind:value={part.bonus} /></label>
                </div>
              {/each}
              <button type="button" class="add-roll-part" on:click={addRollPart}>+ Añadir otra tirada</button>
              <button class="primary" type="submit">Crear grupo</button>
            </form>
          </section>
          {#if notice}<p class="muted" role="status">{notice}</p>{/if}
        </section>
      {:else if masterTab === 'Cofres'}
        <section class="panel chest-panel">
          <div class="section-heading"><h2>Cofres</h2><span class="count">10d10 · 10–100</span></div>
          <p class="muted">Tira 10 dados de diez caras y suma los resultados. El 55 es el centro: cuanto más se acerque la suma a 10 o 100, más valioso será el botín.</p>
          <div class="chest-roll-actions"><button class="primary" on:click={rollChestLoot}>Abrir cofre · Tirar 10d10</button></div>
          {#if lastChestRoll}
            <div class="chest-result">
              <span class="chest-result-number">Resultado: {lastChestRoll.total}</span>
              <strong>{lastChestRoll.name}</strong>
              <span>{lastChestRoll.category} · {lastChestRoll.priceLabel}</span>
            </div>
          {/if}
          <div class="chest-table-wrap"><table class="chest-table"><thead><tr><th>#</th><th>Objeto</th><th>Categoría</th><th>Precio</th></tr></thead><tbody>
            {#each CHEST_LOOT as item}
              <tr class:chest-selected={lastChestRoll?.lootNumber === item.number}><td>{item.number}</td><td>{item.name}</td><td>{item.category}</td><td>{item.priceLabel}</td></tr>
            {/each}
          </tbody></table></div>
        </section>
      {:else if masterTab === 'Objetos'}
        <section class="panel items-panel">
          <div class="section-heading"><h2>Catálogo de objetos · D&D 2024</h2><span class="count">{filteredItems.length} / {ITEMS.length}</span></div>
          <p class="muted">Equipo, armas, herramientas, monturas y vehículos del Manual del jugador; objetos mágicos, armas de fuego, explosivos y equipo de asedio de la Guía del Dungeon Master. Los precios y pesos que los manuales no especifican se muestran como «—» y no se inventan.</p>
          <label class="items-search">Buscar por nombre
            <input type="search" bind:value={itemSearch} placeholder="Nombre del objeto..." />
          </label>
          <div class="items-filters">
            <label>Tipo
              <select bind:value={itemTypeFilter}>
                {#each itemTypes as type}<option value={type}>{type === 'Todos' ? 'Todos los tipos' : type}</option>{/each}
              </select>
            </label>
            <fieldset><legend>Precio (po)</legend><label>Mínimo<input type="text" inputmode="decimal" bind:value={itemPriceMin} placeholder="Sin mínimo" /></label><label>Máximo<input type="text" inputmode="decimal" bind:value={itemPriceMax} placeholder="Sin máximo" /></label></fieldset>
            <fieldset><legend>Peso (kg)</legend><label>Mínimo<input type="text" inputmode="decimal" bind:value={itemWeightMin} placeholder="Sin mínimo" /></label><label>Máximo<input type="text" inputmode="decimal" bind:value={itemWeightMax} placeholder="Sin máximo" /></label></fieldset>
          </div>
          <div class="items-table-wrap"><table class="items-table"><thead><tr><th>Nombre</th><th>Tipo</th><th>Precio</th><th>Peso</th><th>Manual</th></tr></thead><tbody>
            {#each filteredItems as item (item.name + item.source)}
              <tr><td>{item.name}</td><td>{item.type}</td><td>{item.price}</td><td>{item.weight}</td><td>{item.source}</td></tr>
            {/each}
          </tbody></table></div>
          {#if filteredItems.length === 0}<p class="muted">No hay objetos que coincidan con esos filtros. Los objetos sin precio o peso indicado no aparecen al aplicar ese filtro.</p>{/if}
        </section>
      {:else if masterTab === 'Conjuros'}
        <section class="panel spells-panel">
          <div class="section-heading"><h2>Conjuros · Manual del Jugador 2024</h2><span class="count">{filteredSpells.length} / {SPELLS.length}</span></div>
          <p class="muted">Catálogo de conjuros del manual. Cada ficha incluye nivel, escuela, clases, tiempo de lanzamiento, alcance, componentes, duración y descripción.</p>
          <label class="spell-search">Buscar conjuro
            <input type="search" bind:value={spellSearch} placeholder="Nombre o texto del conjuro..." />
          </label>
          <div class="spell-filters">
            <label>Nivel
              <select bind:value={spellLevelFilter}>
                <option value="Todos">Todos los niveles</option>
                <option value="0">Trucos · Nivel 0</option>
                {#each [1,2,3,4,5,6,7,8,9] as level}
                  <option value={String(level)}>Nivel {level}</option>
                {/each}
              </select>
            </label>
            <label>Clase
              <select bind:value={spellClassFilter}>
                <option value="Todas">Todas las clases</option>
                {#each SPELL_CLASSES as className}
                  <option value={className}>{className}</option>
                {/each}
              </select>
            </label>
            <label>Escuela
              <select bind:value={spellSchoolFilter}>
                <option value="Todas">Todas las escuelas</option>
                {#each SPELL_SCHOOLS as school}
                  <option value={school}>{school}</option>
                {/each}
              </select>
            </label>
          </div>
          <div class="spell-list">
            {#each filteredSpells as spell}
              <details class="spell-card">
                <summary>
                  <span class="spell-name">{spell.name}</span>
                  <span class="spell-level">{spell.level === 0 ? 'Truco' : 'Nivel ' + spell.level}</span>
                  <span class="spell-subtitle">{spell.school} · {spell.classes.map(name => name.charAt(0).toLocaleUpperCase('es') + name.slice(1)).join(', ')}</span>
                </summary>
                <div class="spell-details">
                  <div class="spell-meta">
                    <p><strong>Tiempo de lanzamiento:</strong> {spell.castingTime || '—'}</p>
                    <p><strong>Alcance:</strong> {spell.range || '—'}</p>
                    <p><strong>Componentes:</strong> {spell.components || '—'}</p>
                    <p><strong>Duración:</strong> {spell.duration || '—'}</p>
                    {#if spell.special.length}<p><strong>Especial:</strong> {spell.special.join(', ')}</p>{/if}
                  </div>
                  <p class="spell-description">{spell.description || 'Descripción no disponible en el texto extraído del manual.'}</p>
                  <small class="spell-source">Manual del Jugador 2024 · PDF p. {spell.pdfPage ?? '—'} · Impresa p. {spell.printedPage ?? '—'}</small>
                </div>
              </details>
            {/each}
            {#if filteredSpells.length === 0}<p class="muted">No hay conjuros que coincidan con esos filtros.</p>{/if}
          </div>
        </section>
      {:else if masterTab === 'Reglas'}
        <section class="panel rules-panel">
          <div class="section-heading"><h2>Reglas · Manual del Jugador 2024</h2><span class="count">{filteredRules.length} / {RULES.length}</span></div>
          <p class="muted">Glosario del Apéndice C. Busca términos, acciones, condiciones y definiciones reglamentarias extraídas del manual del proyecto.</p>
          <label class="rules-search">Buscar regla
            <input type="search" bind:value={rulesSearch} placeholder="Ej. agarrado, cobertura, concentración..." />
          </label>
          <label class="rules-category-filter">Tipo de regla
            <select bind:value={rulesCategoryFilter}>
              {#each RULE_CATEGORIES as category}<option value={category}>{category === 'Todas' ? 'Todas las categorías' : category}</option>{/each}
            </select>
          </label>
          <div class="rules-list">
            {#each filteredRules as rule (rule.name)}
              <details class="rule-card">
                <summary><span class="rule-name">{rule.name}</span><span class="rule-category">{rule.category}</span><span class="rule-page">PDF {rule.pdfPage}</span></summary>
                <div class="rule-details"><pre class="rule-description">{rule.description}</pre><small class="rule-source">Manual del Jugador 2024 · PDF p. {rule.pdfPage} · Impresa p. {rule.printedPage}</small></div>
              </details>
            {/each}
            {#if filteredRules.length === 0}<p class="muted">No hay reglas que coincidan con la búsqueda.</p>{/if}
          </div>
        </section>
      {:else}
        <section class="panel monsters-panel">
          <div class="section-heading"><h2>Monster Manual · 2024</h2><span class="count">{filteredMonsters.length} / {MONSTERS.length} criaturas</span></div>
          <p class="muted">Los 504 bloques de estadísticas del manual en inglés. Se conservan nombres, términos, reglas y valores originales.</p>
          <label class="monster-filter">Buscar monstruo
            <input type="search" bind:value={monsterSearch} placeholder="Nombre en inglés..." />
          </label>
          <label class="monster-filter">Filtrar por CR
            <select bind:value={monsterCrFilter}>
              {#each MONSTER_CR_FILTERS as cr}
                <option value={cr}>{cr === 'Todos' ? 'Todos los CR' : 'CR ' + cr}</option>
              {/each}
            </select>
          </label>
          <div class="monster-list">
            {#each filteredMonsters as monster}
              <details class="monster-card">
                <summary>
                  <span class="monster-name">{monster.name}</span>
                  <span class="monster-subtitle">{monster.group || 'Monster Manual'} · página {monster.pdfPage ?? '—'}</span>
                  <span class="monster-cr">CR {monster.cr.split(' ')[0] || '—'}</span>
                </summary>
                <div class="monster-statblock">
                  <pre class="monster-original">{monster.statBlock}</pre>
                  <small class="monster-source">Monster Manual 2024 · PDF p. {monster.pdfPage ?? '—'} · Printed p. {monster.printedPage ?? '—'}</small>
                </div>
              </details>
            {/each}
          </div>
        </section>
      {/if}
    {:else}
      {#if !sheet || playerCreating}
        <section class="panel import-character-panel">
          <div class="section-heading"><h2>{sheet ? 'Crear otro personaje' : 'Crear personaje'}</h2><span class="count">Nivel 1</span></div>
          <div class="import-row">
            <button class="secondary" on:click={openDemoPreview}>Ver hoja de ejemplo</button>
            <button class="secondary" on:click={() => importOpen = !importOpen}>Importar ficha JSON</button>
            {#if sheet}<button class="secondary" on:click={() => playerCreating = false}>Volver a mi ficha</button>{/if}
          </div>
          {#if importOpen}
            <div class="import-box">
              <label>Archivo JSON<input bind:this={fileInput} type="file" accept=".json,application/json" on:change={importJson} /></label>
              <div class="actions"><button class="secondary" on:click={() => importOpen = false}>Cerrar</button></div>
            </div>
          {/if}
        </section>
      
        <section class="panel builder-panel">
          <div class="section-heading"><h2>Crear personaje · Nivel 1</h2><span class="count">Paso {builderStep < 6 ? builderStep + 1 : 6} de 6</span></div>
          {#if !builderPreview || builderStep < 6}
            <div class="builder-progress"><span style="width:{(Math.min(builderStep + 1, 6) / 6) * 100}%"></span></div>
            {#if builderStep === 0}
              <h3>1. Comencemos</h3>
              <p class="muted">Te guiaremos paso a paso por la creación de tu personaje. En el siguiente paso elegirás su especie y generarás su nombre.</p>
            {:else if builderStep === 1}

              <h3>2. Especie</h3><p class="muted">Ahora elige tu especie. También seleccionarás aquí el alineamiento de tu personaje.</p>
              <label>Alineamiento<select bind:value={builderData.alignment}><option>Legal bueno</option><option>Neutral bueno</option><option>Caótico bueno</option><option>Legal neutral</option><option>Neutral</option><option>Caótico neutral</option><option>Legal malvado</option><option>Neutral malvado</option><option>Caótico malvado</option></select></label>
              <label>Especie<select bind:value={builderData.species} on:change={() => { builderData.speciesChoice = (BUILDER_SPECIES_CHOICES[builderData.species].length === 1 ? BUILDER_SPECIES_CHOICES[builderData.species][0] : ''); builderData.speciesSkill = ''; builderData.speciesMagicAbility = ''; builderData.speciesSize = (['Aasimar','Humano','Tiefling'].includes(builderData.species) ? 'Mediano' : ''); builderData.speciesBreathShape = 'Cono'; builderData.speciesFeatChoices = []; builderData.speciesMagicCantrips = []; builderData.speciesMagicSpell = ''; }}>{#each BUILDER_SPECIES as item}<option>{item}</option>{/each}</select></label>
              <div class="name-generator-panel">
                <div class="name-generator-heading"><strong>Generador de nombres</strong><span>Listas originales por especie</span></div>
                <div class="name-generator-controls">
                  <p class="hint">Especie elegida: <strong>{builderData.species}</strong></p>
                  <label>Sexo<select bind:value={nameGender}><option value="Hombre">Hombre</option><option value="Mujer">Mujer</option><option value="Otro">Otro</option></select></label>
                </div>
                <button class="secondary name-generator-button" type="button" on:click={generateCharacterName}>⚄ Generar nombre</button>
                {#if lastGeneratedName}<p class="generated-name-note">Nombre del personaje: <strong>{lastGeneratedName}</strong></p>{:else}<p class="hint">Genera un nombre para tu personaje antes de continuar.</p>{/if}
                <p class="hint">Nombres originales inspirados en cada especie; no son una lista oficial del manual.</p>
              </div>
              {#if BUILDER_SPECIES_CHOICES[builderData.species].length > 0}
                <label>{builderData.species === 'Dracónido' ? 'Linaje dracónico' : builderData.species === 'Elfo' ? 'Linaje élfico' : builderData.species === 'Gnomo' ? 'Linaje gnomo' : builderData.species === 'Goliat' ? 'Linaje gigante' : 'Legado infernal'}<select bind:value={builderData.speciesChoice}><option value="">Elige una opción</option>{#each BUILDER_SPECIES_CHOICES[builderData.species] as choice}<option>{choice}</option>{/each}</select></label>
              {/if}
              {#if ['Aasimar','Humano','Tiefling'].includes(builderData.species)}
                <label>Tamaño<select bind:value={builderData.speciesSize}><option value="">Elige el tamaño</option><option>Mediano</option><option>Pequeño</option></select></label>
              {/if}
              {#if ['Elfo','Gnomo','Tiefling'].includes(builderData.species)}
                <label>Aptitud mágica de linaje<select bind:value={builderData.speciesMagicAbility}><option value="">Elige la característica</option><option>Inteligencia</option><option>Sabiduría</option><option>Carisma</option></select></label>
              {/if}
               {#if builderData.species === 'Elfo'}
                <label>Competencia adicional del elfo<select bind:value={builderData.speciesSkill}><option value="">Elige una habilidad</option><option>Percepción</option><option>Perspicacia</option><option>Supervivencia</option></select></label>
              {/if}
              {#if builderData.species === 'Humano'}
                <label>Habilidad adicional humana<select bind:value={builderData.speciesSkill}><option value="">Elige una habilidad</option>{#each ['Acrobacias','Atletismo','Conocimiento arcano','Engaño','Historia','Interpretación','Intimidación','Investigación','Juego de manos','Medicina','Naturaleza','Perspicacia','Persuasión','Percepción','Religión','Sigilo','Supervivencia','Trato con animales'] as skill}<option>{skill}</option>{/each}</select></label>
                <label>Dote de origen adicional humana<select bind:value={builderData.speciesExtraFeat} on:change={() => { builderData.speciesFeatChoices = []; builderData.speciesMagicCantrips = []; builderData.speciesMagicSpell = ''; }}>{#each BUILDER_FEATS.filter(feat => feat !== BUILDER_BACKGROUND_DATA[builderData.background].feat) as feat}<option>{feat}</option>{/each}</select></label>
                {#if ['Habilidoso','Fabricante','Músico'].includes(builderData.speciesExtraFeat)}
                  <div class="builder-choice-wrapper"><strong>Elecciones de la dote adicional</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Opciones de la dote adicional humana</strong><span>{builderData.speciesFeatChoices.length}/{3}</span></div><div class="builder-checkbox-grid">{#each builderFeatChoiceOptions(builderData.speciesExtraFeat).filter(choice => !BUILDER_BACKGROUND_DATA[builderData.background].skills.includes(choice) && choice !== builderData.speciesSkill && choice !== builderData.backgroundToolChoice && !builderData.backgroundFeatChoices.includes(choice)) as choice}<label class="builder-checkbox"><input type="checkbox" checked={builderData.speciesFeatChoices.includes(choice)} on:change={(event) => builderToggleChoice('speciesFeatChoices',choice,3,event)} disabled={!builderData.speciesFeatChoices.includes(choice) && builderData.speciesFeatChoices.length >= (3)} /><span>{choice}</span></label>{/each}</div></div></div>
                {:else if builderMagicInitiateClass(builderData.speciesExtraFeat)}
                  <label>Aptitud mágica de la dote adicional<select bind:value={builderData.speciesFeatMagicAbility}><option>Inteligencia</option><option>Sabiduría</option><option>Carisma</option></select></label>
                  <div class="builder-choice-wrapper"><strong>Dos trucos de la dote adicional</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Trucos de la dote adicional humana</strong><span>{builderData.speciesMagicCantrips.length}/{2}</span></div><div class="builder-checkbox-grid">{#each BUILDER_SPELL_LISTS[builderMagicInitiateClass(builderData.speciesExtraFeat)].cantrips as spell}<label class="builder-checkbox"><input type="checkbox" checked={builderData.speciesMagicCantrips.includes(spell)} on:change={(event) => builderToggleChoice('speciesMagicCantrips',spell,2,event)} disabled={!builderData.speciesMagicCantrips.includes(spell) && builderData.speciesMagicCantrips.length >= (2)} /><span>{spell}</span></label>{/each}</div></div></div>
                  <label>Un conjuro de nivel 1 de la dote adicional<select bind:value={builderData.speciesMagicSpell}><option value="">Elige un conjuro</option>{#each BUILDER_SPELL_LISTS[builderMagicInitiateClass(builderData.speciesExtraFeat)].level1 as spell}<option>{spell}</option>{/each}</select></label>
                {/if}
              {/if}
              <div class="builder-info"><strong>Rasgos automáticos de especie</strong><p>{BUILDER_SPECIES_TRAITS[builderData.species]}</p>{#if builderData.speciesChoice}<p>Elección: {builderData.speciesChoice}</p>{/if}</div>
                        {:else if builderStep === 2}

              <h3>3. Trasfondo</h3><p class="muted">El trasfondo determina competencias, equipo y una dote de origen.</p>
              <label>Trasfondo<select bind:value={builderData.background} on:change={() => { builderData.classSkillChoices = []; builderData.backgroundToolChoice = (BUILDER_BACKGROUND_TOOL_OPTIONS[builderData.background]?.length === 1 ? BUILDER_BACKGROUND_TOOL_OPTIONS[builderData.background][0] : ''); builderData.backgroundFeatChoices = []; builderData.backgroundMagicCantrips = []; builderData.backgroundMagicSpell = ''; builderData.feat = BUILDER_BACKGROUND_DATA[builderData.background].feat; builderData.abilityIncrease2 = BUILDER_BACKGROUND_DATA[builderData.background].abilities[0]; builderData.abilityIncrease1 = BUILDER_BACKGROUND_DATA[builderData.background].abilities[1]; builderData.abilityIncrease3 = BUILDER_BACKGROUND_DATA[builderData.background].abilities[2]; }}>{#each BUILDER_BACKGROUNDS as item}<option>{item}</option>{/each}</select></label>
              {#if ['Habilidoso','Fabricante','Músico'].includes(BUILDER_BACKGROUND_DATA[builderData.background].feat)}
                <div class="builder-choice-wrapper"><strong>Elecciones de la dote {BUILDER_BACKGROUND_DATA[builderData.background].feat}</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Opciones de la dote del trasfondo</strong><span>{builderData.backgroundFeatChoices.length}/{3}</span></div><div class="builder-checkbox-grid">{#each builderFeatChoiceOptions(BUILDER_BACKGROUND_DATA[builderData.background].feat).filter(choice => !BUILDER_BACKGROUND_DATA[builderData.background].skills.includes(choice) && choice !== builderData.speciesSkill && choice !== builderData.backgroundToolChoice) as choice}<label class="builder-checkbox"><input type="checkbox" checked={builderData.backgroundFeatChoices.includes(choice)} on:change={(event) => builderToggleChoice('backgroundFeatChoices',choice,3,event)} disabled={!builderData.backgroundFeatChoices.includes(choice) && builderData.backgroundFeatChoices.length >= (3)} /><span>{choice}</span></label>{/each}</div></div></div>
              {:else if builderMagicInitiateClass(BUILDER_BACKGROUND_DATA[builderData.background].feat)}
                <p class="muted">Lista de Iniciado en la magia: {builderMagicInitiateClass(BUILDER_BACKGROUND_DATA[builderData.background].feat)}</p>
                <label>Aptitud mágica de la dote<select bind:value={builderData.backgroundMagicAbility}><option>Inteligencia</option><option>Sabiduría</option><option>Carisma</option></select></label>
                <div class="builder-choice-wrapper"><strong>Dos trucos de la dote</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Trucos de Iniciado en la magia</strong><span>{builderData.backgroundMagicCantrips.length}/{2}</span></div><div class="builder-checkbox-grid">{#each BUILDER_SPELL_LISTS[builderMagicInitiateClass(BUILDER_BACKGROUND_DATA[builderData.background].feat)].cantrips as spell}<label class="builder-checkbox"><input type="checkbox" checked={builderData.backgroundMagicCantrips.includes(spell)} on:change={(event) => builderToggleChoice('backgroundMagicCantrips',spell,2,event)} disabled={!builderData.backgroundMagicCantrips.includes(spell) && builderData.backgroundMagicCantrips.length >= (2)} /><span>{spell}</span></label>{/each}</div></div></div>
                <label>Un conjuro de nivel 1 de la dote<select bind:value={builderData.backgroundMagicSpell}><option value="">Elige un conjuro</option>{#each BUILDER_SPELL_LISTS[builderMagicInitiateClass(BUILDER_BACKGROUND_DATA[builderData.background].feat)].level1 as spell}<option>{spell}</option>{/each}</select></label>
              {/if}
              <div class="builder-info"><strong>Beneficios automáticos del trasfondo</strong><p>Características: {BUILDER_BACKGROUND_DATA[builderData.background].abilities.join(', ')}</p><p>Dote: {BUILDER_BACKGROUND_DATA[builderData.background].feat}</p><p>Habilidades: {BUILDER_BACKGROUND_DATA[builderData.background].skills.join(' y ')}</p><p>Herramienta: {BUILDER_BACKGROUND_DATA[builderData.background].tool}</p><p>Equipo A: {BUILDER_BACKGROUND_DATA[builderData.background].equipmentA}</p></div>
              {#if BUILDER_BACKGROUND_TOOL_OPTIONS[builderData.background]}
                <label>Competencia con herramienta del trasfondo<select bind:value={builderData.backgroundToolChoice}><option value="">Elige una opción</option>{#each BUILDER_BACKGROUND_TOOL_OPTIONS[builderData.background] as tool}<option>{tool}</option>{/each}</select></label>
              {/if}
              <h4>Distribución de los aumentos de característica</h4>
              <p class="muted">El manual permite aumentar una de las tres características del trasfondo en 2 y otra distinta en 1, o aumentar las tres en 1. No se puede superar 20.</p>
              <label>Distribución<select bind:value={builderData.abilityIncreaseMode}><option value="two">+2 a una característica y +1 a otra distinta</option><option value="three">+1 a cada una de las tres características</option></select></label>
              {#if builderData.abilityIncreaseMode === 'two'}
                <label>Característica que recibe +2<select bind:value={builderData.abilityIncrease2}>{#each BUILDER_BACKGROUND_DATA[builderData.background].abilities as ability}<option>{ability}</option>{/each}</select></label>
                <label>Característica distinta que recibe +1<select bind:value={builderData.abilityIncrease1}>{#each BUILDER_BACKGROUND_DATA[builderData.background].abilities.filter(a => a !== builderData.abilityIncrease2) as ability}<option>{ability}</option>{/each}</select></label>
              {:else}
                <p>{BUILDER_BACKGROUND_DATA[builderData.background].abilities.join(', ')} reciben +1 cada una.</p>
              {/if}
              <div class="builder-info"><strong>Equipo del trasfondo</strong><p><b>A — Equipo:</b> {BUILDER_BACKGROUND_DATA[builderData.background].equipmentA}</p><p><b>B — Oro:</b> 50 po en monedas; no recibes los objetos del paquete A.</p></div>
              <div class="builder-choice-wrapper"><strong>Elige una opción de equipo del trasfondo</strong><label class="builder-checkbox"><input type="radio" name="background-equipment" value="A" bind:group={builderData.backgroundEquipment} /><span><b>A — Equipo completo:</b> {BUILDER_BACKGROUND_DATA[builderData.background].equipmentA}</span></label><label class="builder-checkbox"><input type="radio" name="background-equipment" value="B" bind:group={builderData.backgroundEquipment} /><span><b>B — Oro:</b> 50 po; no recibes ninguno de los objetos del equipo A.</span></label></div>
              <div class="builder-info"><small>Los aumentos se aplican automáticamente a las puntuaciones base y quedan reflejados en la ficha final.</small></div>
                        {:else if builderStep === 3}

              <h3>4. Clase y competencias</h3><p class="muted">Todas las clases del Manual del Jugador 2024. Se aplican únicamente los rasgos que se obtienen a nivel 1.</p>
              <label>¿Qué clase tendrá el personaje?<select bind:value={builderData.className} on:change={() => { builderData.classSkillChoices = []; builderData.classToolsChoices = []; builderData.classSpecialChoice = (BUILDER_CLASS_DATA[builderData.className].specialOptions.length === 1 ? BUILDER_CLASS_DATA[builderData.className].specialOptions[0] : ''); builderData.warlockTomeCantrips = []; builderData.warlockTomeRituals = []; builderData.classExpertise = []; builderData.weaponMasteries = []; builderData.selectedCantrips = []; builderData.selectedSpells = []; builderData.wizardSpellbook = []; builderData.classEquipmentChoice = 'A'; }}>{#each BUILDER_CLASSES as item}<option>{item}</option>{/each}</select></label>
              <div class="builder-info"><strong>Rasgos de nivel 1 identificados</strong><p>{BUILDER_CLASS_FEATURES[builderData.className]}</p><small>La subclase no se elige a nivel 1. Salvaciones: {BUILDER_SAVES[builderData.className]}. Dado de golpe: d{BUILDER_HIT_DIE[builderData.className]}.</small></div>
                          <h3>Competencias, rasgos, conjuros y equipo</h3>
              <p class="muted">Completa las elecciones que dependen de la clase y del trasfondo. Puedes consultar los detalles antes de generar la ficha.</p>
              <div class="builder-info"><strong>Habilidades automáticas del trasfondo</strong><p>{BUILDER_BACKGROUND_DATA[builderData.background].skills.join(' y ')}</p><strong>Elige {BUILDER_CLASS_SKILLS[builderData.className].count} competencias de clase</strong></div>
              <div class="builder-choice-wrapper"><strong>Competencias de clase: elige {BUILDER_CLASS_SKILLS[builderData.className].count} habilidades</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Habilidades disponibles</strong><span>{builderData.classSkillChoices.filter(Boolean).length}/{BUILDER_CLASS_SKILLS[builderData.className].count}</span></div><div class="builder-checkbox-grid">{#each BUILDER_CLASS_SKILLS[builderData.className].options.filter(skill => !BUILDER_BACKGROUND_DATA[builderData.background].skills.includes(skill) && skill !== builderData.speciesSkill && ![...builderData.backgroundFeatChoices,...builderData.speciesFeatChoices].includes(skill)) as skill}<label class="builder-checkbox"><input type="checkbox" checked={builderData.classSkillChoices.includes(skill)} on:change={(event) => builderToggleChoice('classSkillChoices',skill,BUILDER_CLASS_SKILLS[builderData.className].count,event)} disabled={!builderData.classSkillChoices.includes(skill) && builderData.classSkillChoices.filter(Boolean).length >= BUILDER_CLASS_SKILLS[builderData.className].count} /><span>{skill}</span></label>{/each}</div></div></div>
              
              
              <div class="builder-info"><strong>Rasgos automáticos de {builderData.className}</strong><p>{BUILDER_CLASS_DATA[builderData.className].features}</p><p><strong>Competencias de herramientas:</strong> {BUILDER_CLASS_DATA[builderData.className].tool}</p></div>
              {#if BUILDER_CLASS_DATA[builderData.className].specialOptions.length > 0}
                <label>{BUILDER_CLASS_DATA[builderData.className].specialLabel}<select bind:value={builderData.classSpecialChoice}><option value="">Elige una opción</option>{#each BUILDER_CLASS_DATA[builderData.className].specialOptions as option}<option>{option}</option>{/each}</select></label>
              {/if}
              {#if builderData.className === 'Pícaro'}
                <div class="builder-choice-wrapper"><strong>Pericia: elige 2 habilidades en las que ya seas competente</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Pericias</strong><span>{builderData.classExpertise.length}/{2}</span></div><div class="builder-checkbox-grid">{#each [...BUILDER_BACKGROUND_DATA[builderData.background].skills,...builderData.classSkillChoices.filter(Boolean),builderData.speciesSkill,...builderData.backgroundFeatChoices.filter(choice => BUILDER_SKILL_OPTIONS.includes(choice)),...builderData.speciesFeatChoices.filter(choice => BUILDER_SKILL_OPTIONS.includes(choice))].filter(Boolean) as skill}<label class="builder-checkbox"><input type="checkbox" checked={builderData.classExpertise.includes(skill)} on:change={(event) => builderToggleChoice('classExpertise',skill,2,event)} disabled={!builderData.classExpertise.includes(skill) && builderData.classExpertise.length >= (2)} /><span>{skill}</span></label>{/each}</div></div></div>
              {/if}
              {#if BUILDER_CLASS_DATA[builderData.className].weaponCount > 0}
                <div class="builder-choice-wrapper"><strong>Maestrías con armas ({BUILDER_CLASS_DATA[builderData.className].weaponCount})</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Maestrías con armas</strong><span>{builderData.weaponMasteries.length}/{BUILDER_CLASS_DATA[builderData.className].weaponCount}</span></div><div class="builder-checkbox-grid">{#each BUILDER_WEAPON_MASTERY_OPTIONS.filter(weapon => builderData.className !== 'Bárbaro' || !['Arco corto','Ballesta ligera','Dardo','Honda','Arco largo','Ballesta de mano','Ballesta pesada','Cerbatana','Mosquete','Pistola'].includes(weapon)).filter(weapon => builderData.className !== 'Pícaro' || ['Bastón','Daga','Garrote','Garrote grande','Hacha de mano','Hoz','Jabalina','Lanza','Martillo ligero','Maza','Arco corto','Ballesta ligera','Dardo','Honda','Cimitarra','Espada corta','Estoque','Látigo','Ballesta de mano'].includes(weapon)) as weapon}<label class="builder-checkbox"><input type="checkbox" checked={builderData.weaponMasteries.includes(weapon)} on:change={(event) => builderToggleChoice('weaponMasteries',weapon,BUILDER_CLASS_DATA[builderData.className].weaponCount,event)} disabled={!builderData.weaponMasteries.includes(weapon) && builderData.weaponMasteries.length >= (BUILDER_CLASS_DATA[builderData.className].weaponCount)} /><span>{weapon}</span></label>{/each}</div></div></div>
                <small class="muted">Selecciona los tipos de arma indicados por tu clase. Las opciones se guardan en la ficha.</small>
              {/if}
              {#if builderData.className === 'Bardo'}
                <div class="builder-choice-wrapper"><strong>Instrumentos musicales competentes</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Competencias con herramientas</strong><span>{builderData.classToolsChoices.length}/3</span></div><div class="builder-checkbox-grid">{#each BUILDER_MUSICAL_INSTRUMENTS.filter(tool => !builderData.backgroundFeatChoices.includes(tool) && !builderData.speciesFeatChoices.includes(tool) && tool !== builderData.backgroundToolChoice) as tool}<label class="builder-checkbox"><input type="checkbox" checked={builderData.classToolsChoices.includes(tool)} on:change={(event) => builderToggleChoice('classToolsChoices',tool,3,event)} disabled={!builderData.classToolsChoices.includes(tool) && builderData.classToolsChoices.length >= 3} /><span>{tool}</span></label>{/each}</div></div></div>
              {:else if builderData.className === 'Monje'}
                <div class="builder-choice-wrapper"><strong>Competencia con herramientas</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Competencias con herramientas</strong><span>{builderData.classToolsChoices.length}/{1}</span></div><div class="builder-checkbox-grid">{#each [...BUILDER_ARTISAN_TOOLS,...BUILDER_MUSICAL_INSTRUMENTS].filter(tool => !builderData.backgroundFeatChoices.includes(tool) && !builderData.speciesFeatChoices.includes(tool) && tool !== builderData.backgroundToolChoice) as tool}<label class="builder-checkbox"><input type="checkbox" checked={builderData.classToolsChoices.includes(tool)} on:change={(event) => builderToggleChoice('classToolsChoices',tool,1,event)} disabled={!builderData.classToolsChoices.includes(tool) && builderData.classToolsChoices.length >= (1)} /><span>{tool}</span></label>{/each}</div></div></div>
              {/if}
              
              <div class="builder-info"><strong>Opciones de equipo inicial de {builderData.className}</strong><p><b>A — Equipo:</b> {BUILDER_CLASS_DATA[builderData.className].equipmentA}</p><p><b>B — {builderData.className === 'Guerrero' ? 'Equipo alternativo' : 'Oro'}:</b> {BUILDER_CLASS_DATA[builderData.className].equipmentB}{builderData.className === 'Guerrero' ? '' : '; recibes monedas en lugar del equipo A'}.</p>{#if builderData.className === 'Guerrero'}<p><b>C — Oro:</b> 155 po; no recibes los objetos de A ni B.</p>{/if}</div>
              <div class="builder-choice-wrapper"><strong>Elige una opción de equipo de clase</strong><label class="builder-checkbox"><input type="radio" name="class-equipment" value="A" bind:group={builderData.classEquipmentChoice} /><span><b>A — Equipo inicial:</b> {BUILDER_CLASS_DATA[builderData.className].equipmentA}</span></label><label class="builder-checkbox"><input type="radio" name="class-equipment" value="B" bind:group={builderData.classEquipmentChoice} /><span><b>B — {builderData.className === 'Guerrero' ? 'Equipo alternativo' : 'Oro'}:</b> {BUILDER_CLASS_DATA[builderData.className].equipmentB}{builderData.className === 'Guerrero' ? '' : '; recibes estas monedas en lugar de los objetos del equipo A'}.</span></label>{#if builderData.className === 'Guerrero'}<label class="builder-checkbox"><input type="radio" name="class-equipment" value="C" bind:group={builderData.classEquipmentChoice} /><span><b>C — Oro:</b> 155 po; no recibes los objetos de A ni B.</span></label>{/if}</div>
              {#if builderData.className === 'Brujo' && builderData.classSpecialChoice === 'Pacto del grimorio'}
                <div class="builder-info"><strong>Pacto del grimorio</strong><p>Elige tres trucos y dos conjuros de nivel 1 con la etiqueta de ritual. Estos se añaden a los beneficios de tu invocación.</p></div>
                <div class="builder-choice-wrapper"><strong>Trucos del grimorio</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Trucos del grimorio</strong><span>{builderData.warlockTomeCantrips.length}/{3}</span></div><div class="builder-checkbox-grid">{#each BUILDER_TOME_CANTRIPS.filter(spell => !builderData.selectedCantrips.includes(spell)) as spell}<label class="builder-checkbox"><input type="checkbox" checked={builderData.warlockTomeCantrips.includes(spell)} on:change={(event) => builderToggleChoice('warlockTomeCantrips',spell,3,event)} disabled={!builderData.warlockTomeCantrips.includes(spell) && builderData.warlockTomeCantrips.length >= (3)} /><span>{spell}</span></label>{/each}</div></div></div>
                <div class="builder-choice-wrapper"><strong>Conjuros rituales de nivel 1</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Conjuros rituales del grimorio</strong><span>{builderData.warlockTomeRituals.length}/{2}</span></div><div class="builder-checkbox-grid">{#each BUILDER_TOME_RITUALS.filter(spell => !builderData.selectedSpells.includes(spell)) as spell}<label class="builder-checkbox"><input type="checkbox" checked={builderData.warlockTomeRituals.includes(spell)} on:change={(event) => builderToggleChoice('warlockTomeRituals',spell,2,event)} disabled={!builderData.warlockTomeRituals.includes(spell) && builderData.warlockTomeRituals.length >= (2)} /><span>{spell}</span></label>{/each}</div></div></div>
              {/if}
              {#if BUILDER_CLASS_DATA[builderData.className].cantrips > 0}
                <div class="builder-choice-wrapper"><strong>Trucos ({builderData.selectedCantrips.length}/{BUILDER_CLASS_DATA[builderData.className].cantrips + ((builderData.className === 'Clérigo' && builderData.classSpecialChoice === 'Taumaturgo') || (builderData.className === 'Druida' && builderData.classSpecialChoice === 'Naturalista') ? 1 : 0)})</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Trucos de clase</strong><span>{builderData.selectedCantrips.length}/{BUILDER_CLASS_DATA[builderData.className].cantrips + (((builderData.className === 'Clérigo' && builderData.classSpecialChoice === 'Taumaturgo') || (builderData.className === 'Druida' && builderData.classSpecialChoice === 'Naturalista')) ? 1 : 0)}</span></div><div class="builder-checkbox-grid">{#each BUILDER_SPELL_LISTS[builderData.className].cantrips as spell}<label class="builder-checkbox"><input type="checkbox" checked={builderData.selectedCantrips.includes(spell)} on:change={(event) => builderToggleChoice('selectedCantrips',spell,BUILDER_CLASS_DATA[builderData.className].cantrips + (((builderData.className === 'Clérigo' && builderData.classSpecialChoice === 'Taumaturgo') || (builderData.className === 'Druida' && builderData.classSpecialChoice === 'Naturalista')) ? 1 : 0),event)} disabled={!builderData.selectedCantrips.includes(spell) && builderData.selectedCantrips.length >= (BUILDER_CLASS_DATA[builderData.className].cantrips + (((builderData.className === 'Clérigo' && builderData.classSpecialChoice === 'Taumaturgo') || (builderData.className === 'Druida' && builderData.classSpecialChoice === 'Naturalista')) ? 1 : 0))} /><span>{spell}</span></label>{/each}</div></div></div>
              {/if}
              {#if BUILDER_CLASS_DATA[builderData.className].spells > 0}
                {#if builderData.className === 'Mago'}
                  <div class="builder-choice-wrapper"><strong>Libro de conjuros: elige 6 conjuros de nivel 1</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Libro de conjuros</strong><span>{builderData.wizardSpellbook.length}/{6}</span></div><div class="builder-checkbox-grid">{#each BUILDER_SPELL_LISTS.Mago.level1 as spell}<label class="builder-checkbox"><input type="checkbox" checked={builderData.wizardSpellbook.includes(spell)} on:change={(event) => builderToggleChoice('wizardSpellbook',spell,6,event)} disabled={!builderData.wizardSpellbook.includes(spell) && builderData.wizardSpellbook.length >= (6)} /><span>{spell}</span></label>{/each}</div></div></div>
                  <div class="builder-choice-wrapper"><strong>Conjuros preparados</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Conjuros de nivel 1 preparados</strong><span>{builderData.selectedSpells.length}/{builderData.className === 'Mago' ? 4 : BUILDER_CLASS_DATA[builderData.className].spells}</span></div><div class="builder-checkbox-grid">{#each builderData.wizardSpellbook as spell}<label class="builder-checkbox"><input type="checkbox" checked={builderData.selectedSpells.includes(spell)} on:change={(event) => builderToggleChoice('selectedSpells',spell,builderData.className === 'Mago' ? 4 : BUILDER_CLASS_DATA[builderData.className].spells,event)} disabled={!builderData.selectedSpells.includes(spell) && builderData.selectedSpells.length >= (builderData.className === 'Mago' ? 4 : BUILDER_CLASS_DATA[builderData.className].spells)} /><span>{spell}</span></label>{/each}</div></div></div>
                {:else}
                  <div class="builder-choice-wrapper"><strong>Conjuros de nivel 1 preparados ({builderData.selectedSpells.length}/{BUILDER_CLASS_DATA[builderData.className].spells})</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Conjuros de nivel 1 preparados</strong><span>{builderData.selectedSpells.length}/{builderData.className === 'Mago' ? 4 : BUILDER_CLASS_DATA[builderData.className].spells}</span></div><div class="builder-checkbox-grid">{#each BUILDER_SPELL_LISTS[builderData.className].level1 as spell}<label class="builder-checkbox"><input type="checkbox" checked={builderData.selectedSpells.includes(spell)} on:change={(event) => builderToggleChoice('selectedSpells',spell,builderData.className === 'Mago' ? 4 : BUILDER_CLASS_DATA[builderData.className].spells,event)} disabled={!builderData.selectedSpells.includes(spell) && builderData.selectedSpells.length >= (builderData.className === 'Mago' ? 4 : BUILDER_CLASS_DATA[builderData.className].spells)} /><span>{spell}</span></label>{/each}</div></div></div>
                {/if}
              {/if}
            {:else if builderStep === 4}

              <h3>5. Puntuaciones de característica</h3>
              <p class="muted">Elige uno de los métodos del manual. Los aumentos de característica del trasfondo se aplican después y se muestran en el resultado.</p>
              <label>Método para determinar las puntuaciones<select bind:value={builderData.method} on:change={builderSetAbilityMethod}><option value="standard">Arreglo estándar (15, 14, 13, 12, 10, 8)</option><option value="pointBuy">Compra de puntos (27 puntos)</option><option value="rolled">Tirada (4d6, descartar el menor)</option><option value="free">Creación libre (valores personalizados)</option></select></label>
              {#if builderData.method === 'rolled'}
                <button type="button" class="secondary" on:click={builderRollScores}>Volver a tirar las seis puntuaciones</button>
                <p class="hint">Resultados obtenidos: {builderRolledScores.length ? builderRolledScores.join(', ') : 'Pulsa el botón para tirar.'} Distribúyelos entre las características.</p>
              {/if}
              {#each BUILDER_ABILITY_NAMES as ability}
                <label>{ability}<input type="number" min={builderData.method === 'pointBuy' ? 8 : builderData.method === 'free' ? 1 : 3} max={builderData.method === 'pointBuy' ? 15 : builderData.method === 'free' ? 20 : 18} step="1" bind:value={builderData.abilities[ability]} /><small class="muted">Modificador: {builderModifier(Number(builderData.abilities[ability]) || 10) >= 0 ? '+' : ''}{builderModifier(Number(builderData.abilities[ability]) || 10)}</small></label>
              {/each}
              {#if builderData.method === 'pointBuy'}
                <p class="hint">Puntos utilizados: <strong>{builderPointCost()} / 27</strong>. Cada puntuación debe estar entre 8 y 15.</p>
              {:else if builderData.method === 'standard'}
                <p class="hint">Distribuye cada valor del arreglo estándar una sola vez: 15, 14, 13, 12, 10 y 8.</p>
              {:else if builderData.method === 'rolled'}
                <p class="hint">Debes asignar exactamente los seis resultados obtenidos, sin modificarlos.</p>
              {:else}
                <p class="hint">Asigna manualmente cualquier puntuación entre 1 y 20. Este método no aplica límites de arreglo estándar ni compra de puntos.</p>
              {/if}
              <div class="builder-info"><strong>Resultado con los aumentos del trasfondo</strong>{#each BUILDER_ABILITY_NAMES as ability}<p>{ability}: {builderData.abilities[ability]} → {builderAdjustedAbilities()[ability]}</p>{/each}</div>
                        {:else if builderStep === 5}
              <h3>6. Idiomas y ajustes finales</h3>
              <p class="muted">Elige los dos idiomas adicionales del personaje y revisa cualquier detalle que no haya quedado registrado en las opciones anteriores.</p>
              <div class="builder-choice-wrapper"><strong>Dos idiomas adicionales (además del común)</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Idiomas adicionales</strong><span>{builderData.languages.length}/{2}</span></div><div class="builder-checkbox-grid">{#each BUILDER_STANDARD_LANGUAGES as language}<label class="builder-checkbox"><input type="checkbox" checked={builderData.languages.includes(language)} on:change={(event) => builderToggleChoice('languages',language,2,event)} disabled={!builderData.languages.includes(language) && builderData.languages.length >= (2)} /><span>{language}</span></label>{/each}</div></div></div>
              {#if builderData.className === 'Pícaro'}
                <label>Idioma adicional de pícaro ({builderData.rogueLanguage ? 1 : 0}/1)<select bind:value={builderData.rogueLanguage}><option value="">Elige un idioma</option>{#each BUILDER_LANGUAGES.filter(language => !builderData.languages.includes(language) && language !== 'Jerga de ladrones') as language}<option>{language}</option>{/each}</select></label>
              {/if}
              <div class="builder-info"><strong>Resumen de equipo elegido</strong><p>Trasfondo: {builderData.backgroundEquipment === 'A' ? BUILDER_BACKGROUND_DATA[builderData.background].equipmentA : '50 po en monedas'}</p><p>Clase: {builderData.classEquipmentChoice === 'A' ? BUILDER_CLASS_DATA[builderData.className].equipmentA : builderData.classEquipmentChoice === 'C' ? '155 po en monedas' : builderData.className === 'Guerrero' ? BUILDER_CLASS_DATA[builderData.className].equipmentB : BUILDER_CLASS_DATA[builderData.className].equipmentB + ' en monedas'}</p></div>

            {/if}
            
{#if builderStepError}<p class="builder-step-error" role="alert">{builderStepError}</p>{/if}
            <div class="builder-actions">
              {#if builderStep > 0}<button class="secondary" on:click={builderBack}>Anterior</button>{/if}
              {#if builderStep < 5}<button class="primary" on:click={builderNext}>Siguiente</button>{:else}<button type="button" class="primary" on:click={finishBuilder}>Generar ficha de nivel 1</button>{/if}
            </div>
          {:else}
            <div class="section-heading"><h3>Personaje generado</h3><span class="count">Nivel 1</span></div>
            <article class="character-sheet">
              <header class="sheet-banner">
                <div class="sheet-banner-copy"><span class="sheet-kicker">FORJA DE AVENTUREROS · D&D 2024</span><h1 class="character-name">{builderPreview.name || 'Personaje'}</h1><span class="sheet-subtitle">Hoja de aventurero</span></div>
                <div class="sheet-banner-emblem" aria-hidden="true">✦</div>
              </header>
              <nav class="sheet-tabs builder-preview-tabs" aria-label="Secciones de la ficha de vista previa">
                {#each builderPreviewTabs as tab}<button type="button" class:active={builderPreviewTab===tab} on:click={() => builderPreviewTab=tab}>{tab}</button>{/each}
              </nav>
              <div class="sheet-grid">
                {#each visiblePairs(builderPreview.sections || [], builderPreviewTab) as pair}
                  <section class="sheet-section {sectionClass(pair.heading.name)}">
                    <div class="sheet-section-title"><h3>{pair.heading.name || ''}</h3></div>
                    <div class="stats-list">
                      {#each pair.heading.stats || [] as stat, i}
                        <div class="sheet-stat">
                          <span class="stat-label">{stat.name || ''}</span>
                          <div class="stat-value sheet-readonly-value">{#each rollableParts(displayValue(pair.values?.stats?.[i]?.value) || displayValue(stat.value)) as part, partIndex}
                            {#if part.rollable}<button type="button" class="inline-roll" title="Tirar {part.notation} en Dice+" on:click={() => sendSheetRoll(part.notation, String(stat.name || pair.heading.name || 'Tirada'))}>{part.text}</button>{:else}<span>{part.text}</span>{/if}
                          {/each}</div>
                        </div>
                      {/each}
                    </div>
                  </section>
                {/each}
                {#if continuousSheetPairs(builderPreview.sections || []).length === 0}
                  <p class="muted">No hay información en esta sección para el personaje.</p>
                {/if}
              </div>
            </article>
            <div class="builder-actions">
              <button class="secondary" on:click={() => { builderPreview = null; builderStep = 5; }}>Volver a editar</button>
              <button type="button" class="primary" disabled={builderSaving} on:click={saveBuilderCharacter}>{builderSaving ? 'Guardando…' : 'Guardar personaje en mi ficha'}</button>
              <button class="secondary" on:click={downloadBuilderSheet}>Exportar ficha JSON</button>
              <button class="secondary" on:click={startBuilder}>Crear otro personaje</button>
            </div>
          {/if}
        </section>

      {/if}
      {#if sheet && !playerCreating}
        <section class="panel player-character-actions">
          {#if demoPreview}
            <p class="muted"><strong>Vista de ejemplo.</strong> Este personaje es ficticio y no se guarda ni modifica tu ficha.</p>
            <button class="secondary" on:click={closeDemoPreview}>Volver al inicio</button>
            <button class="primary" on:click={startBuilder}>Crear mi personaje</button>
          {:else}
            <button class="secondary" on:click={startBuilder}>Crear personaje nuevo</button>
          {/if}
        </section>
      {/if}
      {#if sheet && !playerCreating}
        <article class="character-sheet nautical-sheet">
          <header class="sheet-banner ddb-character-header nautical-header">
            <div class="portrait-frame" aria-hidden="true"><span>✦</span></div>
            <div class="sheet-banner-copy">
              <span class="sheet-kicker">D&D · 2024</span>
              <h1 class="character-name">{sheet.name || 'Personaje'}</h1>
              <div class="sheet-banner-meta">
                <span>{sheetClassName(sheet) || 'Clase sin definir'} · Nivel {sheetLevel(sheet)}</span>
                <span>{sheetValueByNames(sheet, ['Especie','Raza']) || 'Especie sin definir'}</span>
                <span>{sheetValueByNames(sheet, ['Trasfondo','Antecedente']) || 'Trasfondo sin definir'}</span>
                <span>{sheetValueByNames(sheet, ['Nombre del jugador','Jugador']) || playerName || 'Jugador'}</span>
              </div>
            </div>
            <div class="header-actions">
              {#if demoPreview}
                <button type="button" on:click={closeDemoPreview}>Salir de vista previa</button>
              {:else}
                <button type="button" on:click={() => importOpen = !importOpen}>Gestionar</button>
                <button type="button" on:click={exportSheet}>Exportar</button>
              {/if}
            </div>
          </header>

          <section class="sheet-quick-stats nautical-quick-stats" aria-label="Características y estadísticas">
            {#each playerAttributes(sheet.sections || []) as pair}
              {#each pair.heading.stats || [] as stat, i}
                <div class="attribute-plaque">
                  <span>{stat.name || ''}</span>
                  <strong>{displayValue(pair.values?.stats?.[i]?.value) || displayValue(stat.value) || '—'}</strong>
                </div>
              {/each}
            {/each}
            <div><span>Competencia</span><strong>{sheetValueByNames(sheet, ['Bonificador por competencia','Bonificador de competencia']) || '—'}</strong></div>
            <div><span>Velocidad</span><strong>{sheetValueByNames(sheet, ['Velocidad']) || '—'}</strong></div>
            <div class="hp-plaque"><span>Puntos de golpe</span><strong>{sheetValueByNames(sheet, ['Puntos de golpe actuales','PG actuales']) || '—'} / {sheetValueByNames(sheet, ['Puntos de golpe máximos','PG máximos']) || '—'}</strong></div>
            <div><span>Clase de armadura</span><strong>{sheetValueByNames(sheet, ['Clase de armadura','CA']) || '—'}</strong></div>
            <div><span>Iniciativa</span><strong>{sheetValueByNames(sheet, ['Iniciativa']) || '—'}</strong></div>
          </section>

          {#if importOpen}
            <section class="import-character-panel data-import-panel nautical-import">
              <label>Importar otro personaje (JSON)<input bind:this={fileInput} type="file" accept=".json,application/json" on:change={importJson} /></label>
              <button class="secondary" on:click={() => importOpen = false}>Cerrar</button>
            </section>
          {/if}

          <div class="nautical-columns">
            <aside class="nautical-side">
              {#each playerSidePairs('saves', sheet.sections || []) as pair}
                <section class="sheet-section">
                  <div class="sheet-section-title"><h3>{pair.heading.name || 'Salvaciones'}</h3></div>
                  <div class="stats-list">
                    {#each pair.heading.stats || [] as stat, i}
                      <div class="sheet-stat"><span class="stat-label">{stat.name || ''}</span><div class="stat-value sheet-readonly-value">{displayValue(pair.values?.stats?.[i]?.value) || displayValue(stat.value)}</div></div>
                    {/each}
                  </div>
                </section>
              {/each}
              {#each playerSidePairs('training', sheet.sections || []) as pair}
                <section class="sheet-section">
                  <div class="sheet-section-title"><h3>{pair.heading.name || 'Competencias'}</h3></div>
                  <div class="stats-list">
                    {#each pair.heading.stats || [] as stat, i}
                      <div class="sheet-stat"><span class="stat-label">{stat.name || ''}</span><div class="stat-value sheet-readonly-value">{displayValue(pair.values?.stats?.[i]?.value) || displayValue(stat.value)}</div></div>
                    {/each}
                  </div>
                </section>
              {/each}
            </aside>

            <section class="nautical-skills">
              {#each playerSidePairs('skills', sheet.sections || []) as pair}
                <section class="sheet-section skills-section">
                  <div class="sheet-section-title"><h3>{pair.heading.name || 'Habilidades'}</h3></div>
                  <div class="skill-column-labels"><span>Habilidad</span><span>Valor</span></div>
                  <div class="stats-list">
                    {#each pair.heading.stats || [] as stat, i}
                      <div class="sheet-stat"><span class="stat-label">{stat.name || ''}</span><div class="stat-value sheet-readonly-value">{displayValue(pair.values?.stats?.[i]?.value) || displayValue(stat.value)}</div></div>
                    {/each}
                  </div>
                </section>
              {/each}
            </section>

            <section class="nautical-content">
              <nav class="nautical-tabs" aria-label="Secciones de la ficha">
                {#each playerSheetTabs as tab}
                  <button type="button" class:active={playerSheetTab === tab} on:click={() => playerSheetTab = tab}>{tab}</button>
                {/each}
              </nav>
              <div class="nautical-tab-content">
                {#each playerSheetPairs(playerSheetTab, sheet.sections || []) as pair}
                  <section class="sheet-section {sectionClass(pair.heading.name)}">
                    <div class="sheet-section-title"><h3>{pair.heading.name || ''}</h3></div>
                    <div class="stats-list">
                      {#each pair.heading.stats || [] as stat, i}
                        <div class="sheet-stat">
                          <span class="stat-label">{stat.name || ''}</span>
                          <div class="stat-value sheet-readonly-value">{#each rollableParts(displayValue(pair.values?.stats?.[i]?.value) || displayValue(stat.value)) as part}
                            {#if part.rollable}<button type="button" class="inline-roll" title="Tirar {part.notation} en Dice+" on:click={() => sendSheetRoll(part.notation, String(stat.name || pair.heading.name || 'Tirada'))}>{part.text}</button>{:else}<span>{part.text}</span>{/if}
                          {/each}</div>
                        </div>
                      {/each}
                    </div>
                  </section>
                {/each}
                {#if playerSheetPairs(playerSheetTab, sheet.sections || []).length === 0}
                  <p class="muted nautical-empty">No hay información registrada en esta sección.</p>
                {/if}
                {#if playerSheetTab === 'Notas' && sheet.notes}
                  <section class="sheet-section notes-section"><div class="sheet-section-title"><h3>Notas</h3></div><div class="sheet-notes-content">{sheet.notes}</div></section>
                {/if}
              </div>
            </section>
          </div>
        </article>

        <section class="panel save-panel">
          <button class="primary full" on:click={exportSheet}>Exportar personaje (JSON)</button>
          <button class="danger-text" on:click={deleteSheet}>Eliminar personaje</button>
        </section>
      {/if}
    {/if}
  </main>

  {#if notice}<button class="toast" on:click={() => notice = ''}>{notice}<span>×</span></button>{/if}
  <footer><span>FORJA DE AVENTUREROS · v1.0.52</span></footer>
</div>

<style>
  :global(:root){--paper:#080808;--paper-deep:#141414;--ink:#f4f1f1;--ink-soft:#c1b9ba;--rule:#76212a;--red:#d52332;--gold:#b52a36}
  .builder-panel{display:grid;gap:.8rem}.builder-panel>label{display:grid;gap:.3rem;color:var(--ink-soft);font:600 .76rem system-ui,sans-serif}.builder-panel input,.builder-panel select,.builder-panel textarea{box-sizing:border-box;width:100%;padding:.65rem;border:1px solid var(--rule);border-radius:5px;background:#fffdf8;color:var(--ink);font: .9rem system-ui,sans-serif}.builder-panel h3{margin:.2rem 0;color:var(--red);font:700 1rem Georgia,serif}.builder-progress{height:5px;border-radius:5px;background:#e8dfce;overflow:hidden}.builder-progress span{display:block;height:100%;background:var(--gold);transition:width .2s}.builder-info{padding:.7rem .8rem;border:1px solid var(--rule);border-left:3px solid var(--gold);border-radius:4px;background:rgba(255,255,255,.4);font:.82rem/1.5 system-ui,sans-serif}.builder-info p{margin:.3rem 0}.builder-info small{color:var(--ink-soft)}.builder-actions{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:flex-end;margin-top:.7rem}.builder-actions button{min-height:38px}.builder-panel .sheet-grid{grid-template-columns:minmax(0,1fr)}.builder-panel .sheet-stat{grid-template-columns:minmax(0,1fr)}.builder-panel .sheet-stat strong{white-space:pre-wrap;overflow-wrap:anywhere}
  .master-tabs{display:flex;gap:.4rem;overflow-x:auto;padding:.2rem 0 .7rem;margin:.8rem 0;border-bottom:1px solid var(--rule)}
  .master-tabs button{flex:0 0 auto;border:1px solid var(--rule);border-radius:5px;padding:.55rem .8rem;background:#e8dfce;color:var(--ink-soft);font:600 .75rem system-ui,sans-serif;cursor:pointer}
  .master-tabs button.active{background:var(--ink);border-color:var(--ink);color:var(--paper)}
  .subclass-level-preview{padding:.7rem;border:1px solid var(--rule);border-radius:4px;background:rgba(0,0,0,.04);display:grid;gap:.5rem}.subclass-level-preview p{white-space:pre-wrap;margin:.25rem 0;font-size:.82rem;line-height:1.4}.level-up-panel{margin-top:1rem;padding:1rem;border:1px solid var(--red);border-radius:6px;background:var(--paper-deep);display:grid;gap:.65rem}.level-up-panel label{display:grid;gap:.3rem;color:var(--ink-soft);font:600 .78rem system-ui,sans-serif}.level-up-panel input,.level-up-panel select,.level-up-panel textarea{box-sizing:border-box;width:100%;padding:.55rem;border:1px solid var(--rule);border-radius:4px;background:#fff;color:#171313;font:500 .85rem system-ui,sans-serif}.level-up-choice-grid{display:grid;grid-template-columns:2fr 1fr;gap:.5rem}.level-up-action{margin:.35rem 0 .6rem}  .items-panel{display:grid;gap:.75rem}.items-search,.items-filters label{display:grid;gap:.35rem;color:var(--ink-soft);font:600 .78rem system-ui,sans-serif}.items-search input,.items-filters input,.items-filters select{box-sizing:border-box;width:100%;min-width:0;padding:.55rem .6rem;border:1px solid var(--gold);border-radius:4px;background:#fff;color:#171313;font:500 .85rem system-ui,sans-serif}.items-filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.6rem}.items-filters fieldset{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.45rem;min-width:0;margin:0;padding:.55rem;border:1px solid var(--rule);border-radius:5px}.items-filters legend{padding:0 .25rem;color:var(--ink-soft);font:700 .75rem system-ui,sans-serif}.items-table-wrap{overflow-x:auto}.items-table{width:100%;border-collapse:collapse;font:.8rem system-ui,sans-serif}.items-table th,.items-table td{padding:.55rem .45rem;border-bottom:1px solid var(--rule);text-align:left;vertical-align:top}.items-table th{position:sticky;top:0;background:var(--paper-deep);color:var(--ink)}.items-table td{color:var(--ink-soft)}.items-table td:first-child{color:var(--ink);font-weight:650}@media(max-width:650px){.items-filters{grid-template-columns:1fr}.items-table{min-width:560px}}
.spells-panel{margin-top:.5rem}
  .spell-search,.spell-filters label{display:grid;gap:.35rem;margin:.7rem 0;padding:.65rem .75rem;border:1px solid var(--rule);border-radius:5px;background:var(--paper);color:var(--ink);font:700 .78rem system-ui,sans-serif}
  .spell-search input,.spell-filters select{box-sizing:border-box;width:100%;min-width:0;padding:.5rem .6rem;border:1px solid var(--gold);border-radius:4px;background:#fff;color:var(--ink);font:500 .82rem system-ui,sans-serif}
  .spell-filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.5rem}
  .spell-list{display:grid;gap:.55rem;margin-top:.7rem}
  .spell-card{min-width:0;border:1px solid var(--rule);border-left:4px solid #526b8c;border-radius:5px;background:var(--paper);color:var(--ink);overflow:hidden}
  .spell-card>summary{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.2rem .7rem;align-items:center;padding:.7rem .8rem;cursor:pointer;list-style:none}
  .spell-card>summary::-webkit-details-marker{display:none}
  .spell-name{font:700 .95rem Georgia,serif;overflow-wrap:anywhere}
  .spell-level{grid-column:2;grid-row:1/3;align-self:center;padding:.25rem .45rem;border:1px solid var(--gold);border-radius:4px;color:#765a27;font:700 .68rem system-ui,sans-serif;white-space:nowrap}
  .spell-subtitle{grid-column:1;color:var(--ink-soft);font:.7rem system-ui,sans-serif;overflow-wrap:anywhere}
  .spell-details{padding:.75rem .85rem;border-top:1px solid var(--rule);font:.78rem/1.5 system-ui,sans-serif}
  .spell-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.15rem .75rem;padding:.55rem .65rem;border:1px solid var(--rule);border-radius:4px;background:#e8dfce}
  .spell-meta p{margin:.12rem 0;overflow-wrap:anywhere}
  .spell-description{margin:.7rem 0 0;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55}
  .spell-source{display:block;margin-top:.6rem;color:var(--ink-soft);font-size:.65rem}
  .monsters-panel{margin-top:.5rem}
  .monster-filter{display:flex;align-items:center;gap:.65rem;margin:.8rem 0;padding:.65rem .75rem;border:1px solid var(--rule);border-radius:5px;background:var(--paper);color:var(--ink);font:700 .78rem system-ui,sans-serif}
  .monster-filter select{min-width:130px;padding:.45rem .6rem;border:1px solid var(--gold);border-radius:4px;background:#fff;color:var(--ink);font:600 .78rem system-ui,sans-serif}
  .monster-list{display:grid;gap:.55rem}
  .monster-card{border:1px solid var(--rule);border-left:4px solid var(--red);border-radius:5px;background:var(--paper);color:var(--ink);overflow:hidden}
  .monster-card>summary{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.18rem .7rem;align-items:center;padding:.7rem .8rem;cursor:pointer;list-style:none}
  .monster-card>summary::-webkit-details-marker{display:none}
  .monster-name{font:700 .95rem Georgia,serif}
  .monster-subtitle{grid-column:1;color:var(--ink-soft);font:.7rem system-ui,sans-serif}
  .monster-cr{grid-column:2;grid-row:1/3;align-self:center;padding:.25rem .45rem;border:1px solid var(--gold);border-radius:4px;color:#765a27;font:700 .68rem system-ui,sans-serif}
  .monster-statblock{padding:.8rem;border-top:1px solid var(--rule);font:.78rem/1.45 system-ui,sans-serif}
  .monster-heading{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.3rem;padding-bottom:.45rem;border-bottom:2px solid var(--red)}
  .monster-heading h3{margin:0;font:700 1.05rem Georgia,serif}
  .monster-heading span{color:var(--ink-soft);font-size:.7rem}
  .monster-combat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.35rem;margin:.65rem 0}
  .monster-combat-grid div{display:grid;gap:.12rem;padding:.4rem;border:1px solid var(--rule);border-radius:4px;background:#e8dfce}
  .monster-combat-grid small{color:var(--ink-soft);font-size:.62rem;text-transform:uppercase}
  .monster-combat-grid strong{font-size:.78rem;overflow-wrap:anywhere}
  .monster-statblock p{margin:.38rem 0}
  .monster-original{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font: .76rem/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--ink);}
  .monster-attacks{margin-top:.65rem;padding:.55rem;border:1px solid var(--rule);border-radius:4px;background:rgba(255,255,255,.4)}
  .monster-role{padding:.5rem;border-left:3px solid var(--gold);background:rgba(177,138,69,.1)}
  .monster-source{display:block;margin-top:.55rem;color:var(--ink-soft);font-size:.62rem}
  .monster-attribution{margin-top:1rem;padding-top:.7rem;border-top:1px solid var(--rule);color:var(--ink-soft);font:.65rem/1.45 system-ui,sans-serif}
  .character-sheet{background:var(--paper);color:var(--ink);border:1px solid #c8bda8;border-radius:10px;padding:clamp(.65rem,2vw,1.25rem);box-shadow:0 12px 32px rgba(0,0,0,.22);font-family:Georgia,'Times New Roman',serif}
  .character-sheet > .sheet-banner{display:block;min-height:0;height:auto;padding:0!important;margin:0 0 .5rem!important;border:0!important;outline:0!important;background:none!important;box-shadow:none!important;text-align:center}
  .character-sheet > .sheet-banner .character-name{display:block;width:100%;min-height:0;margin:0!important;padding:0!important;border:0!important;outline:0!important;background:none!important;color:#000!important;font:700 1.25rem/1.2 Georgia,serif;text-align:center}
  .sheet-notes{display:block;width:100%;margin-top:.35rem;font:.78rem/1.4 system-ui,sans-serif;text-align:center;color:var(--ink-soft)}
  .editable{box-sizing:border-box;border:1px solid transparent;border-radius:3px;background:transparent;color:inherit;min-width:0;padding:.16rem .22rem;resize:vertical}
  .editable:hover{border-color:rgba(143,48,40,.35);background:rgba(255,255,255,.22)}
  .editable:focus{outline:1px solid var(--red);border-color:var(--red);background:#fffdf8}
  .sheet-tabs{display:flex;gap:.35rem;overflow-x:auto;padding:.15rem 0 .65rem;margin-bottom:.7rem;border-bottom:1px solid var(--rule)}
  .sheet-tabs button{flex:0 0 auto;border:1px solid var(--rule);border-radius:5px;padding:.48rem .68rem;background:#e8dfce;color:var(--ink-soft);font:600 .72rem system-ui,sans-serif;cursor:pointer}
  .sheet-tabs button.active{background:var(--ink);border-color:var(--ink);color:var(--paper)}
  .custom-rolls{padding:.8rem;border:1px solid var(--rule);border-top:3px solid var(--gold);border-radius:5px;background:rgba(255,255,255,.43);color:var(--ink)}
  .custom-rolls h3{margin:0 0 .75rem;color:var(--red);font:700 .9rem system-ui,sans-serif;text-transform:uppercase;letter-spacing:.04em}
  .roll-creator{display:grid;grid-template-columns:minmax(0,2fr) minmax(5rem,1fr) minmax(5rem,1fr) auto;gap:.55rem;align-items:end}
  .roll-creator label{display:grid;gap:.25rem;color:var(--ink-soft);font:600 .7rem system-ui,sans-serif}
  .roll-creator input,.roll-creator select{width:100%;min-width:0;box-sizing:border-box;padding:.55rem;border:1px solid var(--rule);border-radius:4px;background:#fffdf8;color:var(--ink);font:.85rem system-ui,sans-serif}
  .roll-creator button,.roll-actions button{min-height:30px;padding:.32rem .55rem;border:1px solid var(--rule);border-radius:4px;background:#e8dfce;color:var(--ink);font:600 .68rem system-ui,sans-serif;cursor:pointer}
  .roll-creator button{background:var(--ink);color:var(--paper);border-color:var(--ink)}
  .custom-roll-list{display:grid;gap:.55rem;margin-top:.9rem}
  .custom-roll-card{padding:.65rem;border:1px solid var(--rule);border-radius:5px;background:rgba(255,255,255,.45)}
  .custom-roll-info,.roll-part-heading{display:flex;justify-content:space-between;gap:.5rem;align-items:center;margin-bottom:.4rem;color:var(--ink)}
  .custom-roll-info .remove-roll,.new-roll-part-title .remove-roll{border:0;background:transparent;color:var(--red);font-size:1rem;cursor:pointer}
  .roll-notation{display:inline-block;padding:.22rem .5rem;border:1px solid #b18a45;border-radius:4px;background:#e8dfce;color:#292722;font:700 .9rem/1.2 system-ui,sans-serif;letter-spacing:.025em}
  .roll-part{padding:.45rem 0;border-top:1px solid var(--rule)}
  .roll-part-heading strong{font:700 .82rem system-ui,sans-serif}
  .roll-actions{display:flex;flex-wrap:wrap;gap:.3rem;align-items:center}
  .roll-actions button{flex:0 1 auto}
  .roll-group-creator{display:grid;grid-template-columns:1fr;gap:.55rem}
  .new-roll-part{display:grid;grid-template-columns:1fr;gap:.55rem;padding:.65rem;border:1px solid var(--rule);border-radius:4px}
  .new-roll-part-title{display:flex;justify-content:space-between;align-items:center;font:.75rem system-ui,sans-serif}
  .new-roll-part label{display:grid;gap:.3rem}
  .add-roll-part{justify-self:start}
  .roll-group-creator>button[type=submit]{justify-self:start}
  .roll-actions .remove-roll{flex:0 0 30px;padding:.25rem;font-size:.9rem;color:var(--red)}
  .roll-result{display:block;margin-top:.5rem;padding:.45rem .55rem;border-radius:4px;background:#e8dfce;color:var(--ink);font:700 .82rem system-ui,sans-serif}
  .sheet-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem;align-items:start}
  .sheet-section{min-width:0;padding:.7rem .8rem .65rem;border:1px solid var(--rule);border-top:3px solid var(--red);border-radius:5px;background:rgba(255,255,255,.43);break-inside:avoid}
  .sheet-section-title{display:flex;align-items:center;padding-bottom:.4rem;margin-bottom:.25rem;border-bottom:1px solid var(--rule)}
  .section-name{width:100%;color:var(--red);font:700 .88rem/1.2 system-ui,sans-serif;letter-spacing:.045em;text-transform:uppercase}
  .stats-list{display:grid;grid-template-columns:1fr}
  .sheet-stat{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:.45rem;align-items:center;padding:.35rem .02rem;border-bottom:1px solid rgba(130,112,83,.24)}
  .sheet-stat:last-child{border-bottom:0}
  .stat-label{width:100%;color:var(--ink-soft);font:.73rem/1.35 system-ui,sans-serif}
  .stat-value{width:100%;min-height:3.2rem;color:var(--ink);text-align:left;font:500 .8rem/1.45 system-ui,sans-serif;overflow-wrap:anywhere;white-space:pre-wrap;overflow-y:auto;resize:vertical;padding:.35rem .4rem;background:rgba(255,255,255,.3)}\n  .features-section .sheet-stat{grid-template-columns:1fr;gap:.2rem;align-items:start}\n  .features-section .stat-label{font-weight:700;color:var(--ink)}\n  .features-section .stat-value{min-height:7rem;text-align:left;font:500 .82rem/1.5 system-ui,sans-serif;background:rgba(255,255,255,.48)}\n  .gm-character-sheet .sheet-stat strong{min-width:0;white-space:pre-wrap;overflow-wrap:anywhere;font:500 .8rem/1.45 system-ui,sans-serif}
  .combat-section{border-top-color:#292722;background:#ebe5d8}
  .combat-section .section-name{color:#292722}
  .attributes-section{grid-column:1/-1;border-top-color:var(--gold);background:#eee7d8}
  .attributes-section .section-name{color:#765a27}
  .attributes-section .stats-list{grid-template-columns:repeat(3,minmax(0,1fr));column-gap:.65rem}
  .attributes-section .sheet-stat{grid-template-columns:1fr;gap:.1rem;text-align:center;padding:.4rem .15rem;border:1px solid rgba(130,112,83,.25);margin:.12rem;border-radius:4px;background:rgba(255,255,255,.38)}
  .attributes-section .stat-label{text-align:center;text-transform:uppercase;font-size:.64rem;letter-spacing:.05em}
  .attributes-section .stat-value{text-align:center;font:700 1rem/1.3 Georgia,serif}
  .skills-section{border-top-color:#75664c}
  .features-section{border-top-color:#56705c}
  .features-section .section-name{color:#405a46}
  .magic-section{border-top-color:#526b8c}
  .magic-section .section-name{color:#405a78}
  .equipment-section{border-top-color:#987343}
  .story-section{border-top-color:#7b5d70}
  .general-section{border-top-color:#8b8171}
  .import-character-panel{margin-bottom:.8rem}
  .main.gm-layout{max-width:1180px}
  .gm-sheet-details{grid-column:1/-1;width:100%;min-width:0;margin-top:.7rem}
  .gm-sheet-details summary{cursor:pointer;color:#d2b27c;padding:.7rem .2rem;font:600 .85rem system-ui,sans-serif}
  .gm-sheet-details[open]{width:100%;min-width:0}
  .gm-sheet-details[open] .gm-character-sheet{display:block;width:100%;max-width:100%;min-width:0;box-sizing:border-box}
  .roster-panel{width:100%;min-width:0}
  .roster-panel .character-card{grid-template-columns:30px minmax(0,1fr);align-items:start}
  .roster-panel .card-identity{min-width:0}

  .gm-character-sheet{margin-top:.8rem;padding:1rem;box-shadow:none}
  .gm-character-sheet .sheet-grid{grid-template-columns:minmax(0,1fr);gap:1rem}
  .gm-character-sheet .sheet-section{padding:1rem 1.1rem .9rem;border-radius:7px}
  .gm-character-sheet .sheet-section-title{padding-bottom:.6rem;margin-bottom:.45rem}
  .gm-character-sheet .sheet-section-title h3{font-size:1rem}
  .gm-character-sheet .stats-list{gap:.15rem}
  .gm-character-sheet .sheet-stat{grid-template-columns:minmax(0,1fr);gap:.18rem;align-items:start;padding:.55rem .25rem}
  .gm-character-sheet .stat-label{font:600 .78rem/1.35 system-ui,sans-serif;color:var(--ink-soft)}
  .gm-character-sheet .sheet-stat strong{display:block;min-width:0;padding:.1rem 0 .12rem;font:500 .92rem/1.55 system-ui,sans-serif;white-space:pre-wrap;overflow-wrap:anywhere;word-break:normal}
  .gm-character-sheet .attributes-section .stats-list{grid-template-columns:repeat(3,minmax(0,1fr));gap:.45rem}
  .gm-character-sheet .attributes-section .sheet-stat{grid-template-columns:1fr;gap:.2rem;padding:.65rem .35rem}
  .gm-character-sheet .attributes-section .stat-label{font-size:.7rem}
  .gm-character-sheet .attributes-section .sheet-stat strong{font:700 1.15rem/1.3 Georgia,serif;text-align:center}
  .gm-character-sheet .features-section .sheet-stat{grid-template-columns:1fr;gap:.25rem}
  .gm-character-sheet .features-section .sheet-stat strong{padding:.35rem .5rem;border-radius:4px;background:rgba(255,255,255,.5)}
  .gm-sheet-details[open] .gm-character-sheet{width:100%;box-sizing:border-box}
  .chest-panel{margin-top:1rem}.chest-roll-actions{display:flex;justify-content:flex-start;margin:.8rem 0}.chest-result{display:grid;grid-template-columns:auto 1fr auto;gap:.75rem;align-items:center;padding:.85rem 1rem;margin:.75rem 0;border:1px solid var(--gold);border-radius:6px;background:#f0e6ce;color:var(--ink)}.chest-result-number{font:700 .72rem system-ui,sans-serif;color:var(--red)}.chest-result strong{font:700 1rem Georgia,serif}.chest-result>span:last-child{font:.72rem system-ui,sans-serif;color:var(--ink-soft)}.chest-table-wrap{max-height:440px;overflow:auto;border:1px solid var(--rule);border-radius:5px}.chest-table{width:100%;border-collapse:collapse;background:rgba(255,255,255,.4);font:.78rem system-ui,sans-serif}.chest-table th{position:sticky;top:0;background:#e8dfce;color:var(--ink);text-align:left}.chest-table th,.chest-table td{padding:.42rem .6rem;border-bottom:1px solid rgba(130,112,83,.2)}.chest-table td:first-child{width:3.5rem;color:var(--ink-soft);font-variant-numeric:tabular-nums}.chest-selected{background:#e9d7a9;font-weight:700}
  .empty-state{text-align:center;padding:2rem}.save-panel{display:flex;flex-direction:column;gap:.8rem;margin-top:1rem}
  .save-panel .danger-text{align-self:center}
  .roster-panel{margin-top:1rem}.card-identity{min-width:0}
  @media(max-width:650px){.roll-creator{grid-template-columns:1fr 1fr}.roll-creator label:first-child{grid-column:1/-1}.roll-creator button{grid-column:1/-1}}
  @media(max-width:560px){.sheet-grid{grid-template-columns:1fr}.attributes-section{grid-column:auto}.attributes-section .stats-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(min-width:900px){.sheet-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.attributes-section{grid-column:1/-1}}

  /* Tema oscuro carmesí de la extensión */
  :global(.app-shell),:global(.main){color:#f4f1f1}
  :global(.topbar){border-bottom:1px solid #74202a}
  :global(.brand),:global(.brand strong){color:#fff}
  :global(.brand-mark){color:#ed2637}
  :global(.panel),:global(.character-sheet),:global(.sheet-section),:global(.custom-rolls),
  :global(.custom-roll-card),:global(.trait-editor),:global(.import-box),:global(.new-roll-part),
  :global(.spell-card),:global(.monster-card),:global(.chest-result),:global(.roll-result){
    background:#090909!important;color:#f3f1f1!important;border-color:#76212a!important
  }
  :global(.panel){box-shadow:0 8px 24px rgba(0,0,0,.35)}
  :global(.sheet-section){border:1px solid #76212a!important;border-top:3px solid #c32232!important}
  :global(.section-heading h2),:global(.panel h2),:global(.sheet-section-title h3),
  :global(.section-name),:global(.monster-heading h3),:global(.custom-rolls h3),
  :global(.trait-group h3),:global(.character-name){color:#fff!important}
  :global(label),:global(.stat-label),:global(.stat-value),:global(.sheet-stat strong),
  :global(.character-sheet),:global(.spell-details),:global(.monster-statblock),
  :global(.trait-view strong),:global(.roll-part-heading strong){color:#eee!important}
  :global(.muted),:global(.hint),:global(.spell-subtitle),:global(.monster-subtitle),
  :global(.monster-source),:global(.spell-source),:global(.sheet-notes){color:#bcb5b6!important}
  :global(input),:global(textarea),:global(select),:global(.builder-panel input),
  :global(.builder-panel select),:global(.builder-panel textarea){
    background:#111!important;color:#f5f2f2!important;border:1px solid #76212a!important
  }
  :global(input::placeholder),:global(textarea::placeholder){color:#8c8586!important}
  :global(input:focus),:global(textarea:focus),:global(select:focus),:global(.editable:focus){
    outline:1px solid #ef3344!important;border-color:#ef3344!important;background:#151010!important
  }
  :global(.master-tabs),:global(.sheet-tabs){border-bottom-color:#76212a}
  :global(.master-tabs button),:global(.sheet-tabs button),:global(.player-tabs button),
  :global(.character-tabs button),:global(.secondary),:global(.roll-actions button),
  :global(.roll-creator button),:global(.add-roll-part){
    background:#111!important;color:#eee!important;border:1px solid #76212a!important
  }
  :global(.master-tabs button.active),:global(.sheet-tabs button.active),
  :global(.player-tabs button.active),:global(.character-tabs button.active){
    background:#a81727!important;border-color:#ed3343!important;color:#fff!important
  }
  :global(.primary){background:#a81727!important;border:1px solid #ed3343!important;color:#fff!important}
  :global(.primary:hover){background:#c11d30!important}
  :global(.danger-text),:global(.remove-roll){color:#ff6570!important}
  :global(.spell-level),:global(.monster-cr),:global(.count),:global(.free-tag){
    background:#160a0c!important;border-color:#a72a37!important;color:#ffb5ba!important
  }
  :global(.spell-meta),:global(.monster-combat-grid div),:global(.monster-attacks),
  :global(.monster-role),:global(.builder-info),:global(.builder-progress){
    background:#121010!important;border-color:#76212a!important;color:#eee!important
  }
  :global(.builder-progress span){background:#d32638!important}
  :global(.roll-notation){background:#17090b!important;border-color:#a72a37!important;color:#fff!important}
  :global(.chest-table-wrap){border-color:#76212a!important}
  :global(.chest-table){background:#090909!important;color:#eee!important}
  :global(.chest-table th){background:#1a090c!important;color:#fff!important}
  :global(.chest-table td){border-bottom-color:#4c1a20!important;color:#ddd!important}
  :global(.chest-selected){background:#49121a!important;color:#fff!important}
  :global(.toast){background:#1b090c!important;border-color:#a72a37!important;color:#fff!important}
  :global(.sheet-stat),:global(.roll-entry),:global(.trait-view),:global(.traits-preview){border-color:#4d1b21!important}
  :global(.gm-sheet-details summary),:global(.monster-source summary){color:#ff7a84!important}
  :global(.character-sheet .features-section .sheet-stat strong){background:#151010!important}
  /* Los nombres y descripciones conservan el color neutro de la ficha; el rojo se usa solo en acentos. */
  :global(.features-section .stat-label),:global(.magic-section .stat-label),
  :global(.equipment-section .weapon-name),:global(.attacks-section .stat-label){color:#bcb2b4!important}
  :global(.features-section .sheet-stat strong),:global(.magic-section .sheet-stat strong),
  :global(.attacks-section .sheet-stat strong){color:#f4eeee!important}
  :global(.inline-roll){display:inline;padding:0;border:0;background:transparent;color:#64aaff;font:inherit;font-weight:700;text-decoration:underline;text-decoration-color:rgba(100,170,255,.45);text-underline-offset:2px;cursor:pointer}
  :global(.inline-roll:hover){color:#9ac8ff;text-decoration-color:currentColor}
  :global(.sheet-readonly-value){white-space:pre-wrap;overflow-wrap:anywhere}
  :global(.character-sheet .editable:hover){background:#1a1011!important;border-color:#8c2732!important}

  /* Presentación de ficha inspirada en la jerarquía de D&D Beyond */
  :global(.app-shell){max-width:1180px}
  :global(.main){max-width:1120px;width:100%}
  :global(.character-sheet){width:100%;max-width:none;padding:1.1rem;border-radius:10px;background:#17191d!important;border:1px solid #343a43!important;color:#f4f5f7!important}
  :global(.ddb-character-header){display:flex!important;align-items:center;justify-content:space-between;gap:1rem;padding:1.15rem 1.25rem!important;margin:0 0 .85rem!important;border-radius:8px!important;background:#252a32!important;text-align:left!important}
  :global(.ddb-character-header .sheet-banner-copy){min-width:0;text-align:left}
  :global(.ddb-character-header .sheet-kicker){display:block;color:#aab6c5;font:700 .68rem/1.3 system-ui,sans-serif;letter-spacing:.12em}
  :global(.ddb-character-header .character-name){margin:.25rem 0 .45rem!important;color:#fff!important;text-align:left!important;font:700 clamp(1.45rem,3vw,2.15rem)/1.15 system-ui,sans-serif!important}
  :global(.sheet-banner-meta){display:flex;flex-wrap:wrap;gap:.35rem .9rem;color:#d0d6df;font:500 .76rem/1.4 system-ui,sans-serif}
  :global(.sheet-banner-meta span+span){padding-left:.8rem;border-left:1px solid #59616d}
  :global(.sheet-banner-emblem){display:grid;place-items:center;flex:0 0 3.4rem;width:3.4rem;height:3.4rem;border:1px solid #59616d;border-radius:50%;color:#d5b36e;font-size:1.7rem}
  :global(.sheet-quick-stats){display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.55rem;margin:0 0 .9rem}
  :global(.sheet-quick-stats>div){display:flex;min-width:0;flex-direction:column;justify-content:center;gap:.25rem;padding:.7rem .8rem;border:1px solid #3b424d;border-radius:7px;background:#22262d}
  :global(.sheet-quick-stats>div>span){color:#aeb7c3;font:600 .65rem/1.25 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.055em}
  :global(.sheet-quick-stats>div>strong){color:#fff;font:700 1.05rem/1.25 system-ui,sans-serif;overflow-wrap:anywhere}
  :global(.sheet-tabs){display:flex;gap:.3rem;overflow-x:auto;padding:.25rem .15rem .65rem;margin:0 0 .9rem;border-bottom:1px solid #414956;scrollbar-width:thin}
  :global(.sheet-tabs button){flex:0 0 auto;padding:.58rem .9rem;border:0!important;border-bottom:3px solid transparent!important;border-radius:5px 5px 0 0!important;background:transparent!important;color:#c0c7d1!important;font:600 .76rem system-ui,sans-serif;white-space:nowrap}
  :global(.sheet-tabs button.active){border-bottom-color:#d5b36e!important;background:#2a3039!important;color:#fff!important}
  :global(.sheet-grid){grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem}
  :global(.sheet-section){border:1px solid #3b424d!important;border-top:3px solid #68788d!important;border-radius:7px!important;background:#22262d!important;padding:.85rem!important}
  :global(.sheet-section-title){border-bottom:1px solid #414956!important}
  :global(.sheet-section-title h3),:global(.section-name){color:#f2f4f7!important}
  :global(.stat-label){color:#aeb7c3!important}
  :global(.stat-value),:global(.sheet-stat strong){color:#f3f5f8!important}
  :global(.sheet-stat){border-bottom-color:#3c424b!important}
  :global(.attributes-section){grid-column:1/-1;background:#252a32!important;border-top-color:#d5b36e!important}
  :global(.attributes-section .stats-list){grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:.45rem}
  :global(.attributes-section .sheet-stat){border:1px solid #454d59!important;border-radius:6px!important;background:#1b1f25!important}
  :global(.attributes-section .stat-label){color:#b9c2ce!important}
  @media(max-width:760px){:global(.sheet-quick-stats){grid-template-columns:repeat(3,minmax(0,1fr))}:global(.sheet-grid){grid-template-columns:1fr}:global(.attributes-section .stats-list){grid-template-columns:repeat(3,minmax(0,1fr))!important}}
  @media(max-width:520px){:global(.ddb-character-header){align-items:flex-start}:global(.sheet-banner-meta){display:grid;grid-template-columns:1fr 1fr}:global(.sheet-banner-meta span+span){padding-left:0;border-left:0}:global(.sheet-quick-stats){grid-template-columns:repeat(2,minmax(0,1fr))}}


  /* Organización de ficha inspirada en la navegación por secciones de D&D Beyond */
  :global(.app-shell){max-width:1180px!important}
  :global(main){max-width:1120px!important}
  .character-sheet{display:grid;grid-template-columns:220px minmax(0,1fr);column-gap:1rem;align-items:start}
  .character-sheet>.sheet-banner,.character-sheet>.sheet-quick-stats{grid-column:1/-1}
  .character-sheet>.ddb-section-nav{grid-column:1;grid-row:auto;display:flex;flex-direction:column;align-items:stretch;gap:.18rem;overflow:visible;position:sticky;top:.5rem;max-height:calc(100vh - 1rem);overflow-y:auto;padding:.35rem;border:1px solid #353535;border-radius:7px;background:#17191d}
  .character-sheet>.ddb-section-nav button{flex:0 0 auto;width:100%;min-height:38px;padding:.55rem .65rem;border:0;border-left:3px solid transparent;border-radius:3px;background:transparent;color:#d4d6da;text-align:left;font:600 .76rem/1.25 system-ui,sans-serif;white-space:normal}
  .character-sheet>.ddb-section-nav button.active{border-left-color:#c69b45;background:#2b2e34;color:#fff}
  .character-sheet>.ddb-section-nav button:hover{background:#25282e}
  .character-sheet>.sheet-grid,.character-sheet>.progression-panel,.character-sheet>.spellbook-panel,.character-sheet>.custom-rolls,.character-sheet>.rules-panel,.character-sheet>.ddb-content-panel{grid-column:2;min-width:0}
  .character-sheet>.sheet-grid{grid-template-columns:minmax(0,1fr);align-content:start}
  .character-sheet>.sheet-grid .sheet-section{min-width:0}
  .ddb-content-panel{padding:1rem;border:1px solid #34383f;border-radius:7px;background:#202329;color:#f3f3f3}
  .ddb-content-panel h2{margin:0 0 .65rem;font:700 1.1rem system-ui,sans-serif}
  .sheet-quick-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.5rem}
  .sheet-quick-stats>div{min-width:0}
  @media(max-width:720px){
    .character-sheet{grid-template-columns:minmax(0,1fr);row-gap:.7rem}
    .character-sheet>.ddb-section-nav{grid-column:1;position:static;max-height:none;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));overflow:visible}
    .character-sheet>.ddb-section-nav button{min-height:42px}
    .character-sheet>.sheet-grid,.character-sheet>.progression-panel,.character-sheet>.spellbook-panel,.character-sheet>.custom-rolls,.character-sheet>.rules-panel,.character-sheet>.ddb-content-panel{grid-column:1}
    .sheet-quick-stats{grid-template-columns:repeat(2,minmax(0,1fr))}
  }


  /* Hoja continua: sin pestañas ni navegación lateral */
  .character-sheet{display:block!important;grid-template-columns:minmax(0,1fr)!important;column-gap:0!important}
  .character-sheet>.sheet-banner,.character-sheet>.sheet-quick-stats,
  .character-sheet>.sheet-grid,.character-sheet>.progression-panel,
  .character-sheet>.spellbook-panel,.character-sheet>.custom-rolls,
  .character-sheet>.rules-panel,.character-sheet>.ddb-content-panel{grid-column:auto!important;grid-row:auto!important;min-width:0}
  .character-sheet>.sheet-grid.continuous-sheet-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem;align-items:start}
  .continuous-sheet-grid>.attributes-section{grid-column:1/-1}
  .continuous-sheet-grid>.combat-section{grid-column:span 1}
  .continuous-sheet-grid>.features-section{grid-column:1/-1}
  .continuous-sheet-grid>.magic-section{grid-column:1/-1}
  .continuous-sheet-grid>.notes-section{grid-column:1/-1}
  .sheet-notes-content{white-space:pre-wrap;overflow-wrap:anywhere;color:#eee;line-height:1.55;font:.85rem/1.55 system-ui,sans-serif}
  .data-import-panel{margin:.2rem 0 .8rem}
  @media(max-width:760px){
    .character-sheet>.sheet-grid.continuous-sheet-grid{grid-template-columns:minmax(0,1fr)}
    .continuous-sheet-grid>.attributes-section,.continuous-sheet-grid>.features-section,
    .continuous-sheet-grid>.magic-section,.continuous-sheet-grid>.notes-section{grid-column:auto}
  }
 
  /* Hoja de personaje: interfaz náutica en tres columnas */
  :global(.nautical-sheet){display:block!important;padding:0!important;overflow:hidden;background:#071b20!important;border:1px solid #247b7e!important;border-radius:12px!important;box-shadow:0 16px 40px #0009!important;color:#e8f7f4!important}
  :global(.nautical-header){display:flex!important;align-items:center;gap:1rem;padding:1rem 1.2rem!important;margin:0!important;border:0!important;border-bottom:1px solid #287c7d!important;border-radius:0!important;background:linear-gradient(115deg,#0b3035,#10272d 65%,#0a1c23)!important}
  :global(.portrait-frame){display:grid;place-items:center;flex:0 0 4.5rem;width:4.5rem;height:4.5rem;border:3px solid #b66b3c;border-radius:50%;background:radial-gradient(circle,#31545a,#0a2027 70%);color:#e8c18e;font-size:1.8rem;box-shadow:0 0 0 3px #4a2b20}
  :global(.nautical-header .sheet-banner-copy){flex:1;min-width:0}
  :global(.nautical-header .sheet-kicker){color:#6dd3ca}
  :global(.nautical-header .character-name){color:#f4fffc!important;margin:.2rem 0!important}
  :global(.nautical-header .sheet-banner-meta){color:#a9c9c5}
  :global(.header-actions){display:flex;gap:.4rem;flex-wrap:wrap}
  :global(.header-actions button){padding:.5rem .65rem;border:1px solid #347f80;border-radius:5px;background:#102f35;color:#d9f4ef;font-size:.7rem}
  :global(.nautical-quick-stats){display:flex;flex-wrap:wrap;gap:.45rem;padding:.8rem;background:#0a242a;border-bottom:1px solid #247b7e}
  :global(.nautical-quick-stats>div){flex:1 1 5rem;min-width:5rem;display:flex;flex-direction:column;justify-content:center;gap:.25rem;padding:.55rem .6rem;border:1px solid #28676b;border-radius:7px;background:linear-gradient(145deg,#12373c,#0b252b)}
  :global(.nautical-quick-stats>div>span){font-size:.61rem;color:#7fcac2;text-transform:uppercase;letter-spacing:.06em}
  :global(.nautical-quick-stats>div>strong){font-size:1rem;color:#f1fffc}
  :global(.nautical-quick-stats .attribute-plaque){flex:1 1 5.4rem;min-height:4rem;text-align:center;border-radius:18px 18px 8px 8px;border:1px solid #328b89}
  :global(.nautical-quick-stats .attribute-plaque strong){font-size:1.25rem}
  :global(.nautical-quick-stats .hp-plaque){flex:2 1 10rem}
  :global(.nautical-import){padding:.8rem 1rem;background:#0b252b;border-bottom:1px solid #247b7e}
  :global(.nautical-columns){display:grid;grid-template-columns:minmax(175px,.82fr) minmax(190px,.95fr) minmax(360px,2fr);gap:.65rem;padding:.7rem;align-items:start;background:radial-gradient(ellipse at 75% 0%,#17434a 0,#0a252b 50%,#071b20 100%)}
  :global(.nautical-side),:global(.nautical-skills),:global(.nautical-content){min-width:0;max-height:calc(100vh - 14rem);overflow:auto;scrollbar-color:#267d7d #092127;scrollbar-width:thin}
  :global(.nautical-side),:global(.nautical-skills){display:flex;flex-direction:column;gap:.6rem}
  :global(.nautical-columns .sheet-section){padding:.75rem!important;border:1px solid #286d70!important;border-top:2px solid #40aaa4!important;border-radius:8px!important;background:#0b252beF!important;color:#e8f7f4!important}
  :global(.nautical-columns .sheet-section-title){border-bottom:1px solid #28595c!important;margin-bottom:.35rem;padding-bottom:.45rem}
  :global(.nautical-columns .sheet-section-title h3){font:700 .78rem system-ui,sans-serif!important;letter-spacing:.07em;text-transform:uppercase;color:#80d8ce!important}
  :global(.nautical-columns .sheet-stat){display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.45rem;padding:.42rem .15rem;border-bottom:1px solid #1c484c!important}
  :global(.nautical-columns .stat-label){font-size:.72rem;color:#b8d1ce!important}
  :global(.nautical-columns .stat-value){font:600 .75rem system-ui,sans-serif;color:#f2fffc!important;text-align:right}
  :global(.nautical-tabs){display:flex;gap:.2rem;overflow-x:auto;padding:.1rem .1rem .55rem;margin-bottom:.55rem;border-bottom:1px solid #26777a;scrollbar-width:thin}
  :global(.nautical-tabs button){flex:0 0 auto;padding:.55rem .65rem;border:1px solid transparent!important;border-radius:5px 5px 0 0;background:transparent!important;color:#a9c9c5!important;font-size:.68rem;font-weight:700;white-space:nowrap}
  :global(.nautical-tabs button.active){border-color:#318c8b!important;background:#123a3e!important;color:#8ce4d9!important}
  :global(.nautical-tab-content){display:flex;flex-direction:column;gap:.6rem}
  :global(.skill-column-labels){display:flex;justify-content:space-between;padding:.2rem .15rem;color:#5fb9b3;font-size:.58rem;text-transform:uppercase;letter-spacing:.08em}
  :global(.nautical-empty){padding:1rem;text-align:center;border:1px dashed #286d70;border-radius:7px}
  :global(.nautical-sheet .inline-roll){color:#75dcd2}
  /* La ficha ocupa todo el espacio que Owlbear entrega a la extensión.
     El documento completo es el único contenedor con desplazamiento vertical. */
  :global(html),:global(body),:global(#app){width:100%;min-height:100%;height:auto;overflow-x:hidden!important;overflow-y:visible!important}
  :global(body){margin:0}
  :global(.app-shell){width:100%!important;max-width:none!important;margin:0!important;padding:0 .45rem!important}
  :global(.main){width:100%!important;max-width:none!important;margin:0!important;padding:.55rem 0 1rem!important}
  :global(.nautical-sheet){width:100%;max-width:none;overflow:visible!important}
  :global(.nautical-columns){width:100%;align-items:start}
  :global(.nautical-side),:global(.nautical-skills),:global(.nautical-content){
    min-width:0;max-height:none!important;height:auto!important;overflow:visible!important;
  }
  :global(.nautical-side),:global(.nautical-skills){display:flex;flex-direction:column;gap:.6rem}
  :global(.nautical-tab-content){height:auto;max-height:none;overflow:visible!important}
  :global(.nautical-header .character-name){color:#fff!important}
  @media(max-width:900px){
    :global(.nautical-columns){grid-template-columns:minmax(150px,.8fr) minmax(170px,1fr)}
    :global(.nautical-content){grid-column:1/-1}
  }
  @media(max-width:580px){
    :global(.nautical-header){flex-wrap:wrap}
    :global(.header-actions){width:100%;padding-left:5.5rem}
    :global(.nautical-columns){grid-template-columns:1fr}
    :global(.nautical-side),:global(.nautical-skills),:global(.nautical-content){grid-column:1}
    :global(.nautical-quick-stats .attribute-plaque){flex:1 1 26%}
  }

</style>
