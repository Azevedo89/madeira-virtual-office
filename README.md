# MV OFFICE — Madeira Virtual Office

Site do MV OFFICE: endereço comercial no Funchal, com receção e digitalização
de correio, coworking e ligações locais.

Segue a direção **V15 final** entregue pelo designer
(`MV_OFFICE_FINAL_WEB_DESIGNER_PRESENTATION`). A sequência das secções, o
preço e a identidade vêm de lá.

## Arrancar

```
pnpm install
pnpm dev
```

Abre em http://localhost:5173

| Comando             | O quê                                               |
| ------------------- | --------------------------------------------------- |
| `pnpm dev`          | servidor de desenvolvimento, com recarga automática |
| `pnpm build`        | gera `dist/`                                        |
| `pnpm preview`      | serve o `dist/` como vai para produção              |
| `pnpm lint`         | ESLint                                              |
| `pnpm typecheck`    | TypeScript em modo `checkJs`, sobre o JS            |
| `pnpm test`         | Vitest                                              |
| `pnpm format`       | Prettier, a escrever                                |
| `pnpm format:check` | Prettier, só a verificar                            |

## Quality gates

Todos correm em cada PR e têm de estar verdes para fazer merge:

| Verificação                  | O que apanha                                              |
| ---------------------------- | --------------------------------------------------------- |
| `lint`                       | erros e maus hábitos no JS                                |
| `typecheck`                  | erros de tipo, sem converter o projeto para TypeScript    |
| `test`                       | estrutura do HTML, acessibilidade, contraste e o menu     |
| `format:check`               | formatação fora do padrão                                 |
| `secret-scan`                | segredos no código e no histórico (gitleaks)              |
| `lighthouse (a11y/seo/perf)` | acessibilidade 100, SEO e boas práticas 95, desempenho 85 |
| `conventional-commit`        | título do PR no formato `tipo: descrição`                 |

Os testes não são de fachada: o `tests/contrast.test.js` calcula os rácios
WCAG a partir dos próprios tokens do CSS. A paleta original do designer
reprovava — o dourado `#b9903d` dá 2,95:1 sobre branco, quando a norma exige
4,5:1 — e existe agora um `--gold-text` para texto sobre fundo claro.

## Estrutura

| Caminho          | O quê                                        |
| ---------------- | -------------------------------------------- |
| `index.html`     | a página                                     |
| `src/styles.css` | estilos (navy `#071F3B`, dourado `#D8B663`)  |
| `src/main.js`    | barra flutuante e topo ao recarregar         |
| `public/`        | servido tal e qual: imagens, robots, sitemap |
| `brand/`         | masters vetoriais do logótipo                |
| `tests/`         | Vitest                                       |

## Deploy

Vercel, a partir do GitHub. `vercel.json` fixa o build (`pnpm build` para
`dist/`), os cabeçalhos de segurança e a cache. Cada PR gera um preview.

- `main` → produção
- `dev` e branches de feature → preview

## Contactos publicados

Morada, telefone, WhatsApp e email estão no fim do `index.html` e repetidos
no JSON-LD. Mudar num sítio obriga a mudar no outro.

## Por fazer

- [x] Domínio: madeiravirtualoffice.com (sem hífen)
- [ ] Apontar DNS para a Vercel
- [ ] **Confirmar que a caixa info@madeiravirtualoffice.com recebe** — o formulário
      usa FormSubmit e o primeiro envio gera um email de ativação que tem de ser
      confirmado uma vez. Até lá o formulário não entrega nada.
- [ ] Ligar o Vercel Analytics no painel do projeto
- [ ] Identificação legal: denominação social, NIPC, política de privacidade e
      Livro de Reclamações eletrónico
- [ ] Substituir a fotografia provisória por fotografia licenciada

## Fotografias

| Ficheiro             | Onde                    | Autor              | Licença      |
| -------------------- | ----------------------- | ------------------ | ------------ |
| `hero-funchal.webp`  | hero                    | Bengt Nyman        | CC BY 2.0    |
| `funchal-baixa.webp` | secção Madeira          | Holger Uwe Schmitt | CC BY-SA 4.0 |
| `og.jpg`             | pré-visualização social | Bengt Nyman        | CC BY 2.0    |

### O hero que queremos mesmo

A fotografia escolhida é a da baía ao anoitecer, do próprio (confirmado a
2026-10-16, sem necessidade de atribuição). **Está em espera por resolução**:
o ficheiro entregue, `mvo.jpeg`, tem 480×269, e num hero a toda a largura isso
é uma ampliação de três vezes que se vê à distância.

Procurei alternativas ao anoitecer em alta resolução no Wikimedia Commons —
não existe nenhuma com licença livre. Assim que houver o original da câmara,
trocar `hero-funchal.webp` e também o `og.jpg`, que precisa de 1200px de
largura para as pré-visualizações sociais.
