import { useState, useEffect, useRef } from 'react';
import useRoomSettings from '../hooks/useRoomSettings';
import { useAuth }     from '../context/AuthContext';
import { useToast }    from '../context/ToastContext';
import {
  FiX, FiLink, FiRefreshCw, FiCopy, FiSettings,
  FiUsers, FiShield, FiLogOut, FiTrash2, FiCheck,
  FiLock, FiUnlock, FiEdit2, FiSave
} from 'react-icons/fi';

// ── Tiny inline QR generator using a public API ──────────────────
// No library needed — Google Charts QR API is free and reliable
const QRCode = ({ value, size = 180 }) => {
  const encoded = encodeURIComponent(value);
  const src     = `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encoded}&choe=UTF-8&chld=M|2`;
  return (
    <img
      src={src}
      alt="QR Code"
      width={size}
      height={size}
      className="rounded-xl border border-nt-border"
    />
  );
};

/**
 * RoomSettings — room management modal.
 *
 * Tabs: Invite | Members | Settings
 *
 * Props:
 *   room     — current room object (minimal, from socket context)
 *   onClose  — fn()
 *   onLeft   — fn() called when user leaves room
 *   onUpdated — fn(updatedRoom) called when room name/desc changes
 */
const RoomSettings = ({ room, onClose, onLeft, onUpdated }) => {
  const { user }  = useAuth();
  const toast     = useToast();
  const {
    roomDetails, inviteUrl, loading, saving, regenerating,
    loadRoom, saveRoom, regen, copyInvite, leave, kick
  } = useRoomSettings(toast);

  const [tab,       setTab]       = useState('invite');
  const [editName,  setEditName]  = useState('');
  const [editDesc,  setEditDesc]  = useState('');
  const [editPriv,  setEditPriv]  = useState(true);
  const [copied,    setCopied]    = useState(false);

  const inputRef = useRef(null);

  // Load full room details on mount
  useEffect(() => {
    if (room?._id) loadRoom(room._id);
  }, [room?._id]);

  // Populate edit fields once loaded
  useEffect(() => {
    if (roomDetails) {
      setEditName(roomDetails.name        || '');
      setEditDesc(roomDetails.description || '');
      setEditPriv(roomDetails.isPrivate   !== false);
    }
  }, [roomDetails]);

  const r = roomDetails || room;

  const currentUserId = user?._id?.toString();
  const amAdmin = r?.admins?.some?.((a) =>
    (a._id || a).toString() === currentUserId
  ) || r?.createdBy?._id?.toString() === currentUserId
    || r?.createdBy?.toString()       === currentUserId;

  // Copy invite with visual feedback
  const handleCopy = async () => {
    await copyInvite(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Save edits
  const handleSave = async () => {
    const updated = await saveRoom(r._id, {
      name:        editName,
      description: editDesc,
      isPrivate:   editPriv
    });
    if (updated) onUpdated?.(updated);
  };

  // Leave room
  const handleLeave = async () => {
    if (!window.confirm('Leave this room? You can rejoin with the invite link.')) return;
    const ok = await leave(r._id);
    if (ok) { onLeft?.(); onClose(); }
  };

  // Regen invite
  const handleRegen = async () => {
    if (!window.confirm('This will invalidate the current invite link. Anyone who hasn\'t joined yet will need the new link. Continue?')) return;
    await regen(r._id);
  };

  return (
    <div
      className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-nt-surface border border-nt-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-nt-border bg-nt-surface2/50">
          <div>
            <h3 className="text-base font-bold text-nt-text">
              # {r?.name || 'Room Settings'}
            </h3>
            <p className="text-xs text-nt-muted mt-0.5">
              {r?.members?.length || 0} members
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-nt-muted hover:text-nt-text hover:bg-nt-surface rounded-lg transition-all">
            <FiX size={16} />
          </button>
        </div>

        {/* ── Tab bar ─────────────────────────────────────────────── */}
        <div className="flex border-b border-nt-border">
          {[
            { key: 'invite',  label: 'Invite',   icon: <FiLink    size={13} /> },
            { key: 'members', label: 'Members',  icon: <FiUsers   size={13} /> },
            ...(amAdmin ? [{ key: 'settings', label: 'Settings', icon: <FiSettings size={13} /> }] : [])
          ].map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-all
                ${tab === key
                  ? 'text-nt-blue border-nt-blue bg-nt-blue/5'
                  : 'text-nt-muted border-transparent hover:text-nt-text hover:bg-nt-surface2'}`}>
              {icon}{label}
            </button>
          ))}
        </div>

        {/* ── Loading skeleton ────────────────────────────────────── */}
        {loading && (
          <div className="px-6 py-8 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-nt-blue/30 border-t-nt-blue rounded-full animate-spin" />
            <p className="text-sm text-nt-muted">Loading room details…</p>
          </div>
        )}

        {!loading && (
          <>
            {/* ── INVITE TAB ───────────────────────────────────────── */}
            {tab === 'invite' && (
              <div className="px-6 py-5 space-y-5">
                {/* QR Code */}
                {inviteUrl && (
                  <div className="flex flex-col items-center gap-3">
                    <QRCode value={inviteUrl} size={180} />
                    <p className="text-xs text-nt-muted text-center">
                      Scan this QR code to join <strong className="text-nt-text">#{r?.name}</strong>
                    </p>
                  </div>
                )}

                {/* Invite URL */}
                <div>
                  <label className="block text-xs font-semibold text-nt-muted mb-2 uppercase tracking-wider">
                    Invite Link
                  </label>
                  <div className="flex items-center gap-2">
                    <div
                      ref={inputRef}
                      className="flex-1 bg-nt-surface2 border border-nt-border rounded-xl px-3 py-2.5 text-xs text-nt-muted font-mono truncate"
                    >
                      {inviteUrl || 'Generating link…'}
                    </div>
                    <button
                      onClick={handleCopy}
                      disabled={!inviteUrl}
                      className="flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-2.5 rounded-xl bg-nt-blue hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-50"
                    >
                      {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Regen (admin only) */}
                {amAdmin && (
                  <button
                    onClick={handleRegen}
                    disabled={regenerating}
                    className="w-full flex items-center justify-center gap-2 text-xs py-2.5 rounded-xl border border-nt-border text-nt-muted hover:text-nt-warning hover:border-nt-warning/50 transition-all"
                  >
                    <FiRefreshCw size={12} className={regenerating ? 'animate-spin' : ''} />
                    {regenerating ? 'Regenerating…' : 'Regenerate Link (invalidates old one)'}
                  </button>
                )}

                <div className="p-3 rounded-xl bg-nt-surface2 border border-nt-border">
                  <p className="text-xs text-nt-muted leading-relaxed">
                    <strong className="text-nt-text">How to invite:</strong> Share the link or QR code with any registered NexTalk user. They can click the link or scan the QR to join this room instantly.
                  </p>
                </div>
              </div>
            )}

            {/* ── MEMBERS TAB ─────────────────────────────────────── */}
            {tab === 'members' && (
              <div className="px-4 py-4">
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {(r?.members || []).map((member) => {
                    const memberId  = member._id?.toString() || member.toString();
                    const isCreator = r?.createdBy?._id?.toString() === memberId ||
                                      r?.createdBy?.toString()       === memberId;
                    const isAdminM  = r?.admins?.some?.((a) => (a._id || a).toString() === memberId);
                    const isYou     = memberId === currentUserId;
                    const canKick   = amAdmin && !isCreator && !isYou;

                    return (
                      <div key={memberId}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-nt-surface2 transition-colors group">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-nt-surface border border-nt-border flex items-center justify-center text-xs font-bold text-nt-text">
                            {member.avatar?.startsWith?.('data:') || member.avatar?.startsWith?.('http')
                              ? <img src={member.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                              : (member.username?.[0]?.toUpperCase() || '?')}
                          </div>
                          {member.isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-nt-success rounded-full border-2 border-nt-surface" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-nt-text truncate">
                              {member.username || memberId}
                            </span>
                            {isYou     && <span className="text-xs text-nt-muted">(you)</span>}
                            {isCreator && <span className="text-xs px-1.5 py-0.5 rounded-md bg-nt-warning/15 text-nt-warning border border-nt-warning/25">Owner</span>}
                            {isAdminM && !isCreator && <FiShield size={11} className="text-nt-blue flex-shrink-0" />}
                          </div>
                          {member.isOnline !== undefined && (
                            <p className="text-xs text-nt-muted">
                              {member.isOnline ? '● Online' : '○ Offline'}
                            </p>
                          )}
                        </div>

                        {/* Kick button */}
                        {canKick && (
                          <button
                            onClick={() => kick(r._id, memberId, member.username)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-nt-muted hover:text-nt-danger transition-all rounded-lg hover:bg-nt-danger/10"
                            title="Remove from room"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Leave room */}
                {!( r?.createdBy?._id?.toString() === currentUserId || r?.createdBy?.toString() === currentUserId) && (
                  <button onClick={handleLeave}
                    className="w-full mt-4 flex items-center justify-center gap-2 text-xs py-2.5 rounded-xl border border-nt-danger/40 text-nt-danger hover:bg-nt-danger/10 transition-all">
                    <FiLogOut size={13} />
                    Leave Room
                  </button>
                )}
              </div>
            )}

            {/* ── SETTINGS TAB (admin only) ────────────────────────── */}
            {tab === 'settings' && amAdmin && (
              <div className="px-6 py-5 space-y-4">
                {/* Room name */}
                <div>
                  <label className="block text-xs font-semibold text-nt-muted mb-1.5 uppercase tracking-wider">Room Name</label>
                  <div className="relative">
                    <FiEdit2 size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nt-muted" />
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Room name"
                      className="nt-input pl-9"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-nt-muted mb-1.5 uppercase tracking-wider">Description</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="What is this room about?"
                    rows={2}
                    className="nt-input resize-none"
                  />
                </div>

                {/* Privacy toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-nt-surface2 border border-nt-border">
                  <div className="flex items-center gap-2">
                    {editPriv ? <FiLock size={14} className="text-nt-blue" /> : <FiUnlock size={14} className="text-nt-muted" />}
                    <div>
                      <p className="text-sm font-medium text-nt-text">
                        {editPriv ? 'Private — Invite only' : 'Public — Anyone can join'}
                      </p>
                      <p className="text-xs text-nt-muted">
                        {editPriv ? 'Users need your invite link to join' : 'Room visible to all (coming soon)'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditPriv(!editPriv)}
                    className={`w-10 h-6 rounded-full transition-colors relative ${editPriv ? 'bg-nt-blue' : 'bg-nt-border'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${editPriv ? 'left-5' : 'left-1'}`} />
                  </button>
                </div>

                {/* Save */}
                <button
                  onClick={handleSave}
                  disabled={saving || !editName.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {saving
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                    : <><FiSave size={14} /> Save Settings</>
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
