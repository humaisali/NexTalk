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
            ? { ...c, lastMessage: { content: message.content, sender: message.sender, type: message.type, createdAt: message.createdAt }, updatedAt: new Date() }
            : c
        );
        // Move updated conversation to top
        const idx = updated.findIndex((c) => c._id?.toString() === conversationId);
        if (idx > 0) { const [item] = updated.splice(idx, 1); updated.unshift(item); }
        return updated;
      });
    });

    // Notification for a DM in a conversation NOT currently open
    socket.on('dm_notification', ({ conversationId, sender, content }) => {
      setTotalUnread((n) => n + 1);
      setConversations((prev) =>
        prev.map((c) =>
          c._id?.toString() === conversationId
            ? { ...c, lastMessage: { content, sender, createdAt: new Date() } }
            : c
        )
      );
    });

    // Typing indicators
    socket.on('dm_user_typing',         ({ username }) => setDmTypingUser(username));
    socket.on('dm_user_stopped_typing', ()             => setDmTypingUser(null));

    return () => {
      socket.off('receive_dm');
      socket.off('dm_notification');
      socket.off('dm_user_typing');
      socket.off('dm_user_stopped_typing');
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
  const sendDM = useCallback(({ content }) => {
    if (!socket || !activeConversation || !content?.trim()) return;
    socket.emit('send_dm', {
      conversationId: activeConversation._id,
      content:        content.trim(),
      type:           'text'
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
