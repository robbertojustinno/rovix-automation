# Mapa de rotas

| Rota | Finalidade | Origem | Indexação | Compatibilidade/dependências |
|---|---|---|---|---|
| `/` | Site institucional | `index.html` migrado | Sim | `ProductRepository`, formulário |
| `/apps/` | Catálogo oficial | ROVIX Apps | Sim | Fonte central de produtos |
| `/apps/[slug]/` | Produto automático | ROVIX Apps | Conforme dados/status | Zod e repositório |
| `/sobre/` | Institucional | Conteúdo legado refinado | Sim | Shell compartilhado |
| `/contato/` | Contato | FormSubmit legado | Sim | Configuração pública central |
| `/cliente/` | Estrutura futura | Novo | Não | Sem autenticação nesta fase |
| `/sucesso/` | Confirmação real do formulário | `sucesso.html` | Não | FormSubmit redireciona aqui |
| `/tagcheck/` | Ponte histórica | `tagcheck.html` | Não | Canonical `/apps/tagcheck/` |
| `/amigopet/` | Ponte histórica | `amigopet.html` | Não | Canonical `/apps/amigopet/` |
| `/intranet/` | ROVIX Hub estático | `intranet/` preservada | Não | API TAGCheck e localStorage |
| `/sucesso.html` | Alias legado | Estático | Não | Encaminha `/sucesso/` |
| `/tagcheck.html` | Alias legado | Estático | Não | Encaminha `/apps/tagcheck/` |
| `/amigopet.html` | Alias legado | Estático | Não | Encaminha `/apps/amigopet/` |
| `/intranet.html` | Alias legado | Estático | Não | Encaminha `/intranet/` |
| `/robots.txt` | Política de crawling | Next.js | N/A | Única fonte |
| `/sitemap.xml` | URLs públicas | Next.js | N/A | Produtos ativos/visíveis |
| `/manifest.webmanifest` | PWA metadata | Next.js | N/A | Ícone oficial |
