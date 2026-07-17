# Matriz inicial de permissões

Esta matriz é inicial e configurável. A concessão efetiva requer papel ativo, vínculo vigente à unidade, escopo de acesso e inexistência de regra de segregação impeditiva.

| Permissão | Chefia da unidade | Servidor da unidade | Administrador técnico |
|---|---:|---:|---:|
| Consultar processos da unidade | Sim, conforme classificação | Somente atribuídos/unidade permitida | Não automaticamente |
| Distribuir e redistribuir | Sim | Não, salvo delegação | Não |
| Avocar processo | Sim, conforme competência | Não | Não |
| Criar documento em rascunho | Sim | Sim, no escopo atribuído | Não |
| Criar nova versão | Sim | Sim, no escopo atribuído | Não |
| Assinar documento | Somente com autorização de assinatura | Somente com autorização de assinatura | Não automaticamente |
| Alterar classificação | Conforme competência | Propor apenas | Não |
| Consultar documento restrito | Conforme alcance | Somente se autorizado | Não automaticamente |
| Consultar auditoria | Unidade/escopo autorizado | Limitada ao próprio escopo | Suporte técnico auditado, sem conteúdo por padrão |
| Administrar perfis | Não por padrão | Não | Sim, sem alterar conteúdo técnico |

Os papéis específicos de Consultoria, Controladoria, Plenário, Ouvidoria e Procuradoria serão adicionados nos respectivos módulos especializados, mantendo estas regras transversais.
