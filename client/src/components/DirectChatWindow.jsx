import { useState, useRef, useEffect } from 'react';
import { useAuth }   from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Send, ArrowDown, Hash, MoreHorizontal } from 'lucide-react';

const DirectChatWindow = ({ conversation, messages = [], typingUser, onSendMessage, onTyping, onStopTyping }) => {
  const { user }        = useAuth();
  const [input, setInput]               = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const bottomRef       = useRef(null);
  const containerRef    = useRef(null);
  const textareaRef     = useRef(null);
  const typingTimer     = useRef(null);
  const isTypingRef     = useRef(false);
  const MAX_CHARS       = 4000;

  const other = conversation?.participants?.find(
    (p) => p._id?.toString() !== user?._id?.toString()
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (nearBottom) { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); setShowScrollBtn(false); }
    else setShowScrollBtn(true);
  }, [messages]);

  const resize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 120)}px`; }
  };

  const handleChange = (e) => {
    setInput(e.target.value); resize();
    if (!isTypingRef.current) { onTyping?.(); isTypingRef.current = true; }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => { onStopTyping?.(); isTypingRef.current = false; }, 2000);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || trimmed.length > MAX_CHARS) return;
    onSendMessage?.({ content: trimmed });
    setInput('');
    clearTimeout(typingTimer.current);
    onStopTyping?.(); isTypingRef.current = false;
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!conversation) return null;

  const hasImgOther = other?.avatar?.startsWith?.('data:image/') || other?.avatar?.startsWith?.('http');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* DM Header */}
      <div className="px-6 py-4 border-b flex items-center gap-3 flex-shrink-0"
           style={{ background: '#013E37', borderColor: '#025A50' }}>
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden border flex items-center justify-center text-sm font-bold"
               style={{ background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)', borderColor: '#025A50', color: '#013E37' }}>
            {hasImgOther
              ? <img src={other.avatar} alt="" className="w-full h-full object-cover" />
              : other?.username?.[0]?.toUpperCase() || '?'}
          </div>
          {other?.isOnline && <div className="status-online absolute -bottom-0.5 -right-0.5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm" style={{ color: '#FFEFB2' }}>{other?.username}</span>
            <span className="text-xs" style={{ color: other?.isOnline ? '#4ADE80' : '#7A9E99' }}>
              {other?.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          {other?.nexTalkNumber && (
            <p className="text-xs font-mono flex items-center gap-1" style={{ color: '#7A9E99' }}>
              <Hash size={10} style={{ color: '#60D4C8' }} />
              {other.nexTalkNumber.replace(/^(\+100)(\d{7})$/, '+100 $2')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border flex-shrink-0"
             style={{ color: '#7A9E99', borderColor: '#025A50', background: 'rgba(255,239,178,0.04)' }}>
          Private
        </div>
      </div>

      {/* Messages */}
      <div ref={containerRef} onScroll={() => {
        const el = containerRef.current;
        if (el) setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
      }} className="flex-1 overflow-y-auto px-6 py-5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center select-none">
            <div className="w-16 h-16 rounded-2xl border flex items-center justify-center"
                 style={{ background: 'rgba(255,239,178,0.06)', borderColor: '#025A50' }}>
              <span className="text-2xl font-bold" style={{ color: '#FFEFB2' }}>
                {other?.username?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: '#FFEFB2' }}>
                Private conversation with {other?.username}
              </p>
              <p className="text-xs mt-1" style={{ color: '#7A9E99' }}>Only you two can see these messages.</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender?._id?.toString() === user?._id?.toString() ||
                          msg.sender?.toString()       === user?._id?.toString();
            const hasImgSender = isOwn
              ? (user?.avatar?.startsWith?.('data:') || user?.avatar?.startsWith?.('http'))
              : hasImgOther;
            return (
              <div key={msg._id} className={`flex gap-3 mb-5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border flex items-center justify-center text-xs font-bold"
                     style={{ background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)', borderColor: '#025A50', color: '#013E37' }}>
                  {hasImgSender
                    ? <img src={isOwn ? user?.avatar : other?.avatar} alt="" className="w-full h-full object-cover" />
                    : (isOwn ? user?.username?.[0]?.toUpperCase() : other?.username?.[0]?.toUpperCase()) || '?'
                  }
                </div>
                <div className={`flex flex-col gap-1 max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
                  {!isOwn && (
                    <span className="text-xs font-semibold px-1" style={{ color: '#FFEFB2' }}>{other?.username}</span>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                       style={isOwn
                         ? { background: '#013E37', color: '#FFEFB2', border: '1px solid #025A50' }
                         : { background: '#012B26', color: '#FFEFB2', border: '1px solid #025A50' }
                       }>
                    {msg.content}
                  </div>
                  <span className="text-xs px-1" style={{ color: '#7A9E99' }}>{formatTime(msg.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}

        {typingUser && (
          <div className="flex items-center gap-2 mt-1 px-1">
            <div className="flex gap-1">
              {[0,150,300].map((d) => (
                <div key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                     style={{ background: '#7A9E99', animationDelay: `${d}ms` }} />
              ))}
            </div>
            <span className="text-xs italic" style={{ color: '#7A9E99' }}>{typingUser} is typing…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {showScrollBtn && (
        <button onClick={() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); setShowScrollBtn(false); }}
          className="absolute bottom-24 right-5 w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: '#FFEFB2', color: '#013E37' }}>
          <ArrowDown size={16} />
        </button>
      )}

      {/* Input */}
      <div className="px-5 py-4 border-t flex-shrink-0"
           style={{ background: '#012B26', borderColor: '#025A50' }}>
        <div className="flex items-end gap-3 rounded-nt border px-4 py-3 transition-all"
             style={{ background: '#011F1B', borderColor: '#025A50' }}>
          <textarea ref={textareaRef} rows={1} value={input}
            onChange={handleChange} onKeyDown={handleKeyDown}
            placeholder={`Message ${other?.username || ''}…`}
            className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed min-h-[24px] max-h-32"
            style={{ color: '#FFEFB2', caretColor: '#FFEFB2' }}
          />
          {input.length > 0 && (
            <button onClick={() => setInput('')} className="mb-0.5 transition-colors"
                    style={{ color: '#7A9E99' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#F87171'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#7A9E99'}>
              ×
            </button>
          )}
          <button onClick={handleSend}
            disabled={!input.trim() || input.length > MAX_CHARS}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 mb-0.5"
            style={{
              background: input.trim() && input.length <= MAX_CHARS ? '#FFEFB2' : 'rgba(255,239,178,0.1)',
              color:      input.trim() && input.length <= MAX_CHARS ? '#013E37' : '#7A9E99',
              cursor:     input.trim() && input.length <= MAX_CHARS ? 'pointer' : 'not-allowed'
            }}>
            <Send size={14} />
          </button>
        </div>
        <p className="text-center text-xs mt-2" style={{ color: 'rgba(122,158,153,0.4)' }}>
          Private · Only you and {other?.username} can see this
        </p>
      </div>
    </div>
  );
};

export default DirectChatWindow;
