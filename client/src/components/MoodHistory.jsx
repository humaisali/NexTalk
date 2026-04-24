import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

const MOOD_CONFIG = {
  positive: { emoji: '😄', color: 'text-nt-success', bg: 'bg-nt-success',  label: 'Positive' },
  excited:  { emoji: '🔥', color: 'text-nt-cyan',    bg: 'bg-nt-cyan',     label: 'Excited'  },
  neutral:  { emoji: '😐', color: 'text-nt-muted',   bg: 'bg-nt-muted',    label: 'Neutral'  },
  tense:    { emoji: '😬', color: 'text-nt-warning',  bg: 'bg-nt-warning',  label: 'Tense'    },
  negative: { emoji: '😤', color: 'text-nt-danger',   bg: 'bg-nt-danger',   label: 'Negative' },
};

// Score trend arrow
const Trend = ({ delta }) => {
  if (delta > 5)  return <FiTrendingUp   size={10} className="text-nt-success" />;
  if (delta < -5) return <FiTrendingDown size={10} className="text-nt-danger"  />;
  return <FiMinus size={10} className="text-nt-muted" />;
};

/**
 * MoodHistory — shows last 5 mood snapshots as a mini horizontal timeline.
 *
 * Props:
 *   history — [{ mood, score, timestamp }] newest first
 */
const MoodHistory = ({ history = [] }) => {
  if (history.length === 0) return null;

  // Show max 5, newest last for left→right timeline
  const visible = [...history].slice(0, 5).reverse();

  return (
    <div className="px-3 pb-3">
      <p className="text-xs font-semibold text-nt-muted uppercase tracking-widest mb-2 px-1">
        Mood History
      </p>

      {/* Mini timeline */}
      <div className="flex items-end gap-1.5">
        {visible.map((entry, i) => {
          const cfg    = MOOD_CONFIG[entry.mood] || MOOD_CONFIG.neutral;
          const isLast = i === visible.length - 1;
          const prev   = i > 0 ? visible[i - 1] : null;
          const delta  = prev ? entry.score - prev.score : 0;
          const barH   = Math.max(16, Math.round((entry.score / 100) * 48));

          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1" title={`${cfg.label} — ${entry.score}%`}>
              {/* Bar */}
              <div className="w-full flex items-end justify-center" style={{ height: 52 }}>
                <div
                  className={`w-full rounded-t-sm transition-all ${cfg.bg} ${isLast ? 'opacity-100' : 'opacity-40'}`}
                  style={{ height: barH }}
                />
              </div>
              {/* Emoji */}
              <span className={`text-xs leading-none ${isLast ? 'opacity-100' : 'opacity-50'}`}>
                {cfg.emoji}
              </span>
              {/* Trend arrow (only for latest) */}
              {isLast && prev && (
                <Trend delta={delta} />
              )}
            </div>
          );
        })}
      </div>

      {/* Latest mood label */}
      {history[0] && (() => {
        const latest = MOOD_CONFIG[history[0].mood] || MOOD_CONFIG.neutral;
        return (
          <p className={`text-xs mt-2 px-1 font-medium ${latest.color}`}>
            {latest.emoji} Currently {latest.label} · {history[0].score}%
          </p>
        );
      })()}
    </div>
  );
};

export default MoodHistory;
