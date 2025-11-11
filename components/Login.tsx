
import React, { useState } from 'react';
import type { User } from '../types';
import { authService } from '../services/authService';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await authService.login(username, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Login ou senha inválidos');
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar fazer login.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center z-50">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-2xl text-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">JurisControl</h2>
        <p className="text-slate-500 dark:text-slate-400 -mt-1 mb-6">Acesso ao sistema</p>
        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label htmlFor="loginUser" className="block font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Usuário
            </label>
            <input
              id="loginUser"
              type="text"
              className="w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-2 border-transparent focus:border-blue-500 focus:ring-0 rounded-lg px-3 py-2 transition"
              autoComplete="username"
              placeholder="Digite seu usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="loginPass" className="block font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Senha
            </label>
            <input
              id="loginPass"
              type="password"
              className="w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-2 border-transparent focus:border-blue-500 focus:ring-0 rounded-lg px-3 py-2 transition"
              autoComplete="current-password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
        {error && (
            <div className="text-red-500 font-semibold mt-4 min-h-[1.2em] text-center">
                {error}
            </div>
        )}
      </div>
    </div>
  );
};

export default Login;
