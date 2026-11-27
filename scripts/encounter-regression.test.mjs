import test from 'node:test';
import assert from 'node:assert/strict';
import { ENCOUNTER_BUDGETS, XP_BY_CR, crValue, numericCr, monsterXp, encounterBudget, canPurchase, withinBudget, chooseMonsterForPurchase, createRandomEncounter, encounterSignature, areDistinctEncounters, expandEncounterForCombat } from '../src/encounterRules.mjs';

test('la tabla de presupuesto contiene los 20 niveles y tres dificultades', () => {
  assert.equal(Object.keys(ENCOUNTER_BUDGETS).length, 20);
  for (const row of Object.values(ENCOUNTER_BUDGETS)) {
    assert.ok(row.easy > 0);
    assert.ok(row.normal >= row.easy);
    assert.ok(row.hard >= row.normal);
  }
  assert.deepEqual(ENCOUNTER_BUDGETS[1], {easy:50,normal:75,hard:100});
  assert.deepEqual(ENCOUNTER_BUDGETS[20], {easy:6400,normal:13200,hard:22000});
});

test('presupuesto total escala por número de personajes', () => {
  assert.equal(encounterBudget(1,4,'normal'),300);
  assert.equal(encounterBudget(5,4,'hard'),4400);
  assert.equal(encounterBudget(20,6,'easy'),38400);
  assert.throws(()=>encounterBudget(0,4,'normal'),RangeError);
  assert.throws(()=>encounterBudget(1,0,'normal'),RangeError);
});

test('XP por VD cubre valores fraccionarios y enteros', () => {
  assert.equal(XP_BY_CR['0'],10);
  assert.equal(XP_BY_CR['1/8'],25);
  assert.equal(XP_BY_CR['1/4'],50);
  assert.equal(XP_BY_CR['1/2'],100);
  assert.equal(XP_BY_CR['1'],200);
  assert.equal(XP_BY_CR['30'],155000);
  assert.equal(Object.keys(XP_BY_CR).length,34);
});

test('el XP explícito del bloque de monstruo prevalece sobre el XP derivado del VD', () => {
  assert.equal(monsterXp({cr:'CR 1 (450 XP)'}),450);
  assert.equal(monsterXp({cr:'CR 2, XP 700'}),700);
  assert.equal(monsterXp({cr:'1/2'}),100);
  assert.equal(monsterXp({cr:'desconocido'}),0);
});

test('extrae VD y ordena correctamente fracciones', () => {
  assert.equal(crValue({cr:'1/2 (100 XP)'}),'1/2');
  assert.equal(numericCr('1/4'),0.25);
  assert.equal(numericCr('2'),2);
  assert.ok(numericCr('1/8') < numericCr('1/4'));
});

test('la compra admite el límite exacto y rechaza excederlo', () => {
  assert.equal(canPurchase(150,50,200),true);
  assert.equal(canPurchase(150,51,200),false);
  assert.equal(canPurchase(200,1,200),false);
  assert.equal(canPurchase(0,10,0),false);
  assert.equal(canPurchase(0,0,100),false);
  assert.equal(canPurchase(-1,10,100),false);
  assert.equal(withinBudget(100,100),true);
  assert.equal(withinBudget(101,100),false);
});

test('el selector aleatorio nunca ofrece monstruos más caros que el saldo', () => {
  const pool=[{name:'barato',xp:25},{name:'medio',xp:100},{name:'caro',xp:500}];
  assert.equal(chooseMonsterForPurchase(pool,99,1,()=>0.99).name,'barato');
  assert.equal(chooseMonsterForPurchase(pool,100,1,()=>0.99).name,'medio');
  assert.equal(chooseMonsterForPurchase(pool,20,3,()=>0),null);
});

test('el selector evita preferir un monstruo demasiado caro si hay alternativas equilibradas', () => {
  const pool=[{name:'A',xp:25},{name:'B',xp:50},{name:'C',xp:900}];
  assert.equal(chooseMonsterForPurchase(pool,1000,4,()=>0.99).name,'B');
});

