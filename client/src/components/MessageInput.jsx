import { useState, useRef, useCallback, useEffect } from 'react';
import { useSocket }    from '../context/SocketContext';
import ToneAnalyzer     from './ToneAnalyzer';
import CodePreview      from './CodePreview';
import useTyping        from '../hooks/useTyping';
import useCodeShare     from '../hooks/useCodeShare';
import { Send, Code, X, Zap, Eye, Bold, Italic, List, Smile } from 'lucide-react';

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
  const [isFocused,      setIsFocused]      = useState(false);

  const textareaRef    = useRef(null);
  const toneTimerRef   = useRef(null);
  const repliesFetched = useRef(false);

  const charCount   = input.length;
  const isOverLimit = charCount > MAX_CHARS;

  const resize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 140)}px`; }
  };

  useEffect(() => {
    setInput(''); setTone(''); setSuggestion('');
    setReplies([]); repliesFetched.current = false;
    setSendError(''); disableCodeMode();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [activeRoom?._id]);

  const handleChange = (e) => {
    const val = e.target.value;
    if (val.length > MAX_CHARS + 200) return;
    setInput(val); resize(); handleTyping(); setSendError('');
    if (tone) { setTone(''); setSuggestion(''); }
    clearTimeout(toneTimerRef.current);
    if (!isCodeMode && onAnalyzeTone && val.trim().length > 10 && val.length <= MAX_CHARS) {
      toneTimerRef.current = setTimeout(async () => {
        setIsAnalyzing(true);
        try {
          const res = await onAnalyzeTone(val.trim());
          if (res) { setTone(res.tone || ''); setSuggestion(res.suggestion || ''); }
        } catch { } finally { setIsAnalyzing(false); }
      }, 900);
    } else if (!val.trim()) { setTone(''); setSuggestion(''); }
  };

  const handleFocus = useCallback(async () => {
    setIsFocused(true);
    if (!onSmartReplies || repliesFetched.current || replies.length > 0) return;
    const textMsgs = recentMessages.filter((m) => m.type !== 'system');
    if (!textMsgs.length) return;
    repliesFetched.current = true;
    setLoadingReplies(true);
    try {
      const res = await onSmartReplies(textMsgs.slice(-5));
      setReplies(Array.isArray(res) ? res : []);
    } catch { setReplies([]); } finally { setLoadingReplies(false); }
  }, [onSmartReplies, recentMessages, replies]);

  const doSend = (content) => {
    const trimmed = content?.trim();
    if (!trimmed) { setSendError('Message cannot be empty.'); return; }
    if (trimmed.length > MAX_CHARS) { setSendError(`Max ${MAX_CHARS} characters.`); return; }
    if (!isConnected) { setSendError('You are offline. Reconnecting…'); return; }
    if (!activeRoom) return;
    sendMessage({ content: trimmed, type: isCodeMode ? 'code' : 'text', language: isCodeMode ? codeLanguage : '' });
    setInput(''); setTone(''); setSuggestion('');
    setReplies([]); repliesFetched.current = false;
    setSendError(''); cancelTyping(); clearTimeout(toneTimerRef.current);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isCodeMode) { e.preventDefault(); doSend(input); }
  };

  const applyTone  = (s) => { setInput(s); setTone(''); setSuggestion(''); textareaRef.current?.focus(); setTimeout(resize, 0); };
  const applyReply = (r) => { setInput(r); setReplies([]); repliesFetched.current = false; textareaRef.current?.focus(); setTimeout(resize, 0); };
  const clearAll   = ()  => {
    setInput(''); setTone(''); setSuggestion(''); setSendError('');
    clearTimeout(toneTimerRef.current);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  if (!activeRoom) return null;

  const canSend = input.trim() && !isOverLimit && isConnected;

  return (
    <div className="input-area flex-shrink-0 px-5 py-4 space-y-3">

      {/* Code preview */}
      {isCodeMode && showPreview && input.trim() && (
        <CodePreview code={input} language={codeLanguage} onSend={() => doSend(input)} onHide={togglePreview} />
      )}

      {/* Smart replies */}
      {(loadingReplies || replies.length > 0) && !isCodeMode && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Zap size={11} style={{ color: '#60D4C8' }} />
            <span className="text-xs font-medium" style={{ color: 'rgba(122,158,153,0.7)' }}>Quick replies:</span>
          </div>
          {loadingReplies
            ? [80,110,95].map((w,i) => (
                <div key={i} className="h-7 rounded-full skeleton" style={{ width: w }} />
              ))
            : replies.map((r,i) => (
                <button
                  key={i}
                  onClick={() => applyReply(r)}
                  className="text-xs px-3 py-1.5 rounded-full transition-all duration-200"
                  style={{
                    background: 'rgba(255,239,178,0.06)',
                    border: '1px solid rgba(255,239,178,0.1)',
                    color: '#D4C98A',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,239,178,0.12)';
                    e.currentTarget.style.borderColor = 'rgba(255,239,178,0.22)';
                    e.currentTarget.style.color = '#FFEFB2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,239,178,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255,239,178,0.1)';
                    e.currentTarget.style.color = '#D4C98A';
                  }}
                >
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
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            background: 'rgba(96,212,200,0.05)',
            border: '1px solid rgba(96,212,200,0.2)',
          }}
        >
          <Code size={13} style={{ color: '#60D4C8' }} />
          <span className="text-xs font-semibold" style={{ color: '#60D4C8' }}>Code mode</span>
          <select
            value={codeLanguage}
            onChange={(e) => setCodeLanguage(e.target.value)}
            className="bg-transparent text-xs border-none outline-none cursor-pointer ml-1"
            style={{ color: '#7A9E99' }}
          >
            {CODE_LANGUAGES.map((l) => <option key={l} value={l} style={{ background: '#0D1A18' }}>{l}</option>)}
          </select>
          {input.trim() && (
            <button
              onClick={togglePreview}
              className="ml-auto flex items-center gap-1 text-xs transition-colors"
              style={{ color: '#7A9E99' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#60D4C8'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#7A9E99'}
            >
              <Eye size={11} />{showPreview ? 'Hide' : 'Preview'}
            </button>
          )}
          <button
            onClick={disableCodeMode}
            style={{ color: '#7A9E99' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#F87171'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#7A9E99'}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Error */}
      {sendError && (
        <p className="text-xs px-1 flex items-center gap-1.5" style={{ color: '#F87171' }}>
          <span className="w-1 h-1 rounded-full bg-nt-danger inline-block" />
          {sendError}
        </p>
      )}

      {/* Main input box */}
      <div className="message-input-box" style={{
        borderColor: isOverLimit
          ? 'rgba(248,113,113,0.4)'
          : isCodeMode
          ? 'rgba(96,212,200,0.3)'
          : isFocused
          ? 'rgba(255,239,178,0.2)'
          : 'rgba(255,239,178,0.1)',
      }}>
        <div className="px-4 pt-3.5">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={() => setIsFocused(false)}
            placeholder={isCodeMode ? `Paste your ${codeLanguage} code here…` : `Message ${activeRoom.name}…`}
            className="w-full bg-transparent text-sm resize-none outline-none leading-relaxed min-h-[24px] max-h-36"
            style={{
              color: isOverLimit ? '#F87171' : '#FFEFB2',
              caretColor: '#FFEFB2',
              fontFamily: isCodeMode ? 'JetBrains Mono, monospace' : 'inherit',
            }}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 pb-3 pt-2">
          <div className="flex items-center gap-0.5">
            {[
              { icon: Code, action: toggleCodeMode, active: isCodeMode, title: 'Code' },
              { icon: Bold, action: null, active: false, title: 'Bold' },
              { icon: Italic, action: null, active: false, title: 'Italic' },
              { icon: List, action: null, active: false, title: 'List' },
            ].map(({ icon: Icon, action, active, title }) => (
              <button
                key={title}
                onClick={action || undefined}
                title={title}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150"
                style={{
                  background: active ? 'rgba(96,212,200,0.12)' : 'transparent',
                  color: active ? '#60D4C8' : '#7A9E99',
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,239,178,0.06)'; e.currentTarget.style.color = '#D4C98A'; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7A9E99'; } }}
              >
                <Icon size={13} />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {charCount > MAX_CHARS * 0.7 && (
              <span
                className="text-xs tabular-nums font-mono"
                style={{ color: isOverLimit ? '#F87171' : charCount > MAX_CHARS * 0.9 ? '#FCD34D' : 'rgba(122,158,153,0.5)' }}
              >
                {charCount}/{MAX_CHARS}
              </span>
            )}
            {input.length > 0 && (
              <button
                onClick={clearAll}
                className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                style={{ color: '#7A9E99' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#7A9E99'; e.currentTarget.style.background = 'transparent'; }}
              >
                <X size={12} />
              </button>
            )}
            <button
              onClick={() => doSend(input)}
              disabled={!canSend}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{
                background: canSend
                  ? 'linear-gradient(135deg, #FFEFB2, #F5DC6E)'
                  : 'rgba(255,239,178,0.08)',
                color: canSend ? '#013E37' : '#7A9E99',
                cursor: canSend ? 'pointer' : 'not-allowed',
                boxShadow: canSend ? '0 2px 10px rgba(255,239,178,0.2)' : 'none',
                transform: canSend ? 'translateY(0)' : 'none',
              }}
              onMouseEnter={(e) => canSend && (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => canSend && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <Send size={12} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-xs" style={{ color: 'rgba(122,158,153,0.35)' }}>
        {isCodeMode ? '✦ AI will auto-explain your code for everyone in the room' : 'Enter to send · Shift+Enter for new line'}
      </p>
    </div>
  );
};

export default MessageInput;
