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
  const tabs = ['Datos', 'Competencias', 'Equipo', 'Combate', 'Conjuros', 'Tiradas'];
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
    "category": "Consumible",
    "name": "Antorcha",
    "price": 0.01,
    "priceLabel": "1 pc"
  },
  {
    "number": 2,
    "category": "Munición",
    "name": "20 balas de honda",
    "price": 0.04,
    "priceLabel": "4 pc"
  },
  {
    "number": 3,
    "category": "Consumible",
    "name": "Aceite (frasco)",
    "price": 0.1,
    "priceLabel": "10 pc"
  },
  {
    "number": 4,
    "category": "Equipo",
    "name": "Bolas de metal (bolsa)",
    "price": 0.1,
    "priceLabel": "10 pc"
  },
  {
    "number": 5,
    "category": "Equipo",
    "name": "Escalera (3 m)",
    "price": 0.1,
    "priceLabel": "10 pc"
  },
  {
    "number": 6,
    "category": "Arma",
    "name": "Honda",
    "price": 0.1,
    "priceLabel": "10 pc"
  },
  {
    "number": 7,
    "category": "Arma",
    "name": "Bastón",
    "price": 0.2,
    "priceLabel": "20 pc"
  },
  {
    "number": 8,
    "category": "Arma",
    "name": "Garrote grande",
    "price": 0.2,
    "priceLabel": "20 pc"
  },
  {
    "number": 9,
    "category": "Equipo",
    "name": "Yesquero",
    "price": 0.5,
    "priceLabel": "50 pc"
  },
  {
    "number": 10,
    "category": "Equipo",
    "name": "Manta",
    "price": 0.5,
    "priceLabel": "50 pc"
  },
  {
    "number": 11,
    "category": "Equipo",
    "name": "Frasco de aceite x5",
    "price": 0.5,
    "priceLabel": "50 pc"
  },
  {
    "number": 12,
    "category": "Arma",
    "name": "Jabalina",
    "price": 0.5,
    "priceLabel": "50 pc"
  },
  {
    "number": 13,
    "category": "Equipo",
    "name": "Abrojos (bolsa)",
    "price": 1,
    "priceLabel": "1 po"
  },
  {
    "number": 14,
    "category": "Equipo",
    "name": "Cuerda de cáñamo (15 m)",
    "price": 1,
    "priceLabel": "1 po"
  },
  {
    "number": 15,
    "category": "Equipo",
    "name": "Red",
    "price": 1,
    "priceLabel": "1 po"
  },
  {
    "number": 16,
    "category": "Equipo",
    "name": "Capa",
    "price": 1,
    "priceLabel": "1 po"
  },
  {
    "number": 17,
    "category": "Equipo",
    "name": "Martillo",
    "price": 1,
    "priceLabel": "1 po"
  },
  {
    "number": 18,
    "category": "Munición",
    "name": "20 flechas",
    "price": 1,
    "priceLabel": "1 po"
  },
  {
    "number": 19,
    "category": "Munición",
    "name": "20 virotes",
    "price": 1,
    "priceLabel": "1 po"
  },
  {
    "number": 20,
    "category": "Arma",
    "name": "Lanza",
    "price": 1,
    "priceLabel": "1 po"
  },
  {
    "number": 21,
    "category": "Equipo",
    "name": "Campana de alarma",
    "price": 1,
    "priceLabel": "1 po"
  },
  {
    "number": 22,
    "category": "Equipo",
    "name": "Palanqueta",
    "price": 2,
    "priceLabel": "2 po"
  },
  {
    "number": 23,
    "category": "Equipo",
    "name": "Garfio",
    "price": 2,
    "priceLabel": "2 po"
  },
  {
    "number": 24,
    "category": "Equipo",
    "name": "Pico de minero",
    "price": 2,
    "priceLabel": "2 po"
  },
  {
    "number": 25,
    "category": "Equipo",
    "name": "Pala",
    "price": 2,
    "priceLabel": "2 po"
  },
  {
    "number": 26,
    "category": "Arma",
    "name": "Daga",
    "price": 2,
    "priceLabel": "2 po"
  },
  {
    "number": 27,
    "category": "Equipo",
    "name": "Grilletes",
    "price": 2,
    "priceLabel": "2 po"
  },
  {
    "number": 28,
    "category": "Equipo",
    "name": "Cuerno",
    "price": 3,
    "priceLabel": "3 po"
  },
  {
    "number": 29,
    "category": "Monedas",
    "name": "Puñado de 5 monedas de oro",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 30,
    "category": "Equipo",
    "name": "Cadena (3 m)",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 31,
    "category": "Equipo",
    "name": "Trampa de caza",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 32,
    "category": "Equipo",
    "name": "Espejo de acero",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 33,
    "category": "Equipo",
    "name": "Lámpara",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 34,
    "category": "Arma",
    "name": "Hacha de mano",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 35,
    "category": "Arma",
    "name": "Maza",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 36,
    "category": "Arma",
    "name": "Tridente",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 37,
    "category": "Armadura",
    "name": "Armadura acolchada",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 38,
    "category": "Herramienta",
    "name": "Suministros de herborista",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 39,
    "category": "Equipo",
    "name": "Kit de sanador",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 40,
    "category": "Equipo",
    "name": "Bolsa de abrojos reforzada",
    "price": 5,
    "priceLabel": "5 po"
  },
  {
    "number": 41,
    "category": "Monedas",
    "name": "Pequeño montículo de 10 monedas de oro",
    "price": 10,
    "priceLabel": "10 po"
  },
  {
    "number": 42,
    "category": "Equipo",
    "name": "Linterna sorda",
    "price": 10,
    "priceLabel": "10 po"
  },
  {
    "number": 43,
    "category": "Equipo",
    "name": "Linterna de ojo de buey",
    "price": 10,
    "priceLabel": "10 po"
  },
  {
    "number": 44,
    "category": "Equipo",
    "name": "Cuerda de seda (15 m)",
    "price": 10,
    "priceLabel": "10 po"
  },
  {
    "number": 45,
    "category": "Arma",
    "name": "Espada corta",
    "price": 10,
    "priceLabel": "10 po"
  },
  {
    "number": 46,
    "category": "Arma",
    "name": "Hacha de batalla",
    "price": 10,
    "priceLabel": "10 po"
  },
  {
    "number": 47,
    "category": "Armadura",
    "name": "Escudo",
    "price": 10,
    "priceLabel": "10 po"
  },
  {
    "number": 48,
    "category": "Armadura",
    "name": "Armadura de cuero",
    "price": 10,
    "priceLabel": "10 po"
  },
  {
    "number": 49,
    "category": "Monedas",
    "name": "Montículo de 15 monedas de oro",
    "price": 15,
    "priceLabel": "15 po"
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
    "category": "Arma",
    "name": "Martillo de guerra",
    "price": 15,
    "priceLabel": "15 po"
  },
  {
    "number": 52,
    "category": "Monedas",
    "name": "Montículo de 20 monedas de oro",
    "price": 20,
    "priceLabel": "20 po"
  },
  {
    "number": 53,
    "category": "Monedas",
    "name": "Montículo de 25 monedas de oro",
    "price": 25,
    "priceLabel": "25 po"
  },
  {
    "number": 54,
    "category": "Consumible",
    "name": "Frasco de ácido",
    "price": 25,
    "priceLabel": "25 po"
  },
  {
    "number": 55,
    "category": "Consumible",
    "name": "Frasco de agua bendita",
    "price": 25,
    "priceLabel": "25 po"
  },
  {
    "number": 56,
    "category": "Arma",
    "name": "Ballesta ligera",
    "price": 25,
    "priceLabel": "25 po"
  },
  {
    "number": 57,
    "category": "Arma",
    "name": "Arco corto",
    "price": 25,
    "priceLabel": "25 po"
  },
  {
    "number": 58,
    "category": "Herramienta",
    "name": "Herramientas de ladrón",
    "price": 25,
    "priceLabel": "25 po"
  },
  {
    "number": 59,
    "category": "Equipo",
    "name": "Kit de escalada",
    "price": 25,
    "priceLabel": "25 po"
  },
  {
    "number": 60,
    "category": "Equipo",
    "name": "Kit de disfraz",
    "price": 25,
    "priceLabel": "25 po"
  },
  {
    "number": 61,
    "category": "Monedas",
    "name": "Montículo de 30 monedas de oro",
    "price": 30,
    "priceLabel": "30 po"
  },
  {
    "number": 62,
    "category": "Monedas",
    "name": "Montículo de 40 monedas de oro",
    "price": 40,
    "priceLabel": "40 po"
  },
  {
    "number": 63,
    "category": "Armadura",
    "name": "Armadura de cuero tachonado",
    "price": 45,
    "priceLabel": "45 po"
  },
  {
    "number": 64,
    "category": "Monedas",
    "name": "Montículo de 50 monedas de oro",
    "price": 50,
    "priceLabel": "50 po"
  },
  {
    "number": 65,
    "category": "Consumible",
    "name": "Fuego de alquimista (frasco)",
    "price": 50,
    "priceLabel": "50 po"
  },
  {
    "number": 66,
    "category": "Armadura",
    "name": "Camisote de malla",
    "price": 50,
    "priceLabel": "50 po"
  },
  {
    "number": 67,
    "category": "Armadura",
    "name": "Cota de escamas",
    "price": 50,
    "priceLabel": "50 po"
  },
  {
    "number": 68,
    "category": "Poción",
    "name": "Poción de curación",
    "price": 50,
    "priceLabel": "50 po"
  },
  {
    "number": 69,
    "category": "Herramienta",
    "name": "Suministros de alquimista",
    "price": 50,
    "priceLabel": "50 po"
  },
  {
    "number": 70,
    "category": "Monedas",
    "name": "Montículo de 60 monedas de oro",
    "price": 60,
    "priceLabel": "60 po"
  },
  {
    "number": 71,
    "category": "Pergamino",
    "name": "Pergamino de conjuro de nivel 1",
    "price": 60,
    "priceLabel": "60 po"
  },
  {
    "number": 72,
    "category": "Monedas",
    "name": "Montículo de 75 monedas de oro",
    "price": 75,
    "priceLabel": "75 po"
  },
  {
    "number": 73,
    "category": "Armadura",
    "name": "Cota de malla",
    "price": 75,
    "priceLabel": "75 po"
  },
  {
    "number": 74,
    "category": "Poción",
    "name": "Poción de escalada",
    "price": 75,
    "priceLabel": "75 po"
  },
  {
    "number": 75,
    "category": "Monedas",
    "name": "Montículo de 100 monedas de oro",
    "price": 100,
    "priceLabel": "100 po"
  },
  {
    "number": 76,
    "category": "Consumible",
    "name": "Veneno básico (vial)",
    "price": 100,
    "priceLabel": "100 po"
  },
  {
    "number": 77,
    "category": "Poción",
    "name": "Poción de respiración acuática",
    "price": 100,
    "priceLabel": "100 po"
  },
  {
    "number": 78,
    "category": "Pergamino",
    "name": "Pergamino de conjuro de nivel 2",
    "price": 120,
    "priceLabel": "120 po"
  },
  {
    "number": 79,
    "category": "Monedas",
    "name": "Montículo de 125 monedas de oro",
    "price": 125,
    "priceLabel": "125 po"
  },
  {
    "number": 80,
    "category": "Monedas",
    "name": "Montículo de 150 monedas de oro",
    "price": 150,
    "priceLabel": "150 po"
  },
  {
    "number": 81,
    "category": "Monedas",
    "name": "Montículo de 200 monedas de oro",
    "price": 200,
    "priceLabel": "200 po"
  },
  {
    "number": 82,
    "category": "Pergamino",
    "name": "Pergamino de conjuro de nivel 3",
    "price": 240,
    "priceLabel": "240 po"
  },
  {
    "number": 83,
    "category": "Poción",
    "name": "Poción de resistencia al fuego",
    "price": 300,
    "priceLabel": "300 po"
  },
  {
    "number": 84,
    "category": "Poción",
    "name": "Poción de resistencia al frío",
    "price": 300,
    "priceLabel": "300 po"
  },
  {
    "number": 85,
    "category": "Poción",
    "name": "Poción de resistencia al rayo",
    "price": 300,
    "priceLabel": "300 po"
  },
  {
    "number": 86,
    "category": "Poción",
    "name": "Poción de resistencia al ácido",
    "price": 300,
    "priceLabel": "300 po"
  },
  {
    "number": 87,
    "category": "Poción",
    "name": "Poción de resistencia al veneno",
    "price": 300,
    "priceLabel": "300 po"
  },
  {
    "number": 88,
    "category": "Poción",
    "name": "Poción de resistencia al trueno",
    "price": 300,
    "priceLabel": "300 po"
  },
  {
    "number": 89,
    "category": "Poción",
    "name": "Poción de resistencia al daño necrótico",
    "price": 300,
    "priceLabel": "300 po"
  },
  {
    "number": 90,
    "category": "Poción",
    "name": "Poción de resistencia al daño radiante",
    "price": 300,
    "priceLabel": "300 po"
  },
  {
    "number": 91,
    "category": "Armadura",
    "name": "Coraza",
    "price": 400,
    "priceLabel": "400 po"
  },
  {
    "number": 92,
    "category": "Poción",
    "name": "Poción de curación superior",
    "price": 500,
    "priceLabel": "500 po"
  },
  {
    "number": 93,
    "category": "Poción",
    "name": "Poción de fuerza de gigante de las colinas",
    "price": 500,
    "priceLabel": "500 po"
  },
  {
    "number": 94,
    "category": "Poción",
    "name": "Poción de curación mayor",
    "price": 500,
    "priceLabel": "500 po"
  },
  {
    "number": 95,
    "category": "Armadura",
    "name": "Media armadura",
    "price": 750,
    "priceLabel": "750 po"
  },
  {
    "number": 96,
    "category": "Armadura",
    "name": "Armadura de placas",
    "price": 1500,
    "priceLabel": "1.500 po"
  },
  {
    "number": 97,
    "category": "Poción",
    "name": "Poción de velocidad",
    "price": 4000,
    "priceLabel": "4.000 po"
  },
  {
    "number": 98,
    "category": "Poción",
    "name": "Poción de invisibilidad",
    "price": 5000,
    "priceLabel": "5.000 po"
  },
  {
    "number": 99,
    "category": "Poción",
    "name": "Poción de vuelo",
    "price": 5000,
    "priceLabel": "5.000 po"
  },
  {
    "number": 100,
    "category": "Poción",
    "name": "Poción de curación suprema",
    "price": 50000,
    "priceLabel": "50.000 po"
  }
];
  let lastChestRoll: { total: number; dice: number[]; lootNumber: number; category: string; name: string; priceLabel: string } | null = null;
  function rollChestLoot() {
    const dice = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10) + 1);
    const total = dice.reduce((sum, value) => sum + value, 0);
    // 55 es el centro y entrega el objeto más barato. Cuanto más se aleja
    // el resultado hacia 10 o 100, más alto es el valor del botín.
    const distance = Math.abs(total - 55);
    const lootNumber = Math.min(100, Math.max(1, Math.round(1 + (distance / 45) * 99)));
    const loot = CHEST_LOOT[lootNumber - 1];
    lastChestRoll = { total, dice, lootNumber, category: loot.category, name: loot.name, priceLabel: loot.priceLabel };
  }

  let masterTab = 'Personajes';
  const masterTabs = ['Personajes', 'Cofres', 'Monstruos ordenados'];
  const MONSTERS = [
    {
      name: 'Cultista', english: 'Cultist', type: 'Humanoide mediano o pequeño', alignment: 'Neutral', cr: '1/8 (25 PX)',
      ac: 12, initiative: '+1 (11)', hp: '9 (2d8)', speed: '30 pies',
      abilities: 'Fue 11 (+0) · Des 12 (+1) · Con 10 (+0) · Int 10 (+0) · Sab 11 (+0) · Car 10 (+0)',
      skills: 'Engaño +2, Religión +2', senses: 'Percepción pasiva 10', languages: 'Común',
      traits: 'Ninguno.',
      attacks: [{name:'Hoz ritual', bonus:'+3', reach:'5 pies', damage:'3 (1d4 + 1) cortante + 1 necrótico'}],
      role: 'Combatiente básico; daño bajo y sencillo de administrar.'
    },
    {
      name: 'Estirge', english: 'Stirge', type: 'Monstruosidad diminuta', alignment: 'Sin alineamiento', cr: '1/8 (25 PX)',
      ac: 13, initiative: '+3 (13)', hp: '5 (2d4)', speed: '10 pies, volar 40 pies',
      abilities: 'Fue 4 (−3) · Des 16 (+3) · Con 11 (+0) · Int 2 (−4) · Sab 8 (−1) · Car 6 (−2)',
      skills: '—', senses: 'Visión en la oscuridad 60 pies; Percepción pasiva 9', languages: '—',
      traits: 'Cuando impacta, se adhiere al objetivo. Mientras permanece adherida, no vuelve a atacar con la probóscide y el objetivo recibe 5 (2d4) de daño necrótico al comienzo de cada turno de la estirge. Puede soltarse gastando 5 pies de movimiento; el objetivo o una criatura adyacente puede retirarla usando una acción.',
      attacks: [{name:'Probóscide', bonus:'+5', reach:'5 pies', damage:'6 (1d6 + 3) perforante; se adhiere al objetivo'}],
      role: 'Amenaza voladora que obliga a gastar acciones para retirarla.'
    },
    {
      name: 'Goblin esbirro', english: 'Goblin Minion', type: 'Feérico pequeño (goblinoide)', alignment: 'Caótico neutral', cr: '1/8 (25 PX)',
      ac: 12, initiative: '+2 (12)', hp: '7 (2d6)', speed: '30 pies',
      abilities: 'Fue 8 (−1) · Des 15 (+2) · Con 10 (+0) · Int 10 (+0) · Sab 8 (−1) · Car 8 (−1)',
      skills: 'Sigilo +6', senses: 'Visión en la oscuridad 60 pies; Percepción pasiva 9', languages: 'Común, goblin',
      traits: 'Escape ágil (acción adicional): realiza las acciones Destrabarse u Ocultarse.',
      attacks: [{name:'Daga', bonus:'+4', reach:'5 pies o 20/60 pies', damage:'4 (1d4 + 2) perforante'}],
      role: 'Hostigador móvil; puede retirarse o esconderse con facilidad.'
    },
    {
      name: 'Guerrero kóbold', english: 'Kobold Warrior', type: 'Dragón pequeño', alignment: 'Neutral', cr: '1/8 (25 PX)',
      ac: 14, initiative: '+2 (12)', hp: '7 (3d6 − 3)', speed: '30 pies',
      abilities: 'Fue 7 (−2) · Des 15 (+2) · Con 9 (−1) · Int 8 (−1) · Sab 7 (−2) · Car 8 (−1)',
      skills: '—', senses: 'Visión en la oscuridad 60 pies; Percepción pasiva 8', languages: 'Común, dracónico',
      traits: 'Tácticas de grupo: tiene ventaja en una tirada de ataque contra una criatura si al menos un aliado no incapacitado está a 5 pies de ella. Sensibilidad a la luz solar: tiene desventaja en pruebas de característica y tiradas de ataque bajo luz solar.',
      attacks: [{name:'Daga', bonus:'+4', reach:'5 pies o 20/60 pies', damage:'4 (1d4 + 2) perforante'}],
      role: 'Enemigo de grupo; gana ventaja cuando rodea a un aventurero.'
    },
    {
      name: 'Rata gigante', english: 'Giant Rat', type: 'Bestia pequeña', alignment: 'Sin alineamiento', cr: '1/8 (25 PX)',
      ac: 13, initiative: '+3 (13)', hp: '7 (2d6)', speed: '30 pies, trepar 30 pies',
      abilities: 'Fue 7 (−2) · Des 16 (+3) · Con 11 (+0) · Int 2 (−4) · Sab 10 (+0) · Car 4 (−3)',
      skills: 'Percepción +2', senses: 'Visión en la oscuridad 60 pies; Percepción pasiva 12', languages: '—',
      traits: 'Tácticas de grupo: tiene ventaja en una tirada de ataque contra una criatura si al menos un aliado no incapacitado está a 5 pies de ella.',
      attacks: [{name:'Mordisco', bonus:'+5', reach:'5 pies', damage:'5 (1d4 + 3) perforante'}],
      role: 'Enemigo básico; peligrosa cuando varias ratas atacan al mismo objetivo.'
    },
    {
      name: 'Serpiente voladora', english: 'Flying Snake', type: 'Monstruosidad diminuta', alignment: 'Sin alineamiento', cr: '1/8 (25 PX)',
      ac: 14, initiative: '+2 (12)', hp: '5 (2d4)', speed: '30 pies, volar 60 pies, nadar 30 pies',
      abilities: 'Fue 4 (−3) · Des 15 (+2) · Con 11 (+0) · Int 2 (−4) · Sab 12 (+1) · Car 5 (−3)',
      skills: '—', senses: 'Vista ciega 10 pies; Percepción pasiva 11', languages: '—',
      traits: 'Sobrevuelo: no provoca ataques de oportunidad cuando sale volando del alcance de un enemigo.',
      attacks: [{name:'Mordisco', bonus:'+4', reach:'5 pies', damage:'1 perforante + 5 (2d4) de veneno'}],
      role: 'Atacante voladora rápida; puede entrar, atacar y alejarse.'
    },
    {
      name: 'Araña gigante', english: 'Giant Spider', type: 'Bestia grande', alignment: 'Sin alineamiento', cr: '1 (200 PX)',
      ac: 14, initiative: '+3 (13)', hp: '26 (4d10 + 4)', speed: '30 pies, trepar 30 pies',
      abilities: 'Fue 14 (+2) · Des 16 (+3) · Con 12 (+1) · Int 2 (−4) · Sab 11 (+0) · Car 4 (−3)',
      skills: 'Percepción +4, Sigilo +7', senses: 'Visión en la oscuridad 60 pies; Percepción pasiva 14', languages: '—',
      traits: 'Trepar por arañas: puede trepar superficies difíciles, incluso techos, sin pruebas de característica. Caminante de telarañas: ignora las restricciones de movimiento causadas por telarañas y conoce la ubicación de cualquier criatura en contacto con la misma telaraña.',
      attacks: [
        {name:'Mordisco', bonus:'+5', reach:'5 pies', damage:'7 (1d8 + 3) perforante + 7 (2d6) de veneno'},
        {name:'Telaraña (recarga 5–6)', description:'Una criatura que pueda ver a 60 pies o menos realiza una salvación de Destreza CD 13. Si falla, queda apresada hasta que se destruya la telaraña (CA 10; 5 PG; vulnerabilidad al fuego; inmunidad al veneno y al daño psíquico).'}
      ],
      role: 'Controladora y emboscadora; puede apresar a distancia y trepar por paredes y techos.'
    },
    {
      name: 'Araña lobo gigante', english: 'Giant Wolf Spider', type: 'Bestia mediana', alignment: 'Sin alineamiento', cr: '1/4 (50 PX)',
      ac: 13, initiative: '+3 (13)', hp: '11 (2d8 + 2)', speed: '40 pies, trepar 40 pies',
      abilities: 'Fue 12 (+1) · Des 16 (+3) · Con 13 (+1) · Int 3 (−4) · Sab 12 (+1) · Car 4 (−3)',
      skills: 'Percepción +3, Sigilo +7', senses: 'Vista ciega 10 pies, visión en la oscuridad 60 pies; Percepción pasiva 13', languages: '—',
      traits: 'Trepar por arañas: puede trepar superficies difíciles, incluso techos, sin pruebas de característica.',
      attacks: [{name:'Mordisco', bonus:'+5', reach:'5 pies', damage:'5 (1d4 + 3) perforante + 5 (2d4) de veneno'}],
      role: 'Emboscadora; trepa por paredes y techos para atacar desde ángulos inesperados.'
    },
    {
      name: 'Espada voladora animada', english: 'Animated Flying Sword', type: 'Constructo pequeño', alignment: 'Sin alineamiento', cr: '1/4 (50 PX)',
      ac: 17, initiative: '+4 (14)', hp: '14 (4d6)', speed: '5 pies, volar 50 pies (flotar)',
      abilities: 'Fue 12 (+1) · Des 15 (+2) · Con 11 (+0) · Int 1 (−5) · Sab 5 (−3) · Car 1 (−5)',
      skills: 'Salvación de Destreza +4', senses: 'Vista ciega 60 pies; Percepción pasiva 7', languages: '—',
      traits: 'Inmunidades al daño: veneno y psíquico. Inmunidades a estados: hechizado, ensordecido, agotamiento, asustado, paralizado, petrificado y envenenado.',
      attacks: [{name:'Tajo', bonus:'+4', reach:'5 pies', damage:'6 (1d8 + 2) cortante'}],
      role: 'Atacante voladora con CA alta; puede atravesar obstáculos y presionar a personajes aislados.'
    },
    {
      name: 'Esqueleto', english: 'Skeleton', type: 'Muerto viviente mediano', alignment: 'Legal malvado', cr: '1/4 (50 PX)',
      ac: 14, initiative: '+3 (13)', hp: '13 (2d8 + 4)', speed: '30 pies',
      abilities: 'Fue 10 (+0) · Des 16 (+3) · Con 15 (+2) · Int 6 (−2) · Sab 8 (−1) · Car 5 (−3)',
      skills: '—', senses: 'Visión en la oscuridad 60 pies; Percepción pasiva 9', languages: 'Comprende común y otro idioma, pero no puede hablar',
      traits: 'Vulnerabilidad al daño contundente. Inmunidad al daño de veneno e inmunidad a los estados agotamiento y envenenado.',
      attacks: [
        {name:'Espada corta', bonus:'+5', reach:'5 pies', damage:'6 (1d6 + 3) perforante'},
        {name:'Arco corto', bonus:'+5', reach:'80/320 pies', damage:'6 (1d6 + 3) perforante'}
      ],
      role: 'Combatiente versátil; puede mantener distancia con el arco o bloquear pasillos con la espada.'
    },
    {
      name: 'Lobo', english: 'Wolf', type: 'Bestia mediana', alignment: 'Sin alineamiento', cr: '1/4 (50 PX)',
      ac: 12, initiative: '+2 (12)', hp: '11 (2d8 + 2)', speed: '40 pies',
      abilities: 'Fue 14 (+2) · Des 15 (+2) · Con 12 (+1) · Int 3 (−4) · Sab 12 (+1) · Car 6 (−2)',
      skills: 'Percepción +5, Sigilo +4', senses: 'Visión en la oscuridad 60 pies; Percepción pasiva 15', languages: '—',
      traits: 'Tácticas de grupo: tiene ventaja en las tiradas de ataque contra una criatura si al menos un aliado del lobo está a 5 pies de ella y no está incapacitado.',
      attacks: [{name:'Mordisco', bonus:'+4', reach:'5 pies', damage:'5 (1d6 + 2) perforante; si el objetivo es Mediano o menor, queda derribado'}],
      role: 'Cazador de manada; derriba a los aventureros y aprovecha los ataques coordinados.'
    },
    {
      name: 'Rana gigante', english: 'Giant Frog', type: 'Bestia mediana', alignment: 'Sin alineamiento', cr: '1/4 (50 PX)',
      ac: 11, initiative: '+1 (11)', hp: '18 (4d8)', speed: '30 pies, nadar 30 pies',
      abilities: 'Fue 12 (+1) · Des 13 (+1) · Con 11 (+0) · Int 2 (−4) · Sab 10 (+0) · Car 3 (−4)',
      skills: 'Percepción +2, Sigilo +4', senses: 'Visión en la oscuridad 30 pies; Percepción pasiva 12', languages: '—',
      traits: 'Anfibia: puede respirar aire y agua. Salto parado: salta hasta 20 pies en largo o 10 pies en alto sin carrera.',
      attacks: [
        {name:'Mordisco', bonus:'+3', reach:'5 pies', damage:'5 (1d6 + 2) perforante; el objetivo Mediano o menor queda agarrado (CD 11 para escapar)'},
        {name:'Engullir', bonus:'—', reach:'objetivo Pequeño o menor que tenga agarrado', damage:'lo deja cegado y apresado; al final del siguiente turno de la rana recibe 5 (2d4) de daño ácido y, si sobrevive, es expulsado y queda tumbado'}
      ],
      role: 'Control de posición; puede sacar temporalmente a un aventurero del combate al engullirlo.'
    },
    {
      name: 'Zombi', english: 'Zombie', type: 'Muerto viviente mediano', alignment: 'Neutral malvado', cr: '1/4 (50 PX)',
      ac: 8, initiative: '−2 (8)', hp: '15 (2d8 + 6)', speed: '20 pies',
      abilities: 'Fue 13 (+1) · Des 6 (−2) · Con 16 (+3) · Int 3 (−4) · Sab 6 (−2) · Car 5 (−3)',
      skills: 'Salvación de Sabiduría +0', senses: 'Visión en la oscuridad 60 pies; Percepción pasiva 8', languages: 'Comprende común y otro idioma, pero no puede hablar',
      traits: 'Fortaleza de los muertos vivientes: al quedar en 0 PG, realiza una salvación de Constitución CD 5 + el daño recibido; si tiene éxito, queda en 1 PG. No puede usar este rasgo si recibe daño radiante o un golpe crítico. Inmunidad al daño de veneno y a los estados agotamiento y envenenado.',
      attacks: [{name:'Golpe', bonus:'+3', reach:'5 pies', damage:'5 (1d8 + 1) contundente'}],
      role: 'Enemigo lento y resistente; puede sobrevivir a un golpe que debería destruirlo y prolongar el combate.'
    }
  ];

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
    if (!obrReady || obrRole !== 'PLAYER') {
      notice = 'Las tiradas solo pueden enviarse desde la ficha de un jugador dentro de Owlbear Rodeo.';
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
                  <div class="character-sheet gm-character-sheet">
                    <div class="sheet-banner"><h2>{entry.sheet?.name || 'Personaje'}</h2></div>
                    <div class="sheet-grid">
                      {#each visiblePairs(entry.sheet?.sections || [], 'Datos') as pair}
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
      {:else}
        <section class="panel monsters-panel">
          <div class="section-heading"><h2>Monstruos ordenados</h2><span class="count">6 criaturas · VD 1/8</span></div>
          <p class="muted">Bloques resumidos para consulta rápida durante el combate. Orden alfabético por nombre.</p>
          <div class="monster-list">
            {#each MONSTERS as monster}
              <details class="monster-card">
                <summary>
                  <span class="monster-name">{monster.name}</span>
                  <span class="monster-subtitle">{monster.english} · {monster.type}</span>
                  <span class="monster-cr">VD {monster.cr}</span>
                </summary>
                <div class="monster-statblock">
                  <div class="monster-heading">
                    <h3>{monster.name}</h3>
                    <span>{monster.type} · {monster.alignment}</span>
                  </div>
                  <div class="monster-combat-grid">
                    <div><small>CA</small><strong>{monster.ac}</strong></div>
                    <div><small>PG</small><strong>{monster.hp}</strong></div>
                    <div><small>Iniciativa</small><strong>{monster.initiative}</strong></div>
                    <div><small>Velocidad</small><strong>{monster.speed}</strong></div>
                  </div>
                  <p><b>Características:</b> {monster.abilities}</p>
                  <p><b>Habilidades:</b> {monster.skills}</p>
                  <p><b>Sentidos:</b> {monster.senses}</p>
                  <p><b>Idiomas:</b> {monster.languages}</p>
                  <p><b>Rasgos:</b> {monster.traits}</p>
                  <div class="monster-attacks">
                    <b>Acciones</b>
                    {#each monster.attacks as attack}
                      {#if attack.description}
                        <p><strong>{attack.name}.</strong> {attack.description}</p>
                      {:else}
                        <p><strong>{attack.name}.</strong> Ataque {attack.bonus}; alcance {attack.reach}. Daño: {attack.damage}.</p>
                      {/if}
                    {/each}
                  </div>
                  <p class="monster-role"><b>Uso táctico:</b> {monster.role}</p>
                  <small class="monster-source">D&D 2024 · SRD 5.2.1 · VD {monster.cr}</small>
                </div>
              </details>
            {/each}
          </div>
          <p class="monster-attribution">Este trabajo incluye material del System Reference Document 5.2.1 (SRD 5.2.1) de Wizards of the Coast LLC, disponible bajo licencia Creative Commons Attribution 4.0 International.</p>
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
              <label>Archivo<input bind:this={fileInput} type="file" accept=".json,application/json" on:change={importJson} /></label>
              <div class="actions"><button class="secondary" on:click={() => importOpen = false}>Cerrar</button></div>
            </div>
          {/if}
        </section>
      {/if}

      {#if sheet}
        <article class="character-sheet">
          <header class="sheet-banner">
            <h1 class="character-name">{sheet.name || 'Personaje'}</h1>
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
          {:else}
          {#if activeTab === 'Datos'}
            <section class="import-character-panel data-import-panel">
              <div class="import-row">
                <button class="secondary" on:click={() => importOpen = !importOpen}>Importar otro JSON</button>
              </div>
              {#if importOpen}
                <div class="import-box">
                  <label>Archivo<input bind:this={fileInput} type="file" accept=".json,application/json" on:change={importJson} /></label>
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
  <footer><span>FORJA DE AVENTUREROS · v1.0.5</span></footer>
</div>

<style>
  :global(:root){--paper:#f3eee2;--paper-deep:#e8dfce;--ink:#24231f;--ink-soft:#5e594f;--rule:#c9bea9;--red:#8f3028;--gold:#b18a45}
  .master-tabs{display:flex;gap:.4rem;overflow-x:auto;padding:.2rem 0 .7rem;margin:.8rem 0;border-bottom:1px solid var(--rule)}
  .master-tabs button{flex:0 0 auto;border:1px solid var(--rule);border-radius:5px;padding:.55rem .8rem;background:#e8dfce;color:var(--ink-soft);font:600 .75rem system-ui,sans-serif;cursor:pointer}
  .master-tabs button.active{background:var(--ink);border-color:var(--ink);color:var(--paper)}
  .monsters-panel{margin-top:.5rem}
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
</style>
