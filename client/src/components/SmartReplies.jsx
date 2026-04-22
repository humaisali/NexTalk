import { FiZap } from 'react-icons/fi';

// Props:
//   replies      — string[] of 3 suggestions
//   isLoading    — boolean
//   onSelect     — callback(reply) when user taps a chip
const SmartReplies = ({ replies, isLoading, onSelect }) => {
  if (!isLoading && (!replies || replies.length === 0)) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 text-nt-muted flex-shrink-0">
        <FiZap size={11} className="text-nt-cyan" />
        <span className="text-xs text-nt-muted">Quick:</span>
      </div>

      {isLoading ? (
        // Loading skeletons
        <>
          {[80, 110, 90].map((w, i) => (
            <div
              key={i}
              className="h-7 rounded-full bg-nt-surface2 border border-nt-border animate-pulse"
              style={{ width: `${w}px` }}
            />
          ))}
        </>
      ) : (
        replies.map((reply, i) => (
          <button
            key={i}
            onClick={() => onSelect?.(reply)}
            className="text-xs px-3 py-1.5 rounded-full bg-nt-surface2 border border-nt-border
              text-nt-muted hover:text-nt-text hover:border-nt-blue/50 hover:bg-nt-blue/5
              transition-all whitespace-nowrap"
          >
            {reply}
          </button>
        ))
      )}
    </div>
  );
};

export default SmartReplies;
