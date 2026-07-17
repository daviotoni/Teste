import React, { useCallback, useEffect, useState } from 'react';
import { api, ApiError, newIdempotencyKey } from '../services/apiClient';
import type {
  MeResponse,
  UnitInbox as UnitInboxData,
  OrganizationalUnit,
  ProcessSummary,
  MovementItem,
} from '../services/apiTypes';

// Caixa da unidade: primeira tela institucional. Consome exclusivamente a API
// `/api/v1` (nunca dbService/IndexedDB). Usa UUIDs, respeita o usuário
// autenticado e possui estados de carregamento, erro e vazio. Responsiva e pt-BR.

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Rascunho', OPEN: 'Aberto', RECEIVED: 'Recebido', ASSIGNED: 'Distribuído',
  IN_ANALYSIS: 'Em análise', IN_DILIGENCE: 'Em diligência',
  AWAITING_DOCUMENTATION: 'Aguardando documentação', SUSPENDED: 'Suspenso',
  COMPLETED: 'Concluído', ARCHIVED: 'Arquivado', CANCELLED: 'Cancelado',
};

// Tipos de processo do seed institucional (0001).
const PROCESS_TYPES: { code: string; label: string }[] = [
  { code: 'ADMINISTRATIVE_PROCESS', label: 'Processo administrativo' },
  { code: 'LEGISLATIVE_PROCESS', label: 'Processo legislativo' },
  { code: 'INTERNAL_REQUEST', label: 'Solicitação interna' },
  { code: 'TECHNICAL_ANALYSIS', label: 'Análise técnica' },
  { code: 'DILIGENCE', label: 'Diligência' },
];

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const Spinner: React.FC = () => (
  <div className="flex items-center justify-center py-16 text-slate-500 dark:text-slate-400">
    <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
    Carregando...
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
    {STATUS_LABEL[status] ?? status}
  </span>
);

const Section: React.FC<{ title: string; count: number; children: React.ReactNode }> = ({ title, count, children }) => (
  <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 sm:p-5">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-full px-2 py-0.5">
        {count}
      </span>
    </div>
    {count === 0 ? (
      <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">Nenhum item.</p>
    ) : (
      children
    )}
  </section>
);

const ProcessRow: React.FC<{ p: ProcessSummary; onOpen: (id: string) => void }> = ({ p, onOpen }) => (
  <button
    onClick={() => onOpen(p.id)}
    className="w-full text-left py-2 px-2 -mx-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition flex items-center justify-between gap-2"
  >
    <span className="min-w-0">
      <span className="block text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{p.subject}</span>
      <span className="block text-xs text-slate-500 dark:text-slate-400">{p.number ?? 'sem número'}</span>
    </span>
    <StatusBadge status={p.status} />
  </button>
);

