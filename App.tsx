
import React, { useState, useEffect, createContext, useCallback, useMemo } from 'react';
import type { User, ToastData, Theme, TabKey, ProcessFilter } from './types';
import { dbHelper } from './services/dbService';
import { authService } from './services/authService';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Processos from './components/Processos';
import Calendario from './components/Calendario';
import Documentos from './components/Documentos';
import Leis from './components/Leis';
import Configuracoes from './components/Configuracoes';
import ToastContainer from './components/common/ToastContainer';

// --- CONTEXT DEFINITIONS ---

export const AppContext = createContext<{
  user: User | null;
  logout: () => void;
  showToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  data: any; // Simplified for brevity, in a real app would be strongly typed
  refreshData: () => Promise<void>;
  config: any; // App-wide config
  updateConfig: (key: string, value: any) => Promise<void>;
}>({
  user: null,
  logout: () => {},
  showToast: () => {},
  theme: 'system',
  setTheme: () => {},
  data: {},
  refreshData: async () => {},
  config: {},
  updateConfig: async () => {},
});

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(authService.getLoggedInUser());
  const [isDbReady, setIsDbReady] = useState(false);
  const [data, setData] = useState<any>({});
  const [config, setConfig] = useState<any>({});
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [theme, setThemeState] = useState<Theme>('system');
  const [filter, setFilter] = useState<ProcessFilter | null>(null);
  const [calendarDate, setCalendarDate] = useState<string | null>(null);

  const applyTheme = useCallback((themeValue: Theme) => {
    let finalTheme = themeValue;
    if (themeValue === 'system') {
      finalTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.classList.toggle('dark', finalTheme === 'dark');
  }, []);

  const loadConfig = useCallback(async () => {
    // FIX: Explicitly type the result from dbHelper.get to ensure it's an object that can be spread.
    const savedConfig = (await dbHelper.get<{[key: string]: any}>('config', 'app_config')) || {};
    const defaultConfig = { theme: 'system', dismissedNotifications: [] };
    const mergedConfig = { ...defaultConfig, ...savedConfig };
    setConfig(mergedConfig);
    // FIX: Explicitly cast the theme from the merged config to the 'Theme' type.
    // This resolves type errors where a general 'string' from the untyped config object
    // was being passed to functions expecting the specific 'light' | 'dark' | 'system' literal type.
    setThemeState(mergedConfig.theme as Theme);
    applyTheme(mergedConfig.theme as Theme);
  }, [applyTheme]);
  
  const updateConfig = async (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    await dbHelper.put('config', { key: 'app_config', ...newConfig });
  };


  useEffect(() => {
    const initializeApp = async () => {
      await dbHelper.init();
      await authService.initializeDefaultUser();
      await loadConfig();
      setIsDbReady(true);
      if (authService.getLoggedInUser()) {
        await refreshData();
      }
    };
    initializeApp();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []); // Removed dependencies to run only once

  const refreshData = useCallback(async () => {
    if (!isDbReady) return;
    const allData = {
      users: await dbHelper.getAll('users'),
      processos: await dbHelper.getAll('processos'),
      calendario: await dbHelper.getAll('calendario'),
      documentos: await dbHelper.getAll('documentos'),
      versoes: await dbHelper.getAll('versoes'),
      modelos: await dbHelper.getAll('modelos'),
      emissores: await dbHelper.getAll('emissores'),
      leis: await dbHelper.getAll('leis'),
    };
    setData(allData);
  }, [isDbReady]);

  useEffect(() => {
    if (user && isDbReady) {
      refreshData();
    }
  }, [user, isDbReady, refreshData]);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    if (sessionStorage.getItem('showResetToast')) {
        showToast("Banco de usuários atualizado. Login: admin/admin.", "info");
        sessionStorage.removeItem('showResetToast');
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setData({});
  };

  const showToast = (message: string, type: 'success' | 'danger' | 'info' = 'success') => {
    setToasts((prev) => [...prev, { id: Date.now(), message, type }]);
  };

  const handleSetTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    await updateConfig('theme', newTheme);
  };
  
  const handleNavigate = (tab: TabKey, options: { filter?: ProcessFilter | null; date?: string | null } = {}) => {
    setActiveTab(tab);
    setFilter(options.filter || null);
    setCalendarDate(options.date || null);
  };
  
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={handleNavigate} />;
      case 'proc': return <Processos initialFilter={filter} />;
      case 'cal': return <Calendario initialDate={calendarDate} />;
      case 'docs': return <Documentos />;
      case 'leis': return <Leis />;
      case 'cfg': return <Configuracoes />;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  const contextValue = useMemo(() => ({
    user,
    logout,
    showToast,
    theme,
    setTheme: handleSetTheme,
    data,
    refreshData,
    config,
    updateConfig,
  }), [user, theme, data, refreshData, logout, config]);


  if (!isDbReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
        Carregando JurisControl...
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      {!user ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Layout activeTab={activeTab} setActiveTab={handleNavigate}>
          {renderActiveTab()}
        </Layout>
      )}
      <ToastContainer toasts={toasts} setToasts={setToasts} />
    </AppContext.Provider>
  );
};

export default App;
