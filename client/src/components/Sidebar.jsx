import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Hash,
  Link2,
  LogOut,
  MessageSquare,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import BrandMark from './BrandMark';
import ConversationList from './ConversationList';

const filters = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'dms', label: 'Direct' },
  { id: 'rooms', label: 'Groups' },
];

const getUnreadCount = (conversation, userId) => (
  conversation.unreadCount?.get?.(userId?.toString())
  || conversation.unreadCount?.[userId?.toString()]
  || 0
);

const GroupDialog = ({ mode, onClose, onCreateRoom, onJoinRoom }) => {
  const firstInputRef = useRef(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [invite, setInvite] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isCreate = mode === 'create';

  useEffect(() => {
    firstInputRef.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isCreate) await onCreateRoom(name, description);
      else await onJoinRoom(invite);
      onClose();
    } catch (submitError) {
      setError(submitError?.response?.data?.message || submitError?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="group-dialog-title" className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand)]">Groups</p>
            <h2 id="group-dialog-title" className="text-xl font-bold text-[var(--text-primary)]">
              {isCreate ? 'Create a group' : 'Join a group'}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {isCreate ? 'Bring a team or community into one shared conversation.' : 'Paste an invite link or enter its code.'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Close dialog">
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isCreate ? (
            <>
              <div>
                <label htmlFor="group-name" className="mb-1.5 block text-sm font-semibold text-[var(--text-primary)]">Group name</label>
                <input ref={firstInputRef} id="group-name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} required className="auth-input" placeholder="Design crew" />
              </div>
              <div>
                <label htmlFor="group-description" className="mb-1.5 block text-sm font-semibold text-[var(--text-primary)]">Description <span className="font-normal text-[var(--text-muted)]">(optional)</span></label>
                <textarea id="group-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="auth-input resize-none" placeholder="What will this group discuss?" />
              </div>
            </>
          ) : (
            <div>
              <label htmlFor="group-invite" className="mb-1.5 block text-sm font-semibold text-[var(--text-primary)]">Invite link or code</label>
              <div className="relative">
                <Link2 size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input ref={firstInputRef} id="group-invite" value={invite} onChange={(event) => setInvite(event.target.value)} required className="auth-input pl-11" placeholder="Paste invite link" />
              </div>
            </div>
          )}

          {error && <p role="alert" className="auth-error">{error}</p>}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Working…' : isCreate ? 'Create group' : 'Join group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Sidebar = ({
  rooms = [],
  roomsLoading,
  onSelectRoom,
  onCreateRoom,
  onJoinRoom,
  conversations = [],
  convLoading,
  activeConvId,
  totalUnreadDMs,
  onSelectConv,
  onNewChat,
  onEditProfile,
  className = '',
}) => {
  const { user, logout } = useAuth();
  const { activeRoom } = useSocket();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [groupDialog, setGroupDialog] = useState(null);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredConversations = useMemo(() => conversations.filter((conversation) => {
    const other = conversation.participants?.find((participant) => participant._id?.toString() !== user?._id?.toString());
    const matchesSearch = !normalizedSearch
      || other?.username?.toLowerCase().includes(normalizedSearch)
      || conversation.lastMessage?.content?.toLowerCase().includes(normalizedSearch);
    const matchesUnread = filter !== 'unread' || getUnreadCount(conversation, user?._id) > 0;
    return matchesSearch && matchesUnread;
  }), [conversations, filter, normalizedSearch, user?._id]);

  const filteredRooms = useMemo(() => rooms.filter((room) => (
    !normalizedSearch
    || room.name?.toLowerCase().includes(normalizedSearch)
    || room.description?.toLowerCase().includes(normalizedSearch)
  )), [normalizedSearch, rooms]);

  const showDirect = filter === 'all' || filter === 'dms' || filter === 'unread';
  const showGroups = filter === 'all' || filter === 'rooms';
  const displayDirectHeading = showDirect && showGroups;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const openNewAction = (action) => {
    setNewMenuOpen(false);
    if (action === 'direct') onNewChat();
    else setGroupDialog(action);
  };

  return (
    <aside aria-label="Conversation navigation" className={`w-full flex-shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] md:w-[320px] ${className}`}>
      <div className="border-b border-[var(--border)] px-4 pb-4 pt-5">
        <div className="mb-5 flex items-center justify-between gap-3 px-1">
          <BrandMark />
          <div className="relative">
            <button type="button" onClick={() => setNewMenuOpen((open) => !open)} className="btn-primary min-h-10 px-3.5 py-2 text-sm" aria-haspopup="menu" aria-expanded={newMenuOpen}>
              <Plus size={17} aria-hidden="true" />
              New
            </button>
            {newMenuOpen && (
              <div role="menu" className="absolute right-0 top-12 z-30 w-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-xl">
                <button role="menuitem" type="button" onClick={() => openNewAction('direct')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]">
                  <MessageSquare size={17} /> Direct message
                </button>
                <button role="menuitem" type="button" onClick={() => openNewAction('create')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]">
                  <Users size={17} /> Create group
                </button>
                <button role="menuitem" type="button" onClick={() => openNewAction('join')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]">
                  <Link2 size={17} /> Join group
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search conversations" placeholder="Search conversations" className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] pl-10 pr-10 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--focus-ring)]" />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-muted)]" aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="mt-3 flex gap-1 overflow-x-auto" aria-label="Conversation filters">
          {filters.map((item) => (
            <button key={item.id} type="button" onClick={() => setFilter(item.id)} aria-pressed={filter === item.id} className={`min-h-9 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition ${filter === item.id ? 'bg-[var(--brand-soft)] text-[var(--brand)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]'}`}>
              {item.label}
              {item.id === 'unread' && totalUnreadDMs > 0 && <span className="ml-1">{totalUnreadDMs}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {showDirect && (
          <section aria-labelledby={displayDirectHeading ? 'direct-heading' : undefined}>
            {displayDirectHeading && <h2 id="direct-heading" className="px-2 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Direct messages</h2>}
            <ConversationList conversations={filteredConversations} loading={convLoading} activeConvId={activeConvId} currentUserId={user?._id} onSelect={onSelectConv} emptyMessage={filter === 'unread' ? 'You’re all caught up' : normalizedSearch ? 'No direct messages found' : 'No direct messages yet'} />
          </section>
        )}

        {showGroups && (
          <section aria-labelledby={displayDirectHeading ? 'groups-heading' : undefined} className={showDirect ? 'mt-4' : ''}>
            {displayDirectHeading && <h2 id="groups-heading" className="px-2 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Groups</h2>}
            {roomsLoading ? (
              <div aria-label="Loading groups" className="space-y-2">
                {[...Array(3)].map((_, index) => <div key={index} className="h-[68px] animate-pulse rounded-xl bg-[var(--surface-muted)]" />)}
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="rounded-xl px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                <Users size={24} className="mx-auto mb-2 opacity-50" />
                {normalizedSearch ? 'No groups found' : 'No groups yet'}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredRooms.map((room) => {
                  const isActive = activeRoom?._id === room._id;
                  const hasAvatar = room.avatar?.startsWith('data:') || room.avatar?.startsWith('http');
                  return (
                    <button key={room._id} type="button" onClick={() => onSelectRoom(room)} aria-current={isActive ? 'page' : undefined} className={`chat-list-item ${isActive ? 'active' : ''}`}>
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--surface-muted)] font-bold text-[var(--text-secondary)]">
                        {hasAvatar ? <img src={room.avatar} alt="" className="h-full w-full object-cover" /> : <Hash size={19} aria-hidden="true" />}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{room.name}</p>
                        <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{room.description || 'Group conversation'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-[var(--border)] p-3">
        <button type="button" onClick={onEditProfile} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-2 text-left hover:bg-[var(--surface-muted)]" aria-label="Edit profile">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--brand-soft)] text-sm font-bold text-[var(--brand)]">
            {user?.avatar?.startsWith?.('data:') || user?.avatar?.startsWith?.('http') ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : user?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{user?.username || 'Profile'}</p>
            <p className="truncate text-xs text-[var(--text-muted)]">{user?.statusText || 'Available'}</p>
          </div>
          <Settings size={16} className="ml-auto flex-shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
        </button>
        <button type="button" onClick={toggleTheme} className="icon-button" aria-label={isDark ? 'Use light theme' : 'Use dark theme'}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button type="button" onClick={handleLogout} className="icon-button hover:text-rose-600 dark:hover:text-rose-400" aria-label="Sign out">
          <LogOut size={18} />
        </button>
      </div>

      {groupDialog && <GroupDialog mode={groupDialog} onClose={() => setGroupDialog(null)} onCreateRoom={onCreateRoom} onJoinRoom={onJoinRoom} />}
    </aside>
  );
};

export default Sidebar;
