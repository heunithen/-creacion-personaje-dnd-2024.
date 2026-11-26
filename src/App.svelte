<script lang="ts">
  import { onMount } from 'svelte';
  import OBR from '@owlbear-rodeo/sdk';
  import { buildLabel } from '@owlbear-rodeo/sdk';
  import { GithubCharacterStorage, type GithubConfig, type GithubCharacterRecord } from './githubCharacterStorage';

  const KEY = 'com.heunithen.dnd2024-character-builder/character';
  const CHANNEL = 'com.heunithen.dnd2024-character-builder/character-sync';
  const GITHUB_ROOM_KEY = 'com.heunithen.dnd2024-character-builder/github-storage';

  type RawStat = { id?: number; name?: string; value?: unknown; [key: string]: unknown };
  type RawSection = { id?: number; name?: string; stats?: RawStat[]; [key: string]: unknown };
  type RawSheet = { id?: number; name?: string; notes?: string; sections?: RawSection[]; [key: string]: unknown };
  type RoomEntry = { playerId: string; playerName: string; sheet: RawSheet; saved?: boolean; live?: boolean };
  const MASTER_SHEETS_KEY = 'forja-master-saved-characters';

  let sheet: RawSheet | null = null;
  let roomSheets: RoomEntry[] = [];
  let liveRoomSheets: RoomEntry[] = [];
  let savedMasterSheets: RoomEntry[] = [];
  let importOpen = false;
  let notice = '';
  let obrReady = false;
  let obrRole = '';
  let playerName = '';
  let activeTab = 'Todas';
  let monsterCrFilter = '';
  let monsterLetterFilter = '';
  let monsterSearch = '';
  let itemSearch = '';
  let itemLetterFilter = '';
  let itemTypeFilter = '';
  let itemPriceMin = '';
  let itemPriceMax = '';
  let itemWeightMin = '';
  let itemWeightMax = '';
  let spellSearch = '';
  let spellLetterFilter = '';
  let rulesSearch = '';
  let rulesCategoryFilter = '';
  let spellLevelFilter = '';
  let spellClassFilter = '';
  let spellSchoolFilter = '';
  let spellChangeOpen = false;
  let spellChangeStage: 'prompt' | 'select' = 'prompt';
  let spellChangeMode: 'long-rest' | 'level-up' = 'long-rest';
  let spellChangeRule = '';
  let spellChangeLimit = 0;
  let spellChangeSearch = '';
  let spellChangeSelected: string[] = [];
  let spellChangeOriginal: string[] = [];


  let syncStatus = 'Owlbear Rodeo no está conectado.';
  let autoSyncTimer: ReturnType<typeof setTimeout>;
  let syncInProgress = false;
  let syncPending = false;
  const SUPABASE_URL = 'https://akbvedwkpjokphzridla.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_BOiPUrLlhogEadY_phsFMw_s6JrIzcP';
  let supabaseRoomId = '';
  let supabasePlayerId = '';
  let supabasePlayerName = '';
  let supabaseSaveTimer: ReturnType<typeof setTimeout> | undefined;
  let supabaseSaving = false;
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
  let levelUpIsPlayer = false;
  let levelUpDecision = '';
  let levelUpClassCantrips = '';
  let levelUpClassSpells = '';
  let levelUpBardCantripSearch = '';
  let levelUpBardSpellSearch = '';
  let levelUpWizardBookAdditions = '';
  let levelUpExpertise = '';
  let levelUpBardExpertise1 = '';
  let levelUpBardExpertise2 = '';
  let levelUpNewSkill = '';
  let levelUpLanguages = '';
  let levelUpMetamagic = '';
  let levelUpInvocations = '';
  let levelUpInvocationSlots: string[] = [];
  let levelUpMysticArcanum = '';
  let levelUpMysticArcanum1 = '';
  let levelUpMysticArcanum2 = '';
  let levelUpMysticArcanum3 = '';
  let levelUpMysticArcanum4 = '';
  let levelUpWarlockTomeCantrips: string[] = [];
  let levelUpWarlockTomeRituals: string[] = [];
  let levelUpElementalFury = '';
  let levelUpSorcererAffinity = '';
  let levelUpBlessedStrikes = '';
  let levelUpWizardMastery1 = '';
  let levelUpWizardMastery2 = '';
  let levelUpWizardSignatureSpells = '';
  let levelUpSubclassSkill = '';
  let levelUpCollegeKnowledgeSkill1 = '';
  let levelUpCollegeKnowledgeSkill2 = '';
  let levelUpCollegeKnowledgeSkill3 = '';
  let levelUpBardDiscovery1 = '';
  let levelUpBardDiscovery2 = '';
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
  let levelUpGeneralFeatAbility = '';
  let levelUpBarbarianFeatSkill = '';
  let levelUpBarbarianFeatExpertise = '';
  let levelUpBarbarianFeatSpell = '';
  let levelUpBarbarianFeatRituals = '';
  let levelUpBarbarianFeatWeaponMastery = '';
  let levelUpEpicFeatAbility = 'Fuerza';
  let levelUpHpMode = 'average';
  let levelUpHpRoll = '';
  let progressionFeatChoice = '';
  let progressionSkillChoice = '';
  let progressionToolChoice = '';
  let progressionArmorChoice = '';
  let progressionWeaponChoice = '';
  let progressionLanguageChoice = '';
  let progressionTraitChoice = '';
  let progressionSubclassChoice = '';
  $: progressionSubclassChoice = sheet ? (getCharacterStat(sheet,'PERSONAJE','Subclase') || '') : '';
  let progressionBardDieChoice = '';
  let progressionRewardSearch = '';
  let progressionRewardType = '';
  let progressionRewardQuantity = 1;
  let progressionCurrencyAmount = 1;
  let progressionEditSection = 'PERSONAJE';
  let progressionEditField = 'Nombre';
  let progressionEditValue = '';
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

  let visualStyle = { background:'#0b171d', panel:'#13262e', card:'#1b2a33', border:'#3a6870', text:'#ffffff', muted:'#b5bec3', accent:'#5fe6e0', fontSize:14, headingSize:18, panelPadding:12, panelGap:10, radius:8 };
  function applyVisualStyle() {
    const root = document.documentElement;
    const vars: Record<string,string> = {'--gm-bg':visualStyle.background,'--gm-panel':visualStyle.panel,'--gm-card':visualStyle.card,'--gm-border':visualStyle.border,'--gm-text':visualStyle.text,'--gm-muted':visualStyle.muted,'--gm-accent':visualStyle.accent,'--gm-font-size':visualStyle.fontSize+'px','--gm-heading-size':visualStyle.headingSize+'px','--gm-panel-padding':visualStyle.panelPadding+'px','--gm-panel-gap':visualStyle.panelGap+'px','--gm-radius':visualStyle.radius+'px'};
    Object.entries(vars).forEach(([key,value])=>root.style.setProperty(key,value));
    try { localStorage.setItem('forja-visual-style',JSON.stringify(visualStyle)); } catch {}
  }
  function resetVisualStyle() {
    visualStyle = { background:'#0b171d', panel:'#13262e', card:'#1b2a33', border:'#3a6870', text:'#ffffff', muted:'#b5bec3', accent:'#5fe6e0', fontSize:14, headingSize:18, panelPadding:12, panelGap:10, radius:8 };
    applyVisualStyle();
  }
  let masterTab = 'Personajes';
  const masterTabs = ['Personajes', 'Combate', 'Iniciativa', 'Cofres', 'Objetos', 'Monstruos', 'Conjuros', 'Reglas'];

  function openMasterTab(tab: string) {
    // Cada entrada a un catálogo comienza sin búsquedas ni filtros anteriores.
    if (tab === 'Monstruos') {
      monsterSearch = '';
      monsterCrFilter = '';
      monsterLetterFilter = '';
    } else if (tab === 'Objetos') {
      itemSearch = '';
      itemLetterFilter = '';
      itemTypeFilter = '';
      itemPriceMin = '';
      itemPriceMax = '';
      itemWeightMin = '';
      itemWeightMax = '';
    } else if (tab === 'Conjuros') {
      spellSearch = '';
      spellLetterFilter = '';
      spellLevelFilter = '';
      spellClassFilter = '';
      spellSchoolFilter = '';
    } else if (tab === 'Reglas') {
      rulesSearch = '';
      rulesCategoryFilter = '';
    }
    masterTab = tab;
  }
  let githubConfig: GithubConfig | null = null;
  let githubStore: GithubCharacterStorage | null = null;
  let githubTokenDraft = '';
  let githubOwnerDraft = 'heunithen';
  let githubRepoDraft = '-creacion-personaje-dnd-2024.';
  let githubBranchDraft = 'main';
  let cloudRecords: GithubCharacterRecord[] = [];
  let cloudLoading = false;
  let cloudStatus = 'Almacenamiento GitHub sin configurar.';

  type BuilderData = {
    name: string; player: string; portrait: string; age: string; height: string; appearance: string; personality: string; ideals: string; bonds: string; flaws: string; className: string; species: string; background: string;
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
  let builderClassChosen = false;
  let builderSpeciesChosen = false;
  let builderBackgroundChosen = false;
  let builderRolledScores: number[] = [];
  let builderPreview: RawSheet | null = null;

  let playerCreating = false;
  let demoPreview = false;
  let builderSaving = false;
  const createInitialBuilderData = (): BuilderData => ({
    name: '', player: '', portrait: '', age: '', height: '', appearance: '', personality: '', ideals: '', bonds: '', flaws: '', className: 'Guerrero', species: 'Humano', background: 'Soldado',
    alignment: 'Neutral', method: 'standard',
    abilities: { Fuerza: 15, Destreza: 14, Constitución: 13, Inteligencia: 12, Sabiduría: 10, Carisma: 8 },
    feat: 'Atacante salvaje', abilityIncreaseMode: 'two', abilityIncrease2: 'Fuerza', abilityIncrease1: 'Destreza', abilityIncrease3: 'Constitución', backgroundEquipment: 'A', backgroundToolChoice: '', classEquipmentChoice: 'A', classSkillChoices: [], classToolsChoices: [], classSpecialChoice: '', classExpertise: [], weaponMasteries: [], selectedCantrips: [], selectedSpells: [], wizardSpellbook: [], speciesChoice: '', speciesMagicAbility: '', speciesSkill: '', speciesExtraFeat: 'Habilidoso', speciesSize: '', speciesBreathShape: 'Cono', backgroundFeatChoices: [], speciesFeatChoices: [], languages: [], rogueLanguage: '', backgroundMagicCantrips: [], backgroundMagicSpell: '', backgroundMagicAbility: 'Inteligencia', warlockTomeCantrips: [], warlockTomeRituals: [], speciesMagicCantrips: [], speciesMagicSpell: '', speciesFeatMagicAbility: 'Inteligencia', skills: '', tools: '', equipment: '', traits: '', spells: '', notes: ''
  });
  let builderData: BuilderData = createInitialBuilderData();
  function resetBuilder() {
    builderData = createInitialBuilderData();
    builderData.player = playerName || '';
    builderStep = 0; builderClassChosen = false; builderSpeciesChosen = false; builderBackgroundChosen = false; builderRolledScores = []; builderPreview = null; builderStepError = ''; lastGeneratedName = '';
  }
  const BUILDER_PORTRAITS: string[] = ["https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_Dusty_F_H.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_Irieni_H.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_annis_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_dabuus_H.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_dw_m_501_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_dw_m_502_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_dw_m_504_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_el_f_504_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_el_f_506_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_el_f_507_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_el_f_509_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_el_f_515_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_el_f_517_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_el_f_518_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_el_f_519_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_el_m_504_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_el_m_505_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_el_m_506_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_fell_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_glamis_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_gn_m_502_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_grnhag_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_ha_f_502_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_ha_f_503_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_ha_m_503_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_f_503_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_f_505_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_f_508_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_f_510_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_f_511_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_f_513_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_f_515_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_f_516_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_f_517_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_f_518_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_f_522_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_f_526_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_f_529_H.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_501_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_502_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_503_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_505_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_506_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_507_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_509_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_510_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_511_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_512_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_515_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_517_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_518_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_519_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_520_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_521_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_523_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_524_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_525_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_526_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_528_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_529_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_530_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_hu_m_532_H.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_or_m_502_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_or_m_503_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_or_m_504_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_or_m_506_H.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_orcwar_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_sormen_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_undead503_h.webp","https://akbvedwkpjokphzridla.supabase.co/storage/v1/object/public/character-portraits/original/po_undead504_h.webp"];
  let portraitPickerOpen = false;
  let portraitLoading = false;
  let portraitPickerError = '';
  let portraitFileInput: HTMLInputElement;
  function chooseBundledPortrait(path:string){builderData={...builderData,portrait:path};portraitPickerOpen=false;}

  async function migrateBundledPortraitsToSupabase() {
    if (localStorage.getItem('forja-portraits-migrated-v1') === 'yes') return;
    let migrated = 0;
    for (const publicUrl of BUILDER_PORTRAITS) {
      const filename = publicUrl.split('/').pop();
      if (!filename) continue;
      const target = SUPABASE_URL + '/storage/v1/object/public/character-portraits/original/' + filename;
      try {
        const exists = await fetch(target, { method: 'HEAD' });
        if (exists.ok) continue;
        const sourcePath = '/-creacion-personaje-dnd-2024./images/character-creation/portraits/' + filename;
        const source = await fetch(sourcePath);
        if (!source.ok) throw new Error('No se pudo leer ' + filename);
        const blob = await source.blob();
        if (blob.type !== 'image/webp') throw new Error('El retrato no es WebP: ' + filename);
        const uploaded = await fetch(SUPABASE_URL + '/storage/v1/object/character-portraits/original/' + filename, {
          method: 'POST',
          headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'image/webp', 'x-upsert': 'true' },
          body: blob
        });
        if (!uploaded.ok) throw new Error('Supabase rechazó ' + filename + ': ' + await uploaded.text());
        migrated++;
      } catch (error) {
        console.error('No se pudo migrar el retrato ' + filename, error);
      }
    }
    localStorage.setItem('forja-portraits-migrated-v1', 'yes');
    console.info('Retratos originales migrados a Supabase:', migrated);
  }
  async function chooseUploadedPortrait(event:Event){const file=(event.currentTarget as HTMLInputElement).files?.[0];if(!file)return;portraitPickerError='';if(!file.type.startsWith('image/')){portraitPickerError='Selecciona un archivo de imagen.';return;}try{const source=await new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('No se pudo leer la imagen.'));image.src=URL.createObjectURL(file);});const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('No se pudo procesar la imagen.');const scale=Math.max(256/source.width,512/source.height),w=source.width*scale,h=source.height*scale;ctx.drawImage(source,(256-w)/2,(512-h)/2,w,h);builderData={...builderData,portrait:canvas.toDataURL('image/webp',0.88)};URL.revokeObjectURL(source.src);portraitPickerOpen=false;}catch(error){portraitPickerError=error instanceof Error?error.message:'No se pudo cargar la imagen.';}finally{(event.currentTarget as HTMLInputElement).value='';}}

  const BUILDER_CLASSES = ['Bárbaro','Bardo','Brujo','Clérigo','Druida','Explorador','Guerrero','Hechicero','Mago','Monje','Paladín','Pícaro'];
  const BUILDER_CLASS_GUIDANCE: Record<string,string> = {
    'Bárbaro':'Combatiente resistente que canaliza la furia para dominar el combate cuerpo a cuerpo.',
    'Bardo':'Artista versátil que combina habilidades, apoyo al grupo y magia.',
    'Brujo':'Lanzador de conjuros cuyo poder procede de un pacto con una entidad sobrenatural.',
    'Clérigo':'Campeón de una fuerza divina que combina magia y capacidades de apoyo o combate.',
    'Druida':'Guardián de la naturaleza que utiliza magia natural y puede adoptar formas animales.',
    'Explorador':'Viajero y cazador experto en supervivencia, exploración y combate.',
    'Guerrero':'Especialista en armas y armaduras con gran versatilidad marcial.',
    'Hechicero':'Lanzador de conjuros cuya magia nace de un poder innato.',
    'Mago':'Estudioso de la magia que aprende y amplía su repertorio mediante el estudio.',
    'Monje':'Combatiente disciplinado que domina su cuerpo y canaliza su energía interior.',
    'Paladín':'Combatiente juramentado que une destreza marcial con poder sagrado.',
    'Pícaro':'Especialista ágil en sigilo, precisión, pericia y aprovechar oportunidades.'
  };
  function builderChooseBackground(event:Event|string) {
    const value=typeof event === 'string' ? event : (event.currentTarget as HTMLSelectElement).value;
    if(!value) return;
    builderBackgroundChosen=true;
    builderData.background=value;
    builderData.classSkillChoices=[];
    builderData.backgroundToolChoice=(BUILDER_BACKGROUND_TOOL_OPTIONS[value]?.length===1?BUILDER_BACKGROUND_TOOL_OPTIONS[value][0]:'');
    builderData.backgroundFeatChoices=[];
    builderData.backgroundMagicCantrips=[];
    builderData.backgroundMagicSpell='';
    builderData.feat=BUILDER_BACKGROUND_DATA[value].feat;
    builderData.abilityIncrease2=BUILDER_BACKGROUND_DATA[value].abilities[0];
    builderData.abilityIncrease1=BUILDER_BACKGROUND_DATA[value].abilities[1];
    builderData.abilityIncrease3=BUILDER_BACKGROUND_DATA[value].abilities[2];
  }
  function builderChooseSpecies(event:Event|string) {
    const value=typeof event === 'string' ? event : (event.currentTarget as HTMLSelectElement).value;
    if(!value) return;
    builderSpeciesChosen=true;
    builderData.species=value;
    builderData.speciesChoice=(BUILDER_SPECIES_CHOICES[value].length===1?BUILDER_SPECIES_CHOICES[value][0]:'');
    builderData.speciesSkill='';
    builderData.speciesMagicAbility='';
    builderData.speciesSize=(['Aasimar','Humano','Tiefling'].includes(value)?'Mediano':'');
    builderData.speciesBreathShape='Cono';
    builderData.speciesFeatChoices=[];
    builderData.speciesMagicCantrips=[];
    builderData.speciesMagicSpell='';
  }
  function builderSpellInfo(name:string):any {
    return (SPELLS as any[]).find(spell=>normalizeLevelText(spell.name)===normalizeLevelText(name)) || null;
  }
  function builderSelectClass(className:string) {
    if (builderData.className === className) { builderClassChosen = true; return; }
    builderClassChosen = true;
    builderData.className = className;
    builderData.classSkillChoices = [];
    builderData.classToolsChoices = [];
    builderData.classSpecialChoice = BUILDER_CLASS_DATA[className].specialOptions.length === 1 ? BUILDER_CLASS_DATA[className].specialOptions[0] : '';
    builderData.warlockTomeCantrips = [];
    builderData.warlockTomeRituals = [];
    builderData.classExpertise = [];
    builderData.weaponMasteries = [];
    builderData.selectedCantrips = [];
    builderData.selectedSpells = [];
    builderData.wizardSpellbook = [];
    builderData.classEquipmentChoice = 'A';
  }
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
    'Guerrero':{equipmentA:'Cota de malla, espadón, mangual, 8 jabalinas, paquete de explorador de mazmorras y 4 po.',equipmentB:'Armadura de cuero tachonado, cimitarra, espada corta, arco largo, 20 flechas, aljaba, paquete de explorador de mazmorras y 11 po.',features:'Estilo de combate (elige una dote de estilo de combate); Maestría con armas (3 tipos); Tomar aliento (2 usos).',tool:'Ninguna competencia con herramientas de clase.',weaponCount:3,cantrips:0,spells:0,slots:0,spellbook:0,specialLabel:'Estilo de combate',specialOptions:['Combate con armas a dos manos','Combate con armas arrojadizas','Diestro con dos armas','Combate sin armas','Defensa','Duelo','Intercepción','Lucha a ciegas','Protección','Tiro con arco']},
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
  const BUILDER_SKILL_DESCRIPTIONS: Record<string,string> = {
    'Acrobacias':'Mantener el equilibrio, realizar saltos, volteretas y movimientos ágiles.',
    'Atletismo':'Trepar, nadar, saltar y realizar esfuerzos físicos exigentes.',
    'Conocimiento arcano':'Recordar conocimientos sobre conjuros, objetos mágicos, símbolos y tradiciones arcanas.',
    'Engaño':'Ocultar la verdad, mentir, fingir o inducir a otros a creer algo falso.',
    'Historia':'Recordar acontecimientos históricos, linajes, civilizaciones y culturas.',
    'Interpretación':'Entretener a otros mediante música, actuación, danza o narración.',
    'Intimidación':'Influir mediante amenazas, presión o una demostración de fuerza.',
    'Investigación':'Encontrar pistas, deducir información y sacar conclusiones a partir de indicios.',
    'Juego de manos':'Realizar trucos manuales, esconder objetos o manipular mecanismos pequeños con destreza.',
    'Medicina':'Estabilizar a criaturas heridas y reconocer enfermedades o lesiones.',
    'Naturaleza':'Recordar información sobre terrenos, plantas, animales, clima y ciclos naturales.',
    'Perspicacia':'Detectar estados de ánimo, intenciones y posibles engaños observando a otros.',
    'Persuasión':'Convencer o influir mediante argumentos, diplomacia y tacto.',
    'Percepción':'Advertir detalles del entorno usando los sentidos.',
    'Religión':'Recordar conocimientos sobre deidades, ritos, símbolos y prácticas religiosas.',
    'Sigilo':'Moverse sin ser detectado y ocultar la propia presencia.',
    'Supervivencia':'Seguir rastros, orientarse, encontrar alimento y desenvolverse en la naturaleza.',
    'Trato con animales':'Calmar, comprender, controlar o adiestrar animales.'
  };
  function builderSkillDescription(skill:string):string {
    return BUILDER_SKILL_DESCRIPTIONS[skill] || '';
  }
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
  function getWarlockInvocationData(name:string) {
    return BUILDER_WARLOCK_INVOCATIONS.find(item=>normalizeLevelText(item.name)===normalizeLevelText(name));
  }
  function getWarlockInvocationSlotName(entry:string) { return String(entry||'').split(':')[0].trim(); }
  function getWarlockInvocationSlotChoice(entry:string) { return String(entry||'').split(':').slice(1).join(':').trim(); }
  function getWarlockCantripQualifies(name:string,kind:string,target:RawSheet) {
    const spell=getSpellRecord(name);
    if(!spell || spell.level!==0 || !spell.classes?.some((value:string)=>normalizeLevelText(value)==='brujo')) return false;
    const description=String(spell.description||'');
    const damage=/\d+d\d+/.test(description)&&normalizeLevelText(description).includes('dano');
    const attack=normalizeLevelText(description).includes('ataque de conjuro');
    const range=String(spell.range||'').match(/(\d+(?:[.,]\d+)?)\s*m/i);
    const meters=range?Number(range[1].replace(',','.')):0;
    return kind==='damage'?damage:kind==='attack'?damage&&attack:damage&&meters>=3;
  }
  function getWarlockInvocationOptions(targetLevel:number,slotIndex:number) {
    const selected=levelUpInvocationSlots.map((entry,index)=>index===slotIndex?'':normalizeLevelText(getWarlockInvocationSlotName(entry)));
    return BUILDER_WARLOCK_INVOCATIONS.filter(item=>{
      if(item.level>targetLevel) return false;
      if(!item.repeatable && selected.includes(normalizeLevelText(item.name))) return false;
      if(item.pact && !selected.includes(normalizeLevelText(item.pact))) return false;
      if(item.cantrip && !splitChoiceList(levelUpClassCantrips).some(name=>getWarlockCantripQualifies(name,item.cantrip!,levelUpEntry?.sheet||{}))) return false;
      if(item.choice==='feat' && !BUILDER_FEATS.some(feat=>!splitChoiceList(getCharacterStat(levelUpEntry?.sheet||{},'RASGOS Y DOTES','Dotes de origen')).some(old=>normalizeLevelText(old)===normalizeLevelText(feat)))) return false;
      return true;
    });
  }
  function getWarlockInvocationChoiceOptions(name:string,slotIndex:number) {
    const item=getWarlockInvocationData(name);
    if(!item) return [];
    const otherChoices=levelUpInvocationSlots.filter((entry,index)=>index!==slotIndex && normalizeLevelText(getWarlockInvocationSlotName(entry))===normalizeLevelText(name)).map(getWarlockInvocationSlotChoice).map(normalizeLevelText);
    if(item.choice==='feat') return BUILDER_FEATS.filter(feat=>!otherChoices.includes(normalizeLevelText(feat)) && !splitChoiceList(getCharacterStat(levelUpEntry?.sheet||{},'RASGOS Y DOTES','Dotes de origen')).some(old=>normalizeLevelText(old)===normalizeLevelText(feat)));
    if(item.cantrip) return splitChoiceList(levelUpClassCantrips || getCharacterStat(levelUpEntry?.sheet||{},'CONJUROS','Trucos de clase') || getCharacterStat(levelUpEntry?.sheet||{},'CONJUROS','Trucos')).filter(cantrip=>getWarlockCantripQualifies(cantrip,item.cantrip!,levelUpEntry?.sheet||{}) && !otherChoices.includes(normalizeLevelText(cantrip)));
    return [];
  }
  function setWarlockInvocationName(index:number,name:string) {
    const next=[...levelUpInvocationSlots];
    next[index]=name;
    levelUpInvocationSlots=next;
    levelUpInvocations=next.filter(Boolean).join(', ');
  }
  function setWarlockInvocationChoice(index:number,choice:string) {
    const next=[...levelUpInvocationSlots];
    const name=getWarlockInvocationSlotName(next[index]||'');
    next[index]=choice?name+': '+choice:name;
    levelUpInvocationSlots=next;
    levelUpInvocations=next.filter(Boolean).join(', ');
  }
  function getWarlockTomeCantripOptions(target:RawSheet,index:number) {
    const oldPact=splitChoiceList(getCharacterStat(target,'CONJUROS','Trucos de pacto'));
    const known=splitChoiceList(getCharacterStat(target,'CONJUROS','Trucos')).filter(name=>!oldPact.some(old=>normalizeLevelText(old)===normalizeLevelText(name)));
    const classKnown=splitChoiceList(levelUpClassCantrips || getCharacterStat(target,'CONJUROS','Trucos de clase'));
    const selected=levelUpWarlockTomeCantrips.filter((_,i)=>i!==index);
    return BUILDER_TOME_CANTRIPS.filter(name=>!known.some(old=>normalizeLevelText(old)===normalizeLevelText(name)) && !classKnown.some(old=>normalizeLevelText(old)===normalizeLevelText(name)) && !selected.some(old=>normalizeLevelText(old)===normalizeLevelText(name)));
  }
  function getWarlockTomeRitualOptions(target:RawSheet,index:number) {
    const oldPact=splitChoiceList(getCharacterStat(target,'CONJUROS','Conjuros rituales de pacto'));
    const known=[...splitChoiceList(levelUpClassSpells || getCharacterStat(target,'CONJUROS','Conjuros preparados de clase')),...splitChoiceList(getCharacterStat(target,'CONJUROS','Conjuros siempre preparados de subclase'))].filter(name=>!oldPact.some(old=>normalizeLevelText(old)===normalizeLevelText(name)));
    const selected=levelUpWarlockTomeRituals.filter((_,i)=>i!==index);
    return BUILDER_TOME_RITUALS.filter(name=>!known.some(old=>normalizeLevelText(old)===normalizeLevelText(name)) && !selected.some(old=>normalizeLevelText(old)===normalizeLevelText(name)));
  }
  function setWarlockTomeCantrip(index:number,name:string) { const next=[...levelUpWarlockTomeCantrips]; next[index]=name; levelUpWarlockTomeCantrips=next; }
  function setWarlockTomeRitual(index:number,name:string) { const next=[...levelUpWarlockTomeRituals]; next[index]=name; levelUpWarlockTomeRituals=next; }
  function getWarlockArcanumOptions(level:number):string[] {
    return [...new Set((SPELLS as any[]).filter(spell=>spell.level===level && spell.classes?.some((name:string)=>normalizeLevelText(name)==='brujo')).map(spell=>spell.name))].sort((a,b)=>a.localeCompare(b,'es'));
  }
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
    if(builderStep===0) return true;
    if(builderStep===1) return builderClassChosen;
    if(builderStep===2) {
      if(!builderBackgroundChosen) return false;
      const options=BUILDER_BACKGROUND_TOOL_OPTIONS[builderData.background]||[];
      const feat=BUILDER_BACKGROUND_DATA[builderData.background].feat;
      const abilities=BUILDER_BACKGROUND_DATA[builderData.background].abilities;
      const increasesOk=builderData.abilityIncreaseMode==='two'
        ? abilities.includes(builderData.abilityIncrease2)&&abilities.includes(builderData.abilityIncrease1)&&builderData.abilityIncrease1!==builderData.abilityIncrease2
        : abilities.includes(builderData.abilityIncrease1)&&abilities.includes(builderData.abilityIncrease2)&&abilities.includes(builderData.abilityIncrease3)&&new Set([builderData.abilityIncrease1,builderData.abilityIncrease2,builderData.abilityIncrease3]).size===3;
      return (!options.length||options.includes(builderData.backgroundToolChoice))&&builderOriginFeatChoicesOk(feat,builderData.backgroundFeatChoices,builderData.backgroundMagicCantrips,builderData.backgroundMagicSpell)&&increasesOk;
    }
    if(builderStep===3) {
      if(!builderSpeciesChosen) return false;
      const choiceOk=BUILDER_SPECIES_CHOICES[builderData.species].length===0||BUILDER_SPECIES_CHOICES[builderData.species].includes(builderData.speciesChoice);
      const skillOk=!['Elfo','Humano'].includes(builderData.species)||(BUILDER_SKILL_OPTIONS.includes(builderData.speciesSkill)&&!BUILDER_BACKGROUND_DATA[builderData.background].skills.includes(builderData.speciesSkill));
      const magicOk=!['Elfo','Gnomo','Tiefling'].includes(builderData.species)||['Inteligencia','Sabiduría','Carisma'].includes(builderData.speciesMagicAbility);
      const sizeOk=!['Aasimar','Humano','Tiefling'].includes(builderData.species)||Boolean(builderData.speciesSize);
      const feat=builderData.speciesExtraFeat;
      const featOk=builderData.species!=='Humano'||builderOriginFeatChoicesOk(feat,builderData.speciesFeatChoices,builderData.speciesMagicCantrips,builderData.speciesMagicSpell);
      return choiceOk&&skillOk&&magicOk&&sizeOk&&featOk;
    }
    if(builderStep===4) {
      const values=Object.values(builderData.abilities).map(Number), sorted=[...values].sort((a,b)=>b-a);
      return builderData.method==='standard'?JSON.stringify(sorted)===JSON.stringify([15,14,13,12,10,8]):builderData.method==='pointBuy'?values.every(v=>v>=8&&v<=15)&&builderPointCost()===27:builderData.method==='rolled'?builderRolledScores.length===6&&JSON.stringify(sorted)===JSON.stringify([...builderRolledScores].sort((a,b)=>b-a)):BUILDER_ABILITY_NAMES.every(name=>Number.isInteger(Number(builderData.abilities[name]))&&Number(builderData.abilities[name])>=1&&Number(builderData.abilities[name])<=20);
    }
    if(builderStep===5) return builderAdjustedAbilities() && BUILDER_ABILITY_NAMES.every(name=>builderAdjustedAbilities()[name]<=20);
    if(builderStep===6) {
      const cls=BUILDER_CLASS_DATA[builderData.className];
      const selected=builderData.classSkillChoices.filter(Boolean);
      const skillsOk=selected.length===BUILDER_CLASS_SKILLS[builderData.className].count&&new Set(selected).size===selected.length;
      const masteriesOk=builderData.weaponMasteries.length===cls.weaponCount;
      const toolsOk=builderData.classToolsChoices.length===(builderData.className==='Bardo'?3:builderData.className==='Monje'?1:0);
      const expertiseOk=builderData.className!=='Pícaro'||builderData.classExpertise.length===2;
      const specialOk=cls.specialOptions.length===0||cls.specialOptions.includes(builderData.classSpecialChoice);
      return skillsOk&&masteriesOk&&toolsOk&&expertiseOk&&specialOk;
    }
    if(builderStep===7) return Boolean(builderData.backgroundEquipment)&&Boolean(builderData.classEquipmentChoice);
    if(builderStep===8) {
      const cls=BUILDER_CLASS_DATA[builderData.className];
      const bonus=(builderData.className==='Clérigo'&&builderData.classSpecialChoice==='Taumaturgo')||(builderData.className==='Druida'&&builderData.classSpecialChoice==='Naturalista')?1:0;
      return builderData.selectedCantrips.length===cls.cantrips+bonus&&builderData.selectedSpells.length===cls.spells&&(cls.spellbook===0||builderData.wizardSpellbook.length===cls.spellbook);
    }
    if(builderStep===9) return builderData.languages.length===2&&(builderData.className!=='Pícaro'||Boolean(builderData.rogueLanguage));
    if(builderStep===10) return true;
    return builderCanFinish();
  }
  function keepBuilderAtTop() {
    requestAnimationFrame(() => document.querySelector('.builder-panel')?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  }
  function builderNext() {
    if(builderStep<11) {
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
      const dexMod=Math.floor((scores.Destreza-10)/2),conMod=Math.floor((scores.Constitución-10)/2),wisMod=Math.floor((scores.Sabiduría-10)/2),chaMod=Math.floor((scores.Carisma-10)/2);
      let ac:number|null=null;
      if(armorFormula.startsWith('10 + DES + CON')) ac=10+dexMod+conMod;
      else if(armorFormula.startsWith('10 + DES + CAR')) ac=10+dexMod+chaMod;
      else if(armorFormula.startsWith('10 + DES + SAB')) ac=10+dexMod+wisMod;
      else if(armorFormula.startsWith('13 + DES (máx. +2)')) ac=13+Math.min(2,dexMod)+2;
      else if(armorFormula.startsWith('11 + DES + escudo')) ac=11+dexMod+2;
      else if(armorFormula.startsWith('16 + escudo')) ac=18;
      else if(armorFormula.startsWith('16 (cota de malla)')) ac=16;
      else if(armorFormula.startsWith('12 + DES')) ac=12+dexMod;
      else if(armorFormula.startsWith('13 + DES')) ac=13+dexMod;
      else if(armorFormula.startsWith('11 + DES')) ac=11+dexMod;
      else if(armorFormula.startsWith('10 + DES')) ac=10+dexMod;
      if(ac!==null) setCharacterStat(target,'COMBATE','Armor Class',String(ac));
    }
    const skillRaw=getCharacterStat(target,'COMPETENCIAS','Skills');
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
    setCharacterStat(target,'COMBATE','Initiative',signedBonus(initiative));
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
      general('COMBATE',['Puntos de golpe actuales','Puntos de golpe máximos','Dados de golpe','Armor Class','Initiative','Speed','Bonificador por competencia','Salvaciones','Fórmula de clase de armadura']),
      general('SALVACIONES',BUILDER_ABILITY_NAMES),
      general('HABILIDADES',BUILDER_SKILL_OPTIONS),
      general('COMPETENCIAS',['Skills','Herramientas','Armaduras','Armas','Languages']),
      general('RASGOS Y DOTES',['Rasgos de clase','Rasgos de especie','Dote de origen','Otros rasgos','Formas salvajes conocidas','Opciones de metamagia','Invocaciones sobrenaturales','Detalles de invocaciones','Maniobras de maestro del combate','Estilos de combate']),
      general('CONJUROS',['Aptitud mágica','CD de salvación','Ataque de conjuro','Trucos','Conjuros de nivel 1','Espacios de conjuro','Trucos máximos','Conjuros preparados máximos','Espacios por nivel','Trucos de clase','Conjuros preparados de clase','Libro de conjuros','Conjuros de especie','Aptitud mágica de especie','CD de especie','Ataque de conjuro de especie','Conjuros de trasfondo','Aptitud mágica de trasfondo','CD de trasfondo','Ataque de conjuro de trasfondo','Conjuros de dote','Aptitud mágica de dote','CD de dote','Ataque de conjuro de dote','Trucos de subclase','Conjuros preparados de subclase','Aptitud mágica de subclase','CD de subclase','Ataque de conjuro de subclase','Trucos de estilo de combate','Aptitud mágica de estilo de combate','CD de estilo de combate','Ataque de conjuro de estilo de combate','Lista de conjuros de estilo de combate','Arcanum místico','Conjuros de escuela','Opción de Furia elemental','Opción de Golpes benditos','Maestría sobre conjuros nivel 1','Maestría sobre conjuros nivel 2','Conjuros característicos']),
      general('EQUIPO',['Equipo inicial','Monedas']),
      general('HISTORIA',['Apariencia','Rasgos de personalidad','Ideal','Vínculo','Defecto','Historia','Notas']),
      general('PROGRESIÓN',['Nivel de clase','Rasgos de clase obtenidos']),
      general('DETALLES DEL TRASFONDO',['Aumentos de característica permitidos','Skills','Herramienta','Dote de origen','Equipo del trasfondo']),
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
    put(2,0,String(Math.max(1,hp))+' PG'); put(2,1,String(Math.max(1,hp))+' PG'); put(2,2,'1d'+(BUILDER_HIT_DIE[b.className] || 8)); put(2,3,String(builderStartingAC())); put(2,8,builderStartingACFormula()); put(2,4,(builderModifier(Number(finalAbilities.Destreza)) + ([b.feat,b.species === 'Humano' ? b.speciesExtraFeat : ''].includes('Alerta') ? 2 : 0) >= 0 ? '+' : '') + (builderModifier(Number(finalAbilities.Destreza)) + ([b.feat,b.species === 'Humano' ? b.speciesExtraFeat : ''].includes('Alerta') ? 2 : 0))); put(2,5,(b.species === 'Goliat' || (b.species === 'Elfo' && b.speciesChoice === 'Elfo de los bosques') ? '10,5 m' : '9 m')); put(2,6,proficiency); put(2,7,BUILDER_SAVES[b.className] || '—');
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
    const result={id:Date.now(),name:b.name || 'Personaje sin nombre',portrait:b.portrait || '',notes:'Personaje de nivel 1 creado desde el asistente de creación del jugador. La ficha conserva elecciones, progresión y descripciones disponibles en los datos del Manual del Jugador 2024.',sections:pairs.flatMap(p=>[p.heading,p.values])} as RawSheet;
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
      builderData.player = playerName || builderData.player || '';
      const generated = buildLevelOneSheet();
      if (!generated || !Array.isArray(generated.sections) || !generated.sections.length) {
        throw new Error('La ficha se generó sin secciones. Revisa las elecciones y vuelve a intentarlo.');
      }
      // El resumen es la última etapa: guardar directamente en el almacenamiento local del jugador.
      const characterToSave = JSON.parse(JSON.stringify(generated)) as RawSheet;
      localStorage.setItem('forja-raw-character', JSON.stringify(characterToSave));
      builderPreview = null;
      sheet = characterToSave;
      playerCreating = false;
      demoPreview = false;
      activeTab = 'Datos';
      builderStep = 0;
      notice = 'Personaje guardado en este dispositivo.';
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
      await saveCharacterToSupabase(characterToSave);
      builderPreview = null;
      playerCreating = false;
      activeTab = 'Datos';
      notice = 'Personaje guardado localmente en este dispositivo.';
    } catch (error) {
      notice = 'No se pudo guardar el personaje: ' + (error instanceof Error ? error.message : String(error));
    } finally {
      builderSaving = false;
    }
  }
  function startBuilder() {
    if (sheet && !demoPreview) {
      const confirmed = window.confirm('¿Crear un personaje nuevo? La ficha actual se eliminará permanentemente de este dispositivo y no se podrá recuperar. Exporta una copia antes si deseas conservarla.');
      if (!confirmed) return;
      sheet = null;
      localStorage.removeItem('forja-raw-character');
    }
    if (demoPreview) sheet = null;
    demoPreview = false;
    importOpen = false;
    resetBuilder();
    playerCreating = true;
  }
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


  type Combatant = { id:string; monster:any; name:string; ac:number; hp:number; maxHp:number; tempHp:number; initiative:number; damageInput:number; compact:boolean; dead:boolean; acMod:number; participating:boolean };
  type InitiativeParticipant = { id:string; name:string; bonus:number; roll:number; total:number; tieRoll?:number };
  const COMBATANTS_STORAGE_KEY = 'forja-combatants-v1';
  const INITIATIVE_STORAGE_KEY = 'forja-initiative-v1';
  let combatants: Combatant[] = [];
  let combatantsStorageReady = false;
  let initiativeStorageReady = false;
  let showAllCombatants = false;
  let initiativeOrder: InitiativeParticipant[] = [];
  let activeInitiativeIndex = 0;
  let initiativeRound = 1;
  const INITIATIVE_STATE_CHANNEL = 'com.heunithen.forja/initiative-state';
  const INITIATIVE_STATE_REQUEST_CHANNEL = 'com.heunithen.forja/initiative-state-request';
  let sharedInitiativeOrder: InitiativeParticipant[] = [];
  let sharedActiveInitiativeIndex = 0;
  let sharedInitiativeRound = 1;

  // Publicar el estado completo del tracker para las fichas de los jugadores.
  function broadcastInitiativeState(): void {
    if (!obrReady || obrRole !== 'GM') return;
    const sharedState = {
      order: initiativeOrder.map(participant => ({...participant})),
      activeIndex: activeInitiativeIndex,
      round: initiativeRound
    };
    void OBR.broadcast.sendMessage(INITIATIVE_STATE_CHANNEL, sharedState, {destination:'REMOTE'})
      .catch(error => console.error('No se pudo sincronizar la iniciativa con los jugadores', error));
  }
  $: if (obrReady && obrRole === 'GM') {
    initiativeOrder;
    activeInitiativeIndex;
    initiativeRound;
    broadcastInitiativeState();
  }

  // Persistir los encuentros y la ronda en este dispositivo entre recargas.
  $: if (combatantsStorageReady) {
    try { localStorage.setItem(COMBATANTS_STORAGE_KEY, JSON.stringify(combatants)); } catch (error) { console.error('No se pudieron guardar los monstruos del combate', error); }
  }
  $: if (initiativeStorageReady) {
    try {
      localStorage.setItem(INITIATIVE_STORAGE_KEY, JSON.stringify({
        order: initiativeOrder,
        activeIndex: activeInitiativeIndex,
        round: initiativeRound
      }));
    } catch (error) { console.error('No se pudo guardar el tracker de iniciativa', error); }
  }
    let combatRollMode: 'normal'|'advantage'|'disadvantage' = 'normal';
  let combatSort = true;
  function monsterNumber(monster:any,label:string): number {
    const raw=String(monster.statBlock||'');
    if(label==='Armor Class'){const m=raw.match(/^AC\s*(\d+)/im);return m?Number(m[1]):0;}
    if(label==='Initiative'){const m=raw.match(/Initiative\s*([+-]\d+)/i);return m?Number(m[1]):0;}
    if(label==='Hit Points'){const m=raw.match(/^HP\s*(\d+)/im);return m?Number(m[1]):0;}
    const row=parseMonsterProfile(monster).info.find(x=>x.label===label);
    const value=String(row?.value||'').match(/-?\d+/);
    return value ? Number(value[0]) : 0;
  }
  function monsterMaxHp(monster:any): number {
    const row=parseMonsterProfile(monster).info.find(x=>x.label==='Hit Points');
    return Number(String(row?.value||'').match(/^\s*(\d+)/)?.[1] || 1);
  }
  function addCombatant(monster:any) {
    const maxHp=monsterMaxHp(monster);
    combatants=[...combatants,{id:String(Date.now())+Math.random().toString(36).slice(2),monster,name:monster.name,ac:monsterNumber(monster,'Armor Class'),hp:maxHp,maxHp,tempHp:0,initiative:monsterNumber(monster,'Initiative'),damageInput:0,compact:true,dead:false,acMod:0,participating:true}];
    masterTab='Combate';
    showAllCombatants=false;
    notice=monster.name+' añadido y marcado como participante.';
  }
  function duplicateCombatant(id:string) {
    const original=combatants.find(x=>x.id===id); if(!original)return;
    combatants=[...combatants,{...original,id:String(Date.now())+Math.random().toString(36).slice(2),name:original.name+' 2',hp:original.maxHp,tempHp:0,damageInput:0,dead:false}];
  }
  function removeCombatant(id:string) {
    combatants=combatants.filter(x=>x.id!==id);
    initiativeOrder=initiativeOrder.filter(x=>x.id!=='monster:'+id);
    if(activeInitiativeIndex>=initiativeOrder.length) activeInitiativeIndex=Math.max(0,initiativeOrder.length-1);
  }
  function playerInitiative(entry:RoomEntry):number {
    const raw=getCharacterStat(entry.sheet,'COMBATE','Initiative') || getCharacterStat(entry.sheet,'COMBATE','Iniciativa') || '0';
    const match=String(raw).replace(/−/g,'-').match(/[+-]?\d+/);
    return match ? Number(match[0]) : 0;
  }
  function getInitiativeParticipants():InitiativeParticipant[] {
    // La lista del director ya combina personajes conectados y fichas guardadas en esta sala.
    // Se incluyen todos los personajes del roster, sin exigir que tengan el indicador live activo.
    const players=roomSheets.map(entry=>({id:'player:'+entry.playerId,name:String(entry.sheet?.name || entry.playerName || 'Personaje'),bonus:playerInitiative(entry),roll:0,total:0}));
    const monsters=combatants.filter(c=>c.participating!==false).map(c=>({id:'monster:'+c.id,name:c.name,bonus:Number(c.initiative)||0,roll:0,total:0}));
    return [...players,...monsters];
  }

  function rollInitiativeDie():number { return Math.floor(Math.random()*20)+1; }
  function rollInitiative():void {
    const participants=getInitiativeParticipants();
    if(!participants.length){initiativeOrder=[];notice='No hay participantes en el combate.';return;}
    participants.forEach(p=>{p.roll=rollInitiativeDie();p.total=p.roll+p.bonus;delete p.tieRoll;});
    participants.sort((a,b)=>b.total-a.total);
    let start=0;
    while(start<participants.length){
      let end=start+1;
      while(end<participants.length&&participants[end].total===participants[start].total)end++;
      if(end-start>1){
        const tied=participants.slice(start,end);
        let attempts=0;
        while(tied.length>1&&attempts<100){
          attempts++;
          tied.forEach(p=>{p.tieRoll=rollInitiativeDie()+p.bonus;});
          tied.sort((a,b)=>(b.tieRoll||0)-(a.tieRoll||0));
          for(let i=tied.length-1;i>0;i--)if(tied[i].tieRoll===tied[i-1].tieRoll){tied.splice(i-1,2,...tied.slice(i-1,i+1));}
          const unique=tied.every((p,i)=>i===0||p.tieRoll!==tied[i-1].tieRoll);
          if(unique)break;
        }
        participants.splice(start,end-start,...tied);
      }
      start=end;
    }
    initiativeOrder=participants;
    activeInitiativeIndex=0;
    initiativeRound=1;
    void publishInitiativeOrder(participants);
    broadcastInitiativeState();
  }
  function startInitiativeAtZero():void {
    const participants=getInitiativeParticipants();
    if(!participants.length){initiativeOrder=[];notice='No hay participantes en el combate.';return;}
    participants.forEach(p=>{p.roll=0;p.total=0;delete p.tieRoll;});
    initiativeOrder=participants;
    activeInitiativeIndex=0;
    initiativeRound=1;
    notice='Tracker iniciado con todos los participantes en iniciativa 0.';
    broadcastInitiativeState();
  }
  const INITIATIVE_NOTICE_CHANNEL='com.heunithen.forja/initiative-order-notice';
  async function publishInitiativeOrder(participants:InitiativeParticipant[]):Promise<void> {
    const lines=participants.map((p,i)=>(i+1)+') '+p.name+' — '+p.total);
    const message='Orden de iniciativa\n'+lines.join('\n');
    try {
      await OBR.notification.show(message,'INFO');
      await OBR.broadcast.sendMessage(INITIATIVE_NOTICE_CHANNEL,{message},{destination:'REMOTE'});
    } catch(error) { console.error('No se pudo mostrar el orden de iniciativa',error); }
  }
  function moveInitiativeTurn(direction:number):void {
    if(!initiativeOrder.length)return;
    const next=activeInitiativeIndex+direction;
    if(next>=initiativeOrder.length){activeInitiativeIndex=0;initiativeRound++;}
    else if(next<0){activeInitiativeIndex=initiativeOrder.length-1;initiativeRound=Math.max(1,initiativeRound-1);}
    else activeInitiativeIndex=next;
    broadcastInitiativeState();
  }
  function toggleCombatantParticipation(id:string,event:Event):void {
    const checked=(event.currentTarget as HTMLInputElement).checked;
    updateCombatant(id,{participating:checked});
    if(!checked){
      const removedIndex=initiativeOrder.findIndex(p=>p.id==='monster:'+id);
      initiativeOrder=initiativeOrder.filter(p=>p.id!=='monster:'+id);
      if(removedIndex>=0&&removedIndex<activeInitiativeIndex)activeInitiativeIndex--;
      if(activeInitiativeIndex>=initiativeOrder.length)activeInitiativeIndex=Math.max(0,initiativeOrder.length-1);
    }
  }
  function setCombatantField(id:string,field:'name'|'ac'|'hp'|'initiative'|'damageInput',event:Event) {
    const value=(event.target as HTMLInputElement).value;
    if(field==='name') updateCombatant(id,{name:value});
    else if(field==='ac') updateCombatant(id,{acMod:Number(value)- (combatants.find(c=>c.id===id)?.ac||0)});
    else if(field==='hp'){const c=combatants.find(x=>x.id===id);if(c){const hp=Math.min(c.maxHp,Math.max(0,Number(value)||0));updateCombatant(id,{hp,dead:hp===0});}}
    else if(field==='initiative') updateCombatant(id,{initiative:Number(value)||0});
    else updateCombatant(id,{damageInput:Number(value)||0});
  }
  function updateCombatant(id:string,patch:Partial<Combatant>) {
    combatants=combatants.map(c=>c.id===id?{...c,...patch}:c);
  }
  function adjustCombatHp(id:string,amount:number) {
    const c=combatants.find(x=>x.id===id); if(!c)return;
    if(amount<0){
      const damage=Math.abs(amount),absorbed=Math.min(c.tempHp,damage),remaining=damage-absorbed;
      updateCombatant(id,{tempHp:c.tempHp-absorbed,hp:Math.max(0,c.hp-remaining),dead:c.hp-remaining<=0});
    } else updateCombatant(id,{hp:Math.min(c.maxHp,c.hp+amount),dead:false});
  }
  function setCombatTempHp(id:string,value:number) {
    const c=combatants.find(x=>x.id===id); if(!c)return;
    updateCombatant(id,{tempHp:Math.max(c.tempHp,Math.max(0,Number(value)||0))});
  }
  function applyCombatDamage(id:string,kind:'damage'|'heal') {
    const c=combatants.find(x=>x.id===id); if(!c)return;
    const amount=Math.max(0,Math.floor(Number(c.damageInput)||0));
    if(!amount)return;
    adjustCombatHp(id,kind==='damage'?-amount:amount);
    updateCombatant(id,{damageInput:0});
  }
  function combatInitiative(id:string) {
    const c=combatants.find(x=>x.id===id); if(!c)return;
    const bonus=Number(c.initiative)||0;
    sendCombatRoll('1d20'+(bonus>=0?'+':'')+bonus,c.name+' · Iniciativa',true);
  }
  async function sendCombatRoll(notation:string,label:string,initiative=false) {
    if(combatRollMode!=='normal' && /^1d20[+-]?\d*$/.test(notation) && !initiative){
      const match=notation.match(/^1d20([+-]\d+)?$/); if(match){
        const bonus=Number(match[1]||0);
        await performCustomRoll({id:'combat',name:label,parts:[]},{id:'combat',name:label,die:20,bonus},combatRollMode);
        return;
      }
    }
    await sendSheetRoll(notation,label);
  }
  function getMonsterCombatActions(monster:any) {
    const sections=parseMonsterProfile(monster).sections;
    return sections.flatMap(section=>section.entries.map(entry=>{
      const text=entry.description;
      const attack=text.match(/Attack Roll:\s*([+-]\d+)/i);
      const damage=text.match(/Hit:\s*[\d,]+\s*\(([^)]+)\)/i);
      const dc=text.match(/(?:save|saving throw)[^\n]{0,50}?DC\s*(\d+)/i) || text.match(/DC\s*(\d+)/i);
      const damageNotation=damage?.[1]?.replace(/\s+/g,'').replace(/×/g,'*') || '';
      return {...entry,attackNotation:attack?'1d20'+attack[1]:'',damageNotation:/^\d*d(?:4|6|8|10|12|20)(?:[+-]\d+)?$/i.test(damageNotation)?damageNotation:'',dc:dc?.[1]||''};
    })).filter(x=>x.attackNotation||x.damageNotation||x.dc);
  }
  let lastRollId = '';
  const DICE_PLUS_SOURCE = 'com.heunithen.dnd2024-character-builder';

  function parseMonsterProfile(monster: any) {
    const raw = String(monster.statBlock || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const sections: { title: string; entries: { name: string; description: string }[] }[] = [];
    const info: { label: string; value: string }[] = [];
    let current: { title: string; entries: { name: string; description: string }[] } | null = null;
    const sectionNames: Record<string,string> = {'TRAITS':'Traits','ACTIONS':'Actions','BONUS ACTIONS':'Bonus Actions','REACTIONS':'Reactions','LEGENDARY ACTIONS':'Legendary Actions','MYTHIC ACTIONS':'Mythic Actions','LAIR ACTIONS':'Lair Actions'};
    const labelMap: [RegExp,string][] = [
      [/^AC\s*/i,'Armor Class'],[/^HP\s*/i,'Hit Points'],[/^Speed\s*/i,'Speed'],[/^Skills\s*/i,'Skills'],[/^Resistances\s*/i,'Resistances'],[/^Immunities\s*/i,'Immunities'],[/^Condition Immunities\s*/i,'Condition Immunities'],[/^Vulnerabilities\s*/i,'Vulnerabilities'],[/^Gear\s*/i,'Gear'],[/^Senses\s*/i,'Senses'],[/^Languages\s*/i,'Languages'],[/^Initiative\s*/i,'Initiative']
    ];
    for (const line of raw) {
      if (/^CONTEXTO COMPARTIDO:/i.test(line) || line.toUpperCase() === String(monster.name).toUpperCase()) continue;
      const header = line.toUpperCase().replace(/[^A-Z ]/g,'').trim();
      if (sectionNames[header]) { current = {title:sectionNames[header],entries:[]}; sections.push(current); continue; }
      const ability = line.match(/^(STR|DEX|CON|INT|WIS|CHA)\s+(.*)$/i);
      if (ability) {
        const names: Record<string,string> = {STR:'Strength',DEX:'Dexterity',CON:'Constitution',INT:'Intelligence',WIS:'Wisdom',CHA:'Charisma'};
        info.push({label:names[ability[1].toUpperCase()],value:ability[2].replace(/Save/gi,'Save')}); continue;
      }
      let matched = false;
      for (const [regex,label] of labelMap) {
        const m = line.match(regex);
        if (m) { info.push({label,value:line.slice(m[0].length)}); matched=true; break; }
      }
      if (matched) continue;
      if (/^(Tiny|Small|Medium|Large|Huge|Gargantuan)\b/.test(line)) { info.unshift({label:'Type and Alignment',value:line}); continue; }
      if (/^CR\s/i.test(line)) { info.push({label:'Challenge Rating',value:line.replace(/^CR\s*/i,'')}); continue; }
      if (current) {
        const split = line.match(/^([^.!?]{2,90})\.\s+(.+)$/);
        if (split) current.entries.push({name:split[1],description:split[2]});
        else if (current.entries.length) current.entries[current.entries.length-1].description += ' ' + line;
        else current.entries.push({name:'',description:line});
      } else info.push({label:'Other Details',value:line});
    }
    return {info,sections};
  }

  function monsterQuickLabel(label: string): string {
    return ({'Armor Class':'AC','Hit Points':'HP','Speed':'Speed','Initiative':'Init'} as Record<string,string>)[label] || label;
  }
  function monsterAbilityLabel(label: string): string {
    return ({'Strength':'STR','Dexterity':'DEX','Constitution':'CON','Intelligence':'INT','Wisdom':'WIS','Charisma':'CHA'} as Record<string,string>)[label] || label;
  }
  function itemDescription(item: any): string {
    if (item.description || item.effect) return String(item.description || item.effect);
    const name = String(item.name || '');
    const type = String(item.type || '');
    if (type === 'Arma') return 'Arma para realizar ataques. Sus propiedades y el daño dependen de su ficha de equipo.';
    if (type === 'Armadura' || type === 'Escudo') return 'Equipo defensivo que modifica la Clase de Armadura según sus reglas.';
    if (type === 'Herramienta') return 'Herramienta utilizada para realizar pruebas de característica y tareas relacionadas con su oficio.';
    if (type === 'Montura') return 'Criatura entrenada para transportar a una o más criaturas.';
    if (type === 'Vehículo y transporte') return 'Medio de transporte; su uso depende del terreno y de las reglas del vehículo.';
    if (type === 'Equipo' && /poción de curación/i.test(name)) return 'Al beberla, recuperas 2d4 + 2 puntos de golpe.';
    if (type === 'Equipo') return 'Equipo de aventura utilizado para la actividad indicada por su nombre.';
    return 'Objeto mágico. Su nombre identifica el efecto principal; consulta la descripción completa de este objeto en la Guía del Dungeon Master. El catálogo todavía no contiene el texto de sus propiedades.';
  }

  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  function startsWithLetter(name: string, letter: string) {
    const initial = String(letter || '').trim().toLocaleUpperCase('en');
    const normalizedName = String(name || '').trimStart().normalize('NFD').replace(/\p{M}/gu, '').toLocaleUpperCase('en');
    return !initial || normalizedName.startsWith(initial);
  }
  const MONSTER_CR_FILTERS = ['Todos', ...Array.from(new Set(MONSTERS.map(monster => monster.cr.split(' ')[0]))).sort((a, b) => { const value = (cr: string) => { const [n, d] = cr.split('/').map(Number); return d ? n / d : n; }; return value(a) - value(b); })];
  $: filteredMonsters = (monsterSearch.trim() || monsterCrFilter || monsterLetterFilter) ? MONSTERS.filter(monster => (!monsterCrFilter || monster.cr.startsWith(monsterCrFilter + ' ')) && startsWithLetter(monster.name, monsterLetterFilter) && (!monsterSearch.trim() || monster.name.toLowerCase().includes(monsterSearch.trim().toLowerCase()))).sort((a,b) => a.name.localeCompare(b.name,'en',{sensitivity:'base'})) : [];
  const itemTypes = ['Todos', ...Array.from(new Set(ITEMS.map(item => item.type))).sort((a,b) => a.localeCompare(b,'es'))];
  function itemPriceGold(price: string): number | null {
    const match = price.match(/^([\d.,]+)\s*(po|pp|pc|ppt)$/i);
    if (!match) return null;
    const amount = Number(match[1].replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(amount) ? amount * ({ po: 1, pp: 0.1, pc: 0.01, ppt: 10 } as Record<string, number>)[match[2].toLowerCase()] : null;
  }
  function itemWeightKg(weight: string): number | null {
    const match = weight.match(/^([\d.,]+)\s*(kg|g)$/i);
    if (!match) return null;
    const amount = Number(match[1].replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(amount) ? amount * (match[2].toLowerCase() === 'g' ? 0.001 : 1) : null;
  }
  $: progressionRewardItems = ITEMS.filter(item =>
    (!progressionRewardType || item.type === progressionRewardType) &&
    (!progressionRewardSearch.trim() || (item.name+' '+item.type+' '+item.source).toLocaleLowerCase('es').includes(progressionRewardSearch.trim().toLocaleLowerCase('es')))
  ).sort((a,b)=>a.name.localeCompare(b.name,'es',{sensitivity:'base'})).slice(0,24);
  $: filteredItems = (itemSearch.trim() || itemLetterFilter || itemTypeFilter || itemPriceMin !== '' || itemPriceMax !== '' || itemWeightMin !== '' || itemWeightMax !== '') ? ITEMS.filter(item => {
    const query = itemSearch.trim().toLocaleLowerCase('es');
    const price = itemPriceGold(item.price);
    const weight = itemWeightKg(item.weight);
    return (!itemTypeFilter || item.type === itemTypeFilter) && startsWithLetter(item.name, itemLetterFilter) &&
      (!query || (item.name + ' ' + item.type + ' ' + item.source).toLocaleLowerCase('es').includes(query)) &&
      (itemPriceMin === '' || (price !== null && price >= Number(itemPriceMin))) &&
      (itemPriceMax === '' || (price !== null && price <= Number(itemPriceMax))) &&
      (itemWeightMin === '' || (weight !== null && weight >= Number(itemWeightMin))) &&
      (itemWeightMax === '' || (weight !== null && weight <= Number(itemWeightMax)));
  }).sort((a,b) => a.name.localeCompare(b.name,'en',{sensitivity:'base'})) : [];
  const SPELL_CLASSES = ['Bardo', 'Brujo', 'Clérigo', 'Druida', 'Explorador', 'Hechicero', 'Mago', 'Paladín'];
  const SPELL_SCHOOLS = ['Abjuración', 'Adivinación', 'Conjuración', 'Encantamiento', 'Evocación', 'Ilusionismo', 'Nigromancia', 'Transmutación'];
  $: filteredSpells = (spellSearch.trim() || spellLetterFilter || spellLevelFilter || spellClassFilter || spellSchoolFilter) ? SPELLS.filter(spell =>
    (!spellLevelFilter || String(spell.level) === spellLevelFilter) &&
    (!spellClassFilter || spell.classes.includes(spellClassFilter.toLocaleLowerCase('es'))) &&
    (!spellSchoolFilter || spell.school === spellSchoolFilter) && startsWithLetter(spell.name, spellLetterFilter) &&
    (!spellSearch.trim() || (spell.name + ' ' + spell.description).toLocaleLowerCase('es').includes(spellSearch.trim().toLocaleLowerCase('es')))
  ).sort((a,b) => a.name.localeCompare(b.name,'en',{sensitivity:'base'})) : [];
  const RULE_CATEGORIES = ['General', 'Acción', 'Estado', 'Área de efecto', 'Actitud', 'Peligro', 'Abreviatura'];
  let openRuleName = '';
  const normalizeRuleText = (value: string) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
  const ruleNameCase = (value: string) => value ? value.charAt(0).toLocaleUpperCase('es') + value.slice(1).toLocaleLowerCase('es') : '';
  const escapeRuleHtml = (value: string) => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char] || char));
  function highlightedRuleName(value: string) {
    const query = rulesSearch.trim(), original = ruleNameCase(value), normalized = normalizeRuleText(value);
    if (query.length < 2) return escapeRuleHtml(original);
    const index = normalized.indexOf(normalizeRuleText(query));
    return index < 0 ? escapeRuleHtml(original) : escapeRuleHtml(original.slice(0,index)) + '<mark>' + escapeRuleHtml(original.slice(index,index+query.length)) + '</mark>' + escapeRuleHtml(original.slice(index+query.length));
  }
  function ruleRelatedNames(rule: any): string[] {
    const matches = [...String(rule.description || '').matchAll(/[“"«]([^”"»]+)[”"»]/g)].map(match => match[1].trim());
    return [...new Set(matches)].filter(name => RULES.some((candidate:any) => normalizeRuleText(candidate.name) === normalizeRuleText(name) && normalizeRuleText(candidate.name) !== normalizeRuleText(rule.name))).slice(0,8);
  }
  function ruleTextParagraphs(value: string): string[] {
    return String(value || '').replace(/\r/g,'').split(/\n\s*\n+/).map(block => block.replace(/\n/g,' ').replace(/\s+/g,' ').trim()).filter(Boolean);
  }
  function jumpToRule(name: string) {
    rulesSearch = ''; rulesCategoryFilter = ''; openRuleName = name;
    setTimeout(() => document.getElementById('rule-' + encodeURIComponent(name))?.scrollIntoView({behavior:'smooth',block:'center'}), 80);
  }
  function handleRuleToggle(event: Event, name: string) {
    if ((event.currentTarget as HTMLDetailsElement).open && openRuleName !== '*') openRuleName = name;
  }
  $: normalizedRuleQuery = normalizeRuleText(rulesSearch);
  $: filteredRules = RULES.filter((rule:any) => (!rulesCategoryFilter || rule.category === rulesCategoryFilter) && (normalizedRuleQuery.length < 2 || normalizeRuleText(rule.name + ' ' + rule.description + ' ' + rule.category).includes(normalizedRuleQuery))).sort((a:any,b:any) => {
    if (normalizedRuleQuery.length >= 2) { const aa = normalizeRuleText(a.name).startsWith(normalizedRuleQuery) ? 0 : 1; const bb = normalizeRuleText(b.name).startsWith(normalizedRuleQuery) ? 0 : 1; if (aa !== bb) return aa - bb; }
    return a.name.localeCompare(b.name,'es',{sensitivity:'base'});
  });
  $: ruleLetters = [...new Set(filteredRules.map((rule:any) => rule.name.charAt(0).toLocaleUpperCase('es')))].sort((a,b)=>a.localeCompare(b,'es'));
  $: groupedRules = ruleLetters.map(letter => ({letter, rules: filteredRules.filter((rule:any) => rule.name.charAt(0).toLocaleUpperCase('es') === letter)}));

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
    syncPending = true;
    if (supabaseSaveTimer) clearTimeout(supabaseSaveTimer);
    supabaseSaveTimer = setTimeout(() => { void flushAutoSync(); }, 450);
  }

  async function flushAutoSync() {
    if (!sheet) return;
    localStorage.setItem('forja-raw-character', JSON.stringify(sheet));
    if (supabaseSaving) return;
    supabaseSaving = true;
    try {
      await saveCharacterToSupabase(JSON.parse(JSON.stringify(sheet)) as RawSheet);
      syncPending = false;
    } catch (error) {
      syncStatus = 'Error al guardar en Supabase: ' + (error instanceof Error ? error.message : String(error));
    } finally {
      supabaseSaving = false;
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
      await saveCharacterToSupabase(sheet);
      importOpen = false;
      notice = 'Ficha importada y guardada localmente en este dispositivo.';
      input.value = '';
    }).catch(() => {
      notice = 'No se pudo leer el archivo JSON.';
      input.value = '';
    });
  }


  const LEVEL_ABILITY_NAMES = ['Fuerza','Destreza','Constitución','Inteligencia','Sabiduría','Carisma'];
  const LEVEL_XP_THRESHOLDS: Record<number,number> = Object.fromEntries(((LEVEL_PROGRESSION as any).xp || []).map((xp:number,index:number)=>[index+1,xp]));
  const BARBARIAN_GENERAL_FEATS = [
    'Acechador','Actor','Apresador','Atacante a la carga','Atleta','Azote de magos','Centinela','Chef',
    'Combatiente con dos armas','Combatiente montado','Duelista defensivo','Entrenamiento con armas marciales',
    'Envenenador','Experto en ballestas','Experto en habilidades','Influencia feérica','Influencia sombría',
    'Lanzador ritual','Líder inspirador','Ligeramente acorazado','Maestro de armas','Maestro en armaduras medias',
    'Maestro en armas de asta','Maestro en armas pesadas','Maestro en escudos','Mente aguda',
    'Moderadamente acorazado','Muy acorazado','Observador','Perforador','Rebanador','Resiliente',
    'Resistente','Telepático','Telequinético','Tirador de primera','Triturador','Veloz'
  ];
  function getCharacterExperience(target:RawSheet):number {
    const raw=getCharacterStat(target,'PERSONAJE','Experiencia') || '0';
    const digits=String(raw).replace(/[^0-9]/g,'');
    return digits ? Number(digits) : 0;
  }
  function getBarbarianGeneralFeatOptions(target:RawSheet):string[] {
    const score=(ability:string)=>getCharacterNumber(target,'ATRIBUTOS',ability,10);
    const hasAny=(...abilities:string[])=>abilities.some(ability=>score(ability)>=13);
    const armorTraining=(kind:string)=>normalizeLevelText(getCharacterStat(target,'COMPETENCIAS','Armaduras')).includes(normalizeLevelText(kind)) ||
      normalizeLevelText(getCharacterStat(target,'COMPETENCIAS','Entrenamiento con armaduras')).includes(normalizeLevelText(kind)) ||
      (kind==='armaduras ligeras' && true) || (kind==='armaduras medias' && true) || (kind==='escudos' && true);
    const existing=splitChoiceList([getCharacterStat(target,'RASGOS Y DOTES','Dote de origen'),getCharacterStat(target,'RASGOS Y DOTES','Dotes adicionales')].join('; ')).map(normalizeLevelText);
    const requirements:Record<string,()=>boolean>={
      'Acechador':()=>score('Destreza')>=13,
      'Actor':()=>score('Carisma')>=13,
      'Apresador':()=>hasAny('Fuerza','Destreza'),
      'Atacante a la carga':()=>hasAny('Fuerza','Destreza'),
      'Atleta':()=>hasAny('Fuerza','Destreza'),
      'Azote de magos':()=>true,
      'Centinela':()=>hasAny('Fuerza','Destreza'),
      'Chef':()=>true,
      'Combatiente con dos armas':()=>hasAny('Fuerza','Destreza'),
      'Combatiente montado':()=>true,
      'Duelista defensivo':()=>score('Destreza')>=13,
      'Entrenamiento con armas marciales':()=>true,
      'Envenenador':()=>true,
      'Experto en ballestas':()=>score('Destreza')>=13,
      'Experto en habilidades':()=>true,
      'Influencia feérica':()=>true,
      'Influencia sombría':()=>true,
      'Lanzador ritual':()=>hasAny('Inteligencia','Sabiduría','Carisma'),
      'Líder inspirador':()=>hasAny('Sabiduría','Carisma'),
      'Ligeramente acorazado':()=>true,
      'Maestro de armas':()=>true,
      'Maestro en armaduras medias':()=>armorTraining('armaduras medias'),
      'Maestro en armas de asta':()=>hasAny('Fuerza','Destreza'),
      'Maestro en armas pesadas':()=>score('Fuerza')>=13,
      'Maestro en escudos':()=>armorTraining('escudos'),
      'Mente aguda':()=>score('Inteligencia')>=13,
      'Moderadamente acorazado':()=>armorTraining('armaduras ligeras'),
      'Muy acorazado':()=>armorTraining('armaduras medias'),
      'Observador':()=>hasAny('Inteligencia','Sabiduría'),
      'Perforador':()=>true,
      'Rebanador':()=>true,
      'Resiliente':()=>true,
      'Resistente':()=>true,
      'Telepático':()=>true,
      'Telequinético':()=>true,
      'Tirador de primera':()=>score('Destreza')>=13,
      'Triturador':()=>true,
      'Veloz':()=>hasAny('Destreza','Constitución')
    };
    return BARBARIAN_GENERAL_FEATS.filter(feat=>(requirements[feat]?.() ?? false) && !existing.includes(normalizeLevelText(feat)));
  }
  function getBarbarianFeatAbilityOptions(feat:string):string[] {
    const key=normalizeLevelText(feat);
    const options:Record<string,string[]> = {
      'acechador':['Destreza'],'actor':['Carisma'],'apresador':['Fuerza','Destreza'],
      'atacante a la carga':['Fuerza','Destreza'],'atleta':['Fuerza','Destreza'],
      'azote de magos':['Fuerza','Destreza'],'centinela':['Fuerza','Destreza'],
      'chef':['Constitución','Sabiduría'],'combatiente con dos armas':['Fuerza','Destreza'],
      'combatiente montado':['Fuerza','Destreza','Sabiduría'],'duelista defensivo':['Destreza'],
      'entrenamiento con armas marciales':['Fuerza','Destreza'],'envenenador':['Destreza','Inteligencia'],
      'experto en ballestas':['Destreza'],'experto en habilidades':LEVEL_ABILITY_NAMES,
      'influencia feerica':['Inteligencia','Sabiduría','Carisma'],'influencia sombria':['Inteligencia','Sabiduría','Carisma'],
      'lanzador ritual':['Inteligencia','Sabiduría','Carisma'],'lider inspirador':['Sabiduría','Carisma'],
      'ligeramente acorazado':['Fuerza','Destreza'],'maestro de armas':['Fuerza','Destreza'],
      'maestro en armaduras medias':['Fuerza','Destreza'],'maestro en armas de asta':['Fuerza','Destreza'],
      'maestro en armas pesadas':['Fuerza'],'maestro en escudos':['Fuerza'],'mente aguda':['Inteligencia'],
      'moderadamente acorazado':['Fuerza','Destreza'],'muy acorazado':['Constitución','Fuerza'],
      'observador':['Inteligencia','Sabiduría'],'perforador':['Fuerza','Destreza'],
      'rebanador':['Fuerza','Destreza'],'resiliente':['Destreza','Inteligencia','Sabiduría','Carisma'],'resistente':['Constitución'],
      'telepatico':['Inteligencia','Sabiduría','Carisma'],'telequinetico':['Inteligencia','Sabiduría','Carisma'],
      'tirador de primera':['Destreza'],'triturador':['Fuerza','Constitución'],'veloz':['Destreza','Constitución']
    };
    return options[key] || [];
  }
  function getBardExpertiseOptions(target:RawSheet, selected:string[]=[]):string[] {
    const raw=getCharacterStat(target,'COMPETENCIAS','Skills') || '';
    const expertise=(String(raw).match(/pericia\s*:\s*([^\n;]+)/i)||[])[1]||'';
    const base=String(raw).replace(/;?\s*Pericia\s*:\s*[^\n;]+/i,'');
    const known=BUILDER_SKILL_OPTIONS.filter(skill=>normalizeLevelText(base).includes(normalizeLevelText(skill)));
    const already=splitChoiceList(expertise).map(normalizeLevelText);
    const chosen=selected.filter(Boolean).map(normalizeLevelText);
    return known.filter(skill=>!already.includes(normalizeLevelText(skill)) && !chosen.includes(normalizeLevelText(skill)));
  }
  function getBardCantripOptions():string[] {
    return [...new Set((SPELLS as any[]).filter(spell=>spell.level===0 && spell.classes?.some((name:string)=>normalizeLevelText(name)==='bardo')).map(spell=>spell.name))].sort((a,b)=>a.localeCompare(b,'es'));
  }
  function getBardPreparedSpellOptions(targetLevel:number):string[] {
    const row=(LEVEL_PROGRESSION as any).classes?.Bardo?.rows?.find((item:any)=>Number(item.level)===targetLevel);
    const maxLevel=row?highestSpellLevel(row.resources||{}):0;
    const allowed=targetLevel>=10?['bardo','clerigo','druida','mago']:['bardo'];
    return [...new Set((SPELLS as any[]).filter(spell=>spell.level>0 && spell.level<=maxLevel && spell.classes?.some((name:string)=>allowed.includes(normalizeLevelText(name)))).map(spell=>spell.name))].sort((a,b)=>a.localeCompare(b,'es'));
  }
  function toggleBardClassSpellChoice(spell:string,event:Event,kind:'cantrip'|'spell',max:number) {
    const input=event.currentTarget as HTMLInputElement;
    const current=splitChoiceList(kind==='cantrip'?levelUpClassCantrips:levelUpClassSpells);
    let next=current;
    if(input.checked) {
      if(current.length>=max) { input.checked=false; return; }
      if(!current.some(name=>normalizeLevelText(name)===normalizeLevelText(spell))) next=[...current,spell];
    } else next=current.filter(name=>normalizeLevelText(name)!==normalizeLevelText(spell));
    if(kind==='cantrip') levelUpClassCantrips=next.join(', ');
    else levelUpClassSpells=next.join(', ');
  }
  function getCollegeKnowledgeSkillOptions(target:RawSheet, selected:string[]=[]):string[] {
    const existing=splitChoiceList(getCharacterStat(target,'COMPETENCIAS','Skills')).map(normalizeLevelText);
    const chosen=selected.filter(Boolean).map(normalizeLevelText);
    return BUILDER_SKILL_OPTIONS.filter(skill=>!existing.includes(normalizeLevelText(skill)) && !chosen.includes(normalizeLevelText(skill)));
  }
  function getBardMagicDiscoveryOptions(targetLevel:number):string[] {
    const row=(LEVEL_PROGRESSION as any).classes?.Bardo?.rows?.find((item:any)=>Number(item.level)===targetLevel);
    const maxLevel=row?highestSpellLevel(row.resources||{}):0;
    return [...new Set((SPELLS as any[]).filter(spell=>(spell.level===0 || (spell.level>0 && spell.level<=maxLevel)) && Array.isArray(spell.classes) && spell.classes.some((name:string)=>['clerigo','druida','mago'].includes(normalizeLevelText(name)))).map(spell=>spell.name))].sort((a,b)=>a.localeCompare(b,'es'));
  }
  function getBarbarianFeatSkillOptions(feat:string):string[] {
    const key=normalizeLevelText(feat);
    if(key==='mente aguda') return ['Conocimiento arcano','Historia','Investigación','Naturaleza','Religión'];
    if(key==='observador') return ['Investigación','Percepción','Perspicacia'];
    if(key==='experto en habilidades') return BUILDER_SKILL_OPTIONS;
    return [];
  }
  function getBarbarianFeatSkillData(target:RawSheet, additionalSkill=''):{proficient:string[];expertise:string[]} {
    const raw=getCharacterStat(target,'COMPETENCIAS','Skills') || '';
    const expertiseText=(String(raw).match(/pericia\s*:\s*([^\n;]+)/i)||[])[1]||'';
    const baseText=String(raw).replace(/;?\s*Pericia\s*:\s*[^\n;]+/i,'');
    const proficient=BUILDER_SKILL_OPTIONS.filter(skill=>normalizeLevelText(baseText).includes(normalizeLevelText(skill)));
    if(additionalSkill && !proficient.some(skill=>normalizeLevelText(skill)===normalizeLevelText(additionalSkill))) proficient.push(additionalSkill);
    return {proficient,expertise:splitChoiceList(expertiseText)};
  }
  function getBarbarianFeatExpertiseOptions(target:RawSheet, additionalSkill=''):string[] {
    const data=getBarbarianFeatSkillData(target,additionalSkill);
    return data.proficient.filter(skill=>!data.expertise.some(old=>normalizeLevelText(old)===normalizeLevelText(skill)));
  }
  function getBarbarianFeatSpellOptions(feat:string):string[] {
    const key=normalizeLevelText(feat);
    const schools=key==='influencia feerica'?['adivinacion','encantamiento']:key==='influencia sombria'?['ilusionismo','nigromancia']:[];
    return (SPELLS as any[]).filter(spell=>spell.level===1 && schools.includes(normalizeLevelText(spell.school))).map(spell=>spell.name).sort((a,b)=>a.localeCompare(b,'es'));
  }
  function getBarbarianRitualSpellOptions():string[] {
    return (SPELLS as any[]).filter(spell=>spell.level===1 && Array.isArray(spell.special) && spell.special.some((tag:string)=>String(tag).split(',').some(part=>part.trim()==='R'))).map(spell=>spell.name).sort((a,b)=>a.localeCompare(b,'es'));
  }
  function getBarbarianResilientSaveOptions(target:RawSheet):string[] {
    const existing=splitChoiceList(getCharacterStat(target,'COMPETENCIAS','Tiradas de salvación adicionales'));
    return ['Destreza','Inteligencia','Sabiduría','Carisma'].filter(ability=>!existing.some(old=>normalizeLevelText(old)===normalizeLevelText(ability)));
  }
  function getBarbarianFeatWeaponMasteryOptions(target:RawSheet):string[] {
    const existing=[...splitChoiceList(getCharacterStat(target,'ATAQUES','Maestrías con armas')),...splitChoiceList(levelUpWeaponMasteries),...splitChoiceList(getCharacterStat(target,'ATAQUES','Maestría adicional por dote'))].map(normalizeLevelText);
    return BUILDER_WEAPON_MASTERY_OPTIONS.filter(weapon=>!existing.includes(normalizeLevelText(weapon)));
  }
  function mergeBarbarianFeatField(target:RawSheet,section:string,field:string,values:string[]) {
    const old=splitChoiceList(getCharacterStat(target,section,field));
    const merged=[...new Map([...old,...values].filter(Boolean).map(value=>[normalizeLevelText(value),value])).values()];
    setCharacterStat(target,section,field,merged.join(', '));
  }
  function toggleBarbarianFeatRitualSpell(choice:string,event:Event,max:number) {
    const input=event.currentTarget as HTMLInputElement;
    const current=splitChoiceList(levelUpBarbarianFeatRituals);
    if(input.checked) {
      if(current.length>=max) { input.checked=false; return; }
      if(!current.some(value=>normalizeLevelText(value)===normalizeLevelText(choice))) levelUpBarbarianFeatRituals=[...current,choice].join(', ');
    } else {
      levelUpBarbarianFeatRituals=current.filter(value=>normalizeLevelText(value)!==normalizeLevelText(choice)).join(', ');
    }
  }
  function addBarbarianFeatSkill(target:RawSheet,skill:string,grantExpertise:boolean) {
    const data=getBarbarianFeatSkillData(target);
    const skills=[...data.proficient];
    if(!skills.some(old=>normalizeLevelText(old)===normalizeLevelText(skill))) skills.push(skill);
    const expertise=[...data.expertise];
    if(grantExpertise && !expertise.some(old=>normalizeLevelText(old)===normalizeLevelText(skill))) expertise.push(skill);
    setCharacterStat(target,'COMPETENCIAS','Skills',[skills.join('; '),expertise.length?'Pericia: '+expertise.join(', '):''].filter(Boolean).join('; '));
  }
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

  function sheetValueByNames(target: RawSheet | null, names: string[], sections: string[] = []) {
    if (!target) return '';
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
  async function saveCharacterToSupabase(snapshot: RawSheet, playerId = supabasePlayerId, playerNameValue = supabasePlayerName) {
    if (!supabaseRoomId || !playerId || demoPreview) return;
    const response = await fetch(SUPABASE_URL + '/rest/v1/characters?on_conflict=room_id,player_id', {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify({
        room_id: supabaseRoomId,
        player_id: playerId,
        player_name: playerNameValue || 'Jugador',
        character_name: snapshot.name || 'Personaje',
        sheet: snapshot,
        deleted_at: null
      })
    });
    if (!response.ok) throw new Error('Supabase (' + response.status + '): ' + await response.text());
    syncStatus = 'Ficha guardada en Supabase.';
    try {
      await OBR.broadcast.sendMessage(CHANNEL, {
        type: 'character-updated',
        playerId,
        playerName: playerNameValue || 'Jugador',
        character: snapshot
      }, { destination: 'ALL' });
    } catch {}
  }

  async function loadOwnCharacterFromSupabase(): Promise<RawSheet | null> {
    if (!supabaseRoomId || !supabasePlayerId) return null;
    const query = '?select=sheet&room_id=eq.' + encodeURIComponent(supabaseRoomId) +
      '&player_id=eq.' + encodeURIComponent(supabasePlayerId) + '&deleted_at=is.null&limit=1';
    const response = await fetch(SUPABASE_URL + '/rest/v1/characters' + query, {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
    });
    if (!response.ok) throw new Error('No se pudo recuperar la ficha de Supabase (' + response.status + ').');
    const rows = await response.json();
    const stored = rows?.[0]?.sheet;
    return stored && Array.isArray(stored.sections) ? repairGenericStatLabels(stored as RawSheet) as RawSheet : null;
  }

  async function loadSupabaseRoomCharacters() {
    if (!supabaseRoomId) return;
    const response = await fetch(SUPABASE_URL + '/rest/v1/characters?select=player_id,player_name,sheet,deleted_at&room_id=eq.' + encodeURIComponent(supabaseRoomId) + '&deleted_at=is.null&order=updated_at.desc', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
    });
    if (!response.ok) throw new Error('No se pudieron cargar las fichas de la sala desde Supabase.');
    const rows = await response.json();
    liveRoomSheets = rows.filter((row:any)=>row.sheet && Array.isArray(row.sheet.sections)).map((row:any)=>({
      playerId: row.player_id, playerName: row.player_name || 'Jugador',
      sheet: repairGenericStatLabels(row.sheet as RawSheet) as RawSheet, live: false
    }));
    refreshRoomSheetList();
  }

  function saveSheetMutation() {
    if (!sheet) return;
    localStorage.setItem('forja-raw-character', JSON.stringify(sheet));
    void saveCharacterToSupabase(sheet).catch(error => {
      syncStatus = 'Error al guardar en Supabase: ' + (error instanceof Error ? error.message : String(error));
    });
  }
  function captureProgressionSections():RawSection[] {
    return JSON.parse(JSON.stringify(sheet?.sections || []));
  }
  function recordProgressionChange(label:string,beforeSections:RawSection[]) {
    if(!sheet) return;
    const history=Array.isArray((sheet as any).progressionChangeLog)?(sheet as any).progressionChangeLog:[];
    history.push({id:Date.now()+Math.random(),label,at:new Date().toISOString(),beforeSections});
    (sheet as any).progressionChangeLog=history.slice(-20);
    sheet={...sheet};
    saveSheetMutation();
  }
  function undoLastProgressionChange() {
    if(!sheet) return;
    const history=Array.isArray((sheet as any).progressionChangeLog)?[...(sheet as any).progressionChangeLog]:[];
    const last=history.pop();
    if(!last?.beforeSections) return;
    sheet.sections=JSON.parse(JSON.stringify(last.beforeSections));
    (sheet as any).progressionChangeLog=history;
    sheet={...sheet};
    saveSheetMutation();
    notice='Se deshizo: '+last.label+'.';
  }
  function progressionChangeHistory():any[] {
    return Array.isArray((sheet as any)?.progressionChangeLog)?(sheet as any).progressionChangeLog.slice().reverse():[];
  }
  const PROGRESSION_CURRENCIES=[{key:'PC',label:'Cobre'},{key:'PP',label:'Plata'},{key:'PE',label:'Electro'},{key:'PO',label:'Oro'},{key:'PPt',label:'Platino'}];
  function progressionCurrencyValue(key:string):number {
    const stored=getCharacterStat(sheet as RawSheet,'ECONOMÍA',key);
    if(stored!=='') return Math.max(0,Number(stored)||0);
    const legacy=getCharacterStat(sheet as RawSheet,'EQUIPO','Monedas');
    const matches=String(legacy||'').match(/[0-9][0-9.,]*\s*(?:PPt|PC|PP|PE|PO)/gi)||[];
    const found=matches.find(value=>value.match(/(PPt|PC|PP|PE|PO)$/i)?.[1].toUpperCase()===key.toUpperCase());
    if(!found) return 0;
    const amount=found.match(/[0-9][0-9.,]*/)?.[0]||'0';
    return Math.max(0,Number(amount.replace(/\./g,'').replace(',','.'))||0);
  }
  $: progressionEditSections = sheet ? sectionPairs(sheet.sections||[]).map(pair=>String(pair.heading.name||'')).filter(Boolean) : [];
  $: progressionEditFields = sheet ? (sectionPairs(sheet.sections||[]).find(pair=>normalizeLevelText(pair.heading.name)===normalizeLevelText(progressionEditSection))?.heading.stats||[]).map(stat=>String(stat.name||'')).filter(Boolean) : [];
  $: progressionEditValue = sheet ? getCharacterStat(sheet,progressionEditSection,progressionEditField) : '';
  function saveProgressionEdit() {
    if(!sheet||!progressionEditSection||!progressionEditField) return;
    const before=captureProgressionSections();
    setCharacterStat(sheet,progressionEditSection,progressionEditField,progressionEditValue);
    if(progressionEditSection==='ATRIBUTOS' || (progressionEditSection==='COMBATE' && progressionEditField==='Bonificador por competencia')) refreshDerivedCharacterSheet(sheet);
    sheet={...sheet};
    recordProgressionChange(progressionEditSection+' · '+progressionEditField,before);
    notice='Se actualizó '+progressionEditField+'.';
  }
  function adjustProgressionCurrency(key:string,delta:number) {
    if(!sheet) return;
    const before=captureProgressionSections();
    const next=Math.max(0,progressionCurrencyValue(key)+delta);
    setCharacterStat(sheet,'ECONOMÍA',key,String(next));
    sheet={...sheet};
    recordProgressionChange('Monedas '+key+' · '+(delta>0?'+':'')+delta,before);
  }
  function addProgressionReward(item:any) {
    if(!sheet) return;
    const quantity=Math.max(1,Math.min(999,Number(progressionRewardQuantity)||1));
    const before=captureProgressionSections();
    const existing=String(getCharacterStat(sheet,'INVENTARIO','Equipo adicional')||'').split(/\n/).map(value=>value.trim()).filter(Boolean);
    const label=quantity===1?item.name:item.name+' ×'+quantity;
    const existingIndex=existing.findIndex(value=>normalizeLevelText(value.replace(/\s*[×x]\d+$/i,''))===normalizeLevelText(item.name));
    if(existingIndex>=0) {
      const match=existing[existingIndex].match(/[×x](\d+)$/i);
      const total=(match?Number(match[1]):1)+quantity;
      existing[existingIndex]=total===1?item.name:item.name+' ×'+total;
    } else existing.push(label);
    setCharacterStat(sheet,'INVENTARIO','Equipo adicional',existing.join('\n'));
    if(item.type==='Arma' && WEAPON_PROFILES[item.name]) {
      const weapons=splitChoiceList(getCharacterStat(sheet,'ATAQUES','Armas incluidas en el equipo'));
      if(!weapons.some(value=>normalizeLevelText(value)===normalizeLevelText(item.name))) weapons.push(item.name);
      setCharacterStat(sheet,'ATAQUES','Armas incluidas en el equipo',weapons.join(', '));
      refreshDerivedCharacterSheet(sheet);
    }
    sheet={...sheet};
    recordProgressionChange('Recompensa: '+label,before);
    progressionRewardQuantity=1;
  }
  function adjustProgressionValue(sectionName:string, statName:string, delta:number, fallback:number=0, suffix='', allowNegative=false) {
    if (!sheet) return;
    const before=captureProgressionSections();
    const raw=getCharacterStat(sheet,sectionName,statName);
    const match=String(raw).replace(/,/g,'.').match(/-?\d+(?:\.\d+)?/);
    const current=match ? Number(match[0]) : fallback;
    const next=sectionName==='PERSONAJE' && statName==='Nivel'
      ? Math.min(20,Math.max(1,current+delta))
      : (allowNegative ? current+delta : Math.max(0,current+delta));
    setCharacterStat(sheet,sectionName,statName,suffix ? next+suffix : String(next));
    if(sectionName==='PERSONAJE' && statName==='Nivel') setCharacterStat(sheet,'PROGRESIÓN','Nivel de clase',next);
    if(sectionName==='ATRIBUTOS' || (sectionName==='COMBATE' && statName==='Bonificador por competencia')) refreshDerivedCharacterSheet(sheet);
    sheet={...sheet}; recordProgressionChange(statName+' · '+(delta>0?'+':'')+delta,before);
  }
  function adjustProgressionHitDice(delta:number) {
    if (!sheet) return;
    const before=captureProgressionSections();
    const raw=getCharacterStat(sheet,'COMBATE','Dados de golpe') || '0d8';
    const match=String(raw).match(/(\d+)\s*d\s*(\d+)/i);
    const count=match ? Number(match[1]) : 0;
    const die=match ? Number(match[2]) : (LEVEL_HIT_DIE[getCharacterStat(sheet,'PERSONAJE','Clase')] || 8);
    setCharacterStat(sheet,'COMBATE','Dados de golpe',Math.max(0,count+delta)+'d'+die);
    sheet={...sheet}; recordProgressionChange('Dados de golpe · '+(delta>0?'+':'')+delta,before);
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
    if(normalizeLevelText(className)==='brujo') {
      const slots=progressionResourceValue(target,'Espacios de conjuro',row?.resources?.['Espacios de conjuro']||0);
      const slotLevel=progressionResourceValue(target,'Nivel de los espacios',row?.resources?.['Nivel de los espacios']||1);
      if(slots>0) result[String(slotLevel)]=slots;
    }
    const overrides=readJsonRecord(target,'PROGRESIÓN','Recursos manuales');
    for (const [key,value] of Object.entries(overrides)) {
      const slot=key.match(/^Espacios nivel (\d+)$/i);
      if(slot) result[slot[1]]=Math.max(0,Number(value)||0);
    }
    return result;
  }
  function getManualProgressionCurrentRow(progression:any):any {
    return progression?.rows?.find((row:any)=>row.level===progression.currentLevel) || null;
  }
  function manualProgressionResourceEntries(progression:any):[string,any][] {
    const row=progression?.rows?.find((item:any)=>item.level===progression.currentLevel);
    return Object.entries(row?.resources||{}).filter(([key,value])=>!/^Espacios nivel/i.test(key)&&!['espacios de conjuro','nivel de los espacios'].includes(normalizeLevelText(key))&&normalizeLevelText(key)!=='dado bardico'&&value!=='—'&&/\d/.test(String(value))) as [string,any][];
  }
  function progressionManualResources(target:RawSheet):Record<string,any> {
    return readJsonRecord(target,'PROGRESIÓN','Recursos manuales');
  }
  function progressionResourceValue(target:RawSheet,key:string,base:any):number {
    const overrides=progressionManualResources(target);
    if(Object.prototype.hasOwnProperty.call(overrides,key)) return Math.max(0,Number(overrides[key])||0);
    const match=String(base??'').match(/[+-]?\d+/);
    return match ? Math.max(0,Number(match[0])) : 0;
  }
  function progressionResourceText(target:RawSheet,key:string,base:any):string {
    const overrides=progressionManualResources(target);
    return String(Object.prototype.hasOwnProperty.call(overrides,key)?overrides[key]:base??'—');
  }
  function updateProgressionBardDie(event:Event) {
    const input=event.currentTarget as HTMLSelectElement;
    setProgressionResourceText('Dado bárdico',input.value);
  }
  function setProgressionResourceText(key:string,value:string) {
    if(!sheet||!value) return;
    const before=captureProgressionSections();
    const overrides=progressionManualResources(sheet);
    overrides[key]=value;
    setCharacterStat(sheet,'PROGRESIÓN','Recursos manuales',JSON.stringify(overrides));
    sheet={...sheet}; recordProgressionChange(key+' · '+value,before);
  }
  function adjustProgressionResource(key:string,delta:number,base:any=0) {
    if(!sheet) return;
    const before=captureProgressionSections();
    const overrides=progressionManualResources(sheet);
    overrides[key]=Math.max(0,progressionResourceValue(sheet,key,base)+delta);
    setCharacterStat(sheet,'PROGRESIÓN','Recursos manuales',JSON.stringify(overrides));
    sheet={...sheet}; recordProgressionChange(key+' · '+(delta>0?'+':'')+delta,before);
  }
  function adjustProgressionSpellSlot(level:string,delta:number) {
    if(!sheet) return;
    adjustProgressionResource('Espacios nivel '+level,delta,spellSlotMaximums(sheet)[level]||0);
  }
  function manualProgressionList(target:RawSheet|null,section:string,field:string):string[] {
    if(!target) return [];
    return splitChoiceList(getCharacterStat(target,section,field)||'').filter(Boolean);
  }
  function addManualProgressionChoice(section:string,field:string,value:string) {
    if(!sheet||!value) return;
    const before=captureProgressionSections();
    const current=manualProgressionList(sheet,section,field);
    if(!current.some(item=>normalizeLevelText(item)===normalizeLevelText(value))) current.push(value);
    setCharacterStat(sheet,section,field,current.join('; '));
    sheet={...sheet}; recordProgressionChange('Añadido: '+value,before);
  }
  function removeManualProgressionChoice(section:string,field:string,value:string) {
    if(!sheet) return;
    const before=captureProgressionSections();
    const current=manualProgressionList(sheet,section,field).filter(item=>normalizeLevelText(item)!==normalizeLevelText(value));
    setCharacterStat(sheet,section,field,current.join('; '));
    sheet={...sheet}; recordProgressionChange('Quitado: '+value,before);
  }
  function manualProgressionSubclassOptions(target:RawSheet|null):string[] {
    return target ? getSubclassOptions(sheetClassName(target)) : [];
  }
  function setManualProgressionSubclass(value:string) {
    if(!sheet||!value) return;
    const before=captureProgressionSections();
    setCharacterStat(sheet,'PERSONAJE','Subclase',value);
    progressionSubclassChoice=value;
    sheet={...sheet}; recordProgressionChange('Subclase: '+formatSubclassName(value),before);
  }
  function manualProgressionTraitOptions(target:RawSheet|null):string[] {
    if(!target) return [];
    const className=sheetClassName(target);
    const classTraits=((CLASS_FEATURES as any).classes?.[className]||[])
      .map((feature:any)=>feature.name).filter(Boolean);
    const subclassName=getCharacterStat(target,'PERSONAJE','Subclase');
    const selectedSubclass=subclassName ? getSubclassData(className,subclassName) : null;
    const selectedSubclassTraits=(selectedSubclass?.features||[])
      .map((feature:any)=>feature.name).filter(Boolean);
    return [...new Set([...classTraits,...selectedSubclassTraits])]
      .sort((a,b)=>a.localeCompare(b,'es'));
  }
  function manualProgressionCompetencyChoices(kind:string):string[] {
    if(kind==='skill') return BUILDER_SKILL_OPTIONS;
    if(kind==='tool') return BUILDER_FEAT_TOOL_OPTIONS;
    if(kind==='armor') return ['Armaduras ligeras','Armaduras medias','Armaduras pesadas','Escudos'];
    if(kind==='weapon') return ['Armas sencillas','Armas marciales',...BUILDER_WEAPON_MASTERY_OPTIONS];
    if(kind==='language') return ['Común','Enano','Élfico','Gigante','Gnómico','Goblin','Mediano','Orco','Abisal','Celestial','Dracónico','Infracomún','Infernal','Primordial','Silvano','Druídico','Jerga de ladrones'];
    return [];
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
    if (typeof saved?.known === 'boolean') return saved.known;
    return spellKnownNames(target).has(normalizeLevelText(spell.name));
  }
  function playerKnownSpellCards(target: RawSheet) {
    const states = spellStates(target);
    return SPELLS.filter((spell: any) => spellIsKnown(target, spell) ||
      states[normalizeLevelText(spell.name)]?.prepared === true)
      .sort((a: any, b: any) => Number(a.level) - Number(b.level) || String(a.name).localeCompare(String(b.name), 'es'));
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
      prepared += ', ' + ((levelText.match(/Preparados:\s*([^.]*)/i) || [])[1] || '');
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

  function spellChangeRuleFor(target: RawSheet) {
    const className = sheetClassName(target);
    const key = normalizeLevelText(className);
    if (key === 'brujo') return {
      mode: 'level-up' as const,
      text: 'Como brujo, puedes reemplazar un conjuro de tu lista de conjuros conocidos cuando subes un nivel de brujo. Este cambio no se realiza durante un descanso.'
    };
    const preparedClasses = ['bardo','clerigo','druida','explorador','paladin','hechicero','mago'];
    if (preparedClasses.includes(key)) return {
      mode: 'long-rest' as const,
      text: 'Tu clase prepara una lista de conjuros. Puedes cambiar toda esa lista al completar un descanso largo.'
    };
    return null;
  }
  function classSpellOptions(target: RawSheet) {
    const classKey = spellClassKey(target);
    const maxLevel = spellMaxLevel(target);
    const isWizard = classKey === 'mago';
    const spellbook = spellKnownNames(target);
    return SPELLS.filter((spell: any) =>
      Array.isArray(spell.classes) &&
      spell.classes.some((name: string) => normalizeLevelText(name) === classKey) &&
      Number(spell.level) <= maxLevel &&
      (!isWizard || spellbook.has(normalizeLevelText(spell.name)) || spellIsPrepared(target, spell))
    ).sort((a: any,b: any) => Number(a.level)-Number(b.level) || String(a.name).localeCompare(String(b.name),'es'));
  }
  function openSpellChange() {
    if (!sheet) return;
    const rule = spellChangeRuleFor(sheet);
    if (!rule) {
      notice = 'Esta clase no tiene un procedimiento de cambio de conjuros configurado.';
      return;
    }
    spellChangeMode = rule.mode;
    spellChangeRule = rule.text;
    const options = classSpellOptions(sheet);
    const isWizard = spellClassKey(sheet) === 'mago';
    const current = options.filter((spell: any) => isWizard
      ? spellIsPrepared(sheet, spell)
      : (spellIsKnown(sheet, spell) || spellIsPrepared(sheet, spell)))
      .map((spell: any) => normalizeLevelText(spell.name));
    spellChangeOriginal = current;
    spellChangeSelected = [...current];
    const className = sheetClassName(sheet);
    const level = sheetLevel(sheet);
    const row = ((LEVEL_PROGRESSION as any).classes?.[className]?.rows || []).find((item: any) => Number(item.level) === level);
    const preparedCount = Number(row?.resources?.['Conjuros preparados'] || 0);
    const intelligenceModifier = abilityModifier(getCharacterNumber(sheet, 'ATRIBUTOS', 'Inteligencia', 10)) ?? 0;
    spellChangeLimit = rule.mode === 'level-up' ? current.length
      : isWizard ? Math.max(1, level + intelligenceModifier)
      : (preparedCount || current.length);
    spellChangeSearch = '';
    spellChangeStage = 'prompt';
    spellChangeOpen = true;
  }
  function confirmSpellChangeCondition(confirmed: boolean) {
    if (!confirmed) { spellChangeOpen = false; return; }
    spellChangeStage = 'select';
  }
  function toggleSpellChangeSelection(spell: any) {
    const key = normalizeLevelText(spell.name);
    const exists = spellChangeSelected.includes(key);
    const next = exists ? spellChangeSelected.filter(item => item !== key) : [...spellChangeSelected, key];
    if (spellChangeMode === 'long-rest' && next.length > spellChangeLimit) return;
    if (spellChangeMode === 'level-up') {
      const removed = spellChangeOriginal.filter(item => !next.includes(item)).length;
      const added = next.filter(item => !spellChangeOriginal.includes(item)).length;
      if (removed > 1 || added > 1 || next.length !== spellChangeOriginal.length) return;
    }
    spellChangeSelected = next;
  }
  function canApplySpellChange() {
    if (spellChangeMode === 'long-rest') return spellChangeSelected.length === spellChangeLimit;
    const removed = spellChangeOriginal.filter(item => !spellChangeSelected.includes(item)).length;
    const added = spellChangeSelected.filter(item => !spellChangeOriginal.includes(item)).length;
    return removed === 1 && added === 1;
  }
  function applySpellChange() {
    if (!sheet || !canApplySpellChange()) return;
    const states = spellStates(sheet);
    const options = classSpellOptions(sheet);
    for (const spell of options as any[]) {
      const key = normalizeLevelText(spell.name);
      const current = { ...(states[key] || {}) };
      const selected = spellChangeSelected.includes(key);
      if (spellChangeMode === 'long-rest') {
        if (spellClassKey(sheet) !== 'mago') current.known = selected;
        current.prepared = selected;
      } else {
        current.known = selected;
        current.prepared = false;
      }
      states[key] = current;
    }
    setCharacterStat(sheet, 'GESTIÓN DE FICHA', 'Estados de conjuros', JSON.stringify(states));
    saveSheetMutation();
    spellChangeOpen = false;
    notice = spellChangeMode === 'long-rest'
      ? 'Lista de conjuros preparados actualizada.'
      : 'Conjuro reemplazado. El cambio de tu lista de brujo quedó registrado.';
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
    return String(value || '').toLocaleLowerCase('es').replace(/(^|[\s-])([a-záéíóúüñ])/g, (_m, prefix, letter) => prefix + letter.toLocaleUpperCase('es'));
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
  function getPlayerClassProgression(target: RawSheet | null) {
    if (!target) return null;
    const className = sheetClassName(target);
    const classes = (LEVEL_PROGRESSION as any).classes || {};
    const classKey = Object.keys(classes).find(key => normalizeLevelText(key) === normalizeLevelText(className));
    const progression = classKey ? classes[classKey] : null;
    if (!progression || !Array.isArray(progression.columns) || !Array.isArray(progression.rows)) return null;
    return { className: classKey, columns: progression.columns, rows: progression.rows, currentLevel: sheetLevel(target) };
  }
  function requestPlayerLevelUpFromTable(level: number) {
    if (!sheet || level !== sheetLevel(sheet) + 1) return;
    requestPlayerLevelUp();
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

  function requestPlayerLevelUp() {
    if (!sheet) return;
    const currentLevel = sheetLevel(sheet);
    if (currentLevel >= 20) {
      notice = 'El personaje ya alcanzó el nivel 20.';
      return;
    }
    if (!window.confirm('¿Quieres subir de nivel?')) return;
    levelUpIsPlayer = true;
    openLevelUp({ playerId: 'local-player', playerName: playerName || 'Jugador', sheet });
  }

  function openLevelUp(entry: RoomEntry) {
    levelUpEntry = entry; levelUpDecision = '';
    levelUpClassCantrips=getCharacterStat(entry.sheet,'CONJUROS','Trucos de clase') || (getCharacterStat(entry.sheet,'PERSONAJE','Clase')==='Bardo'?getCharacterStat(entry.sheet,'CONJUROS','Trucos'):'');
    levelUpBardCantripSearch=''; levelUpBardSpellSearch='';
    levelUpClassSpells=getCharacterStat(entry.sheet,'CONJUROS','Conjuros preparados de clase') || (getCharacterStat(entry.sheet,'PERSONAJE','Clase')==='Bardo'?getCharacterStat(entry.sheet,'CONJUROS','Conjuros de nivel 1'):'');
    if(!levelUpClassSpells && getCharacterStat(entry.sheet,'PERSONAJE','Clase')==='Mago') levelUpClassSpells=(String(getCharacterStat(entry.sheet,'CONJUROS','Conjuros de nivel 1')).match(/Preparados:\s*([^.]*)/i)||[])[1]||'';
    levelUpWizardBookAdditions=''; levelUpExpertise=''; levelUpBardExpertise1=''; levelUpBardExpertise2=''; levelUpNewSkill=''; levelUpLanguages=''; levelUpWildShapeForms=getCharacterStat(entry.sheet,'RASGOS Y DOTES','Formas salvajes conocidas') || '';
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
    levelUpSubclassSkill=''; levelUpSubclassTool='';
    levelUpCollegeKnowledgeSkill1=''; levelUpCollegeKnowledgeSkill2=''; levelUpCollegeKnowledgeSkill3='';
    const bardDiscoveryList=splitChoiceList(getCharacterStat(entry.sheet,'CONJUROS','Conjuros de descubrimientos mágicos'));
    levelUpBardDiscovery1=bardDiscoveryList[0]||''; levelUpBardDiscovery2=bardDiscoveryList[1]||''; levelUpManeuvers=getCharacterStat(entry.sheet,'RASGOS Y DOTES','Maniobras de maestro del combate') || '';
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
    levelUpGeneralFeatAbility = '';
    levelUpBarbarianFeatSkill = '';
    levelUpBarbarianFeatExpertise = '';
    levelUpBarbarianFeatSpell = getCharacterStat(entry.sheet,'CONJUROS','Conjuro elegido de influencia') || '';
    levelUpBarbarianFeatRituals = getCharacterStat(entry.sheet,'CONJUROS','Conjuros rituales de dote') || '';
    levelUpBarbarianFeatWeaponMastery = getCharacterStat(entry.sheet,'ATAQUES','Maestría adicional por dote') || '';
    levelUpIncrease1 = '2'; levelUpIncrease2 = '0'; levelUpFeat = ''; levelUpHpMode = 'average'; levelUpHpRoll = '';
  }
  function closeLevelUp() { levelUpEntry = null; levelUpIsPlayer = false; }
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
    const oldClassCantripNames=splitChoiceList(getCharacterStat(original,'CONJUROS','Trucos de clase') || (className==='Bardo'?getCharacterStat(original,'CONJUROS','Trucos'):''));
    const oldClassSpellNames=splitChoiceList(getCharacterStat(original,'CONJUROS','Conjuros preparados de clase') || (className==='Bardo'?getCharacterStat(original,'CONJUROS','Conjuros de nivel 1'):''));
    const oldClassCantripCount=oldClassCantripNames.length || getCharacterNumber(original,'CONJUROS','Trucos máximos',0);
    const oldClassPreparedCount=getCharacterNumber(original,'CONJUROS','Conjuros preparados máximos',0);
    const maxClassSpellLevel=highestSpellLevel(classSpellResourcesForLevel);
    const isWarlockSpellProgression=className==='Brujo' && nextLevel>=2;
    const isSorcererSpellProgression=className==='Hechicero';
    const isClericCantripProgression=className==='Clérigo' && nextLevel>=2;
    const isDruidCantripProgression=className==='Druida' && nextLevel>=2;
    const isPaladinSpellProgression=className==='Paladín' && nextLevel>=2;
    const isBardSpellProgression=className==='Bardo';
    if(classCastingAbility && Number.isFinite(classCantripTarget) && (classCantripTarget>oldClassCantripCount || isWarlockSpellProgression || isClericCantripProgression || isDruidCantripProgression || isSorcererSpellProgression || isBardSpellProgression) && classCantripNames.length!==classCantripTarget) { notice='Debes registrar la lista completa de '+classCantripTarget+' trucos de clase.'; return; }
    if(classCastingAbility && Number.isFinite(classPreparedTarget) && (classPreparedTarget>oldClassPreparedCount || isWarlockSpellProgression || isSorcererSpellProgression || isBardSpellProgression) && classSpellNames.length!==classPreparedTarget) { notice='Debes registrar la lista completa de '+classPreparedTarget+' conjuros de clase preparados/conocidos.'; return; }
    if((isWarlockSpellProgression || isSorcererSpellProgression || isPaladinSpellProgression) && (new Set(classCantripNames.map(name=>normalizeLevelText(name))).size!==classCantripNames.length || new Set(classSpellNames.map(name=>normalizeLevelText(name))).size!==classSpellNames.length)) { notice='No puedes repetir trucos ni conjuros en tu lista de clase.'; return; }
    if(isBardSpellProgression && (new Set(classCantripNames.map(name=>normalizeLevelText(name))).size!==classCantripNames.length || new Set(classSpellNames.map(name=>normalizeLevelText(name))).size!==classSpellNames.length)) { notice='No puedes repetir trucos ni conjuros en tu lista de clase.'; return; }
    if(isSorcererSpellProgression && oldClassCantripNames.length && classCantripNames.filter(name=>oldClassCantripNames.some(old=>normalizeLevelText(old)===normalizeLevelText(name))).length<oldClassCantripNames.length-1) { notice='Al subir de nivel de hechicero solo puedes sustituir un truco que ya conozcas.'; return; }
    if(isSorcererSpellProgression && oldClassSpellNames.length && classSpellNames.filter(name=>oldClassSpellNames.some(old=>normalizeLevelText(old)===normalizeLevelText(name))).length<oldClassSpellNames.length-1) { notice='Al subir de nivel de hechicero solo puedes sustituir un conjuro preparado que ya conozcas.'; return; }
    if(isBardSpellProgression && oldClassCantripNames.length && classCantripNames.filter(name=>oldClassCantripNames.some(old=>normalizeLevelText(old)===normalizeLevelText(name))).length<oldClassCantripNames.length-1) { notice='Al subir de nivel de bardo puedes sustituir como máximo un truco que ya conozcas.'; return; }
    if(isBardSpellProgression && oldClassSpellNames.length && classSpellNames.filter(name=>oldClassSpellNames.some(old=>normalizeLevelText(old)===normalizeLevelText(name))).length<oldClassSpellNames.length-1) { notice='Al subir de nivel de bardo puedes sustituir como máximo un conjuro preparado que ya conozcas.'; return; }
    if(isClericCantripProgression && new Set(classCantripNames.map(name=>normalizeLevelText(name))).size!==classCantripNames.length) { notice='No puedes repetir trucos en la lista del clérigo.'; return; }
    if(isClericCantripProgression && oldClassCantripNames.length && classCantripNames.filter(name=>oldClassCantripNames.some(old=>normalizeLevelText(old)===normalizeLevelText(name))).length<oldClassCantripNames.length-1) { notice='Al subir de nivel de clérigo puedes sustituir como máximo un truco que ya conozcas.'; return; }
    if(isDruidCantripProgression && new Set(classCantripNames.map(name=>normalizeLevelText(name))).size!==classCantripNames.length) { notice='No puedes repetir trucos en la lista del druida.'; return; }
    if(isDruidCantripProgression && oldClassCantripNames.length && classCantripNames.filter(name=>oldClassCantripNames.some(old=>normalizeLevelText(old)===normalizeLevelText(name))).length<oldClassCantripNames.length-1) { notice='Al subir de nivel de druida puedes sustituir como máximo un truco que ya conozcas.'; return; }
    if(isWarlockSpellProgression && oldClassCantripNames.length && classCantripNames.filter(name=>oldClassCantripNames.some(old=>normalizeLevelText(old)===normalizeLevelText(name))).length<oldClassCantripNames.length-1) { notice='Al subir de nivel de brujo solo puedes sustituir un truco que ya conozcas.'; return; }
    if(isWarlockSpellProgression && oldClassSpellNames.length && classSpellNames.filter(name=>oldClassSpellNames.some(old=>normalizeLevelText(old)===normalizeLevelText(name))).length<oldClassSpellNames.length-1) { notice='Al subir de nivel de brujo solo puedes sustituir un conjuro que ya conozcas.'; return; }
    if(classCastingAbility && classCantripNames.length && classCantripNames.some(name=>!isValidClassSpell(name,className,0,0))) { notice='Hay trucos que no pertenecen a la lista de '+className+'.'; return; }
    if(classCastingAbility && classSpellNames.length && classSpellNames.some(name=>!(className==='Bardo' && nextLevel>=10 ? Boolean(getSpellRecord(name)) && getSpellRecord(name)!.level>0 && getSpellRecord(name)!.level<=maxClassSpellLevel && getSpellRecord(name)!.classes.some((value:string)=>['bardo','clerigo','druida','mago'].includes(normalizeLevelText(value))) : isValidClassSpell(name,className,maxClassSpellLevel)))) { notice='Hay conjuros que no pertenecen a la lista permitida o superan el nivel de espacio disponible.'; return; }
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
    if(needsBarbarianWildAspect && !validateSingleLevelUpChoice(barbarianAspectChoice,levelUpBarbarianAspect)) { notice='Elige una opción válida para Aspecto de lo salvaje: '+(barbarianAspectChoice?.options||[]).join(', ')+'.'; return; }    const isBarbarianWildHeart=className==='Bárbaro' && selectedSubclassKey==='senda del corazon salvaje';
    const isBarbarianZealot=className==='Bárbaro' && selectedSubclassKey==='senda del fanatico';
    const barbarianEpicFeatOptions=BUILDER_EPIC_FEATS.filter(feat=>normalizeLevelText(feat)!=='don del recuerdo de conjuros');
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
    const collegeKnowledgeSkills=[levelUpCollegeKnowledgeSkill1,levelUpCollegeKnowledgeSkill2,levelUpCollegeKnowledgeSkill3].filter(Boolean);
    const needsBardMagicDiscoveries=isCollegeOfKnowledge && nextLevel>=6;
    const oldBardDiscoveries=splitChoiceList(getCharacterStat(original,'CONJUROS','Conjuros de descubrimientos mágicos'));
    const bardDiscoveryChoices=[levelUpBardDiscovery1,levelUpBardDiscovery2].filter(Boolean);
    const isBardGlamour=className==='Bardo' && selectedSubclassKey==='colegio del glamour';
    const isBardValor=className==='Bardo' && selectedSubclassKey==='colegio del valor';
    const currentSkillChoices=splitChoiceList(getCharacterStat(original,'COMPETENCIAS','Skills'));
    const currentToolChoices=splitChoiceList(getCharacterStat(original,'COMPETENCIAS','Herramientas'));
    if(needsBattleMasterTraining && (!BUILDER_CLASS_SKILLS.Guerrero.options.includes(levelUpSubclassSkill) || currentSkillChoices.some(skill=>normalizeLevelText(skill)===normalizeLevelText(levelUpSubclassSkill)) || !BUILDER_ARTISAN_TOOLS.includes(levelUpSubclassTool) || currentToolChoices.some(tool=>normalizeLevelText(tool)===normalizeLevelText(levelUpSubclassTool)))) { notice='Maestro del combate requiere una habilidad de la lista de guerrero y una herramienta de artesano en las que aún no tengas competencia.'; return; }
    if(needsFeySkill && (!['Engaño','Interpretación','Persuasión'].includes(levelUpSubclassSkill) || currentSkillChoices.some(skill=>normalizeLevelText(skill)===normalizeLevelText(levelUpSubclassSkill)))) { notice='Glamur sobrenatural requiere elegir Engaño, Interpretación o Persuasión, una habilidad en la que aún no tengas competencia.'; return; }
    if(needsCollegeKnowledgeSkills && (collegeKnowledgeSkills.length!==3 || new Set(collegeKnowledgeSkills.map(skill=>normalizeLevelText(skill))).size!==3 || collegeKnowledgeSkills.some(skill=>!BUILDER_SKILL_OPTIONS.some(option=>normalizeLevelText(option)===normalizeLevelText(skill)) || currentSkillChoices.some(old=>normalizeLevelText(old)===normalizeLevelText(skill))))) { notice='El Colegio del Conocimiento requiere tres habilidades distintas en las que todavía no tengas competencia.'; return; }
    if(needsBardMagicDiscoveries && (bardDiscoveryChoices.length!==2 || new Set(bardDiscoveryChoices.map(spell=>normalizeLevelText(spell))).size!==2 || bardDiscoveryChoices.some(spell=>!getBardMagicDiscoveryOptions(nextLevel).some(option=>normalizeLevelText(option)===normalizeLevelText(spell))) || (oldBardDiscoveries.length>0 && oldBardDiscoveries.filter(old=>bardDiscoveryChoices.some(spell=>normalizeLevelText(spell)===normalizeLevelText(old))).length<oldBardDiscoveries.length-1))) { notice='Descubrimientos mágicos requiere dos trucos o conjuros distintos de las listas de clérigo, druida o mago, de nivel para el que tengas espacios. Conserva al menos uno de los dos anteriores.'; return; }
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
    const expertiseChoices=className==='Bardo' && needsExpertise?[levelUpBardExpertise1,levelUpBardExpertise2].filter(Boolean):splitChoiceList(levelUpExpertise);
    const skillRawBefore=getCharacterStat(original,'COMPETENCIAS','Skills');
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
    const currentLanguages=splitChoiceList(getCharacterStat(original,'COMPETENCIAS','Languages'));
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
    if (className==='Bárbaro' && needsASI && levelUpAsiMode === 'feat' && !getBarbarianGeneralFeatOptions(original).some(feat=>normalizeLevelText(feat)===normalizeLevelText(levelUpFeat))) { notice = 'Selecciona una dote general disponible para tu Bárbaro y que todavía no tenga.'; return; }
    if (needsEpicFeat && !levelUpFeat.trim()) { notice = 'Selecciona un Don épico.'; return; }
    if(needsEpicFeat && (!(className==='Bárbaro'?barbarianEpicFeatOptions:BUILDER_EPIC_FEATS).some(feat=>normalizeLevelText(feat)===normalizeLevelText(levelUpFeat)) || !builderEpicFeatAbilities(levelUpFeat).includes(levelUpEpicFeatAbility) || getCharacterNumber(original,'ATRIBUTOS',levelUpEpicFeatAbility,10)>=30)) { notice='Elige un Don épico del manual y una característica permitida que no supere 30.'; return; }
    const acquiringBarbarianFeat=className==='Bárbaro' && needsASI && levelUpAsiMode==='feat';
    const barbarianFeatKey=normalizeLevelText(levelUpFeat);
    const barbarianFeatSkillOptions=getBarbarianFeatSkillOptions(levelUpFeat);
    const barbarianFeatSkillData=getBarbarianFeatSkillData(original,levelUpBarbarianFeatSkill);
    const hasBarbarianRitualFeat=className==='Bárbaro' && (acquiringBarbarianFeat && barbarianFeatKey==='lanzador ritual' || splitChoiceList(getCharacterStat(original,'RASGOS Y DOTES','Dotes adicionales')).some(feat=>normalizeLevelText(feat)==='lanzador ritual'));
    const barbarianRitualTarget=Number(String(row.proficiency||'+2').replace('+',''))||2;
    const barbarianRitualChoices=splitChoiceList(levelUpBarbarianFeatRituals);
    const oldBarbarianRituals=splitChoiceList(getCharacterStat(original,'CONJUROS','Conjuros rituales de dote'));
    if(acquiringBarbarianFeat && ['mente aguda','observador'].includes(barbarianFeatKey)) {
      if(!barbarianFeatSkillOptions.some(skill=>normalizeLevelText(skill)===normalizeLevelText(levelUpBarbarianFeatSkill))) { notice='Elige una habilidad permitida por la dote.'; return; }
      if(barbarianFeatSkillData.expertise.some(skill=>normalizeLevelText(skill)===normalizeLevelText(levelUpBarbarianFeatSkill))) { notice='Elige una habilidad que todavía no tenga Pericia.'; return; }
    }
    if(acquiringBarbarianFeat && barbarianFeatKey==='experto en habilidades') {
      const existingSkills=getBarbarianFeatSkillData(original).proficient;
      if(!BUILDER_SKILL_OPTIONS.some(skill=>normalizeLevelText(skill)===normalizeLevelText(levelUpBarbarianFeatSkill)) || existingSkills.some(skill=>normalizeLevelText(skill)===normalizeLevelText(levelUpBarbarianFeatSkill))) { notice='Elige una habilidad en la que todavía no tengas competencia.'; return; }
      if(!getBarbarianFeatExpertiseOptions(original,levelUpBarbarianFeatSkill).some(skill=>normalizeLevelText(skill)===normalizeLevelText(levelUpBarbarianFeatExpertise))) { notice='Elige para Pericia una habilidad competente que todavía no tenga Pericia.'; return; }
    }
    if(acquiringBarbarianFeat && ['influencia feerica','influencia sombria'].includes(barbarianFeatKey) && !getBarbarianFeatSpellOptions(levelUpFeat).some(spell=>normalizeLevelText(spell)===normalizeLevelText(levelUpBarbarianFeatSpell))) { notice='Elige un conjuro de nivel 1 de la escuela permitida por la dote.'; return; }
    if(acquiringBarbarianFeat && barbarianFeatKey==='maestro de armas' && (!getBarbarianFeatWeaponMasteryOptions(original).some(weapon=>normalizeLevelText(weapon)===normalizeLevelText(levelUpBarbarianFeatWeaponMastery)) || masteryChoices.some(weapon=>normalizeLevelText(weapon)===normalizeLevelText(levelUpBarbarianFeatWeaponMastery)))) { notice='Elige un arma sencilla o marcial para la maestría adicional.'; return; }
    if(hasBarbarianRitualFeat && (barbarianRitualChoices.length!==barbarianRitualTarget || new Set(barbarianRitualChoices.map(name=>normalizeLevelText(name))).size!==barbarianRitualTarget || barbarianRitualChoices.some(name=>!getBarbarianRitualSpellOptions().some(option=>normalizeLevelText(option)===normalizeLevelText(name))) || oldBarbarianRituals.some(name=>!barbarianRitualChoices.some(choice=>normalizeLevelText(choice)===normalizeLevelText(name))))) { notice='Lanzador ritual requiere '+barbarianRitualTarget+' conjuros rituales de nivel 1. Conserva los que ya conoces y añade los que falten.'; return; }
    if(className==='Bárbaro' && needsASI && levelUpAsiMode==='feat') {
      const featAbilities=getBarbarianFeatAbilityOptions(levelUpFeat);
      if(!featAbilities.includes(levelUpGeneralFeatAbility) || getCharacterNumber(original,'ATRIBUTOS',levelUpGeneralFeatAbility,10)>=20) { notice='Elige una característica permitida por la dote que no supere 20.'; return; }
      if(normalizeLevelText(levelUpFeat)==='resiliente' && !getBarbarianResilientSaveOptions(original).includes(levelUpGeneralFeatAbility)) { notice='Resiliente debe aumentar la misma característica cuya tirada de salvación obtienes.'; return; }
    }
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
    // La experiencia acumulada nunca se reinicia al subir de nivel; se registra el umbral del siguiente nivel desde la tabla de XP.
    const accumulatedXP=getCharacterStat(updated,'PERSONAJE','Experiencia');
    const followingLevel=nextLevel+1;
    setCharacterStat(updated,'PROGRESIÓN','Experiencia mínima para siguiente nivel',nextLevel>=20?'Nivel máximo':(LEVEL_XP_THRESHOLDS[followingLevel] ?? 'Consultar progresión'));
    if(accumulatedXP) setCharacterStat(updated,'PROGRESIÓN','Experiencia acumulada registrada',accumulatedXP);
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
      setCharacterStat(updated,'COMBATE','Armor Class',10+dexMod+chaMod);
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
    if(className==='Bárbaro' && needsASI && levelUpAsiMode==='feat') {
      const value=getCharacterNumber(updated,'ATRIBUTOS',levelUpGeneralFeatAbility,10);
      setCharacterStat(updated,'ATRIBUTOS',levelUpGeneralFeatAbility,formatAbilityScore(value+1));
      if(['mente aguda','observador'].includes(normalizeLevelText(levelUpFeat))) {
        const current=getBarbarianFeatSkillData(updated);
        const isProficient=current.proficient.some(skill=>normalizeLevelText(skill)===normalizeLevelText(levelUpBarbarianFeatSkill));
        addBarbarianFeatSkill(updated,levelUpBarbarianFeatSkill,isProficient);
      }
      if(normalizeLevelText(levelUpFeat)==='experto en habilidades') {
        addBarbarianFeatSkill(updated,levelUpBarbarianFeatSkill,false);
        addBarbarianFeatSkill(updated,levelUpBarbarianFeatExpertise,true);
      }
      if(['influencia feerica','influencia sombria'].includes(normalizeLevelText(levelUpFeat))) {
        const bonusSpell=normalizeLevelText(levelUpFeat)==='influencia feerica'?'Paso brumoso':'Invisibilidad';
        setCharacterStat(updated,'CONJUROS','Conjuro elegido de influencia',levelUpBarbarianFeatSpell);
        mergeBarbarianFeatField(updated,'CONJUROS','Conjuros siempre preparados de dotes',[levelUpBarbarianFeatSpell,bonusSpell]);
        mergeBarbarianFeatField(updated,'CONJUROS','Conjuros adicionales de dotes',[levelUpBarbarianFeatSpell]);
        mergeBarbarianFeatField(updated,'CONJUROS','Aptitudes mágicas de dotes',['Influencia: '+levelUpGeneralFeatAbility]);
      }
      if(normalizeLevelText(levelUpFeat)==='maestro de armas') setCharacterStat(updated,'ATAQUES','Maestría adicional por dote',levelUpBarbarianFeatWeaponMastery);
      if(normalizeLevelText(levelUpFeat)==='muy acorazado') setCharacterStat(updated,'COMPETENCIAS','Entrenamiento con armaduras adicionales','Armaduras pesadas');
      if(['chef','envenenador'].includes(normalizeLevelText(levelUpFeat))) {
        const oldTools=splitChoiceList(getCharacterStat(updated,'COMPETENCIAS','Herramientas'));
        const newTool=normalizeLevelText(levelUpFeat)==='chef'?'Útiles de cocinero':'Útiles de envenenador';
        if(!oldTools.some(tool=>normalizeLevelText(tool)===normalizeLevelText(newTool))) oldTools.push(newTool);
        setCharacterStat(updated,'COMPETENCIAS','Herramientas',oldTools.join('; '));
      }
      if(normalizeLevelText(levelUpFeat)==='telepatico') {
        mergeBarbarianFeatField(updated,'CONJUROS','Conjuros siempre preparados de dotes',['Detectar pensamientos']);
        mergeBarbarianFeatField(updated,'CONJUROS','Aptitudes mágicas de dotes',['Telepático: '+levelUpGeneralFeatAbility]);
      }
      if(normalizeLevelText(levelUpFeat)==='telequinetico') {
        mergeBarbarianFeatField(updated,'CONJUROS','Trucos de dote',['Mano de mago']);
        mergeBarbarianFeatField(updated,'CONJUROS','Aptitudes mágicas de dotes',['Telequinético: '+levelUpGeneralFeatAbility]);
      }
      if(normalizeLevelText(levelUpFeat)==='resiliente') {
        const oldSaves=splitChoiceList(getCharacterStat(updated,'COMPETENCIAS','Tiradas de salvación adicionales'));
        if(!oldSaves.some(name=>normalizeLevelText(name)===normalizeLevelText(levelUpGeneralFeatAbility))) oldSaves.push(levelUpGeneralFeatAbility);
        setCharacterStat(updated,'COMPETENCIAS','Tiradas de salvación adicionales',oldSaves.join(', '));
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
    if(hasBarbarianRitualFeat) {
      setCharacterStat(updated,'CONJUROS','Conjuros rituales de dote',barbarianRitualChoices.join(', '));
      mergeBarbarianFeatField(updated,'CONJUROS','Conjuros siempre preparados de dotes',barbarianRitualChoices);
      if(acquiringBarbarianFeat) mergeBarbarianFeatField(updated,'CONJUROS','Aptitudes mágicas de dotes',['Lanzador ritual: '+levelUpGeneralFeatAbility]);
    }
    if(needsBarbarianWildAspect) setCharacterStat(updated,'RASGOS Y DOTES','Aspecto de lo salvaje',levelUpBarbarianAspect);
    if(isBarbarianWildHeart && nextLevel===3) {
      const ritualSpells=['Hablar con los animales','Sentidos de la bestia'];
      const oldRituals=splitChoiceList(getCharacterStat(updated,'CONJUROS','Conjuros rituales de subclase'));
      setCharacterStat(updated,'CONJUROS','Conjuros rituales de subclase',[...new Map([...oldRituals,...ritualSpells].map(name=>[normalizeLevelText(name),name])).values()].join(', '));
    }
    if(isBarbarianWildHeart && nextLevel===10) {
      const oldRituals=splitChoiceList(getCharacterStat(updated,'CONJUROS','Conjuros rituales de subclase'));
      setCharacterStat(updated,'CONJUROS','Conjuros rituales de subclase',[...new Map([...oldRituals,'Comunión con la naturaleza'].map(name=>[normalizeLevelText(name),name])).values()].join(', '));
    }
    if(isBarbarianZealot && [3,6,12,17].includes(nextLevel)) {
      const reserveDice=nextLevel>=17?7:nextLevel>=12?6:nextLevel>=6?5:4;
      setCharacterStat(updated,'RASGOS Y DOTES','Reserva de Guerrero de los dioses',reserveDice+'d12');
    }
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
    if(className==='Bardo') {
      const charismaModifier=Math.floor((getCharacterNumber(updated,'ATRIBUTOS','Carisma',10)-10)/2);
      setCharacterStat(updated,'PROGRESIÓN','Usos de Inspiración bárdica',String(Math.max(1,charismaModifier)));
    }
    if(className==='Bardo' && nextLevel===20) mergeBarbarianFeatField(updated,'CONJUROS','Conjuros siempre preparados de clase',['Palabra de poder: sanar','Palabra de poder: matar']);
    const classFeatureDetails=getClassFeaturesAtLevel(className,nextLevel).map((feature:any)=>'Nivel '+nextLevel+' · '+feature.name+'\n'+feature.description).join('\n\n');
    const currentClassFeatures=classFeatureDetails || features.map((feature:string)=>'Nivel '+nextLevel+' · '+feature).join('\n');
    const previousClassFeatures=getCharacterStat(updated,'PROGRESIÓN','Rasgos de clase acumulados');
    setCharacterStat(updated,'PROGRESIÓN','Rasgos de clase acumulados',[previousClassFeatures,currentClassFeatures].filter(Boolean).join('\n\n'));
    const existingClassTraitText=getCharacterStat(updated,'RASGOS Y DOTES','Rasgos de clase') || getCharacterStat(updated,'RASGOS Y DOTES','Rasgos de clase (nivel 1)');
    setCharacterStat(updated,'RASGOS Y DOTES','Rasgos de clase',[existingClassTraitText,currentClassFeatures].filter(Boolean).join('\n\n'));
    if(needsExpertise) {
      const oldSkillText=getCharacterStat(updated,'COMPETENCIAS','Skills');
      const oldExpertiseList=splitChoiceList((String(oldSkillText).match(/pericia\s*:\s*([^\n;]+)/i)||[])[1]||'');
      const baseSkillText=String(oldSkillText).replace(/;?\s*Pericia\s*:\s*[^\n;]+/i,'').trim();
      setCharacterStat(updated,'COMPETENCIAS','Skills',[baseSkillText,'Pericia: '+[...oldExpertiseList,...expertiseChoices].join(', ')].filter(Boolean).join('; '));
    }
    if(needsNewSkill) {
      const oldSkillText=getCharacterStat(updated,'COMPETENCIAS','Skills');
      setCharacterStat(updated,'COMPETENCIAS','Skills',[oldSkillText,levelUpNewSkill].filter(Boolean).join('; '));
    }
    if(needsNewLanguages) {
      const oldLanguages=getCharacterStat(updated,'COMPETENCIAS','Languages');
      setCharacterStat(updated,'COMPETENCIAS','Languages',[oldLanguages,...languageChoices].filter(Boolean).join(', '));
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
      const oldSkills=getCharacterStat(updated,'COMPETENCIAS','Skills');
      setCharacterStat(updated,'COMPETENCIAS','Skills',[oldSkills,levelUpSubclassSkill].filter(Boolean).join('; '));
    }
    if(needsCollegeKnowledgeSkills) {
      const oldSkills=getCharacterStat(updated,'COMPETENCIAS','Skills');
      setCharacterStat(updated,'COMPETENCIAS','Skills',[oldSkills,...collegeKnowledgeSkills].filter(Boolean).join('; '));
    }
    if(needsBardMagicDiscoveries) {
      const alwaysPrepared=splitChoiceList(getCharacterStat(updated,'CONJUROS','Conjuros siempre preparados de subclase'));
      const retainedAlways=alwaysPrepared.filter(spell=>!oldBardDiscoveries.some(old=>normalizeLevelText(old)===normalizeLevelText(spell)));
      setCharacterStat(updated,'CONJUROS','Conjuros de descubrimientos mágicos',bardDiscoveryChoices.join(', '));
      setCharacterStat(updated,'CONJUROS','Conjuros siempre preparados de subclase',[...retainedAlways,...bardDiscoveryChoices].join(', '));
      const oldDiscoveryCantrips=oldBardDiscoveries.filter(name=>getSpellRecord(name)?.level===0);
      const newDiscoveryCantrips=bardDiscoveryChoices.filter(name=>getSpellRecord(name)?.level===0);
      const oldSubclassCantrips=splitChoiceList(getCharacterStat(updated,'CONJUROS','Trucos de subclase'));
      const retainedSubclassCantrips=oldSubclassCantrips.filter(name=>!oldDiscoveryCantrips.some(old=>normalizeLevelText(old)===normalizeLevelText(name)));
      setCharacterStat(updated,'CONJUROS','Trucos de subclase',[...retainedSubclassCantrips,...newDiscoveryCantrips].join(', '));
      const allCantrips=splitChoiceList(getCharacterStat(updated,'CONJUROS','Trucos'));
      const retainedCantrips=allCantrips.filter(name=>!oldDiscoveryCantrips.some(old=>normalizeLevelText(old)===normalizeLevelText(name)) || oldClassCantripNames.some(old=>normalizeLevelText(old)===normalizeLevelText(name)));
      setCharacterStat(updated,'CONJUROS','Trucos',[...new Map([...retainedCantrips,...newDiscoveryCantrips].map(name=>[normalizeLevelText(name),name])).values()].join(', '));
    }
    if(className==='Bardo' && selectedSubclassKey==='colegio de la danza' && nextLevel===3) setCharacterStat(updated,'COMBATE','Fórmula de clase de armadura','10 + DES + CAR (sin armadura ni escudo; Colegio de la Danza)');
    if(isBardGlamour && nextLevel===3) mergeBarbarianFeatField(updated,'CONJUROS','Conjuros siempre preparados de subclase',['Hechizar persona','Imagen múltiple']);
    if(isBardGlamour && nextLevel===6) mergeBarbarianFeatField(updated,'CONJUROS','Conjuros siempre preparados de subclase',['Orden imperiosa']);
    if(isBardValor && nextLevel===3) {
      mergeBarbarianFeatField(updated,'COMPETENCIAS','Armas',['Armas marciales']);
      mergeBarbarianFeatField(updated,'COMPETENCIAS','Armaduras',['Armaduras medias','Escudos']);
      mergeBarbarianFeatField(updated,'COMPETENCIAS','Entrenamiento con armaduras adicionales',['Armaduras medias','Escudos']);
      setCharacterStat(updated,'CONJUROS','Canalizador mágico de subclase','Arma sencilla o marcial');
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
        const oldClassTricks=splitChoiceList(getCharacterStat(updated,'CONJUROS','Trucos de clase') || (className==='Bardo'?getCharacterStat(updated,'CONJUROS','Trucos'):''));
        const combinedTricks=splitChoiceList(getCharacterStat(updated,'CONJUROS','Trucos'));
        const otherTricks=[...combinedTricks.filter(name=>!oldClassTricks.some(old=>normalizeLevelText(old)===normalizeLevelText(name))),...splitChoiceList(getCharacterStat(updated,'CONJUROS','Trucos de subclase'))];
        setCharacterStat(updated,'CONJUROS','Trucos de clase',classCantripNames.join(', '));
        setCharacterStat(updated,'CONJUROS','Trucos',[...new Map([...classCantripNames,...otherTricks].map(name=>[normalizeLevelText(name),name])).values()].join(', '));
      }
      if(levelUpClassSpells.trim()) {
        const oldClassSpells=splitChoiceList(getCharacterStat(updated,'CONJUROS','Conjuros preparados de clase') || (className==='Mago'?(String(getCharacterStat(updated,'CONJUROS','Conjuros de nivel 1')).match(/Preparados:\s*([^.]*)/i)||[])[1]||'':className==='Bardo'?getCharacterStat(updated,'CONJUROS','Conjuros de nivel 1'):''));
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
    const record='Nivel '+nextLevel+': '+features.join(', ')+(subclassFeatureNames.length?' · '+formatSubclassName(subclass?.key || '')+': '+subclassFeatureNames.join(', '):'')+(needsASI?(levelUpAsiMode==='feat'?' · Dote: '+levelUpFeat.trim()+(className==='Bárbaro'?' · '+levelUpGeneralFeatAbility+' +1'+(normalizeLevelText(levelUpFeat)==='resiliente'?' · Salvación: '+levelUpGeneralFeatAbility:''):''):' · Mejora: '+levelUpAbility1+' +'+levelUpIncrease1+(Number(levelUpIncrease2)?', '+levelUpAbility2+' +'+levelUpIncrease2:'')):'')+(acquiringBarbarianFeat && ['mente aguda','observador'].includes(barbarianFeatKey)?' · Habilidad de dote: '+levelUpBarbarianFeatSkill:'')+(acquiringBarbarianFeat && barbarianFeatKey==='experto en habilidades'?' · Competencia: '+levelUpBarbarianFeatSkill+' · Pericia: '+levelUpBarbarianFeatExpertise:'')+(acquiringBarbarianFeat && ['influencia feerica','influencia sombria'].includes(barbarianFeatKey)?' · Conjuro de dote: '+levelUpBarbarianFeatSpell:'')+(acquiringBarbarianFeat && barbarianFeatKey==='maestro de armas'?' · Maestría adicional: '+levelUpBarbarianFeatWeaponMastery:'')+(hasBarbarianRitualFeat?' · Conjuros rituales de dote: '+barbarianRitualChoices.join(', '):'')+(needsEpicFeat?' · Don épico: '+levelUpFeat.trim()+' · '+levelUpEpicFeatAbility+' +1':'')+(needsBarbarianWildAspect?' · Aspecto de lo salvaje: '+levelUpBarbarianAspect:'')+(needsRangerStyle?' · Estilo de combate: '+levelUpRangerStyle:'')+(needsFighterStyle?' · Estilos de combate: '+fighterStyleChoices.join(', '):'')+(isRangerDruidicWarrior?' · Guerrero druídico: '+rangerCantripChoices.join(', '):'')+(needsHunterPrey?' · Cazador y presa: '+levelUpRangerHunterPrey:'')+(needsHunterDefense?' · Tácticas defensivas: '+levelUpRangerHunterDefense:'')+(needsRangerFeyGift?' · Bendición feérica: '+levelUpRangerFeyGift:'')+(needsRangerBeastCompanion?' · Compañero primigenio: '+levelUpRangerBeastProfile+' · '+levelUpRangerBeastAnimal:'')+(needsExpertise?' · Pericia: '+expertiseChoices.join(', '):'')+(needsNewSkill?' · Competencia: '+levelUpNewSkill:'')+(needsNewLanguages?' · Idiomas: '+languageChoices.join(', '):'')+(needsWildShapeForms?' · Formas salvajes: '+wildShapeForms.join(', '):'')+(needsMetamagic?' · Metamagia: '+metamagicChoices.join(', '):'')+(needsDraconicAffinity?' · Afinidad elemental: '+levelUpSorcererAffinity:'')+(needsWarlockInvocations?' · Invocaciones: '+invocationChoices.join(', '):'')+(needsMysticArcanum?' · Arcanum místico: '+arcanumChoices.join(', '):'')+(needsElementalFury?' · Furia elemental: '+levelUpElementalFury:'')+(needsBlessedStrikes?' · Golpes benditos: '+levelUpBlessedStrikes:'')+(needsWizardMastery?' · Maestría sobre conjuros: '+levelUpWizardMastery1+', '+levelUpWizardMastery2:'')+(needsWizardSignature?' · Conjuros característicos: '+wizardSignatureChoices.join(', '):'')+(className==='Monje' && nextLevel===20?' · Cuerpo y mente: +4 Destreza y +4 Sabiduría (máximo 25)':'')+(needsBattleMasterTraining?' · Estudioso de la guerra: '+levelUpSubclassSkill+', '+levelUpSubclassTool:'')+(needsFeySkill?' · Glamur sobrenatural: '+levelUpSubclassSkill:'')+(needsCollegeKnowledgeSkills?' · Competencias adicionales del Colegio del Conocimiento: '+collegeKnowledgeSkills.join(', '):'')+(needsBardMagicDiscoveries?' · Descubrimientos mágicos: '+bardDiscoveryChoices.join(', '):'')+(needsBattleManeuvers?' · Maniobras: '+maneuverChoices.join(', '):'')+(targetMasteries>oldMasteryCount?' · Maestrías con armas: '+masteryChoices.join(', '):'')+(levelUpDecision.trim()?' · '+levelUpDecision.trim():'');
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
    if (levelUpIsPlayer) {
      sheet = updated;
      localStorage.setItem('forja-raw-character', JSON.stringify(updated));
      syncPending = false;
      syncStatus = 'Ficha guardada localmente en este dispositivo.';
    } else {
      const playerId=levelUpEntry.playerId;
      receiveLiveCharacter({ ...levelUpEntry, sheet: updated });
      void OBR.broadcast.sendMessage(CHANNEL,{type:'character-level-up',playerId,playerName:levelUpEntry.playerName,character:updated},{destination:'ALL'}).catch(()=>{});
    }
    levelUpEntry=null;
    levelUpIsPlayer=false;
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
        if (/^Dato\s*\d+$/i.test(String(stat.name || '').trim()) && expected[index]) stat.name = expected[index];
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
    if (/habilidad|skill|percepcion|investigacion|intuicion|acroba|sigilo|supervivencia/.test(n)) return 'Skills';
    if (/inventario|equipo|objeto|inventory|equipment|economia|monedas|riqueza/.test(n)) return 'Inventario';
    if (/velocidad|speed|defensa|defenses|resistencia|inmunidad|vulnerabilidad|puntos de golpe|hit points|armadura|armor class|clase de armadura/.test(n)) return 'Velocidad y defensas';
    if (/rasgo|dote|caracteristica de clase|racial|especie|feature|trait/.test(n)) return 'Rasgos y características';
    if (/competencia|entrenamiento|proficien|idioma|herramienta|tool|weapon training|armor training/.test(n)) return 'Rasgos y competencias';
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
      'Skills',
      'Acciones',
      'Inventario',
      'Conjuros',
      'Rasgos y competencias',
      'Rasgos y características',
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
  const builderPreviewTabs = ['Características y salvaciones','Velocidad y defensas','Skills','Acciones','Inventario','Conjuros','Rasgos y competencias','Trasfondo','Notas','Extras'];
  let playerSheetTab = 'Acciones';
  const playerSheetTabs = ['Acciones', 'Conjuros', 'Compendio de conjuros', 'Reglas', 'Botones', 'Inventario', 'Iniciativa', 'Subir nivel'];
  type QuickButton = { name: string; attack: string; damage: string; mode: 'normal'|'advantage'|'disadvantage' };
  type QuickRollResult = { id:number; name:string; attack:string; damage:string; attackResult:string; damageResult:string; mode:string; critical:boolean; fumble:boolean; };
  let editingQuickButton = -1;
  let quickRollHistory: QuickRollResult[] = [];
  const emptyQuickButton = (): QuickButton => ({ name:'Vacío', attack:'1d20', damage:'', mode:'normal' });
  function getQuickButtons(target: RawSheet): QuickButton[] {
    const current = Array.isArray((target as any).quickButtons) ? (target as any).quickButtons : [];
    const normalized = Array.from({length:10},(_,i) => ({...emptyQuickButton(), ...(current[i] || {})}));
    (target as any).quickButtons = normalized;
    return normalized;
  }
  function updateQuickButton(index:number, key:keyof QuickButton, event:Event) {
    if (!sheet) return;
    const buttons = getQuickButtons(sheet);
    buttons[index] = {...buttons[index], [key]:(event.currentTarget as HTMLInputElement).value};
    (sheet as any).quickButtons = [...buttons];
    sheet = {...sheet};
    scheduleAutoSync();
  }
  function cycleQuickMode(index:number) {
    if (!sheet) return;
    const buttons = getQuickButtons(sheet);
    if (!/d20/i.test(buttons[index].attack)) return;
    const modes:QuickButton['mode'] = buttons[index].mode === 'normal' ? 'advantage' : buttons[index].mode === 'advantage' ? 'disadvantage' : 'normal';
    buttons[index] = {...buttons[index],mode:modes};
    (sheet as any).quickButtons = [...buttons];
    sheet = {...sheet};
    scheduleAutoSync();
  }
  function rollFormula(formula:string, doubleDice=false): {detail:string; total:number} {
    const source = formula.replace(/\s+/g,'').replace(/−/g,'-');
    if (!source || !/^(?:[+-]?(?:\d+)?d(?:4|6|8|10|12|20|100)|[+-]?\d+)(?:(?:[+-])(?:(?:\d+)?d(?:4|6|8|10|12|20|100)|\d+))*$/i.test(source)) throw new Error('Fórmula no válida');
    const terms = source.match(/[+-]?(?:\d+)?d(?:4|6|8|10|12|20|100)|[+-]?\d+/gi) || [];
    let total=0;
    const details:string[]=[];
    for (const term of terms) {
      const sign = term.startsWith('-') ? -1 : 1;
      const clean = term.replace(/^[+-]/,'');
      const die = clean.match(/^(\d*)d(4|6|8|10|12|20|100)$/i);
      if (die) {
        const count = Math.max(1,Number(die[1] || 1)) * (doubleDice ? 2 : 1);
        const sides = Number(die[2]);
        const rolls = Array.from({length:count},()=>Math.floor(Math.random()*sides)+1);
        const subtotal = rolls.reduce((a,b)=>a+b,0)*sign;
        total += subtotal;
        details.push((sign<0?'-':'')+'('+rolls.join('+')+')');
      } else {
        const value=Number(clean)*sign;
        total+=value;
        details.push((value>0?'+':'')+value);
      }
    }
    return {detail:details.join(' '),total};
  }
  function quickFormulaForDicePlus(formula:string, mode:'normal'|'advantage'|'disadvantage'='normal', critical=false): string {
    let notation=formula.replace(/\s+/g,'').replace(/−/g,'-');
    if (!/^(?:[+-]?(?:\d+)?d(?:4|6|8|10|12|20|100)(?:(?:kh|kl)\d+)?|[+-]?\d+)(?:(?:[+-])(?:(?:\d+)?d(?:4|6|8|10|12|20|100)(?:(?:kh|kl)\d+)?|\d+))*$/i.test(notation)) {
      throw new Error('Fórmula no válida: '+formula);
    }
    if (critical) notation=notation.replace(/(\d*)d(4|6|8|10|12|20|100)/gi,(_,count,sides)=>(Number(count||1)*2)+'d'+sides);
    if (mode!=='normal') {
      if (!/^\d*d20/i.test(notation)) throw new Error('Ventaja y desventaja requieren un d20 en el ataque.');
      notation=notation.replace(/^\d*d20/i, '2d20'+(mode==='advantage'?'kh1':'kl1'));
    }
    return notation;
  }

  async function rollQuickDicePlus(notation:string,label:string): Promise<string> {
    if (!obrReady || (obrRole!=='PLAYER' && obrRole!=='GM')) throw new Error('Las tiradas solo pueden enviarse desde Owlbear Rodeo.');
    const valid=/^[+-]?(?:\d+)?d(?:4|6|8|10|12|20|100)(?:(?:kh|kl)\d+)?(?:(?:[+-])(?:(?:\d+)?d(?:4|6|8|10|12|20|100)(?:(?:kh|kl)\d+)?|\d+))*$/i.test(notation);
    if (!valid) throw new Error('Notación no válida para Dice+: '+notation);
    if (!(await checkDicePlusReady())) throw new Error('Dice+ no está disponible en esta sala. Activa la extensión Dice+.');
    const playerId=await OBR.player.getId();
    const playerName=await OBR.player.getName();
    const rollId='forja_'+Date.now()+'_'+Math.random().toString(36).slice(2,9);
    lastRollId=rollId;
    return await new Promise<string>(async(resolve,reject)=>{
      let settled=false;
      let unsubResult:()=>void=()=>{};
      let unsubError:()=>void=()=>{};
      const finish=(error:Error|null,value='')=>{
        if(settled)return;
        settled=true;
        clearTimeout(timer);
        unsubResult();
        unsubError();
        if(error)reject(error);else resolve(value);
      };
      const timer=setTimeout(()=>finish(new Error('Dice+ no respondió con el resultado de la tirada.')),12000);
      const resultChannel=`${DICE_PLUS_SOURCE}/roll-result`;
      const errorChannel=`${DICE_PLUS_SOURCE}/roll-error`;
      unsubResult=OBR.broadcast.onMessage(resultChannel,(event:any)=>{
        const payload=event?.data??event;
        if(payload?.rollId!==rollId)return;
        const result=payload.result??payload;
        const total=result?.totalValue;
        const summary=result?.rollSummary;
        const textResult=typeof summary==='string'&&summary.trim()?summary.trim():
          total!==undefined&&total!==null?'Total: '+total:
          result?.groups?JSON.stringify(result.groups):'Resultado recibido de Dice+';
        finish(null,textResult);
      });
      unsubError=OBR.broadcast.onMessage(errorChannel,(event:any)=>{
        const payload=event?.data??event;
        if(payload?.rollId!==rollId)return;
        finish(new Error('Dice+ rechazó la tirada: '+String(payload.error||payload.notation||'error desconocido')));
      });
      try {
        const cleanLabel=label.replace(/[#+\-*/(),\r\n]/g,' ').replace(/\s+/g,' ').trim();
        await OBR.broadcast.sendMessage('dice-plus/roll-request',{
          rollId,playerId,playerName,rollTarget:'everyone',
          diceNotation:notation+(cleanLabel?'#'+cleanLabel:''),
          showResults:true,timestamp:Date.now(),source:DICE_PLUS_SOURCE
        },{destination:'ALL'});
      } catch(error) {
        finish(error instanceof Error?error:new Error('No se pudo enviar la tirada a Dice+.'));
      }
    });
  }

  async function rollQuickButton(index:number) {
    if (!sheet) return;
    const button=getQuickButtons(sheet)[index];
    try {
      const attackNotation=quickFormulaForDicePlus(button.attack,button.mode);
      const damageNotation=button.damage.trim()?quickFormulaForDicePlus(button.damage):'';
      notice='Esperando resultado de Dice+…';
      const attackResult=await rollQuickDicePlus(attackNotation,(button.name||'Tirada')+' · Ataque');
      const damageResult=damageNotation?await rollQuickDicePlus(damageNotation,(button.name||'Tirada')+' · Daño'):'';
      quickRollHistory=[{
        id:Date.now(),name:button.name||'Tirada',attack:attackNotation,damage:damageNotation,
        attackResult,damageResult,mode:button.mode,critical:false,fumble:false
      },...quickRollHistory].slice(0,10);
      notice='Resultado recibido de Dice+ y guardado en el registro.';
    } catch (error) {
      notice=error instanceof Error?error.message:'No se pudo realizar la tirada.';
    }
  }

  function playerFeatureGroups(target: RawSheet) {
    const className = sheetClassName(target);
    const level = sheetLevel(target);
    const classFeatures = ((CLASS_FEATURES as any).classes?.[className] || [])
      .filter((feature:any) => Number(feature.level) <= level)
      .map((feature:any) => ({ name: feature.name, description: feature.description || '', source: 'Clase', level: Number(feature.level) }));
    const species = getCharacterStat(target,'PERSONAJE','Especie');
    const speciesText = BUILDER_SPECIES_TRAITS[species] || '';
    const speciesFeatures:{name:string;description:string;source:string;level?:number}[] = [];
    const speciesPattern = /([A-ZÁÉÍÓÚÜÑ][^.:]{1,45}):\s*([\s\S]*?)(?=(?:\.\s+[A-ZÁÉÍÓÚÜÑ][^.:]{1,45}:)|$)/g;
    let match:RegExpExecArray|null;
    while ((match = speciesPattern.exec(speciesText)) !== null) {
      const name = match[1].trim();
      const description = match[2].replace(/[.]\s*$/,'').trim();
      if (normalizeLevelText(name) === 'tipo de criatura' || !description) continue;
      if (!/(accion|competencia|conjuro|truco|ventaja|resistencia|vision|vuelo|ataque|daño|velocidad|tamaño|salvacion|hechizado|asustado|agarrado|inspiracion|descanso|curas|cura|habilidad|magia|linaje)/i.test(description)) continue;
      speciesFeatures.push({ name, description, source: 'Especie' });
    }
    for (let n=1;n<=level;n++) {
      const unlock = getSpeciesLevelUnlock(target,n);
      unlock.features.forEach(feature => speciesFeatures.push({ ...feature, source: 'Especie', level:n }));
    }
    const savedSpecies = getCharacterStat(target,'RASGOS Y DOTES','Rasgos de especie');
    const savedSpeciesBlocks = String(savedSpecies || '').split(/\n\s*\n/).map(block=>block.trim()).filter(Boolean);
    savedSpeciesBlocks.forEach(block => {
      const parsed = block.match(/^(?:Nivel\s+(\d+)\s*·\s*)?([^\n]+)\n([\s\S]+)$/i);
      if (parsed && (!parsed[1] || Number(parsed[1]) <= level)) {
        const name = parsed[2].trim();
        if (!speciesFeatures.some(item=>normalizeLevelText(item.name)===normalizeLevelText(name))) speciesFeatures.push({name,description:parsed[3].trim(),source:'Especie',level:parsed[1]?Number(parsed[1]):undefined});
      }
    });
    const featNames = [
      ...splitChoiceList(getCharacterStat(target,'RASGOS Y DOTES','Dote de origen')),
      ...splitChoiceList(getCharacterStat(target,'RASGOS Y DOTES','Dotes adicionales')),
      ...splitChoiceList(getCharacterStat(target,'DOTE Y OPCIONES','Dote de origen')),
      ...splitChoiceList(getCharacterStat(target,'DETALLES DEL TRASFONDO','Dote de origen'))
    ].filter(name => name && !/^[-—]+$/.test(name));
    const feats = [...new Map(featNames.map(name=>[normalizeLevelText(name),{name,description:'Dote obtenida por el personaje. Sus elecciones y beneficios registrados se muestran en las competencias, conjuros y otros rasgos de la ficha.',source:'Dote'}])).values()];
    return {
      traits:[...classFeatures,...speciesFeatures].filter((item,index,list)=>list.findIndex(other=>normalizeLevelText(other.name)===normalizeLevelText(item.name))===index),
      feats
    };
  }

  function playerSheetPairs(tab: string, sections: RawSection[] = sheet?.sections || []) {
    return sectionPairs(sections).filter(pair => {
      const heading = String(pair.heading.name || '');
      if (normalizeLevelText(heading) === 'combate') return false;
      const category = sectionTab(heading);
      if (tab === 'Acciones') {
        if (normalizeLevelText(heading) === 'ataques') return false;
        return category === 'Acciones' || category === 'Velocidad y defensas';
      }
      if (tab === 'Conjuros') return category === 'Conjuros';
      if (tab === 'Inventario') return category === 'Inventario';
      if (tab === 'Rasgos y competencias') return category === 'Rasgos y competencias' || category === 'Rasgos y características' || category === 'Extras';
      if (tab === 'Notas') return category === 'Notas';
      return false;
    });
  }

  function playerWeaponAttacks(target: RawSheet) {
    const names = getCharacterStat(target,'ATAQUES','Armas incluidas en el equipo');
    const proficiency = getCharacterNumber(target,'COMBATE','Bonificador por competencia',2);
    const strengthMod = Math.floor((getCharacterNumber(target,'ATRIBUTOS','Fuerza',10)-10)/2);
    const dexterityMod = Math.floor((getCharacterNumber(target,'ATRIBUTOS','Destreza',10)-10)/2);
    const profText = normalizeLevelText(getCharacterStat(target,'COMPETENCIAS','Armas'));
    return [...new Set(names.split(/[,;\n]+/).map(name=>name.trim()).filter(name=>Boolean(name && WEAPON_PROFILES[name])))].map(name=>{
      const profile = WEAPON_PROFILES[name];
      if (!profile) return {name, attackBonus:null as number|null, damage:'—', damageType:'No disponible', range:'—'};
      const abilityMod = profile.ability==='finesse' ? Math.max(strengthMod,dexterityMod) : profile.ability==='dexterity' ? dexterityMod : strengthMod;
      const normalizedName = normalizeLevelText(name);
      const proficient = (profile.category==='simple' && profText.includes('sencillas')) ||
        (profile.category==='martial' && profText.includes('marciales')) ||
        profText.includes(normalizedName) || classWeaponSpecialProficiency(profText,profile,name);
      const damageBonus = abilityMod===0 ? '' : (abilityMod>0?'+':'')+abilityMod;
      const rangeMatch = profile.properties.match(/(?:Munición|Arrojadiza)\s*\(([^)]+)\)/i);
      const range = rangeMatch ? rangeMatch[1] : /alcance/i.test(profile.properties) ? '3 m' : '1,5 m';
      return {name, attackBonus:abilityMod+(proficient?proficiency:0) as number|null, proficient, damage:profile.damage+damageBonus, damageType:profile.damageType, range};
    });
  }

  function playerSidePairs(kind: 'saves' | 'skills' | 'training', sections: RawSection[] = sheet?.sections || []) {
    return sectionPairs(sections).filter(pair => {
      const heading = String(pair.heading.name || '').toLocaleLowerCase();
      const category = sectionTab(heading);
      if (kind === 'skills') return category === 'Skills';
      if (kind === 'training') return category === 'Rasgos y competencias';
      return /salvaci|saving throw/.test(heading);
    });
  }

  function playerAttributes(sections: RawSection[] = sheet?.sections || []) {
    return sectionPairs(sections).filter(pair => sectionClass(String(pair.heading.name || '')) === 'attributes-section');
  }
  function abilityScoreNumber(value: unknown): number | null {
    const match = String(value ?? '').replace(/,/g,'.').match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  }
  function abilityModifier(value: unknown): number | null {
    const score = abilityScoreNumber(value);
    return score === null ? null : Math.floor((score - 10) / 2);
  }
  function savingThrowNumber(ability: string, sections: RawSection[] = sheet?.sections || []): number | null {
    const raw = savingThrowBonus(ability, sections);
    const match = raw.replace(/−/g,'-').match(/[+-]?\d+/);
    return match ? Number(match[0]) : null;
  }

  function savingThrowRaw(ability: string, sections: RawSection[] = sheet?.sections || []) {
    const pair = sectionPairs(sections).find(item => String(item.heading.name || '').toLocaleUpperCase() === 'SALVACIONES');
    const index = (pair?.heading.stats || []).findIndex(stat => normalizeLevelText(String(stat.name || '')) === normalizeLevelText(ability));
    if (index < 0) return '';
    return displayValue(pair?.values?.stats?.[index]?.value) || displayValue(pair?.heading.stats?.[index]?.value);
  }
  function savingThrowIsProficient(ability: string, sections: RawSection[] = sheet?.sections || []) {
    return /competente/i.test(savingThrowRaw(ability, sections));
  }
  function skillIsProficient(skill: string, target: RawSheet | null = sheet) {
    if (!target) return false;
    const raw = getCharacterStat(target, 'COMPETENCIAS', 'Skills');
    const choices = splitChoiceList(raw.split(/;\s*Pericia:/i)[0]);
    return choices.some(choice => normalizeLevelText(choice) === normalizeLevelText(skill));
  }
  function skillIsExpertise(skill: string, target: RawSheet | null = sheet) {
    if (!target) return false;
    const raw = getCharacterStat(target, 'COMPETENCIAS', 'Skills');
    const match = String(raw).match(/pericia\s*:\s*([^\n;]+)/i);
    return splitChoiceList(match?.[1] || '').some(choice => normalizeLevelText(choice) === normalizeLevelText(skill));
  }
  function skillBonusNumber(value: unknown): number | null {
    const match = String(value ?? '').replace(/−/g,'-').match(/[+-]?\d+/);
    return match ? Number(match[0]) : null;
  }
  function savingThrowBonus(ability: string, sections: RawSection[] = sheet?.sections || []) {
    return savingThrowRaw(ability, sections).replace(/\s*·\s*Competente/i, '').trim() || '—';
  }

  function sectionClass(name = '') {
    const n = name.toLocaleLowerCase();
    if (/ataque|arma/.test(n)) return 'attacks-section';
    if (/atribut|característic|ability|ability score/.test(n)) return 'attributes-section';
    if (/combate|ataque|armadura|punto de golpe|defensa/.test(n)) return 'combat-section';
    if (/habilidad|salvaci/.test(n)) return 'skills-section';
    if (/rasgo|dote|característica de clase|especie|racial|competenc|entrenamiento|proficien|herramienta/.test(n)) return 'features-section';
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

  function persistMasterCopies() {
    try { localStorage.setItem(MASTER_SHEETS_KEY, JSON.stringify(savedMasterSheets)); }
    catch { notice = 'No se pudieron guardar las copias locales del director. El almacenamiento puede estar lleno.'; }
  }

  function refreshRoomSheetList() {
    const merged = new Map<string, RoomEntry>();
    savedMasterSheets.forEach(entry => merged.set(entry.playerId, { ...entry, saved: true, live: false }));
    liveRoomSheets.forEach(entry => {
      const saved = savedMasterSheets.find(copy => copy.playerId === entry.playerId);
      if (saved) merged.set(entry.playerId, { ...entry, saved: true, live: true });
      else merged.set(entry.playerId, { ...entry, saved: false, live: true });
    });
    roomSheets = [...merged.values()].sort((a,b) => (a.sheet?.name || '').localeCompare(b.sheet?.name || '', 'es'));
  }

  function loadMasterCopies() {
    try {
      const raw = localStorage.getItem(MASTER_SHEETS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      savedMasterSheets = Array.isArray(parsed) ? parsed.filter((entry: any) => entry?.playerId && entry?.sheet?.sections).map((entry: any) => ({ ...entry, saved: true, live: false })) : [];
    } catch { savedMasterSheets = []; }
    refreshRoomSheetList();
  }

  function saveMasterCopy(entry: RoomEntry) {
    const copy = { playerId: entry.playerId, playerName: entry.playerName, sheet: JSON.parse(JSON.stringify(entry.sheet)), saved: true, live: false } as RoomEntry;
    savedMasterSheets = [...savedMasterSheets.filter(item => item.playerId !== entry.playerId), copy];
    persistMasterCopies();
    refreshRoomSheetList();
    notice = 'Copia de «' + (copy.sheet.name || copy.playerName) + '» guardada en este dispositivo.';
  }

  function deleteMasterCopy(entry: RoomEntry) {
    savedMasterSheets = savedMasterSheets.filter(item => item.playerId !== entry.playerId);
    persistMasterCopies();
    refreshRoomSheetList();
    notice = 'Copia local eliminada: ' + (entry.sheet?.name || entry.playerName) + '.';
  }

  function exportMasterCopy(entry: RoomEntry) {
    const json = JSON.stringify(entry.sheet, null, 2);
    const safeName = (entry.sheet?.name || entry.playerName || 'personaje')
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
    notice = 'Copia exportada como ' + safeName + '.json';
  }

  function receiveLiveCharacter(entry: RoomEntry) {
    liveRoomSheets = [...liveRoomSheets.filter(item => item.playerId !== entry.playerId), { ...entry, live: true }];
    const existingCopy = savedMasterSheets.find(item => item.playerId === entry.playerId);
    if (existingCopy) {
      savedMasterSheets = [...savedMasterSheets.filter(item => item.playerId !== entry.playerId), { ...entry, saved: true, live: false }];
      persistMasterCopies();
    }
    refreshRoomSheetList();
  }

  function readPlayers(players: any[]) {
    liveRoomSheets = players.flatMap((p: any) => {
      const payload = p.metadata?.[KEY];
      if (!payload || payload.deleted || !payload.character) return [];
      return [{ playerId: p.id, playerName: p.name || payload.playerName || 'Jugador', sheet: repairGenericStatLabels(payload.character as RawSheet) as RawSheet, live: true }];
    });
    liveRoomSheets.forEach(entry => {
      if (savedMasterSheets.some(copy => copy.playerId === entry.playerId)) {
        savedMasterSheets = [...savedMasterSheets.filter(copy => copy.playerId !== entry.playerId), { ...entry, saved: true, live: false }];
      }
    });
    if (liveRoomSheets.some(entry => savedMasterSheets.some(copy => copy.playerId === entry.playerId))) persistMasterCopies();
    refreshRoomSheetList();
    const rosterIds=new Set(roomSheets.map(entry=>'player:'+entry.playerId));
    initiativeOrder=initiativeOrder.filter(entry=>!entry.id.startsWith('player:')||rosterIds.has(entry.id));
    if(activeInitiativeIndex>=initiativeOrder.length)activeInitiativeIndex=Math.max(0,initiativeOrder.length-1);
  }

  async function refreshPlayers() {
    try { readPlayers(await OBR.party.getPlayers()); } catch {}
  }


  async function loadGithubRoomConfig() {
    try {
      const metadata: any = await OBR.room.getMetadata();
      const config = metadata?.[GITHUB_ROOM_KEY];
      if (config?.token && config?.owner && config?.repo) {
        githubConfig = { token: config.token, owner: config.owner, repo: config.repo, branch: config.branch || 'main' };
        githubStore = new GithubCharacterStorage(githubConfig);
        githubOwnerDraft = githubConfig.owner;
        githubRepoDraft = githubConfig.repo;
        githubBranchDraft = githubConfig.branch;
        // Las fichas guardadas de jugadores ya no se recuperan en la vista del director.
      }
    } catch { cloudStatus = 'No se pudo leer la configuración compartida de GitHub de esta sala.'; }
  }

  async function saveGithubRoomConfig() {
    if (obrRole !== 'GM') return;
    const config: GithubConfig = {
      token: githubTokenDraft.trim() || githubConfig?.token || '',
      owner: githubOwnerDraft.trim(), repo: githubRepoDraft.trim(), branch: githubBranchDraft.trim() || 'main'
    };
    if (!config.token || !config.owner || !config.repo) { cloudStatus = 'Completa el token, propietario y repositorio.'; return; }
    try {
      await OBR.room.setMetadata({ [GITHUB_ROOM_KEY]: config });
      githubConfig = config;
      githubStore = new GithubCharacterStorage(config);
      githubTokenDraft = '';
      await refreshGithubCharacters();
    } catch (error) { cloudStatus = 'No se pudo guardar la conexión: ' + (error instanceof Error ? error.message : String(error)); }
  }

  async function refreshGithubCharacters() {
    cloudRecords = [];
    cloudStatus = 'Las copias de personajes se guardan localmente en este dispositivo.';
    refreshRoomSheetList();
  }

  async function deleteGithubCharacter(record: GithubCharacterRecord) {
    if (!githubStore) return;
    try {
      await githubStore.remove(record);
      await refreshGithubCharacters();
      cloudStatus = 'Personaje eliminado: ' + record.name + '.';
    } catch (error) { cloudStatus = 'No se pudo eliminar el personaje: ' + (error instanceof Error ? error.message : String(error)); }
  }

  async function saveCharacterToGithub(snapshot: RawSheet, playerId: string, playerName: string) {
    if (!githubStore) throw new Error('GitHub no está configurado en esta sala. El director debe guardar la conexión.');
    try {
      await githubStore.save(snapshot, playerId, playerName);
      cloudStatus = 'Personaje guardado en GitHub: ' + (snapshot.name || playerName) + '.';
    } catch (error) {
      cloudStatus = 'No se pudo guardar en GitHub: ' + (error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async function saveOwnCharacterToGithub(snapshot: RawSheet) {
    try {
      const id = await OBR.player.getId();
      const name = await OBR.player.getName();
      await saveCharacterToGithub(snapshot, id, name);
    } catch (error) { cloudStatus = 'No se pudo guardar en GitHub: ' + (error instanceof Error ? error.message : String(error)); }
  }

  async function restoreOwnSheet() {
    if (obrRole !== 'PLAYER') return;
    try {
      const cloudSheet = await loadOwnCharacterFromSupabase();
      if (cloudSheet) {
        sheet = cloudSheet;
        localStorage.setItem('forja-raw-character', JSON.stringify(cloudSheet));
        syncStatus = 'Ficha recuperada desde Supabase.';
        return;
      }
    } catch (error) {
      syncStatus = 'No se pudo consultar Supabase; se intentará recuperar la copia local.';
      console.error(error);
    }
    if (!sheet) {
      try {
        const saved = localStorage.getItem('forja-raw-character');
        if (saved) {
          const parsed = JSON.parse(saved) as RawSheet;
          if (parsed && Array.isArray(parsed.sections)) sheet = repairGenericStatLabels(parsed) as RawSheet;
        }
      } catch { localStorage.removeItem('forja-raw-character'); }
    }
    if (sheet) await saveCharacterToSupabase(sheet).catch(error => console.error('No se pudo migrar la ficha local a Supabase', error));
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
    notice = 'Personaje exportado como ' + safeName + '.json';
  }

  async function deleteSheet() {
    if (!window.confirm('¿Eliminar este personaje? La ficha se borrará permanentemente de este dispositivo y no se podrá recuperar. Exporta una copia antes si deseas conservarla.')) return;
    if (supabaseRoomId && supabasePlayerId) {
      const response = await fetch(SUPABASE_URL + '/rest/v1/characters?room_id=eq.' + encodeURIComponent(supabaseRoomId) + '&player_id=eq.' + encodeURIComponent(supabasePlayerId), {
        method: 'PATCH',
        headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ deleted_at: new Date().toISOString() })
      });
      if (!response.ok) { notice = 'No se pudo eliminar la ficha de Supabase.'; return; }
    }
    sheet = null;
    localStorage.removeItem('forja-raw-character');
    importOpen = false;
    notice = 'Ficha eliminada de la sala y de este dispositivo.';
  }

  onMount(() => {
    void migrateBundledPortraitsToSupabase();
    try {
      const savedCombatants = localStorage.getItem(COMBATANTS_STORAGE_KEY);
      if (savedCombatants) {
        const parsedCombatants = JSON.parse(savedCombatants);
        if (Array.isArray(parsedCombatants)) combatants = parsedCombatants;
      }
    } catch { localStorage.removeItem(COMBATANTS_STORAGE_KEY); }
    combatantsStorageReady = true;
    try {
      const savedInitiative = localStorage.getItem(INITIATIVE_STORAGE_KEY);
      if (savedInitiative) {
        const parsedInitiative = JSON.parse(savedInitiative);
        if (parsedInitiative && Array.isArray(parsedInitiative.order)) {
          initiativeOrder = parsedInitiative.order;
          activeInitiativeIndex = Math.max(0, Math.min(Number(parsedInitiative.activeIndex) || 0, Math.max(0, initiativeOrder.length - 1)));
          initiativeRound = Math.max(1, Number(parsedInitiative.round) || 1);
        }
      }
    } catch (error) { console.error('No se pudo recuperar el tracker de iniciativa', error); }
    initiativeStorageReady = true;
    try { const savedVisualStyle=localStorage.getItem('forja-visual-style'); if(savedVisualStyle) visualStyle={...visualStyle,...JSON.parse(savedVisualStyle)}; applyVisualStyle(); } catch { applyVisualStyle(); }
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('preview') === '1') openDemoPreview();
      const stored = localStorage.getItem('forja-raw-character');
      if (!demoPreview && stored) sheet = JSON.parse(stored) as RawSheet;
      localStorage.removeItem('forja-custom-rolls');
    } catch {
      localStorage.removeItem('forja-raw-character');
    }
    if (OBR.isAvailable) OBR.onReady(async () => {
      obrReady = true;
      try {
        obrRole = await OBR.player.getRole();
        playerName = await OBR.player.getName();
        supabasePlayerId = await OBR.player.getId();
        supabasePlayerName = playerName;
        supabaseRoomId = OBR.room.id;
        builderData.player = playerName;
        if (obrRole === 'GM') { loadMasterCopies(); await loadGithubRoomConfig(); }
        syncStatus = 'Conectado a Owlbear Rodeo como ' + (obrRole === 'GM' ? 'Director de juego.' : 'Jugador.');
        if (!demoPreview) await restoreOwnSheet();
        if (obrRole === 'GM') await loadSupabaseRoomCharacters().catch(error => console.error(error));
        await refreshPlayers();
        OBR.party.onChange((players: any[]) => readPlayers(players));
        OBR.broadcast.onMessage(INITIATIVE_NOTICE_CHANNEL, (event: any) => {
          const message=String(event.data?.message||'').trim();
          if(message) void OBR.notification.show(message,'INFO').catch(()=>{});
        });
        OBR.broadcast.onMessage(INITIATIVE_STATE_CHANNEL, (event: any) => {
          const state=event.data;
          if(!state || !Array.isArray(state.order)) return;
          sharedInitiativeOrder=state.order.map((participant:any)=>({...participant}));
          sharedActiveInitiativeIndex=Math.max(0,Math.min(Number(state.activeIndex)||0,Math.max(0,sharedInitiativeOrder.length-1)));
          sharedInitiativeRound=Math.max(1,Number(state.round)||1);
        });
        OBR.broadcast.onMessage(INITIATIVE_STATE_REQUEST_CHANNEL, () => {
          if(obrRole!=='GM') return;
          void OBR.broadcast.sendMessage(INITIATIVE_STATE_CHANNEL, {
            order:initiativeOrder.map(participant=>({...participant})),
            activeIndex:activeInitiativeIndex,
            round:initiativeRound
          }, {destination:'REMOTE'}).catch(error=>console.error('No se pudo enviar el tracker actual',error));
        });
        if(obrRole!=='GM') {
          // Reintentar la solicitud para cubrir el caso en que el director aún esté conectando.
          const requestInitiativeState = () => OBR.broadcast.sendMessage(
            INITIATIVE_STATE_REQUEST_CHANNEL, {request:true, timestamp:Date.now()}, {destination:'REMOTE'}
          ).catch(error => console.error('No se pudo solicitar el tracker de iniciativa', error));
          void requestInitiativeState();
          window.setTimeout(() => { if (!sharedInitiativeOrder.length) void requestInitiativeState(); }, 1000);
          window.setTimeout(() => { if (!sharedInitiativeOrder.length) void requestInitiativeState(); }, 3000);
        }
        OBR.broadcast.onMessage(`${DICE_PLUS_SOURCE}/roll-error`, (event: any) => {
          const failure = event.data;
          if (!failure?.rollId || failure.rollId === lastRollId) {
            notice = 'Dice+ rechazó la notación «' + String(failure?.notation || 'desconocida') + '»: ' + String(failure?.error || 'error de notación');
          }
        });
        OBR.broadcast.onMessage(CHANNEL, (event: any) => {
          const d = event.data;
          if (d?.type === 'character-updated' && d.character) {
            receiveLiveCharacter({ playerId: d.playerId, playerName: d.playerName || 'Jugador', sheet: repairGenericStatLabels(d.character as RawSheet) as RawSheet, live: true });
          }
          if (d?.type === 'character-deleted') {
            liveRoomSheets = liveRoomSheets.filter(x => x.playerId !== d.playerId);
            refreshRoomSheetList();
          }
          // Las fichas son locales: los cambios de nivel del director no sobrescriben la copia del jugador.
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
    <a class="brand" href="#inicio"><img class="brand-icon" src="/-creacion-personaje-dnd-2024./icono.webp" alt="" /><span><strong>FORJA DE AVENTUREROS</strong><small>D&D · 2024</small></span></a>
    {#if obrRole === 'GM'}<nav><span>Director de juego</span></nav>{:else}<nav><span>{playerName || 'Jugador'}</span></nav>{/if}
  </header>

  <main class="main" class:gm-layout={obrRole === 'GM'}>
    {#if obrRole === 'GM'}
      <nav class="master-tabs" role="tablist" aria-label="Herramientas del director">
        {#each masterTabs as tab}
          <button class:active={masterTab === tab} role="tab" aria-selected={masterTab === tab} on:click={() => openMasterTab(tab)}>{tab}</button>
        {/each}
      </nav>
      {#if masterTab === 'Personajes'}
        <section class="panel roster-panel">
          <div class="section-heading"><h2>Personajes de la sala</h2><span class="count">{roomSheets.length}</span></div>
          <div class="actions"><button class="secondary" on:click={refreshPlayers}>Actualizar</button></div>
          {#if !roomSheets.length}<p class="muted">No hay personajes publicados ni copias guardadas.</p>
          {:else}
            {#each roomSheets as entry}
              <article class="character-card">
                <div class="card-symbol">✧</div>
                <div class="card-identity"><h3>{entry.sheet?.name || 'Personaje sin nombre'}</h3><p>{entry.playerName} · {entry.live ? 'Conectado' : 'Copia local'}</p></div>
                <div class="actions">
                  {#if entry.saved}<span class="muted">✓ Copia guardada</span>{:else}<button class="primary" on:click={() => saveMasterCopy(entry)}>Guardar ficha</button>{/if}
                  {#if entry.saved}<button class="secondary" on:click={() => exportMasterCopy(entry)}>Exportar copia</button><button class="secondary" on:click={() => deleteMasterCopy(entry)}>Eliminar copia</button>{/if}
                </div>
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
        </section>
      {:else if masterTab === 'Combate'}
        <section class="panel combat-panel">
          <div class="section-heading"><h2>Combate</h2><span class="count">{combatants.filter(c=>c.participating!==false).length} participantes · {combatants.length} preparados</span></div>
          <div class="combat-toolbar">
            <label>Modo de tirada
              <select bind:value={combatRollMode}><option value="normal">Normal</option><option value="advantage">Ventaja</option><option value="disadvantage">Desventaja</option></select>
            </label>
            <button class="secondary" type="button" on:click={()=>combatants=combatants.map(c=>({...c,participating:false}))}>Retirar todos del combate</button>
            <button class="secondary" type="button" on:click={()=>showAllCombatants=!showAllCombatants}>{showAllCombatants?'◉ Mostrar solo participantes':'◉ Ver todos los monstruos'}</button>
          </div>
          {#if combatants.length}
            <div class="combat-grid">
              {#each combatants.filter(c=>showAllCombatants||c.participating!==false) as c (c.id)}
                <article class:combat-dead={c.hp===0} class:combatant-active={initiativeOrder[activeInitiativeIndex]?.id==='monster:'+c.id} class="combatant-card">
                  <header class="combatant-header">
                    <input aria-label="Nombre de criatura" class="combatant-name" value={c.name} on:change={(e)=>setCombatantField(c.id,'name',e)}/>
                    <div class="combatant-tools">
                      <button title="Duplicar" on:click={()=>duplicateCombatant(c.id)}>⧉</button>
                      <button title="Eliminar" aria-label="Eliminar monstruo" class="combatant-delete" on:click={()=>removeCombatant(c.id)}>×</button>
                    </div>
                  </header>
                  <label class="combatant-participating"><input type="checkbox" checked={c.participating!==false} on:change={(e)=>toggleCombatantParticipation(c.id,e)}/> Participando</label>
                  <div class="combatant-vitals">
                    <label class="combat-ac">🛡 CA <input type="number" value={c.ac+c.acMod} on:change={(e)=>setCombatantField(c.id,'ac',e)}/></label>
                    <div class="combat-hp"><span>❤ PG</span><button on:click={()=>adjustCombatHp(c.id,-1)}>−</button><input aria-label="Puntos de golpe actuales" type="number" min="0" max={c.maxHp} value={c.hp} on:change={(e)=>setCombatantField(c.id,'hp',e)}/><button on:click={()=>adjustCombatHp(c.id,1)}>+</button><span>/ {c.maxHp}</span></div>
                  </div>
                  <div class="combat-hp-track"><span style="width:{Math.max(0,Math.min(100,c.hp/c.maxHp*100))}%" class:hp-yellow={c.hp/c.maxHp<=.5&&c.hp/c.maxHp>.25} class:hp-red={c.hp/c.maxHp<=.25}></span></div>
                  <div class="combat-temp"><span>✦ PG temporales</span><button on:click={()=>updateCombatant(c.id,{tempHp:Math.max(0,c.tempHp-1)})}>−</button><strong>{c.tempHp}</strong><button on:click={()=>setCombatTempHp(c.id,c.tempHp+1)}>+</button></div>
                  <div class="combat-damage-tools"><input type="number" min="0" value={c.damageInput} aria-label="Daño o curación" on:input={(e)=>setCombatantField(c.id,'damageInput',e)}/><button class="damage-button" on:click={()=>applyCombatDamage(c.id,'damage')}>Daño</button><button class="heal-button" on:click={()=>applyCombatDamage(c.id,'heal')}>Curar</button></div>
                  <div class="combat-initiative"><label>Iniciativa <input type="number" step="1" value={c.initiative} on:change={(e)=>setCombatantField(c.id,'initiative',e)}/></label><button on:click={()=>combatInitiative(c.id)}>🎲 Tirar iniciativa</button></div>
                  <button class="combat-expand" on:click={()=>updateCombatant(c.id,{compact:!c.compact})}>{c.compact?'Mostrar acciones y tiradas':'Ocultar acciones y tiradas'}</button>
                  {#if !c.compact}
                    <div class="combat-actions">
                      {#each getMonsterCombatActions(c.monster) as action}
                        <div class="combat-action-row"><strong>{action.name}</strong>
                          <div>{#if action.attackNotation}<button on:click={()=>sendCombatRoll(action.attackNotation,c.name+' · '+action.name)}>{'⚔ '+action.attackNotation}</button>{/if}
                          {#if action.damageNotation}<button on:click={()=>sendSheetRoll(action.damageNotation,c.name+' · '+action.name+' · Daño')}>{'🎲 '+action.damageNotation}</button>{/if}
                          {#if action.dc}<span class="combat-dc">CD {action.dc}</span>{/if}</div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                  {#if c.hp===0}<div class="combat-fallen">💀 Caído</div>{/if}
                </article>
              {/each}
            </div>
          {:else}<p class="muted">Añade criaturas desde la pestaña Monstruos para preparar el combate.</p>{/if}
        </section>
        {#if notice}<p class="muted" role="status">{notice}</p>{/if}
      {:else if masterTab === 'Iniciativa'}
        <section class="panel initiative-panel">
          <div class="section-heading"><h2>Tracker de iniciativa</h2><span class="count">Ronda {initiativeRound}</span></div>
          <div class="initiative-toolbar"><button class="primary initiative-roll-button" type="button" on:click={rollInitiative}>🎲 Tirar iniciativa · d20</button><button class="secondary" type="button" on:click={startInitiativeAtZero}>Iniciar en 0</button>{#if initiativeOrder.length}<div class="initiative-turn-controls"><button class="secondary" type="button" on:click={()=>moveInitiativeTurn(-1)} aria-label="Turno anterior">←</button><strong>Turno: {initiativeOrder[activeInitiativeIndex]?.name || '—'}</strong><button class="primary" type="button" on:click={()=>moveInitiativeTurn(1)} aria-label="Siguiente turno">→</button></div>{/if}<span class="muted">Las tiradas se resuelven internamente.</span></div>
          {#if initiativeOrder.length}
            <ol class="initiative-list">
              {#each initiativeOrder as participant,i}
                <li class:initiative-active={i===activeInitiativeIndex}>
                  <span class="initiative-position">{i+1}</span>
                  <span class="initiative-name">{participant.name}</span>
                  <span class="initiative-roll">{participant.roll}{participant.bonus>=0?' + ':' − '}{Math.abs(participant.bonus)} = <strong>{participant.total}</strong>{#if participant.tieRoll!==undefined}<small> · desempate {participant.tieRoll}</small>{/if}</span>
                </li>
              {/each}
            </ol>
          {:else}
            <p class="muted">Todavía no se ha lanzado la iniciativa.</p>
            <ol class="initiative-roster">
              {#each getInitiativeParticipants() as participant}
                <li><span>{participant.name}</span><strong>Modificador {participant.bonus>=0?'+':''}{participant.bonus}</strong></li>
              {/each}
            </ol>
            {#if !getInitiativeParticipants().length}<p class="muted">No hay personajes conectados ni monstruos marcados como participantes.</p>{/if}
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
          {#if lastChestRoll}
            <p class="chest-opened-note">Contenido encontrado en este cofre:</p>
          {:else}
            <p class="muted chest-empty">El contenido se mostrará aquí al abrir el cofre.</p>
          {/if}
        </section>
      {:else if masterTab === 'Objetos'}
        <section class="panel items-panel">
          <div class="section-heading"><h2>Catálogo de objetos · D&D 2024</h2><span class="count">{filteredItems.length} / {ITEMS.length}</span></div>
          <p class="muted">Equipo, armas, herramientas, monturas y vehículos del Manual del jugador; objetos mágicos, armas de fuego, explosivos y equipo de asedio de la Guía del Dungeon Master. Los precios y pesos que los manuales no especifican se muestran como «—» y no se inventan.</p>
          <label class="items-search">Buscar por nombre
            <input type="search" bind:value={itemSearch} placeholder="Nombre del objeto..." />
          </label>
          <div class="items-filters">
            <label>Letra inicial
              <select bind:value={itemLetterFilter}><option value="">Ninguna</option>{#each ALPHABET as letter}<option value={letter}>{letter}</option>{/each}</select>
            </label>
            <label>Tipo
              <select bind:value={itemTypeFilter}>
                <option value="">Ninguno</option>
                {#each itemTypes.filter(type => type !== 'Todos') as type}<option value={type}>{type === 'Todos' ? 'Todos los tipos' : type}</option>{/each}
              </select>
            </label>
            <fieldset><legend>Precio (po)</legend><label>Mínimo<input type="text" inputmode="decimal" bind:value={itemPriceMin} placeholder="Sin mínimo" /></label><label>Máximo<input type="text" inputmode="decimal" bind:value={itemPriceMax} placeholder="Sin máximo" /></label></fieldset>
            <fieldset><legend>Peso (kg)</legend><label>Mínimo<input type="text" inputmode="decimal" bind:value={itemWeightMin} placeholder="Sin mínimo" /></label><label>Máximo<input type="text" inputmode="decimal" bind:value={itemWeightMax} placeholder="Sin máximo" /></label></fieldset>
          </div>
          <div class="item-card-list">{#if filteredItems.length === 0}<p class="muted">Selecciona un tipo, introduce un rango de precio o peso, o escribe una búsqueda para mostrar objetos.</p>{:else}
            {#each filteredItems as item (item.name + item.source)}
              <article class="catalog-item-card">
                <header><h3>{item.name}</h3><span class="catalog-item-type">{item.type}</span></header>
                <p class="catalog-item-description">{itemDescription(item)}</p>
                <footer><span>Precio: {item.price}</span><span>Peso: {item.weight}</span><small>{item.source}</small></footer>
              </article>
            {/each}
          {/if}</div>
        </section>
      {:else if masterTab === 'Conjuros'}
        <section class="panel spells-panel">
          <div class="section-heading"><h2>Conjuros · Manual del Jugador 2024</h2><span class="count">{filteredSpells.length} / {SPELLS.length}</span></div>
          <p class="muted">Catálogo de conjuros del manual. Cada ficha incluye nivel, escuela, clases, tiempo de lanzamiento, alcance, componentes, duración y descripción.</p>
          <label class="spell-search">Buscar conjuro
            <input type="search" bind:value={spellSearch} placeholder="Nombre o texto del conjuro..." />
          </label>
          <div class="spell-filters">
            <label>Letra inicial
              <select bind:value={spellLetterFilter}><option value="">Ninguna</option>{#each ALPHABET as letter}<option value={letter}>{letter}</option>{/each}</select>
            </label>
            <label>Nivel
              <select bind:value={spellLevelFilter}>
                <option value="">Ninguno</option>
                <option value="0">Trucos · Nivel 0</option>
                {#each [1,2,3,4,5,6,7,8,9] as level}
                  <option value={String(level)}>Nivel {level}</option>
                {/each}
              </select>
            </label>
            <label>Clase
              <select bind:value={spellClassFilter}>
                <option value="">Ninguna</option>
                {#each SPELL_CLASSES as className}
                  <option value={className}>{className}</option>
                {/each}
              </select>
            </label>
            <label>Escuela
              <select bind:value={spellSchoolFilter}>
                <option value="">Ninguna</option>
                {#each SPELL_SCHOOLS as school}
                  <option value={school}>{school}</option>
                {/each}
              </select>
            </label>
          </div>
          <div class="spell-list">
            {#if filteredSpells.length === 0}<p class="muted">Selecciona un nivel, clase o escuela, o escribe una búsqueda para mostrar conjuros.</p>{:else}
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
            {/if}
          </div>
        </section>
      {:else if masterTab === 'Reglas'}
        <section class="panel rules-panel">
          <div class="section-heading"><h2>Reglas · Manual del Jugador 2024</h2><span class="count">{filteredRules.length} / {RULES.length}</span></div>
          <p class="muted">Glosario del Apéndice C. Fuente: Manual del Jugador 2024 · Las páginas indicadas corresponden a la numeración del PDF.</p>
          <div class="rules-toolbar">
            <label class="rules-search">Buscar regla
              <div class="rules-search-input"><input type="search" bind:value={rulesSearch} placeholder="Escribe al menos dos letras..." /><button type="button" on:click={() => rulesSearch = ''} disabled={!rulesSearch}>Limpiar</button></div>
            </label>
            <label class="rules-category-filter">Tipo de regla
              <select bind:value={rulesCategoryFilter}><option value="">Todos los tipos</option>{#each RULE_CATEGORIES as category}<option value={category}>{category}</option>{/each}</select>
            </label>
            <div class="rules-toolbar-actions"><span>{filteredRules.length} resultados</span><button type="button" on:click={() => openRuleName = openRuleName === '*' ? '' : '*'}>{openRuleName === '*' ? 'Cerrar todas' : 'Abrir todas'}</button></div>
          </div>
          <div class="rules-navigation"><span>Ir a:</span>{#each ruleLetters as letter}<a href={'#rules-letter-' + letter}>{letter}</a>{/each}</div>
          <div class="rules-list">
            {#if filteredRules.length === 0}<p class="muted">No hay reglas que coincidan con los filtros.</p>{:else}
            {#each groupedRules as group (group.letter)}
              <h3 class="rules-letter" id={'rules-letter-' + group.letter}>{group.letter}</h3>
              {#each group.rules as rule (rule.name)}
                {#if rule.category === 'Abreviatura'}
                  <div class="rule-abbreviation"><strong>{ruleNameCase(rule.name)}</strong><span class="rule-category category-abreviatura">{rule.category}</span><span class="rule-abbreviation-meaning">→ {ruleTextParagraphs(rule.description).join(' ')}</span><span class="rule-page">p. {rule.pdfPage ?? '—'}</span></div>
                {:else}
                  <details class="rule-card" id={'rule-' + encodeURIComponent(rule.name)} open={openRuleName === '*' || openRuleName === rule.name} on:toggle={(event) => handleRuleToggle(event, rule.name)}>
                    <summary><span class="rule-name">{@html highlightedRuleName(rule.name)}</span><span class={'rule-category category-' + normalizeRuleText(rule.category).replace(/\s+/g,'-')}>{rule.category}</span><span class="rule-page">p. {rule.pdfPage}</span></summary>
                    <div class="rule-details"><div class="rule-description">{#each ruleTextParagraphs(rule.description) as paragraph}<p>{paragraph}</p>{/each}</div>
                      {#if ruleRelatedNames(rule).length}<div class="rule-related"><strong>Ver también:</strong>{#each ruleRelatedNames(rule) as related,index}<button type="button" on:click={() => jumpToRule(related)}>{related}</button>{index < ruleRelatedNames(rule).length - 1 ? ' · ' : ''}{/each}</div>{/if}
                      
                    </div>
                  </details>
                {/if}
              {/each}
            {/each}
            {/if}
          </div>
        </section>
      {:else}
        <section class="panel monsters-panel">
          <div class="section-heading"><h2>Manual de Monstruos · 2024</h2><span class="count">{filteredMonsters.length} / {MONSTERS.length} criaturas</span></div>
          <p class="muted">Consulta las criaturas por nombre o valor de desafío. Los perfiles conservan sus datos y se presentan por apartados.</p>
          <label class="monster-filter">Buscar monstruo
            <input type="search" bind:value={monsterSearch} placeholder="Nombre del monstruo..." />
          </label>
          <label class="monster-filter">Letra inicial
            <select bind:value={monsterLetterFilter}><option value="">Ninguna</option>{#each ALPHABET as letter}<option value={letter}>{letter}</option>{/each}</select>
          </label>
          <label class="monster-filter">Filtrar por VD
            <select bind:value={monsterCrFilter}>
              <option value="">Ninguno</option>
              {#each MONSTER_CR_FILTERS.filter(cr => cr !== 'Todos') as cr}
                <option value={cr}>{cr === 'Todos' ? 'Todos los VD' : 'VD ' + cr}</option>
              {/each}
            </select>
          </label>
          <div class="monster-list">
            {#if filteredMonsters.length === 0}<p class="muted">Selecciona un valor de desafío o escribe el nombre de un monstruo para mostrar criaturas.</p>{:else}
            {#each filteredMonsters as monster}
              <details class="monster-card">
                <summary>
                  <span class="monster-name">{monster.name}</span>
                  <span class="monster-subtitle">{monster.group || 'Manual de Monstruos'} · página {monster.pdfPage ?? '—'}</span>
                  <span class="monster-cr">VD {monster.cr.split(' ')[0] || '—'}</span>
                </summary>
                <div class="monster-statblock">
                  <button class="primary add-to-combat" type="button" on:click={()=>addCombatant(monster)}>＋ Añadir al combate</button>
                  {#each [parseMonsterProfile(monster)] as profile}
                    <div class="monster-block-heading">
                      <h3>{monster.name}</h3>
                      <p>{profile.info.find(x => x.label === 'Type and Alignment')?.value || monster.group || 'Creature'} · CR {monster.cr}</p>
                    </div>
                    {#if monster.description}<p class="monster-description">{monster.description}</p>{/if}
                    <div class="monster-quick-stats">
                      {#each profile.info.filter(x => ['Armor Class','Hit Points','Speed','Initiative'].includes(x.label)) as item}
                        <div><small>{monsterQuickLabel(item.label)}</small><strong>{item.value}</strong></div>
                      {/each}
                    </div>
                    <div class="monster-ability-table">
                      <div class="monster-ability-row monster-ability-head"><span>Ability</span><span>Score</span><span>Mod.</span><span>Save</span></div>
                      {#each profile.info.filter(x => ['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'].includes(x.label)) as ability}
                        <div class="monster-ability-row"><strong>{monsterAbilityLabel(ability.label)}</strong><span>{ability.value.match(/^\d+/)?.[0] || '—'}</span><span>{ability.value.match(/\([+-]?\d+\)/)?.[0] || '—'}</span><span>{ability.value.match(/Save\s*([+-]?\d+)/i)?.[1] || '—'}</span></div>
                      {/each}
                    </div>
                    <div class="monster-details-list">
                      {#each profile.info.filter(x => !['Type and Alignment','Armor Class','Hit Points','Speed','Initiative','Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'].includes(x.label)) as item}
                        <p><strong>{item.label}:</strong> {item.value}</p>
                      {/each}
                    </div>
                    {#each profile.sections as section}
                      <section class="monster-content-section">
                        <h4>{section.title.toUpperCase()}</h4>
                        {#each section.entries as entry}
                          <article class="monster-entry">
                            {#if entry.name}<strong>{entry.name}</strong>{/if}
                            <p>{entry.description}</p>
                          </article>
                        {/each}
                      </section>
                    {/each}
                  {/each}
                  <small class="monster-source">Monster Manual 2024 · PDF p. {monster.pdfPage ?? '—'} · Página impresa {monster.printedPage ?? '—'}</small>
                </div>
              </details>
            {/each}
            {/if}
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
          <div class="section-heading"><h2>Creación de personaje · Nivel 1</h2><span class="count">{builderPreview ? 'Completado' : 'Etapa '+(builderStep+1)+' de 12'}</span></div>
          {#if !builderPreview || builderStep < 12}
            <div class="builder-progress"><span style="width:{((builderStep+1)/12)*100}%"></span></div>
            <nav class="builder-step-track" aria-label="Progreso de creación">
              {#each ['Concepto','Clase','Trasfondo','Especie','Características','Aumentos','Competencias','Gear','Magia','Languages','Detalles','Revisión'] as stage, index}
                <span class:current={index === builderStep} class:complete={index < builderStep} aria-current={index === builderStep ? 'step' : undefined}>
                  <b>{index + 1}</b><small>{stage}</small>
                </span>
              {/each}
            </nav>
            {#if builderStep===0}
              <h3>01. Concepto del personaje</h3>
              <p class="muted">Primero identifica a tu aventurero. Estos datos no modifican sus capacidades.</p>
              <div class="builder-info"><strong>Jugador</strong><p>{playerName || 'Nombre disponible al abrir la Forja desde Owlbear Rodeo'}</p></div>
              <section class="builder-portrait-picker" aria-label="Retrato del personaje">
                <div class="builder-portrait-heading"><strong>Retrato del personaje</strong><div class="builder-portrait-actions"><button type="button" on:click={() => {portraitPickerOpen=true;portraitPickerError='';}}>Elegir retrato</button><button type="button" class:active={!builderData.portrait} on:click={() => builderData = {...builderData,portrait:''}}>Sin retrato</button></div></div>
                {#if builderData.portrait}<div class="builder-portrait-current"><img src={builderData.portrait} alt="Retrato seleccionado" /><span>Retrato seleccionado</span></div>{:else}<p class="muted">No has seleccionado un retrato.</p>{/if}
              </section>
              {#if portraitPickerOpen}
                <div class="portrait-modal-backdrop" role="presentation" on:click={(event)=>{if(event.target===event.currentTarget)portraitPickerOpen=false;}}>
                  <section class="portrait-modal" role="dialog" aria-modal="true" aria-label="Elegir retrato">
                    <header><div><h3>Elegir retrato</h3><p class="muted">Selecciona uno de los retratos de Neverwinter Nights o sube una imagen propia.</p></div><button type="button" class="secondary" on:click={()=>portraitPickerOpen=false}>Cerrar</button></header>
                    <div class="portrait-upload-row"><button type="button" on:click={()=>portraitFileInput?.click()}>Subir imagen</button><span>Preferentemente 256 × 512 px. Se ajustará al formato vertical.</span><input bind:this={portraitFileInput} type="file" accept="image/*" hidden on:change={chooseUploadedPortrait} /></div>
                    {#if portraitPickerError}<p class="portrait-picker-error">{portraitPickerError}</p>{/if}
                    {#if portraitLoading}<p class="muted">Cargando retrato…</p>{:else}<div class="portrait-modal-grid">{#each BUILDER_PORTRAITS as portrait}<button type="button" class="portrait-modal-option" on:click={()=>chooseBundledPortrait(portrait)} aria-label="Seleccionar {portrait.split('/').pop()}"><img src={portrait} alt="Retrato disponible" loading="lazy" /><span>{portrait.split('/').pop()?.replace(/\.[^.]+$/,'')}</span></button>{/each}</div>{/if}
                  </section>
                </div>
              {/if}
              <p class="hint">No necesitas completar todos los detalles narrativos ahora.</p>
            {:else if builderStep===1}
              <h3>02. Elige tu clase</h3>
              <p class="muted">La clase determina las capacidades, el estilo de combate y la progresión de tu aventurero.</p>
              

              
              <h4>Elige una clase</h4>
              <p class="muted">Selecciona la clase que define el entrenamiento y las capacidades principales del personaje. Cada tarjeta resume su estilo, característica principal, resistencia y acceso a la magia.</p>
              <div class="builder-class-grid">
                {#each BUILDER_CLASSES as item}
                  <label class="builder-class-card" class:selected={builderClassChosen && builderData.className === item}>
                    <input type="radio" name="builder-class" value={item} checked={builderClassChosen && builderData.className === item} on:change={() => builderSelectClass(item)} />
                    <span class="builder-class-card-heading"><strong>{item}</strong><span>d{BUILDER_HIT_DIE[item]}</span></span>
                    <span class="builder-class-description">{BUILDER_CLASS_GUIDANCE[item]}</span>
                    <span class="builder-class-meta"><span>Característica clave</span><strong>{BUILDER_PRIMARY[item]}</strong></span>
                    <span class="builder-class-meta"><span>Salvaciones</span><strong>{BUILDER_SAVES[item]}</strong></span>
                    <span class="builder-class-meta"><span>Magia</span><strong>{BUILDER_CLASS_DATA[item].cantrips || BUILDER_CLASS_DATA[item].spells || BUILDER_CLASS_DATA[item].spellbook ? 'Sí' : 'No'}</strong></span>
                  </label>
                {/each}
              </div>
              {#if builderClassChosen}<div class="builder-info"><strong>Rasgos de nivel 1 identificados</strong><p>{BUILDER_CLASS_FEATURES[builderData.className]}</p><small>La subclase no se elige a nivel 1. Salvaciones: {BUILDER_SAVES[builderData.className]}. Dado de golpe: d{BUILDER_HIT_DIE[builderData.className]}.</small></div>{/if}
                          
            {:else if builderStep===2}
              <h3>03. Elige tu trasfondo</h3>
              <p class="muted">Tu vida antes de convertirte en aventurero determina competencias, dote de origen y equipo.</p>
              

              
              <h4>Elige un trasfondo</h4>
              <div class="builder-class-grid builder-background-grid">
                {#each BUILDER_BACKGROUNDS as item}
                  <label class="builder-class-card builder-option-card" class:selected={builderBackgroundChosen && builderData.background === item}>
                    <input type="radio" name="builder-background" value={item} checked={builderBackgroundChosen && builderData.background === item} on:change={() => builderChooseBackground(item)} />
                    <span class="builder-class-card-heading"><strong>{item}</strong><span>Trasfondo</span></span>
                    <span class="builder-class-description">Tu experiencia como {item.toLocaleLowerCase()} determina competencias, dote de origen y equipo.</span>
                    <span class="builder-class-meta"><span>Características</span><strong>{BUILDER_BACKGROUND_DATA[item].abilities.join(' · ')}</strong></span>
                    <span class="builder-class-meta"><span>Habilidades</span><strong>{BUILDER_BACKGROUND_DATA[item].skills.join(' · ')}</strong></span>
                    <span class="builder-class-meta"><span>Dote</span><strong>{BUILDER_BACKGROUND_DATA[item].feat}</strong></span>
                  </label>
                {/each}
              </div>
              {#if builderBackgroundChosen}
              {#if ['Habilidoso','Fabricante','Músico'].includes(BUILDER_BACKGROUND_DATA[builderData.background].feat)}
                <div class="builder-choice-wrapper"><strong>Elecciones de la dote {BUILDER_BACKGROUND_DATA[builderData.background].feat}</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Opciones de la dote del trasfondo</strong><span>{builderData.backgroundFeatChoices.length}/{3}</span></div><div class="builder-checkbox-grid">{#each builderFeatChoiceOptions(BUILDER_BACKGROUND_DATA[builderData.background].feat).filter(choice => !BUILDER_BACKGROUND_DATA[builderData.background].skills.includes(choice) && choice !== builderData.speciesSkill && choice !== builderData.backgroundToolChoice) as choice}<label class="builder-checkbox"><input type="checkbox" checked={builderData.backgroundFeatChoices.includes(choice)} on:change={(event) => builderToggleChoice('backgroundFeatChoices',choice,3,event)} disabled={!builderData.backgroundFeatChoices.includes(choice) && builderData.backgroundFeatChoices.length >= (3)} /><span>{choice}</span>{#if builderSkillDescription(choice)}<small class="builder-skill-description">{builderSkillDescription(choice)}</small>{/if}</label>{/each}</div></div></div>
              {:else if builderMagicInitiateClass(BUILDER_BACKGROUND_DATA[builderData.background].feat)}
                <p class="muted">Lista de Iniciado en la magia: {builderMagicInitiateClass(BUILDER_BACKGROUND_DATA[builderData.background].feat)}</p>
                <label>Aptitud mágica de la dote<select bind:value={builderData.backgroundMagicAbility}><option>Inteligencia</option><option>Sabiduría</option><option>Carisma</option></select></label>
                <div class="builder-choice-wrapper"><strong>Dos trucos de la dote</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Trucos de Iniciado en la magia</strong><span>{builderData.backgroundMagicCantrips.length}/{2}</span></div><div class="builder-checkbox-grid">{#each BUILDER_SPELL_LISTS[builderMagicInitiateClass(BUILDER_BACKGROUND_DATA[builderData.background].feat)].cantrips as spell}<label class="builder-checkbox"><input type="checkbox" checked={builderData.backgroundMagicCantrips.includes(spell)} on:change={(event) => builderToggleChoice('backgroundMagicCantrips',spell,2,event)} disabled={!builderData.backgroundMagicCantrips.includes(spell) && builderData.backgroundMagicCantrips.length >= (2)} /><span>{spell}</span><small class="builder-option-description">{builderSpellInfo(spell)?.level === 0 ? 'Truco' : 'Nivel ' + (builderSpellInfo(spell)?.level ?? '—')} · {builderSpellInfo(spell)?.school || 'Conjuro'}</small><small class="builder-option-description">{builderSpellInfo(spell)?.description || 'Descripción no disponible.'}</small></label>{/each}</div></div></div>
                <label>Un conjuro de nivel 1 de la dote<select bind:value={builderData.backgroundMagicSpell}><option value="">Elige un conjuro</option>{#each BUILDER_SPELL_LISTS[builderMagicInitiateClass(BUILDER_BACKGROUND_DATA[builderData.background].feat)].level1 as spell}<option>{spell}</option>{/each}</select></label>
              {/if}
              <div class="builder-info"><strong>Beneficios automáticos del trasfondo</strong><p>Características: {BUILDER_BACKGROUND_DATA[builderData.background].abilities.join(', ')}</p><p>Dote: {BUILDER_BACKGROUND_DATA[builderData.background].feat}</p><p>Habilidades: {BUILDER_BACKGROUND_DATA[builderData.background].skills.join(' y ')}</p><p>Herramienta: {BUILDER_BACKGROUND_DATA[builderData.background].tool}</p><p>Equipo A: {BUILDER_BACKGROUND_DATA[builderData.background].equipmentA}</p></div>
              {#if BUILDER_BACKGROUND_TOOL_OPTIONS[builderData.background]}
                <label>Competencia con herramienta del trasfondo<select bind:value={builderData.backgroundToolChoice}><option value="">Elige una opción</option>{#each BUILDER_BACKGROUND_TOOL_OPTIONS[builderData.background] as tool}<option>{tool}</option>{/each}</select></label>
              {/if}
              
            
              {/if}
              {:else if builderStep===3}
              <h3>04. Elige tu especie</h3>
              <p class="muted">La especie determina rasgos biológicos y capacidades innatas.</p>
              

              
              
              <h4>Elige una especie</h4>
              <div class="builder-class-grid builder-species-grid">
                {#each BUILDER_SPECIES as item}
                  <label class="builder-class-card builder-option-card" class:selected={builderSpeciesChosen && builderData.species === item}>
                    <input type="radio" name="builder-species" value={item} checked={builderSpeciesChosen && builderData.species === item} on:change={() => builderChooseSpecies(item)} />
                    <span class="builder-class-card-heading"><strong>{item}</strong><span>Especie</span></span>
                    <span class="builder-class-description">{BUILDER_SPECIES_TRAITS[item]}</span>
                    <span class="builder-class-meta"><span>Rasgos y capacidades</span><strong>{BUILDER_SPECIES_CHOICES[item].length ? 'Incluye elección de linaje' : 'Rasgos propios de especie'}</strong></span>
                  </label>
                {/each}
              </div>
              {#if builderSpeciesChosen}
              <div class="builder-name-block">
                <label>Nombre del personaje<input bind:value={builderData.name} placeholder="Escribe el nombre de tu aventurero" /></label>
                <div class="name-generator-controls">
                  <label>Estilo de nombre<select bind:value={nameGender}><option value="Hombre">Masculino</option><option value="Mujer">Femenino</option><option value="Otro">Neutro</option></select></label>
                  <button class="secondary name-generator-button" type="button" on:click={generateCharacterName}>Generar sugerencia</button>
                </div>
                <p class="hint">El nombre se define aquí y se conserva durante toda la creación.</p>
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
                  <div class="builder-choice-wrapper"><strong>Elecciones de la dote adicional</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Opciones de la dote adicional humana</strong><span>{builderData.speciesFeatChoices.length}/{3}</span></div><div class="builder-checkbox-grid">{#each builderFeatChoiceOptions(builderData.speciesExtraFeat).filter(choice => !BUILDER_BACKGROUND_DATA[builderData.background].skills.includes(choice) && choice !== builderData.speciesSkill && choice !== builderData.backgroundToolChoice && !builderData.backgroundFeatChoices.includes(choice)) as choice}<label class="builder-checkbox"><input type="checkbox" checked={builderData.speciesFeatChoices.includes(choice)} on:change={(event) => builderToggleChoice('speciesFeatChoices',choice,3,event)} disabled={!builderData.speciesFeatChoices.includes(choice) && builderData.speciesFeatChoices.length >= (3)} /><span>{choice}</span>{#if builderSkillDescription(choice)}<small class="builder-skill-description">{builderSkillDescription(choice)}</small>{/if}</label>{/each}</div></div></div>
                {:else if builderMagicInitiateClass(builderData.speciesExtraFeat)}
                  <label>Aptitud mágica de la dote adicional<select bind:value={builderData.speciesFeatMagicAbility}><option>Inteligencia</option><option>Sabiduría</option><option>Carisma</option></select></label>
                  <div class="builder-choice-wrapper"><strong>Dos trucos de la dote adicional</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Trucos de la dote adicional humana</strong><span>{builderData.speciesMagicCantrips.length}/{2}</span></div><div class="builder-checkbox-grid">{#each BUILDER_SPELL_LISTS[builderMagicInitiateClass(builderData.speciesExtraFeat)].cantrips as spell}<label class="builder-checkbox"><input type="checkbox" checked={builderData.speciesMagicCantrips.includes(spell)} on:change={(event) => builderToggleChoice('speciesMagicCantrips',spell,2,event)} disabled={!builderData.speciesMagicCantrips.includes(spell) && builderData.speciesMagicCantrips.length >= (2)} /><span>{spell}</span><small class="builder-option-description">{builderSpellInfo(spell)?.level === 0 ? 'Truco' : 'Nivel ' + (builderSpellInfo(spell)?.level ?? '—')} · {builderSpellInfo(spell)?.school || 'Conjuro'}</small><small class="builder-option-description">{builderSpellInfo(spell)?.description || 'Descripción no disponible.'}</small></label>{/each}</div></div></div>
                  <label>Un conjuro de nivel 1 de la dote adicional<select bind:value={builderData.speciesMagicSpell}><option value="">Elige un conjuro</option>{#each BUILDER_SPELL_LISTS[builderMagicInitiateClass(builderData.speciesExtraFeat)].level1 as spell}<option>{spell}</option>{/each}</select></label>
                {/if}
              {/if}
              <div class="builder-info"><strong>Rasgos automáticos de especie</strong><p>{BUILDER_SPECIES_TRAITS[builderData.species]}</p>{#if builderData.speciesChoice}<p>Elección: {builderData.speciesChoice}</p>{/if}</div>
                        
            
              {/if}
              {:else if builderStep===4}
              <h3>05. Distribuye tus características</h3>
              <p class="muted">Elige cómo generar las seis puntuaciones. Los aumentos del trasfondo se aplican en la etapa siguiente.</p>
              

              
              <label>Método para determinar las puntuaciones<select bind:value={builderData.method} on:change={builderSetAbilityMethod}><option value="standard">Arreglo estándar (15, 14, 13, 12, 10, 8)</option><option value="pointBuy">Compra de puntos (27 puntos)</option><option value="rolled">Tirada (4d6, descartar el menor)</option><option value="free">Creación libre (valores personalizados)</option></select></label>
              {#if builderData.method === 'rolled'}
                <button type="button" class="secondary" on:click={builderRollScores}>Volver a tirar las seis puntuaciones</button>
                <p class="hint">Resultados obtenidos: {builderRolledScores.length ? builderRolledScores.join(', ') : 'Pulsa el botón para tirar.'} Distribúyelos entre las características.</p>
              {/if}
              <div class="builder-ability-grid">
                {#each BUILDER_ABILITY_NAMES as ability}
                  <label class="builder-ability-card">{ability}<input type="number" min={builderData.method === 'pointBuy' ? 8 : builderData.method === 'free' ? 1 : 3} max={builderData.method === 'pointBuy' ? 15 : builderData.method === 'free' ? 20 : 18} step="1" bind:value={builderData.abilities[ability]} /><small class="muted">Modificador: {builderModifier(Number(builderData.abilities[ability]) || 10) >= 0 ? '+' : ''}{builderModifier(Number(builderData.abilities[ability]) || 10)}</small></label>
                {/each}
              </div>
              {#if builderData.method === 'pointBuy'}
                <p class="hint">Puntos utilizados: <strong>{builderPointCost()} / 27</strong>. Cada puntuación debe estar entre 8 y 15.</p>
              {:else if builderData.method === 'standard'}
                <p class="hint">Distribuye cada valor del arreglo estándar una sola vez: 15, 14, 13, 12, 10 y 8.</p>
              {:else if builderData.method === 'rolled'}
                <p class="hint">Debes asignar exactamente los seis resultados obtenidos, sin modificarlos.</p>
              {:else}
                <p class="hint">Asigna manualmente cualquier puntuación entre 1 y 20. Este método no aplica límites de arreglo estándar ni compra de puntos.</p>
              {/if}
              
            {:else if builderStep===5}
              <h3>06. Aumentos de características del trasfondo</h3>
              <p class="muted">Aplica los aumentos permitidos por tu trasfondo y comprueba los nuevos modificadores.</p>
              <h4>Distribución de los aumentos de característica</h4>
              <p class="muted">El manual permite aumentar una de las tres características del trasfondo en 2 y otra distinta en 1, o aumentar las tres en 1. No se puede superar 20.</p>
              <label>Distribución<select bind:value={builderData.abilityIncreaseMode}><option value="two">+2 a una característica y +1 a otra distinta</option><option value="three">+1 a cada una de las tres características</option></select></label>
              {#if builderData.abilityIncreaseMode === 'two'}
                <label>Característica que recibe +2<select bind:value={builderData.abilityIncrease2}>{#each BUILDER_BACKGROUND_DATA[builderData.background].abilities as ability}<option>{ability}</option>{/each}</select></label>
                <label>Característica distinta que recibe +1<select bind:value={builderData.abilityIncrease1}>{#each BUILDER_BACKGROUND_DATA[builderData.background].abilities.filter(a => a !== builderData.abilityIncrease2) as ability}<option>{ability}</option>{/each}</select></label>
              {:else}
                <p>{BUILDER_BACKGROUND_DATA[builderData.background].abilities.join(', ')} reciben +1 cada una.</p>
              {/if}
              
              <div class="builder-info"><strong>Valores resultantes</strong>{#each BUILDER_ABILITY_NAMES as ability}<p>{ability}: {builderData.abilities[ability]} → {builderAdjustedAbilities()[ability]}</p>{/each}</div>
            {:else if builderStep===6}
              <h3>07. Competencias</h3>
              <p class="muted">Reúne las competencias de clase, trasfondo y especie. Las salvaciones se conceden automáticamente por clase.</p>
              
              <div class="builder-info"><strong>Habilidades automáticas del trasfondo</strong><p>{BUILDER_BACKGROUND_DATA[builderData.background].skills.join(' y ')}</p><strong>Elige {BUILDER_CLASS_SKILLS[builderData.className].count} competencias de clase</strong></div>
              <div class="builder-choice-wrapper"><strong>Competencias de clase: elige {BUILDER_CLASS_SKILLS[builderData.className].count} habilidades</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Habilidades disponibles</strong><span>{builderData.classSkillChoices.filter(Boolean).length}/{BUILDER_CLASS_SKILLS[builderData.className].count}</span></div><div class="builder-checkbox-grid">{#each BUILDER_CLASS_SKILLS[builderData.className].options.filter(skill => !BUILDER_BACKGROUND_DATA[builderData.background].skills.includes(skill) && skill !== builderData.speciesSkill && ![...builderData.backgroundFeatChoices,...builderData.speciesFeatChoices].includes(skill)) as skill}<label class="builder-checkbox"><input type="checkbox" checked={builderData.classSkillChoices.includes(skill)} on:change={(event) => builderToggleChoice('classSkillChoices',skill,BUILDER_CLASS_SKILLS[builderData.className].count,event)} disabled={!builderData.classSkillChoices.includes(skill) && builderData.classSkillChoices.filter(Boolean).length >= BUILDER_CLASS_SKILLS[builderData.className].count} /><span>{skill}</span><small class="builder-skill-description">{builderSkillDescription(skill)}</small></label>{/each}</div></div></div>
              
              
              <div class="builder-info"><strong>Rasgos automáticos de {builderData.className}</strong><p>{BUILDER_CLASS_DATA[builderData.className].features}</p><p><strong>Competencias de herramientas:</strong> {BUILDER_CLASS_DATA[builderData.className].tool}</p></div>
              {#if BUILDER_CLASS_DATA[builderData.className].specialOptions.length > 0}
                <label>{BUILDER_CLASS_DATA[builderData.className].specialLabel}<select bind:value={builderData.classSpecialChoice}><option value="">Elige una opción</option>{#each BUILDER_CLASS_DATA[builderData.className].specialOptions as option}<option>{option}</option>{/each}</select></label>
              {/if}
              {#if builderData.className === 'Pícaro'}
                <div class="builder-choice-wrapper"><strong>Pericia: elige 2 habilidades en las que ya seas competente</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Pericias</strong><span>{builderData.classExpertise.length}/{2}</span></div><div class="builder-checkbox-grid">{#each [...BUILDER_BACKGROUND_DATA[builderData.background].skills,...builderData.classSkillChoices.filter(Boolean),builderData.speciesSkill,...builderData.backgroundFeatChoices.filter(choice => BUILDER_SKILL_OPTIONS.includes(choice)),...builderData.speciesFeatChoices.filter(choice => BUILDER_SKILL_OPTIONS.includes(choice))].filter(Boolean) as skill}<label class="builder-checkbox"><input type="checkbox" checked={builderData.classExpertise.includes(skill)} on:change={(event) => builderToggleChoice('classExpertise',skill,2,event)} disabled={!builderData.classExpertise.includes(skill) && builderData.classExpertise.length >= (2)} /><span>{skill}</span><small class="builder-skill-description">{builderSkillDescription(skill)}</small></label>{/each}</div></div></div>
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
              
              
            {:else if builderStep===7}
              <h3>08. Equipo inicial</h3>
              <p class="muted">Selecciona los paquetes de equipo del trasfondo y de la clase.</p>
              <div class="builder-info"><strong>Equipo del trasfondo</strong><p><b>A — Equipo:</b> {BUILDER_BACKGROUND_DATA[builderData.background].equipmentA}</p><p><b>B — Oro:</b> 50 po en monedas; no recibes los objetos del paquete A.</p></div>
              <div class="builder-choice-wrapper"><strong>Elige una opción de equipo del trasfondo</strong><label class="builder-checkbox"><input type="radio" name="background-equipment" value="A" bind:group={builderData.backgroundEquipment} /><span><b>A — Equipo completo:</b> {BUILDER_BACKGROUND_DATA[builderData.background].equipmentA}</span></label><label class="builder-checkbox"><input type="radio" name="background-equipment" value="B" bind:group={builderData.backgroundEquipment} /><span><b>B — Oro:</b> 50 po; no recibes ninguno de los objetos del equipo A.</span></label></div>
              <div class="builder-info"><small>Los aumentos se aplican automáticamente a las puntuaciones base y quedan reflejados en la ficha final.</small></div>
                        
              <div class="builder-info"><strong>Opciones de equipo inicial de {builderData.className}</strong><p><b>A — Equipo:</b> {BUILDER_CLASS_DATA[builderData.className].equipmentA}</p><p><b>B — {builderData.className === 'Guerrero' ? 'Equipo alternativo' : 'Oro'}:</b> {BUILDER_CLASS_DATA[builderData.className].equipmentB}{builderData.className === 'Guerrero' ? '' : '; recibes monedas en lugar del equipo A'}.</p>{#if builderData.className === 'Guerrero'}<p><b>C — Oro:</b> 155 po; no recibes los objetos de A ni B.</p>{/if}</div>
              <div class="builder-choice-wrapper"><strong>Elige una opción de equipo de clase</strong><label class="builder-checkbox"><input type="radio" name="class-equipment" value="A" bind:group={builderData.classEquipmentChoice} /><span><b>A — Equipo inicial:</b> {BUILDER_CLASS_DATA[builderData.className].equipmentA}</span></label><label class="builder-checkbox"><input type="radio" name="class-equipment" value="B" bind:group={builderData.classEquipmentChoice} /><span><b>B — {builderData.className === 'Guerrero' ? 'Equipo alternativo' : 'Oro'}:</b> {BUILDER_CLASS_DATA[builderData.className].equipmentB}{builderData.className === 'Guerrero' ? '' : '; recibes estas monedas en lugar de los objetos del equipo A'}.</span></label>{#if builderData.className === 'Guerrero'}<label class="builder-checkbox"><input type="radio" name="class-equipment" value="C" bind:group={builderData.classEquipmentChoice} /><span><b>C — Oro:</b> 155 po; no recibes los objetos de A ni B.</span></label>{/if}</div>
              
            {:else if builderStep===8}
              <h3>09. Magia y conjuros</h3>
              <p class="muted">Solo aparecen las elecciones mágicas que corresponden a tu clase. Las elecciones de dotes y linajes permanecen junto a su origen.</p>
              {#if builderData.className === 'Brujo' && builderData.classSpecialChoice === 'Pacto del grimorio'}
                <div class="builder-info"><strong>Pacto del grimorio</strong><p>Elige tres trucos y dos conjuros de nivel 1 con la etiqueta de ritual. Estos se añaden a los beneficios de tu invocación.</p></div>
                <div class="builder-choice-wrapper"><strong>Trucos del grimorio</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Trucos del grimorio</strong><span>{builderData.warlockTomeCantrips.length}/{3}</span></div><div class="builder-checkbox-grid">{#each BUILDER_TOME_CANTRIPS.filter(spell => !builderData.selectedCantrips.includes(spell)) as spell}<label class="builder-checkbox"><input type="checkbox" checked={builderData.warlockTomeCantrips.includes(spell)} on:change={(event) => builderToggleChoice('warlockTomeCantrips',spell,3,event)} disabled={!builderData.warlockTomeCantrips.includes(spell) && builderData.warlockTomeCantrips.length >= (3)} /><span>{spell}</span><small class="builder-option-description">{builderSpellInfo(spell)?.level === 0 ? 'Truco' : 'Nivel ' + (builderSpellInfo(spell)?.level ?? '—')} · {builderSpellInfo(spell)?.school || 'Conjuro'}</small><small class="builder-option-description">{builderSpellInfo(spell)?.description || 'Descripción no disponible.'}</small></label>{/each}</div></div></div>
                <div class="builder-choice-wrapper"><strong>Conjuros rituales de nivel 1</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Conjuros rituales del grimorio</strong><span>{builderData.warlockTomeRituals.length}/{2}</span></div><div class="builder-checkbox-grid">{#each BUILDER_TOME_RITUALS.filter(spell => !builderData.selectedSpells.includes(spell)) as spell}<label class="builder-checkbox"><input type="checkbox" checked={builderData.warlockTomeRituals.includes(spell)} on:change={(event) => builderToggleChoice('warlockTomeRituals',spell,2,event)} disabled={!builderData.warlockTomeRituals.includes(spell) && builderData.warlockTomeRituals.length >= (2)} /><span>{spell}</span><small class="builder-option-description">{builderSpellInfo(spell)?.level === 0 ? 'Truco' : 'Nivel ' + (builderSpellInfo(spell)?.level ?? '—')} · {builderSpellInfo(spell)?.school || 'Conjuro'}</small><small class="builder-option-description">{builderSpellInfo(spell)?.description || 'Descripción no disponible.'}</small></label>{/each}</div></div></div>
              {/if}
              {#if BUILDER_CLASS_DATA[builderData.className].cantrips > 0}
                <div class="builder-choice-wrapper"><strong>Trucos ({builderData.selectedCantrips.length}/{BUILDER_CLASS_DATA[builderData.className].cantrips + ((builderData.className === 'Clérigo' && builderData.classSpecialChoice === 'Taumaturgo') || (builderData.className === 'Druida' && builderData.classSpecialChoice === 'Naturalista') ? 1 : 0)})</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Trucos de clase</strong><span>{builderData.selectedCantrips.length}/{BUILDER_CLASS_DATA[builderData.className].cantrips + (((builderData.className === 'Clérigo' && builderData.classSpecialChoice === 'Taumaturgo') || (builderData.className === 'Druida' && builderData.classSpecialChoice === 'Naturalista')) ? 1 : 0)}</span></div><div class="builder-checkbox-grid">{#each BUILDER_SPELL_LISTS[builderData.className].cantrips as spell}<label class="builder-checkbox"><input type="checkbox" checked={builderData.selectedCantrips.includes(spell)} on:change={(event) => builderToggleChoice('selectedCantrips',spell,BUILDER_CLASS_DATA[builderData.className].cantrips + (((builderData.className === 'Clérigo' && builderData.classSpecialChoice === 'Taumaturgo') || (builderData.className === 'Druida' && builderData.classSpecialChoice === 'Naturalista')) ? 1 : 0),event)} disabled={!builderData.selectedCantrips.includes(spell) && builderData.selectedCantrips.length >= (BUILDER_CLASS_DATA[builderData.className].cantrips + (((builderData.className === 'Clérigo' && builderData.classSpecialChoice === 'Taumaturgo') || (builderData.className === 'Druida' && builderData.classSpecialChoice === 'Naturalista')) ? 1 : 0))} /><span>{spell}</span><small class="builder-option-description">{builderSpellInfo(spell)?.level === 0 ? 'Truco' : 'Nivel ' + (builderSpellInfo(spell)?.level ?? '—')} · {builderSpellInfo(spell)?.school || 'Conjuro'}</small><small class="builder-option-description">{builderSpellInfo(spell)?.description || 'Descripción no disponible.'}</small></label>{/each}</div></div></div>
              {/if}
              {#if BUILDER_CLASS_DATA[builderData.className].spells > 0}
                {#if builderData.className === 'Mago'}
                  <div class="builder-choice-wrapper"><strong>Libro de conjuros: elige 6 conjuros de nivel 1</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Libro de conjuros</strong><span>{builderData.wizardSpellbook.length}/{6}</span></div><div class="builder-checkbox-grid">{#each BUILDER_SPELL_LISTS.Mago.level1 as spell}<label class="builder-checkbox"><input type="checkbox" checked={builderData.wizardSpellbook.includes(spell)} on:change={(event) => builderToggleChoice('wizardSpellbook',spell,6,event)} disabled={!builderData.wizardSpellbook.includes(spell) && builderData.wizardSpellbook.length >= (6)} /><span>{spell}</span><small class="builder-option-description">{builderSpellInfo(spell)?.level === 0 ? 'Truco' : 'Nivel ' + (builderSpellInfo(spell)?.level ?? '—')} · {builderSpellInfo(spell)?.school || 'Conjuro'}</small><small class="builder-option-description">{builderSpellInfo(spell)?.description || 'Descripción no disponible.'}</small></label>{/each}</div></div></div>
                  <div class="builder-choice-wrapper"><strong>Conjuros preparados</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Conjuros de nivel 1 preparados</strong><span>{builderData.selectedSpells.length}/{builderData.className === 'Mago' ? 4 : BUILDER_CLASS_DATA[builderData.className].spells}</span></div><div class="builder-checkbox-grid">{#each builderData.wizardSpellbook as spell}<label class="builder-checkbox"><input type="checkbox" checked={builderData.selectedSpells.includes(spell)} on:change={(event) => builderToggleChoice('selectedSpells',spell,builderData.className === 'Mago' ? 4 : BUILDER_CLASS_DATA[builderData.className].spells,event)} disabled={!builderData.selectedSpells.includes(spell) && builderData.selectedSpells.length >= (builderData.className === 'Mago' ? 4 : BUILDER_CLASS_DATA[builderData.className].spells)} /><span>{spell}</span><small class="builder-option-description">{builderSpellInfo(spell)?.level === 0 ? 'Truco' : 'Nivel ' + (builderSpellInfo(spell)?.level ?? '—')} · {builderSpellInfo(spell)?.school || 'Conjuro'}</small><small class="builder-option-description">{builderSpellInfo(spell)?.description || 'Descripción no disponible.'}</small></label>{/each}</div></div></div>
                {:else}
                  <div class="builder-choice-wrapper"><strong>Conjuros de nivel 1 preparados ({builderData.selectedSpells.length}/{BUILDER_CLASS_DATA[builderData.className].spells})</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Conjuros de nivel 1 preparados</strong><span>{builderData.selectedSpells.length}/{builderData.className === 'Mago' ? 4 : BUILDER_CLASS_DATA[builderData.className].spells}</span></div><div class="builder-checkbox-grid">{#each BUILDER_SPELL_LISTS[builderData.className].level1 as spell}<label class="builder-checkbox"><input type="checkbox" checked={builderData.selectedSpells.includes(spell)} on:change={(event) => builderToggleChoice('selectedSpells',spell,builderData.className === 'Mago' ? 4 : BUILDER_CLASS_DATA[builderData.className].spells,event)} disabled={!builderData.selectedSpells.includes(spell) && builderData.selectedSpells.length >= (builderData.className === 'Mago' ? 4 : BUILDER_CLASS_DATA[builderData.className].spells)} /><span>{spell}</span><small class="builder-option-description">{builderSpellInfo(spell)?.level === 0 ? 'Truco' : 'Nivel ' + (builderSpellInfo(spell)?.level ?? '—')} · {builderSpellInfo(spell)?.school || 'Conjuro'}</small><small class="builder-option-description">{builderSpellInfo(spell)?.description || 'Descripción no disponible.'}</small></label>{/each}</div></div></div>
                {/if}
              {/if}
            
            {:else if builderStep===9}
              <h3>10. Idiomas</h3>
              <p class="muted">Selecciona los idiomas adicionales y evita repetir los que ya conoces.</p>
              
              
              <div class="builder-choice-wrapper"><strong>Dos idiomas adicionales (además del común)</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Idiomas adicionales</strong><span>{builderData.languages.length}/{2}</span></div><div class="builder-checkbox-grid">{#each BUILDER_STANDARD_LANGUAGES as language}<label class="builder-checkbox"><input type="checkbox" checked={builderData.languages.includes(language)} on:change={(event) => builderToggleChoice('languages',language,2,event)} disabled={!builderData.languages.includes(language) && builderData.languages.length >= (2)} /><span>{language}</span></label>{/each}</div></div></div>
              {#if builderData.className === 'Pícaro'}
                <label>Idioma adicional de pícaro ({builderData.rogueLanguage ? 1 : 0}/1)<select bind:value={builderData.rogueLanguage}><option value="">Elige un idioma</option>{#each BUILDER_LANGUAGES.filter(language => !builderData.languages.includes(language) && language !== 'Jerga de ladrones') as language}<option>{language}</option>{/each}</select></label>
              {/if}


            
            {:else if builderStep===10}
              
              <h3>11. Detalles del personaje</h3>
              <p class="muted">Información narrativa opcional. El alineamiento describe la conducta del personaje; no limita sus decisiones.</p>
              <label>Alineamiento<select bind:value={builderData.alignment}><option>Legal bueno</option><option>Neutral bueno</option><option>Caótico bueno</option><option>Legal neutral</option><option>Neutral</option><option>Caótico neutral</option><option>Legal malvado</option><option>Neutral malvado</option><option>Caótico malvado</option></select></label>
              
              <label>Edad<input bind:value={builderData.age} placeholder="Edad" /></label>
              <label>Altura<input bind:value={builderData.height} placeholder="Altura" /></label>
              <label>Apariencia<textarea bind:value={builderData.appearance} placeholder="Describe su apariencia" rows="2"></textarea></label>
              <label>Personalidad<textarea bind:value={builderData.personality} placeholder="Rasgos de personalidad" rows="2"></textarea></label>
              <label>Ideales<textarea bind:value={builderData.ideals} placeholder="Ideales" rows="2"></textarea></label>
              <label>Vínculos<textarea bind:value={builderData.bonds} placeholder="Vínculos" rows="2"></textarea></label>
              <label>Defectos<textarea bind:value={builderData.flaws} placeholder="Defectos" rows="2"></textarea></label>
            {:else if builderStep===11}
              
              <h3>12. Revisión y creación</h3>
              <p class="muted">Comprueba tus elecciones antes de generar la hoja definitiva.</p>
              <div class="builder-review">
                <section class="builder-review-identity">
                  <span class="builder-review-kicker">AVENTURERO · NIVEL 1</span>
                  <h4>{builderData.name || 'Personaje sin nombre'}</h4>
                  <p>{builderData.species || 'Especie pendiente'} <span>·</span> {builderData.className || 'Clase pendiente'} <span>·</span> {builderData.background || 'Trasfondo pendiente'}</p>
                </section>
                <section class="builder-review-section">
                  <h4>Características</h4>
                  <div class="builder-review-stats">
                    {#each BUILDER_ABILITY_NAMES as ability}
                      <div class="builder-review-stat">
                        <span>{ability}</span>
                        <strong>{builderAdjustedAbilities()[ability]}</strong>
                        <small>{builderModifier(builderAdjustedAbilities()[ability])>=0?'+':''}{builderModifier(builderAdjustedAbilities()[ability])}</small>
                      </div>
                    {/each}
                  </div>
                </section>
                <section class="builder-review-section">
                  <h4>Valores derivados</h4>
                  <div class="builder-review-derived">
                    <div><span>Puntos de golpe</span><strong>{BUILDER_HIT_DIE[builderData.className] + builderModifier(builderAdjustedAbilities().Constitución)} <small>PG</small></strong></div>
                    <div><span>Clase de armadura</span><strong>{builderStartingAC()}</strong></div>
                    <div><span>Iniciativa</span><button type="button" class="inline-roll" title={'Tirar 1d20' + signedBonus(builderModifier(builderAdjustedAbilities().Destreza)) + ' en Dice+'} on:click={() => sendSheetRoll('1d20' + signedBonus(builderModifier(builderAdjustedAbilities().Destreza)), 'Initiative')}>{signedBonus(builderModifier(builderAdjustedAbilities().Destreza))}</button></div>
                    <div><span>Dado de golpe</span><strong>d{BUILDER_HIT_DIE[builderData.className]}</strong></div>
                  </div>
                </section>
                <section class="builder-review-section builder-review-details">
                  <h4>Competencias y otros datos</h4>
                  <div><span>Salvaciones</span><p>{BUILDER_SAVES[builderData.className]}</p></div>
                  <div><span>Dote de origen</span><p>{BUILDER_BACKGROUND_DATA[builderData.background].feat}</p></div>
                  <div><span>Idiomas adicionales</span><p>{builderData.languages.join(', ') || 'Pendientes'}</p></div>
                </section>
              </div>
            {/if}
            {#if builderStepError}<p class="builder-step-error" role="alert">{builderStepError}</p>{/if}
            <div class="builder-actions">
              {#if builderStep>0}<button class="secondary" on:click={builderBack}>Anterior</button>{/if}
              {#if builderStep<11}<button class="primary" on:click={builderNext}>Siguiente</button>{:else}<button type="button" class="primary" on:click={finishBuilder}>Guardar cambios y abrir ficha</button>{/if}
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
          {:else if builderPreview}
            <button class="primary" type="button" disabled={builderSaving} on:click={saveBuilderCharacter}>{builderSaving ? 'Guardando…' : 'Guardar personaje'}</button>
            <button class="secondary" type="button" on:click={() => { sheet = null; builderPreview = null; builderStep = 11; playerCreating = true; }}>Volver a editar</button>
            <button class="secondary" type="button" on:click={startBuilder}>Descartar y crear otro</button>
          {:else}
            <button class="secondary" on:click={startBuilder}>Crear personaje nuevo</button>
          {/if}
        </section>
      {/if}
      {#if sheet && !playerCreating}
        <article class="character-sheet nautical-sheet">
          <header class="sheet-banner ddb-character-header nautical-header">
            <div class="portrait-frame">{#if sheet.portrait}<img src={String(sheet.portrait)} alt="Retrato de {sheet.name || 'personaje'}" />{:else}<span>✦</span>{/if}</div>
            <div class="sheet-banner-copy">
              <span class="sheet-kicker">D&D · 2024</span>
              <h1 class="character-name">{sheet.name || 'Personaje'}</h1>
              <div class="sheet-banner-meta">
                <span class="level-up-trigger">{sheetClassName(sheet) || 'Clase sin definir'} · Nivel {sheetLevel(sheet)}</span>
                <span>{sheetValueByNames(sheet, ['Especie','Raza']) || 'Especie sin definir'}</span>
                <span>{sheetValueByNames(sheet, ['Trasfondo','Antecedente']) || 'Trasfondo sin definir'}</span>
                <span>{sheetValueByNames(sheet, ['Nombre del jugador','Jugador']) || playerName || 'Jugador'}</span>
              </div>
            </div>
            <div class="header-actions">
              {#if demoPreview}
                <button type="button" on:click={closeDemoPreview}>Salir de vista previa</button>
              {:else}
                <button type="button" on:click={exportSheet}>Exportar</button>
              {/if}
            </div>
          </header>

          <section class="sheet-quick-stats nautical-quick-stats" aria-label="Características y estadísticas">
            <div class="attribute-plaque-row">
              {#each playerAttributes(sheet.sections || []) as pair}
                {#each pair.heading.stats || [] as stat, i}
                  {@const abilityValue = displayValue(pair.values?.stats?.[i]?.value) || displayValue(stat.value)}
                  {@const score = abilityScoreNumber(abilityValue)}
                  {@const modifier = abilityModifier(abilityValue)}
                  {@const saveBonus = savingThrowNumber(String(stat.name || ''), sheet?.sections || [])}
                  <div class="attribute-plaque">
                    <span>{stat.name || ''}</span>
                    <strong class="ability-score">{score ?? '—'}</strong>
                    {#if modifier !== null}
                      <button type="button" class="inline-roll ability-bonus-roll" title="Tirar 1d20{signedBonus(modifier)} en Dice+" on:click={() => sendSheetRoll('1d20' + signedBonus(modifier), String(stat.name || 'Característica'))}>{signedBonus(modifier)}</button>
                    {:else}
                      <span class="ability-bonus-empty">—</span>
                    {/if}
                    <div class="saving-throw-line" class:proficient={savingThrowIsProficient(String(stat.name || ''), sheet.sections || [])}>
                      <span>Salvación</span>
                      {#if saveBonus !== null}
                        <button type="button" class="inline-roll" title="Tirar 1d20{signedBonus(saveBonus)} en Dice+" on:click={() => sendSheetRoll('1d20' + signedBonus(saveBonus), 'Salvación de ' + String(stat.name || ''))}>{signedBonus(saveBonus)}</button>
                      {:else}
                        <strong>—</strong>
                      {/if}
                    </div>
                  </div>
                {/each}
              {/each}
            </div>
            <div class="quick-stats-row">
            <div><span>Competencia</span><strong class="proficiency-bonus">{sheetValueByNames(sheet, ['Bonificador por competencia','Bonificador de competencia']) || '—'}</strong></div>
            <div><span>Velocidad</span><strong>{sheetValueByNames(sheet, ['Speed']) || '—'}</strong></div>
            <div><span>Dado de golpe</span><strong>{sheetValueByNames(sheet, ['Dados de golpe','Dado de golpe']) || '—'}</strong></div>
            <div><span>Percepción pasiva</span><strong>{sheetValueByNames(sheet, ['Percepción pasiva']) || '—'}</strong></div>
            <div class="hp-plaque"><span>Puntos de golpe</span><strong>{sheetValueByNames(sheet, ['Puntos de golpe actuales','PG actuales']) || '—'} / {sheetValueByNames(sheet, ['Puntos de golpe máximos','PG máximos']) || '—'}</strong></div>
            <div><span>Clase de armadura</span><strong>{sheetValueByNames(sheet, ['Armor Class','CA']) || '—'}</strong></div>
            <div><span>Iniciativa</span><strong>{sheetValueByNames(sheet, ['Initiative']) || '—'}</strong></div>
            </div>
          </section>

          {#if importOpen}
            <section class="import-character-panel data-import-panel nautical-import">
              <label>Importar otro personaje (JSON)<input bind:this={fileInput} type="file" accept=".json,application/json" on:change={importJson} /></label>
              <button class="secondary" on:click={() => importOpen = false}>Cerrar</button>
            </section>
          {/if}

          <div class="nautical-columns">
            <section class="nautical-skills">
              {#each playerSidePairs('skills', sheet.sections || []) as pair}
                <section class="sheet-section skills-section">
                  <div class="sheet-section-title"><h3>{pair.heading.name || 'Skills'}</h3></div>
                  <div class="skill-column-labels"><span>Habilidad</span><span>Valor</span></div>
                  <div class="stats-list">
                    {#each pair.heading.stats || [] as stat, i}
                      {@const skillValue = (displayValue(pair.values?.stats?.[i]?.value) || displayValue(stat.value)).replace(/\s*[·,]?\s*(Competente|Pericia)\b/gi, '').replace(/\s*\(Competencia\)/gi, '')}
                      {@const skillBonus = skillBonusNumber(skillValue)}
                      <div class="sheet-stat" class:proficient={skillIsProficient(String(stat.name || ''), sheet)} class:expertise={skillIsExpertise(String(stat.name || ''), sheet)}><span class="stat-label">{stat.name || ''}</span><div class="stat-value sheet-readonly-value skill-number">{#if skillBonus !== null}<button type="button" class="inline-roll" class:proficient={skillIsProficient(String(stat.name || ''), sheet)} class:expertise={skillIsExpertise(String(stat.name || ''), sheet)} title="Tirar 1d20{signedBonus(skillBonus)} en Dice+" on:click={() => sendSheetRoll('1d20' + signedBonus(skillBonus), String(stat.name || 'Habilidad'))}>{signedBonus(skillBonus)}</button>{:else}{skillValue}{/if}</div></div>
                    {/each}
                  </div>
                </section>
              {/each}
            </section>

            <section class="nautical-actions">
                    <section class="sheet-section player-feature-section">
                      <div class="sheet-section-title"><h3>Rasgos</h3></div>
                      {#if playerFeatureGroups(sheet).traits.length}
                        <div class="player-feature-list">
                          {#each playerFeatureGroups(sheet).traits as feature, i}
                            <details class="player-feature-card">
                              <summary><span class="player-feature-name">{feature.name}</span><span class="player-feature-source">{feature.source}{#if feature.level} · Nivel {feature.level}{/if}</span></summary>
                              {#if feature.description}<p>{feature.description}</p>{/if}
                            </details>
                          {/each}
                        </div>
                      {:else}<p class="muted nautical-empty">No hay rasgos registrados.</p>{/if}
                    </section>
                    <section class="sheet-section player-feat-section">
                      <div class="sheet-section-title"><h3>Dotes</h3></div>
                      {#if playerFeatureGroups(sheet).feats.length}
                        <div class="player-feature-list">
                          {#each playerFeatureGroups(sheet).feats as feat}
                            <details class="player-feature-card">
                              <summary><span class="player-feature-name">{feat.name}</span><span class="player-feature-source">Dote</span></summary>
                              <p>{feat.description}</p>
                            </details>
                          {/each}
                        </div>
                      {:else}<p class="muted nautical-empty">No hay dotes registradas.</p>{/if}
                    </section>

            </section>

            <section class="nautical-content">
              <nav class="nautical-tabs" aria-label="Secciones de la ficha">
                {#each playerSheetTabs as tab}
                  <button type="button" class:active={playerSheetTab === tab} on:click={() => playerSheetTab = tab}>{tab}</button>
                {/each}
              </nav>

              <div class="nautical-tab-content">
                {#if playerSheetTab === 'Acciones'}
                  <section class="sheet-section weapon-attacks-section">
                  <div class="sheet-section-title"><h3>Maestría con armas</h3></div>
                  <div class="weapon-mastery-summary">{sheetValueByNames(sheet, ['Maestrías con armas'], ['ATAQUES']) || 'Sin maestrías registradas'}</div>
                  <div class="weapon-attack-list">
                  {#each playerWeaponAttacks(sheet) as weapon}
                  <article class="weapon-attack-card">
                  <h4>{weapon.name}</h4>
                  <div class="weapon-attack-values">
                  <div><span>Bono para atacar</span>{#if weapon.attackBonus !== null}<button type="button" class="inline-roll" class:proficient={weapon.proficient} title="Tirar 1d20{signedBonus(weapon.attackBonus)} en Dice+" on:click={() => sendSheetRoll('1d20' + signedBonus(Number(weapon.attackBonus)), 'Ataque con ' + weapon.name)}>{signedBonus(weapon.attackBonus)}</button>{:else}<strong>—</strong>{/if}</div>
                  <div><span>Daño</span><button type="button" class="inline-roll" title="Tirar daño de {weapon.name}" on:click={() => sendSheetRoll(weapon.damage, 'Daño de ' + weapon.name)}>{weapon.damage}</button></div>
                  <div><span>Alcance</span><strong>{weapon.range}</strong></div>
                  <div><span>Tipo de daño</span><strong>{weapon.damageType}</strong></div>
                  </div>
                  </article>
                  {/each}
                  </div>
                  </section>

                {:else if playerSheetTab === 'Botones'}
                  <section class="sheet-section quick-buttons-section">
                    <div class="sheet-section-title"><h3>Botonera de tiradas</h3></div>
                    <div class="quick-buttons-grid">
                      {#each getQuickButtons(sheet) as quickButton, i}
                        <div class="quick-button-cell" style={`--quick-hue:${(i*37+185)%360}`}>
                          <button type="button" class="quick-roll-button" disabled={!quickButton.attack.trim()} on:click={() => rollQuickButton(i)}>{quickButton.name || 'Botón '+(i+1)}</button>
                          <small>{quickButton.attack}{#if quickButton.damage} · {quickButton.damage}{/if}</small>
                          <div class="quick-button-controls">
                            <button type="button" class:mode-active={quickButton.mode==='advantage'} class:mode-disadvantage={quickButton.mode==='disadvantage'} disabled={!/d20/i.test(quickButton.attack)} title="Cambiar modo: normal, ventaja, desventaja" on:click={() => cycleQuickMode(i)}>{quickButton.mode==='advantage'?'▲ Ventaja':quickButton.mode==='disadvantage'?'▼ Desventaja':'● Normal'}</button>
                            <button type="button" title="Configurar botón" on:click={() => editingQuickButton=editingQuickButton===i?-1:i}>⚙</button>
                          </div>
                          {#if editingQuickButton===i}
                            <div class="quick-button-editor">
                              <label>Nombre<input value={quickButton.name} on:input={(e)=>updateQuickButton(i,'name',e)} /></label>
                              <label>Ataque<input value={quickButton.attack} placeholder="1d20+3" on:input={(e)=>updateQuickButton(i,'attack',e)} /></label>
                              <label>Daño (opcional)<input value={quickButton.damage} placeholder="1d6+2" on:input={(e)=>updateQuickButton(i,'damage',e)} /></label>
                              <small>El modo ventaja/desventaja solo funciona si el ataque contiene d20.</small>
                            </div>
                          {/if}
                        </div>
                      {/each}
                    </div>
                    <div class="quick-roll-results">
                      <div class="quick-roll-results-header">
                        <h4>Registro de tiradas ({quickRollHistory.length}/10)</h4>
                        <button type="button" class="quick-roll-clear" disabled={!quickRollHistory.length} on:click={() => quickRollHistory=[]}>Limpiar registro</button>
                      </div>
                      {#each quickRollHistory as result (result.id)}
                          <article class="quick-roll-result">
                            <strong>{result.name}</strong>
                            <p><b>Ataque</b> {#if result.mode==='advantage'}<span class="quick-mode-label">Ventaja</span>{:else if result.mode==='disadvantage'}<span class="quick-mode-label">Desventaja</span>{/if}<br />{result.attack}<br /><strong class="quick-result-value">{result.attackResult}</strong></p>
                            {#if result.damage}<p><b>Daño</b><br />{result.damage}<br /><strong class="quick-result-value">{result.damageResult}</strong></p>{/if}
                          </article>
                      {/each}
                    </div>
                  </section>
                {:else if playerSheetTab === 'Iniciativa'}
                  <section class="sheet-section player-initiative-section">
                    <div class="sheet-section-title"><h3>Iniciativa del combate</h3><span class="count">Ronda {sharedInitiativeRound}</span></div>
                    {#if sharedInitiativeOrder.length}
                      <ol class="initiative-list">
                        {#each sharedInitiativeOrder as participant, i}
                          <li class:initiative-active={i === sharedActiveInitiativeIndex}>
                            <span class="initiative-position">{i+1}</span>
                            <span class="initiative-name">{participant.name}{#if i === sharedActiveInitiativeIndex}<small class="player-current-turn"> · Turno actual</small>{/if}</span>
                            <span class="initiative-roll"><strong>{participant.total}</strong></span>
                          </li>
                        {/each}
                      </ol>
                    {:else}
                      <p class="muted">El director todavía no ha iniciado el tracker de iniciativa.</p>
                    {/if}
                    <p class="muted">Esta lista es de solo lectura. El orden y el turno actual se actualizan desde el tracker del director.</p>
                  </section>
                {:else if playerSheetTab === 'Conjuros'}
                  <section class="sheet-section player-spellcasting-summary">
                    <div class="sheet-section-title"><h3>Lanzamiento de conjuros</h3></div>
                    <div class="spellcasting-summary-grid">
                      <div><span>Aptitud mágica</span><strong>{sheetValueByNames(sheet, ['Aptitud mágica']) || '—'}</strong></div>
                      <div><span>CD de salvación</span><strong>{sheetValueByNames(sheet, ['CD de salvación']) || '—'}</strong></div>
                       <div><span>Ataque de conjuro</span>{#if skillBonusNumber(sheetValueByNames(sheet, ['Ataque de conjuro'])) !== null}<button type="button" class="inline-roll proficient" title="Tirar 1d20{signedBonus(skillBonusNumber(sheetValueByNames(sheet, ['Ataque de conjuro'])) ?? 0)} en Dice+" on:click={() => sendSheetRoll('1d20' + signedBonus(skillBonusNumber(sheetValueByNames(sheet, ['Ataque de conjuro'])) ?? 0), 'Ataque de conjuro')}>{signedBonus(skillBonusNumber(sheetValueByNames(sheet, ['Ataque de conjuro'])) ?? 0)}</button>{:else}<strong>—</strong>{/if}</div>
                      <div class="spell-slot-summary"><span>Espacios de conjuros</span>
                        <strong>{#if Object.values(sheetSpellSlots).some(value => Number(value) > 0)}
                          {#each Object.entries(sheetSpellSlots).filter(([level,value]) => Number(value) > 0) as [level,maximum]}
                            <span class="spell-slot-value">Nivel {level}: {maximum}</span>
                          {/each}
                        {:else}
                          {sheetValueByNames(sheet, ['Espacios por nivel','Espacios de conjuro']) || '—'}
                        {/if}</strong>
                      </div>
                    </div>
                  </section>

                    <div class="spell-change-actions">
                      <button type="button" class="primary" on:click={openSpellChange}>Cambiar conjuros</button>
                    </div>

                  {#if spellChangeOpen}
                    <section class="sheet-section spell-change-panel">
                      <div class="sheet-section-title"><h3>Cambiar conjuros</h3></div>
                      {#if spellChangeStage === 'prompt'}
                        <p>{spellChangeRule}</p>
                        <p>{spellChangeMode === 'long-rest' ? '¿Ya completaste un descanso largo?' : '¿Ya subiste un nivel en esta clase?'}</p>
                        <div class="spell-change-actions">
                          <button type="button" class="primary" on:click={() => confirmSpellChangeCondition(true)}>Sí, continuar</button>
                          <button type="button" on:click={() => confirmSpellChangeCondition(false)}>Todavía no</button>
                        </div>
                      {:else}
                        <p>{spellChangeMode === 'long-rest'
                          ? (spellClassKey(sheet) === 'mago'
                            ? 'Tu libro de conjuros contiene ' + classSpellOptions(sheet).length + ' conjuros. Puedes preparar ' + spellChangeLimit + '. Marca exactamente esa cantidad. Los conjuros que no marques permanecen en tu libro; no se eliminan.'
                            : 'Selecciona los conjuros que prepararás. Debes elegir exactamente ' + spellChangeLimit + '.')
                          : 'Selecciona un conjuro conocido para retirar y otro para incorporar. Solo puedes reemplazar uno.'}</p>
                        <input class="spell-change-search" type="search" placeholder="Buscar conjuro..." bind:value={spellChangeSearch} />
                        <div class="spell-change-count">{spellChangeSelected.length} de {spellChangeLimit} {#if spellChangeMode === 'long-rest'}conjuros preparados{:else}seleccionados (debes reemplazar exactamente uno){/if}</div>
                        <div class="spell-change-options">
                          {#each classSpellOptions(sheet).filter((spell) => !spellChangeSearch || normalizeLevelText(spell.name).includes(normalizeLevelText(spellChangeSearch))) as spell (spell.name)}
                            <label class:selected={spellChangeSelected.includes(normalizeLevelText(spell.name))}>
                              <input type="checkbox" checked={spellChangeSelected.includes(normalizeLevelText(spell.name))} on:change={() => toggleSpellChangeSelection(spell)} />
                              <span>{spell.name}</span>
                              <small>{spell.level === 0 ? 'Truco' : 'Nivel ' + spell.level}</small>
                            </label>
                          {/each}
                        </div>
                        <div class="spell-change-actions">
                          <button type="button" class="primary" disabled={!canApplySpellChange()} on:click={applySpellChange}>Confirmar cambios</button>
                          <button type="button" on:click={() => spellChangeOpen = false}>Cancelar</button>
                        </div>
                      {/if}
                    </section>
                  {/if}
                  <section class="sheet-section player-spell-list-section">
                    <div class="sheet-section-title"><h3>Conjuros</h3></div>
                    {#if playerKnownSpellCards(sheet).length}
                      <div class="player-spell-list">
                        {#each playerKnownSpellCards(sheet) as spell (spell.name)}
                          <article class="player-spell-card">
                            <details>
                              <summary>
                                <span class="player-spell-name">{spell.name}</span>
                                <span class="player-spell-level">{spell.level === 0 ? 'Truco' : 'Nivel ' + spell.level}</span>
                              </summary>
                              <div class="player-spell-description">
                                <div class="spell-meta">
                                  <p><strong>Escuela:</strong> {spell.school || '—'}</p>
                                  <p><strong>Tiempo:</strong> {spell.castingTime || '—'}</p>
                                  <p><strong>Alcance:</strong> {spell.range || '—'}</p>
                                  <p><strong>Componentes:</strong> {spell.components || '—'}</p>
                                  <p><strong>Duración:</strong> {spell.duration || '—'}</p>
                                  {#if spell.special?.length}<p><strong>Especial:</strong> {spell.special.join(', ')}</p>{/if}
                                </div>
                                <p class="spell-description">{spell.description || 'Descripción no disponible.'}</p>
                              </div>
                            </details>
                            <div class="player-spell-checks">
                              <label><input type="checkbox" checked={spellIsKnown(sheet, spell)} on:change={() => toggleSpellState(spell, 'known')} /> Conocido</label>
                              <label><input type="checkbox" checked={spellIsPrepared(sheet, spell)} on:change={() => toggleSpellState(spell, 'prepared')} /> Preparado</label>
                            </div>
                          </article>
                        {/each}
                      </div>
                    {:else}
                      <p class="muted nautical-empty">No hay conjuros conocidos registrados.</p>
                    {/if}
                  </section>
                {:else if playerSheetTab === 'Compendio de conjuros'}
<section class="sheet-section spells-panel">
          <div class="sheet-section-title"><h3>Compendio de conjuros</h3><span class="count">{filteredSpells.length} / {SPELLS.length}</span></div>
          <p class="muted">Catálogo de conjuros del manual. Cada ficha incluye nivel, escuela, clases, tiempo de lanzamiento, alcance, componentes, duración y descripción.</p>
          <label class="spell-search">Buscar conjuro
            <input type="search" bind:value={spellSearch} placeholder="Nombre o texto del conjuro..." />
          </label>
          <div class="spell-filters">
            <label>Letra inicial
              <select bind:value={spellLetterFilter}><option value="">Ninguna</option>{#each ALPHABET as letter}<option value={letter}>{letter}</option>{/each}</select>
            </label>
            <label>Nivel
              <select bind:value={spellLevelFilter}>
                <option value="">Ninguno</option>
                <option value="0">Trucos · Nivel 0</option>
                {#each [1,2,3,4,5,6,7,8,9] as level}
                  <option value={String(level)}>Nivel {level}</option>
                {/each}
              </select>
            </label>
            <label>Clase
              <select bind:value={spellClassFilter}>
                <option value="">Ninguna</option>
                {#each SPELL_CLASSES as className}
                  <option value={className}>{className}</option>
                {/each}
              </select>
            </label>
            <label>Escuela
              <select bind:value={spellSchoolFilter}>
                <option value="">Ninguna</option>
                {#each SPELL_SCHOOLS as school}
                  <option value={school}>{school}</option>
                {/each}
              </select>
            </label>
          </div>
          <div class="spell-list">
            {#if filteredSpells.length === 0}<p class="muted">Selecciona un nivel, clase o escuela, o escribe una búsqueda para mostrar conjuros.</p>{:else}
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
            {/if}
          </div>
        </section>
                {:else if playerSheetTab === 'Reglas'}
<section class="sheet-section rules-panel">
          <div class="sheet-section-title"><h3>Reglas</h3><span class="count">{filteredRules.length} / {RULES.length}</span></div>
          <p class="muted">Glosario del Apéndice C. Fuente: Manual del Jugador 2024 · Las páginas indicadas corresponden a la numeración del PDF.</p>
          <div class="rules-toolbar">
            <label class="rules-search">Buscar regla
              <div class="rules-search-input"><input type="search" bind:value={rulesSearch} placeholder="Escribe al menos dos letras..." /><button type="button" on:click={() => rulesSearch = ''} disabled={!rulesSearch}>Limpiar</button></div>
            </label>
            <label class="rules-category-filter">Tipo de regla
              <select bind:value={rulesCategoryFilter}><option value="">Todos los tipos</option>{#each RULE_CATEGORIES as category}<option value={category}>{category}</option>{/each}</select>
            </label>
            <div class="rules-toolbar-actions"><span>{filteredRules.length} resultados</span><button type="button" on:click={() => openRuleName = openRuleName === '*' ? '' : '*'}>{openRuleName === '*' ? 'Cerrar todas' : 'Abrir todas'}</button></div>
          </div>
          <div class="rules-navigation"><span>Ir a:</span>{#each ruleLetters as letter}<a href={'#rules-letter-' + letter}>{letter}</a>{/each}</div>
          <div class="rules-list">
            {#if filteredRules.length === 0}<p class="muted">No hay reglas que coincidan con los filtros.</p>{:else}
            {#each groupedRules as group (group.letter)}
              <h3 class="rules-letter" id={'rules-letter-' + group.letter}>{group.letter}</h3>
              {#each group.rules as rule (rule.name)}
                {#if rule.category === 'Abreviatura'}
                  <div class="rule-abbreviation"><strong>{ruleNameCase(rule.name)}</strong><span class="rule-category category-abreviatura">{rule.category}</span><span class="rule-abbreviation-meaning">→ {ruleTextParagraphs(rule.description).join(' ')}</span><span class="rule-page">p. {rule.pdfPage ?? '—'}</span></div>
                {:else}
                  <details class="rule-card" id={'rule-' + encodeURIComponent(rule.name)} open={openRuleName === '*' || openRuleName === rule.name} on:toggle={(event) => handleRuleToggle(event, rule.name)}>
                    <summary><span class="rule-name">{@html highlightedRuleName(rule.name)}</span><span class={'rule-category category-' + normalizeRuleText(rule.category).replace(/\s+/g,'-')}>{rule.category}</span><span class="rule-page">p. {rule.pdfPage}</span></summary>
                    <div class="rule-details"><div class="rule-description">{#each ruleTextParagraphs(rule.description) as paragraph}<p>{paragraph}</p>{/each}</div>
                      {#if ruleRelatedNames(rule).length}<div class="rule-related"><strong>Ver también:</strong>{#each ruleRelatedNames(rule) as related,index}<button type="button" on:click={() => jumpToRule(related)}>{related}</button>{index < ruleRelatedNames(rule).length - 1 ? ' · ' : ''}{/each}</div>{/if}
                      
                    </div>
                  </details>
                {/if}
              {/each}
            {/each}
            {/if}
          </div>
        </section>
                {:else if playerSheetTab === 'Subir nivel'}
                  {@const progression = getPlayerClassProgression(sheet)}
                  <section class="sheet-section class-progression-panel">
                    <div class="sheet-section-title"><h3>Progresión de clase</h3></div>
                    {#if progression}
                      <p class="muted class-progression-caption">{progression.className} · Tabla de progresión del Manual del Jugador 2024. El nivel actual está resaltado.</p>
                      <div class="class-progression-scroll">
                        <table class="class-progression-table">
                          <thead><tr><th>Nivel</th>{#each progression.columns.slice(1) as column}<th>{column}</th>{/each}</tr></thead>
                          <tbody>
                            {#each progression.rows as row}
                              <tr class:current-level={row.level === progression.currentLevel} class:next-level={row.level === progression.currentLevel + 1}>
                                <th scope="row">{row.level}</th>
                                <td>{row.proficiency || '—'}</td>
                                <td class="class-progression-features">{row.features || '—'}</td>
                                {#each progression.columns.slice(3) as column}
                                  <td>{row.resources?.[column] || '—'}</td>
                                {/each}
                              </tr>
                            {/each}
                          </tbody>
                        </table>
                      </div>
                    {:else}
                      <p class="muted">No se encontró una tabla de progresión para esta clase.</p>
                    {/if}
                  </section>
                  <section class="sheet-section progression-manual-panel progression-edit-panel">
                    <div class="sheet-section-title"><h3>Editar cualquier dato</h3></div>
                    <p class="muted">Selecciona una sección y un campo de tu ficha para modificar su valor directamente.</p>
                    <div class="progression-edit-grid">
                      <label>Sección<select bind:value={progressionEditSection} on:change={()=>progressionEditField=progressionEditFields[0]||''}>{#each progressionEditSections as section}<option value={section}>{section}</option>{/each}</select></label>
                      <label>Campo<select bind:value={progressionEditField}>{#each progressionEditFields as field}<option value={field}>{field}</option>{/each}</select></label>
                      <label class="progression-edit-value">Valor<input type="text" bind:value={progressionEditValue}/></label>
                      <button type="button" class="progression-undo-button" on:click={saveProgressionEdit} disabled={!progressionEditSection||!progressionEditField}>Guardar cambio</button>
                    </div>
                  </section>
                  <section class="sheet-section progression-manual-panel">
                    <div class="sheet-section-title"><h3>Progresión</h3></div>
                    <p class="muted">Ajusta manualmente los valores al avanzar de nivel. Los valores derivados se calculan según las características.</p>
                    <div class="progression-manual-list">
                      <div class="progression-manual-row"><span>Nivel de personaje</span><div><button type="button" aria-label="Disminuir nivel" on:click={()=>adjustProgressionValue('PERSONAJE','Nivel',-1,1)}>−</button><strong>{getCharacterStat(sheet,'PERSONAJE','Nivel') || '1'}</strong><button type="button" aria-label="Aumentar nivel" on:click={()=>adjustProgressionValue('PERSONAJE','Nivel',1,1)}>+</button></div></div>
                      <div class="progression-manual-row"><span>Puntos de golpe máximos</span><div><button type="button" aria-label="Disminuir PG máximos" on:click={()=>adjustProgressionValue('COMBATE','Puntos de golpe máximos',-1,1,' PG')}>−</button><strong>{getCharacterStat(sheet,'COMBATE','Puntos de golpe máximos') || '—'}</strong><button type="button" aria-label="Aumentar PG máximos" on:click={()=>adjustProgressionValue('COMBATE','Puntos de golpe máximos',1,1,' PG')}>+</button></div></div>
                      <div class="progression-manual-row"><span>Puntos de golpe actuales</span><div><button type="button" aria-label="Disminuir PG actuales" on:click={()=>adjustProgressionValue('COMBATE','Puntos de golpe actuales',-1,0,' PG')}>−</button><strong>{getCharacterStat(sheet,'COMBATE','Puntos de golpe actuales') || '—'}</strong><button type="button" aria-label="Aumentar PG actuales" on:click={()=>adjustProgressionValue('COMBATE','Puntos de golpe actuales',1,0,' PG')}>+</button></div></div>
                      <div class="progression-manual-row"><span>Puntos de golpe temporales</span><div><button type="button" aria-label="Disminuir PG temporales" on:click={()=>adjustProgressionValue('COMBATE','Puntos de golpe temporales',-1,0,' PG')}>−</button><strong>{getCharacterStat(sheet,'COMBATE','Puntos de golpe temporales') || '0'}</strong><button type="button" aria-label="Aumentar PG temporales" on:click={()=>adjustProgressionValue('COMBATE','Puntos de golpe temporales',1,0,' PG')}>+</button></div></div>
                      <div class="progression-manual-row"><span>Dados de golpe</span><div><button type="button" aria-label="Disminuir dado de golpe" on:click={()=>adjustProgressionHitDice(-1)}>−</button><strong>{getCharacterStat(sheet,'COMBATE','Dados de golpe') || '—'}</strong><button type="button" aria-label="Aumentar dado de golpe" on:click={()=>adjustProgressionHitDice(1)}>+</button></div></div>
                      <div class="progression-manual-row"><span>Clase de Armadura</span><div><button type="button" aria-label="Disminuir CA" on:click={()=>adjustProgressionValue('COMBATE','Armor Class',-1,10)}>−</button><strong>{getCharacterStat(sheet,'COMBATE','Armor Class') || '—'}</strong><button type="button" aria-label="Aumentar CA" on:click={()=>adjustProgressionValue('COMBATE','Armor Class',1,10)}>+</button></div></div>
                      <div class="progression-manual-row"><span>Velocidad</span><div><button type="button" aria-label="Disminuir velocidad" on:click={()=>adjustProgressionValue('COMBATE','Speed',-1,9,' m')}>−</button><strong>{getCharacterStat(sheet,'COMBATE','Speed') || '—'}</strong><button type="button" aria-label="Aumentar velocidad" on:click={()=>adjustProgressionValue('COMBATE','Speed',1,9,' m')}>+</button></div></div>
                      <div class="progression-manual-row"><span>Iniciativa</span><div><button type="button" aria-label="Disminuir iniciativa" on:click={()=>adjustProgressionValue('COMBATE','Initiative',-1,0,'',true)}>−</button><strong>{getCharacterStat(sheet,'COMBATE','Initiative') || '0'}</strong><button type="button" aria-label="Aumentar iniciativa" on:click={()=>adjustProgressionValue('COMBATE','Initiative',1,0,'',true)}>+</button></div></div>
                      <div class="progression-manual-row"><span>Bonificador por competencia</span><div><button type="button" aria-label="Disminuir competencia" on:click={()=>adjustProgressionValue('COMBATE','Bonificador por competencia',-1,2)}>−</button><strong>{getCharacterStat(sheet,'COMBATE','Bonificador por competencia') || '—'}</strong><button type="button" aria-label="Aumentar competencia" on:click={()=>adjustProgressionValue('COMBATE','Bonificador por competencia',1,2)}>+</button></div></div>
                      {#each ['Fuerza','Destreza','Constitución','Inteligencia','Sabiduría','Carisma'] as ability}
                        <div class="progression-manual-row"><span>{ability}</span><div><button type="button" aria-label={'Disminuir '+ability} on:click={()=>adjustProgressionValue('ATRIBUTOS',ability,-1,10)}>−</button><strong>{getCharacterStat(sheet,'ATRIBUTOS',ability) || '—'}</strong><button type="button" aria-label={'Aumentar '+ability} on:click={()=>adjustProgressionValue('ATRIBUTOS',ability,1,10)}>+</button></div></div>
                      {/each}
                      <div class="progression-manual-row"><span>Experiencia (PX)</span><div><button type="button" aria-label="Disminuir experiencia" on:click={()=>adjustProgressionValue('PERSONAJE','Experiencia',-100,0,' PX')}>−</button><strong>{getCharacterStat(sheet,'PERSONAJE','Experiencia') || '0'}</strong><button type="button" aria-label="Aumentar experiencia" on:click={()=>adjustProgressionValue('PERSONAJE','Experiencia',100,0,' PX')}>+</button></div></div>
                      {#if progression}
                        {@const currentResourceRow=getManualProgressionCurrentRow(progression)}
                        {#if currentResourceRow?.resources?.['Dado bárdico']}
                          <div class="progression-manual-select-row"><label>Dado bárdico<select value={progressionResourceText(sheet,'Dado bárdico',currentResourceRow.resources['Dado bárdico'])} on:change={updateProgressionBardDie}>{#each ['d6','d8','d10','d12'] as die}<option value={die}>{die.toUpperCase()}</option>{/each}</select></label></div>
                        {/if}
                        {#each manualProgressionResourceEntries(progression) as [resourceName,resourceBase]}
                          <div class="progression-manual-row"><span>{resourceName}</span><div><button type="button" aria-label={'Disminuir '+resourceName} on:click={()=>adjustProgressionResource(resourceName,-1,resourceBase)}>−</button><strong>{progressionResourceValue(sheet,resourceName,resourceBase)}</strong><button type="button" aria-label={'Aumentar '+resourceName} on:click={()=>adjustProgressionResource(resourceName,1,resourceBase)}>+</button></div></div>
                        {/each}
                      {/if}
                      {#each Object.entries(sheetSpellSlots) as [slotLevel,slotMaximum]}
                        <div class="progression-manual-row"><span>Espacios de conjuro · nivel {slotLevel}</span><div><button type="button" aria-label={'Disminuir espacios nivel '+slotLevel} on:click={()=>adjustProgressionSpellSlot(slotLevel,-1)}>−</button><strong>{progressionResourceValue(sheet,'Espacios nivel '+slotLevel,slotMaximum)}</strong><button type="button" aria-label={'Aumentar espacios nivel '+slotLevel} on:click={()=>adjustProgressionSpellSlot(slotLevel,1)}>+</button></div></div>
                      {/each}
                    </div>
                  </section>
                  <section class="sheet-section progression-manual-panel">
                    <div class="sheet-section-title"><h3>Competencias</h3></div>
                    <div class="progression-manual-select-row"><label>Habilidad<select bind:value={progressionSkillChoice}><option value="">Seleccionar habilidad</option>{#each manualProgressionCompetencyChoices('skill') as option}<option value={option}>{option}</option>{/each}</select></label><button type="button" disabled={!progressionSkillChoice} on:click={()=>{addManualProgressionChoice('COMPETENCIAS','Skills',progressionSkillChoice);progressionSkillChoice='';}}>Añadir</button></div>
                    <div class="progression-manual-select-row"><label>Herramienta<select bind:value={progressionToolChoice}><option value="">Seleccionar herramienta</option>{#each manualProgressionCompetencyChoices('tool') as option}<option value={option}>{option}</option>{/each}</select></label><button type="button" disabled={!progressionToolChoice} on:click={()=>{addManualProgressionChoice('COMPETENCIAS','Herramientas',progressionToolChoice);progressionToolChoice='';}}>Añadir</button></div>
                    <div class="progression-manual-select-row"><label>Armadura o escudo<select bind:value={progressionArmorChoice}><option value="">Seleccionar competencia</option>{#each manualProgressionCompetencyChoices('armor') as option}<option value={option}>{option}</option>{/each}</select></label><button type="button" disabled={!progressionArmorChoice} on:click={()=>{addManualProgressionChoice('COMPETENCIAS','Armaduras',progressionArmorChoice);progressionArmorChoice='';}}>Añadir</button></div>
                    <div class="progression-manual-select-row"><label>Arma<select bind:value={progressionWeaponChoice}><option value="">Seleccionar competencia o maestría</option>{#each manualProgressionCompetencyChoices('weapon') as option}<option value={option}>{option}</option>{/each}</select></label><button type="button" disabled={!progressionWeaponChoice} on:click={()=>{addManualProgressionChoice('COMPETENCIAS','Armas',progressionWeaponChoice);addManualProgressionChoice('ATAQUES','Maestrías con armas',progressionWeaponChoice);progressionWeaponChoice='';}}>Añadir</button></div>
                    <div class="progression-manual-select-row"><label>Idioma<select bind:value={progressionLanguageChoice}><option value="">Seleccionar idioma</option>{#each manualProgressionCompetencyChoices('language') as option}<option value={option}>{option}</option>{/each}</select></label><button type="button" disabled={!progressionLanguageChoice} on:click={()=>{addManualProgressionChoice('COMPETENCIAS','Languages',progressionLanguageChoice);progressionLanguageChoice='';}}>Añadir</button></div>
                    {#each [{label:'Habilidades',section:'COMPETENCIAS',field:'Skills'},{label:'Herramientas',section:'COMPETENCIAS',field:'Herramientas'},{label:'Armaduras',section:'COMPETENCIAS',field:'Armaduras'},{label:'Armas',section:'COMPETENCIAS',field:'Armas'},{label:'Maestrías con armas',section:'ATAQUES',field:'Maestrías con armas'},{label:'Idiomas',section:'COMPETENCIAS',field:'Languages'}] as group}
                      {@const selected=manualProgressionList(sheet,group.section,group.field)}
                      {#if selected.length}<div class="progression-manual-chips"><strong>{group.label}</strong>{#each selected as item}<span>{item}<button type="button" aria-label={'Quitar '+item} on:click={()=>removeManualProgressionChoice(group.section,group.field,item)}>×</button></span>{/each}</div>{/if}
                    {/each}
                  </section>
                  <section class="sheet-section progression-manual-panel">
                    <div class="sheet-section-title"><h3>Dotes y rasgos</h3></div>
                    {#if manualProgressionSubclassOptions(sheet).length}
                      <div class="progression-manual-select-row"><label>Subclase<select bind:value={progressionSubclassChoice} on:change={()=>setManualProgressionSubclass(progressionSubclassChoice)}><option value="">Seleccionar subclase</option>{#each manualProgressionSubclassOptions(sheet) as option}<option value={option}>{formatSubclassName(option)}</option>{/each}</select></label></div>
                    {/if}
                    <div class="progression-manual-select-row"><label>Dote<select bind:value={progressionFeatChoice}><option value="">Seleccionar dote</option>{#each [...new Set([...BUILDER_FEATS,...BARBARIAN_GENERAL_FEATS,...BUILDER_EPIC_FEATS])] as option}<option value={option}>{option}</option>{/each}</select></label><button type="button" disabled={!progressionFeatChoice} on:click={()=>{addManualProgressionChoice('RASGOS Y DOTES','Dotes adicionales',progressionFeatChoice);progressionFeatChoice='';}}>Añadir</button></div>
                    <div class="progression-manual-select-row"><label>Rasgo de clase o subclase<select bind:value={progressionTraitChoice}><option value="">Seleccionar rasgo</option>{#each manualProgressionTraitOptions(sheet) as option}<option value={option}>{option}</option>{/each}</select></label><button type="button" disabled={!progressionTraitChoice} on:click={()=>{addManualProgressionChoice('RASGOS Y DOTES','Rasgos adicionales',progressionTraitChoice);progressionTraitChoice='';}}>Añadir</button></div>
                    {#each [{label:'Dotes',field:'Dotes adicionales'},{label:'Rasgos',field:'Rasgos adicionales'}] as group}
                      {@const selected=manualProgressionList(sheet,'RASGOS Y DOTES',group.field)}
                      {#if selected.length}<div class="progression-manual-chips"><strong>{group.label}</strong>{#each selected as item}<span>{item}<button type="button" aria-label={'Quitar '+item} on:click={()=>removeManualProgressionChoice('RASGOS Y DOTES',group.field,item)}>×</button></span>{/each}</div>{/if}
                    {/each}
                  </section>
                  <section class="sheet-section progression-manual-panel progression-economy-panel">
                    <div class="sheet-section-title"><h3>Monedas</h3></div>
                    <label class="progression-quantity">Cantidad por movimiento <input type="number" min="1" max="999999" bind:value={progressionCurrencyAmount}/></label>
                    <div class="progression-manual-list">
                      {#each PROGRESSION_CURRENCIES as currency}
                        <div class="progression-manual-row"><span>{currency.label} ({currency.key})</span><div><button type="button" aria-label={'Restar '+currency.label} on:click={()=>adjustProgressionCurrency(currency.key,-Math.max(1,Number(progressionCurrencyAmount)||1))}>−</button><strong>{progressionCurrencyValue(currency.key).toLocaleString('es-CL')}</strong><button type="button" aria-label={'Sumar '+currency.label} on:click={()=>adjustProgressionCurrency(currency.key,Math.max(1,Number(progressionCurrencyAmount)||1))}>+</button></div></div>
                      {/each}
                    </div>
                  </section>
                  <section class="sheet-section progression-manual-panel progression-rewards-panel">
                    <div class="sheet-section-title"><h3>Añadir recompensas</h3><span class="count">{ITEMS.length} objetos</span></div>
                    <p class="muted">Busca un objeto del catálogo y añádelo directamente al inventario. Las armas reconocidas también se incorporan a tus ataques.</p>
                    <div class="progression-reward-toolbar">
                      <label>Buscar objeto<input type="search" bind:value={progressionRewardSearch} placeholder="Nombre del objeto..."/></label>
                      <label>Tipo<select bind:value={progressionRewardType}><option value="">Todos</option>{#each itemTypes.filter(type=>type!=='Todos') as type}<option value={type}>{type}</option>{/each}</select></label>
                      <label>Cantidad<input type="number" min="1" max="999" bind:value={progressionRewardQuantity}/></label>
                    </div>
                    <div class="progression-reward-results">
                      {#each progressionRewardItems as item (item.name+' '+item.source)}
                        <article><div><strong>{item.name}</strong><small>{item.type} · {item.price} · {item.weight}</small></div><button type="button" on:click={()=>addProgressionReward(item)}>Añadir</button></article>
                      {/each}
                      {#if progressionRewardItems.length===0}<p class="muted">No se encontraron objetos.</p>{/if}
                    </div>
                    {#if progressionRewardItems.length===24}<small class="muted">Se muestran los primeros 24 resultados. Escribe para afinar la búsqueda.</small>{/if}
                  </section>
                  <section class="sheet-section progression-manual-panel progression-history-panel">
                    <div class="sheet-section-title"><h3>Registro de cambios</h3>{#if progressionChangeHistory().length}<button type="button" class="progression-undo-button" on:click={undoLastProgressionChange}>↶ Deshacer último</button>{/if}</div>
                    {#if progressionChangeHistory().length}
                      <div class="progression-history-list">
                        {#each progressionChangeHistory().slice(0,8) as entry}
                          <div><span>{entry.label}</span><small>{new Date(entry.at).toLocaleString('es-CL',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</small></div>
                        {/each}
                      </div>
                    {:else}
                      <p class="muted">Los cambios realizados desde este apartado aparecerán aquí.</p>
                    {/if}
                  </section>
                {:else if playerSheetTab !== 'Conjuros'}
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

  {#if levelUpEntry}
  <div class="level-up-overlay">
    <section class="level-up-panel">
              <div class="section-heading"><h2>Subir nivel · {levelUpEntry.sheet.name}</h2><span class="count">Nivel {Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1}</span></div>
              <p><strong>{getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')}</strong> · {getNextLevelFeatures(levelUpEntry)}.</p>
              {#if getClassFeaturesAtLevel(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase'),Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).length}
                <div class="subclass-level-preview"><strong>Rasgos de clase que se incorporarán</strong>{#each getClassFeaturesAtLevel(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase'),Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1) as feature}<div><b>{feature.name}</b><p>{feature.description}</p></div>{/each}</div>
              {/if}
              {#if getSpeciesLevelUnlock(levelUpEntry.sheet,Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).features.length || getSpeciesLevelUnlock(levelUpEntry.sheet,Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).spells.length}
                <div class="subclass-level-preview"><strong>Desbloqueo de especie</strong>{#each getSpeciesLevelUnlock(levelUpEntry.sheet,Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).features as feature}<div><b>{feature.name}</b><p>{feature.description}</p></div>{/each}{#if getSpeciesLevelUnlock(levelUpEntry.sheet,Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).spells.length}<p>Conjuros que se añadirán automáticamente: {getSpeciesLevelUnlock(levelUpEntry.sheet,Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).spells.join(', ')}.</p>{/if}</div>
              {/if}
              <div class="subclass-level-preview"><strong>Experiencia</strong><p>Experiencia acumulada: {getCharacterExperience(levelUpEntry.sheet).toLocaleString('es-CL')} PX. Se conservará al subir de nivel.</p><p>Umbral para nivel {Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1}: {(LEVEL_XP_THRESHOLDS[Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1] ?? 0).toLocaleString('es-CL')} PX.</p></div>
              {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Bárbaro' && getNextLevelRowSafe(levelUpEntry)?.resources}
                <div class="subclass-level-preview"><strong>Recursos que se actualizarán desde la tabla del Bárbaro</strong>{#each Object.entries(getNextLevelRowSafe(levelUpEntry)?.resources || {}) as resource}<p><b>{resource[0]}:</b> {resource[1]}</p>{/each}</div>
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
                {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Bardo' || getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Brujo' || getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Clérigo' || getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Druida' || (getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')!=='Hechicero' && Number(getNextLevelRowSafe(levelUpEntry)?.resources?.['Trucos']) > getCharacterNumber(levelUpEntry.sheet,'CONJUROS','Trucos máximos',0))}
                  {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Bardo'}
                    <label>Buscar trucos de Bardo<input bind:value={levelUpBardCantripSearch} placeholder="Filtra por nombre" /></label>
                    <div class="builder-choice-wrapper"><strong>Trucos de Bardo: {splitChoiceList(levelUpClassCantrips).length}/{Number(getNextLevelRowSafe(levelUpEntry)?.resources?.['Trucos']||0)}</strong><div class="builder-checkbox-grid" style="max-height:240px;overflow:auto">{#each getBardCantripOptions().filter(spell=>!levelUpBardCantripSearch || normalizeLevelText(spell).includes(normalizeLevelText(levelUpBardCantripSearch))) as spell}<label class="builder-checkbox"><input type="checkbox" checked={splitChoiceList(levelUpClassCantrips).some(name=>normalizeLevelText(name)===normalizeLevelText(spell))} on:change={(event)=>toggleBardClassSpellChoice(spell,event,'cantrip',Number(getNextLevelRowSafe(levelUpEntry)?.resources?.['Trucos']||0))} disabled={!splitChoiceList(levelUpClassCantrips).some(name=>normalizeLevelText(name)===normalizeLevelText(spell)) && splitChoiceList(levelUpClassCantrips).length>=Number(getNextLevelRowSafe(levelUpEntry)?.resources?.['Trucos']||0)} /><span>{spell}</span></label>{/each}</div></div>
                  {:else}
                    <label>Trucos de clase conocidos (lista completa){#if ['Brujo','Clérigo','Druida'].includes(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase'))} · puedes sustituir uno al subir de nivel{/if}<textarea bind:value={levelUpClassCantrips} rows="2" placeholder="Escribe todos los trucos de clase conocidos, separados por comas" /></label>
                  {/if}
                {/if}
                {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Bardo' || getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Brujo' || (getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')!=='Hechicero' && Number(getNextLevelRowSafe(levelUpEntry)?.resources?.['Conjuros preparados']) > getCharacterNumber(levelUpEntry.sheet,'CONJUROS','Conjuros preparados máximos',0))}
                  {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Bardo'}
                    <label>Buscar conjuros de Bardo<input bind:value={levelUpBardSpellSearch} placeholder="Filtra por nombre" /></label>
                    <div class="builder-choice-wrapper"><strong>Conjuros preparados de Bardo: {splitChoiceList(levelUpClassSpells).length}/{Number(getNextLevelRowSafe(levelUpEntry)?.resources?.['Conjuros preparados']||0)}</strong><div class="builder-checkbox-grid" style="max-height:300px;overflow:auto">{#each getBardPreparedSpellOptions(Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).filter(spell=>!levelUpBardSpellSearch || normalizeLevelText(spell).includes(normalizeLevelText(levelUpBardSpellSearch))) as spell}<label class="builder-checkbox"><input type="checkbox" checked={splitChoiceList(levelUpClassSpells).some(name=>normalizeLevelText(name)===normalizeLevelText(spell))} on:change={(event)=>toggleBardClassSpellChoice(spell,event,'spell',Number(getNextLevelRowSafe(levelUpEntry)?.resources?.['Conjuros preparados']||0))} disabled={!splitChoiceList(levelUpClassSpells).some(name=>normalizeLevelText(name)===normalizeLevelText(spell)) && splitChoiceList(levelUpClassSpells).length>=Number(getNextLevelRowSafe(levelUpEntry)?.resources?.['Conjuros preparados']||0)} /><span>{spell}</span></label>{/each}</div></div>
                  {:else}
                    <label>Conjuros de clase preparados/conocidos (lista completa){#if ['Brujo','Bardo'].includes(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase'))} · puedes sustituir uno al subir de nivel{/if}<textarea bind:value={levelUpClassSpells} rows="2" placeholder="Escribe la lista completa de conjuros de clase" /></label>
                  {/if}
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
                  <label>{primalSkillChoice?.label}<select bind:value={levelUpNewSkill}><option value="">Elige una habilidad nueva</option>{#each getLevelUpChoiceOptions(primalSkillChoice,splitChoiceList(getCharacterStat(levelUpEntry.sheet,'COMPETENCIAS','Skills'))) as skill}<option value={skill}>{skill}</option>{/each}</select></label>
                {:else}
                  <label>Nueva competencia en habilidad<input bind:value={levelUpNewSkill} placeholder="Elige una habilidad de la lista de tu clase" /></label>
                {/if}
              {/if}
              {#if getClassFeaturesAtLevel(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase'),Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).some((feature)=>normalizeLevelText(feature.name).includes('pericia') || /ganas pericia/.test(normalizeLevelText(feature.description))) }
                {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Bardo'}
                   <label>Primera habilidad para Pericia<select bind:value={levelUpBardExpertise1}><option value="">Elige una habilidad competente</option>{#each getBardExpertiseOptions(levelUpEntry.sheet,[levelUpBardExpertise2]) as skill}<option value={skill}>{skill}</option>{/each}</select></label>
                   <label>Segunda habilidad para Pericia<select bind:value={levelUpBardExpertise2}><option value="">Elige otra habilidad competente</option>{#each getBardExpertiseOptions(levelUpEntry.sheet,[levelUpBardExpertise1]) as skill}<option value={skill}>{skill}</option>{/each}</select></label>
                 {:else}
                   <label>Habilidades que obtienen Pericia (elige {getClassFeaturesAtLevel(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase'),Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).some((feature)=>normalizeLevelText(feature.name).includes('pericia'))?'dos':'una'})<input bind:value={levelUpExpertise} placeholder="Habilidades en las que ya tienes competencia" /></label>
                 {/if}
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
                <label>Habilidad de Estudioso de la guerra<select bind:value={levelUpSubclassSkill}><option value="">Elige una habilidad</option>{#each BUILDER_CLASS_SKILLS.Guerrero.options.filter(skill=>!splitChoiceList(getCharacterStat(levelUpEntry?.sheet||{},'COMPETENCIAS','Skills')).includes(skill)) as skill}<option>{skill}</option>{/each}</select></label>
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
              {#if normalizeLevelText(levelUpSubclass || getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Subclase'))==='colegio del conocimiento' && Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1===3}
                <div class="builder-choice-wrapper"><strong>Competencias adicionales del Colegio del Conocimiento</strong>
                  <label>Primera habilidad<select bind:value={levelUpCollegeKnowledgeSkill1}><option value="">Elige una habilidad</option>{#each getCollegeKnowledgeSkillOptions(levelUpEntry.sheet,[levelUpCollegeKnowledgeSkill2,levelUpCollegeKnowledgeSkill3]) as skill}<option value={skill}>{skill}</option>{/each}</select></label>
                  <label>Segunda habilidad<select bind:value={levelUpCollegeKnowledgeSkill2}><option value="">Elige una habilidad</option>{#each getCollegeKnowledgeSkillOptions(levelUpEntry.sheet,[levelUpCollegeKnowledgeSkill1,levelUpCollegeKnowledgeSkill3]) as skill}<option value={skill}>{skill}</option>{/each}</select></label>
                  <label>Tercera habilidad<select bind:value={levelUpCollegeKnowledgeSkill3}><option value="">Elige una habilidad</option>{#each getCollegeKnowledgeSkillOptions(levelUpEntry.sheet,[levelUpCollegeKnowledgeSkill1,levelUpCollegeKnowledgeSkill2]) as skill}<option value={skill}>{skill}</option>{/each}</select></label>
                </div>
              {/if}
              {#if normalizeLevelText(levelUpSubclass || getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Subclase'))==='colegio del conocimiento' && Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1>=6}
                <div class="builder-choice-wrapper"><strong>Descubrimientos mágicos (elige dos y conserva al menos uno al sustituir)</strong>
                  <label>Primer conjuro<select bind:value={levelUpBardDiscovery1}><option value="">Elige un truco o conjuro</option>{#each getBardMagicDiscoveryOptions(Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1) as spell}<option value={spell}>{spell}</option>{/each}</select></label>
                  <label>Segundo conjuro<select bind:value={levelUpBardDiscovery2}><option value="">Elige un truco o conjuro</option>{#each getBardMagicDiscoveryOptions(Number(getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Nivel'))+1).filter(spell=>normalizeLevelText(spell)!==normalizeLevelText(levelUpBardDiscovery1)) as spell}<option value={spell}>{spell}</option>{/each}</select></label>
                </div>
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
                  <div class="builder-choice-wrapper"><strong>Maestrías con armas: conserva las anteriores y añade las nuevas</strong><div class="builder-choice-field"><div class="builder-choice-heading"><strong>Armas cuerpo a cuerpo sencillas o marciales</strong><span>{splitChoiceList(levelUpWeaponMasteries).length}/{Number(getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestría con armas'] || getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestrías con armas'])}</span></div><div class="builder-checkbox-grid">{#each getLevelUpChoiceOptions(levelUpChoice('barbarian.weaponMastery')) as weapon}<label class="builder-checkbox"><input type="checkbox" checked={splitChoiceList(levelUpWeaponMasteries).some(value=>normalizeLevelText(value)===normalizeLevelText(weapon))} on:change={(event)=>toggleLevelUpWeaponMastery(weapon,event,Number(getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestría con armas'] || getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestrías con armas']))} disabled={splitChoiceList(getCharacterStat(levelUpEntry.sheet,'ATAQUES','Maestrías con armas')).some(value=>normalizeLevelText(value)===normalizeLevelText(weapon)) || (!splitChoiceList(levelUpWeaponMasteries).some(value=>normalizeLevelText(value)===normalizeLevelText(weapon)) && splitChoiceList(levelUpWeaponMasteries).length>=Number(getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestría con armas'] || getNextLevelRowSafe(levelUpEntry)?.resources?.['Maestrías con armas']))} /><span>{weapon}</span></label>{/each}</div></div></div>
                {:else}
                  <label>Maestrías con armas (lista completa)<input bind:value={levelUpWeaponMasteries} placeholder="Escribe todas las maestrías, separadas por comas" /></label>
                {/if}
              {/if}
              {#if String(getNextLevelFeatures(levelUpEntry)).toLowerCase().includes('mejora de característica')}
                <label>Tipo de mejora<select bind:value={levelUpAsiMode}><option value="asi">Aumentar características</option><option value="feat">Elegir una dote</option></select></label>
                {#if levelUpAsiMode==='asi'}
                  <div class="level-up-choice-grid"><label>Primera característica<select bind:value={levelUpAbility1}>{#each LEVEL_ABILITY_NAMES as ability}<option>{ability}</option>{/each}</select></label><label>Aumento<select bind:value={levelUpIncrease1}><option value="2">+2</option><option value="1">+1</option></select></label></div>
                  <div class="level-up-choice-grid"><label>Segunda característica<select bind:value={levelUpAbility2}>{#each LEVEL_ABILITY_NAMES as ability}<option>{ability}</option>{/each}</select></label><label>Aumento<select bind:value={levelUpIncrease2}><option value="0">No aplicar</option><option value="1">+1</option></select></label></div>
                {:else}
                  {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Bárbaro'}
                    <label>Dote general<select bind:value={levelUpFeat}><option value="">Elige una dote disponible</option>{#each getBarbarianGeneralFeatOptions(levelUpEntry.sheet) as feat}<option value={feat}>{feat}</option>{/each}</select></label>
                    {#if levelUpFeat}
                      <label>Característica que aumenta +1<select bind:value={levelUpGeneralFeatAbility}><option value="">Elige una característica</option>{#each (normalizeLevelText(levelUpFeat)==='resiliente'?getBarbarianResilientSaveOptions(levelUpEntry.sheet):getBarbarianFeatAbilityOptions(levelUpFeat)) as ability}<option value={ability}>{ability}</option>{/each}</select></label>
                      {#if ['mente aguda','observador'].includes(normalizeLevelText(levelUpFeat))}
                        <label>Habilidad de la dote<select bind:value={levelUpBarbarianFeatSkill}><option value="">Elige una habilidad</option>{#each getBarbarianFeatSkillOptions(levelUpFeat) as skill}<option value={skill}>{skill}</option>{/each}</select></label>
                      {/if}
                      {#if normalizeLevelText(levelUpFeat)==='experto en habilidades'}
                        <label>Habilidad nueva<select bind:value={levelUpBarbarianFeatSkill}><option value="">Elige una habilidad</option>{#each BUILDER_SKILL_OPTIONS as skill}<option value={skill}>{skill}</option>{/each}</select></label>
                        <label>Habilidad en la que obtienes Pericia<select bind:value={levelUpBarbarianFeatExpertise}><option value="">Elige una habilidad competente</option>{#each getBarbarianFeatExpertiseOptions(levelUpEntry.sheet,levelUpBarbarianFeatSkill) as skill}<option value={skill}>{skill}</option>{/each}</select></label>
                      {/if}
                      {#if ['influencia feerica','influencia sombria'].includes(normalizeLevelText(levelUpFeat))}
                        <label>Conjuro de nivel 1 de la dote<select bind:value={levelUpBarbarianFeatSpell}><option value="">Elige un conjuro</option>{#each getBarbarianFeatSpellOptions(levelUpFeat) as spell}<option value={spell}>{spell}</option>{/each}</select></label>
                      {/if}
                      {#if normalizeLevelText(levelUpFeat)==='maestro de armas'}
                        <label>Arma para la maestría adicional<select bind:value={levelUpBarbarianFeatWeaponMastery}><option value="">Elige un arma</option>{#each getBarbarianFeatWeaponMasteryOptions(levelUpEntry.sheet) as weapon}<option value={weapon}>{weapon}</option>{/each}</select></label>
                      {/if}
                    {/if}
                  {:else}<label>Dote elegida<input bind:value={levelUpFeat} placeholder="Nombre de la dote" /></label>{/if}

                {/if}
              {/if}
              {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Bárbaro' && ((normalizeLevelText(levelUpFeat)==='lanzador ritual' && levelUpAsiMode==='feat') || splitChoiceList(getCharacterStat(levelUpEntry.sheet,'RASGOS Y DOTES','Dotes adicionales')).some(feat=>normalizeLevelText(feat)==='lanzador ritual'))}
                <div class="builder-choice-wrapper"><strong>Conjuros rituales de Lanzador ritual (elige {Number(String(getNextLevelRowSafe(levelUpEntry)?.proficiency||'+2').replace('+',''))})</strong><div class="builder-checkbox-grid">{#each getBarbarianRitualSpellOptions() as spell}<label class="builder-checkbox"><input type="checkbox" checked={splitChoiceList(levelUpBarbarianFeatRituals).some(value=>normalizeLevelText(value)===normalizeLevelText(spell))} on:change={(event)=>toggleBarbarianFeatRitualSpell(spell,event,Number(String(getNextLevelRowSafe(levelUpEntry)?.proficiency||'+2').replace('+','')))} disabled={!splitChoiceList(levelUpBarbarianFeatRituals).some(value=>normalizeLevelText(value)===normalizeLevelText(spell)) && splitChoiceList(levelUpBarbarianFeatRituals).length>=Number(String(getNextLevelRowSafe(levelUpEntry)?.proficiency||'+2').replace('+',''))} /><span>{spell}</span></label>{/each}</div></div>
              {/if}
              {#if String(getNextLevelFeatures(levelUpEntry)).toLowerCase().includes('don épico')}
                <label>Don épico<select bind:value={levelUpFeat}><option value="">Elige un Don épico</option>{#each (getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')==='Bárbaro'?BUILDER_EPIC_FEATS.filter(feat=>normalizeLevelText(feat)!=='don del recuerdo de conjuros'):BUILDER_EPIC_FEATS) as feat}<option value={feat}>{feat}</option>{/each}</select></label>
                <label>Característica que aumenta +1<select bind:value={levelUpEpicFeatAbility}>{#each builderEpicFeatAbilities(levelUpFeat) as ability}<option value={ability}>{ability}</option>{/each}</select></label>
              {/if}
              {#if getCharacterStat(levelUpEntry.sheet,'PERSONAJE','Clase')!=='Bárbaro'}
                <label>Otras decisiones del rasgo (pericia, invocaciones, estilo de combate, conjuros, etc.)<textarea bind:value={levelUpDecision} rows="2" placeholder="Registra las elecciones realizadas para este nivel…" /></label>
              {/if}
              <p class="muted">Se conservarán los datos existentes. Los rasgos, recursos, elecciones de clase y desbloqueos de especie quedarán registrados en la ficha.</p>
              <div class="actions"><button class="secondary" on:click={closeLevelUp}>Cancelar</button><button class="primary" on:click={applyLevelUp}>Aplicar subida de nivel</button></div>
    </section>
  </div>
{/if}

  {#if notice}<button class="toast" on:click={() => notice = ''}>{notice}<span>×</span></button>{/if}
  <footer><span>FORJA DE AVENTUREROS · v1.0.53</span></footer>
</div>

<style>
  :global(:root){--paper:#13262e;--paper-deep:#1b2a33;--ink:#ffffff;--ink-soft:#b5bec3;--rule:#3a4a52;--red:#3fb8b8;--gold:#5fe6e0}
  .builder-panel{display:grid;gap:.8rem}.builder-panel>label{display:grid;gap:.3rem;color:var(--ink-soft);font:600 .76rem system-ui,sans-serif}.builder-panel input,.builder-panel select,.builder-panel textarea{box-sizing:border-box;width:100%;padding:.65rem;border:1px solid var(--rule);border-radius:5px;background:#1b2a33;color:var(--ink);font: .9rem system-ui,sans-serif}.builder-panel h3{margin:.2rem 0;color:var(--red);font:700 1rem Georgia,serif}.builder-progress{height:5px;border-radius:5px;background:#1b2a33;overflow:hidden}.builder-progress span{display:block;height:100%;background:var(--gold);transition:width .2s} .builder-portrait-picker{padding:.8rem;border:1px solid var(--rule);border-radius:5px;background:rgba(95,230,224,.18)}.builder-portrait-heading{display:flex;align-items:center;justify-content:space-between;gap:.6rem;margin-bottom:.7rem}.builder-portrait-heading button{border:1px solid var(--rule);border-radius:4px;padding:.35rem .6rem;background:transparent;color:var(--ink-soft);font:600 .72rem system-ui,sans-serif;cursor:pointer}.builder-portrait-heading button.active{border-color:var(--gold);color:var(--gold)}.builder-portrait-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:.55rem}.builder-portrait-option{position:relative;aspect-ratio:1;border:2px solid var(--rule);border-radius:5px;padding:0;overflow:hidden;background:#17232b;cursor:pointer}.builder-portrait-option.selected{border-color:var(--gold);box-shadow:0 0 0 2px rgba(213,174,91,.25)}.builder-portrait-option img{display:block;width:100%;height:100%;object-fit:cover}.builder-portrait-check{position:absolute;right:.25rem;top:.25rem;width:1.35rem;height:1.35rem;border-radius:50%;background:var(--gold);color:#17232b;font-weight:800;display:grid;place-items:center}.portrait-frame img{width:100%;height:100%;object-fit:cover;border-radius:inherit}.builder-info{padding:.7rem .8rem;border:1px solid var(--rule);border-left:3px solid var(--gold);border-radius:4px;background:rgba(95,230,224,.4);font:.82rem/1.5 system-ui,sans-serif}.builder-info p{margin:.3rem 0}.builder-info small{color:var(--ink-soft)}.builder-actions{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:flex-end;margin-top:.7rem}.builder-actions button{min-height:38px}/* La hoja de personaje conserva su propia cuadrícula; no hereda el diseño del formulario de creación. */
  .master-tabs{display:flex;gap:.4rem;overflow-x:auto;padding:.2rem 0 .7rem;margin:.8rem 0;border-bottom:1px solid var(--rule)}
  .master-tabs button{flex:0 0 auto;border:1px solid var(--rule);border-radius:5px;padding:.55rem .8rem;background:#1b2a33;color:var(--ink-soft);font:600 .75rem system-ui,sans-serif;cursor:pointer}
  .master-tabs button.active{background:var(--ink);border-color:var(--ink);color:var(--paper)}
  .subclass-level-preview{padding:.7rem;border:1px solid var(--rule);border-radius:4px;background:rgba(0,0,0,.04);display:grid;gap:.5rem}.subclass-level-preview p{white-space:pre-wrap;margin:.25rem 0;font-size:.82rem;line-height:1.4}.progression-manual-select-row{display:flex;align-items:end;gap:.55rem;margin:.55rem 0}.progression-manual-select-row label{display:grid;gap:.25rem;flex:1;min-width:0;color:var(--ink-soft);font-size:.78rem}.progression-manual-select-row select{width:100%;min-width:0;padding:.42rem .5rem;border:1px solid var(--rule);border-radius:4px;background:var(--paper-deep);color:var(--ink);font:inherit}.progression-manual-select-row>button{padding:.45rem .7rem;border:1px solid var(--rule);border-radius:4px;background:var(--paper-deep);color:var(--gold);font:inherit;cursor:pointer}.progression-manual-select-row>button:disabled{opacity:.4;cursor:not-allowed}.progression-manual-chips{display:flex;flex-wrap:wrap;align-items:center;gap:.35rem;margin:.65rem 0;padding-top:.5rem;border-top:1px solid var(--rule)}.progression-manual-chips>strong{width:100%;font-size:.78rem;color:var(--ink-soft)}.progression-manual-chips>span{display:inline-flex;align-items:center;gap:.3rem;padding:.2rem .4rem;border:1px solid var(--rule);border-radius:4px;font-size:.75rem}.progression-manual-chips button{border:0;background:transparent;color:var(--gold);font-size:1rem;line-height:1;cursor:pointer}.progression-manual-list{display:grid;gap:0}.progression-manual-row{display:flex;align-items:center;justify-content:space-between;gap:.8rem;padding:.48rem .1rem;border-bottom:1px solid var(--rule);font:.82rem system-ui,sans-serif}.progression-manual-row>span{color:var(--ink-soft)}.progression-manual-row>div{display:flex;align-items:center;gap:.55rem}.progression-manual-row strong{min-width:3.4rem;text-align:center;color:var(--ink);font-variant-numeric:tabular-nums}.progression-manual-row button{width:1.8rem;height:1.8rem;padding:0;border:1px solid var(--rule);border-radius:4px;background:var(--paper-deep);color:var(--gold);font-size:1rem;font-weight:700;cursor:pointer}.progression-manual-row button:hover{border-color:var(--gold);background:rgba(95,230,224,.12)}
  .progression-edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
  .progression-edit-grid label{display:grid;gap:4px;color:var(--ink-soft);font-size:11px}
  .progression-edit-grid input,.progression-edit-grid select{min-width:0;box-sizing:border-box;width:100%;padding:7px;border:1px solid var(--rule);border-radius:5px;background:var(--paper-deep);color:var(--ink)}
  .progression-edit-value{grid-column:1/-1}
  .progression-edit-grid button{justify-self:start}
  .progression-quantity{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:8px 0;color:var(--ink-soft);font-size:12px}
  .progression-quantity input,.progression-reward-toolbar input,.progression-reward-toolbar select{min-width:0;box-sizing:border-box;padding:7px;border:1px solid var(--rule);border-radius:5px;background:var(--paper-deep);color:var(--ink)}
  .progression-quantity input{width:100px}
  .progression-reward-toolbar{display:grid;grid-template-columns:minmax(0,1fr) minmax(120px,.5fr) 85px;gap:8px;margin:10px 0}
  .progression-reward-toolbar label{display:grid;gap:4px;color:var(--ink-soft);font-size:11px}
  .progression-reward-results{display:grid;gap:5px;max-height:340px;overflow:auto}
  .progression-reward-results article{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px;border-bottom:1px solid var(--rule)}
  .progression-reward-results article>div{display:grid;gap:2px;min-width:0}
  .progression-reward-results strong{font-size:12px;color:var(--ink)}
  .progression-reward-results small,.progression-history-list small{font-size:10px;color:var(--ink-soft)}
  .progression-reward-results button,.progression-undo-button{padding:6px 9px;border:1px solid var(--gold);border-radius:5px;background:var(--paper-deep);color:var(--gold);font-size:11px;font-weight:800;white-space:nowrap}
  .progression-history-list{display:grid;gap:0}
  .progression-history-list>div{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--rule);font-size:12px;color:var(--ink-soft)}
  .progression-history-list small{white-space:nowrap}
  @media(max-width:480px){.progression-reward-toolbar{grid-template-columns:1fr 1fr}.progression-reward-toolbar label:first-child{grid-column:1/-1}.progression-history-list>div{align-items:flex-start;flex-direction:column}
  .progression-manual-row{font-size:.75rem}.progression-manual-row>div{gap:.3rem}.progression-manual-row strong{min-width:2.8rem}} .level-up-overlay{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:1rem;box-sizing:border-box;background:rgba(0,0,0,.76);overflow:auto}.level-up-overlay .level-up-panel{width:min(900px,100%);max-height:calc(100vh - 2rem);overflow:auto;box-sizing:border-box;margin:0}.level-up-trigger{padding:0;border:0;background:transparent;color:inherit;font:inherit;cursor:default}.progression-level-trigger{min-width:2rem;padding:.25rem .45rem;border:1px solid var(--gold);border-radius:4px;background:rgba(255,211,78,.14);color:var(--gold);font:700 .85rem system-ui,sans-serif;cursor:pointer}.progression-level-trigger:hover,.progression-level-trigger:focus-visible{background:var(--gold);color:var(--paper);outline:2px solid var(--gold);outline-offset:2px}.level-up-trigger:focus-visible{outline:2px solid var(--gold);outline-offset:3px}.level-up-panel{margin-top:1rem;padding:1rem;border:1px solid var(--red);border-radius:6px;background:var(--paper-deep);display:grid;gap:.65rem}.level-up-panel label{display:grid;gap:.3rem;color:var(--ink-soft);font:600 .78rem system-ui,sans-serif}.level-up-panel input,.level-up-panel select,.level-up-panel textarea{box-sizing:border-box;width:100%;padding:.55rem;border:1px solid var(--rule);border-radius:4px;background:#1b2a33;color:#ffffff;font:500 .85rem system-ui,sans-serif}.level-up-choice-grid{display:grid;grid-template-columns:2fr 1fr;gap:.5rem}.level-up-action{margin:.35rem 0 .6rem}  .items-panel{display:grid;gap:.75rem}.items-search,.items-filters label{display:grid;gap:.35rem;color:var(--ink-soft);font:600 .78rem system-ui,sans-serif}.items-search input,.items-filters input,.items-filters select{box-sizing:border-box;width:100%;min-width:0;padding:.55rem .6rem;border:1px solid var(--gold);border-radius:4px;background:#1b2a33;color:#ffffff;font:500 .85rem system-ui,sans-serif}.items-filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.6rem}.items-filters fieldset{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.45rem;min-width:0;margin:0;padding:.55rem;border:1px solid var(--rule);border-radius:5px}.items-filters legend{padding:0 .25rem;color:var(--ink-soft);font:700 .75rem system-ui,sans-serif}.items-table-wrap{overflow-x:auto}.items-table{width:100%;border-collapse:collapse;font:.8rem system-ui,sans-serif}.items-table th,.items-table td{padding:.55rem .45rem;border-bottom:1px solid var(--rule);text-align:left;vertical-align:top}.items-table th{position:sticky;top:0;background:var(--paper-deep);color:var(--ink)}.items-table td{color:var(--ink-soft)}.items-table td:first-child{color:var(--ink);font-weight:650}@media(max-width:650px){.items-filters{grid-template-columns:1fr}.items-table{min-width:560px}}
.spells-panel{margin-top:.5rem}
  .spell-search,.spell-filters label{display:grid;gap:.35rem;margin:.7rem 0;padding:.65rem .75rem;border:1px solid var(--rule);border-radius:5px;background:var(--paper);color:var(--ink);font:700 .78rem system-ui,sans-serif}
  .spell-search input,.spell-filters select{box-sizing:border-box;width:100%;min-width:0;padding:.5rem .6rem;border:1px solid var(--gold);border-radius:4px;background:#1b2a33;color:var(--ink);font:500 .82rem system-ui,sans-serif}
  .spell-filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.5rem}
  .spell-list{display:grid;gap:.55rem;margin-top:.7rem}
  .spell-card{min-width:0;border:1px solid var(--rule);border-left:4px solid #3fb8b8;border-radius:5px;background:var(--paper);color:var(--ink);overflow:hidden}
  .spell-card>summary{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.2rem .7rem;align-items:center;padding:.7rem .8rem;cursor:pointer;list-style:none}
  .spell-card>summary::-webkit-details-marker{display:none}
  .spell-name{font:700 .95rem Georgia,serif;overflow-wrap:anywhere}
  .spell-level{grid-column:2;grid-row:1/3;align-self:center;padding:.25rem .45rem;border:1px solid var(--gold);border-radius:4px;color:#3fb8b8;font:700 .68rem system-ui,sans-serif;white-space:nowrap}
  .spell-subtitle{grid-column:1;color:var(--ink-soft);font:.7rem system-ui,sans-serif;overflow-wrap:anywhere}
  .spell-details{padding:.75rem .85rem;border-top:1px solid var(--rule);font:.78rem/1.5 system-ui,sans-serif}
  .spell-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.15rem .75rem;padding:.55rem .65rem;border:1px solid var(--rule);border-radius:4px;background:#1b2a33}
  .spell-meta p{margin:.12rem 0;overflow-wrap:anywhere}
  .spell-description{margin:.7rem 0 0;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55}
  .spell-source{display:block;margin-top:.6rem;color:var(--ink-soft);font-size:.65rem}
  .monsters-panel{margin-top:.5rem}
  .monster-filter{display:flex;align-items:center;gap:.65rem;margin:.8rem 0;padding:.65rem .75rem;border:1px solid var(--rule);border-radius:5px;background:var(--paper);color:var(--ink);font:700 .78rem system-ui,sans-serif}
  .monster-filter select{min-width:130px;padding:.45rem .6rem;border:1px solid var(--gold);border-radius:4px;background:#1b2a33;color:var(--ink);font:600 .78rem system-ui,sans-serif}
  .monster-list{display:grid;gap:.55rem}
  .monster-card{border:1px solid var(--rule);border-left:4px solid var(--red);border-radius:5px;background:var(--paper);color:var(--ink);overflow:hidden}
  .monster-card>summary{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.18rem .7rem;align-items:center;padding:.7rem .8rem;cursor:pointer;list-style:none}
  .monster-card>summary::-webkit-details-marker{display:none}
  .monster-name{font:700 .95rem Georgia,serif}
  .monster-subtitle{grid-column:1;color:var(--ink-soft);font:.7rem system-ui,sans-serif}
  .monster-cr{grid-column:2;grid-row:1/3;align-self:center;padding:.25rem .45rem;border:1px solid var(--gold);border-radius:4px;color:#3fb8b8;font:700 .68rem system-ui,sans-serif}
  .class-progression-panel{min-width:0}
  .class-progression-caption{margin:4px 0 12px;font-size:12px}
  .class-progression-scroll{width:100%;max-width:100%;overflow-x:auto;border:1px solid var(--gm-border);border-radius:8px;overscroll-behavior-x:contain}
  .class-progression-table{width:100%;min-width:760px;border-collapse:separate;border-spacing:0;background:var(--gm-card);font-size:12px}
  .class-progression-table th,.class-progression-table td{padding:9px 10px;border-right:1px solid var(--gm-border);border-bottom:1px solid var(--gm-border);text-align:center;vertical-align:middle;white-space:nowrap}
  .class-progression-table thead th{position:sticky;top:0;z-index:2;background:#172b34;color:#d7e5e8;font-size:11px;font-weight:800;line-height:1.35}
  .class-progression-table thead th:first-child,.class-progression-table tbody th{position:sticky;left:0;z-index:1;background:#172b34;color:#fff;font-weight:900}
  .class-progression-table thead th:first-child{z-index:3}
  .class-progression-table tbody tr:nth-child(even){background:rgba(255,255,255,.025)}
  .class-progression-table .class-progression-features{text-align:left;white-space:normal;min-width:220px;line-height:1.4}
  .class-progression-table tr.current-level td,.class-progression-table tr.current-level th{background:rgba(62,183,151,.2);box-shadow:inset 0 1px #4ec7a4,inset 0 -1px #4ec7a4}
  .class-progression-table tr.next-level td,.class-progression-table tr.next-level th{background:rgba(242,198,109,.1)}
  .class-progression-table tr:last-child td,.class-progression-table tr:last-child th{border-bottom:0}
  .class-progression-table th:last-child,.class-progression-table td:last-child{border-right:0}
  .monster-statblock{padding:.8rem;border-top:1px solid var(--rule);font:.78rem/1.45 system-ui,sans-serif}
  .monster-heading{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.3rem;padding-bottom:.45rem;border-bottom:2px solid var(--red)}
  .monster-heading h3{margin:0;font:700 1.05rem Georgia,serif}
  .monster-heading span{color:var(--ink-soft);font-size:.7rem}
  .monster-combat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.35rem;margin:.65rem 0}
  .monster-combat-grid div{display:grid;gap:.12rem;padding:.4rem;border:1px solid var(--rule);border-radius:4px;background:#1b2a33}
  .monster-combat-grid small{color:var(--ink-soft);font-size:.62rem;text-transform:uppercase}
  .monster-combat-grid strong{font-size:.78rem;overflow-wrap:anywhere}
  .monster-statblock p{margin:.38rem 0}
  .monster-original{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font: .76rem/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--ink);}
  .monster-attacks{margin-top:.65rem;padding:.55rem;border:1px solid var(--rule);border-radius:4px;background:rgba(95,230,224,.4)}
  .monster-role{padding:.5rem;border-left:3px solid var(--gold);background:rgba(95,230,224,.1)}
  .monster-source{display:block;margin-top:.55rem;color:var(--ink-soft);font-size:.62rem}

  .monster-info-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.4rem;margin:.1rem 0 .75rem}
  .monster-info-item{display:grid;align-content:start;gap:.12rem;padding:.45rem .5rem;border:1px solid var(--rule);border-radius:4px;background:#1b2a33;min-width:0}
  .monster-info-item small{font-size:.62rem;font-weight:800;letter-spacing:.035em;text-transform:uppercase;color:var(--ink-soft)}
  .monster-info-item strong{font-size:.76rem;font-weight:650;overflow-wrap:anywhere;white-space:pre-wrap}
  .monster-content-section{margin:.75rem 0 0;padding-top:.45rem;border-top:2px solid var(--red)}
  .monster-content-section h4{margin:0 0 .4rem;font:700 .86rem Georgia,serif;text-transform:uppercase;letter-spacing:.04em;color:var(--red)}
  .monster-entry{margin:.35rem 0;padding:.45rem .55rem;border-left:3px solid var(--gold);background:rgba(95,230,224,.42);border-radius:0 4px 4px 0}
  .monster-entry strong{font-size:.78rem;color:var(--ink)}
  .monster-entry p{margin:.12rem 0 0;line-height:1.48;white-space:pre-wrap;overflow-wrap:anywhere}
  @media(max-width:560px){.monster-info-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.monster-card>summary{padding:.6rem}.monster-statblock{padding:.6rem}}

  .monster-attribution{margin-top:1rem;padding-top:.7rem;border-top:1px solid var(--rule);color:var(--ink-soft);font:.65rem/1.45 system-ui,sans-serif}
  .character-sheet{background:var(--paper);color:var(--ink);border:1px solid #b5bec3;border-radius:10px;padding:clamp(.65rem,2vw,1.25rem);box-shadow:0 12px 32px rgba(0,0,0,.22);font-family:Georgia,'Times New Roman',serif}
  .character-sheet > .sheet-banner{display:block;min-height:0;height:auto;padding:0!important;margin:0 0 .5rem!important;border:0!important;outline:0!important;background:none!important;box-shadow:none!important;text-align:center}
  .character-sheet > .sheet-banner .character-name{display:block;width:100%;min-height:0;margin:0!important;padding:0!important;border:0!important;outline:0!important;background:none!important;color:#ffffff!important;font:700 1.25rem/1.2 Georgia,serif;text-align:center}
  .sheet-notes{display:block;width:100%;margin-top:.35rem;font:.78rem/1.4 system-ui,sans-serif;text-align:center;color:var(--ink-soft)}
  .editable{box-sizing:border-box;border:1px solid transparent;border-radius:3px;background:transparent;color:inherit;min-width:0;padding:.16rem .22rem;resize:vertical}
  .editable:hover{border-color:rgba(63,184,184,.35);background:rgba(95,230,224,.22)}
  .editable:focus{outline:1px solid var(--red);border-color:var(--red);background:#1b2a33}
  .sheet-tabs{display:flex;gap:.35rem;overflow-x:auto;padding:.15rem 0 .65rem;margin-bottom:.7rem;border-bottom:1px solid var(--rule)}
  .sheet-tabs button{flex:0 0 auto;border:1px solid var(--rule);border-radius:5px;padding:.48rem .68rem;background:#1b2a33;color:var(--ink-soft);font:600 .72rem system-ui,sans-serif;cursor:pointer}
  .sheet-tabs button.active{background:var(--ink);border-color:var(--ink);color:var(--paper)}
  .custom-rolls{padding:.8rem;border:1px solid var(--rule);border-top:3px solid var(--gold);border-radius:5px;background:rgba(95,230,224,.43);color:var(--ink)}
  .custom-rolls h3{margin:0 0 .75rem;color:var(--red);font:700 .9rem system-ui,sans-serif;text-transform:uppercase;letter-spacing:.04em}
  .roll-creator{display:grid;grid-template-columns:minmax(0,2fr) minmax(5rem,1fr) minmax(5rem,1fr) auto;gap:.55rem;align-items:end}
  .roll-creator label{display:grid;gap:.25rem;color:var(--ink-soft);font:600 .7rem system-ui,sans-serif}
  .roll-creator input,.roll-creator select{width:100%;min-width:0;box-sizing:border-box;padding:.55rem;border:1px solid var(--rule);border-radius:4px;background:#1b2a33;color:var(--ink);font:.85rem system-ui,sans-serif}
  .roll-creator button,.roll-actions button{min-height:30px;padding:.32rem .55rem;border:1px solid var(--rule);border-radius:4px;background:#1b2a33;color:var(--ink);font:600 .68rem system-ui,sans-serif;cursor:pointer}
  .roll-creator button{background:var(--ink);color:var(--paper);border-color:var(--ink)}
  .custom-roll-list{display:grid;gap:.55rem;margin-top:.9rem}
  .custom-roll-card{padding:.65rem;border:1px solid var(--rule);border-radius:5px;background:rgba(95,230,224,.45)}
  .custom-roll-info,.roll-part-heading{display:flex;justify-content:space-between;gap:.5rem;align-items:center;margin-bottom:.4rem;color:var(--ink)}
  .custom-roll-info .remove-roll,.new-roll-part-title .remove-roll{border:0;background:transparent;color:var(--red);font-size:1rem;cursor:pointer}
  .roll-notation{display:inline-block;padding:.22rem .5rem;border:1px solid #5fe6e0;border-radius:4px;background:#1b2a33;color:#0f1e26;font:700 .9rem/1.2 system-ui,sans-serif;letter-spacing:.025em}
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
  .roll-result{display:block;margin-top:.5rem;padding:.45rem .55rem;border-radius:4px;background:#1b2a33;color:var(--ink);font:700 .82rem system-ui,sans-serif}
  .sheet-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem;align-items:start}
  .sheet-section{min-width:0;padding:.7rem .8rem .65rem;border:1px solid var(--rule);border-top:3px solid var(--red);border-radius:5px;background:rgba(95,230,224,.43);break-inside:avoid}
  .sheet-section-title{display:flex;align-items:center;padding-bottom:.4rem;margin-bottom:.25rem;border-bottom:1px solid var(--rule)}
  .section-name{width:100%;color:var(--red);font:700 .88rem/1.2 system-ui,sans-serif;letter-spacing:.045em;text-transform:uppercase}
  .stats-list{display:grid;grid-template-columns:1fr}
  .sheet-stat{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:.45rem;align-items:center;padding:.35rem .02rem;border-bottom:1px solid rgba(63,184,184,.24)}
  .sheet-stat:last-child{border-bottom:0}
  .stat-label{width:100%;color:var(--ink-soft);font:.73rem/1.35 system-ui,sans-serif}
  .stat-value{width:100%;min-height:3.2rem;color:var(--ink);text-align:left;font:500 .8rem/1.45 system-ui,sans-serif;overflow-wrap:anywhere;white-space:pre-wrap;overflow-y:auto;resize:vertical;padding:.35rem .4rem;background:rgba(95,230,224,.3)}\n  .features-section .sheet-stat{grid-template-columns:1fr;gap:.2rem;align-items:start}\n  .features-section .stat-label{font-weight:700;color:var(--ink)}\n  .features-section .stat-value{min-height:7rem;text-align:left;font:500 .82rem/1.5 system-ui,sans-serif;background:rgba(95,230,224,.48)}\n  .gm-character-sheet .sheet-stat strong{min-width:0;white-space:pre-wrap;overflow-wrap:anywhere;font:500 .8rem/1.45 system-ui,sans-serif}
  .combat-section{border-top-color:#0f1e26;background:#1b2a33}
  .combat-section .section-name{color:#0f1e26}
  .attributes-section{grid-column:1/-1;border-top-color:var(--gold);background:#1b2a33}
  .attributes-section .section-name{color:#3fb8b8}
  .attributes-section .stats-list{grid-template-columns:repeat(3,minmax(0,1fr));column-gap:.65rem}
  .attributes-section .sheet-stat{grid-template-columns:1fr;gap:.1rem;text-align:center;padding:.4rem .15rem;border:1px solid rgba(63,184,184,.25);margin:.12rem;border-radius:4px;background:rgba(95,230,224,.38)}
  .attributes-section .stat-label{text-align:center;text-transform:uppercase;font-size:.64rem;letter-spacing:.05em}
  .attributes-section .stat-value{text-align:center;font:700 1rem/1.3 Georgia,serif}
  .skills-section{border-top-color:#3fb8b8}
  .features-section{border-top-color:#b5bec3}
  .features-section .section-name{color:#3fb8b8}
  .magic-section{border-top-color:#3fb8b8}
  .magic-section .section-name{color:#3fb8b8}
  .equipment-section{border-top-color:#3fb8b8}
  .story-section{border-top-color:#b5bec3}
  .general-section{border-top-color:#b5bec3}
  .import-character-panel{margin-bottom:.8rem}
  .main.gm-layout{max-width:1180px}
  .gm-sheet-details{grid-column:1/-1;width:100%;min-width:0;margin-top:.7rem}
  .gm-sheet-details summary{cursor:pointer;color:#b5bec3;padding:.7rem .2rem;font:600 .85rem system-ui,sans-serif}
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
  .gm-character-sheet .features-section .sheet-stat strong{padding:.35rem .5rem;border-radius:4px;background:rgba(95,230,224,.5)}
  .gm-sheet-details[open] .gm-character-sheet{width:100%;box-sizing:border-box}
  .chest-panel{margin-top:1rem}.chest-roll-actions{display:flex;justify-content:flex-start;margin:.8rem 0}.chest-result{display:grid;grid-template-columns:auto 1fr auto;gap:.75rem;align-items:center;padding:.85rem 1rem;margin:.75rem 0;border:1px solid var(--gold);border-radius:6px;background:#1b2a33;color:var(--ink)}.chest-result-number{font:700 .72rem system-ui,sans-serif;color:var(--red)}.chest-result strong{font:700 1rem Georgia,serif}.chest-result>span:last-child{font:.72rem system-ui,sans-serif;color:var(--ink-soft)}.chest-table-wrap{max-height:440px;overflow:auto;border:1px solid var(--rule);border-radius:5px}.chest-table{width:100%;border-collapse:collapse;background:rgba(95,230,224,.4);font:.78rem system-ui,sans-serif}.chest-table th{position:sticky;top:0;background:#1b2a33;color:var(--ink);text-align:left}.chest-table th,.chest-table td{padding:.42rem .6rem;border-bottom:1px solid rgba(63,184,184,.2)}.chest-table td:first-child{width:3.5rem;color:var(--ink-soft);font-variant-numeric:tabular-nums}.chest-selected{background:#1b2a33;font-weight:700}
  .empty-state{text-align:center;padding:2rem}.save-panel{display:flex;flex-direction:column;gap:.8rem;margin-top:1rem}
  .save-panel .danger-text{align-self:center}
  .roster-panel{margin-top:1rem}.card-identity{min-width:0}
  @media(max-width:650px){.roll-creator{grid-template-columns:1fr 1fr}.roll-creator label:first-child{grid-column:1/-1}.roll-creator button{grid-column:1/-1}}
  @media(max-width:560px){.sheet-grid{grid-template-columns:1fr}.attributes-section{grid-column:auto}.attributes-section .stats-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(min-width:900px){.sheet-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.attributes-section{grid-column:1/-1}}

  /* Tema oscuro carmesí de la extensión */
  :global(.app-shell),:global(.main){color:#ffffff}
  :global(.topbar){border-bottom:1px solid #3fb8b8}
  :global(.brand),:global(.brand strong){color:#ffffff}
  :global(.brand-mark){color:#3fb8b8}
  :global(.panel),:global(.character-sheet),:global(.sheet-section),:global(.custom-rolls),
  :global(.custom-roll-card),:global(.trait-editor),:global(.import-box),:global(.new-roll-part),
  :global(.spell-card),:global(.monster-card),:global(.chest-result),:global(.roll-result){
    background:#0b171d!important;color:#ffffff!important;border-color:#3fb8b8!important
  }
  :global(.panel){box-shadow:0 8px 24px rgba(0,0,0,.35)}
  :global(.sheet-section){border:1px solid #3fb8b8!important;border-top:3px solid #3fb8b8!important}
  :global(.section-heading h2),:global(.panel h2),:global(.sheet-section-title h3),
  :global(.section-name),:global(.monster-heading h3),:global(.custom-rolls h3),
  :global(.trait-group h3),:global(.character-name){color:#ffffff!important}
  :global(label),:global(.stat-label),:global(.stat-value),:global(.sheet-stat strong),
  :global(.character-sheet),:global(.spell-details),:global(.monster-statblock),
  :global(.trait-view strong),:global(.roll-part-heading strong){color:#b5bec3!important}
  :global(.muted),:global(.hint),:global(.spell-subtitle),:global(.monster-subtitle),
  :global(.monster-source),:global(.spell-source),:global(.sheet-notes){color:#b5bec3!important}
  :global(input),:global(textarea),:global(select),:global(.builder-panel input),
  :global(.builder-panel select),:global(.builder-panel textarea){
    background:#0b171d!important;color:#ffffff!important;border:1px solid #3fb8b8!important
  }
  :global(input::placeholder),:global(textarea::placeholder){color:#b5bec3!important}
  :global(input:focus),:global(textarea:focus),:global(select:focus),:global(.editable:focus){
    outline:1px solid #3fb8b8!important;border-color:#3fb8b8!important;background:#0b171d!important
  }
  :global(.master-tabs),:global(.sheet-tabs){border-bottom-color:#3fb8b8}
  :global(.master-tabs button),:global(.sheet-tabs button),:global(.player-tabs button),
  :global(.character-tabs button),:global(.secondary),:global(.roll-actions button),
  :global(.roll-creator button),:global(.add-roll-part){
    background:#0b171d!important;color:#b5bec3!important;border:1px solid #3fb8b8!important
  }
  :global(.master-tabs button.active),:global(.sheet-tabs button.active),
  :global(.player-tabs button.active),:global(.character-tabs button.active){
    background:#13262e!important;border-color:#3fb8b8!important;color:#ffffff!important
  }
  :global(.primary){background:#13262e!important;border:1px solid #3fb8b8!important;color:#ffffff!important}
  :global(.primary:hover){background:#13262e!important}
  :global(.danger-text),:global(.remove-roll){color:#5fe6e0!important}
  :global(.spell-level),:global(.monster-cr),:global(.count),:global(.free-tag){
    background:#13262e!important;border-color:#3fb8b8!important;color:#b5bec3!important
  }
  :global(.spell-meta),:global(.monster-combat-grid div),:global(.monster-attacks),
  :global(.monster-role),:global(.builder-info),:global(.builder-progress){
    background:#0b171d!important;border-color:#3fb8b8!important;color:#b5bec3!important
  }
  :global(.builder-progress span){background:#13262e!important}
  :global(.roll-notation){background:#13262e!important;border-color:#3fb8b8!important;color:#ffffff!important}
  :global(.chest-table-wrap){border-color:#3fb8b8!important}
  :global(.chest-table){background:#0b171d!important;color:#b5bec3!important}
  :global(.chest-table th){background:#13262e!important;color:#ffffff!important}
  :global(.chest-table td){border-bottom-color:#3fb8b8!important;color:#b5bec3!important}
  :global(.chest-selected){background:#13262e!important;color:#ffffff!important}
  :global(.toast){background:#13262e!important;border-color:#3fb8b8!important;color:#ffffff!important}
  :global(.sheet-stat),:global(.roll-entry),:global(.trait-view),:global(.traits-preview){border-color:#3fb8b8!important}
  :global(.gm-sheet-details summary),:global(.monster-source summary){color:#5fe6e0!important}
  :global(.character-sheet .features-section .sheet-stat strong){background:#0b171d!important}
  /* Los nombres y descripciones conservan el color neutro de la ficha; el rojo se usa solo en acentos. */
  :global(.features-section .stat-label),:global(.magic-section .stat-label),
  :global(.equipment-section .weapon-name),:global(.attacks-section .stat-label){color:#b5bec3!important}
  :global(.features-section .sheet-stat strong),:global(.magic-section .sheet-stat strong),
  :global(.attacks-section .sheet-stat strong){color:#b5bec3!important}
  :global(.inline-roll){display:inline;padding:0;border:0;background:transparent;color:#5fe6e0;font:inherit;font-weight:700;text-decoration:underline;text-decoration-color:rgba(95,230,224,.45);text-underline-offset:2px;cursor:pointer}
  :global(.inline-roll:hover){color:#b5bec3;text-decoration-color:currentColor}
  :global(.sheet-readonly-value){white-space:pre-wrap;overflow-wrap:anywhere}
  :global(.character-sheet .editable:hover){background:#13262e!important;border-color:#3fb8b8!important}

  /* Presentación de ficha inspirada en la jerarquía de D&D Beyond */
  :global(.app-shell){max-width:1180px}
  :global(.main){max-width:1120px;width:100%}
  :global(.character-sheet){width:100%;max-width:none;padding:1.1rem;border-radius:10px;background:#0b171d!important;border:1px solid #13262e!important;color:#ffffff!important}
  :global(.ddb-character-header){display:flex!important;align-items:center;justify-content:space-between;gap:1rem;padding:1.15rem 1.25rem!important;margin:0 0 .85rem!important;border-radius:8px!important;background:#0f1e26!important;text-align:left!important}
  :global(.ddb-character-header .sheet-banner-copy){min-width:0;text-align:left}
  :global(.ddb-character-header .sheet-kicker){display:block;color:#b5bec3;font:700 .68rem/1.3 system-ui,sans-serif;letter-spacing:.12em}
  :global(.ddb-character-header .character-name){margin:.25rem 0 .45rem!important;color:#ffffff!important;text-align:left!important;font:700 clamp(1.45rem,3vw,2.15rem)/1.15 system-ui,sans-serif!important}
  :global(.sheet-banner-meta){display:flex;flex-wrap:wrap;gap:.35rem .9rem;color:#b5bec3;font:500 .76rem/1.4 system-ui,sans-serif}
  :global(.sheet-banner-meta span+span){padding-left:.8rem;border-left:1px solid #1b2a33}
  :global(.sheet-banner-emblem){display:grid;place-items:center;flex:0 0 3.4rem;width:3.4rem;height:3.4rem;border:1px solid #1b2a33;border-radius:50%;color:#b5bec3;font-size:1.7rem}
  :global(.sheet-quick-stats){display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.55rem;margin:0 0 .9rem}
  :global(.sheet-quick-stats>div){display:flex;min-width:0;flex-direction:column;justify-content:center;gap:.25rem;padding:.7rem .8rem;border:1px solid #13262e;border-radius:7px;background:#0f1e26}
  :global(.sheet-quick-stats>div>span){color:#b5bec3;font:600 .65rem/1.25 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.055em}
  :global(.sheet-quick-stats>div>strong){color:#ffffff;font:700 1.05rem/1.25 system-ui,sans-serif;overflow-wrap:anywhere}
  :global(.sheet-tabs){display:flex;gap:.3rem;overflow-x:auto;padding:.25rem .15rem .65rem;margin:0 0 .9rem;border-bottom:1px solid #13262e;scrollbar-width:thin}
  :global(.sheet-tabs button){flex:0 0 auto;padding:.58rem .9rem;border:0!important;border-bottom:3px solid transparent!important;border-radius:5px 5px 0 0!important;background:transparent!important;color:#b5bec3!important;font:600 .76rem system-ui,sans-serif;white-space:nowrap}
  :global(.sheet-tabs button.active){border-bottom-color:#b5bec3!important;background:#0f1e26!important;color:#ffffff!important}
  :global(.sheet-grid){grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem}
  :global(.sheet-section){border:1px solid #13262e!important;border-top:3px solid #1b2a33!important;border-radius:7px!important;background:#0f1e26!important;padding:.85rem!important}
  :global(.sheet-section-title){border-bottom:1px solid #13262e!important}
  :global(.sheet-section-title h3),:global(.section-name){color:#ffffff!important}
  :global(.stat-label){color:#b5bec3!important}
  :global(.stat-value),:global(.sheet-stat strong){color:#ffffff!important}
  :global(.sheet-stat){border-bottom-color:#ffffff!important}
  :global(.attributes-section){grid-column:1/-1;background:#0f1e26!important;border-top-color:#b5bec3!important}
  :global(.attributes-section .stats-list){grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:.45rem}
  :global(.attributes-section .sheet-stat){border:1px solid #13262e!important;border-radius:6px!important;background:#0f1e26!important}
  :global(.attributes-section .stat-label){color:#b5bec3!important}
  @media(max-width:760px){:global(.sheet-quick-stats){grid-template-columns:repeat(3,minmax(0,1fr))}:global(.sheet-grid){grid-template-columns:1fr}:global(.attributes-section .stats-list){grid-template-columns:repeat(3,minmax(0,1fr))!important}}
  @media(max-width:520px){:global(.ddb-character-header){align-items:flex-start}:global(.sheet-banner-meta){display:grid;grid-template-columns:1fr 1fr}:global(.sheet-banner-meta span+span){padding-left:0;border-left:0}:global(.sheet-quick-stats){grid-template-columns:repeat(2,minmax(0,1fr))}}


  /* Organización de ficha inspirada en la navegación por secciones de D&D Beyond */
  :global(.app-shell){max-width:1180px!important}
  :global(main){max-width:1120px!important}
  .character-sheet{display:grid;grid-template-columns:220px minmax(0,1fr);column-gap:1rem;align-items:start}
  .character-sheet>.sheet-banner,.character-sheet>.sheet-quick-stats{grid-column:1/-1}
  .character-sheet>.ddb-section-nav{grid-column:1;grid-row:auto;display:flex;flex-direction:column;align-items:stretch;gap:.18rem;overflow:visible;position:sticky;top:.5rem;max-height:calc(100vh - 1rem);overflow-y:auto;padding:.35rem;border:1px solid #13262e;border-radius:7px;background:#0b171d}
  .character-sheet>.ddb-section-nav button{flex:0 0 auto;width:100%;min-height:38px;padding:.55rem .65rem;border:0;border-left:3px solid transparent;border-radius:3px;background:transparent;color:#b5bec3;text-align:left;font:600 .76rem/1.25 system-ui,sans-serif;white-space:normal}
  .character-sheet>.ddb-section-nav button.active{border-left-color:#5fe6e0;background:#0f1e26;color:#ffffff}
  .character-sheet>.ddb-section-nav button:hover{background:#0f1e26}
  .character-sheet>.sheet-grid,.character-sheet>.progression-panel,.character-sheet>.spellbook-panel,.character-sheet>.custom-rolls,.character-sheet>.rules-panel,.character-sheet>.ddb-content-panel{grid-column:2;min-width:0}
  .character-sheet>.sheet-grid{grid-template-columns:minmax(0,1fr);align-content:start}
  .character-sheet>.sheet-grid .sheet-section{min-width:0}
  .ddb-content-panel{padding:1rem;border:1px solid #13262e;border-radius:7px;background:#0f1e26;color:#ffffff}
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
  .sheet-notes-content{white-space:pre-wrap;overflow-wrap:anywhere;color:#b5bec3;line-height:1.55;font:.85rem/1.55 system-ui,sans-serif}
  .data-import-panel{margin:.2rem 0 .8rem}
  @media(max-width:760px){
    .character-sheet>.sheet-grid.continuous-sheet-grid{grid-template-columns:minmax(0,1fr)}
    .continuous-sheet-grid>.attributes-section,.continuous-sheet-grid>.features-section,
    .continuous-sheet-grid>.magic-section,.continuous-sheet-grid>.notes-section{grid-column:auto}
  }
 

  /* Controles de apariencia centralizados en la pestaña Estilo */
  :global(:root){--gm-bg:#0b171d;--gm-panel:#13262e;--gm-card:#1b2a33;--gm-border:#3a6870;--gm-text:#fff;--gm-muted:#b5bec3;--gm-accent:#5fe6e0;--gm-font-size:14px;--gm-heading-size:18px;--gm-panel-padding:12px;--gm-panel-gap:10px;--gm-radius:8px}
  :global(.main){font-size:var(--gm-font-size)}
  :global(.panel){background:var(--gm-panel)!important;color:var(--gm-text)!important;border-color:var(--gm-border)!important;border-radius:var(--gm-radius)!important;padding:var(--gm-panel-padding)!important}
  :global(.panel h2),:global(.panel h3){font-size:var(--gm-heading-size)}
  :global(.panel p),:global(.panel label),:global(.muted){color:var(--gm-muted)}
  :global(.panel input),:global(.panel select),:global(.panel textarea){font-size:var(--gm-font-size)}
  :global(.style-control-grid){display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--gm-panel-gap)}
  :global(.style-control-grid fieldset){display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem;padding:1rem;border:1px solid var(--gm-border);border-radius:var(--gm-radius);background:var(--gm-bg)}
  :global(.style-control-grid legend){padding:0 .4rem;color:var(--gm-accent);font-weight:800}
  :global(.style-control-grid label){display:grid;gap:.35rem;color:var(--gm-muted);font-size:.78rem}
  :global(.style-control-grid input[type=color]){width:100%;height:38px;padding:3px;background:var(--gm-card);border:1px solid var(--gm-border);border-radius:5px}
  :global(.style-control-grid input[type=range]){width:100%;accent-color:var(--gm-accent)}
  :global(.style-preview){margin-top:1rem;padding:1rem;border:1px dashed var(--gm-border);border-radius:var(--gm-radius)}
  :global(.style-preview-card){margin-top:.6rem;padding:var(--gm-panel-padding);background:var(--gm-panel);border:1px solid var(--gm-border);border-radius:var(--gm-radius);color:var(--gm-text)}
  :global(.style-preview-card h3){font-size:var(--gm-heading-size);margin:.2rem 0}
  :global(.style-preview-card p){color:var(--gm-muted)}
  :global(.rules-panel .rule-card),:global(.rules-panel .rule-description),:global(.rules-panel .rule-details),:global(.rules-panel .rule-source){color:#fff!important}
  :global(.rules-panel .rule-card){background:#13262e!important}
  :global(.rules-panel .rule-description){white-space:pre-wrap}
  /* La hoja mantiene dos columnas superiores: habilidades y acciones.
     El contenido con pestañas ocupa todo el ancho en una fila inferior. */
  /* Se conserva la distribución original de la ficha: habilidades a un lado y contenido por pestañas al otro. */
  /* Hoja de personaje: interfaz náutica en tres columnas */
  :global(.nautical-sheet){display:block!important;padding:0!important;overflow:hidden;background:#13262e!important;border:1px solid #3fb8b8!important;border-radius:12px!important;box-shadow:0 16px 40px #0b171d99!important;color:#ffffff!important}
  :global(.nautical-header){display:flex!important;align-items:center;gap:1rem;padding:1rem 1.2rem!important;margin:0!important;border:0!important;border-bottom:1px solid #3fb8b8!important;border-radius:0!important;background:linear-gradient(115deg,#13262e,#13262e 65%,#13262e)!important}
  :global(.portrait-frame){display:grid;place-items:center;flex:0 0 4.5rem;width:4.5rem;height:4.5rem;border:3px solid #3fb8b8;border-radius:50%;background:radial-gradient(circle,#13262e,#13262e 70%);color:#b5bec3;font-size:1.8rem;box-shadow:0 0 0 3px #3fb8b8}
  :global(.nautical-header .sheet-banner-copy){flex:1;min-width:0}
  :global(.nautical-header .sheet-kicker){color:#b5bec3}
  :global(.nautical-header .character-name){color:#ffffff!important;margin:.2rem 0!important}
  :global(.nautical-header .sheet-banner-meta){color:#b5bec3}
  :global(.header-actions){display:flex;gap:.4rem;flex-wrap:wrap}
  :global(.header-actions button){padding:.5rem .65rem;border:1px solid #3fb8b8;border-radius:5px;background:#13262e;color:#b5bec3;font-size:.7rem}
  :global(.nautical-quick-stats){display:grid;grid-template-columns:repeat(9,minmax(0,1fr));gap:.28rem;padding:.5rem .55rem;background:#13262e;border-bottom:1px solid #3fb8b8}
  :global(.nautical-quick-stats>div){min-width:0;display:flex;flex-direction:column;justify-content:center;gap:.12rem;padding:.32rem .25rem;border:1px solid #3fb8b8;border-radius:6px;background:linear-gradient(145deg,#13262e,#13262e)}
  :global(.nautical-quick-stats>.hp-plaque){grid-column:span 2}
  :global(.nautical-quick-stats>div>span){font-size:.49rem;line-height:1.1;color:#b5bec3;text-transform:uppercase;letter-spacing:.015em}
  :global(.nautical-quick-stats>div>strong){font-size:.78rem;line-height:1.1;color:#ffffff;white-space:nowrap}
  :global(.nautical-quick-stats .attribute-plaque-row){display:grid;grid-column:1/-1;grid-template-columns:repeat(6,minmax(0,1fr));gap:.45rem;width:100%;min-width:0}
  :global(.nautical-quick-stats .quick-stats-row){display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:.28rem;width:100%;min-width:0}
  :global(.nautical-quick-stats .quick-stats-row>div){min-width:0;padding:.28rem .2rem}
  :global(.nautical-quick-stats .quick-stats-row>div>span){font-size:.47rem;white-space:nowrap;letter-spacing:0}
  :global(.nautical-quick-stats .quick-stats-row>div>strong){font-size:.72rem}
  :global(.nautical-quick-stats .attribute-plaque){min-width:0;min-height:4rem;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;border-radius:18px 18px 8px 8px;border:1px solid #3fb8b8}
  :global(.nautical-quick-stats .attribute-plaque strong){font-size:1.25rem}
  :global(.nautical-quick-stats .attribute-plaque .ability-score){font-size:1.25rem;line-height:1.1}
  :global(.nautical-quick-stats .attribute-plaque .ability-bonus-roll){align-self:center;margin:.08rem 0;padding:.08rem .35rem;font-size:.85rem;font-weight:800;line-height:1.2}
  :global(.nautical-quick-stats .attribute-plaque .ability-bonus-empty){font-size:.8rem;color:#b5bec3}
  :global(.nautical-quick-stats .attribute-plaque .saving-throw-line){display:flex;align-items:center;justify-content:center;gap:.25rem;margin-top:.1rem;padding-top:.25rem;border-top:1px solid #3fb8b8;font:600 .58rem/1.2 system-ui,sans-serif}
  :global(.nautical-quick-stats .attribute-plaque .saving-throw-line span){color:#b5bec3}
  :global(.nautical-quick-stats .attribute-plaque .saving-throw-line strong){font-size:.65rem;color:#b5bec3}
  :global(.nautical-quick-stats .attribute-plaque .saving-throw-line.proficient span),
  :global(.nautical-quick-stats .attribute-plaque .saving-throw-line.proficient strong){color:#b5bec3}
  :global(.nautical-skills .sheet-stat.proficient .stat-label),
  :global(.nautical-skills .sheet-stat.proficient .stat-value){color:#b5bec3!important}
  :global(.nautical-skills .sheet-stat .skill-number){font-size:1rem!important;font-weight:800!important;line-height:1.25!important;min-width:2.2rem;text-align:right}
  :global(.nautical-skills .sheet-stat.proficient .skill-number){color:#b5bec3!important}
  :global(.nautical-quick-stats .hp-plaque){flex:2 1 10rem}
  :global(.nautical-import){padding:.8rem 1rem;background:#13262e;border-bottom:1px solid #3fb8b8}
  :global(.nautical-columns){display:grid;grid-template-columns:minmax(190px,.82fr) minmax(0,2fr);gap:.65rem;padding:.7rem;align-items:start;background:radial-gradient(ellipse at 75% 0%,#13262e 0,#13262e 50%,#13262e 100%)}
  :global(.nautical-side),:global(.nautical-skills),:global(.nautical-content){min-width:0;max-height:calc(100vh - 14rem);overflow:auto;scrollbar-color:#3fb8b8 #3fb8b8;scrollbar-width:thin}
  :global(.nautical-side),:global(.nautical-skills){display:flex;flex-direction:column;gap:.6rem}
  :global(.nautical-columns .sheet-section){padding:.75rem!important;border:1px solid #3fb8b8!important;border-top:2px solid #5fe6e0!important;border-radius:8px!important;background:#13262eef!important;color:#ffffff!important}
  :global(.nautical-columns .sheet-section-title){border-bottom:1px solid #3fb8b8!important;margin-bottom:.35rem;padding-bottom:.45rem}
  :global(.nautical-columns .sheet-section-title h3){font:700 .78rem system-ui,sans-serif!important;letter-spacing:.07em;text-transform:uppercase;color:#b5bec3!important}
  :global(.nautical-columns .sheet-stat){display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.45rem;padding:.42rem .15rem;border-bottom:1px solid #3fb8b8!important}
  :global(.nautical-columns .stat-label){font-size:.72rem;color:#b5bec3!important}
  :global(.nautical-columns .stat-value){font:600 .75rem system-ui,sans-serif;color:#ffffff!important;text-align:right}
  :global(.nautical-tabs){display:flex;gap:.2rem;overflow-x:auto;padding:.1rem .1rem .55rem;margin-bottom:.55rem;border-bottom:1px solid #3fb8b8;scrollbar-width:thin}
  :global(.nautical-tabs button){flex:0 0 auto;padding:.55rem .65rem;border:1px solid transparent!important;border-radius:5px 5px 0 0;background:transparent!important;color:#b5bec3!important;font-size:.68rem;font-weight:700;white-space:nowrap}
  :global(.nautical-tabs button.active){border-color:#3fb8b8!important;background:#13262e!important;color:#b5bec3!important}
  :global(.weapon-attacks-section .weapon-mastery-summary){padding:.45rem .6rem;margin-bottom:.65rem;border:1px solid #3fb8b8;border-radius:6px;background:#13262e;color:#b5bec3}
  :global(.weapon-attack-list){display:flex;flex-direction:column;gap:.5rem}
  :global(.weapon-attack-card){display:block;width:100%;padding:.65rem .75rem;border:1px solid #3fb8b8;border-radius:7px;background:#0b171d}
  :global(.weapon-attack-card h4){margin:0 0 .55rem;color:#b5bec3;font:700 .95rem Georgia,serif}
  :global(.weapon-attack-values){display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.5rem}
  :global(.weapon-attack-values>div){display:flex;flex-direction:column;gap:.18rem;min-width:0}
  :global(.weapon-attack-values span){font-size:.62rem;color:#b5bec3;text-transform:uppercase;letter-spacing:.04em}
  :global(.weapon-attack-values strong){font-size:.9rem;color:#b5bec3}
  :global(.weapon-damage-roll){margin-top:.55rem}
  :global(.nautical-tab-content){display:flex;flex-direction:column;gap:.6rem}
  :global(.skill-column-labels){display:flex;justify-content:space-between;padding:.2rem .15rem;color:#5fe6e0;font-size:.58rem;text-transform:uppercase;letter-spacing:.08em}
  :global(.nautical-empty){padding:1rem;text-align:center;border:1px dashed #3fb8b8;border-radius:7px}
  :global(.nautical-sheet .inline-roll){color:#b5bec3}
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
  :global(.nautical-header .character-name){color:#ffffff!important}
  @media(max-width:900px){
    :global(.nautical-columns){grid-template-columns:minmax(150px,.8fr) minmax(170px,1fr)}
    :global(.nautical-content){grid-column:1/-1}
  }
  @media(max-width:760px){
    :global(.nautical-quick-stats){grid-template-columns:repeat(9,minmax(0,1fr))}
    :global(.nautical-quick-stats .attribute-plaque-row){grid-column:1/-1}
  }
  @media(max-width:580px){
    :global(.nautical-quick-stats){grid-template-columns:repeat(9,minmax(0,1fr));gap:.16rem;padding:.35rem .25rem}
    :global(.nautical-quick-stats>div){padding:.25rem .12rem}
    :global(.nautical-quick-stats>div>span){font-size:.39rem;letter-spacing:0}
    :global(.nautical-quick-stats>div>strong){font-size:.62rem}
    :global(.nautical-quick-stats>.hp-plaque){grid-column:span 2}
    :global(.weapon-attack-values){grid-template-columns:repeat(2,minmax(0,1fr))}
    :global(.nautical-quick-stats){grid-template-columns:repeat(9,minmax(0,1fr))}
    :global(.nautical-quick-stats .attribute-plaque-row){grid-column:1/-1}
    :global(.nautical-quick-stats>.hp-plaque){grid-column:span 2}
    :global(.nautical-header){flex-wrap:wrap}
    :global(.header-actions){width:100%;padding-left:5.5rem}
    :global(.nautical-columns){grid-template-columns:1fr}
    :global(.nautical-side),:global(.nautical-skills),:global(.nautical-content){grid-column:1}
    :global(.nautical-quick-stats .attribute-plaque){flex:1 1 26%}
  }


  /* Estadísticas superiores: tarjetas independientes y legibles */
  :global(.nautical-quick-stats){
    display:flex!important;
    flex-direction:column!important;
    gap:.45rem!important;
    padding:.5rem!important;
  }
  :global(.nautical-quick-stats>.attribute-plaque-row),
  :global(.nautical-quick-stats>.quick-stats-row){
    width:100%!important;
    min-width:0!important;
    padding:0!important;
    border:0!important;
    background:transparent!important;
  }
  :global(.nautical-quick-stats>.quick-stats-row){
    display:grid!important;
    grid-template-columns:repeat(7,minmax(0,1fr))!important;
    gap:.4rem!important;
  }
  :global(.nautical-quick-stats>.quick-stats-row>div){
    display:flex!important;
    min-width:0!important;
    min-height:3.4rem;
    flex-direction:column!important;
    align-items:flex-start!important;
    justify-content:center!important;
    gap:.3rem!important;
    padding:.5rem .55rem!important;
    border:1px solid #3fb8b8!important;
    border-radius:6px!important;
    background:linear-gradient(145deg,#13262e,#13262e)!important;
  }
  :global(.nautical-quick-stats>.quick-stats-row>div>span){
    display:block!important;
    font-size:.62rem!important;
    line-height:1.2!important;
    white-space:normal!important;
    overflow-wrap:anywhere!important;
  }
  :global(.nautical-quick-stats>.quick-stats-row>div>strong){
    display:block!important;
    font-size:.95rem!important;
    line-height:1.2!important;
    white-space:normal!important;
    overflow-wrap:anywhere!important;
  }
  :global(.nautical-quick-stats>.quick-stats-row>.hp-plaque){
    grid-column:auto!important;
  }
  @media(max-width:760px){
    :global(.nautical-quick-stats>.quick-stats-row){
      grid-template-columns:repeat(3,minmax(0,1fr))!important;
    }
  }
  @media(max-width:480px){
    :global(.nautical-quick-stats>.quick-stats-row){
      grid-template-columns:repeat(2,minmax(0,1fr))!important;
    }
  }


  /* Vista compacta de conjuros del personaje */
  :global(.spellcasting-summary-grid){display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.5rem}
  :global(.spellcasting-summary-grid>div){display:flex;min-width:0;flex-direction:column;gap:.25rem;padding:.65rem .7rem;border:1px solid #3fb8b8;border-radius:6px;background:#0b171d}
  :global(.spellcasting-summary-grid>div>span){color:#b5bec3;font:650 .65rem/1.25 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.035em}
  :global(.spellcasting-summary-grid>div>strong){color:#ffffff;font:750 .95rem/1.3 system-ui,sans-serif;overflow-wrap:anywhere}
  :global(.spellcasting-summary-grid .spell-slot-summary){grid-column:1/-1}
  :global(.spell-slot-summary>strong){display:flex;flex-wrap:wrap;gap:.35rem .8rem}
  :global(.spell-slot-value){font-size:.82rem}

  :global(.spell-change-actions){display:flex;gap:.5rem;flex-wrap:wrap;margin:.65rem 0}
  :global(.spell-change-actions button){padding:.55rem .8rem;border:1px solid #3fb8b8;border-radius:6px}
  :global(.spell-change-panel p){line-height:1.5}
  :global(.spell-change-search){box-sizing:border-box;width:100%;margin:.5rem 0;padding:.6rem;border:1px solid #3a6870;border-radius:6px}
  :global(.spell-change-count){margin:.4rem 0;color:#5fe6e0;font-weight:800}
  :global(.spell-change-options){display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.35rem;max-height:340px;overflow:auto;padding:.25rem}
  :global(.spell-change-options label){display:flex;align-items:center;gap:.4rem;min-width:0;padding:.45rem;border:1px solid #3a6870;border-radius:5px;background:#0b171d}
  :global(.spell-change-options label.selected){border-color:#5fe6e0;background:#17343a}
  :global(.spell-change-options label span){min-width:0;flex:1;overflow-wrap:anywhere}
  :global(.spell-change-options label small){flex:0 0 auto;color:#b5bec3;font-size:.65rem}
  :global(.spell-change-options input){width:1rem;height:1rem;flex:0 0 auto}
  :global(.spell-change-actions button:disabled){opacity:.4}
  @media(max-width:520px){:global(.spell-change-options){grid-template-columns:1fr}}
  :global(.player-spell-list){display:flex;flex-direction:column;gap:.5rem}
  :global(.player-spell-card){display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.65rem;align-items:center;padding:.55rem .65rem;border:1px solid #3fb8b8;border-left:3px solid #3fb8b8;border-radius:6px;background:#0b171d}
  :global(.player-spell-card details){min-width:0}
  :global(.player-spell-card summary){display:flex;align-items:center;justify-content:space-between;gap:.5rem;cursor:pointer;list-style:none}
  :global(.player-spell-card summary::-webkit-details-marker){display:none}
  :global(.player-spell-name){font:700 .9rem/1.25 Georgia,serif;color:#ffffff;overflow-wrap:anywhere}
  :global(.player-spell-level){flex:0 0 auto;padding:.2rem .4rem;border:1px solid #3fb8b8;border-radius:4px;color:#b5bec3;font:650 .65rem system-ui,sans-serif}
  :global(.player-spell-description){padding-top:.55rem}
  :global(.player-spell-description .spell-meta){grid-template-columns:repeat(2,minmax(0,1fr));background:#0b171d;color:#b5bec3;border-color:#3fb8b8}
  :global(.player-spell-checks){display:flex;flex-direction:column;gap:.35rem;min-width:6.3rem}
  :global(.player-spell-checks label){display:flex;align-items:center;gap:.35rem;color:#b5bec3;font:600 .68rem system-ui,sans-serif;white-space:nowrap}
  :global(.player-spell-checks input){width:1rem;height:1rem;margin:0;accent-color:#3fb8b8}
  @media(max-width:520px){
    :global(.spellcasting-summary-grid){grid-template-columns:repeat(2,minmax(0,1fr))}
    :global(.spellcasting-summary-grid .spell-slot-summary){grid-column:1/-1}
    :global(.player-spell-card){grid-template-columns:minmax(0,1fr);gap:.45rem}
    :global(.player-spell-checks){flex-direction:row;flex-wrap:wrap;gap:.8rem}
  }

  :global(.player-feature-list){display:flex;flex-direction:column;gap:.45rem}
  :global(.player-feature-card){border:1px solid #3fb8b8;border-left:3px solid #5fe6e0;border-radius:6px;background:#13262e;overflow:hidden}
  :global(.player-feature-card summary){display:flex;align-items:center;justify-content:space-between;gap:.6rem;padding:.65rem .75rem;cursor:pointer;list-style:none}
  :global(.player-feature-card summary::-webkit-details-marker){display:none}
  :global(.player-feature-name){color:#ffffff;font:700 .9rem/1.3 Georgia,serif;overflow-wrap:anywhere}
  :global(.player-feature-source){flex:0 0 auto;color:#b5bec3;font:650 .62rem/1.25 system-ui,sans-serif;text-align:right}
  :global(.player-feature-card>p){margin:0;padding:.15rem .75rem .75rem;color:#b5bec3;font:.78rem/1.55 system-ui,sans-serif;white-space:pre-wrap}
  :global(.player-feature-card[open]){background:#13262e}
  :global(.player-feat-section .player-feature-card){border-color:#3fb8b8;border-left-color:#5fe6e0;background:#13262e}
  :global(.player-feat-section .player-feature-source){color:#b5bec3}

  :global(.nautical-quick-stats>.quick-stats-row>div){align-items:center;text-align:center}
  :global(.nautical-quick-stats>.quick-stats-row>div>span),
  :global(.nautical-quick-stats>.quick-stats-row>div>strong){display:block;width:100%;text-align:center}
  :global(.nautical-skills .sheet-stat .skill-number){font-size:1.25rem!important;font-weight:800!important;line-height:1.2!important;text-align:center!important;justify-self:center}
 
  /* Selector visual de clases del creador */
  .builder-class-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.7rem;margin:.8rem 0 1rem}
  .builder-class-card{display:flex;min-width:0;flex-direction:column;gap:.55rem;padding:.8rem;border:1px solid #3fb8b8;border-radius:9px;background:linear-gradient(150deg,#13262e,#13262e);cursor:pointer;transition:border-color .15s,background .15s,transform .15s}
  .builder-class-card:hover{border-color:#5fe6e0;transform:translateY(-1px)}
  .builder-class-card.selected{border:2px solid #5fe6e0;background:linear-gradient(150deg,#13262e,#13262e);box-shadow:0 0 0 1px #5fe6e033}
  .builder-class-card input{position:absolute;opacity:0;pointer-events:none}
  .builder-class-card-heading{display:flex;align-items:center;justify-content:space-between;gap:.5rem;color:#b5bec3;font:700 1rem Georgia,serif}
  .builder-class-card-heading>span{padding:.2rem .45rem;border:1px solid #3fb8b8;border-radius:5px;color:#b5bec3;font:700 .72rem system-ui,sans-serif}
  .builder-class-description{min-height:3.8rem;color:#b5bec3;font:.75rem/1.45 system-ui,sans-serif}
  .builder-class-meta{display:flex;flex-direction:column;gap:.12rem;padding-top:.4rem;border-top:1px solid #3fb8b8}
  .builder-class-meta>span{color:#b5bec3;font:600 .58rem system-ui,sans-serif;text-transform:uppercase;letter-spacing:.05em}
  .builder-class-meta>strong{color:#ffffff;font:.72rem/1.35 system-ui,sans-serif}
  @media(max-width:760px){.builder-class-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:460px){.builder-class-grid{grid-template-columns:1fr}.builder-class-description{min-height:0}}

  /* Identidad visual unificada del creador */
  :global(body){background:#1b2a33!important;color:#0f1e26!important}
  .app-shell{background:#1b2a33!important;color:#0f1e26!important}
  .topbar{background:#0f1e26!important;border-bottom:3px solid #5fe6e0!important;color:#ffffff!important}
  .topbar .brand,.topbar nav,.topbar small{color:#ffffff!important}
  .panel,.builder-panel,.import-character-panel{background:#1b2a33!important;border:1px solid #b5bec3!important;border-radius:9px!important;box-shadow:0 3px 12px #3fb8b810!important;color:#0f1e26!important}
  .section-heading{border-bottom:2px solid #5fe6e0!important}
  .section-heading h2,.builder-panel h3,.builder-panel h4{color:#ffffff!important}
  .builder-panel{gap:1rem!important}
  .builder-panel>label,.builder-panel label{color:#b5bec3!important}
  .builder-panel input:not([type=checkbox]):not([type=radio]),.builder-panel select,.builder-panel textarea{background:#1b2a33!important;color:#0f1e26!important;border:1px solid #b5bec3!important;border-radius:6px!important}
  .builder-progress{height:7px!important;background:#1b2a33!important}
  .builder-progress span{background:#5fe6e0!important}
  .builder-info,.builder-choice-wrapper,.builder-choice-field,.builder-name-block{background:#1b2a33!important;border:1px solid #b5bec3!important;border-left:4px solid #5fe6e0!important;border-radius:7px!important;color:#ffffff!important}
  .builder-info small,.builder-panel .muted,.builder-panel .hint{color:#b5bec3!important}
  .builder-class-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:.75rem!important}
  .builder-class-card{background:#1b2a33!important;border:1px solid #b5bec3!important;border-top:3px solid #13262e!important;border-radius:8px!important;color:#0f1e26!important;box-shadow:0 2px 7px #3fb8b80b!important}
  .builder-class-card:hover{border-color:#5fe6e0!important;background:#1b2a33!important}
  .builder-class-card.selected{border:2px solid #5fe6e0!important;border-top:4px solid #5fe6e0!important;background:#1b2a33!important;box-shadow:0 0 0 2px #5fe6e020!important}
  .builder-class-card-heading{color:#ffffff!important}
  .builder-class-card-heading>span{background:#1b2a33!important;border:1px solid #b5bec3!important;color:#3fb8b8!important}
  .builder-class-description{color:#b5bec3!important}
  .builder-class-meta{border-top:1px solid #b5bec3!important}
  .builder-class-meta>span{color:#3fb8b8!important}
  .builder-class-meta>strong{color:#ffffff!important}
  .builder-option-card{min-height:100%;cursor:pointer}
  .builder-species-grid,.builder-background-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
  .builder-name-block{display:grid;gap:.7rem;padding:.85rem}
  .builder-name-block .name-generator-controls{display:flex;align-items:end;gap:.6rem;flex-wrap:wrap}
  .builder-name-block .name-generator-controls label{flex:1;min-width:130px}
  .builder-checkbox-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.5rem}
  .builder-checkbox{display:flex!important;align-items:flex-start!important;gap:.55rem!important;padding:.65rem .7rem!important;border:1px solid #b5bec3!important;border-left:3px solid #1b2a33!important;border-radius:6px!important;background:#1b2a33!important;color:#ffffff!important;cursor:pointer}
  .builder-checkbox:has(input:checked){border-color:#5fe6e0!important;border-left-color:#5fe6e0!important;background:#1b2a33!important}
  .builder-checkbox input{flex:0 0 auto;margin-top:.15rem;accent-color:#5fe6e0}
  .builder-choice-heading{color:#ffffff!important}
  .builder-actions{gap:.55rem!important}
  .builder-actions button,.builder-panel button{border-radius:6px!important}
  .builder-panel button.primary,.builder-actions .primary{background:#13262e!important;border:1px solid #13262e!important;color:#ffffff!important}
  .builder-panel button.secondary,.builder-actions .secondary{background:#1b2a33!important;border:1px solid #1b2a33!important;color:#ffffff!important}
  .master-tabs button{background:#1b2a33!important;color:#ffffff!important;border-color:#b5bec3!important}
  .master-tabs button.active{background:#13262e!important;color:#ffffff!important;border-color:#5fe6e0!important}
  footer{color:#b5bec3!important;border-top:1px solid #b5bec3!important}
  @media(max-width:620px){.builder-class-grid,.builder-species-grid,.builder-background-grid,.builder-checkbox-grid{grid-template-columns:1fr!important}}

  .builder-checkbox:has(.builder-option-description){display:grid!important;grid-template-columns:auto minmax(0,1fr);align-items:start!important}
  .builder-checkbox:has(.builder-option-description)>input{grid-row:1/4}
  .builder-checkbox:has(.builder-option-description)>span{font-weight:750;color:#ffffff}
  .builder-option-description{grid-column:2;color:#b5bec3;font:.68rem/1.4 system-ui,sans-serif;white-space:pre-wrap}

  /* Las elecciones con checkbox/radio se presentan como tarjetas, sin casillas visibles */
  .builder-checkbox-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:.7rem!important}
  .builder-checkbox{
    position:relative!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;
    gap:.45rem!important;min-width:0!important;min-height:92px!important;padding:.85rem 1rem!important;
    border:1px solid #b5bec3!important;border-left:4px solid #1b2a33!important;border-radius:8px!important;
    background:#1b2a33!important;color:#ffffff!important;cursor:pointer!important;
    box-shadow:0 2px 7px #3fb8b80a!important;transition:border-color .15s,background .15s,box-shadow .15s!important
  }
  .builder-checkbox>input[type=checkbox],.builder-checkbox>input[type=radio]{
    position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;
    overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important;opacity:0!important
  }
  .builder-checkbox>span{display:block!important;padding-right:5.5rem!important;font-weight:750!important;color:#ffffff!important;line-height:1.35!important}
  .builder-checkbox>span b{color:#ffffff!important}
  .builder-checkbox::after{
    content:'Seleccionar';position:absolute;top:.7rem;right:.7rem;padding:.18rem .42rem;
    border:1px solid #b5bec3;border-radius:4px;background:#1b2a33;color:#b5bec3;
    font:600 .58rem/1.35 system-ui,sans-serif;letter-spacing:.02em
  }
  .builder-checkbox:has(input:checked){
    border:2px solid #5fe6e0!important;border-left:5px solid #5fe6e0!important;background:#1b2a33!important;
    box-shadow:0 0 0 2px #5fe6e01c!important
  }
  .builder-checkbox:has(input:checked)::after{content:'Elegido';background:#13262e;color:#ffffff;border-color:#ffffff}
  .builder-checkbox:has(input:disabled):not(:has(input:checked)){opacity:.48!important;cursor:not-allowed!important;background:#1b2a33!important;box-shadow:none!important}
  .builder-checkbox:has(input:focus-visible){outline:3px solid #5fe6e0!important;outline-offset:2px}
  .builder-checkbox:has(.builder-option-description){display:flex!important;flex-direction:column!important;gap:.4rem!important}
  .builder-checkbox:has(.builder-option-description)>span{padding-right:5.5rem!important;font-size:.9rem!important}
  .builder-option-description{display:block!important;padding:0!important;color:#b5bec3!important;font:.7rem/1.45 system-ui,sans-serif!important;white-space:pre-wrap!important}
  .builder-checkbox-grid .builder-checkbox:has(.builder-option-description){min-height:150px!important}
  @media(max-width:620px){.builder-checkbox-grid{grid-template-columns:1fr!important}.builder-checkbox{min-height:80px!important}}

  .builder-skill-description{display:block!important;padding:0!important;color:#b5bec3!important;font:.72rem/1.45 system-ui,sans-serif!important;white-space:normal!important}

  .github-config-panel{padding:.9rem;border:1px solid var(--rule);border-radius:7px;background:rgba(95,230,224,.42)}
  .github-folder-create{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.5rem}
  .github-folder-create input,.github-character-actions select{min-width:0;padding:.55rem;border:1px solid var(--rule);border-radius:5px;background:#1b2a33;color:var(--ink)}
  .github-folder-list{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.7rem}
  .github-folder-chip{padding:.3rem .55rem;border:1px solid var(--rule);border-radius:20px;background:#1b2a33;color:var(--ink-soft);font:.7rem system-ui,sans-serif}
  .github-character-list{display:grid;gap:.55rem}
  .github-character-row{display:grid;gap:.55rem;padding:.7rem;border:1px solid var(--rule);border-left:3px solid var(--gold);border-radius:6px;background:#1b2a33}
  .github-character-row>div:first-child{display:grid;gap:.15rem}
  .github-character-row small{color:var(--ink-soft);font:.68rem system-ui,sans-serif}
  .github-character-actions{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center}
  .github-character-actions select{flex:1 1 150px}
  .github-character-actions button{padding:.45rem .6rem;border:1px solid var(--rule);border-radius:5px;background:#1b2a33;color:var(--ink);font:.7rem system-ui,sans-serif;cursor:pointer}
  .github-character-actions .danger-text{color:#3fb8b8}
  .github-status{padding:.55rem .7rem;border-left:3px solid var(--gold);background:#1b2a33}
  @media(min-width:700px){.github-character-row{grid-template-columns:minmax(0,1fr) auto;align-items:center}}



  /* Tema náutico final: prevalece sobre estilos heredados y específicos antiguos */
  :global(:root){
    color-scheme:dark;
    --paper:#3fb8b8;--paper-deep:#3fb8b8;--ink:#ffffff;--ink-soft:#b5bec3;
    --rule:#3fb8b8;--red:#b5bec3;--gold:#b5bec3;
    --ocean:#3fb8b8;--slate:#3fb8b8;--aqua:#b5bec3;--aqua-mid:#5fe6e0;
    --text-main:#ffffff;--text-secondary:#b5bec3;--text-muted:#1b2a33;
  }
  :global(body),:global(.app-shell),:global(.main){background:#13262e!important;color:#ffffff!important}
  :global(body){background:radial-gradient(ellipse at 50% 0%,#13262e 0,#13262e 45%,#13262e 100%)!important}
  :global(.topbar){background:#0f1e26!important;border-bottom:1px solid #3fb8b8!important;color:#ffffff!important}
  :global(.brand),:global(.brand strong),:global(.brand small){color:#ffffff!important}
  :global(.brand-mark),:global(.eyebrow),:global(.free-tag),:global(.count){color:#b5bec3!important}
  :global(.intro),:global(.connection),:global(.hint),:global(.muted),:global(.brand small){color:#b5bec3!important}
  :global(.panel),:global(.builder-panel),:global(.import-character-panel),:global(.character-card),:global(.monster-card),:global(.trait-editor),:global(.import-box),:global(.rolls-panel),:global(.roll-history),:global(.ddb-content-panel){
    background:#13262e!important;border:1px solid #5fe6e0!important;color:#ffffff!important;box-shadow:0 8px 24px #0b171d55!important
  }
  :global(.section-heading h2),:global(.panel h2),:global(.builder-panel h3),:global(.builder-panel h4),:global(.character-card h3),:global(.monster-card h3),:global(.trait-view strong),:global(.roll-entry-top strong){color:#ffffff!important}
  :global(label),:global(.builder-panel>label),:global(.builder-panel label),:global(.items-search),:global(.items-filters label),:global(.spell-search),:global(.spell-filters label),:global(.monster-filter){color:#b5bec3!important}
  :global(input),:global(textarea),:global(select),:global(.builder-panel input),:global(.builder-panel select),:global(.builder-panel textarea),:global(.items-search input),:global(.items-filters input),:global(.items-filters select),:global(.spell-search input),:global(.spell-filters select),:global(.monster-filter select),:global(.github-folder-create input),:global(.github-character-actions select){
    background:#13262e!important;color:#ffffff!important;border:1px solid #3fb8b8!important
  }
  :global(input::placeholder),:global(textarea::placeholder){color:#b5bec3!important}
  :global(input:focus),:global(textarea:focus),:global(select:focus){border-color:#b5bec3!important;outline:1px solid #b5bec3!important}
  :global(.primary),:global(.builder-panel button.primary),:global(.builder-actions .primary){background:#1b2a33!important;border:1px solid #b5bec3!important;color:#3fb8b8!important}
  :global(.primary:hover){background:#1b2a33!important}
  :global(.secondary),:global(.builder-panel button.secondary),:global(.builder-actions .secondary),:global(.topbar nav button),:global(.player-tabs button),:global(.master-tabs button),:global(.sheet-tabs button),:global(.nautical-tabs button){
    background:#13262e!important;border:1px solid #3fb8b8!important;color:#b5bec3!important
  }
  :global(.topbar nav button.active),:global(.player-tabs button.active),:global(.master-tabs button.active),:global(.sheet-tabs button.active),:global(.nautical-tabs button.active){
    background:#1b2a33!important;border-color:#b5bec3!important;color:#3fb8b8!important
  }
  :global(.builder-info),:global(.builder-choice-wrapper),:global(.builder-choice-field),:global(.builder-name-block),:global(.builder-checkbox),:global(.builder-class-card),:global(.builder-skill-card),:global(.builder-option-card){
    background:#13262e!important;border:1px solid #3fb8b8!important;color:#ffffff!important;box-shadow:none!important
  }
  :global(.builder-info),:global(.builder-choice-wrapper),:global(.builder-choice-field),:global(.builder-name-block){border-left:3px solid #b5bec3!important}
  :global(.builder-info *),:global(.builder-checkbox *),:global(.builder-class-card *),:global(.builder-skill-card *),:global(.builder-option-card *){color:inherit}
  :global(.builder-info small),:global(.builder-panel .muted),:global(.builder-panel .hint),:global(.builder-option-description),:global(.builder-skill-description){color:#b5bec3!important}
  :global(.builder-class-card-heading),:global(.builder-choice-heading),:global(.builder-checkbox>span),:global(.builder-checkbox>span b){color:#ffffff!important}
  :global(.builder-class-description){color:#b5bec3!important}
  :global(.builder-class-meta){border-top:1px solid #3fb8b8!important}
  :global(.builder-class-meta>span){color:#b5bec3!important}
  :global(.builder-class-meta>strong){color:#ffffff!important}
  :global(.builder-class-card:hover),:global(.builder-checkbox:hover){border-color:#b5bec3!important;background:#13262e!important}
  :global(.builder-class-card.selected),:global(.builder-checkbox:has(input:checked)){border-color:#b5bec3!important;border-left-color:#b5bec3!important;background:#13262e!important;box-shadow:0 0 0 1px #b5bec333!important}
  :global(.builder-checkbox:has(input:checked)::after){background:#1b2a33!important;color:#3fb8b8!important;border-color:#b5bec3!important}
  :global(.builder-checkbox input){accent-color:#b5bec3!important}
  :global(.builder-progress){background:#13262e!important}
  :global(.builder-progress span){background:#1b2a33!important}
  :global(.builder-option-badge),:global(.builder-class-card-heading>span){background:#13262e!important;border:1px solid #5fe6e0!important;color:#b5bec3!important}
  :global(.character-sheet),:global(.nautical-sheet){
    background:#13262e!important;border:1px solid #5fe6e0!important;color:#ffffff!important;box-shadow:0 16px 40px #0b171d99!important
  }
  :global(.nautical-header),:global(.ddb-character-header){background:#0f1e26!important;border-bottom:1px solid #3fb8b8!important;color:#ffffff!important}
  :global(.nautical-header .sheet-kicker),:global(.sheet-kicker){color:#b5bec3!important}
  :global(.nautical-header .character-name),:global(.ddb-character-header .character-name),:global(.character-name){color:#ffffff!important}
  :global(.sheet-banner-meta){color:#b5bec3!important}
  :global(.sheet-banner-emblem),:global(.portrait-frame){border-color:#b5bec3!important;color:#ffffff!important}
  :global(.portrait-frame){box-shadow:0 0 0 3px #5fe6e0!important}
  :global(.header-actions button){background:#13262e!important;border:1px solid #b5bec3!important;color:#ffffff!important}
  :global(.nautical-quick-stats){background:#13262e!important;border-color:#5fe6e0!important}
  :global(.nautical-quick-stats>div),:global(.sheet-quick-stats>div),:global(.attributes-section .sheet-stat){
    background:#13262e!important;border:1px solid #5fe6e0!important;color:#ffffff!important
  }
  :global(.nautical-quick-stats>div>span),:global(.sheet-quick-stats>div>span),:global(.stat-label){color:#b5bec3!important}
  :global(.nautical-quick-stats>div>strong),:global(.sheet-quick-stats>div>strong),:global(.stat-value),:global(.sheet-stat strong){color:#ffffff!important}
  :global(.sheet-section),:global(.nautical-columns .sheet-section),:global(.ddb-content-panel){
    background:#13262e!important;border:1px solid #5fe6e0!important;border-top:2px solid #b5bec3!important;color:#ffffff!important
  }
  :global(.sheet-section-title),:global(.sheet-stat),:global(.sheet-tabs),:global(.master-tabs){border-color:#3fb8b8!important}
  :global(.sheet-section-title h3),:global(.section-name),:global(.nautical-columns .sheet-section-title h3){color:#b5bec3!important}
  :global(.nautical-columns .stat-label){color:#b5bec3!important}
  :global(.nautical-columns .stat-value){color:#ffffff!important}
  :global(.nautical-tabs button.active),:global(.sheet-tabs button.active){background:#13262e!important;color:#ffffff!important;border-bottom-color:#b5bec3!important}
  :global(.nautical-tabs button),:global(.sheet-tabs button){color:#b5bec3!important}
  :global(.nautical-columns),:global(.nautical-side),:global(.nautical-skills),:global(.nautical-content){background-color:#13262e!important;scrollbar-color:#b5bec3 #3fb8b8!important}
  :global(.nautical-columns .sheet-section){background:#13262e!important}
  :global(.sheet-stat),:global(.roll-entry),:global(.trait-view),:global(.traits-preview){border-color:#3fb8b8!important}
  :global(.sheet-stat strong),:global(.trait-view strong),:global(.roll-part-heading strong){color:#ffffff!important}
  :global(.sheet-stat .stat-label),:global(.sheet-notes),:global(.monster-source),:global(.spell-source){color:#b5bec3!important}
  :global(.items-table),:global(.chest-table){background:#13262e!important;color:#ffffff!important}
  :global(.items-table th),:global(.chest-table th){background:#13262e!important;color:#ffffff!important}
  :global(.items-table td),:global(.chest-table td){color:#b5bec3!important;border-bottom-color:#3fb8b8!important}
  :global(.items-table td:first-child),:global(.chest-table td:first-child){color:#ffffff!important}
  :global(.spell-card),:global(.player-spell-card),:global(.player-feature-card),:global(.weapon-attack-card),:global(.github-character-row),:global(.github-folder-chip){
    background:#13262e!important;border:1px solid #5fe6e0!important;color:#ffffff!important
  }
  :global(.spell-card *),:global(.player-spell-card *),:global(.player-feature-card *),:global(.weapon-attack-card *){color:inherit}
  :global(.spell-meta),:global(.spell-level),:global(.monster-cr),:global(.roll-notation),:global(.roll-result),:global(.chest-result){
    background:#13262e!important;border:1px solid #3fb8b8!important;color:#ffffff!important
  }
  :global(.spell-name),:global(.player-spell-name),:global(.player-feature-name),:global(.weapon-attack-card h4){color:#ffffff!important}
  :global(.spell-source),:global(.player-spell-level),:global(.player-feature-source),:global(.weapon-attack-values span){color:#b5bec3!important}
  :global(.player-feature-card>p),:global(.spell-card p),:global(.monster-card p){color:#b5bec3!important}
  :global(.player-feature-card),:global(.player-spell-card){border-left-color:#b5bec3!important}
  :global(.player-feat-section .player-feature-card){border-color:#5fe6e0!important;border-left-color:#b5bec3!important;background:#13262e!important}
  :global(.player-spell-checks input){accent-color:#b5bec3!important}
  :global(.trait-group h3),:global(.roll-result b),:global(.inline-roll),:global(.card-actions button),:global(.github-folder-chip){color:#b5bec3!important}
  :global(.inline-roll:hover){color:#b5bec3!important}
  :global(.roll-notation),:global(.roll-result){background:#13262e!important;color:#ffffff!important;border-color:#5fe6e0!important}
  :global(.chest-result){background:#13262e!important;color:#ffffff!important;border-color:#5fe6e0!important}
  :global(.chest-result-number),:global(.chest-result>span:last-child){color:#b5bec3!important}
  :global(.chest-table-wrap){border-color:#5fe6e0!important}
  :global(.chest-selected){background:#13262e!important;color:#ffffff!important}
  :global(.github-status){background:#13262e!important;border-left:3px solid #b5bec3!important;color:#ffffff!important}
  :global(.github-character-actions button){background:#13262e!important;border:1px solid #3fb8b8!important;color:#ffffff!important}
  :global(.github-character-actions .danger-text),:global(.danger-text),:global(.remove-roll){color:#5fe6e0!important}
  :global(.toast){background:#13262e!important;border:1px solid #5fe6e0!important;color:#ffffff!important}
  :global(.master-tabs button),:global(.sheet-tabs button){border-color:#3fb8b8!important}
  :global(.master-tabs button.active){background:#1b2a33!important;color:#3fb8b8!important;border-color:#b5bec3!important}
  :global(.sheet-tabs button.active){background:#13262e!important;color:#ffffff!important;border-bottom-color:#b5bec3!important}
  :global(.saving-throw-line.proficient strong),:global(.nautical-skills .sheet-stat.proficient .stat-value),:global(.nautical-skills .sheet-stat.proficient .skill-number){color:#b5bec3!important}
  :global(.nautical-empty){border-color:#5fe6e0!important;color:#b5bec3!important}
  :global(footer){border-color:#3fb8b8!important;color:#b5bec3!important}


  /* Corrección final de contraste en herramientas del director */
  :global(.gm-layout .master-tabs button){background:#13262e!important;color:#b5bec3!important;border:1px solid #3fb8b8!important}
  :global(.gm-layout .master-tabs button.active){background:#1b2a33!important;color:#3fb8b8!important;border-color:#b5bec3!important}
  :global(.gm-layout .level-up-panel),:global(.gm-layout .subclass-level-preview),:global(.gm-layout .github-config-panel),:global(.gm-layout .github-character-row),:global(.gm-layout .builder-panel),:global(.gm-layout .custom-rolls),:global(.gm-layout .custom-roll-card),:global(.gm-layout .new-roll-part){background:#13262e!important;color:#ffffff!important;border-color:#5fe6e0!important}
  :global(.gm-layout .level-up-panel label),:global(.gm-layout .builder-panel label),:global(.gm-layout .items-search),:global(.gm-layout .items-filters label),:global(.gm-layout .spell-search),:global(.gm-layout .spell-filters label),:global(.gm-layout .monster-filter),:global(.gm-layout .roll-creator label){color:#b5bec3!important}
  :global(.gm-layout input),:global(.gm-layout textarea),:global(.gm-layout select){background:#13262e!important;color:#ffffff!important;border:1px solid #3fb8b8!important}
  :global(.gm-layout input::placeholder),:global(.gm-layout textarea::placeholder){color:#b5bec3!important}
  :global(.gm-layout input:focus),:global(.gm-layout textarea:focus),:global(.gm-layout select:focus){border-color:#b5bec3!important;outline:1px solid #b5bec3!important}
  :global(.gm-layout .builder-info),:global(.gm-layout .builder-choice-wrapper),:global(.gm-layout .builder-choice-field),:global(.gm-layout .builder-choice-heading),:global(.gm-layout .github-status),:global(.gm-layout .github-folder-chip){background:#13262e!important;color:#ffffff!important;border-color:#5fe6e0!important}
  :global(.gm-layout .builder-info),:global(.gm-layout .github-status){border-left:3px solid #b5bec3!important}
  :global(.gm-layout .builder-info strong),:global(.gm-layout .builder-choice-wrapper strong),:global(.gm-layout .builder-choice-heading strong),:global(.gm-layout .subclass-level-preview strong),:global(.gm-layout .subclass-level-preview b){color:#ffffff!important}
  :global(.gm-layout .builder-info p),:global(.gm-layout .builder-info small),:global(.gm-layout .subclass-level-preview p){color:#b5bec3!important}
  :global(.gm-layout .builder-checkbox){background:#13262e!important;color:#ffffff!important;border-color:#3fb8b8!important}
  :global(.gm-layout .builder-checkbox>span),:global(.gm-layout .builder-checkbox>span b){color:#ffffff!important}
  :global(.gm-layout .builder-checkbox::after){background:#13262e!important;color:#b5bec3!important;border-color:#3fb8b8!important}
  :global(.gm-layout .builder-checkbox:has(input:checked)){background:#13262e!important;border-color:#b5bec3!important}
  :global(.gm-layout .builder-checkbox:has(input:checked)::after){background:#1b2a33!important;color:#3fb8b8!important;border-color:#b5bec3!important}
  :global(.gm-layout .builder-progress){background:#13262e!important}
  :global(.gm-layout .builder-progress span){background:#1b2a33!important}
  :global(.gm-layout .gm-character-sheet .sheet-section),:global(.gm-layout .gm-character-sheet .combat-section),:global(.gm-layout .gm-character-sheet .attributes-section),:global(.gm-layout .gm-character-sheet .skills-section),:global(.gm-layout .gm-character-sheet .features-section),:global(.gm-layout .gm-character-sheet .magic-section),:global(.gm-layout .gm-character-sheet .equipment-section),:global(.gm-layout .gm-character-sheet .story-section),:global(.gm-layout .gm-character-sheet .general-section){background:#13262e!important;color:#ffffff!important;border:1px solid #5fe6e0!important;border-top:2px solid #b5bec3!important}
  :global(.gm-layout .gm-character-sheet .sheet-section-title h3),:global(.gm-layout .gm-character-sheet .section-name){color:#b5bec3!important}
  :global(.gm-layout .gm-character-sheet .sheet-stat){background:transparent!important;border-color:#3fb8b8!important}
  :global(.gm-layout .gm-character-sheet .sheet-stat span),:global(.gm-layout .gm-character-sheet .stat-label){color:#b5bec3!important}
  :global(.gm-layout .gm-character-sheet .sheet-stat strong),:global(.gm-layout .gm-character-sheet .stat-value),:global(.gm-layout .gm-character-sheet .features-section .sheet-stat strong){background:#13262e!important;color:#ffffff!important}
  :global(.gm-layout .items-filters fieldset),:global(.gm-layout .items-filters legend){background:#13262e!important;color:#b5bec3!important;border-color:#3fb8b8!important}
  :global(.gm-layout .items-table),:global(.gm-layout .chest-table){background:#13262e!important;color:#ffffff!important}
  :global(.gm-layout .items-table th),:global(.gm-layout .chest-table th){background:#13262e!important;color:#ffffff!important;border-color:#3fb8b8!important}
  :global(.gm-layout .items-table td),:global(.gm-layout .chest-table td){background:#13262e!important;color:#b5bec3!important;border-color:#3fb8b8!important}
  :global(.gm-layout .items-table td:first-child),:global(.gm-layout .chest-table td:first-child){color:#ffffff!important}
  :global(.gm-layout .chest-result),:global(.gm-layout .monster-combat-grid div),:global(.gm-layout .monster-info-item),:global(.gm-layout .spell-meta),:global(.gm-layout .monster-attacks),:global(.gm-layout .monster-role),:global(.gm-layout .monster-entry){background:#13262e!important;color:#ffffff!important;border-color:#3fb8b8!important}
  :global(.gm-layout .monster-heading){border-bottom-color:#b5bec3!important}
  :global(.gm-layout .monster-heading h3),:global(.gm-layout .monster-content-section h4){color:#b5bec3!important}
  :global(.gm-layout .monster-entry strong),:global(.gm-layout .monster-original),:global(.gm-layout .monster-name),:global(.gm-layout .spell-name){color:#ffffff!important}
  :global(.gm-layout .monster-statblock),:global(.gm-layout .spell-details){background:#13262e!important;color:#ffffff!important;border-color:#3fb8b8!important}
  :global(.gm-layout .monster-cr),:global(.gm-layout .spell-level){background:#13262e!important;color:#b5bec3!important;border-color:#5fe6e0!important}
  :global(.gm-layout .monster-source),:global(.gm-layout .monster-attribution),:global(.gm-layout .spell-source),:global(.gm-layout .spell-subtitle),:global(.gm-layout .monster-subtitle){color:#b5bec3!important}
  :global(.gm-layout .roll-notation),:global(.gm-layout .roll-result){background:#13262e!important;color:#ffffff!important;border-color:#5fe6e0!important}
  :global(.gm-layout .roll-result b){color:#b5bec3!important}
  :global(.gm-layout .roll-actions button),:global(.gm-layout .roll-creator button),:global(.gm-layout .add-roll-part),:global(.gm-layout .github-character-actions button){background:#13262e!important;color:#ffffff!important;border:1px solid #3fb8b8!important}
  :global(.gm-layout button.primary){background:#1b2a33!important;color:#3fb8b8!important;border-color:#b5bec3!important}
  :global(.gm-layout button.secondary){background:#13262e!important;color:#ffffff!important;border-color:#3fb8b8!important}
  :global(.gm-layout .danger-text),:global(.gm-layout .remove-roll){color:#5fe6e0!important}
  :global(.gm-layout .gm-sheet-details summary){color:#b5bec3!important}



  /* AUDITORÍA VISUAL GLOBAL — paleta náutica aplicada a toda la aplicación */
  :global(:root){
    color-scheme:dark;
    --ocean-0:#3fb8b8;--ocean-1:#3fb8b8;--ocean-2:#3fb8b8;
    --slate-1:#3fb8b8;--slate-2:#3fb8b8;
    --aqua:#b5bec3;--aqua-mid:#5fe6e0;
    --text-main:#ffffff;--text-secondary:#b5bec3;--text-muted:#1b2a33;
    --line:#3fb8b8;--line-soft:#3fb8b8;
  }
  :global(html),:global(body),:global(#app){background:#13262e!important;color:#ffffff!important}
  :global(body){background:radial-gradient(ellipse at 50% 0%,#13262e 0,#13262e 42%,#13262e 100%)!important}
  :global(.app-shell),:global(.main){color:#ffffff!important}
  :global(.topbar),:global(footer){border-color:#3fb8b8!important}
  :global(.brand),:global(.brand strong),:global(.section-heading h2),:global(.panel h2),
  :global(.saved h2),:global(.character-card h3),:global(.monster-card h3){color:#ffffff!important}
  :global(.brand-mark),:global(.eyebrow),:global(.free-tag),:global(.count),
  :global(.card-symbol),:global(.card-actions button),:global(.roll-result b),
  :global(.trait-group h3){color:#b5bec3!important}
  :global(.brand small),:global(.intro),:global(.connection),:global(.hint),
  :global(.muted),:global(footer){color:#b5bec3!important}
  :global(.panel),:global(.character-card),:global(.monster-card),
  :global(.trait-editor),:global(.import-box),:global(.rolls-panel),
  :global(.roll-history),:global(.roster-panel),:global(.chest-panel),
  :global(.save-panel),:global(.items-panel),:global(.spells-panel),
  :global(.monsters-panel),:global(.custom-rolls),:global(.custom-roll-card),
  :global(.new-roll-part),:global(.roll-creator),:global(.builder-panel),
  :global(.level-up-panel),:global(.progression-panel),:global(.spellbook-panel),
  :global(.rules-panel),:global(.ddb-content-panel),:global(.data-import-panel),
  :global(.import-character-panel),:global(.github-config-panel),
  :global(.github-character-row),:global(.subclass-level-preview){
    background:#13262e!important;color:#ffffff!important;border-color:#5fe6e0!important;
    box-shadow:0 8px 24px #0b171d44!important
  }
  :global(.topbar nav button),:global(.secondary),:global(.player-tabs button),
  :global(.character-tabs button),:global(.master-tabs button),
  :global(.header-actions button),:global(.roll-actions button),
  :global(.roll-creator button),:global(.add-roll-part),
  :global(.github-character-actions button){
    background:#13262e!important;border:1px solid #3fb8b8!important;color:#ffffff!important
  }
  :global(.topbar nav button.active),:global(.player-tabs button.active),
  :global(.character-tabs button.active),:global(.master-tabs button.active),
  :global(.primary),:global(.builder-panel button.primary),
  :global(.builder-actions .primary){
    background:#1b2a33!important;border:1px solid #b5bec3!important;color:#3fb8b8!important
  }
  :global(.primary:hover){background:#1b2a33!important;color:#3fb8b8!important}
  :global(label),:global(.builder-choice-heading),:global(.stat-label),
  :global(.sheet-stat .stat-label){color:#b5bec3!important}
  :global(input),:global(textarea),:global(select),:global(.editable),
  :global(.sheet-readonly-value){
    background:#13262e!important;color:#ffffff!important;border:1px solid #3fb8b8!important
  }
  :global(input::placeholder),:global(textarea::placeholder){color:#b5bec3!important}
  :global(input:focus),:global(textarea:focus),:global(select:focus),
  :global(.editable:focus){border-color:#b5bec3!important;outline:1px solid #b5bec3!important;background:#13262e!important}
  :global(.roll-entry),:global(.trait-view),:global(.traits-preview),
  :global(.subheading),:global(.sheet-section-title){border-color:#3fb8b8!important}
  :global(.roll-entry-top strong),:global(.trait-view strong),
  :global(.trait-view p),:global(.roll-entry p){color:#ffffff!important}
  :global(.toast){background:#13262e!important;border:1px solid #5fe6e0!important;color:#ffffff!important}
  :global(.danger-text),:global(.remove-roll){color:#5fe6e0!important}

  /* Creador: todas las tarjetas seleccionables comparten el mismo tratamiento */
  :global(.builder-choice-wrapper),:global(.builder-choice-field),
  :global(.builder-name-block),:global(.builder-info),
  :global(.builder-option-card),:global(.builder-option-description),
  :global(.builder-skill-card),:global(.builder-option-badge),
  :global(.builder-choice-heading),:global(.builder-checkbox){
    background:#13262e!important;color:#ffffff!important;border-color:#3fb8b8!important
  }
  :global(.builder-choice-wrapper),:global(.builder-choice-field),
  :global(.builder-name-block){border-left:3px solid #b5bec3!important}
  :global(.builder-info small),:global(.builder-panel .muted),
  :global(.builder-panel .hint),:global(.builder-option-description),
  :global(.builder-skill-description){color:#b5bec3!important}
  :global(.builder-class-card),:global(.builder-class-card:hover),
  :global(.builder-species-grid .builder-option-card),
  :global(.builder-background-grid .builder-option-card){
    background:#13262e!important;border:1px solid #5fe6e0!important;color:#ffffff!important
  }
  :global(.builder-class-card-heading),:global(.builder-class-card-heading strong),
  :global(.builder-class-meta strong),:global(.builder-option-card strong){color:#ffffff!important}
  :global(.builder-class-card-heading>span),:global(.builder-class-meta>span),
  :global(.builder-option-badge){color:#b5bec3!important;background:#13262e!important;border-color:#5fe6e0!important}
  :global(.builder-class-description),:global(.builder-class-meta),
  :global(.builder-class-meta>span){color:#b5bec3!important;border-color:#3fb8b8!important}
  :global(.builder-class-card.selected),:global(.builder-option-card.selected){
    background:#13262e!important;border:2px solid #b5bec3!important;color:#ffffff!important;
    box-shadow:0 0 0 1px #b5bec333!important
  }
  :global(.builder-checkbox:has(input:checked)){
    background:#13262e!important;border-color:#b5bec3!important;color:#ffffff!important
  }
  :global(.builder-checkbox input){accent-color:#b5bec3!important}
  :global(.builder-panel button.secondary),:global(.builder-actions .secondary){
    background:#13262e!important;border:1px solid #3fb8b8!important;color:#ffffff!important
  }
  :global(.builder-progress){background:#13262e!important}
  :global(.builder-progress span){background:#1b2a33!important}

  /* Hoja del jugador y ficha del director: ningún bloque de pergamino o fondo claro */
  :global(.character-sheet),:global(.gm-character-sheet),
  :global(.nautical-sheet),:global(.ddb-content-panel){
    background:#13262e!important;color:#ffffff!important;border:1px solid #5fe6e0!important
  }
  :global(.character-sheet .sheet-banner),:global(.gm-character-sheet .sheet-banner){
    background:#0f1e26!important;color:#ffffff!important
  }
  :global(.character-sheet .character-name),:global(.gm-character-sheet .character-name),
  :global(.character-sheet .sheet-banner .character-name){color:#ffffff!important}
  :global(.character-sheet .sheet-tabs button),:global(.sheet-tabs button){
    background:#13262e!important;color:#b5bec3!important;border:1px solid #3fb8b8!important
  }
  :global(.character-sheet .sheet-tabs button.active),:global(.sheet-tabs button.active){
    background:#13262e!important;color:#ffffff!important;border-color:#b5bec3!important;
    border-bottom:3px solid #b5bec3!important
  }
  :global(.character-sheet .sheet-section),:global(.gm-character-sheet .sheet-section),
  :global(.character-sheet .combat-section),:global(.character-sheet .attributes-section),
  :global(.character-sheet .skills-section),:global(.character-sheet .features-section),
  :global(.character-sheet .magic-section),:global(.character-sheet .equipment-section),
  :global(.character-sheet .story-section),:global(.character-sheet .general-section),
  :global(.gm-character-sheet .combat-section),:global(.gm-character-sheet .attributes-section),
  :global(.gm-character-sheet .skills-section),:global(.gm-character-sheet .features-section),
  :global(.gm-character-sheet .magic-section),:global(.gm-character-sheet .equipment-section),
  :global(.gm-character-sheet .story-section),:global(.gm-character-sheet .general-section){
    background:#13262e!important;color:#ffffff!important;border:1px solid #5fe6e0!important;
    border-top:2px solid #b5bec3!important
  }
  :global(.character-sheet .sheet-section-title),:global(.gm-character-sheet .sheet-section-title){
    background:transparent!important;border-bottom:1px solid #3fb8b8!important
  }
  :global(.character-sheet .section-name),:global(.gm-character-sheet .section-name),
  :global(.character-sheet .sheet-section-title h3),:global(.gm-character-sheet .sheet-section-title h3){
    color:#b5bec3!important
  }
  :global(.character-sheet .sheet-stat),:global(.gm-character-sheet .sheet-stat){
    background:transparent!important;border-color:#3fb8b8!important
  }
  :global(.character-sheet .stat-label),:global(.gm-character-sheet .stat-label),
  :global(.character-sheet .sheet-stat span),:global(.gm-character-sheet .sheet-stat span){
    color:#b5bec3!important
  }
  :global(.character-sheet .stat-value),:global(.gm-character-sheet .stat-value),
  :global(.character-sheet .sheet-stat strong),:global(.gm-character-sheet .sheet-stat strong){
    background:#13262e!important;color:#ffffff!important;border:1px solid #3fb8b8!important
  }
  :global(.character-sheet .editable),:global(.gm-character-sheet .editable){
    background:#13262e!important;color:#ffffff!important;border-color:#3fb8b8!important
  }

  /* Hoja náutica principal: corrige subpaletas verdes, rojas y azules heredadas */
  :global(.nautical-sheet){background:#13262e!important;color:#ffffff!important;border-color:#5fe6e0!important}
  :global(.nautical-header){background:#0f1e26!important;border-bottom:1px solid #3fb8b8!important}
  :global(.nautical-header .sheet-kicker),:global(.nautical-sheet .sheet-kicker){color:#b5bec3!important}
  :global(.nautical-header .character-name),:global(.nautical-header .sheet-banner-meta){color:#ffffff!important}
  :global(.nautical-header .sheet-banner-meta span+span){border-color:#3fb8b8!important}
  :global(.portrait-frame){border-color:#5fe6e0!important;box-shadow:0 0 0 3px #3fb8b8!important}
  :global(.header-actions button){background:#13262e!important;border:1px solid #b5bec3!important;color:#ffffff!important}
  :global(.nautical-quick-stats){background:#13262e!important;border-color:#5fe6e0!important}
  :global(.nautical-quick-stats>div),:global(.nautical-quick-stats .quick-stats-row>div){
    background:#13262e!important;border:1px solid #5fe6e0!important;color:#ffffff!important
  }
  :global(.nautical-quick-stats>div>span){color:#b5bec3!important}
  :global(.nautical-quick-stats>div>strong){color:#ffffff!important}
  :global(.nautical-quick-stats .attribute-plaque){
    background:#13262e!important;border:2px solid #b5bec3!important;color:#ffffff!important
  }
  :global(.nautical-quick-stats .attribute-plaque strong),
  :global(.nautical-quick-stats .attribute-plaque .ability-score){color:#ffffff!important}
  :global(.nautical-quick-stats .attribute-plaque .ability-bonus-roll){
    background:#13262e!important;border:1px solid #5fe6e0!important;color:#ffffff!important
  }
  :global(.nautical-quick-stats .attribute-plaque .ability-bonus-empty),
  :global(.nautical-quick-stats .attribute-plaque .saving-throw-line span),
  :global(.nautical-quick-stats .attribute-plaque .saving-throw-line strong){color:#b5bec3!important}
  :global(.nautical-quick-stats .attribute-plaque .saving-throw-line){border-color:#3fb8b8!important}
  :global(.nautical-quick-stats .attribute-plaque .saving-throw-line.proficient span),
  :global(.nautical-quick-stats .attribute-plaque .saving-throw-line.proficient strong){color:#b5bec3!important}
  :global(.nautical-columns){background:#13262e!important}
  :global(.nautical-side),:global(.nautical-skills),:global(.nautical-content){color:#ffffff!important;scrollbar-color:#b5bec3 #3fb8b8!important}
  :global(.nautical-columns .sheet-section){
    background:#13262e!important;color:#ffffff!important;border:1px solid #5fe6e0!important;
    border-top:2px solid #b5bec3!important
  }
  :global(.nautical-columns .sheet-section-title){background:transparent!important;border-color:#3fb8b8!important}
  :global(.nautical-columns .sheet-section-title h3),
  :global(.nautical-columns .section-name){color:#ffffff!important}
  :global(.nautical-columns .sheet-stat){background:transparent!important;border-color:#3fb8b8!important}
  :global(.nautical-columns .stat-label),:global(.nautical-columns .sheet-stat span){color:#b5bec3!important}
  :global(.nautical-columns .stat-value),:global(.nautical-columns .sheet-stat strong){
    background:#13262e!important;color:#ffffff!important;border:1px solid #3fb8b8!important
  }
  :global(.nautical-skills .sheet-stat.proficient .stat-label),
  :global(.nautical-skills .sheet-stat.proficient .stat-value),
  :global(.nautical-skills .sheet-stat.proficient .skill-number){color:#b5bec3!important}
  :global(.nautical-skills .sheet-stat .skill-number){color:#ffffff!important}
  :global(.nautical-import){background:#13262e!important;border-color:#5fe6e0!important;color:#ffffff!important}
  :global(.nautical-tabs){border-color:#5fe6e0!important}
  :global(.nautical-tabs button){background:transparent!important;color:#b5bec3!important;border-color:transparent!important}
  :global(.nautical-tabs button.active){
    background:#13262e!important;color:#ffffff!important;border-color:transparent!important;
    border-bottom:3px solid #b5bec3!important
  }
  :global(.nautical-tab-content){background:transparent!important;color:#ffffff!important}
  :global(.weapon-mastery-summary),:global(.weapon-attack-card),
  :global(.weapon-attack-values>div),:global(.spellcasting-summary-grid>div),
  :global(.spell-slot-summary),:global(.player-spell-card),
  :global(.player-feature-card),:global(.player-feat-section){
    background:#13262e!important;color:#ffffff!important;border-color:#3fb8b8!important
  }
  :global(.weapon-attack-card h4),:global(.player-spell-name),
  :global(.player-feature-name){color:#ffffff!important}
  :global(.weapon-attack-values span),:global(.player-feature-source),
  :global(.player-spell-level){color:#b5bec3!important}
  :global(.weapon-attack-values strong),:global(.player-spell-description),
  :global(.player-spell-checks){color:#ffffff!important}
  :global(.weapon-attacks-section .weapon-mastery-summary){
    background:#13262e!important;color:#b5bec3!important;border-color:#3fb8b8!important
  }
  :global(.skill-column-labels){color:#b5bec3!important}
  :global(.nautical-empty){background:#13262e!important;color:#b5bec3!important;border-color:#5fe6e0!important}
  :global(.nautical-sheet .inline-roll){color:#b5bec3!important}

  /* Cabecera y componentes del diseño D&D Beyond anterior */
  :global(.ddb-character-header){background:#0f1e26!important;color:#ffffff!important;border:1px solid #3fb8b8!important}
  :global(.ddb-character-header .sheet-kicker),
  :global(.sheet-quick-stats>div>span){color:#b5bec3!important}
  :global(.ddb-character-header .character-name),
  :global(.sheet-quick-stats>div>strong){color:#ffffff!important}
  :global(.sheet-quick-stats>div){background:#13262e!important;border:1px solid #5fe6e0!important}
  :global(.sheet-banner-emblem){background:#13262e!important;color:#b5bec3!important;border-color:#5fe6e0!important}
  :global(.ddb-section-nav button){background:#13262e!important;color:#b5bec3!important;border-color:#3fb8b8!important}
  :global(.ddb-section-nav button.active){background:#13262e!important;color:#ffffff!important;border-bottom:3px solid #b5bec3!important}
  :global(.sheet-quick-stats),:global(.continuous-sheet-grid){background:transparent!important;color:#ffffff!important}

  /* Manuales, inventario, conjuros, monstruos, tablas y gestión del GM */
  :global(.items-table),:global(.chest-table){background:#13262e!important;color:#ffffff!important}
  :global(.items-table th),:global(.chest-table th){background:#13262e!important;color:#ffffff!important;border-color:#3fb8b8!important}
  :global(.items-table td),:global(.chest-table td){background:#13262e!important;color:#b5bec3!important;border-color:#3fb8b8!important}
  :global(.items-table td:first-child),:global(.chest-table td:first-child){color:#ffffff!important}
  :global(.items-filters fieldset),:global(.items-filters legend){background:#13262e!important;color:#b5bec3!important;border-color:#3fb8b8!important}
  :global(.spell-card),:global(.monster-entry),:global(.monster-combat-grid div),
  :global(.monster-info-item),:global(.spell-meta),:global(.monster-attacks),
  :global(.monster-role),:global(.chest-result),:global(.roll-notation),:global(.roll-result){
    background:#13262e!important;color:#ffffff!important;border-color:#3fb8b8!important
  }
  :global(.spell-card>summary),:global(.spell-name),:global(.monster-name),
  :global(.monster-entry strong),:global(.monster-original){color:#ffffff!important}
  :global(.spell-subtitle),:global(.monster-subtitle),:global(.monster-source),
  :global(.monster-attribution),:global(.spell-source),:global(.monster-info-item small),
  :global(.monster-combat-grid small){color:#b5bec3!important}
  :global(.spell-details),:global(.monster-statblock){background:#13262e!important;color:#ffffff!important;border-color:#3fb8b8!important}
  :global(.monster-heading){border-bottom-color:#b5bec3!important}
  :global(.monster-heading h3),:global(.monster-content-section h4){color:#b5bec3!important}
  :global(.monster-content-section){border-top-color:#5fe6e0!important}
  :global(.monster-cr),:global(.spell-level){background:#13262e!important;color:#b5bec3!important;border-color:#5fe6e0!important}
  :global(.github-status),:global(.github-folder-chip),:global(.builder-info),
  :global(.builder-choice-wrapper),:global(.builder-choice-field){
    background:#13262e!important;color:#ffffff!important;border-color:#5fe6e0!important
  }
  :global(.github-character-row strong),:global(.github-character-row){color:#ffffff!important}
  :global(.github-character-row small){color:#b5bec3!important}
  :global(.empty-state){color:#b5bec3!important}


  /* Corrección específica de superficies beige que sobrevivían a la paleta global */
  :global(.builder-panel>label),:global(.builder-panel label){color:#b5bec3!important}
  :global(.builder-panel input),:global(.builder-panel select),:global(.builder-panel textarea),
  :global(.github-folder-create input),:global(.github-character-actions select){
    background:#13262e!important;color:#ffffff!important;border:1px solid #3fb8b8!important
  }
  :global(.builder-progress){background:#13262e!important}
  :global(.builder-info),:global(.builder-name-block),:global(.builder-choice-wrapper),
  :global(.builder-choice-field),:global(.builder-option-card),:global(.builder-option-description),
  :global(.builder-skill-card),:global(.builder-checkbox){
    background:#13262e!important;color:#ffffff!important;border-color:#5fe6e0!important
  }
  :global(.builder-class-card),:global(.builder-class-card:hover){
    background:#13262e!important;border:1px solid #5fe6e0!important;color:#ffffff!important
  }
  :global(.builder-panel .builder-class-card.selected),:global(.builder-class-card.selected){
    background:#13262e!important;border:2px solid #b5bec3!important;color:#ffffff!important
  }
  :global(.builder-class-card-heading),:global(.builder-class-card-heading strong),
  :global(.builder-class-meta strong),:global(.builder-option-card strong){color:#ffffff!important}
  :global(.builder-class-description),:global(.builder-class-meta),
  :global(.builder-option-description),:global(.builder-skill-description){color:#b5bec3!important}
  :global(.builder-class-meta),:global(.builder-class-meta>span){border-color:#3fb8b8!important;color:#b5bec3!important}
  :global(.builder-class-card-heading>span),:global(.builder-option-badge){
    background:#13262e!important;color:#b5bec3!important;border-color:#5fe6e0!important
  }
  :global(.builder-checkbox:has(input:checked)){
    background:#13262e!important;border-color:#b5bec3!important;color:#ffffff!important
  }
  :global(.builder-checkbox:has(input:disabled):not(:has(input:checked))){
    background:#13262e!important;color:#b5bec3!important;border-color:#3fb8b8!important
  }
  :global(.builder-checkbox:has(input:focus-visible)){outline-color:#b5bec3!important}
  :global(.master-tabs button){background:#13262e!important;color:#b5bec3!important;border-color:#3fb8b8!important}
  :global(.master-tabs button.active){background:#1b2a33!important;color:#3fb8b8!important;border-color:#b5bec3!important}
  :global(.github-config-panel),:global(.github-character-row),:global(.github-folder-chip),
  :global(.github-status),:global(.github-character-actions button){
    background:#13262e!important;color:#ffffff!important;border-color:#5fe6e0!important
  }
  :global(.github-character-row small){color:#b5bec3!important}
  :global(.attributes-section),:global(.features-section .sheet-stat),
  :global(.features-section .sheet-stat strong),:global(.features-section .stat-value){
    background:#13262e!important;color:#ffffff!important;border-color:#5fe6e0!important
  }
  :global(.attributes-section .sheet-stat){background:#13262e!important;border-color:#3fb8b8!important}
  :global(.editable:hover){background:#13262e!important;border-color:#b5bec3!important}
  :global(.sheet-tabs button){background:#13262e!important;color:#b5bec3!important;border-color:#3fb8b8!important}
  :global(.sheet-tabs button.active){background:#13262e!important;color:#ffffff!important;border-color:#b5bec3!important}


  /* Auditoría integral final: eliminar superficies cálidas heredadas en todos los módulos */
  :global(.spell-meta),:global(.monster-combat-grid div),:global(.monster-attacks),
  :global(.monster-info-item),:global(.monster-entry),:global(.custom-rolls),
  :global(.custom-roll-card),:global(.roll-notation),:global(.roll-result),
  :global(.sheet-section),:global(.combat-section),:global(.attributes-section),
  :global(.attributes-section .sheet-stat),:global(.stat-value),
  :global(.chest-result),:global(.chest-table-wrap),:global(.chest-table),
  :global(.github-config-panel),:global(.github-character-row),:global(.github-folder-chip),
  :global(.github-status),:global(.ddb-content-panel),:global(.weapon-mastery-summary),
  :global(.weapon-attack-card),:global(.player-spell-card),
  :global(.player-feat-section .player-feature-card),:global(.subclass-level-preview),
  :global(.trait-editor),:global(.import-box),:global(.character-card),:global(.monster-card){
    background:#13262e!important;color:#ffffff!important;border-color:#3fb8b8!important
  }
  :global(.combat-section),:global(.attributes-section){border-top-color:#b5bec3!important}
  :global(.sheet-section){border:1px solid #3fb8b8!important;border-top:2px solid #5fe6e0!important}
  :global(.sheet-section-title),:global(.roll-entry),:global(.trait-view),
  :global(.traits-preview),:global(.subheading),:global(.monster-attacks),
  :global(.monster-source),:global(.spell-source){border-color:#3fb8b8!important}
  :global(.editable),:global(.editable:focus),:global(.stat-value),
  :global(.roll-creator input),:global(.roll-creator select),
  :global(.github-folder-create input),:global(.github-character-actions select){
    background:#13262e!important;color:#ffffff!important;border-color:#3fb8b8!important
  }
  :global(.editable:hover){background:#13262e!important;border-color:#b5bec3!important}
  :global(.roll-creator button),:global(.roll-actions button),
  :global(.sheet-tabs button),:global(.master-tabs button),
  :global(.player-tabs button),:global(.ddb-section-nav button){
    background:#13262e!important;color:#b5bec3!important;border-color:#3fb8b8!important
  }
  :global(.sheet-tabs button.active),:global(.master-tabs button.active),
  :global(.player-tabs button.active),:global(.ddb-section-nav button.active){
    background:#1b2a33!important;color:#3fb8b8!important;border-color:#b5bec3!important
  }
  :global(.roll-notation),:global(.roll-result){background:#13262e!important;color:#b5bec3!important;border-color:#5fe6e0!important}
  :global(.chest-result-number),:global(.chest-result>span:last-child),
  :global(.spellcasting-summary-grid>div>span),:global(.weapon-attack-values span),
  :global(.player-spell-checks label),:global(.monster-combat-grid small),
  :global(.stat-label),:global(.key),:global(.hint),:global(.muted){
    color:#b5bec3!important
  }
  :global(.chest-result strong),:global(.roll-entry-top strong),
  :global(.trait-view strong),:global(.monster-card h3),:global(.character-card h3),
  :global(.weapon-attack-card h4),:global(.player-feature-name){color:#ffffff!important}
  :global(.gm-sheet-details summary),:global(.monster-source summary),
  :global(.trait-group h3),:global(.roll-result b){color:#b5bec3!important}
  :global(.equipment-section),:global(.general-section),:global(.features-section),
  :global(.attacks-section),:global(.skills-section),:global(.spells-section){
    background:#13262e!important;color:#ffffff!important;border-color:#3fb8b8!important
  }
  :global(.player-spell-level),:global(.player-feature-source),
  :global(.trait-level),:global(.free-tag),:global(.count){
    color:#b5bec3!important;border-color:#5fe6e0!important
  }
  :global(.toast){background:#13262e!important;color:#ffffff!important;border-color:#5fe6e0!important}
  :global(.primary),:global(button.primary){background:#1b2a33!important;color:#3fb8b8!important;border-color:#b5bec3!important}
  :global(.primary:hover),:global(button.primary:hover){background:#1b2a33!important}



/* PALETA CANÓNICA ÚNICA — Forja de Aventureros */
:global(:root){
 --paper:#13262e;--paper-deep:#1b2a33;--ink:#ffffff;--ink-soft:#b5bec3;
 --rule:#3a4a52;--red:#3fb8b8;--gold:#5fe6e0;
 --ocean-0:#0b171d;--ocean-1:#0f1e26;--ocean-2:#13262e;
 --slate-1:#1b2a33;--slate-2:#22333d;--aqua:#5fe6e0;--aqua-mid:#3fb8b8;
 --text-main:#ffffff;--text-secondary:#b5bec3;--text-muted:#8e9aa1;--line:#3a4a52
}
:global(html),:global(body){background:#0b171d!important;color:#ffffff!important}
:global(body){background:radial-gradient(ellipse at 50% 0%,#18343a 0,#0f1e26 42%,#0b171d 100%)!important}
:global(.app-shell),:global(.main){color:#ffffff!important}
:global(.topbar){background:#0f1e26!important;border-color:#3a4a52!important}
:global(.brand),:global(.brand strong),:global(h1),:global(h2),:global(h3),:global(h4){color:#ffffff!important}
:global(.brand small),:global(.intro),:global(.connection),:global(.hint),:global(.muted),:global(.stat-label),:global(.monster-source),:global(.spell-source){color:#b5bec3!important}
:global(.brand-mark),:global(.eyebrow),:global(.section-name),:global(.trait-group h3){color:#5fe6e0!important}
:global(.panel),:global(.character-card),:global(.monster-card),:global(.trait-editor),:global(.import-box),
:global(.ability),:global(.builder-panel),:global(.level-up-panel),:global(.items-panel),
:global(.character-sheet),:global(.sheet-section),:global(.custom-rolls),:global(.custom-roll-card),
:global(.spell-card),:global(.monster-statblock),:global(.ddb-content-panel),:global(.github-config-panel),
:global(.github-character-row),:global(.github-folder-chip),:global(.github-status),:global(.builder-info),
:global(.builder-choice-wrapper),:global(.builder-choice-field),:global(.builder-option-card),
:global(.builder-skill-card),:global(.builder-class-card),:global(.weapon-attack-card),
:global(.weapon-mastery-summary),:global(.player-spell-card),:global(.player-feature-card),
:global(.player-feat-section),:global(.new-roll-part){background:#13262e!important;color:#ffffff!important;border-color:#3a6870!important}
:global(.spell-meta),:global(.monster-combat-grid div),:global(.monster-info-item),
:global(.monster-attacks),:global(.monster-role),:global(.monster-entry),
:global(.roll-result),:global(.roll-notation),:global(.chest-result),
:global(.sheet-quick-stats>div),:global(.builder-option-description),
:global(.subclass-level-preview),:global(.traits-preview),:global(.trait-view){background:#1b2a33!important;color:#ffffff!important;border-color:#3a4a52!important}
:global(input),:global(textarea),:global(select){background:#0b171d!important;color:#ffffff!important;border-color:#3a4a52!important}
:global(input:focus),:global(textarea:focus),:global(select:focus){border-color:#5fe6e0!important;outline-color:#5fe6e0!important}
:global(input::placeholder),:global(textarea::placeholder){color:#8e9aa1!important}
:global(button),:global(.secondary),:global(.master-tabs button),:global(.sheet-tabs button),
:global(.player-tabs button),:global(.ddb-section-nav button),:global(.roll-actions button){
 background:#1b2a33!important;color:#b5bec3!important;border-color:#3a4a52!important
}
:global(button.active),:global(.master-tabs button.active),:global(.sheet-tabs button.active),
:global(.player-tabs button.active),:global(.ddb-section-nav button.active){
 background:#5fe6e0!important;color:#0f1e26!important;border-color:#5fe6e0!important
}
:global(.primary),:global(button.primary){background:#5fe6e0!important;color:#0f1e26!important;border-color:#5fe6e0!important}
:global(.primary:hover),:global(button.primary:hover){background:#79f1eb!important}
:global(.sheet-section-title),:global(.sheet-stat),:global(.roll-entry),:global(.trait-view),
:global(.traits-preview),:global(.subheading),:global(.monster-source),:global(.spell-source){border-color:#3a4a52!important}
:global(.stat-value),:global(.sheet-stat strong),:global(.character-name),:global(.spell-name),
:global(.monster-name),:global(.monster-entry strong),:global(.weapon-attack-card h4),
:global(.player-feature-name),:global(.chest-result strong){color:#ffffff!important}
:global(.spell-subtitle),:global(.monster-subtitle),:global(.monster-info-item small),
:global(.monster-combat-grid small),:global(.player-feature-source),:global(.player-spell-level),
:global(.weapon-attack-values span),:global(.chest-result-number),:global(.chest-result>span:last-child){color:#b5bec3!important}
:global(.roll-result b),:global(.trait-level),:global(.card-symbol){color:#5fe6e0!important}
:global(.toast){background:#1b2a33!important;color:#ffffff!important;border-color:#3fb8b8!important}
:global(footer){border-color:#3a4a52!important;color:#8e9aa1!important}
:global(.builder-progress){background:#1b2a33!important}
:global(.builder-progress span){background:#5fe6e0!important}
:global(.chest-table th),:global(.items-table th){background:#1b2a33!important;color:#ffffff!important}
:global(.chest-table td),:global(.items-table td){background:#13262e!important;color:#b5bec3!important;border-color:#3a4a52!important}
:global(.chest-table td:first-child),:global(.items-table td:first-child){color:#ffffff!important}
:global(.editable),:global(.stat-value){background:#0b171d!important;color:#ffffff!important}
:global(.editable:hover){background:#13262e!important;border-color:#5fe6e0!important}
:global(.monster-heading){border-bottom-color:#5fe6e0!important}
:global(.monster-content-section){border-top-color:#3fb8b8!important}
:global(.monster-content-section h4){color:#5fe6e0!important}
:global(.empty-state){color:#b5bec3!important}


/* Componentes náuticos específicos: superficies y estados */
:global(.nautical-sheet){background:#0f1e26!important;border-color:#3a6870!important;color:#ffffff!important}
:global(.nautical-sheet .inline-roll.proficient){color:#ffd54a!important;border-color:#ffd54a!important}
:global(.nautical-sheet .inline-roll.expertise){color:#ff5252!important;border-color:#ff5252!important}
:global(.nautical-sheet .sheet-stat.expertise .stat-label){color:#ff5252!important}
:global(.nautical-sheet .sheet-stat.proficient:not(.expertise) .stat-label){color:#ffd54a!important}
:global(.nautical-sheet .saving-throw-line.proficient .inline-roll){color:#ffd54a!important;border-color:#ffd54a!important}
:global(.nautical-sheet .proficiency-bonus){color:#ffd54a!important}
:global(.nautical-header){background:linear-gradient(115deg,#13262e,#0f1e26 70%,#1b2a33)!important;border-color:#3a4a52!important}
:global(.portrait-frame){background:radial-gradient(circle,#1b2a33,#0b171d 70%)!important;border-color:#5fe6e0!important;box-shadow:0 0 0 3px #3a4a52!important;color:#5fe6e0!important}
:global(.header-actions button){background:#1b2a33!important;color:#b5bec3!important;border-color:#3a4a52!important}
:global(.nautical-quick-stats){background:#13262e!important;border-color:#3a4a52!important}
:global(.nautical-quick-stats>div),:global(.nautical-quick-stats>.quick-stats-row>div){background:#1b2a33!important;border-color:#3a4a52!important}
:global(.nautical-quick-stats .attribute-plaque){background:#1b2a33!important;border-color:#3fb8b8!important}
:global(.nautical-quick-stats .ability-bonus-empty),:global(.nautical-quick-stats .saving-throw-line span){color:#b5bec3!important}
:global(.nautical-quick-stats .saving-throw-line){border-color:#3a4a52!important}
:global(.nautical-import){background:#13262e!important;border-color:#3a4a52!important}
:global(.nautical-columns){background:#0b171d!important}
:global(.nautical-side),:global(.nautical-skills),:global(.nautical-content){scrollbar-color:#3a4a52 #0b171d!important}
:global(.nautical-columns .sheet-section){background:#13262e!important;border-color:#3a6870!important}
:global(.nautical-columns .sheet-section-title){border-color:#3a4a52!important}
:global(.nautical-tabs){border-color:#3a4a52!important}
:global(.nautical-tabs button){background:#1b2a33!important;color:#b5bec3!important;border-color:#3a4a52!important}
:global(.nautical-tabs button.active){background:#5fe6e0!important;color:#0f1e26!important;border-color:#5fe6e0!important}
:global(.weapon-attacks-section .weapon-mastery-summary),:global(.spellcasting-summary-grid>div),
:global(.player-spell-card),:global(.player-feature-card),:global(.player-feat-section .player-feature-card){
 background:#1b2a33!important;color:#ffffff!important;border-color:#3a4a52!important
}
:global(.weapon-attack-card){background:#1b2a33!important;border-color:#3a4a52!important}
:global(.weapon-attack-values span),:global(.nautical-quick-stats .ability-bonus-empty),
:global(.nautical-quick-stats .saving-throw-line span){color:#b5bec3!important}
:global(.builder-class-card){background:#13262e!important;border-color:#3a6870!important;color:#ffffff!important}
:global(.builder-class-card:hover){background:#1b2a33!important;border-color:#5fe6e0!important}
:global(.builder-class-card.selected){background:#1b2a33!important;border:2px solid #5fe6e0!important}
:global(.builder-class-card-heading),:global(.builder-class-meta>strong){color:#ffffff!important}
:global(.builder-class-meta>span),:global(.builder-option-description),:global(.builder-skill-description){color:#b5bec3!important}
:global(.builder-class-meta){border-color:#3a4a52!important}
:global(.builder-checkbox){background:#13262e!important;color:#ffffff!important;border-color:#3a4a52!important}
:global(.builder-checkbox>span),:global(.builder-checkbox>span b){color:#ffffff!important}
:global(.builder-checkbox:has(input:checked)){background:#1b2a33!important;border-color:#5fe6e0!important}
:global(.eyebrow span),:global(.monster-stats),:global(.dice-status),:global(.roll-result span){color:#b5bec3!important}
:global(.roll-entry p),:global(.trait-view p),:global(.monster-card p),:global(.character-card p){color:#b5bec3!important}

/* Contraste definitivo: superficies oscuras y acentos con texto legible */
:global(html),:global(body),:global(#app){background:#0b171d!important;color:#ffffff!important}
:global(.app-shell),:global(.main),:global(.gm-layout){background:transparent!important;color:#ffffff!important}
:global(.panel),:global(.builder-panel),:global(.level-up-panel),:global(.progression-panel),
:global(.spellbook-panel),:global(.rules-panel),:global(.items-panel),:global(.spells-panel),
:global(.monsters-panel),:global(.roster-panel),:global(.save-panel),:global(.chest-panel),
:global(.github-config-panel),:global(.github-character-row),:global(.github-status),
:global(.builder-info),:global(.builder-choice-wrapper),:global(.builder-choice-field),
:global(.builder-option-card),:global(.builder-skill-card),:global(.builder-class-card),
:global(.character-sheet),:global(.gm-character-sheet),:global(.nautical-sheet),
:global(.sheet-section),:global(.combat-section),:global(.attributes-section),
:global(.skills-section),:global(.features-section),:global(.magic-section),
:global(.equipment-section),:global(.story-section),:global(.general-section),
:global(.spell-card),:global(.spell-details),:global(.monster-entry),
:global(.monster-statblock),:global(.monster-info-item),:global(.monster-attacks),
:global(.monster-role),:global(.monster-combat-grid div),:global(.spell-meta),
:global(.roll-notation),:global(.roll-result),:global(.chest-result),
:global(.character-card),:global(.monster-card),:global(.trait-editor),
:global(.import-box),:global(.custom-rolls),:global(.custom-roll-card),
:global(.weapon-attack-card),:global(.weapon-mastery-summary),
:global(.player-spell-card),:global(.player-feature-card),:global(.player-feat-section),
:global(.subclass-level-preview),:global(.new-roll-part),:global(.nautical-quick-stats),
:global(.nautical-quick-stats>div),:global(.sheet-quick-stats>div){
 background:#13262e!important;color:#ffffff!important;border-color:#3a4a52!important
}
:global(input),:global(textarea),:global(select),:global(.editable),:global(.sheet-readonly-value){
 background:#0b171d!important;color:#ffffff!important;border-color:#3a4a52!important
}
:global(input::placeholder),:global(textarea::placeholder){color:#8e9aa1!important}
:global(button),:global(.secondary),:global(.master-tabs button),:global(.sheet-tabs button),
:global(.player-tabs button),:global(.character-tabs button),:global(.ddb-section-nav button),
:global(.roll-actions button),:global(.roll-creator button),:global(.header-actions button),
:global(.github-character-actions button){
 background:#1b2a33!important;color:#b5bec3!important;border-color:#3a4a52!important
}
:global(button.active),:global(.master-tabs button.active),:global(.sheet-tabs button.active),
:global(.player-tabs button.active),:global(.character-tabs button.active),
:global(.ddb-section-nav button.active),:global(.nautical-tabs button.active),
:global(button.primary),:global(.primary){
 background:#5fe6e0!important;color:#0f1e26!important;border-color:#5fe6e0!important
}
:global(.builder-class-card.selected),:global(.builder-option-card.selected),
:global(.builder-checkbox:has(input:checked)){
 background:#1b2a33!important;color:#ffffff!important;border:2px solid #5fe6e0!important
}
:global(.builder-progress){background:#1b2a33!important}
:global(.builder-progress span){background:#5fe6e0!important}
:global(.brand),:global(h1),:global(h2),:global(h3),:global(h4),
:global(.character-name),:global(.sheet-stat strong),:global(.stat-value){color:#ffffff!important}
:global(label),:global(.hint),:global(.muted),:global(.stat-label),
:global(.sheet-stat span),:global(.builder-option-description),
:global(.builder-skill-description),:global(.monster-source),
:global(.spell-source),:global(.monster-subtitle),:global(.spell-subtitle),
:global(.roll-entry p),:global(.trait-view p){color:#b5bec3!important}
:global(.brand-mark),:global(.eyebrow),:global(.section-name),
:global(.trait-level),:global(.roll-result b),:global(.card-symbol){color:#5fe6e0!important}
:global(.toast){background:#1b2a33!important;color:#ffffff!important;border-color:#3fb8b8!important}
:global(.chest-table th),:global(.items-table th){background:#1b2a33!important;color:#ffffff!important}
:global(.chest-table td),:global(.items-table td){background:#13262e!important;color:#b5bec3!important;border-color:#3a4a52!important}

  /* Aplicación efectiva de las variables del configurador global */
  :global(html),:global(body),:global(#app){background:var(--gm-bg)!important}
  :global(.app-shell),:global(.main){color:var(--gm-text)!important}
  :global(.topbar),:global(.nautical-sheet),:global(.nautical-columns){background:var(--gm-bg)!important}
  :global(.panel),:global(.character-sheet),:global(.sheet-section),:global(.character-card),:global(.monster-card),:global(.spell-card),:global(.weapon-attack-card),:global(.player-feature-card),:global(.player-spell-card),:global(.builder-option-card),:global(.builder-class-card),:global(.trait-editor),:global(.import-box),:global(.custom-roll-card),:global(.ddb-content-panel),:global(.chest-result),:global(.roll-result){background:var(--gm-panel)!important;color:var(--gm-text)!important;border-color:var(--gm-border)!important;border-radius:var(--gm-radius)!important}
  :global(input),:global(textarea),:global(select),:global(.editable){background:var(--gm-bg)!important;color:var(--gm-text)!important;border-color:var(--gm-border)!important}
  :global(button),:global(.secondary),:global(.master-tabs button),:global(.nautical-tabs button){background:var(--gm-card)!important;color:var(--gm-muted)!important;border-color:var(--gm-border)!important}
  :global(button.active),:global(.master-tabs button.active),:global(.nautical-tabs button.active),:global(button.primary),:global(.primary){background:var(--gm-accent)!important;color:var(--gm-bg)!important;border-color:var(--gm-accent)!important}
  :global(h1),:global(h2),:global(h3),:global(h4),:global(.character-name),:global(.stat-value),:global(.rule-name){color:var(--gm-text)!important}
  :global(.muted),:global(.hint),:global(label),:global(.stat-label),:global(.sheet-notes-content),:global(.rule-description),:global(.rule-source){color:var(--gm-muted)!important}
  :global(.brand-mark),:global(.eyebrow),:global(.section-name),:global(.trait-level),:global(.count),:global(.card-symbol){color:var(--gm-accent)!important}
  :global(.panel),:global(.sheet-section),:global(.character-card),:global(.monster-card){padding:var(--gm-panel-padding)!important}
  :global(.nautical-columns){gap:var(--gm-panel-gap)!important}
  :global(.nautical-columns .sheet-section-title),:global(.sheet-stat),:global(.sheet-section-title){border-color:var(--gm-border)!important}
  :global(.rules-panel .rule-description),:global(.rules-panel .rule-details),:global(.rules-panel .rule-source){color:#fff!important}
  :global(.style-preview-card){background:var(--gm-panel)!important;color:var(--gm-text)!important;border-color:var(--gm-border)!important}
  :global(.style-preview-card p){color:var(--gm-muted)!important}

  /* Restaurar las tarjetas de selección del creador */
  :global(.builder-panel .builder-class-grid){display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:.75rem!important}
  :global(.builder-panel label.builder-class-card){position:relative!important;display:flex!important;min-width:0!important;flex-direction:column!important;gap:.55rem!important;padding:.85rem!important;border:1px solid #3a6870!important;border-top:3px solid #3a6870!important;border-radius:9px!important;background:#13262e!important;color:#ffffff!important;cursor:pointer!important;box-shadow:0 2px 8px #0003!important;transition:border-color .15s,background .15s,transform .15s!important}
  :global(.builder-panel label.builder-class-card:hover){background:#1b2a33!important;border-color:#5fe6e0!important;transform:translateY(-1px)}
  :global(.builder-panel label.builder-class-card.selected){border:2px solid #5fe6e0!important;border-top:4px solid #5fe6e0!important;background:#1b2a33!important;box-shadow:0 0 0 2px #5fe6e022!important}
  :global(.builder-panel label.builder-class-card input[type="radio"]){position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important;opacity:0!important;pointer-events:none!important}
  :global(.builder-panel .builder-class-card-heading){display:flex!important;align-items:center!important;justify-content:space-between!important;gap:.5rem!important;color:#ffffff!important}
  :global(.builder-panel .builder-class-description){color:#b5bec3!important}
  :global(.builder-panel .builder-class-meta){border-top:1px solid #3a4a52!important}
  :global(.builder-panel .builder-class-meta>span){color:#5fe6e0!important}
  :global(.builder-panel .builder-class-meta>strong){color:#ffffff!important}
  :global(.builder-panel .builder-checkbox){position:relative!important;display:flex!important;align-items:flex-start!important;gap:.6rem!important;padding:.7rem!important;border:1px solid #3a4a52!important;border-radius:7px!important;background:#13262e!important;color:#ffffff!important;cursor:pointer!important}
  :global(.builder-panel .builder-checkbox:has(input:checked)){border-color:#5fe6e0!important;background:#1b2a33!important}
  @media(max-width:460px){:global(.builder-panel .builder-class-grid){grid-template-columns:1fr!important}}

  /* Corrección directa: las opciones de clase, especie y trasfondo son tarjetas radio, no campos */
  :global(.builder-class-grid){display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;align-items:stretch!important}
  :global(label.builder-class-card){
    box-sizing:border-box!important;display:flex!important;position:relative!important;flex-direction:column!important;
    gap:9px!important;min-width:0!important;min-height:150px!important;padding:14px!important;
    border:1px solid #3a6870!important;border-top:3px solid #3a6870!important;border-radius:10px!important;
    background:#13262e!important;color:#fff!important;cursor:pointer!important;
    box-shadow:0 3px 10px #0004!important
  }
  :global(label.builder-class-card:hover){background:#1b2a33!important;border-color:#5fe6e0!important}
  :global(label.builder-class-card.selected){background:#1b2a33!important;border:2px solid #5fe6e0!important;box-shadow:0 0 0 2px #5fe6e022!important}
  :global(label.builder-class-card > input[type="radio"]){
    appearance:none!important;-webkit-appearance:none!important;
    position:absolute!important;opacity:0!important;width:1px!important;height:1px!important;
    margin:0!important;padding:0!important;pointer-events:none!important
  }
  :global(label.builder-class-card .builder-class-card-heading){display:flex!important;justify-content:space-between!important;align-items:center!important;gap:8px!important;color:#fff!important}
  :global(label.builder-class-card .builder-class-card-heading strong){font-size:1.08em!important;color:#fff!important}
  :global(label.builder-class-card .builder-class-card-heading span){color:#5fe6e0!important}
  :global(label.builder-class-card .builder-class-description){display:block!important;color:#b5bec3!important;line-height:1.45!important}
  :global(label.builder-class-card .builder-class-meta){display:flex!important;justify-content:space-between!important;gap:8px!important;padding-top:7px!important;border-top:1px solid #3a4a52!important}
  :global(label.builder-class-card .builder-class-meta span){color:#8e9aa1!important}
  :global(label.builder-class-card .builder-class-meta strong){color:#fff!important;text-align:right!important}
  :global(.builder-checkbox-grid){display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
  @media(max-width:520px){:global(.builder-class-grid),:global(.builder-checkbox-grid){grid-template-columns:1fr!important}}



  /* Ajuste de competencias y elecciones múltiples del creador.
     La regla general .builder-panel input estaba convirtiendo cada checkbox
     en un campo de texto de ancho completo. */
  :global(.builder-panel .builder-checkbox){
    box-sizing:border-box!important;display:flex!important;flex-direction:row!important;
    align-items:flex-start!important;gap:10px!important;width:100%!important;
    min-width:0!important;min-height:0!important;margin:0!important;padding:10px 12px!important;
    border:1px solid #3a4a52!important;border-left:3px solid #3a4a52!important;
    border-radius:8px!important;background:#13262e!important;color:#ffffff!important;
    line-height:1.4!important;cursor:pointer!important;
  }
  :global(.builder-panel .builder-checkbox > input[type="checkbox"]){
    display:block!important;appearance:auto!important;-webkit-appearance:checkbox!important;
    flex:0 0 17px!important;width:17px!important;min-width:17px!important;max-width:17px!important;
    height:17px!important;margin:2px 0 0!important;padding:0!important;border:0!important;
    border-radius:3px!important;background:transparent!important;accent-color:#5fe6e0!important;
    box-shadow:none!important;
  }
  :global(.builder-panel .builder-checkbox > span){
    display:block!important;flex:1 1 auto!important;min-width:0!important;
    margin:0!important;padding:0!important;color:#ffffff!important;font-size:.82rem!important;line-height:1.4!important;
  }
  :global(.builder-panel .builder-checkbox > small),
  :global(.builder-panel .builder-checkbox .builder-skill-description){
    display:block!important;flex:1 1 100%!important;min-width:0!important;
    margin:3px 0 0!important;padding:0!important;color:#b5bec3!important;
    font-size:.72rem!important;line-height:1.45!important;
  }
  :global(.builder-panel .builder-checkbox:has(input:checked)){
    border-color:#5fe6e0!important;border-left-color:#5fe6e0!important;background:#1b2a33!important;
  }
  :global(.builder-panel .builder-checkbox:has(input:disabled)){opacity:.55!important;cursor:not-allowed!important}
  :global(.builder-panel .builder-checkbox-grid){
    display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
    align-items:stretch!important;gap:8px!important;min-width:0!important;
  }
  @media(max-width:520px){:global(.builder-panel .builder-checkbox-grid){grid-template-columns:1fr!important}}


  /* Distribución de la ficha: habilidades a la izquierda y acciones a la derecha. */
  :global(.nautical-columns){display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:.75rem!important;align-items:start!important}
  :global(.nautical-skills),:global(.nautical-actions){grid-row:1;min-width:0;max-height:none!important;height:auto!important;overflow:visible!important}
  :global(.nautical-skills){grid-column:1}
  :global(.nautical-actions){grid-column:2;display:flex;flex-direction:column;gap:.65rem}
  :global(.nautical-actions .sheet-section){margin:0}
  :global(.nautical-content){grid-column:1/-1!important;grid-row:2;min-width:0;max-height:none!important;height:auto!important;overflow:visible!important}
  @media(max-width:580px){
    :global(.nautical-columns){grid-template-columns:minmax(0,1fr)!important}
    :global(.nautical-skills),:global(.nautical-actions),:global(.nautical-content){grid-column:1!important;grid-row:auto!important}
  }

  /* Contraste del creador: texto blanco sobre superficies oscuras. */
  :global(.builder-panel),:global(.builder-panel *:not(input):not(textarea):not(select):not(option)){
    color:#ffffff!important
  }
  :global(.builder-panel>label),:global(.builder-panel label),:global(.builder-panel .muted),
  :global(.builder-panel .hint),:global(.builder-panel small),:global(.builder-panel .builder-class-description),
  :global(.builder-panel .builder-option-description),:global(.builder-panel .builder-skill-description){
    color:#b5bec3!important
  }
  :global(.builder-panel input:not([type=checkbox]):not([type=radio])),
  :global(.builder-panel textarea),:global(.builder-panel select),:global(.builder-panel option){
    background:#13262e!important;color:#ffffff!important;-webkit-text-fill-color:#ffffff!important
  }
  :global(.builder-panel .builder-class-card),:global(.builder-panel .builder-option-card),
  :global(.builder-panel .builder-checkbox),:global(.builder-panel .builder-skill-card){
    color:#ffffff!important
  }


  /* Renovación estética del asistente de creación: conserva paleta y geometría. */
  .builder-panel{
    gap:1rem!important;
    padding:clamp(18px,3vw,30px)!important;
    background:linear-gradient(145deg,#13262e 0%,#0f1e26 78%)!important;
    border:1px solid #3a6870!important;
    border-radius:14px!important;
    box-shadow:0 18px 42px #0005,inset 0 1px #ffffff08!important;
  }
  .builder-panel>.section-heading{
    align-items:flex-start!important;
    gap:12px!important;
    margin:0!important;
    padding-bottom:14px!important;
    border-bottom:1px solid #3a4a52!important;
  }
  .builder-panel>.section-heading h2{
    margin:0!important;
    font:700 clamp(1.15rem,2.5vw,1.55rem)/1.25 'Libre Baskerville',Georgia,serif!important;
    letter-spacing:-.025em!important;
    color:#fff!important;
  }
  .builder-panel>.section-heading .count{
    flex:0 0 auto!important;
    border-color:#3a6870!important;
    background:#0b171d!important;
    color:#5fe6e0!important;
    font-size:.68rem!important;
    letter-spacing:.04em!important;
  }
  .builder-panel>.builder-progress{
    height:6px!important;
    margin:0!important;
    border-radius:20px!important;
    background:#0b171d!important;
    box-shadow:inset 0 1px 3px #0008!important;
  }
  .builder-panel>.builder-progress span{
    border-radius:20px!important;
    background:linear-gradient(90deg,#3fb8b8,#5fe6e0)!important;
    box-shadow:0 0 12px #5fe6e055!important;
  }
  .builder-step-track{
    display:grid!important;
    grid-template-columns:repeat(6,minmax(0,1fr))!important;
    gap:7px!important;
    margin:0 0 .45rem!important;
  }
  .builder-step-track>span{
    display:flex!important;
    min-width:0!important;
    align-items:center!important;
    gap:7px!important;
    padding:7px 8px!important;
    border:1px solid #3a4a52!important;
    border-radius:7px!important;
    background:#0f1e26!important;
    color:#8e9aa1!important;
    transition:border-color .18s,background .18s,transform .18s!important;
  }
  .builder-step-track b{
    display:grid!important;
    flex:0 0 22px!important;
    width:22px!important;height:22px!important;
    place-items:center!important;
    border:1px solid #3a4a52!important;
    border-radius:50%!important;
    color:#8e9aa1!important;
    font-size:.67rem!important;
  }
  .builder-step-track small{
    min-width:0!important;
    overflow:hidden!important;
    color:#8e9aa1!important;
    font-size:.65rem!important;
    font-weight:600!important;
    text-overflow:ellipsis!important;
    white-space:nowrap!important;
  }
  .builder-step-track>span.complete{
    border-color:#3a6870!important;
    background:#13262e!important;
  }
  .builder-step-track>span.complete b{
    border-color:#3fb8b8!important;
    background:#18343a!important;
    color:#5fe6e0!important;
  }
  .builder-step-track>span.current{
    border-color:#5fe6e0!important;
    background:#18343a!important;
    box-shadow:inset 0 0 0 1px #5fe6e022,0 0 14px #5fe6e014!important;
  }
  .builder-step-track>span.current b{
    border-color:#5fe6e0!important;
    background:#5fe6e0!important;
    color:#0f1e26!important;
  }
  .builder-step-track>span.current small{color:#fff!important}
  .builder-panel>h3{
    margin:.45rem 0 0!important;
    color:#fff!important;
    font:700 clamp(1.25rem,2.8vw,1.65rem)/1.25 'Libre Baskerville',Georgia,serif!important;
    letter-spacing:-.025em!important;
  }
  .builder-panel>h3:after{
    content:"";
    display:block;
    width:46px;height:3px;
    margin-top:10px;
    border-radius:4px;
    background:#5fe6e0;
  }
  .builder-panel>h4{
    margin:.35rem 0 -.2rem!important;
    color:#5fe6e0!important;
    font-size:.78rem!important;
    font-weight:800!important;
    letter-spacing:.09em!important;
    text-transform:uppercase!important;
  }
  .builder-panel>.muted,.builder-panel>.hint{
    max-width:78ch!important;
    margin:.1rem 0 .35rem!important;
    color:#b5bec3!important;
    font-size:.83rem!important;
    line-height:1.65!important;
  }
  .builder-panel label:not(.builder-class-card):not(.builder-checkbox){
    color:#dce4e7!important;
    font-size:.76rem!important;
    letter-spacing:.015em!important;
  }
  .builder-panel input:not([type=checkbox]):not([type=radio]),
  .builder-panel select,.builder-panel textarea{
    min-height:43px!important;
    padding:11px 13px!important;
    border:1px solid #3a4a52!important;
    border-radius:7px!important;
    background:#0b171d!important;
    color:#fff!important;
    box-shadow:inset 0 1px 2px #0004!important;
    transition:border-color .18s,box-shadow .18s!important;
  }
  .builder-panel input:focus,.builder-panel select:focus,.builder-panel textarea:focus{
    border-color:#5fe6e0!important;
    outline:none!important;
    box-shadow:0 0 0 3px #5fe6e01c!important;
  }
  .builder-panel input::placeholder,.builder-panel textarea::placeholder{color:#8e9aa1!important}
  :global(.builder-panel .builder-class-grid){
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    gap:12px!important;
    margin:.45rem 0 1rem!important;
  }
  :global(.builder-panel .builder-class-card){
    min-height:154px!important;
    gap:10px!important;
    padding:16px!important;
    border:1px solid #3a6870!important;
    border-radius:10px!important;
    border-top:1px solid #3a6870!important;
    background:linear-gradient(145deg,#13262e,#0f1e26)!important;
    box-shadow:0 5px 16px #0002!important;
    transition:transform .18s,border-color .18s,background .18s,box-shadow .18s!important;
  }
  :global(.builder-panel .builder-class-card:hover){
    transform:translateY(-2px)!important;
    border-color:#5fe6e0!important;
    background:linear-gradient(145deg,#1b2a33,#13262e)!important;
    box-shadow:0 9px 22px #0004!important;
  }
  :global(.builder-panel .builder-class-card.selected){
    border:2px solid #5fe6e0!important;
    background:linear-gradient(145deg,#18343a,#13262e)!important;
    box-shadow:0 0 0 3px #5fe6e018,0 9px 22px #0004!important;
  }
  :global(.builder-panel .builder-class-card-heading strong){
    color:#fff!important;
    font-size:1.02rem!important;
    font-weight:800!important;
  }
  :global(.builder-panel .builder-class-card-heading>span){
    padding:4px 8px!important;
    border:1px solid #3a6870!important;
    border-radius:20px!important;
    background:#0b171d!important;
    color:#5fe6e0!important;
    font-size:.65rem!important;
    font-weight:750!important;
    white-space:nowrap!important;
  }
  :global(.builder-panel .builder-class-description){
    color:#b5bec3!important;
    font-size:.78rem!important;
    line-height:1.55!important;
  }
  :global(.builder-panel .builder-class-meta){
    align-items:flex-start!important;
    padding-top:8px!important;
    border-top:1px solid #3a4a52!important;
  }
  :global(.builder-panel .builder-class-meta>span){
    color:#8e9aa1!important;
    font-size:.65rem!important;
  }
  :global(.builder-panel .builder-class-meta>strong){
    color:#fff!important;
    font-size:.69rem!important;
  }
  :global(.builder-panel .builder-choice-wrapper),
  :global(.builder-panel .builder-choice-field){
    border:1px solid #3a6870!important;
    border-radius:9px!important;
    background:#0f1e26!important;
    color:#fff!important;
  }
  :global(.builder-panel .builder-choice-wrapper){
    padding:13px!important;
    box-shadow:0 5px 16px #0002!important;
  }
  :global(.builder-panel .builder-choice-heading){
    gap:10px!important;
    padding-bottom:9px!important;
    border-bottom:1px solid #3a4a52!important;
  }
  :global(.builder-panel .builder-choice-heading strong){color:#fff!important}
  :global(.builder-panel .builder-choice-heading span){
    color:#5fe6e0!important;
    font-weight:800!important;
  }
  :global(.builder-panel .builder-checkbox){
    border:1px solid #3a4a52!important;
    border-radius:7px!important;
    background:#13262e!important;
    transition:border-color .16s,background .16s!important;
  }
  :global(.builder-panel .builder-checkbox:hover){
    border-color:#3fb8b8!important;
    background:#1b2a33!important;
  }
  :global(.builder-panel .builder-checkbox:has(input:checked)){
    border-color:#5fe6e0!important;
    background:#18343a!important;
  }
  :global(.builder-panel .builder-info){
    padding:13px 15px!important;
    border:1px solid #3a6870!important;
    border-left:3px solid #5fe6e0!important;
    border-radius:8px!important;
    background:#0f1e26!important;
    color:#fff!important;
    box-shadow:0 4px 14px #0002!important;
  }
  :global(.builder-panel .builder-info strong){color:#5fe6e0!important}
  :global(.builder-panel .builder-info p){color:#dce4e7!important;line-height:1.55!important}
  .builder-step-error{
    padding:12px 14px!important;
    border:1px solid #3fb8b8!important;
    border-left:3px solid #5fe6e0!important;
    border-radius:8px!important;
    background:#0f1e26!important;
    color:#fff!important;
  }
  .builder-actions{
    position:sticky!important;
    bottom:0!important;
    z-index:4!important;
    justify-content:space-between!important;
    margin:1rem -2px -2px!important;
    padding:12px 2px 2px!important;
    border-top:1px solid #3a4a52!important;
    background:linear-gradient(180deg,#13262e00,#13262e 28%)!important;
  }
  :global(.builder-actions button){
    min-height:43px!important;
    padding:10px 20px!important;
    border-radius:7px!important;
    font-size:.78rem!important;
    font-weight:800!important;
    letter-spacing:.025em!important;
    transition:transform .16s,filter .16s!important;
  }
  :global(.builder-actions button:hover){transform:translateY(-1px)!important;filter:brightness(1.08)!important}
  :global(.builder-actions button.primary){
    border-color:#5fe6e0!important;
    background:#5fe6e0!important;
    color:#0f1e26!important;
    box-shadow:0 4px 14px #5fe6e022!important;
  }
  :global(.builder-actions button.secondary){
    border-color:#3a6870!important;
    background:#1b2a33!important;
    color:#fff!important;
  }
  @media(max-width:760px){
    .builder-step-track{grid-template-columns:repeat(4,minmax(0,1fr))!important}
  }
  @media(max-width:520px){
    .builder-step-track{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px!important}
    .builder-step-track>span{padding:6px!important;gap:5px!important}
    .builder-step-track small{font-size:.59rem!important}
    :global(.builder-panel .builder-class-grid){grid-template-columns:1fr!important}
    .builder-actions{position:static!important}
  }


  /* Características y elecciones: segunda pasada de refinamiento. */
  .builder-ability-grid{
    display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:10px!important;
    margin:.3rem 0!important;
  }
  :global(.builder-panel .builder-ability-card){
    display:grid!important;
    grid-template-columns:minmax(0,1fr) 76px!important;
    align-items:center!important;
    gap:8px 10px!important;
    min-width:0!important;
    padding:12px!important;
    border:1px solid #3a6870!important;
    border-radius:9px!important;
    background:linear-gradient(145deg,#13262e,#0b171d)!important;
    color:#fff!important;
    font-size:.76rem!important;
    font-weight:800!important;
    letter-spacing:.035em!important;
    text-transform:uppercase!important;
  }
  :global(.builder-panel .builder-ability-card input[type=number]){
    grid-column:2!important;
    grid-row:1/3!important;
    width:100%!important;
    min-height:58px!important;
    padding:6px!important;
    border:1px solid #3a6870!important;
    border-radius:7px!important;
    background:#0b171d!important;
    color:#5fe6e0!important;
    font:800 1.45rem/1 system-ui,sans-serif!important;
    text-align:center!important;
    font-variant-numeric:tabular-nums!important;
  }
  :global(.builder-panel .builder-ability-card small){
    grid-column:1!important;
    color:#b5bec3!important;
    font-size:.68rem!important;
    font-weight:600!important;
    text-transform:none!important;
  }
  :global(.builder-panel .builder-ability-card small::first-letter){color:#5fe6e0}
  :global(.builder-panel .builder-ability-card:focus-within){
    border-color:#5fe6e0!important;
    box-shadow:0 0 0 3px #5fe6e01c!important;
  }
  :global(.builder-panel .builder-choice-wrapper>strong){
    display:block!important;
    margin-bottom:9px!important;
    color:#fff!important;
    font-size:.82rem!important;
    line-height:1.45!important;
  }
  :global(.builder-panel .builder-choice-field){
    padding:10px!important;
    border-color:#22333d!important;
    background:#0b171d!important;
  }
  :global(.builder-panel .builder-checkbox){
    position:relative!important;
    min-height:52px!important;
    padding:12px 13px!important;
    border:1px solid #3a4a52!important;
    border-radius:8px!important;
    background:#13262e!important;
    color:#fff!important;
    box-shadow:inset 0 1px #ffffff08!important;
  }
  :global(.builder-panel .builder-checkbox>input[type=checkbox]),
  :global(.builder-panel .builder-checkbox>input[type=radio]){
    accent-color:#5fe6e0!important;
    margin-top:2px!important;
  }
  :global(.builder-panel .builder-checkbox>span){
    padding-right:0!important;
    color:#fff!important;
    font-size:.77rem!important;
    font-weight:700!important;
    line-height:1.45!important;
  }
  :global(.builder-panel .builder-checkbox:has(input:checked)){
    border-color:#5fe6e0!important;
    background:linear-gradient(145deg,#18343a,#13262e)!important;
    box-shadow:inset 0 0 0 1px #5fe6e022,0 0 12px #5fe6e010!important;
  }
  :global(.builder-panel .builder-checkbox:has(input:checked)::after){
    top:8px!important;
    right:9px!important;
    border:1px solid #3a6870!important;
    background:#0b171d!important;
    color:#5fe6e0!important;
    font-size:.58rem!important;
    letter-spacing:.04em!important;
  }
  :global(.builder-panel .builder-checkbox:has(.builder-option-description)){
    display:grid!important;
    grid-template-columns:1fr!important;
    gap:6px!important;
    padding:13px!important;
  }
  :global(.builder-panel .builder-checkbox:has(.builder-option-description)>span){
    padding-right:4.4rem!important;
    font-size:.83rem!important;
  }
  :global(.builder-panel .builder-checkbox .builder-option-description),
  :global(.builder-panel .builder-checkbox .builder-skill-description){
    color:#b5bec3!important;
    font-size:.7rem!important;
    line-height:1.5!important;
  }
  :global(.builder-panel .builder-info){
    display:grid!important;
    gap:5px!important;
  }
  :global(.builder-panel .builder-info>p){
    margin:0!important;
  }
  :global(.builder-panel .builder-name-block){
    padding:15px!important;
    border:1px solid #3a6870!important;
    border-radius:10px!important;
    background:#0f1e26!important;
    box-shadow:0 5px 16px #0002!important;
  }
  :global(.builder-panel .builder-name-block>label){
    color:#fff!important;
    font-size:.8rem!important;
  }
  @media(max-width:760px){
    .builder-ability-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
  }
  @media(max-width:420px){
    .builder-ability-grid{gap:7px!important}
    :global(.builder-panel .builder-ability-card){grid-template-columns:minmax(0,1fr) 62px!important;padding:9px!important}
    :global(.builder-panel .builder-ability-card input[type=number]){min-height:50px!important;font-size:1.2rem!important}
  }

  :global(.builder-panel .builder-review){
    display:grid;
    gap:14px;
    margin:16px 0 8px;
  }
  :global(.builder-panel .builder-review-identity){
    padding:20px 22px;
    border:1px solid #3a6870;
    border-left:4px solid #3fb8b8;
    border-radius:12px;
    background:linear-gradient(135deg,#13262e 0%,#0f1e26 100%);
  }
  :global(.builder-panel .builder-review-kicker){
    color:#5fe6e0;
    font-size:.66rem;
    font-weight:800;
    letter-spacing:.14em;
  }
  :global(.builder-panel .builder-review-identity h4){
    margin:7px 0 5px;
    color:#fff;
    font-size:1.45rem;
    line-height:1.2;
  }
  :global(.builder-panel .builder-review-identity p){
    margin:0;
    color:#b5bec3;
    font-size:.86rem;
  }
  :global(.builder-panel .builder-review-identity p span){color:#3fb8b8;padding:0 3px}
  :global(.builder-panel .builder-review-section){
    padding:16px;
    border:1px solid #22333d;
    border-radius:11px;
    background:#0f1e26;
  }
  :global(.builder-panel .builder-review-section h4){
    margin:0 0 12px;
    color:#5fe6e0;
    font-size:.82rem;
    font-weight:800;
    letter-spacing:.06em;
    text-transform:uppercase;
  }
  :global(.builder-panel .builder-review-stats){
    display:grid;
    grid-template-columns:repeat(6,minmax(0,1fr));
    gap:8px;
  }
  :global(.builder-panel .builder-review-stat){
    display:flex;
    min-width:0;
    flex-direction:column;
    align-items:center;
    gap:4px;
    padding:11px 5px;
    border:1px solid #3a4a52;
    border-radius:9px;
    background:#13262e;
    text-align:center;
  }
  :global(.builder-panel .builder-review-stat span){
    color:#b5bec3;
    font-size:.67rem;
    font-weight:700;
  }
  :global(.builder-panel .builder-review-stat strong){
    color:#fff;
    font-size:1.45rem;
    line-height:1.1;
  }
  :global(.builder-panel .builder-review-stat small){
    color:#5fe6e0;
    font-size:.85rem;
    font-weight:800;
  }
  :global(.builder-panel .builder-review-derived){
    display:grid;
    grid-template-columns:repeat(4,minmax(0,1fr));
    gap:8px;
  }
  :global(.builder-panel .builder-review-derived>div){
    display:flex;
    min-width:0;
    flex-direction:column;
    gap:7px;
    padding:12px;
    border-radius:8px;
    background:#13262e;
  }
  :global(.builder-panel .builder-review-derived span),
  :global(.builder-panel .builder-review-details span){
    color:#b5bec3;
    font-size:.72rem;
  }
  :global(.builder-panel .builder-review-derived strong){
    color:#fff;
    font-size:1.35rem;
  }
  :global(.builder-panel .builder-review-derived strong small){
    color:#8e9aa1;
    font-size:.7rem;
  }
  :global(.builder-panel .builder-review-details){
    display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:13px 18px;
  }
  :global(.builder-panel .builder-review-details h4){grid-column:1/-1;margin-bottom:0}
  :global(.builder-panel .builder-review-details>div){min-width:0}
  :global(.builder-panel .builder-review-details p){
    margin:4px 0 0;
    color:#fff;
    font-size:.86rem;
    overflow-wrap:anywhere;
  }
  @media(max-width:760px){
    :global(.builder-panel .builder-review-stats){grid-template-columns:repeat(3,minmax(0,1fr))}
    :global(.builder-panel .builder-review-derived){grid-template-columns:repeat(2,minmax(0,1fr))}
  }
  @media(max-width:420px){
    :global(.builder-panel .builder-review-identity){padding:15px}
    :global(.builder-panel .builder-review-details){grid-template-columns:1fr}
    :global(.builder-panel .builder-review-details h4){grid-column:auto}
  }


  /* Refinamiento tipográfico de la ficha: no altera columnas, orden ni pestañas. */
  :global(.nautical-sheet){
    padding:clamp(12px,1.8vw,22px)!important;
    border-radius:12px!important;
    font-family:system-ui,-apple-system,"Segoe UI",sans-serif!important;
  }
  :global(.nautical-header){
    gap:16px!important;
    padding:clamp(12px,1.8vw,20px)!important;
    margin-bottom:12px!important;
    border:1px solid #3a4a52!important;
    border-radius:10px!important;
    background:#0f1e26!important;
  }
  :global(.nautical-header .sheet-kicker){
    font-size:11px!important;
    line-height:1.4!important;
    letter-spacing:.14em!important;
    color:#8e9aa1!important;
  }
  :global(.nautical-header .character-name){
    margin:5px 0 8px!important;
    font-size:clamp(25px,3vw,34px)!important;
    line-height:1.12!important;
    letter-spacing:-.025em!important;
  }
  :global(.nautical-header .sheet-banner-meta){
    gap:6px 12px!important;
    font-size:12px!important;
    line-height:1.5!important;
  }
  :global(.nautical-header .portrait-frame){
    flex:0 0 76px!important;
    width:76px!important;
    height:76px!important;
  }
  :global(.nautical-header .header-actions button){
    min-height:34px!important;
    padding:7px 11px!important;
    font-size:12px!important;
  }
  :global(.nautical-quick-stats){
    gap:10px!important;
    margin-bottom:14px!important;
    padding:10px!important;
    border:1px solid #3a4a52!important;
    border-radius:10px!important;
  }
  :global(.nautical-quick-stats .attribute-plaque-row){gap:8px!important}
  :global(.nautical-quick-stats .attribute-plaque){
    min-height:104px!important;
    padding:9px 6px!important;
    border-radius:12px!important;
    border-width:1px!important;
  }
  :global(.nautical-quick-stats .attribute-plaque>span:first-child){
    color:#b5bec3!important;
    font-size:11px!important;
    font-weight:700!important;
    line-height:1.25!important;
    letter-spacing:.035em!important;
  }
  :global(.nautical-quick-stats .attribute-plaque .ability-score){
    font-size:27px!important;
    line-height:1.05!important;
    font-weight:800!important;
  }
  :global(.nautical-quick-stats .attribute-plaque .ability-bonus-roll){
    min-width:38px!important;
    min-height:27px!important;
    padding:3px 8px!important;
    font-size:14px!important;
    font-weight:800!important;
  }
  :global(.nautical-quick-stats .saving-throw-line){
    gap:5px!important;
    margin-top:4px!important;
    padding-top:5px!important;
    font-size:11px!important;
  }
  :global(.nautical-quick-stats .saving-throw-line button),
  :global(.nautical-quick-stats .saving-throw-line strong){font-size:12px!important}
  :global(.nautical-quick-stats>.quick-stats-row){gap:7px!important}
  :global(.nautical-quick-stats>.quick-stats-row>div){
    min-height:58px!important;
    padding:9px 7px!important;
    border-radius:8px!important;
  }
  :global(.nautical-quick-stats>.quick-stats-row>div>span){
    color:#b5bec3!important;
    font-size:10px!important;
    font-weight:700!important;
    line-height:1.3!important;
    letter-spacing:.035em!important;
    white-space:normal!important;
  }
  :global(.nautical-quick-stats>.quick-stats-row>div>strong){
    color:#fff!important;
    font-size:16px!important;
    line-height:1.25!important;
    font-weight:800!important;
  }
  :global(.nautical-columns .sheet-section){
    padding:14px!important;
    border-radius:10px!important;
  }
  :global(.nautical-columns .sheet-section-title){
    margin-bottom:8px!important;
    padding-bottom:8px!important;
  }
  :global(.nautical-columns .sheet-section-title h3),
  :global(.nautical-columns .section-name){
    font-size:14px!important;
    line-height:1.3!important;
    font-weight:800!important;
    letter-spacing:.055em!important;
  }
  :global(.nautical-columns .skill-column-labels){
    padding:5px 3px!important;
    font-size:10px!important;
    line-height:1.3!important;
    letter-spacing:.07em!important;
  }
  :global(.nautical-columns .sheet-stat){
    gap:9px!important;
    padding:7px 3px!important;
  }
  :global(.nautical-columns .stat-label){
    color:#b5bec3!important;
    font-size:13px!important;
    line-height:1.4!important;
    font-weight:600!important;
  }
  :global(.nautical-columns .stat-value),
  :global(.nautical-columns .sheet-readonly-value){
    color:#fff!important;
    font-size:13px!important;
    line-height:1.5!important;
  }
  :global(.nautical-skills .sheet-stat .skill-number){
    font-size:15px!important;
    line-height:1.25!important;
    font-weight:800!important;
  }
  :global(.nautical-columns .player-feature-card),
  :global(.nautical-columns .player-feat-card),
  :global(.nautical-columns .player-spell-card){
    border-radius:9px!important;
  }
  :global(.nautical-tabs){
    gap:6px!important;
    margin-bottom:12px!important;
    padding-bottom:8px!important;
  }
  :global(.nautical-tabs button){
    min-height:38px!important;
    padding:8px 13px!important;
    border-radius:7px 7px 0 0!important;
    font-size:12px!important;
    line-height:1.25!important;
    font-weight:700!important;
  }
  :global(.nautical-tab-content){
    font-size:13px!important;
    line-height:1.5!important;
  }
  :global(.nautical-tab-content h3),
  :global(.nautical-tab-content h4){
    line-height:1.3!important;
  }
  @media(max-width:760px){
    :global(.nautical-quick-stats .attribute-plaque){min-height:96px!important}
    :global(.nautical-quick-stats .attribute-plaque .ability-score){font-size:24px!important}
    :global(.nautical-columns .sheet-section){padding:12px!important}
  }
  @media(max-width:480px){
    :global(.nautical-header .portrait-frame){flex-basis:60px!important;width:60px!important;height:60px!important}
    :global(.nautical-header .character-name){font-size:24px!important}
    :global(.nautical-quick-stats>.quick-stats-row>div>span){font-size:10px!important}
    :global(.nautical-quick-stats>.quick-stats-row>div>strong){font-size:15px!important}
    :global(.nautical-tabs button){padding:8px 10px!important;font-size:11px!important}
    :global(.nautical-columns .stat-label){font-size:12px!important}
  }



  .quick-buttons-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
  .quick-button-cell{--quick-color:hsl(var(--quick-hue) 68% 58%);min-width:0;padding:9px;border:1px solid hsl(var(--quick-hue) 48% 42%);border-radius:8px;background:hsl(var(--quick-hue) 34% 13%);display:grid;gap:5px}
  .quick-roll-button{min-height:42px;padding:8px;border:1px solid var(--quick-color);border-radius:6px;background:hsl(var(--quick-hue) 48% 25%);color:#fff;font-weight:800;overflow-wrap:anywhere}
  .quick-button-cell>small{color:hsl(var(--quick-hue) 55% 82%);font-size:11px;overflow-wrap:anywhere}
  .quick-button-controls{display:flex;gap:5px}
  .quick-button-controls button{flex:1;min-width:0;padding:5px;border:1px solid hsl(var(--quick-hue) 45% 42%);border-radius:5px;background:hsl(var(--quick-hue) 38% 19%);color:#fff;font-size:11px}
  .quick-button-controls button:disabled{opacity:.35}
  .quick-button-controls .mode-active{border-color:#e6b83f;color:#ffe08a}
  .quick-button-controls .mode-disadvantage{border-color:#d66b6b;color:#ffaaaa}
  .quick-button-editor{display:grid;gap:6px;padding:7px;border:1px solid hsl(var(--quick-hue) 45% 35%);border-radius:6px;background:hsl(var(--quick-hue) 32% 16%)}
  .quick-button-editor label{display:grid;gap:3px;color:hsl(var(--quick-hue) 55% 85%);font-size:11px}
  .quick-button-editor input{box-sizing:border-box;width:100%;min-width:0;padding:6px;border:1px solid hsl(var(--quick-hue) 45% 42%);border-radius:5px;background:hsl(var(--quick-hue) 35% 10%);color:#fff}
  .quick-button-editor small{color:hsl(var(--quick-hue) 45% 80%);font-size:10px}
  .quick-roll-results{display:grid;gap:7px;margin-top:15px}
  .quick-roll-results-header{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
  .quick-roll-results h4{margin:0;color:#5fe6e0}
  .quick-roll-clear{padding:6px 10px;border:1px solid #a65c5c;border-radius:5px;background:#492727;color:#ffdada;font-size:11px;font-weight:700}
  .quick-roll-clear:disabled{opacity:.4}

  .quick-roll-result{padding:9px;border:1px solid #3a6870;border-radius:7px;background:#0f1e26}
  .quick-roll-result strong{color:#fff}\n  .quick-result-value{display:block;margin-top:4px;color:#8de5a8!important;font-size:13px}
  .quick-roll-result p{margin:6px 0 0;font-size:12px;line-height:1.5;overflow-wrap:anywhere}
  .quick-critical{color:#ffd166;font-style:normal;font-weight:900}
  .quick-fumble{color:#ff8585;font-style:normal;font-weight:900}
  .quick-mode-label{padding:2px 5px;border-radius:4px;background:#243b45;color:#9fe9e5;font-size:10px;font-weight:800}
  @media(max-width:420px){.quick-buttons-grid{grid-template-columns:1fr}}
  .catalog-item-card{border:1px solid var(--gm-border);background:var(--gm-card);border-radius:10px;padding:12px;margin:8px 0}
  .catalog-item-card header,.catalog-item-card footer{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
  .catalog-item-card h3{margin:0;font-size:15px;color:var(--gm-text)}
  .catalog-item-type{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--gm-accent)}
  .catalog-item-description{margin:10px 0;color:var(--gm-text);line-height:1.55}
  .catalog-item-card footer{border-top:1px solid var(--gm-border);padding-top:8px;font-size:12px;color:var(--gm-muted)}
  .catalog-item-card footer small{flex-basis:100%;color:var(--gm-muted)}
  .rules-toolbar{position:sticky;top:0;z-index:12;display:grid;grid-template-columns:minmax(180px,1fr) minmax(150px,.45fr) auto;gap:10px;align-items:end;padding:12px 0;background:var(--gm-panel,#0b171d);border-bottom:1px solid var(--gm-border)}
  .rules-search,.rules-category-filter{display:grid;gap:5px;font-size:12px;color:var(--gm-muted)}
  .rules-search-input{display:flex;gap:6px}.rules-search-input input{flex:1;min-width:0}
  .rules-search-input button,.rules-toolbar-actions button{border:1px solid var(--gm-border);border-radius:6px;background:var(--gm-card);color:var(--gm-text);padding:7px 10px}
  .rules-search-input button:disabled{opacity:.4}
  .rules-toolbar-actions{display:flex;gap:8px;align-items:center;white-space:nowrap;font-size:12px;color:var(--gm-muted)}
  .rules-navigation{position:sticky;top:76px;z-index:10;display:flex;gap:7px;flex-wrap:wrap;padding:8px 0;background:var(--gm-panel,#0b171d);font-size:12px}
  .rules-navigation a{color:var(--gm-accent);font-weight:800;text-decoration:none}
  .rules-letter{margin:16px 0 4px;padding:4px 8px;border-bottom:1px solid var(--gm-border);color:var(--gm-accent);font-size:14px}
  .rule-card{border-bottom:1px solid var(--gm-border);background:transparent!important}
  .rule-card:hover{background:rgba(255,255,255,.035)!important}.rule-card[open]{background:rgba(75,180,180,.07)!important}
  .rule-card summary{display:flex;align-items:center;gap:12px;min-height:42px;padding:7px 9px;cursor:pointer;list-style:none}
  .rule-card summary::-webkit-details-marker{display:none}.rule-name{flex:1;min-width:0;font-size:14px;font-weight:800;text-transform:none}
  .rule-name mark{background:#f2d36c;color:#1b2022;border-radius:2px}
  .rule-category{flex:0 0 auto;padding:3px 8px;border:1px solid currentColor;border-radius:20px;font-size:10px;font-weight:800;line-height:1.2}
  .category-general{color:#8fc5ff}.category-estado{color:#ff9a9a}.category-accion{color:#f2c66d}.category-peligro{color:#ff806e}.category-area-de-efecto{color:#c2a0ff}.category-actitud{color:#85d6b0}.category-abreviatura{color:#b9c2cc}
  .rule-page{flex:0 0 auto;color:var(--gm-muted);font-size:11px;white-space:nowrap}
  .rule-details{margin:0 10px 10px 18px;padding:10px 14px 12px;border-left:2px solid var(--gm-accent);background:rgba(0,0,0,.12)}
  .rule-description{max-width:70ch;white-space:normal;line-height:1.5;color:var(--gm-text)}
  .rule-description p{margin:0 0 10px}.rule-description p:last-child{margin-bottom:0}
  .rule-related{max-width:70ch;margin-top:12px;padding-top:8px;border-top:1px solid var(--gm-border);font-size:12px;color:var(--gm-muted)}
  .rule-related button{padding:0;border:0;background:none;color:var(--gm-accent);text-decoration:underline;cursor:pointer}
  .rule-source{display:block;margin-top:12px;color:var(--gm-muted);font-size:10px}
  .rule-abbreviation{display:flex;align-items:center;gap:10px;padding:8px 9px;border-bottom:1px solid var(--gm-border);font-size:13px}
  .rule-abbreviation>strong{font-weight:900}.rule-abbreviation-meaning{flex:1;color:var(--gm-text)}
  @media(max-width:650px){.rules-toolbar{grid-template-columns:1fr 1fr}.rules-search{grid-column:1/-1}.rules-toolbar-actions{justify-content:space-between;grid-column:1/-1}.rules-navigation{top:120px}.rule-card summary{gap:7px}.rule-category{font-size:9px;padding:3px 6px}.rule-abbreviation{flex-wrap:wrap}.rule-abbreviation-meaning{flex-basis:100%;order:3}}

  .monster-statblock{background:#f8f5e9;color:#24231f;border:1px solid #c8b98e;border-radius:8px;padding:14px;font-family:Georgia,serif;line-height:1.45}
  .monster-block-heading{text-align:center;border-top:3px double #8d2525;border-bottom:3px double #8d2525;padding:8px 4px;margin-bottom:10px}
  .monster-block-heading h3{margin:0;color:#8d2525;font-size:20px;text-transform:uppercase;letter-spacing:.04em}
  .monster-block-heading p{margin:3px 0 0;font-style:italic;font-size:13px}
  .monster-description{font-style:italic;color:#4b473d}
  .monster-quick-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;border-bottom:1px solid #b9a77d;padding-bottom:10px;margin-bottom:10px}
  .monster-quick-stats>div{display:flex;gap:8px;align-items:baseline}
  .monster-quick-stats small{font-weight:900;color:#8d2525;min-width:42px}
  .monster-quick-stats strong{font-size:13px}
  .monster-ability-table{border-top:1px solid #b9a77d;border-bottom:1px solid #b9a77d;margin:10px 0;padding:5px 0}
  .monster-ability-row{display:grid;grid-template-columns:1.4fr repeat(3,.8fr);gap:6px;padding:4px 3px;text-align:center;font-size:13px}
  .monster-ability-row>*:first-child{text-align:left}
  .monster-ability-head{font-weight:900;color:#8d2525;border-bottom:1px solid #b9a77d}
  .monster-details-list{padding:4px 0}
  .monster-details-list p{margin:5px 0;font-size:13px}
  .monster-details-list strong{color:#8d2525}
  .monster-content-section{border-top:2px solid #8d2525;margin-top:12px;padding-top:7px}
  .monster-content-section h4{margin:0 0 8px;color:#8d2525;text-align:center;font-size:15px;letter-spacing:.08em}
  .monster-entry{margin:8px 0}
  .monster-entry strong{font-weight:800}
  .monster-entry p{display:inline;margin:0;line-height:1.5}
  .monster-source{display:block;border-top:1px solid #b9a77d;padding-top:8px;margin-top:12px;color:#696252}
  .chest-opened-note{font-weight:700;color:var(--gm-accent);margin:16px 0 5px}
  .chest-empty{margin-top:16px}
  @media(max-width:520px){.monster-quick-stats{grid-template-columns:1fr}.monster-statblock{padding:10px}.monster-ability-row{font-size:12px}}


  .combat-toolbar{display:flex;gap:12px;align-items:end;flex-wrap:wrap;margin:12px 0}
  .combat-toolbar label,.combat-initiative label{display:flex;gap:8px;align-items:center;font-size:12px}
  .combat-toolbar select,.combatant-card input{min-width:0;background:#0b171d;color:#fff;border:1px solid #3fb8b8;border-radius:5px;padding:6px}
  .combat-sort input{width:auto}
  .combat-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px;align-items:start;width:100%;min-width:0}
  .combatant-card{position:relative;min-width:0;width:100%;box-sizing:border-box;padding:8px;border:1px solid #3fb8b8;border-radius:9px;background:#0b171d;color:#fff;overflow-wrap:anywhere}
  .combatant-card.combatant-active{border:2px solid #e6b83f;box-shadow:0 0 0 2px rgba(230,184,63,.22),0 0 14px rgba(230,184,63,.32)}
  .combatant-card .combatant-name{font-size:12px;line-height:1.25;overflow-wrap:anywhere}
  .combatant-card .combatant-vitals{gap:4px;font-size:11px}
  .combatant-card .combat-ac input,.combatant-card .combat-hp input{width:38px;padding:4px 2px}
  .combatant-card .combatant-tools button,.combatant-card .combat-hp button,.combatant-card .combat-temp button{padding:3px 5px;font-size:11px}
  .combatant-card .combat-damage-tools{grid-template-columns:minmax(0,1fr) auto auto;gap:3px}
  .combatant-card .combat-damage-tools button{padding:5px 5px;font-size:10px}
  .combatant-card .combat-initiative{gap:4px;font-size:11px}
  .combatant-card .combat-initiative input{width:58px;min-height:30px;font-size:13px;text-align:center}
  .combatant-card .combat-action-row{font-size:11px;overflow-wrap:anywhere}
  .combatant-card .combat-action-row button{padding:5px;font-size:10px}
  .combatant-card.combat-dead{opacity:.58;filter:grayscale(.65)}
  .combatant-header{display:flex;align-items:center;justify-content:space-between;gap:8px}
  .combatant-name{flex:1;font-weight:800;font-size:15px}
  .combatant-participating{display:flex;align-items:center;gap:6px;margin:7px 0;color:#9fe9e5;font:700 11px system-ui,sans-serif}
  .combatant-participating input{width:auto;accent-color:#5fe6e0}
  .combatant-tools{display:flex;gap:4px}.combatant-tools button,.combat-hp button,.combat-temp button{border:1px solid #3fb8b8;border-radius:4px;background:#13262e;color:#fff;padding:4px 8px}
  .combatant-vitals{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin:12px 0 6px;font-size:13px;font-weight:800}
  .combat-ac,.combat-hp{display:flex;align-items:center;gap:5px}
  .combat-ac input{width:48px;text-align:center;font-weight:800}
  .combat-hp input{width:48px;text-align:center;font-weight:800}
  .combat-hp-track{height:9px;background:#34434a;border-radius:9px;overflow:hidden;margin:5px 0 9px}
  .combat-hp-track span{display:block;height:100%;background:#29b765;transition:width .2s}
  .combat-hp-track span.hp-yellow{background:#e6b83f}.combat-hp-track span.hp-red{background:#d64b4b}
  .combat-temp{display:flex;justify-content:center;align-items:center;gap:10px;color:#8abfff;font-size:12px;margin:6px 0 10px}
  .combat-damage-tools{display:grid;grid-template-columns:minmax(48px,1fr) auto auto;gap:6px;padding:8px 0;border-top:1px solid #3fb8b8}
  .combat-damage-tools input{width:100%;box-sizing:border-box}
  .combat-damage-tools button,.combat-initiative button,.combat-expand,.combat-actions button{border:1px solid #3fb8b8;border-radius:5px;background:#13262e;color:#fff;padding:6px 9px;font-size:12px}
  .combat-damage-tools .damage-button{border-color:#c95c5c}.combat-damage-tools .heal-button{border-color:#36b978}
  .combat-initiative{display:flex;justify-content:space-between;gap:8px;align-items:center;margin:4px 0 9px;font-size:12px}
  .combat-initiative input{width:64px;min-height:32px;font-size:14px;text-align:center}
  .combat-expand{width:100%;margin:4px 0}
  .combat-actions{display:grid;gap:7px;margin-top:8px}
  .combat-action-row{display:grid;gap:5px;padding:7px 0;border-top:1px solid #31525a;font-size:12px}
  .combat-action-row>div{display:flex;gap:5px;flex-wrap:wrap}
  .combat-action-row button{font-weight:800;color:#5fe6e0}
  .combat-dc{padding:6px 9px;border:1px solid #7b83c5;border-radius:5px;color:#b7baff;font-weight:800}
  .combat-fallen{text-align:center;font-weight:900;color:#e87979;margin-top:8px}
  .add-to-combat{margin-bottom:12px}
  .initiative-panel{display:grid;gap:12px}
  .initiative-toolbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  .initiative-roll-button{min-height:42px;font-weight:900}
  .initiative-list,.initiative-roster{display:grid;gap:6px;margin:0;padding:0;list-style:none}
  .initiative-list li,.initiative-roster li{display:grid;grid-template-columns:30px minmax(0,1fr) auto;align-items:center;gap:10px;padding:10px;border:1px solid var(--gm-border);border-radius:7px;background:var(--gm-card);color:var(--gm-text)}
  .initiative-position{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#263d46;color:#9fe9e5;font-weight:900}
  .initiative-name{font-weight:800;overflow-wrap:anywhere}
  .initiative-roll{font-size:12px;color:var(--gm-muted);white-space:nowrap}.initiative-roll strong{color:var(--gm-text);font-size:15px}.initiative-roll small{color:#e6b83f}
  .initiative-list li.initiative-active{border:2px solid #e6b83f;background:rgba(230,184,63,.13)}
  .initiative-list li.initiative-active .initiative-position{background:#e6b83f;color:#17242a}
  .player-current-turn{color:#e6b83f;font-size:11px;font-weight:800}
  .initiative-roster li{grid-template-columns:minmax(0,1fr) auto}
  .initiative-roster strong{font-size:12px;color:#9fe9e5}
  .initiative-turn-controls{display:flex;align-items:center;gap:7px;min-width:0}
  .initiative-turn-controls button{min-width:34px;min-height:34px;padding:5px 9px;font-size:16px;font-weight:900}
  .initiative-turn-controls strong{max-width:180px;color:var(--gm-text);font-size:12px;text-align:center;overflow-wrap:anywhere}
  @media(max-width:520px){.initiative-list li{grid-template-columns:26px minmax(0,1fr)}.initiative-roll{grid-column:2;white-space:normal}.initiative-turn-controls{flex-basis:100%;order:2}.initiative-turn-controls strong{flex:1}}
  @media(max-width:480px){.combatant-vitals{align-items:flex-start;flex-direction:column}.combat-initiative{align-items:flex-start;flex-direction:column}}

  :global(html),:global(body),:global(#app){box-sizing:border-box;width:100%;min-width:0;max-width:100vw;height:auto;min-height:0;margin:0;padding:0;overflow:hidden}
  /* Bonificadores de habilidades: competencia en amarillo y pericia en rojo. */
  :global(.nautical-skills .sheet-stat.proficient .skill-number),
  :global(.nautical-skills .sheet-stat.proficient .inline-roll){color:#ffd34e!important}
  :global(.nautical-skills .sheet-stat.expertise .skill-number),
  :global(.nautical-skills .sheet-stat.expertise .inline-roll){color:#b58cff!important}

  .builder-portrait-actions{display:flex;gap:.5rem;align-items:center}.builder-portrait-current{display:flex;align-items:center;gap:12px;margin-top:12px}.builder-portrait-current img{width:64px;height:96px;object-fit:cover;border-radius:6px;border:1px solid var(--line,#555)}
  .portrait-modal-backdrop{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;padding:18px}.portrait-modal{width:min(900px,96vw);max-height:88vh;overflow:auto;background:var(--panel,#171b24);border:1px solid var(--line,#444);border-radius:12px;padding:20px;box-shadow:0 20px 70px #0009}.portrait-modal>header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}.portrait-modal>header h3{margin:0 0 6px}.portrait-upload-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--line,#444);font-size:.9rem}.portrait-modal-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:10px;padding-top:16px}.portrait-modal-option{min-width:0;aspect-ratio:1/2;overflow:hidden;padding:0;border:1px solid var(--line,#555);border-radius:6px;background:#222;display:block;position:relative}.portrait-modal-option img{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:contain;object-position:center}.portrait-modal-option span{position:absolute;z-index:1;left:0;right:0;bottom:0;width:100%;padding:4px 2px;background:#000b;color:white;font-size:.62rem;overflow-wrap:anywhere}.portrait-modal-option:hover{border-color:var(--accent,#d5b36b)}.portrait-picker-error{color:#ff8b8b}
  @media(max-width:600px){.portrait-modal-backdrop{padding:6px}.portrait-modal{padding:12px;max-height:94vh}.portrait-modal>header{align-items:center}.portrait-upload-row{align-items:flex-start;flex-direction:column}}
</style>
