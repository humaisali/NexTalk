import { useEffect } from 'react';
import { FiX, FiZap } from 'react-icons/fi';

// Props:
//   isOpen     — boolean
//   onClose    — fn
//   summary    — string (bullet points from AI)
//   isLoading  — boolean
//   onGenerate — fn() to trigger AI summarize call
const SummaryModal = ({ isOpen, onClose, summary, isLoading, onGenerate }) => {
  // Trigger generation when modal opens
  useEffect(() => {
    if (isOpen && !summary && !isLoading) onGenerate?.();
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  const bullets = summary
    ? summary.split('\n').filter((l) => l.trim())
    : [];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="w-full max-w-lg bg-nt-surface border border-nt-border rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-nt-border bg-nt-surface2/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nt-blue/30 to-nt-cyan/30 border border-nt-blue/20 flex items-center justify-center">
              <FiZap size={15} className="text-nt-cyan" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-nt-text">Catch Me Up</h3>
              <p className="text-xs text-nt-muted">AI-generated conversation summary</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-nt-muted hover:text-nt-text hover:bg-nt-surface rounded-lg transition-all"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 min-h-[140px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="flex gap-2">
                {[0, 200, 400].map((delay) => (
                  <div
                    key={delay}
                    className="w-2 h-2 rounded-full bg-nt-cyan animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
              <p className="text-sm text-nt-muted">Reading the conversation…</p>
            </div>
          ) : bullets.length > 0 ? (
            <ul className="space-y-3">
              {bullets.map((line, i) => {
                const text = line.replace(/^[•\-*]\s*/, '').trim();
                if (!text) return null;
                return (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-nt-blue/15 border border-nt-blue/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-nt-blue text-xs font-bold">{i + 1}</span>
                    </div>
                    <p className="text-sm text-nt-text leading-relaxed">{text}</p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <span className="text-3xl">📭</span>
              <p className="text-sm text-nt-muted">No messages to summarize yet.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-nt-border bg-nt-surface2/30 flex items-center justify-between">
          <p className="text-xs text-nt-muted">Powered by Google Gemini</p>
          <div className="flex gap-2">
            {summary && !isLoading && (
              <button
                onClick={onGenerate}
                className="text-xs px-3 py-1.5 rounded-lg border border-nt-border text-nt-muted hover:text-nt-text hover:border-nt-blue/50 transition-all"
              >
                Regenerate
              </button>
            )}
            <button
              onClick={onClose}
              className="text-xs px-4 py-1.5 rounded-lg bg-nt-blue hover:bg-blue-500 text-white font-medium transition-colors"
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
