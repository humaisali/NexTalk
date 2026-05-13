import { Menu, Home, MessageSquare, Users, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PrimarySidebar = ({ onHomeClick, onMessagesClick, onGroupsClick, onSettingsClick, activeTab }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-16 h-full flex flex-col items-center py-6 border-r border-gray-200 bg-gray-50 flex-shrink-0 relative z-20 shadow-sm">
      {/* Top Icon */}
      <div className="mb-8 cursor-pointer text-blue-600 hover:text-blue-700 transition-colors p-2 rounded-xl hover:bg-blue-50">
        <Menu size={24} />
      </div>

      {/* Nav Icons */}
      <div className="flex flex-col gap-4 flex-1 w-full px-2">
        <div 
          onClick={onHomeClick}
          className="w-full aspect-square flex items-center justify-center rounded-xl cursor-pointer transition-all text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          title="Home"
        >
          <Home size={22} />
        </div>
        <div 
          onClick={onMessagesClick} 
          className={`w-full aspect-square flex items-center justify-center rounded-xl cursor-pointer transition-all relative ${activeTab === 'dms' ? 'bg-blue-100 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          title="Messages"
        >
          <MessageSquare size={22} />
          {/* <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-blue-100"></div> */}
        </div>
        <div 
          onClick={onGroupsClick}
          className={`w-full aspect-square flex items-center justify-center rounded-xl cursor-pointer transition-all ${activeTab === 'rooms' ? 'bg-blue-100 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          title="Groups"
        >
          <Users size={22} />
        </div>
      </div>

      {/* Bottom Icons */}
      <div className="flex flex-col gap-4 mt-auto w-full px-2">
        <div 
          onClick={onSettingsClick}
          className="w-full aspect-square flex items-center justify-center rounded-xl cursor-pointer transition-all text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          title="Settings"
        >
          <Settings size={22} />
        </div>
        <div 
          className="w-full aspect-square flex items-center justify-center rounded-xl cursor-pointer transition-all text-gray-400 hover:text-red-500 hover:bg-red-50" 
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
