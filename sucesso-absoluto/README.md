# Encontro de Casais · Sucesso Absoluto

Protótipo navegável (React + Vite) de um app para 4 casais organizarem encontros no Rio:
votação de datas, votação de lugares com veto secreto, encontro confirmado, memórias e o
"Mural da Vergonha" (com efeito de foto queimando em canvas).

Paleta areia / vinho / terracota / oliva / dourado. Assinatura visual: o *medidor de oito* —
uma fileira de 8 pontos que se preenche conforme o grupo vota.

## Rodar

```bash
npm install
npm run dev
```

Abre em `http://localhost:5175`.

Na tela de login, escolha uma pessoa e digite o código. **Demo:** o código do Davi é `1101`
(cada pessoa mostra o próprio código de demonstração na tela).

## Build

```bash
npm run build      # gera dist/
npm run preview    # serve o build de produção
```

## Estrutura

- `src/App.jsx` — o app inteiro (telas, dados fictícios, design system e componentes de UI num só arquivo)
- `src/main.jsx` — ponto de entrada React
- `index.html` — template Vite

Dependências: apenas `react`, `react-dom` e `lucide-react` (ícones). As fontes (Fraunces + Inter)
são carregadas via Google Fonts dentro do próprio componente.
