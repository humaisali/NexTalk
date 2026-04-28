import { useState } from 'react';
import { useAuth }          from '../context/AuthContext';
import { useSocket }        from '../context/SocketContext';
import MoodIndicator        from './MoodIndicator';
import MoodHistory          from './MoodHistory';
import LanguageSelector     from './LanguageSelector';
import ConversationList     from './ConversationList';
import { FiHash, FiPlus, FiLogOut, FiX, FiMessageCircle, FiGrid } from 'react-icons/fi';

/**
 * Sidebar — now has two tabs: Rooms | Direct Messages
 *
 * New props:
 *   conversations    — from useConversations
 *   convLoading      — boolean
 *   activeConvId     — string
 *   totalUnreadDMs   — number (badge on DM tab)
 *   onSelectConv     — fn(conversation)
 *   onNewChat        — fn() open StartConversation modal
 */
const Sidebar = ({
  rooms, roomsLoading, onSelectRoom, onCreateRoom, onLanguageChange,
  conversations = [], convLoading, activeConvId, totalUnreadDMs = 0,
  onSelectConv, onNewChat
}) => {
  const { user, logout }                                = useAuth();
  const { activeRoom, onlineUsers, isConnected, moodHistory } = useSocket();

  const [tab,        setTab]        = useState('rooms'); // 'rooms' | 'dms'
  const [showCreate, setShowCreate] = useState(false);
  const [roomName,   setRoomName]   = useState('');
  const [roomDesc,   setRoomDesc]   = useState('');
  const [createErr,  setCreateErr]  = useState('');
  const [creating,   setCreating]   = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateErr('');
    setCreating(true);
    try {
      await onCreateRoom(roomName.trim(), roomDesc.trim());
      setRoomName(''); setRoomDesc('');
      setShowCreate(false);
    } catch (err) {
      setCreateErr(err.response?.data?.message || err?.message || 'Failed to create room.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="w-72 bg-nt-surface border-r border-nt-border flex flex-col flex-shrink-0 overflow-hidden">

      {/* ── Tab switcher ────────────────────────────────────────── */}
      <div className="flex border-b border-nt-border flex-shrink-0">
        <button
          onClick={() => setTab('rooms')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all border-b-2
            ${tab === 'rooms'
              ? 'text-nt-blue border-nt-blue bg-nt-blue/5'
              : 'text-nt-muted border-transparent hover:text-nt-text hover:bg-nt-surface2'}`}
        >
          <FiGrid size={13} />
          Rooms
        </button>
        <button
          onClick={() => setTab('dms')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all border-b-2 relative
            ${tab === 'dms'
              ? 'text-nt-blue border-nt-blue bg-nt-blue/5'
              : 'text-nt-muted border-transparent hover:text-nt-text hover:bg-nt-surface2'}`}
        >
          <FiMessageCircle size={13} />
          Messages
          {totalUnreadDMs > 0 && (
            <span className="absolute top-2 right-4 min-w-[16px] h-4 rounded-full bg-nt-blue text-white text-xs flex items-center justify-center px-1 font-bold">
              {totalUnreadDMs > 99 ? '99+' : totalUnreadDMs}
            </span>
          )}
        </button>
      </div>

      {/* ── Tab content ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* ROOMS TAB */}
        {tab === 'rooms' && (
          <>
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-nt-muted uppercase tracking-widest">Rooms</span>
              <button onClick={() => setShowCreate(true)}
                className="w-6 h-6 rounded-md flex items-center justify-center text-nt-muted hover:text-nt-blue hover:bg-nt-blue/10 transition-all">
                <FiPlus size={14} />
              </button>
            </div>

            {/* Inline create room form */}
            {showCreate && (
              <div className="mx-3 mb-3 p-3 rounded-xl bg-nt-surface2 border border-nt-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-nt-text">New Room</span>
                  <button onClick={() => { setShowCreate(false); setCreateErr(''); }}
                    className="text-nt-muted hover:text-nt-text"><FiX size={13} /></button>
                </div>
                {createErr && <p className="text-xs text-nt-danger mb-2">{createErr}</p>}
                <form onSubmit={handleCreate} className="space-y-2">
                  <input value={roomName} onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Room name" required minLength={2} autoFocus
                    className="w-full bg-nt-surface border border-nt-border text-nt-text text-xs placeholder-nt-muted rounded-lg px-3 py-2 focus:outline-none focus:border-nt-blue" />
                  <input value={roomDesc} onChange={(e) => setRoomDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full bg-nt-surface border border-nt-border text-nt-text text-xs placeholder-nt-muted rounded-lg px-3 py-2 focus:outline-none focus:border-nt-blue" />
                  <button type="submit" disabled={creating || !roomName.trim()}
                    className="w-full bg-nt-blue hover:bg-blue-500 text-white text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50">
                    {creating ? 'Creating…' : 'Create Room'}
                  </button>
                </form>
              </div>
            )}

            {/* Room list */}
            <div className="px-2 space-y-0.5">
              {roomsLoading ? (
                <div className="flex flex-col gap-2 px-2 py-3">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-9 rounded-lg bg-nt-surface2 animate-pulse" />)}
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
                    <button key={room._id} onClick={() => onSelectRoom(room)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-2.5 transition-all group
                        ${isActive ? 'bg-nt-blue/15 border border-nt-blue/25' : 'hover:bg-nt-surface2 border border-transparent'}`}>
                      <FiHash size={14} className={`mt-0.5 flex-shrink-0 ${isActive ? 'text-nt-blue' : 'text-nt-muted group-hover:text-nt-text'}`} />
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-nt-text' : 'text-nt-muted group-hover:text-nt-text'}`}>{room.name}</p>
                        {room.description && <p className="text-xs text-nt-muted truncate mt-0.5">{room.description}</p>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Mood panel (rooms only) */}
            {activeRoom && (
              <div className="border-t border-nt-border pt-3 mt-2">
                <MoodIndicator compact={false} />
                <MoodHistory history={moodHistory} />
              </div>
            )}

            {/* Online users (rooms only) */}
            {activeRoom && onlineUsers.length > 0 && (
              <div className="border-t border-nt-border px-4 py-3">
                <p className="text-xs font-semibold text-nt-muted uppercase tracking-widest mb-2">Online — {onlineUsers.length}</p>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {onlineUsers.map((u) => (
                    <div key={u.userId} className="flex items-center gap-2">
                      <div className="relative flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-nt-surface2 border border-nt-border flex items-center justify-center text-xs font-semibold text-nt-text">
                          {u.avatar || u.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-nt-success rounded-full border border-nt-surface" />
                      </div>
                      <span className="text-xs text-nt-text truncate">{u.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* DMS TAB */}
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

      {/* ── Language selector (always visible) ─────────────────── */}
      <div className="border-t border-nt-border px-3 py-3 flex-shrink-0">
        <p className="text-xs font-semibold text-nt-muted uppercase tracking-widest mb-2 px-1">🌐 Translation</p>
        <LanguageSelector onLanguageChange={onLanguageChange} />
        {user?.language && user.language !== 'en' && (
          <p className="text-xs text-nt-muted/60 mt-1.5 px-1">
            Auto-translating to <strong className="text-nt-cyan">{user.language.toUpperCase()}</strong>
          </p>
        )}
      </div>

      {/* ── User footer ─────────────────────────────────────────── */}
      <div className="border-t border-nt-border p-3 flex items-center gap-2.5 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nt-blue/80 to-nt-cyan/60 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-nt-text truncate">{user?.username}</p>
          {user?.nexTalkNumber && (
            <p className="text-xs text-nt-muted font-mono truncate">
              {user.nexTalkNumber.replace(/^(\+100)(\d{7})$/, '$1 $2')}
            </p>
          )}
        </div>
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isConnected ? 'bg-nt-success' : 'bg-nt-muted'}`} />
        <button onClick={logout} className="p-1.5 text-nt-muted hover:text-nt-danger hover:bg-nt-danger/10 rounded-lg transition-all flex-shrink-0" title="Sign out">
          <FiLogOut size={14} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
