import { useState, useRef } from 'react';
import { useAuth }      from '../context/AuthContext';
import { useToast }     from '../context/ToastContext';
import { updateProfile } from '../services/api';
import { X, Lock, Camera, Check, Eye, EyeOff, Save, Trash2, Hash, User, Shield } from 'lucide-react';

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

  const inputStyle = {
    borderBottom: '1.5px solid #025A50', background: 'transparent',
    color: '#FFEFB2', caretColor: '#FFEFB2',
    outline: 'none', width: '100%', fontSize: '14px', padding: '8px 0',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)' }}
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-nt-xl overflow-hidden shadow-nt-float border animate-slide-up"
           style={{ background: '#012B26', borderColor: '#025A50' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b"
             style={{ borderColor: '#025A50', background: '#013E37' }}>
          <h3 className="text-base font-bold" style={{ color: '#FFEFB2' }}>Edit Profile</h3>
          <button onClick={onClose} style={{ color: '#7A9E99' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#FFEFB2'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#7A9E99'}>
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: '#025A50' }}>
          {[{ key:'profile', label:'Profile', icon: User }, { key:'password', label:'Password', icon: Lock }].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setSection(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-all
                ${section === key ? 'border-primary text-primary' : 'border-transparent text-nt-muted hover:text-nt-text2'}`}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        {/* PROFILE SECTION */}
        {section === 'profile' && (
          <div className="px-6 py-5 space-y-5">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 flex items-center justify-center"
                     style={{ borderColor: '#025A50', background: hasImg ? 'transparent' : 'linear-gradient(135deg, #FFEFB2, #F5DC6E)' }}>
                  {hasImg
                    ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                    : <span className="text-3xl font-black" style={{ color: '#013E37' }}>{user?.username?.[0]?.toUpperCase()}</span>
                  }
                </div>
                <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                     style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <Camera size={22} style={{ color: '#FFEFB2' }} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-nt border transition-all"
                  style={{ borderColor: '#025A50', color: '#7A9E99' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FFEFB2'; e.currentTarget.style.color = '#FFEFB2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#025A50'; e.currentTarget.style.color = '#7A9E99'; }}>
                  <Camera size={11} />{avatarPreview ? 'Change photo' : 'Upload photo'}
                </button>
                {avatarPreview && (
                  <button onClick={() => { setAvatarPreview(''); setAvatarChanged(true); }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-nt border transition-all"
                    style={{ borderColor: 'rgba(248,113,113,0.4)', color: '#F87171' }}>
                    <Trash2 size={11} />Remove
                  </button>
                )}
              </div>
              <p className="text-xs" style={{ color: 'rgba(122,158,153,0.5)' }}>JPG, PNG · Max 500KB</p>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-widest" style={{ color: '#7A9E99' }}>Username</label>
              <input value={username} onChange={(e) => { setUsernameError(''); setUsername(e.target.value); }}
                placeholder="Your username" style={inputStyle}
                onFocus={(e) => e.target.style.borderBottomColor = '#FFEFB2'}
                onBlur={(e)  => e.target.style.borderBottomColor = '#025A50'}
              />
              {usernameError && <p className="text-xs mt-1.5" style={{ color: '#F87171' }}>{usernameError}</p>}
            </div>

            {/* NexTalk number (read-only) */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-widest" style={{ color: '#7A9E99' }}>NexTalk Number</label>
              <div className="flex items-center gap-2 px-0 py-2 border-b" style={{ borderColor: '#025A50' }}>
                <Hash size={13} style={{ color: '#60D4C8' }} />
                <span className="font-mono text-sm font-semibold" style={{ color: '#FFEFB2' }}>
                  {user?.nexTalkNumber?.replace(/^(\+100)(\d{7})$/, '+100 $2') || '—'}
                </span>
                <span className="ml-auto text-xs" style={{ color: 'rgba(122,158,153,0.5)' }}>Cannot be changed</span>
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-widest" style={{ color: '#7A9E99' }}>Email</label>
              <div className="py-2 border-b text-sm" style={{ borderColor: '#025A50', color: '#7A9E99' }}>
                {user?.email}
              </div>
            </div>

            <button onClick={handleSaveProfile} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
              {saving
                ? <><div className="w-4 h-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />Saving…</>
                : <><Save size={14} />Save Profile</>
              }
            </button>
          </div>
        )}

        {/* PASSWORD SECTION */}
        {section === 'password' && (
          <div className="px-6 py-5 space-y-4">
            {[
              { label: 'Current Password', val: currentPw, set: setCurrentPw, show: showCurrentPw, toggle: () => setShowCurrentPw(!showCurrentPw), auto: 'current-password' },
              { label: 'New Password', val: newPw, set: (v) => { setPwTouched(true); setNewPw(v); }, show: showNewPw, toggle: () => setShowNewPw(!showNewPw), auto: 'new-password' },
            ].map(({ label, val, set, show, toggle, auto }) => (
              <div key={label}>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-widest" style={{ color: '#7A9E99' }}>{label}</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} value={val}
                    onChange={(e) => set(e.target.value)}
                    style={{ ...inputStyle, paddingRight: '2rem' }} autoComplete={auto}
                    onFocus={(e) => e.target.style.borderBottomColor = '#FFEFB2'}
                    onBlur={(e)  => e.target.style.borderBottomColor = '#025A50'}
                  />
                  <button type="button" onClick={toggle}
                    className="absolute right-0 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#7A9E99' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#FFEFB2'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#7A9E99'}>
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {label === 'New Password' && pwTouched && newPw && (
                  <div className="mt-2 flex gap-4 flex-wrap">
                    {[{k:'length',l:'6+ chars'},{k:'letter',l:'Letter'},{k:'number',l:'Number'}].map(({k,l}) => (
                      <div key={k} className="flex items-center gap-1 text-xs"
                           style={{ color: rules[k] ? '#4ADE80' : 'rgba(122,158,153,0.5)' }}>
                        <Check size={10} style={{ opacity: rules[k] ? 1 : 0.3 }} />{l}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Confirm */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-widest" style={{ color: '#7A9E99' }}>Confirm New Password</label>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                style={{ ...inputStyle, borderBottomColor: confirmPw && confirmPw !== newPw ? '#F87171' : '#025A50' }}
                autoComplete="new-password"
                onFocus={(e) => e.target.style.borderBottomColor = '#FFEFB2'}
                onBlur={(e)  => e.target.style.borderBottomColor = confirmPw && confirmPw !== newPw ? '#F87171' : '#025A50'}
              />
              {confirmPw && confirmPw !== newPw && (
                <p className="text-xs mt-1.5" style={{ color: '#F87171' }}>Passwords do not match.</p>
              )}
            </div>

            <button onClick={handleSavePassword}
              disabled={saving || !currentPw || !allRulesPass || newPw !== confirmPw}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {saving
                ? <><div className="w-4 h-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />Saving…</>
                : <><Lock size={14} />Change Password</>
              }
            </button>
            <p className="text-center text-xs" style={{ color: 'rgba(122,158,153,0.5)' }}>
              You will remain logged in after changing your password.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProfileModal;
