import { Menu, Home, MessageSquare, Users, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const PrimarySidebar = ({ onHomeClick, onMessagesClick, onGroupsClick, onSettingsClick, activeTab }) => {
  const { logout, user } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-16 h-full flex flex-col items-center py-6 border-r border-gray-200 bg-gray-50 dark:bg-[#0D1A18] dark:border-nt-border flex-shrink-0 relative z-20 shadow-sm">
      {/* Top Icon */}
      <div className="mb-8 cursor-pointer text-blue-600 dark:text-[#60D4C8] hover:text-blue-700 transition-colors p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-nt-border">
        <Menu size={24} />
      </div>

      {/* Nav Icons */}
      <div className="flex flex-col gap-4 flex-1 w-full px-2">
        <div 
          onClick={onHomeClick}
          className="w-full aspect-square flex items-center justify-center rounded-xl cursor-pointer transition-all text-gray-400 hover:text-gray-600 dark:hover:text-[#FFEFB2] hover:bg-gray-100 dark:hover:bg-nt-border"
          title="Home"
        >
          <Home size={22} />
        </div>
        <div 
          onClick={onMessagesClick} 
          className={`w-full aspect-square flex items-center justify-center rounded-xl cursor-pointer transition-all relative ${activeTab === 'dms' ? 'bg-blue-100 text-blue-600 dark:bg-nt-bg3 dark:text-[#60D4C8] shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-[#FFEFB2] hover:bg-gray-100 dark:hover:bg-nt-border'}`}
          title="Messages"
        >
          <MessageSquare size={22} />
        </div>
        <div 
          onClick={onGroupsClick}
          className={`w-full aspect-square flex items-center justify-center rounded-xl cursor-pointer transition-all ${activeTab === 'rooms' ? 'bg-blue-100 text-blue-600 dark:bg-nt-bg3 dark:text-[#60D4C8] shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-[#FFEFB2] hover:bg-gray-100 dark:hover:bg-nt-border'}`}
          title="Groups"
        >
          <Users size={22} />
        </div>
      </div>

      {/* Bottom Icons */}
      <div className="flex flex-col gap-4 mt-auto w-full px-2">
        <div 
          onClick={toggleTheme}
          className="w-full aspect-square flex items-center justify-center rounded-xl cursor-pointer transition-all text-gray-400 hover:text-gray-600 dark:hover:text-[#FFEFB2] hover:bg-gray-100 dark:hover:bg-nt-border"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun size={22} className="text-amber-400" /> : <Moon size={22} />}
        </div>
          <div 
            onClick={onSettingsClick}
            className="w-full aspect-square flex items-center justify-center rounded-xl cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-nt-border"
            title="User Avatar"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-gray-800">
                {user?.username?.[0]?.toUpperCase() ?? 'U'}
              </div>
            )}
          </div>
        <div 
          className="w-full aspect-square flex items-center justify-center rounded-xl cursor-pointer transition-all text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20" 
          onClick={handleLogout} 
          title="Logout"
        >
          <LogOut size={22} />
        </div>
      </div>
    </div>
  );
};

export default PrimarySidebar;
