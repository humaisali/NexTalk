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

  // ── Reconnect toast ────────────────────────────────────────────
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

  // ── Patch code explanations into messages ──────────────────────
  useEffect(() => {
    if (!Object.keys(explanations).length) return;
    setMessages((prev) =>
      prev.map((m) => explanations[m._id] ? { ...m, codeExplanation: explanations[m._id] } : m)
    );
  }, [explanations]);

  // ── Handlers ──────────────────────────────────────────────────
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

  // Join group via invite link/code entered in sidebar
  const handleJoinGroup = async (input) => {
    try {
      closeConversation();
      await handleJoinByCode(input);
    } catch (err) {
      // Rethrow so Sidebar can show the error message inline
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
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#011F1B' }}>

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
        <div className="flex-1 flex flex-col overflow-hidden min-w-0"
             style={{ background: '#011F1B' }}>

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

          {/* Empty / welcome state */}
          {showEmpty && (
            <div className="flex-1 flex items-center justify-center animate-fade-in">
              <div className="text-center space-y-5 px-6 max-w-sm">
                <div className="w-20 h-20 rounded-2xl border-2 flex items-center justify-center mx-auto"
                     style={{ background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)', borderColor: 'rgba(255,239,178,0.3)' }}>
                  <span className="text-4xl font-black" style={{ color: '#013E37' }}>N</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: '#FFEFB2' }}>Welcome to NexTalk</h2>
                  <p className="text-sm mt-2 leading-relaxed" style={{ color: '#7A9E99' }}>
                    Select a <strong style={{ color: '#D4C98A' }}>Group</strong> from the sidebar to start chatting,
                    or open a <strong style={{ color: '#D4C98A' }}>Direct Message</strong> using a NexTalk number.
                  </p>
                </div>

                {/* NexTalk number */}
                {user?.nexTalkNumber && (
                  <div className="rounded-nt border p-3 text-center"
                       style={{ background: 'rgba(255,239,178,0.06)', borderColor: '#025A50' }}>
                    <p className="text-xs mb-1" style={{ color: '#7A9E99' }}>Your NexTalk number</p>
                    <p className="font-mono font-bold text-lg tracking-widest" style={{ color: '#FFEFB2' }}>
                      {user.nexTalkNumber.replace(/^(\+100)(\d{7})$/, '+100 $2')}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(122,158,153,0.5)' }}>
                      Share this with friends so they can message you directly
                    </p>
                  </div>
                )}

                {/* Feature chips */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Tone Analyzer','Smart Replies','Mood Rooms','Catch Me Up','Code + AI Explain','Private DMs','Group Chat'].map((f) => (
                    <span key={f} className="text-xs px-3 py-1.5 rounded-full border"
                          style={{ background: 'rgba(255,239,178,0.05)', borderColor: '#025A50', color: '#7A9E99' }}>
                      {f}
                    </span>
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

      {/* ── Modals ─────────────────────────────────────────────── */}
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
