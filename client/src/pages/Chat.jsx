import { useState, useEffect, useRef } from 'react';
import { useAuth }              from '../context/AuthContext';
import { useSocket }            from '../context/SocketContext';
import { useToast }             from '../context/ToastContext';
import useRooms                 from '../hooks/useRooms';
import useAI                    from '../hooks/useAI';
import useConversations         from '../hooks/useConversations';
import useTranslation           from '../hooks/useTranslation';
import usePushNotifications     from '../hooks/usePushNotifications';

import PrimarySidebar           from '../components/PrimarySidebar';
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
  const { messages, setMessages, activeRoom, isReconnecting, leaveRoom } = useSocket();
  const toast                                                  = useToast();

  // Initialize background push notifications
  usePushNotifications(user);

  const {
    rooms, loading: roomsLoading,
    handleCreateRoom, handleSelectRoom, handleJoinByCode,
    handleJoinAndOpen, updateRoomInList, removeRoomFromList,
  } = useRooms(toast);

  const {
    analyzeTone, fetchSmartReplies,
    summary, keyTopics, messageCount, summaryLoading, summarize,
    explanations, explainLoading, explainCode,
  } = useAI(toast);

  const {
    conversations, loading: convLoading,
    activeConversation, dmMessages, dmTypingUser, totalUnread,
    openConversation, closeConversation,
    sendDM, emitDMTyping, emitDMStopTyping,
  } = useConversations();

  const {
    preferredLanguage, setPreferredLanguage,
    translations, translateLoading, translateMessage,
  } = useTranslation(toast);

  const [summaryOpen,      setSummaryOpen]      = useState(false);
  const [showNewChat,      setShowNewChat]      = useState(false);
  const [showEditProfile,  setShowEditProfile]  = useState(false);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [showInfoPanel,    setShowInfoPanel]    = useState(true);
  const [searchQuery,      setSearchQuery]      = useState('');
  const [sidebarTab,       setSidebarTab]       = useState('dms');

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
  }, [isReconnecting, toast]);

  useEffect(() => {
    if (!Object.keys(explanations).length) return;
    setMessages((prev) =>
      prev.map((m) => explanations[m._id] ? { ...m, codeExplanation: explanations[m._id] } : m)
    );
  }, [explanations, setMessages]);


  const handleCloseChat = () => {
    closeConversation();
    leaveRoom();
  };

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
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100 font-sans">
      <ConnectionBanner />

      {/* Main 4-column layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Column 1: Primary Sidebar (Dark) */}
        <PrimarySidebar 
          activeTab={sidebarTab}
          onHomeClick={handleCloseChat}
          onMessagesClick={() => setSidebarTab('dms')}
          onGroupsClick={() => setSidebarTab('rooms')}
          onSettingsClick={() => {
            if (showRoom) {
              setShowRoomSettings(true);
            } else {
              setShowEditProfile(true);
            }
          }}
        />

        {/* Column 2: Chat List */}
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
          tab={sidebarTab}
          setTab={setSidebarTab}
        />

        {/* Column 3: Main chat window */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-white relative">
          
          {/* Header for Chat Window (Replaces old Navbar) */}
          {(showDM || showRoom) && (
            <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0 bg-white">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-gray-800">
                  {showDM ? activeConversation?.participants?.find(p => p._id !== user?._id)?.username : activeRoom?.name}
                </h2>
                {showRoom && activeRoom?.description && (
                  <span className="text-sm text-gray-500 hidden md:block truncate max-w-xs">{activeRoom.description}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {/* Search Input */}
                <div className="relative hidden md:block">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages..."
                    className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 w-48 transition-all"
                  />
                </div>

                {/* Language Selection */}
                <div className="flex items-center gap-1.5 hidden sm:flex px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50">
                  <Globe size={14} className="text-gray-500" />
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="bg-transparent text-sm text-gray-700 outline-none border-none cursor-pointer focus:ring-0 p-0"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="hi">Hindi</option>
                    <option value="zh">Chinese</option>
                    <option value="ar">Arabic</option>
                    <option value="pt">Portuguese</option>
                    <option value="ru">Russian</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>

                {/* AI Summary Button */}
                {showRoom && (
                  <button 
                    onClick={() => setSummaryOpen(true)}
                    className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors hidden sm:block"
                    title="AI Summary"
                  >
                    <Sparkles size={18} />
                  </button>
                )}

                {/* Room Settings */}
                {showRoom && (
                  <button 
                    onClick={() => setShowRoomSettings(true)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                    title="Group Settings"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                  </button>
                )}

                {/* Info Panel Toggle */}
                <button 
                  onClick={() => setShowInfoPanel(!showInfoPanel)}
                  className={`p-2 rounded-full transition-colors ${showInfoPanel ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}
                  title="Toggle Info Panel"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>

                {/* Close Chat */}
                <button 
                  onClick={handleCloseChat}
                  className="p-2 rounded-full hover:bg-red-50 hover:text-red-500 text-gray-500 transition-colors ml-1"
                  title="Close Chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* Private DM */}
          {showDM && (
            <DirectChatWindow
              conversation={activeConversation}
              messages={dmMessages}
              typingUser={dmTypingUser}
              onSendMessage={sendDM}
              onTyping={emitDMTyping}
              onStopTyping={emitDMStopTyping}
              translations={translations}
              translateLoading={translateLoading}
              translateMessage={translateMessage}
              searchQuery={searchQuery}
            />
          )}

          {/* Group chat */}
          {showRoom && (
            <>
              <ChatWindow
                onExplainCode={(id, code, lang) => explainCode(id, code, lang)}
                explainLoading={explainLoading}
                translations={translations}
                translateLoading={translateLoading}
                translateMessage={translateMessage}
                searchQuery={searchQuery}
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
            <div className="flex-1 flex items-center justify-center bg-gray-50/50">
              <div className="text-center space-y-6 px-6 max-w-md">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500 shadow-sm">
                    <MessageSquare size={36} strokeWidth={2} />
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to NexTalk</h2>
                  <p className="text-gray-500 text-sm">Select a conversation or start a new one.</p>
                </div>

                {user?.nexTalkNumber && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-400 mb-1 flex items-center justify-center gap-1">
                      <Hash size={12} /> Your NexTalk Number
                    </p>
                    <p className="font-mono font-bold text-lg text-gray-800 tracking-wider">
                      {user.nexTalkNumber.replace(/^(\+100)(\d{7})$/, '+100 $2')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Column 4: Info Panel */}
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
