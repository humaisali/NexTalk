import { useState, useRef } from 'react';
import { startConversation } from '../services/api';
import { FiX, FiSearch, FiMessageCircle, FiHash } from 'react-icons/fi';

/**
 * StartConversation — modal for starting a new private chat.
 * User enters the other person's NexTalk number (+100 XXXXXXX),
 * the API finds or creates the conversation, then calls onStart.
 *
 * Props:
 *   onStart — fn(conversation) called when conversation is ready
 *   onClose — fn()
 */
const StartConversation = ({ onStart, onClose }) => {
  const [suffix,    setSuffix]    = useState('');
  const [preview,   setPreview]   = useState(null);  // { username, avatar, nexTalkNumber, isOnline }
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const inputRef                  = useRef(null);

  const digits = suffix.replace(/\D/g, '').slice(0, 7);
  const fullNumber = digits.length === 7 ? `+100${digits}` : '';

  const handleInput = (e) => {
    setError('');
    setPreview(null);
    setSuffix(e.target.value.replace(/\D/g, '').slice(0, 7));
  };

  // Look up user without creating conversation yet
  const handleSearch = async () => {
    if (digits.length < 7) { setError('Enter all 7 digits.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await startConversation(fullNumber);
      // API returns the conversation — extract the other participant for preview
      onStart?.(data.conversation);
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.message || 'User not found. Check the number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div
      className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="w-full max-w-sm bg-nt-surface border border-nt-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-nt-border bg-nt-surface2/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-nt-blue/15 border border-nt-blue/25 flex items-center justify-center">
              <FiMessageCircle size={15} className="text-nt-blue" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-nt-text">New Message</h3>
              <p className="text-xs text-nt-muted">Enter a NexTalk number</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-nt-muted hover:text-nt-text hover:bg-nt-surface rounded-lg transition-all">
            <FiX size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          <div>
            <p className="text-xs text-nt-muted mb-3 leading-relaxed">
              Enter the 7-digit part of a NexTalk number to start a private conversation. Ask your contact to share their number with you.
            </p>

            {/* Number input */}
            <div className="flex items-center rounded-xl border border-nt-border bg-nt-surface2 overflow-hidden focus-within:border-nt-blue/50 transition-all">
              {/* Fixed prefix */}
              <div className="flex items-center gap-1.5 px-3 py-3 bg-nt-surface border-r border-nt-border flex-shrink-0">
                <FiHash size={12} className="text-nt-blue" />
                <span className="text-sm font-bold text-nt-blue tracking-wider">+100</span>
              </div>

              {/* 7-digit input */}
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={digits}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="1234567"
                maxLength={7}
                autoFocus
                className="flex-1 bg-transparent text-nt-text placeholder-nt-muted text-sm px-3 py-3 outline-none font-mono tracking-widest"
              />

              {/* Digit counter */}
              <span className={`text-xs px-3 tabular-nums ${digits.length === 7 ? 'text-nt-success' : 'text-nt-muted'}`}>
                {digits.length}/7
              </span>
            </div>

            {/* Full number preview */}
            {digits.length === 7 && (
              <p className="text-xs text-nt-muted mt-1.5 px-1 font-mono">
                Looking for: <strong className="text-nt-text">+100 {digits}</strong>
              </p>
            )}

            {/* Error */}
            {error && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-nt-danger/10 border border-nt-danger/30 text-nt-danger text-xs">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1 border border-nt-border text-sm">
            Cancel
          </button>
          <button
            onClick={handleSearch}
            disabled={digits.length < 7 || loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
          >
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Finding…</>
              : <><FiSearch size={14} /> Start Chat</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartConversation;
