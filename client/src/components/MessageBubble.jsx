import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CodeBlock from './CodeBlock';
import { FiGlobe, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const TONE_CONFIG = {
  aggressive: { label: 'Aggressive', color: 'text-nt-danger',  bg: 'bg-nt-danger/10',  border: 'border-nt-danger/30',  emoji: '😤' },
  neutral:    { label: 'Neutral',    color: 'text-nt-warning', bg: 'bg-nt-warning/10', border: 'border-nt-warning/30', emoji: '😐' },
  friendly:   { label: 'Friendly',  color: 'text-nt-success', bg: 'bg-nt-success/10', border: 'border-nt-success/30', emoji: '😊' },
};

const MessageBubble = ({ msg, isOwn, onExplainCode, isExplaining }) => {
  const { user }           = useAuth();
  const [showTrans, setShowTrans] = useState(false);

  const time = new Date(msg.createdAt).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit'
  });

  const tone       = msg.tone ? TONE_CONFIG[msg.tone] : null;
  const translated = msg.translations?.get?.(user?.language) ||
                     (msg.translations instanceof Map
                       ? msg.translations.get(user?.language)
                       : msg.translations?.[user?.language]);

  if (msg.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-nt-muted bg-nt-surface2 px-4 py-1 rounded-full border border-nt-border">
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 mb-4 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>

      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-nt-surface2 border border-nt-border flex items-center justify-center text-sm font-semibold text-nt-text">
        {msg.sender?.avatar || msg.sender?.username?.[0]?.toUpperCase() || '?'}
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-1 max-w-xs lg:max-w-md xl:max-w-lg ${isOwn ? 'items-end' : 'items-start'}`}>

        {/* Sender name + time */}
        {!isOwn && (
          <div className="flex items-baseline gap-2 px-1">
            <span className="text-xs font-semibold text-nt-text">{msg.sender?.username}</span>
            <span className="text-xs text-nt-muted">{time}</span>
          </div>
        )}

        {/* Tone badge (above bubble, only for own messages) */}
        {isOwn && tone && (
          <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border self-end ${tone.bg} ${tone.border} ${tone.color}`}>
            <span>{tone.emoji}</span>
            <span>{tone.label}</span>
          </div>
        )}

        {/* Message bubble or code block */}
        {msg.type === 'code' ? (
          <CodeBlock
            content={msg.content}
            language={msg.language || 'javascript'}
            explanation={msg.codeExplanation}
            onExplain={(code, lang) => onExplainCode?.(msg._id, code, lang)}
            isExplaining={isExplaining === msg._id}
          />
        ) : (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words
            ${isOwn
              ? 'bg-nt-blue text-white rounded-tr-sm'
              : 'bg-nt-surface2 text-nt-text border border-nt-border rounded-tl-sm'
            }`}>
            {msg.content}
          </div>
        )}

        {/* Bottom row: time (own) + translation toggle */}
        <div className={`flex items-center gap-2 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          {isOwn && <span className="text-xs text-nt-muted">{time}</span>}

          {/* Translation toggle */}
          {translated && translated !== msg.content && (
            <button
              onClick={() => setShowTrans(!showTrans)}
              className="flex items-center gap-1 text-xs text-nt-muted hover:text-nt-cyan transition-colors"
            >
              <FiGlobe size={10} />
              <span>Translation</span>
              {showTrans ? <FiChevronUp size={10} /> : <FiChevronDown size={10} />}
            </button>
          )}
        </div>

        {/* Translation bubble */}
        {showTrans && translated && (
          <div className={`px-3 py-2 rounded-xl text-xs text-nt-muted border border-nt-cyan/20 bg-nt-cyan/5 leading-relaxed
            ${isOwn ? 'self-end' : 'self-start'}`}>
            <div className="flex items-center gap-1 mb-1">
              <FiGlobe size={10} className="text-nt-cyan" />
              <span className="text-nt-cyan font-medium">Translated</span>
            </div>
            {translated}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
