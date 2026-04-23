const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Lazy client init ─────────────────────────────────────────────
let genAI = null;
const getModel = () => {
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

// ─── Helpers ──────────────────────────────────────────────────────
const parseJSON = (text) => {
  // Strip markdown fences Gemini sometimes wraps output in
  const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  // Find JSON object within the cleaned text
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON object found in response');
  return JSON.parse(jsonMatch[0]);
};

const callGemini = async (prompt, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await getModel().generateContent(prompt);
      return result.response.text();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
};

const formatMessages = (messages) =>
  messages
    .filter((m) => m.type !== 'system' && m.content?.trim())
    .map((m) => `${m.sender?.username || 'User'}: ${m.content}`)
    .join('\n');

// ─────────────────────────────────────────────────────────────────
// 1. TONE ANALYZER
// ─────────────────────────────────────────────────────────────────
const analyzeTone = async (message) => {
  const prompt = `You are a communication coach. Analyze the tone of this message:

"${message}"

Rules:
- "aggressive": rude, harsh, confrontational, demanding, dismissive
- "neutral": factual, matter-of-fact, neither warm nor cold
- "friendly": warm, polite, positive, encouraging, collaborative

If tone is aggressive or neutral, suggest a friendlier rewrite that keeps the original meaning.

Respond ONLY with this JSON (no markdown, no explanation):
{"tone":"aggressive|neutral|friendly","score":0-100,"suggestion":"rewritten version or empty string if friendly"}`;

  try {
    const result = parseJSON(await callGemini(prompt));
    return {
      tone:       ['aggressive', 'neutral', 'friendly'].includes(result.tone) ? result.tone : 'neutral',
      score:      Number.isInteger(result.score) ? Math.min(100, Math.max(0, result.score)) : 50,
      suggestion: typeof result.suggestion === 'string' ? result.suggestion : ''
    };
  } catch (err) {
    console.error('analyzeTone:', err.message);
    return { tone: 'neutral', score: 50, suggestion: '' };
  }
};

// ─────────────────────────────────────────────────────────────────
// 2. SMART REPLIES
// ─────────────────────────────────────────────────────────────────
const getSmartReplies = async (messages) => {
  const convo  = formatMessages(messages.slice(-5));
  const prompt = `You are a chat assistant. Based on this conversation:

${convo}

Suggest exactly 3 short, natural reply options for the last message.
- Each reply should be under 10 words
- Make them varied: one agreeable, one questioning, one adding info
- Sound like a real human, not a bot

Respond ONLY with this JSON:
{"replies":["reply1","reply2","reply3"]}`;

  try {
    const result = parseJSON(await callGemini(prompt));
    return { replies: Array.isArray(result.replies) ? result.replies.slice(0, 3) : [] };
  } catch (err) {
    console.error('getSmartReplies:', err.message);
    return { replies: [] };
  }
};

// ─────────────────────────────────────────────────────────────────
// 3. CATCH ME UP — SUMMARIZER  (Day 5 enhanced)
// ─────────────────────────────────────────────────────────────────
const summarizeRoom = async (messages) => {
  const convo = formatMessages(messages);
  if (!convo.trim()) return { summary: '', keyTopics: [], messageCount: 0 };

  const messageCount = messages.filter((m) => m.type !== 'system').length;

  const prompt = `You are a smart meeting assistant. Summarize this group chat conversation.

Chat messages:
${convo}

Create a clear, useful summary with:
- 3 to 5 bullet points using • symbol
- Focus on: decisions made, questions asked, key info shared, action items
- Each point should be 1 concise sentence
- Use plain language, no jargon

Also extract 3 key topics/themes as short labels (2-3 words each).

Respond ONLY with this JSON (no markdown):
{
  "summary": "• point1\\n• point2\\n• point3",
  "keyTopics": ["topic1", "topic2", "topic3"]
}`;

  try {
    const result = parseJSON(await callGemini(prompt));
    return {
      summary:      typeof result.summary === 'string' ? result.summary : '',
      keyTopics:    Array.isArray(result.keyTopics) ? result.keyTopics.slice(0, 3) : [],
      messageCount
    };
  } catch (err) {
    console.error('summarizeRoom:', err.message);
    return { summary: '', keyTopics: [], messageCount };
  }
};

// ─────────────────────────────────────────────────────────────────
// 4. REAL-TIME TRANSLATION
// ─────────────────────────────────────────────────────────────────
const translateMessage = async (message, targetLanguage) => {
  const prompt = `Translate this chat message to ${targetLanguage}.
Keep the tone, punctuation and casual style of the original.
Only translate — do not explain or add notes.

Message: "${message}"

Respond ONLY with this JSON:
{"translated":"<translation>"}`;

  try {
    const result = parseJSON(await callGemini(prompt));
    return { translated: result.translated || message };
  } catch (err) {
    console.error('translateMessage:', err.message);
    return { translated: message };
  }
};

// ─────────────────────────────────────────────────────────────────
// 5. CODE EXPLAINER  (Day 5 enhanced)
// ─────────────────────────────────────────────────────────────────
const explainCode = async (code, language = 'javascript') => {
  const prompt = `You are a senior ${language} developer explaining code to a teammate in a chat.

Code to explain:
\`\`\`${language}
${code}
\`\`\`

Write a clear explanation:
- 2-3 sentences MAX
- Start with "This code..." or "This function..." 
- Mention what it does, any key patterns used, and anything noteworthy
- Be concise — this shows inline under a chat message

Respond ONLY with this JSON:
{"explanation":"<your explanation here>"}`;

  try {
    const result = parseJSON(await callGemini(prompt));
    return { explanation: result.explanation || '' };
  } catch (err) {
    console.error('explainCode:', err.message);
    return { explanation: '' };
  }
};

// ─────────────────────────────────────────────────────────────────
// 6. MOOD DETECTOR
// ─────────────────────────────────────────────────────────────────
const detectMood = async (messages) => {
  const convo = formatMessages(messages.slice(-20));
  if (!convo.trim()) return { mood: 'neutral', score: 50 };

  const prompt = `Analyze the overall emotional mood of this group chat.

${convo}

Pick the best mood label:
- "positive": happy, supportive, productive, fun
- "excited": high energy, enthusiastic, hyped
- "neutral": calm, professional, factual
- "tense": stressed, conflicted, argumentative
- "negative": frustrated, unhappy, complaints

Score 0-100 for how strongly the mood shows (100 = very intense).

Respond ONLY with this JSON:
{"mood":"positive|excited|neutral|tense|negative","score":0-100}`;

  try {
    const result = parseJSON(await callGemini(prompt));
    const validMoods = ['positive', 'negative', 'neutral', 'tense', 'excited'];
    return {
      mood:  validMoods.includes(result.mood) ? result.mood : 'neutral',
      score: typeof result.score === 'number' ? Math.min(100, Math.max(0, result.score)) : 50
    };
  } catch (err) {
    console.error('detectMood:', err.message);
    return { mood: 'neutral', score: 50 };
  }
};

module.exports = { analyzeTone, getSmartReplies, summarizeRoom, translateMessage, explainCode, detectMood };
