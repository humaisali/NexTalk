import { useState, useRef, useEffect } from 'react';
import { useAuth }   from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import MoodIndicator from './MoodIndicator';
import { WifiOff, RefreshCw, Zap, Settings, Search, MoreHorizontal, Hash, Globe, ChevronDown, Sidebar as SidebarIcon, X } from 'lucide-react';

const Navbar = ({ 
  onSummaryOpen, onRoomSettings, preferredLanguage, setPreferredLanguage, 
  activeConversation, showInfoPanel, setShowInfoPanel, 
  searchQuery, setSearchQuery, onCloseChat 
}) => {
  const { user }            = useAuth();
  const { activeRoom, isConnected, isReconnecting, onlineUsers } = useSocket();

  const [isLangOpen, setIsLangOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const langRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    { code: 'EN', name: 'English' },
    { code: 'ES', name: 'Spanish' },
    { code: 'FR', name: 'French' },
    { code: 'DE', name: 'German' },
    { code: 'UR', name: 'Urdu' },
    { code: 'HI', name: 'Hindi' },
    { code: 'AR', name: 'Arabic' },
  ];

  const isInDM   = !!activeConversation;
  const isInRoom = !!activeRoom && !isInDM;

  const other = isInDM
    ? activeConversation?.participants?.find((p) => p._id?.toString() !== user?._id?.toString())
    : null;

  return (
    <div className="navbar-premium h-16 flex items-center px-6 gap-4 flex-shrink-0 z-10">

      {/* Left — context info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {isInRoom && (
          <>
            {/* Group avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,239,178,0.15) 0%, rgba(255,239,178,0.08) 100%)',
                  border: '1px solid rgba(255,239,178,0.18)',
                  color: '#FFEFB2',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,239,178,0.1)',
                }}
              >
                {activeRoom.avatar?.startsWith('data:') || activeRoom.avatar?.startsWith('http')
                  ? <img src={activeRoom.avatar} alt="" className="w-full h-full object-cover" />
                  : activeRoom.name?.[0]?.toUpperCase() || '#'
                }
              </div>
              <div
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                style={{ background: '#4ADE80', borderColor: '#080E0D', boxShadow: '0 0 6px rgba(74,222,128,0.5)' }}
              />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm truncate" style={{ color: '#FFEFB2' }}>{activeRoom.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-nt-success" style={{ boxShadow: '0 0 4px rgba(74,222,128,0.6)' }} />
                <p className="text-xs" style={{ color: '#7A9E99' }}>
                  {onlineUsers.length} online · {activeRoom.members?.length || 0} members
                </p>
              </div>
            </div>
            <MoodIndicator compact />
          </>
        )}

        {isInDM && other && (
          <>
            <div className="relative flex-shrink-0">
              <div
                className="w-10 h-10 rounded-xl border overflow-hidden flex items-center justify-center text-sm font-bold"
                style={{
                  background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)',
                  borderColor: 'rgba(255,239,178,0.2)',
                  color: '#013E37',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                }}
              >
                {other.avatar?.startsWith?.('data:') || other.avatar?.startsWith?.('http')
                  ? <img src={other.avatar} alt="" className="w-full h-full object-cover" />
                  : other.username?.[0]?.toUpperCase()
                }
              </div>
              {other.isOnline && <div className="status-online absolute -bottom-0.5 -right-0.5" />}
            </div>
            <div>
              <h2 className="font-bold text-sm" style={{ color: '#FFEFB2' }}>{other.username}</h2>
              <p className="text-xs flex items-center gap-1.5" style={{ color: other.isOnline ? '#4ADE80' : '#7A9E99' }}>
                {other.isOnline && (
                  <span className="w-1.5 h-1.5 rounded-full bg-nt-success inline-block" style={{ boxShadow: '0 0 4px rgba(74,222,128,0.6)' }} />
                )}
                {other.isOnline ? 'Active now' : 'Offline'}
              </p>
            </div>
          </>
        )}

        {!isInRoom && !isInDM && (
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #FFEFB2, #F5DC6E)',
                boxShadow: '0 0 20px rgba(255,239,178,0.15)',
              }}
            >
              <span className="text-base font-black" style={{ color: '#013E37' }}>N</span>
            </div>
            <div>
              <h2 className="font-bold text-base text-gradient">NexTalk</h2>
              <p className="text-xs" style={{ color: '#7A9E99' }}>AI-Powered Chat</p>
            </div>
          </div>
        )}
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Connection badge */}
        {isReconnecting ? (
          <div
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
            style={{
              color: '#FCD34D',
              background: 'rgba(252,211,77,0.08)',
              border: '1px solid rgba(252,211,77,0.2)',
            }}
          >
            <RefreshCw size={10} className="animate-spin" />
            <span>Reconnecting</span>
          </div>
        ) : !isConnected ? (
          <div
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
            style={{
              color: '#F87171',
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.2)',
            }}
          >
            <WifiOff size={10} />
            <span>Offline</span>
          </div>
        ) : null}

        {/* Search Input */}
        {showSearchInput && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border animate-fade-in" style={{ background: 'rgba(13,26,24,0.8)', borderColor: 'rgba(255,239,178,0.15)' }}>
            <Search size={13} style={{ color: '#7A9E99' }} />
            <input 
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery?.(e.target.value)}
              placeholder="Search messages..."
              className="bg-transparent text-sm outline-none w-48"
              style={{ color: '#FFEFB2', caretColor: '#FFEFB2' }}
            />
            <button onClick={() => { setShowSearchInput(false); setSearchQuery?.(''); }} style={{ color: '#7A9E99' }} className="hover:text-white transition-colors">
              <X size={13} />
            </button>
          </div>
        )}

        {(isInRoom || isInDM) && !showSearchInput && (
          <button
            onClick={() => setShowSearchInput(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{ background: 'rgba(255,239,178,0.06)', color: '#7A9E99', border: '1px solid rgba(255,239,178,0.08)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,239,178,0.1)'; e.currentTarget.style.color = '#FFEFB2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,239,178,0.06)'; e.currentTarget.style.color = '#7A9E99'; }}
            title="Search messages"
          >
            <Search size={15} />
          </button>
        )}

        {isInRoom && (
          <>
            <button
              onClick={onSummaryOpen}
              className="flex items-center gap-2 text-xs px-4 py-2 rounded-xl font-semibold transition-all duration-200 hover-lift"
              style={{
                background: 'linear-gradient(135deg, rgba(255,239,178,0.12) 0%, rgba(255,239,178,0.07) 100%)',
                color: '#FFEFB2',
                border: '1px solid rgba(255,239,178,0.18)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,239,178,0.08)',
              }}
            >
              <Zap size={13} style={{ color: '#FFEFB2' }} />
              <span className="hidden sm:inline">Catch Me Up</span>
            </button>

            <button
              onClick={() => setShowInfoPanel(!showInfoPanel)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
              style={{ background: showInfoPanel ? 'rgba(255,239,178,0.1)' : 'rgba(255,239,178,0.06)', color: showInfoPanel ? '#FFEFB2' : '#7A9E99', border: '1px solid rgba(255,239,178,0.08)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,239,178,0.1)'; e.currentTarget.style.color = '#FFEFB2'; }}
              onMouseLeave={(e) => { if (!showInfoPanel) { e.currentTarget.style.background = 'rgba(255,239,178,0.06)'; e.currentTarget.style.color = '#7A9E99'; } }}
              title="Toggle Info Panel"
            >
              <SidebarIcon size={15} />
            </button>

            <button
              onClick={onRoomSettings}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
              style={{ background: 'rgba(255,239,178,0.06)', color: '#7A9E99', border: '1px solid rgba(255,239,178,0.08)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,239,178,0.1)'; e.currentTarget.style.color = '#FFEFB2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,239,178,0.06)'; e.currentTarget.style.color = '#7A9E99'; }}
              title="Group Settings"
            >
              <Settings size={15} />
            </button>
          </>
        )}

        {isInDM && (
          <button
            onClick={() => setShowInfoPanel(!showInfoPanel)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{ background: showInfoPanel ? 'rgba(255,239,178,0.1)' : 'rgba(255,239,178,0.06)', color: showInfoPanel ? '#FFEFB2' : '#7A9E99', border: '1px solid rgba(255,239,178,0.08)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,239,178,0.1)'; e.currentTarget.style.color = '#FFEFB2'; }}
            onMouseLeave={(e) => { if (!showInfoPanel) { e.currentTarget.style.background = 'rgba(255,239,178,0.06)'; e.currentTarget.style.color = '#7A9E99'; } }}
            title="Toggle Info Panel"
          >
            <MoreHorizontal size={15} />
          </button>
        )}

        {/* Language Selector */}
        {preferredLanguage && setPreferredLanguage && (
          <div className="relative hidden sm:block" ref={langRef}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200"
              style={{
                background: isLangOpen ? 'rgba(255,239,178,0.1)' : 'rgba(255,239,178,0.06)',
                border: '1px solid rgba(255,239,178,0.08)'
              }}
            >
              <Globe size={14} style={{ color: '#FFEFB2' }} />
              <span className="text-xs font-semibold" style={{ color: '#FFEFB2' }}>
                {languages.find(l => l.name === preferredLanguage)?.code || 'EN'}
              </span>
              <ChevronDown size={12} style={{ color: '#7A9E99' }} />
            </button>

            {isLangOpen && (
              <div
                className="absolute right-0 mt-2 w-32 py-1.5 rounded-xl border animate-scale-in z-50"
                style={{
                  background: 'rgba(13,26,24,0.95)',
                  backdropFilter: 'blur(10px)',
                  borderColor: 'rgba(255,239,178,0.15)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setPreferredLanguage(lang.name); setIsLangOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold transition-colors flex items-center justify-between"
                    style={{
                      color: preferredLanguage === lang.name ? '#FFEFB2' : '#7A9E99',
                      background: preferredLanguage === lang.name ? 'rgba(255,239,178,0.08)' : 'transparent',
                    }}
                    onMouseEnter={(e) => { if(preferredLanguage !== lang.name) e.currentTarget.style.color = '#D4C98A'; e.currentTarget.style.background = 'rgba(255,239,178,0.04)'; }}
                    onMouseLeave={(e) => { if(preferredLanguage !== lang.name) e.currentTarget.style.color = '#7A9E99'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    {lang.name}
                    {preferredLanguage === lang.name && (
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#4ADE80', boxShadow: '0 0 4px rgba(74,222,128,0.6)' }} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {(isInRoom || isInDM) && (
          <button
            onClick={onCloseChat}
            className="w-9 h-9 ml-1 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-red-500/10 hover:border-red-500/30"
            style={{ color: '#7A9E99', border: '1px solid transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#F87171'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#7A9E99'; }}
            title="Close Chat"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
