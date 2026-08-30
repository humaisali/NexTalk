import { useRef, useEffect, useState } from 'react';
import { useAuth }    from '../context/AuthContext';
import { useSocket }  from '../context/SocketContext';
import MessageBubble  from './MessageBubble';
import { ArrowDown, MessageSquare, Search } from 'lucide-react';

const ChatWindow = ({ onExplainCode, explainLoading, translations, translateLoading, translateMessage, searchQuery }) => {
  const { user }                              = useAuth();
  const { messages, typingUsers, activeRoom } = useSocket();
  const bottomRef                             = useRef(null);
  const containerRef                          = useRef(null);
  const [showScrollBtn, setShowScrollBtn]     = useState(false);
  const scrolledForRoomRef                    = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const isInitialRoomLoad = scrolledForRoomRef.current !== activeRoom?._id && messages.length > 0;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    const lastMessage = messages[messages.length - 1];
    const isOwnLastMessage = lastMessage && (lastMessage.sender?._id === user?._id || lastMessage.sender?._id?.toString() === user?._id?.toString());

    if (isInitialRoomLoad || nearBottom || isOwnLastMessage) {
      bottomRef.current?.scrollIntoView({ behavior: isInitialRoomLoad ? 'auto' : 'smooth' });
      setShowScrollBtn(false);
      if (isInitialRoomLoad) {
        scrolledForRoomRef.current = activeRoom?._id;
      }
    } else {
      setShowScrollBtn(true);
    }
  }, [messages, activeRoom?._id, user?._id]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (el) setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
  };

  const typingText =
    typingUsers.length === 1 ? `${typingUsers[0]} is typing…` :
    typingUsers.length === 2 ? `${typingUsers[0]} and ${typingUsers[1]} are typing…` :
    typingUsers.length > 2   ? 'Several people are typing…' : null;

  if (!activeRoom) return null;

  const filteredMessages = messages.filter((msg) => {
    if (!searchQuery) return true;
    if (msg.type === 'system') return false;
    return msg.content?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-[var(--surface-subtle)]">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-label={`${activeRoom.name} messages`}
        className="flex-1 overflow-y-auto px-3 py-5 sm:px-6 sm:py-6"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-5 text-center select-none animate-fade-in">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500 shadow-sm animate-float">
              <MessageSquare size={32} />
            </div>
            <div>
              <p className="font-bold text-lg text-gray-800">
                Welcome to <span className="text-blue-600">{activeRoom.name}</span>
              </p>
              <p className="text-sm mt-2 max-w-xs leading-relaxed text-gray-500">
                {activeRoom.description || 'Be the first to say something! AI features are active.'}
              </p>
            </div>
            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {['Tone Analysis', 'Smart Replies', 'Mood Detection', 'Code Explainer'].map((f) => (
                <span
                  key={f}
                  className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-500 shadow-sm"
                >
                  ✦ {f}
                </span>
              ))}
            </div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center opacity-60">
             <Search size={32} className="text-gray-400" />
             <p className="text-sm text-gray-500">No messages match "{searchQuery}"</p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <MessageBubble
              key={msg._id}
              msg={msg}
              isOwn={msg.sender?._id === user?._id || msg.sender?._id?.toString() === user?._id?.toString()}
              onExplainCode={onExplainCode}
              isExplaining={explainLoading}
              translation={translations?.[msg._id]}
              isTranslating={translateLoading === msg._id}
              onTranslate={() => translateMessage(msg._id, msg.content)}
            />
          ))
        )}

        {/* Typing indicator */}
        {typingText && (
          <div className="flex items-center gap-2.5 mt-2 px-1 animate-fade-in">
            <div className="flex gap-1">
              {[0, 150, 300].map((d) => (
                <div
                  key={d}
                  className="w-1.5 h-1.5 rounded-full bg-blue-400"
                  style={{
                    animation: `typing-bounce 1.4s ease-in-out infinite`,
                    animationDelay: `${d}ms`,
                  }}
                />
              ))}
            </div>
            <span className="text-xs italic text-gray-500">{typingText}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          type="button"
          onClick={() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            setShowScrollBtn(false);
          }}
          className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] shadow-lg transition-colors hover:bg-[var(--surface-muted)] sm:right-5"
          aria-label="Scroll to latest message"
        >
          <ArrowDown size={16} />
        </button>
      )}
    </div>
  );
};

export default ChatWindow;
