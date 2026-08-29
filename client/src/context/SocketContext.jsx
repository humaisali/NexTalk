import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const socketRef                         = useRef(null);
  const activeRoomRef                     = useRef(null);
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
      if (activeRoomRef.current?._id) {
        socket.emit('join_room', { roomId: activeRoomRef.current._id });
      }
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

    // Real-time user profile/presence sync
    socket.on('user_presence_update', (update) => {
      const { userId, isOnline, statusType, statusText, bio, avatar, username } = update;

      setActiveRoom((current) => {
        if (!current) return null;
        
        let updated = false;
        
        // Update createdBy
        let createdBy = current.createdBy;
        if (createdBy && (createdBy._id?.toString() || createdBy.toString()) === userId) {
          createdBy = typeof createdBy === 'object' ? {
            ...createdBy,
            avatar: avatar !== undefined ? avatar : createdBy.avatar,
            username: username !== undefined ? username : createdBy.username,
            statusType: statusType !== undefined ? statusType : createdBy.statusType,
            statusText: statusText !== undefined ? statusText : createdBy.statusText,
            bio: bio !== undefined ? bio : createdBy.bio
          } : createdBy;
          updated = true;
        }

        // Update members
        let members = current.members;
        if (members && members.some((m) => (m._id?.toString() || m.toString()) === userId)) {
          members = members.map((m) => {
            if ((m._id?.toString() || m.toString()) === userId) {
              return {
                ...m,
                avatar: avatar !== undefined ? avatar : m.avatar,
                username: username !== undefined ? username : m.username,
                isOnline: isOnline !== undefined ? isOnline : m.isOnline,
                statusType: statusType !== undefined ? statusType : m.statusType,
                statusText: statusText !== undefined ? statusText : m.statusText,
                bio: bio !== undefined ? bio : m.bio
              };
            }
            return m;
          });
          updated = true;
        }

        // Update admins
        let admins = current.admins;
        if (admins && admins.some((a) => (a._id?.toString() || a.toString()) === userId)) {
          admins = admins.map((a) => {
            if ((a._id?.toString() || a.toString()) === userId) {
              return {
                ...a,
                avatar: avatar !== undefined ? avatar : a.avatar,
                username: username !== undefined ? username : a.username,
                statusType: statusType !== undefined ? statusType : a.statusType,
                statusText: statusText !== undefined ? statusText : a.statusText,
                bio: bio !== undefined ? bio : a.bio
              };
            }
            return a;
          });
          updated = true;
        }

        if (updated) {
          return { ...current, createdBy, members, admins };
        }
        return current;
      });

      setMessages((prev) =>
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
    activeRoomRef.current = room;
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
    activeRoomRef.current = null;
    seenIds.current.clear();
    setActiveRoom(null); setMessages([]); setOnlineUsers([]); setTypingUsers([]); setMoodHistory([]);
  }, [activeRoom]);

  const sendMessage = useCallback(({ content, type = 'text', language = '', fileUrl = '', fileName = '', fileType = '', fileSize = 0 }) => {
    if (!socketRef.current || !activeRoom) return;
    if (type === 'text' && !content?.trim()) return;
    socketRef.current.emit('send_message', { 
      roomId: activeRoom._id, 
      content: content ? content.trim() : '', 
      type, 
      language,
      fileUrl,
      fileName,
      fileType,
      fileSize
    });
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
