import { useRef, useEffect, useState } from 'react';
import { useAuth }    from '../context/AuthContext';
import { useSocket }  from '../context/SocketContext';
import MessageBubble  from './MessageBubble';
import { ArrowDown }  from 'lucide-react';

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
    if (nearBottom) { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); setShowScrollBtn(false); }
    else setShowScrollBtn(true);
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
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-6 py-5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center select-none">
            <div className="w-16 h-16 rounded-full border flex items-center justify-center text-2xl font-black"
                 style={{ background: 'rgba(255,239,178,0.06)', borderColor: '#025A50', color: '#FFEFB2' }}>
              {activeRoom.name?.[0]?.toUpperCase() || '#'}
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: '#FFEFB2' }}>
                Welcome to <span style={{ color: '#FFEFB2' }}>{activeRoom.name}</span>
              </p>
              <p className="text-xs mt-1" style={{ color: '#7A9E99' }}>
                {activeRoom.description || 'Be the first to say something!'}
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg._id} msg={msg}
              isOwn={msg.sender?._id === user?._id || msg.sender?._id?.toString() === user?._id?.toString()}
              onExplainCode={onExplainCode}
              isExplaining={explainLoading}
            />
          ))
        )}

        {typingText && (
          <div className="flex items-center gap-2 mt-1 px-1">
            <div className="flex gap-1">
              {[0,150,300].map((d) => (
                <div key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                     style={{ background: '#7A9E99', animationDelay: `${d}ms` }} />
              ))}
            </div>
            <span className="text-xs italic" style={{ color: '#7A9E99' }}>{typingText}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {showScrollBtn && (
        <button onClick={() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); setShowScrollBtn(false); }}
          className="absolute bottom-4 right-5 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all"
          style={{ background: '#FFEFB2', color: '#013E37' }}>
          <ArrowDown size={16} />
        </button>
      )}
    </div>
  );
};

export default ChatWindow;
