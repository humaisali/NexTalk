import { useRef, useEffect, useState } from 'react';
import { useAuth }    from '../context/AuthContext';
import { useSocket }  from '../context/SocketContext';
import MessageBubble  from './MessageBubble';
import { ArrowDown, MessageSquare } from 'lucide-react';

const ChatWindow = ({ onExplainCode, explainLoading }) => {
  const { user }                              = useAuth();
  const { messages, typingUsers, activeRoom } = useSocket();
  const bottomRef                             = useRef(null);
  const containerRef                          = useRef(null);
  const [showScrollBtn, setShowScrollBtn]     = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (nearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setShowScrollBtn(false);
    } else {
      setShowScrollBtn(true);
    }
  }, [messages]);

  useEffect(() => { setShowScrollBtn(false); }, [activeRoom?._id]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (el) setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
  };

  const typingText =
    typingUsers.length === 1 ? `${typingUsers[0]} is typing…` :
    typingUsers.length === 2 ? `${typingUsers[0]} and ${typingUsers[1]} are typing…` :
    typingUsers.length > 2   ? 'Several people are typing…' : null;

  if (!activeRoom) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative chat-bg">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-6"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-5 text-center select-none animate-fade-in">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center animate-float"
              style={{
                background: 'linear-gradient(135deg, rgba(255,239,178,0.12), rgba(255,239,178,0.06))',
                border: '1px solid rgba(255,239,178,0.15)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.3), 0 0 40px rgba(255,239,178,0.05)',
              }}
            >
              <MessageSquare size={32} style={{ color: '#FFEFB2', opacity: 0.6 }} />
            </div>
            <div>
              <p className="font-bold text-base" style={{ color: '#FFEFB2' }}>
                Welcome to{' '}
                <span className="text-gradient">{activeRoom.name}</span>
              </p>
              <p className="text-sm mt-2 max-w-xs leading-relaxed" style={{ color: 'rgba(122,158,153,0.6)' }}>
                {activeRoom.description || 'Be the first to say something! AI features are active.'}
              </p>
            </div>
            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 justify-center">
              {['Tone Analysis', 'Smart Replies', 'Mood Detection', 'Code Explainer'].map((f) => (
                <span
                  key={f}
                  className="text-xs px-3 py-1.5 rounded-full"
                  style={{
                    background: 'rgba(255,239,178,0.05)',
                    border: '1px solid rgba(255,239,178,0.08)',
                    color: 'rgba(122,158,153,0.6)',
                  }}
                >
                  ✦ {f}
                </span>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              msg={msg}
              isOwn={msg.sender?._id === user?._id || msg.sender?._id?.toString() === user?._id?.toString()}
              onExplainCode={onExplainCode}
              isExplaining={explainLoading}
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
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: '#7A9E99',
                    animation: `typing-bounce 1.4s ease-in-out infinite`,
                    animationDelay: `${d}ms`,
                  }}
                />
              ))}
            </div>
            <span className="text-xs italic" style={{ color: 'rgba(122,158,153,0.6)' }}>{typingText}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            setShowScrollBtn(false);
          }}
          className="absolute bottom-4 right-5 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover-lift animate-scale-in"
          style={{
            background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)',
            color: '#013E37',
            boxShadow: '0 4px 15px rgba(255,239,178,0.3), 0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <ArrowDown size={16} />
        </button>
      )}
    </div>
  );
};

export default ChatWindow;
