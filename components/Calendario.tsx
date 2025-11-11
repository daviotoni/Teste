import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from '../App';
import type { CalendarEvent, Process } from '../types';
import * as Icons from './common/Icons';
import Modal from './common/Modal';
import { dbHelper } from '../services/dbService';
import { ymd, parse, todayUTC } from '../utils';


const EVENT_CATEGORIES: { [key in CalendarEvent['cat']]: { label: string; color: string; } } = {
  g: { label: 'Geral', color: 'bg-sky-500' },
  a: { label: 'Audiência', color: 'bg-purple-500' },
  r: { label: 'Reunião', color: 'bg-green-500' },
  p: { label: 'Término de Prazo', color: 'bg-red-600' },
  u: { label: 'Urgente', color: 'bg-orange-500' },
  e: { label: 'Escritório', color: 'bg-slate-500' },
  o: { label: 'OAB', color: 'bg-yellow-500' },
};

const Calendario: React.FC<{ initialDate: string | null }> = ({ initialDate }) => {
    const { data, refreshData, showToast } = useContext(AppContext);
    const { processos = [], calendario = [] } = data;
    
    const [currentDate, setCurrentDate] = useState(initialDate ? parse(initialDate) || new Date() : new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Partial<CalendarEvent> | null>(null);

    const [filters, setFilters] = useState<{[key: string]: boolean}>({
        g: true, a: true, r: true, u: true, e: true, o: true, process_prazo: true
    });

    useEffect(() => {
        if (initialDate) {
            setCurrentDate(parse(initialDate) || new Date());
        }
    }, [initialDate]);


    const combinedEvents = useMemo(() => {
        const calendarEvents: CalendarEvent[] = calendario.filter((e: CalendarEvent) => filters[e.cat]);
        const processPrazos: CalendarEvent[] = filters.process_prazo ? processos
            .filter((p: Process) => p.prazo && p.stat !== 'finalizado' && p.stat !== 'arquivado')
            .map((p: Process) => ({
                id: `proc-${p.id}`,
                data: p.prazo!,
                hora: '',
                desc: `Prazo: ${p.num}`,
                cat: 'p',
                readonly: true,
            })) : [];
        
        return [...calendarEvents, ...processPrazos];
    }, [calendario, processos, filters]);

    const handleFilterChange = (key: string) => {
        setFilters(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePrevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    const handleToday = () => setCurrentDate(new Date());

    const openEventModal = (event: Partial<CalendarEvent> | null) => {
        if (event?.readonly) return;
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    const handleSaveEvent = async (eventData: Partial<CalendarEvent>) => {
        if (!eventData.desc || !eventData.data) {
            showToast('Descrição e data são obrigatórias.', 'danger');
            return;
        }
        const id = eventData.id || Date.now();
        await dbHelper.put('calendario', { ...eventData, id });
        await refreshData();
        showToast('Compromisso salvo com sucesso!');
        setIsModalOpen(false);
    };
    
    const handleDeleteEvent = async (id: number | string) => {
        if (typeof id === 'string' && id.startsWith('proc-')) return; // Cannot delete process deadlines
        if (window.confirm('Tem certeza que deseja excluir este compromisso?')) {
            await dbHelper.delete('calendario', id);
            await refreshData();
            showToast('Compromisso excluído.', 'danger');
            setIsModalOpen(false);
        }
    };

    const monthGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const grid: { date: Date, isCurrentMonth: boolean, events: CalendarEvent[] }[] = [];
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dateString = ymd(date);
            grid.push({
                date,
                isCurrentMonth: date.getMonth() === month,
                events: combinedEvents.filter((e: CalendarEvent) => e.data === dateString)
            });
        }
        return grid;
    }, [currentDate, combinedEvents]);


    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                 <div className="flex items-center gap-2">
                    <button onClick={handleToday} className="px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition">Hoje</button>
                    <button onClick={handlePrevMonth} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"><Icons.ChevronLeft className="w-5 h-5"/></button>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 w-48 text-center capitalize">
                        {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={handleNextMonth} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"><Icons.ChevronRight className="w-5 h-5"/></button>
                </div>
                <button onClick={() => openEventModal({data: ymd(todayUTC()), cat:'g', hora: ''})} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition">
                    <Icons.Plus className="w-4 h-4" /> Novo Compromisso
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-2">
                    <div className="grid grid-cols-7 text-center font-bold text-xs text-slate-500 dark:text-slate-400 border-b dark:border-slate-700 mb-1">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day} className="py-2">{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7">
                        {monthGrid.map(({ date, isCurrentMonth, events }, index) => (
                            <div key={index} onDoubleClick={() => openEventModal({ data: ymd(date), cat: 'g', hora: '' })} className={`h-28 border border-transparent hover:border-blue-300 dark:hover:border-blue-700 transition-colors p-1.5 flex flex-col ${isCurrentMonth ? '' : 'text-slate-400 dark:text-slate-600'}`}>
                                <span className={`self-end text-sm font-semibold ${ymd(date) === ymd(todayUTC()) ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
                                    {date.getDate()}
                                </span>
                                <div className="mt-1 space-y-1 overflow-y-auto text-xs">
                                    {events.map(e => (
                                        <div key={e.id} onClick={() => openEventModal(e)} className={`p-1 rounded text-white truncate cursor-pointer ${EVENT_CATEGORIES[e.cat].color}`}>
                                            {e.desc}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4">
                        <h3 className="font-bold text-lg mb-2">Filtros</h3>
                        <div className="space-y-2">
                            {Object.entries(EVENT_CATEGORIES).filter(([key]) => key !== 'p').map(([key, {label}]) => (
                                <label key={key} className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={filters[key]} onChange={() => handleFilterChange(key)} /> {label}
                                </label>
                            ))}
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={filters['process_prazo']} onChange={() => handleFilterChange('process_prazo')} /> Mostrar prazos dos processos
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <EventFormModal 
                    event={selectedEvent}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveEvent}
                    onDelete={handleDeleteEvent}
                />
            )}
        </div>
    );
};

const EventFormModal: React.FC<{event: Partial<CalendarEvent> | null; onClose: () => void; onSave: (event: Partial<CalendarEvent>) => void; onDelete: (id: number | string) => void;}> = ({ event, onClose, onSave, onDelete }) => {
    const [formData, setFormData] = useState(event);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData!);
    };
    
    return (
        <Modal isOpen title={event?.id ? "Editar Compromisso" : "Novo Compromisso"} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="form-group"><label>Data</label><input name="data" type="date" value={formData?.data || ''} onChange={handleChange} required /></div>
                    <div className="form-group"><label>Hora (opcional)</label><input name="hora" type="time" value={formData?.hora || ''} onChange={handleChange} /></div>
                </div>
                <div className="form-group"><label>Descrição</label><textarea name="desc" value={formData?.desc || ''} onChange={handleChange} required /></div>
                <div className="form-group"><label>Categoria</label><select name="cat" value={formData?.cat || 'g'} onChange={handleChange}>{Object.entries(EVENT_CATEGORIES).filter(([k]) => k !== 'p').map(([key, {label}]) => <option key={key} value={key}>{label}</option>)}</select></div>
                <div className="flex justify-between items-center pt-4 mt-4 border-t dark:border-slate-700">
                     <div>
                        {event?.id && <button type="button" onClick={() => onDelete(event.id!)} className="px-4 py-2 text-sm font-bold text-red-600 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60 rounded-lg transition-colors">Excluir</button>}
                     </div>
                     <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors">Cancelar</button>
                        <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Salvar</button>
                    </div>
                </div>
            </form>
             <style>{`
                .form-group > label { display: block; font-weight: 500; color: #475569; margin-bottom: 0.5rem; font-size: 0.875rem; }
                .dark .form-group > label { color: #cbd5e1; }
                .form-group > input, .form-group > textarea, .form-group > select { width: 100%; background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.5rem 0.75rem; }
                .dark .form-group > input, .dark .form-group > textarea, .dark .form-group > select { background-color: #334155; border-color: #475569; }
            `}</style>
        </Modal>
    );
}

export default Calendario;