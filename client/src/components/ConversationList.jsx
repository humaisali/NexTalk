import { MessageCircle } from 'lucide-react';

const ConversationList = ({ conversations = [], loading, activeConvId, currentUserId, onSelect }) => {
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
            <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-3 w-32 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <MessageCircle size={24} className="mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-500 font-medium">No messages yet</p>
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

        return (
          <button key={conv._id} onClick={() => onSelect(conv)}
            className={`chat-list-item ${isActive ? 'active bg-white shadow-sm' : ''}`}>
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg">
                {hasImgOther
                  ? <img src={other.avatar} alt="" className="w-full h-full object-cover" />
                  : other?.username?.[0]?.toUpperCase() || '?'}
              </div>
              {other?.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-baseline justify-between mb-0.5">
                <span className={`text-sm truncate ${isActive ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                  {other?.username || 'Unknown'}
                </span>
                {lastTime && (
                  <span className={`text-xs flex-shrink-0 ml-2 ${unread > 0 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                    {formatTime(lastTime)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className={`text-xs truncate ${unread > 0 ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                  {lastContent || <span className="italic opacity-60">No messages yet</span>}
                </p>
                {unread > 0 && (
                  <span className="ml-2 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
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
