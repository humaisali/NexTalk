import CodeBlock from './CodeBlock';

const TONE_CONFIG = {
  aggressive: {
    label: 'Aggressive',
    color: '#F87171',
    bg: 'rgba(248,113,113,0.1)',
    border: 'rgba(248,113,113,0.25)',
    dot: '#F87171',
  },
  neutral: {
    label: 'Neutral',
    color: '#FCD34D',
    bg: 'rgba(252,211,77,0.1)',
    border: 'rgba(252,211,77,0.25)',
    dot: '#FCD34D',
  },
  friendly: {
    label: 'Friendly',
    color: '#4ADE80',
    bg: 'rgba(74,222,128,0.1)',
    border: 'rgba(74,222,128,0.25)',
    dot: '#4ADE80',
  },
};

const MessageBubble = ({ msg, isOwn, onExplainCode, isExplaining }) => {
  const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const tone = msg.tone ? TONE_CONFIG[msg.tone] : null;

  if (msg.type === 'system') {
    return (
      <div className="flex justify-center my-4">
        <span
          className="text-xs px-4 py-1.5 rounded-full"
          style={{
            color: 'rgba(122,158,153,0.6)',
            background: 'rgba(255,239,178,0.04)',
            border: '1px solid rgba(255,239,178,0.07)',
          }}
        >
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
        <div
          className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)',
            border: '1px solid rgba(255,239,178,0.2)',
            color: '#013E37',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
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
            <span className="text-xs font-semibold" style={{ color: '#FFEFB2' }}>
              {msg.sender?.username}
            </span>
            <span className="text-xs" style={{ color: 'rgba(122,158,153,0.5)' }}>{time}</span>
          </div>
        )}

        {/* Tone badge */}
        {isOwn && tone && (
          <div
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
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
            className={`px-4 py-2.5 text-sm leading-relaxed break-words ${isOwn ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm'}`}
            style={isOwn ? {
              background: 'linear-gradient(135deg, #013E37 0%, #025A50 100%)',
              color: '#FFEFB2',
              border: '1px solid rgba(255,239,178,0.15)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,239,178,0.08)',
            } : {
              background: 'rgba(15,33,30,0.9)',
              color: '#FFEFB2',
              border: '1px solid rgba(255,239,178,0.08)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            }}
          >
            {msg.content}
          </div>
        )}

        {/* Timestamp for own messages */}
        {isOwn && (
          <span className="text-xs px-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'rgba(122,158,153,0.5)' }}>
            {time}
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
