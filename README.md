# Site oficial ROVIX Automation + ROVIX Apps

Aplicação oficial unificada da ROVIX Automation. Reúne site institucional, catálogo orientado a dados, páginas automáticas de produtos e ROVIX Hub/Intranet preservado.

## Stack e decisão arquitetural

Next.js (App Router), React, TypeScript estrito, CSS responsivo, Zod e Vitest. A primeira versão usa um arquivo TypeScript tipado porque oferece edição simples, revisão em Git, validação no build e geração estática sem infraestrutura adicional. A interface depende apenas de `ProductRepository`; uma implementação para CMS, API ou banco pode substituir `LocalProductRepository` sem alterar componentes.

## Instalação e execução

```bash
npm install
copy .env.example .env.local
npm run dev
```

Acesse `http://localhost:3000/` e `http://localhost:3000/apps`. Para produção:

```bash
npm run typecheck
npm test
npm run build
npm start
```

O build usa a exportação estática oficial e gera `out/`. O Render publica essa pasta conforme `render.yaml`. Contatos oficiais possuem fallbacks públicos centralizados em `src/config/site.ts` e podem ser substituídos pelas variáveis de `.env.example`.

## Estrutura

- `src/domain`: schema e tipos compartilháveis com futuro admin.
- `src/data`: fonte editorial única.
- `src/repositories`: abstração de acesso aos produtos.
- `src/services`: decisão comercial e analytics.
- `src/components`: interface reutilizável.
- `src/app`: rotas institucionais, catálogo, SEO, sitemap, robots e manifest.
- `src/config`: contatos e configuração pública centralizada.
- `public/intranet`: ROVIX Hub preservado sem reescrever autenticação.

Eventos são emitidos como `rovix:analytics` no navegador, deixando GA/GTM/Clarity desacoplados. Integrações de checkout devem ser adicionadas ao serviço comercial, nunca diretamente nos cards.

## Estado atual e fases futuras

Os sete produtos solicitados estão cadastrados. Onde preço, URL, versão ou mídia oficial ainda não foram fornecidos, os dados informam “sob consulta”, “em desenvolvimento” ou ausência de mídia; nenhuma alegação comercial foi inventada. Painel administrativo, persistência de newsletter, autenticação, checkout e provedores de analytics estão preparados por fronteiras arquiteturais, mas dependem de infraestrutura e credenciais futuras.

Veja também `COMO_ADICIONAR_NOVO_APLICATIVO.md`, `UNIFICACAO_SITE_ROVIX.md`, `MAPA_DE_ROTAS.md` e `PUBLICACAO_GITHUB_RENDER.md`.
