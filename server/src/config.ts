// Configuração da API institucional. Nenhum segredo é embutido no código;
// tudo vem do ambiente. A chave service_role NUNCA é usada aqui de forma a
// ser exposta ao frontend — ela permanece exclusivamente no servidor.
export interface ApiConfig {
  port: number;
  host: string;
  databaseUrl: string | undefined;
  supabaseUrl: string | undefined;
  supabaseAnonKey: string | undefined;
  corsOrigin: string;
}

export function loadConfig(): ApiConfig {
  return {
    port: Number(process.env.API_PORT ?? 8787),
    host: process.env.API_HOST ?? '0.0.0.0',
    databaseUrl: process.env.DATABASE_URL,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    corsOrigin: process.env.API_CORS_ORIGIN ?? 'http://localhost:3000',
  };
}

export function assertRuntimeConfig(cfg: ApiConfig): void {
  const missing: string[] = [];
  if (!cfg.databaseUrl) missing.push('DATABASE_URL');
  if (!cfg.supabaseUrl) missing.push('SUPABASE_URL');
  if (!cfg.supabaseAnonKey) missing.push('SUPABASE_ANON_KEY');
  if (missing.length > 0) {
    throw new Error(
      `Configuração ausente para executar a API: ${missing.join(', ')}. ` +
        'Defina as variáveis de ambiente antes de iniciar o servidor.',
    );
  }
}
