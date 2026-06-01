// Проверка сохранности разметки: всё, кроме значений text-узлов, должно совпадать
// между двумя Markdown-файлами. Заново парсим оба и сравниваем нормализованные AST,
// игнорируя только значения `text` (человекочитаемый текст вправе меняться).
//
// Usage: node scripts/verify.js <original.md> <translated.md>
import { readFile } from 'node:fs/promises';
import { parse } from '../src/markdown.js';

// Значимые для разметки поля узлов (code/inlineCode/html/yaml несут `value` —
// его сравниваем, чтобы поймать любое изменение кода/фронтматтера/HTML).
const KEYS = ['type', 'value', 'lang', 'meta', 'url', 'title', 'alt', 'depth', 'ordered', 'identifier', 'label'];

function normalize(node) {
  if (node.type === 'text') return { type: 'text' }; // значение игнорируем
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
