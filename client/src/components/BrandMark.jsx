import { Waypoints } from 'lucide-react';

const BrandMark = ({ compact = false, inverse = false }) => (
  <div className="inline-flex items-center gap-3" aria-label="NexTalk">
    <span className="brand-symbol" aria-hidden="true">
      <Waypoints size={compact ? 20 : 24} strokeWidth={2.25} />
      <span className="brand-signal-dot" />
    </span>
    {!compact && (
      <span className={`text-lg font-bold tracking-[-0.02em] ${inverse ? 'text-white' : 'text-gray-950 dark:text-white'}`}>
        NexTalk
      </span>
    )}
  </div>
);

export default BrandMark;
