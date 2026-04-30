import { useState, useRef } from 'react';
import { useAuth }      from '../context/AuthContext';
import { useToast }     from '../context/ToastContext';
import { updateProfile } from '../services/api';
import {
  FiX, FiUser, FiLock, FiCamera, FiCheck,
  FiEye, FiEyeOff, FiSave, FiTrash2, FiHash
} from 'react-icons/fi';

const pwRules = (pw) => ({
  length: pw.length >= 6,
  letter: /[a-zA-Z]/.test(pw),
  number: /\d/.test(pw),
});

/**
 * EditProfileModal — full profile editor.
 *
 * Sections:
 *   1. Avatar — upload image (stored as base64), or clear it
 *   2. Username — change with uniqueness check
 *   3. Password — change with current password verification + strength rules
 *
 * Props:
 *   onClose — fn()
 */
const EditProfileModal = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const toast                = useToast();

  // ── Avatar state ─────────────────────────────────────────────────
  const [avatarPreview,  setAvatarPreview]  = useState(user?.avatar || '');
  const [avatarChanged,  setAvatarChanged]  = useState(false);
  const fileInputRef                        = useRef(null);

  // ── Username state ────────────────────────────────────────────────
  const [username,       setUsername]       = useState(user?.username || '');
  const [usernameError,  setUsernameError]  = useState('');

  // ── Password state ────────────────────────────────────────────────
  const [currentPw,      setCurrentPw]      = useState('');
  const [newPw,          setNewPw]          = useState('');
  const [confirmPw,      setConfirmPw]      = useState('');
  const [showCurrentPw,  setShowCurrentPw]  = useState(false);
  const [showNewPw,      setShowNewPw]      = useState(false);
  const [pwTouched,      setPwTouched]      = useState(false);

  // ── Save state ────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState('profile'); // 'profile' | 'password'

  const rules        = pwRules(newPw);
  const allRulesPass = Object.values(rules).every(Boolean);

  // ── Avatar handlers ───────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 512 * 1024) {
      toast.error('Image too large. Please choose an image under 500KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result);
      setAvatarChanged(true);
    };
    reader.readAsDataURL(file);
  };

  const clearAvatar = () => {
    setAvatarPreview('');
    setAvatarChanged(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Save profile (username + avatar) ─────────────────────────────
  const handleSaveProfile = async () => {
    setUsernameError('');
    const trimmed = username.trim();

    if (trimmed.length < 3) {
      setUsernameError('Username must be at least 3 characters.');
      return;
    }

    const noUsernameChange = trimmed === user?.username;
    const noAvatarChange   = !avatarChanged;

    if (noUsernameChange && noAvatarChange) {
      toast.info('No changes to save.');
      return;
    }

    setSaving(true);
    try {
      const payload = {};
      if (!noUsernameChange) payload.username = trimmed;
      if (!noAvatarChange)   payload.avatar   = avatarPreview;

      const { data } = await updateProfile(payload);
      updateUser(data.user);
      toast.success('Profile updated!');
      setAvatarChanged(false);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update profile.';
      if (msg.toLowerCase().includes('username')) setUsernameError(msg);
      else toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Save password ─────────────────────────────────────────────────
  const handleSavePassword = async () => {
    setPwTouched(true);

    if (!currentPw)         { toast.error('Enter your current password.'); return; }
    if (!allRulesPass)      { toast.error('New password does not meet requirements.'); return; }
    if (newPw !== confirmPw){ toast.error('Passwords do not match.'); return; }

    setSaving(true);
    try {
      await updateProfile({ currentPassword: currentPw, newPassword: newPw });
      toast.success('Password changed successfully!');
      setCurrentPw(''); setNewPw(''); setConfirmPw(''); setPwTouched(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  // ── Avatar display ────────────────────────────────────────────────
  const initials = (user?.username || 'U')[0].toUpperCase();
  const showImg  = avatarPreview && avatarPreview.startsWith('data:');

  return (
    <div
      className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-nt-surface border border-nt-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-nt-border bg-nt-surface2/50">
          <h3 className="text-base font-bold text-nt-text">Edit Profile</h3>
          <button onClick={onClose} className="p-1.5 text-nt-muted hover:text-nt-text hover:bg-nt-surface rounded-lg transition-all">
            <FiX size={16} />
          </button>
        </div>

        {/* ── Tab bar ─────────────────────────────────────────────── */}
        <div className="flex border-b border-nt-border">
          {[
            { key: 'profile',  label: 'Profile',  icon: <FiUser size={13} /> },
            { key: 'password', label: 'Password', icon: <FiLock size={13} /> }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-all
                ${section === key
                  ? 'text-nt-blue border-nt-blue bg-nt-blue/5'
                  : 'text-nt-muted border-transparent hover:text-nt-text hover:bg-nt-surface2'}`}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* ── PROFILE SECTION ─────────────────────────────────────── */}
        {section === 'profile' && (
          <div className="px-6 py-5 space-y-5">

            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                {/* Avatar circle */}
                <div className={`w-24 h-24 rounded-full border-2 border-nt-border flex items-center justify-center overflow-hidden
                  ${showImg ? '' : 'bg-gradient-to-br from-nt-blue/80 to-nt-cyan/60'}`}>
                  {showImg
                    ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                    : <span className="text-3xl font-black text-white">{initials}</span>
                  }
                </div>

                {/* Camera overlay */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center
                    opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <FiCamera size={22} className="text-white" />
                </button>
              </div>

              {/* Upload / clear buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-nt-surface2 border border-nt-border text-nt-muted hover:text-nt-text hover:border-nt-blue/40 transition-all"
                >
                  <FiCamera size={11} />
                  {avatarPreview ? 'Change photo' : 'Upload photo'}
                </button>
                {avatarPreview && (
                  <button
                    onClick={clearAvatar}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-nt-danger/10 border border-nt-danger/30 text-nt-danger hover:bg-nt-danger/20 transition-all"
                  >
                    <FiTrash2 size={11} />
                    Remove
                  </button>
                )}
              </div>

              <p className="text-xs text-nt-muted/60 text-center">
                JPG, PNG or GIF · Max 500KB
              </p>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-nt-muted mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <FiUser size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nt-muted" />
                <input
                  value={username}
                  onChange={(e) => { setUsernameError(''); setUsername(e.target.value); }}
                  placeholder="Your username"
                  className={`nt-input pl-10 ${usernameError ? 'border-nt-danger/60' : ''}`}
                />
              </div>
              {usernameError && (
                <p className="text-xs text-nt-danger mt-1.5 px-0.5">{usernameError}</p>
              )}
            </div>

            {/* NexTalk number — read only */}
            <div>
              <label className="block text-xs font-semibold text-nt-muted mb-1.5 uppercase tracking-wider">
                NexTalk Number
              </label>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-nt-surface border border-nt-border text-nt-muted">
                <FiHash size={13} className="text-nt-blue flex-shrink-0" />
                <span className="font-mono text-sm text-nt-text font-semibold tracking-widest">
                  {user?.nexTalkNumber?.replace(/^(\+100)(\d{7})$/, '+100 $2') || '—'}
                </span>
                <span className="ml-auto text-xs text-nt-muted/60">Cannot be changed</span>
              </div>
            </div>

            {/* Email — read only */}
            <div>
              <label className="block text-xs font-semibold text-nt-muted mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <div className="px-4 py-2.5 rounded-xl bg-nt-surface border border-nt-border text-nt-muted text-sm">
                {user?.email}
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {saving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                : <><FiSave size={14} /> Save Profile</>
              }
            </button>
          </div>
        )}

        {/* ── PASSWORD SECTION ─────────────────────────────────────── */}
        {section === 'password' && (
          <div className="px-6 py-5 space-y-4">

            {/* Current password */}
            <div>
              <label className="block text-xs font-semibold text-nt-muted mb-1.5 uppercase tracking-wider">
                Current Password
              </label>
              <div className="relative">
                <FiLock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nt-muted" />
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Your current password"
                  className="nt-input pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-nt-muted hover:text-nt-text transition-colors"
                >
                  {showCurrentPw ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-xs font-semibold text-nt-muted mb-1.5 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <FiLock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nt-muted" />
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={(e) => { setPwTouched(true); setNewPw(e.target.value); }}
                  placeholder="Your new password"
                  className="nt-input pl-10 pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-nt-muted hover:text-nt-text transition-colors"
                >
                  {showNewPw ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>

              {/* Strength checklist */}
              {pwTouched && newPw && (
                <div className="mt-2 space-y-1 px-0.5">
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

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-semibold text-nt-muted mb-1.5 uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="relative">
                <FiLock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nt-muted" />
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Repeat new password"
                  className={`nt-input pl-10 ${
                    confirmPw && confirmPw !== newPw ? 'border-nt-danger/60' : ''
                  }`}
                  autoComplete="new-password"
                />
              </div>
              {confirmPw && confirmPw !== newPw && (
                <p className="text-xs text-nt-danger mt-1.5 px-0.5">Passwords do not match.</p>
              )}
            </div>

            {/* Save button */}
            <button
              onClick={handleSavePassword}
              disabled={saving || !currentPw || !allRulesPass || newPw !== confirmPw}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {saving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                : <><FiLock size={14} /> Change Password</>
              }
            </button>

            <p className="text-xs text-nt-muted/60 text-center">
              You will remain logged in after changing your password.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProfileModal;
