import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  StickyNote, 
  Brain, 
  CheckSquare, 
  Settings, 
  Sparkles,
  Search,
  ChevronDown,
  User,
  Plus
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [workspace, setWorkspace] = useState('Personal');
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const menuItems = [
    { icon: <MessageSquare className="w-5 h-5" />, label: 'Chat', path: '/app/chat' },
    { icon: <StickyNote className="w-5 h-5" />, label: 'Notes', path: '/app/notes' },
    { icon: <Brain className="w-5 h-5" />, label: 'Memory', path: '/app/memory' },
    { icon: <CheckSquare className="w-5 h-5" />, label: 'Tasks', path: '/app/tasks' },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-neutral-950/50 flex flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold tracking-tight">Nave OS</span>
          </Link>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group",
                  location.pathname === item.path 
                    ? "bg-white/10 text-white" 
                    : "text-neutral-500 hover:text-white hover:bg-white/5"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/5">
            <h4 className="text-sm font-semibold mb-1">Go Pro</h4>
            <p className="text-xs text-neutral-500 mb-3">Get unlimited access to all features.</p>
            <Button size="sm" className="w-full h-8 text-xs">Upgrade</Button>
          </div>
          
          <div className="space-y-1">
            <Link
              to="/app/settings"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                location.pathname === '/app/settings' 
                  ? "bg-white/10 text-white" 
                  : "text-neutral-500 hover:text-white hover:bg-white/5"
              )}
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-neutral-500 hover:text-white hover:bg-white/5 transition-all"
            >
              <User className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-background/50 backdrop-blur-sm z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/5">
              <span className="text-sm font-medium">{workspace}</span>
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500 group-focus-within:text-white transition-colors" />
              <input 
                placeholder="Search anything..." 
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/5 rounded-xl text-sm w-64 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end hidden sm:block">
                <span className="text-xs font-medium text-white">{user?.email?.split('@')[0]}</span>
                <span className="text-[10px] text-neutral-500 uppercase tracking-tighter">Pro Member</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-white text-xs font-bold uppercase">
                {user?.email?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Workspace Content */}
        <main className="flex-1 overflow-auto relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
