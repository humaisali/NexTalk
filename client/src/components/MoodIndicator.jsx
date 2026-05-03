import { useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { RefreshCw } from 'lucide-react';

const MOOD = {
  positive: { label: 'Positive',  color: '#4ADE80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.25)',  bar: '#4ADE80'  },
  excited:  { label: 'Excited',   color: '#60D4C8', bg: 'rgba(96,212,200,0.08)',  border: 'rgba(96,212,200,0.25)',  bar: '#60D4C8'  },
  neutral:  { label: 'Neutral',   color: '#7A9E99', bg: 'rgba(122,158,153,0.08)', border: 'rgba(122,158,153,0.2)',  bar: '#7A9E99'  },
  tense:    { label: 'Tense',     color: '#FCD34D', bg: 'rgba(252,211,77,0.08)',  border: 'rgba(252,211,77,0.25)',  bar: '#FCD34D'  },
  negative: { label: 'Negative',  color: '#F87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)', bar: '#F87171'  },
};

const MoodIndicator = ({ compact = false }) => {
  const { roomMood, moodHistory, requestMoodUpdate } = useSocket();
  const prevScore = useRef(roomMood.score);
  const cfg = MOOD[roomMood.mood] || MOOD.neutral;
  const delta = roomMood.score - prevScore.current;
  const deltaLabel = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : null;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all"
           style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}>
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
        <span className="font-medium">{cfg.label}</span>
        <span style={{ opacity: 0.7 }}>{roomMood.score}%</span>
      </div>
    );
  }

  return (
    <div className="mx-3 mb-2 rounded-nt border p-3 transition-all duration-500"
         style={{ background: cfg.bg, borderColor: cfg.border }}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7A9E99' }}>Room Mood</p>
            <p className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</p>
          </div>
        </div>
        <button onClick={requestMoodUpdate}
          className="p-1.5 rounded-lg transition-all"
          style={{ color: '#7A9E99' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#FFEFB2'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#7A9E99'}
          title="Refresh mood">
          <RefreshCw size={12} />
        </button>
      </div>
      <div className="mb-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs" style={{ color: '#7A9E99' }}>Intensity</span>
          <div className="flex items-center gap-1.5">
            {deltaLabel && (
              <span className="text-xs font-semibold"
                    style={{ color: delta > 0 ? '#4ADE80' : '#F87171' }}>{deltaLabel}</span>
            )}
            <span className="text-xs font-bold" style={{ color: cfg.color }}>{roomMood.score}%</span>
          </div>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#011F1B' }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${roomMood.score}%`, background: cfg.bar }} />
        </div>
      </div>
      {moodHistory.length > 1 && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t" style={{ borderColor: 'rgba(255,239,178,0.06)' }}>
          <span className="text-xs mr-1" style={{ color: 'rgba(122,158,153,0.5)' }}>History:</span>
          {[...moodHistory].reverse().slice(0, 6).map((h, i) => {
            const c = MOOD[h.mood] || MOOD.neutral;
            const isLatest = i === Math.min(moodHistory.length, 6) - 1;
            return <div key={i} className="rounded-full transition-all" title={`${c.label} — ${h.score}%`}
                        style={{ width: isLatest ? 12 : 8, height: isLatest ? 12 : 8, background: c.bar, opacity: isLatest ? 1 : 0.4 }} />;
          })}
        </div>
      )}
    </div>
  );
};

export default MoodIndicator;
