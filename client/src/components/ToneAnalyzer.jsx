import { AlertCircle, RefreshCw, Loader } from 'lucide-react';

const TONE_CONFIG = {
  aggressive: { label: 'Aggressive', color: '#F87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)' },
  neutral:    { label: 'Neutral',    color: '#FCD34D', bg: 'rgba(252,211,77,0.08)',  border: 'rgba(252,211,77,0.25)'  },
  friendly:   { label: 'Friendly',  color: '#4ADE80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.25)'  },
};

const ToneAnalyzer = ({ tone, suggestion, isAnalyzing, onApply }) => {
  if (!tone && !isAnalyzing) return null;

  if (isAnalyzing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-nt border"
           style={{ background: 'rgba(255,239,178,0.04)', borderColor: '#025A50' }}>
        <Loader size={13} className="animate-spin" style={{ color: '#7A9E99' }} />
        <span className="text-xs" style={{ color: '#7A9E99' }}>Analyzing tone…</span>
      </div>
    );
  }

  const cfg = TONE_CONFIG[tone] || TONE_CONFIG.neutral;

  return (
    <div className="rounded-nt border px-3 py-2.5 space-y-2"
         style={{ background: cfg.bg, borderColor: cfg.border }}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label} tone detected</span>
      </div>
      {suggestion && tone !== 'friendly' && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1">
            <AlertCircle size={11} style={{ color: '#7A9E99' }} />
            <span className="text-xs" style={{ color: '#7A9E99' }}>Suggested rewrite:</span>
          </div>
          <p className="text-xs leading-relaxed italic px-2.5 py-2 rounded-lg border"
             style={{ color: '#FFEFB2', background: 'rgba(255,239,178,0.04)', borderColor: '#025A50' }}>
            "{suggestion}"
          </p>
          <button onClick={() => onApply?.(suggestion)}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: '#60D4C8' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#FFEFB2'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#60D4C8'}>
            <RefreshCw size={11} />Use this instead
          </button>
        </div>
      )}
    </div>
  );
};

export default ToneAnalyzer;
