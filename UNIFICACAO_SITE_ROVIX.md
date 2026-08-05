# Unificação do site ROVIX

## Estratégia

O projeto Next.js `ROVIX_APPS` tornou-se a aplicação oficial. O site HTML foi migrado incrementalmente para rotas institucionais e componentes compartilhados. O catálogo continua orientado por dados através de `ProductRepository`; a home consulta o mesmo repositório e não cadastra produtos no JSX.

## Origem e destino

- `index.html`: conteúdo institucional migrado para `src/app/page.tsx` e `src/components/contact-form.tsx`.
- `public/logo.png` e `public/favicon.png`: preservados em `public/`.
- três imagens editoriais não rastreadas: preservadas em `public/images/legacy/`, sem uso editorial automático.
- `sucesso.html`: conteúdo migrado para `/sucesso/`; alias estático preservado.
- `tagcheck.html` e `amigopet.html`: conteúdo consolidado nas páginas do catálogo; aliases antigos têm canonical e encaminham ao catálogo.
- `intranet/`: copiada sem alterações para `public/intranet/`. API, token, endpoints e autenticação permanecem iguais.
- `intranet.html`: alias estático para `/intranet/`.

`frontend/` não foi publicado: trata-se de uma interface administrativa/local de exploração de arquivos, depende de `/api/*` inexistente no site público e menciona caminhos locais. `Guardian_Rovix_Visual_V2.zip` foi investigado e contém outra cópia desse frontend; permanece somente na origem e nos backups, fora do deploy público.

## Compatibilidade e deploy

O Next.js usa `output: "export"` e `trailingSlash: true`. O Render publica `out/`. Aliases `.html` existem em `public/` e também estão declarados como redirects no `render.yaml`. O sitemap e robots são gerados apenas pelo Next.js.

## Atualização

Conteúdo institucional fica em `src/app`, componentes comuns em `src/components` e contatos públicos em `src/config/site.ts`. Produtos continuam em `src/data/products.ts`; consulte `COMO_ADICIONAR_NOVO_APLICATIVO.md`.
