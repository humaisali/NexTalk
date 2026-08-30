import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Hash,
  Info,
  Languages,
  MessageSquare,
  MoreHorizontal,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import useAI from '../hooks/useAI';
import useConversations from '../hooks/useConversations';
import usePushNotifications from '../hooks/usePushNotifications';
import useRooms from '../hooks/useRooms';
import useTranslation from '../hooks/useTranslation';
import ChatWindow from '../components/ChatWindow';
import ConnectionBanner from '../components/ConnectionBanner';
import DirectChatWindow from '../components/DirectChatWindow';
import EditProfileModal from '../components/EditProfileModal';
import MessageInput from '../components/MessageInput';
import RoomInfoPanel from '../components/RoomInfoPanel';
import RoomSettings from '../components/RoomSettings';
import Sidebar from '../components/Sidebar';
import StartConversation from '../components/StartConversation';
import SummaryModal from '../components/SummaryModal';

const Chat = () => {
  const { user } = useAuth();
  const { messages, setMessages, activeRoom, isReconnecting, leaveRoom } = useSocket();
  const toast = useToast();

  usePushNotifications(user);

  const {
    rooms,
    loading: roomsLoading,
    handleCreateRoom,
    handleSelectRoom,
    handleJoinByCode,
    updateRoomInList,
    removeRoomFromList,
  } = useRooms(toast);

  const {
    analyzeTone,
    fetchSmartReplies,
    summary,
    keyTopics,
    messageCount,
    summaryLoading,
    summarize,
    explanations,
    explainLoading,
    explainCode,
  } = useAI(toast);

  const {
    conversations,
    loading: convLoading,
    activeConversation,
    dmMessages,
    dmTypingUser,
    totalUnread,
    openConversation,
    closeConversation,
    sendDM,
    emitDMTyping,
    emitDMStopTyping,
  } = useConversations();

  const {
    preferredLanguage,
    setPreferredLanguage,
    translations,
    translateLoading,
    translateMessage,
  } = useTranslation(toast);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const reconnectShown = useRef(false);

  useEffect(() => {
    if (isReconnecting && !reconnectShown.current) {
      reconnectShown.current = true;
      toast.warning('Connection lost. Reconnecting…');
    }
    if (!isReconnecting && reconnectShown.current) {
      reconnectShown.current = false;
      toast.success('Reconnected.');
    }
  }, [isReconnecting, toast]);

  useEffect(() => {
    if (!Object.keys(explanations).length) return;
    setMessages((previous) => previous.map((message) => (
      explanations[message._id]
        ? { ...message, codeExplanation: explanations[message._id] }
        : message
    )));
  }, [explanations, setMessages]);

  const resetSecondaryPanels = () => {
    setShowInfoPanel(false);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleCloseChat = () => {
    closeConversation();
    leaveRoom();
    resetSecondaryPanels();
  };

  const goToRoom = (room) => {
    closeConversation();
    resetSecondaryPanels();
    handleSelectRoom(room);
  };

  const goToConversation = (conversation) => {
    leaveRoom();
    resetSecondaryPanels();
    openConversation(conversation);
  };

  const handleCreateAndJoin = async (name, description) => {
    try {
      const room = await handleCreateRoom(name, description);
      closeConversation();
      resetSecondaryPanels();
      handleSelectRoom(room);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to create group.');
      throw error;
    }
  };

  const handleJoinGroup = async (input) => {
    closeConversation();
    resetSecondaryPanels();
    return handleJoinByCode(input);
  };

  const handleConversationStart = (conversation) => {
    setShowNewChat(false);
    leaveRoom();
    openConversation(conversation);
  };

  const handleSummarize = () => {
    const textMessages = messages.filter((message) => message.type !== 'system');
    if (!textMessages.length) {
      toast.info('No messages to summarize yet.');
      return;
    }
    summarize(textMessages);
  };

  const handleRoomLeft = () => {
    if (activeRoom) removeRoomFromList(activeRoom._id);
    leaveRoom();
    resetSecondaryPanels();
  };

  const recentMessages = messages.filter((message) => message.type !== 'system').slice(-5);
  const showDM = Boolean(activeConversation);
  const showRoom = Boolean(activeRoom) && !showDM;
  const showEmpty = !showDM && !showRoom;
  const otherParticipant = activeConversation?.participants?.find((participant) => participant._id?.toString() !== user?._id?.toString());
  const conversationName = showDM ? otherParticipant?.username : activeRoom?.name;
  const conversationMeta = showDM
    ? otherParticipant?.isOnline ? (otherParticipant.statusText || 'Online now') : 'Offline'
    : activeRoom?.description || `${activeRoom?.members?.length || 0} members`;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[var(--app-bg)] font-sans text-[var(--text-primary)]">
      <a href="#conversation-main" className="fixed left-4 top-3 z-[70] -translate-y-20 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition focus:translate-y-0">
        Skip to conversation
      </a>
      <ConnectionBanner />

      <div className="flex min-h-0 flex-1 overflow-hidden">
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
          onSelectConv={goToConversation}
          onNewChat={() => setShowNewChat(true)}
          onEditProfile={() => setShowEditProfile(true)}
          className={showEmpty ? 'flex' : 'hidden md:flex'}
        />

        <div className={`${showEmpty ? 'hidden md:flex' : 'flex'} relative min-w-0 flex-1 overflow-hidden`}>
        <main id="conversation-main" className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[var(--surface)]">
          {(showDM || showRoom) && (
            <header className="z-10 flex-shrink-0 border-b border-[var(--border)] bg-[var(--surface)]">
              <div className="flex min-h-16 items-center justify-between gap-2 px-2 sm:px-4 lg:px-5">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <button type="button" onClick={handleCloseChat} className="icon-button md:hidden" aria-label="Back to conversations">
                    <ArrowLeft size={20} />
                  </button>

                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden ${showRoom ? 'rounded-xl' : 'rounded-full'} bg-[var(--brand-soft)] font-bold text-[var(--brand)]`}>
                    {showDM && (otherParticipant?.avatar?.startsWith?.('data:') || otherParticipant?.avatar?.startsWith?.('http'))
                      ? <img src={otherParticipant.avatar} alt="" className="h-full w-full object-cover" />
                      : showRoom && (activeRoom?.avatar?.startsWith?.('data:') || activeRoom?.avatar?.startsWith?.('http'))
                        ? <img src={activeRoom.avatar} alt="" className="h-full w-full object-cover" />
                        : showRoom ? <Hash size={18} aria-hidden="true" /> : conversationName?.[0]?.toUpperCase() || '?'}
                  </div>

                  <div className="min-w-0">
                    <h1 className="truncate text-sm font-bold text-[var(--text-primary)] sm:text-base">{conversationName}</h1>
                    <p className="truncate text-xs text-[var(--text-muted)]">{conversationMeta}</p>
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-1">
                  <button type="button" onClick={() => setSearchOpen((open) => !open)} className={`icon-button ${searchOpen ? 'bg-[var(--brand-soft)] text-[var(--brand)]' : ''}`} aria-label="Search messages" aria-pressed={searchOpen}>
                    <Search size={18} />
                  </button>
                  {showRoom && (
                    <button type="button" onClick={() => setSummaryOpen(true)} className="icon-button text-[var(--ai)]" aria-label="Catch up with an AI summary">
                      <Sparkles size={18} />
                    </button>
                  )}
                  <button type="button" onClick={() => setShowInfoPanel((open) => !open)} className={`icon-button ${showInfoPanel ? 'bg-[var(--brand-soft)] text-[var(--brand)]' : ''}`} aria-label="Conversation details" aria-pressed={showInfoPanel}>
                    <Info size={19} />
                  </button>
                  {showRoom && (
                    <button type="button" onClick={() => setShowRoomSettings(true)} className="icon-button" aria-label="Group settings">
                      <MoreHorizontal size={20} />
                    </button>
                  )}
                </div>
              </div>

              {searchOpen && (
                <div className="flex flex-col gap-2 border-t border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-3 sm:flex-row sm:items-center sm:px-5">
                  <div className="relative min-w-0 flex-1">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search this conversation" aria-label="Search this conversation" className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-9 pr-10 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--focus-ring)]" />
                    {searchQuery && <button type="button" onClick={() => setSearchQuery('')} className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-muted)]" aria-label="Clear message search"><X size={15} /></button>}
                  </div>
                  <label className="flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-secondary)]">
                    <Languages size={16} aria-hidden="true" />
                    <span className="sr-only">Translation language</span>
                    <select value={preferredLanguage} onChange={(event) => setPreferredLanguage(event.target.value)} className="min-w-0 bg-transparent text-sm outline-none">
                      <option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option><option value="de">German</option><option value="hi">Hindi</option><option value="zh">Chinese</option><option value="ar">Arabic</option><option value="pt">Portuguese</option><option value="ru">Russian</option><option value="ja">Japanese</option>
                    </select>
                  </label>
                </div>
              )}
            </header>
          )}

          {showDM && (
            <DirectChatWindow conversation={activeConversation} messages={dmMessages} typingUser={dmTypingUser} onSendMessage={sendDM} onTyping={emitDMTyping} onStopTyping={emitDMStopTyping} translations={translations} translateLoading={translateLoading} translateMessage={translateMessage} searchQuery={searchQuery} />
          )}

          {showRoom && (
            <>
              <ChatWindow onExplainCode={(id, code, language) => explainCode(id, code, language)} explainLoading={explainLoading} translations={translations} translateLoading={translateLoading} translateMessage={translateMessage} searchQuery={searchQuery} />
              <MessageInput recentMessages={recentMessages} onAnalyzeTone={analyzeTone} onSmartReplies={fetchSmartReplies} />
            </>
          )}

          {showEmpty && (
            <div className="flex flex-1 items-center justify-center bg-[var(--surface-subtle)] px-6 py-12">
              <div className="max-w-md text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)] shadow-sm">
                  <MessageSquare size={29} strokeWidth={1.8} aria-hidden="true" />
                </div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand)]">Your conversations</p>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Pick up where you left off</h1>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--text-muted)]">Choose a conversation from the inbox, or start a focused new thread without losing context.</p>
                <button type="button" onClick={() => setShowNewChat(true)} className="btn-primary mx-auto mt-6">
                  <MessageSquare size={17} /> Start a direct message
                </button>
                {user?.nexTalkNumber && (
                  <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-muted)]">
                    <Hash size={14} aria-hidden="true" />
                    Your number <strong className="font-mono text-[var(--text-primary)]">{user.nexTalkNumber.replace(/^(\+100)(\d{7})$/, '+100 $2')}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>

          {(showRoom || showDM) && showInfoPanel && (
            <>
              <button type="button" onClick={() => setShowInfoPanel(false)} className="absolute inset-0 z-20 bg-slate-950/35 backdrop-blur-[1px] xl:hidden" aria-label="Close conversation details" />
              <div className="absolute inset-y-0 right-0 z-30 w-[min(88vw,320px)] shadow-2xl xl:static xl:z-auto xl:w-[320px] xl:shadow-none">
                <RoomInfoPanel room={showRoom ? activeRoom : null} conversation={showDM ? activeConversation : null} onClose={() => setShowInfoPanel(false)} currentUserId={user?._id?.toString()} />
              </div>
            </>
          )}
        </div>
      </div>

      <SummaryModal isOpen={summaryOpen} onClose={() => setSummaryOpen(false)} summary={summary} keyTopics={keyTopics} messageCount={messageCount} isLoading={summaryLoading} onGenerate={handleSummarize} />

      {showRoomSettings && activeRoom && <RoomSettings room={activeRoom} onClose={() => setShowRoomSettings(false)} onLeft={handleRoomLeft} onUpdated={updateRoomInList} />}
      {showNewChat && <StartConversation onStart={handleConversationStart} onClose={() => setShowNewChat(false)} />}
      {showEditProfile && <EditProfileModal onClose={() => setShowEditProfile(false)} />}
    </div>
  );
};

export default Chat;
