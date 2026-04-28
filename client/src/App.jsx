import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider }        from './context/SocketContext';
import { ToastProvider }         from './context/ToastContext';
import ErrorBoundary             from './components/ErrorBoundary';
import LoadingScreen             from './components/LoadingScreen';
import Login    from './pages/Login';
import Register from './pages/Register';
import Chat     from './pages/Chat';

// ── Route guards ──────────────────────────────────────────────────

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/chat" replace /> : children;
};

// ── 404 page ──────────────────────────────────────────────────────
const NotFound = () => (
  <div className="min-h-screen bg-nt-bg flex flex-col items-center justify-center gap-4 text-center px-6">
    <div className="text-6xl">🔍</div>
    <h1 className="text-2xl font-bold text-nt-text">Page Not Found</h1>
    <p className="text-nt-muted text-sm max-w-xs">
      The page you're looking for doesn't exist in NexTalk.
    </p>
    <a href="/chat" className="btn-primary mt-2 inline-block">
      Go to Chat
    </a>
  </div>
);

// ── App routes ────────────────────────────────────────────────────
const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/chat" replace />} />

    <Route path="/login"    element={<PublicRoute><Login    /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

    <Route path="/chat" element={
      <ProtectedRoute>
        <SocketProvider>
          <Chat />
        </SocketProvider>
      </ProtectedRoute>
    } />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

// ── Root ──────────────────────────────────────────────────────────
const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
