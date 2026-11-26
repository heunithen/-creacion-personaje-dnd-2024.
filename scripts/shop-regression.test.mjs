import test from 'node:test';
import assert from 'node:assert/strict';
import { currencyToCopper, copperToCurrency, parsePriceToCopper, magicItemPriceCopper, parseInventoryLine, formatInventoryLine } from '../src/shopRules.mjs';

test('monedas D&D se convierten sin perder valor', () => {
  assert.equal(currencyToCopper({ PC: 1, PP: 1, PE: 1, PO: 1, PPt: 1 }), 1161);
  assert.deepEqual(copperToCurrency(1161), { PPt: 1, PO: 1, PE: 1, PP: 1, PC: 1 });
});

test('precios del Manual del Jugador se convierten a cobre', () => {
  assert.equal(parsePriceToCopper('2 pp'), 20);
  assert.equal(parsePriceToCopper('1,5 po'), 150);
  assert.equal(parsePriceToCopper('Variable'), null);
});

test('valores de objetos mágicos siguen la tabla de rareza del DMG', () => {
  assert.equal(magicItemPriceCopper('Común'), 10000);
  assert.equal(magicItemPriceCopper('Raro'), 400000);
  assert.equal(magicItemPriceCopper('Común', 'Poción'), 5000);
  assert.equal(magicItemPriceCopper('Raro', 'Pergamino'), null);
  assert.equal(magicItemPriceCopper('Artefacto'), null);
});

test('inventario reconoce y formatea cantidades', () => {
  assert.deepEqual(parseInventoryLine('Daga ×3'), { name: 'Daga', quantity: 3 });
  assert.deepEqual(parseInventoryLine('• Poción de curación x2'), { name: 'Poción de curación', quantity: 2 });
  assert.equal(formatInventoryLine('Daga', 1), 'Daga');
  assert.equal(formatInventoryLine('Daga', 4), 'Daga ×4');
});
