# Como adicionar um novo aplicativo

## 1. Cadastro

Edite `src/data/products.ts`. Na primeira versão, adicione um objeto em `seeds`; o mapeamento inferior completa campos editoriais comuns e o Zod valida o resultado. Para controle individual de todos os campos, o catálogo pode ser convertido em objetos `Product` completos sem mudar o repositório ou a interface.

Exemplo real mínimo:

```ts
{
  slug: "novo-aplicativo",
  nome: "Novo Aplicativo",
  slogan: "Uma mensagem clara de valor.",
  descricao: "Explique o problema, a solução e o benefício real.",
  categoria: "Produtividade",
  sub: ["Organização"],
  publico: ["Profissionais"],
  status: "Em lançamento",
  destaque: false,
  plataformas: ["Web"],
  fun: ["Funcionalidade confirmada"],
  beneficios: ["Benefício verificável"],
  problemas: ["Problema resolvido"],
  diferenciais: ["Diferencial real"],
  casos: ["Caso de uso"],
  tags: ["produtividade"],
  cor: "#367cff"
}
```

Isso publica automaticamente `/apps/novo-aplicativo` após build/deploy.

## 2. Campos obrigatórios

O contrato completo está em `src/domain/product.ts`. Identidade, conteúdo, classificação, status, mídia, compatibilidade, recursos, planos, ações comerciais, FAQ, SEO e auditoria são obrigatórios no objeto final. Execute `npm test` para validar.

## 3. Logo e ícone

Coloque arquivos otimizados em `public/products/<slug>/`. Prefira SVG para logo/ícone e WebP ou AVIF para imagens. Informe caminhos como `/products/novo-aplicativo/logo.svg` nos campos `logo` e `icone` quando usar registros completos. Sempre forneça uma descrição acessível no conteúdo associado.

## 4. Imagens e galeria

Adicione capa, mockup e galeria à mesma pasta, compacte e preencha `imagemDeCapa`, `mockup` e `imagensDaGaleria`. Não publique imagens de teste como material definitivo.

## 5. Vídeo e animação

Use MP4/WebM otimizado e poster. Configure `videoDemonstrativo` e `animacao` com `tipo`, `src`, `poster` e `descricao`. Tipos aceitos: `mp4`, `webm`, `gif`, `lottie`, `css` e `screenshots`. Sem mídia, use `null`; a interface mantém o fallback visual.

## 6. Preço e planos

Cada plano precisa de id, nome, descrição, preço (ou `null`), moeda, periodicidade, recursos, destaque e ativo. Não use zero para “sob consulta”. Ajuste `precoInicial` e `modalidadeDeCobranca` de forma consistente.

## 7. Status

Use somente um valor aceito pelo schema: Disponível, Em lançamento, Beta, Em desenvolvimento, Projeto personalizado, Demonstração, Lista de espera, Descontinuado ou Oculto. O badge e a indexação são automáticos.

## 8. Compra e orçamento

Defina `possuiCompraOnline` e `linkDeCompra`. Para orçamento, use `modalidadeDeCobranca: "orçamento"` e `linkDoWhatsApp`. O serviço `purchaseAction` decide o CTA; não adicione links aos componentes.

## 9. Demonstração

Defina `possuiDemonstracao: true` e uma URL válida em `linkDeDemonstracao`. O botão aparece automaticamente.

## 10. SEO

Preencha `metaTitle`, `metaDescription`, `palavrasChaveSEO` e `openGraphImage`. Canonical, Open Graph, Twitter Card, Product/SoftwareApplication, FAQ, breadcrumbs e sitemap são gerados pela rota.

## 11. Publicação

Rode `npm run typecheck`, `npm test` e `npm run build`. Faça revisão editorial e visual em desktop e celular; publique pelo pipeline do projeto.

## 12. Validação

O `LocalProductRepository` executa `catalogSchema.parse` ao carregar. Um dado inválido interrompe testes/build em vez de chegar ao usuário.

## 13. Ocultar

Use `visivelNoCatalogo: false`, `ativo: false` ou status `Oculto` em um registro completo. Produtos assim não entram no catálogo, rotas estáticas ou sitemap.

## 14. Destacar

Defina `destaque: true` e ajuste `ordemDeExibicao`. A home recalcula automaticamente a seção de destaques.
