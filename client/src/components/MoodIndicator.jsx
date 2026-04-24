import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { FiRefreshCw } from 'react-icons/fi';

const MOOD_CONFIG = {
  positive: { emoji: '😄', label: 'Positive',  color: 'text-nt-success', bg: 'bg-nt-success/10', border: 'border-nt-success/30', ring: 'shadow-nt-success/30', bar: 'bg-nt-success'  },
  excited:  { emoji: '🔥', label: 'Excited',   color: 'text-nt-cyan',    bg: 'bg-nt-cyan/10',    border: 'border-nt-cyan/30',    ring: 'shadow-nt-cyan/30',    bar: 'bg-nt-cyan'     },
  neutral:  { emoji: '😐', label: 'Neutral',   color: 'text-nt-muted',   bg: 'bg-nt-surface2',   border: 'border-nt-border',     ring: 'shadow-transparent',   bar: 'bg-nt-muted'    },
  tense:    { emoji: '😬', label: 'Tense',     color: 'text-nt-warning', bg: 'bg-nt-warning/10', border: 'border-nt-warning/30', ring: 'shadow-nt-warning/30', bar: 'bg-nt-warning'  },
  negative: { emoji: '😤', label: 'Negative',  color: 'text-nt-danger',  bg: 'bg-nt-danger/10',  border: 'border-nt-danger/30',  ring: 'shadow-nt-danger/30',  bar: 'bg-nt-danger'   },
};

/**
 * MoodIndicator
 *
 * compact=true  → small pill for Navbar (no interactivity)
 * compact=false → full sidebar panel with score bar, delta, refresh button
 */
const MoodIndicator = ({ compact = false }) => {
  const { roomMood, moodHistory, requestMoodUpdate } = useSocket();
  const prevScoreRef = useRef(roomMood.score);
  const mood         = MOOD_CONFIG[roomMood.mood] || MOOD_CONFIG.neutral;

  // Score delta vs previous reading
  const delta       = roomMood.score - prevScoreRef.current;
  const deltaLabel  = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : null;
  const deltaColor  = delta > 0 ? 'text-nt-success' : 'text-nt-danger';

  useEffect(() => { prevScoreRef.current = roomMood.score; }, [roomMood.score]);

  // ── Compact pill (Navbar) ──────────────────────────────────────
  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${mood.bg} ${mood.border} ${mood.color}`}>
        <span className="text-sm leading-none">{mood.emoji}</span>
        <span className="font-medium">{mood.label}</span>
        <span className="opacity-60">{roomMood.score}%</span>
      </div>
    );
  }

  // ── Full panel (Sidebar) ───────────────────────────────────────
  return (
    <div className={`mx-3 mb-2 rounded-xl border p-3 transition-all duration-500 ${mood.bg} ${mood.border}`}>

      {/* Header row */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          {/* Animated emoji with pulse ring on non-neutral */}
          <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center text-base
            ${roomMood.mood !== 'neutral' ? `shadow-lg ${mood.ring}` : ''}`}>
            {roomMood.mood !== 'neutral' && (
              <div className={`absolute inset-0 rounded-lg ${mood.bar} opacity-20 animate-ping`} />
            )}
            <span className="relative z-10">{mood.emoji}</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-nt-muted uppercase tracking-wider">Room Mood</p>
            <p className={`text-sm font-bold ${mood.color}`}>{mood.label}</p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={requestMoodUpdate}
          className="p-1.5 text-nt-muted hover:text-nt-text hover:bg-nt-surface/60 rounded-lg transition-all"
          title="Refresh mood"
        >
          <FiRefreshCw size={12} />
        </button>
      </div>

      {/* Score bar */}
      <div className="mb-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-nt-muted">Intensity</span>
          <div className="flex items-center gap-1.5">
            {deltaLabel && (
              <span className={`text-xs font-semibold ${deltaColor}`}>{deltaLabel}</span>
            )}
            <span className={`text-xs font-bold ${mood.color}`}>{roomMood.score}%</span>
          </div>
        </div>
        <div className="w-full h-2 bg-nt-surface rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${mood.bar}`}
            style={{ width: `${roomMood.score}%` }}
          />
        </div>
      </div>

      {/* History dots */}
      {moodHistory.length > 1 && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-black/10">
          <span className="text-xs text-nt-muted/60 mr-1">History:</span>
          {[...moodHistory].reverse().slice(0, 6).map((h, i) => {
            const cfg = MOOD_CONFIG[h.mood] || MOOD_CONFIG.neutral;
            const isLatest = i === Math.min(moodHistory.length, 6) - 1;
            return (
              <div
                key={i}
                title={`${cfg.label} — ${h.score}%`}
                className={`rounded-full transition-all ${cfg.bar}
                  ${isLatest ? 'w-3 h-3' : 'w-2 h-2 opacity-50'}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MoodIndicator;
