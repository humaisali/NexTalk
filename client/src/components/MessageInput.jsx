import { useState, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import ToneAnalyzer from './ToneAnalyzer';
import SmartReplies from './SmartReplies';
import { FiSend, FiCode, FiX } from 'react-icons/fi';
import useTyping from '../hooks/useTyping';

// Props (AI callbacks wired in Day 4):
//   onAnalyzeTone   — async fn(message) → { tone, suggestion }
//   onSmartReplies  — async fn(messages) → { replies }
const MessageInput = ({ onAnalyzeTone, onSmartReplies, recentMessages = [] }) => {
  const { sendMessage, activeRoom }         = useSocket();
  const { handleTyping, cancelTyping }      = useTyping();

  const [input, setInput]             = useState('');
  const [isCodeMode, setIsCodeMode]   = useState(false);
  const [codeLang, setCodeLang]       = useState('javascript');

  // Tone state
  const [tone, setTone]               = useState('');
  const [suggestion, setSuggestion]   = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Smart replies state
  const [replies, setReplies]         = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const textareaRef = useRef(null);
  const toneTimerRef = useRef(null);

  // Auto-resize textarea
  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 160)}px`; }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setInput(val);
    resizeTextarea();
    handleTyping();

    // Reset tone on change
    if (tone) { setTone(''); setSuggestion(''); }

    // Debounced tone analysis (Day 4 wires the real call)
    if (onAnalyzeTone && val.trim().length > 10) {
      clearTimeout(toneTimerRef.current);
      toneTimerRef.current = setTimeout(async () => {
        setIsAnalyzing(true);
        try {
          const result = await onAnalyzeTone(val.trim());
          setTone(result.tone);
          setSuggestion(result.suggestion || '');
        } catch { /* silent */ } finally {
          setIsAnalyzing(false);
        }
      }, 800);
    }
  };

  // Load smart replies on focus if room has messages
  const handleFocus = useCallback(async () => {
    if (!onSmartReplies || recentMessages.length === 0 || replies.length > 0) return;
    setLoadingReplies(true);
    try {
      const result = await onSmartReplies(recentMessages.slice(-5));
      setReplies(result.replies || []);
    } catch { /* silent */ } finally {
      setLoadingReplies(false);
    }
  }, [onSmartReplies, recentMessages, replies]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim() || !activeRoom) return;
    sendMessage({ content: input.trim(), type: isCodeMode ? 'code' : 'text', language: isCodeMode ? codeLang : '' });
    setInput('');
    setTone(''); setSuggestion('');
    setReplies([]);
    setIsCodeMode(false);
    cancelTyping();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const applyToneSuggestion = (s) => { setInput(s); setTone(''); setSuggestion(''); };
  const applySmartReply     = (r) => { setInput(r); setReplies([]); textareaRef.current?.focus(); };

  if (!activeRoom) return null;

  const CODE_LANGUAGES = ['javascript', 'python', 'typescript', 'jsx', 'css', 'html', 'java', 'cpp', 'rust', 'go', 'bash', 'sql'];

  return (
    <div className="px-5 py-4 border-t border-nt-border bg-nt-surface flex-shrink-0 space-y-2">

      {/* Smart replies row */}
      {(loadingReplies || replies.length > 0) && (
        <SmartReplies
          replies={replies}
          isLoading={loadingReplies}
          onSelect={applySmartReply}
        />
      )}

      {/* Tone analyzer */}
      {(isAnalyzing || tone) && (
        <ToneAnalyzer
          tone={tone}
          suggestion={suggestion}
          isAnalyzing={isAnalyzing}
          onApply={applyToneSuggestion}
        />
      )}

      {/* Code mode language selector */}
      {isCodeMode && (
        <div className="flex items-center gap-2 px-3 py-2 bg-nt-surface2 rounded-lg border border-nt-cyan/30">
          <FiCode size={13} className="text-nt-cyan flex-shrink-0" />
          <span className="text-xs text-nt-cyan font-medium">Code mode</span>
          <select
            value={codeLang}
            onChange={(e) => setCodeLang(e.target.value)}
            className="ml-auto bg-transparent text-xs text-nt-muted border-none outline-none cursor-pointer"
          >
            {CODE_LANGUAGES.map((l) => (
              <option key={l} value={l} className="bg-nt-surface">{l}</option>
            ))}
          </select>
        </div>
      )}

      {/* Main input row */}
      <div className={`flex items-end gap-3 px-4 py-3 rounded-xl border bg-nt-surface2 transition-colors
        ${isCodeMode ? 'border-nt-cyan/40' : 'border-nt-border focus-within:border-nt-blue/60'}`}>

        {/* Code mode toggle */}
        <button
          type="button"
          onClick={() => setIsCodeMode(!isCodeMode)}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-all mb-0.5
            ${isCodeMode
              ? 'text-nt-cyan bg-nt-cyan/10 border border-nt-cyan/30'
              : 'text-nt-muted hover:text-nt-text hover:bg-nt-surface'
            }`}
          title="Toggle code mode"
        >
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
          placeholder={isCodeMode ? `Paste your ${codeLang} code…` : `Message #${activeRoom.name}…`}
          className={`flex-1 bg-transparent text-nt-text placeholder-nt-muted text-sm resize-none outline-none leading-relaxed min-h-[24px] max-h-40
            ${isCodeMode ? 'font-mono text-nt-cyan' : ''}`}
        />

        {/* Clear button (visible when has content) */}
        {input.length > 0 && (
          <button
            type="button"
            onClick={() => { setInput(''); setTone(''); setSuggestion(''); }}
            className="flex-shrink-0 p-1 text-nt-muted hover:text-nt-text mb-0.5"
          >
            <FiX size={13} />
          </button>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="flex-shrink-0 w-8 h-8 rounded-lg bg-nt-blue hover:bg-blue-500 flex items-center justify-center transition-all
            disabled:opacity-30 disabled:cursor-not-allowed mb-0.5"
        >
          <FiSend size={14} className="text-white" />
        </button>
      </div>

      <p className="text-center text-xs text-nt-muted/50">
        Enter to send · Shift+Enter for new line · / for code mode
      </p>
    </div>
  );
};

export default MessageInput;
