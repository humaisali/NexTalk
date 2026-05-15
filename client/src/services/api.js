import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('nextalk_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle global 401 errors (expired token)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('nextalk_token');
      localStorage.removeItem('nextalk_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────
export const registerUser   = (data)     => API.post('/api/auth/register', data);
export const loginUser      = (data)     => API.post('/api/auth/login', data);
export const getMe          = ()         => API.get('/api/auth/me');
export const logoutUser     = ()         => API.post('/api/auth/logout');
export const updateProfile  = (data)     => API.put('/api/auth/profile', data);
export const checkNumber    = (number)   => API.get(`/api/auth/check-number?number=${encodeURIComponent(number)}`);
export const findUser       = (number)   => API.get(`/api/auth/find-user?number=${encodeURIComponent(number)}`);

// ─── Rooms (Groups) ───────────────────────────────────────────────
export const getRooms           = ()             => API.get('/api/rooms');
export const createRoom         = (data)         => API.post('/api/rooms', data);
export const getRoomMessages    = (roomId)       => API.get(`/api/rooms/${roomId}/messages`);
export const getRoomDetails     = (id)           => API.get(`/api/rooms/${id}`);
export const updateRoom         = (id, data)     => API.put(`/api/rooms/${id}`, data);
export const previewRoomInvite  = (inviteCode)   => API.get(`/api/rooms/join/${inviteCode}`);
export const joinRoomByInvite   = (inviteCode)   => API.post(`/api/rooms/join/${inviteCode}`);
export const regenerateInvite   = (id)           => API.post(`/api/rooms/${id}/regenerate-invite`);
export const leaveRoom          = (id)           => API.post(`/api/rooms/${id}/leave`);
export const kickMember         = (id, userId)   => API.delete(`/api/rooms/${id}/members/${userId}`);

// ─── AI ───────────────────────────────────────────────────────────
export const analyzeTone    = (message)          => API.post('/api/ai/tone', { message });
export const getSmartReplies= (messages)         => API.post('/api/ai/replies', { messages });
export const summarizeRoom  = (messages)         => API.post('/api/ai/summarize', { messages });
export const explainCode    = (code, language)   => API.post('/api/ai/explain-code', { code, language });
export const getRoomMood    = (messages)         => API.post('/api/ai/mood', { messages });
export const checkAIHealth  = ()                 => API.get('/api/ai/health');
export const translateText  = (text, targetLanguage) => API.post('/api/ai/translate', { text, targetLanguage });

// ─── Conversations (Direct Messages) ──────────────────────────────
export const getConversations   = ()               => API.get('/api/conversations');
export const startConversation  = (nexTalkNumber)  => API.post('/api/conversations/start', { nexTalkNumber });
export const getDirectMessages  = (conversationId) => API.get(`/api/conversations/${conversationId}/messages`);
export const getUnreadDMCount   = ()               => API.get('/api/conversations/unread-count');

export default API;
