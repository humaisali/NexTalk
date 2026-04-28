import { useSocket } from '../context/SocketContext';
import { FiWifiOff, FiRefreshCw } from 'react-icons/fi';

/**
 * ConnectionBanner — a slim yellow/red bar shown below Navbar
 * when the socket is disconnected or reconnecting.
 * Renders nothing when connected.
 */
const ConnectionBanner = () => {
  const { isConnected, isReconnecting } = useSocket();

  if (isConnected) return null;

  return (
    <div className={`flex items-center justify-center gap-2 py-1.5 text-xs font-medium flex-shrink-0
      ${isReconnecting ? 'bg-nt-warning/15 text-nt-warning border-b border-nt-warning/20' : 'bg-nt-danger/15 text-nt-danger border-b border-nt-danger/20'}`}>
      {isReconnecting
        ? <><FiRefreshCw size={11} className="animate-spin" /> Reconnecting to NexTalk…</>
        : <><FiWifiOff   size={11} /> You are offline</>
      }
    </div>
  );
};

export default ConnectionBanner;
