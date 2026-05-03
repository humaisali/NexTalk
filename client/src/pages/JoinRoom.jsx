import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth }          from '../context/AuthContext';
import { useToast }         from '../context/ToastContext';
import { previewRoomInvite, joinRoomByInvite } from '../services/api';
import { Users, Lock, ArrowRight, Check, MessageSquare, Hash } from 'lucide-react';

const JoinRoom = () => {
  const { code }   = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const toast      = useToast();

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await previewRoomInvite(code);
        setPreview(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invite link is invalid or has expired.');
      } finally { setLoading(false); }
    };
    if (code) load();
  }, [code]);

  const handleJoin = async () => {
    if (preview?.alreadyMember) { navigate('/chat'); return; }
    setJoining(true);
    try {
      await joinRoomByInvite(code);
      toast.success(`Joined #${preview.room.name}!`);
      navigate('/chat');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join room.');
    } finally { setJoining(false); }
  };

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: '#011F1B' }}>

      {/* Left decorative panel */}
      <div className="hidden md:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #011F1B 0%, #013E37 60%, #024D44 100%)' }}>
        <div className="absolute top-0 left-0 w-80 h-80 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, #FFEFB2, transparent)', transform: 'translate(-40%,-40%)' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, #FFEFB2, transparent)', transform: 'translate(40%,40%)' }} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 border-primary/40"
               style={{ background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)' }}>
            <MessageSquare size={28} className="text-secondary" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-primary tracking-tight">NexTalk</h1>
            <p className="text-xs text-primary/60 font-medium tracking-widest uppercase">AI Chat Platform</p>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-primary leading-snug">
            You've been<br />
            <span className="text-primary/70">invited to join</span><br />
            a room.
          </h2>
          <p className="mt-4 text-nt-info/70 text-sm leading-relaxed max-w-xs">
            NexTalk rooms are invite-only spaces for real-time AI-powered collaboration.
          </p>
        </div>

        <p className="relative z-10 text-xs text-primary/30">Built by Humais Ali · SkyTech Developers</p>
      </div>

      {/* Right — invite content */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm animate-slide-up">

          {/* Mobile brand */}
          <div className="flex md:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)' }}>
              <MessageSquare size={20} style={{ color: '#013E37' }} />
            </div>
            <span className="text-xl font-black" style={{ color: '#FFEFB2' }}>NexTalk</span>
          </div>

          <div className="rounded-nt-xl border overflow-hidden shadow-nt-float"
               style={{ background: '#012B26', borderColor: '#025A50' }}>

            {loading ? (
              <div className="flex flex-col items-center gap-3 py-12 px-6">
                <div className="w-8 h-8 border-2 rounded-full animate-spin"
                     style={{ borderColor: '#025A50', borderTopColor: '#FFEFB2' }} />
                <p className="text-sm" style={{ color: '#7A9E99' }}>Loading invite…</p>
              </div>
            ) : error ? (
              <div className="text-center py-10 px-6">
                <div className="w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-4"
                     style={{ background: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.25)' }}>
                  <Hash size={24} style={{ color: '#F87171' }} />
                </div>
                <h2 className="text-lg font-bold mb-2" style={{ color: '#FFEFB2' }}>Invalid Invite</h2>
                <p className="text-sm mb-6" style={{ color: '#7A9E99' }}>{error}</p>
                <Link to="/chat" className="btn-primary inline-block text-sm">Go to NexTalk</Link>
              </div>
            ) : preview ? (
              <div>
                {/* Room info header */}
                <div className="px-6 py-5 border-b text-center" style={{ borderColor: '#025A50', background: '#013E37' }}>
                  <div className="w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto mb-3"
                       style={{ background: 'rgba(255,239,178,0.1)', borderColor: 'rgba(255,239,178,0.2)' }}>
                    <Hash size={28} style={{ color: '#FFEFB2' }} />
                  </div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#7A9E99' }}>You've been invited to</p>
                  <h2 className="text-xl font-bold" style={{ color: '#FFEFB2' }}>#{preview.room.name}</h2>
                  {preview.room.description && (
                    <p className="text-sm mt-1" style={{ color: '#7A9E99' }}>{preview.room.description}</p>
                  )}
                </div>

                <div className="px-6 py-5 space-y-4">
                  {/* Stats */}
                  <div className="flex items-center justify-center gap-5">
                    <div className="flex items-center gap-1.5 text-sm" style={{ color: '#7A9E99' }}>
                      <Users size={14} /><span>{preview.memberCount} members</span>
                    </div>
                    {preview.room.isPrivate && (
                      <div className="flex items-center gap-1.5 text-sm" style={{ color: '#7A9E99' }}>
                        <Lock size={14} /><span>Private</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-center" style={{ color: '#7A9E99' }}>
                    Created by <strong style={{ color: '#FFEFB2' }}>{preview.room.createdBy?.username}</strong>
                  </p>

                  {/* Auth gate */}
                  {!user ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded-nt border text-xs text-center"
                           style={{ background: 'rgba(255,239,178,0.04)', borderColor: '#025A50', color: '#7A9E99' }}>
                        You need a NexTalk account to join this room.
                      </div>
                      <Link to="/register" className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                        Create Account & Join <ArrowRight size={14} />
                      </Link>
                      <Link to="/login"
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-5 rounded-nt border text-sm font-medium transition-all"
                        style={{ borderColor: '#025A50', color: '#D4C98A' }}>
                        Sign In
                      </Link>
                    </div>
                  ) : (
                    <>
                      <button onClick={handleJoin} disabled={joining}
                        className="btn-primary w-full flex items-center justify-center gap-2">
                        {joining
                          ? <><div className="w-4 h-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />Joining…</>
                          : preview.alreadyMember
                          ? <><Check size={15} />Already a member — Go to room</>
                          : <>Join #{preview.room.name} <ArrowRight size={15} /></>
                        }
                      </button>
                      <p className="text-center text-xs" style={{ color: '#7A9E99' }}>
                        Joining as <strong style={{ color: '#FFEFB2' }}>{user.username}</strong>
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;
