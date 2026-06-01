import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkFrontmatter from 'remark-frontmatter';

// Опции сериализации подобраны так, чтобы держаться ближе к обычному стилю входа
// и минимизировать нормализацию неизменённой разметки. Блоки кода и YAML-фронтматтер
// remark сохраняет дословно независимо от этих опций.
const STRINGIFY_OPTIONS = {
  bullet: '-',
  emphasis: '_',
  strong: '*',
  fence: '`',
  fences: true,
  rule: '-',
  listItemIndent: 'one',
};

const parser = unified()
  .use(remarkParse)
  .use(remarkFrontmatter, ['yaml']);

const stringifier = unified()
  .use(remarkStringify, STRINGIFY_OPTIONS)
  .use(remarkFrontmatter, ['yaml']);

// Markdown-строка -> mdast. Фронтматтер становится отдельным `yaml`-узлом.
export function parse(text) {
  return parser.parse(text);
}

// mdast -> Markdown-строка.
export function stringify(tree) {
  return stringifier.stringify(tree);
}
