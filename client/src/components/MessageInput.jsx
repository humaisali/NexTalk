import { useState, useRef, useCallback, useEffect } from 'react';
import { useSocket }    from '../context/SocketContext';
import { useAuth }      from '../context/AuthContext';
import { uploadFile }   from '../services/api';
import ToneAnalyzer     from './ToneAnalyzer';
import CodePreview      from './CodePreview';
import useTyping        from '../hooks/useTyping';
import useCodeShare     from '../hooks/useCodeShare';
import { Send, Code, X, Zap, Eye, Paperclip, Mic, Loader2, Square, Trash2, Check, Shield } from 'lucide-react';

const MAX_CHARS = 4000;

const MessageInput = ({ onAnalyzeTone, onSmartReplies, recentMessages = [] }) => {
  const { sendMessage, activeRoom, isConnected } = useSocket();
  const { user }                                  = useAuth();
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

  // Attachment and Voice States
  const [isUploading,    setIsUploading]    = useState(false);
  const [isRecording,    setIsRecording]    = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);

  const textareaRef    = useRef(null);
  const toneTimerRef   = useRef(null);
  const repliesFetched = useRef(false);
  const fileInputRef   = useRef(null);

  // Audio recording refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef   = useRef([]);
  const recordTimerRef   = useRef(null);
  const audioStreamRef   = useRef(null);

  const charCount   = input.length;
  const isOverLimit = charCount > MAX_CHARS;

  // Moderation Check
  const isUserAdmin = activeRoom?.admins?.some(a => (a._id || a).toString() === user?._id?.toString()) || 
                      (activeRoom?.createdBy?._id || activeRoom?.createdBy)?.toString() === user?._id?.toString();
  const isBroadcastRestricted = activeRoom?.settings?.onlyAdminsCanPost && !isUserAdmin;

  const resize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 140)}px`; }
  };

  useEffect(() => {
    setInput(''); setTone(''); setSuggestion('');
    setReplies([]); repliesFetched.current = false;
    setSendError(''); disableCodeMode();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    
    // Cancel recording if changing rooms
    if (isRecording) {
      stopRecording(false);
    }
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

  // ── Attachment handling ───────────────────────────────────────────
  const handleFileAttach = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setSendError('File too large. Maximum size is 10MB.');
      return;
    }

    setIsUploading(true);
    setSendError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const { data } = await uploadFile(formData);
      
      sendMessage({
        content: '',
        type: 'file',
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize
      });
    } catch (err) {
      console.error(err);
      setSendError('Failed to upload file.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // ── Voice Recording handling ──────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) return;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop mic streams
        stream.getTracks().forEach(track => track.stop());

        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append('file', audioBlob, `Voice-${Date.now()}.webm`);

          const { data } = await uploadFile(formData);

          sendMessage({
            content: '',
            type: 'voice',
            fileUrl: data.fileUrl,
            fileName: data.fileName || 'Voice Message',
            fileType: data.fileType || 'audio/webm',
            fileSize: data.fileSize || audioBlob.size
          });
        } catch (err) {
          console.error(err);
          setSendError('Failed to upload voice message.');
        } finally {
          setIsUploading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      recordTimerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error recording audio:', err);
      setSendError('Microphone access denied or not available.');
    }
  };

  const stopRecording = (shouldSend) => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

    clearInterval(recordTimerRef.current);
    setIsRecording(false);

    if (shouldSend) {
      mediaRecorderRef.current.stop();
    } else {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      audioChunksRef.current = [];
      mediaRecorderRef.current = null;
    }
  };

  const formatDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!activeRoom) return null;

  // Broadcast Restricted UI
  if (isBroadcastRestricted) {
    return (
      <div className="flex-shrink-0 px-6 py-4 bg-gray-50 dark:bg-nt-bg1 border-t border-gray-100 dark:border-nt-border relative z-10 text-center">
        <div className="py-3 px-4 rounded-xl bg-amber-50 dark:bg-nt-bg3/30 border border-amber-100 dark:border-nt-border/40 text-amber-800 dark:text-nt-warning text-sm font-semibold inline-flex items-center gap-2">
          <Shield size={16} />
          Only admins can post messages in this room.
        </div>
      </div>
    );
  }

  const canSend = input.trim() && !isOverLimit && isConnected;

  return (
    <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-nt-bg1 border-t border-gray-100 dark:border-nt-border relative z-10">

      {/* Code preview */}
      {isCodeMode && showPreview && input.trim() && (
        <CodePreview code={input} language={codeLanguage} onSend={() => doSend(input)} onHide={togglePreview} />
      )}

      {/* Smart replies */}
      {(loadingReplies || replies.length > 0) && !isCodeMode && (
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-yellow-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-nt-muted">Quick replies:</span>
          </div>
          {loadingReplies
            ? [80,110,95].map((w,i) => (
                <div key={i} className="h-7 rounded-full bg-gray-100 dark:bg-nt-bg2 animate-pulse" style={{ width: w }} />
              ))
            : replies.map((r,i) => (
                <button
                  key={i}
                  onClick={() => applyReply(r)}
                  className="text-xs px-3 py-1.5 rounded-full bg-blue-50 dark:bg-nt-bg3 text-blue-600 dark:text-nt-teal border border-blue-100 dark:border-nt-border hover:bg-blue-100 dark:hover:bg-nt-bg2 transition-colors"
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
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-nt-bg3 border border-blue-100 dark:border-nt-border mb-3">
          <Code size={14} className="text-blue-500 dark:text-nt-teal" />
          <span className="text-xs font-semibold text-blue-600 dark:text-nt-teal">Code mode</span>
          <select
            value={codeLanguage}
            onChange={(e) => setCodeLanguage(e.target.value)}
            className="bg-transparent text-xs border-none outline-none cursor-pointer ml-1 text-gray-600 dark:text-nt-text font-medium"
          >
            {CODE_LANGUAGES.map((l) => <option key={l} value={l} className="bg-white dark:bg-nt-bg1">{l}</option>)}
          </select>
          {input.trim() && (
            <button
              onClick={togglePreview}
              className="ml-auto flex items-center gap-1 text-xs text-blue-500 dark:text-nt-teal hover:text-blue-600 dark:hover:text-[#FFEFB2] transition-colors"
            >
              <Eye size={12} />{showPreview ? 'Hide' : 'Preview'}
            </button>
          )}
          <button
            onClick={disableCodeMode}
            className="text-gray-400 dark:text-nt-muted hover:text-red-500 ml-2"
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
      <div className={`rounded-xl border bg-gray-50 dark:bg-nt-bg2 transition-all ${isFocused ? 'ring-2 ring-blue-100 dark:ring-[#60D4C8]/10 border-blue-300 dark:border-[#60D4C8]' : 'border-gray-200 dark:border-nt-border'} ${isOverLimit ? 'border-red-300 ring-red-100' : ''}`}>
        
        {/* Hidden inputs */}
        <input ref={fileInputRef} type="file" onChange={handleFileAttach} className="hidden" />

        {isRecording ? (
          /* Active Recording State UI */
          <div className="flex items-center justify-between px-4 py-3 min-h-[48px]">
            <div className="flex items-center gap-2.5 text-red-500 dark:text-red-400 animate-pulse text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400" />
              <span>Recording Voice note ({formatDuration(recordDuration)})</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => stopRecording(false)} 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                title="Cancel Recording"
              >
                <Trash2 size={16} />
              </button>
              <button 
                onClick={() => stopRecording(true)} 
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-500 text-white hover:bg-green-600 active:scale-95 transition-all shadow-sm"
                title="Send Recording"
              >
                <Check size={16} />
              </button>
            </div>
          </div>
        ) : isUploading ? (
          /* Uploading Loading State UI */
          <div className="flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] text-gray-500 dark:text-nt-muted text-sm font-semibold">
            <Loader2 size={16} className="animate-spin text-blue-500 dark:text-nt-teal" />
            <span>Uploading attachment…</span>
          </div>
        ) : (
          /* Normal Textarea input state */
          <>
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
                className="w-full bg-transparent text-sm resize-none outline-none leading-relaxed min-h-[24px] max-h-36 text-gray-800 dark:text-nt-text placeholder-gray-400 dark:placeholder-nt-faint"
                style={{
                  color: isOverLimit ? '#ef4444' : 'inherit',
                  fontFamily: isCodeMode ? 'JetBrains Mono, monospace' : 'inherit',
                }}
              />
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 pb-2 pt-1">
              <div className="flex items-center gap-1">
                {/* Code mode button */}
                <button
                  onClick={toggleCodeMode}
                  title="Code Mode"
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isCodeMode ? 'bg-blue-100 dark:bg-nt-bg3 text-blue-600 dark:text-nt-teal' : 'text-gray-400 dark:text-nt-muted hover:bg-gray-100 dark:hover:bg-nt-bg3 hover:text-gray-600 dark:hover:text-nt-text'}`}
                >
                  <Code size={16} />
                </button>

                {/* File Attachment button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach File"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-nt-muted hover:bg-gray-100 dark:hover:bg-nt-bg3 hover:text-gray-600 dark:hover:text-nt-text transition-colors"
                >
                  <Paperclip size={16} />
                </button>

                {/* Voice Record button */}
                <button
                  onClick={startRecording}
                  title="Record Voice Message"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-nt-muted hover:bg-gray-100 dark:hover:bg-nt-bg3 hover:text-gray-600 dark:hover:text-nt-text transition-colors"
                >
                  <Mic size={16} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {charCount > MAX_CHARS * 0.7 && (
                  <span className={`text-xs tabular-nums font-mono ${isOverLimit ? 'text-red-500' : charCount > MAX_CHARS * 0.9 ? 'text-yellow-500' : 'text-gray-400 dark:text-nt-muted'}`}>
                    {charCount}/{MAX_CHARS}
                  </span>
                )}
                {input.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
                <button
                  onClick={() => doSend(input)}
                  disabled={!canSend}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${canSend ? 'bg-blue-600 dark:bg-nt-teal text-white dark:text-nt-bg hover:bg-blue-700 dark:hover:bg-[#50c2b7] active:scale-95' : 'bg-gray-200 dark:bg-nt-bg3 text-gray-400 dark:text-nt-faint cursor-not-allowed'}`}
                >
                  <Send size={14} />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <p className="text-center text-xs mt-2 text-gray-400 dark:text-nt-muted">
        {isRecording ? 'Click Check to send voice note · Trash to discard' : isCodeMode ? '✦ AI will auto-explain your code for everyone in the room' : 'Enter to send · Shift+Enter for new line'}
      </p>
    </div>
  );
};

export default MessageInput;
