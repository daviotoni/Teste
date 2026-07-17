# Estratégia de armazenamento de arquivos

- Armazenamento S3 compatível em bucket privado; Supabase Storage é aceitável no ambiente inicial.
- A API emite URLs assinadas de curta duração após verificar permissão; o navegador não recebe acesso público ao bucket.
- Cada versão e anexo registra chave de armazenamento, nome original, MIME type, tamanho e hash SHA-256.
- Uploads passam por validação de tipo, tamanho e antivírus em worker antes de ficarem disponíveis.
- Arquivo de versão assinada é imutável; nova alteração cria nova versão e novo hash.
- O código de armazenamento não dependerá de fornecedor: um adaptador implementará operações de upload, download, remoção lógica e verificação.
- Seeds e testes não terão documentos oficiais, assinaturas válidas ou dados pessoais reais.
