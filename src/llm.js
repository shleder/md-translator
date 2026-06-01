// Переводчик текстовых сегментов: OpenAI-совместимый HTTP-клиент на нативном
// `fetch` (Node >= 18) плюс детерминированный мок для `--dry-run`.
//
// Провайдер задаётся через переменные окружения — ключ НЕ хардкодится:
//   LLM_API_KEY  — ключ (обязателен в реальном режиме)
//   LLM_BASE_URL — база OpenAI-совместимого API, напр. https://api.openai.com/v1
//   LLM_MODEL    — имя модели (опционально)

const systemPrompt = (lang) =>
  `You are a translation engine. Translate the user's text into ${lang}. ` +
  `Return ONLY the translated text — no quotes, no comments, no explanations. ` +
  `Preserve meaning, tone and punctuation. Do not add or remove content.`;

// Возвращает async-функцию translate(text, lang) -> string.
export function createTranslator({ dryRun = false } = {}) {
  if (dryRun) {
    // Мок не обращается к сети и не меняет разметку — только оборачивает текст,
    // чтобы можно было проверить сохранность структуры без живого ключа.
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
