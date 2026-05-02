import { useEffect, useState } from 'react';
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
  Menu,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [workspace, setWorkspace] = useState('Personal');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

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
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[min(18rem,calc(100vw-2rem))] flex-col border-r border-white/5 bg-neutral-950/95 backdrop-blur-xl transition-transform md:static md:z-auto md:w-64 md:translate-x-0 md:bg-neutral-950/50 md:backdrop-blur-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold tracking-tight">Nave OS</span>
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-11 w-11 p-0 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all group',
                  location.pathname === item.path 
                    ? 'bg-white/10 text-white' 
                    : 'text-neutral-500 hover:bg-white/5 hover:text-white'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/10 to-transparent p-4">
            <h4 className="text-sm font-semibold mb-1">Go Pro</h4>
            <p className="text-xs text-neutral-500 mb-3">Get unlimited access to all features.</p>
            <Button size="sm" className="h-11 w-full text-xs">Upgrade</Button>
          </div>
          
          <div className="space-y-1">
            <Link
              to="/app/settings"
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                location.pathname === '/app/settings' 
                  ? 'bg-white/10 text-white' 
                  : 'text-neutral-500 hover:bg-white/5 hover:text-white'
              )}
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-neutral-500 transition-all hover:bg-white/5 hover:text-white"
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
        <header className="z-20 flex h-16 items-center justify-between gap-3 border-b border-white/5 bg-background/50 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-11 w-11 shrink-0 p-0 md:hidden"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex min-w-0 items-center gap-2 rounded-lg border border-transparent px-3 py-1.5 transition-colors hover:border-white/5 hover:bg-white/5">
              <span className="text-sm font-medium">{workspace}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500" />
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-3 sm:gap-4 lg:gap-6">
            <div className="relative hidden md:block group">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500 group-focus-within:text-white transition-colors" />
              <input 
                placeholder="Search anything..." 
                className="w-64 rounded-xl border border-white/5 bg-white/5 py-2 pr-4 pl-10 text-sm transition-all focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
            
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden min-w-0 flex-col items-end sm:flex">
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
