import { useState } from 'react';
import { useAuth }        from '../context/AuthContext';
import { useSocket }      from '../context/SocketContext';
import ConversationList   from './ConversationList';
import MoodIndicator      from './MoodIndicator';
import {
  Hash, Plus, X, MessageSquare, LayoutGrid,
  LogOut, Edit2, Search, Users, Link, UserPlus
} from 'lucide-react';

const Sidebar = ({
  rooms, roomsLoading, onSelectRoom, onCreateRoom, onJoinRoom,
  conversations, convLoading, activeConvId, totalUnreadDMs,
  onSelectConv, onNewChat, onEditProfile
}) => {
  const { user, logout }   = useAuth();
  const { activeRoom, onlineUsers, isConnected, moodHistory } = useSocket();

  const [tab,        setTab]        = useState('rooms');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin,   setShowJoin]   = useState(false);
  const [roomName,   setRoomName]   = useState('');
  const [roomDesc,   setRoomDesc]   = useState('');
  const [joinCode,   setJoinCode]   = useState('');
  const [createErr,  setCreateErr]  = useState('');
  const [joinErr,    setJoinErr]    = useState('');
  const [creating,   setCreating]   = useState(false);
  const [joining,    setJoining]    = useState(false);
  const [search,     setSearch]     = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateErr('');
    setCreating(true);
    try {
      await onCreateRoom(roomName.trim(), roomDesc.trim());
      setRoomName(''); setRoomDesc(''); setShowCreate(false);
    } catch (err) {
      setCreateErr(err.response?.data?.message || err?.message || 'Failed to create group.');
    } finally { setCreating(false); }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinErr('');
    const code = joinCode.trim();
    if (!code) { setJoinErr('Enter an invite code or link.'); return; }
    setJoining(true);
    try {
      await onJoinRoom(code);
      setJoinCode(''); setShowJoin(false);
    } catch (err) {
      setJoinErr(err.response?.data?.message || 'Invalid code. Ask the group admin for a new link.');
    } finally { setJoining(false); }
  };

  const filtered = rooms.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
  const hasImg = user?.avatar?.startsWith?.('data:image/') || user?.avatar?.startsWith?.('http');

  return (
    <div className="w-80 flex flex-col flex-shrink-0 border-r" style={{ background: '#012B26', borderColor: '#025A50' }}>

      {/* ── Search bar ───────────────────────────────────────────── */}
      <div className="p-4 border-b" style={{ borderColor: '#025A50' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-nt"
             style={{ background: '#011F1B', border: '1px solid #025A50' }}>
          <Search size={15} style={{ color: '#7A9E99' }} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups and messages…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: '#FFEFB2', caretColor: '#FFEFB2' }}
          />
        </div>
      </div>

      {/* ── Tab switcher ─────────────────────────────────────────── */}
      <div className="flex border-b" style={{ borderColor: '#025A50' }}>
        <button onClick={() => setTab('rooms')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-all
            ${tab === 'rooms' ? 'border-primary text-primary' : 'border-transparent text-nt-muted hover:text-nt-text2'}`}>
          <LayoutGrid size={13} />Groups
        </button>
        <button onClick={() => setTab('dms')}
          className={`relative flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-all
            ${tab === 'dms' ? 'border-primary text-primary' : 'border-transparent text-nt-muted hover:text-nt-text2'}`}>
          <MessageSquare size={13} />Messages
          {totalUnreadDMs > 0 && (
            <span className="absolute top-2 right-4 min-w-[16px] h-4 rounded-full text-secondary text-xs flex items-center justify-center px-1 font-bold"
                  style={{ background: '#FFEFB2' }}>
              {totalUnreadDMs > 99 ? '99+' : totalUnreadDMs}
            </span>
          )}
        </button>
      </div>

      {/* ── List area ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* GROUPS TAB */}
        {tab === 'rooms' && (
          <div className="p-3 space-y-0.5">
            {/* Header with Create + Join */}
            <div className="flex items-center justify-between px-2 py-2 mb-1">
              <span className="section-label">Groups</span>
              <div className="flex items-center gap-1">
                {/* Join existing group */}
                <button onClick={() => { setShowJoin(!showJoin); setShowCreate(false); setJoinErr(''); }}
                  className="w-6 h-6 rounded-md flex items-center justify-center transition-all hover:opacity-80"
                  style={{ background: 'rgba(96,212,200,0.15)', color: '#60D4C8' }}
                  title="Join a group">
                  <UserPlus size={12} />
                </button>
                {/* Create new group */}
                <button onClick={() => { setShowCreate(!showCreate); setShowJoin(false); setCreateErr(''); }}
                  className="w-6 h-6 rounded-md flex items-center justify-center transition-all hover:opacity-80"
                  style={{ background: 'rgba(255,239,178,0.1)', color: '#FFEFB2' }}
                  title="Create a group">
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* Join group form */}
            {showJoin && (
              <div className="mx-1 mb-3 p-3 rounded-nt border" style={{ background: '#011F1B', borderColor: 'rgba(96,212,200,0.3)' }}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Link size={12} style={{ color: '#60D4C8' }} />
                    <span className="text-xs font-semibold" style={{ color: '#60D4C8' }}>Join a Group</span>
                  </div>
                  <button onClick={() => { setShowJoin(false); setJoinErr(''); }}
                    className="transition-colors" style={{ color: '#7A9E99' }}>
                    <X size={13} />
                  </button>
                </div>
                {joinErr && <p className="text-xs mb-2" style={{ color: '#F87171' }}>{joinErr}</p>}
                <form onSubmit={handleJoin} className="space-y-2">
                  <input value={joinCode} onChange={(e) => { setJoinErr(''); setJoinCode(e.target.value); }}
                    placeholder="Paste invite link or code…" autoFocus
                    className="nt-input text-xs py-2"
                    style={{ borderColor: 'rgba(96,212,200,0.3)' }}
                  />
                  <p className="text-xs" style={{ color: 'rgba(122,158,153,0.6)' }}>
                    Ask a group admin to share their invite link
                  </p>
                  <button type="submit" disabled={joining || !joinCode.trim()}
                    className="w-full text-xs py-2 rounded-nt font-semibold transition-all"
                    style={{ background: joining || !joinCode.trim() ? 'rgba(96,212,200,0.15)' : '#60D4C8', color: '#013E37' }}>
                    {joining ? 'Joining…' : 'Join Group'}
                  </button>
                </form>
              </div>
            )}

            {/* Create group form */}
            {showCreate && (
              <div className="mx-1 mb-3 p-3 rounded-nt border" style={{ background: '#011F1B', borderColor: '#025A50' }}>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-nt-text">New Group</span>
                  <button onClick={() => { setShowCreate(false); setCreateErr(''); }}
                    className="text-nt-muted hover:text-nt-text2 transition-colors">
                    <X size={13} />
                  </button>
                </div>
                {createErr && <p className="text-xs text-nt-danger mb-2">{createErr}</p>}
                <form onSubmit={handleCreate} className="space-y-2">
                  <input value={roomName} onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Group name" required minLength={2} autoFocus
                    className="nt-input text-xs py-2" />
                  <input value={roomDesc} onChange={(e) => setRoomDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className="nt-input text-xs py-2" />
                  <button type="submit" disabled={creating || !roomName.trim()}
                    className="btn-primary w-full text-xs py-2">
                    {creating ? 'Creating…' : 'Create Group'}
                  </button>
                </form>
              </div>
            )}

            {/* Groups list */}
            {roomsLoading ? (
              [...Array(4)].map((_,i) => (
                <div key={i} className="h-10 rounded-nt animate-pulse mx-1 mb-1" style={{ background: '#013E37' }} />
              ))
            ) : filtered.length === 0 ? (
              <div className="text-center py-8">
                <Users size={28} className="mx-auto mb-2 opacity-30" style={{ color: '#FFEFB2' }} />
                <p className="text-nt-muted text-xs mb-1">
                  {search ? 'No groups match your search' : "You haven't joined any groups yet."}
                </p>
                {!search && (
                  <p className="text-xs" style={{ color: 'rgba(122,158,153,0.5)' }}>
                    Create one or paste an invite link above
                  </p>
                )}
              </div>
            ) : (
              filtered.map((room) => {
                const isActive = activeRoom?._id === room._id;
                return (
                  <button key={room._id} onClick={() => onSelectRoom(room)}
                    className={`sidebar-item ${isActive ? 'active' : ''} w-full`}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                         style={{
                           background: isActive ? 'rgba(255,239,178,0.2)' : 'rgba(255,239,178,0.08)',
                           color: isActive ? '#FFEFB2' : '#7A9E99',
                           border: `1px solid ${isActive ? 'rgba(255,239,178,0.3)' : '#025A50'}`
                         }}>
                      {room.name?.[0]?.toUpperCase() || '#'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: isActive ? '#FFEFB2' : '#D4C98A' }}>
                        {room.name}
                      </p>
                      {room.description && (
                        <p className="text-xs truncate" style={{ color: '#7A9E99' }}>{room.description}</p>
                      )}
                    </div>
                    {/* Member count badge */}
                    {room.members?.length > 0 && (
                      <span className="text-xs flex-shrink-0" style={{ color: '#7A9E99' }}>
                        {room.members.length}
                      </span>
                    )}
                  </button>
                );
              })
            )}

            {/* Mood panel when in a group */}
            {activeRoom && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: '#025A50' }}>
                <MoodIndicator compact={false} />
              </div>
            )}

            {/* Online members */}
            {activeRoom && onlineUsers.length > 0 && (
              <div className="mt-2 pt-2 border-t" style={{ borderColor: '#025A50' }}>
                <div className="flex items-center gap-2 px-2 py-1.5 mb-1.5">
                  <Users size={12} style={{ color: '#7A9E99' }} />
                  <span className="section-label">Online — {onlineUsers.length}</span>
                </div>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {onlineUsers.map((u) => (
                    <div key={u.userId} className="flex items-center gap-2.5 px-2 py-1">
                      <div className="relative flex-shrink-0">
                        <div className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold"
                             style={{ background: '#013E37', borderColor: '#025A50', color: '#FFEFB2' }}>
                          {u.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="status-online absolute -bottom-0.5 -right-0.5" />
                      </div>
                      <span className="text-xs truncate" style={{ color: '#D4C98A' }}>{u.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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

      {/* ── User footer ─────────────────────────────────────────── */}
      <div className="border-t p-3" style={{ borderColor: '#025A50' }}>
        <button onClick={onEditProfile}
          className="w-full flex items-center gap-2.5 p-2 rounded-nt group transition-all hover:opacity-80"
          style={{ background: 'rgba(255,239,178,0.05)' }}>
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full overflow-hidden border flex items-center justify-center text-sm font-bold"
                 style={{ background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)', borderColor: '#025A50', color: '#013E37' }}>
              {hasImg
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : user?.username?.[0]?.toUpperCase() || 'U'
              }
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 ${isConnected ? 'status-online' : 'status-offline'}`} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold truncate" style={{ color: '#FFEFB2' }}>{user?.username}</p>
            {user?.nexTalkNumber && (
              <p className="text-xs font-mono truncate" style={{ color: '#7A9E99' }}>
                {user.nexTalkNumber.replace(/^(\+100)(\d{7})$/, '+100 $2')}
              </p>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="p-1.5 rounded-lg" style={{ color: '#7A9E99' }}>
              <Edit2 size={13} />
            </div>
            <button onClick={(e) => { e.stopPropagation(); logout(); }}
              className="p-1.5 rounded-lg transition-colors" title="Sign out"
              style={{ color: '#7A9E99' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#F87171'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#7A9E99'}>
              <LogOut size={13} />
            </button>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
