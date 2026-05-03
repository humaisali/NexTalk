import { useAuth }   from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import MoodIndicator from './MoodIndicator';
import { WifiOff, RefreshCw, Zap, Settings, Search, Users, MoreHorizontal } from 'lucide-react';

const Navbar = ({ onSummaryOpen, onRoomSettings }) => {
  const { user }            = useAuth();
  const { activeRoom, activeConversation, isConnected, isReconnecting, onlineUsers } = useSocket();

  const isInDM   = !!activeConversation;
  const isInRoom = !!activeRoom && !isInDM;

  const other = isInDM
    ? activeConversation?.participants?.find((p) => p._id?.toString() !== user?._id?.toString())
    : null;

  return (
    <div className="h-16 flex items-center px-5 gap-4 flex-shrink-0 border-b"
         style={{ background: '#012B26', borderColor: '#025A50' }}>

      {/* Left — context info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {isInRoom && (
          <>
            {/* Group avatar — first letter */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border text-sm font-bold"
                 style={{ background: 'rgba(255,239,178,0.1)', borderColor: '#025A50', color: '#FFEFB2' }}>
              {activeRoom.name?.[0]?.toUpperCase() || '#'}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm truncate" style={{ color: '#FFEFB2' }}>{activeRoom.name}</h2>
              <p className="text-xs" style={{ color: '#7A9E99' }}>
                {onlineUsers.length} online · {activeRoom.members?.length || 0} members
              </p>
            </div>
            <MoodIndicator compact />
          </>
        )}

        {isInDM && other && (
          <>
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold overflow-hidden"
                   style={{ background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)', borderColor: '#025A50', color: '#013E37' }}>
                {other.avatar?.startsWith?.('data:') || other.avatar?.startsWith?.('http')
                  ? <img src={other.avatar} alt="" className="w-full h-full object-cover" />
                  : other.username?.[0]?.toUpperCase()
                }
              </div>
              {other.isOnline && <div className="status-online absolute -bottom-0.5 -right-0.5" />}
            </div>
            <div>
              <h2 className="font-bold text-sm" style={{ color: '#FFEFB2' }}>{other.username}</h2>
              <p className="text-xs" style={{ color: other.isOnline ? '#4ADE80' : '#7A9E99' }}>
                {other.isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </>
        )}

        {!isInRoom && !isInDM && (
          <div>
            <h2 className="font-bold text-base" style={{ color: '#FFEFB2' }}>NexTalk</h2>
            <p className="text-xs" style={{ color: '#7A9E99' }}>AI-Powered Chat</p>
          </div>
        )}
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">

        {/* Connection badge */}
        {isReconnecting ? (
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border"
               style={{ color: '#FCD34D', borderColor: 'rgba(252,211,77,0.3)', background: 'rgba(252,211,77,0.08)' }}>
            <RefreshCw size={10} className="animate-spin" />Reconnecting
          </div>
        ) : !isConnected ? (
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border"
               style={{ color: '#F87171', borderColor: 'rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)' }}>
            <WifiOff size={10} />Offline
          </div>
        ) : null}

        {(isInRoom || isInDM) && (
          <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                  style={{ background: 'rgba(255,239,178,0.08)', color: '#7A9E99' }}>
            <Search size={15} />
          </button>
        )}

        {isInRoom && (
          <>
            <button onClick={onSummaryOpen}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-nt font-semibold transition-all hover:opacity-80"
              style={{ background: 'rgba(255,239,178,0.1)', color: '#FFEFB2', border: '1px solid rgba(255,239,178,0.2)' }}
              title="AI summary">
              <Zap size={13} style={{ color: '#FFEFB2' }} />
              <span className="hidden sm:inline">Catch Me Up</span>
            </button>

            <button onClick={onRoomSettings}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
              style={{ background: 'rgba(255,239,178,0.08)', color: '#7A9E99' }}
              title="Group settings">
              <Settings size={15} />
            </button>
          </>
        )}

        {isInDM && (
          <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                  style={{ background: 'rgba(255,239,178,0.08)', color: '#7A9E99' }}>
            <MoreHorizontal size={15} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
