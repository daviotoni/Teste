import { createServer } from 'node:http';
import { createClient } from '@supabase/supabase-js';

const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
for (const key of required) if (!process.env[key]) throw new Error(`${key} is required`);
const port = Number(process.env.PORT ?? 3001);
const origin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

function send(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': origin, 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET,POST,OPTIONS' });
  response.end(JSON.stringify(body));
}
async function readJson(request) { let value = ''; for await (const chunk of request) value += chunk; return value ? JSON.parse(value) : {}; }
async function authenticatedClient(request) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) throw Object.assign(new Error('Sessão ausente.'), { statusCode: 401 });
  const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw Object.assign(new Error('Sessão inválida.'), { statusCode: 401 });
  return client;
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return send(response, 204, null);
  try {
    const client = await authenticatedClient(request);
    if (request.method === 'GET' && request.url === '/api/v1/me') {
      const { data, error } = await client.from('users').select('id,display_name,email').single();
      if (error) throw error; return send(response, 200, data);
    }
    if (request.method === 'GET' && request.url === '/api/v1/organizational-units') {
      const { data, error } = await client.from('organizational_units').select('id,code,official_name,official_acronym,unit_kind,functional_level').eq('is_active', true).order('official_name');
      if (error) throw error; return send(response, 200, data);
    }
    if (request.method === 'GET' && request.url === '/api/v1/processes') {
      const { data, error } = await client.from('processes').select('id,number,subject,status,priority,origin_unit_id,responsible_unit_id,updated_at').is('deleted_at', null).order('updated_at', { ascending: false });
      if (error) throw error; return send(response, 200, data);
    }
    if (request.method === 'POST' && request.url === '/api/v1/processes') {
      const body = await readJson(request);
      for (const key of ['processTypeId', 'subject', 'originUnitId', 'responsibleUnitId']) if (!body[key]) return send(response, 400, { title: `Campo obrigatório: ${key}` });
      const { data, error } = await client.rpc('create_process', { input_process_type_id: body.processTypeId, input_subject: body.subject, input_origin_unit_id: body.originUnitId, input_responsible_unit_id: body.responsibleUnitId, input_workflow_id: body.workflowId ?? null });
      if (error) throw error; return send(response, 201, data);
    }
    return send(response, 404, { title: 'Rota não encontrada.' });
  } catch (error) { return send(response, error.statusCode ?? 500, { title: error.message ?? 'Erro interno.' }); }
});
server.listen(port, '0.0.0.0', () => console.log(`SIGLA-CMDC API em http://localhost:${port}`));
