import { useSocket } from '../context/SocketContext';

const MOOD_CONFIG = {
  positive: { emoji: '😄', label: 'Positive',  color: 'text-nt-success', bg: 'bg-nt-success/10', border: 'border-nt-success/30', bar: 'bg-nt-success' },
  excited:  { emoji: '🔥', label: 'Excited',   color: 'text-nt-cyan',    bg: 'bg-nt-cyan/10',    border: 'border-nt-cyan/30',    bar: 'bg-nt-cyan'    },
  neutral:  { emoji: '😐', label: 'Neutral',   color: 'text-nt-muted',   bg: 'bg-nt-surface2',   border: 'border-nt-border',     bar: 'bg-nt-muted'   },
  tense:    { emoji: '😬', label: 'Tense',     color: 'text-nt-warning', bg: 'bg-nt-warning/10', border: 'border-nt-warning/30', bar: 'bg-nt-warning' },
  negative: { emoji: '😤', label: 'Negative',  color: 'text-nt-danger',  bg: 'bg-nt-danger/10',  border: 'border-nt-danger/30',  bar: 'bg-nt-danger'  },
};

// compact=true → small pill for Navbar
// compact=false → full sidebar block
const MoodIndicator = ({ compact = false }) => {
  const { roomMood } = useSocket();
  const mood = MOOD_CONFIG[roomMood.mood] || MOOD_CONFIG.neutral;

  if (compact) {
    return (
      <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${mood.bg} ${mood.border} ${mood.color}`}>
        <span>{mood.emoji}</span>
        <span>{mood.label}</span>
      </div>
    );
  }

  return (
    <div className={`mx-3 mb-3 p-3 rounded-xl border ${mood.bg} ${mood.border}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-nt-muted uppercase tracking-wider">Room Mood</span>
        <span className="text-base">{mood.emoji}</span>
      </div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-sm font-semibold ${mood.color}`}>{mood.label}</span>
        <span className="text-xs text-nt-muted">{roomMood.score}%</span>
      </div>
      {/* Score bar */}
      <div className="w-full h-1.5 bg-nt-surface rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${mood.bar}`}
          style={{ width: `${roomMood.score}%` }}
        />
      </div>
    </div>
  );
};

export default MoodIndicator;
