import { useState, useRef } from 'react';
import { useAuth }      from '../context/AuthContext';
import { useToast }     from '../context/ToastContext';
import { updateProfile } from '../services/api';
import { X, Lock, Camera, Check, Eye, EyeOff, Save, Trash2, Hash, User } from 'lucide-react';

const pwRules = (pw) => ({ length: pw.length >= 6, letter: /[a-zA-Z]/.test(pw), number: /\d/.test(pw) });

const EditProfileModal = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const toast                = useToast();

  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [username,      setUsername]      = useState(user?.username || '');
  const [usernameError, setUsernameError] = useState('');
  const [currentPw,     setCurrentPw]     = useState('');
  const [newPw,         setNewPw]         = useState('');
  const [confirmPw,     setConfirmPw]     = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw,     setShowNewPw]     = useState(false);
  const [pwTouched,     setPwTouched]     = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [section,       setSection]       = useState('profile');
  const fileInputRef = useRef(null);

  const rules        = pwRules(newPw);
  const allRulesPass = Object.values(rules).every(Boolean);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file.'); return; }
    if (file.size > 512 * 1024) { toast.error('Image too large. Max 500KB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setAvatarPreview(ev.target.result); setAvatarChanged(true); };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setUsernameError('');
    const trimmed = username.trim();
    if (trimmed.length < 3) { setUsernameError('Username must be at least 3 characters.'); return; }
    if (trimmed === user?.username && !avatarChanged) { toast.info('No changes to save.'); return; }
    setSaving(true);
    try {
      const payload = {};
      if (trimmed !== user?.username) payload.username = trimmed;
      if (avatarChanged) payload.avatar = avatarPreview;
      const { data } = await updateProfile(payload);
      updateUser(data.user);
      toast.success('Profile updated!');
      setAvatarChanged(false);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update profile.';
      if (msg.toLowerCase().includes('username')) setUsernameError(msg);
      else toast.error(msg);
    } finally { setSaving(false); }
  };

  const handleSavePassword = async () => {
    setPwTouched(true);
    if (!currentPw) { toast.error('Enter your current password.'); return; }
    if (!allRulesPass) { toast.error('New password does not meet requirements.'); return; }
    if (newPw !== confirmPw) { toast.error('Passwords do not match.'); return; }
    setSaving(true);
    try {
      await updateProfile({ currentPassword: currentPw, newPassword: newPw });
      toast.success('Password changed!');
      setCurrentPw(''); setNewPw(''); setConfirmPw(''); setPwTouched(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to change password.');
    } finally { setSaving(false); }
  };

  const hasImg = avatarPreview?.startsWith?.('data:image/') || avatarPreview?.startsWith?.('http');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-100 animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-base font-bold text-gray-800">Edit Profile</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-200">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-white flex-shrink-0">
          {[{ key:'profile', label:'Profile', icon: User }, { key:'password', label:'Password', icon: Lock }].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setSection(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-semibold border-b-2 transition-all
                ${section === key ? 'border-blue-500 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              <Icon size={16} />{label}
            </button>
          ))}
        </div>

        {/* PROFILE SECTION */}
        {section === 'profile' && (
          <div className="px-6 py-6 space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4 p-4 border border-gray-100 rounded-2xl bg-gray-50">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-full overflow-hidden bg-white border border-gray-200 flex items-center justify-center shadow-sm text-gray-300">
                  {hasImg
                    ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                    : <span className="text-3xl font-black">{user?.username?.[0]?.toUpperCase()}</span>
                  }
                </div>
                <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                  <Camera size={14} />{avatarPreview ? 'Change Photo' : 'Upload Photo'}
                </button>
                {avatarPreview && (
                  <button onClick={() => { setAvatarPreview(''); setAvatarChanged(true); }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                    <Trash2 size={14} />Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 font-medium">JPG, PNG · Max 500KB</p>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Username</label>
              <input value={username} onChange={(e) => { setUsernameError(''); setUsername(e.target.value); }}
                placeholder="Your username"
                className={`w-full px-4 py-2.5 bg-white border ${usernameError ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-200'} rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm`}
              />
              {usernameError && <p className="text-xs mt-2 text-red-500">{usernameError}</p>}
            </div>

            {/* NexTalk number (read-only) */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">NexTalk Number</label>
              <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50">
                <Hash size={16} className="text-blue-500" />
                <span className="font-mono text-sm font-semibold text-gray-800">
                  {user?.nexTalkNumber?.replace(/^(\+100)(\d{7})$/, '+100 $2') || '—'}
                </span>
                <span className="ml-auto text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded-md">Cannot change</span>
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Email</label>
              <div className="px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500 font-medium">
                {user?.email}
              </div>
            </div>

            <div className="pt-2">
              <button onClick={handleSaveProfile} disabled={saving} className="w-full flex items-center justify-center gap-2 text-sm font-bold px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:active:scale-100">
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                  : <><Save size={16} />Save Profile</>
                }
              </button>
            </div>
          </div>
        )}

        {/* PASSWORD SECTION */}
        {section === 'password' && (
          <div className="px-6 py-6 space-y-5">
            {[
              { label: 'Current Password', val: currentPw, set: setCurrentPw, show: showCurrentPw, toggle: () => setShowCurrentPw(!showCurrentPw), auto: 'current-password' },
              { label: 'New Password', val: newPw, set: (v) => { setPwTouched(true); setNewPw(v); }, show: showNewPw, toggle: () => setShowNewPw(!showNewPw), auto: 'new-password' },
            ].map(({ label, val, set, show, toggle, auto }) => (
              <div key={label}>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">{label}</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} value={val}
                    onChange={(e) => set(e.target.value)}
                    autoComplete={auto}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm"
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button type="button" onClick={toggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {label === 'New Password' && pwTouched && newPw && (
                  <div className="mt-3 flex gap-3 flex-wrap">
                    {[{k:'length',l:'6+ chars'},{k:'letter',l:'Letter'},{k:'number',l:'Number'}].map(({k,l}) => (
                      <div key={k} className={`flex items-center gap-1.5 text-xs font-medium ${rules[k] ? 'text-green-500' : 'text-gray-400'}`}>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${rules[k] ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Check size={8} />
                        </div>
                        {l}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Confirm */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Confirm New Password</label>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
                className={`w-full px-4 py-2.5 bg-white border ${confirmPw && confirmPw !== newPw ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-200'} rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm`}
              />
              {confirmPw && confirmPw !== newPw && (
                <p className="text-xs mt-2 text-red-500">Passwords do not match.</p>
              )}
            </div>

            <div className="pt-4 mt-2 border-t border-gray-100">
              <button onClick={handleSavePassword}
                disabled={saving || !currentPw || !allRulesPass || newPw !== confirmPw}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:active:scale-100">
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                  : <><Lock size={16} />Change Password</>
                }
              </button>
              <p className="text-center text-xs text-gray-500 font-medium mt-3">
                You will remain logged in after changing your password.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProfileModal;
