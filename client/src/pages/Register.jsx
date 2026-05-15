import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth }               from '../context/AuthContext';
import { useToast }              from '../context/ToastContext';
import { registerUser }          from '../services/api';
import NexTalkNumberPicker       from '../components/NexTalkNumberPicker';
import { ChevronsRight, MessageSquare, Check } from 'lucide-react';

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
    <div className="min-h-screen flex w-full font-sans bg-gray-50">
      
      {/* ── LEFT PANEL (Deep Blue Branding) ── */}
      <div className="hidden md:flex w-7/12 login-left-bg flex-col items-center justify-center relative overflow-hidden text-center px-12">
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-4">
            <div className="w-16 h-16 rounded-full border-2 border-yellow-400 flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.3)]">
              <MessageSquare size={30} className="text-yellow-400" />
            </div>
          </div>
          
          <h2 className="text-xl font-medium tracking-wide text-white mb-6">NexTalk</h2>
          <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 tracking-wider mb-2 drop-shadow-md">
            INTERCONNECT
          </h1>
          <p className="text-white text-lg tracking-wide opacity-90">
            Chat & Communication
          </p>
        </div>
        
        <div className="absolute bottom-6 w-full text-center z-10">
          <p className="text-sm text-white opacity-60">
            © 2026, SkyTech Developers, All Rights Reserved.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL (Register Form) ── */}
      <div className="flex-1 w-full md:w-5/12 bg-[#EEF2F6] flex flex-col justify-center items-center px-8 sm:px-16 lg:px-24 py-12 overflow-y-auto">
        <div className="w-full max-w-sm my-auto">
          
          <h2 className="text-xl font-bold text-[#1A3A63] text-center mb-8 tracking-widest uppercase">
            CREATE ACCOUNT
          </h2>

          {error && (
            <div className="mb-6 p-3 bg-red-100 text-red-600 text-sm rounded border border-red-200 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-xs text-gray-500 mb-1 ml-1 font-medium">Username</label>
              <input name="username" value={form.username} onChange={handleChange} required minLength={3} className="auth-input" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1 ml-1 font-medium">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required className="auth-input" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1 ml-1 font-medium">Password</label>
              <input type="password" name="password" value={form.password} onChange={(e) => { setTouched(true); handleChange(e); }} required className="auth-input" />
              {touched && form.password && (
                <div className="mt-2 flex gap-4 flex-wrap px-1">
                  {[{k:'length',l:'6+ chars'},{k:'letter',l:'Letter'},{k:'number',l:'Number'}].map(({k,l}) => (
                    <div key={k} className={`flex items-center gap-1 text-xs ${rules[k] ? 'text-green-600' : 'text-gray-400'}`}>
                      <Check size={10} className={rules[k] ? 'opacity-100' : 'opacity-30'} />
                      {l}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2">
              <NexTalkNumberPicker
                value={form.nexTalkNumber}
                onChange={(num) => setForm((p) => ({ ...p, nexTalkNumber: num }))}
                onStatus={setNumberStatus}
                lightMode
              />
            </div>

            <div className="pt-4 flex flex-col items-center">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#0F2A55] text-white font-semibold text-sm px-8 py-2.5 rounded-full flex items-center justify-center gap-2 hover:bg-[#153B75] transition-colors disabled:opacity-70 shadow-lg w-full"
              >
                {loading ? 'CREATING...' : 'REGISTER'} 
                {!loading && <ChevronsRight size={16} />}
              </button>

              <div className="mt-6 flex flex-col items-center gap-3">
                <span className="text-xs text-gray-500">Already have an account?</span>
                <Link to="/login" className="text-xs font-semibold text-[#1A3A63] hover:underline">
                  Sign in here
                </Link>
              </div>
            </div>
          </form>
          
        </div>
      </div>
      
    </div>
  );
};

export default Register;
