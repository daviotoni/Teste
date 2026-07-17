# Fluxo-piloto: análise prévia de anteprojeto parlamentar

## Finalidade

Homologar o núcleo comum com uma solicitação de elaboração e análise prévia de anteprojeto de lei de iniciativa parlamentar. O fluxo é configurável por `workflow_definitions` e `workflow_steps`; não há etapas codificadas como enum de banco.

## Participantes

- Gabinete parlamentar: cria a solicitação e preserva a minuta original.
- Coordenadoria de Atas e Projetos: recebe, distribui e executa revisão gramatical e legislativa.
- Consultoria-Geral Legislativa: executa a análise técnico-legislativa.
- Chefias e revisores autorizados: distribuem, revisam e concluem conforme as permissões concedidas.

## Etapas

`DRAFT` → `SUBMITTED_BY_CABINET` → `RECEIVED` → `ASSIGNED` → `GRAMMATICAL_AND_LEGISLATIVE_REVIEW` → `FORWARDED_TO_TECHNICAL_ANALYSIS` → `UNDER_TECHNICAL_ANALYSIS` → `UNDER_REVIEW` → `ANALYSIS_APPROVED` → `COMPLETED`.

De `UNDER_TECHNICAL_ANALYSIS` ou `UNDER_REVIEW`, uma diligência poderá levar a `DILIGENCE_REQUESTED` → `RETURNED_TO_CABINET` → `RESUBMITTED` → `UNDER_REVIEW`. `CANCELED` é terminal e requer justificativa e permissão específica.

## Regras invariantes

1. A minuta original do Gabinete é uma versão de documento preservada; alterações criam nova versão.
2. Cada distribuição cria movimentação, responsável e prazo, todos auditados.
3. Diligências alteram ou suspendem prazo por evento registrado; a regra de contagem será configurável.
4. Documentos internos de trabalho podem ser restritos; o resultado e versões liberadas ficam disponíveis ao Gabinete.
5. A conclusão exige perfil autorizado e não apaga documentos, movimentações, tarefas ou logs.
