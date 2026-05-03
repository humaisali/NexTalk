import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MOOD = {
  positive: { color: '#4ADE80', bar: '#4ADE80', label: 'Positive' },
  excited:  { color: '#60D4C8', bar: '#60D4C8', label: 'Excited'  },
  neutral:  { color: '#7A9E99', bar: '#7A9E99', label: 'Neutral'  },
  tense:    { color: '#FCD34D', bar: '#FCD34D', label: 'Tense'    },
  negative: { color: '#F87171', bar: '#F87171', label: 'Negative' },
};

const Trend = ({ delta }) => {
  if (delta > 5)  return <TrendingUp   size={10} style={{ color: '#4ADE80' }} />;
  if (delta < -5) return <TrendingDown size={10} style={{ color: '#F87171' }} />;
  return <Minus size={10} style={{ color: '#7A9E99' }} />;
};

const MoodHistory = ({ history = [] }) => {
  if (history.length === 0) return null;
  const visible = [...history].slice(0, 5).reverse();
  return (
    <div className="px-3 pb-3">
      <p className="section-label mb-2 px-1">Mood History</p>
      <div className="flex items-end gap-1.5">
        {visible.map((entry, i) => {
          const cfg    = MOOD[entry.mood] || MOOD.neutral;
          const isLast = i === visible.length - 1;
          const prev   = i > 0 ? visible[i - 1] : null;
          const delta  = prev ? entry.score - prev.score : 0;
          const barH   = Math.max(12, Math.round((entry.score / 100) * 44));
          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1" title={`${cfg.label} — ${entry.score}%`}>
              <div className="w-full flex items-end justify-center" style={{ height: 48 }}>
                <div className="w-full rounded-t-sm transition-all"
                     style={{ height: barH, background: cfg.bar, opacity: isLast ? 1 : 0.4 }} />
              </div>
              {isLast && prev && <Trend delta={delta} />}
            </div>
          );
        })}
      </div>
      {history[0] && (() => {
        const l = MOOD[history[0].mood] || MOOD.neutral;
        return <p className="text-xs mt-2 px-1 font-medium" style={{ color: l.color }}>Currently {l.label} · {history[0].score}%</p>;
      })()}
    </div>
  );
};

export default MoodHistory;