test('la selección aleatoria puede repetir monstruos y respeta siempre el saldo acumulado', () => {
  const pool=[{name:'A',xp:50},{name:'B',xp:75},{name:'C',xp:100}];
  let seed=0;
  const random=()=>((seed++ * 7 + 3) % 11) / 11;
  let spent=0;
  const chosen=[];
  for(let i=0;i<5;i++) {
    const monster=chooseMonsterForPurchase(pool,250-spent,5-i,random);
    if(!monster) break;
    chosen.push(monster.name);
    spent+=monster.xp;
    assert.ok(spent<=250);
  }
  assert.ok(chosen.length>=3);
  assert.ok(spent<=250);
});

test('transferencia expande cantidades a una criatura por entrada de combate', () => {
  const a={name:'Goblin'}, b={name:'Ogro'};
  const expanded=expandEncounterForCombat([{monster:a,quantity:3},{monster:b,quantity:1}]);
  assert.deepEqual(expanded,[a,a,a,b]);
  assert.equal(expanded.length,4);
  assert.throws(()=>expandEncounterForCombat([{monster:a,quantity:0}]),RangeError);
  assert.throws(()=>expandEncounterForCombat([{monster:a,quantity:1.5}]),RangeError);
});

test('cada encuentro generado contiene entre 3 y 5 criaturas y nunca supera el presupuesto', () => {
  const available=[
    {monster:{name:'Goblin'},xp:50},
    {monster:{name:'Kobold'},xp:50}
  ];
  for (const target of [3,4,5]) {
    const generated=createRandomEncounter(available,250,()=>0.5,target,0);
    assert.ok(generated.encounter);
    assert.ok(generated.encounter.creatures>=3 && generated.encounter.creatures<=5);
    assert.ok(generated.encounter.spent<=250);
    assert.equal(generated.encounter.creatures,target);
    assert.equal(generated.steps.length,target);
  }
});

test('el generador agrupa copias del mismo monstruo sin perder el total de criaturas', () => {
  const available=[{monster:{name:'Goblin'},xp:25}];
  const generated=createRandomEncounter(available,125,()=>0.5,5,0);
  assert.ok(generated.encounter);
  assert.deepEqual(generated.encounter.items,[{monster:{name:'Goblin'},quantity:5}]);
  assert.equal(generated.encounter.creatures,5);
  assert.equal(generated.encounter.spent,125);
});

test('el generador devuelve pasos progresivos con gasto y saldo acumulado coherentes', () => {
  const available=[{monster:{name:'Goblin'},xp:25},{monster:{name:'Kobold'},xp:50}];
  const generated=createRandomEncounter(available,200,()=>0.5,4,0);
  assert.equal(generated.steps.length,4);
  let previous=0;
  for (const step of generated.steps) {
    assert.ok(step.spent>previous);
    assert.ok(step.spent<=200);
    assert.equal(step.creatures,generated.steps.indexOf(step)+1);
    previous=step.spent;
  }
  assert.equal(previous,generated.encounter.spent);
});

test('el generador rechaza presupuestos que no permiten reunir al menos tres monstruos', () => {
  const available=[{monster:{name:'Ogro'},xp:100}];
  const generated=createRandomEncounter(available,200,()=>0.5,4,0);
  assert.equal(generated.encounter,null);
  assert.equal(generated.steps.length,2);
});

test('la firma distingue composiciones diferentes y reconoce duplicados exactos', () => {
  const a={items:[{monster:{name:'Goblin'},quantity:2},{monster:{name:'Kobold'},quantity:1}]};
  const b={items:[{monster:{name:'Kobold'},quantity:1},{monster:{name:'Goblin'},quantity:2}]};
  const c={items:[{monster:{name:'Goblin'},quantity:1},{monster:{name:'Kobold'},quantity:2}]};
  assert.equal(encounterSignature(a.items),encounterSignature(b.items));
  assert.notEqual(encounterSignature(a.items),encounterSignature(c.items));
  assert.equal(areDistinctEncounters([{...a,key:encounterSignature(a.items)},{...c,key:encounterSignature(c.items)}]),true);
  assert.equal(areDistinctEncounters([{...a,key:encounterSignature(a.items)},{...b,key:encounterSignature(b.items)}]),false);
});
