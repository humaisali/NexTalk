import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const socketRef                          = useRef(null);
  const [isConnected,   setIsConnected]    = useState(false);
  const [messages,      setMessages]       = useState([]);
  const [onlineUsers,   setOnlineUsers]    = useState([]);
  const [typingUsers,   setTypingUsers]    = useState([]);
  const [activeRoom,    setActiveRoom]     = useState(null);
  const [roomMood,      setRoomMood]       = useState({ mood: 'neutral', score: 50 });
  // Day 6: mood history — array of { mood, score, timestamp }, newest first
  const [moodHistory,   setMoodHistory]    = useState([]);

  useEffect(() => {
    if (!token) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;

    socket.on('connect',       () => { setIsConnected(true);  console.log('🔌 Socket:', socket.id); });
    socket.on('disconnect',    () =>   setIsConnected(false));
    socket.on('connect_error', (e) =>  console.error('Socket error:', e.message));

    socket.on('receive_message', ({ message }) =>
      setMessages((prev) => [...prev, message])
    );

    socket.on('online_users', ({ users }) => setOnlineUsers(users));

    socket.on('user_joined', ({ username }) =>
      setMessages((prev) => [...prev, {
        _id: `sys-join-${Date.now()}`, type: 'system',
        content: `${username} joined the room`, createdAt: new Date()
      }])
    );

    socket.on('user_left', ({ username }) =>
      setMessages((prev) => [...prev, {
        _id: `sys-left-${Date.now()}`, type: 'system',
        content: `${username} left the room`, createdAt: new Date()
      }])
    );

    socket.on('user_typing',         ({ username }) => setTypingUsers((p) => p.includes(username) ? p : [...p, username]));
    socket.on('user_stopped_typing', ({ username }) => setTypingUsers((p) => p.filter((u) => u !== username)));

    // Day 6: mood_updated now includes timestamp, build history
    socket.on('mood_updated', ({ mood, score, timestamp }) => {
      const entry = { mood, score, timestamp: timestamp || new Date().toISOString() };
      setRoomMood({ mood, score });
      setMoodHistory((prev) => {
        // Skip if same mood+score as last entry
        if (prev[0] && prev[0].mood === mood && prev[0].score === score) return prev;
        return [entry, ...prev].slice(0, 10); // keep max 10 entries
      });
    });

    // Day 5: code explanation pushed from server
    socket.on('code_explained', ({ messageId, explanation }) => {
      setMessages((prev) =>
        prev.map((m) => m._id?.toString() === messageId ? { ...m, codeExplanation: explanation } : m)
      );
    });

    socket.on('error', ({ message }) => console.error('Socket error:', message));

    return () => { socket.disconnect(); socketRef.current = null; setIsConnected(false); };
  }, [token]);

  const joinRoom = useCallback((room, previousMessages = []) => {
    if (!socketRef.current) return;
    setActiveRoom(room);
    setMessages(previousMessages);
    setOnlineUsers([]);
    setTypingUsers([]);
    setMoodHistory([]); // reset history on room change
    setRoomMood({ mood: room.mood || 'neutral', score: room.moodScore || 50 });
    socketRef.current.emit('join_room', { roomId: room._id });
  }, []);

  const leaveRoom = useCallback(() => {
    if (!socketRef.current || !activeRoom) return;
    socketRef.current.emit('leave_room', { roomId: activeRoom._id });
    setActiveRoom(null); setMessages([]); setOnlineUsers([]); setTypingUsers([]);
    setMoodHistory([]);
  }, [activeRoom]);

  const sendMessage = useCallback(({ content, type = 'text', language = '' }) => {
    if (!socketRef.current || !activeRoom || !content?.trim()) return;
    socketRef.current.emit('send_message', { roomId: activeRoom._id, content, type, language });
  }, [activeRoom]);

  const emitTyping     = useCallback(() => { if (socketRef.current && activeRoom) socketRef.current.emit('typing',      { roomId: activeRoom._id }); }, [activeRoom]);
  const emitStopTyping = useCallback(() => { if (socketRef.current && activeRoom) socketRef.current.emit('stop_typing', { roomId: activeRoom._id }); }, [activeRoom]);

  // Day 6: manually request a mood refresh
  const requestMoodUpdate = useCallback(() => {
    if (!socketRef.current || !activeRoom) return;
    socketRef.current.emit('request_mood_update', { roomId: activeRoom._id });
  }, [activeRoom]);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current, isConnected,
      messages, setMessages,
      onlineUsers, typingUsers,
      activeRoom,
      roomMood, moodHistory,
      joinRoom, leaveRoom, sendMessage,
      emitTyping, emitStopTyping,
      requestMoodUpdate
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
