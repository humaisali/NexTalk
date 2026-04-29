import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const socketRef                         = useRef(null);
  const seenIds                           = useRef(new Set());     // dedup guard
  const [isConnected,  setIsConnected]    = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [messages,     setMessages]       = useState([]);
  const [onlineUsers,  setOnlineUsers]    = useState([]);
  const [typingUsers,  setTypingUsers]    = useState([]);
  const [activeRoom,   setActiveRoom]     = useState(null);
  const [roomMood,     setRoomMood]       = useState({ mood: 'neutral', score: 50 });
  const [moodHistory,  setMoodHistory]    = useState([]);

  useEffect(() => {
    if (!token) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay:    1500,
      reconnectionDelayMax: 8000,
      timeout:              20000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      setIsConnected(true);
      setIsReconnecting(false);
    });

    socket.on('disconnect', (reason) => {
      console.warn('❌ Socket disconnected:', reason);
      setIsConnected(false);
      if (reason !== 'io client disconnect') setIsReconnecting(true);
    });

    socket.on('reconnect', (attempt) => {
      console.log(`♻️ Reconnected after ${attempt} attempts`);
      setIsConnected(true);
      setIsReconnecting(false);
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
      setIsReconnecting(false);
    });

    socket.on('connect_error', (e) => console.error('Socket connect error:', e.message));

    // ── Message events ───────────────────────────────────────────
    socket.on('receive_message', ({ message }) => {
      // Deduplicate by _id to prevent double-render on reconnect
      if (seenIds.current.has(message._id?.toString())) return;
      seenIds.current.add(message._id?.toString());
      setMessages((prev) => [...prev, message]);
    });

    socket.on('online_users', ({ users }) => setOnlineUsers(users));

    socket.on('user_joined', ({ username }) => {
      const id = `sys-join-${Date.now()}`;
      if (!seenIds.current.has(id)) {
        seenIds.current.add(id);
        setMessages((prev) => [...prev, { _id: id, type: 'system', content: `${username} joined the room`, createdAt: new Date() }]);
      }
    });

    socket.on('user_left', ({ username }) => {
      const id = `sys-left-${Date.now()}`;
      if (!seenIds.current.has(id)) {
        seenIds.current.add(id);
        setMessages((prev) => [...prev, { _id: id, type: 'system', content: `${username} left the room`, createdAt: new Date() }]);
      }
    });

    socket.on('user_typing',         ({ username }) => setTypingUsers((p) => p.includes(username) ? p : [...p, username]));
    socket.on('user_stopped_typing', ({ username }) => setTypingUsers((p) => p.filter((u) => u !== username)));

    socket.on('mood_updated', ({ mood, score, timestamp }) => {
      const entry = { mood, score, timestamp: timestamp || new Date().toISOString() };
      setRoomMood({ mood, score });
      setMoodHistory((prev) => {
        if (prev[0]?.mood === mood && prev[0]?.score === score) return prev;
        return [entry, ...prev].slice(0, 10);
      });
    });

    // Code explanation pushed from server after auto-explain
    socket.on('code_explained', ({ messageId, explanation }) => {
      setMessages((prev) =>
        prev.map((m) => m._id?.toString() === messageId ? { ...m, codeExplanation: explanation } : m)
      );
    });

    socket.on('error', ({ message }) => console.error('Socket error event:', message));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setIsReconnecting(false);
    };
  }, [token]);

  // ── Actions ───────────────────────────────────────────────────────
  const joinRoom = useCallback((room, previousMessages = []) => {
    if (!socketRef.current) return;
    seenIds.current.clear();
    // Pre-seed seen IDs with loaded history to prevent duplication
    previousMessages.forEach((m) => seenIds.current.add(m._id?.toString()));
    setActiveRoom(room);
    setMessages(previousMessages);
    setOnlineUsers([]);
    setTypingUsers([]);
    setMoodHistory([]);
    setRoomMood({ mood: room.mood || 'neutral', score: room.moodScore || 50 });
    socketRef.current.emit('join_room', { roomId: room._id });
  }, []);

  const leaveRoom = useCallback(() => {
    if (!socketRef.current || !activeRoom) return;
    socketRef.current.emit('leave_room', { roomId: activeRoom._id });
    seenIds.current.clear();
    setActiveRoom(null); setMessages([]); setOnlineUsers([]); setTypingUsers([]); setMoodHistory([]);
  }, [activeRoom]);

  const sendMessage = useCallback(({ content, type = 'text', language = '' }) => {
    if (!socketRef.current || !activeRoom || !content?.trim()) return;
    socketRef.current.emit('send_message', { roomId: activeRoom._id, content: content.trim(), type, language });
  }, [activeRoom]);

  const emitTyping     = useCallback(() => { if (socketRef.current && activeRoom) socketRef.current.emit('typing',      { roomId: activeRoom._id }); }, [activeRoom]);
  const emitStopTyping = useCallback(() => { if (socketRef.current && activeRoom) socketRef.current.emit('stop_typing', { roomId: activeRoom._id }); }, [activeRoom]);
  const requestMoodUpdate = useCallback(() => { if (socketRef.current && activeRoom) socketRef.current.emit('request_mood_update', { roomId: activeRoom._id }); }, [activeRoom]);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current, isConnected, isReconnecting,
      messages, setMessages, onlineUsers, typingUsers,
      activeRoom, roomMood, moodHistory,
      joinRoom, leaveRoom, sendMessage,
      emitTyping, emitStopTyping, requestMoodUpdate
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
  return ctx;
};

export default SocketContext;
