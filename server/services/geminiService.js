const { GoogleGenAI } = require('@google/genai');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const GROQ_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.6-27b';
const PROVIDER_TIMEOUT_MS = 20_000;
const RATE_LIMIT_COOLDOWN_MS = 60_000;
const ERROR_COOLDOWN_MS = 5 * 60_000;

let genAI = null;
let providerCursor = 0;

const providerState = {
  gemini: { successes: 0, failures: 0, cooldownUntil: 0 },
  groq:   { successes: 0, failures: 0, cooldownUntil: 0 }
};
const providerOverrides = { gemini: null, groq: null };

const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) throw new Error('Gemini API key is not configured.');
  if (!genAI) genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return genAI;
};

// ─── Robust JSON extractor ─────────────────────────────────────────
const extractJSON = (text) => {
  if (!text) throw new Error('Empty response from AI provider');
  try { return JSON.parse(text.trim()); } catch {}
  const stripped = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  try { return JSON.parse(stripped); } catch {}
  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  console.error('AI response was not valid JSON:', text.substring(0, 300));
  throw new Error('Could not parse JSON from AI response');
};

const callGemini = async (prompt) => {
  const result = await getGeminiClient().models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      temperature: 0.3,
      topP: 0.8,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json'
    }
  });
  const text = result?.text;
  if (!text) throw new Error('Gemini returned empty text.');
  return text;
};

const parseRetryAfter = (value) => {
  if (!value) return 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : 0;
};

const callGroq = async (prompt) => {
  if (!process.env.GROQ_API_KEY) throw new Error('Groq API key is not configured.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  const body = {
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    top_p: 0.8,
    max_completion_tokens: 1024,
    response_format: { type: 'json_object' }
  };
  if (GROQ_MODEL.startsWith('qwen/')) body.reasoning_effort = 'none';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload?.error?.message || `Groq request failed with status ${response.status}.`);
      error.status = response.status;
      error.retryAfterMs = parseRetryAfter(response.headers.get('retry-after'));
      throw error;
    }

    const text = payload?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Groq returned empty text.');
    return text;
  } finally {
    clearTimeout(timeout);
  }
};

const configuredProviders = () => [
  process.env.GEMINI_API_KEY ? 'gemini' : null,
  process.env.GROQ_API_KEY ? 'groq' : null
].filter(Boolean);

const getErrorStatus = (error) => Number(
  error?.status || error?.statusCode || error?.response?.status || 0
);

const markProviderFailure = (provider, error) => {
  const state = providerState[provider];
  const status = getErrorStatus(error);
  const retryable = [408, 409, 429, 498, 500, 502, 503, 504].includes(status) ||
    /quota|rate.?limit|resource exhausted|overload|temporar|timeout|aborted/i.test(error?.message || '');
  const requestedCooldown = Number(error?.retryAfterMs) || 0;
  const cooldownMs = requestedCooldown || (retryable ? RATE_LIMIT_COOLDOWN_MS : ERROR_COOLDOWN_MS);
  state.failures += 1;
  state.cooldownUntil = Date.now() + cooldownMs;
  console.warn(`AI provider ${provider} failed; cooling down for ${Math.ceil(cooldownMs / 1000)}s:`, error?.message);
};

const callProvider = (provider, prompt) => {
  if (providerOverrides[provider]) return providerOverrides[provider](prompt);
  return provider === 'gemini' ? callGemini(prompt) : callGroq(prompt);
};

// Normal traffic alternates providers. If the chosen provider fails, the
// other provider handles the same request and the failing provider rests.
const callAI = async (prompt) => {
  const providers = configuredProviders();
  if (!providers.length) throw new Error('No AI provider is configured.');

  const start = providerCursor % providers.length;
  providerCursor = (providerCursor + 1) % Number.MAX_SAFE_INTEGER;
  const ordered = [...providers.slice(start), ...providers.slice(0, start)];
  const available = ordered.filter((provider) => providerState[provider].cooldownUntil <= Date.now());
  if (!available.length) throw new Error('AI providers are temporarily cooling down. Please retry shortly.');

  let lastError;
  for (const provider of available) {
    try {
      const text = await callProvider(provider, prompt);
      providerState[provider].successes += 1;
      providerState[provider].cooldownUntil = 0;
      return text;
    } catch (error) {
      lastError = error;
      markProviderFailure(provider, error);
    }
  }

  const error = new Error('AI providers are temporarily unavailable. Please try again shortly.');
  error.cause = lastError;
  throw error;
};

