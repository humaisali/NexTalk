import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import MoodIndicator from './MoodIndicator';
import { FiHash, FiPlus, FiLogOut, FiX } from 'react-icons/fi';

const Sidebar = ({ rooms, roomsLoading, onSelectRoom, onCreateRoom }) => {
  const { user, logout }                   = useAuth();
  const { activeRoom, onlineUsers, isConnected } = useSocket();

  const [showCreate, setShowCreate]   = useState(false);
  const [roomName, setRoomName]       = useState('');
  const [roomDesc, setRoomDesc]       = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating]       = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      await onCreateRoom(roomName.trim(), roomDesc.trim());
      setRoomName(''); setRoomDesc('');
      setShowCreate(false);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create room.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="w-72 bg-nt-surface border-r border-nt-border flex flex-col flex-shrink-0 overflow-hidden">

      {/* ── Rooms section ─────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-nt-muted uppercase tracking-widest">Rooms</span>
          <button
            onClick={() => setShowCreate(true)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-nt-muted hover:text-nt-blue hover:bg-nt-blue/10 transition-all"
            title="New room"
          >
            <FiPlus size={14} />
          </button>
        </div>

        {/* Create room inline form */}
        {showCreate && (
          <div className="mx-3 mb-3 p-3 rounded-xl bg-nt-surface2 border border-nt-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-nt-text">New Room</span>
              <button onClick={() => { setShowCreate(false); setCreateError(''); }} className="text-nt-muted hover:text-nt-text">
                <FiX size={13} />
              </button>
            </div>
            {createError && (
              <p className="text-xs text-nt-danger mb-2">{createError}</p>
            )}
            <form onSubmit={handleCreate} className="space-y-2">
              <input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room name"
                required minLength={2}
                className="w-full bg-nt-surface border border-nt-border text-nt-text text-xs placeholder-nt-muted rounded-lg px-3 py-2 focus:outline-none focus:border-nt-blue"
                autoFocus
              />
              <input
                value={roomDesc}
                onChange={(e) => setRoomDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-nt-surface border border-nt-border text-nt-text text-xs placeholder-nt-muted rounded-lg px-3 py-2 focus:outline-none focus:border-nt-blue"
              />
              <button
                type="submit"
                disabled={creating || !roomName.trim()}
                className="w-full bg-nt-blue hover:bg-blue-500 text-white text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create Room'}
              </button>
            </form>
          </div>
        )}

        {/* Rooms list */}
        <div className="px-2 space-y-0.5">
          {roomsLoading ? (
            <div className="flex flex-col gap-2 px-2 py-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-9 rounded-lg bg-nt-surface2 animate-pulse" />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">🏠</p>
              <p className="text-nt-muted text-xs">No rooms yet.<br />Create one to get started!</p>
            </div>
          ) : (
            rooms.map((room) => {
              const isActive = activeRoom?._id === room._id;
              return (
                <button
                  key={room._id}
                  onClick={() => onSelectRoom(room)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-2.5 transition-all group
                    ${isActive
                      ? 'bg-nt-blue/15 border border-nt-blue/25 shadow-sm'
                      : 'hover:bg-nt-surface2 border border-transparent'
                    }`}
                >
                  <FiHash size={14} className={`mt-0.5 flex-shrink-0 ${isActive ? 'text-nt-blue' : 'text-nt-muted group-hover:text-nt-text'}`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-nt-text' : 'text-nt-muted group-hover:text-nt-text'}`}>
                      {room.name}
                    </p>
                    {room.description && (
                      <p className="text-xs text-nt-muted truncate mt-0.5">{room.description}</p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Mood indicator (when in a room) ─────── */}
      {activeRoom && (
        <div className="border-t border-nt-border pt-3">
          <MoodIndicator compact={false} />
        </div>
      )}

      {/* ── Online users ─────────────────────────── */}
      {activeRoom && onlineUsers.length > 0 && (
        <div className="border-t border-nt-border px-4 py-3">
          <p className="text-xs font-semibold text-nt-muted uppercase tracking-widest mb-2">
            Online — {onlineUsers.length}
          </p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {onlineUsers.map((u) => (
              <div key={u.userId} className="flex items-center gap-2">
                <div className="relative flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-nt-surface2 border border-nt-border flex items-center justify-center text-xs font-semibold text-nt-text">
                    {u.avatar || u.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-nt-success rounded-full border border-nt-surface" />
                </div>
                <span className="text-xs text-nt-text truncate">{u.username}</span>
                {u.userId === user?._id?.toString() && (
                  <span className="text-xs text-nt-muted ml-auto">(you)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── User footer ──────────────────────────── */}
      <div className="border-t border-nt-border p-3 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nt-blue/80 to-nt-cyan/60 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-nt-text truncate">{user?.username}</p>
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-nt-success' : 'bg-nt-muted'}`} />
            <p className="text-xs text-nt-muted">{isConnected ? 'Online' : 'Connecting…'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="p-1.5 text-nt-muted hover:text-nt-danger hover:bg-nt-danger/10 rounded-lg transition-all"
          title="Sign out"
        >
          <FiLogOut size={14} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
