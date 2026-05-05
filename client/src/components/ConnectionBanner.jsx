import { useSocket } from '../context/SocketContext';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

const ConnectionBanner = () => {
  const { isConnected, isReconnecting } = useSocket();
  if (isConnected) return null;

  return (
    <div
      className="flex items-center justify-center gap-2.5 py-2 text-xs font-semibold flex-shrink-0 animate-fade-in"
      style={isReconnecting ? {
        background: 'linear-gradient(90deg, rgba(252,211,77,0.08), rgba(252,211,77,0.12), rgba(252,211,77,0.08))',
        color: '#FCD34D',
        borderBottom: '1px solid rgba(252,211,77,0.15)',
      } : {
        background: 'linear-gradient(90deg, rgba(248,113,113,0.08), rgba(248,113,113,0.12), rgba(248,113,113,0.08))',
        color: '#F87171',
        borderBottom: '1px solid rgba(248,113,113,0.15)',
      }}
    >
      {isReconnecting ? (
        <>
          <RefreshCw size={11} className="animate-spin" />
          Reconnecting to NexTalk…
          <div className="flex gap-1">
            {[0,200,400].map((d) => (
              <div
                key={d}
                className="w-1 h-1 rounded-full animate-bounce"
                style={{ background: '#FCD34D', animationDelay: `${d}ms` }}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <WifiOff size={11} />
          You are offline — check your connection
        </>
      )}
    </div>
  );
};

export default ConnectionBanner;
