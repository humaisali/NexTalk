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
const userSockets  = new Map();   // userId → Set<socketId> (multi-tab DM delivery)
const roomMsgCount = new Map();   // roomId → msg count since last mood update
const socketRateLimits = new Map();

const MOOD_TRIGGER_EVERY = 8;

// ─── Room presence helpers ─────────────────────────────────────────
const getRoomUserList = (roomId) =>
  roomUsers.has(roomId)
    ? Array.from(roomUsers.get(roomId).values()).map((info) => ({
        userId: info.userId,
        username: info.username,
        avatar: info.avatar
      }))
    : [];

const addUserToRoom = (roomId, info) => {
  if (!roomUsers.has(roomId)) roomUsers.set(roomId, new Map());
  const users = roomUsers.get(roomId);
  const existing = users.get(info.userId);
  if (existing) {
    existing.socketIds.add(info.socketId);
    existing.username = info.username;
    existing.avatar = info.avatar;
  } else {
    users.set(info.userId, { ...info, socketIds: new Set([info.socketId]) });
  }
};

// Returns true only when the user's final socket leaves the room.
const removeUserFromRoom = (roomId, userId, socketId) => {
  if (!roomUsers.has(roomId)) return false;
  const users = roomUsers.get(roomId);
  const info = users.get(userId);
  if (!info) return false;
  info.socketIds.delete(socketId);
  if (info.socketIds.size > 0) return false;
  users.delete(userId);
  if (users.size === 0) roomUsers.delete(roomId);
  return true;
};

const getUserActiveRooms = (userId) => {
  const rooms = [];
  roomUsers.forEach((users, roomId) => { if (users.has(userId)) rooms.push(roomId); });
  return rooms;
};

const addUserSocket = (userId, socketId) => {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId).add(socketId);
};

// Returns the number of sockets still connected for this user.
const removeUserSocket = (userId, socketId) => {
  const sockets = userSockets.get(userId);
  if (!sockets) return 0;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    userSockets.delete(userId);
    return 0;
  }
  return sockets.size;
};

const getUserSocketIds = (userId) => Array.from(userSockets.get(userId) || []);

const isValidAttachmentUrl = (url) => {
  if (typeof url !== 'string' || url.length > 2048) return false;
  return url.startsWith('https://') || url.startsWith('/uploads/');
};

