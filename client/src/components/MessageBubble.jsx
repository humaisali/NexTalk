import CodeBlock from './CodeBlock';
import { Globe } from 'lucide-react';

const TONE_CONFIG = {
  aggressive: {
    label: 'Aggressive',
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fecaca',
    dot: '#ef4444',
  },
  neutral: {
    label: 'Neutral',
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fde68a',
    dot: '#f59e0b',
  },
  friendly: {
    label: 'Friendly',
    color: '#10b981',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    dot: '#10b981',
  },
};

const MessageBubble = ({ msg, isOwn, onExplainCode, isExplaining, translation, isTranslating, onTranslate }) => {
  const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const tone = msg.tone ? TONE_CONFIG[msg.tone] : null;

  if (msg.type === 'system') {
    return (
      <div className="flex justify-center my-4">
        <span className="text-xs px-4 py-1.5 rounded-full bg-white border border-gray-200 text-gray-500 shadow-sm">
          {msg.content}
        </span>
      </div>
    );
  }

  const senderAvatar = msg.sender?.avatar;
  const hasImg = senderAvatar?.startsWith?.('data:') || senderAvatar?.startsWith?.('http');

  return (
    <div className={`flex gap-3 mb-5 group animate-fade-in ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>

      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-100 shadow-sm">
          {hasImg
            ? <img src={senderAvatar} alt="" className="w-full h-full object-cover" />
            : msg.sender?.username?.[0]?.toUpperCase() || '?'
          }
        </div>
      </div>

      {/* Content column */}
      <div className={`flex flex-col gap-1 max-w-xs lg:max-w-md xl:max-w-lg ${isOwn ? 'items-end' : 'items-start'}`}>

        {/* Sender + time */}
        {!isOwn && (
          <div className="flex items-baseline gap-2 px-1">
            <span className="text-xs font-semibold text-gray-700">
              {msg.sender?.username}
            </span>
            <span className="text-xs text-gray-400">{time}</span>
          </div>
        )}

        {/* Tone badge */}
        {isOwn && tone && (
          <div
            className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full mb-0.5 font-medium"
            style={{ color: tone.color, background: tone.bg, border: `1px solid ${tone.border}` }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: tone.dot }} />
            <span>{tone.label}</span>
          </div>
        )}

        {/* Bubble or CodeBlock */}
        {msg.type === 'code' ? (
          <CodeBlock
            content={msg.content}
            language={msg.language || 'javascript'}
            explanation={msg.codeExplanation || ''}
            onExplain={(code, lang) => onExplainCode?.(msg._id, code, lang)}
            isExplaining={isExplaining === msg._id}
          />
        ) : (
          <div
            className={`px-4 py-2.5 text-sm leading-relaxed break-words relative group/bubble shadow-sm ${isOwn ? 'rounded-2xl rounded-tr-sm bg-blue-600 text-white' : 'rounded-2xl rounded-tl-sm bg-white border border-gray-100 text-gray-800'}`}
          >
            {msg.content}
            {translation && (
              <div className={`mt-2 pt-2 border-t text-xs opacity-90 ${isOwn ? 'border-white/20' : 'border-gray-100'}`}>
                <strong>Translation:</strong> {translation}
              </div>
            )}
            
            {/* Translate Button */}
            {!isOwn && onTranslate && (
              <button 
                onClick={onTranslate}
                disabled={isTranslating}
                className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 opacity-0 group-hover/bubble:opacity-100 transition-all hover:scale-110 shadow-sm"
                title="Translate Message"
              >
                {isTranslating ? <div className="w-3 h-3 border-2 border-t-transparent border-blue-600 rounded-full animate-spin" /> : <Globe size={12} />}
              </button>
            )}
          </div>
        )}

        {/* Timestamp for own messages */}
        {isOwn && (
          <span className="text-[10px] px-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
            {time}
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
