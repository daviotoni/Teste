# Plano de migração do protótipo

## Escopo

O esquema anterior armazena registros em JSONB e habilita acesso anônimo. A migration `0001_institutional_core.sql` preserva a tabela legada `users` como `legacy_users_prototype` se ela existir com a coluna `data`; ela não migra conteúdo automaticamente.

## Estratégia

1. Fazer backup do banco e dos anexos antes da aplicação.
2. Aplicar as migrations normalizadas em ambiente de homologação vazio.
3. Executar o seed institucional sem nomes, e-mails, telefones ou responsáveis reais.
4. Criar um mapeamento aprovado para cada entidade JSON legada antes de importar qualquer dado.
5. Importar dados somente por processo auditável, mantendo o identificador legado em `legacy_number` ou metadado de importação.
6. Validar contagens, hashes de anexos, relações e permissões antes da produção.
7. Desativar o acesso anônimo do protótipo antes da entrada em produção.

## Dados proibidos nesta etapa

Não utilizar dados pessoais reais, documentos oficiais, credenciais ou assinaturas válidas nos seeds e testes.
