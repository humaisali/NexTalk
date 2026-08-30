import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { registerUser } from '../services/api';
import AuthShell from '../components/AuthShell';
import NexTalkNumberPicker from '../components/NexTalkNumberPicker';

const passwordRules = (password) => ({
  length: password.length >= 6,
  letter: /[a-zA-Z]/.test(password),
  number: /\d/.test(password),
});

const ruleLabels = [
  { key: 'length', label: '6+ characters' },
  { key: 'letter', label: 'One letter' },
  { key: 'number', label: 'One number' },
];

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ username: '', email: '', password: '', nexTalkNumber: '' });
  const [numberStatus, setNumberStatus] = useState({ valid: false, available: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const rules = passwordRules(form.password);

  const handleChange = (event) => {
    setError('');
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setPasswordTouched(true);

    if (form.username.trim().length < 3) {
      setError('Choose a username with at least 3 characters.');
      return;
    }
    if (!form.email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (!Object.values(rules).every(Boolean)) {
      setError('Update your password so it meets all three requirements.');
      return;
    }
    if (!numberStatus.valid || !numberStatus.available) {
      setError('Choose an available NexTalk number to continue.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await registerUser({ ...form, username: form.username.trim() });
      login(data.user, data.token);
      toast.success(`Welcome to NexTalk, ${data.user.username}!`);
      navigate('/chat');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not create your account. Review the details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Start a conversation"
      title="Create your account"
      description="Set up your profile, then find people and groups using a private conversation number."
    >
      {error && (
        <div id="register-error" className="auth-error mb-5" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="register-username" className="auth-field-label">Username</label>
          <input
            id="register-username"
            name="username"
            value={form.username}
            onChange={handleChange}
            autoComplete="username"
            placeholder="How people will see you"
            aria-describedby={error ? 'register-error' : undefined}
            className="auth-input"
          />
        </div>

        <div>
          <label htmlFor="register-email" className="auth-field-label">Email address</label>
          <input
            id="register-email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            aria-describedby={error ? 'register-error' : undefined}
            className="auth-input"
          />
        </div>

        <div>
          <label htmlFor="register-password" className="auth-field-label">Password</label>
          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={(event) => { setPasswordTouched(true); handleChange(event); }}
              autoComplete="new-password"
              placeholder="Create a password"
              aria-describedby="password-requirements"
              className="auth-input pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-slate-400 dark:hover:bg-nt-bg3 dark:hover:text-white"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <ul id="password-requirements" className="mt-2 flex flex-wrap gap-x-4 gap-y-1" aria-label="Password requirements">
            {ruleLabels.map(({ key, label }) => {
              const complete = rules[key];
              return (
                <li key={key} className={`flex items-center gap-1.5 text-xs ${complete ? 'text-emerald-700 dark:text-emerald-300' : passwordTouched ? 'text-gray-500 dark:text-slate-400' : 'text-gray-400 dark:text-slate-500'}`}>
                  <Check size={12} aria-hidden="true" className={complete ? 'opacity-100' : 'opacity-30'} />
                  {label}
                </li>
              );
            })}
          </ul>
        </div>

        <NexTalkNumberPicker
          value={form.nexTalkNumber}
          onChange={(number) => setForm((previous) => ({ ...previous, nexTalkNumber: number }))}
          onStatus={setNumberStatus}
        />

        <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
          {loading ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <UserPlus size={18} aria-hidden="true" />}
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-gray-600 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
};

export default Register;
