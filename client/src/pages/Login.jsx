import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth }   from '../context/AuthContext';
import { useToast }  from '../context/ToastContext';
import { loginUser } from '../services/api';
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';

const Login = () => {
  const navigate   = useNavigate();
  const { login }  = useAuth();
  const toast      = useToast();

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const handleChange = (e) => {
    setError('');
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email.includes('@')) { setError('Enter a valid email address.'); return; }
    if (!form.password)            { setError('Password is required.'); return; }

    setLoading(true);
    try {
      const { data } = await loginUser(form);
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.username}! 👋`);
      navigate('/chat');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nt-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-nt-blue/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-nt-blue to-nt-cyan mb-4 shadow-2xl shadow-nt-blue/25">
            <span className="text-white font-black text-2xl">N</span>
          </div>
          <h1 className="text-3xl font-bold text-nt-text tracking-tight">
            Nex<span className="text-nt-blue">Talk</span>
          </h1>
          <p className="text-nt-muted text-sm mt-1.5">AI-Powered Real-Time Chat</p>
        </div>

        <div className="nt-card p-8 shadow-2xl shadow-black/30">
          <h2 className="text-xl font-semibold text-nt-text mb-1">Welcome back</h2>
          <p className="text-sm text-nt-muted mb-6">Sign in to continue to NexTalk</p>

          {error && (
            <div className="bg-nt-danger/10 border border-nt-danger/30 text-nt-danger rounded-xl px-4 py-3 text-sm mb-5 animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-nt-muted mb-1.5 uppercase tracking-wider">Email</label>
              <div className="relative">
                <FiMail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nt-muted" />
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="you@example.com" required autoComplete="email"
                  className="nt-input pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-nt-muted mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nt-muted" />
                <input type={showPw ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                  placeholder="Your password" required autoComplete="current-password"
                  className="nt-input pl-10 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-nt-muted hover:text-nt-text transition-colors">
                  {showPw ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</>
              ) : (
                <>Sign In <FiArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className="text-nt-muted text-sm text-center mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-nt-blue hover:text-nt-cyan font-semibold transition-colors">Create one</Link>
          </p>
        </div>

        <p className="text-center text-xs text-nt-muted/40 mt-6">
          Built by Humais Ali · SkyTech Developers · UET Mardan
        </p>
      </div>
    </div>
  );
};

export default Login;
