const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Message = require('../models/Message');
const authMiddleware = require('../middleware/auth');

// All room routes are protected
router.use(authMiddleware);

// ─────────────────────────────────────────────
// GET /api/rooms
// Returns all rooms with creator info
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('createdBy', 'username avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ rooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Failed to fetch rooms.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/rooms
// Body: { name, description }
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, description = '' } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Room name must be at least 2 characters.' });
    }

    // Check for duplicate name
    const existing = await Room.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ message: 'A room with that name already exists.' });
    }

    const room = await Room.create({
      name: name.trim(),
      description: description.trim(),
      createdBy: req.user._id,
      members: [req.user._id]
    });

    await room.populate('createdBy', 'username avatar');

    res.status(201).json({ message: 'Room created!', room });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Failed to create room.' });
  }
});

// ─────────────────────────────────────────────
// GET /api/rooms/:id/messages
// Returns last 50 messages for a room (newest last)
// ─────────────────────────────────────────────
router.get('/:id/messages', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    const messages = await Message.find({ room: req.params.id })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })   // newest first
      .limit(50);

    // Reverse so oldest appears at top in UI
    res.status(200).json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to fetch messages.' });
  }
});

// ─────────────────────────────────────────────
// GET /api/rooms/:id
// Returns a single room's details
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('createdBy', 'username avatar')
      .populate('members', 'username avatar isOnline');

    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    res.status(200).json({ room });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Failed to fetch room.' });
  }
});

module.exports = router;
