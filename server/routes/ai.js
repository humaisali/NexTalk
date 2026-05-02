const express  = require('express');
const router   = express.Router();
const authMiddleware = require('../middleware/auth');
const gemini   = require('../services/geminiService');
const Message  = require('../models/Message');
const Room     = require('../models/Room');

router.use(authMiddleware);

// ─────────────────────────────────────────────
// GET /api/ai/health
// Quick check that Gemini is responding
// ─────────────────────────────────────────────
router.get('/health', async (req, res) => {
  try {
    const result = await gemini.analyzeTone('Hello, how are you?');
    res.status(200).json({ status: 'ok', result });
  } catch (err) {
    console.error('AI health check failed:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/tone
// Body: { message: string }
// ─────────────────────────────────────────────
router.post('/tone', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'message is required.' });
    const result = await gemini.analyzeTone(message.trim());
    res.status(200).json(result);
  } catch (err) {
    console.error('POST /ai/tone:', err.message);
    res.status(200).json({ tone: 'neutral', score: 50, suggestion: '' }); // graceful fallback
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/replies
// Body: { messages: [{ sender: { username }, content }] }
// ─────────────────────────────────────────────
router.post('/replies', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || !messages.length)
      return res.status(400).json({ message: 'messages[] is required.' });
    const result = await gemini.getSmartReplies(messages);
    res.status(200).json(result);
  } catch (err) {
    console.error('POST /ai/replies:', err.message);
    res.status(200).json({ replies: [] });
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/summarize
// Body: { messages: [] }
// ─────────────────────────────────────────────
router.post('/summarize', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || !messages.length)
      return res.status(400).json({ message: 'messages[] is required.' });
    const result = await gemini.summarizeRoom(messages);
    res.status(200).json(result);
  } catch (err) {
    console.error('POST /ai/summarize:', err.message);
    res.status(200).json({ summary: '', keyTopics: [], messageCount: 0 });
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/translate
// Body: { message, targetLanguage }
// ─────────────────────────────────────────────
router.post('/translate', async (req, res) => {
  try {
    const { message, targetLanguage } = req.body;
    if (!message?.trim() || !targetLanguage)
      return res.status(400).json({ message: 'message and targetLanguage required.' });
    const result = await gemini.translateMessage(message.trim(), targetLanguage);
    res.status(200).json(result);
  } catch (err) {
    console.error('POST /ai/translate:', err.message);
    res.status(200).json({ translated: req.body.message || '' });
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/explain-code
// Body: { code, language, messageId? }
// ─────────────────────────────────────────────
router.post('/explain-code', async (req, res) => {
  try {
    const { code, language = 'javascript', messageId } = req.body;
    if (!code?.trim()) return res.status(400).json({ message: 'code is required.' });

    const result = await gemini.explainCode(code.trim(), language);

    // Persist to DB if messageId provided
    if (messageId && result.explanation) {
      await Message.findByIdAndUpdate(messageId, { codeExplanation: result.explanation })
        .catch((e) => console.warn('Could not persist explanation:', e.message));
    }

    res.status(200).json(result);
  } catch (err) {
    console.error('POST /ai/explain-code:', err.message);
    res.status(200).json({ explanation: '' });
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/mood
// Body: { messages: [], roomId? }
// ─────────────────────────────────────────────
router.post('/mood', async (req, res) => {
  try {
    const { messages, roomId } = req.body;
    if (!Array.isArray(messages) || !messages.length)
      return res.status(400).json({ message: 'messages[] is required.' });

    const result = await gemini.detectMood(messages);

    if (roomId) {
      await Room.findByIdAndUpdate(roomId, { mood: result.mood, moodScore: result.score })
        .catch((e) => console.warn('Could not persist mood:', e.message));
      const io = req.app.get('io');
      if (io) io.to(roomId).emit('mood_updated', { mood: result.mood, score: result.score, timestamp: new Date().toISOString() });
    }

    res.status(200).json(result);
  } catch (err) {
    console.error('POST /ai/mood:', err.message);
    res.status(200).json({ mood: 'neutral', score: 50 });
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/translate-and-save
// Body: { messageId, targetLanguage }
// ─────────────────────────────────────────────
router.post('/translate-and-save', async (req, res) => {
  try {
    const { messageId, targetLanguage } = req.body;
    if (!messageId || !targetLanguage)
      return res.status(400).json({ message: 'messageId and targetLanguage required.' });

    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found.' });

    const cached = msg.translations?.get?.(targetLanguage);
    if (cached) return res.status(200).json({ translated: cached, cached: true });

    const result = await gemini.translateMessage(msg.content, targetLanguage);
    if (result.translated) {
      msg.translations.set(targetLanguage, result.translated);
      await msg.save();
    }

    res.status(200).json({ translated: result.translated, cached: false });
  } catch (err) {
    console.error('POST /ai/translate-and-save:', err.message);
    res.status(200).json({ translated: '' });
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/batch-translate
// Body: { messages: [{ _id, content }], targetLanguage }
// ─────────────────────────────────────────────
router.post('/batch-translate', async (req, res) => {
  try {
    const { messages, targetLanguage } = req.body;
    if (!Array.isArray(messages) || !targetLanguage)
      return res.status(400).json({ message: 'messages[] and targetLanguage required.' });
    if (targetLanguage === 'en') return res.status(200).json({ translations: {} });

    const batch = messages.filter((m) => m._id && m.content).slice(0, 10);
    const results = await Promise.allSettled(
      batch.map((m) => gemini.translateMessage(m.content, targetLanguage))
    );

    const translations = {};
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value?.translated) {
        translations[batch[i]._id] = r.value.translated;
      }
    });

    res.status(200).json({ translations });
  } catch (err) {
    console.error('POST /ai/batch-translate:', err.message);
    res.status(200).json({ translations: {} });
  }
});

module.exports = router;
