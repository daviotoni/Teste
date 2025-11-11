
import React, { useState, useContext, useRef, useEffect } from 'react';
import type { TabKey, ProcessFilter } from '../types';
import { AppContext } from '../App';
import * as Icons from './common/Icons';
import NotificationBell from './common/NotificationBell';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: TabKey;
  setActiveTab: (tab: TabKey, options?: { filter?: ProcessFilter | null, date?: string | null }) => void;
}

const ThemeMenu: React.FC = () => {
    const { theme, setTheme } = useContext(AppContext);
    return (
        <>
            <button onClick={() => setTheme('light')} className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 ${theme === 'light' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>
                <Icons.Sun className="w-5 h-5" /> Tema Claro
            </button>
            <button onClick={() => setTheme('dark')} className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 ${theme === 'dark' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>
                <Icons.Moon className="w-5 h-5" /> Tema Escuro
            </button>
            <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
            <button onClick={() => setTheme('system')} className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 ${theme === 'system' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>
                <Icons.System className="w-5 h-5" /> Padrão do Dispositivo
            </button>
        </>
    );
};


const NavItem: React.FC<{ tabKey: TabKey; label: string; icon: React.ReactNode; activeTab: TabKey; onClick: (tabKey: TabKey) => void }> = ({ tabKey, label, icon, activeTab, onClick }) => {
    const isActive = activeTab === tabKey;
    return (
        <li>
            <a
                href="#"
                onClick={(e) => { e.preventDefault(); onClick(tabKey); }}
                className={`relative flex items-center gap-2 px-4 h-full font-semibold transition-colors duration-200 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'}`}
            >
                {icon}
                <span className="hidden lg:inline">{label}</span>
                {isActive && <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"></span>}
            </a>
        </li>
    );
};


const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
    const { user, logout } = useContext(AppContext);
    const [isScrolled, setIsScrolled] = useState(false);
    const [themeMenuOpen, setThemeMenuOpen] = useState(false);
    const themeMenuRef = useRef<HTMLDivElement>(null);

    const mainContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const mainEl = mainContentRef.current;
        if (!mainEl) return;
        const handleScroll = () => setIsScrolled(mainEl.scrollTop > 8);
        mainEl.addEventListener('scroll', handleScroll, { passive: true });
        return () => mainEl.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
                setThemeMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navItems: { tabKey: TabKey, label: string, icon: React.ReactNode }[] = [
        { tabKey: 'dashboard', label: 'Dashboard', icon: <Icons.Dashboard /> },
        { tabKey: 'proc', label: 'Processos', icon: <Icons.Folder /> },
        { tabKey: 'cal', label: 'Calendário', icon: <Icons.Calendar /> },
        { tabKey: 'docs', label: 'Documentos', icon: <Icons.Document /> },
        { tabKey: 'leis', label: 'Leis', icon: <Icons.Scale /> },
        { tabKey: 'cfg', label: 'Configurações', icon: <Icons.Settings /> },
    ];

    return (
        <div className="flex flex-col h-screen">
            <header className={`sticky top-0 z-40 w-full backdrop-blur transition-all duration-300 ${isScrolled ? 'h-14 shadow-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800' : 'h-16 bg-white/50 dark:bg-slate-900/50'}`}>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-full">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                            <h1 className="text-xl font-bold text-blue-600">JurisControl</h1>
                            <p className="text-xs text-slate-500 -mt-1">Procuradoria Geral</p>
                        </div>
                        <nav className="hidden md:block">
                            <ul className="flex items-center h-full">
                                {navItems.map(item => <NavItem key={item.tabKey} {...item} activeTab={activeTab} onClick={setActiveTab} />)}
                            </ul>
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline text-sm font-medium text-slate-700 dark:text-slate-200">
                            Bem-vindo, {user?.name.split(' ')[0]}
                        </span>
                        
                        <div className="relative" ref={themeMenuRef}>
                            <button onClick={() => setThemeMenuOpen(!themeMenuOpen)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                                <Icons.Sun className="w-5 h-5 block dark:hidden" />
                                <Icons.Moon className="w-5 h-5 hidden dark:block" />
                            </button>
                            {themeMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-52 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                                    <ThemeMenu />
                                </div>
                            )}
                        </div>
                        <NotificationBell onNavigate={setActiveTab} />
                        <button onClick={logout} className="px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition">
                            Sair
                        </button>
                    </div>
                </div>
            </header>
            <main ref={mainContentRef} className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
