const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Client ────────────────────────────────────────────────────────
let genAI = null;
const getModel = () => {
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature:     0.3,
      topP:            0.8,
      maxOutputTokens: 1024,
    }
  });
};

// ─── Robust JSON extractor ─────────────────────────────────────────
const extractJSON = (text) => {
  if (!text) throw new Error('Empty response from Gemini');
  try { return JSON.parse(text.trim()); } catch {}
  const stripped = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  try { return JSON.parse(stripped); } catch {}
  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  console.error('Gemini raw (unparseable):', text.substring(0, 300));
  throw new Error('Could not parse JSON from Gemini response');
};

// ─── Retry wrapper ─────────────────────────────────────────────────
const callGemini = async (prompt, retries = 2) => {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const result = await getModel().generateContent(prompt);
      const text   = result?.response?.text?.();
      if (!text) throw new Error('Gemini returned empty text');
      return text;
    } catch (err) {
      lastErr = err;
      console.warn(`Gemini attempt ${i + 1} failed:`, err.message);
      if (i < retries) await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  throw lastErr;
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

  try {
    const raw    = await callGemini(prompt);
    const result = extractJSON(raw);
    return {
      tone:       ['aggressive','neutral','friendly'].includes(result.tone) ? result.tone : 'neutral',
      score:      typeof result.score === 'number' ? Math.min(100, Math.max(0, Math.round(result.score))) : 50,
      suggestion: typeof result.suggestion === 'string' ? result.suggestion : ''
    };
  } catch (err) {
    console.error('analyzeTone error:', err.message);
    return fallback;
  }
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

  try {
    const raw    = await callGemini(prompt);
    const result = extractJSON(raw);
    const replies = Array.isArray(result.replies) ? result.replies.filter(Boolean).slice(0, 3) : [];
    return { replies };
  } catch (err) {
    console.error('getSmartReplies error:', err.message);
    return fallback;
  }
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

  try {
    const raw    = await callGemini(prompt);
    const result = extractJSON(raw);
    return {
      summary:      typeof result.summary === 'string' ? result.summary : '',
      keyTopics:    Array.isArray(result.keyTopics)    ? result.keyTopics.slice(0, 3) : [],
      messageCount: textMsgs.length
    };
  } catch (err) {
    console.error('summarizeRoom error:', err.message);
    return { ...fallback, messageCount: textMsgs.length };
  }
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

  try {
    const raw    = await callGemini(prompt);
    const result = extractJSON(raw);
    return { explanation: result.explanation || '' };
  } catch (err) {
    console.error('explainCode error:', err.message);
    return fallback;
  }
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

  try {
    const raw    = await callGemini(prompt);
    const result = extractJSON(raw);
    const valid  = ['positive','negative','neutral','tense','excited'];
    return {
      mood:  valid.includes(result.mood) ? result.mood : 'neutral',
      score: typeof result.score === 'number' ? Math.min(100, Math.max(0, Math.round(result.score))) : 50
    };
  } catch (err) {
    console.error('detectMood error:', err.message);
    return fallback;
  }
};

module.exports = { analyzeTone, getSmartReplies, summarizeRoom, explainCode, detectMood };