const NewProcessModal: React.FC<{
  units: OrganizationalUnit[];
  onClose: () => void;
  onCreated: () => void;
}> = ({ units, onClose, onCreated }) => {
  const [subject, setSubject] = useState('');
  const [processTypeCode, setProcessTypeCode] = useState(PROCESS_TYPES[0].code);
  const [originUnitId, setOriginUnitId] = useState(units[0]?.id ?? '');
  const [responsibleUnitId, setResponsibleUnitId] = useState(units[0]?.id ?? '');
  const [priority, setPriority] = useState('NORMAL');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post('/processes', { subject, processTypeCode, originUnitId, responsibleUnitId, priority }, newIdempotencyKey());
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar processo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl space-y-4"
      >
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Novo processo</h3>
        <label className="block">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Assunto</span>
          <input
            required minLength={3} value={subject} onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Tipo</span>
          <select value={processTypeCode} onChange={(e) => setProcessTypeCode(e.target.value)}
            className="mt-1 w-full bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100">
            {PROCESS_TYPES.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Unidade de origem</span>
            <select value={originUnitId} onChange={(e) => setOriginUnitId(e.target.value)}
              className="mt-1 w-full bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100">
              {units.map((u) => <option key={u.id} value={u.id}>{u.officialName}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Unidade responsável</span>
            <select value={responsibleUnitId} onChange={(e) => setResponsibleUnitId(e.target.value)}
              className="mt-1 w-full bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100">
              {units.map((u) => <option key={u.id} value={u.id}>{u.officialName}</option>)}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Prioridade</span>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}
            className="mt-1 w-full bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100">
            <option value="LOW">Baixa</option><option value="NORMAL">Normal</option>
            <option value="HIGH">Alta</option><option value="URGENT">Urgente</option>
          </select>
        </label>
        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium">Cancelar</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50">
            {saving ? 'Criando...' : 'Criar processo'}
          </button>
        </div>
      </form>
    </div>
  );
};

const ProcessDetail: React.FC<{ id: string; onClose: () => void }> = ({ id, onClose }) => {
  const [data, setData] = useState<(ProcessSummary & { movements: MovementItem[] }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .get<ProcessSummary & { movements: MovementItem[] }>(`/processes/${id}`)
      .then((d) => active && setData(d))
      .catch((e) => active && setError(e instanceof ApiError ? e.message : 'Erro ao carregar.'));
    return () => { active = false; };
  }, [id]);

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-slate-800 h-full overflow-y-auto p-6 shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Processo</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">×</button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!data && !error && <Spinner />}
        {data && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{data.number ?? 'sem número'}</p>
              <p className="font-medium text-slate-800 dark:text-slate-100">{data.subject}</p>
              <div className="mt-1"><StatusBadge status={data.status} /></div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Histórico de movimentações</h4>
              {data.movements.length === 0 ? (
                <p className="text-sm text-slate-400">Sem movimentações.</p>
              ) : (
                <ol className="space-y-2">
                  {data.movements.map((m) => (
                    <li key={m.id} className="border-l-2 border-blue-500 pl-3 py-1">
                      <p className="text-sm text-slate-700 dark:text-slate-200">
                        <StatusBadge status={m.newStatus} />
                      </p>
                      {m.justification && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{m.justification}</p>}
                      <p className="text-xs text-slate-400 mt-0.5">{fmtDate(m.occurredAt)}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const UnitInboxScreen: React.FC<{ me: MeResponse }> = ({ me }) => {
  const [inbox, setInbox] = useState<UnitInboxData | null>(null);
  const [units, setUnits] = useState<OrganizationalUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inboxData, unitsData] = await Promise.all([
        api.get<UnitInboxData>('/unit-inbox'),
        api.get<{ items: OrganizationalUnit[] }>('/organizational-units'),
      ]);
      setInbox(inboxData);
      setUnits(unitsData.items);
    } catch (err) {
      setError(err instanceof ApiError ? `${err.title}: ${err.detail ?? ''}` : 'Falha ao carregar a caixa da unidade.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
        <button onClick={() => void load()} className="mt-3 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium">Tentar novamente</button>
      </div>
    );
  }

  if (!inbox) return null;

  const myUnits = me.units.map((u) => u.officialName).join(', ') || 'sem lotação vigente';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Caixa da unidade</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Lotação vigente: {myUnits}</p>
        </div>
        {inbox.allowedActions.createProcess && units.length > 0 && (
          <button onClick={() => setShowNew(true)} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium self-start">
            + Novo processo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Section title="Recebidos" count={inbox.receivedProcesses.length}>
          {inbox.receivedProcesses.map((p) => <ProcessRow key={p.id} p={p} onOpen={setOpenId} />)}
        </Section>
        <Section title="Não distribuídos" count={inbox.undistributedProcesses.length}>
          {inbox.undistributedProcesses.map((p) => <ProcessRow key={p.id} p={p} onOpen={setOpenId} />)}
        </Section>
        <Section title="Atribuídos a mim" count={inbox.assignedToMe.length}>
          {inbox.assignedToMe.map((p) => <ProcessRow key={p.id} p={p} onOpen={setOpenId} />)}
        </Section>
        <Section title="Em análise" count={inbox.inAnalysis.length}>
          {inbox.inAnalysis.map((p) => <ProcessRow key={p.id} p={p} onOpen={setOpenId} />)}
        </Section>
        <Section title="Tarefas pendentes" count={inbox.pendingTasks.length}>
          {inbox.pendingTasks.map((t) => (
            <div key={t.id} className="py-2 flex items-center justify-between gap-2">
              <span className="text-sm text-slate-800 dark:text-slate-100 truncate">{t.title}</span>
              <span className="text-xs text-slate-400">{fmtDate(t.dueAt)}</span>
            </div>
          ))}
        </Section>
        <Section title="Prazos próximos e vencidos" count={inbox.deadlines.length}>
          {inbox.deadlines.map((d) => (
            <div key={d.id} className="py-2 flex items-center justify-between gap-2">
              <span className={`text-sm ${d.overdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-slate-800 dark:text-slate-100'}`}>
                {d.overdue ? 'Vencido' : 'A vencer'}
              </span>
              <span className="text-xs text-slate-400">{fmtDate(d.dueAt)}</span>
            </div>
          ))}
        </Section>
        <Section title="Aguardando assinatura" count={inbox.documentsAwaitingSignature.length}>
          {inbox.documentsAwaitingSignature.map((s) => (
            <div key={s.signatureId} className="py-2 text-sm text-slate-800 dark:text-slate-100 truncate">
              {s.title} — v{s.versionNumber}
            </div>
          ))}
        </Section>
        <Section title="Últimas movimentações" count={inbox.lastMovements.length}>
          {inbox.lastMovements.map((m) => (
            <div key={m.id} className="py-2 flex items-center justify-between gap-2">
              <StatusBadge status={m.newStatus} />
              <span className="text-xs text-slate-400">{fmtDate(m.occurredAt)}</span>
            </div>
          ))}
        </Section>
      </div>

      {showNew && (
        <NewProcessModal
          units={units}
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); void load(); }}
        />
      )}
      {openId && <ProcessDetail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
};

export default UnitInboxScreen;
