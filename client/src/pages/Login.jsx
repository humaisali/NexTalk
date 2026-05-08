import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth }   from '../context/AuthContext';
import { useToast }  from '../context/ToastContext';
import { loginUser } from '../services/api';
import { ArrowRight, Eye, EyeOff, MessageSquare, Zap, Globe, Shield, Sparkles } from 'lucide-react';

const Login = () => {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const toast     = useToast();

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [focused, setFocused] = useState('');

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
      toast.success(`Welcome back, ${data.user.username}!`);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Zap,           text: 'AI-powered tone analysis & smart replies' },
    { icon: Globe,         text: 'Real-time translation in 14+ languages' },
    { icon: Shield,        text: 'Private DMs with unique NexTalk numbers' },
    { icon: Sparkles,      text: 'Live mood rooms & AI conversation summaries' },
  ];

  const inputBase = {
    background: 'transparent',
    color: '#1a2e2b',
    caretColor: '#013E37',
    outline: 'none',
    border: 'none',
    borderBottom: '1.5px solid',
    borderRadius: 0,
    padding: '10px 0',
    fontSize: '14px',
    width: '100%',
    transition: 'border-color 0.2s',
  };

  return (
    <div className="min-h-screen flex overflow-hidden">

      {/* ── LEFT PANEL ── */}
      <div className="auth-left-panel hidden md:flex w-1/2 flex-col justify-between p-12">
        {/* Decorative grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,239,178,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,239,178,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)',
              boxShadow: '0 0 40px rgba(255,239,178,0.2), 0 8px 20px rgba(0,0,0,0.3)',
            }}
          >
            <MessageSquare size={28} style={{ color: '#013E37' }} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight" style={{ color: '#FFEFB2' }}>NexTalk</h1>
            <p className="text-xs font-medium tracking-widest uppercase" style={{ color: 'rgba(255,239,178,0.4)' }}>
              AI Chat Platform
            </p>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-5xl font-black leading-tight" style={{ color: '#FFEFB2' }}>
              Chat<br />
              <span style={{ color: 'rgba(255,239,178,0.45)' }}>smarter,</span><br />
              not harder.
            </h2>
            <p className="mt-5 text-base leading-relaxed max-w-sm" style={{ color: 'rgba(255,239,178,0.55)' }}>
              The AI-powered messaging platform that understands your tone, translates your words, and reads the room.
            </p>
          </div>

          <div className="space-y-3.5">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(255,239,178,0.08)',
                    border: '1px solid rgba(255,239,178,0.15)',
                  }}
                >
                  <Icon size={15} style={{ color: '#FFEFB2' }} />
                </div>
                <span className="text-sm" style={{ color: 'rgba(255,239,178,0.6)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs" style={{ color: 'rgba(255,239,178,0.2)' }}>
          Built by Humais Ali · SkyTech Developers · UET Mardan
        </p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        className="flex-1 flex items-center justify-center px-8 py-12 relative"
        style={{ background: '#F0EDD8' }}
      >
        {/* Subtle pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(1,62,55,0.08) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(2,90,80,0.06) 0%, transparent 40%)',
          }}
        />

        <div className="w-full max-w-sm animate-slide-up relative z-10">

          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)' }}>
              <MessageSquare size={20} style={{ color: '#013E37' }} />
            </div>
            <span className="text-xl font-black" style={{ color: '#013E37' }}>NexTalk</span>
          </div>

          {/* Heading */}
          <div className="mb-9">
            <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(1,62,55,0.4)' }}>
              Welcome back
            </p>
            <h2 className="text-3xl font-black tracking-tight" style={{ color: '#013E37' }}>Sign In</h2>
            <div className="mt-2 h-0.5 w-12 rounded-full" style={{ background: 'linear-gradient(90deg, #013E37, transparent)' }} />
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-6 px-4 py-3 rounded-xl text-sm animate-fade-in"
              style={{
                background: 'rgba(220,38,38,0.08)',
                border: '1px solid rgba(220,38,38,0.2)',
                color: '#DC2626',
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold mb-3 uppercase tracking-widest" style={{ color: 'rgba(1,62,55,0.5)' }}>
                Email Address
              </label>
              <input
                type="email" name="email" value={form.email}
                onChange={handleChange} required autoComplete="email"
                placeholder="you@example.com"
                style={{
                  ...inputBase,
                  borderBottomColor: focused === 'email' ? '#013E37' : 'rgba(1,62,55,0.25)',
                }}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused('')}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold mb-3 uppercase tracking-widest" style={{ color: 'rgba(1,62,55,0.5)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password" value={form.password}
                  onChange={handleChange} required autoComplete="current-password"
                  placeholder="Your password"
                  style={{
                    ...inputBase,
                    borderBottomColor: focused === 'password' ? '#013E37' : 'rgba(1,62,55,0.25)',
                    paddingRight: '2rem',
                  }}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(1,62,55,0.4)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#013E37'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(1,62,55,0.4)'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 active:scale-98 disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #013E37, #025A50)',
                  color: '#FFEFB2',
                  boxShadow: '0 4px 15px rgba(1,62,55,0.3), 0 1px 3px rgba(0,0,0,0.2)',
                }}
                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(1,62,55,0.4)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(1,62,55,0.3)'; }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-sm" style={{ color: 'rgba(1,62,55,0.45)' }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold transition-colors"
              style={{ color: '#013E37' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#025A50'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#013E37'}
            >
              Create one →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
