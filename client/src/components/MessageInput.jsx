import { useState, useRef, useCallback, useEffect } from 'react';
import { useSocket }    from '../context/SocketContext';
import ToneAnalyzer     from './ToneAnalyzer';
import SmartReplies     from './SmartReplies';
import CodePreview      from './CodePreview';
import useTyping        from '../hooks/useTyping';
import useCodeShare     from '../hooks/useCodeShare';
import { FiSend, FiCode, FiX, FiZap } from 'react-icons/fi';

const MAX_CHARS = 4000;

const MessageInput = ({ onAnalyzeTone, onSmartReplies, recentMessages = [] }) => {
  const { sendMessage, activeRoom, isConnected } = useSocket();
  const { handleTyping, cancelTyping }           = useTyping();
  const {
    isCodeMode, codeLanguage, setCodeLanguage,
    showPreview, toggleCodeMode, togglePreview, disableCodeMode, CODE_LANGUAGES
  } = useCodeShare();

  const [input,          setInput]          = useState('');
  const [tone,           setTone]           = useState('');
  const [suggestion,     setSuggestion]     = useState('');
  const [isAnalyzing,    setIsAnalyzing]    = useState(false);
  const [replies,        setReplies]        = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [sendError,      setSendError]      = useState('');

  const textareaRef    = useRef(null);
  const toneTimerRef   = useRef(null);
  const repliesFetched = useRef(false);

  const charCount = input.length;
  const isOverLimit = charCount > MAX_CHARS;

  const resize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 160)}px`; }
  };

  // Reset on room change
  useEffect(() => {
    setInput(''); setTone(''); setSuggestion('');
    setReplies([]); repliesFetched.current = false;
    setSendError('');
    disableCodeMode();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [activeRoom?._id]);

  const handleChange = (e) => {
    const val = e.target.value;
    if (val.length > MAX_CHARS + 200) return; // hard cap
    setInput(val);
    resize();
    handleTyping();
    setSendError('');
    if (tone) { setTone(''); setSuggestion(''); }

    clearTimeout(toneTimerRef.current);
    if (!isCodeMode && onAnalyzeTone && val.trim().length > 10 && val.length <= MAX_CHARS) {
      toneTimerRef.current = setTimeout(async () => {
        setIsAnalyzing(true);
        try {
          const res = await onAnalyzeTone(val.trim());
          if (res) { setTone(res.tone || ''); setSuggestion(res.suggestion || ''); }
        } catch { /* silent */ }
        finally { setIsAnalyzing(false); }
      }, 900);
    } else if (!val.trim()) {
      setTone(''); setSuggestion('');
    }
  };

  const handleFocus = useCallback(async () => {
    if (!onSmartReplies || repliesFetched.current || replies.length > 0) return;
    const textMsgs = recentMessages.filter((m) => m.type !== 'system');
    if (textMsgs.length === 0) return;
    repliesFetched.current = true;
    setLoadingReplies(true);
    try {
      const res = await onSmartReplies(textMsgs.slice(-5));
      setReplies(Array.isArray(res) ? res : []);
    } catch { setReplies([]); }
    finally { setLoadingReplies(false); }
  }, [onSmartReplies, recentMessages, replies]);

  const doSend = (content) => {
    const trimmed = content?.trim();
    if (!trimmed)           { setSendError('Message cannot be empty.');        return; }
    if (trimmed.length > MAX_CHARS) { setSendError(`Message too long (max ${MAX_CHARS} chars).`); return; }
    if (!isConnected)      { setSendError('You are offline. Reconnecting…'); return; }
    if (!activeRoom)        return;

    sendMessage({ content: trimmed, type: isCodeMode ? 'code' : 'text', language: isCodeMode ? codeLanguage : '' });
    setInput(''); setTone(''); setSuggestion('');
    setReplies([]); repliesFetched.current = false;
    setSendError('');
    cancelTyping(); clearTimeout(toneTimerRef.current);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleSend    = (e) => { e?.preventDefault(); doSend(input); };
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey && !isCodeMode) { e.preventDefault(); doSend(input); } };
  const applyTone     = (s)  => { setInput(s); setTone(''); setSuggestion(''); textareaRef.current?.focus(); setTimeout(resize, 0); };
  const applyReply    = (r)  => { setInput(r); setReplies([]); repliesFetched.current = false; textareaRef.current?.focus(); setTimeout(resize, 0); };
  const clearAll      = ()   => { setInput(''); setTone(''); setSuggestion(''); setSendError(''); clearTimeout(toneTimerRef.current); if (textareaRef.current) textareaRef.current.style.height = 'auto'; };

  if (!activeRoom) return null;

  return (
    <div className="px-5 py-4 border-t border-nt-border bg-nt-surface flex-shrink-0 space-y-2.5">

      {/* Code preview */}
      {isCodeMode && showPreview && input.trim() && (
        <CodePreview code={input} language={codeLanguage} onSend={() => doSend(input)} onHide={togglePreview} />
      )}

      {/* Smart replies */}
      {(loadingReplies || replies.length > 0) && !isCodeMode && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 flex-shrink-0">
            <FiZap size={11} className="text-nt-cyan" />
            <span className="text-xs text-nt-muted">Quick replies:</span>
          </div>
          {loadingReplies
            ? [80,110,95].map((w, i) => <div key={i} className="h-7 rounded-full bg-nt-surface2 border border-nt-border animate-pulse" style={{ width: w }} />)
            : replies.map((r, i) => (
                <button key={i} onClick={() => applyReply(r)}
                  className="text-xs px-3 py-1.5 rounded-full bg-nt-surface2 border border-nt-border text-nt-muted hover:text-nt-text hover:border-nt-blue/40 hover:bg-nt-blue/5 transition-all whitespace-nowrap">
                  {r}
                </button>
              ))
          }
        </div>
      )}

      {/* Tone analyzer */}
      {(isAnalyzing || tone) && !isCodeMode && (
        <ToneAnalyzer tone={tone} suggestion={suggestion} isAnalyzing={isAnalyzing} onApply={applyTone} />
      )}

      {/* Code mode bar */}
      {isCodeMode && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-nt-surface2 border border-nt-cyan/30">
          <FiCode size={13} className="text-nt-cyan flex-shrink-0" />
          <span className="text-xs font-semibold text-nt-cyan">Code mode</span>
          <select value={codeLanguage} onChange={(e) => setCodeLanguage(e.target.value)}
            className="bg-transparent text-xs text-nt-muted border-none outline-none cursor-pointer">
            {CODE_LANGUAGES.map((l) => <option key={l} value={l} className="bg-nt-surface2 text-nt-text">{l}</option>)}
          </select>
          {input.trim() && (
            <button onClick={togglePreview} className="ml-auto text-xs text-nt-muted hover:text-nt-cyan transition-colors px-2 py-0.5 rounded-lg hover:bg-nt-cyan/10">
              {showPreview ? 'Hide' : 'Preview'}
            </button>
          )}
          <button onClick={disableCodeMode} className="text-nt-muted hover:text-nt-danger transition-colors ml-1">
            <FiX size={12} />
          </button>
        </div>
      )}

      {/* Send error */}
      {sendError && (
        <p className="text-xs text-nt-danger px-1">{sendError}</p>
      )}

      {/* Main input */}
      <div className={`flex items-end gap-3 px-4 py-3 rounded-2xl border bg-nt-surface2 transition-all duration-200
        ${isOverLimit        ? 'border-nt-danger/60 shadow-sm shadow-nt-danger/10' :
          isCodeMode         ? 'border-nt-cyan/40  shadow-sm shadow-nt-cyan/10'   :
          'border-nt-border focus-within:border-nt-blue/50 focus-within:shadow-sm focus-within:shadow-nt-blue/10'}`}>

        <button type="button" onClick={toggleCodeMode} title={isCodeMode ? 'Text mode' : 'Code mode'}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-all mb-0.5
            ${isCodeMode ? 'text-nt-cyan bg-nt-cyan/10 border border-nt-cyan/30' : 'text-nt-muted hover:text-nt-text hover:bg-nt-surface'}`}>
          <FiCode size={15} />
        </button>

        <textarea ref={textareaRef} rows={1} value={input}
          onChange={handleChange} onKeyDown={handleKeyDown} onFocus={handleFocus}
          placeholder={isCodeMode ? `Paste ${codeLanguage} code…` : `Message #${activeRoom.name}…`}
          className={`flex-1 bg-transparent placeholder-nt-muted text-sm resize-none outline-none leading-relaxed min-h-[24px] max-h-40
            ${isOverLimit   ? 'text-nt-danger' : 'text-nt-text'}
            ${isCodeMode    ? 'font-mono text-nt-cyan text-xs' : ''}`}
        />

        {input.length > 0 && (
          <button type="button" onClick={clearAll} className="flex-shrink-0 p-1 text-nt-muted hover:text-nt-text transition-colors mb-0.5">
            <FiX size={13} />
          </button>
        )}

        <button onClick={handleSend} disabled={!input.trim() || isOverLimit || !isConnected} title="Send"
          className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all mb-0.5
            ${input.trim() && !isOverLimit && isConnected
              ? 'bg-nt-blue hover:bg-blue-500 shadow-sm shadow-nt-blue/30 cursor-pointer'
              : 'bg-nt-surface border border-nt-border opacity-40 cursor-not-allowed'}`}>
          <FiSend size={14} className="text-white" />
        </button>
      </div>

      {/* Bottom hint row */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-nt-muted/40">
          {isCodeMode ? 'Shift+Enter for new line · AI auto-explains your code' : 'Enter to send · Shift+Enter for new line'}
        </span>
        <span className={`text-xs transition-colors ${isOverLimit ? 'text-nt-danger font-semibold' : charCount > MAX_CHARS * 0.85 ? 'text-nt-warning' : 'text-nt-muted/40'}`}>
          {charCount > MAX_CHARS * 0.7 ? `${charCount} / ${MAX_CHARS}` : ''}
        </span>
      </div>
    </div>
  );
};

export default MessageInput;
