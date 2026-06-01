// Translates text segments: an OpenAI-compatible HTTP client on the native
// `fetch` (Node >= 18) plus a deterministic mock for `--dry-run`.
//
// The provider is configured via environment variables — the key is NOT hard-coded:
//   LLM_API_KEY  — key (required in real mode)
//   LLM_BASE_URL — OpenAI-compatible API base, e.g. https://api.openai.com/v1
//   LLM_MODEL    — model name (optional)

const systemPrompt = (lang) =>
  `You are a translation engine. Translate the user's text into ${lang}. ` +
  `Return ONLY the translated text — no quotes, no comments, no explanations. ` +
  `Preserve meaning, tone and punctuation. Do not add or remove content.`;

// Returns an async function translate(text, lang) -> string.
export function createTranslator({ dryRun = false } = {}) {
  if (dryRun) {
    // The mock does not hit the network and does not change markup — it only wraps
    // the text, so structure preservation can be checked without a live key.
    return async (text, lang) => `[${lang}] ${text}`;
  }

  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL;
  const model = process.env.LLM_MODEL || 'gpt-4o-mini';

  if (!apiKey) throw new Error('LLM_API_KEY is not set (use --dry-run to test without a key).');
  if (!baseUrl) throw new Error('LLM_BASE_URL is not set (use --dry-run to test without a key).');

  const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

  return async (text, lang) => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: 'system', content: systemPrompt(lang) },
          { role: 'user', content: text },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`LLM request failed: ${res.status} ${res.statusText} ${detail}`.trim());
    }

    const data = await res.json();
    const out = data?.choices?.[0]?.message?.content;
    if (typeof out !== 'string') {
      throw new Error('Unexpected LLM response: missing choices[0].message.content.');
    }
    return out.trim();
  };
}
