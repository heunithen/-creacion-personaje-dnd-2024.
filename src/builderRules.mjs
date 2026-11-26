export const ELF_BONUS_SKILLS = Object.freeze(['Percepción', 'Perspicacia', 'Supervivencia']);

const BARBARIAN_RANGED_WEAPONS = new Set([
  'Arco corto', 'Ballesta ligera', 'Dardo', 'Honda', 'Arco largo',
  'Ballesta de mano', 'Ballesta pesada', 'Cerbatana', 'Mosquete', 'Pistola'
]);
const ROGUE_WEAPON_MASTERY = new Set([
  'Bastón', 'Daga', 'Garrote', 'Garrote grande', 'Hacha de mano', 'Hoz',
  'Jabalina', 'Lanza', 'Martillo ligero', 'Maza', 'Arco corto',
  'Ballesta ligera', 'Dardo', 'Honda', 'Cimitarra', 'Espada corta',
  'Estoque', 'Látigo', 'Ballesta de mano'
]);

export function getStandardArrayAssignments(className, priorities, standard) {
  const priority = priorities[className] || priorities['Guerrero'];
  if (!Array.isArray(priority) || priority.length !== 6 ||
      new Set(priority).size !== 6 || !Array.isArray(standard) || standard.length !== 6) {
    throw new Error('No se puede distribuir el arreglo estándar: faltan características o puntuaciones.');
  }
  return Object.fromEntries(priority.map((ability, index) => [ability, standard[index]]));
}

export function isSpeciesSkillAllowed(species, skill, allSkills) {
  if (species === 'Elfo') return ELF_BONUS_SKILLS.includes(skill);
  if (species === 'Humano') return allSkills.includes(skill);
  return false;
}

export function isOriginFeatDistinct(species, backgroundFeat, extraFeat, allowedFeats) {
  if (species !== 'Humano') return true;
  return allowedFeats.includes(extraFeat) && extraFeat !== backgroundFeat;
}

export function getAllowedWeaponMasteries(className, allWeapons) {
  return allWeapons.filter((weapon) => {
    if (className === 'Bárbaro') return !BARBARIAN_RANGED_WEAPONS.has(weapon);
    if (className === 'Pícaro') return ROGUE_WEAPON_MASTERY.has(weapon);
    return true;
  });
}

export function isValidUniqueSelection(selected, allowed, expectedCount, blocked = []) {
  return Array.isArray(selected) && selected.length === expectedCount &&
    new Set(selected).size === expectedCount &&
    selected.every((choice) => allowed.includes(choice) && !blocked.includes(choice));
}

export function selectDistinctChoices(options, blocked = [], count = 1) {
  if (count === 0) return [];
  const selected = [];
  for (const option of options) {
    if (blocked.includes(option) || selected.includes(option)) continue;
    selected.push(option);
    if (selected.length === count) return selected;
  }
  return count === 0 ? [] : null;
}

export function isValidAbilityIncreases({ mode, choices, allowed, baseAbilities, abilityNames, max = 20 }) {
  const expectedCount = mode === 'two' ? 2 : mode === 'three' ? 3 : 0;
  if (!expectedCount || !Array.isArray(choices) || choices.length !== expectedCount ||
      new Set(choices).size !== expectedCount || !choices.every((choice) => allowed.includes(choice))) return false;

  const adjusted = { ...baseAbilities };
  if (mode === 'two') {
    adjusted[choices[0]] = Number(adjusted[choices[0]]) + 2;
    adjusted[choices[1]] = Number(adjusted[choices[1]]) + 1;
  } else {
    for (const ability of choices) adjusted[ability] = Number(adjusted[ability]) + 1;
  }
  return abilityNames.every((ability) =>
    Number.isFinite(Number(adjusted[ability])) && Number(adjusted[ability]) <= max
  );
}
