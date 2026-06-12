import React, { useState } from 'react';
import { dbHelper } from '../services/dbService';

const Configuracoes: React.FC = () => {
    const [connectionInfo, setConnectionInfo] = useState(dbHelper.getConnectionInfo());
    const [migrationMessage, setMigrationMessage] = useState<string | null>(null);
    const [isMigrating, setIsMigrating] = useState(false);

    const refreshConnectionInfo = () => {
        setConnectionInfo(dbHelper.getConnectionInfo());
    };

    const handleMigrate = async () => {
        setIsMigrating(true);
        setMigrationMessage(null);

        try {
            const result = await dbHelper.migrateLocalToRemote();
            setMigrationMessage(`Migracao concluida. ${result.migrated} registros enviados ao banco central. ${result.skipped} registros ignorados por falta de identificador.`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido ao migrar dados.';
            setMigrationMessage(message);
        } finally {
            setIsMigrating(false);
            refreshConnectionInfo();
        }
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
                            {connectionInfo.mode === 'supabase' ? 'Banco central Supabase' : 'Banco local do navegador'}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{connectionInfo.message}</p>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Migrar dados locais</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Depois de configurar o Supabase no arquivo .env.local, use este botao para enviar para o banco central os dados que ja existem neste navegador.
                    </p>
                    <button
                        type="button"
                        onClick={handleMigrate}
                        disabled={isMigrating || connectionInfo.mode !== 'supabase'}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                    >
                        {isMigrating ? 'Migrando...' : 'Migrar dados deste navegador para o banco central'}
                    </button>
                    {connectionInfo.mode !== 'supabase' && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-3">
                            Configure primeiro as variaveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
                        </p>
                    )}
                    {migrationMessage && (
                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-3">{migrationMessage}</p>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Configuracoes;
