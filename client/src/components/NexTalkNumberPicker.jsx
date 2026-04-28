import { useState, useEffect, useRef } from 'react';
import { checkNumber } from '../services/api';
import { FiCheck, FiX, FiLoader, FiHash } from 'react-icons/fi';

/**
 * NexTalkNumberPicker
 *
 * Lets a user choose their unique 7-digit suffix.
 * The prefix "+100" is fixed and displayed in the UI.
 * Performs a real-time availability check as they type.
 *
 * Props:
 *   value     — current full number value ("+1001234567")
 *   onChange  — fn(fullNumber) called when valid+available
 *   onStatus  — fn({ valid, available }) for parent form validation
 */
const NexTalkNumberPicker = ({ value, onChange, onStatus }) => {
  // Store only the 7-digit suffix locally
  const [suffix,    setSuffix]    = useState(value?.replace('+100', '') || '');
  const [status,    setStatus]    = useState(null); // null | 'checking' | 'available' | 'taken' | 'invalid'
  const [message,   setMessage]   = useState('');
  const debounceRef               = useRef(null);

  useEffect(() => {
    // Clean and validate suffix
    const cleaned = suffix.replace(/\D/g, '').slice(0, 7);

    if (cleaned.length === 0) {
      setStatus(null); setMessage('');
      onStatus?.({ valid: false, available: false });
      onChange?.('');
      return;
    }

    if (cleaned.length < 7) {
      setStatus('invalid');
      setMessage(`${cleaned.length}/7 digits entered`);
      onStatus?.({ valid: false, available: false });
      onChange?.('');
      return;
    }

    // Exactly 7 digits — check availability
    const fullNumber = `+100${cleaned}`;
    setStatus('checking');
    setMessage('Checking availability…');

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await checkNumber(fullNumber);
        if (data.available) {
          setStatus('available');
          setMessage('Available! ✓');
          onStatus?.({ valid: true, available: true });
          onChange?.(fullNumber);
        } else {
          setStatus('taken');
          setMessage('Already taken — try a different number');
          onStatus?.({ valid: false, available: false });
          onChange?.('');
        }
      } catch {
        setStatus('invalid');
        setMessage('Could not verify — try again');
        onStatus?.({ valid: false, available: false });
        onChange?.('');
      }
    }, 600);

    return () => clearTimeout(debounceRef.current);
  }, [suffix]);

  const handleInput = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 7);
    setSuffix(digits);
  };

  const statusColor = {
    available: 'text-nt-success border-nt-success/50',
    taken:     'text-nt-danger  border-nt-danger/50',
    invalid:   'text-nt-warning border-nt-warning/50',
    checking:  'text-nt-muted   border-nt-border',
  }[status] || 'text-nt-muted border-nt-border';

  const StatusIcon = () => {
    if (status === 'checking')  return <FiLoader size={14} className="animate-spin text-nt-muted" />;
    if (status === 'available') return <FiCheck  size={14} className="text-nt-success" />;
    if (status === 'taken')     return <FiX      size={14} className="text-nt-danger"  />;
    return null;
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-nt-muted mb-1.5 uppercase tracking-wider">
        NexTalk Number
      </label>

      {/* Explanation */}
      <p className="text-xs text-nt-muted/80 mb-2 leading-relaxed">
        Choose a unique 7-digit number. This is your NexTalk ID — share it with others so they can message you privately.
      </p>

      {/* Input row */}
      <div className={`flex items-center gap-0 rounded-xl border bg-nt-surface2 overflow-hidden transition-all ${statusColor}`}>
        {/* Fixed prefix */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-nt-surface border-r border-nt-border flex-shrink-0">
          <FiHash size={13} className="text-nt-blue" />
          <span className="text-sm font-bold text-nt-blue tracking-wider">+100</span>
        </div>

        {/* 7-digit input */}
        <input
          type="text"
          inputMode="numeric"
          value={suffix}
          onChange={handleInput}
          placeholder="1234567"
          maxLength={7}
          className="flex-1 bg-transparent text-nt-text placeholder-nt-muted text-sm px-3 py-2.5 outline-none font-mono tracking-widest"
        />

        {/* Status icon */}
        <div className="px-3 flex-shrink-0">
          <StatusIcon />
        </div>
      </div>

      {/* Preview + status message */}
      <div className="flex items-center justify-between mt-1.5 px-1">
        {suffix.replace(/\D/g, '').length === 7 && (
          <span className="text-xs text-nt-muted font-mono">
            Your number: <strong className="text-nt-text">+100 {suffix.replace(/\D/g, '')}</strong>
          </span>
        )}
        {message && (
          <span className={`text-xs ml-auto ${
            status === 'available' ? 'text-nt-success' :
            status === 'taken'     ? 'text-nt-danger'  :
            status === 'invalid'   ? 'text-nt-warning' : 'text-nt-muted'
          }`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
};

export default NexTalkNumberPicker;
