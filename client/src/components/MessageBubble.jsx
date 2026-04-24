import { useState, useEffect } from 'react';
import { useAuth }   from '../context/AuthContext';
import CodeBlock     from './CodeBlock';
import { FiGlobe, FiChevronDown, FiChevronUp, FiLoader } from 'react-icons/fi';

const TONE_CONFIG = {
  aggressive: { label: 'Aggressive', color: 'text-nt-danger',  bg: 'bg-nt-danger/10',  border: 'border-nt-danger/30',  emoji: '😤' },
  neutral:    { label: 'Neutral',    color: 'text-nt-warning', bg: 'bg-nt-warning/10', border: 'border-nt-warning/30', emoji: '😐' },
  friendly:   { label: 'Friendly',  color: 'text-nt-success', bg: 'bg-nt-success/10', border: 'border-nt-success/30', emoji: '😊' },
};

/**
 * MessageBubble — Day 6 update:
 *  - Calls onAutoTranslate on mount for non-English users (received messages only)
 *  - Shows translated text automatically if available
 *  - Translation toggle still available manually
 *
 * Props:
 *   msg                — message object
 *   isOwn              — boolean
 *   onExplainCode      — async (msgId, code, lang)
 *   isExplaining       — msgId being explained
 *   onTranslate        — async (msgId, content, lang) — manual trigger
 *   onAutoTranslate    — async (message) — auto trigger on mount
 *   translationLoading — msgId being translated
 *   translations       — { [msgId]: text }
 *   userLanguage       — e.g. 'ur', 'hi', 'en'
 */
const MessageBubble = ({
  msg,
  isOwn,
  onExplainCode,
  isExplaining,
  onTranslate,
  onAutoTranslate,
  translationLoading,
  translations = {},
  userLanguage = 'en'
}) => {
  const { user }            = useAuth();
  const [showTrans, setShowTrans] = useState(false);

  // Day 6: auto-translate received text messages on mount
  useEffect(() => {
    if (!isOwn && msg.type === 'text' && userLanguage && userLanguage !== 'en') {
      onAutoTranslate?.(msg);
    }
  }, [msg._id, userLanguage]);

  // Auto-show translation bubble when it arrives
  useEffect(() => {
    if (translations[msg._id] && !showTrans && !isOwn) {
      setShowTrans(true);
    }
  }, [translations[msg._id]]);

  const time         = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const tone         = msg.tone ? TONE_CONFIG[msg.tone] : null;
  const translated   = translations[msg._id];
  const isTranslating = translationLoading === msg._id;

  const showTranslateControls =
    !isOwn &&
    msg.type === 'text' &&
    userLanguage &&
    userLanguage !== 'en';

  // System message
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

      {/* Content column */}
      <div className={`flex flex-col gap-1 max-w-xs lg:max-w-md xl:max-w-lg ${isOwn ? 'items-end' : 'items-start'}`}>

        {/* Sender name + time */}
        {!isOwn && (
          <div className="flex items-baseline gap-2 px-1">
            <span className="text-xs font-semibold text-nt-text">{msg.sender?.username}</span>
            <span className="text-xs text-nt-muted">{time}</span>
          </div>
        )}

        {/* Tone badge */}
        {isOwn && tone && (
          <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border self-end ${tone.bg} ${tone.border} ${tone.color}`}>
            <span>{tone.emoji}</span>
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
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words
            ${isOwn
              ? 'bg-nt-blue text-white rounded-tr-sm'
              : 'bg-nt-surface2 text-nt-text border border-nt-border rounded-tl-sm'
            }`}>
            {msg.content}
          </div>
        )}

        {/* Bottom meta row */}
        <div className={`flex items-center gap-2 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          {isOwn && <span className="text-xs text-nt-muted">{time}</span>}

          {/* Translation control */}
          {showTranslateControls && (
            <button
              onClick={() => {
                if (!translated && !isTranslating) onTranslate?.(msg._id, msg.content, userLanguage);
                setShowTrans(!showTrans);
              }}
              className="flex items-center gap-1 text-xs text-nt-muted hover:text-nt-cyan transition-colors"
            >
              {isTranslating
                ? <FiLoader size={10} className="animate-spin text-nt-cyan" />
                : <FiGlobe size={10} />
              }
              <span>{isTranslating ? 'Translating…' : 'Translation'}</span>
              {translated && !isTranslating && (
                showTrans ? <FiChevronUp size={10} /> : <FiChevronDown size={10} />
              )}
            </button>
          )}
        </div>

        {/* Translation bubble */}
        {showTrans && (translated || isTranslating) && (
          <div className={`px-3 py-2 rounded-xl text-xs border border-nt-cyan/25 bg-nt-cyan/5 leading-relaxed
            ${isOwn ? 'self-end' : 'self-start'}`}>
            <div className="flex items-center gap-1 mb-1">
              <FiGlobe size={10} className="text-nt-cyan" />
              <span className="text-nt-cyan font-semibold uppercase tracking-wider text-xs">
                {userLanguage}
              </span>
            </div>
            {isTranslating
              ? <span className="text-nt-muted italic">Translating…</span>
              : <p className="text-nt-muted">{translated}</p>
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
