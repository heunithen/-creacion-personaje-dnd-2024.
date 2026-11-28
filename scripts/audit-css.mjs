// @ts-nocheck
import fs from 'node:fs/promises';
import path from 'node:path';
import postcss from 'postcss';

const rootDir = path.resolve('src');
const styleDir = path.join(rootDir, 'styles');
const walk = async directory => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : Promise.resolve([target]);
  }));
  return nested.flat();
};
const sourceFiles = (await walk(rootDir)).filter(file => /\.(?:svelte|ts|js|mjs|css)$/.test(file) && !file.includes('.backup-'));
const cssFiles = sourceFiles.filter(file => file.endsWith('.css'));
const importedCss = new Set();
const missingImports = [];
const selectorOccurrences = new Map();
const exactRuleOccurrences = new Map();
const selectorPropertyValues = new Map();
const syntaxErrors = [];
const globalSyntax = [];
let importantCount = 0;
let ruleCount = 0;
let mediaCount = 0;
let declarationCount = 0;
let duplicateDeclarations = 0;

const normalize = value => value.replace(/\s+/g, ' ').trim();
const atRuleContext = rule => {
  const context = [];
  for (let parent = rule.parent; parent; parent = parent.parent) {
    if (parent.type === 'atrule') context.unshift(`@${parent.name} ${normalize(parent.params || '')}`);
  }
  return context.join(' > ') || '(global)';
};

for (const sourceFile of sourceFiles) {
  const source = await fs.readFile(sourceFile, 'utf8');
  const patterns = [
    /\bimport\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+\.css)['"]/g,
    /@import\s+(?:url\()?['"]([^'"]+\.css)['"]/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1];
      if (/^(?:https?:)?\/\//.test(specifier)) continue;
      const resolved = path.resolve(path.dirname(sourceFile), specifier);
      importedCss.add(resolved);
      try {
        await fs.access(resolved);
      } catch {
        missingImports.push({ source: path.relative(process.cwd(), sourceFile), specifier });
      }
    }
  }
}

for (const file of cssFiles) {
  const source = await fs.readFile(file, 'utf8');
  let root;
  try {
    root = postcss.parse(source, { from: file });
  } catch (error) {
    syntaxErrors.push({ file, line: error.line, column: error.column, message: error.reason });
    continue;
  }

  root.walkAtRules('media', () => mediaCount++);
  root.walkRules(rule => {
    ruleCount++;
    if (rule.selector.includes(':global(')) {
      globalSyntax.push({ file, line: rule.source?.start?.line ?? 0, selector: rule.selector });
    }
    const selector = normalize(rule.selector);
    const context = atRuleContext(rule);
    const location = { file: path.relative(process.cwd(), file), line: rule.source?.start?.line ?? 0, context };
    const occurrences = selectorOccurrences.get(selector) ?? [];
    occurrences.push(location);
    selectorOccurrences.set(selector, occurrences);

    const declarationNodes = (rule.nodes || []).filter(node => node.type === 'decl');
    const declarations = declarationNodes.map(decl => {
      declarationCount++;
      if (decl.important) importantCount++;
      return `${decl.prop.toLowerCase()}:${normalize(decl.value)}${decl.important ? '!important' : ''}`;
    });
    const propertyGroupKey = [selector, context].join('|||');
    const propertyGroup = selectorPropertyValues.get(propertyGroupKey) ?? [];
    propertyGroup.push({
      location,
      declarations: declarationNodes.map(decl => ({
        property: decl.prop.toLowerCase(),
        value: normalize(decl.value),
        important: decl.important,
      })),
    });
    selectorPropertyValues.set(propertyGroupKey, propertyGroup);
    const seen = new Map();
    for (const decl of (rule.nodes || []).filter(node => node.type === 'decl')) {
      const key = decl.prop.toLowerCase();
      const previous = seen.get(key);
      if (previous && previous !== decl.value) duplicateDeclarations++;
      seen.set(key, decl.value);
    }
    if (!declarations.length) return;

    // Exact duplicates are diagnostics only. We never delete rules automatically:
    // source order and intervening declarations can make an apparently identical
    // rule meaningful to the final cascade.
    const exactKey = [selector, context, declarations.join(';')].join('|||');
    const exact = exactRuleOccurrences.get(exactKey) ?? [];
    exact.push(location);
    exactRuleOccurrences.set(exactKey, exact);
  });
}