const withinSocketRateLimit = (userId, eventName, max, windowMs) => {
  const key = `${userId}:${eventName}`;
  const now = Date.now();
  const current = socketRateLimits.get(key);
  if (!current || now - current.startedAt >= windowMs) {
    socketRateLimits.set(key, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= max) return false;
  current.count += 1;
  return true;
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
    const user    = await User.findById(decoded.id).select('-password +tokenVersion');
    if (!user) return next(new Error('User not found'));
    if (Number(decoded.tokenVersion ?? 0) !== Number(user.tokenVersion || 0)) {
      return next(new Error('Session revoked'));
    }
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

    // Do not delay event-listener registration on a database round trip;
    // reconnecting clients may emit their room joins immediately.
    User.findByIdAndUpdate(user._id, { isOnline: true }, { new: true })
      .then((updatedUser) => {
        if (!updatedUser) return;
        io.emit('user_presence_update', {
          userId: updatedUser._id.toString(),
          username: updatedUser.username,
          avatar: updatedUser.avatar,
          isOnline: true,
          lastSeen: updatedUser.lastSeen,
          statusType: updatedUser.statusType,
          statusText: updatedUser.statusText,
          bio: updatedUser.bio
        });
      })
      .catch((err) => console.error('Presence connect update:', err.message));
    socketToUser.set(socket.id, user._id.toString());
    addUserSocket(user._id.toString(), socket.id);
    socket.join(`user_${user._id.toString()}`);

    // Mark pending direct messages as delivered
    setImmediate(async () => {
      try {
        const unreadDMs = await DirectMessage.find({
          sender: { $ne: user._id },
          deliveredTo: { $ne: user._id }
        }).populate({
          path: 'conversation',
          match: { participants: user._id }
        });

        const pendingDMs = unreadDMs.filter(m => m.conversation);
        if (pendingDMs.length > 0) {
          const dmIds = pendingDMs.map(m => m._id);
          await DirectMessage.updateMany(
            { _id: { $in: dmIds } },
            { $addToSet: { deliveredTo: user._id } }
          );

          // Group by conversation and emit dm_delivered_batch
          const convGroups = {};
          pendingDMs.forEach(m => {
            const cid = m.conversation._id.toString();
            if (!convGroups[cid]) convGroups[cid] = [];
            convGroups[cid].push(m._id);
          });

          for (const cid of Object.keys(convGroups)) {
            io.to(`dm_${cid}`).emit('dm_delivered_batch', {
              conversationId: cid,
              messageIds: convGroups[cid],
              userId: user._id
            });
          }
        }
      } catch (err) {
        console.error('Delivery batch update error:', err);
      }
    });

    // ── ROOM EVENTS ────────────────────────────────────────────────

    socket.on('join_room', async ({ roomId } = {}) => {
      // Verify membership before allowing socket join
      try {
        const room = await Room.findOne({ _id: roomId, members: user._id });
        if (!room) {
          return socket.emit('error', { message: 'You are not a member of this room. Use an invite link to join.' });
        }

        const current = Array.from(socket.rooms).filter((r) => r !== socket.id);
        for (const r of current) {
          if (!r.startsWith('dm_') && !r.startsWith('user_')) {
            socket.leave(r);
            const fullyLeft = removeUserFromRoom(r, user._id.toString(), socket.id);
            if (fullyLeft) socket.to(r).emit('user_left', { userId: user._id, username: user.username });
            io.to(r).emit('online_users',    { users: getRoomUserList(r) });
          }
        }

        socket.join(roomId);
        addUserToRoom(roomId, { userId: user._id.toString(), username: user.username, avatar: user.avatar, socketId: socket.id });

        const roomPresence = roomUsers.get(roomId)?.get(user._id.toString());
        if (roomPresence?.socketIds.size === 1) {
          socket.to(roomId).emit('user_joined', { userId: user._id, username: user.username, avatar: user.avatar });
        }
        io.to(roomId).emit('online_users',    { users: getRoomUserList(roomId) });
        socket.emit('mood_updated', { mood: room.mood || 'neutral', score: room.moodScore || 50, timestamp: new Date().toISOString() });

        console.log(`👥 ${user.username} → #${room.name}`);
      } catch (err) {
        console.error('join_room:', err);
        socket.emit('error', { message: 'Failed to join room.' });
      }
    });

    socket.on('leave_room', ({ roomId } = {}) => {
      if (!roomId || !socket.rooms.has(roomId)) return;
      socket.leave(roomId);
      const fullyLeft = removeUserFromRoom(roomId, user._id.toString(), socket.id);
      if (fullyLeft) socket.to(roomId).emit('user_left', { userId: user._id, username: user.username });
      io.to(roomId).emit('online_users',    { users: getRoomUserList(roomId) });
    });

    socket.on('send_message', async ({ roomId, content, type = 'text', language = '', fileUrl = '', fileName = '', fileType = '', fileSize = 0 } = {}) => {
      try {
        if (!withinSocketRateLimit(user._id.toString(), 'send_message', 60, 60_000)) {
          return socket.emit('error', { message: 'Message rate limit reached. Please slow down.' });
        }
        const validTypes = ['text', 'code', 'file', 'voice'];
        if (!validTypes.includes(type)) return socket.emit('error', { message: 'Invalid message type.' });
        if (['text', 'code'].includes(type) && !content?.trim()) return;
        if (content && content.trim().length > 5000) {
          return socket.emit('error', { message: 'Message is too long.' });
        }
        if (['file', 'voice'].includes(type) && !isValidAttachmentUrl(fileUrl)) {
          return socket.emit('error', { message: 'A valid attachment URL is required.' });
        }
        if (!Number.isFinite(Number(fileSize)) || Number(fileSize) < 0 || Number(fileSize) > 10 * 1024 * 1024) {
          return socket.emit('error', { message: 'Invalid attachment size.' });
        }

        // Authorization must be checked on every write, not only join_room.
        const room = await Room.findOne({ _id: roomId, members: user._id });
        if (!room) return socket.emit('error', { message: 'You are not a member of this room.' });

        const isUserAdmin = room.admins.some(a => a.toString() === user._id.toString()) || 
                            room.createdBy.toString() === user._id.toString();

        if (room.settings?.onlyAdminsCanPost && !isUserAdmin) {
          return socket.emit('error', { message: 'Only admins can post messages in this room.' });
        }

        const message = await Message.create({
          room: roomId,
          sender: user._id,
          content: content ? content.trim() : '',
          type,
          language: String(language || '').slice(0, 50),
          fileUrl,
          fileName: String(fileName || '').slice(0, 255),
          fileType: String(fileType || '').slice(0, 150),
          fileSize: Number(fileSize),
          readBy: [user._id]
        });

        await message.populate('sender', 'username avatar bio statusText statusType');
        io.to(roomId).emit('receive_message', { message });

        // Auto code explanation
        if (type === 'code' && content && content.trim().length > 10) {
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
        try {
          require('fs').appendFileSync(require('path').join(__dirname, '../error.log'), `[${new Date().toISOString()}] send_message error: ${err.stack || err}\n`);
        } catch (logErr) {}
        socket.emit('error', { message: 'Failed to send message.' });
      }
    });

    socket.on('typing', ({ roomId } = {}) => {
      if (roomId && socket.rooms.has(roomId)) socket.to(roomId).emit('user_typing', { username: user.username });
    });
    socket.on('stop_typing', ({ roomId } = {}) => {
      if (roomId && socket.rooms.has(roomId)) socket.to(roomId).emit('user_stopped_typing', { username: user.username });
    });
    socket.on('request_mood_update', async ({ roomId } = {}) => {
      if (!withinSocketRateLimit(user._id.toString(), 'request_mood_update', 4, 60_000)) {
        return socket.emit('error', { message: 'Mood update rate limit reached.' });
      }
      const isAuthorized = await Room.exists({ _id: roomId, members: user._id }).catch(() => null);
      if (!isAuthorized) return socket.emit('error', { message: 'You are not a member of this room.' });
      setImmediate(() => triggerMoodUpdate(io, roomId));
    });

    // ── DIRECT MESSAGE EVENTS ──────────────────────────────────────

    /**
     * join_dm — join the socket room for a private conversation.
     * Room key: "dm_<conversationId>"
     * Both participants must join this room to receive real-time DMs.
     */
    socket.on('join_dm', async ({ conversationId } = {}) => {
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

        // Mark all messages as read by current user
        const otherId = conversation.participants
          .find((p) => p.toString() !== user._id.toString())
          ?.toString();

        const result = await DirectMessage.updateMany(
          { conversation: conversationId, sender: otherId, readBy: { $ne: user._id } },
          { $addToSet: { readBy: user._id, deliveredTo: user._id } }
        );

        if (result.modifiedCount > 0 || (conversation.unreadCount.get(user._id.toString()) || 0) > 0) {
          conversation.unreadCount.set(user._id.toString(), 0);
          await conversation.save();

          // Notify the other user (sender) that their messages have been read
          io.to(roomKey).emit('dm_read', {
            conversationId,
            readerId: user._id
          });
        }
      } catch (err) {
        console.error('join_dm:', err);
        socket.emit('error', { message: 'Failed to join DM.' });
      }
    });

    /**
     * leave_dm — leave the socket room for a private conversation.
     */
    socket.on('leave_dm', ({ conversationId } = {}) => {
      socket.leave(`dm_${conversationId}`);
    });

    /**
     * send_dm — send a direct message to another user.
     * Saves to DB, updates conversation lastMessage + unread,
     * then delivers to both users via the dm_ socket room.
     */
    socket.on('send_dm', async ({ conversationId, content, type = 'text', language = '', fileUrl = '', fileName = '', fileType = '', fileSize = 0 } = {}) => {
      try {
        if (!withinSocketRateLimit(user._id.toString(), 'send_dm', 60, 60_000)) {
          return socket.emit('error', { message: 'Message rate limit reached. Please slow down.' });
        }
        const validTypes = ['text', 'code', 'file', 'voice'];
        if (!validTypes.includes(type)) return socket.emit('error', { message: 'Invalid message type.' });
        if (['text', 'code'].includes(type) && !content?.trim()) return;
        if (content && content.trim().length > 5000) {
          return socket.emit('error', { message: 'Message is too long.' });
        }
        if (['file', 'voice'].includes(type) && !isValidAttachmentUrl(fileUrl)) {
          return socket.emit('error', { message: 'A valid attachment URL is required.' });
        }
        if (!Number.isFinite(Number(fileSize)) || Number(fileSize) < 0 || Number(fileSize) > 10 * 1024 * 1024) {
          return socket.emit('error', { message: 'Invalid attachment size.' });
        }

        // Security: verify sender is a participant
        const conversation = await Conversation.findOne({
          _id:          conversationId,
          participants: user._id
        });
        if (!conversation) return socket.emit('error', { message: 'Not a participant.' });

        const otherId = conversation.participants
          .find((p) => p.toString() !== user._id.toString())
          ?.toString();

        const dmRoom = `dm_${conversationId}`;
        const clients = io.sockets.adapter.rooms.get(dmRoom);
        const otherSocketIds = getUserSocketIds(otherId);

        const isRecipientInRoom = Boolean(
          clients && otherSocketIds.some((socketId) => clients.has(socketId))
        );
        const isRecipientOnline = otherSocketIds.length > 0;

        const readBy = [user._id];
        const deliveredTo = [user._id];

        if (isRecipientInRoom) {
          readBy.push(otherId);
          deliveredTo.push(otherId);
        } else if (isRecipientOnline) {
          deliveredTo.push(otherId);
        }

        // Save message
        const dm = await DirectMessage.create({
          conversation: conversationId,
          sender:       user._id,
          content:      content ? content.trim() : '',
          type,
          language:     String(language || '').slice(0, 50),
          fileUrl,
          fileName:     String(fileName || '').slice(0, 255),
          fileType:     String(fileType || '').slice(0, 150),
          fileSize:     Number(fileSize),
          readBy,
          deliveredTo
        });
        await dm.populate('sender', 'username avatar bio statusText statusType');

        // Update conversation snapshot + unread count for the OTHER user
        if (!isRecipientInRoom) {
          const currentUnread = conversation.unreadCount.get(otherId) || 0;
          conversation.unreadCount.set(otherId, currentUnread + 1);
        } else {
          conversation.unreadCount.set(otherId, 0);
        }

        conversation.lastMessage = {
          content:   type === 'text' ? (content ? content.trim() : '') : `📎 Attachment: ${fileName || 'file'}`,
          sender:    user._id,
          type,
          createdAt: dm.createdAt
        };
        conversation.updatedAt = new Date();
        await conversation.save();

        // Populate and broadcast to dm_ room (both users if both online)
        io.to(dmRoom).emit('receive_dm', { conversationId, message: dm });

        // If the other user is online but NOT in the dm_ room,
        // deliver a notification to their personal socket
        if (isRecipientOnline && !isRecipientInRoom) {
          for (const otherSocketId of otherSocketIds) {
            const otherSocket = io.sockets.sockets.get(otherSocketId);
            if (!otherSocket) continue;
            otherSocket.emit('dm_notification', {
              conversationId,
              sender:  { _id: user._id, username: user.username, avatar: user.avatar },
              content: type === 'text' ? (content ? content.trim() : '') : `📎 ${fileName || 'file'}`,
              type
            });
          }
          // Let the sender know it was delivered to at least one active session.
          io.to(dmRoom).emit('dm_delivered', { conversationId, messageId: dm._id, userId: otherId });
        } else if (!isRecipientOnline) {
          // Send push notification since other user is offline
          const { sendPushNotification } = require('../utils/pushHelper');
          setImmediate(async () => {
            await sendPushNotification(
              otherId,
              `New message from ${user.username}`,
              type === 'text' ? (content ? content.trim() : '') : `📎 Attachment: ${fileName || 'file'}`,
              { url: `/chat/dm/${conversationId}`, conversationId }
            );
          });
        }

        console.log(`📨 DM [${conversationId}] ${user.username}: "${type === 'text' ? content.substring(0, 50) : fileName}"`);
      } catch (err) {
        console.error('send_dm:', err);
        try {
          require('fs').appendFileSync(require('path').join(__dirname, '../error.log'), `[${new Date().toISOString()}] send_dm error: ${err.stack || err}\n`);
        } catch (logErr) {}
        socket.emit('error', { message: 'Failed to send message.' });
      }
    });

    /**
     * dm_typing / dm_stop_typing — typing indicators for DM
     */
    socket.on('dm_typing',      ({ conversationId } = {}) => {
      const roomKey = `dm_${conversationId}`;
      if (conversationId && socket.rooms.has(roomKey)) {
        socket.to(roomKey).emit('dm_user_typing', { username: user.username, conversationId });
      }
    });
    socket.on('dm_stop_typing', ({ conversationId } = {}) => {
      const roomKey = `dm_${conversationId}`;
      if (conversationId && socket.rooms.has(roomKey)) {
        socket.to(roomKey).emit('dm_user_stopped_typing', { username: user.username, conversationId });
      }
    });

    // ── DISCONNECT ─────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`❌ ${user.username} disconnected`);

      const activeRooms = getUserActiveRooms(user._id.toString());
      for (const roomId of activeRooms) {
        const fullyLeft = removeUserFromRoom(roomId, user._id.toString(), socket.id);
        if (fullyLeft) io.to(roomId).emit('user_left', { userId: user._id, username: user.username });
        io.to(roomId).emit('online_users', { users: getRoomUserList(roomId) });
      }

      socketToUser.delete(socket.id);
      const remainingSockets = removeUserSocket(user._id.toString(), socket.id);

      if (remainingSockets > 0) return;

      for (const key of socketRateLimits.keys()) {
        if (key.startsWith(`${user._id.toString()}:`)) socketRateLimits.delete(key);
      }

      const disconnectedUser = await User.findByIdAndUpdate(user._id, { isOnline: false, lastSeen: new Date() }, { new: true });
      if (disconnectedUser) {
        io.emit('user_presence_update', {
          userId: disconnectedUser._id.toString(),
          username: disconnectedUser.username,
          avatar: disconnectedUser.avatar,
          isOnline: false,
          lastSeen: disconnectedUser.lastSeen,
          statusType: disconnectedUser.statusType,
          statusText: disconnectedUser.statusText,
          bio: disconnectedUser.bio
        });
      }
    });
  });
};

module.exports = socketHandler;
module.exports._test = {
  roomUsers,
  userSockets,
  socketRateLimits,
  getRoomUserList,
  addUserToRoom,
  removeUserFromRoom,
  addUserSocket,
  removeUserSocket,
  getUserSocketIds,
  withinSocketRateLimit
};
