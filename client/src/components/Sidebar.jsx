import { useState } from 'react';
import { useAuth }        from '../context/AuthContext';
import { useSocket }      from '../context/SocketContext';
import ConversationList   from './ConversationList';
import MoodIndicator      from './MoodIndicator';
import {
  Plus, X, MessageSquare, LayoutGrid,
  LogOut, Edit2, Search, Users, Link, UserPlus, Hash, Settings
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
    <div className="sidebar-gradient w-72 flex flex-col flex-shrink-0">

      {/* Brand header */}
      <div className="px-5 py-4 flex items-center gap-3 border-b" style={{ borderColor: 'rgba(255,239,178,0.06)' }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)',
            boxShadow: '0 0 20px rgba(255,239,178,0.2), 0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <MessageSquare size={18} style={{ color: '#013E37' }} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-base font-black text-gradient tracking-tight">NexTalk</h1>
          <p className="text-xs" style={{ color: 'rgba(122,158,153,0.6)' }}>AI-Powered Chat</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 py-3">
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all duration-200"
          style={{
            background: 'rgba(13,26,24,0.8)',
            border: '1px solid rgba(255,239,178,0.08)',
          }}
        >
          <Search size={13} style={{ color: '#7A9E99' }} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms & messages…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: '#FFEFB2', caretColor: '#FFEFB2' }}
          />
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex mx-4 mb-2 rounded-xl p-1" style={{ background: 'rgba(8,14,13,0.6)', border: '1px solid rgba(255,239,178,0.06)' }}>
        {[
          { key: 'rooms', label: 'Groups', icon: LayoutGrid },
          { key: 'dms',   label: 'Messages', icon: MessageSquare, badge: totalUnreadDMs },
        ].map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="relative flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all duration-200"
            style={tab === key ? {
              background: 'linear-gradient(135deg, rgba(255,239,178,0.12), rgba(255,239,178,0.06))',
              color: '#FFEFB2',
              border: '1px solid rgba(255,239,178,0.15)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,239,178,0.08)',
            } : {
              color: 'rgba(122,158,153,0.7)',
            }}
          >
            <Icon size={13} />
            {label}
            {badge > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full text-xs font-bold flex items-center justify-center px-1"
                style={{ background: '#FFEFB2', color: '#013E37', fontSize: '10px' }}
              >
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List area */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* GROUPS TAB */}
        {tab === 'rooms' && (
          <div className="px-3 space-y-0.5 pb-2">
            {/* Header */}
            <div className="flex items-center justify-between px-2 py-2 mb-1">
              <span className="section-label">Groups</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { setShowJoin(!showJoin); setShowCreate(false); setJoinErr(''); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
                  style={{
                    background: 'rgba(96,212,200,0.1)',
                    color: '#60D4C8',
                    border: '1px solid rgba(96,212,200,0.2)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(96,212,200,0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(96,212,200,0.1)'}
                  title="Join group"
                >
                  <UserPlus size={13} />
                </button>
                <button
                  onClick={() => { setShowCreate(!showCreate); setShowJoin(false); setCreateErr(''); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
                  style={{
                    background: 'rgba(255,239,178,0.1)',
                    color: '#FFEFB2',
                    border: '1px solid rgba(255,239,178,0.15)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,239,178,0.18)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,239,178,0.1)'}
                  title="Create group"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* Join form */}
            {showJoin && (
              <div
                className="mx-1 mb-3 p-3.5 rounded-xl animate-scale-in"
                style={{
                  background: 'rgba(13,26,24,0.9)',
                  border: '1px solid rgba(96,212,200,0.2)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(96,212,200,0.1)' }}>
                      <Link size={11} style={{ color: '#60D4C8' }} />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: '#60D4C8' }}>Join a Group</span>
                  </div>
                  <button onClick={() => { setShowJoin(false); setJoinErr(''); }} style={{ color: '#7A9E99' }}>
                    <X size={13} />
                  </button>
                </div>
                {joinErr && <p className="text-xs mb-2 px-1" style={{ color: '#F87171' }}>{joinErr}</p>}
                <form onSubmit={handleJoin} className="space-y-2">
                  <input
                    value={joinCode}
                    onChange={(e) => { setJoinErr(''); setJoinCode(e.target.value); }}
                    placeholder="Paste invite link or code…"
                    autoFocus
                    className="nt-input text-xs"
                  />
                  <button
                    type="submit"
                    disabled={joining || !joinCode.trim()}
                    className="w-full text-xs py-2 rounded-xl font-semibold transition-all duration-200"
                    style={{
                      background: joining || !joinCode.trim() ? 'rgba(96,212,200,0.1)' : 'linear-gradient(135deg, #60D4C8, #4EBFB3)',
                      color: '#013E37',
                    }}
                  >
                    {joining ? 'Joining…' : 'Join Group'}
                  </button>
                </form>
              </div>
            )}

            {/* Create form */}
            {showCreate && (
              <div
                className="mx-1 mb-3 p-3.5 rounded-xl animate-scale-in"
                style={{
                  background: 'rgba(13,26,24,0.9)',
                  border: '1px solid rgba(255,239,178,0.12)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold" style={{ color: '#FFEFB2' }}>New Group</span>
                  <button onClick={() => { setShowCreate(false); setCreateErr(''); }} style={{ color: '#7A9E99' }}>
                    <X size={13} />
                  </button>
                </div>
                {createErr && <p className="text-xs text-nt-danger mb-2">{createErr}</p>}
                <form onSubmit={handleCreate} className="space-y-2">
                  <input value={roomName} onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Group name" required minLength={2} autoFocus
                    className="nt-input text-xs" />
                  <input value={roomDesc} onChange={(e) => setRoomDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className="nt-input text-xs" />
                  <button type="submit" disabled={creating || !roomName.trim()} className="btn-primary w-full text-xs py-2">
                    {creating ? 'Creating…' : 'Create Group'}
                  </button>
                </form>
              </div>
            )}

            {/* Groups list */}
            {roomsLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 mx-1 mb-1">
                  <div className="w-9 h-9 rounded-xl skeleton flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-24 rounded skeleton" />
                    <div className="h-2.5 w-32 rounded skeleton" />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(255,239,178,0.05)', border: '1px solid rgba(255,239,178,0.08)' }}
                >
                  <Users size={22} style={{ color: 'rgba(122,158,153,0.4)' }} />
                </div>
                <p className="text-xs font-medium" style={{ color: '#7A9E99' }}>
                  {search ? 'No groups match your search' : 'No groups yet'}
                </p>
                {!search && (
                  <p className="text-xs mt-1" style={{ color: 'rgba(122,158,153,0.4)' }}>
                    Create one or paste an invite link
                  </p>
                )}
              </div>
            ) : (
              filtered.map((room) => {
                const isActive = activeRoom?._id === room._id;
                return (
                  <button
                    key={room._id}
                    onClick={() => onSelectRoom(room)}
                    className={`sidebar-item ${isActive ? 'active' : ''} w-full`}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                      style={{
                        background: isActive
                          ? 'linear-gradient(135deg, rgba(255,239,178,0.2), rgba(255,239,178,0.1))'
                          : 'rgba(255,239,178,0.06)',
                        color: isActive ? '#FFEFB2' : '#7A9E99',
                        border: `1px solid ${isActive ? 'rgba(255,239,178,0.25)' : 'rgba(255,239,178,0.08)'}`,
                      }}
                    >
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
                    {room.members?.length > 0 && (
                      <span className="text-xs flex-shrink-0 font-mono" style={{ color: 'rgba(122,158,153,0.5)' }}>
                        {room.members.length}
                      </span>
                    )}
                  </button>
                );
              })
            )}

            {/* Mood when in group */}
            {activeRoom && (
              <div className="mt-3 pt-3 mx-1" style={{ borderTop: '1px solid rgba(255,239,178,0.06)' }}>
                <MoodIndicator compact={false} />
              </div>
            )}

            {/* Online members */}
            {activeRoom && onlineUsers.length > 0 && (
              <div className="mt-2 pt-2 mx-1" style={{ borderTop: '1px solid rgba(255,239,178,0.06)' }}>
                <div className="flex items-center gap-2 px-2 py-1.5 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#4ADE80', boxShadow: '0 0 4px rgba(74,222,128,0.6)' }} />
                  <span className="section-label">Online — {onlineUsers.length}</span>
                </div>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {onlineUsers.map((u) => (
                    <div key={u.userId} className="flex items-center gap-2.5 px-2 py-1">
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-bold"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255,239,178,0.15), rgba(255,239,178,0.08))',
                            borderColor: 'rgba(255,239,178,0.12)',
                            color: '#FFEFB2',
                          }}
                        >
                          {u.username?.[0]?.toUpperCase()}
                        </div>
                        <div
                          className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border"
                          style={{ background: '#4ADE80', borderColor: '#080E0D' }}
                        />
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

      {/* User footer */}
      <div className="border-t p-3" style={{ borderColor: 'rgba(255,239,178,0.06)' }}>
        <button
          onClick={onEditProfile}
          className="w-full flex items-center gap-3 p-2.5 rounded-xl group transition-all duration-200"
          style={{ background: 'rgba(255,239,178,0.04)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,239,178,0.07)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,239,178,0.04)'}
        >
          <div className="relative flex-shrink-0">
            <div
              className="w-9 h-9 rounded-xl overflow-hidden border flex items-center justify-center text-sm font-bold"
              style={{
                background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)',
                borderColor: 'rgba(255,239,178,0.25)',
                color: '#013E37',
                boxShadow: '0 0 15px rgba(255,239,178,0.1)',
              }}
            >
              {hasImg
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : user?.username?.[0]?.toUpperCase() || 'U'
              }
            </div>
            <div
              className={`absolute -bottom-0.5 -right-0.5 ${isConnected ? 'status-online' : 'status-offline'}`}
            />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold truncate" style={{ color: '#FFEFB2' }}>{user?.username}</p>
            {user?.nexTalkNumber && (
              <p className="text-xs font-mono truncate flex items-center gap-1" style={{ color: '#7A9E99' }}>
                <Hash size={9} style={{ color: '#60D4C8' }} />
                {user.nexTalkNumber.replace(/^(\+100)(\d{7})$/, '+100 $2')}
              </p>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <div
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: '#7A9E99' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FFEFB2'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#7A9E99'}
            >
              <Edit2 size={13} />
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); logout(); }}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: '#7A9E99' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#7A9E99'; e.currentTarget.style.background = 'transparent'; }}
              title="Sign out"
            >
              <LogOut size={13} />
            </button>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
