import React, { useState } from 'react';
import { dbHelper } from '../services/dbService';

const Configuracoes: React.FC = () => {
    const [connectionInfo, setConnectionInfo] = useState(dbHelper.getConnectionInfo());
    const [migrationMessage] = useState<string | null>('A migração direta do protótipo está desativada. Dados institucionais serão importados por procedimento auditável.');

    const refreshConnectionInfo = () => {
        setConnectionInfo(dbHelper.getConnectionInfo());
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Configurações</h2>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm space-y-6">
                <section>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Banco de dados</h3>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                            <span className="font-semibold">Modo atual:</span>{' '}
                            {connectionInfo.mode === 'supabase' ? 'Banco central Supabase' : 'Modo legado local'}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{connectionInfo.message}</p>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Migrar dados locais</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">A transferência de objetos JSON do navegador para o banco institucional foi removida por não preservar UUIDs, relações, classificação, histórico e auditoria.</p>
                    {migrationMessage && (
                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-3">{migrationMessage}</p>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Configuracoes;
