# Controle da Galeria

Sisteminha **simples** para controlar os aluguéis de um comércio (lojas, depósitos,
estacionamento) mês a mês. Feito para quem não tem prática com computador: é só
digitar os números, trocar os nomes de quem está em cada loja e marcar quem já pagou.

Baseado na planilha mensal usada hoje (ex.: *Madureira – Janeiro 2026*), já vem com
os dados de Janeiro/2026 preenchidos como ponto de partida.

## Como usar (não precisa instalar nada)

O sistema é **um único arquivo**: `index.html`.

- **No computador:** dê dois cliques no arquivo `index.html`. Ele abre no navegador
  (Chrome, Edge, Firefox...) e já funciona, mesmo sem internet.
- **Pelo link:** também está publicado como uma página que abre direto no navegador do
  celular ou do computador — basta guardar o link nos favoritos.

Tudo o que você digita fica salvo **sozinho**, só naquele navegador. Nada é enviado
para a internet.

## O que dá para fazer

| Ação | Como |
|------|------|
| Trocar quem está na loja | Clique no nome na coluna **"Quem está"** e digite o novo. Deixe em branco = loja **vaga**. |
| Mudar um valor de aluguel | Clique no número e digite o novo. |
| Marcar que recebeu | Clique no botão **Pagou?** da linha — ela fica verde. |
| Adicionar uma loja/depósito | Botão **Adicionar unidade**. |
| Remover uma linha | Ícone de lixeira 🗑 no fim da linha. |
| Lançar despesas | Seção **Despesas do mês** → **Adicionar despesa**. |
| Começar um mês novo | Botão **Novo mês** — copia as mesmas lojas e inquilinos; você só ajusta o que mudou. |
| Imprimir ou gerar PDF | Botão **Imprimir / PDF**. |
| Baixar em planilha | Botão **Baixar planilha (CSV)** (abre no Excel). |
| Guardar uma cópia de segurança | Botão **Salvar backup** (gera um arquivo) e **Restaurar backup** para voltar. |

## Resumo automático (cartões do topo)

- **A receber (previsto):** soma de todos os aluguéis do mês.
- **Já recebido / Falta receber:** conforme você marca "Pagou?".
- **Despesas:** soma das despesas lançadas.
- **Saldo do mês:** previsto − despesas (é o "TOTAL" da planilha antiga).
- **Lojas vagas:** quantas unidades estão sem inquilino.

## Sincronizar na nuvem (opcional, grátis — Supabase)

Por padrão os dados ficam só no navegador. Se quiser acessar os **mesmos dados em
vários aparelhos** (celular + computador), dá para ligar uma nuvem grátis:

1. Já existe uma tabela pronta (veja `supabase.sql`). Para um projeto novo, rode esse
   SQL no **SQL Editor** do Supabase.
2. No **topo do `index.html`**, preencha as duas linhas:

   ```js
   var SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
   var SUPABASE_ANON_KEY = "sua-chave-anon-public";
   ```

3. Pronto. No canto superior aparece um selo de status: **"Salvo na nuvem ✓"** quando
   sincroniza, ou **"Salvo neste aparelho"** quando está sem internet. Clique no selo
   para forçar uma atualização vinda da nuvem.

Como funciona: o app guarda tudo no navegador (rápido, funciona offline) e envia uma
cópia para a nuvem a cada mudança. Ao abrir em outro aparelho, ele baixa a versão mais
recente. Se ficar sem internet, continua funcionando local e sincroniza quando voltar.

> **Atenção — plano gratuito do Supabase:** um projeto free **pausa sozinho depois de
> ~1 semana sem uso**. Enquanto pausado, o app continua funcionando no aparelho, mas
> não sincroniza até alguém religar o projeto no painel do Supabase (botão *Restore*).
> Para uso ocasional, o **backup em arquivo** (abaixo) costuma ser mais tranquilo.

> **Observação — link do preview (Artifact):** dentro do preview publicado no claude.ai
> a nuvem fica bloqueada por segurança da página, então lá ele funciona só em modo
> local. A nuvem funciona quando o `index.html` é aberto como arquivo ou hospedado num
> site normal.

## Dica de segurança dos dados

Mesmo com a nuvem ligada, vale usar o **Salvar backup** de vez em quando (uma vez por
mês, por exemplo) e guardar o arquivo gerado. Se precisar trocar de computador ou
limpar o navegador, é só usar **Restaurar backup**.
