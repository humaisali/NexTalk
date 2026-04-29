import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, logoutUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem('nextalk_token'));
  const [loading, setLoading] = useState(true);

  // ── Verify token on mount ────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem('nextalk_token');
      if (!saved) { setLoading(false); return; }
      try {
        const { data } = await getMe();
        setUser(data.user);
        setToken(saved);
      } catch (err) {
        // Token expired or invalid — clear silently
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem('nextalk_token');
          localStorage.removeItem('nextalk_user');
          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ── Login ────────────────────────────────────────────────────────
  const login = useCallback((userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('nextalk_token', jwtToken);
    localStorage.setItem('nextalk_user', JSON.stringify(userData));
  }, []);

  // ── Logout ───────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await logoutUser(); } catch { /* ignore — clear anyway */ }
    setUser(null);
    setToken(null);
    localStorage.removeItem('nextalk_token');
    localStorage.removeItem('nextalk_user');
  }, []);

  // ── Update user in state (e.g. after language change) ───────────
  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('nextalk_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
