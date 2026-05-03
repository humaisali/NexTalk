import { useSocket } from '../context/SocketContext';
import { X, Hash, Users, Clock, Lock, Globe, ChevronRight } from 'lucide-react';

/**
 * RoomInfoPanel — the right-hand "Information" column like Image 1.
 * Shows room/DM details, online members, and quick stats.
 *
 * Props:
 *   room           — active room object (or null for DMs)
 *   conversation   — active DM conversation (or null for rooms)
 *   onClose        — fn() to hide the panel
 *   currentUserId  — logged-in user's ID string
 */
const RoomInfoPanel = ({ room, conversation, onClose, currentUserId }) => {
  const { onlineUsers, roomMood } = useSocket();

  // For DMs: get the other participant
  const other = conversation?.participants?.find(
    (p) => p._id?.toString() !== currentUserId
  );

  const isRoom = !!room;

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-72 flex-shrink-0 flex flex-col border-l overflow-hidden"
         style={{ background: '#012B26', borderColor: '#025A50' }}>

      {/* Header — "Information" like Image 1 */}
      <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
           style={{ borderColor: '#025A50' }}>
        <h3 className="text-sm font-bold" style={{ color: '#FFEFB2' }}>Information</h3>
        <button onClick={onClose} style={{ color: '#7A9E99' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#FFEFB2'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#7A9E99'}>
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Avatar / icon block (like Image 1 top of right panel) ── */}
        <div className="flex flex-col items-center gap-3 px-5 py-6 border-b"
             style={{ borderColor: '#025A50' }}>
          {isRoom ? (
            <>
              <div className="w-20 h-20 rounded-2xl border flex items-center justify-center"
                   style={{ background: 'rgba(255,239,178,0.08)', borderColor: '#025A50' }}>
                <Hash size={36} style={{ color: '#FFEFB2' }} />
              </div>
              <div className="text-center">
                <h4 className="font-bold text-base" style={{ color: '#FFEFB2' }}>{room.name}</h4>
                {room.description && (
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: '#7A9E99' }}>{room.description}</p>
                )}
              </div>
            </>
          ) : other ? (
            <>
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 flex items-center justify-center text-2xl font-black"
                     style={{ background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)', borderColor: '#025A50', color: '#013E37' }}>
                  {other.avatar?.startsWith?.('data:') || other.avatar?.startsWith?.('http')
                    ? <img src={other.avatar} alt="" className="w-full h-full object-cover" />
                    : other.username?.[0]?.toUpperCase() || '?'
                  }
                </div>
                {other.isOnline && (
                  <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2"
                       style={{ background: '#4ADE80', borderColor: '#012B26' }} />
                )}
              </div>
              <div className="text-center">
                <h4 className="font-bold text-base" style={{ color: '#FFEFB2' }}>{other.username}</h4>
                <p className="text-xs mt-0.5" style={{ color: other.isOnline ? '#4ADE80' : '#7A9E99' }}>
                  {other.isOnline ? 'Online' : 'Offline'}
                </p>
                {other.nexTalkNumber && (
                  <p className="text-xs font-mono mt-1" style={{ color: '#7A9E99' }}>
                    {other.nexTalkNumber.replace(/^(\+100)(\d{7})$/, '+100 $2')}
                  </p>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* ── Stats row ────────────────────────────────────────────── */}
        {isRoom && (
          <div className="grid grid-cols-2 gap-px border-b" style={{ borderColor: '#025A50' }}>
            {[
              { label: 'Members',  value: room.members?.length || 0, icon: Users   },
              { label: 'Online',   value: onlineUsers.length,         icon: Globe   },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-1 py-4 border-r last:border-r-0"
                   style={{ borderColor: '#025A50' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: 'rgba(255,239,178,0.08)' }}>
                  <Icon size={15} style={{ color: '#FFEFB2' }} />
                </div>
                <span className="text-lg font-bold" style={{ color: '#FFEFB2' }}>{value}</span>
                <span className="text-xs" style={{ color: '#7A9E99' }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Room details ──────────────────────────────────────────── */}
        {isRoom && (
          <div className="px-5 py-4 space-y-3 border-b" style={{ borderColor: '#025A50' }}>
            <p className="section-label">Room Details</p>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock size={13} style={{ color: '#7A9E99' }} />
                  <span className="text-xs" style={{ color: '#7A9E99' }}>Privacy</span>
                </div>
                <span className="text-xs font-medium" style={{ color: '#D4C98A' }}>
                  {room.isPrivate !== false ? 'Private' : 'Public'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={13} style={{ color: '#7A9E99' }} />
                  <span className="text-xs" style={{ color: '#7A9E99' }}>Created</span>
                </div>
                <span className="text-xs font-medium" style={{ color: '#D4C98A' }}>
                  {formatDate(room.createdAt)}
                </span>
              </div>

              {roomMood?.mood && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{
                      background: {
                        positive: '#4ADE80', excited: '#60D4C8',
                        neutral: '#7A9E99', tense: '#FCD34D', negative: '#F87171'
                      }[roomMood.mood] || '#7A9E99'
                    }} />
                    <span className="text-xs" style={{ color: '#7A9E99' }}>Room Mood</span>
                  </div>
                  <span className="text-xs font-medium capitalize" style={{ color: '#D4C98A' }}>
                    {roomMood.mood} ({roomMood.score}%)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Online members list ───────────────────────────────────── */}
        {isRoom && onlineUsers.length > 0 && (
          <div className="px-5 py-4 border-b" style={{ borderColor: '#025A50' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="section-label">Online Now</p>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'rgba(74,222,128,0.12)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.25)' }}>
                {onlineUsers.length}
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {onlineUsers.map((u) => {
                const isYou   = u.userId === currentUserId;
                const hasImg  = u.avatar?.startsWith?.('data:') || u.avatar?.startsWith?.('http');
                return (
                  <div key={u.userId} className="flex items-center gap-2.5">
                    <div className="relative flex-shrink-0">
                      <div className="w-7 h-7 rounded-full overflow-hidden border flex items-center justify-center text-xs font-bold"
                           style={{ background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)', borderColor: '#025A50', color: '#013E37' }}>
                        {hasImg
                          ? <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                          : u.username?.[0]?.toUpperCase()
                        }
                      </div>
                      <div className="status-online absolute -bottom-0.5 -right-0.5" />
                    </div>
                    <span className="text-sm flex-1 truncate" style={{ color: '#D4C98A' }}>{u.username}</span>
                    {isYou && <span className="text-xs" style={{ color: '#7A9E99' }}>you</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── DM info ───────────────────────────────────────────────── */}
        {!isRoom && other && (
          <div className="px-5 py-4 space-y-3">
            <p className="section-label">About</p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#7A9E99' }}>Status</span>
                <span className="text-xs font-medium" style={{ color: other.isOnline ? '#4ADE80' : '#7A9E99' }}>
                  {other.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              {other.nexTalkNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#7A9E99' }}>NexTalk #</span>
                  <span className="text-xs font-mono font-medium" style={{ color: '#D4C98A' }}>
                    {other.nexTalkNumber.replace(/^(\+100)(\d{7})$/, '+100 $2')}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-4 p-3 rounded-nt border text-xs leading-relaxed"
                 style={{ background: 'rgba(255,239,178,0.04)', borderColor: '#025A50', color: '#7A9E99' }}>
              This is a private conversation. Only you and {other.username} can see these messages.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomInfoPanel;
