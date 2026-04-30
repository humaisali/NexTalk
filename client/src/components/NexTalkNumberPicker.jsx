import { useState, useEffect, useRef } from 'react';
import { checkNumber } from '../services/api';
import { FiCheck, FiX, FiLoader, FiHash } from 'react-icons/fi';

/**
 * NexTalkNumberPicker
 *
 * Fixed:
 * - 429 rate-limit errors handled gracefully (shown as "try again" not invalid)
 * - Debounce increased to 800ms to reduce API calls while typing
 * - Pending check cancelled cleanly on unmount
 */
const NexTalkNumberPicker = ({ value, onChange, onStatus }) => {
  const [suffix,  setSuffix]  = useState(value?.replace('+100', '') || '');
  const [status,  setStatus]  = useState(null);
  const [message, setMessage] = useState('');
  const debounceRef           = useRef(null);
  const mounted               = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearTimeout(debounceRef.current); };
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);

    const digits = suffix.replace(/\D/g, '').slice(0, 7);

    if (digits.length === 0) {
      setStatus(null); setMessage('');
      onStatus?.({ valid: false, available: false });
      onChange?.('');
      return;
    }

    if (digits.length < 7) {
      setStatus('invalid');
      setMessage(`${digits.length} / 7 digits entered`);
      onStatus?.({ valid: false, available: false });
      onChange?.('');
      return;
    }

    // Exactly 7 digits — debounce the API call
    const fullNumber = `+100${digits}`;
    setStatus('checking');
    setMessage('Checking availability…');

    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await checkNumber(fullNumber);
        if (!mounted.current) return;

        if (data.available) {
          setStatus('available');
          setMessage('Number available!');
          onStatus?.({ valid: true, available: true });
          onChange?.(fullNumber);
        } else {
          setStatus('taken');
          setMessage('Already taken — try a different number');
          onStatus?.({ valid: false, available: false });
          onChange?.('');
        }
      } catch (err) {
        if (!mounted.current) return;
        const is429 = err?.response?.status === 429;
        if (is429) {
          // Rate limited — don't block user, let them continue
          setStatus('warning');
          setMessage('Checking paused — please wait a moment');
          // Retry automatically after 3s
          debounceRef.current = setTimeout(async () => {
            if (!mounted.current) return;
            try {
              const { data } = await checkNumber(fullNumber);
              if (!mounted.current) return;
              if (data.available) {
                setStatus('available'); setMessage('Number available!');
                onStatus?.({ valid: true, available: true }); onChange?.(fullNumber);
              } else {
                setStatus('taken'); setMessage('Already taken — try a different number');
                onStatus?.({ valid: false, available: false }); onChange?.('');
              }
            } catch {
              if (!mounted.current) return;
              setStatus('invalid'); setMessage('Could not verify — try again');
              onStatus?.({ valid: false, available: false }); onChange?.('');
            }
          }, 3000);
        } else {
          setStatus('invalid');
          setMessage('Could not verify — please try again');
          onStatus?.({ valid: false, available: false });
          onChange?.('');
        }
      }
    }, 800);
  }, [suffix]);

  const handleInput = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 7);
    setSuffix(digits);
  };

  const borderColor = {
    available: 'border-nt-success/60 focus-within:border-nt-success',
    taken:     'border-nt-danger/60  focus-within:border-nt-danger',
    invalid:   'border-nt-warning/50 focus-within:border-nt-warning',
    warning:   'border-nt-warning/50 focus-within:border-nt-warning',
    checking:  'border-nt-border    focus-within:border-nt-blue/50',
  }[status] || 'border-nt-border focus-within:border-nt-blue/50';

  const msgColor = {
    available: 'text-nt-success',
    taken:     'text-nt-danger',
    invalid:   'text-nt-warning',
    warning:   'text-nt-warning',
    checking:  'text-nt-muted',
  }[status] || 'text-nt-muted';

  const digits = suffix.replace(/\D/g, '');

  return (
    <div>
      <label className="block text-xs font-semibold text-nt-muted mb-1.5 uppercase tracking-wider">
        NexTalk Number
      </label>
      <p className="text-xs text-nt-muted/80 mb-2.5 leading-relaxed">
        Choose a unique 7-digit number. This is your personal NexTalk ID — others use it to message you privately.
      </p>

      {/* Input */}
      <div className={`flex items-center rounded-xl border bg-nt-surface2 overflow-hidden transition-all ${borderColor}`}>
        {/* Fixed prefix */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-nt-surface border-r border-nt-border flex-shrink-0">
          <FiHash size={13} className="text-nt-blue flex-shrink-0" />
          <span className="text-sm font-bold text-nt-blue tracking-widest">+100</span>
        </div>

        {/* 7-digit suffix */}
        <input
          type="text"
          inputMode="numeric"
          value={digits}
          onChange={handleInput}
          placeholder="1234567"
          maxLength={7}
          className="flex-1 bg-transparent text-nt-text placeholder-nt-muted text-sm px-3 py-2.5 outline-none font-mono tracking-widest"
        />

        {/* Status icon */}
        <div className="px-3 flex-shrink-0">
          {status === 'checking' || status === 'warning'
            ? <FiLoader size={14} className="animate-spin text-nt-muted" />
            : status === 'available'
            ? <FiCheck  size={14} className="text-nt-success" />
            : status === 'taken' || status === 'invalid'
            ? <FiX      size={14} className="text-nt-danger" />
            : null
          }
        </div>
      </div>

      {/* Preview + status message */}
      <div className="flex items-center justify-between mt-1.5 px-0.5">
        <span className="text-xs text-nt-muted/60 font-mono">
          {digits.length === 7 ? `+100 ${digits}` : ''}
        </span>
        {message && (
          <span className={`text-xs ${msgColor}`}>{message}</span>
        )}
      </div>
    </div>
  );
};

export default NexTalkNumberPicker;
