const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/auth');
const gemini   = require('../services/geminiService');
const Message  = require('../models/Message');
const Room     = require('../models/Room');

router.use(authMiddleware);

// ─────────────────────────────────────────────
// GET /api/ai/health
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
    res.status(500).json({ message: err.message });
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
    res.status(500).json({ message: err.message });
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
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/explain-code
// Body: { code, language, messageId? }
// ─────────────────────────────────────────────
router.post('/explain-code', async (req, res) => {
  try {
    const { code, language = 'javascript', messageId } = req.body;
    if (!messageId && !code?.trim()) return res.status(400).json({ message: 'code is required.' });

    let codeToExplain = code?.trim() || '';
    let languageToExplain = language;
    let persistedMessage = null;

    if (messageId) {
      if (!mongoose.isValidObjectId(messageId)) {
        return res.status(400).json({ message: 'Invalid message ID.' });
      }
      persistedMessage = await Message.findById(messageId);
      if (!persistedMessage) return res.status(404).json({ message: 'Message not found.' });

      const isMember = await Room.exists({ _id: persistedMessage.room, members: req.user._id });
      if (!isMember) return res.status(403).json({ message: 'You are not authorized to update this message.' });
      if (persistedMessage.type !== 'code') {
        return res.status(400).json({ message: 'Only code messages can have code explanations.' });
      }

      // Persisted explanations must describe the stored message, not
      // client-supplied content that may differ from it.
      codeToExplain = persistedMessage.content;
      languageToExplain = persistedMessage.language || language;
    }

    const result = await gemini.explainCode(codeToExplain, languageToExplain);

    if (persistedMessage && result.explanation) {
      await Message.findByIdAndUpdate(persistedMessage._id, { codeExplanation: result.explanation })
        .catch((e) => console.warn('Could not persist explanation:', e.message));
    }

    res.status(200).json(result);
  } catch (err) {
    console.error('POST /ai/explain-code:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/mood
// Body: { messages: [], roomId? }
// ─────────────────────────────────────────────
router.post('/mood', async (req, res) => {
  try {
    const { messages, roomId } = req.body;
    if (!roomId && (!Array.isArray(messages) || !messages.length))
      return res.status(400).json({ message: 'messages[] is required.' });

    let messagesToAnalyze = messages;
    if (roomId) {
      if (!mongoose.isValidObjectId(roomId)) {
        return res.status(400).json({ message: 'Invalid room ID.' });
      }
      const room = await Room.findOne({ _id: roomId, members: req.user._id }).select('_id');
      if (!room) return res.status(403).json({ message: 'You are not a member of this room.' });

      messagesToAnalyze = await Message.find({ room: roomId })
        .populate('sender', 'username')
        .sort({ createdAt: -1 })
        .limit(20);
      messagesToAnalyze.reverse();
    }

    const result = await gemini.detectMood(messagesToAnalyze);

    if (roomId) {
      await Room.findByIdAndUpdate(roomId, { mood: result.mood, moodScore: result.score })
        .catch((e) => console.warn('Could not persist mood:', e.message));
      const io = req.app.get('io');
      if (io) io.to(roomId).emit('mood_updated', { mood: result.mood, score: result.score, timestamp: new Date().toISOString() });
    }

    res.status(200).json(result);
  } catch (err) {
    console.error('POST /ai/mood:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/ai/translate
// Body: { text: string, targetLanguage: string }
// ─────────────────────────────────────────────
router.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text?.trim() || !targetLanguage?.trim()) {
      return res.status(400).json({ message: 'text and targetLanguage are required.' });
    }
    
    const result = await gemini.translateText(text.trim(), targetLanguage.trim());
    res.status(200).json(result);
  } catch (err) {
    console.error('POST /ai/translate:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
