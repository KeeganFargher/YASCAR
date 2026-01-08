import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { LogPage } from './pages/LogPage';
import { Layout } from './components/Layout';
import { SetupWizard } from './components/SetupWizard';
import { useAppStore, selectIsAuthenticated, selectIsAuthLoading } from './stores/useAppStore';
import { hasCompletedSetup } from './lib/store';
import { ShiftSession } from '@yascar/shift-client';

import { useAutoRedeem } from './hooks/useAutoRedeem';
import { useUpdater } from './hooks/useUpdater';

function App() {
  const isAuthenticated = useAppStore(selectIsAuthenticated);
  const isAuthLoading = useAppStore(selectIsAuthLoading);
  const initSession = useAppStore(state => state.initSession);
  const login = useAppStore(state => state.login);
  const logout = useAppStore(state => state.logout);

  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);

  // Activate auto-redeem background service
  useAutoRedeem();

  // Check for updates on startup
  useUpdater();

  useEffect(() => {
    initSession();
    // Check setup status
    hasCompletedSetup().then(setIsSetupComplete);
  }, [initSession]);

  const handleLogin = async (session: ShiftSession) => {
    await login(session);
    // Re-check setup status after login
    const completed = await hasCompletedSetup();
    setIsSetupComplete(completed);
  };

  const handleLogout = async () => {
    await logout();
    setIsSetupComplete(false);
  };

  if (isAuthLoading || isSetupComplete === null) {
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

  if (!isSetupComplete) {
    return <SetupWizard onComplete={() => setIsSetupComplete(true)} />;
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

