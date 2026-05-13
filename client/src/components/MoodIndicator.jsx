import { useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

const MOOD = {
  positive: { label: 'Positive',  color: '#22c55e', bg: 'bg-green-50',  border: 'border-green-100',  bar: '#22c55e',  glow: 'rgba(34,197,94,0.3)'  },
  excited:  { label: 'Excited',   color: '#06b6d4', bg: 'bg-cyan-50',   border: 'border-cyan-100',   bar: '#06b6d4',  glow: 'rgba(6,182,212,0.3)'  },
  neutral:  { label: 'Neutral',   color: '#64748b', bg: 'bg-slate-50',  border: 'border-slate-200',  bar: '#64748b',  glow: 'rgba(100,116,139,0.2)' },
  tense:    { label: 'Tense',     color: '#f59e0b', bg: 'bg-amber-50',  border: 'border-amber-100',  bar: '#f59e0b',  glow: 'rgba(245,158,11,0.3)'  },
  negative: { label: 'Negative',  color: '#ef4444', bg: 'bg-red-50',    border: 'border-red-100',    bar: '#ef4444',  glow: 'rgba(239,68,68,0.3)'   },
};

const MoodIndicator = ({ compact = false }) => {
  const { roomMood, moodHistory, requestMoodUpdate } = useSocket();
  const prevScore = useRef(roomMood.score);
  const cfg = MOOD[roomMood.mood] || MOOD.neutral;
  const delta = roomMood.score - prevScore.current;
  const deltaLabel = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : null;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full transition-all duration-300 ${cfg.bg} border ${cfg.border} font-semibold`}
        style={{ color: cfg.color }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: cfg.color, boxShadow: `0 0 4px ${cfg.glow}` }}
        />
        <span>{cfg.label}</span>
        <span className="opacity-60">{roomMood.score}%</span>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-4 rounded-xl p-4 bg-white border border-gray-100 shadow-sm transition-all duration-500">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg} border ${cfg.border}`}>
            <div
              className="w-3.5 h-3.5 rounded-full shadow-sm"
              style={{ background: cfg.bar, boxShadow: `0 0 8px ${cfg.glow}` }}
            />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Group Mood
            </p>
            <p className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</p>
          </div>
        </div>
        <button
          onClick={requestMoodUpdate}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
          title="Refresh mood"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500">Intensity</span>
          <div className="flex items-center gap-1.5">
            {deltaLabel && (
              <span
                className="text-xs font-bold flex items-center gap-0.5"
                style={{ color: delta > 0 ? '#22c55e' : '#ef4444' }}
              >
                {delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {deltaLabel}
              </span>
            )}
            <span className="text-xs font-bold tabular-nums" style={{ color: cfg.color }}>
              {roomMood.score}%
            </span>
          </div>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden bg-gray-100">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${roomMood.score}%`,
              background: `linear-gradient(90deg, ${cfg.bar}80, ${cfg.bar})`,
              boxShadow: `0 0 8px ${cfg.glow}`,
            }}
          />
        </div>
      </div>

      {/* History dots */}
      {moodHistory.length > 1 && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-1">History</span>
          {[...moodHistory].reverse().slice(0, 7).map((h, i) => {
            const c = MOOD[h.mood] || MOOD.neutral;
            const isLatest = i === Math.min(moodHistory.length, 7) - 1;
            return (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                title={`${c.label} — ${h.score}%`}
                style={{
                  width: isLatest ? 8 : 6,
                  height: isLatest ? 8 : 6,
                  background: c.bar,
                  opacity: isLatest ? 1 : 0.35 + (i / 10),
                  boxShadow: isLatest ? `0 0 6px ${c.glow}` : 'none',
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MoodIndicator;
