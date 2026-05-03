import { useState, useEffect } from 'react';
import useRoomSettings from '../hooks/useRoomSettings';
import { useAuth }     from '../context/AuthContext';
import { useToast }    from '../context/ToastContext';
import { X, Link, RefreshCw, Copy, Settings, Users, LogOut, Trash2, Check, Lock, Unlock, Save, Shield } from 'lucide-react';

const QRCode = ({ value, size = 160 }) => {
  const encoded = encodeURIComponent(value);
  const src     = `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encoded}&choe=UTF-8&chld=M|2`;
  return (
    <div className="p-3 rounded-nt border" style={{ background: '#FFEFB2', borderColor: '#025A50', display: 'inline-block' }}>
      <img src={src} alt="QR Code" width={size} height={size} className="block" />
    </div>
  );
};

const RoomSettings = ({ room, onClose, onLeft, onUpdated }) => {
  const { user }  = useAuth();
  const toast     = useToast();
  const { roomDetails, inviteUrl, loading, saving, regenerating, loadRoom, saveRoom, regen, copyInvite, leave, kick } = useRoomSettings(toast);

  const [tab,      setTab]      = useState('invite');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriv, setEditPriv] = useState(true);
  const [copied,   setCopied]   = useState(false);

  useEffect(() => { if (room?._id) loadRoom(room._id); }, [room?._id]);
  useEffect(() => {
    if (roomDetails) {
      setEditName(roomDetails.name        || '');
      setEditDesc(roomDetails.description || '');
      setEditPriv(roomDetails.isPrivate   !== false);
    }
  }, [roomDetails]);

  const r             = roomDetails || room;
  const currentUserId = user?._id?.toString();
  const amAdmin       = r?.admins?.some?.((a) => (a._id || a).toString() === currentUserId) ||
                        r?.createdBy?._id?.toString() === currentUserId ||
                        r?.createdBy?.toString()       === currentUserId;

  const handleCopy = async () => {
    await copyInvite(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    const updated = await saveRoom(r._id, { name: editName, description: editDesc, isPrivate: editPriv });
    if (updated) onUpdated?.(updated);
  };

  const handleLeave = async () => {
    if (!window.confirm('Leave this group?')) return;
    const ok = await leave(r._id);
    if (ok) { onLeft?.(); onClose(); }
  };

  const handleRegen = async () => {
    if (!window.confirm('This will invalidate the current invite link. Continue?')) return;
    await regen(r._id);
  };

  const tabs = [
    { key: 'invite',  label: 'Invite',   icon: Link     },
    { key: 'members', label: 'Members',  icon: Users    },
    ...(amAdmin ? [{ key: 'settings', label: 'Settings', icon: Settings }] : [])
  ];

  const inputStyle = {
    borderBottom: '1.5px solid #025A50', background: 'transparent',
    color: '#FFEFB2', caretColor: '#FFEFB2',
    outline: 'none', width: '100%', fontSize: '14px', padding: '8px 0',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)' }}
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-nt-xl overflow-hidden shadow-nt-float border animate-slide-up"
           style={{ background: '#012B26', borderColor: '#025A50' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b"
             style={{ borderColor: '#025A50', background: '#013E37' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-base font-black"
                 style={{ background: 'rgba(255,239,178,0.1)', color: '#FFEFB2', border: '1px solid rgba(255,239,178,0.2)' }}>
              {r?.name?.[0]?.toUpperCase() || '#'}
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: '#FFEFB2' }}>{r?.name || 'Group Settings'}</h3>
              <p className="text-xs mt-0.5" style={{ color: '#7A9E99' }}>{r?.members?.length || 0} members</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: '#7A9E99' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#FFEFB2'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#7A9E99'}>
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: '#025A50' }}>
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-all
                ${tab === key ? 'border-primary text-primary' : 'border-transparent text-nt-muted hover:text-nt-text2'}`}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="px-6 py-10 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-t-primary rounded-full animate-spin"
                 style={{ borderColor: '#025A50', borderTopColor: '#FFEFB2' }} />
            <p className="text-sm" style={{ color: '#7A9E99' }}>Loading…</p>
          </div>
        )}

        {!loading && (
          <>
            {/* INVITE TAB */}
            {tab === 'invite' && (
              <div className="px-6 py-5 space-y-5">
                {inviteUrl && (
                  <div className="flex flex-col items-center gap-3">
                    <QRCode value={inviteUrl} size={160} />
                    <p className="text-xs text-center" style={{ color: '#7A9E99' }}>
                      Scan to join <strong style={{ color: '#FFEFB2' }}>{r?.name}</strong>
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: '#7A9E99' }}>Invite Link</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2.5 rounded-nt border text-xs font-mono truncate"
                         style={{ background: '#011F1B', borderColor: '#025A50', color: '#7A9E99' }}>
                      {inviteUrl || 'Generating…'}
                    </div>
                    <button onClick={handleCopy} disabled={!inviteUrl}
                      className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2.5 flex-shrink-0">
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                {amAdmin && (
                  <button onClick={handleRegen} disabled={regenerating}
                    className="w-full flex items-center justify-center gap-2 text-xs py-2.5 rounded-nt border transition-all"
                    style={{ borderColor: '#025A50', color: '#7A9E99' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FCD34D'; e.currentTarget.style.color = '#FCD34D'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#025A50'; e.currentTarget.style.color = '#7A9E99'; }}>
                    <RefreshCw size={12} className={regenerating ? 'animate-spin' : ''} />
                    {regenerating ? 'Regenerating…' : 'Regenerate Link (invalidates old one)'}
                  </button>
                )}
                <div className="p-3 rounded-nt border text-xs leading-relaxed"
                     style={{ background: 'rgba(255,239,178,0.04)', borderColor: '#025A50', color: '#7A9E99' }}>
                  Share this link or QR code with any NexTalk user to invite them to the group.
                </div>
              </div>
            )}

            {/* MEMBERS TAB */}
            {tab === 'members' && (
              <div className="px-4 py-4">
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {(r?.members || []).map((member) => {
                    const memberId  = member._id?.toString() || member.toString();
                    const isCreator = r?.createdBy?._id?.toString() === memberId || r?.createdBy?.toString() === memberId;
                    const isAdminM  = r?.admins?.some?.((a) => (a._id || a).toString() === memberId);
                    const isYou     = memberId === currentUserId;
                    const canKick   = amAdmin && !isCreator && !isYou;
                    const hasImg    = member.avatar?.startsWith?.('data:') || member.avatar?.startsWith?.('http');

                    return (
                      <div key={memberId}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-nt group transition-all"
                        style={{ background: 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,239,178,0.04)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 rounded-full overflow-hidden border flex items-center justify-center text-xs font-bold"
                               style={{ background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)', borderColor: '#025A50', color: '#013E37' }}>
                            {hasImg ? <img src={member.avatar} alt="" className="w-full h-full object-cover" /> : member.username?.[0]?.toUpperCase() || '?'}
                          </div>
                          {member.isOnline && <div className="status-online absolute -bottom-0.5 -right-0.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium truncate" style={{ color: '#FFEFB2' }}>
                              {member.username || memberId}
                            </span>
                            {isYou && <span className="text-xs" style={{ color: '#7A9E99' }}>(you)</span>}
                            {isCreator && (
                              <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold"
                                    style={{ background: 'rgba(252,211,77,0.12)', color: '#FCD34D', border: '1px solid rgba(252,211,77,0.25)' }}>
                                Admin
                              </span>
                            )}
                            {isAdminM && !isCreator && <Shield size={11} style={{ color: '#60D4C8' }} />}
                          </div>
                          <p className="text-xs" style={{ color: member.isOnline ? '#4ADE80' : '#7A9E99' }}>
                            {member.isOnline !== undefined ? (member.isOnline ? 'Online' : 'Offline') : ''}
                          </p>
                        </div>
                        {canKick && (
                          <button onClick={() => kick(r._id, memberId, member.username)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all"
                            style={{ color: '#7A9E99' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#7A9E99'; e.currentTarget.style.background = 'transparent'; }}
                            title="Remove from group">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {!(r?.createdBy?._id?.toString() === currentUserId || r?.createdBy?.toString() === currentUserId) && (
                  <button onClick={handleLeave}
                    className="btn-danger w-full mt-4 flex items-center justify-center gap-2 text-sm">
                    <LogOut size={14} />Leave Group
                  </button>
                )}
              </div>
            )}

            {/* SETTINGS TAB */}
            {tab === 'settings' && amAdmin && (
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-widest" style={{ color: '#7A9E99' }}>Group Name</label>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)}
                    placeholder="Group name" style={inputStyle}
                    onFocus={(e) => e.target.style.borderBottomColor = '#FFEFB2'}
                    onBlur={(e)  => e.target.style.borderBottomColor = '#025A50'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-widest" style={{ color: '#7A9E99' }}>Description</label>
                  <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="What is this group about?" rows={2}
                    className="resize-none"
                    style={{ ...inputStyle, resize: 'none' }}
                    onFocus={(e) => e.target.style.borderBottomColor = '#FFEFB2'}
                    onBlur={(e)  => e.target.style.borderBottomColor = '#025A50'}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-nt border"
                     style={{ background: 'rgba(255,239,178,0.04)', borderColor: '#025A50' }}>
                  <div className="flex items-center gap-2">
                    {editPriv ? <Lock size={14} style={{ color: '#60D4C8' }} /> : <Unlock size={14} style={{ color: '#7A9E99' }} />}
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#FFEFB2' }}>
                        {editPriv ? 'Invite only' : 'Open to anyone'}
                      </p>
                      <p className="text-xs" style={{ color: '#7A9E99' }}>
                        {editPriv ? 'Members need an invite link' : 'Anyone can join'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setEditPriv(!editPriv)}
                    className="w-10 h-6 rounded-full relative transition-colors"
                    style={{ background: editPriv ? '#FFEFB2' : '#025A50' }}>
                    <div className="w-4 h-4 rounded-full absolute top-1 transition-all"
                         style={{ background: editPriv ? '#013E37' : '#7A9E99', left: editPriv ? '1.25rem' : '0.25rem' }} />
                  </button>
                </div>
                <button onClick={handleSave} disabled={saving || !editName.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2">
                  {saving
                    ? <><div className="w-4 h-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />Saving…</>
                    : <><Save size={14} />Save Changes</>
                  }
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RoomSettings;