const getProviderStatus = () => {
  const now = Date.now();
  const describe = (provider, configured, model) => ({
    configured,
    model,
    status: !configured ? 'not_configured' : providerState[provider].cooldownUntil > now ? 'cooldown' : 'ready',
    cooldownUntil: providerState[provider].cooldownUntil > now
      ? new Date(providerState[provider].cooldownUntil).toISOString()
      : null,
    successes: providerState[provider].successes,
    failures: providerState[provider].failures
  });

  return {
    strategy: 'round-robin-with-fallback',
    providers: {
      gemini: describe('gemini', Boolean(process.env.GEMINI_API_KEY), GEMINI_MODEL),
      groq: describe('groq', Boolean(process.env.GROQ_API_KEY), GROQ_MODEL)
    }
  };
};

// ─── Format messages for prompts ──────────────────────────────────
const fmt = (messages) =>
  messages
    .filter((m) => m?.type !== 'system' && m?.content?.trim())
    .map((m) => `${m.sender?.username || 'User'}: ${m.content}`)
    .join('\n');

// ══════════════════════════════════════════════════════════════════
// 1. TONE ANALYZER
// Returns: { tone, score, suggestion }
// ══════════════════════════════════════════════════════════════════
const analyzeTone = async (message) => {
  const fallback = { tone: 'neutral', score: 50, suggestion: '' };
  if (!message?.trim()) return fallback;

  const prompt = `Analyze the tone of this message and respond with ONLY a JSON object.

Message: "${message.trim()}"

Rules:
- "aggressive": rude, demanding, dismissive, confrontational
- "neutral": factual, professional, neither warm nor cold
- "friendly": warm, kind, encouraging, polite

Respond ONLY with this exact JSON (no extra text, no markdown):
{"tone":"friendly","score":75,"suggestion":""}

If tone is aggressive or neutral, put a friendlier rewrite in "suggestion".
If tone is friendly, leave "suggestion" as empty string.`;

  const raw    = await callAI(prompt);
  const result = extractJSON(raw);
  return {
    tone:       ['aggressive','neutral','friendly'].includes(result.tone) ? result.tone : 'neutral',
    score:      typeof result.score === 'number' ? Math.min(100, Math.max(0, Math.round(result.score))) : 50,
    suggestion: typeof result.suggestion === 'string' ? result.suggestion : ''
  };
};

// ══════════════════════════════════════════════════════════════════
// 2. SMART REPLIES
// Returns: { replies: [string, string, string] }
// ══════════════════════════════════════════════════════════════════
const getSmartReplies = async (messages) => {
  const fallback = { replies: [] };
  if (!messages?.length) return fallback;

  const convo = fmt(messages.slice(-5));
  if (!convo.trim()) return fallback;

  const prompt = `You are a helpful chat assistant. Read this conversation and suggest 3 short reply options for the last message.

Conversation:
${convo}

Rules:
- Each reply must be under 12 words
- Sound natural, like a real person
- Vary the style: one agreeable, one questioning, one informative

Respond ONLY with this exact JSON (no extra text):
{"replies":["reply one","reply two","reply three"]}`;

  const raw    = await callAI(prompt);
  const result = extractJSON(raw);
  const replies = Array.isArray(result.replies) ? result.replies.filter(Boolean).slice(0, 3) : [];
  return { replies };
};

// ══════════════════════════════════════════════════════════════════
// 3. CATCH ME UP — SUMMARIZER
// Returns: { summary, keyTopics, messageCount }
// ══════════════════════════════════════════════════════════════════
const summarizeRoom = async (messages) => {
  const fallback = { summary: '', keyTopics: [], messageCount: 0 };
  if (!messages?.length) return fallback;

  const textMsgs = messages.filter((m) => m?.type !== 'system' && m?.content?.trim());
  if (textMsgs.length === 0) return fallback;

  const convo = fmt(textMsgs);
  const prompt = `Summarize this chat conversation. Respond ONLY with JSON.

Chat:
${convo}

Instructions:
- Write 3 to 5 bullet points using the bullet character •
- Each bullet is one clear sentence about what was discussed, decided, or asked
- Extract 2-3 short topic labels (2-3 words each)

Respond ONLY with this exact JSON (no markdown, no extra text):
{"summary":"• point one\\n• point two\\n• point three","keyTopics":["Topic One","Topic Two"]}`;

  const raw    = await callAI(prompt);
  const result = extractJSON(raw);
  return {
    summary:      typeof result.summary === 'string' ? result.summary : '',
    keyTopics:    Array.isArray(result.keyTopics)    ? result.keyTopics.slice(0, 3) : [],
    messageCount: textMsgs.length
  };
};

