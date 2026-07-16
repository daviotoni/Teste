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

## Dica de segurança dos dados

Como os dados ficam guardados no navegador, vale usar o **Salvar backup** de vez em
quando (uma vez por mês, por exemplo) e guardar o arquivo gerado. Se precisar trocar
de computador ou limpar o navegador, é só usar **Restaurar backup**.
