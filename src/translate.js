import { collectTextNodes } from './walk.js';

// Делит значение на ведущие пробелы, «ядро» и хвостовые пробелы.
// Значимые пробелы по краям текстового узла сохраняем, переводим только ядро —
// так LLM не «съедает» пробелы, влияющие на рендеринг.
const WHITESPACE = /^(\s*)([\s\S]*?)(\s*)$/;

// Переводит на месте все text-узлы дерева. `translate` — async (text, lang) -> string.
export async function translateTree(tree, lang, translate) {
  const nodes = collectTextNodes(tree);
  for (const node of nodes) {
    const [, lead, core, trail] = WHITESPACE.exec(node.value);
    if (core === '') continue; // пустые/пробельные узлы не отправляем в API
    const translated = await translate(core, lang);
    node.value = lead + translated + trail;
  }
  return tree;
}
