import { collectTextNodes } from './walk.js';

// Splits a value into leading whitespace, a "core", and trailing whitespace.
// We keep the significant edge whitespace of a text node and translate only the
// core, so the LLM cannot swallow spaces that affect rendering.
const WHITESPACE = /^(\s*)([\s\S]*?)(\s*)$/;

// Translates every text node of the tree in place. `translate` is async (text, lang) -> string.
export async function translateTree(tree, lang, translate) {
  const nodes = collectTextNodes(tree);
  for (const node of nodes) {
    const [, lead, core, trail] = WHITESPACE.exec(node.value);
    if (core === '') continue; // skip empty / whitespace-only nodes (no API call)
    const translated = await translate(core, lang);
    node.value = lead + translated + trail;
  }
  return tree;
}
