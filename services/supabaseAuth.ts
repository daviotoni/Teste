// Autenticação institucional via Supabase Auth (fase 1).
// IMPORTANTE:
// - Usa APENAS a chave anônima pública (VITE_SUPABASE_ANON_KEY). A chave
//   service_role NUNCA é usada no frontend.
// - Este cliente é usado SOMENTE para autenticação (obter/renovar o token).
//   O frontend não lê nem escreve tabelas normalizadas diretamente: todo acesso
//   a dados institucionais passa pela API `/api/v1` com bearer token.
// - A arquitetura é compatível com evolução para OIDC/Keycloak/Entra ID:
//   basta trocar o provedor mantendo `getAccessToken()`.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;
if (url && anonKey) {
  client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

export function isAuthConfigured(): boolean {
  return client !== null;
}

export async function getAccessToken(): Promise<string | null> {
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  if (!client) throw new Error('Autenticação institucional não configurada.');
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  if (!client) return;
  await client.auth.signOut();
}

export async function getAuthEmail(): Promise<string | null> {
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user?.email ?? null;
}

export function onAuthChange(callback: (signedIn: boolean) => void): () => void {
  if (!client) return () => {};
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    callback(!!session);
  });
  return () => data.subscription.unsubscribe();
}
