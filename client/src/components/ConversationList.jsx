import { MessageCircle } from 'lucide-react';

const ConversationList = ({ conversations = [], loading, activeConvId, currentUserId, onSelect, emptyMessage = 'No direct messages yet' }) => {
  const getOther = (conv) =>
    conv.participants?.find((p) => p._id?.toString() !== currentUserId?.toString());

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date), now = new Date();
    const diffH = (now - d) / (1000 * 60 * 60);
    if (diffH < 24) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-nt-bg3 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-gray-200 dark:bg-nt-bg3 rounded" />
              <div className="h-3 w-32 bg-gray-200 dark:bg-nt-bg3 rounded" />
            </div>
          </div>
        ))}
      </>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="rounded-xl px-4 py-8 text-center text-[var(--text-muted)]">
        <MessageCircle size={24} className="mx-auto mb-2 opacity-50" aria-hidden="true" />
        <p className="text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {conversations.map((conv) => {
        const other    = getOther(conv);
        const isActive = activeConvId === conv._id?.toString();
        const lastContent = conv.lastMessage?.content || '';
        const lastTime    = conv.lastMessage?.createdAt;
        const unread = conv.unreadCount?.get?.(currentUserId?.toString()) ||
                       conv.unreadCount?.[currentUserId?.toString()] || 0;
        const hasImgOther = other?.avatar?.startsWith?.('data:') || other?.avatar?.startsWith?.('http');

        const statusColors = {
          active: 'bg-green-500',
          away: 'bg-amber-500',
          busy: 'bg-rose-500',
          dnd: 'bg-purple-500'
        };
        const statusColor = statusColors[other?.statusType || 'active'] || 'bg-green-500';

        return (
          <button key={conv._id} type="button" onClick={() => onSelect(conv)} aria-current={isActive ? 'page' : undefined}
            className={`chat-list-item ${isActive ? 'active' : ''}`}>
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-muted)] text-base font-bold text-[var(--text-secondary)]">
                {hasImgOther
                  ? <img src={other.avatar} alt="" className="h-full w-full object-cover" />
                  : other?.username?.[0]?.toUpperCase() || '?'}
              </div>
              {other?.isOnline && (
                <>
                  <span className="sr-only">{other?.statusType || 'Online'}</span>
                  <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--surface)] ${statusColor}`} aria-hidden="true" />
                </>
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-baseline justify-between mb-0.5">
                <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {other?.username || 'Unknown'}
                </span>
                {lastTime && (
                  <span className={`ml-2 flex-shrink-0 text-xs ${unread > 0 ? 'font-bold text-[var(--brand)]' : 'text-[var(--text-muted)]'}`}>
                    {formatTime(lastTime)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className={`truncate text-xs ${unread > 0 ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                  {lastContent || <span className="italic opacity-60">No messages yet</span>}
                </p>
                {unread > 0 && (
                  <span aria-label={`${unread} unread messages`} className="ml-2 min-w-5 flex-shrink-0 rounded-full bg-[var(--brand)] px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </>
  );
};

export default ConversationList;
