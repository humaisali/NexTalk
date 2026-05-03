import { useState, useEffect } from 'react';
import { useAuth }   from '../context/AuthContext';
import CodeBlock     from './CodeBlock';
import { Globe, ChevronDown, ChevronUp, Loader } from 'lucide-react';

const TONE_CONFIG = {
  aggressive: { label: 'Aggressive', color: '#F87171',  bg: 'rgba(248,113,113,0.12)',  border: 'rgba(248,113,113,0.3)'  },
  neutral:    { label: 'Neutral',    color: '#FCD34D',  bg: 'rgba(252,211,77,0.12)',   border: 'rgba(252,211,77,0.3)'   },
  friendly:   { label: 'Friendly',  color: '#4ADE80',  bg: 'rgba(74,222,128,0.12)',   border: 'rgba(74,222,128,0.3)'   },
};

const MessageBubble = ({
  msg, isOwn,
  onExplainCode, isExplaining,
  onTranslate, onAutoTranslate,
  translationLoading, translations = {},
  userLanguage = 'en'
}) => {
  const { user }  = useAuth();
  const [showTrans, setShowTrans] = useState(false);

  useEffect(() => {
    if (!isOwn && msg.type === 'text' && userLanguage && userLanguage !== 'en') {
      onAutoTranslate?.(msg);
    }
  }, [msg._id, userLanguage]);

  useEffect(() => {
    if (translations[msg._id] && !showTrans && !isOwn) setShowTrans(true);
  }, [translations[msg._id]]);

  const time        = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const tone        = msg.tone ? TONE_CONFIG[msg.tone] : null;
  const translated  = translations[msg._id];
  const isTranslating = translationLoading === msg._id;

  const showTranslateControls = !isOwn && msg.type === 'text' && userLanguage && userLanguage !== 'en';

  if (msg.type === 'system') {
    return (
      <div className="flex justify-center my-3">
        <span className="text-xs px-4 py-1 rounded-full border"
              style={{ color: '#7A9E99', background: 'rgba(255,239,178,0.05)', borderColor: '#025A50' }}>
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 mb-5 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>

      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border flex items-center justify-center text-xs font-bold"
           style={{ background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)', borderColor: '#025A50', color: '#013E37' }}>
        {(msg.sender?.avatar?.startsWith?.('data:') || msg.sender?.avatar?.startsWith?.('http'))
          ? <img src={msg.sender.avatar} alt="" className="w-full h-full object-cover" />
          : msg.sender?.username?.[0]?.toUpperCase() || '?'
        }
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-1 max-w-xs lg:max-w-md xl:max-w-lg ${isOwn ? 'items-end' : 'items-start'}`}>

        {/* Sender + time */}
        {!isOwn && (
          <div className="flex items-baseline gap-2 px-1">
            <span className="text-xs font-semibold" style={{ color: '#FFEFB2' }}>{msg.sender?.username}</span>
            <span className="text-xs" style={{ color: '#7A9E99' }}>{time}</span>
          </div>
        )}

        {/* Tone badge (own messages) */}
        {isOwn && tone && (
          <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border self-end"
               style={{ color: tone.color, background: tone.bg, borderColor: tone.border }}>
            <span>{tone.label}</span>
          </div>
        )}

        {/* Bubble or CodeBlock */}
        {msg.type === 'code' ? (
          <CodeBlock
            content={msg.content} language={msg.language || 'javascript'}
            explanation={msg.codeExplanation || ''}
            onExplain={(code, lang) => onExplainCode?.(msg._id, code, lang)}
            isExplaining={isExplaining === msg._id}
          />
        ) : (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words
            ${isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
               style={isOwn
                 ? { background: '#013E37', color: '#FFEFB2', border: '1px solid #025A50' }
                 : { background: '#012B26', color: '#FFEFB2', border: '1px solid #025A50' }
               }>
            {msg.content}
          </div>
        )}

        {/* Meta row */}
        <div className={`flex items-center gap-2 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          {isOwn && <span className="text-xs" style={{ color: '#7A9E99' }}>{time}</span>}

          {showTranslateControls && (
            <button
              onClick={() => {
                if (!translated && !isTranslating) onTranslate?.(msg._id, msg.content, userLanguage);
                setShowTrans(!showTrans);
              }}
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: '#7A9E99' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#60D4C8'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#7A9E99'}
            >
              {isTranslating ? <Loader size={10} className="animate-spin" /> : <Globe size={10} />}
              <span>{isTranslating ? 'Translating…' : 'Translate'}</span>
              {translated && !isTranslating && (showTrans ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
            </button>
          )}
        </div>

        {/* Translation bubble */}
        {showTrans && (translated || isTranslating) && (
          <div className="px-3 py-2 rounded-xl text-xs border leading-relaxed max-w-xs"
               style={{ borderColor: 'rgba(96,212,200,0.25)', background: 'rgba(96,212,200,0.05)', color: '#7A9E99' }}>
            <div className="flex items-center gap-1 mb-1">
              <Globe size={10} style={{ color: '#60D4C8' }} />
              <span className="font-semibold uppercase text-xs" style={{ color: '#60D4C8' }}>{userLanguage}</span>
            </div>
            {isTranslating ? <span className="italic">Translating…</span> : <p>{translated}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
