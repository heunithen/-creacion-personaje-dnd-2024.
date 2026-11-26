export function currencyToCopper(coins?: Record<string, number>): number;
export function copperToCurrency(value: number): Record<string, number>;
export function parsePriceToCopper(raw: unknown): number | null;
export function magicItemPriceCopper(rarity: string, type?: string): number | null;
export function parseInventoryLine(line: unknown): { name: string; quantity: number } | null;
export function formatInventoryLine(name: string, quantity: number): string;
