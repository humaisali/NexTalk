const express      = require('express');
const router       = express.Router();
const authMiddleware = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const DirectMessage = require('../models/DirectMessage');
const User         = require('../models/User');

router.use(authMiddleware);

// ─────────────────────────────────────────────
// GET /api/conversations
// Returns all conversations for the logged-in user,
// sorted by latest message (most recent first).
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate('participants', 'username avatar nexTalkNumber isOnline lastSeen')
      .populate('lastMessage.sender', 'username')
      .sort({ updatedAt: -1 });

    res.status(200).json({ conversations });
  } catch (err) {
    console.error('GET /conversations:', err);
    res.status(500).json({ message: 'Failed to fetch conversations.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/conversations/start
// Body: { nexTalkNumber }  — the other user's number
// Finds or creates a private conversation.
// ─────────────────────────────────────────────
router.post('/start', async (req, res) => {
  try {
    const { nexTalkNumber } = req.body;
    if (!nexTalkNumber) return res.status(400).json({ message: 'nexTalkNumber is required.' });

    const cleaned = nexTalkNumber.replace(/\s/g, '');

    // Find the target user
    const targetUser = await User.findOne({ nexTalkNumber: cleaned })
      .select('username avatar nexTalkNumber isOnline lastSeen');

    if (!targetUser) {
      return res.status(404).json({ message: 'No NexTalk user found with that number.' });
    }
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't start a conversation with yourself." });
    }

    // Find or create conversation
    const conversation = await Conversation.findOrCreate(req.user._id, targetUser._id);

    res.status(200).json({ conversation });
  } catch (err) {
    console.error('POST /conversations/start:', err);
    res.status(500).json({ message: 'Failed to start conversation.' });
  }
});

// ─────────────────────────────────────────────
// GET /api/conversations/:id/messages
// Returns last 50 messages for a conversation
// ─────────────────────────────────────────────
router.get('/:id/messages', async (req, res) => {
  try {
    // Verify the user is a participant
    const conversation = await Conversation.findOne({
      _id:          req.params.id,
      participants: req.user._id
    });
    if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });

    const messages = await DirectMessage.find({ conversation: req.params.id })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    // Mark all as read by current user
    await DirectMessage.updateMany(
      { conversation: req.params.id, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    // Reset unread count for this user
    conversation.unreadCount.set(req.user._id.toString(), 0);
    await conversation.save();

    res.status(200).json({ messages: messages.reverse() });
  } catch (err) {
    console.error('GET /conversations/:id/messages:', err);
    res.status(500).json({ message: 'Failed to fetch messages.' });
  }
});

// ─────────────────────────────────────────────
// GET /api/conversations/unread-count
// Returns total unread DM count for the user
// ─────────────────────────────────────────────
router.get('/unread-count', async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id });
    const total = conversations.reduce((sum, c) => {
      return sum + (c.unreadCount.get(req.user._id.toString()) || 0);
    }, 0);
    res.status(200).json({ unreadCount: total });
  } catch (err) {
    res.status(500).json({ unreadCount: 0 });
  }
});

module.exports = router;
