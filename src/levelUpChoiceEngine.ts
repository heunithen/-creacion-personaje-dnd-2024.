export type LevelUpChoiceDefinition = {
  id: string;
  class: string;
  subclass?: string;
  level: number | "progression";
  kind: "single" | "multiple";
  label: string;
  description?: string;
  options: string[];
  excludeExisting?: boolean;
  retainExisting?: boolean;
  countFromResource?: string;
  storage?: { section: string; field: string };
};

export function findLevelUpChoice(
  definitions: LevelUpChoiceDefinition[],
  id: string
): LevelUpChoiceDefinition | undefined {
  return definitions.find((definition) => definition.id === id);
}

export function getLevelUpChoiceOptions(
  definition: LevelUpChoiceDefinition | undefined,
  existing: string[] = []
): string[] {
  if (!definition) return [];
  if (!definition.excludeExisting) return [...definition.options];
  const known = new Set(existing.map(normalizeChoice));
  return definition.options.filter((option) => !known.has(normalizeChoice(option)));
}

export function validateSingleLevelUpChoice(
  definition: LevelUpChoiceDefinition | undefined,
  selected: string,
  existing: string[] = []
): boolean {
  if (!definition || !selected) return false;
  const valid = definition.options.some((option) => normalizeChoice(option) === normalizeChoice(selected));
  if (!valid) return false;
  return !definition.excludeExisting || !existing.some((value) => normalizeChoice(value) === normalizeChoice(selected));
}

export function validateMultipleLevelUpChoice(
  definition: LevelUpChoiceDefinition | undefined,
  selected: string[],
  target: number,
  existing: string[] = []
): boolean {
  if (!definition || definition.kind !== "multiple" || selected.length !== target) return false;
  const normalized = selected.map(normalizeChoice);
  if (new Set(normalized).size !== normalized.length) return false;
  if (selected.some((value) => !definition.options.some((option) => normalizeChoice(option) === normalizeChoice(value)))) return false;
  if (definition.retainExisting && existing.some((value) => !normalized.includes(normalizeChoice(value)))) return false;
  return true;
}

function normalizeChoice(value: string): string {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
