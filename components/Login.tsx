import React, { useState } from 'react';
import { isAuthConfigured, signInWithPassword } from '../services/supabaseAuth';

// Login institucional via Supabase Auth (bearer token real). NÃO há credenciais
// padrão (admin/admin foi removido) nem validação de senha no navegador — a
// verificação ocorre no provedor de identidade e no backend.
interface LoginProps {
  onInstitutionalSignedIn: () => void;
  onEnterLegacyDemo: () => void;
}

const Login: React.FC<LoginProps> = ({ onInstitutionalSignedIn, onEnterLegacyDemo }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const configured = isAuthConfigured();

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await signInWithPassword(email, password);
      onInstitutionalSignedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível autenticar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 text-center">SIGLA-CMDC</h2>
        <p className="text-slate-500 dark:text-slate-400 -mt-1 mb-6 text-center">Acesso institucional</p>

        {configured ? (
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label htmlFor="loginEmail" className="block font-semibold text-slate-600 dark:text-slate-300 mb-1.5">E-mail institucional</label>
              <input
                id="loginEmail" type="email" autoComplete="username"
                className="w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-2 border-transparent focus:border-blue-500 rounded-lg px-3 py-2"
                placeholder="usuario@instituicao.gov.br"
                value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="loginPass" className="block font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Senha</label>
              <input
                id="loginPass" type="password" autoComplete="current-password"
                className="w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-2 border-transparent focus:border-blue-500 rounded-lg px-3 py-2"
                placeholder="Sua senha"
                value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
              />
            </div>
            <button
              type="submit" disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200">
            Autenticação institucional não configurada. Defina <code>VITE_SUPABASE_URL</code> e{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> e execute a API para acessar dados institucionais.
          </div>
        )}

        {error && <div className="text-red-500 font-semibold mt-4 text-center text-sm">{error}</div>}

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onEnterLegacyDemo}
            className="w-full text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline"
          >
            Entrar no modo demonstração local (sem dados institucionais)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
