import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { LogPage } from './pages/LogPage';
import { Layout } from './components/Layout';
import { loadSession, clearSession, saveSession } from './lib/store';
import { setClientSession, ShiftSession } from './lib/shift';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = await loadSession();
      if (session) {
        setClientSession(session);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (session: ShiftSession) => {
    try {
      await saveSession(session);
      setClientSession(session);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await clearSession();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bl-black flex items-center justify-center">
        <div className="text-bl-yellow text-2xl font-display animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Layout onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/log" element={<LogPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
