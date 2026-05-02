import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import AboutPage from './pages/AboutPage';
import DashboardLayout from './components/layout/DashboardLayout';
import ChatWorkspace from './pages/ChatWorkspace';
import NotesWorkspace from './pages/NotesWorkspace';
import MemoryPage from './pages/MemoryPage';
import TasksPage from './pages/TasksPage';
import SettingsPage from './pages/SettingsPage';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/about" element={<AboutPage />} />
        
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/app/chat" replace />} />
          <Route path="chat" element={<ChatWorkspace />} />
          <Route path="notes" element={<NotesWorkspace />} />
          <Route path="memory" element={<MemoryPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
