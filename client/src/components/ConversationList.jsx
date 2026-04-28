import { FiMessageCircle, FiPlus, FiCircle } from 'react-icons/fi';

/**
 * ConversationList — renders the list of private conversations
 * in the DM tab of the Sidebar.
 *
 * Props:
 *   conversations    — array from useConversations
 *   loading          — boolean
 *   activeConvId     — currently open conversation _id
 *   currentUserId    — logged-in user's _id
 *   onSelect         — fn(conversation)
 *   onNewChat        — fn() opens StartConversation modal
 */
const ConversationList = ({
  conversations = [],
  loading,
  activeConvId,
  currentUserId,
  onSelect,
  onNewChat
}) => {

  // Helper: get the OTHER participant (not current user)
  const getOther = (conv) =>
    conv.participants?.find((p) => p._id?.toString() !== currentUserId?.toString());

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffH = (now - d) / (1000 * 60 * 60);
    if (diffH < 24) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Section header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-semibold text-nt-muted uppercase tracking-widest">Direct Messages</span>
        <button
          onClick={onNewChat}
          className="w-6 h-6 rounded-md flex items-center justify-center text-nt-muted hover:text-nt-blue hover:bg-nt-blue/10 transition-all"
          title="New message"
        >
          <FiPlus size={14} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {loading ? (
          <div className="flex flex-col gap-2 px-2 py-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="w-9 h-9 rounded-full bg-nt-surface2 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 rounded bg-nt-surface2 animate-pulse" />
                  <div className="h-2.5 w-36 rounded bg-nt-surface2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-nt-surface2 border border-nt-border flex items-center justify-center">
              <FiMessageCircle size={20} className="text-nt-muted" />
            </div>
            <div>
              <p className="text-nt-muted text-xs font-medium">No conversations yet</p>
              <p className="text-nt-muted/60 text-xs mt-0.5">Click + to start a new chat</p>
            </div>
          </div>
        ) : (
          conversations.map((conv) => {
            const other       = getOther(conv);
            const isActive    = activeConvId === conv._id?.toString();
            const lastContent = conv.lastMessage?.content || '';
            const lastTime    = conv.lastMessage?.createdAt;
            const unread      = conv.unreadCount?.get?.(currentUserId?.toString()) ||
                                conv.unreadCount?.[currentUserId?.toString()] || 0;

            return (
              <button
                key={conv._id}
                onClick={() => onSelect(conv)}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all group
                  ${isActive
                    ? 'bg-nt-blue/15 border border-nt-blue/25'
                    : 'hover:bg-nt-surface2 border border-transparent'
                  }`}
              >
                {/* Avatar + online dot */}
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-nt-surface border border-nt-border flex items-center justify-center text-sm font-bold text-nt-text">
                    {other?.avatar || other?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  {other?.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-nt-success rounded-full border-2 border-nt-surface" />
                  )}
                </div>

                {/* Name + preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold truncate ${isActive ? 'text-nt-text' : 'text-nt-text/90 group-hover:text-nt-text'}`}>
                      {other?.username || 'Unknown'}
                    </span>
                    {lastTime && (
                      <span className="text-xs text-nt-muted flex-shrink-0 ml-1">
                        {formatTime(lastTime)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className={`text-xs truncate ${unread > 0 ? 'text-nt-text font-medium' : 'text-nt-muted'}`}>
                      {lastContent || (
                        <span className="text-nt-muted/60 italic">
                          +100 {other?.nexTalkNumber?.replace('+100', '') || ''}
                        </span>
                      )}
                    </p>
                    {unread > 0 && (
                      <span className="flex-shrink-0 ml-1 min-w-[18px] h-[18px] rounded-full bg-nt-blue flex items-center justify-center text-white text-xs font-bold px-1">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;
