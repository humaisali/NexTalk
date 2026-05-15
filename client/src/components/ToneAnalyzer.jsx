import { AlertCircle, RefreshCw, Loader, Sparkles } from 'lucide-react';

const TONE_CONFIG = {
  aggressive: {
    label: 'Aggressive tone detected',
    color: '#ef4444',
    bg: 'bg-red-50',
    border: 'border-red-100',
    icon: '⚡',
  },
  neutral: {
    label: 'Neutral tone',
    color: '#f59e0b',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    icon: '➖',
  },
  friendly: {
    label: 'Friendly tone',
    color: '#22c55e',
    bg: 'bg-green-50',
    border: 'border-green-100',
    icon: '✨',
  },
};

const ToneAnalyzer = ({ tone, suggestion, isAnalyzing, onApply }) => {
  if (!tone && !isAnalyzing) return null;

  if (isAnalyzing) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 shadow-sm">
        <Loader size={14} className="animate-spin text-blue-500" />
        <span className="text-sm font-medium text-gray-500">Analyzing tone…</span>
      </div>
    );
  }

  const cfg = TONE_CONFIG[tone] || TONE_CONFIG.neutral;

  return (
    <div className={`rounded-xl px-4 py-3 space-y-3 animate-fade-in ${cfg.bg} border ${cfg.border} shadow-sm`}>
      <div className="flex items-center gap-2">
        <span className="text-sm">{cfg.icon}</span>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</span>
      </div>
      {suggestion && tone !== 'friendly' && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-blue-500" />
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Suggested rewrite</span>
          </div>
          <p className="text-sm leading-relaxed italic px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 shadow-sm">
            "{suggestion}"
          </p>
          <button
            onClick={() => onApply?.(suggestion)}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <RefreshCw size={12} />
            Use this instead
          </button>
        </div>
      )}
    </div>
  );
};

export default ToneAnalyzer;
