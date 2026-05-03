import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth }               from '../context/AuthContext';
import { useToast }              from '../context/ToastContext';
import { registerUser }          from '../services/api';
import NexTalkNumberPicker       from '../components/NexTalkNumberPicker';
import { User, Mail, Lock, ArrowRight, Eye, EyeOff, Check, MessageSquare } from 'lucide-react';

const pwRules = (pw) => ({
  length: pw.length >= 6,
  letter: /[a-zA-Z]/.test(pw),
  number: /\d/.test(pw),
});

const Register = () => {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const toast     = useToast();

  const [form, setForm] = useState({ username: '', email: '', password: '', nexTalkNumber: '' });
  const [numberStatus, setNumberStatus] = useState({ valid: false, available: false });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [touched, setTouched] = useState(false);

  const rules = pwRules(form.password);

  const handleChange = (e) => {
    setError('');
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const fieldStyle = {
    borderBottom: '1.5px solid #013E37',
    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTouched(true);
    if (form.username.trim().length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (!form.email.includes('@'))        { setError('Enter a valid email address.'); return; }
    if (!Object.values(rules).every(Boolean)) { setError('Password does not meet requirements.'); return; }
    if (!numberStatus.valid || !numberStatus.available) {
      setError('Please choose a valid, available NexTalk number.'); return;
    }
    setLoading(true);
    try {
      const { data } = await registerUser({ ...form, username: form.username.trim() });
      login(data.user, data.token);
      toast.success(`Welcome to NexTalk, ${data.user.username}!`);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: '#FFFBEA' }}>

      {/* ── LEFT PANEL — Brand ─────────────────────────────────── */}
      <div className="hidden lg:flex w-5/12 flex-col justify-between p-12 relative overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #011F1B 0%, #013E37 60%, #024D44 100%)' }}>
        <div className="absolute top-0 left-0 w-80 h-80 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, #FFEFB2, transparent)', transform: 'translate(-40%,-40%)' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, #FFEFB2, transparent)', transform: 'translate(40%,40%)' }} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 border-primary/40"
               style={{ background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)' }}>
            <MessageSquare size={28} className="text-secondary" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-primary tracking-tight">NexTalk</h1>
            <p className="text-xs text-primary/60 font-medium tracking-widest uppercase">AI Chat Platform</p>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-primary leading-snug">
            Your unique<br />
            <span className="text-primary/70">NexTalk identity</span><br />
            starts here.
          </h2>
          <p className="mt-4 text-nt-info/70 text-sm leading-relaxed max-w-xs">
            Choose your personal NexTalk number — it's how friends find and message you privately, just like a phone number.
          </p>
        </div>

        <p className="relative z-10 text-xs text-primary/30">
          Built by Humais Ali · SkyTech Developers
        </p>
      </div>

      {/* ── RIGHT PANEL — Form ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto flex items-start justify-center py-10 px-8">
        <div className="w-full max-w-md animate-slide-up">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-6 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)' }}>
              <MessageSquare size={20} className="text-secondary" />
            </div>
            <span className="text-xl font-black text-secondary">NexTalk</span>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-secondary tracking-tight">CREATE ACCOUNT</h2>
            <div className="mt-1.5 w-10 h-0.5 rounded-full bg-secondary" />
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg text-sm border animate-fade-in"
                 style={{ background: '#FEF2F2', borderColor: '#FCA5A5', color: '#DC2626' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-secondary/60 mb-2 uppercase tracking-widest">Username</label>
              <input name="username" value={form.username} onChange={handleChange}
                placeholder="humaisali" required minLength={3} autoComplete="username"
                className="w-full border-0 bg-transparent px-0 py-2.5 text-sm text-secondary
                           placeholder-secondary/30 focus:outline-none transition-all duration-200"
                style={fieldStyle}
                onFocus={(e) => e.target.style.borderBottomColor = '#FFEFB2'}
                onBlur={(e)  => e.target.style.borderBottomColor = '#013E37'}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-secondary/60 mb-2 uppercase tracking-widest">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="you@example.com" required autoComplete="email"
                className="w-full border-0 bg-transparent px-0 py-2.5 text-sm text-secondary
                           placeholder-secondary/30 focus:outline-none transition-all duration-200"
                style={fieldStyle}
                onFocus={(e) => e.target.style.borderBottomColor = '#FFEFB2'}
                onBlur={(e)  => e.target.style.borderBottomColor = '#013E37'}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-secondary/60 mb-2 uppercase tracking-widest">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} name="password" value={form.password}
                  onChange={(e) => { setTouched(true); handleChange(e); }}
                  placeholder="Min. 6 characters" required autoComplete="new-password"
                  className="w-full border-0 bg-transparent px-0 py-2.5 text-sm text-secondary
                             placeholder-secondary/30 focus:outline-none transition-all duration-200 pr-8"
                  style={fieldStyle}
                  onFocus={(e) => e.target.style.borderBottomColor = '#FFEFB2'}
                  onBlur={(e)  => e.target.style.borderBottomColor = '#013E37'}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-secondary transition-colors">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {touched && form.password && (
                <div className="mt-2 flex gap-4 flex-wrap">
                  {[{k:'length',l:'6+ chars'},{k:'letter',l:'Letter'},{k:'number',l:'Number'}].map(({k,l}) => (
                    <div key={k} className={`flex items-center gap-1 text-xs ${rules[k] ? 'text-green-600' : 'text-secondary/40'}`}>
                      <Check size={10} className={rules[k] ? 'opacity-100' : 'opacity-30'} />
                      {l}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* NexTalk Number */}
            <div className="pt-1">
              <NexTalkNumberPicker
                value={form.nexTalkNumber}
                onChange={(num) => setForm((p) => ({ ...p, nexTalkNumber: num }))}
                onStatus={setNumberStatus}
                lightMode
              />
            </div>

            <div className="pt-3">
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg
                           font-bold text-sm tracking-wide transition-all duration-200
                           disabled:opacity-60 active:scale-95"
                style={{ background: '#013E37', color: '#FFEFB2' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#024D44'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#013E37'}
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> Creating…</>
                  : <>CREATE ACCOUNT <ArrowRight size={16} /></>
                }
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-secondary/50">
            Already have an account?{' '}
            <Link to="/login" className="font-bold hover:underline" style={{ color: '#013E37' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
