# ROVIX Apps

Plataforma comercial orientada a dados da ROVIX Automation. O catálogo, as rotas, SEO, planos, FAQs, filtros e CTAs são derivados de uma única fonte validada por Zod.

## Stack e decisão arquitetural

Next.js (App Router), React, TypeScript estrito, CSS responsivo, Zod e Vitest. A primeira versão usa um arquivo TypeScript tipado porque oferece edição simples, revisão em Git, validação no build e geração estática sem infraestrutura adicional. A interface depende apenas de `ProductRepository`; uma implementação para CMS, API ou banco pode substituir `LocalProductRepository` sem alterar componentes.

## Instalação e execução

```bash
npm install
copy .env.example .env.local
npm run dev
```

Acesse `http://localhost:3000/apps`. Para produção:

```bash
npm run typecheck
npm test
npm run build
npm start
```

O deploy recomendado é Vercel ou outro ambiente Node.js compatível com Next.js. Configure `NEXT_PUBLIC_SITE_URL` com o domínio final. O número de WhatsApp presente nos dados é deliberadamente neutro e deve ser substituído pelo contato comercial oficial antes da publicação.

## Estrutura

- `src/domain`: schema e tipos compartilháveis com futuro admin.
- `src/data`: fonte editorial única.
- `src/repositories`: abstração de acesso aos produtos.
- `src/services`: decisão comercial e analytics.
- `src/components`: interface reutilizável.
- `src/app`: rotas, SEO, sitemap, robots e manifest.

Eventos são emitidos como `rovix:analytics` no navegador, deixando GA/GTM/Clarity desacoplados. Integrações de checkout devem ser adicionadas ao serviço comercial, nunca diretamente nos cards.

## Estado atual e fases futuras

Os sete produtos solicitados estão cadastrados. Onde preço, URL, versão ou mídia oficial ainda não foram fornecidos, os dados informam “sob consulta”, “em desenvolvimento” ou ausência de mídia; nenhuma alegação comercial foi inventada. Painel administrativo, persistência de newsletter, autenticação, checkout e provedores de analytics estão preparados por fronteiras arquiteturais, mas dependem de infraestrutura e credenciais futuras.

Veja [COMO_ADICIONAR_NOVO_APLICATIVO.md](./COMO_ADICIONAR_NOVO_APLICATIVO.md).
