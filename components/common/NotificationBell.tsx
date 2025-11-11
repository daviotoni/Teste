
import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { AppContext } from '../../App';
import * as Icons from './Icons';
import type { Notification, TabKey, ProcessFilter } from '../../types';
import { generateNotifications } from '../../utils';

const ICONS_MAP: { [key in Notification['type']]: React.ReactNode } = {
    prazo: <Icons.Calendar className="w-5 h-5 text-red-500" />,
    evento: <Icons.Bell className="w-5 h-5 text-blue-500" />,
    alerta: <Icons.AlertTriangle className="w-5 h-5 text-orange-500" />,
};


interface NotificationBellProps {
    onNavigate: (tab: TabKey, options?: { filter?: ProcessFilter | null; date?: string | null }) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigate }) => {
    const { data, config, updateConfig, showToast } = useContext(AppContext);
    const { processos = [], calendario = [] } = data;
    const { dismissedNotifications = [] } = config;
    
    const [isOpen, setIsOpen] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);

    const notifications = useMemo(() => {
        return generateNotifications(processos, calendario)
            .filter(n => !dismissedNotifications.includes(n.id));
    }, [processos, calendario, dismissedNotifications]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDismiss = async (id: string) => {
        const newDismissed = [...dismissedNotifications, id];
        await updateConfig('dismissedNotifications', newDismissed);
    };
    
    const handleClearAll = async () => {
        const allCurrentIds = notifications.map(n => n.id);
        const newDismissed = [...new Set([...dismissedNotifications, ...allCurrentIds])];
        await updateConfig('dismissedNotifications', newDismissed);
        showToast('Notificações limpas.', 'info');
    };

    const handleNavigate = (navInfo: Notification['navInfo']) => {
        onNavigate(navInfo.tab, { filter: navInfo.filter, date: navInfo.date });
        setIsOpen(false);
    }

    return (
        <div className="relative" ref={bellRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                <Icons.Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 max-w-sm bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col">
                    <header className="px-4 py-2 border-b dark:border-slate-700 flex justify-between items-center">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100">Notificações</h4>
                        {notifications.length > 0 && (
                            <button onClick={handleClearAll} className="text-xs text-blue-600 hover:underline">Limpar Todas</button>
                        )}
                    </header>
                    <ul className="max-h-96 overflow-y-auto divide-y dark:divide-slate-700">
                        {notifications.length > 0 ? (
                            notifications.map(n => (
                                <li key={n.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 group">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-0.5">{ICONS_MAP[n.type]}</div>
                                        <div onClick={() => handleNavigate(n.navInfo)} className="flex-grow cursor-pointer">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{n.title}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{n.subtitle}</p>
                                        </div>
                                        <button onClick={() => handleDismiss(n.id)} className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-opacity">
                                            <Icons.Close className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </li>
                            ))
                        ) : (
                           <li className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">Nenhuma notificação nova.</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
