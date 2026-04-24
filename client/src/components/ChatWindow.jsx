import { useRef, useEffect, useState } from 'react';
import { useAuth }    from '../context/AuthContext';
import { useSocket }  from '../context/SocketContext';
import MessageBubble  from './MessageBubble';
import { FiArrowDown } from 'react-icons/fi';

/**
 * ChatWindow
 *
 * Day 6 props added:
 *   onAutoTranslate  — async (message) called for each received msg on render
 *   userLanguage     — current user language code ('en', 'ur', etc.)
 */
const ChatWindow = ({
  onExplainCode,
  explainLoading,
  onTranslate,
  onAutoTranslate,
  translationLoading,
  translations = {},
  userLanguage = 'en'
}) => {
  const { user }                              = useAuth();
  const { messages, typingUsers, activeRoom } = useSocket();
  const bottomRef                             = useRef(null);
  const containerRef                          = useRef(null);
  const [showScrollBtn, setShowScrollBtn]     = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (nearBottom) { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); setShowScrollBtn(false); }
    else setShowScrollBtn(true);
  }, [messages]);

  useEffect(() => { setShowScrollBtn(false); }, [activeRoom?._id]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (el) setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
  };

  const scrollToBottom = () => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); setShowScrollBtn(false); };

  const typingText =
    typingUsers.length === 1 ? `${typingUsers[0]} is typing…` :
    typingUsers.length === 2 ? `${typingUsers[0]} and ${typingUsers[1]} are typing…` :
    typingUsers.length  >  2 ? 'Several people are typing…' : null;

  if (!activeRoom) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center select-none">
            <div className="w-14 h-14 rounded-2xl bg-nt-surface2 border border-nt-border flex items-center justify-center text-2xl">💬</div>
            <div>
              <p className="text-nt-text font-semibold mb-1">Welcome to <span className="text-nt-blue">#{activeRoom.name}</span></p>
              <p className="text-nt-muted text-sm">This is the beginning of the conversation.</p>
              {activeRoom.description && <p className="text-nt-muted/60 text-xs mt-1">{activeRoom.description}</p>}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              msg={msg}
              isOwn={
                msg.sender?._id === user?._id ||
                msg.sender?._id?.toString() === user?._id?.toString()
              }
              onExplainCode={onExplainCode}
              isExplaining={explainLoading}
              onTranslate={onTranslate}
              onAutoTranslate={onAutoTranslate}
              translationLoading={translationLoading}
              translations={translations}
              userLanguage={userLanguage}
            />
          ))
        )}

        {/* Typing indicator */}
        {typingText && (
          <div className="flex items-center gap-2 mt-1 px-1">
            <div className="flex gap-1">
              {[0, 150, 300].map((d) => (
                <div key={d} className="w-1.5 h-1.5 rounded-full bg-nt-muted animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
            <span className="text-xs text-nt-muted italic">{typingText}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {showScrollBtn && (
        <button onClick={scrollToBottom}
          className="absolute bottom-4 right-5 w-9 h-9 rounded-full bg-nt-blue shadow-lg shadow-nt-blue/30 flex items-center justify-center text-white hover:bg-blue-500 transition-all z-10">
          <FiArrowDown size={16} />
        </button>
      )}
    </div>
  );
};

export default ChatWindow;
