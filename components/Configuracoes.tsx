import React from 'react';
import { dbHelper } from '../services/dbService';

// Configurações do modo demonstração local. A migração JSONB pelo navegador foi
// REMOVIDA: não há botão de "migrar dados deste navegador para o banco central"
// e o dbService não sincroniza com o Supabase. A importação de dados legados é
// feita apenas por um importador administrativo auditável no backend
// (ver database/importer/README.md), nunca pelo navegador.
const Configuracoes: React.FC = () => {
  const connectionInfo = dbHelper.getConnectionInfo();

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Configurações</h2>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm space-y-6">
        <section>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Armazenamento</h3>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-semibold">Modo atual:</span> Banco local do navegador (IndexedDB)
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{connectionInfo.message}</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Migração de dados</h3>
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              A migração de dados deste navegador para o banco institucional foi desativada. A importação
              de dados legados só pode ocorrer por um processo administrativo auditável no backend, com
              homologação prévia — nunca pelo navegador. Os dados exibidos aqui são apenas locais e não
              devem ser usados para atividade institucional.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Configuracoes;
