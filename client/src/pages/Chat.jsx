import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import useRooms      from '../hooks/useRooms';
import useAI         from '../hooks/useAI';

import Navbar        from '../components/Navbar';
import Sidebar       from '../components/Sidebar';
import ChatWindow    from '../components/ChatWindow';
import MessageInput  from '../components/MessageInput';
import SummaryModal  from '../components/SummaryModal';

// Mood auto-triggers every N new text messages
const MOOD_INTERVAL = 8;

const Chat = () => {
  const { messages, setMessages, activeRoom } = useSocket();
  const { rooms, loading: roomsLoading, handleCreateRoom, handleSelectRoom } = useRooms();

  const {
    analyzeTone, fetchSmartReplies,
    summary, keyTopics, messageCount, summaryLoading, summarize,
    translations, translationLoading, translateMessage,
    explanations, explainLoading, explainCode,
    detectMood
  } = useAI();

  const [summaryOpen, setSummaryOpen] = useState(false);
  const lastMoodCount                 = useRef(0);

  // ── Auto mood update every MOOD_INTERVAL messages ──────────────
  useEffect(() => {
    if (!activeRoom || messages.length === 0) return;
    const textMsgs = messages.filter((m) => m.type !== 'system');
    if (textMsgs.length - lastMoodCount.current >= MOOD_INTERVAL) {
      lastMoodCount.current = textMsgs.length;
      detectMood(textMsgs, activeRoom._id);
    }
  }, [messages.length, activeRoom]);

  // Reset on room change
  useEffect(() => { lastMoodCount.current = 0; }, [activeRoom?._id]);

  // ── Patch client-side code explanations into messages ──────────
  // (server also pushes via socket, but this keeps local state in sync)
  useEffect(() => {
    if (!Object.keys(explanations).length) return;
    setMessages((prev) =>
      prev.map((m) => explanations[m._id] ? { ...m, codeExplanation: explanations[m._id] } : m)
    );
  }, [explanations]);

  // ── Handlers ───────────────────────────────────────────────────
  const handleOpenSummary = () => {
    setSummaryOpen(true);
    handleSummarize();
  };

  const handleSummarize = () => {
    const textMsgs = messages.filter((m) => m.type !== 'system');
    if (textMsgs.length > 0) summarize(textMsgs);
  };

  const handleAnalyzeTone   = (msg)                => analyzeTone(msg);
  const handleSmartReplies  = (msgs)               => fetchSmartReplies(msgs);
  const handleExplainCode   = (id, code, lang)     => explainCode(id, code, lang);
  const handleTranslate     = (id, content, lang)  => translateMessage(id, content, lang);

  const handleCreateAndJoin = async (name, desc) => {
    const room = await handleCreateRoom(name, desc);
    handleSelectRoom(room);
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
        />

        {/* Chat column */}
        <div className="flex-1 flex flex-col overflow-hidden bg-nt-bg">
          {activeRoom ? (
            <>
              <ChatWindow
                onExplainCode={handleExplainCode}
                explainLoading={explainLoading}
                onTranslate={handleTranslate}
                translationLoading={translationLoading}
                translations={translations}
              />
              <MessageInput
                recentMessages={recentMessages}
                onAnalyzeTone={handleAnalyzeTone}
                onSmartReplies={handleSmartReplies}
              />
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3 px-6 max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-nt-surface border border-nt-border flex items-center justify-center text-3xl mx-auto">
                  💬
                </div>
                <h2 className="text-xl font-bold text-nt-text">Welcome to NexTalk</h2>
                <p className="text-nt-muted text-sm">
                  Select a room from the sidebar to start chatting with AI superpowers
                </p>
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  {['✨ Tone Analyzer', '⚡ Smart Replies', '🌐 Auto-Translate',
                    '🔥 Mood Rooms', '📋 Catch Me Up', '💻 Code + AI Explain'].map((f) => (
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

      {/* Catch Me Up modal — now with keyTopics + messageCount */}
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
