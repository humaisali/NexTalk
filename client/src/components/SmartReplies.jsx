import { Zap } from 'lucide-react';

const SmartReplies = ({ replies, isLoading, onSelect }) => {
  if (!isLoading && (!replies || replies.length === 0)) return null;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 flex-shrink-0">
        <Zap size={14} className="text-blue-500" />
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick:</span>
      </div>
      {isLoading
        ? [80, 110, 90].map((w, i) => (
            <div
              key={i}
              className="h-8 rounded-full bg-gray-200 animate-pulse border border-gray-100"
              style={{ width: w }}
            />
          ))
        : replies.map((reply, i) => (
            <button
              key={i}
              onClick={() => onSelect?.(reply)}
              className="text-xs font-medium px-4 py-2 rounded-full transition-all whitespace-nowrap bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 shadow-sm"
            >
              {reply}
            </button>
          ))}
    </div>
  );
};

export default SmartReplies;
