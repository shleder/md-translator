// Recursively collects every `text` node from an mdast tree.
//
// Why this is enough to protect markup: in mdast, `code` (block), `inlineCode`,
// `html` and `yaml` (frontmatter) are SEPARATE node types, not `text`. A link's
// URL/target and an image's path live in the `url`/`src` fields of `link`/`image`
// nodes, not in child `text` nodes. So by translating only `text` nodes we
// automatically leave code, link targets, images, HTML and frontmatter untouched.
// A link's visible label is a `text` node inside `link`, so it does get translated
// (per the agreed decision).
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
