import { useState, useEffect, useRef } from 'react';
import { useAuth }       from '../context/AuthContext';
import { useSocket }     from '../context/SocketContext';
import useRooms          from '../hooks/useRooms';
import useAI             from '../hooks/useAI';

import Navbar            from '../components/Navbar';
import Sidebar           from '../components/Sidebar';
import ChatWindow        from '../components/ChatWindow';
import MessageInput      from '../components/MessageInput';
import SummaryModal      from '../components/SummaryModal';

const Chat = () => {
  const { user }                              = useAuth();
  const { messages, setMessages, activeRoom } = useSocket();
  const { rooms, loading: roomsLoading, handleCreateRoom, handleSelectRoom } = useRooms();

  const {
    analyzeTone, fetchSmartReplies,
    summary, keyTopics, messageCount, summaryLoading, summarize,
    translations, translationLoading,
    translateMessage, autoTranslate, batchTranslateRoom,
    explanations, explainLoading, explainCode,
    detectMood
  } = useAI();

  const [summaryOpen, setSummaryOpen] = useState(false);
  const lastMoodCount = useRef(0);

  // ── Batch translate messages when room loads ─────────────────────
  useEffect(() => {
    if (!activeRoom || !user?.language || user.language === 'en') return;
    const textMessages = messages.filter((m) => m.type === 'text');
    if (textMessages.length > 0) {
      batchTranslateRoom(textMessages, user.language);
    }
  }, [activeRoom?._id]);

  // ── Reset mood counter on room change ────────────────────────────
  useEffect(() => { lastMoodCount.current = 0; }, [activeRoom?._id]);

  // ── Patch client-side code explanations into messages ────────────
  useEffect(() => {
    if (!Object.keys(explanations).length) return;
    setMessages((prev) =>
      prev.map((m) => explanations[m._id] ? { ...m, codeExplanation: explanations[m._id] } : m)
    );
  }, [explanations]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleOpenSummary = () => { setSummaryOpen(true); handleSummarize(); };
  const handleSummarize   = () => {
    const textMsgs = messages.filter((m) => m.type !== 'system');
    if (textMsgs.length > 0) summarize(textMsgs);
  };

  const handleCreateAndJoin = async (name, desc) => {
    const room = await handleCreateRoom(name, desc);
    handleSelectRoom(room);
  };

  // Day 6: called by MessageBubble on mount — auto-translate one message
  const handleAutoTranslate = (message) => {
    if (!user?.language || user.language === 'en') return;
    autoTranslate(message, user.language);
  };

  // Day 6: language selector change — batch-translate existing messages in new language
  const handleLanguageChange = (newLang) => {
    if (!newLang || newLang === 'en') return;
    const textMessages = messages.filter((m) => m.type === 'text');
    if (textMessages.length > 0) batchTranslateRoom(textMessages, newLang);
  };

  const recentMessages = messages.filter((m) => m.type !== 'system').slice(-5);

  return (
    <div className="flex flex-col h-screen bg-nt-bg overflow-hidden">

      {/* Navbar */}
      <Navbar onSummaryOpen={handleOpenSummary} />

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <Sidebar
          rooms={rooms}
          roomsLoading={roomsLoading}
          onSelectRoom={handleSelectRoom}
          onCreateRoom={handleCreateAndJoin}
          onLanguageChange={handleLanguageChange}
        />

        {/* Chat column */}
        <div className="flex-1 flex flex-col overflow-hidden bg-nt-bg">
          {activeRoom ? (
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
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3 px-6 max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-nt-surface border border-nt-border flex items-center justify-center text-3xl mx-auto">💬</div>
                <h2 className="text-xl font-bold text-nt-text">Welcome to NexTalk</h2>
                <p className="text-nt-muted text-sm">Select a room from the sidebar to start chatting with AI superpowers</p>
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  {['✨ Tone Analyzer', '⚡ Smart Replies', '🌐 Auto-Translate',
                    '🔥 Mood Rooms', '📋 Catch Me Up', '💻 Code + AI Explain'].map((f) => (
                    <span key={f} className="text-xs px-3 py-1.5 rounded-full bg-nt-surface border border-nt-border text-nt-muted">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary modal */}
      <SummaryModal
        isOpen={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        summary={summary}
        keyTopics={keyTopics}
        messageCount={messageCount}
        isLoading={summaryLoading}
        onGenerate={handleSummarize}
      />
    </div>
  );
};

export default Chat;
