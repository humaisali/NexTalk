import { useState, useRef, useCallback, useEffect } from 'react';
import { useSocket }    from '../context/SocketContext';
import ToneAnalyzer     from './ToneAnalyzer';
import SmartReplies     from './SmartReplies';
import CodePreview      from './CodePreview';
import useTyping        from '../hooks/useTyping';
import useCodeShare     from '../hooks/useCodeShare';
import { FiSend, FiCode, FiX, FiZap, FiEye } from 'react-icons/fi';

/**
 * MessageInput — fully wired input bar.
 *
 * Props:
 *   onAnalyzeTone   — async (msg) → { tone, score, suggestion }
 *   onSmartReplies  — async (messages) → string[]
 *   recentMessages  — last N messages for smart reply context
 */
const MessageInput = ({ onAnalyzeTone, onSmartReplies, recentMessages = [] }) => {
  const { sendMessage, activeRoom }    = useSocket();
  const { handleTyping, cancelTyping } = useTyping();
  const {
    isCodeMode, codeLanguage, setCodeLanguage,
    showPreview, toggleCodeMode, togglePreview, disableCodeMode,
    CODE_LANGUAGES
  } = useCodeShare();

  const [input, setInput]                   = useState('');
  const [tone, setTone]                     = useState('');
  const [suggestion, setSuggestion]         = useState('');
  const [isAnalyzing, setIsAnalyzing]       = useState(false);
  const [replies, setReplies]               = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const textareaRef       = useRef(null);
  const toneTimerRef      = useRef(null);
  const repliesFetched    = useRef(false);

  // Auto-resize textarea
  const resize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 160)}px`; }
  };

  // Reset on room change
  useEffect(() => {
    setInput(''); setTone(''); setSuggestion('');
    setReplies([]); repliesFetched.current = false;
    disableCodeMode();
  }, [activeRoom?._id]);

  // ── Input change ──────────────────────────────────────────────
  const handleChange = (e) => {
    const val = e.target.value;
    setInput(val);
    resize();
    handleTyping();
    if (tone) { setTone(''); setSuggestion(''); }

    // Debounced tone analysis (text mode only, meaningful length)
    clearTimeout(toneTimerRef.current);
    if (!isCodeMode && onAnalyzeTone && val.trim().length > 10) {
      toneTimerRef.current = setTimeout(async () => {
        setIsAnalyzing(true);
        try {
          const res = await onAnalyzeTone(val.trim());
          if (res) { setTone(res.tone || ''); setSuggestion(res.suggestion || ''); }
        } catch { /* silent */ } finally {
          setIsAnalyzing(false);
        }
      }, 800);
    } else {
      setTone(''); setSuggestion('');
    }
  };

  // ── Smart replies on focus ────────────────────────────────────
  const handleFocus = useCallback(async () => {
    if (!onSmartReplies || repliesFetched.current || replies.length > 0) return;
    const textMsgs = recentMessages.filter((m) => m.type !== 'system');
    if (textMsgs.length === 0) return;
    repliesFetched.current = true;
    setLoadingReplies(true);
    try {
      const res = await onSmartReplies(textMsgs.slice(-5));
      setReplies(Array.isArray(res) ? res : []);
    } catch { setReplies([]); } finally { setLoadingReplies(false); }
  }, [onSmartReplies, recentMessages, replies]);

  // ── Send ──────────────────────────────────────────────────────
  const doSend = (content) => {
    if (!content?.trim() || !activeRoom) return;
    sendMessage({
      content:  content.trim(),
      type:     isCodeMode ? 'code' : 'text',
      language: isCodeMode ? codeLanguage : ''
    });
    setInput(''); setTone(''); setSuggestion('');
    setReplies([]); repliesFetched.current = false;
    cancelTyping(); clearTimeout(toneTimerRef.current);
    if (!isCodeMode) disableCodeMode(); // keep code mode open if user wants to send more code
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleSend   = (e) => { e?.preventDefault(); doSend(input); };
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey && !isCodeMode) { e.preventDefault(); doSend(input); } };

  const applyTone  = (s)  => { setInput(s); setTone(''); setSuggestion(''); textareaRef.current?.focus(); setTimeout(resize, 0); };
  const applyReply = (r)  => { setInput(r); setReplies([]); repliesFetched.current = false; textareaRef.current?.focus(); setTimeout(resize, 0); };
  const clearAll   = ()   => { setInput(''); setTone(''); setSuggestion(''); clearTimeout(toneTimerRef.current); if (textareaRef.current) textareaRef.current.style.height = 'auto'; };

  if (!activeRoom) return null;

  return (
    <div className="px-5 py-4 border-t border-nt-border bg-nt-surface flex-shrink-0 space-y-2.5">

      {/* ── Code preview (Day 5) ─────────────────────────── */}
      {isCodeMode && showPreview && input.trim() && (
        <CodePreview
          code={input}
          language={codeLanguage}
          onSend={() => doSend(input)}
          onHide={togglePreview}
        />
      )}

      {/* ── Smart replies ────────────────────────────────── */}
      {(loadingReplies || replies.length > 0) && !isCodeMode && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 flex-shrink-0">
            <FiZap size={11} className="text-nt-cyan" />
            <span className="text-xs text-nt-muted">Quick replies:</span>
          </div>
          {loadingReplies ? (
            [80, 110, 95].map((w, i) => (
              <div key={i} className="h-7 rounded-full bg-nt-surface2 border border-nt-border animate-pulse" style={{ width: w }} />
            ))
          ) : (
            replies.map((r, i) => (
              <button key={i} onClick={() => applyReply(r)}
                className="text-xs px-3 py-1.5 rounded-full bg-nt-surface2 border border-nt-border
                  text-nt-muted hover:text-nt-text hover:border-nt-blue/40 hover:bg-nt-blue/5 transition-all whitespace-nowrap">
                {r}
              </button>
            ))
          )}
        </div>
      )}

      {/* ── Tone analyzer ────────────────────────────────── */}
      {(isAnalyzing || tone) && !isCodeMode && (
        <ToneAnalyzer tone={tone} suggestion={suggestion} isAnalyzing={isAnalyzing} onApply={applyTone} />
      )}

      {/* ── Code mode language + preview toggle ──────────── */}
      {isCodeMode && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-nt-surface2 border border-nt-cyan/30">
          <FiCode size={13} className="text-nt-cyan flex-shrink-0" />
          <span className="text-xs font-semibold text-nt-cyan">Code mode</span>
          <select
            value={codeLanguage}
            onChange={(e) => setCodeLanguage(e.target.value)}
            className="bg-transparent text-xs text-nt-muted border-none outline-none cursor-pointer"
          >
            {CODE_LANGUAGES.map((l) => (
              <option key={l} value={l} className="bg-nt-surface2 text-nt-text">{l}</option>
            ))}
          </select>
          {/* Preview toggle */}
          {input.trim() && (
            <button onClick={togglePreview}
              className="ml-auto flex items-center gap-1 text-xs text-nt-muted hover:text-nt-cyan transition-colors px-2 py-0.5 rounded-lg hover:bg-nt-cyan/10">
              <FiEye size={11} />
              <span>{showPreview ? 'Hide preview' : 'Preview'}</span>
            </button>
          )}
          <button onClick={disableCodeMode} className="text-nt-muted hover:text-nt-danger transition-colors ml-1">
            <FiX size={12} />
          </button>
        </div>
      )}

      {/* ── Main input row ────────────────────────────────── */}
      <div className={`flex items-end gap-3 px-4 py-3 rounded-2xl border bg-nt-surface2 transition-all duration-200
        ${isCodeMode
          ? 'border-nt-cyan/40 shadow-sm shadow-nt-cyan/10'
          : 'border-nt-border focus-within:border-nt-blue/50 focus-within:shadow-sm focus-within:shadow-nt-blue/10'}`}
      >
        {/* Code mode toggle */}
        <button type="button" onClick={toggleCodeMode} title={isCodeMode ? 'Text mode' : 'Code mode'}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-all mb-0.5
            ${isCodeMode ? 'text-nt-cyan bg-nt-cyan/10 border border-nt-cyan/30' : 'text-nt-muted hover:text-nt-text hover:bg-nt-surface'}`}>
          <FiCode size={15} />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={isCodeMode
            ? `Paste your ${codeLanguage} code… (Shift+Enter for new line)`
            : `Message #${activeRoom.name}… (Shift+Enter for new line)`}
          className={`flex-1 bg-transparent text-nt-text placeholder-nt-muted text-sm resize-none
            outline-none leading-relaxed min-h-[24px] max-h-40
            ${isCodeMode ? 'font-mono text-nt-cyan text-xs' : ''}`}
        />

        {/* Clear */}
        {input.length > 0 && (
          <button type="button" onClick={clearAll} className="flex-shrink-0 p-1 text-nt-muted hover:text-nt-text transition-colors mb-0.5">
            <FiX size={13} />
          </button>
        )}

        {/* Send */}
        <button onClick={handleSend} disabled={!input.trim()} title="Send"
          className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all mb-0.5
            ${input.trim() ? 'bg-nt-blue hover:bg-blue-500 shadow-sm shadow-nt-blue/30 cursor-pointer' : 'bg-nt-surface border border-nt-border opacity-40 cursor-not-allowed'}`}>
          <FiSend size={14} className="text-white" />
        </button>
      </div>

      {/* Hint */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-nt-muted/40">
          {isCodeMode ? 'Shift+Enter for new line · AI will auto-explain your code' : 'Enter to send · Shift+Enter for new line'}
        </span>
        {onAnalyzeTone && !isCodeMode && (
          <span className="text-xs text-nt-muted/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-nt-cyan/60 inline-block" />
            AI tone active
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageInput;
