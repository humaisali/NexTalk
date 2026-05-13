import { useState, useEffect, useRef } from 'react';
import useRoomSettings from '../hooks/useRoomSettings';
import { useAuth }     from '../context/AuthContext';
import { useToast }    from '../context/ToastContext';
import { X, Link, RefreshCw, Copy, Settings, Users, LogOut, Trash2, Check, Lock, Unlock, Save, Shield, Camera } from 'lucide-react';
import QRCode from 'react-qr-code';

const RoomSettings = ({ room, onClose, onLeft, onUpdated }) => {
  const { user }  = useAuth();
  const toast     = useToast();
  const { roomDetails, inviteUrl, loading, saving, regenerating, loadRoom, saveRoom, regen, copyInvite, leave, kick } = useRoomSettings(toast);

  const [tab,      setTab]      = useState('invite');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriv, setEditPriv] = useState(true);
  const [copied,   setCopied]   = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarChanged, setAvatarChanged] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { if (room?._id) loadRoom(room._id); }, [room?._id]);
  useEffect(() => {
    if (roomDetails) {
      setEditName(roomDetails.name        || '');
      setEditDesc(roomDetails.description || '');
      setEditPriv(roomDetails.isPrivate   !== false);
      setAvatarPreview(roomDetails.avatar || '');
    }
  }, [roomDetails]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file.'); return; }
    if (file.size > 512 * 1024) { toast.error('Image too large. Max 500KB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setAvatarPreview(ev.target.result); setAvatarChanged(true); };
    reader.readAsDataURL(file);
  };

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
    const payload = { name: editName, description: editDesc, isPrivate: editPriv };
    if (avatarChanged) payload.avatar = avatarPreview;
    const updated = await saveRoom(r._id, payload);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-100 animate-slide-up flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-lg font-bold shadow-sm">
              {r?.avatar?.startsWith('data:') || r?.avatar?.startsWith('http')
                ? <img src={r.avatar} alt="avatar" className="w-full h-full object-cover" />
                : r?.name?.[0]?.toUpperCase() || '#'
              }
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">{r?.name || 'Group Settings'}</h3>
              <p className="text-xs mt-0.5 text-gray-500 font-medium">{r?.members?.length || 0} members</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-200">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-white flex-shrink-0">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-semibold border-b-2 transition-all
                ${tab === key ? 'border-blue-500 text-blue-600 bg-blue-50/30' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              <Icon size={16} />{label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-sm font-medium">Loading…</p>
            </div>
          ) : (
            <>
              {/* INVITE TAB */}
              {tab === 'invite' && (
                <div className="px-6 py-6 space-y-6">
                  {inviteUrl && (
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm inline-block">
                        <QRCode value={inviteUrl} size={160} fgColor="#1f2937" />
                      </div>
                      <p className="text-sm text-center text-gray-500">
                        Scan to join <strong className="text-gray-800">{r?.name}</strong>
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Invite Link</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-mono text-gray-600 truncate shadow-inner">
                        {inviteUrl || 'Generating…'}
                      </div>
                      <button onClick={handleCopy} disabled={!inviteUrl}
                        className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm disabled:opacity-50 flex-shrink-0">
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  {amAdmin && (
                    <button onClick={handleRegen} disabled={regenerating}
                      className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all">
                      <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
                      {regenerating ? 'Regenerating…' : 'Regenerate Link (invalidates old one)'}
                    </button>
                  )}
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm leading-relaxed text-blue-800 shadow-sm text-center">
                    Share this link or QR code with any NexTalk user to invite them to the group.
                  </div>
                </div>
              )}

              {/* MEMBERS TAB */}
              {tab === 'members' && (
                <div className="p-4 flex flex-col h-full">
                  <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                    {(r?.members || []).map((member) => {
                      const memberId  = member._id?.toString() || member.toString();
                      const isCreator = r?.createdBy?._id?.toString() === memberId || r?.createdBy?.toString() === memberId;
                      const isAdminM  = r?.admins?.some?.((a) => (a._id || a).toString() === memberId);
                      const isYou     = memberId === currentUserId;
                      const canKick   = amAdmin && !isCreator && !isYou;
                      const hasImg    = member.avatar?.startsWith?.('data:') || member.avatar?.startsWith?.('http');

                      return (
                        <div key={memberId}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100">
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 text-gray-600 border border-gray-100 flex items-center justify-center text-sm font-bold shadow-sm">
                              {hasImg ? <img src={member.avatar} alt="" className="w-full h-full object-cover" /> : member.username?.[0]?.toUpperCase() || '?'}
                            </div>
                            {member.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-800 truncate">
                                {member.username || memberId}
                              </span>
                              {isYou && <span className="text-xs text-gray-400 font-medium">(you)</span>}
                              {isCreator && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded flex items-center bg-yellow-100 text-yellow-700 font-bold uppercase">
                                  Admin
                                </span>
                              )}
                              {isAdminM && !isCreator && <Shield size={12} className="text-blue-500" />}
                            </div>
                            <p className={`text-xs font-medium ${member.isOnline ? 'text-green-500' : 'text-gray-400'}`}>
                              {member.isOnline !== undefined ? (member.isOnline ? 'Online' : 'Offline') : ''}
                            </p>
                          </div>
                          {canKick && (
                            <button onClick={() => kick(r._id, memberId, member.username)}
                              className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all focus:opacity-100"
                              title="Remove from group">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {!(r?.createdBy?._id?.toString() === currentUserId || r?.createdBy?.toString() === currentUserId) && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button onClick={handleLeave}
                        className="w-full flex items-center justify-center gap-2 text-sm font-bold px-4 py-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                        <LogOut size={16} /> Leave Group
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SETTINGS TAB */}
              {tab === 'settings' && amAdmin && (
                <div className="px-6 py-6 space-y-6">
                  {/* Avatar */}
                  <div className="flex flex-col items-center gap-4 p-4 border border-gray-100 rounded-2xl bg-gray-50">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                        {avatarPreview
                          ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                          : <span className="text-3xl font-black text-gray-300">{editName?.[0]?.toUpperCase() || '#'}</span>
                        }
                      </div>
                      <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={24} className="text-white" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                        <Camera size={14} />{avatarPreview ? 'Change Photo' : 'Upload Photo'}
                      </button>
                      {avatarPreview && (
                        <button onClick={() => { setAvatarPreview(''); setAvatarChanged(true); }}
                          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                          <Trash2 size={14} />Remove
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-medium">JPG, PNG · Max 500KB</p>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Group Name</label>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)}
                        placeholder="Enter group name" 
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Description</label>
                      <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="What is this group about?" rows={3}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm resize-none"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white shadow-sm cursor-pointer" onClick={() => setEditPriv(!editPriv)}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${editPriv ? 'bg-blue-50 text-blue-500' : 'bg-gray-100 text-gray-500'}`}>
                          {editPriv ? <Lock size={18} /> : <Unlock size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            {editPriv ? 'Invite Only' : 'Public Group'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 font-medium">
                            {editPriv ? 'Members need an invite link' : 'Anyone can join without invite'}
                          </p>
                        </div>
                      </div>
                      <div className={`w-11 h-6 rounded-full relative transition-colors ${editPriv ? 'bg-blue-500' : 'bg-gray-200'}`}>
                        <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${editPriv ? 'left-5' : 'left-0.5'}`} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <button onClick={handleSave} disabled={saving || !editName.trim()}
                      className="w-full flex items-center justify-center gap-2 text-sm font-bold px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:active:scale-100">
                      {saving ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                      ) : (
                        <><Save size={16} />Save Changes</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomSettings;
