import { useState, useRef, useCallback, useEffect } from 'react';
import { useSocket }    from '../context/SocketContext';
import ToneAnalyzer     from './ToneAnalyzer';
import CodePreview      from './CodePreview';
import useTyping        from '../hooks/useTyping';
import useCodeShare     from '../hooks/useCodeShare';
import { Send, Code, X, Zap, Eye, Bold, Italic, List } from 'lucide-react';

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
  const clearAll   = ()  => { setInput(''); setTone(''); setSuggestion(''); setSendError(''); clearTimeout(toneTimerRef.current); if (textareaRef.current) textareaRef.current.style.height = 'auto'; };

  if (!activeRoom) return null;

  return (
    <div className="flex-shrink-0 border-t px-5 py-4 space-y-3"
         style={{ background: '#012B26', borderColor: '#025A50' }}>

      {/* Code preview */}
      {isCodeMode && showPreview && input.trim() && (
        <CodePreview code={input} language={codeLanguage} onSend={() => doSend(input)} onHide={togglePreview} />
      )}

      {/* Smart replies */}
      {(loadingReplies || replies.length > 0) && !isCodeMode && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Zap size={11} style={{ color: '#60D4C8' }} />
            <span className="text-xs" style={{ color: '#7A9E99' }}>Quick:</span>
          </div>
          {loadingReplies
            ? [80,110,95].map((w,i) => <div key={i} className="h-7 rounded-full animate-pulse" style={{ width: w, background: '#013E37', border: '1px solid #025A50' }} />)
            : replies.map((r,i) => (
                <button key={i} onClick={() => applyReply(r)}
                  className="text-xs px-3 py-1.5 rounded-full transition-all"
                  style={{ background: '#013E37', border: '1px solid #025A50', color: '#D4C98A' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FFEFB2'; e.currentTarget.style.color = '#FFEFB2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#025A50'; e.currentTarget.style.color = '#D4C98A'; }}>
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
        <div className="flex items-center gap-2 px-3 py-2 rounded-nt border"
             style={{ background: 'rgba(96,212,200,0.06)', borderColor: 'rgba(96,212,200,0.25)' }}>
          <Code size={13} style={{ color: '#60D4C8' }} />
          <span className="text-xs font-semibold" style={{ color: '#60D4C8' }}>Code mode</span>
          <select value={codeLanguage} onChange={(e) => setCodeLanguage(e.target.value)}
            className="bg-transparent text-xs border-none outline-none cursor-pointer ml-1"
            style={{ color: '#7A9E99' }}>
            {CODE_LANGUAGES.map((l) => <option key={l} value={l} style={{ background: '#012B26' }}>{l}</option>)}
          </select>
          {input.trim() && (
            <button onClick={togglePreview} className="ml-auto flex items-center gap-1 text-xs transition-colors"
                    style={{ color: '#7A9E99' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#60D4C8'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#7A9E99'}>
              <Eye size={11} />{showPreview ? 'Hide' : 'Preview'}
            </button>
          )}
          <button onClick={disableCodeMode} style={{ color: '#7A9E99' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#F87171'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#7A9E99'}>
            <X size={12} />
          </button>
        </div>
      )}

      {/* Error */}
      {sendError && <p className="text-xs px-1" style={{ color: '#F87171' }}>{sendError}</p>}

      {/* Main input */}
      <div className="rounded-nt border transition-all duration-200"
           style={{
             background: '#011F1B',
             borderColor: isOverLimit ? '#F87171' : isCodeMode ? 'rgba(96,212,200,0.4)' : '#025A50'
           }}>
        <div className="px-4 pt-3">
          <textarea
            ref={textareaRef} rows={1} value={input}
            onChange={handleChange} onKeyDown={handleKeyDown} onFocus={handleFocus}
            placeholder={isCodeMode ? `Paste your ${codeLanguage} code…` : `Message ${activeRoom.name}…`}
            className="w-full bg-transparent text-sm resize-none outline-none leading-relaxed min-h-[24px] max-h-36"
            style={{
              color: isOverLimit ? '#F87171' : '#FFEFB2',
              caretColor: '#FFEFB2',
              fontFamily: isCodeMode ? 'JetBrains Mono, monospace' : 'inherit'
            }}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 mt-1">
          <div className="flex items-center gap-1">
            <button onClick={toggleCodeMode} title="Code mode"
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{ background: isCodeMode ? 'rgba(96,212,200,0.15)' : 'transparent', color: isCodeMode ? '#60D4C8' : '#7A9E99' }}
              onMouseEnter={(e) => !isCodeMode && (e.currentTarget.style.color = '#D4C98A')}
              onMouseLeave={(e) => !isCodeMode && (e.currentTarget.style.color = '#7A9E99')}>
              <Code size={14} />
            </button>
            {[{ icon: Bold, title: 'Bold' }, { icon: Italic, title: 'Italic' }, { icon: List, title: 'List' }].map(({ icon: Icon, title }) => (
              <button key={title} title={title}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{ color: '#7A9E99' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#D4C98A'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#7A9E99'}>
                <Icon size={14} />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {charCount > MAX_CHARS * 0.7 && (
              <span className="text-xs tabular-nums"
                    style={{ color: isOverLimit ? '#F87171' : charCount > MAX_CHARS * 0.9 ? '#FCD34D' : '#7A9E99' }}>
                {charCount}/{MAX_CHARS}
              </span>
            )}
            {input.length > 0 && (
              <button onClick={clearAll} style={{ color: '#7A9E99' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#F87171'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#7A9E99'}>
                <X size={13} />
              </button>
            )}
            <button onClick={() => doSend(input)}
              disabled={!input.trim() || isOverLimit || !isConnected}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
              style={{
                background: input.trim() && !isOverLimit && isConnected ? '#FFEFB2' : 'rgba(255,239,178,0.1)',
                color:      input.trim() && !isOverLimit && isConnected ? '#013E37' : '#7A9E99',
                cursor:     input.trim() && !isOverLimit && isConnected ? 'pointer' : 'not-allowed'
              }}>
              <Send size={13} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-xs" style={{ color: 'rgba(122,158,153,0.5)' }}>
        {isCodeMode ? 'AI will auto-explain your code for everyone' : 'Enter to send · Shift+Enter for new line'}
      </p>
    </div>
  );
};

export default MessageInput;