const crossFileSelectors = [...selectorOccurrences.entries()]
  .filter(([, occurrences]) => new Set(occurrences.map(item => item.file)).size > 1)
  .sort((a, b) => b[1].length - a[1].length);
const repeatedSelectors = [...selectorOccurrences.entries()]
  .filter(([, occurrences]) => occurrences.length > 1);
const exactDuplicates = [...exactRuleOccurrences.entries()]
  .filter(([, occurrences]) => occurrences.length > 1)
  .sort((a, b) => b[1].length - a[1].length);
const unreferencedCss = cssFiles.filter(file => !importedCss.has(file));
const propertyConflicts = [...selectorPropertyValues.entries()]
  .map(([key, rules]) => {
    const values = new Map();
    for (const rule of rules) {
      for (const declaration of rule.declarations) {
        const set = values.get(declaration.property) ?? new Set();
        set.add(`${declaration.value}${declaration.important ? '!important' : ''}`);
        values.set(declaration.property, set);
      }
    }
    const conflicts = [...values.entries()].filter(([, entries]) => entries.size > 1);
    return { key, rules, conflicts };
  })
  .filter(group => group.conflicts.length > 0)
  .sort((a, b) => b.conflicts.length - a.conflicts.length);

console.log('CSS CASCADE AUDIT');
console.log(`Files: ${cssFiles.length} | Rules: ${ruleCount} | Declarations: ${declarationCount} | Media queries: ${mediaCount}`);
console.log(`!important: ${importantCount} | Repeated selector groups: ${repeatedSelectors.length} | Cross-file selector groups: ${crossFileSelectors.length} | Exact repeated rule groups: ${exactDuplicates.length} | Selector/property conflict groups: ${propertyConflicts.length} | Conflicting declarations inside a rule: ${duplicateDeclarations}`);
console.log(`Stylesheet imports: ${importedCss.size} | Unreferenced CSS files: ${unreferencedCss.length} | Missing CSS imports: ${missingImports.length}`);

if (exactDuplicates.length) {
  console.log('EXACT REPEATED RULES (diagnostic only; review source order before removal):');
  for (const [key, occurrences] of exactDuplicates.slice(0, 100)) {
    const [selector, context] = key.split('|||');
    console.log(`- ${selector} [${context}] -> ${occurrences.map(item => `${item.file}:${item.line}`).join(' | ')}`);
  }
}
if (crossFileSelectors.length) {
  console.log('CROSS-FILE SELECTORS (may be intentional overrides):');
  for (const [selector, occurrences] of crossFileSelectors.slice(0, 80)) {
    console.log(`- ${selector} -> ${occurrences.map(item => `${item.file}:${item.line} [${item.context}]`).join(' | ')}`);
  }
}
if (propertyConflicts.length) {
  console.log('SAME-SELECTOR PROPERTY CONFLICTS (same media/context; inspect the winning declaration):');
  for (const group of propertyConflicts.slice(0, 70)) {
    const [selector, context] = group.key.split('|||');
    const details = group.conflicts.map(([property, values]) => `${property}={${[...values].join(' | ')}}`).join('; ');
    const locations = group.rules.map(rule => `${rule.location.file}:${rule.location.line}`).join(' | ');
    console.log(`- ${selector} [${context}] ${details} -> ${locations}`);
  }
}
if (unreferencedCss.length) {
  console.log('UNREFERENCED CSS FILES:');
  for (const file of unreferencedCss) console.log(`- ${path.relative(process.cwd(), file)}`);
}
if (missingImports.length) {
  console.error('MISSING CSS IMPORTS:');
  for (const item of missingImports) console.error(`- ${item.source}: ${item.specifier}`);
}
if (globalSyntax.length) {
  console.error('Svelte-only :global() syntax found in external CSS:');
  for (const item of globalSyntax) console.error(`- ${item.file}:${item.line} ${item.selector}`);
}
if (syntaxErrors.length) {
  console.error('CSS parse errors:');
  for (const item of syntaxErrors) console.error(`- ${item.file}:${item.line}:${item.column} ${item.message}`);
}
if (globalSyntax.length || syntaxErrors.length || missingImports.length) process.exitCode = 1;
