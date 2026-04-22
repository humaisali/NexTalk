import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, logoutUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('nextalk_token'));
  const [loading, setLoading] = useState(true);

  // On mount, verify token and load user
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('nextalk_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await getMe();
        setUser(data.user);
        setToken(savedToken);
      } catch {
        // Token invalid or expired — clear storage
        localStorage.removeItem('nextalk_token');
        localStorage.removeItem('nextalk_user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // Called after successful login or register
  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('nextalk_token', jwtToken);
    localStorage.setItem('nextalk_user', JSON.stringify(userData));
  };

  // Called on logout
  const logout = async () => {
    try {
      await logoutUser();
    } catch { /* ignore */ } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('nextalk_token');
      localStorage.removeItem('nextalk_user');
    }
  };

  const value = { user, token, loading, login, logout, setUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
