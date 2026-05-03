import { Zap } from 'lucide-react';

const SmartReplies = ({ replies, isLoading, onSelect }) => {
  if (!isLoading && (!replies || replies.length === 0)) return null;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 flex-shrink-0">
        <Zap size={11} style={{ color: '#60D4C8' }} />
        <span className="text-xs" style={{ color: '#7A9E99' }}>Quick:</span>
      </div>
      {isLoading
        ? [80,110,90].map((w,i) => <div key={i} className="h-7 rounded-full animate-pulse" style={{ width: w, background: '#013E37', border: '1px solid #025A50' }} />)
        : replies.map((reply, i) => (
            <button key={i} onClick={() => onSelect?.(reply)}
              className="text-xs px-3 py-1.5 rounded-full transition-all whitespace-nowrap"
              style={{ background: '#013E37', border: '1px solid #025A50', color: '#D4C98A' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FFEFB2'; e.currentTarget.style.color = '#FFEFB2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#025A50'; e.currentTarget.style.color = '#D4C98A'; }}>
              {reply}
            </button>
          ))
      }
    </div>
  );
};

export default SmartReplies;
