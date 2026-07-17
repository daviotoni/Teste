import React, { useState, useEffect, createContext, useCallback, useMemo } from 'react';
import type { User, ToastData, Theme, TabKey, ProcessFilter } from './types';
import { dbHelper } from './services/dbService';
import { isAuthConfigured, getAccessToken, onAuthChange } from './services/supabaseAuth';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Processos from './components/Processos';
import Calendario from './components/Calendario';
import Documentos from './components/Documentos';
import Leis from './components/Leis';
import Configuracoes from './components/Configuracoes';
import ToastContainer from './components/common/ToastContainer';
import InstitutionalApp from './components/InstitutionalApp';

// Usuário fixo do modo demonstração local. NÃO é uma identidade institucional:
// não há senha, não há acesso ao banco central, apenas IndexedDB deste navegador.
const DEMO_USER: User = { id: 0, name: 'Demonstração Local', login: 'demo', role: 'user' };

export const AppContext = createContext<{
  user: User | null;
  logout: () => void;
  showToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  data: any;
  refreshData: () => Promise<void>;
  config: any;
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

type View = 'loading' | 'login' | 'institutional' | 'legacy';

const App: React.FC = () => {
  const [view, setView] = useState<View>('loading');

  // Verifica sessão institucional ativa (Supabase Auth) ao iniciar.
  useEffect(() => {
    let active = true;
    const check = async () => {
      if (isAuthConfigured()) {
        const token = await getAccessToken();
        if (active) setView(token ? 'institutional' : 'login');
      } else if (active) {
        setView('login');
      }
    };
    void check();
    const unsub = onAuthChange((signedIn) => {
      setView((current) => (current === 'legacy' ? current : signedIn ? 'institutional' : 'login'));
    });
    return () => { active = false; unsub(); };
  }, []);

  if (view === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
        Carregando SIGLA-CMDC...
      </div>
    );
  }

  if (view === 'institutional') {
    return <InstitutionalApp onSignOut={() => setView('login')} />;
  }

  if (view === 'legacy') {
    return <LegacyDemoApp onExit={() => setView('login')} />;
  }

  return (
    <Login
      onInstitutionalSignedIn={() => setView('institutional')}
      onEnterLegacyDemo={() => setView('legacy')}
    />
  );
};

// --- MODO DEMONSTRAÇÃO LOCAL (LEGADO) ---------------------------------------
// Componentes legados baseados em IndexedDB, isolados como demonstração e sem
// acesso ao banco institucional. Banner permanente deixa a limitação explícita.
const LegacyDemoApp: React.FC<{ onExit: () => void }> = ({ onExit }) => {
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
    const savedConfig = (await dbHelper.get<{ [key: string]: any }>('config', 'app_config')) || {};
    const defaultConfig = { theme: 'system', dismissedNotifications: [] };
    const mergedConfig = { ...defaultConfig, ...savedConfig };
    setConfig(mergedConfig);
    setThemeState(mergedConfig.theme as Theme);
    applyTheme(mergedConfig.theme as Theme);
  }, [applyTheme]);

  const updateConfig = async (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    await dbHelper.put('config', { key: 'app_config', ...newConfig });
  };

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
    const initializeApp = async () => {
      await dbHelper.init();
      await loadConfig();
      setIsDbReady(true);
    };
    void initializeApp();
  }, [loadConfig]);

  useEffect(() => {
    if (isDbReady) void refreshData();
  }, [isDbReady, refreshData]);

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
    user: DEMO_USER,
    logout: onExit,
    showToast,
    theme,
    setTheme: handleSetTheme,
    data,
    refreshData,
    config,
    updateConfig,
  }), [theme, data, refreshData, config]);

  if (!isDbReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
        Carregando demonstração local...
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className="bg-amber-500 text-amber-950 text-sm font-medium text-center px-4 py-2">
        Dados exibidos no modo legado local não estão centralizados e não devem ser usados para atividade institucional.
      </div>
      <Layout activeTab={activeTab} setActiveTab={handleNavigate}>
        {renderActiveTab()}
      </Layout>
      <ToastContainer toasts={toasts} setToasts={setToasts} />
    </AppContext.Provider>
  );
};

export default App;
