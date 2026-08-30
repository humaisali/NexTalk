import { X, Users, Clock, Lock, Globe } from 'lucide-react';

const RoomInfoPanel = ({ room, conversation, onClose, currentUserId }) => {
  const other = conversation?.participants?.find(
    (p) => p._id?.toString() !== currentUserId
  );

  const isRoom = !!room;

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const statusMap = {
    active: { label: 'Active', color: 'bg-green-500', text: 'text-green-600 dark:text-green-400' },
    away: { label: 'Away', color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
    busy: { label: 'Busy', color: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
    dnd: { label: 'Do Not Disturb', color: 'bg-gray-500', text: 'text-gray-500 dark:text-gray-400' },
  };

  return (
    <aside aria-label={isRoom ? 'Group details' : 'Conversation details'} className="flex h-full w-full flex-shrink-0 flex-col overflow-hidden border-l border-[var(--border)] bg-[var(--surface)]">

      {/* Header */}
      <div className="flex min-h-16 flex-shrink-0 items-center justify-between border-b border-[var(--border)] px-5">
        <h2 className="text-sm font-bold text-[var(--text-primary)]">
          {isRoom ? 'Group details' : 'Conversation details'}
        </h2>
        <button type="button" onClick={onClose} className="icon-button" aria-label="Close details">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* Avatar / icon block */}
        <div className="flex flex-col items-center gap-3 px-5 py-6 border-b border-gray-100 dark:border-nt-border">
          {isRoom ? (
            <>
              {/* Group avatar */}
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-blue-50 dark:bg-nt-bg3 text-blue-500 dark:text-[#60D4C8] border border-blue-100 dark:border-nt-border flex items-center justify-center text-3xl font-black shadow-sm">
                {room.avatar?.startsWith('data:') || room.avatar?.startsWith('http')
                  ? <img src={room.avatar} alt="avatar" className="w-full h-full object-cover" />
                  : room.name?.[0]?.toUpperCase() || '#'
                }
              </div>
              <div className="text-center">
                <h4 className="font-bold text-lg text-gray-800 dark:text-nt-text">{room.name}</h4>
                {room.description && (
                  <p className="text-sm mt-1 leading-relaxed text-gray-500 dark:text-nt-muted">{room.description}</p>
                )}
              </div>
            </>
          ) : other ? (
            <>
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-nt-bg3 text-gray-600 dark:text-nt-text border border-gray-100 dark:border-nt-border flex items-center justify-center text-2xl font-black shadow-sm">
                  {other.avatar?.startsWith?.('data:') || other.avatar?.startsWith?.('http')
                    ? <img src={other.avatar} alt="" className="w-full h-full object-cover" />
                    : other.username?.[0]?.toUpperCase() || '?'
                  }
                </div>
                {other.isOnline && (
                  <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-nt-bg1 ${statusMap[other.statusType || 'active']?.color || 'bg-green-500'}`} />
                )}
              </div>
              <div className="text-center">
                <h4 className="font-bold text-lg text-gray-800 dark:text-nt-text">{other.username}</h4>
                <p className={`text-sm mt-0.5 font-medium ${other.isOnline ? 'text-green-500' : 'text-gray-400 dark:text-nt-muted'}`}>
                  {other.isOnline ? (statusMap[other.statusType || 'active']?.label || 'Online') : 'Offline'}
                </p>
                {other.nexTalkNumber && (
                  <p className="text-sm font-mono mt-1 text-gray-500 dark:text-nt-muted bg-gray-50 dark:bg-nt-bg2/40 px-2 py-0.5 rounded-lg border border-gray-100 dark:border-nt-border inline-block">
                    {other.nexTalkNumber.replace(/^(\+100)(\d{7})$/, '+100 $2')}
                  </p>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Stats row */}
        {isRoom && (
          <div className="grid grid-cols-2 gap-px border-b border-gray-100 dark:border-nt-border bg-gray-50 dark:bg-nt-bg2/40">
            {[
              { label: 'Members', value: room.members?.length || 0, icon: Users  },
              { label: 'Online',  value: room.members?.filter(m => m.isOnline).length || 0, icon: Globe  },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-1 py-4 bg-white dark:bg-nt-bg1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-nt-bg3 text-blue-500 dark:text-[#60D4C8] mb-1">
                  <Icon size={16} />
                </div>
                <span className="text-lg font-bold text-gray-800 dark:text-nt-text">{value}</span>
                <span className="text-xs font-medium text-gray-500 dark:text-nt-muted">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Group details */}
        {isRoom && (
          <>
            <div className="px-5 py-5 space-y-4 border-b border-gray-100 dark:border-nt-border">
              <p className="text-xs font-bold text-gray-400 dark:text-nt-muted uppercase tracking-wider">Group Details</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-nt-muted">
                    <Lock size={14} />
                    <span className="text-sm">Privacy</span>
                  </div>
                  <span className="text-sm font-medium text-gray-800 dark:text-nt-text bg-gray-50 dark:bg-nt-bg2/40 px-2.5 py-0.5 rounded-md border border-gray-100 dark:border-nt-border">
                    {room.isPrivate !== false ? 'Invite only' : 'Public'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-nt-muted">
                    <Clock size={14} />
                    <span className="text-sm">Created</span>
                  </div>
                  <span className="text-sm font-medium text-gray-800 dark:text-nt-text">
                    {formatDate(room.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Members List with presence status and texts */}
            <div className="px-5 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-400 dark:text-nt-muted uppercase tracking-wider">Group Members</p>
                <span className="text-[10px] font-bold bg-blue-50 dark:bg-nt-bg3 text-blue-600 dark:text-[#60D4C8] px-2 py-0.5 rounded-full">
                  {room.members?.length || 0}
                </span>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {room.members?.map((member) => {
                  const isOnline = member.isOnline;
                  const statusInfo = statusMap[member.statusType || 'active'] || statusMap.active;
                  return (
                    <div key={member._id} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-nt-bg3 border border-white dark:border-nt-border flex items-center justify-center text-xs font-bold text-gray-600 dark:text-nt-text overflow-hidden shadow-sm">
                          {member.avatar?.startsWith('http') || member.avatar?.startsWith('data:') 
                            ? <img src={member.avatar} alt="" className="w-full h-full object-cover" /> 
                            : member.username?.[0]?.toUpperCase()}
                        </div>
                        {isOnline && (
                          <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white dark:border-nt-bg1 ${statusInfo.color}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 justify-between">
                          <span className="text-sm font-medium text-gray-800 dark:text-nt-text truncate">{member.username}</span>
                          {room.admins?.some((adm) => (adm._id?.toString() || adm.toString()) === member._id?.toString()) && (
                            <span className="text-[9px] font-semibold text-blue-500 dark:text-[#60D4C8] bg-blue-50 dark:bg-nt-bg3 px-1 rounded">Admin</span>
                          )}
                        </div>
                        {member.statusText && (
                          <p className="text-[11px] text-gray-400 dark:text-nt-muted truncate">{member.statusText}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {(!room.members || room.members.length === 0) && (
                  <p className="text-sm text-gray-400 italic">No members in this group.</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* DM info with bios, statuses, and custom pills */}
        {!isRoom && other && (
          <div className="px-5 py-5 space-y-5">
            {/* Status Type & Status Message */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 dark:text-nt-muted uppercase tracking-wider">Status</p>
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-gray-50 dark:bg-nt-bg2/40 border border-gray-100 dark:border-nt-border/40">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusMap[other.statusType || 'active']?.color || 'bg-green-500'}`} />
                  <span className="text-xs font-semibold text-gray-700 dark:text-nt-text">
                    {statusMap[other.statusType || 'active']?.label || 'Active'}
                  </span>
                  {!other.isOnline && (
                    <span className="text-[10px] text-gray-400 dark:text-nt-muted font-normal">(Offline)</span>
                  )}
                </div>
                {other.statusText ? (
                  <p className="text-sm italic text-gray-600 dark:text-nt-text/80 font-medium">
                    "{other.statusText}"
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-nt-muted italic">No status message set</p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 dark:text-nt-muted uppercase tracking-wider">Bio</p>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-nt-bg2/40 border border-gray-100 dark:border-nt-border/40">
                <p className="text-sm text-gray-600 dark:text-nt-text/80 leading-relaxed whitespace-pre-wrap">
                  {other.bio || "Hey there! I am using NexTalk."}
                </p>
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-2.5 pt-1">
              <p className="text-xs font-bold text-gray-400 dark:text-nt-muted uppercase tracking-wider">Details</p>
              <div className="space-y-2">
                {other.nexTalkNumber && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-nt-muted">NexTalk #</span>
                    <span className="font-mono font-medium text-gray-800 dark:text-nt-text">
                      {other.nexTalkNumber.replace(/^(\+100)(\d{7})$/, '+100 $2')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-[#60D4C8]/5 border border-blue-100/50 dark:border-[#60D4C8]/10 text-xs leading-relaxed text-blue-800 dark:text-nt-text/90 shadow-sm">
              This is a private conversation. Only you and <strong>{other.username}</strong> can see these messages.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default RoomInfoPanel;
