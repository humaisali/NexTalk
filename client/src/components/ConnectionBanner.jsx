import { useSocket } from '../context/SocketContext';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

const ConnectionBanner = () => {
  const { isConnected, isReconnecting } = useSocket();
  if (isConnected) return null;

  return (
    <div
      className={`flex items-center justify-center gap-2.5 py-2.5 text-sm font-semibold flex-shrink-0 animate-fade-in shadow-sm ${
        isReconnecting ? 'bg-yellow-50 text-yellow-600 border-b border-yellow-100' : 'bg-red-50 text-red-600 border-b border-red-100'
      }`}
    >
      {isReconnecting ? (
        <>
          <RefreshCw size={14} className="animate-spin" />
          Reconnecting to NexTalk…
          <div className="flex gap-1 ml-1">
            {[0, 200, 400].map((d) => (
              <div
                key={d}
                className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <WifiOff size={14} />
          You are offline — check your connection
        </>
      )}
    </div>
  );
};

export default ConnectionBanner;
