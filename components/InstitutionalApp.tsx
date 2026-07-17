import React, { useEffect, useState } from 'react';
import { api, ApiError } from '../services/apiClient';
import { signOut } from '../services/supabaseAuth';
import type { MeResponse } from '../services/apiTypes';
import UnitInboxScreen from './UnitInbox';

// Casca institucional: cabeçalho + Caixa da Unidade. Só usa a API `/api/v1`.
const InstitutionalApp: React.FC<{ onSignOut: () => void }> = ({ onSignOut }) => {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .get<MeResponse>('/me')
      .then((data) => active && setMe(data))
      .catch((e) => active && setError(e instanceof ApiError ? `${e.title}: ${e.detail ?? ''}` : 'Falha ao autenticar.'));
    return () => { active = false; };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    onSignOut();
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-40 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div>
            <h1 className="text-xl font-bold text-blue-600">SIGLA-CMDC</h1>
            <p className="text-xs text-slate-500 -mt-1">Núcleo institucional</p>
          </div>
          <div className="flex items-center gap-3">
            {me && (
              <span className="hidden sm:inline text-sm font-medium text-slate-700 dark:text-slate-200">
                {me.displayName}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          {error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
              <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
              <button onClick={handleSignOut} className="mt-3 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium">
                Encerrar sessão
              </button>
            </div>
          ) : me ? (
            <UnitInboxScreen me={me} />
          ) : (
            <p className="text-slate-500 dark:text-slate-400 py-16 text-center">Carregando sua conta institucional...</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default InstitutionalApp;
