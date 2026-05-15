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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
         onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-white shadow-xl animate-slide-up border border-gray-100">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 shadow-sm border border-blue-100">
              <MessageCircle size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">New Message</h3>
              <p className="text-xs font-medium text-gray-500">Enter a NexTalk number</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          <p className="text-sm leading-relaxed text-gray-600">
            Enter the 7-digit NexTalk number to start a private conversation.
          </p>

          {/* Number input */}
          <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden transition-all bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400">
            <div className="flex items-center gap-1.5 px-4 py-3.5 border-r border-gray-200 bg-gray-50 flex-shrink-0">
              <Hash size={14} className="text-blue-500" />
              <span className="text-sm font-bold tracking-widest text-gray-700">+100</span>
            </div>
            <input type="text" inputMode="numeric" value={digits}
              onChange={(e) => { setError(''); setSuffix(e.target.value.replace(/\D/g,'').slice(0,7)); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="1234567" maxLength={7} autoFocus ref={inputRef}
              className="flex-1 bg-transparent text-sm px-4 py-3.5 outline-none font-mono tracking-widest text-gray-800 placeholder-gray-400"
            />
            <span className={`text-xs px-3 tabular-nums font-medium flex-shrink-0 ${digits.length === 7 ? 'text-green-500' : 'text-gray-400'}`}>
              {digits.length}/7
            </span>
          </div>

          {digits.length === 7 && (
            <p className="text-xs font-mono font-medium text-gray-500">
              Looking for: <strong className="text-gray-800">+100 {digits}</strong>
            </p>
          )}

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm border border-red-200 bg-red-50 text-red-600 font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 text-sm font-semibold py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button onClick={handleSearch}
            disabled={digits.length < 7 || loading}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:active:scale-100">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Finding…</>
              : <><Search size={16} />Start Chat</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartConversation;
