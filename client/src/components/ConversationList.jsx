import { MessageCircle, Plus } from 'lucide-react';

const ConversationList = ({ conversations = [], loading, activeConvId, currentUserId, onSelect, onNewChat }) => {
  const getOther = (conv) =>
    conv.participants?.find((p) => p._id?.toString() !== currentUserId?.toString());

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date), now = new Date();
    const diffH = (now - d) / (1000 * 60 * 60);
    if (diffH < 24) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between flex-shrink-0">
        <span className="section-label">Direct Messages</span>
        <button onClick={onNewChat}
          className="w-6 h-6 rounded-md flex items-center justify-center transition-all"
          style={{ background: 'rgba(255,239,178,0.1)', color: '#FFEFB2' }}
          title="New message"
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {loading ? (
          [...Array(3)].map((_,i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <div className="w-9 h-9 rounded-full animate-pulse flex-shrink-0" style={{ background: '#013E37' }} />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded animate-pulse" style={{ background: '#013E37' }} />
                <div className="h-2.5 w-36 rounded animate-pulse" style={{ background: '#013E37' }} />
              </div>
            </div>
          ))
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl border flex items-center justify-center"
                 style={{ background: 'rgba(255,239,178,0.06)', borderColor: '#025A50' }}>
              <MessageCircle size={20} style={{ color: '#7A9E99' }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: '#7A9E99' }}>No conversations yet</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(122,158,153,0.5)' }}>Click + to start a new chat</p>
            </div>
          </div>
        ) : (
          conversations.map((conv) => {
            const other    = getOther(conv);
            const isActive = activeConvId === conv._id?.toString();
            const lastContent = conv.lastMessage?.content || '';
            const lastTime    = conv.lastMessage?.createdAt;
            const unread = conv.unreadCount?.get?.(currentUserId?.toString()) ||
                           conv.unreadCount?.[currentUserId?.toString()] || 0;
            const hasImgOther = other?.avatar?.startsWith?.('data:') || other?.avatar?.startsWith?.('http');

            return (
              <button key={conv._id} onClick={() => onSelect(conv)}
                className={`sidebar-item w-full ${isActive ? 'active' : ''}`}>
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-full overflow-hidden border flex items-center justify-center text-sm font-bold"
                       style={{ background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)', borderColor: '#025A50', color: '#013E37' }}>
                    {hasImgOther
                      ? <img src={other.avatar} alt="" className="w-full h-full object-cover" />
                      : other?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  {other?.isOnline && <div className="status-online absolute -bottom-0.5 -right-0.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold truncate" style={{ color: isActive ? '#FFEFB2' : '#D4C98A' }}>
                      {other?.username || 'Unknown'}
                    </span>
                    {lastTime && (
                      <span className="text-xs flex-shrink-0 ml-1" style={{ color: '#7A9E99' }}>
                        {formatTime(lastTime)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs truncate" style={{ color: unread > 0 ? '#D4C98A' : '#7A9E99', fontWeight: unread > 0 ? 500 : 400 }}>
                      {lastContent || <span className="italic" style={{ opacity: 0.6 }}>No messages yet</span>}
                    </p>
                    {unread > 0 && (
                      <span className="flex-shrink-0 ml-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-xs font-bold px-1"
                            style={{ background: '#FFEFB2', color: '#013E37' }}>
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
