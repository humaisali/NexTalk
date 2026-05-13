import { useSocket } from '../context/SocketContext';
import { X, Users, Clock, Lock, Globe } from 'lucide-react';

const RoomInfoPanel = ({ room, conversation, onClose, currentUserId }) => {
  const { onlineUsers } = useSocket();

  const other = conversation?.participants?.find(
    (p) => p._id?.toString() !== currentUserId
  );

  const isRoom = !!room;

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-72 flex-shrink-0 flex flex-col bg-white border-l border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <h3 className="text-sm font-bold text-gray-800">
          {isRoom ? 'Group Info' : 'About'}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* Avatar / icon block */}
        <div className="flex flex-col items-center gap-3 px-5 py-6 border-b border-gray-100">
          {isRoom ? (
            <>
              {/* Group avatar */}
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-blue-50 text-blue-500 border border-blue-100 flex items-center justify-center text-3xl font-black shadow-sm">
                {room.avatar?.startsWith('data:') || room.avatar?.startsWith('http')
                  ? <img src={room.avatar} alt="avatar" className="w-full h-full object-cover" />
                  : room.name?.[0]?.toUpperCase() || '#'
                }
              </div>
              <div className="text-center">
                <h4 className="font-bold text-lg text-gray-800">{room.name}</h4>
                {room.description && (
                  <p className="text-sm mt-1 leading-relaxed text-gray-500">{room.description}</p>
                )}
              </div>
            </>
          ) : other ? (
            <>
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 text-gray-600 border border-gray-100 flex items-center justify-center text-2xl font-black shadow-sm">
                  {other.avatar?.startsWith?.('data:') || other.avatar?.startsWith?.('http')
                    ? <img src={other.avatar} alt="" className="w-full h-full object-cover" />
                    : other.username?.[0]?.toUpperCase() || '?'
                  }
                </div>
                {other.isOnline && (
                  <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-white" />
                )}
              </div>
              <div className="text-center">
                <h4 className="font-bold text-lg text-gray-800">{other.username}</h4>
                <p className={`text-sm mt-0.5 font-medium ${other.isOnline ? 'text-green-500' : 'text-gray-400'}`}>
                  {other.isOnline ? 'Online' : 'Offline'}
                </p>
                {other.nexTalkNumber && (
                  <p className="text-sm font-mono mt-1 text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100 inline-block">
                    {other.nexTalkNumber.replace(/^(\+100)(\d{7})$/, '+100 $2')}
                  </p>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Stats row */}
        {isRoom && (
          <div className="grid grid-cols-2 gap-px border-b border-gray-100 bg-gray-50">
            {[
              { label: 'Members', value: room.members?.length || 0, icon: Users  },
              { label: 'Online',  value: onlineUsers.length,         icon: Globe  },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-1 py-4 bg-white">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-500 mb-1">
                  <Icon size={16} />
                </div>
                <span className="text-lg font-bold text-gray-800">{value}</span>
                <span className="text-xs font-medium text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Group details */}
        {isRoom && (
          <>
            <div className="px-5 py-5 space-y-4 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Group Details</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Lock size={14} />
                    <span className="text-sm">Privacy</span>
                  </div>
                  <span className="text-sm font-medium text-gray-800 bg-gray-50 px-2.5 py-0.5 rounded-md border border-gray-100">
                    {room.isPrivate !== false ? 'Invite only' : 'Public'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock size={14} />
                    <span className="text-sm">Created</span>
                  </div>
                  <span className="text-sm font-medium text-gray-800">
                    {formatDate(room.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Online Members */}
            <div className="px-5 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Online Members</p>
                <span className="text-[10px] font-bold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                  {room.members?.filter(m => m.isOnline).length || 0}
                </span>
              </div>
              <div className="space-y-3">
                {room.members?.filter(m => m.isOnline).map((member) => (
                  <div key={member._id} className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gray-200 border border-white flex items-center justify-center text-xs font-bold text-gray-600 overflow-hidden shadow-sm">
                        {member.avatar?.startsWith('http') || member.avatar?.startsWith('data:') 
                          ? <img src={member.avatar} alt="" className="w-full h-full object-cover" /> 
                          : member.username?.[0]?.toUpperCase()}
                      </div>
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-800 truncate">{member.username}</span>
                  </div>
                ))}
                {room.members?.filter(m => m.isOnline).length === 0 && (
                  <p className="text-sm text-gray-400 italic">No one is online right now.</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* DM info */}
        {!isRoom && other && (
          <div className="px-5 py-5 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">About</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`text-sm font-medium ${other.isOnline ? 'text-green-500 bg-green-50' : 'text-gray-500 bg-gray-50'} px-2.5 py-0.5 rounded-md border ${other.isOnline ? 'border-green-100' : 'border-gray-100'}`}>
                  {other.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              {other.nexTalkNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">NexTalk #</span>
                  <span className="text-sm font-mono font-medium text-gray-800">
                    {other.nexTalkNumber.replace(/^(\+100)(\d{7})$/, '+100 $2')}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm leading-relaxed text-blue-800 shadow-sm">
              This is a private conversation. Only you and <strong>{other.username}</strong> can see these messages.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomInfoPanel;
