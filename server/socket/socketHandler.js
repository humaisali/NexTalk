const jwt          = require('jsonwebtoken');
const User         = require('../models/User');
const Room         = require('../models/Room');
const Message      = require('../models/Message');
const Conversation = require('../models/Conversation');
const DirectMessage = require('../models/DirectMessage');
const gemini       = require('../services/geminiService');

// ─── In-memory presence ────────────────────────────────────────────
const roomUsers    = new Map();   // roomId → Map<userId, userInfo>
const socketToUser = new Map();   // socketId → userId
const userSockets  = new Map();   // userId → socketId  (for DM delivery)
const roomMsgCount = new Map();   // roomId → msg count since last mood update

const MOOD_TRIGGER_EVERY = 8;

// ─── Room presence helpers ─────────────────────────────────────────
const getRoomUserList = (roomId) =>
  roomUsers.has(roomId) ? Array.from(roomUsers.get(roomId).values()) : [];

const addUserToRoom = (roomId, info) => {
  if (!roomUsers.has(roomId)) roomUsers.set(roomId, new Map());
  roomUsers.get(roomId).set(info.userId, info);
};

const removeUserFromRoom = (roomId, userId) => {
  if (roomUsers.has(roomId)) {
    roomUsers.get(roomId).delete(userId);
    if (roomUsers.get(roomId).size === 0) roomUsers.delete(roomId);
  }
};

const getUserActiveRooms = (userId) => {
  const rooms = [];
  roomUsers.forEach((users, roomId) => { if (users.has(userId)) rooms.push(roomId); });
  return rooms;
};

// ─── Auto mood update ──────────────────────────────────────────────
const triggerMoodUpdate = async (io, roomId) => {
  try {
    const recentMessages = await Message.find({ room: roomId })
      .populate('sender', 'username')
      .sort({ createdAt: -1 })
      .limit(20);

    if (recentMessages.length < 3) return;

    const msgs          = recentMessages.reverse().filter((m) => m.type !== 'system');
    const { mood, score } = await gemini.detectMood(msgs);

    await Room.findByIdAndUpdate(roomId, { mood, moodScore: score });
    io.to(roomId).emit('mood_updated', { mood, score, timestamp: new Date().toISOString() });
    console.log(`🎭 Mood [${roomId}]: ${mood} (${score}%)`);
  } catch (err) {
    console.error('triggerMoodUpdate:', err.message);
  }
};

// ─── Socket auth ───────────────────────────────────────────────────
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password');
    if (!user) return next(new Error('User not found'));
    socket.user = user;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
};

