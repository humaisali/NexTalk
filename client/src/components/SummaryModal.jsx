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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden bg-white shadow-xl animate-slide-up border border-gray-100"
        style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 shadow-sm border border-blue-100">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Catch Me Up</h3>
              <p className="text-xs font-medium text-gray-500">AI-generated conversation summary</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Topics bar */}
        {!isLoading && summary && (
          <div className="px-6 py-3 flex flex-wrap items-center gap-2 flex-shrink-0 bg-white border-b border-gray-100">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <MessageSquare size={12} />
              <span>{messageCount} messages</span>
            </div>
            {keyTopics.map((t) => (
              <span
                key={t}
                className="text-xs px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 font-medium border border-blue-100"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-6 flex-1 overflow-y-auto min-h-[200px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-blue-50 border border-blue-100 shadow-sm animate-pulse">
                  <Sparkles size={28} className="text-blue-500" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-800">Reading the conversation…</p>
                <p className="text-xs mt-1 font-medium text-gray-500">Gemini AI is catching you up</p>
              </div>
              <div className="flex gap-2">
                {[0, 200, 400].map((d) => (
                  <div
                    key={d}
                    className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            </div>
          ) : bullets.length > 0 ? (
            <ul className="space-y-4">
              {bullets.map((line, i) => (
                <li key={i} className="flex items-start gap-4 group/item">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-600 border border-blue-100 font-bold text-sm shadow-sm">
                    {i + 1}
                  </div>
                  <p className="text-sm leading-relaxed flex-1 pt-1 text-gray-700 font-medium">{line}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <MessageSquare size={40} className="text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No messages to summarize yet.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between gap-3 flex-shrink-0 border-t border-gray-100 bg-gray-50">
          <p className="text-xs font-medium flex items-center gap-1.5 text-gray-400">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block shadow-sm" />
            Powered by Google Gemini
          </p>
          <div className="flex gap-2">
            {bullets.length > 0 && !isLoading && (
              <>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors shadow-sm"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={onGenerate}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors shadow-sm"
                >
                  <RefreshCw size={14} />Regenerate
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-xs font-bold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
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
