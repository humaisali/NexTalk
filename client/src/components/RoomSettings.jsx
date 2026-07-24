import { useState, useEffect, useRef } from 'react';
import useRoomSettings from '../hooks/useRoomSettings';
import { useAuth }     from '../context/AuthContext';
import { useToast }    from '../context/ToastContext';
import { X, Link, RefreshCw, Copy, Settings, Users, LogOut, Trash2, Check, Lock, Unlock, Save, Shield, Camera, CheckCircle, XCircle } from 'lucide-react';
import QRCode from 'react-qr-code';

const RoomSettings = ({ room, onClose, onLeft, onUpdated }) => {
  const { user }  = useAuth();
  const toast     = useToast();
  const { 
    roomDetails, inviteUrl, loading, saving, regenerating,
    joinRequests, loadingRequests,
    loadRoom, saveRoom, saveSettings, loadJoinRequests, approveRequest, rejectRequest,
    regen, copyInvite, leave, kick 
  } = useRoomSettings(toast);

  const [tab,      setTab]      = useState('invite');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriv, setEditPriv] = useState(true);
  const [copied,   setCopied]   = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [onlyAdminsCanPost, setOnlyAdminsCanPost] = useState(false);
  const [approvalRequired, setApprovalRequired] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { if (room?._id) loadRoom(room._id); }, [room?._id]);
  
  const r             = roomDetails || room;
  const currentUserId = user?._id?.toString();
  const amAdmin       = r?.admins?.some?.((a) => (a._id || a).toString() === currentUserId) ||
                        r?.createdBy?._id?.toString() === currentUserId ||
                        r?.createdBy?.toString()       === currentUserId;

  useEffect(() => {
    if (roomDetails) {
      setEditName(roomDetails.name        || '');
      setEditDesc(roomDetails.description || '');
      setEditPriv(roomDetails.isPrivate   !== false);
      setAvatarPreview(roomDetails.avatar || '');
      setOnlyAdminsCanPost(roomDetails.settings?.onlyAdminsCanPost || false);
      setApprovalRequired(roomDetails.settings?.approvalRequired || false);
    }
  }, [roomDetails]);

  // Load join requests if user is admin
  useEffect(() => {
    if (r?._id && amAdmin) {
      loadJoinRequests(r._id);
    }
  }, [r?._id, amAdmin, loadJoinRequests]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file.'); return; }
    if (file.size > 512 * 1024) { toast.error('Image too large. Max 500KB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setAvatarPreview(ev.target.result); setAvatarChanged(true); };
    reader.readAsDataURL(file);
  };

  const handleCopy = async () => {
    await copyInvite(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    try {
      const payload = { name: editName, description: editDesc, isPrivate: editPriv };
      if (avatarChanged) payload.avatar = avatarPreview;
      const updated = await saveRoom(r._id, payload);
      
      // Also save settings
      const settingsResult = await saveSettings(r._id, { onlyAdminsCanPost, approvalRequired });
      
      if (updated) {
        onUpdated?.({
          ...updated,
          settings: settingsResult || { onlyAdminsCanPost, approvalRequired }
        });
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    }
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
    ...(amAdmin ? [
      { key: 'settings', label: 'Settings', icon: Settings },
      { key: 'requests', label: `Requests (${joinRequests?.length || 0})`, icon: Shield }
    ] : [])
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md bg-white dark:bg-nt-bg1 rounded-2xl overflow-hidden shadow-xl border border-gray-100 dark:border-nt-border animate-slide-up flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-nt-border bg-gray-50 dark:bg-nt-bg2/40 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-50 dark:bg-nt-bg3 text-blue-600 dark:text-[#60D4C8] border border-blue-100 dark:border-nt-border flex items-center justify-center text-lg font-bold shadow-sm">
              {r?.avatar?.startsWith('data:') || r?.avatar?.startsWith('http')
                ? <img src={r.avatar} alt="avatar" className="w-full h-full object-cover" />
                : r?.name?.[0]?.toUpperCase() || '#'
              }
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800 dark:text-nt-text">{r?.name || 'Group Settings'}</h3>
              <p className="text-xs mt-0.5 text-gray-500 dark:text-nt-muted font-medium">{r?.members?.length || 0} members</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-nt-muted hover:text-gray-700 dark:hover:text-nt-text transition-colors p-1 rounded-full hover:bg-gray-200 dark:hover:bg-nt-bg3">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-nt-border bg-white dark:bg-nt-bg1 flex-shrink-0">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-semibold border-b-2 transition-all
                ${tab === key 
                  ? 'border-blue-500 text-blue-600 bg-blue-50/30 dark:border-nt-teal dark:text-nt-teal dark:bg-nt-bg3/30' 
                  : 'border-transparent text-gray-500 dark:text-nt-muted hover:text-gray-700 dark:hover:text-nt-text hover:bg-gray-50 dark:hover:bg-nt-bg2/40'}`}>
              <Icon size={16} />{label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-nt-muted">
              <div className="w-8 h-8 border-2 border-gray-200 dark:border-nt-bg3 border-t-blue-500 dark:border-t-nt-teal rounded-full animate-spin" />
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
                      <p className="text-sm text-center text-gray-500 dark:text-nt-muted">
                        Scan to join <strong className="text-gray-800 dark:text-nt-text">{r?.name}</strong>
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 dark:text-nt-muted uppercase tracking-wider">Invite Link</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-nt-border bg-gray-50 dark:bg-nt-bg2/50 text-sm font-mono text-gray-600 dark:text-nt-text truncate shadow-inner">
                        {inviteUrl || 'Generating…'}
                      </div>
                      <button onClick={handleCopy} disabled={!inviteUrl}
                        className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-lg bg-blue-600 dark:bg-nt-teal text-white dark:text-nt-bg hover:bg-blue-700 dark:hover:bg-[#50c2b7] active:scale-95 transition-all shadow-sm disabled:opacity-50 flex-shrink-0">
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  {amAdmin && (
                    <button onClick={handleRegen} disabled={regenerating}
                      className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-lg border border-gray-200 dark:border-nt-border text-gray-600 dark:text-nt-text hover:bg-gray-50 dark:hover:bg-nt-bg2 hover:text-gray-800 dark:hover:text-[#FFEFB2] transition-all bg-transparent">
                      <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
                      {regenerating ? 'Regenerating…' : 'Regenerate Link (invalidates old one)'}
                    </button>
                  )}
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-nt-bg3/30 border border-blue-100 dark:border-nt-border/40 text-sm leading-relaxed text-blue-800 dark:text-[#60D4C8] shadow-sm text-center">
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
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-nt-bg2/40 transition-colors group border border-transparent hover:border-gray-100 dark:hover:border-nt-border">
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-nt-bg3 text-gray-600 dark:text-nt-text border border-gray-100 dark:border-nt-border flex items-center justify-center text-sm font-bold shadow-sm">
                              {hasImg ? <img src={member.avatar} alt="" className="w-full h-full object-cover" /> : member.username?.[0]?.toUpperCase() || '?'}
                            </div>
                            {member.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white dark:border-nt-bg1" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-800 dark:text-nt-text truncate">
                                {member.username || memberId}
                              </span>
                              {isYou && <span className="text-xs text-gray-400 dark:text-nt-muted font-medium">(you)</span>}
                              {isCreator && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded flex items-center bg-yellow-100 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 font-bold uppercase">
                                  Owner
                                </span>
                              )}
                              {isAdminM && !isCreator && <Shield size={12} className="text-[#60D4C8]" />}
                            </div>
                            <p className={`text-xs font-medium ${member.isOnline ? 'text-green-500' : 'text-gray-400 dark:text-nt-muted'}`}>
                              {member.isOnline !== undefined ? (member.isOnline ? 'Online' : 'Offline') : ''}
                            </p>
                          </div>
                          {canKick && (
                            <button onClick={() => kick(r._id, memberId, member.username)}
                              className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all focus:opacity-100"
                              title="Remove from group">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {!(r?.createdBy?._id?.toString() === currentUserId || r?.createdBy?.toString() === currentUserId) && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-nt-border">
                      <button onClick={handleLeave}
                        className="w-full flex items-center justify-center gap-2 text-sm font-bold px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
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
                  <div className="flex flex-col items-center gap-4 p-4 border border-gray-100 dark:border-nt-border rounded-2xl bg-gray-50 dark:bg-nt-bg2/40">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-white dark:bg-nt-bg3 border border-gray-200 dark:border-nt-border flex items-center justify-center shadow-sm">
                        {avatarPreview
                          ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                          : <span className="text-3xl font-black text-gray-300 dark:text-nt-muted">{editName?.[0]?.toUpperCase() || '#'}</span>
                        }
                      </div>
                      <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={24} className="text-white" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border border-gray-200 dark:border-nt-border bg-white dark:bg-nt-bg2 text-gray-700 dark:text-nt-text hover:bg-gray-50 dark:hover:bg-nt-bg3 transition-colors shadow-sm">
                        <Camera size={14} />{avatarPreview ? 'Change Photo' : 'Upload Photo'}
                      </button>
                      {avatarPreview && (
                        <button onClick={() => { setAvatarPreview(''); setAvatarChanged(true); }}
                          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border border-red-100 dark:border-red-950/20 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                          <Trash2 size={14} />Remove
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-nt-muted font-medium">JPG, PNG · Max 500KB</p>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-nt-muted mb-2 uppercase tracking-wider">Group Name</label>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)}
                        placeholder="Enter group name" 
                        className="w-full px-4 py-2.5 bg-white dark:bg-nt-bg2 border border-gray-200 dark:border-nt-border rounded-lg text-sm text-gray-800 dark:text-nt-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-nt-teal/20 focus:border-blue-400 dark:focus:border-nt-teal transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-nt-muted mb-2 uppercase tracking-wider">Description</label>
                      <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="What is this group about?" rows={3}
                        className="w-full px-4 py-2.5 bg-white dark:bg-nt-bg2 border border-gray-200 dark:border-nt-border rounded-lg text-sm text-gray-800 dark:text-nt-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-nt-teal/20 focus:border-blue-400 dark:focus:border-nt-teal transition-all shadow-sm resize-none"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-nt-border bg-white dark:bg-nt-bg2 shadow-sm cursor-pointer" onClick={() => setEditPriv(!editPriv)}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${editPriv ? 'bg-blue-50 dark:bg-nt-bg3 text-blue-500 dark:text-[#60D4C8]' : 'bg-gray-100 dark:bg-nt-bg3 text-gray-500 dark:text-nt-muted'}`}>
                          {editPriv ? <Lock size={18} /> : <Unlock size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 dark:text-nt-text">
                            {editPriv ? 'Invite Only' : 'Public Group'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-nt-muted mt-0.5 font-medium">
                            {editPriv ? 'Members need an invite link' : 'Anyone can join without invite'}
                          </p>
                        </div>
                      </div>
                      <div className={`w-11 h-6 rounded-full relative transition-colors ${editPriv ? 'bg-blue-500 dark:bg-nt-teal' : 'bg-gray-200 dark:bg-nt-bg3'}`}>
                        <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${editPriv ? 'left-5' : 'left-0.5'}`} />
                      </div>
                    </div>

                    {/* MODERATION SETTINGS */}
                    <div className="border-t border-gray-100 dark:border-nt-border pt-4 mt-2 space-y-3">
                      <h4 className="text-xs font-bold text-gray-400 dark:text-nt-muted uppercase tracking-wider mb-1">Moderation & Posting</h4>
                      
                      {/* Only admins can post */}
                      <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-nt-border bg-white dark:bg-nt-bg2 shadow-sm cursor-pointer" onClick={() => setOnlyAdminsCanPost(!onlyAdminsCanPost)}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${onlyAdminsCanPost ? 'bg-amber-50 dark:bg-nt-bg3 text-amber-500 dark:text-nt-warning' : 'bg-gray-100 dark:bg-nt-bg3 text-gray-500 dark:text-nt-muted'}`}>
                            <Shield size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-nt-text">Broadcast Mode</p>
                            <p className="text-xs text-gray-500 dark:text-nt-muted mt-0.5 font-medium">Only admins can post messages</p>
                          </div>
                        </div>
                        <div className={`w-11 h-6 rounded-full relative transition-colors ${onlyAdminsCanPost ? 'bg-blue-500 dark:bg-nt-teal' : 'bg-gray-200 dark:bg-nt-bg3'}`}>
                          <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${onlyAdminsCanPost ? 'left-5' : 'left-0.5'}`} />
                        </div>
                      </div>

                      {/* Approval required to join */}
                      <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-nt-border bg-white dark:bg-nt-bg2 shadow-sm cursor-pointer" onClick={() => setApprovalRequired(!approvalRequired)}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${approvalRequired ? 'bg-purple-50 dark:bg-nt-bg3 text-purple-500 dark:text-nt-[#93C5FD]' : 'bg-gray-100 dark:bg-nt-bg3 text-gray-500 dark:text-nt-muted'}`}>
                            <Lock size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-nt-text">Join Approval Required</p>
                            <p className="text-xs text-gray-500 dark:text-nt-muted mt-0.5 font-medium">Admins must approve new member requests</p>
                          </div>
                        </div>
                        <div className={`w-11 h-6 rounded-full relative transition-colors ${approvalRequired ? 'bg-blue-500 dark:bg-nt-teal' : 'bg-gray-200 dark:bg-nt-bg3'}`}>
                          <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${approvalRequired ? 'left-5' : 'left-0.5'}`} />
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-nt-border">
                    <button onClick={handleSave} disabled={saving || !editName.trim()}
                      className="w-full flex items-center justify-center gap-2 text-sm font-bold px-4 py-3 rounded-xl bg-blue-600 dark:bg-nt-teal text-white dark:text-nt-bg hover:bg-blue-700 dark:hover:bg-[#50c2b7] active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:active:scale-100">
                      {saving ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-nt-bg/30 dark:border-t-nt-bg rounded-full animate-spin" />Saving…</>
                      ) : (
                        <><Save size={16} />Save Changes</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* REQUESTS TAB */}
              {tab === 'requests' && amAdmin && (
                <div className="p-4 flex flex-col h-full">
                  <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                    {loadingRequests ? (
                      <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-nt-muted py-10">
                        <div className="w-6 h-6 border-2 border-gray-200 dark:border-nt-bg3 border-t-blue-500 dark:border-t-nt-teal rounded-full animate-spin" />
                        <p className="text-xs font-medium">Loading requests…</p>
                      </div>
                    ) : joinRequests.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-nt-muted py-12 text-center">
                        <Shield size={32} className="opacity-40" />
                        <p className="text-sm font-semibold">No pending requests</p>
                        <p className="text-xs">When users request to join, they will appear here.</p>
                      </div>
                    ) : (
                      joinRequests.map((reqUser) => {
                        const reqUserId = reqUser._id?.toString();
                        const hasImg = reqUser.avatar?.startsWith?.('data:') || reqUser.avatar?.startsWith?.('http');

                        return (
                          <div key={reqUserId}
                            className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 dark:border-nt-border bg-gray-50 dark:bg-nt-bg2/30 hover:border-gray-200 dark:hover:border-nt-border/80 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-nt-bg3 text-gray-600 dark:text-nt-text flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0">
                                {hasImg ? <img src={reqUser.avatar} alt="" className="w-full h-full object-cover" /> : reqUser.username?.[0]?.toUpperCase() || '?'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-800 dark:text-nt-text truncate">{reqUser.username}</p>
                                <p className="text-xs text-gray-400 dark:text-nt-muted truncate">{reqUser.nexTalkNumber || reqUser.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                              <button onClick={() => approveRequest(r._id, reqUserId, reqUser.username)}
                                className="p-2 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                                title="Approve Request">
                                <CheckCircle size={20} />
                              </button>
                              <button onClick={() => rejectRequest(r._id, reqUserId, reqUser.username)}
                                className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                title="Reject Request">
                                <XCircle size={20} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
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
