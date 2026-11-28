// @ts-nocheck
export const ENCOUNTER_BUDGETS = {
  1:{easy:50,normal:75,hard:100}, 2:{easy:100,normal:150,hard:200},
  3:{easy:150,normal:225,hard:400}, 4:{easy:250,normal:375,hard:500},
  5:{easy:500,normal:750,hard:1100}, 6:{easy:600,normal:1000,hard:1400},
  7:{easy:750,normal:1300,hard:1700}, 8:{easy:1000,normal:1700,hard:2100},
  9:{easy:1300,normal:2000,hard:2600}, 10:{easy:1600,normal:2300,hard:3100},
  11:{easy:1900,normal:2900,hard:4100}, 12:{easy:2200,normal:3700,hard:4700},
  13:{easy:2600,normal:4200,hard:5400}, 14:{easy:2900,normal:4900,hard:6200},
  15:{easy:3300,normal:5400,hard:7800}, 16:{easy:3800,normal:6100,hard:9800},
  17:{easy:4500,normal:7200,hard:11700}, 18:{easy:5000,normal:8700,hard:14200},
  19:{easy:5500,normal:10700,hard:17200}, 20:{easy:6400,normal:13200,hard:22000}
};
export const XP_BY_CR = {
  '0':10,'1/8':25,'1/4':50,'1/2':100,'1':200,'2':450,'3':700,'4':1100,
  '5':1800,'6':2300,'7':2900,'8':3900,'9':5000,'10':5900,'11':7200,
  '12':8400,'13':10000,'14':11500,'15':13000,'16':15000,'17':18000,
  '18':20000,'19':22000,'20':25000,'21':33000,'22':41000,'23':50000,
  '24':62000,'25':75000,'26':90000,'27':105000,'28':120000,'29':135000,'30':155000
};
export function crValue(monster) {
  return String(monster.cr || '').trim().split(/\s+/)[0] || '';
}
export function numericCr(cr) {
  const parts = cr.split('/').map(Number);
  return parts.length === 2 ? parts[0] / parts[1] : Number(parts[0]);
}
export function monsterXp(monster) {
  const raw = String(monster.cr || '');
  const before = raw.match(/XP\s*([\d,]+)/i);
  const after = raw.match(/([\d,]+)\s*XP/i);
  const explicit = before?.[1] || after?.[1];
  if (explicit) return Number(explicit.replace(/,/g, ''));
  return XP_BY_CR[crValue(monster)] || 0;
}
export function encounterBudget(level, partySize, difficulty) {
  if (!Number.isInteger(level) || level < 1 || level > 20) throw new RangeError('Nivel fuera de rango');
  if (!Number.isInteger(partySize) || partySize < 1) throw new RangeError('Cantidad de personajes inválida');
  return ENCOUNTER_BUDGETS[level][difficulty] * partySize;
}
export function canPurchase(currentSpent, cost, budget) {
  return Number.isFinite(currentSpent) && Number.isFinite(cost) && Number.isFinite(budget) &&
    currentSpent >= 0 && cost > 0 && budget >= 0 && currentSpent + cost <= budget;
}
export function chooseMonsterForPurchase(available, remainingBudget, remainingSlots, random = Math.random) {
  const affordable = available.filter(item => item.xp > 0 && item.xp <= remainingBudget);
  if (!affordable.length) return null;
  const candidates = affordable.filter(item => item.xp <= Math.max(1, remainingBudget / Math.max(1, remainingSlots - 0.35)));
  const pool = candidates.length ? candidates : affordable;
  const rawIndex = Math.floor(random() * pool.length);
  return pool[Math.min(pool.length - 1, Math.max(0, rawIndex))] || null;
}
export function expandEncounterForCombat(selection) {
  return selection.flatMap(item => {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) throw new RangeError('Cantidad inválida en encuentro');
    return Array.from({length:item.quantity}, () => item.monster);
  });
}

export function withinBudget(spent, budget) { return Number.isFinite(spent) && Number.isFinite(budget) && spent >= 0 && budget >= 0 && spent <= budget; }

export function encounterSignature(items) {
  return items.map(item => item.monster.name + ':' + item.quantity).sort().join('|');
}
export function createRandomEncounter(available, budget, random = Math.random, targetCount = 3 + Math.floor(random() * 3), stopChance = 0.22) {
  const items = [];
  const steps = [];
  let spent = 0;
  let creatures = 0;
  while (creatures < targetCount) {
    const chosen = chooseMonsterForPurchase(available, budget - spent, targetCount - creatures, random);
    if (!chosen) break;
    const existing = items.find(item => item.monster.name === chosen.monster.name);
    if (existing) existing.quantity += 1;
    else items.push({monster:chosen.monster,quantity:1});
    spent += chosen.xp;
    creatures += 1;
    steps.push({items:items.map(item=>({...item})),spent,creatures,target:targetCount});
    if (creatures >= 3 && random() < stopChance) break;
  }
  if (creatures < 3) return {steps,encounter:null};
  const normalized=items.map(item=>({...item})).sort((a,b)=>a.monster.name.localeCompare(b.monster.name,'es'));
  return {
    steps,
    encounter:{
      items:normalized,
      spent,
      creatures,
      key:encounterSignature(normalized)
    }
  };
}
export function areDistinctEncounters(encounters) {
  const keys=encounters.map(encounter=>encounter.key || encounterSignature(encounter.items));
  return new Set(keys).size===keys.length;
}

