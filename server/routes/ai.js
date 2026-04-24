const express = require('express');
const router  = express.Router();
const authMiddleware = require('../middleware/auth');
const gemini  = require('../services/geminiService');
const Message = require('../models/Message');
const Room    = require('../models/Room');

router.use(authMiddleware);

// ─────────────────────────────────────────────
// POST /api/ai/tone
// ─────────────────────────────────────────────
router.post('/tone', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message text is required.' });
    const result = await gemini.analyzeTone(message.trim());
    res.status(200).json(result);
  } catch (err) {
    console.error('POST /ai/tone:', err);
    res.status(500).json({ tone: 'neutral', score: 50, suggestion: '' });
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/replies
// ─────────────────────────────────────────────
router.post('/replies', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ message: 'Messages array is required.' });
    const result = await gemini.getSmartReplies(messages);
    res.status(200).json(result);
  } catch (err) {
    console.error('POST /ai/replies:', err);
    res.status(500).json({ replies: [] });
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/summarize   (Day 5: returns keyTopics + messageCount)
// ─────────────────────────────────────────────
router.post('/summarize', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ message: 'Messages array is required.' });
    const result = await gemini.summarizeRoom(messages);
    res.status(200).json(result);
  } catch (err) {
    console.error('POST /ai/summarize:', err);
    res.status(500).json({ summary: '', keyTopics: [], messageCount: 0 });
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/translate
// ─────────────────────────────────────────────
router.post('/translate', async (req, res) => {
  try {
    const { message, targetLanguage } = req.body;
    if (!message?.trim() || !targetLanguage)
      return res.status(400).json({ message: 'message and targetLanguage required.' });
    const result = await gemini.translateMessage(message.trim(), targetLanguage);
    res.status(200).json(result);
  } catch (err) {
    console.error('POST /ai/translate:', err);
    res.status(500).json({ translated: '' });
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/explain-code  (Day 5: persists to DB)
// Body: { code, language, messageId? }
// ─────────────────────────────────────────────
router.post('/explain-code', async (req, res) => {
  try {
    const { code, language = 'javascript', messageId } = req.body;
    if (!code?.trim()) return res.status(400).json({ message: 'code is required.' });

    const result = await gemini.explainCode(code.trim(), language);

    // Persist explanation to Message document so other users see it too
    if (messageId && result.explanation) {
      await Message.findByIdAndUpdate(messageId, {
        codeExplanation: result.explanation
      }).catch(() => {}); // non-fatal if message not found
    }

    res.status(200).json(result);
  } catch (err) {
    console.error('POST /ai/explain-code:', err);
    res.status(500).json({ explanation: '' });
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/mood  (updates Room doc + broadcasts via socket)
// ─────────────────────────────────────────────
router.post('/mood', async (req, res) => {
  try {
    const { messages, roomId } = req.body;
    if (!Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ message: 'messages array is required.' });

    const result = await gemini.detectMood(messages);

    if (roomId) {
      await Room.findByIdAndUpdate(roomId, { mood: result.mood, moodScore: result.score }).catch(() => {});
      const io = req.app.get('io');
      if (io) io.to(roomId).emit('mood_updated', { mood: result.mood, score: result.score });
    }

    res.status(200).json(result);
  } catch (err) {
    console.error('POST /ai/mood:', err);
    res.status(500).json({ mood: 'neutral', score: 50 });
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/translate-and-save
// Body: { messageId, targetLanguage }
// Caches translation on the Message document
// ─────────────────────────────────────────────
router.post('/translate-and-save', async (req, res) => {
  try {
    const { messageId, targetLanguage } = req.body;
    if (!messageId || !targetLanguage)
      return res.status(400).json({ message: 'messageId and targetLanguage required.' });

    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found.' });

    // Serve from cache if already translated
    const cached = msg.translations?.get?.(targetLanguage);
    if (cached) return res.status(200).json({ translated: cached, cached: true });

    const result = await gemini.translateMessage(msg.content, targetLanguage);
    if (result.translated) {
      msg.translations.set(targetLanguage, result.translated);
      await msg.save();
    }

    res.status(200).json({ translated: result.translated, cached: false });
  } catch (err) {
    console.error('POST /ai/translate-and-save:', err);
    res.status(500).json({ translated: '' });
  }
});

module.exports = router;

// ─────────────────────────────────────────────
// POST /api/ai/batch-translate  (Day 6)
// Translates multiple messages at once.
// Body: { messages: [{ _id, content }], targetLanguage }
// Returns: { translations: { [_id]: translatedText } }
// ─────────────────────────────────────────────
router.post('/batch-translate', async (req, res) => {
  try {
    const { messages, targetLanguage } = req.body;
    if (!Array.isArray(messages) || !targetLanguage) {
      return res.status(400).json({ message: 'messages[] and targetLanguage required.' });
    }
    if (targetLanguage === 'en') return res.status(200).json({ translations: {} });

    // Translate in parallel (max 10 at a time to avoid rate limits)
    const batch = messages.slice(0, 10);
    const results = await Promise.allSettled(
      batch.map((m) => gemini.translateMessage(m.content, targetLanguage))
    );

    const translations = {};
    results.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value.translated) {
        translations[batch[i]._id] = result.value.translated;
      }
    });

    res.status(200).json({ translations });
  } catch (err) {
    console.error('POST /ai/batch-translate:', err);
    res.status(500).json({ translations: {} });
  }
});
