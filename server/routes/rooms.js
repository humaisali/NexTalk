const express  = require('express');
const router   = express.Router();
const Room     = require('../models/Room');
const Message  = require('../models/Message');
const authMiddleware = require('../middleware/auth');
const { generateInviteCode, buildInviteUrl } = require('../utils/inviteUtils');

router.use(authMiddleware);

// ─── Helper: is user a member? ────────────────────────────────────
const isMember = (room, userId) =>
  room.members.some((m) => m.toString() === userId.toString());

const isAdmin = (room, userId) =>
  room.admins.some((a) => a.toString() === userId.toString()) ||
  room.createdBy.toString() === userId.toString();

// ─────────────────────────────────────────────
// GET /api/rooms
// Returns only rooms the user is a member of
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user._id })
      .populate('createdBy', 'username avatar')
      .sort({ createdAt: -1 });
    res.status(200).json({ rooms });
  } catch (err) {
    console.error('GET /rooms:', err);
    res.status(500).json({ message: 'Failed to fetch rooms.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/rooms
// Create a new room — creator auto-joins + becomes admin
// Body: { name, description?, isPrivate? }
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, description = '', isPrivate = true } = req.body;
    if (!name || name.trim().length < 2)
      return res.status(400).json({ message: 'Room name must be at least 2 characters.' });

    const existing = await Room.findOne({ name: name.trim() });
    if (existing) return res.status(409).json({ message: 'A room with that name already exists.' });

    const room = await Room.create({
      name:        name.trim(),
      description: description.trim(),
      createdBy:   req.user._id,
      members:     [req.user._id],
      admins:      [req.user._id],
      isPrivate:   isPrivate !== false
    });

    await room.populate('createdBy', 'username avatar');

    const inviteUrl = buildInviteUrl(room.inviteCode);
    res.status(201).json({ message: 'Room created!', room, inviteUrl });
  } catch (err) {
    console.error('POST /rooms:', err);
    res.status(500).json({ message: 'Failed to create room.' });
  }
});

