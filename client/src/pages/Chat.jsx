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
import EditProfileModal        from '../components/EditProfileModal';

const Chat = () => {
  const { user }                                               = useAuth();
  const { messages, setMessages, activeRoom, isReconnecting } = useSocket();
  const toast                                                  = useToast();

  const { rooms, loading: roomsLoading, handleCreateRoom, handleSelectRoom } = useRooms(toast);

  const {
    analyzeTone, fetchSmartReplies,
    summary, keyTopics, messageCount, summaryLoading, summarize,
    translations, translationLoading, translateMessage, autoTranslate, batchTranslateRoom,
    explanations, explainLoading, explainCode,
  } = useAI();

  const {
    conversations, loading: convLoading,
    activeConversation, dmMessages, dmTypingUser, totalUnread,
    openConversation, closeConversation,
    sendDM, emitDMTyping, emitDMStopTyping,
  } = useConversations();

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [showNewChat,    setShowNewChat]    = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const lastMoodCount                 = useRef(0);
  const reconnectShown                = useRef(false);

  // ── Reconnect toast ────────────────────────────────────────────
  useEffect(() => {
    if (isReconnecting && !reconnectShown.current) {
      reconnectShown.current = true;
      toast.warning('Connection lost. Reconnecting…');
    }
    if (!isReconnecting && reconnectShown.current) {
      reconnectShown.current = false;
      toast.success('Reconnected! ✅');
    }
  }, [isReconnecting]);

  // ── Batch translate on room load ───────────────────────────────
  useEffect(() => {
    if (!activeRoom || !user?.language || user.language === 'en') return;
    const textMsgs = messages.filter((m) => m.type === 'text');
    if (textMsgs.length > 0) batchTranslateRoom(textMsgs, user.language);
  }, [activeRoom?._id]);

  // ── Patch code explanations into messages ──────────────────────
  useEffect(() => {
    if (!Object.keys(explanations).length) return;
    setMessages((prev) =>
      prev.map((m) => explanations[m._id] ? { ...m, codeExplanation: explanations[m._id] } : m)
    );
  }, [explanations]);

  // ── Room select — also closes any open DM ──────────────────────
  const goToRoom = (room) => {
    closeConversation();
    handleSelectRoom(room);
  };

  // ── Create room — switches to room panel ───────────────────────
  const handleCreateAndJoin = async (name, desc) => {
    try {
      const room = await handleCreateRoom(name, desc);
      closeConversation();
      handleSelectRoom(room);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create room.');
      throw err;
    }
  };

  // ── New DM started from StartConversation modal ────────────────
  const handleConversationStart = (conversation) => {
    setShowNewChat(false);
    openConversation(conversation);
  };

  // ── Auto-translate helpers ─────────────────────────────────────
  const handleAutoTranslate = (message) => {
    if (!user?.language || user.language === 'en') return;
    autoTranslate(message, user.language);
  };

  const handleLanguageChange = (newLang) => {
    if (!newLang || newLang === 'en') return;
    const textMsgs = messages.filter((m) => m.type === 'text');
    if (textMsgs.length > 0) batchTranslateRoom(textMsgs, newLang);
    toast.info(`Auto-translating to ${newLang.toUpperCase()}`);
  };

  const handleSummarize = () => {
    const textMsgs = messages.filter((m) => m.type !== 'system');
    if (!textMsgs.length) { toast.info('No messages to summarize yet.'); return; }
    summarize(textMsgs);
  };

  const recentMessages = messages.filter((m) => m.type !== 'system').slice(-5);

  // Panel visibility
  const showDM    = !!activeConversation;
  const showRoom  = !!activeRoom && !showDM;
  const showEmpty = !showDM && !showRoom;

  return (
    <div className="flex flex-col h-screen bg-nt-bg overflow-hidden">

      <Navbar onSummaryOpen={() => { setSummaryOpen(true); handleSummarize(); }} />
      <ConnectionBanner />

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar with Rooms + DMs tabs */}
        <Sidebar
          /* Room props */
          rooms={rooms}
          roomsLoading={roomsLoading}
          onSelectRoom={goToRoom}
          onCreateRoom={handleCreateAndJoin}
          onLanguageChange={handleLanguageChange}
          /* DM props */
          conversations={conversations}
          convLoading={convLoading}
          activeConvId={activeConversation?._id?.toString()}
          totalUnreadDMs={totalUnread}
          onSelectConv={openConversation}
          onNewChat={() => setShowNewChat(true)}
          onEditProfile={() => setShowEditProfile(true)}
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-nt-bg relative">

          {/* Private DM view */}
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

          {/* Group room view */}
          {showRoom && (
            <>
              <ChatWindow
                onExplainCode={(id, code, lang) => explainCode(id, code, lang)}
                explainLoading={explainLoading}
                onTranslate={(id, content, lang) => translateMessage(id, content, lang)}
                onAutoTranslate={handleAutoTranslate}
                translationLoading={translationLoading}
                translations={translations}
                userLanguage={user?.language || 'en'}
              />
              <MessageInput
                recentMessages={recentMessages}
                onAnalyzeTone={analyzeTone}
                onSmartReplies={fetchSmartReplies}
              />
            </>
          )}

          {/* Welcome / empty state */}
          {showEmpty && (
            <div className="flex-1 flex items-center justify-center animate-fade-in">
              <div className="text-center space-y-4 px-6 max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-nt-surface border border-nt-border flex items-center justify-center text-3xl mx-auto shadow-lg">
                  💬
                </div>
                <div>
                  <h2 className="text-xl font-bold text-nt-text">Welcome to NexTalk</h2>
                  <p className="text-nt-muted text-sm mt-1.5 leading-relaxed">
                    Join a <strong className="text-nt-text">Room</strong> to chat in groups, or open a <strong className="text-nt-text">Direct Message</strong> using your NexTalk number for private conversations.
                  </p>
                </div>

                {/* Show user's own number */}
                {user?.nexTalkNumber && (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-nt-muted">Your NexTalk number:</span>
                    <div className="font-mono font-bold text-nt-blue text-lg tracking-widest px-4 py-2 rounded-xl bg-nt-blue/10 border border-nt-blue/25">
                      {user.nexTalkNumber.replace(/^(\+100)(\d{7})$/, '+100 $2')}
                    </div>
                    <span className="text-xs text-nt-muted/60">Share this with friends so they can message you</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 justify-center pt-1">
                  {['✨ Tone Analyzer', '⚡ Smart Replies', '🌐 Auto-Translate',
                    '🔥 Mood Rooms', '📋 Catch Me Up', '💻 Code + AI Explain', '🔒 Private DMs'
                  ].map((f) => (
                    <span key={f} className="text-xs px-3 py-1.5 rounded-full bg-nt-surface border border-nt-border text-nt-muted">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Catch Me Up modal */}
      <SummaryModal
        isOpen={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        summary={summary}
        keyTopics={keyTopics}
        messageCount={messageCount}
        isLoading={summaryLoading}
        onGenerate={handleSummarize}
      />

      {/* Edit Profile modal */}
      {showEditProfile && (
        <EditProfileModal onClose={() => setShowEditProfile(false)} />
      )}

      {/* New DM modal */}
      {showNewChat && (
        <StartConversation
          onStart={handleConversationStart}
          onClose={() => setShowNewChat(false)}
        />
      )}
    </div>
  );
};

export default Chat;
