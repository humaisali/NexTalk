import { useEffect, useState } from 'react';
import { FiX, FiZap, FiCopy, FiCheck, FiRefreshCw, FiMessageSquare } from 'react-icons/fi';

/**
 * SummaryModal — "Catch Me Up" AI summary modal.
 *
 * Props:
 *   isOpen       — boolean
 *   onClose      — fn
 *   summary      — string  (bullet points separated by \n)
 *   keyTopics    — string[] (2-3 word topic labels)
 *   messageCount — number of messages summarized
 *   isLoading    — boolean
 *   onGenerate   — fn() triggers AI summarize call
 */
const SummaryModal = ({ isOpen, onClose, summary, keyTopics = [], messageCount = 0, isLoading, onGenerate }) => {
  const [copied, setCopied] = useState(false);

  // Auto-generate when modal opens
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
      className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="w-full max-w-lg bg-nt-surface border border-nt-border rounded-2xl shadow-2xl overflow-hidden">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-nt-border bg-gradient-to-r from-nt-blue/10 to-nt-cyan/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nt-blue/30 to-nt-cyan/30 border border-nt-blue/20 flex items-center justify-center">
              <FiZap size={16} className="text-nt-cyan" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-nt-text">Catch Me Up</h3>
              <p className="text-xs text-nt-muted">AI-powered conversation summary</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-nt-muted hover:text-nt-text hover:bg-nt-surface2 rounded-lg transition-all">
            <FiX size={16} />
          </button>
        </div>

        {/* ── Stats bar (when loaded) ──────────────────────────── */}
        {!isLoading && summary && (
          <div className="flex items-center gap-4 px-6 py-2.5 border-b border-nt-border bg-nt-surface2/40">
            <div className="flex items-center gap-1.5 text-xs text-nt-muted">
              <FiMessageSquare size={11} />
              <span>{messageCount} messages summarized</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-nt-muted">
              <FiZap size={11} className="text-nt-cyan" />
              <span>{bullets.length} key points</span>
            </div>
          </div>
        )}

        {/* ── Key topics (when loaded) ─────────────────────────── */}
        {!isLoading && keyTopics.length > 0 && (
          <div className="flex items-center gap-2 px-6 py-3 border-b border-nt-border flex-wrap">
            <span className="text-xs text-nt-muted flex-shrink-0">Topics:</span>
            {keyTopics.map((t, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-nt-blue/10 border border-nt-blue/20 text-nt-blue font-medium">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* ── Body ────────────────────────────────────────────── */}
        <div className="px-6 py-5 min-h-[160px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="flex gap-2">
                {[0, 200, 400].map((delay) => (
                  <div key={delay} className="w-2.5 h-2.5 rounded-full bg-nt-cyan animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
              <div className="text-center">
                <p className="text-sm text-nt-text font-medium">Reading the conversation…</p>
                <p className="text-xs text-nt-muted mt-1">Gemini is catching you up</p>
              </div>
            </div>
          ) : bullets.length > 0 ? (
            <ul className="space-y-3.5">
              {bullets.map((line, i) => (
                <li key={i} className="flex items-start gap-3 group">
                  <div className="w-6 h-6 rounded-lg bg-nt-blue/15 border border-nt-blue/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-nt-blue text-xs font-bold">{i + 1}</span>
                  </div>
                  <p className="text-sm text-nt-text leading-relaxed flex-1">{line}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <span className="text-4xl">📭</span>
              <p className="text-sm text-nt-muted">No messages to summarize yet.</p>
              <p className="text-xs text-nt-muted/60">Start chatting and come back here.</p>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-nt-border bg-nt-surface2/30 flex items-center justify-between gap-3">
          <p className="text-xs text-nt-muted/60 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-nt-cyan/60 inline-block" />
            Powered by Google Gemini
          </p>
          <div className="flex gap-2">
            {/* Copy button */}
            {bullets.length > 0 && !isLoading && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-nt-border text-nt-muted hover:text-nt-text hover:border-nt-blue/40 transition-all"
              >
                {copied ? <FiCheck size={11} className="text-nt-success" /> : <FiCopy size={11} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
            {/* Regenerate */}
            {summary && !isLoading && (
              <button
                onClick={onGenerate}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-nt-border text-nt-muted hover:text-nt-text hover:border-nt-blue/40 transition-all"
              >
                <FiRefreshCw size={11} />
                Regenerate
              </button>
            )}
            <button
              onClick={onClose}
              className="text-xs px-4 py-1.5 rounded-lg bg-nt-blue hover:bg-blue-500 text-white font-semibold transition-colors"
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
