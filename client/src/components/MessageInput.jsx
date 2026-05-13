import { useState, useRef, useCallback, useEffect } from 'react';
import { useSocket }    from '../context/SocketContext';
import ToneAnalyzer     from './ToneAnalyzer';
import CodePreview      from './CodePreview';
import useTyping        from '../hooks/useTyping';
import useCodeShare     from '../hooks/useCodeShare';
import { Send, Code, X, Zap, Eye } from 'lucide-react';

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
      setReplies(Array.isArray(res) ? res.filter(r => r && (typeof r === 'string' ? r.trim() : true)) : []);
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
    <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-100 relative z-10">

      {/* Code preview */}
      {isCodeMode && showPreview && input.trim() && (
        <CodePreview code={input} language={codeLanguage} onSend={() => doSend(input)} onHide={togglePreview} />
      )}

      {/* Smart replies */}
      {(loadingReplies || replies.length > 0) && !isCodeMode && (
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-yellow-500" />
            <span className="text-xs font-medium text-gray-500">Quick replies:</span>
          </div>
          {loadingReplies
            ? [80,110,95].map((w,i) => (
                <div key={i} className="h-7 rounded-full bg-gray-100 animate-pulse" style={{ width: w }} />
              ))
            : replies.map((r,i) => (
                <button
                  key={i}
                  onClick={() => applyReply(r)}
                  className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors"
                >
                  {typeof r === 'string' ? r : (r?.text || r?.reply || JSON.stringify(r))}
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
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 mb-3">
          <Code size={14} className="text-blue-500" />
          <span className="text-xs font-semibold text-blue-600">Code mode</span>
          <select
            value={codeLanguage}
            onChange={(e) => setCodeLanguage(e.target.value)}
            className="bg-transparent text-xs border-none outline-none cursor-pointer ml-1 text-gray-600 font-medium"
          >
            {CODE_LANGUAGES.map((l) => <option key={l} value={l} className="bg-white">{l}</option>)}
          </select>
          {input.trim() && (
            <button
              onClick={togglePreview}
              className="ml-auto flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors"
            >
              <Eye size={12} />{showPreview ? 'Hide' : 'Preview'}
            </button>
          )}
          <button
            onClick={disableCodeMode}
            className="text-gray-400 hover:text-red-500 ml-2"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Error */}
      {sendError && (
        <p className="text-xs px-1 mb-2 flex items-center gap-1.5 text-red-500">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
          {sendError}
        </p>
      )}

      {/* Main input box */}
      <div className={`rounded-xl border bg-gray-50 transition-all ${isFocused ? 'ring-2 ring-blue-100 border-blue-300' : 'border-gray-200'} ${isOverLimit ? 'border-red-300 ring-red-100' : ''}`}>
        <div className="px-4 pt-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={() => setIsFocused(false)}
            placeholder={isCodeMode ? `Paste your ${codeLanguage} code here…` : `Message ${activeRoom.name}…`}
            className="w-full bg-transparent text-sm resize-none outline-none leading-relaxed min-h-[24px] max-h-36 text-gray-800 placeholder-gray-400"
            style={{
              color: isOverLimit ? '#ef4444' : '#1f2937',
              fontFamily: isCodeMode ? 'JetBrains Mono, monospace' : 'inherit',
            }}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 pb-2 pt-1">
          <div className="flex items-center gap-1">
            <button
              onClick={toggleCodeMode}
              title="Code Mode"
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isCodeMode ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
            >
              <Code size={16} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {charCount > MAX_CHARS * 0.7 && (
              <span className={`text-xs tabular-nums font-mono ${isOverLimit ? 'text-red-500' : charCount > MAX_CHARS * 0.9 ? 'text-yellow-500' : 'text-gray-400'}`}>
                {charCount}/{MAX_CHARS}
              </span>
            )}
            {input.length > 0 && (
              <button
                onClick={clearAll}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <X size={16} />
              </button>
            )}
            <button
              onClick={() => doSend(input)}
              disabled={!canSend}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${canSend ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              <Send size={14} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-xs mt-2 text-gray-400">
        {isCodeMode ? '✦ AI will auto-explain your code for everyone in the room' : 'Enter to send · Shift+Enter for new line'}
      </p>
    </div>
  );
};

export default MessageInput;
