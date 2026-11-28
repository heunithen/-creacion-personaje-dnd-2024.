import fs from 'node:fs/promises';
import path from 'node:path';
import postcss from 'postcss';

const cssRoot = path.resolve('src');
const styleDir = path.join(cssRoot, 'styles');
const files = ['src/app.css', ...(await fs.readdir(styleDir)).filter(name => name.endsWith('.css')).map(name => path.join('src/styles', name))];
const selectorOccurrences = new Map();
const syntaxErrors = [];
const globalSyntax = [];
let importantCount = 0;
let ruleCount = 0;
let mediaCount = 0;
let declarationCount = 0;
let duplicateDeclarations = 0;

for (const file of files) {
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
    const selector = rule.selector.replace(/\\s+/g, ' ').trim();
    const occurrences = selectorOccurrences.get(selector) ?? [];
    occurrences.push({ file, line: rule.source?.start?.line ?? 0 });
    selectorOccurrences.set(selector, occurrences);

    const seen = new Map();
    rule.walkDecls(decl => {
      declarationCount++;
      if (decl.important) importantCount++;
      const key = decl.prop.toLowerCase();
      const previous = seen.get(key);
      if (previous && previous.value !== decl.value) duplicateDeclarations++;
      seen.set(key, { value: decl.value, important: decl.important });
    });
  });
}

const duplicates = [...selectorOccurrences.entries()]
  .filter(([, occurrences]) => new Set(occurrences.map(item => item.file)).size > 1)
  .sort((a, b) => b[1].length - a[1].length);
const repeated = [...selectorOccurrences.entries()]
  .filter(([, occurrences]) => occurrences.length > 1)
  .length;

console.log('CSS CASCADE AUDIT');
console.log(`Files: ${files.length} | Rules: ${ruleCount} | Declarations: ${declarationCount} | Media queries: ${mediaCount}`);
console.log(`!important: ${importantCount} | Repeated selector groups: ${repeated} | Cross-file selector groups: ${duplicates.length} | Conflicting declarations inside a rule: ${duplicateDeclarations}`);
if (duplicates.length) {
  console.log('CROSS-FILE SELECTORS (review; not automatically removable):');
  for (const [selector, occurrences] of duplicates.slice(0, 80)) {
    const locations = occurrences.map(item => `${item.file}:${item.line}`).join(' | ');
    console.log(`- ${selector} -> ${locations}`);
  }
}
if (globalSyntax.length) {
  console.error('Svelte-only :global() syntax found in external CSS:');
  for (const item of globalSyntax) console.error(`- ${item.file}:${item.line} ${item.selector}`);
}
if (syntaxErrors.length) {
  console.error('CSS parse errors:');
  for (const item of syntaxErrors) console.error(`- ${item.file}:${item.line}:${item.column} ${item.message}`);
}
if (globalSyntax.length || syntaxErrors.length) process.exitCode = 1;
