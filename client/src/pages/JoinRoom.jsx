import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth }          from '../context/AuthContext';
import { useToast }         from '../context/ToastContext';
import { previewRoomInvite, joinRoomByInvite } from '../services/api';
import { FiUsers, FiLock, FiArrowRight, FiCheck } from 'react-icons/fi';

const JoinRoom = () => {
  const { code }    = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const toast       = useToast();

  const [preview,  setPreview]  = useState(null);  // { room, memberCount, alreadyMember }
  const [loading,  setLoading]  = useState(true);
  const [joining,  setJoining]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await previewRoomInvite(code);
        setPreview(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invite link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };
    if (code) load();
  }, [code]);

  const handleJoin = async () => {
    if (preview?.alreadyMember) {
      navigate('/chat');
      return;
    }
    setJoining(true);
    try {
      await joinRoomByInvite(code);
      toast.success(`Joined #${preview.room.name}!`);
      navigate('/chat');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join room.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-nt-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-nt-blue/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-nt-blue to-nt-cyan mb-4 shadow-2xl shadow-nt-blue/25">
            <span className="text-white font-black text-2xl">N</span>
          </div>
          <h1 className="text-2xl font-bold text-nt-text">
            Nex<span className="text-nt-blue">Talk</span>
          </h1>
        </div>

        <div className="nt-card p-6 shadow-2xl shadow-black/30">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-8 h-8 border-2 border-nt-blue/30 border-t-nt-blue rounded-full animate-spin" />
              <p className="text-nt-muted text-sm">Loading invite…</p>
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🔗</div>
              <h2 className="text-lg font-bold text-nt-text mb-2">Invalid Invite</h2>
              <p className="text-nt-muted text-sm mb-5">{error}</p>
              <Link to="/chat" className="btn-primary inline-block text-sm">
                Go to NexTalk
              </Link>
            </div>
          ) : preview ? (
            <div className="space-y-5">
              {/* Room card */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-nt-blue/15 border border-nt-blue/25 flex items-center justify-center text-3xl mx-auto mb-3">
                  💬
                </div>
                <p className="text-xs text-nt-muted uppercase tracking-wider mb-1">You've been invited to</p>
                <h2 className="text-xl font-bold text-nt-text">#{preview.room.name}</h2>
                {preview.room.description && (
                  <p className="text-nt-muted text-sm mt-1">{preview.room.description}</p>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5 text-sm text-nt-muted">
                  <FiUsers size={14} />
                  <span>{preview.memberCount} members</span>
                </div>
                {preview.room.isPrivate && (
                  <div className="flex items-center gap-1.5 text-sm text-nt-muted">
                    <FiLock size={14} />
                    <span>Private room</span>
                  </div>
                )}
              </div>

              {/* Created by */}
              <p className="text-xs text-nt-muted text-center">
                Created by <strong className="text-nt-text">{preview.room.createdBy?.username}</strong>
              </p>

              {/* Auth gate */}
              {!user ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-nt-surface2 border border-nt-border text-xs text-nt-muted text-center">
                    You need a NexTalk account to join this room.
                  </div>
                  <Link to="/register" className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                    Create Account & Join <FiArrowRight size={14} />
                  </Link>
                  <Link to="/login" className="btn-ghost w-full text-center text-sm border border-nt-border">
                    Sign In
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {joining ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Joining…</>
                  ) : preview.alreadyMember ? (
                    <><FiCheck size={15} /> Already a member — Go to room</>
                  ) : (
                    <>Join #{preview.room.name} <FiArrowRight size={15} /></>
                  )}
                </button>
              )}

              {user && (
                <p className="text-center text-xs text-nt-muted">
                  Joining as <strong className="text-nt-text">{user.username}</strong>
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;