// ─── Main handler ──────────────────────────────────────────────────
const socketHandler = (io) => {
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    const user = socket.user;
    console.log(`🔌 ${user.username} connected [${socket.id}]`);

    await User.findByIdAndUpdate(user._id, { isOnline: true });
    socketToUser.set(socket.id, user._id.toString());
    userSockets.set(user._id.toString(), socket.id);   // for DM delivery

    // ── ROOM EVENTS ────────────────────────────────────────────────

    socket.on('join_room', async ({ roomId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return socket.emit('error', { message: 'Room not found.' });

        const current = Array.from(socket.rooms).filter((r) => r !== socket.id);
        for (const r of current) {
          if (!r.startsWith('dm_')) {          // don't leave DM socket rooms
            socket.leave(r);
            removeUserFromRoom(r, user._id.toString());
            socket.to(r).emit('user_left',   { userId: user._id, username: user.username });
            io.to(r).emit('online_users',    { users: getRoomUserList(r) });
          }
        }

        socket.join(roomId);
        addUserToRoom(roomId, { userId: user._id.toString(), username: user.username, avatar: user.avatar, socketId: socket.id });
        await Room.findByIdAndUpdate(roomId, { $addToSet: { members: user._id } });

        socket.to(roomId).emit('user_joined', { userId: user._id, username: user.username, avatar: user.avatar });
        io.to(roomId).emit('online_users',    { users: getRoomUserList(roomId) });
        socket.emit('mood_updated', { mood: room.mood || 'neutral', score: room.moodScore || 50, timestamp: new Date().toISOString() });

        console.log(`👥 ${user.username} → #${room.name}`);
      } catch (err) {
        console.error('join_room:', err);
        socket.emit('error', { message: 'Failed to join room.' });
      }
    });

    socket.on('leave_room', ({ roomId }) => {
      socket.leave(roomId);
      removeUserFromRoom(roomId, user._id.toString());
      socket.to(roomId).emit('user_left',   { userId: user._id, username: user.username });
      io.to(roomId).emit('online_users',    { users: getRoomUserList(roomId) });
    });

    socket.on('send_message', async ({ roomId, content, type = 'text', language = '' }) => {
      try {
        if (!content?.trim()) return;

        const message = await Message.create({ room: roomId, sender: user._id, content: content.trim(), type, language });
        await message.populate('sender', 'username avatar');
        io.to(roomId).emit('receive_message', { message });

        // Auto code explanation
        if (type === 'code' && content.trim().length > 10) {
          setImmediate(async () => {
            try {
              const { explanation } = await gemini.explainCode(content.trim(), language || 'javascript');
              if (explanation) {
                await Message.findByIdAndUpdate(message._id, { codeExplanation: explanation });
                io.to(roomId).emit('code_explained', { messageId: message._id.toString(), explanation });
              }
            } catch (e) { console.error('auto-explain:', e.message); }
          });
        }

        // Auto mood trigger
        const count = (roomMsgCount.get(roomId) || 0) + 1;
        roomMsgCount.set(roomId, count);
        if (count % MOOD_TRIGGER_EVERY === 0) setImmediate(() => triggerMoodUpdate(io, roomId));

      } catch (err) {
        console.error('send_message:', err);
        socket.emit('error', { message: 'Failed to send message.' });
      }
    });

    socket.on('typing',      ({ roomId }) => socket.to(roomId).emit('user_typing',         { username: user.username }));
    socket.on('stop_typing', ({ roomId }) => socket.to(roomId).emit('user_stopped_typing', { username: user.username }));
    socket.on('request_mood_update', ({ roomId }) => setImmediate(() => triggerMoodUpdate(io, roomId)));

    // ── DIRECT MESSAGE EVENTS ──────────────────────────────────────

    /**
     * join_dm — join the socket room for a private conversation.
     * Room key: "dm_<conversationId>"
     * Both participants must join this room to receive real-time DMs.
     */
    socket.on('join_dm', async ({ conversationId }) => {
      try {
        // Verify the user is a participant
        const conversation = await Conversation.findOne({
          _id:          conversationId,
          participants: user._id
        });
        if (!conversation) return socket.emit('error', { message: 'DM conversation not found.' });

        const roomKey = `dm_${conversationId}`;
        socket.join(roomKey);
        console.log(`💬 ${user.username} joined DM room [${conversationId}]`);
      } catch (err) {
        console.error('join_dm:', err);
        socket.emit('error', { message: 'Failed to join DM.' });
      }
    });

    /**
     * leave_dm — leave the socket room for a private conversation.
     */
    socket.on('leave_dm', ({ conversationId }) => {
      socket.leave(`dm_${conversationId}`);
    });

    /**
     * send_dm — send a direct message to another user.
     * Saves to DB, updates conversation lastMessage + unread,
     * then delivers to both users via the dm_ socket room.
     */
    socket.on('send_dm', async ({ conversationId, content, type = 'text', language = '' }) => {
      try {
        if (!content?.trim()) return;

        // Security: verify sender is a participant
        const conversation = await Conversation.findOne({
          _id:          conversationId,
          participants: user._id
        });
        if (!conversation) return socket.emit('error', { message: 'Not a participant.' });

        // Save message
        const dm = await DirectMessage.create({
          conversation: conversationId,
          sender:       user._id,
          content:      content.trim(),
          type,
          language
        });
        await dm.populate('sender', 'username avatar');

        // Update conversation snapshot + unread count for the OTHER user
        const otherId = conversation.participants
          .find((p) => p.toString() !== user._id.toString())
          ?.toString();

        const currentUnread = conversation.unreadCount.get(otherId) || 0;
        conversation.lastMessage = {
          content:   content.trim(),
          sender:    user._id,
          type,
          createdAt: dm.createdAt
        };
        conversation.unreadCount.set(otherId, currentUnread + 1);
        conversation.updatedAt = new Date();
        await conversation.save();

        // Populate and broadcast to dm_ room (both users if both online)
        const dmRoom = `dm_${conversationId}`;
        io.to(dmRoom).emit('receive_dm', { conversationId, message: dm });

        // If the other user is online but NOT in the dm_ room,
        // deliver a notification to their personal socket
        const otherSocketId = userSockets.get(otherId);
        if (otherSocketId) {
          const otherSocket = io.sockets.sockets.get(otherSocketId);
          if (otherSocket && !otherSocket.rooms.has(dmRoom)) {
            otherSocket.emit('dm_notification', {
              conversationId,
              sender:  { _id: user._id, username: user.username, avatar: user.avatar },
              content: content.trim(),
              type
            });
          }
        }

        console.log(`📨 DM [${conversationId}] ${user.username}: "${content.substring(0, 50)}"`);
      } catch (err) {
        console.error('send_dm:', err);
        socket.emit('error', { message: 'Failed to send message.' });
      }
    });

    /**
     * dm_typing / dm_stop_typing — typing indicators for DM
     */
    socket.on('dm_typing',      ({ conversationId }) => {
      socket.to(`dm_${conversationId}`).emit('dm_user_typing',         { username: user.username, conversationId });
    });
    socket.on('dm_stop_typing', ({ conversationId }) => {
      socket.to(`dm_${conversationId}`).emit('dm_user_stopped_typing', { username: user.username, conversationId });
    });

    // ── DISCONNECT ─────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`❌ ${user.username} disconnected`);

      const activeRooms = getUserActiveRooms(user._id.toString());
      for (const roomId of activeRooms) {
        removeUserFromRoom(roomId, user._id.toString());
        io.to(roomId).emit('user_left',    { userId: user._id, username: user.username });
        io.to(roomId).emit('online_users', { users: getRoomUserList(roomId) });
      }

      socketToUser.delete(socket.id);
      userSockets.delete(user._id.toString());

      await User.findByIdAndUpdate(user._id, { isOnline: false, lastSeen: new Date() });
    });
  });
};

module.exports = socketHandler;
