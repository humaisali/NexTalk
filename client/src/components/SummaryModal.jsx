import { useEffect, useState } from 'react';
import { X, Zap, Copy, Check, RefreshCw, MessageSquare, Sparkles } from 'lucide-react';

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        className="w-full max-w-lg rounded-nt-2xl overflow-hidden animate-slide-up modal-content"
        style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(13,26,24,0.95), rgba(15,30,27,0.95))',
            borderBottom: '1px solid rgba(255,239,178,0.08)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,239,178,0.15), rgba(255,239,178,0.08))',
                border: '1px solid rgba(255,239,178,0.18)',
                boxShadow: '0 0 20px rgba(255,239,178,0.1)',
              }}
            >
              <Zap size={18} style={{ color: '#FFEFB2' }} />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#FFEFB2' }}>Catch Me Up</h3>
              <p className="text-xs" style={{ color: 'rgba(122,158,153,0.6)' }}>AI-generated conversation summary</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{ color: '#7A9E99' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#FFEFB2'; e.currentTarget.style.background = 'rgba(255,239,178,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#7A9E99'; e.currentTarget.style.background = 'transparent'; }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Topics bar */}
        {!isLoading && summary && (
          <div
            className="px-6 py-3 flex flex-wrap items-center gap-2 flex-shrink-0"
            style={{
              background: 'rgba(8,14,13,0.5)',
              borderBottom: '1px solid rgba(255,239,178,0.06)',
            }}
          >
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(122,158,153,0.6)' }}>
              <MessageSquare size={11} />
              <span>{messageCount} messages</span>
            </div>
            {keyTopics.map((t) => (
              <span
                key={t}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(255,239,178,0.08)',
                  border: '1px solid rgba(255,239,178,0.14)',
                  color: '#D4C98A',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 flex-1 overflow-y-auto min-h-[160px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-5">
              <div className="relative">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center animate-glow-pulse"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,239,178,0.1), rgba(255,239,178,0.05))',
                    border: '1px solid rgba(255,239,178,0.15)',
                  }}
                >
                  <Sparkles size={24} style={{ color: '#FFEFB2' }} />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: '#FFEFB2' }}>Reading the conversation…</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(122,158,153,0.6)' }}>Gemini AI is catching you up</p>
              </div>
              <div className="flex gap-2">
                {[0,200,400].map((d) => (
                  <div
                    key={d}
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: '#FFEFB2', opacity: 0.6, animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            </div>
          ) : bullets.length > 0 ? (
            <ul className="space-y-4">
              {bullets.map((line, i) => (
                <li key={i} className="flex items-start gap-3.5 group/item">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,239,178,0.12), rgba(255,239,178,0.06))',
                      border: '1px solid rgba(255,239,178,0.15)',
                    }}
                  >
                    <span className="text-xs font-bold" style={{ color: '#FFEFB2' }}>{i + 1}</span>
                  </div>
                  <p className="text-sm leading-relaxed flex-1 pt-0.5" style={{ color: '#D4C98A' }}>{line}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <MessageSquare size={36} style={{ color: 'rgba(2,90,80,0.4)' }} />
              <p className="text-sm" style={{ color: '#7A9E99' }}>No messages to summarize yet.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex items-center justify-between gap-3 flex-shrink-0"
          style={{
            background: 'rgba(8,14,13,0.7)',
            borderTop: '1px solid rgba(255,239,178,0.06)',
          }}
        >
          <p className="text-xs flex items-center gap-1.5" style={{ color: 'rgba(122,158,153,0.4)' }}>
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: '#60D4C8', boxShadow: '0 0 4px rgba(96,212,200,0.5)' }}
            />
            Powered by Google Gemini
          </p>
          <div className="flex gap-2">
            {bullets.length > 0 && !isLoading && (
              <>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all duration-200"
                  style={{
                    background: 'rgba(255,239,178,0.06)',
                    border: '1px solid rgba(255,239,178,0.1)',
                    color: '#7A9E99',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,239,178,0.2)'; e.currentTarget.style.color = '#FFEFB2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,239,178,0.1)'; e.currentTarget.style.color = '#7A9E99'; }}
                >
                  {copied ? <Check size={11} style={{ color: '#4ADE80' }} /> : <Copy size={11} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={onGenerate}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all duration-200"
                  style={{
                    background: 'rgba(255,239,178,0.06)',
                    border: '1px solid rgba(255,239,178,0.1)',
                    color: '#7A9E99',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,239,178,0.2)'; e.currentTarget.style.color = '#FFEFB2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,239,178,0.1)'; e.currentTarget.style.color = '#7A9E99'; }}
                >
                  <RefreshCw size={11} />Regenerate
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="btn-primary text-xs px-4 py-1.5"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryModal;
