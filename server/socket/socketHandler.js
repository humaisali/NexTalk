const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const Room   = require('../models/Room');
const Message = require('../models/Message');
const gemini = require('../services/geminiService');

// In-memory presence: roomId → Map<userId, userInfo>
const roomUsers    = new Map();
const socketToUser = new Map();
// roomId → message count since last mood update
const roomMsgCount = new Map();

const MOOD_TRIGGER_EVERY = 8; // messages

// ─── Presence helpers ──────────────────────────────────────────
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

// ─── Socket auth ───────────────────────────────────────────────
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

// ─── Auto mood update ──────────────────────────────────────────
// Runs in background — fetches last 20 messages, calls Gemini,
// then broadcasts mood_updated to the room and persists to DB.
const triggerMoodUpdate = async (io, roomId) => {
  try {
    const recentMessages = await Message.find({ room: roomId })
      .populate('sender', 'username')
      .sort({ createdAt: -1 })
      .limit(20);

    if (recentMessages.length < 3) return;

    const msgs = recentMessages.reverse().filter((m) => m.type !== 'system');
    const { mood, score } = await gemini.detectMood(msgs);

    // Persist to room
    await Room.findByIdAndUpdate(roomId, { mood, moodScore: score });

    // Broadcast to everyone in room with timestamp for history tracking
    io.to(roomId).emit('mood_updated', {
      mood,
      score,
      timestamp: new Date().toISOString()
    });

    console.log(`🎭 Mood update [${roomId}]: ${mood} (${score}%)`);
  } catch (err) {
    console.error('triggerMoodUpdate error:', err.message);
  }
};

// ─── Main handler ──────────────────────────────────────────────
const socketHandler = (io) => {
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    const user = socket.user;
    console.log(`🔌 ${user.username} connected [${socket.id}]`);
    await User.findByIdAndUpdate(user._id, { isOnline: true });
    socketToUser.set(socket.id, user._id.toString());

    // ── join_room ──────────────────────────────────────────────
    socket.on('join_room', async ({ roomId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return socket.emit('error', { message: 'Room not found.' });

        const current = Array.from(socket.rooms).filter((r) => r !== socket.id);
        for (const r of current) {
          socket.leave(r);
          removeUserFromRoom(r, user._id.toString());
          socket.to(r).emit('user_left',   { userId: user._id, username: user.username });
          io.to(r).emit('online_users',    { users: getRoomUserList(r) });
        }

        socket.join(roomId);
        addUserToRoom(roomId, {
          userId:   user._id.toString(),
          username: user.username,
          avatar:   user.avatar,
          socketId: socket.id
        });

        await Room.findByIdAndUpdate(roomId, { $addToSet: { members: user._id } });

        socket.to(roomId).emit('user_joined', { userId: user._id, username: user.username, avatar: user.avatar });
        io.to(roomId).emit('online_users',    { users: getRoomUserList(roomId) });

        // Send current room mood to the newly joined user
        socket.emit('mood_updated', {
          mood:      room.mood      || 'neutral',
          score:     room.moodScore || 50,
          timestamp: new Date().toISOString()
        });

        console.log(`👥 ${user.username} → #${room.name}`);
      } catch (err) {
        console.error('join_room error:', err);
        socket.emit('error', { message: 'Failed to join room.' });
      }
    });

    // ── leave_room ─────────────────────────────────────────────
    socket.on('leave_room', ({ roomId }) => {
      socket.leave(roomId);
      removeUserFromRoom(roomId, user._id.toString());
      socket.to(roomId).emit('user_left',   { userId: user._id, username: user.username });
      io.to(roomId).emit('online_users',    { users: getRoomUserList(roomId) });
    });

    // ── send_message ────────────────────────────────────────────
    socket.on('send_message', async ({ roomId, content, type = 'text', language = '' }) => {
      try {
        if (!content?.trim()) return;

        const message = await Message.create({
          room: roomId, sender: user._id,
          content: content.trim(), type, language
        });
        await message.populate('sender', 'username avatar');

        io.to(roomId).emit('receive_message', { message });

        // ── Auto code explanation (background) ──────────────────
        if (type === 'code' && content.trim().length > 10) {
          setImmediate(async () => {
            try {
              const { explanation } = await gemini.explainCode(content.trim(), language || 'javascript');
              if (explanation) {
                await Message.findByIdAndUpdate(message._id, { codeExplanation: explanation });
                io.to(roomId).emit('code_explained', {
                  messageId: message._id.toString(),
                  explanation
                });
              }
            } catch (e) { console.error('Auto-explain error:', e.message); }
          });
        }

        // ── Auto mood update every MOOD_TRIGGER_EVERY messages ──
        const count = (roomMsgCount.get(roomId) || 0) + 1;
        roomMsgCount.set(roomId, count);
        if (count % MOOD_TRIGGER_EVERY === 0) {
          setImmediate(() => triggerMoodUpdate(io, roomId));
        }

        console.log(`💬 [${roomId}] ${user.username} (${type}): "${content.substring(0, 50)}"`);
      } catch (err) {
        console.error('send_message error:', err);
        socket.emit('error', { message: 'Failed to send message.' });
      }
    });

    // ── typing ─────────────────────────────────────────────────
    socket.on('typing',      ({ roomId }) => socket.to(roomId).emit('user_typing',         { username: user.username }));
    socket.on('stop_typing', ({ roomId }) => socket.to(roomId).emit('user_stopped_typing', { username: user.username }));

    // ── manual mood refresh (from client button) ───────────────
    socket.on('request_mood_update', ({ roomId }) => {
      setImmediate(() => triggerMoodUpdate(io, roomId));
    });

    // ── disconnect ─────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`❌ ${user.username} disconnected`);
      const activeRooms = getUserActiveRooms(user._id.toString());
      for (const roomId of activeRooms) {
        removeUserFromRoom(roomId, user._id.toString());
        io.to(roomId).emit('user_left',    { userId: user._id, username: user.username });
        io.to(roomId).emit('online_users', { users: getRoomUserList(roomId) });
      }
      socketToUser.delete(socket.id);
      await User.findByIdAndUpdate(user._id, { isOnline: false, lastSeen: new Date() });
    });
  });
};

module.exports = socketHandler;
