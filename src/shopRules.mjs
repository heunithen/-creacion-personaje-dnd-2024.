export const COPPER_PER_COIN = Object.freeze({ PC: 1, PP: 10, PE: 50, PO: 100, PPt: 1000 });

export function currencyToCopper(coins = {}) {
  return Object.entries(COPPER_PER_COIN).reduce((total, [key, value]) => total + Math.max(0, Math.floor(Number(coins[key]) || 0)) * value, 0);
}

export function copperToCurrency(value) {
  let remaining = Math.max(0, Math.round(Number(value) || 0));
  const result = {};
  for (const key of ['PPt', 'PO', 'PE', 'PP', 'PC']) {
    result[key] = Math.floor(remaining / COPPER_PER_COIN[key]);
    remaining %= COPPER_PER_COIN[key];
  }
  return result;
}

export function parsePriceToCopper(raw) {
  const match = String(raw ?? '').trim().replace(/\\s+/g, ' ').match(/^([\\d.,]+)\\s*(ppt|po|pe|pp|pc)$/i);
  if (!match) return null;
  const amount = Number(match[1].replace(/\\./g, '').replace(',', '.'));
  const unit = match[2].toLowerCase();
  const multiplier = { pc: 1, pp: 10, pe: 50, po: 100, ppt: 1000 }[unit];
  return Number.isFinite(amount) ? Math.round(amount * multiplier) : null;
}

export function magicItemPriceCopper(rarity, type = '') {
  const values = { Común: 10000, Infrecuente: 40000, Raro: 400000, 'Muy raro': 4000000, Legendario: 20000000 };
  if (!Object.hasOwn(values, rarity) || rarity === 'Artefacto') return null;
  if (type === 'Pergamino') return null;
  return type === 'Poción' ? Math.round(values[rarity] / 2) : values[rarity];
}

export function parseInventoryLine(line) {
  const clean = String(line ?? '').trim().replace(/^[-•]+\\s*/, '');
  if (!clean) return null;
  const match = clean.match(/\\s*[×x]\\s*(\\d+)$/i);
  const quantity = match ? Math.max(1, Number(match[1]) || 1) : 1;
  const name = (match ? clean.slice(0, match.index) : clean).trim();
  return name ? { name, quantity } : null;
}

export function formatInventoryLine(name, quantity) {
  return quantity > 1 ? name + ' ×' + quantity : name;
}
