import { useState, useEffect, useRef } from 'react';
import { checkNumber } from '../services/api';
import { Check, X, Loader, Hash } from 'lucide-react';

const NexTalkNumberPicker = ({ value, onChange, onStatus, lightMode = false }) => {
  const [suffix,  setSuffix]  = useState(value?.replace('+100', '') || '');
  const [status,  setStatus]  = useState(null);
  const [message, setMessage] = useState('');
  const debounceRef           = useRef(null);
  const mounted               = useRef(true);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(debounceRef.current); }; }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const digits = suffix.replace(/\D/g, '').slice(0, 7);
    if (digits.length === 0) {
      setStatus(null); setMessage('');
      onStatus?.({ valid: false, available: false }); onChange?.(''); return;
    }
    if (digits.length < 7) {
      setStatus('invalid'); setMessage(`${digits.length}/7 digits`);
      onStatus?.({ valid: false, available: false }); onChange?.(''); return;
    }
    const fullNumber = `+100${digits}`;
    setStatus('checking'); setMessage('Checking…');
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await checkNumber(fullNumber);
        if (!mounted.current) return;
        if (data.available) {
          setStatus('available'); setMessage('Available');
          onStatus?.({ valid: true, available: true }); onChange?.(fullNumber);
        } else {
          setStatus('taken'); setMessage('Already taken');
          onStatus?.({ valid: false, available: false }); onChange?.('');
        }
      } catch (err) {
        if (!mounted.current) return;
        if (err?.response?.status === 429) {
          setStatus('warning'); setMessage('Please wait…');
          debounceRef.current = setTimeout(async () => {
            try {
              const { data } = await checkNumber(fullNumber);
              if (!mounted.current) return;
              if (data.available) { setStatus('available'); setMessage('Available'); onStatus?.({ valid: true, available: true }); onChange?.(fullNumber); }
              else { setStatus('taken'); setMessage('Already taken'); onStatus?.({ valid: false, available: false }); onChange?.(''); }
            } catch { if (mounted.current) { setStatus('invalid'); setMessage('Try again'); onStatus?.({ valid: false, available: false }); onChange?.(''); } }
          }, 3000);
        } else {
          setStatus('invalid'); setMessage('Try again');
          onStatus?.({ valid: false, available: false }); onChange?.('');
        }
      }
    }, 800);
  }, [suffix]);

  const digits = suffix.replace(/\D/g, '');

  const textColor    = lightMode ? '#013E37' : '#FFEFB2';
  const mutedColor   = lightMode ? 'rgba(1,62,55,0.4)' : 'rgba(255,239,178,0.4)';
  const borderColor  = lightMode ? '#013E37' : '#025A50';
  const bgColor      = lightMode ? 'rgba(1,62,55,0.05)' : 'rgba(255,239,178,0.05)';
  const prefixBg     = lightMode ? 'rgba(1,62,55,0.08)' : 'rgba(255,239,178,0.08)';

  const statusColor  = { available: '#4ADE80', taken: '#F87171', invalid: '#FCD34D', warning: '#FCD34D', checking: mutedColor }[status] || mutedColor;

  return (
    <div>
      <label style={{ color: mutedColor }} className="block text-xs font-semibold mb-2 uppercase tracking-widest">
        NexTalk Number
      </label>
      <p style={{ color: mutedColor, fontSize: '11px' }} className="mb-2.5 leading-relaxed">
        Choose a unique 7-digit ID. Others use this to message you privately.
      </p>

      <div className="flex items-center rounded-lg overflow-hidden border transition-all"
           style={{ borderColor, background: bgColor }}>
        {/* Prefix */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 border-r flex-shrink-0"
             style={{ background: prefixBg, borderColor }}>
          <Hash size={12} style={{ color: status === 'available' ? '#4ADE80' : textColor }} />
          <span className="text-sm font-bold tracking-widest" style={{ color: textColor }}>+100</span>
        </div>

        {/* Input */}
        <input
          type="text" inputMode="numeric" value={digits}
          onChange={(e) => setSuffix(e.target.value.replace(/\D/g,'').slice(0,7))}
          placeholder="1234567" maxLength={7}
          style={{ color: textColor, caretColor: '#FFEFB2' }}
          className="flex-1 bg-transparent text-sm px-3 py-2.5 outline-none font-mono tracking-widest placeholder-opacity-30"
        />

        {/* Status icon */}
        <div className="px-3 flex-shrink-0">
          {status === 'checking' || status === 'warning'
            ? <Loader size={14} className="animate-spin" style={{ color: mutedColor }} />
            : status === 'available' ? <Check size={14} style={{ color: '#4ADE80' }} />
            : (status === 'taken' || status === 'invalid') ? <X size={14} style={{ color: '#F87171' }} />
            : null
          }
        </div>
      </div>

      <div className="flex items-center justify-between mt-1.5 px-0.5">
        <span className="font-mono text-xs" style={{ color: mutedColor }}>
          {digits.length === 7 ? `+100 ${digits}` : ''}
        </span>
        {message && <span className="text-xs" style={{ color: statusColor }}>{message}</span>}
      </div>
    </div>
  );
};

export default NexTalkNumberPicker;