// ══════════════════════════════════════════════════════════════════
// 4. CODE EXPLAINER
// Returns: { explanation }
// ══════════════════════════════════════════════════════════════════
const explainCode = async (code, language = 'javascript') => {
  const fallback = { explanation: '' };
  if (!code?.trim()) return fallback;

  const truncated = code.length > 2000 ? code.slice(0, 2000) + '\n... (truncated)' : code;

  const prompt = `Explain this ${language} code in 2-3 clear sentences for a developer.
Focus on WHAT it does and any important patterns. Be concise.

Code:
\`\`\`${language}
${truncated}
\`\`\`

Respond ONLY with this exact JSON (no markdown):
{"explanation":"Your explanation here."}`;

  const raw    = await callAI(prompt);
  const result = extractJSON(raw);
  return { explanation: result.explanation || '' };
};

// ══════════════════════════════════════════════════════════════════
// 5. MOOD DETECTOR
// Returns: { mood, score }
// ══════════════════════════════════════════════════════════════════
const detectMood = async (messages) => {
  const fallback = { mood: 'neutral', score: 50 };
  if (!messages?.length) return fallback;

  const textMsgs = messages.filter((m) => m?.type !== 'system' && m?.content?.trim());
  if (textMsgs.length < 2) return fallback;

  const convo = fmt(textMsgs.slice(-15));
  if (!convo.trim()) return fallback;

  const prompt = `Analyze the overall emotional mood of this group chat conversation.

${convo}

Mood options:
- "positive": happy, supportive, friendly, productive
- "excited": high energy, enthusiastic, hyped
- "neutral": calm, professional, informational
- "tense": stressed, conflicted, disagreements
- "negative": frustrated, unhappy, complaints

Score is 0-100 for how strongly the mood is felt.

Respond ONLY with this exact JSON:
{"mood":"neutral","score":50}`;

  const raw    = await callAI(prompt);
  const result = extractJSON(raw);
  const valid  = ['positive','negative','neutral','tense','excited'];
  return {
    mood:  valid.includes(result.mood) ? result.mood : 'neutral',
    score: typeof result.score === 'number' ? Math.min(100, Math.max(0, Math.round(result.score))) : 50
  };
};

// ══════════════════════════════════════════════════════════════════
// 6. AUTO-TRANSLATE
// Returns: { translatedText }
// ══════════════════════════════════════════════════════════════════
const translateText = async (text, targetLanguage) => {
  const fallback = { translatedText: text };
  if (!text?.trim() || !targetLanguage?.trim()) return fallback;

  const prompt = `Translate the following text into ${targetLanguage}.
Respond ONLY with a JSON object containing the translated text. Do not include any markdown formatting.

Text: "${text}"

Respond exactly like this:
{"translatedText":"[your translation here]"}
`;

  const raw    = await callAI(prompt);
  const result = extractJSON(raw);
  return { translatedText: result.translatedText || text };
};

module.exports = {
  analyzeTone,
  getSmartReplies,
  summarizeRoom,
  explainCode,
  detectMood,
  translateText,
  getProviderStatus,
  _test: {
    callAI,
    callGroq,
    configuredProviders,
    providerState,
    setProviderOverride(provider, caller) {
      if (!Object.hasOwn(providerOverrides, provider)) throw new Error(`Unknown provider: ${provider}`);
      providerOverrides[provider] = caller;
    },
    reset() {
      providerCursor = 0;
      providerOverrides.gemini = null;
      providerOverrides.groq = null;
      Object.values(providerState).forEach((state) => {
        state.successes = 0;
        state.failures = 0;
        state.cooldownUntil = 0;
      });
    }
  }
};
