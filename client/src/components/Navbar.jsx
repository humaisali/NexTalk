import { useAuth }   from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import MoodIndicator from './MoodIndicator';
import { FiWifiOff, FiRefreshCw, FiZap, FiSettings } from 'react-icons/fi';

const Navbar = ({ onSummaryOpen, onRoomSettings }) => {
  const { user }          = useAuth();
  const { activeRoom, isConnected, isReconnecting } = useSocket();

  return (
    <div className="h-14 bg-nt-surface border-b border-nt-border flex items-center px-5 gap-4 flex-shrink-0 z-10">

      {/* Brand */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-nt-blue to-nt-cyan flex items-center justify-center shadow-md shadow-nt-blue/20 flex-shrink-0">
          <span className="text-white text-xs font-black">N</span>
        </div>
        <span className="font-bold text-nt-text text-base tracking-tight">
          Nex<span className="text-nt-blue">Talk</span>
        </span>

        {/* Connection badge */}
        {isReconnecting ? (
          <div className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border text-nt-warning border-nt-warning/30 bg-nt-warning/10">
            <FiRefreshCw size={10} className="animate-spin" />
            Reconnecting…
          </div>
        ) : (
          <div className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border transition-all
            ${isConnected
              ? 'text-nt-success border-nt-success/30 bg-nt-success/10'
              : 'text-nt-danger  border-nt-danger/30  bg-nt-danger/10'}`}>
            {isConnected
              ? <><div className="w-1.5 h-1.5 rounded-full bg-nt-success animate-pulse-dot" />Live</>
              : <><FiWifiOff size={10} />Offline</>
            }
          </div>
        )}
      </div>

      {/* Active room info + mood */}
      {activeRoom && (
        <div className="flex-1 flex items-center justify-center gap-3 min-w-0 px-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-nt-blue font-bold text-lg flex-shrink-0">#</span>
            <span className="text-nt-text font-semibold text-sm truncate">{activeRoom.name}</span>
            {activeRoom.description && (
              <>
                <span className="text-nt-border flex-shrink-0">·</span>
                <span className="text-nt-muted text-xs truncate hidden md:block">{activeRoom.description}</span>
              </>
            )}
          </div>
          <MoodIndicator compact />
        </div>
      )}

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2 flex-shrink-0">
        {activeRoom && (
          <>
            {/* Catch Me Up */}
            <button
              onClick={onSummaryOpen}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-nt-surface2 border border-nt-border
                hover:border-nt-blue/50 hover:text-nt-blue hover:bg-nt-blue/5 text-nt-muted transition-all"
              title="AI conversation summary"
            >
              <FiZap size={12} className="text-nt-cyan" />
              <span className="hidden sm:inline">Catch Me Up</span>
            </button>

            {/* Room settings gear */}
            <button
              onClick={onRoomSettings}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl bg-nt-surface2 border border-nt-border
                hover:border-nt-blue/50 hover:text-nt-blue hover:bg-nt-blue/5 text-nt-muted transition-all"
              title="Room settings & invite"
            >
              <FiSettings size={14} />
            </button>
          </>
        )}

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nt-blue/80 to-nt-cyan/60 flex items-center justify-center text-xs font-bold text-white border border-nt-blue/20 flex-shrink-0 overflow-hidden">
          {user?.avatar?.startsWith?.('data:image/')
            ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            : user?.username?.[0]?.toUpperCase()
          }
        </div>
      </div>
    </div>
  );
};

export default Navbar;
