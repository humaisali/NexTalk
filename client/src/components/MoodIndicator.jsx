import { useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MOOD = {
  positive: { label: 'Positive',  color: '#4ADE80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.2)',  bar: '#4ADE80',  glow: 'rgba(74,222,128,0.3)'  },
  excited:  { label: 'Excited',   color: '#60D4C8', bg: 'rgba(96,212,200,0.08)',  border: 'rgba(96,212,200,0.2)',  bar: '#60D4C8',  glow: 'rgba(96,212,200,0.3)'  },
  neutral:  { label: 'Neutral',   color: '#7A9E99', bg: 'rgba(122,158,153,0.08)', border: 'rgba(122,158,153,0.15)',bar: '#7A9E99',  glow: 'rgba(122,158,153,0.2)' },
  tense:    { label: 'Tense',     color: '#FCD34D', bg: 'rgba(252,211,77,0.08)',  border: 'rgba(252,211,77,0.2)',  bar: '#FCD34D',  glow: 'rgba(252,211,77,0.3)'  },
  negative: { label: 'Negative',  color: '#F87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', bar: '#F87171',  glow: 'rgba(248,113,113,0.3)' },
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
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full transition-all duration-300"
        style={{
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          color: cfg.color,
        }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: cfg.color, boxShadow: `0 0 4px ${cfg.glow}` }}
        />
        <span className="font-medium">{cfg.label}</span>
        <span style={{ opacity: 0.65 }}>{roomMood.score}%</span>
      </div>
    );
  }

  return (
    <div
      className="mx-1 mb-2 rounded-xl p-3.5 transition-all duration-500"
      style={{
        background: `linear-gradient(135deg, ${cfg.bg} 0%, rgba(8,14,13,0.5) 100%)`,
        border: `1px solid ${cfg.border}`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,239,178,0.04)`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: cfg.bar, boxShadow: `0 0 8px ${cfg.glow}` }}
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(122,158,153,0.6)' }}>
              Room Mood
            </p>
            <p className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</p>
          </div>
        </div>
        <button
          onClick={requestMoodUpdate}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
          style={{ color: '#7A9E99' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#FFEFB2'; e.currentTarget.style.background = 'rgba(255,239,178,0.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#7A9E99'; e.currentTarget.style.background = 'transparent'; }}
          title="Refresh mood"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs" style={{ color: 'rgba(122,158,153,0.6)' }}>Intensity</span>
          <div className="flex items-center gap-1.5">
            {deltaLabel && (
              <span
                className="text-xs font-bold flex items-center gap-0.5"
                style={{ color: delta > 0 ? '#4ADE80' : '#F87171' }}
              >
                {delta > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {deltaLabel}
              </span>
            )}
            <span className="text-xs font-bold tabular-nums" style={{ color: cfg.color }}>
              {roomMood.score}%
            </span>
          </div>
        </div>
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(8,14,13,0.6)' }}
        >
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
        <div
          className="flex items-center gap-1.5 mt-2.5 pt-2.5"
          style={{ borderTop: '1px solid rgba(255,239,178,0.05)' }}
        >
          <span className="text-xs mr-0.5" style={{ color: 'rgba(122,158,153,0.4)' }}>History</span>
          {[...moodHistory].reverse().slice(0, 7).map((h, i) => {
            const c = MOOD[h.mood] || MOOD.neutral;
            const isLatest = i === Math.min(moodHistory.length, 7) - 1;
            return (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                title={`${c.label} — ${h.score}%`}
                style={{
                  width: isLatest ? 10 : 6,
                  height: isLatest ? 10 : 6,
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
