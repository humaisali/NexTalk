import { lazy, Suspense, useState } from 'react';
import { Globe, FileText, Download } from 'lucide-react';
import VoicePlayer from './VoicePlayer';
import ImageModal from './ImageModal';

const CodeBlock = lazy(() => import('./CodeBlock'));
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
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImg, setSelectedImg] = useState('');
  const tone = msg.tone ? TONE_CONFIG[msg.tone] : null;

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl.replace(/\/$/, '')}${url}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (msg.type === 'system') {
    return (
      <div className="flex justify-center my-4">
        <span className="text-xs px-4 py-1.5 rounded-full bg-white dark:bg-nt-bg2 border border-gray-200 dark:border-nt-border text-gray-500 dark:text-nt-muted shadow-sm">
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
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-100 dark:border-nt-border shadow-sm">
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
            <span className="text-xs font-semibold text-gray-700 dark:text-nt-text">
              {msg.sender?.username}
            </span>
            <span className="text-xs text-gray-400 dark:text-nt-muted">{time}</span>
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

        {/* Bubble or CodeBlock or Media Attachment */}
        {msg.type === 'code' ? (
          <Suspense fallback={<div className="w-72 h-24 rounded-2xl bg-gray-900 animate-pulse" />}>
            <CodeBlock
              content={msg.content}
              language={msg.language || 'javascript'}
              explanation={msg.codeExplanation || ''}
              onExplain={(code, lang) => onExplainCode?.(msg._id, code, lang)}
              isExplaining={isExplaining === msg._id}
            />
          </Suspense>
        ) : msg.type === 'voice' ? (
          <VoicePlayer src={msg.fileUrl} isOwn={isOwn} />
        ) : msg.type === 'file' && msg.fileType?.startsWith('image/') ? (
          <div className="flex flex-col gap-1">
            <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-nt-border max-w-xs md:max-w-sm shadow-sm bg-white dark:bg-nt-bg2 group/img relative">
              <img 
                  src={getFullUrl(msg.fileUrl)} 
                  alt={msg.fileName || 'Image Attachment'} 
                  className="w-full h-auto max-h-72 object-cover hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
                  onClick={() => { setSelectedImg(getFullUrl(msg.fileUrl)); setShowImageModal(true); }}
                />
              <div className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                <a 
                  href={getFullUrl(msg.fileUrl)} 
                  download={msg.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  title="Download Image"
                >
                  <Download size={14} />
                </a>
              </div>
            </div>
            {showImageModal && (
              <ImageModal src={selectedImg} onClose={() => setShowImageModal(false)} />
            )}
            {msg.content && (
              <div className={`px-4 py-2 rounded-2xl text-sm break-words whitespace-pre-wrap shadow-sm ${isOwn ? 'rounded-tr-sm bg-blue-600 text-white' : 'rounded-tl-sm bg-white dark:bg-nt-bg2 border border-gray-100 dark:border-nt-border text-gray-800 dark:text-nt-text'}`}>
                {msg.content}
              </div>
            )}
          </div>
        ) : msg.type === 'file' ? (
          <div className="flex flex-col gap-1">
            <div className={`flex items-center gap-3 p-3 rounded-xl border max-w-xs md:max-w-sm shadow-sm ${isOwn ? 'bg-sec-light/40 border-nt-border2 text-[#FFEFB2]' : 'bg-white dark:bg-nt-bg3 border-gray-200 dark:border-nt-border text-gray-800 dark:text-nt-text'}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isOwn ? 'bg-sec-dark/50 text-[#FFEFB2]' : 'bg-blue-50 dark:bg-nt-bg2 text-blue-600 dark:text-nt-teal'}`}>
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" title={msg.fileName}>
                  {msg.fileName}
                </p>
                <p className="text-xs opacity-75 font-medium mt-0.5">
                  {formatFileSize(msg.fileSize)}
                </p>
              </div>
              <a 
                href={getFullUrl(msg.fileUrl)} 
                download={msg.fileName}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isOwn ? 'hover:bg-sec-dark/40 text-[#FFEFB2]' : 'hover:bg-gray-100 dark:hover:bg-nt-bg2 text-gray-500 dark:text-nt-muted hover:text-gray-800 dark:hover:text-nt-text'}`}
                title="Download File"
              >
                <Download size={16} />
              </a>
            </div>
            {msg.content && (
              <div className={`px-4 py-2 rounded-2xl text-sm break-words whitespace-pre-wrap shadow-sm ${isOwn ? 'rounded-tr-sm bg-blue-600 text-white' : 'rounded-tl-sm bg-white dark:bg-nt-bg2 border border-gray-100 dark:border-nt-border text-gray-800 dark:text-nt-text'}`}>
                {msg.content}
              </div>
            )}
          </div>
        ) : (
          <div
            className={`px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap relative group/bubble shadow-sm ${isOwn ? 'rounded-2xl rounded-tr-sm bg-blue-600 text-white' : 'rounded-2xl rounded-tl-sm bg-white dark:bg-nt-bg2 border border-gray-100 dark:border-nt-border text-gray-800 dark:text-nt-text'}`}
          >
            {msg.content}
            {translation && (
              <div className={`mt-2 pt-2 border-t text-xs opacity-90 ${isOwn ? 'border-white/20' : 'border-gray-200 dark:border-nt-border'}`}>
                <strong>Translation:</strong> {translation}
              </div>
            )}
            
            {/* Translate Button */}
            {!isOwn && onTranslate && (
              <button 
                onClick={onTranslate}
                disabled={isTranslating}
                className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-blue-50 dark:bg-nt-bg3 text-blue-600 dark:text-nt-teal border border-blue-100 dark:border-nt-border opacity-0 group-hover/bubble:opacity-100 transition-all hover:scale-110 shadow-sm"
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
