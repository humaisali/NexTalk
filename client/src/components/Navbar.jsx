import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import MoodIndicator from './MoodIndicator';
import { FiWifi, FiWifiOff } from 'react-icons/fi';

const Navbar = ({ onSummaryOpen }) => {
  const { user } = useAuth();
  const { activeRoom, isConnected, roomMood } = useSocket();

  return (
    <div className="h-14 bg-nt-surface border-b border-nt-border flex items-center px-5 gap-4 flex-shrink-0 z-10">
      {/* Left — App brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-nt-blue to-nt-cyan flex items-center justify-center">
            <span className="text-white text-xs font-bold">N</span>
          </div>
          <span className="font-bold text-nt-text text-base tracking-tight">
            Nex<span className="text-nt-blue">Talk</span>
          </span>
        </div>

        {/* Connection badge */}
        <div className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border
          ${isConnected
            ? 'text-nt-success border-nt-success/30 bg-nt-success/10'
            : 'text-nt-danger border-nt-danger/30 bg-nt-danger/10'
          }`}>
          {isConnected ? <FiWifi size={11} /> : <FiWifiOff size={11} />}
          {isConnected ? 'Live' : 'Offline'}
        </div>
      </div>

      {/* Center — Active room info */}
      {activeRoom && (
        <div className="flex-1 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-nt-blue font-semibold">#</span>
            <span className="text-nt-text font-semibold text-sm">{activeRoom.name}</span>
            {activeRoom.description && (
              <>
                <span className="text-nt-border">·</span>
                <span className="text-nt-muted text-xs truncate max-w-xs">{activeRoom.description}</span>
              </>
            )}
          </div>
          {/* Mood indicator pill */}
          <MoodIndicator compact />
        </div>
      )}

      {/* Right — Actions + avatar */}
      <div className="ml-auto flex items-center gap-2">
        {activeRoom && (
          <button
            onClick={onSummaryOpen}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-nt-surface2 border border-nt-border hover:border-nt-blue/50 hover:text-nt-blue text-nt-muted transition-all"
            title="Catch Me Up — AI summary"
          >
            <span>✨</span>
            <span>Catch Me Up</span>
          </button>
        )}

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nt-blue/80 to-nt-cyan/60 flex items-center justify-center text-xs font-bold text-white border border-nt-blue/30">
            {user?.username?.[0]?.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
