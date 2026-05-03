import { useState, useRef } from 'react';
import { startConversation } from '../services/api';
import { X, MessageCircle, Search, Hash } from 'lucide-react';

const StartConversation = ({ onStart, onClose }) => {
  const [suffix,  setSuffix]  = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef              = useRef(null);

  const digits     = suffix.replace(/\D/g, '').slice(0, 7);
  const fullNumber = digits.length === 7 ? `+100${digits}` : '';

  const handleSearch = async () => {
    if (digits.length < 7) { setError('Enter all 7 digits.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await startConversation(fullNumber);
      onStart?.(data.conversation);
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.message || 'User not found. Check the number.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)' }}
         onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="w-full max-w-sm rounded-nt-xl overflow-hidden shadow-nt-float border animate-slide-up"
           style={{ background: '#012B26', borderColor: '#025A50' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b"
             style={{ borderColor: '#025A50', background: '#013E37' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-nt flex items-center justify-center"
                 style={{ background: 'rgba(255,239,178,0.1)', border: '1px solid rgba(255,239,178,0.2)' }}>
              <MessageCircle size={15} style={{ color: '#FFEFB2' }} />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#FFEFB2' }}>New Message</h3>
              <p className="text-xs" style={{ color: '#7A9E99' }}>Enter a NexTalk number</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: '#7A9E99' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#FFEFB2'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#7A9E99'}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          <p className="text-xs leading-relaxed" style={{ color: '#7A9E99' }}>
            Enter the 7-digit NexTalk number to start a private conversation.
          </p>

          {/* Number input */}
          <div className="flex items-center rounded-nt border overflow-hidden transition-all"
               style={{ background: '#011F1B', borderColor: '#025A50' }}>
            <div className="flex items-center gap-1.5 px-3 py-3 border-r flex-shrink-0"
                 style={{ background: 'rgba(255,239,178,0.06)', borderColor: '#025A50' }}>
              <Hash size={12} style={{ color: '#60D4C8' }} />
              <span className="text-sm font-bold tracking-widest" style={{ color: '#FFEFB2' }}>+100</span>
            </div>
            <input type="text" inputMode="numeric" value={digits}
              onChange={(e) => { setError(''); setSuffix(e.target.value.replace(/\D/g,'').slice(0,7)); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="1234567" maxLength={7} autoFocus ref={inputRef}
              className="flex-1 bg-transparent text-sm px-3 py-3 outline-none font-mono tracking-widest"
              style={{ color: '#FFEFB2', caretColor: '#FFEFB2' }}
            />
            <span className="text-xs px-3 tabular-nums flex-shrink-0"
                  style={{ color: digits.length === 7 ? '#4ADE80' : '#7A9E99' }}>
              {digits.length}/7
            </span>
          </div>

          {digits.length === 7 && (
            <p className="text-xs font-mono" style={{ color: '#7A9E99' }}>
              Looking for: <strong style={{ color: '#FFEFB2' }}>+100 {digits}</strong>
            </p>
          )}

          {error && (
            <div className="px-3 py-2.5 rounded-nt text-xs border"
                 style={{ background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.3)', color: '#F87171' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1 text-sm">Cancel</button>
          <button onClick={handleSearch}
            disabled={digits.length < 7 || loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
            {loading
              ? <><div className="w-4 h-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />Finding…</>
              : <><Search size={14} />Start Chat</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartConversation;
