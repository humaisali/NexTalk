import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

const TONE_CONFIG = {
  aggressive: {
    label: 'Aggressive', emoji: '😤',
    color: 'text-nt-danger', bg: 'bg-nt-danger/10', border: 'border-nt-danger/30',
  },
  neutral: {
    label: 'Neutral', emoji: '😐',
    color: 'text-nt-warning', bg: 'bg-nt-warning/10', border: 'border-nt-warning/30',
  },
  friendly: {
    label: 'Friendly', emoji: '😊',
    color: 'text-nt-success', bg: 'bg-nt-success/10', border: 'border-nt-success/30',
  },
};

// Props:
//   tone        — 'aggressive' | 'neutral' | 'friendly'
//   suggestion  — AI-suggested better version of the message
//   isAnalyzing — boolean
//   onApply     — callback(suggestion) when user taps suggestion
const ToneAnalyzer = ({ tone, suggestion, isAnalyzing, onApply }) => {
  if (!tone && !isAnalyzing) return null;

  if (isAnalyzing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-nt-surface2 border border-nt-border">
        <div className="flex gap-1">
          {[0, 150, 300].map((delay) => (
            <div
              key={delay}
              className="w-1.5 h-1.5 rounded-full bg-nt-blue animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
        <span className="text-xs text-nt-muted">Analyzing tone…</span>
      </div>
    );
  }

  const config = TONE_CONFIG[tone] || TONE_CONFIG.neutral;

  return (
    <div className={`rounded-xl border px-3 py-2.5 space-y-2 ${config.bg} ${config.border}`}>
      {/* Tone badge */}
      <div className="flex items-center gap-2">
        <span className="text-base">{config.emoji}</span>
        <span className={`text-xs font-semibold ${config.color}`}>
          {config.label} tone detected
        </span>
      </div>

      {/* Suggestion (only shown for non-friendly tones) */}
      {suggestion && tone !== 'friendly' && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1">
            <FiAlertCircle size={11} className="text-nt-muted" />
            <span className="text-xs text-nt-muted">Suggested rewrite:</span>
          </div>
          <p className="text-xs text-nt-text leading-relaxed italic bg-nt-surface/60 px-2.5 py-2 rounded-lg border border-nt-border">
            "{suggestion}"
          </p>
          <button
            onClick={() => onApply?.(suggestion)}
            className="flex items-center gap-1.5 text-xs text-nt-blue hover:text-nt-cyan font-medium transition-colors"
          >
            <FiRefreshCw size={11} />
            Use this instead
          </button>
        </div>
      )}
    </div>
  );
};

export default ToneAnalyzer;
