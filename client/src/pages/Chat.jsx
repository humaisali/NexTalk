import { useState, useEffect, useRef } from 'react';
import { useAuth }              from '../context/AuthContext';
import { useSocket }            from '../context/SocketContext';
import { useToast }             from '../context/ToastContext';
import useRooms                 from '../hooks/useRooms';
import useAI                    from '../hooks/useAI';
import useConversations         from '../hooks/useConversations';

import Navbar                   from '../components/Navbar';
import Sidebar                  from '../components/Sidebar';
import ChatWindow               from '../components/ChatWindow';
import MessageInput             from '../components/MessageInput';
import SummaryModal             from '../components/SummaryModal';
import ConnectionBanner         from '../components/ConnectionBanner';
import DirectChatWindow         from '../components/DirectChatWindow';
import StartConversation        from '../components/StartConversation';
import EditProfileModal         from '../components/EditProfileModal';
import RoomSettings             from '../components/RoomSettings';
import RoomInfoPanel            from '../components/RoomInfoPanel';
import { MessageSquare, Hash, Zap, Globe, Shield, Sparkles } from 'lucide-react';

const Chat = () => {
  const { user }                                               = useAuth();
  const { messages, setMessages, activeRoom, isReconnecting } = useSocket();
  const toast                                                  = useToast();

  const {
    rooms, loading: roomsLoading,
    handleCreateRoom, handleSelectRoom, handleJoinByCode,
    handleJoinAndOpen, updateRoomInList, removeRoomFromList,
  } = useRooms(toast);

  const {
    analyzeTone, fetchSmartReplies,
    summary, keyTopics, messageCount, summaryLoading, summarize,
    explanations, explainLoading, explainCode,
  } = useAI();

  const {
    conversations, loading: convLoading,
    activeConversation, dmMessages, dmTypingUser, totalUnread,
    openConversation, closeConversation,
    sendDM, emitDMTyping, emitDMStopTyping,
  } = useConversations();

  const [summaryOpen,      setSummaryOpen]      = useState(false);
  const [showNewChat,      setShowNewChat]      = useState(false);
  const [showEditProfile,  setShowEditProfile]  = useState(false);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [showInfoPanel,    setShowInfoPanel]    = useState(true);
  const reconnectShown = useRef(false);

  useEffect(() => {
    if (isReconnecting && !reconnectShown.current) {
      reconnectShown.current = true;
      toast.warning('Connection lost. Reconnecting…');
    }
    if (!isReconnecting && reconnectShown.current) {
      reconnectShown.current = false;
      toast.success('Reconnected!');
    }
  }, [isReconnecting]);

  useEffect(() => {
    if (!Object.keys(explanations).length) return;
    setMessages((prev) =>
      prev.map((m) => explanations[m._id] ? { ...m, codeExplanation: explanations[m._id] } : m)
    );
  }, [explanations]);

  const goToRoom = (room) => { closeConversation(); handleSelectRoom(room); };

  const handleCreateAndJoin = async (name, desc) => {
    try {
      const room = await handleCreateRoom(name, desc);
      closeConversation();
      handleSelectRoom(room);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create group.');
      throw err;
    }
  };

  const handleJoinGroup = async (input) => {
    try {
      closeConversation();
      await handleJoinByCode(input);
    } catch (err) {
      throw err;
    }
  };

  const handleConversationStart = (conversation) => {
    setShowNewChat(false);
    openConversation(conversation);
  };

  const handleSummarize = () => {
    const textMsgs = messages.filter((m) => m.type !== 'system');
    if (!textMsgs.length) { toast.info('No messages to summarize yet.'); return; }
    summarize(textMsgs);
  };

  const handleRoomLeft    = () => { if (activeRoom) removeRoomFromList(activeRoom._id); };
  const handleRoomUpdated = (r) => updateRoomInList(r);

  const recentMessages = messages.filter((m) => m.type !== 'system').slice(-5);
  const showDM         = !!activeConversation;
  const showRoom       = !!activeRoom && !showDM;
  const showEmpty      = !showDM && !showRoom;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#080E0D' }}>

      {/* Top Navbar */}
      <Navbar
        onSummaryOpen={() => { setSummaryOpen(true); handleSummarize(); }}
        onRoomSettings={() => activeRoom && setShowRoomSettings(true)}
      />
      <ConnectionBanner />

      {/* 3-column layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Column 1 — Sidebar */}
        <Sidebar
          rooms={rooms}
          roomsLoading={roomsLoading}
          onSelectRoom={goToRoom}
          onCreateRoom={handleCreateAndJoin}
          onJoinRoom={handleJoinGroup}
          conversations={conversations}
          convLoading={convLoading}
          activeConvId={activeConversation?._id?.toString()}
          totalUnreadDMs={totalUnread}
          onSelectConv={openConversation}
          onNewChat={() => setShowNewChat(true)}
          onEditProfile={() => setShowEditProfile(true)}
        />

        {/* Column 2 — Main chat */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 chat-bg">

          {/* Private DM */}
          {showDM && (
            <DirectChatWindow
              conversation={activeConversation}
              messages={dmMessages}
              typingUser={dmTypingUser}
              onSendMessage={sendDM}
              onTyping={emitDMTyping}
              onStopTyping={emitDMStopTyping}
            />
          )}

          {/* Group chat */}
          {showRoom && (
            <>
              <ChatWindow
                onExplainCode={(id, code, lang) => explainCode(id, code, lang)}
                explainLoading={explainLoading}
              />
              <MessageInput
                recentMessages={recentMessages}
                onAnalyzeTone={analyzeTone}
                onSmartReplies={fetchSmartReplies}
              />
            </>
          )}

          {/* Premium empty / welcome state */}
          {showEmpty && (
            <div className="flex-1 flex items-center justify-center animate-fade-in relative overflow-hidden">
              {/* Ambient glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `
                    radial-gradient(ellipse 60% 50% at 50% 40%, rgba(2,90,80,0.08) 0%, transparent 70%),
                    radial-gradient(ellipse 40% 40% at 30% 70%, rgba(255,239,178,0.03) 0%, transparent 60%)
                  `,
                }}
              />

              <div className="text-center space-y-7 px-6 max-w-md relative z-10">
                {/* Logo mark */}
                <div className="flex justify-center">
                  <div
                    className="w-24 h-24 rounded-3xl flex items-center justify-center animate-float"
                    style={{
                      background: 'linear-gradient(135deg, #FFEFB2 0%, #F5DC6E 50%, #E8C94A 100%)',
                      boxShadow: '0 0 60px rgba(255,239,178,0.2), 0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
                    }}
                  >
                    <MessageSquare size={40} strokeWidth={2.5} style={{ color: '#013E37' }} />
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-black text-gradient tracking-tight mb-3">
                    Welcome to NexTalk
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(122,158,153,0.6)' }}>
                    Select a <strong style={{ color: '#D4C98A' }}>Group</strong> from the sidebar to start chatting,
                    or open a <strong style={{ color: '#D4C98A' }}>Direct Message</strong> using a NexTalk number.
                  </p>
                </div>

                {/* NexTalk number card */}
                {user?.nexTalkNumber && (
                  <div
                    className="rounded-2xl p-4 text-center"
                    style={{
                      background: 'rgba(255,239,178,0.04)',
                      border: '1px solid rgba(255,239,178,0.1)',
                      boxShadow: 'inset 0 1px 0 rgba(255,239,178,0.05)',
                    }}
                  >
                    <p className="text-xs mb-2 flex items-center justify-center gap-1.5" style={{ color: 'rgba(122,158,153,0.6)' }}>
                      <Hash size={11} style={{ color: '#60D4C8' }} />
                      Your NexTalk number
                    </p>
                    <p className="font-mono font-black text-xl tracking-widest" style={{ color: '#FFEFB2', letterSpacing: '0.15em' }}>
                      {user.nexTalkNumber.replace(/^(\+100)(\d{7})$/, '+100 $2')}
                    </p>
                    <p className="text-xs mt-2" style={{ color: 'rgba(122,158,153,0.4)' }}>
                      Share this with friends to receive direct messages
                    </p>
                  </div>
                )}

                {/* Feature grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { icon: Zap,         label: 'Tone Analyzer',    desc: 'Real-time tone detection' },
                    { icon: Sparkles,    label: 'Smart Replies',    desc: 'AI-suggested responses' },
                    { icon: Globe,       label: 'Auto-Translate',   desc: '14 languages supported' },
                    { icon: Shield,      label: 'Private DMs',      desc: 'End-to-end encrypted' },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div
                      key={label}
                      className="p-3 rounded-xl text-left"
                      style={{
                        background: 'rgba(255,239,178,0.03)',
                        border: '1px solid rgba(255,239,178,0.07)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon size={13} style={{ color: '#60D4C8' }} />
                        <span className="text-xs font-semibold" style={{ color: '#D4C98A' }}>{label}</span>
                      </div>
                      <p className="text-xs" style={{ color: 'rgba(122,158,153,0.5)' }}>{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Column 3 — Info Panel */}
        {(showRoom || showDM) && showInfoPanel && (
          <RoomInfoPanel
            room={showRoom ? activeRoom : null}
            conversation={showDM ? activeConversation : null}
            onClose={() => setShowInfoPanel(false)}
            currentUserId={user?._id?.toString()}
          />
        )}
      </div>

      {/* Modals */}
      <SummaryModal
        isOpen={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        summary={summary}
        keyTopics={keyTopics}
        messageCount={messageCount}
        isLoading={summaryLoading}
        onGenerate={handleSummarize}
      />

      {showRoomSettings && activeRoom && (
        <RoomSettings
          room={activeRoom}
          onClose={() => setShowRoomSettings(false)}
          onLeft={handleRoomLeft}
          onUpdated={handleRoomUpdated}
        />
      )}

      {showNewChat && (
        <StartConversation
          onStart={handleConversationStart}
          onClose={() => setShowNewChat(false)}
        />
      )}

      {showEditProfile && (
        <EditProfileModal onClose={() => setShowEditProfile(false)} />
      )}
    </div>
  );
};

export default Chat;
