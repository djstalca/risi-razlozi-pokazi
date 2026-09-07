import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const termDir = path.resolve('www/terms');
const files = fs.readdirSync(termDir).filter((name) => name.endsWith('.js')).sort();
if (files.length !== 9) throw new Error(`Expected 9 term files, found ${files.length}.`);

const context = vm.createContext({ window: {} });
context.window.window = context.window;
for (const file of files) {
  vm.runInContext(fs.readFileSync(path.join(termDir, file), 'utf8'), context, { filename: file });
}

const terms = context.window.TERMS;
if (!Array.isArray(terms)) throw new Error('TERMS was not created.');
if (terms.length !== 450) throw new Error(`Expected 450 terms, found ${terms.length}.`);

const modes = new Set(['RAZLOŽI', 'NARIŠI', 'POKAŽI']);
const difficulties = new Set([3, 4, 5]);
const seen = new Set();
const buckets = new Map();
const finalWords = new Map();

for (const term of terms) {
  if (!term || typeof term.text !== 'string') throw new Error('Every term must have text.');
  const text = term.text.trim();
  if (text !== term.text || !text) throw new Error(`Invalid whitespace/empty term: ${JSON.stringify(term.text)}`);
  if (!difficulties.has(term.difficulty)) throw new Error(`Invalid difficulty for ${text}.`);
  if (!modes.has(term.mode)) throw new Error(`Invalid mode for ${text}.`);

  const words = text.split(/\s+/u);
  if (words.length < 1 || words.length > 3) throw new Error(`Term must contain 1–3 words: ${text}`);

  const normalized = text.toLocaleLowerCase('sl-SI');
  if (seen.has(normalized)) throw new Error(`Duplicate term: ${text}`);
  seen.add(normalized);

  const bucket = `${term.difficulty}:${term.mode}`;
  buckets.set(bucket, (buckets.get(bucket) || 0) + 1);

  const finalWord = words.at(-1).toLocaleLowerCase('sl-SI');
  const variants = finalWords.get(finalWord) || [];
  variants.push(text);
  finalWords.set(finalWord, variants);
}

for (const difficulty of difficulties) {
  for (const mode of modes) {
    const key = `${difficulty}:${mode}`;
    if (buckets.get(key) !== 50) throw new Error(`${key} must contain exactly 50 terms; found ${buckets.get(key) || 0}.`);
  }
}

const overusedFinalWords = [...finalWords.entries()].filter(([, variants]) => variants.length > 2);
if (overusedFinalWords.length) {
  throw new Error(`Too many near-variants with the same final word: ${JSON.stringify(overusedFinalWords)}`);
}

const index = fs.readFileSync('www/index.html', 'utf8');
for (const file of files) {
  if (!index.includes(`terms/${file}`)) throw new Error(`www/index.html does not load ${file}.`);
}

console.log('Content validation OK: 450 unique Slovenian terms, 50 per difficulty/mode bucket, max 2 shared final words.');
