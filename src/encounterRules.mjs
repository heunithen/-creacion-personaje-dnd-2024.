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
