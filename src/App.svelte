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
  let activeTab = 'Datos';
  let monsterCrFilter = 'Todos';
  let monsterSearch = '';
  let spellSearch = '';
  let rulesSearch = '';
  let rulesCategoryFilter = 'Todas';
  let spellLevelFilter = 'Todos';
  let spellClassFilter = 'Todas';
  let spellSchoolFilter = 'Todas';
  const tabs = ['Datos', 'Competencias', 'Equipo', 'Combate', 'Conjuros', 'Tiradas', 'Reglas'];
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
  let levelUpEntry: RoomEntry | null = null;
  let levelUpDecision = '';
  let levelUpClassCantrips = '';
  let levelUpClassSpells = '';
  let levelUpWizardBookAdditions = '';
  let levelUpExpertise = '';
  let levelUpNewSkill = '';
  let levelUpLanguages = '';
  let levelUpWildShapeForms = '';
  let levelUpWeaponMasteries = '';
  let levelUpSubclass = '';
  let levelUpSubclassVariant = '';
  let levelUpSubclassCantrips = '';
  let levelUpSubclassSpells = '';
  let levelUpAsiMode = 'asi';
  let levelUpAbility1 = 'Fuerza';
  let levelUpAbility2 = 'Destreza';
  let levelUpIncrease1 = '2';
  let levelUpIncrease2 = '0';
  let levelUpFeat = '';
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
  const masterTabs = ['Personajes', 'Tiradas', 'Cofres', 'Monstruos ordenados', 'Conjuros', 'Reglas', 'Crear personaje'];
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
  let builderData: BuilderData = {
    name: '', player: '', className: 'Guerrero', species: 'Humano', background: 'Soldado',
    alignment: 'Neutral', method: 'standard',
    abilities: { Fuerza: 15, Destreza: 14, Constitución: 13, Inteligencia: 12, Sabiduría: 10, Carisma: 8 },
    feat: 'Atacante salvaje', abilityIncreaseMode: 'two', abilityIncrease2: 'Fuerza', abilityIncrease1: 'Destreza', abilityIncrease3: 'Constitución', backgroundEquipment: 'A', backgroundToolChoice: '', classEquipmentChoice: 'A', classSkillChoices: [], classToolsChoices: [], classSpecialChoice: '', classExpertise: [], weaponMasteries: [], selectedCantrips: [], selectedSpells: [], wizardSpellbook: [], speciesChoice: '', speciesMagicAbility: '', speciesSkill: '', speciesExtraFeat: 'Habilidoso', speciesSize: '', speciesBreathShape: 'Cono', backgroundFeatChoices: [], speciesFeatChoices: [], languages: [], rogueLanguage: '', backgroundMagicCantrips: [], backgroundMagicSpell: '', backgroundMagicAbility: 'Inteligencia', warlockTomeCantrips: [], warlockTomeRituals: [], speciesMagicCantrips: [], speciesMagicSpell: '', speciesFeatMagicAbility: 'Inteligencia', skills: '', tools: '', equipment: '', traits: '', spells: '', notes: ''
  };
  const BUILDER_CLASSES = ['Bárbaro','Bardo','Brujo','Clérigo','Druida','Explorador','Guerrero','Hechicero','Mago','Monje','Paladín','Pícaro'];
  const BUILDER_SPECIES = ['Aasimar','Dracónido','Enano','Elfo','Gnomo','Goliat','Mediano','Humano','Orco','Tiefling'];
  const BUILDER_BACKGROUNDS = ['Acólito','Animador','Artesano','Campesino','Charlatán','Comerciante','Criminal','Ermitaño','Erudito','Escriba','Guardia','Guía','Marinero','Noble','Soldado','Vagabundo'];
  const BUILDER_FEATS = ['Alerta','Afortunado','Atacante salvaje','Duro','Fabricante','Habilidoso','Iniciado en la magia (Clérigo)','Iniciado en la magia (Druida)','Matón de taberna','Músico','Sanador'];
  const BUILDER_BACKGROUND_TOOL_OPTIONS: Record<string,string[]> = {
    'Animador':['Chirimía','Cuerno','Dulcémele','Flauta','Flauta de pan','Gaita','Laúd','Lira','Tambor','Viola'],
    'Artesano':['Herramientas de albañil','Herramientas de alfarero','Herramientas de carpintero','Herramientas de curtidor','Herramientas de ebanista','Herramientas de herrero','Herramientas de manitas','Herramientas de tejedor'],
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
    'Bárbaro':'Furia; Defensa sin armadura',
    'Bardo':'Inspiración bárdica; Lanzamiento de conjuros',
    'Brujo':'Invocaciones sobrenaturales; Magia del pacto',
    'Clérigo':'Lanzamiento de conjuros; Orden divina',
    'Druida':'Druídico; Orden primigenia; Lanzamiento de conjuros',
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
    'Aasimar':'Tipo de criatura: Humanoide. Manos curativas; Portador de luz (truco luz); Resistencia celestial (necrótico y radiante); Visión en la oscuridad 18 m; Revelación celestial desde nivel 3.',
    'Dracónido':'Tipo de criatura: Humanoide. Linaje dracónico; Ataque de aliento 1d10 (aumenta a 2d10 en nivel 5, 3d10 en nivel 11 y 4d10 en nivel 17); Resistencia al daño del linaje; Visión en la oscuridad 18 m; Vuelo dracónico desde nivel 5.',
    'Enano':'Tipo de criatura: Humanoide. Afinidad con la piedra; Aguante enano (+1 PG por nivel); Resistencia enana (veneno); Visión en la oscuridad 36 m.',
    'Elfo':'Tipo de criatura: Humanoide. Linaje feérico; Linaje élfico; Sentidos agudos (elige Percepción, Perspicacia o Supervivencia); Trance; Visión en la oscuridad 18 m (Drow: 36 m).',
    'Gnomo':'Tipo de criatura: Humanoide. Astucia gnoma; Linaje gnomo; Visión en la oscuridad 18 m.',
    'Goliat':'Tipo de criatura: Humanoide. Constitución poderosa; Forma grande desde nivel 5; Linaje gigante (elige un beneficio).',
    'Mediano':'Tipo de criatura: Humanoide. Agilidad de mediano; Fortuna; Sigiloso por naturaleza; Valiente.',
    'Humano':'Tipo de criatura: Humanoide. Diestro (elige una habilidad); Ingenioso; Versátil (dote de origen adicional).',
    'Orco':'Tipo de criatura: Humanoide. Aguante incansable; Descarga de adrenalina; Visión en la oscuridad 36 m.',
    'Tiefling':'Tipo de criatura: Humanoide. Legado infernal; Presencia sobrenatural (truco taumaturgia); Visión en la oscuridad 18 m.'
  };
  function builderSpeciesChoiceDescription(species:string,choice:string): string {
    const dragonDamage:Record<string,string>={Azul:'relámpago',Blanco:'frío',Bronce:'relámpago',Cobre:'ácido',Negro:'ácido',Oro:'fuego',Oropel:'fuego',Plata:'frío',Rojo:'fuego',Verde:'veneno'};
    if(species==='Dracónido' && dragonDamage[choice]) return 'Linaje dracónico · '+choice+': resistencia al daño de '+dragonDamage[choice]+'. Ataque de aliento: 1d10 de '+dragonDamage[choice+'']+'; cono de 4,5 m o línea de 9 m × 1,5 m, salvación de Destreza CD 8 + Constitución + bonificador por competencia, mitad de daño si se supera. Usos iguales al bonificador por competencia por descanso largo. El daño aumenta a 2d10 en nivel 5, 3d10 en nivel 11 y 4d10 en nivel 17.';
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
      if(choice==='Alto elfo') return 'Linaje élfico · Alto elfo: conoces el truco prestidigitación y puedes sustituirlo por otro truco de mago tras un descanso largo. En nivel 3 aprendes Detectar magia y en nivel 5 Paso brumoso; siempre preparados, un lanzamiento gratuito de cada uno por descanso largo.';
      if(choice==='Drow') return 'Linaje élfico · Drow: visión en la oscuridad de 36 m y truco luces danzantes. En nivel 3 aprendes Fuego feérico y en nivel 5 Oscuridad; siempre preparados, un lanzamiento gratuito de cada uno por descanso largo.';
      return 'Linaje élfico · Elfo de los bosques: velocidad 10,5 m y truco saber druídico. En nivel 3 aprendes Zancada prodigiosa y en nivel 5 Pasar sin rastro; siempre preparados, un lanzamiento gratuito de cada uno por descanso largo.';
    }
    if(species==='Gnomo') {
      if(choice==='Gnomo de las rocas') return 'Linaje gnomo · Gnomo de las rocas: conoces los trucos prestidigitación y reparar. Puedes emplear 10 minutos para crear un dispositivo mecánico diminuto que reproduce un efecto de prestidigitación; puedes mantener hasta tres dispositivos activos, que se desarman tras 8 horas.';
      return 'Linaje gnomo · Gnomo de los bosques: conoces el truco ilusión menor y siempre tienes Hablar con los animales preparado. Puedes lanzarlo sin espacio un número de veces igual a tu bonificador por competencia por descanso largo.';
    }
    if(species==='Tiefling') {
      if(choice==='Abisal') return 'Legado infernal · Abisal: resistencia al daño de veneno y truco rociada venenosa. En nivel 3 aprendes Rayo nauseabundo y en nivel 5 Inmovilizar persona; siempre preparados, un lanzamiento gratuito de cada uno por descanso largo.';
      if(choice==='Ctónico') return 'Legado infernal · Ctónico: resistencia al daño necrótico y truco toque helado. En nivel 3 aprendes Falsa vida y en nivel 5 Rayo debilitador; siempre preparados, un lanzamiento gratuito de cada uno por descanso largo.';
      return 'Legado infernal · Infernal: resistencia al daño de fuego y truco descarga de fuego. En nivel 3 aprendes Reprensión infernal y en nivel 5 Oscuridad; siempre preparados, un lanzamiento gratuito de cada uno por descanso largo.';
    }
    return '';
  }
  const BUILDER_CLASS_DATA: Record<string,{equipmentA:string;equipmentB:string;features:string;tool:string;weaponCount:number;cantrips:number;spells:number;slots:number;spellbook:number;specialLabel:string;specialOptions:string[]}> = {
    'Bárbaro':{equipmentA:'Hacha a dos manos, 4 hachas de mano, paquete de explorador y 15 po.',equipmentB:'75 po.',features:'Defensa sin armadura; Furia (2 usos, daño +2 y resistencia a daño contundente, cortante y perforante); Maestría con armas (elige 2 tipos de armas).',tool:'Ninguna competencia con herramientas de clase.',weaponCount:2,cantrips:0,spells:0,slots:0,spellbook:0,specialLabel:'',specialOptions:[]},
    'Bardo':{equipmentA:'Armadura de cuero, 2 dagas, un instrumento musical, paquete de artista y 19 po.',equipmentB:'90 po.',features:'Inspiración bárdica (d6; usos iguales al modificador de Carisma, mínimo 1); Lanzamiento de conjuros.',tool:'Elige 3 instrumentos musicales.',weaponCount:0,cantrips:2,spells:4,slots:2,spellbook:0,specialLabel:'Instrumentos musicales',specialOptions:[]},
    'Brujo':{equipmentA:'Armadura de cuero, hoz, 2 dagas, canalizador arcano (orbe), libro de conocimiento oculto, paquete de erudito y 15 po.',equipmentB:'100 po.',features:'Invocaciones sobrenaturales (elige 1); Magia del pacto (2 trucos, 2 conjuros preparados y 1 espacio de nivel 1).',tool:'Ninguna competencia con herramientas de clase.',weaponCount:0,cantrips:2,spells:2,slots:1,spellbook:0,specialLabel:'Invocación sobrenatural',specialOptions:['Armadura de sombras','Mente sobrenatural','Pacto de la cadena','Pacto del filo','Pacto del grimorio']},
    'Clérigo':{equipmentA:'Camisa de malla, escudo, maza, paquete de sacerdote, símbolo sagrado y 7 po.',equipmentB:'110 po.',features:'Lanzamiento de conjuros (3 trucos, 4 conjuros preparados y 2 espacios de nivel 1); Orden divina.',tool:'Ninguna competencia con herramientas de clase.',weaponCount:0,cantrips:3,spells:4,slots:2,spellbook:0,specialLabel:'Orden divina',specialOptions:['Protector','Taumaturgo']},
    'Druida':{equipmentA:'Armadura de cuero, escudo, hoz, canalizador druídico (bastón), paquete de explorador, útiles de herborista y 9 po.',equipmentB:'50 po.',features:'Lanzamiento de conjuros (2 trucos, 4 conjuros preparados y 2 espacios de nivel 1); Druídico; Orden primigenia.',tool:'Útiles de herborista.',weaponCount:0,cantrips:2,spells:4,slots:2,spellbook:0,specialLabel:'Orden primigenia',specialOptions:['Guardián','Naturalista']},
    'Explorador':{equipmentA:'Armadura de cuero tachonado, cimitarra, espada corta, arco largo, 20 flechas, aljaba, canalizador druídico (rama de muérdago), paquete de explorador y 7 po.',equipmentB:'150 po.',features:'Lanzamiento de conjuros (2 conjuros preparados y 2 espacios de nivel 1); Enemigo predilecto (Marca del cazador siempre preparada); Maestría con armas (2 tipos).',tool:'Ninguna competencia con herramientas de clase.',weaponCount:2,cantrips:0,spells:2,slots:2,spellbook:0,specialLabel:'',specialOptions:[]},
    'Guerrero':{equipmentA:'Cota de malla, espadón, mangual, 8 jabalinas, paquete de explorador de mazmorras y 4 po.',equipmentB:'Armadura de cuero tachonado, cimitarra, espada corta, arco largo, 20 flechas, aljaba, paquete de explorador de mazmorras y 11 po.',features:'Estilo de combate (elige una dote de estilo de combate); Maestría con armas (3 tipos); Tomar aliento (2 usos).',tool:'Ninguna competencia con herramientas de clase.',weaponCount:3,cantrips:0,spells:0,slots:0,spellbook:0,specialLabel:'Estilo de combate',specialOptions:['Combate con armas a dos manos','Combate con armas arrojadizas','Combate con dos armas','Combate sin armas','Defensa','Duelo','Intercepción','Lucha a ciegas','Protección','Tiro con arco']},
    'Hechicero':{equipmentA:'Lanza, 2 dagas, canalizador arcano (cristal), paquete de explorador de mazmorras y 28 po.',equipmentB:'50 po.',features:'Lanzamiento de conjuros (4 trucos, 2 conjuros preparados y 2 espacios de nivel 1); Hechicería innata.',tool:'Ninguna competencia con herramientas de clase.',weaponCount:0,cantrips:4,spells:2,slots:2,spellbook:0,specialLabel:'',specialOptions:[]},
    'Mago':{equipmentA:'2 dagas, canalizador arcano (bastón), libro de conjuros, paquete de erudito, túnica y 5 po.',equipmentB:'55 po.',features:'Lanzamiento de conjuros (3 trucos, libro con 6 conjuros de nivel 1, 4 preparados y 2 espacios); Adepto en rituales; Recuperación arcana.',tool:'Ninguna competencia con herramientas de clase.',weaponCount:0,cantrips:3,spells:4,slots:2,spellbook:6,specialLabel:'',specialOptions:[]},
    'Monje':{equipmentA:'Lanza, 5 dagas, herramientas de artesano o instrumento musical elegido, paquete de explorador y 11 po.',equipmentB:'50 po.',features:'Artes marciales; Defensa sin armadura.',tool:'Elige herramientas de artesano o un instrumento musical.',weaponCount:0,cantrips:0,spells:0,slots:0,spellbook:0,specialLabel:'',specialOptions:[]},
    'Paladín':{equipmentA:'Cota de malla, escudo, espada larga, 6 jabalinas, símbolo sagrado, paquete de sacerdote y 9 po.',equipmentB:'150 po.',features:'Imponer las manos (reserva de 5 PG); Lanzamiento de conjuros (2 conjuros preparados y 2 espacios de nivel 1); Maestría con armas (2 tipos).',tool:'Ninguna competencia con herramientas de clase.',weaponCount:2,cantrips:0,spells:2,slots:2,spellbook:0,specialLabel:'',specialOptions:[]},
    'Pícaro':{equipmentA:'Armadura de cuero, 2 dagas, espada corta, arco corto, 20 flechas, aljaba, herramientas de ladrón, paquete de ladrón y 8 po.',equipmentB:'100 po.',features:'Ataque furtivo (1d6); Jerga de ladrones y otro idioma; Maestría con armas (2 tipos); Pericia en 2 habilidades competentes.',tool:'Herramientas de ladrón.',weaponCount:2,cantrips:0,spells:0,slots:0,spellbook:0,specialLabel:'',specialOptions:[]}
  };
  const BUILDER_MUSICAL_INSTRUMENTS = ['Chirimía','Cuerno','Dulcémele','Flauta','Flauta de pan','Gaita','Laúd','Lira','Tambor','Viola'];
  const BUILDER_ARTISAN_TOOLS = ['Herramientas de albañil','Herramientas de alfarero','Herramientas de carpintero','Herramientas de curtidor','Herramientas de ebanista','Herramientas de herrero','Herramientas de manitas','Herramientas de tejedor'];
  const BUILDER_LANGUAGES = ['Abisal','Celestial','Dracónico','Druídico','Elfo','Enano','Gigante','Gnomo','Goblin','Habla de las profundidades','Infernal','Infracomún','Jerga de ladrones','Lenguaje de signos común','Mediano','Orco','Primordial','Silvano'];
  const BUILDER_STANDARD_LANGUAGES = ['Dracónico','Elfo','Enano','Gigante','Gnomo','Goblin','Lenguaje de signos común','Mediano','Orco'];
  const BUILDER_SKILL_OPTIONS = ['Acrobacias','Atletismo','Conocimiento arcano','Engaño','Historia','Interpretación','Intimidación','Investigación','Juego de manos','Medicina','Naturaleza','Perspicacia','Persuasión','Percepción','Religión','Sigilo','Supervivencia','Trato con animales'];
  const BUILDER_FEAT_TOOL_OPTIONS = [...BUILDER_ARTISAN_TOOLS,'Suministros de calígrafo','Suministros de cervecero','Suministros de pintor','Útiles de cocinero','Herramientas de ladrón','Herramientas de navegante','Útiles para falsificar','Útiles de herborista','Útiles de sanador','Útiles de envenenador','Juego','Instrumento musical'];
  function builderFeatChoiceOptions(feat:string) {
    if (feat === 'Habilidoso') return [...BUILDER_SKILL_OPTIONS,...BUILDER_FEAT_TOOL_OPTIONS];
    if (feat === 'Fabricante') return BUILDER_ARTISAN_TOOLS;
    if (feat === 'Músico') return BUILDER_MUSICAL_INSTRUMENTS;
    return [];
  }
  function builderMagicInitiateClass(feat:string) {
    return feat.includes('(Clérigo)') ? 'Clérigo' : feat.includes('(Druida)') ? 'Druida' : feat.includes('(Mago)') ? 'Mago' : '';
  }

  const BUILDER_WEAPON_MASTERY_OPTIONS = ['Alabarda','Arco corto','Arco largo','Ballesta de mano','Ballesta pesada','Ballesta ligera','Bastón','Cerbatana','Cimitarra','Daga','Dardo','Espada corta','Espada larga','Espadón','Estoque','Garrote','Garrote grande','Guja','Honda','Hacha a dos manos','Hacha de mano','Hacha de guerra','Hoz','Jabalina','Lanza','Lanza de caballería','Látigo','Lucero del alba','Mangual','Martillo de guerra','Martillo ligero','Maza','Maza a dos manos','Mosquete','Pica','Pico de guerra','Pistola','Tridente'];
  const BUILDER_SPELL_LISTS: Record<string,{cantrips:string[];level1:string[]}> = {"Bardo":{"cantrips":["Amistad","Burla dañina","Guardia de cuchillas","Ilusión menor","Impacto certero","Luces danzantes","Luz","Mano de mago","Mensaje","Prestidigitación","Reparar","Tronar","Voluta estelar"],"level1":["Caída de pluma","Curar heridas","Detectar magia","Disfrazarse","Dormir","Encantar animal","Entender idiomas","Fuego feérico","Hablar con los animales","Hechizar persona","Heroísmo","Identificar","Imagen silenciosa","Ola atronadora","Orden imperiosa","Palabra de curación","Perdición","Risa horrible de Tasha","Rociada de color","Sirviente invisible","Susurros discordantes","Texto ilusorio","Zancada prodigiosa"]},"Brujo":{"cantrips":["Amistad","Descarga sobrenatural","Fragmento mental","Guardia de cuchillas","Ilusión menor","Impacto certero","Mano de mago","Prestidigitación","Rociada venenosa","Tañido por los muertos","Toque helado","Tronar"],"level1":["Armadura de Agathys","Brazos de Hadar","Detectar magia","Entender idiomas","Hablar con los animales","Hechizar persona","Maleficio","Perdición","Protección contra el bien y el mal","Rayo de hechicería","Reprensión infernal","Retirada expeditiva","Risa horrible de Tasha","Sirviente invisible","Texto ilusorio"]},"Clérigo":{"cantrips":["Guía","Llama sagrada","Luz","Palabra de resplandor","Piedad con los moribundos","Reparar","Resistencia","Tañido por los muertos","Taumaturgia"],"level1":["Bendición","Crear o destruir agua","Curar heridas","Detectar el bien y el mal","Detectar magia","Detectar venenos y enfermedades","Escudo de fe","Infligir heridas","Orden imperiosa","Palabra de curación","Perdición","Protección contra el bien y el mal","Purificar comida y bebida","Saeta guía","Santuario"]},"Druida":{"cantrips":["Crear llama","Elementalismo","Guía","Látigo de espinas","Mensaje","Piedad con los moribundos","Reparar","Resistencia","Rociada venenosa","Saber druídico","Shillelagh","Tronar","Voluta estelar"],"level1":["Buenas bayas","Crear o destruir agua","Cuchillo de hielo","Curar heridas","Detectar magia","Detectar venenos y enfermedades","Encantar animal","Enmarañar","Fuego feérico","Hablar con los animales","Hechizar persona","Nube de oscurecimiento","Ola atronadora","Palabra de curación","Protección contra el bien y el mal","Purificar comida y bebida","Salto","Zancada prodigiosa"]},"Explorador":{"cantrips":[],"level1":["Alarma","Buenas bayas","Curar heridas","Detectar magia","Detectar venenos y enfermedades","Encantar animal","Enmarañar","Golpe apresador","Hablar con los animales","Marca del cazador","Nube de oscurecimiento","Salto","Tormenta de espinas","Zancada prodigiosa"]},"Hechicero":{"cantrips":["Agarre electrizante","Amistad","Descarga de fuego","Elementalismo","Estallido mágico","Fragmento mental","Guardia de cuchillas","Ilusión menor","Impacto certero","Luces danzantes","Luz","Mano de mago","Mensaje","Prestidigitación","Rayo de escarcha","Reparar","Rociada venenosa","Salpicadura ácida","Toque helado","Tronar"],"level1":["Armadura de mago","Caída de pluma","Cuchillo de hielo","Detectar magia","Disfrazarse","Dormir","Entender idiomas","Escudo","Falsa vida","Grasa","Hechizar persona","Imagen silenciosa","Manos ardientes","Nube de oscurecimiento","Ola atronadora","Orbe cromático","Proyectil mágico","Rayo de hechicería","Rayo nauseabundo","Retirada expeditiva","Rociada de color","Salto"]},"Mago":{"cantrips":["Agarre electrizante","Amistad","Descarga de fuego","Elementalismo","Fragmento mental","Guardia de cuchillas","Ilusión menor","Impacto certero","Luces danzantes","Luz","Mano de mago","Mensaje","Prestidigitación","Rayo de escarcha","Reparar","Rociada venenosa","Salpicadura ácida","Tañido por los muertos","Toque helado","Tronar"],"level1":["Alarma","Armadura de mago","Caída de pluma","Cuchillo de hielo","Detectar magia","Disco flotante de Tenser","Disfrazarse","Dormir","Encontrar familiar","Entender idiomas","Escudo","Falsa vida","Grasa","Hechizar persona","Identificar","Imagen silenciosa","Manos ardientes","Nube de oscurecimiento","Ola atronadora","Orbe cromático","Protección contra el bien y el mal","Proyectil mágico","Rayo de hechicería","Rayo nauseabundo","Retirada expeditiva","Risa horrible de Tasha","Rociada de color","Salto","Sirviente invisible","Texto ilusorio","Zancada prodigiosa"]},"Paladín":{"cantrips":[],"level1":["Bendición","Castigo abrasador","Castigo atronador","Castigo divino","Castigo furioso","Curar heridas","Detectar el bien y el mal","Detectar magia","Detectar venenos y enfermedades","Duelo forzado","Escudo de fe","Favor divino","Heroísmo","Orden imperiosa","Protección contra el bien y el mal","Purificar comida y bebida"]}};
  const BUILDER_TOME_CANTRIPS = [...new Set(Object.values(BUILDER_SPELL_LISTS).flatMap(list => list.cantrips))].sort();
  const BUILDER_TOME_RITUALS = ['Alarma','Detectar magia','Detectar venenos y enfermedades','Entender idiomas','Encontrar familiar','Identificar','Purificar comida y bebida','Sirviente invisible','Texto ilusorio','Disco flotante de Tenser'];
  const BUILDER_HIT_DIE: Record<string,number> = {'Bárbaro':12,'Guerrero':10,'Paladín':10,'Explorador':10,'Bardo':8,'Brujo':8,'Clérigo':8,'Druida':8,'Hechicero':6,'Mago':6,'Monje':8,'Pícaro':8};
  const BUILDER_SAVES: Record<string,string> = {
    'Bárbaro':'Fuerza y Constitución','Bardo':'Destreza y Carisma','Brujo':'Sabiduría y Carisma',
    'Clérigo':'Sabiduría y Carisma','Druida':'Inteligencia y Sabiduría','Explorador':'Fuerza y Destreza',
    'Guerrero':'Fuerza y Constitución','Hechicero':'Constitución y Carisma','Mago':'Inteligencia y Sabiduría',
    'Monje':'Fuerza y Destreza','Paladín':'Sabiduría y Carisma','Pícaro':'Destreza e Inteligencia'
  };
  const BUILDER_WEAPON_PROFICIENCIES: Record<string,string> = {
    'Bárbaro':'Armas sencillas y marciales',
    'Bardo':'Armas sencillas; ballesta de mano, espada larga, estoque y espada corta',
    'Brujo':'Armas sencillas',
    'Clérigo':'Armas sencillas',
    'Druida':'Armas sencillas',
    'Explorador':'Armas sencillas y marciales',
    'Guerrero':'Armas sencillas y marciales',
    'Hechicero':'Daga, dardo, honda, bastón y ballesta ligera',
    'Mago':'Daga, dardo, honda, bastón y ballesta ligera',
    'Monje':'Armas sencillas y armas marciales cuerpo a cuerpo ligeras',
    'Paladín':'Armas sencillas y marciales',
    'Pícaro':'Armas sencillas; armas marciales sutiles o ligeras; ballesta de mano, espada larga, estoque y espada corta'
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
    if (['Habilidoso','Fabricante','Músico'].includes(feat)) return choices.length === 3;
    if (builderMagicInitiateClass(feat)) return cantrips.length === 2 && Boolean(spell);
    return true;
  }
  function builderCanFinish() {
    const cls = BUILDER_CLASS_DATA[builderData.className];
    const skillsOk = builderData.classSkillChoices.filter(Boolean).length === BUILDER_CLASS_SKILLS[builderData.className].count;
    const masteriesOk = builderData.weaponMasteries.length === cls.weaponCount;
    const expectedTools = builderData.className === 'Bardo' ? 3 : builderData.className === 'Monje' ? 1 : 0;
    const classToolsOk = builderData.classToolsChoices.length === expectedTools;
    const backgroundToolOk = !BUILDER_BACKGROUND_TOOL_OPTIONS[builderData.background] || Boolean(builderData.backgroundToolChoice);
    const expertiseOk = builderData.className !== 'Pícaro' || (builderData.classExpertise.length === 2 && builderData.classExpertise.every(skill => [...BUILDER_BACKGROUND_DATA[builderData.background].skills,...builderData.classSkillChoices,builderData.speciesSkill,...builderData.backgroundFeatChoices.filter(choice => BUILDER_SKILL_OPTIONS.includes(choice)),...builderData.speciesFeatChoices.filter(choice => BUILDER_SKILL_OPTIONS.includes(choice))].includes(skill)));
    const specialOk = cls.specialOptions.length === 0 || Boolean(builderData.classSpecialChoice);
    const bonusCantrip = (builderData.className === 'Clérigo' && builderData.classSpecialChoice === 'Taumaturgo') || (builderData.className === 'Druida' && builderData.classSpecialChoice === 'Naturalista') ? 1 : 0;
    const cantripsOk = builderData.selectedCantrips.length === cls.cantrips + bonusCantrip;
    const tomeOk = builderData.className !== 'Brujo' || builderData.classSpecialChoice !== 'Pacto del grimorio' || (builderData.warlockTomeCantrips.length === 3 && builderData.warlockTomeRituals.length === 2);
    const spellsOk = builderData.selectedSpells.length === cls.spells;
    const bookOk = cls.spellbook === 0 || builderData.wizardSpellbook.length === cls.spellbook;
    const abilityValues = Object.values(builderData.abilities).map(Number);
    const sortedAbilities = [...abilityValues].sort((a,b)=>b-a);
    const standardOk = JSON.stringify(sortedAbilities) === JSON.stringify([15,14,13,12,10,8]);
    const pointBuyOk = abilityValues.every(value=>value>=8 && value<=15) && builderPointCost() === 27;
    const rolledOk = builderRolledScores.length === 6 && JSON.stringify(sortedAbilities) === JSON.stringify([...builderRolledScores].sort((a,b)=>b-a));
    const freeOk = BUILDER_ABILITY_NAMES.every(name => Number.isInteger(Number(builderData.abilities[name])) && Number(builderData.abilities[name]) >= 1 && Number(builderData.abilities[name]) <= 20);
    const abilitiesOk = builderData.method === 'standard' ? standardOk : builderData.method === 'pointBuy' ? pointBuyOk : builderData.method === 'rolled' ? rolledOk : builderData.method === 'free' ? freeOk : false;
    const speciesChoiceOk = BUILDER_SPECIES_CHOICES[builderData.species].length === 0 || Boolean(builderData.speciesChoice);
    const speciesSkillOk = !['Elfo','Humano'].includes(builderData.species) || (Boolean(builderData.speciesSkill) && !BUILDER_BACKGROUND_DATA[builderData.background].skills.includes(builderData.speciesSkill));
    const speciesMagicAbilityOk = !['Elfo','Gnomo','Tiefling'].includes(builderData.species) || Boolean(builderData.speciesMagicAbility);
    const speciesSizeOk = !['Aasimar','Humano','Tiefling'].includes(builderData.species) || Boolean(builderData.speciesSize);
    const languagesOk = builderData.languages.length === 2 && (builderData.className !== 'Pícaro' || (Boolean(builderData.rogueLanguage) && !builderData.languages.includes('Jerga de ladrones')));
    const humanFeatOk = builderData.species !== 'Humano' || (Boolean(builderData.speciesExtraFeat) && builderOriginFeatChoicesOk(builderData.speciesExtraFeat,builderData.speciesFeatChoices,builderData.speciesMagicCantrips,builderData.speciesMagicSpell));
    const backgroundFeatOk = builderOriginFeatChoicesOk(BUILDER_BACKGROUND_DATA[builderData.background].feat,builderData.backgroundFeatChoices,builderData.backgroundMagicCantrips,builderData.backgroundMagicSpell);
    return skillsOk && masteriesOk && classToolsOk && backgroundToolOk && expertiseOk && specialOk && cantripsOk && tomeOk && spellsOk && bookOk && abilitiesOk && speciesChoiceOk && speciesSkillOk && speciesMagicAbilityOk && speciesSizeOk && humanFeatOk && backgroundFeatOk && languagesOk;
  }
  function builderNext() { if (builderStep < 5) builderStep += 1; }
  function builderBack() { if (builderStep > 0) builderStep -= 1; }
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
    if(profText.includes('armas marciales sutiles o ligeras')) return profile.category==='martial'&&(/sutil|ligera/i.test(profile.properties)||['ballesta de mano','espada larga','estoque','espada corta'].includes(n));
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
    const spellText=[
      getCharacterStat(target,'CONJUROS','Trucos'),
      getCharacterStat(target,'CONJUROS','Trucos de clase'),
      getCharacterStat(target,'CONJUROS','Conjuros preparados de clase'),
      getCharacterStat(target,'CONJUROS','Libro de conjuros'),
      getCharacterStat(target,'CONJUROS','Conjuros de especie'),
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
    const classChoices = [b.classSpecialChoice ? classData.specialLabel + ': ' + b.classSpecialChoice : '', b.weaponMasteries.length ? 'Maestrías con armas: ' + b.weaponMasteries.join(', ') : '', b.classToolsChoices.length ? 'Competencias de herramientas: ' + b.classToolsChoices.join(', ') : '', b.className === 'Brujo' && b.classSpecialChoice === 'Pacto del grimorio' ? 'Trucos del grimorio: ' + b.warlockTomeCantrips.join(', ') + '; rituales: ' + b.warlockTomeRituals.join(', ') : ''].filter(Boolean).join('\n');
    const speciesChoices = [b.speciesChoice ? 'Elección de especie: ' + b.speciesChoice : '',builderSpeciesChoiceDescription(b.species,b.speciesChoice), ['Elfo','Gnomo','Tiefling'].includes(b.species) ? 'Aptitud mágica de linaje: ' + b.speciesMagicAbility : '', ['Aasimar','Humano','Tiefling'].includes(b.species) ? 'Tamaño: ' + b.speciesSize : ''].filter(Boolean).join('; ');
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
      general('COMPETENCIAS',['Habilidades','Herramientas','Armaduras','Armas','Idiomas']),
      general('RASGOS Y DOTES',['Rasgos de clase','Rasgos de especie','Dote de origen','Otros rasgos','Formas salvajes conocidas']),
      general('CONJUROS',['Aptitud mágica','CD de salvación','Ataque de conjuro','Trucos','Conjuros de nivel 1','Espacios de conjuro','Trucos máximos','Conjuros preparados máximos','Espacios por nivel','Trucos de clase','Conjuros preparados de clase','Libro de conjuros','Conjuros de especie','Aptitud mágica de especie','CD de especie','Ataque de conjuro de especie']),
      general('EQUIPO',['Equipo inicial','Monedas']),
      general('HISTORIA',['Apariencia','Rasgos de personalidad','Ideal','Vínculo','Defecto','Historia','Notas']),
      general('PROGRESIÓN',['Nivel de clase','Rasgos de clase obtenidos',...Object.keys((LEVEL_PROGRESSION as any).classes?.[b.className]?.rows?.[0]?.resources || {})]),
      general('HABILIDADES',BUILDER_SKILL_OPTIONS),
      general('SALVACIONES',BUILDER_ABILITY_NAMES),
      general('DETALLES DEL TRASFONDO',['Aumentos de característica permitidos','Habilidades','Herramienta','Dote de origen','Equipo del trasfondo']),
      general('DETALLES DE ESPECIE',['Elección de especie','Rasgos de especie','Competencia adicional','Elecciones mágicas','Tamaño']),
      general('INVENTARIO',['Equipo de clase','Equipo de trasfondo','Equipo adicional']),
      general('ATAQUES',['Armas incluidas en el equipo','Maestrías con armas','Competencia con armas','Perfiles de ataque']),
      general('DETALLE DE CONJUROS',['Conjuros y descripciones'])
    ];
    const put = (pair:number,index:number,value:string) => { pairs[pair].values.stats[index].value = value; };
    put(0,0,b.name || 'Personaje sin nombre'); put(0,1,b.className); put(0,2,'No disponible (se elige en nivel 3)'); put(0,3,'1'); put(0,4,b.species); put(0,5,b.background); put(0,6,b.alignment); put(0,7,'0 PX'); put(0,8,b.player || '—');
    BUILDER_ABILITY_NAMES.forEach((a,i)=>put(1,i,String(finalAbilities[a])+' ('+mod(Number(finalAbilities[a]))+')'));
    put(2,0,String(Math.max(1,hp))+' PG'); put(2,1,String(Math.max(1,hp))+' PG'); put(2,2,'1d'+(BUILDER_HIT_DIE[b.className] || 8)); put(2,3,String(builderStartingAC())+' (según equipo inicial y rasgos)'); put(2,8,builderStartingACFormula()); put(2,4,(builderModifier(Number(finalAbilities.Destreza)) + ([b.feat,b.species === 'Humano' ? b.speciesExtraFeat : ''].includes('Alerta') ? 2 : 0) >= 0 ? '+' : '') + (builderModifier(Number(finalAbilities.Destreza)) + ([b.feat,b.species === 'Humano' ? b.speciesExtraFeat : ''].includes('Alerta') ? 2 : 0))); put(2,5,(b.species === 'Goliat' || (b.species === 'Elfo' && b.speciesChoice === 'Elfo de los bosques') ? '35 pies' : '30 pies')); put(2,6,proficiency); put(2,7,BUILDER_SAVES[b.className] || '—');
    const allFeatChoices = [...b.backgroundFeatChoices, ...(b.species === 'Humano' ? b.speciesFeatChoices : [])];
    const featSkills = allFeatChoices.filter(choice => BUILDER_SKILL_OPTIONS.includes(choice));
    const featTools = allFeatChoices.filter(choice => !BUILDER_SKILL_OPTIONS.includes(choice));
    put(3,0,[...BUILDER_BACKGROUND_DATA[b.background].skills, ...b.classSkillChoices.filter(Boolean), b.speciesSkill, ...featSkills, b.skills, b.classExpertise.length ? 'Pericia: ' + b.classExpertise.join(', ') : ''].filter(Boolean).join('; ')); put(3,1,[BUILDER_BACKGROUND_DATA[b.background].tool.replace(/ a elección|Un tipo de /g,''), b.backgroundToolChoice, classData.tool, ...b.classToolsChoices, ...featTools, b.tools].filter(x=>x && x !== 'Ninguna competencia con herramientas de clase.').join('; ') || '—'); put(3,2,BUILDER_ARMOR[b.className] || 'Según clase'); put(3,3,BUILDER_WEAPON_PROFICIENCIES[b.className] || 'Consultar clase'); put(3,4,['Común',...b.languages,b.className === 'Pícaro' ? 'Jerga de ladrones' : '',b.className === 'Pícaro' ? b.rogueLanguage : '', b.className === 'Druida' ? 'Druídico' : ''].filter(Boolean).join('; '));
    put(4,0,features); put(4,1,[BUILDER_SPECIES_TRAITS[b.species] || '',builderSpeciesChoiceDescription(b.species,b.speciesChoice)].filter(Boolean).join('\n\n')); put(4,2,[b.feat, b.backgroundFeatChoices.length ? 'Opciones de dote: ' + b.backgroundFeatChoices.join(', ') : '', builderMagicInitiateClass(b.feat) ? 'Iniciado en la magia (' + builderMagicInitiateClass(b.feat) + '): trucos ' + b.backgroundMagicCantrips.join(', ') + '; conjuro ' + b.backgroundMagicSpell + '; aptitud ' + b.backgroundMagicAbility : '', b.species === 'Humano' ? 'Dote adicional: ' + b.speciesExtraFeat : '', b.speciesFeatChoices.length ? 'Opciones de dote adicional: ' + b.speciesFeatChoices.join(', ') : '', builderMagicInitiateClass(b.speciesExtraFeat) && b.species === 'Humano' ? 'Iniciado en la magia adicional: trucos ' + b.speciesMagicCantrips.join(', ') + '; conjuro ' + b.speciesMagicSpell + '; aptitud ' + b.speciesFeatMagicAbility : ''].filter(Boolean).join('; ')); put(4,3,b.traits || '—');
    const magicAbility = BUILDER_MAGIC_ABILITY[b.className]; const magicMod = magicAbility ? builderModifier(Number(finalAbilities[magicAbility])) : 0; const classLevelOne = (LEVEL_PROGRESSION as any).classes?.[b.className]?.rows?.[0]; const classResources = classLevelOne?.resources || {}; const classSlots = Object.entries(classResources).filter(([key,value]:any)=>/^Espacios nivel|^Espacios de conjuro$|^Nivel de los espacios$/.test(key) && value && value!=='—').map(([key,value]:any)=>key+': '+value).join(' · '); put(5,0,magicAbility || 'No tiene lanzamiento de conjuros a nivel 1'); put(5,1,magicAbility ? String(8 + magicMod + 2) : '—'); put(5,2,magicAbility ? (magicMod >= 0 ? '+' : '') + (magicMod + 2) : '—'); put(5,3,[...b.selectedCantrips, ...speciesCantrips, ...b.backgroundMagicCantrips, ...(b.species === 'Humano' ? b.speciesMagicCantrips : []), ...b.warlockTomeCantrips].join(', ') || (classData.cantrips ? 'Faltan por elegir ' + classData.cantrips + ' trucos' : 'No obtiene trucos de clase a nivel 1')); put(5,4,(b.className === 'Mago' ? 'Libro: ' + b.wizardSpellbook.join(', ') + '. Preparados: ' : '') + ([...b.selectedSpells, b.backgroundMagicSpell, ...(b.species === 'Humano' ? [b.speciesMagicSpell] : []), ...(b.className === 'Explorador' ? ['Marca del cazador (siempre preparado)'] : []), ...(b.species === 'Gnomo' && b.speciesChoice === 'Gnomo de los bosques' ? ['Hablar con los animales (siempre preparado)'] : []), ...(b.className === 'Brujo' && b.classSpecialChoice === 'Pacto del grimorio' ? b.warlockTomeRituals : []), ...(b.className === 'Brujo' && b.classSpecialChoice === 'Pacto de la cadena' ? ['Encontrar familiar (Pacto de la cadena)'] : [])].filter(Boolean).join(', ') || (classData.spells ? 'Faltan por elegir ' + classData.spells + ' conjuros' : 'No tiene conjuros de clase a nivel 1'))); put(5,5,classSlots || '—'); put(5,6,classResources['Trucos'] || '—'); put(5,7,classResources['Conjuros preparados'] || '—'); put(5,8,classSlots || '—');
    put(5,9,b.selectedCantrips.join(', ')); put(5,10,b.selectedSpells.join(', ')); put(5,11,b.className==='Mago'?b.wizardSpellbook.join(', '):''); put(5,12,''); put(5,13,b.species==='Aasimar'?'Carisma':(['Elfo','Gnomo','Tiefling'].includes(b.species)?b.speciesMagicAbility:''));
    const backgroundEquipmentText=b.backgroundEquipment==='B'?'50 po':BUILDER_BACKGROUND_DATA[b.background].equipmentA;
    put(6,0,[classEquipment, classEquipmentDetail, b.backgroundEquipment === 'B' ? 'Trasfondo: 50 po en lugar del paquete A.' : BUILDER_BACKGROUND_DATA[b.background].equipmentA, b.equipment].filter(Boolean).join(' '));
    const goldTotal=[classEquipment,backgroundEquipmentText].join(' ').match(/\d+\s*po/gi)?.reduce((sum:number,coin:string)=>sum+Number(coin.match(/\d+/)?.[0]||0),0) || 0;
    put(6,1,goldTotal+' po (monedas iniciales de ambos paquetes)');
    put(7,0,''); put(7,1,''); put(7,2,''); put(7,3,''); put(7,4,''); put(7,5,''); put(7,6,b.notes || '');
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
    put(speciesIndex,1,[BUILDER_SPECIES_TRAITS[b.species]||'',builderSpeciesChoiceDescription(b.species,b.speciesChoice)].filter(Boolean).join('\n\n')||'—');
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
    const levelOneFeatureDetails=getClassFeaturesAtLevel(b.className,1).map((feature:any)=>feature.name+'\n'+feature.description).join('\n\n');
    put(progressionIndex,1,levelOneFeatureDetails || classLevelOne?.features || classData.features || '—');
    put(4,0,[levelOneFeatureDetails,classChoices,BUILDER_SPECIES_TRAITS[b.species]||'',speciesChoices,b.traits].filter(Boolean).join('\n\n'));
    Object.entries(classResources).forEach(([key,value],i)=>put(progressionIndex,i+2,String(value)));
    const spellNames=[...b.selectedCantrips,...speciesCantrips,...b.backgroundMagicCantrips,...(b.species==='Humano'?b.speciesMagicCantrips:[]),...b.warlockTomeCantrips,...b.selectedSpells,...b.wizardSpellbook,b.backgroundMagicSpell,...(b.species==='Humano'?[b.speciesMagicSpell]:[]),...(b.className==='Explorador'?['Marca del cazador']:[]),...(b.className==='Brujo'&&b.classSpecialChoice==='Pacto del grimorio'?b.warlockTomeRituals:[])].filter(Boolean);
    put(detailSpellsIndex,0,describeSpells(spellNames));
    const result={id:Date.now(),name:b.name || 'Personaje sin nombre',notes:'Personaje de nivel 1 creado desde el asistente del GM. La ficha conserva elecciones, progresión y descripciones disponibles en los datos del Manual del Jugador 2024.',sections:pairs.flatMap(p=>[p.heading,p.values])} as RawSheet;
    refreshDerivedCharacterSheet(result);
    return result;
  }
  function finishBuilder() {
    builderPreview = buildLevelOneSheet();
    builderStep = 6;
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
    file.text().then((contents) => {
      sheet = JSON.parse(contents) as RawSheet;
      localStorage.setItem('forja-raw-character', JSON.stringify(sheet));
      importOpen = false;
      notice = 'Ficha importada.';
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
    if(species==='Aasimar' && level===3) result.features.push({name:'Revelación celestial',description:'A partir del nivel 3, como acción adicional te transformas durante 1 minuto o hasta que pongas fin a la transformación. Una vez por turno, cuando dañes a un objetivo con un ataque o conjuro, infliges daño adicional igual a tu bonificador por competencia: radiante con Alas celestiales o Fulgor interior, necrótico con Mortaja necrótica. Alas celestiales te da velocidad volando igual a tu velocidad; Fulgor interior emite luz y daña con luz radiante a criaturas cercanas al final de tus turnos; Mortaja necrótica puede asustar a criaturas cercanas con una salvación de Carisma. Recuperas el uso tras un descanso largo.'});
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
  function isValidWildShapeForm(name:string): boolean {
    const monster=MONSTERS.find((item:any)=>normalizeLevelText(item.name)===normalizeLevelText(name));
    if(!monster) return false;
    const lines=String(monster.statBlock||'').split('\n');
    const typeLine=lines.find((line:string)=>/^(Tiny|Small|Medium|Large|Huge|Gargantuan)\b/.test(line)&&/\bBeast\b/.test(line));
    const speedLine=lines.find((line:string)=>/^Speed\b/i.test(line))||'';
    const cr=String(monster.cr||'').split(' ')[0];
    const parts=cr.split('/').map(Number);
    const value=parts.length===2?parts[0]/parts[1]:parts[0];
    return Boolean(typeLine) && Number.isFinite(value) && value<=0.25 && !/\bFly\b/i.test(speedLine);
  }
  function openLevelUp(entry: RoomEntry) {
    levelUpEntry = entry; levelUpDecision = '';
    levelUpClassCantrips=getCharacterStat(entry.sheet,'CONJUROS','Trucos de clase') || '';
    levelUpClassSpells=getCharacterStat(entry.sheet,'CONJUROS','Conjuros preparados de clase') || '';
    if(!levelUpClassSpells && getCharacterStat(entry.sheet,'PERSONAJE','Clase')==='Mago') levelUpClassSpells=(String(getCharacterStat(entry.sheet,'CONJUROS','Conjuros de nivel 1')).match(/Preparados:\s*([^.]*)/i)||[])[1]||'';
    levelUpWizardBookAdditions=''; levelUpExpertise=''; levelUpNewSkill=''; levelUpLanguages=''; levelUpWildShapeForms=getCharacterStat(entry.sheet,'RASGOS Y DOTES','Formas salvajes conocidas') || '';
    levelUpWeaponMasteries=getCharacterStat(entry.sheet,'ATAQUES','Maestrías con armas') || '';
    const savedSubclass=getCharacterStat(entry.sheet,'PERSONAJE','Subclase');
    levelUpSubclass = getSubclassData(getCharacterStat(entry.sheet,'PERSONAJE','Clase'),savedSubclass) ? savedSubclass : '';
    levelUpSubclassVariant = getCharacterStat(entry.sheet,'PERSONAJE','Opción de subclase');
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
      if(subclassCantripTarget>0 && (isNewSubclass || subclassCantripTarget>oldSubclassCantrips) && subclassCantripNames.length!==subclassCantripTarget) { notice='La subclase requiere '+subclassCantripTarget+' trucos en total. Introduce la lista completa.'; return; }
      if((isNewSubclass || targetSubclassPrepared>oldSubclassPrepared) && subclassSpellNames.length!==targetSubclassPrepared) { notice='La subclase requiere '+targetSubclassPrepared+' conjuros en total. Introduce la lista completa.'; return; }
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
    const oldClassCantripCount=splitChoiceList(getCharacterStat(original,'CONJUROS','Trucos de clase')).length || getCharacterNumber(original,'CONJUROS','Trucos máximos',0);
    const oldClassPreparedCount=getCharacterNumber(original,'CONJUROS','Conjuros preparados máximos',0);
    const maxClassSpellLevel=highestSpellLevel(classSpellResourcesForLevel);
    if(classCastingAbility && Number.isFinite(classCantripTarget) && classCantripTarget>oldClassCantripCount && classCantripNames.length!==classCantripTarget) { notice='Debes registrar los '+classCantripTarget+' trucos de clase que conoces, separados por comas.'; return; }
    if(classCastingAbility && Number.isFinite(classPreparedTarget) && classPreparedTarget>oldClassPreparedCount && classSpellNames.length!==classPreparedTarget) { notice='Debes registrar los '+classPreparedTarget+' conjuros de clase preparados/conocidos, separados por comas.'; return; }
    if(classCastingAbility && classCantripNames.length && classCantripNames.some(name=>!isValidClassSpell(name,className,0,0))) { notice='Hay trucos que no pertenecen a la lista de '+className+'.'; return; }
    if(classCastingAbility && classSpellNames.length && classSpellNames.some(name=>!(className==='Bardo' && nextLevel>=10 ? Boolean(getSpellRecord(name)) && getSpellRecord(name)!.level<=maxClassSpellLevel : isValidClassSpell(name,className,maxClassSpellLevel)))) { notice='Hay conjuros que no pertenecen a la lista permitida o superan el nivel de espacio disponible.'; return; }
    const oldBookText=getCharacterStat(original,'CONJUROS','Libro de conjuros') || (String(getCharacterStat(original,'CONJUROS','Conjuros de nivel 1')).match(/Libro:\s*([^.]*)/i)||[])[1] || '';
    const currentWizardBook=splitChoiceList(oldBookText);
    const wizardBookAdditions=splitChoiceList(levelUpWizardBookAdditions);
    if(className==='Mago') {
      if(wizardBookAdditions.length!==2) { notice='El mago debe añadir exactamente dos conjuros a su libro en cada subida de nivel.'; return; }
      if(wizardBookAdditions.some(name=>!isValidClassSpell(name,'Mago',maxClassSpellLevel)||getSpellRecord(name)?.level===0)) { notice='Los dos conjuros añadidos al libro deben ser conjuros de mago de nivel 1 o superior y no superar el nivel de espacio disponible.'; return; }
      const availableBook=[...currentWizardBook,...wizardBookAdditions].map(name=>normalizeLevelText(name));
      if(classSpellNames.some(name=>!availableBook.includes(normalizeLevelText(name)))) { notice='Todos los conjuros preparados del mago deben estar en su libro de conjuros.'; return; }
    }

    const nextClassFeatures=getClassFeaturesAtLevel(className,nextLevel);
    const nextFeatureDescription=nextClassFeatures.map((feature:any)=>feature.description||'').join(' ');
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
    if(needsNewSkill && (!levelUpNewSkill || !(BUILDER_CLASS_SKILLS[className]?.options||BUILDER_SKILL_OPTIONS).some((skill:string)=>normalizeLevelText(skill)===normalizeLevelText(levelUpNewSkill)) || proficientSkills.some(skill=>normalizeLevelText(skill)===normalizeLevelText(levelUpNewSkill)))) { notice='Elige una habilidad válida de la lista de '+className+' en la que aún no tengas competencia.'; return; }
    const needsNewLanguages=/idiomas conoces dos idiomas/.test(normalizeLevelText(nextFeatureDescription));
    const languageChoices=splitChoiceList(levelUpLanguages);
    const currentLanguages=splitChoiceList(getCharacterStat(original,'COMPETENCIAS','Idiomas'));
    if(needsNewLanguages && (languageChoices.length!==2 || new Set(languageChoices.map(x=>normalizeLevelText(x))).size!==2 || languageChoices.some(name=>!BUILDER_LANGUAGES.some(option=>normalizeLevelText(option)===normalizeLevelText(name)) || currentLanguages.some(old=>normalizeLevelText(old)===normalizeLevelText(name))))) { notice='Explorador hábil requiere dos idiomas nuevos y distintos de las listas del manual.'; return; }
    const needsWildShapeForms=className==='Druida' && nextClassFeatures.some((feature:any)=>normalizeLevelText(feature.description||'').includes('conoces cuatro formas de bestia'));
    const wildShapeForms=splitChoiceList(levelUpWildShapeForms);
    if(needsWildShapeForms && (wildShapeForms.length!==4 || new Set(wildShapeForms.map(x=>normalizeLevelText(x))).size!==4 || wildShapeForms.some(name=>!isValidWildShapeForm(name)))) { notice='Forma salvaje requiere cuatro bestias distintas de VD 1/4 o inferior y sin velocidad volando, según el manual de monstruos.'; return; }
    const masteryResource=Object.entries(row.resources||{}).find(([key])=>normalizeLevelText(key).includes('maestria con armas'));
    const targetMasteries=masteryResource?Number(masteryResource[1]):0;
    const masteryChoices=splitChoiceList(levelUpWeaponMasteries);
    const oldMasteryCount=splitChoiceList(getCharacterStat(original,'ATAQUES','Maestrías con armas')).length;
    if(targetMasteries>oldMasteryCount && (masteryChoices.length!==targetMasteries || masteryChoices.some(name=>!BUILDER_WEAPON_MASTERY_OPTIONS.some((option:string)=>normalizeLevelText(option)===normalizeLevelText(name))))) { notice='Debes registrar exactamente '+targetMasteries+' maestrías con armas válidas.'; return; }
    if ((needsEpicFeat || (needsASI && levelUpAsiMode === 'feat')) && !levelUpFeat.trim()) { notice = 'Indica el nombre de la dote elegida.'; return; }
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
    hpGain=Math.max(1,hpGain+conMod+dwarfBonus+toughBonus);

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
    if (levelUpSubclassVariant) setCharacterStat(updated,'PERSONAJE','Opción de subclase',levelUpSubclassVariant);

    if (needsASI && levelUpAsiMode==='asi') {
      for (const [ability,inc] of [[levelUpAbility1,Number(levelUpIncrease1)],[levelUpAbility2,Number(levelUpIncrease2)]] as [string,number][]) {
        if (!inc) continue;
        const value=getCharacterNumber(updated,'ATRIBUTOS',ability,10);
        setCharacterStat(updated,'ATRIBUTOS',ability,formatAbilityScore(value+inc));
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
    if (levelUpFeat.trim() && (needsEpicFeat || (needsASI && levelUpAsiMode==='feat'))) {
      const previous=getCharacterStat(updated,'RASGOS Y DOTES','Dotes adicionales');
      setCharacterStat(updated,'RASGOS Y DOTES','Dotes adicionales',[previous,levelUpFeat.trim()].filter(Boolean).join('; '));
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
          const newBook=[...currentWizardBook,...wizardBookAdditions];
          setCharacterStat(updated,'CONJUROS','Libro de conjuros',newBook.join(', '));
          setCharacterStat(updated,'CONJUROS','Conjuros de nivel 1','Libro: '+newBook.join(', ')+'. Preparados: '+[...classSpellNames,...otherSpells].join(', '));
        } else {
          setCharacterStat(updated,'CONJUROS','Conjuros de nivel 1',[...classSpellNames,...otherSpells].join(', '));
        }
      } else if(className==='Mago' && wizardBookAdditions.length) {
        setCharacterStat(updated,'CONJUROS','Libro de conjuros',[...currentWizardBook,...wizardBookAdditions].join(', '));
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
    const record='Nivel '+nextLevel+': '+features.join(', ')+(subclassFeatureNames.length?' · '+formatSubclassName(subclass?.key || '')+': '+subclassFeatureNames.join(', '):'')+(needsASI?(levelUpAsiMode==='feat'?' · Dote: '+levelUpFeat.trim():' · Mejora: '+levelUpAbility1+' +'+levelUpIncrease1+(Number(levelUpIncrease2)?', '+levelUpAbility2+' +'+levelUpIncrease2:'')):'')+(needsEpicFeat?' · Don épico: '+levelUpFeat.trim():'')+(needsExpertise?' · Pericia: '+expertiseChoices.join(', '):'')+(needsNewSkill?' · Competencia: '+levelUpNewSkill:'')+(needsNewLanguages?' · Idiomas: '+languageChoices.join(', '):'')+(needsWildShapeForms?' · Formas salvajes: '+wildShapeForms.join(', '):'')+(targetMasteries>oldMasteryCount?' · Maestrías con armas: '+masteryChoices.join(', '):'')+(levelUpDecision.trim()?' · '+levelUpDecision.trim():'');
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
    if (/\b19\b.*recurso|recurso/.test(n)) return 'Ocultar';
    if (/conjuro|hechizo|spell|magia/.test(n)) return 'Conjuros';
    if (/historia|personalidad|apariencia|trasfondo/.test(n)) return 'Datos';
    if (/atributo|ability/.test(n)) return 'Datos';
    if (/tirada|roll|dado/.test(n)) return 'Tiradas';
    if (/equipo|inventario|objeto/.test(n)) return 'Equipo';
    if (/salvacion|habilidad|competencia|skill|saving throw|proficien/.test(n)) return 'Competencias';
    if (/combate|ataque|rasgo|dote|caracteristica de clase|especie|racial|weapon|armor/.test(n)) return 'Combate';
    return 'Datos';
  }

  function visiblePairs(sections: RawSection[] = [], tab = activeTab) {
    return sectionPairs(sections).filter(pair => sectionTab(String(pair.heading.name || '')) === tab);
  }

  function sectionClass(name = '') {
    const n = name.toLocaleLowerCase();
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
      return [{ playerId: p.id, playerName: p.name || payload.playerName || 'Jugador', sheet: payload.character as RawSheet }];
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
      sheet = payload.character as RawSheet;
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
      const stored = localStorage.getItem('forja-raw-character');
      if (stored) sheet = JSON.parse(stored) as RawSheet;
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
        await restoreOwnSheet();
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
                      {#each sectionPairs(entry.sheet?.sections || []).filter(pair => sectionTab(String(pair.heading.name || '')) !== 'Ocultar') as pair}
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
                {#if Number(getNextLevelRow(levelUpEntry)?.resources?.['Trucos']) > getCharacterNumber(levelUpEntry.sheet,'CONJUROS','Trucos máximos',0)}
                  <label>Trucos de clase conocidos (lista completa)<textarea bind:value={levelUpClassCantrips} rows="2" placeholder="Escribe todos los trucos de clase conocidos, separados por comas" /></label>
                {/if}
                {#if Number(getNextLevelRow(levelUpEntry)?.resources?.['Conjuros preparados']) > getCharacterNumber(levelUpEntry.sheet,'CONJUROS','Conjuros preparados máximos',0)}
                  <label>Conjuros de clase preparados/conocidos (lista completa)<textarea bind:value={levelUpClassSpells} rows="2" placeholder="Escribe la lista completa de conjuros de clase" /></label>
                {/if}
                {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Mago'}
                  <label>Dos conjuros nuevos para el libro del mago<input bind:value={levelUpWizardBookAdditions} placeholder="Dos conjuros separados por comas" /></label>
                {/if}
              {/if}
              {#if getClassFeaturesAtLevel(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase'),Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).some((feature)=>/ganas competencia en otra habilidad|ganas competencia en una habilidad|obtienes competencia en una habilidad/.test(normalizeLevelText(feature.description)))}
                <label>Nueva competencia en habilidad<input bind:value={levelUpNewSkill} placeholder="Elige una habilidad de la lista de tu clase" /></label>
              {/if}
              {#if getClassFeaturesAtLevel(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase'),Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).some((feature)=>normalizeLevelText(feature.name).includes('pericia') || /ganas pericia/.test(normalizeLevelText(feature.description))) }
                <label>Habilidades que obtienen Pericia (elige {getClassFeaturesAtLevel(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase'),Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).some((feature)=>normalizeLevelText(feature.name).includes('pericia'))?'dos':'una'})<input bind:value={levelUpExpertise} placeholder="Habilidades en las que ya tienes competencia" /></label>
              {/if}
              {#if getClassFeaturesAtLevel(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase'),Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).some((feature)=>/idiomas conoces dos idiomas/.test(normalizeLevelText(feature.description)))}
                <label>Dos idiomas nuevos<input bind:value={levelUpLanguages} placeholder="Ej. Dracónico, Gigante" /></label>
              {/if}
              {#if getClassFeaturesAtLevel(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase'),Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).some((feature)=>normalizeLevelText(feature.description).includes('conoces cuatro formas de bestia'))}
                <label>Cuatro formas de bestia conocidas (VD 1/4 o inferior, sin vuelo)<textarea bind:value={levelUpWildShapeForms} rows="2" placeholder="Ej. Wolf, Panther, Giant Wolf Spider, Giant Badger" /></label>
              {/if}
              {#if Number(getNextLevelRow(levelUpEntry)?.resources?.['Maestría con armas'] || getNextLevelRow(levelUpEntry)?.resources?.['Maestrías con armas']) > splitChoiceList(getCharacterStat(levelUpEntry.sheet,'ATAQUES','Maestrías con armas')).length}
                <label>Maestrías con armas (lista completa)<input bind:value={levelUpWeaponMasteries} placeholder="Escribe todas las maestrías, separadas por comas" /></label>
              {/if}
              {#if String(getNextLevelFeatures(levelUpEntry)).toLowerCase().includes('mejora de característica')}
                <label>Tipo de mejora<select bind:value={levelUpAsiMode}><option value="asi">Aumentar características</option><option value="feat">Elegir una dote</option></select></label>
                {#if levelUpAsiMode==='asi'}
                  <div class="level-up-choice-grid"><label>Primera característica<select bind:value={levelUpAbility1}>{#each LEVEL_ABILITY_NAMES as ability}<option>{ability}</option>{/each}</select></label><label>Aumento<select bind:value={levelUpIncrease1}><option value="2">+2</option><option value="1">+1</option></select></label></div>
                  <div class="level-up-choice-grid"><label>Segunda característica<select bind:value={levelUpAbility2}>{#each LEVEL_ABILITY_NAMES as ability}<option>{ability}</option>{/each}</select></label><label>Aumento<select bind:value={levelUpIncrease2}><option value="0">No aplicar</option><option value="1">+1</option></select></label></div>
                {:else}<label>Dote elegida<input bind:value={levelUpFeat} placeholder="Nombre de la dote" /></label>{/if}
              {/if}
              {#if String(getNextLevelFeatures(levelUpEntry)).toLowerCase().includes('don épico')}
                <label>Don épico elegido<input bind:value={levelUpFeat} placeholder="Nombre del don épico" /></label>
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
      {:else if masterTab === 'Crear personaje'}
        <section class="panel builder-panel">
          <div class="section-heading"><h2>Crear personaje · Nivel 1</h2><span class="count">Paso {builderStep < 6 ? builderStep + 1 : 6} de 6</span></div>
          {#if !builderPreview || builderStep < 6}
            <div class="builder-progress"><span style="width:{(Math.min(builderStep + 1, 6) / 6) * 100}%"></span></div>
            {#if builderStep === 0}

              <h3>1. Clase</h3><p class="muted">Todas las clases del Manual del Jugador 2024. Se aplican únicamente los rasgos que se obtienen a nivel 1.</p>
              <label>¿Qué clase tendrá el personaje?<select bind:value={builderData.className} on:change={() => { builderData.classSkillChoices = []; builderData.classToolsChoices = []; builderData.classSpecialChoice = ''; builderData.warlockTomeCantrips = []; builderData.warlockTomeRituals = []; builderData.classExpertise = []; builderData.weaponMasteries = []; builderData.selectedCantrips = []; builderData.selectedSpells = []; builderData.wizardSpellbook = []; builderData.classEquipmentChoice = 'A'; }}>{#each BUILDER_CLASSES as item}<option>{item}</option>{/each}</select></label>
              <div class="builder-info"><strong>Rasgos de nivel 1 identificados</strong><p>{BUILDER_CLASS_FEATURES[builderData.className]}</p><small>La subclase no se elige a nivel 1. Salvaciones: {BUILDER_SAVES[builderData.className]}. Dado de golpe: d{BUILDER_HIT_DIE[builderData.className]}.</small></div>
            {:else if builderStep === 1}

              <h3>2. Trasfondo</h3><p class="muted">El trasfondo determina competencias, equipo y una dote de origen.</p>
              <label>Trasfondo<select bind:value={builderData.background} on:change={() => { builderData.classSkillChoices = []; builderData.backgroundToolChoice = ''; builderData.backgroundFeatChoices = []; builderData.backgroundMagicCantrips = []; builderData.backgroundMagicSpell = ''; builderData.feat = BUILDER_BACKGROUND_DATA[builderData.background].feat; builderData.abilityIncrease2 = BUILDER_BACKGROUND_DATA[builderData.background].abilities[0]; builderData.abilityIncrease1 = BUILDER_BACKGROUND_DATA[builderData.background].abilities[1]; builderData.abilityIncrease3 = BUILDER_BACKGROUND_DATA[builderData.background].abilities[2]; }}>{#each BUILDER_BACKGROUNDS as item}<option>{item}</option>{/each}</select></label>
              {#if ['Habilidoso','Fabricante','Músico'].includes(BUILDER_BACKGROUND_DATA[builderData.background].feat)}
                <label>Elecciones de la dote {BUILDER_BACKGROUND_DATA[builderData.background].feat} ({builderData.backgroundFeatChoices.length}/3)<select multiple size="7" bind:value={builderData.backgroundFeatChoices}>{#each builderFeatChoiceOptions(BUILDER_BACKGROUND_DATA[builderData.background].feat).filter(choice => !BUILDER_BACKGROUND_DATA[builderData.background].skills.includes(choice) && choice !== builderData.speciesSkill && choice !== builderData.backgroundToolChoice) as choice}<option>{choice}</option>{/each}</select></label>
              {:else if builderMagicInitiateClass(BUILDER_BACKGROUND_DATA[builderData.background].feat)}
                <p class="muted">Lista de Iniciado en la magia: {builderMagicInitiateClass(BUILDER_BACKGROUND_DATA[builderData.background].feat)}</p>
                <label>Aptitud mágica de la dote<select bind:value={builderData.backgroundMagicAbility}><option>Inteligencia</option><option>Sabiduría</option><option>Carisma</option></select></label>
                <label>Dos trucos de la dote ({builderData.backgroundMagicCantrips.length}/2)<select multiple size="6" bind:value={builderData.backgroundMagicCantrips}>{#each BUILDER_SPELL_LISTS[builderMagicInitiateClass(BUILDER_BACKGROUND_DATA[builderData.background].feat)].cantrips as spell}<option>{spell}</option>{/each}</select></label>
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
              <label>Equipo del trasfondo<select bind:value={builderData.backgroundEquipment}><option value="A">Paquete de equipo A</option><option value="B">50 po en lugar del paquete A</option></select></label>
              <div class="builder-info"><small>Los aumentos se aplican automáticamente a las puntuaciones base y quedan reflejados en la ficha final.</small></div>
            {:else if builderStep === 2}

              <h3>3. Especie</h3><p class="muted">Elige una especie. El personaje obtiene sus rasgos de especie.</p>
              <label>Especie<select bind:value={builderData.species} on:change={() => { builderData.speciesChoice = ''; builderData.speciesSkill = ''; builderData.speciesMagicAbility = ''; builderData.speciesSize = ''; builderData.speciesBreathShape = 'Cono'; builderData.speciesFeatChoices = []; builderData.speciesMagicCantrips = []; builderData.speciesMagicSpell = ''; }}>{#each BUILDER_SPECIES as item}<option>{item}</option>{/each}</select></label>
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
                  <label>Elecciones de la dote adicional ({builderData.speciesFeatChoices.length}/3)<select multiple size="7" bind:value={builderData.speciesFeatChoices}>{#each builderFeatChoiceOptions(builderData.speciesExtraFeat).filter(choice => !BUILDER_BACKGROUND_DATA[builderData.background].skills.includes(choice) && choice !== builderData.speciesSkill && choice !== builderData.backgroundToolChoice) as choice}<option>{choice}</option>{/each}</select></label>
                {:else if builderMagicInitiateClass(builderData.speciesExtraFeat)}
                  <label>Aptitud mágica de la dote adicional<select bind:value={builderData.speciesFeatMagicAbility}><option>Inteligencia</option><option>Sabiduría</option><option>Carisma</option></select></label>
                  <label>Dos trucos de la dote adicional ({builderData.speciesMagicCantrips.length}/2)<select multiple size="6" bind:value={builderData.speciesMagicCantrips}>{#each BUILDER_SPELL_LISTS[builderMagicInitiateClass(builderData.speciesExtraFeat)].cantrips as spell}<option>{spell}</option>{/each}</select></label>
                  <label>Un conjuro de nivel 1 de la dote adicional<select bind:value={builderData.speciesMagicSpell}><option value="">Elige un conjuro</option>{#each BUILDER_SPELL_LISTS[builderMagicInitiateClass(builderData.speciesExtraFeat)].level1 as spell}<option>{spell}</option>{/each}</select></label>
                {/if}
              {/if}
              <label>Dos idiomas adicionales (además del común) ({builderData.languages.length}/2)<select multiple size="7" bind:value={builderData.languages}>{#each BUILDER_STANDARD_LANGUAGES as language}<option>{language}</option>{/each}</select></label>
              {#if builderData.className === 'Pícaro'}
                <label>Idioma adicional de pícaro ({builderData.rogueLanguage ? 1 : 0}/1)<select bind:value={builderData.rogueLanguage}><option value="">Elige un idioma</option>{#each BUILDER_LANGUAGES.filter(language => !builderData.languages.includes(language) && language !== 'Jerga de ladrones') as language}<option>{language}</option>{/each}</select></label>
              {/if}
              <div class="builder-info"><strong>Rasgos automáticos de especie</strong><p>{BUILDER_SPECIES_TRAITS[builderData.species]}</p>{#if builderData.speciesChoice}<p>Elección: {builderData.speciesChoice}</p>{/if}</div>
            {:else if builderStep === 3}

              <h3>4. Puntuaciones de característica</h3>
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
            {:else if builderStep === 4}
              <h3>5. Alineamiento</h3>
              <p class="muted">Elige la actitud moral y ética que guía las decisiones de tu personaje.</p>
              <label>Alineamiento<select bind:value={builderData.alignment}><option>Legal bueno</option><option>Neutral bueno</option><option>Caótico bueno</option><option>Legal neutral</option><option>Neutral</option><option>Caótico neutral</option><option>Legal malvado</option><option>Neutral malvado</option><option>Caótico malvado</option></select></label>
            {:else if builderStep === 5}

              <h3>6. Detalles del personaje</h3><p class="muted">Completa la identidad de tu aventurero. La especie ya fue elegida en el paso anterior.</p>
              <div class="name-generator-panel">
                <div class="name-generator-heading"><strong>Generador de nombres</strong><span>Listas originales por especie</span></div>
                <div class="name-generator-controls">
                  <p class="hint">Especie elegida: <strong>{builderData.species}</strong></p>
                  <label>Sexo<select bind:value={nameGender}><option value="Hombre">Hombre</option><option value="Mujer">Mujer</option><option value="Otro">Otro</option></select></label>
                </div>
                <button class="secondary name-generator-button" type="button" on:click={generateCharacterName}>⚄ Generar nombre</button>
                {#if lastGeneratedName}<p class="generated-name-note">Nombre generado: <strong>{lastGeneratedName}</strong></p>{/if}
                <p class="hint">Nombres originales inspirados en cada especie; no son una lista oficial del manual.</p>
              </div>
              <label>Nombre del personaje<input bind:value={builderData.name} placeholder="Nombre" /></label>
              <label>Jugador<input bind:value={builderData.player} placeholder="Nombre del jugador (opcional)" /></label>

              <h3>Competencias, rasgos, conjuros y equipo</h3>
              <p class="muted">Completa las elecciones que dependen de la clase y del trasfondo. Puedes consultar los detalles antes de generar la ficha.</p>
              <div class="builder-info"><strong>Habilidades automáticas del trasfondo</strong><p>{BUILDER_BACKGROUND_DATA[builderData.background].skills.join(' y ')}</p><strong>Elige {BUILDER_CLASS_SKILLS[builderData.className].count} competencias de clase</strong></div>
              {#each Array.from({length:BUILDER_CLASS_SKILLS[builderData.className].count},(_,i)=>i) as index}
                <label>Competencia de clase {index + 1}<select bind:value={builderData.classSkillChoices[index]}><option value="">Selecciona una habilidad</option>{#each BUILDER_CLASS_SKILLS[builderData.className].options.filter(skill => !BUILDER_BACKGROUND_DATA[builderData.background].skills.includes(skill) && skill !== builderData.speciesSkill && ![...builderData.backgroundFeatChoices,...builderData.speciesFeatChoices].includes(skill) && !builderData.classSkillChoices.some((chosen,i)=>i !== index && chosen === skill)) as skill}<option value={skill}>{skill}</option>{/each}</select></label>
              {/each}
              
              
              <div class="builder-info"><strong>Rasgos automáticos de {builderData.className}</strong><p>{BUILDER_CLASS_DATA[builderData.className].features}</p><p><strong>Competencias de herramientas:</strong> {BUILDER_CLASS_DATA[builderData.className].tool}</p></div>
              {#if BUILDER_CLASS_DATA[builderData.className].specialOptions.length > 0}
                <label>{BUILDER_CLASS_DATA[builderData.className].specialLabel}<select bind:value={builderData.classSpecialChoice}><option value="">Elige una opción</option>{#each BUILDER_CLASS_DATA[builderData.className].specialOptions as option}<option>{option}</option>{/each}</select></label>
              {/if}
              {#if builderData.className === 'Pícaro'}
                <label>Pericia: elige 2 habilidades en las que ya seas competente ({builderData.classExpertise.length}/2)<select multiple size="6" bind:value={builderData.classExpertise}>{#each [...BUILDER_BACKGROUND_DATA[builderData.background].skills,...builderData.classSkillChoices.filter(Boolean),builderData.speciesSkill,...builderData.backgroundFeatChoices.filter(choice => BUILDER_SKILL_OPTIONS.includes(choice)),...builderData.speciesFeatChoices.filter(choice => BUILDER_SKILL_OPTIONS.includes(choice))].filter(Boolean) as skill}<option>{skill}</option>{/each}</select></label>
              {/if}
              {#if BUILDER_CLASS_DATA[builderData.className].weaponCount > 0}
                <label>Maestrías con armas ({BUILDER_CLASS_DATA[builderData.className].weaponCount})<select multiple size="6" bind:value={builderData.weaponMasteries}>{#each BUILDER_WEAPON_MASTERY_OPTIONS.filter(weapon => builderData.className !== 'Bárbaro' || !['Arco corto','Ballesta ligera','Dardo','Honda','Arco largo','Ballesta de mano','Ballesta pesada','Cerbatana','Mosquete','Pistola'].includes(weapon)).filter(weapon => builderData.className !== 'Pícaro' || ['Bastón','Daga','Garrote','Garrote grande','Hacha de mano','Hoz','Jabalina','Lanza','Martillo ligero','Maza','Arco corto','Ballesta ligera','Dardo','Honda','Cimitarra','Espada corta','Estoque','Látigo','Ballesta de mano'].includes(weapon)) as weapon}<option>{weapon}</option>{/each}</select></label>
                <small class="muted">Selecciona los tipos de arma indicados por tu clase. Las opciones se guardan en la ficha.</small>
              {/if}
              {#if builderData.className === 'Bardo'}
                <label>Instrumentos musicales competentes ({builderData.classToolsChoices.length}/3)<select multiple size="6" bind:value={builderData.classToolsChoices}>{#each BUILDER_MUSICAL_INSTRUMENTS.filter(tool => !builderData.backgroundFeatChoices.includes(tool) && !builderData.speciesFeatChoices.includes(tool) && tool !== builderData.backgroundToolChoice) as tool}<option>{tool}</option>{/each}</select></label>
              {:else if builderData.className === 'Monje'}
                <label>Competencia con herramientas ({builderData.classToolsChoices.length}/1)<select multiple size="6" bind:value={builderData.classToolsChoices}>{#each [...BUILDER_ARTISAN_TOOLS,...BUILDER_MUSICAL_INSTRUMENTS].filter(tool => !builderData.backgroundFeatChoices.includes(tool) && !builderData.speciesFeatChoices.includes(tool) && tool !== builderData.backgroundToolChoice) as tool}<option>{tool}</option>{/each}</select></label>
              {/if}
              
              <label>Equipo inicial de clase<select bind:value={builderData.classEquipmentChoice}><option value="A">Paquete A: {BUILDER_CLASS_DATA[builderData.className].equipmentA}</option><option value="B">Paquete B: {BUILDER_CLASS_DATA[builderData.className].equipmentB}</option>{#if builderData.className === 'Guerrero'}<option value="C">Paquete C: 155 po</option>{/if}</select></label>
              {#if builderData.className === 'Brujo' && builderData.classSpecialChoice === 'Pacto del grimorio'}
                <div class="builder-info"><strong>Pacto del grimorio</strong><p>Elige tres trucos y dos conjuros de nivel 1 con la etiqueta de ritual. Estos se añaden a los beneficios de tu invocación.</p></div>
                <label>Trucos del grimorio ({builderData.warlockTomeCantrips.length}/3)<select multiple size="8" bind:value={builderData.warlockTomeCantrips}>{#each BUILDER_TOME_CANTRIPS.filter(spell => !builderData.selectedCantrips.includes(spell)) as spell}<option>{spell}</option>{/each}</select></label>
                <label>Conjuros rituales de nivel 1 ({builderData.warlockTomeRituals.length}/2)<select multiple size="8" bind:value={builderData.warlockTomeRituals}>{#each BUILDER_TOME_RITUALS.filter(spell => !builderData.selectedSpells.includes(spell)) as spell}<option>{spell}</option>{/each}</select></label>
              {/if}
              {#if BUILDER_CLASS_DATA[builderData.className].cantrips > 0}
                <label>Trucos ({builderData.selectedCantrips.length}/{BUILDER_CLASS_DATA[builderData.className].cantrips + ((builderData.className === 'Clérigo' && builderData.classSpecialChoice === 'Taumaturgo') || (builderData.className === 'Druida' && builderData.classSpecialChoice === 'Naturalista') ? 1 : 0)})<select multiple size="7" bind:value={builderData.selectedCantrips}>{#each BUILDER_SPELL_LISTS[builderData.className].cantrips as spell}<option>{spell}</option>{/each}</select></label>
              {/if}
              {#if BUILDER_CLASS_DATA[builderData.className].spells > 0}
                {#if builderData.className === 'Mago'}
                  <label>Libro de conjuros: elige 6 conjuros de nivel 1 ({builderData.wizardSpellbook.length}/6)<select multiple size="8" bind:value={builderData.wizardSpellbook}>{#each BUILDER_SPELL_LISTS.Mago.level1 as spell}<option>{spell}</option>{/each}</select></label>
                  <label>Conjuros preparados ({builderData.selectedSpells.length}/4)<select multiple size="8" bind:value={builderData.selectedSpells}>{#each builderData.wizardSpellbook as spell}<option>{spell}</option>{/each}</select></label>
                {:else}
                  <label>Conjuros de nivel 1 preparados ({builderData.selectedSpells.length}/{BUILDER_CLASS_DATA[builderData.className].spells})<select multiple size="8" bind:value={builderData.selectedSpells}>{#each BUILDER_SPELL_LISTS[builderData.className].level1 as spell}<option>{spell}</option>{/each}</select></label>
                {/if}
              {/if}
              <label>Competencias o elecciones adicionales<textarea bind:value={builderData.skills} rows="2" placeholder="Solo beneficios adicionales que no estén recogidos arriba" /></label>
              
              <label>Notas<textarea bind:value={builderData.notes} rows="2" /></label>
            {/if}
            
<div class="builder-actions">
              {#if builderStep > 0}<button class="secondary" on:click={builderBack}>Anterior</button>{/if}
              {#if builderStep < 5}<button class="primary" on:click={builderNext}>Siguiente</button>{:else}<button class="primary" on:click={finishBuilder} disabled={!builderCanFinish()}>Generar ficha de nivel 1</button>{/if}
            </div>
          {:else}
            <div class="section-heading"><h3>Personaje generado</h3><span class="count">Nivel 1</span></div>
            <div class="character-sheet gm-character-sheet">
              <div class="sheet-banner"><h2>{builderPreview.name}</h2></div>
              <div class="sheet-grid">
                {#each sectionPairs(builderPreview.sections || []) as pair}
                  <section class="sheet-section {sectionClass(pair.heading.name)}">
                    <div class="sheet-section-title"><h3>{pair.heading.name}</h3></div>
                    <div class="stats-list">{#each pair.heading.stats || [] as stat,i}<div class="sheet-stat"><span>{stat.name}</span><strong>{displayValue(pair.values?.stats?.[i]?.value) || '—'}</strong></div>{/each}</div>
                  </section>
                {/each}
              </div>
            </div>
            <div class="builder-actions">
              <button class="secondary" on:click={() => { builderPreview = null; builderStep = 5; }}>Volver a editar</button>
              <button class="primary" on:click={downloadBuilderSheet}>Exportar ficha JSON</button>
              <button class="secondary" on:click={() => { builderPreview = null; builderStep = 0; builderRolledScores = []; builderData = {name:'',player:'',className:'Guerrero',species:'Humano',background:'Soldado',alignment:'Neutral',method:'standard',abilities:{Fuerza:15,Destreza:14,Constitución:13,Inteligencia:12,Sabiduría:10,Carisma:8},feat:'Atacante salvaje',abilityIncreaseMode:'two',abilityIncrease2:'Fuerza',abilityIncrease1:'Destreza',abilityIncrease3:'Constitución',backgroundEquipment:'A',backgroundToolChoice:'',classEquipmentChoice:'A',classSkillChoices:[],classToolsChoices:[],classSpecialChoice:'',classExpertise:[],weaponMasteries:[],selectedCantrips:[],selectedSpells:[],wizardSpellbook:[],speciesChoice:'',speciesMagicAbility:'',speciesSkill:'',speciesExtraFeat:'Habilidoso',speciesSize:'',speciesBreathShape:'Cono',backgroundFeatChoices:[],speciesFeatChoices:[],backgroundMagicCantrips:[],backgroundMagicSpell:'',backgroundMagicAbility:'Inteligencia',speciesMagicCantrips:[],speciesMagicSpell:'',warlockTomeCantrips:[],warlockTomeRituals:[],speciesFeatMagicAbility:'Inteligencia',languages:[],rogueLanguage:'',skills:'',tools:'',equipment:'',traits:'',spells:'',notes:''}; }}>Crear otro personaje</button>
            </div>
          {/if}
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
      {#if !sheet}
        <section class="panel import-character-panel">
          <div class="import-row">
            <button class="secondary" on:click={() => importOpen = !importOpen}>Importar ficha JSON</button>
          </div>
          {#if importOpen}
            <div class="import-box">
              <label>Archivo JSON<input bind:this={fileInput} type="file" accept=".json,application/json" on:change={importJson} /></label>
              <div class="actions"><button class="secondary" on:click={() => importOpen = false}>Cerrar</button></div>
            </div>
          {/if}
        </section>
      {/if}

      {#if sheet}
        <article class="character-sheet">
          <header class="sheet-banner">
            <div class="sheet-banner-copy"><span class="sheet-kicker">FORJA DE AVENTUREROS · D&D 2024</span><h1 class="character-name">{sheet.name || 'Personaje'}</h1><span class="sheet-subtitle">Hoja de aventurero</span></div>
            <div class="sheet-banner-emblem" aria-hidden="true">✦</div>
          </header>
          <nav class="sheet-tabs" role="tablist" aria-label="Pestañas de la ficha">
            {#each tabs as tab}<button class:active={activeTab === tab} role="tab" aria-selected={activeTab === tab} on:click={() => activeTab = tab}>{tab}</button>{/each}
          </nav>
          {#if activeTab === 'Tiradas'}
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
          {:else if activeTab === 'Reglas'}
            <section class="panel rules-panel player-rules-panel">
              <div class="section-heading"><h2>Reglas · Manual del Jugador 2024</h2><span class="count">{filteredRules.length} / {RULES.length}</span></div>
              <p class="muted">Glosario del Apéndice C. Consulta las definiciones de reglas durante la partida.</p>
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
          {#if activeTab === 'Datos'}
            <section class="import-character-panel data-import-panel">
              <div class="import-row">
                <button class="secondary" on:click={() => importOpen = !importOpen}>Importar otro JSON</button>
              </div>
              {#if importOpen}
                <div class="import-box">
                  <label>Archivo JSON<input bind:this={fileInput} type="file" accept=".json,application/json" on:change={importJson} /></label>
                  <div class="actions"><button class="secondary" on:click={() => importOpen = false}>Cerrar</button></div>
                </div>
              {/if}
            </section>
          {/if}
          <div class="sheet-grid">
            {#each visiblePairs(sheet.sections || [], activeTab) as pair}
              <section class="sheet-section {sectionClass(pair.heading.name)}">
                <div class="sheet-section-title">
                  <input class="section-name editable" aria-label="Nombre de sección" value={pair.heading.name || ''} on:input={(event) => editField(pair.heading, 'name', event)} />
                </div>
                <div class="stats-list">
                  {#each pair.heading.stats || [] as stat, i}
                    <div class="sheet-stat">
                      <input class="stat-label editable" aria-label="Nombre del campo" value={stat.name || ''} on:input={(event) => editField(stat, 'name', event)} />
                      {#if pair.values?.stats?.[i]}
                        <textarea class="stat-value editable" aria-label="Valor" rows="1" value={displayValue(pair.values.stats[i].value)} on:input={(event) => editStatValue(pair, stat, i, event)}></textarea>
                      {:else}
                        <textarea class="stat-value editable" aria-label="Valor" rows="3" value={displayValue(stat.value)} on:input={(event) => editStatValue(pair, stat, i, event)}></textarea>
                      {/if}
                    </div>
                  {/each}
                </div>
              </section>
            {/each}
          </div>
          {/if}
        </article>

        <section class="panel save-panel">
          <button class="primary full" on:click={exportSheet}>Exportar personaje (JSON)</button>
          <button class="danger-text" on:click={deleteSheet}>Eliminar personaje</button>
        </section>
      {:else}
        <section class="panel empty-state"><p>No hay ninguna ficha cargada.</p></section>
      {/if}
    {/if}
  </main>

  {#if notice}<button class="toast" on:click={() => notice = ''}>{notice}<span>×</span></button>{/if}
  <footer><span>FORJA DE AVENTUREROS · v1.0.36</span></footer>
</div>

<style>
  :global(:root){--paper:#080808;--paper-deep:#141414;--ink:#f4f1f1;--ink-soft:#c1b9ba;--rule:#76212a;--red:#d52332;--gold:#b52a36}
  .builder-panel{display:grid;gap:.8rem}.builder-panel>label{display:grid;gap:.3rem;color:var(--ink-soft);font:600 .76rem system-ui,sans-serif}.builder-panel input,.builder-panel select,.builder-panel textarea{box-sizing:border-box;width:100%;padding:.65rem;border:1px solid var(--rule);border-radius:5px;background:#fffdf8;color:var(--ink);font: .9rem system-ui,sans-serif}.builder-panel h3{margin:.2rem 0;color:var(--red);font:700 1rem Georgia,serif}.builder-progress{height:5px;border-radius:5px;background:#e8dfce;overflow:hidden}.builder-progress span{display:block;height:100%;background:var(--gold);transition:width .2s}.builder-info{padding:.7rem .8rem;border:1px solid var(--rule);border-left:3px solid var(--gold);border-radius:4px;background:rgba(255,255,255,.4);font:.82rem/1.5 system-ui,sans-serif}.builder-info p{margin:.3rem 0}.builder-info small{color:var(--ink-soft)}.builder-actions{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:flex-end;margin-top:.7rem}.builder-actions button{min-height:38px}.builder-panel .sheet-grid{grid-template-columns:minmax(0,1fr)}.builder-panel .sheet-stat{grid-template-columns:minmax(0,1fr)}.builder-panel .sheet-stat strong{white-space:pre-wrap;overflow-wrap:anywhere}
  .master-tabs{display:flex;gap:.4rem;overflow-x:auto;padding:.2rem 0 .7rem;margin:.8rem 0;border-bottom:1px solid var(--rule)}
  .master-tabs button{flex:0 0 auto;border:1px solid var(--rule);border-radius:5px;padding:.55rem .8rem;background:#e8dfce;color:var(--ink-soft);font:600 .75rem system-ui,sans-serif;cursor:pointer}
  .master-tabs button.active{background:var(--ink);border-color:var(--ink);color:var(--paper)}
  .subclass-level-preview{padding:.7rem;border:1px solid var(--rule);border-radius:4px;background:rgba(0,0,0,.04);display:grid;gap:.5rem}.subclass-level-preview p{white-space:pre-wrap;margin:.25rem 0;font-size:.82rem;line-height:1.4}.level-up-panel{margin-top:1rem;padding:1rem;border:1px solid var(--red);border-radius:6px;background:var(--paper-deep);display:grid;gap:.65rem}.level-up-panel label{display:grid;gap:.3rem;color:var(--ink-soft);font:600 .78rem system-ui,sans-serif}.level-up-panel input,.level-up-panel select,.level-up-panel textarea{box-sizing:border-box;width:100%;padding:.55rem;border:1px solid var(--rule);border-radius:4px;background:#fff;color:#171313;font:500 .85rem system-ui,sans-serif}.level-up-choice-grid{display:grid;grid-template-columns:2fr 1fr;gap:.5rem}.level-up-action{margin:.35rem 0 .6rem}.spells-panel{margin-top:.5rem}
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
  :global(.character-sheet .editable:hover){background:#1a1011!important;border-color:#8c2732!important}
  @media(max-width:560px){:global(.spell-filters){grid-template-columns:1fr}}


  /* Generador de nombres y rediseño de la hoja de personaje */
  :global(.name-generator-panel){margin:1rem 0 1.1rem;padding:1rem;border:1px solid #76212a;border-left:3px solid #d32638;border-radius:8px;background:linear-gradient(135deg,#16090b,#090909)}
  :global(.name-generator-heading){display:flex;justify-content:space-between;gap:.7rem;align-items:center;margin-bottom:.35rem}
  :global(.name-generator-heading strong){color:#fff;font-size:.9rem}
  :global(.name-generator-heading span){color:#c6a1a4;font-size:.68rem}
  :global(.name-generator-controls){display:grid;grid-template-columns:1fr 1fr;gap:.7rem}
  :global(.name-generator-controls label){margin:.5rem 0;font-size:.72rem}
  :global(.name-generator-button){width:100%;margin:.35rem 0 .1rem;padding:.7rem 1rem!important;font-weight:700}
  :global(.generated-name-note){margin:.55rem 0;color:#d8c6c8;font-size:.78rem}
  :global(.generated-name-note strong){color:#ff9ba4;font-size:1rem}
  :global(.name-generator-panel .hint){margin:.5rem 0 0;font-size:.68rem}
  :global(.character-sheet){padding:clamp(.8rem,2.5vw,1.5rem)!important;border:1px solid #632029!important;border-radius:13px!important;background:linear-gradient(160deg,#101010 0%,#080808 65%,#10090a 100%)!important;box-shadow:0 16px 38px rgba(0,0,0,.48),inset 0 1px rgba(255,255,255,.035)!important}
  :global(.character-sheet > .sheet-banner){display:flex!important;align-items:center!important;justify-content:space-between!important;gap:1rem!important;padding:1rem 1.1rem!important;margin:0 0 1rem!important;border:1px solid #76212a!important;border-left:4px solid #d32638!important;border-radius:9px!important;background:linear-gradient(110deg,#210b0f,#0b0b0b 72%)!important;text-align:left!important}
  :global(.sheet-banner-copy){min-width:0;display:flex;flex-direction:column;gap:.25rem}
  :global(.sheet-kicker){font:700 .58rem/1.3 system-ui,sans-serif;letter-spacing:.17em;color:#e35b67}
  :global(.character-sheet > .sheet-banner .character-name){width:auto!important;margin:0!important;padding:0!important;color:#fff!important;text-align:left!important;font:700 clamp(1.25rem,4vw,1.8rem)/1.2 Georgia,serif!important;overflow-wrap:anywhere}
  :global(.sheet-subtitle){font:500 .68rem system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#a99b9d}
  :global(.sheet-banner-emblem){flex:0 0 44px;width:44px;height:44px;display:grid;place-items:center;border:1px solid #9c2936;border-radius:50%;background:#18090c;color:#ff7884;font-size:1.5rem;box-shadow:0 0 20px #9f182b30}
  :global(.sheet-tabs){gap:.45rem!important;padding:.25rem .1rem .8rem!important;margin-bottom:1rem!important;border-bottom:1px solid #632029!important}
  :global(.sheet-tabs button){padding:.62rem .85rem!important;border:1px solid #4d1b21!important;border-radius:7px!important;background:#111!important;color:#c9bfc0!important;font:650 .72rem system-ui,sans-serif!important}
  :global(.sheet-tabs button.active){background:linear-gradient(135deg,#a81727,#70121e)!important;border-color:#ed4352!important;color:#fff!important;box-shadow:0 4px 14px #a8172730}
  :global(.sheet-grid){display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:.85rem!important;align-items:stretch!important}
  :global(.sheet-section){min-width:0;padding:.9rem!important;border:1px solid #3e2024!important;border-top:3px solid #a92332!important;border-radius:9px!important;background:linear-gradient(145deg,#111,#090909)!important;box-shadow:0 5px 14px #0005}
  :global(.sheet-section-title){padding-bottom:.6rem!important;margin-bottom:.45rem!important;border-bottom:1px solid #462027!important}
  :global(.sheet-section-title h3),:global(.sheet-section-title .section-name){color:#ff9ba4!important;font:750 .76rem/1.35 system-ui,sans-serif!important;letter-spacing:.09em!important;text-transform:uppercase}
  :global(.stats-list){gap:0!important}
  :global(.sheet-stat){grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)!important;gap:.65rem!important;align-items:center!important;padding:.52rem .25rem!important;border-bottom:1px solid #292023!important}
  :global(.sheet-stat:last-child){border-bottom:0!important}
  :global(.sheet-stat .stat-label),:global(.sheet-stat span){color:#bcb2b4!important;font:600 .7rem/1.4 system-ui,sans-serif!important}
  :global(.sheet-stat .stat-value),:global(.sheet-stat strong){min-width:0;color:#f4eeee!important;font:500 .78rem/1.5 system-ui,sans-serif!important;overflow-wrap:anywhere!important}
  :global(.sheet-stat textarea.stat-value){background:#0d0d0d!important;border:1px solid #352126!important;border-radius:5px!important;padding:.45rem!important}
  :global(.attributes-section){grid-column:1/-1!important;border-top-color:#e03a49!important;background:linear-gradient(145deg,#160d0f,#0b0b0b)!important}
  :global(.attributes-section .stats-list){grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:.55rem!important}
  :global(.attributes-section .sheet-stat){display:flex!important;flex-direction:column!important;justify-content:center!important;gap:.2rem!important;padding:.7rem .3rem!important;border:1px solid #51232a!important;border-radius:7px!important;background:#0c0c0c!important;text-align:center!important}
  :global(.attributes-section .stat-label){font-size:.65rem!important;letter-spacing:.08em;text-transform:uppercase}
  :global(.attributes-section .stat-value),:global(.attributes-section .sheet-stat strong){font:700 1.2rem/1.2 Georgia,serif!important;color:#fff!important;text-align:center!important}
  :global(.combat-section){border-top-color:#d43a49!important}
  :global(.features-section .sheet-stat){grid-template-columns:1fr!important;gap:.25rem!important;align-items:start!important}
  :global(.features-section .sheet-stat strong),:global(.features-section .stat-value){display:block;padding:.45rem .55rem!important;border:1px solid #3d2428!important;border-radius:5px;background:#0d0d0d!important}
  :global(.gm-character-sheet){padding:1rem!important}
  :global(.gm-character-sheet .sheet-grid){grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:.8rem!important}
  :global(.gm-character-sheet .sheet-stat){grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr)!important;align-items:start!important;padding:.5rem .2rem!important}
  :global(.gm-character-sheet .sheet-stat strong){padding:0!important;background:transparent!important}
  :global(.gm-character-sheet .attributes-section .stats-list){grid-template-columns:repeat(3,minmax(0,1fr))!important}
  :global(.gm-character-sheet .attributes-section .sheet-stat){align-items:center!important}
  @media(max-width:650px){
    :global(.name-generator-controls){grid-template-columns:1fr 1fr}
    :global(.sheet-grid),:global(.gm-character-sheet .sheet-grid){grid-template-columns:minmax(0,1fr)!important}
    :global(.attributes-section .stats-list),:global(.gm-character-sheet .attributes-section .stats-list){grid-template-columns:repeat(3,minmax(0,1fr))!important}
    :global(.character-sheet > .sheet-banner){padding:.8rem!important}
    :global(.sheet-banner-emblem){width:36px;height:36px;flex-basis:36px}
    :global(.sheet-tabs button){padding:.55rem .7rem!important}
  }


  /* Glosario de reglas compartido entre jugador y narrador */
  :global(.rules-panel){display:grid;gap:.8rem}
  :global(.rules-search),:global(.rules-category-filter){display:grid;gap:.35rem;color:var(--ink-soft);font:600 .75rem system-ui,sans-serif}
  :global(.rules-search input),:global(.rules-category-filter select){width:100%;box-sizing:border-box;padding:.7rem .75rem;border:1px solid #76212a;border-radius:6px;background:#101010;color:#fff;font:500 .85rem system-ui,sans-serif}
  :global(.rules-list){display:grid;gap:.45rem}
  :global(.rule-card){overflow:hidden;border:1px solid #4d1b21;border-radius:7px;background:linear-gradient(120deg,#141010,#090909)}
  :global(.rule-card summary){display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:.55rem;align-items:center;padding:.75rem .8rem;cursor:pointer;list-style:none}
  :global(.rule-card summary::-webkit-details-marker){display:none}
  :global(.rule-name){min-width:0;color:#fff;font:700 .78rem/1.35 system-ui,sans-serif}
  :global(.rule-category){padding:.2rem .4rem;border:1px solid #76212a;border-radius:4px;color:#ffadb4;background:#1b090c;font:650 .62rem system-ui,sans-serif;white-space:nowrap}
  :global(.rule-page){color:#a99b9d;font:500 .62rem system-ui,sans-serif;white-space:nowrap}
  :global(.rule-details){padding:.8rem;border-top:1px solid #4d1b21;background:#0c0b0b}
  :global(.rule-description){margin:0;color:#e5dddd;white-space:pre-wrap;overflow-wrap:anywhere;font:500 .76rem/1.6 system-ui,sans-serif}
  :global(.rule-source){display:block;margin-top:.7rem;color:#a99b9d;font-size:.65rem}
  @media(max-width:480px){:global(.rule-card summary){grid-template-columns:minmax(0,1fr) auto}:global(.rule-page){grid-column:1/-1}}

</style>
