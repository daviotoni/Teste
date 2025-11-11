import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../App';
import type { Process, ProcessFilter, Emissor } from '../types';
import * as Icons from './common/Icons';
import Modal from './common/Modal';
import Pagination from './common/Pagination';
import { dbHelper } from '../services/dbService';
import { statusMap, statusColorMap, exportCSV, exportXLSX, ymd, diffDays, parse, todayUTC, fmtBR, SETORES } from '../utils';

const ITEMS_PER_PAGE = 10;

const Processos: React.FC<{ initialFilter: ProcessFilter | null }> = ({ initialFilter }) => {
    const { data, refreshData, showToast } = useContext(AppContext);
    const { processos = [], emissores = [] } = data;

    const [q, setQ] = useState(initialFilter?.text || '');
    const [ord, setOrd] = useState('entrada');
    const [currentPage, setCurrentPage] = useState(1);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProcess, setEditingProcess] = useState<Process | null>(null);

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingProcess, setViewingProcess] = useState<Process | null>(null);

    // State for delete confirmation modal
    const [processToDelete, setProcessToDelete] = useState<Process | null>(null);

    useEffect(() => {
      if (initialFilter) {
          setQ(initialFilter.text || '');
      }
    }, [initialFilter]);

    const filteredAndSortedProcessos = useMemo(() => {
        let L: Process[] = [...processos];
        const t = q.toLowerCase().trim();

        if (t) {
            L = L.filter(p => [p.num, p.int, p.obj, p.setorOrigem, p.acao, statusMap[p.stat]].some(v => String(v || '').toLowerCase().includes(t)));
        }
        if (initialFilter?.status) L = L.filter(p => p.stat === initialFilter.status);
        if (initialFilter?.prazo === 'alerta') L = L.filter(p => {
          const d = parse(p.prazo);
          return d && p.stat !== 'finalizado' && p.stat !== 'arquivado' && diffDays(todayUTC(), d) <= 5 && diffDays(todayUTC(), d) >= 0
        });
        if (initialFilter?.prazo === 'vencido') L = L.filter(p => {
            const d = parse(p.prazo);
            return d && p.stat !== 'finalizado' && p.stat !== 'arquivado' && diffDays(todayUTC(), d) < 0
        });

        if (ord === 'prazo') L.sort((a, b) => { const A = parse(a.prazo), B = parse(b.prazo); return (A ? A.getTime() : Infinity) - (B ? B.getTime() : Infinity); });
        else if (ord === 'status') L.sort((a, b) => (a.stat || '').localeCompare(b.stat || ''));
        else L.sort((a, b) => { const A = parse(a.ent), B = parse(b.ent); return (B ? B.getTime() : 0) - (A ? A.getTime() : 0); });
        
        return L;
    }, [processos, q, ord, initialFilter]);

    const paginatedProcessos = useMemo(() => {
        return filteredAndSortedProcessos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    }, [filteredAndSortedProcessos, currentPage]);

    const totalPages = Math.ceil(filteredAndSortedProcessos.length / ITEMS_PER_PAGE);

    const handleOpenModal = (proc: Process | null = null) => {
        setEditingProcess(proc);
        setIsModalOpen(true);
    };

    const handleOpenViewModal = (proc: Process) => {
        setViewingProcess(proc);
        setIsViewModalOpen(true);
    }
    
    // Opens the delete confirmation modal
    const promptDelete = (proc: Process) => {
        setProcessToDelete(proc);
    };

    // Performs the deletion after user confirmation
    const handleConfirmDelete = async () => {
        if (!processToDelete) return;
        await dbHelper.delete('processos', processToDelete.id);
        await refreshData();
        showToast(`Processo "${processToDelete.num}" foi excluído.`, 'danger');
        setProcessToDelete(null); // Close the modal
    };

    const handleSave = async (procData: Partial<Process>) => {
        const id = procData.id || Date.now();
        const existingProc = processos.find((p: Process) => p.id === id);
        const finalData = { ...existingProc, ...procData, id };
        await dbHelper.put('processos', finalData);
        await refreshData();
        showToast('Processo salvo com sucesso!');
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Gerenciamento de Processos</h2>
            
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                    <input 
                        type="text" 
                        placeholder="Buscar por nº, interessado, objeto…" 
                        className="flex-grow w-full sm:w-auto bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-2 border-transparent focus:border-blue-500 focus:ring-0 rounded-lg px-3 py-2 transition"
                        value={q}
                        onChange={e => { setQ(e.target.value); setCurrentPage(1); }}
                    />
                    <select
                        className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-2 border-transparent focus:border-blue-500 focus:ring-0 rounded-lg px-3 py-2 transition"
                        value={ord}
                        onChange={e => setOrd(e.target.value)}
                    >
                        <option value="entrada">Ordenar por Entrada</option>
                        <option value="prazo">Ordenar por Prazo</option>
                        <option value="status">Ordenar por Status</option>
                    </select>
                    <div className="flex-grow flex justify-end gap-2">
                        <button onClick={() => exportCSV(filteredAndSortedProcessos, showToast)} className="px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition">Exportar CSV</button>
                        <button onClick={() => exportXLSX(filteredAndSortedProcessos, showToast)} className="px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition">Exportar Excel</button>
                        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition">
                            <Icons.Plus className="w-4 h-4" /> Adicionar Processo
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">Nº Processo / Interessado</th>
                            <th scope="col" className="px-6 py-3">Objeto</th>
                            <th scope="col" className="px-6 py-3 text-center">Status</th>
                            <th scope="col" className="px-6 py-3 text-center">Prazo</th>
                            <th scope="col" className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedProcessos.map((p: Process) => (
                            <tr key={p.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/20">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                    {p.num}<br/><span className="font-normal text-slate-500 dark:text-slate-400">{p.int}</span>
                                </td>
                                <td className="px-6 py-4 max-w-sm truncate">{p.obj}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColorMap[p.stat]}`}>{statusMap[p.stat]}</span>
                                </td>
                                <td className="px-6 py-4 text-center">{fmtBR(p.prazo)}</td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center items-center gap-2">
                                        <button onClick={() => handleOpenViewModal(p)} className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"><Icons.Eye className="w-5 h-5"/></button>
                                        <button onClick={() => handleOpenModal(p)} className="p-1.5 text-slate-500 hover:text-green-600 dark:text-slate-400 dark:hover:text-green-400"><Icons.Edit className="w-5 h-5"/></button>
                                        <button onClick={() => promptDelete(p)} className="p-1.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"><Icons.Trash className="w-5 h-5"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {paginatedProcessos.length === 0 && <p className="text-center p-8 text-slate-500">Nenhum processo encontrado.</p>}
            </div>

            {/* Mobile Cards */}
            <div className="grid md:hidden gap-4">
                {paginatedProcessos.map((p: Process) => (
                    <div key={p.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-100">{p.num}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">{p.int}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColorMap[p.stat]}`}>{statusMap[p.stat]}</span>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Objeto</p>
                            <p className="text-sm text-slate-700 dark:text-slate-200 truncate">{p.obj}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Prazo</p>
                            <p className="text-sm text-slate-700 dark:text-slate-200">{fmtBR(p.prazo)}</p>
                        </div>
                         <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                            <button onClick={() => handleOpenViewModal(p)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md">Ver</button>
                            <button onClick={() => handleOpenModal(p)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md">Editar</button>
                            <button onClick={() => promptDelete(p)} className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60 rounded-md">Excluir</button>
                        </div>
                    </div>
                ))}
                 {paginatedProcessos.length === 0 && <p className="text-center p-8 text-slate-500">Nenhum processo encontrado.</p>}
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

            {isModalOpen && (
                <ProcessFormModal
                    process={editingProcess}
                    emissores={emissores}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}
            {isViewModalOpen && viewingProcess && (
                <ProcessViewModal
                    process={viewingProcess}
                    onClose={() => setIsViewModalOpen(false)}
                />
            )}
            {processToDelete && (
                <Modal
                    isOpen={!!processToDelete}
                    onClose={() => setProcessToDelete(null)}
                    title="Confirmar Exclusão"
                    maxWidth="max-w-md"
                >
                    <div>
                        <p className="text-slate-600 dark:text-slate-300">
                            Você tem certeza que deseja excluir o processo{" "}
                            <strong className="text-slate-800 dark:text-slate-100">{processToDelete.num}</strong>?
                            <br />
                            Esta ação não pode ser desfeita.
                        </p>
                    </div>
                    <div className="flex justify-end items-center gap-3 pt-4 mt-4">
                        <button
                            type="button"
                            onClick={() => setProcessToDelete(null)}
                            className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmDelete}
                            className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                            Excluir Processo
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// Process Form Modal Component
interface ProcessFormProps {
    process: Process | null;
    emissores: Emissor[];
    onClose: () => void;
    onSave: (data: Partial<Process>) => void;
}

const ProcessFormModal: React.FC<ProcessFormProps> = ({ process, emissores, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Process>>({
        tipo: 'administrativo',
        stat: 'pendente',
        ent: ymd(new Date()),
        ...process
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen title={process ? "Editar Processo" : "Adicionar Processo"} onClose={onClose} maxWidth="max-w-4xl">
            <form onSubmit={handleSubmit}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group"><label>Nº do Processo</label><input name="num" value={formData.num || ''} onChange={handleChange} required /></div>
                    <div className="form-group"><label>Tipo</label><select name="tipo" value={formData.tipo} onChange={handleChange}><option value="administrativo">Administrativo</option><option value="judicial">Judicial</option></select></div>
                    <div className="md:col-span-2 form-group"><label>Interessado</label><input name="int" value={formData.int || ''} onChange={handleChange} required /></div>
                    <div className="form-group"><label>Setor de Origem</label><select name="setorOrigem" value={formData.setorOrigem} onChange={handleChange}>{SETORES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                    <div className="form-group"><label>Setor Enviado</label><select name="dest" value={formData.dest} onChange={handleChange}>{SETORES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                    <div className="md:col-span-2 form-group"><label>Objeto</label><textarea name="obj" value={formData.obj || ''} onChange={handleChange} required /></div>
                    <div className="md:col-span-2 form-group"><label>Ação Tomada</label><textarea name="acao" value={formData.acao || ''} onChange={handleChange} /></div>
                </div>
                 <fieldset className="mt-4 border-t pt-4 border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="form-group"><label>Entrada</label><input name="ent" type="date" value={formData.ent || ''} onChange={handleChange} required /></div>
                        <div className="form-group"><label>Prazo Final</label><input name="prazo" type="date" value={formData.prazo || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Saída</label><input name="saida" type="date" value={formData.saida || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Status</label><select name="stat" value={formData.stat} onChange={handleChange}>{Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                        <div className="md:col-span-2 form-group"><label>Emissor da Ficha</label><select name="emissorId" value={formData.emissorId || ''} onChange={handleChange}><option value="">Usuário Logado</option>{emissores.map((e: Emissor) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
                    </div>
                 </fieldset>

                 <style>{`
                    .form-group > label { display: block; font-weight: 500; color: #475569; margin-bottom: 0.5rem; font-size: 0.875rem; }
                    .dark .form-group > label { color: #cbd5e1; }
                    .form-group > input, .form-group > textarea, .form-group > select { width: 100%; background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.5rem 0.75rem; }
                    .dark .form-group > input, .dark .form-group > textarea, .dark .form-group > select { background-color: #334155; border-color: #475569; }
                 `}</style>
                 <div className="flex justify-end items-center gap-3 pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg">Cancelar</button>
                    <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Salvar</button>
                </div>
            </form>
        </Modal>
    );
};

// Process View Modal Component
const ProcessViewModal: React.FC<{ process: Process; onClose: () => void }> = ({ process, onClose }) => {
    
    const ViewItem: React.FC<{ label: string, value: React.ReactNode, fullWidth?: boolean }> = ({ label, value, fullWidth }) => (
        <div className={fullWidth ? 'md:col-span-2' : ''}>
            <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">{label}</strong>
            <p className="text-slate-800 dark:text-slate-200">{value || '—'}</p>
        </div>
    );

    const diasTramitacao = process.ent ? `${diffDays(parse(process.ent)!, parse(process.saida) || todayUTC())} dia(s)` : '—';

    return (
        <Modal isOpen title={`Detalhes: ${process.num}`} onClose={onClose} maxWidth="max-w-3xl">
            <div className="space-y-6">
                <section>
                    <h4 className="font-bold text-blue-600 mb-2">Identificação</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ViewItem label="Nº Processo" value={process.num} />
                        <ViewItem label="Tipo" value={process.tipo === 'administrativo' ? 'Administrativo' : 'Judicial'} />
                        <ViewItem label="Interessado" value={process.int} fullWidth />
                        <ViewItem label="Objeto" value={process.obj} fullWidth />
                        <ViewItem label="Ação Tomada" value={process.acao} fullWidth />
                    </div>
                </section>
                <section>
                    <h4 className="font-bold text-blue-600 mb-2">Tramitação e Parecer</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <ViewItem label="Status" value={<span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusColorMap[process.stat]}`}>{statusMap[process.stat]}</span>} />
                        <ViewItem label="Prazo Final" value={fmtBR(process.prazo)} />
                        <ViewItem label="Dias de Tramitação" value={diasTramitacao} />
                        <ViewItem label="Setor de Origem" value={process.setorOrigem} />
                        <ViewItem label="Setor Enviado" value={process.dest} />
                        <ViewItem label="Data de Entrada" value={fmtBR(process.ent)} />
                        <ViewItem label="Data de Saída" value={fmtBR(process.saida)} />
                     </div>
                </section>
            </div>
        </Modal>
    );
};

export default Processos;