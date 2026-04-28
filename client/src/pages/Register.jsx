import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth }               from '../context/AuthContext';
import { useToast }              from '../context/ToastContext';
import { registerUser }          from '../services/api';
import NexTalkNumberPicker       from '../components/NexTalkNumberPicker';
import { FiUser, FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';

const pwRules = (pw) => ({
  length: pw.length >= 6,
  letter: /[a-zA-Z]/.test(pw),
  number: /\d/.test(pw),
});

const Register = () => {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const toast     = useToast();

  const [form, setForm] = useState({
    username:      '',
    email:         '',
    password:      '',
    nexTalkNumber: ''       // full number e.g. "+1001234567"
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTouched(true);

    // Client-side guards
    if (form.username.trim().length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (!form.email.includes('@'))        { setError('Enter a valid email address.'); return; }
    if (!Object.values(rules).every(Boolean)) { setError('Password does not meet all requirements.'); return; }
    if (!numberStatus.valid || !numberStatus.available) {
      setError('Please choose a valid, available NexTalk number.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await registerUser({
        username:      form.username.trim(),
        email:         form.email.trim(),
        password:      form.password,
        nexTalkNumber: form.nexTalkNumber
      });
      login(data.user, data.token);
      toast.success(`Welcome to NexTalk, ${data.user.username}! 🎉`);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nt-bg flex items-center justify-center px-4 py-8 relative overflow-auto">
      {/* Background glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-nt-cyan/4 rounded-full blur-3xl pointer-events-none" />

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
          <h2 className="text-xl font-semibold text-nt-text mb-1">Create your account</h2>
          <p className="text-sm text-nt-muted mb-6">Fill in your details and choose your unique NexTalk number</p>

          {error && (
            <div className="bg-nt-danger/10 border border-nt-danger/30 text-nt-danger rounded-xl px-4 py-3 text-sm mb-5 animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-nt-muted mb-1.5 uppercase tracking-wider">Username</label>
              <div className="relative">
                <FiUser size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nt-muted" />
                <input name="username" value={form.username} onChange={handleChange}
                  placeholder="humaisali" required minLength={3} autoComplete="username"
                  className="nt-input pl-10" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-nt-muted mb-1.5 uppercase tracking-wider">Email</label>
              <div className="relative">
                <FiMail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nt-muted" />
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="you@example.com" required autoComplete="email"
                  className="nt-input pl-10" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-nt-muted mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nt-muted" />
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={(e) => { setTouched(true); handleChange(e); }}
                  placeholder="Min. 6 characters"
                  required
                  autoComplete="new-password"
                  className="nt-input pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-nt-muted hover:text-nt-text transition-colors">
                  {showPw ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>
              {/* Password strength checklist */}
              {touched && form.password && (
                <div className="mt-2 space-y-1">
                  {[
                    { key: 'length', label: 'At least 6 characters' },
                    { key: 'letter', label: 'Contains a letter' },
                    { key: 'number', label: 'Contains a number' },
                  ].map(({ key, label }) => (
                    <div key={key} className={`flex items-center gap-1.5 text-xs transition-colors ${rules[key] ? 'text-nt-success' : 'text-nt-muted'}`}>
                      <FiCheck size={11} className={rules[key] ? 'opacity-100' : 'opacity-30'} />
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── NexTalk Number Picker ── */}
            <div className="pt-1">
              <NexTalkNumberPicker
                value={form.nexTalkNumber}
                onChange={(num) => setForm((p) => ({ ...p, nexTalkNumber: num }))}
                onStatus={setNumberStatus}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account…</>
              ) : (
                <>Create Account <FiArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className="text-nt-muted text-sm text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-nt-blue hover:text-nt-cyan font-semibold transition-colors">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-nt-muted/40 mt-6">
          Built by Humais Ali · SkyTech Developers · UET Mardan
        </p>
      </div>
    </div>
  );
};

export default Register;
