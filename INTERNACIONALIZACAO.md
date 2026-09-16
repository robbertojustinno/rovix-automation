# Internacionalização

A versão atual é `pt-BR`, declarado no layout, manifest e conteúdo. A arquitetura ainda não adiciona biblioteca de i18n para evitar rotas duplicadas e complexidade sem conteúdo traduzido.

Para uma fase futura:

1. Definir idiomas e responsável editorial.
2. Adicionar locale aos dados dos produtos ou uma camada de tradução no repositório.
3. Criar rotas por idioma (`/en/...`) sem alterar slugs atuais em português.
4. Gerar `hreflang`, canonicals e sitemap por locale.
5. Traduzir UI, SEO, FAQs, planos e mensagens comerciais como uma unidade.
6. Manter `/intranet/` em português até que sua aplicação estática seja internacionalizada separadamente.

Não usar tradução automática como conteúdo de produção sem revisão humana.
