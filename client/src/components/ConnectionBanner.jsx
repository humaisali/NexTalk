import { useSocket } from '../context/SocketContext';
import { WifiOff, RefreshCw } from 'lucide-react';

const ConnectionBanner = () => {
  const { isConnected, isReconnecting } = useSocket();
  if (isConnected) return null;
  return (
    <div className="flex items-center justify-center gap-2 py-1.5 text-xs font-medium flex-shrink-0 border-b"
         style={isReconnecting
           ? { background: 'rgba(252,211,77,0.1)', color: '#FCD34D', borderColor: 'rgba(252,211,77,0.2)' }
           : { background: 'rgba(248,113,113,0.1)', color: '#F87171', borderColor: 'rgba(248,113,113,0.2)' }
         }>
      {isReconnecting
        ? <><RefreshCw size={11} className="animate-spin" />Reconnecting to NexTalk…</>
        : <><WifiOff   size={11} />You are offline</>
      }
    </div>
  );
};

export default ConnectionBanner;
