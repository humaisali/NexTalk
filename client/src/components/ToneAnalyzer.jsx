import { AlertCircle, RefreshCw, Loader, Sparkles } from 'lucide-react';

const TONE_CONFIG = {
  aggressive: {
    label: 'Aggressive tone detected',
    color: '#F87171',
    bg: 'rgba(248,113,113,0.07)',
    border: 'rgba(248,113,113,0.2)',
    icon: '⚡',
  },
  neutral: {
    label: 'Neutral tone',
    color: '#FCD34D',
    bg: 'rgba(252,211,77,0.07)',
    border: 'rgba(252,211,77,0.2)',
    icon: '➖',
  },
  friendly: {
    label: 'Friendly tone',
    color: '#4ADE80',
    bg: 'rgba(74,222,128,0.07)',
    border: 'rgba(74,222,128,0.2)',
    icon: '✨',
  },
};

const ToneAnalyzer = ({ tone, suggestion, isAnalyzing, onApply }) => {
  if (!tone && !isAnalyzing) return null;

  if (isAnalyzing) {
    return (
      <div
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
        style={{ background: 'rgba(255,239,178,0.04)', border: '1px solid rgba(255,239,178,0.08)' }}
      >
        <Loader size={13} className="animate-spin" style={{ color: '#7A9E99' }} />
        <span className="text-xs" style={{ color: 'rgba(122,158,153,0.7)' }}>Analyzing tone…</span>
      </div>
    );
  }

  const cfg = TONE_CONFIG[tone] || TONE_CONFIG.neutral;

  return (
    <div
      className="rounded-xl px-3.5 py-3 space-y-2.5 animate-fade-in"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{cfg.icon}</span>
        <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
      </div>
      {suggestion && tone !== 'friendly' && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={10} style={{ color: '#60D4C8' }} />
            <span className="text-xs font-medium" style={{ color: '#60D4C8' }}>Suggested rewrite</span>
          </div>
          <p
            className="text-xs leading-relaxed italic px-3 py-2.5 rounded-xl"
            style={{
              color: '#D4C98A',
              background: 'rgba(255,239,178,0.04)',
              border: '1px solid rgba(255,239,178,0.08)',
            }}
          >
            "{suggestion}"
          </p>
          <button
            onClick={() => onApply?.(suggestion)}
            className="flex items-center gap-1.5 text-xs font-medium transition-all duration-150"
            style={{ color: '#60D4C8' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#FFEFB2'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#60D4C8'}
          >
            <RefreshCw size={10} />
            Use this instead
          </button>
        </div>
      )}
    </div>
  );
};

export default ToneAnalyzer;
