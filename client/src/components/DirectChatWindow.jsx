import { useState, useRef, useEffect } from 'react';
import { useAuth }   from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Send, ArrowDown, Hash, MoreHorizontal, Globe, Search } from 'lucide-react';

const DirectChatWindow = ({ conversation, messages = [], typingUser, onSendMessage, onTyping, onStopTyping, translations, translateLoading, translateMessage, searchQuery }) => {
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

  const filteredMessages = messages.filter((msg) => {
    if (!searchQuery) return true;
    if (msg.type === 'system') return false;
    return msg.content?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">

      {/* Messages */}
      <div ref={containerRef} onScroll={() => {
        const el = containerRef.current;
        if (el) setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
      }} className="flex-1 overflow-y-auto px-6 py-5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center select-none animate-fade-in">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500 shadow-sm">
              <span className="text-3xl font-bold">
                {other?.username?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-lg text-gray-800">
                Private conversation with {other?.username}
              </p>
              <p className="text-sm mt-1 text-gray-500">Only you two can see these messages.</p>
            </div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center opacity-60">
             <Search size={32} className="text-gray-400" />
             <p className="text-sm text-gray-500">No messages match "{searchQuery}"</p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isOwn = msg.sender?._id?.toString() === user?._id?.toString() ||
                          msg.sender?.toString()       === user?._id?.toString();
            const hasImgSender = isOwn
              ? (user?.avatar?.startsWith?.('data:') || user?.avatar?.startsWith?.('http'))
              : hasImgOther;
            return (
              <div key={msg._id} className={`flex gap-3 mb-5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                  {hasImgSender
                    ? <img src={isOwn ? user?.avatar : other?.avatar} alt="" className="w-full h-full object-cover" />
                    : (isOwn ? user?.username?.[0]?.toUpperCase() : other?.username?.[0]?.toUpperCase()) || '?'
                  }
                </div>
                <div className={`flex flex-col gap-1 max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
                  {!isOwn && (
                    <span className="text-xs font-semibold px-1 text-gray-500">{other?.username}</span>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words relative group/bubble shadow-sm ${isOwn ? 'rounded-tr-sm bg-blue-600 text-white' : 'rounded-tl-sm bg-white text-gray-800 border border-gray-100'}`}>
                    {msg.content}
                    {translations?.[msg._id] && (
                      <div className="mt-2 pt-2 border-t border-white/20 text-xs opacity-90">
                        <strong>Translation:</strong> {translations[msg._id]}
                      </div>
                    )}
                    
                    {!isOwn && translateMessage && (
                      <button 
                        onClick={() => translateMessage(msg._id, msg.content)}
                        disabled={translateLoading === msg._id}
                        className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 opacity-0 group-hover/bubble:opacity-100 transition-all hover:scale-110 shadow-sm"
                        title="Translate Message"
                      >
                        {translateLoading === msg._id ? <div className="w-3 h-3 border-2 border-t-transparent border-blue-600 rounded-full animate-spin" /> : <Globe size={12} />}
                      </button>
                    )}
                  </div>
                  <span className="text-xs px-1 text-gray-400">{formatTime(msg.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}

        {typingUser && (
          <div className="flex items-center gap-2 mt-1 px-1">
            <div className="flex gap-1">
              {[0,150,300].map((d) => (
                <div key={d} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                     style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
            <span className="text-xs italic text-gray-500">{typingUser} is typing…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {showScrollBtn && (
        <button onClick={() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); setShowScrollBtn(false); }}
          className="absolute bottom-24 right-5 w-9 h-9 rounded-full flex items-center justify-center shadow-md bg-white border border-gray-200 text-gray-600 hover:scale-105 transition-transform">
          <ArrowDown size={16} />
        </button>
      )}

      {/* Input */}
      <div className="px-6 py-4 bg-white border-t border-gray-100 flex-shrink-0">
        <div className="flex items-end gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300">
          <textarea ref={textareaRef} rows={1} value={input}
            onChange={handleChange} onKeyDown={handleKeyDown}
            placeholder={`Message ${other?.username || ''}…`}
            className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed min-h-[24px] max-h-32 text-gray-800 placeholder-gray-400 py-1"
          />
          {input.length > 0 && (
            <button onClick={() => setInput('')} className="mb-1 text-gray-400 hover:text-red-500 transition-colors">
              ×
            </button>
          )}
          <button onClick={handleSend}
            disabled={!input.trim() || input.length > MAX_CHARS}
            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all mb-1 ${input.trim() && input.length <= MAX_CHARS ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-sm' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            <Send size={14} />
          </button>
        </div>
        <p className="text-center text-xs mt-2 text-gray-400">
          Private · Only you and {other?.username} can see this
        </p>
      </div>
    </div>
  );
};

export default DirectChatWindow;
