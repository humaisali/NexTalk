import { useState, useEffect, useCallback, useRef } from 'react';
import { getConversations, getDirectMessages } from '../services/api';
import { useSocket } from '../context/SocketContext';

/**
 * useConversations — manages the state of all private conversations.
 *
 * Returns:
 *   conversations      — list of all the user's conversations
 *   loading            — boolean
 *   activeConversation — the currently open conversation
 *   dmMessages         — messages for the active conversation
 *   dmTypingUser       — username typing in the current DM
 *   totalUnread        — total unread DM count (for badge)
 *   openConversation   — fn(conversation) load + join socket room
 *   closeConversation  — fn()
 *   sendDM             — fn({ content }) send a direct message
 *   emitDMTyping       — fn() emit typing indicator
 *   emitDMStopTyping   — fn() stop typing indicator
 *   refetch            — fn() reload conversation list
 */
const useConversations = () => {
  const { socket } = useSocket();

  const [conversations,      setConversations]      = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [activeConversation, setActiveConversation] = useState(null);
  const [dmMessages,         setDmMessages]         = useState([]);
  const [dmTypingUser,       setDmTypingUser]       = useState(null);
  const [totalUnread,        setTotalUnread]        = useState(0);

  const typingTimer       = useRef(null);
  const seenDmIds         = useRef(new Set());

  // ── Fetch all conversations ────────────────────────────────────
  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getConversations();
      setConversations(data.conversations || []);
      // Calculate total unread
      // (server sets unreadCount as a Map, client gets it as plain object)
      const unread = (data.conversations || []).reduce((sum, c) => {
        const counts = c.unreadCount || {};
        const vals   = typeof counts.get === 'function'
          ? Array.from(counts.values())
          : Object.values(counts);
        return sum + vals.reduce((a, b) => a + (b || 0), 0);
      }, 0);
      setTotalUnread(unread);
    } catch (err) {
      console.error('useConversations refetch:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  // ── Socket events for DMs ──────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // Incoming DM — add to messages if it's for active conversation
    socket.on('receive_dm', ({ conversationId, message }) => {
      const msgId = message._id?.toString();
      if (seenDmIds.current.has(msgId)) return;
      seenDmIds.current.add(msgId);

      setDmMessages((prev) =>
        activeConversation?._id?.toString() === conversationId
          ? [...prev, message]
          : prev
      );

      // Update conversation list (move to top, update lastMessage)
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c._id?.toString() === conversationId
            ? { ...c, lastMessage: { content: message.type === 'text' ? message.content : `📎 Attachment: ${message.fileName || 'file'}`, sender: message.sender, type: message.type, createdAt: message.createdAt }, updatedAt: new Date() }
            : c
        );
        // Move updated conversation to top
        const idx = updated.findIndex((c) => c._id?.toString() === conversationId);
        if (idx > 0) { const [item] = updated.splice(idx, 1); updated.unshift(item); }
        return updated;
      });
    });

    // Notification for a DM in a conversation NOT currently open
    socket.on('dm_notification', ({ conversationId, sender, content, type }) => {
      setTotalUnread((n) => n + 1);
      setConversations((prev) =>
        prev.map((c) =>
          c._id?.toString() === conversationId
            ? { ...c, lastMessage: { content: type === 'text' ? content : `📎 ${content || 'file'}`, sender, createdAt: new Date() } }
            : c
        )
      );
    });

    // Message delivered real-time tracking
    socket.on('dm_delivered', ({ conversationId, messageId, userId }) => {
      if (activeConversation?._id?.toString() === conversationId) {
        setDmMessages((prev) =>
          prev.map((msg) => {
            if (msg._id?.toString() === messageId) {
              const deliveredIds = (msg.deliveredTo || []).map(id => id._id?.toString() || id.toString());
              if (!deliveredIds.includes(userId)) {
                return { ...msg, deliveredTo: [...(msg.deliveredTo || []), userId] };
              }
            }
            return msg;
          })
        );
      }
    });

    // Message delivered batch tracking (offline messages catch-up)
    socket.on('dm_delivered_batch', ({ conversationId, messageIds, userId }) => {
      if (activeConversation?._id?.toString() === conversationId) {
        const idSet = new Set(messageIds.map(id => id.toString()));
        setDmMessages((prev) =>
          prev.map((msg) => {
            if (idSet.has(msg._id?.toString())) {
              const deliveredIds = (msg.deliveredTo || []).map(id => id._id?.toString() || id.toString());
              if (!deliveredIds.includes(userId)) {
                return { ...msg, deliveredTo: [...(msg.deliveredTo || []), userId] };
              }
            }
            return msg;
          })
        );
      }
    });

    // Message read real-time tracking
    socket.on('dm_read', ({ conversationId, readerId }) => {
      if (activeConversation?._id?.toString() === conversationId) {
        setDmMessages((prev) =>
          prev.map((msg) => {
            const msgSenderId = msg.sender?._id?.toString() || msg.sender?.toString();
            if (msgSenderId !== readerId && !msg.readBy.some(id => (id._id?.toString() || id.toString()) === readerId)) {
              return { 
                ...msg, 
                readBy: [...msg.readBy, readerId], 
                deliveredTo: msg.deliveredTo?.some(id => (id._id?.toString() || id.toString()) === readerId)
                  ? msg.deliveredTo 
                  : [...(msg.deliveredTo || []), readerId]
              };
            }
            return msg;
          })
        );
      }
    });

    // Typing indicators
    socket.on('dm_user_typing',         ({ username }) => setDmTypingUser(username));
    socket.on('dm_user_stopped_typing', ()             => setDmTypingUser(null));

    // Dynamic profile sync and presence updates
    socket.on('user_presence_update', (update) => {
      const { userId, isOnline, statusType, statusText, bio, avatar, username } = update;
      
      setConversations((prev) =>
        prev.map((c) => {
          const hasParticipant = c.participants.some((p) => (p._id?.toString() || p.toString()) === userId);
          if (!hasParticipant) return c;

          return {
            ...c,
            participants: c.participants.map((p) => {
              if ((p._id?.toString() || p.toString()) === userId) {
                return {
                  ...p,
                  avatar: avatar !== undefined ? avatar : p.avatar,
                  username: username !== undefined ? username : p.username,
                  isOnline: isOnline !== undefined ? isOnline : p.isOnline,
                  statusType: statusType !== undefined ? statusType : p.statusType,
                  statusText: statusText !== undefined ? statusText : p.statusText,
                  bio: bio !== undefined ? bio : p.bio
                };
              }
              return p;
            })
          };
        })
      );

      setActiveConversation((current) => {
        if (!current) return null;
        const hasParticipant = current.participants.some((p) => (p._id?.toString() || p.toString()) === userId);
        if (!hasParticipant) return current;

        return {
          ...current,
          participants: current.participants.map((p) => {
            if ((p._id?.toString() || p.toString()) === userId) {
              return {
                ...p,
                avatar: avatar !== undefined ? avatar : p.avatar,
                username: username !== undefined ? username : p.username,
                isOnline: isOnline !== undefined ? isOnline : p.isOnline,
                statusType: statusType !== undefined ? statusType : p.statusType,
                statusText: statusText !== undefined ? statusText : p.statusText,
                bio: bio !== undefined ? bio : p.bio
              };
            }
            return p;
          })
        };
      });

      setDmMessages((prev) =>
        prev.map((msg) => {
          const msgSenderId = msg.sender?._id?.toString() || msg.sender?.toString();
          if (msgSenderId === userId) {
            return {
              ...msg,
              sender: typeof msg.sender === 'object' ? {
                ...msg.sender,
                avatar: avatar !== undefined ? avatar : msg.sender.avatar,
                username: username !== undefined ? username : msg.sender.username,
                statusType: statusType !== undefined ? statusType : msg.sender.statusType,
                statusText: statusText !== undefined ? statusText : msg.sender.statusText,
                bio: bio !== undefined ? bio : msg.sender.bio
              } : msg.sender
            };
          }
          return msg;
        })
      );
    });

    return () => {
      socket.off('receive_dm');
      socket.off('dm_notification');
      socket.off('dm_delivered');
      socket.off('dm_delivered_batch');
      socket.off('dm_read');
      socket.off('dm_user_typing');
      socket.off('dm_user_stopped_typing');
      socket.off('user_presence_update');
    };
  }, [socket, activeConversation]);

  // ── Open a conversation ────────────────────────────────────────
  const openConversation = useCallback(async (conversation) => {
    // Leave old DM socket room
    if (activeConversation) {
      socket?.emit('leave_dm', { conversationId: activeConversation._id });
    }

    seenDmIds.current.clear();
    setActiveConversation(conversation);
    setDmMessages([]);
    setDmTypingUser(null);

    // Join DM socket room
    socket?.emit('join_dm', { conversationId: conversation._id });

    // Load message history
    try {
      const { data } = await getDirectMessages(conversation._id);
      const msgs = data.messages || [];
      msgs.forEach((m) => seenDmIds.current.add(m._id?.toString()));
      setDmMessages(msgs);

      // Reset unread for this conversation locally
      setConversations((prev) =>
        prev.map((c) =>
          c._id?.toString() === conversation._id?.toString()
            ? { ...c, unreadCount: {} }
            : c
        )
      );
      setTotalUnread((n) => Math.max(0, n - 1)); // approximate reset
    } catch (err) {
      console.error('openConversation history:', err);
    }
  }, [socket, activeConversation]);

  // ── Close conversation ─────────────────────────────────────────
  const closeConversation = useCallback(() => {
    if (activeConversation) {
      socket?.emit('leave_dm', { conversationId: activeConversation._id });
    }
    setActiveConversation(null);
    setDmMessages([]);
    setDmTypingUser(null);
    seenDmIds.current.clear();
  }, [socket, activeConversation]);

  // ── Send DM ────────────────────────────────────────────────────
  const sendDM = useCallback(({ content, type = 'text', fileUrl = '', fileName = '', fileType = '', fileSize = 0 }) => {
    if (!socket || !activeConversation) return;
    if (type === 'text' && !content?.trim()) return;
    socket.emit('send_dm', {
      conversationId: activeConversation._id,
      content:        content ? content.trim() : '',
      type,
      fileUrl,
      fileName,
      fileType,
      fileSize
    });
  }, [socket, activeConversation]);

  // ── Typing indicators ──────────────────────────────────────────
  const emitDMTyping = useCallback(() => {
    if (!socket || !activeConversation) return;
    socket.emit('dm_typing', { conversationId: activeConversation._id });
  }, [socket, activeConversation]);

  const emitDMStopTyping = useCallback(() => {
    if (!socket || !activeConversation) return;
    socket.emit('dm_stop_typing', { conversationId: activeConversation._id });
  }, [socket, activeConversation]);

  return {
    conversations,
    loading,
    activeConversation,
    dmMessages,
    dmTypingUser,
    totalUnread,
    openConversation,
    closeConversation,
    sendDM,
    emitDMTyping,
    emitDMStopTyping,
    refetch
  };
};

export default useConversations;
