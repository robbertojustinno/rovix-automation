# Publicação no GitHub e Render

## Verificação local

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

O build cria `out/`. Sirva essa pasta com qualquer servidor estático e valide as rotas do `MAPA_DE_ROTAS.md`.

## GitHub

O repositório principal é `ROVIX_APPS`, branch de integração `unificacao-site-oficial`. Não versionar `node_modules`, `.next`, `out`, `.env`, backups, caches ou ZIPs. Após revisão, configure o remoto oficial, envie a branch e abra PR para `main`.

## Render

O `render.yaml` define um único Static Site:

- build: `npm ci && npm run build`
- diretório publicado: `./out`
- aliases legados: redirects declarados

Configure no Render somente variáveis públicas quando quiser substituir os fallbacks de `.env.example`. Não é necessário `next export` nem Web Service Node nesta versão.

## Publicação segura

1. Revisar o diff e os contatos.
2. Executar todas as validações.
3. Enviar a branch ao GitHub.
4. Fazer merge após aprovação.
5. Conectar o único serviço Render ao repositório/branch principal.
6. Após deploy, testar formulário, WhatsApp e login real da intranet.
