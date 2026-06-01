// Рекурсивно собирает все узлы типа `text` из mdast-дерева.
//
// Почему этого достаточно для защиты разметки: в mdast `code` (блок),
// `inlineCode`, `html` и `yaml` (фронтматтер) — это ОТДЕЛЬНЫЕ типы узлов, а не
// `text`. URL/цель ссылки и путь картинки лежат в полях `url`/`src` узлов
// `link`/`image`, а не в дочерних `text`. Поэтому, переводя только `text`-узлы,
// мы автоматически не трогаем код, ссылки-цели, картинки, HTML и фронтматтер.
// Видимый текст ссылки (label) — это `text`-узел внутри `link`, поэтому он
// переводится (по согласованному решению).
export function collectTextNodes(tree) {
  const nodes = [];
  const visit = (node) => {
    if (node.type === 'text') {
      nodes.push(node);
      return;
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) visit(child);
    }
  };
  visit(tree);
  return nodes;
}
