import { useEffect, useRef, useState } from 'react';
import { Check, Hash, Loader2, X } from 'lucide-react';
import { checkNumber } from '../services/api';

const statusStyles = {
  available: 'text-emerald-600 dark:text-emerald-400',
  taken: 'text-rose-600 dark:text-rose-400',
  invalid: 'text-amber-700 dark:text-amber-300',
  warning: 'text-amber-700 dark:text-amber-300',
  checking: 'text-[var(--text-muted)]',
};

const NexTalkNumberPicker = ({ value, onChange, onStatus }) => {
  const [suffix, setSuffix] = useState(value?.replace('+100', '') || '');
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const debounceRef = useRef(null);
  const mounted = useRef(true);
  const onChangeRef = useRef(onChange);
  const onStatusRef = useRef(onStatus);

  useEffect(() => {
    onChangeRef.current = onChange;
    onStatusRef.current = onStatus;
  }, [onChange, onStatus]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const digits = suffix.replace(/\D/g, '').slice(0, 7);

    if (digits.length === 0) {
      setStatus(null);
      setMessage('');
      onStatusRef.current?.({ valid: false, available: false });
      onChangeRef.current?.('');
      return;
    }

    if (digits.length < 7) {
      setStatus('invalid');
      setMessage(`${digits.length} of 7 digits`);
      onStatusRef.current?.({ valid: false, available: false });
      onChangeRef.current?.('');
      return;
    }

    const fullNumber = `+100${digits}`;
    const applyAvailability = (available) => {
      if (!mounted.current) return;
      setStatus(available ? 'available' : 'taken');
      setMessage(available ? 'Available' : 'Already taken');
      onStatusRef.current?.({ valid: available, available });
      onChangeRef.current?.(available ? fullNumber : '');
    };

    const checkAvailability = async () => {
      try {
        const { data } = await checkNumber(fullNumber);
        applyAvailability(data.available);
      } catch (error) {
        if (!mounted.current) return;
        if (error?.response?.status === 429) {
          setStatus('warning');
          setMessage('Checking again shortly…');
          debounceRef.current = setTimeout(checkAvailability, 3000);
          return;
        }
        setStatus('invalid');
        setMessage('Could not check. Try again.');
        onStatusRef.current?.({ valid: false, available: false });
        onChangeRef.current?.('');
      }
    };

    setStatus('checking');
    setMessage('Checking availability…');
    debounceRef.current = setTimeout(checkAvailability, 800);

    return () => clearTimeout(debounceRef.current);
  }, [suffix]);

  const digits = suffix.replace(/\D/g, '');
  const statusTextClass = statusStyles[status] || 'text-[var(--text-muted)]';

  return (
    <div>
      <label htmlFor="nextalk-number" className="mb-1.5 block text-sm font-semibold text-[var(--text-primary)]">
        NexTalk number
      </label>
      <p id="nextalk-number-help" className="mb-2.5 text-xs leading-5 text-[var(--text-muted)]">
        Choose a unique 7-digit ID people can use to find you.
      </p>

      <div className="flex min-h-12 items-stretch overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--surface-subtle)] transition focus-within:border-[var(--brand)] focus-within:ring-4 focus-within:ring-[var(--focus-ring)]">
        <div className="flex flex-shrink-0 items-center gap-1.5 border-r border-[var(--border)] bg-[var(--surface-muted)] px-3 text-[var(--text-secondary)]">
          <Hash size={15} aria-hidden="true" />
          <span className="font-mono text-sm font-semibold tracking-wide">+100</span>
        </div>
        <input
          id="nextalk-number"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={digits}
          onChange={(event) => setSuffix(event.target.value.replace(/\D/g, '').slice(0, 7))}
          placeholder="1234567"
          maxLength={7}
          aria-describedby="nextalk-number-help nextalk-number-status"
          aria-invalid={status === 'taken' || (status === 'invalid' && digits.length === 7)}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-mono text-sm tracking-[0.14em] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
        />
        <div className={`flex w-11 flex-shrink-0 items-center justify-center ${statusTextClass}`} aria-hidden="true">
          {(status === 'checking' || status === 'warning') && <Loader2 size={17} className="animate-spin" />}
          {status === 'available' && <Check size={17} />}
          {(status === 'taken' || status === 'invalid') && <X size={17} />}
        </div>
      </div>

      <div className="mt-2 flex min-h-5 items-center justify-between gap-3 px-0.5 text-xs">
        <span className="font-mono text-[var(--text-muted)]">
          {digits.length === 7 ? `+100 ${digits}` : ''}
        </span>
        <span id="nextalk-number-status" role="status" aria-live="polite" className={statusTextClass}>
          {message}
        </span>
      </div>
    </div>
  );
};

export default NexTalkNumberPicker;
