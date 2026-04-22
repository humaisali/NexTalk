import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../services/api';
import { FiUser, FiMail, FiLock, FiArrowRight } from 'react-icons/fi';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm]       = useState({ username: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const { data } = await registerUser(form);
      login(data.user, data.token);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nt-bg flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-nt-cyan/4 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-nt-blue to-nt-cyan mb-4 shadow-lg shadow-nt-blue/20">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <h1 className="text-3xl font-bold text-nt-text tracking-tight">
            Nex<span className="text-nt-blue">Talk</span>
          </h1>
          <p className="text-nt-muted text-sm mt-1.5">AI-Powered Real-Time Chat</p>
        </div>

        <div className="bg-nt-surface border border-nt-border rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-nt-text mb-1">Create your account</h2>
          <p className="text-sm text-nt-muted mb-6">Join NexTalk and start chatting with AI</p>

          {error && (
            <div className="bg-nt-danger/10 border border-nt-danger/30 text-nt-danger rounded-xl px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-nt-muted mb-1.5 uppercase tracking-wider">Username</label>
              <div className="relative">
                <FiUser size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nt-muted" />
                <input name="username" value={form.username} onChange={handleChange}
                  placeholder="humaisali" required
                  className="nt-input pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-nt-muted mb-1.5 uppercase tracking-wider">Email</label>
              <div className="relative">
                <FiMail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nt-muted" />
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="you@example.com" required
                  className="nt-input pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-nt-muted mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nt-muted" />
                <input type="password" name="password" value={form.password} onChange={handleChange}
                  placeholder="Min. 6 characters" required
                  className="nt-input pl-10" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? 'Creating account…' : (<>Create Account <FiArrowRight size={15} /></>)}
            </button>
          </form>

          <p className="text-nt-muted text-sm text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-nt-blue hover:text-nt-cyan font-medium transition-colors">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-nt-muted mt-6 opacity-50">
          Built by Humais Ali · SkyTech Developers
        </p>
      </div>
    </div>
  );
};

export default Register;
