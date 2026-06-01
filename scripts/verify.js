// Markup-preservation check: everything except text-node values must match
// between two Markdown files. We re-parse both and compare normalized ASTs,
// ignoring only `text` values (human-readable text is allowed to change).
//
// Usage: node scripts/verify.js <original.md> <translated.md>
import { readFile } from 'node:fs/promises';
import { parse } from '../src/markdown.js';

// Markup-significant node fields (code/inlineCode/html/yaml carry `value` — we
// compare it to catch any change to code/frontmatter/HTML).
const KEYS = ['type', 'value', 'lang', 'meta', 'url', 'title', 'alt', 'depth', 'ordered', 'identifier', 'label'];

function normalize(node) {
  if (node.type === 'text') return { type: 'text' }; // ignore the value
  const out = {};
  for (const key of KEYS) {
    if (key in node) out[key] = node[key];
  }
  if (Array.isArray(node.children)) out.children = node.children.map(normalize);
  return out;
}

const [a, b] = process.argv.slice(2);
if (!a || !b) {
  console.error('Usage: node scripts/verify.js <original.md> <translated.md>');
  process.exit(2);
}

const original = normalize(parse(await readFile(a, 'utf8')));
const translated = normalize(parse(await readFile(b, 'utf8')));

if (JSON.stringify(original) === JSON.stringify(translated)) {
  console.log('OK: structure identical — only human-readable text differs.');
} else {
  console.error('MISMATCH: markup/structure changed between the two files.');
  process.exit(1);
}
