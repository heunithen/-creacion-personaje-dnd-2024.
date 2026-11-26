export const ELF_BONUS_SKILLS: readonly string[];
export function getStandardArrayAssignments(className: string, priorities: Record<string, string[]>, standard: number[]): Record<string, number>;
export function isSpeciesSkillAllowed(species: string, skill: string, allSkills: string[]): boolean;
export function isOriginFeatDistinct(species: string, backgroundFeat: string, extraFeat: string, allowedFeats: string[]): boolean;
export function getAllowedWeaponMasteries(className: string, allWeapons: string[]): string[];
export function isValidUniqueSelection(selected: string[], allowed: string[], expectedCount: number, blocked?: string[]): boolean;
export function selectDistinctChoices(options: string[], blocked?: string[], count?: number): string[] | null;
export function isValidAbilityIncreases(input: {mode: string; choices: string[]; allowed: string[]; baseAbilities: Record<string, number>; abilityNames: string[]; max?: number}): boolean;
