import { useState } from 'react';
import { useAuth }        from '../context/AuthContext';
import { useSocket }      from '../context/SocketContext';
import ConversationList   from './ConversationList';
import MoodIndicator      from './MoodIndicator';
import { Search, Edit, Users, MessageSquare } from 'lucide-react';

const Sidebar = ({
  rooms, roomsLoading, onSelectRoom, onCreateRoom, onJoinRoom,
  conversations, convLoading, activeConvId, totalUnreadDMs,
  onSelectConv, onNewChat, onEditProfile,
  tab, setTab
}) => {
  const { user } = useAuth();
  const { activeRoom } = useSocket();

  const [search, setSearch] = useState('');

  const filteredRooms = rooms.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-80 flex flex-col flex-shrink-0 border-r border-gray-200" style={{ background: 'var(--bg-chat-list)' }}>
      
      {/* Header & Search */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-white text-sm text-gray-800 placeholder-gray-400 border border-gray-200 rounded-full py-2.5 pl-10 pr-4 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={tab === 'dms' ? onNewChat : () => {}} 
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-400 transition-colors shadow-sm"
            title="New"
          >
            <Edit size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 px-1">
          <button 
            onClick={() => setTab('dms')}
            className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${tab === 'dms' ? 'border-gray-800 text-gray-800' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            Messages {totalUnreadDMs > 0 && <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1.5">{totalUnreadDMs}</span>}
          </button>
          <button 
            onClick={() => setTab('rooms')}
            className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${tab === 'rooms' ? 'border-gray-800 text-gray-800' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* List area */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {tab === 'rooms' && (
          <>
            {roomsLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    <div className="h-3 w-32 bg-gray-200 rounded" />
                  </div>
                </div>
              ))
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Users size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 font-medium">No groups found</p>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isActive = activeRoom?._id === room._id;
                return (
                  <button
                    key={room._id}
                    onClick={() => onSelectRoom(room)}
                    className={`chat-list-item ${isActive ? 'active bg-white shadow-sm' : ''}`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-gray-600 font-bold text-lg">
                        {room.avatar?.startsWith('data:') || room.avatar?.startsWith('http')
                          ? <img src={room.avatar} alt="" className="w-full h-full object-cover" />
                          : room.name?.[0]?.toUpperCase() || '#'
                        }
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="text-sm font-semibold text-gray-800 truncate">{room.name}</p>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{room.description || 'Group chat'}</p>
                    </div>
                  </button>
                );
              })
            )}
          </>
        )}

        {tab === 'dms' && (
          <ConversationList
            conversations={conversations}
            loading={convLoading}
            activeConvId={activeConvId}
            currentUserId={user?._id}
            onSelect={onSelectConv}
            onNewChat={onNewChat}
          />
        )}
      </div>

      {/* Mood Indicator (When in a Group) */}
      {activeRoom && tab === 'rooms' && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 flex flex-col pt-4">
          <MoodIndicator />
        </div>
      )}

    </div>
  );
};

export default Sidebar;
