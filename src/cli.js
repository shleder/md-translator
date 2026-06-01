#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { parse, stringify } from './markdown.js';
import { translateTree } from './translate.js';
import { createTranslator } from './llm.js';

// Load .env from the current working directory if present. Uses the native Node
// API (no dotenv dependency); variables already set in the environment take
// precedence and are not overwritten. On older Node or with no file, silently skip.
try {
  process.loadEnvFile?.('.env');
} catch {
  // .env is missing or Node does not support it — not an error.
}

const USAGE = `Usage: md-translator [--dry-run] <input.md> <target-lang> [output.md]

Translates only the human-readable text of a Markdown file into <target-lang>.
Code blocks, inline code, URLs, images, HTML and YAML frontmatter are preserved.
If [output.md] is omitted, writes next to the input as <name>.<lang>.md.

Options:
  --dry-run   Use a deterministic mock translator (no API key required).
  -h, --help  Show this help.

Environment (real translation):
  LLM_API_KEY    API key (required)
  LLM_BASE_URL   OpenAI-compatible base URL, e.g. https://api.openai.com/v1 (required)
  LLM_MODEL      Model name (optional)`;

function parseArgs(argv) {
  const positional = [];
  let dryRun = false;
  for (const arg of argv) {
    if (arg === '--dry-run') dryRun = true;
    else if (arg === '-h' || arg === '--help') return { help: true };
    else positional.push(arg);
  }
  const [input, lang, output] = positional;
  return { input, lang, output, dryRun };
}

// test.md + "es" -> test.es.md (next to the input file)
function defaultOutput(input, lang) {
  const ext = extname(input);
  const base = basename(input, ext);
  return join(dirname(input), `${base}.${lang}${ext}`);
}

async function main() {
  const { help, input, lang, output, dryRun } = parseArgs(process.argv.slice(2));

  if (help || !input || !lang) {
    console.log(USAGE);
    process.exit(help ? 0 : 1);
  }

  const source = await readFile(input, 'utf8');
  const tree = parse(source);
  const translate = createTranslator({ dryRun });
  await translateTree(tree, lang, translate);
  const result = stringify(tree);

  const outPath = output || defaultOutput(input, lang);
  await writeFile(outPath, result, 'utf8');
  console.error(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
