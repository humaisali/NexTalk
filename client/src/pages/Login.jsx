import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth }   from '../context/AuthContext';
import { useToast }  from '../context/ToastContext';
import { loginUser } from '../services/api';
import { Mail, Lock, ArrowRight, Eye, EyeOff, MessageSquare, Zap, Globe, Shield } from 'lucide-react';

const Login = () => {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const toast     = useToast();

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
      toast.success(`Welcome back, ${data.user.username}!`);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Zap,          text: 'AI-powered tone analysis' },
    { icon: Globe,        text: 'Real-time translation in 14 languages' },
    { icon: Shield,       text: 'Private messaging with NexTalk numbers' },
    { icon: MessageSquare, text: 'Smart replies & mood detection' },
  ];

  return (
    <div className="min-h-screen flex overflow-hidden bg-secondary">

      {/* ── LEFT PANEL — Brand (like Image 2 left side) ─────────── */}
      <div className="hidden md:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #011F1B 0%, #013E37 50%, #024D44 100%)' }}>

        {/* Background decorative circles */}
        <div className="absolute top-0 left-0 w-80 h-80 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, #FFEFB2, transparent)', transform: 'translate(-40%, -40%)' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, #FFEFB2, transparent)', transform: 'translate(40%, 40%)' }} />

        {/* Top — Logo */}
        <div className="relative z-10">
          {/* Dummy logo placeholder — replace with real logo */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 border-primary/40"
                 style={{ background: 'linear-gradient(135deg, #FFEFB2 0%, #F5DC6E 100%)' }}>
              <MessageSquare size={28} className="text-secondary" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-primary tracking-tight">NexTalk</h1>
              <p className="text-xs text-primary/60 font-medium tracking-widest uppercase">AI Chat Platform</p>
            </div>
          </div>
        </div>

        {/* Center — Tagline */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-primary leading-tight">
              Chat smarter,<br />
              <span className="text-primary/70">not harder.</span>
            </h2>
            <p className="mt-4 text-nt-info/80 text-base leading-relaxed max-w-sm">
              The AI-powered messaging platform that understands your tone, translates your words, and connects your team.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-primary" />
                </div>
                <span className="text-sm text-primary/70">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p className="relative z-10 text-xs text-primary/30">
          Built by Humais Ali · SkyTech Developers · UET Mardan
        </p>
      </div>

      {/* ── RIGHT PANEL — Login Form (like Image 2 right side) ───── */}
      <div className="flex-1 flex items-center justify-center px-8 py-12"
           style={{ background: '#FFFBEA' }}>
        <div className="w-full max-w-sm animate-slide-up">

          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)' }}>
              <MessageSquare size={20} className="text-secondary" />
            </div>
            <span className="text-xl font-black text-secondary">NexTalk</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-secondary tracking-tight">SIGN IN</h2>
            <div className="mt-1.5 w-10 h-0.5 rounded-full" style={{ background: '#013E37' }} />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg border text-sm animate-fade-in"
                 style={{ background: '#FEF2F2', borderColor: '#FCA5A5', color: '#DC2626' }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-secondary/60 mb-2 uppercase tracking-widest">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email" name="email" value={form.email}
                  onChange={handleChange} required autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full border-0 border-b-2 bg-transparent px-0 py-2.5 text-sm text-secondary
                             placeholder-secondary/30 focus:outline-none transition-all duration-200"
                  style={{ borderBottomColor: '#013E37', borderBottomWidth: '1.5px' }}
                  onFocus={(e) => e.target.style.borderBottomColor = '#FFEFB2'}
                  onBlur={(e)  => e.target.style.borderBottomColor = '#013E37'}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-secondary/60 mb-2 uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password" value={form.password}
                  onChange={handleChange} required autoComplete="current-password"
                  placeholder="Your password"
                  className="w-full border-0 border-b-2 bg-transparent px-0 py-2.5 text-sm text-secondary
                             placeholder-secondary/30 focus:outline-none transition-all duration-200 pr-8"
                  style={{ borderBottomColor: '#013E37', borderBottomWidth: '1.5px' }}
                  onFocus={(e) => e.target.style.borderBottomColor = '#FFEFB2'}
                  onBlur={(e)  => e.target.style.borderBottomColor = '#013E37'}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-secondary transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-3">
              <button
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg
                           font-bold text-sm tracking-wide transition-all duration-200
                           disabled:opacity-60 active:scale-95"
                style={{ background: '#013E37', color: '#FFEFB2' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#024D44'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#013E37'}
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> Signing in…</>
                  : <>LOGIN IN <ArrowRight size={16} /></>
                }
              </button>
            </div>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-secondary/50">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold hover:underline" style={{ color: '#013E37' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
