import { useState, useRef, useEffect } from 'react';
import { useAuth }   from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { FiSend, FiArrowDown, FiCircle, FiHash } from 'react-icons/fi';

/**
 * DirectChatWindow — the private 1-on-1 chat panel.
 * Mirrors the ChatWindow layout but for DMs.
 *
 * Props:
 *   conversation     — the active conversation object
 *   messages         — DM messages array
 *   typingUser       — username currently typing (or null)
 *   onSendMessage    — fn({ content }) to send a DM
 *   onTyping         — fn() emit typing indicator
 *   onStopTyping     — fn() stop typing indicator
 */
const DirectChatWindow = ({
  conversation,
  messages = [],
  typingUser,
  onSendMessage,
  onTyping,
  onStopTyping
}) => {
  const { user }        = useAuth();
  const [input, setInput]         = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const bottomRef       = useRef(null);
  const containerRef    = useRef(null);
  const textareaRef     = useRef(null);
  const typingTimer     = useRef(null);
  const isTyping        = useRef(false);
  const MAX_CHARS       = 4000;

  // Get the other participant
  const other = conversation?.participants?.find(
    (p) => p._id?.toString() !== user?._id?.toString()
  );

  // Auto-scroll on new messages
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (nearBottom) { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); setShowScrollBtn(false); }
    else setShowScrollBtn(true);
  }, [messages]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (el) setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
  };

  const resize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 120)}px`; }
  };

  const handleChange = (e) => {
    setInput(e.target.value);
    resize();

    // Typing indicator
    if (!isTyping.current) { onTyping?.(); isTyping.current = true; }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => { onStopTyping?.(); isTyping.current = false; }, 2000);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || trimmed.length > MAX_CHARS) return;
    onSendMessage?.({ content: trimmed });
    setInput('');
    clearTimeout(typingTimer.current);
    onStopTyping?.(); isTyping.current = false;
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!conversation) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* DM header */}
      <div className="px-6 py-3.5 border-b border-nt-border bg-nt-surface flex items-center gap-3 flex-shrink-0">
        {/* Avatar + online */}
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-nt-surface2 border border-nt-border flex items-center justify-center text-sm font-bold text-nt-text">
            {other?.avatar || other?.username?.[0]?.toUpperCase() || '?'}
          </div>
          {other?.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-nt-success rounded-full border-2 border-nt-surface" />
          )}
        </div>

        {/* Name + number + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-nt-text text-sm">{other?.username}</span>
            <span className={`text-xs ${other?.isOnline ? 'text-nt-success' : 'text-nt-muted'}`}>
              {other?.isOnline ? '● Online' : '○ Offline'}
            </span>
          </div>
          {other?.nexTalkNumber && (
            <p className="text-xs text-nt-muted font-mono mt-0.5 flex items-center gap-1">
              <FiHash size={10} className="text-nt-blue" />
              {other.nexTalkNumber.replace(/^(\+100)(\d{7})$/, '$1 $2')}
            </p>
          )}
        </div>

        {/* Lock badge */}
        <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-nt-surface2 border border-nt-border text-nt-muted flex-shrink-0">
          🔒 Private
        </div>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-5 py-5"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center select-none">
            <div className="w-14 h-14 rounded-2xl bg-nt-surface2 border border-nt-border flex items-center justify-center text-2xl">
              🔒
            </div>
            <div>
              <p className="text-nt-text font-semibold mb-1">
                Private conversation with <span className="text-nt-blue">{other?.username}</span>
              </p>
              <p className="text-nt-muted text-sm">Only you two can see these messages.</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender?._id?.toString() === user?._id?.toString() ||
                          msg.sender?.toString()       === user?._id?.toString();
            return (
              <div key={msg._id} className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-nt-surface2 border border-nt-border flex items-center justify-center text-sm font-semibold text-nt-text">
                  {isOwn
                    ? (user?.avatar || user?.username?.[0]?.toUpperCase())
                    : (other?.avatar || other?.username?.[0]?.toUpperCase() || '?')}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col gap-1 max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
                  {!isOwn && (
                    <span className="text-xs font-semibold text-nt-text px-1">{other?.username}</span>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words
                    ${isOwn
                      ? 'bg-nt-blue text-white rounded-tr-sm'
                      : 'bg-nt-surface2 text-nt-text border border-nt-border rounded-tl-sm'
                    }`}>
                    {msg.content}
                  </div>
                  <span className="text-xs text-nt-muted px-1">{formatTime(msg.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUser && (
          <div className="flex items-center gap-2 mt-1 px-1">
            <div className="flex gap-1">
              {[0, 150, 300].map((d) => (
                <div key={d} className="w-1.5 h-1.5 rounded-full bg-nt-muted animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
            <span className="text-xs text-nt-muted italic">{typingUser} is typing…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Scroll button */}
      {showScrollBtn && (
        <button
          onClick={() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); setShowScrollBtn(false); }}
          className="absolute bottom-20 right-5 w-9 h-9 rounded-full bg-nt-blue shadow-lg flex items-center justify-center text-white hover:bg-blue-500 transition-all z-10"
        >
          <FiArrowDown size={16} />
        </button>
      )}

      {/* Input bar */}
      <div className="px-5 py-4 border-t border-nt-border bg-nt-surface flex-shrink-0">
        <div className="flex items-end gap-3 px-4 py-3 rounded-2xl border border-nt-border bg-nt-surface2 focus-within:border-nt-blue/50 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${other?.username || ''}…`}
            className="flex-1 bg-transparent text-nt-text placeholder-nt-muted text-sm resize-none outline-none leading-relaxed min-h-[24px] max-h-32"
          />
          {input.length > 0 && (
            <button type="button" onClick={() => setInput('')} className="text-nt-muted hover:text-nt-text transition-colors mb-0.5 text-lg leading-none">×</button>
          )}
          <button
            onClick={handleSend}
            disabled={!input.trim() || input.length > MAX_CHARS}
            className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all mb-0.5
              ${input.trim() && input.length <= MAX_CHARS
                ? 'bg-nt-blue hover:bg-blue-500 shadow-sm shadow-nt-blue/30'
                : 'bg-nt-surface border border-nt-border opacity-40 cursor-not-allowed'}`}
          >
            <FiSend size={14} className="text-white" />
          </button>
        </div>
        <p className="text-center text-xs text-nt-muted/40 mt-1.5">🔒 End-to-end private · Only you and {other?.username} can see this</p>
      </div>
    </div>
  );
};

export default DirectChatWindow;
