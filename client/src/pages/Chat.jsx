import { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import useRooms from '../hooks/useRooms';

import Navbar       from '../components/Navbar';
import Sidebar      from '../components/Sidebar';
import ChatWindow   from '../components/ChatWindow';
import MessageInput from '../components/MessageInput';
import SummaryModal from '../components/SummaryModal';

// AI callbacks will be wired in Day 4.
// Passing undefined here keeps all AI UI hidden until then.
const Chat = () => {
  const { messages } = useSocket();
  const { rooms, loading: roomsLoading, handleCreateRoom, handleSelectRoom } = useRooms();

  const [summaryOpen, setSummaryOpen]     = useState(false);
  const [summary, setSummary]             = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [explainLoading, setExplainLoading] = useState(null); // msgId being explained

  // ── Placeholders — real implementations in Day 4 ──────────────
  const handleSummarize = async () => {
    // wired Day 5
    setSummaryLoading(false);
    setSummary('AI summarizer will be connected on Day 5.');
  };

  const handleExplainCode = async (msgId, code, lang) => {
    // wired Day 5
    setExplainLoading(msgId);
    setTimeout(() => setExplainLoading(null), 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-nt-bg overflow-hidden">

      {/* Top navbar */}
      <Navbar onSummaryOpen={() => { setSummaryOpen(true); setSummary(''); }} />

      {/* Main content row */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar */}
        <Sidebar
          rooms={rooms}
          roomsLoading={roomsLoading}
          onSelectRoom={handleSelectRoom}
          onCreateRoom={async (name, desc) => {
            const room = await handleCreateRoom(name, desc);
            handleSelectRoom(room);
          }}
        />

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-nt-bg">
          <ChatWindow
            onExplainCode={handleExplainCode}
            explainLoading={explainLoading}
          />
          <MessageInput
            recentMessages={messages.slice(-5)}
            // onAnalyzeTone and onSmartReplies wired Day 4
          />
        </div>
      </div>

      {/* Catch Me Up modal */}
      <SummaryModal
        isOpen={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        summary={summary}
        isLoading={summaryLoading}
        onGenerate={handleSummarize}
      />
    </div>
  );
};

export default Chat;