// ─────────────────────────────────────────────
// GET /api/rooms/join/:inviteCode
// Preview a room before joining (no membership required)
// ─────────────────────────────────────────────
router.get('/join/:inviteCode', async (req, res) => {
  try {
    const room = await Room.findOne({ inviteCode: req.params.inviteCode })
      .populate('createdBy', 'username avatar')
      .select('name description createdBy members inviteCode isPrivate createdAt');

    if (!room) return res.status(404).json({ message: 'Invite link not found or has expired.' });

    const alreadyMember = isMember(room, req.user._id);
    res.status(200).json({
      room,
      memberCount:   room.members.length,
      alreadyMember,
      inviteUrl:     buildInviteUrl(room.inviteCode)
    });
  } catch (err) {
    console.error('GET /rooms/join/:code:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/rooms/join/:inviteCode
// Join a room via invite code
// ─────────────────────────────────────────────
router.post('/join/:inviteCode', async (req, res) => {
  try {
    const room = await Room.findOne({ inviteCode: req.params.inviteCode });
    if (!room) return res.status(404).json({ message: 'Invite link not found or has expired.' });

    if (isMember(room, req.user._id)) {
      // Already a member — just return the room so frontend can navigate
      await room.populate('createdBy', 'username avatar');
      return res.status(200).json({ message: 'Already a member.', room, alreadyMember: true });
    }

    if (room.members.length >= room.maxMembers) {
      return res.status(403).json({ message: 'This room is full.' });
    }

    room.members.push(req.user._id);
    await room.save();
    await room.populate('createdBy', 'username avatar');

    res.status(200).json({ message: `Joined #${room.name}!`, room, alreadyMember: false });
  } catch (err) {
    console.error('POST /rooms/join/:code:', err);
    res.status(500).json({ message: 'Failed to join room.' });
  }
});

// ─────────────────────────────────────────────
// GET /api/rooms/:id
// Room details + invite URL (members only)
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('createdBy', 'username avatar nexTalkNumber')
      .populate('members',   'username avatar isOnline lastSeen nexTalkNumber')
      .populate('admins',    'username avatar');

    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (!isMember(room, req.user._id))
      return res.status(403).json({ message: 'You are not a member of this room.' });

    res.status(200).json({ room, inviteUrl: buildInviteUrl(room.inviteCode) });
  } catch (err) {
    console.error('GET /rooms/:id:', err);
    res.status(500).json({ message: 'Failed to fetch room.' });
  }
});

// ─────────────────────────────────────────────
// GET /api/rooms/:id/messages
// Returns last 50 messages (members only)
// ─────────────────────────────────────────────
router.get('/:id/messages', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (!isMember(room, req.user._id))
      return res.status(403).json({ message: 'You are not a member of this room.' });

    const messages = await Message.find({ room: req.params.id })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ messages: messages.reverse() });
  } catch (err) {
    console.error('GET /rooms/:id/messages:', err);
    res.status(500).json({ message: 'Failed to fetch messages.' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/rooms/:id   (admin only)
// Update room name, description, isPrivate
// ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (!isAdmin(room, req.user._id))
      return res.status(403).json({ message: 'Only admins can edit room settings.' });

    const { name, description, isPrivate } = req.body;
    if (name) {
      if (name.trim().length < 2)
        return res.status(400).json({ message: 'Room name must be at least 2 characters.' });
      // Check uniqueness (exclude current room)
      const conflict = await Room.findOne({ name: name.trim(), _id: { $ne: room._id } });
      if (conflict) return res.status(409).json({ message: 'Room name already taken.' });
      room.name = name.trim();
    }
    if (description !== undefined) room.description = description.trim();
    if (isPrivate    !== undefined) room.isPrivate = isPrivate;

    await room.save();
    await room.populate('createdBy', 'username avatar');
    res.status(200).json({ message: 'Room updated.', room, inviteUrl: buildInviteUrl(room.inviteCode) });
  } catch (err) {
    console.error('PUT /rooms/:id:', err);
    res.status(500).json({ message: 'Failed to update room.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/rooms/:id/regenerate-invite   (admin only)
// Generate a fresh invite code (invalidates old one)
// ─────────────────────────────────────────────
router.post('/:id/regenerate-invite', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (!isAdmin(room, req.user._id))
      return res.status(403).json({ message: 'Only admins can regenerate the invite link.' });

    room.inviteCode = generateInviteCode();
    await room.save();

    const inviteUrl = buildInviteUrl(room.inviteCode);
    res.status(200).json({ message: 'Invite link regenerated.', inviteCode: room.inviteCode, inviteUrl });
  } catch (err) {
    console.error('POST /rooms/:id/regenerate-invite:', err);
    res.status(500).json({ message: 'Failed to regenerate invite.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/rooms/:id/leave
// Leave a room (creator cannot leave — must delete)
// ─────────────────────────────────────────────
router.post('/:id/leave', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (!isMember(room, req.user._id))
      return res.status(400).json({ message: 'You are not a member of this room.' });
    if (room.createdBy.toString() === req.user._id.toString())
      return res.status(400).json({ message: 'Room creator cannot leave. Delete the room instead.' });

    room.members = room.members.filter((m) => m.toString() !== req.user._id.toString());
    room.admins  = room.admins.filter((a)  => a.toString() !== req.user._id.toString());
    await room.save();

    res.status(200).json({ message: 'Left the room.' });
  } catch (err) {
    console.error('POST /rooms/:id/leave:', err);
    res.status(500).json({ message: 'Failed to leave room.' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/rooms/:id/members/:userId   (admin only)
// Kick a member from the room
// ─────────────────────────────────────────────
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (!isAdmin(room, req.user._id))
      return res.status(403).json({ message: 'Only admins can remove members.' });
    if (req.params.userId === room.createdBy.toString())
      return res.status(400).json({ message: 'Cannot remove the room creator.' });

    room.members = room.members.filter((m) => m.toString() !== req.params.userId);
    room.admins  = room.admins.filter((a)  => a.toString() !== req.params.userId);
    await room.save();

    res.status(200).json({ message: 'Member removed.' });
  } catch (err) {
    console.error('DELETE /rooms/:id/members/:userId:', err);
    res.status(500).json({ message: 'Failed to remove member.' });
  }
});

module.exports = router;
