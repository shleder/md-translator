# md-translator

A small Node.js CLI that translates **only the human-readable text** of a single
Markdown file into a target language. It never modifies fenced code blocks,
inline code, URLs/link targets, image paths, HTML tags, or the YAML frontmatter —
the markup and document structure stay identical to the original.

It works by parsing Markdown into an AST with [remark](https://github.com/remarkjs/remark),
translating only the text nodes through an LLM, and serializing the tree back.

## Requirements

- Node.js ≥ 18 (uses the built-in `fetch`)

## Install

```sh
npm install
```

## Usage

```sh
md-translator [--dry-run] <input.md> <target-lang> [output.md]
```

- `<target-lang>` — e.g. `es`, `de`, `fr`, `uk`, or `Spanish`.
- If `[output.md]` is omitted, the result is written next to the input as
  `<name>.<lang>.md` (e.g. `test.md` + `es` → `test.es.md`).

### Offline check (no API key)

```sh
node src/cli.js --dry-run test.md es      # → test.es.md (text wrapped in a marker)
```

### Real translation

Configure the provider via environment variables (the key is never hard-coded):

| Variable       | Required | Description                                              |
| -------------- | -------- | -------------------------------------------------------- |
| `LLM_API_KEY`  | yes      | API key.                                                 |
| `LLM_BASE_URL` | yes      | OpenAI-compatible base URL, e.g. `https://api.openai.com/v1`. |
| `LLM_MODEL`    | no       | Model name (defaults to `gpt-4o-mini`).                  |

The request is an OpenAI-compatible `POST {LLM_BASE_URL}/chat/completions`, so any
compatible provider (OpenAI, OpenRouter, a local server, …) works.

The simplest way is a `.env` file — copy the template and fill in your key:

```sh
cp .env.example .env      # then edit .env and set LLM_API_KEY
node src/cli.js test.md es
```

`.env` is loaded automatically (via Node's built-in `process.loadEnvFile`, no
`dotenv` dependency) and is git-ignored. Variables already set in the shell take
precedence over `.env`, so you can still override per-run:

```powershell
$env:LLM_API_KEY="..."; node src/cli.js test.md es
```

## Verify markup preservation

Re-parses both files and compares their ASTs, ignoring only the text values —
everything else (code, links, images, HTML, frontmatter) must match:

```sh
node scripts/verify.js test.md test.es.md
```

## Scope

MVP, intentionally minimal: one input file, one target language per run. No batch
processing, no web UI, no caching/queues/retries, and no dependencies beyond the
remark stack.