export const ENCOUNTER_TEMPLATES = {
  solo: { label:'Jefe individual', description:'Una criatura poderosa que concentra toda la amenaza.' },
  boss_minions: { label:'Jefe con secuaces', description:'Un enemigo principal acompañado por criaturas menores.' },
  duo: { label:'Dúo', description:'Dos enemigos con presencia individual y presión moderada.' },
  trio: { label:'Trío', description:'Tres enemigos; permite combinar funciones y amenazas.' },
  horde: { label:'Horda', description:'Seis a ocho criaturas; aumenta la presión y los turnos enemigos.' }
};

function randomItem(items, random) {
  if (!items.length) return null;
  return items[Math.min(items.length - 1, Math.max(0, Math.floor(random() * items.length)))];
}

function makeEncounter(items, steps, template) {
  const normalized = items.map(item => ({...item})).sort((a,b) => a.monster.name.localeCompare(b.monster.name,'es'));
  const spent = normalized.reduce((sum,item) => sum + monsterXp(item.monster) * item.quantity, 0);
  const creatures = normalized.reduce((sum,item) => sum + item.quantity, 0);
  const key = template + ':' + encounterSignature(normalized);
  return { steps, encounter:{items:normalized,spent,creatures,key,template} };
}

export function createEncounterFromTemplate(available, budget, template, random = Math.random) {
  if (!Number.isFinite(budget) || budget <= 0 || !ENCOUNTER_TEMPLATES[template]) return {steps:[],encounter:null};
  const tolerance = 0.03;
  const maximumSpend = budget * (1 + tolerance);
  const targetMinimum = budget * (1 - tolerance);
  const pool = available.filter(item => item.xp > 0 && item.xp <= maximumSpend);
  if (!pool.length) return {steps:[],encounter:null};
  const items = [];
  const steps = [];
  let spent = 0;
  let creatures = 0;
  let bossXp = Infinity;
  const add = (candidate) => {
    if (!candidate || spent + candidate.xp > maximumSpend) return false;
    const existing = items.find(item => item.monster.name === candidate.monster.name);
    if (existing) existing.quantity += 1;
    else items.push({monster:candidate.monster,quantity:1});
    spent += candidate.xp;
    creatures += 1;
    steps.push({items:items.map(item=>({...item})),spent,creatures,target:template});
    return true;
  };
  const pickDistinct = (remaining, excluded = []) => randomItem(
    pool.filter(item => item.xp <= remaining && !excluded.includes(item.monster.name)), random
  );
  const addBestFit = (candidates) => {
    const affordable = candidates.filter(item => item.xp > 0 && spent + item.xp <= maximumSpend);
    if (!affordable.length) return false;
    const ranked = [...affordable].sort((a,b) => Math.abs(budget - (spent + a.xp)) - Math.abs(budget - (spent + b.xp)));
    // Prioriza la compra que deje el total más cerca del 100 %, permitiendo una desviación máxima del 3 %.
    const bestDistance = Math.abs(budget - (spent + ranked[0].xp));
    const finalists = ranked.filter(item => Math.abs(budget - (spent + item.xp)) <= bestDistance + budget * 0.01).slice(0, 3);
    return add(randomItem(finalists, random));
  };

  if (template === 'solo') {
    // Un jefe individual no admite refuerzos: escoge la criatura más cara que quepa.
    const ranked = [...pool].sort((a,b) => Math.abs(budget - a.xp) - Math.abs(budget - b.xp));
    const bestDistance = Math.abs(budget - ranked[0].xp);
    const finalists = ranked.filter(item => Math.abs(budget - item.xp) <= bestDistance + budget * 0.01).slice(0, 3);
    add(randomItem(finalists, random));
  } else if (template === 'duo' || template === 'trio') {
    const count = template === 'duo' ? 2 : 3;
    for (let i=0;i<count;i++) {
      const candidate = pickDistinct(budget - spent, items.map(item => item.monster.name));
      if (!candidate || !add(candidate)) break;
    }
    if (creatures !== count) return {steps,encounter:null};
  } else if (template === 'horde') {
    const target = 6 + Math.floor(random() * 3);
    for (let i=0;i<target;i++) {
      const affordable = pool.filter(item => item.xp <= budget - spent);
      const candidate = randomItem(affordable, random);
      if (!candidate || !add(candidate)) break;
    }
    if (creatures < 6) return {steps,encounter:null};
  } else if (template === 'boss_minions') {
    const bossPool = pool.filter(item => item.xp <= budget * 0.7 && item.xp >= Math.min(100, budget * 0.2));
    const fallbackBosses = pool.filter(item => item.xp <= budget * 0.6);
    const boss = randomItem(bossPool.length ? bossPool : fallbackBosses, random);
    if (!boss || !add(boss)) return {steps,encounter:null};
    bossXp = boss.xp;
    const minions = pool.filter(item => item.xp < bossXp);
    for (let i=0;i<2;i++) {
      if (!addBestFit(minions)) return {steps,encounter:null};
    }
  }

  // Todas las plantillas salvo jefe individual reciben refuerzos hasta quedar lo más cerca
  // posible del 100 %, dentro de una tolerancia de ±3 puntos porcentuales.
  if (template !== 'solo') {
    let safety = 0;
    while (spent < targetMinimum && safety < 100) {
      safety += 1;
      const candidates = template === 'boss_minions'
        ? pool.filter(item => item.xp < bossXp)
        : pool;
      if (!addBestFit(candidates)) break;
    }
  }

  const result = makeEncounter(items, steps, template);
  result.encounter.budgetUse = budget > 0 ? result.encounter.spent / budget : 0;
  result.encounter.targetReached = result.encounter.budgetUse >= 0.97 && result.encounter.budgetUse <= 1.03;
  result.encounter.budgetTolerance = 0.03;
  return result;
}
