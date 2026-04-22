import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';

// Protected route — redirects to /login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-nt-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-nt-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-nt-muted text-sm">Loading NexTalk…</p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

// Public route — redirects to /chat if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-nt-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-nt-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <Navigate to="/chat" replace /> : children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/chat" replace />} />

    <Route path="/login" element={
      <PublicRoute><Login /></PublicRoute>
    } />

    <Route path="/register" element={
      <PublicRoute><Register /></PublicRoute>
    } />

    <Route path="/chat" element={
      <ProtectedRoute>
        <SocketProvider>
          <Chat />
        </SocketProvider>
      </ProtectedRoute>
    } />

    {/* 404 fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
