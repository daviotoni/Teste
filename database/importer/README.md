# Importador institucional (auditável)

Fundação de importação dos dados do protótipo legado (JSONB/IndexedDB) para o
núcleo normalizado. **Não roda no navegador** e **não migra dados reais sem
homologação.**

## Princípios

- Executado apenas como comando de backend, por operador autorizado.
- Gera UUIDs e **preserva o identificador legado** (`legacy_number` / carga original).
- Converte entidades para o modelo normalizado e atribui **classificação inicial**
  (`INTERNAL` por padrão).
- Produz um **plano normalizado** e um **relatório de erros** para revisão.
- A gravação real exige mapeamento aprovado por entidade e registra um **evento
  de importação** em auditoria, na mesma transação das inserções.

## Uso

```bash
# 1) Exportar os dados legados de um navegador (JSON dos object stores do IndexedDB).
# 2) Gerar o plano de importação (DRY-RUN, não escreve no banco):
npm run import -- caminho/para/export.json

# Saída: caminho/para/export.json.import-plan.json  (plano + erros)
```

O modo `--commit` é bloqueado a menos que `SIGLA_IMPORT_HOMOLOGATED=true` esteja
definido — e, mesmo assim, a persistência real permanece desabilitada nesta
fundação até que o mapeamento por entidade seja aprovado. Isso garante que
**nenhum dado real seja migrado sem homologação**.

## Proibições

- Não usar dados pessoais reais, documentos oficiais, credenciais ou assinaturas
  válidas em testes de importação.
- Não reutilizar este importador como sincronização contínua: ele é um processo
  pontual e auditável de carga inicial.
