import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkFrontmatter from 'remark-frontmatter';

// Serialization options are chosen to stay close to a typical input style and
// minimize normalization of untouched markup. Code blocks and YAML frontmatter
// are preserved verbatim by remark regardless of these options.
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

// Markdown string -> mdast. Frontmatter becomes a separate `yaml` node.
export function parse(text) {
  return parser.parse(text);
}

// mdast -> Markdown string.
export function stringify(tree) {
  return stringifier.stringify(tree);
}
