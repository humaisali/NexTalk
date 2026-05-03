import { useEffect, useState } from 'react';
import { X, Zap, Copy, Check, RefreshCw, MessageSquare } from 'lucide-react';

const SummaryModal = ({ isOpen, onClose, summary, keyTopics = [], messageCount = 0, isLoading, onGenerate }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (isOpen && !summary && !isLoading) onGenerate?.(); }, [isOpen]);
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  if (!isOpen) return null;

  const bullets = summary
    ? summary.split('\n').map((l) => l.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean)
    : [];

  const handleCopy = async () => {
    const text = bullets.map((b, i) => `${i + 1}. ${b}`).join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)' }}
         onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="w-full max-w-lg rounded-nt-xl overflow-hidden shadow-nt-float animate-slide-up border"
           style={{ background: '#012B26', borderColor: '#025A50' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b"
             style={{ borderColor: '#025A50', background: '#013E37' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-nt flex items-center justify-center"
                 style={{ background: 'rgba(255,239,178,0.1)', border: '1px solid rgba(255,239,178,0.2)' }}>
              <Zap size={18} style={{ color: '#FFEFB2' }} />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#FFEFB2' }}>Catch Me Up</h3>
              <p className="text-xs" style={{ color: '#7A9E99' }}>AI-generated conversation summary</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-all"
                  style={{ color: '#7A9E99' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#FFEFB2'; e.currentTarget.style.background = 'rgba(255,239,178,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#7A9E99'; e.currentTarget.style.background = 'transparent'; }}>
            <X size={16} />
          </button>
        </div>

        {/* Stats + topics */}
        {!isLoading && summary && (
          <div className="px-6 py-3 border-b flex flex-wrap items-center gap-3"
               style={{ borderColor: '#025A50', background: 'rgba(255,239,178,0.03)' }}>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#7A9E99' }}>
              <MessageSquare size={11} />
              <span>{messageCount} messages summarized</span>
            </div>
            {keyTopics.map((t) => (
              <span key={t} className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(255,239,178,0.1)', border: '1px solid rgba(255,239,178,0.2)', color: '#FFEFB2' }}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 min-h-[160px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="flex gap-2">
                {[0,200,400].map((d) => (
                  <div key={d} className="w-2.5 h-2.5 rounded-full animate-bounce"
                       style={{ background: '#FFEFB2', animationDelay: `${d}ms` }} />
                ))}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: '#FFEFB2' }}>Reading the conversation…</p>
                <p className="text-xs mt-1" style={{ color: '#7A9E99' }}>Gemini is catching you up</p>
              </div>
            </div>
          ) : bullets.length > 0 ? (
            <ul className="space-y-3.5">
              {bullets.map((line, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                       style={{ background: 'rgba(255,239,178,0.12)', border: '1px solid rgba(255,239,178,0.2)' }}>
                    <span className="text-xs font-bold" style={{ color: '#FFEFB2' }}>{i + 1}</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#D4C98A' }}>{line}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <MessageSquare size={36} style={{ color: '#025A50' }} />
              <p className="text-sm" style={{ color: '#7A9E99' }}>No messages to summarize yet.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between gap-3"
             style={{ borderColor: '#025A50', background: '#013E37' }}>
          <p className="text-xs flex items-center gap-1.5" style={{ color: 'rgba(122,158,153,0.6)' }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#60D4C8' }} />
            Powered by Google Gemini
          </p>
          <div className="flex gap-2">
            {bullets.length > 0 && !isLoading && (
              <>
                <button onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-nt border transition-all"
                  style={{ borderColor: '#025A50', color: '#7A9E99' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FFEFB2'; e.currentTarget.style.color = '#FFEFB2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#025A50'; e.currentTarget.style.color = '#7A9E99'; }}>
                  {copied ? <Check size={11} style={{ color: '#4ADE80' }} /> : <Copy size={11} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={onGenerate}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-nt border transition-all"
                  style={{ borderColor: '#025A50', color: '#7A9E99' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FFEFB2'; e.currentTarget.style.color = '#FFEFB2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#025A50'; e.currentTarget.style.color = '#7A9E99'; }}>
                  <RefreshCw size={11} />Regenerate
                </button>
              </>
            )}
            <button onClick={onClose}
              className="text-xs px-4 py-1.5 rounded-nt font-semibold transition-all active:scale-95"
              style={{ background: '#FFEFB2', color: '#013E37' }}>
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryModal;
