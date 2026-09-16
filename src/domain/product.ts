import { z } from "zod";
export const statuses=["Disponível","Em lançamento","Beta","Em desenvolvimento","Projeto personalizado","Demonstração","Lista de espera","Descontinuado","Oculto"] as const;
export const billings=["gratuito","compra única","mensal","anual","por usuário","por dispositivo","por empresa","orçamento"] as const;
const url=z.string().url().or(z.literal(""));
export const planSchema=z.object({id:z.string(),nome:z.string(),descricao:z.string(),preco:z.number().nonnegative().nullable(),moeda:z.string(),periodicidade:z.string(),recursos:z.array(z.string()),destaque:z.boolean(),desconto:z.number().optional(),precoPromocional:z.number().optional(),validadeDaPromocao:z.string().optional(),linkDeCompra:url.optional(),ativo:z.boolean()});
export const productSchema=z.object({
 id:z.string(),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),nome:z.string(),nomeCurto:z.string(),slogan:z.string(),descricaoCurta:z.string(),descricaoCompleta:z.string(),categoria:z.string(),subcategorias:z.array(z.string()),publicoAlvo:z.array(z.string()),status:z.enum(statuses),destaque:z.boolean(),ordemDeExibicao:z.number().int(),
 logo:z.string(),icone:z.string(),imagemDeCapa:z.string(),mockup:z.string(),imagensDaGaleria:z.array(z.string()),videoDemonstrativo:url,animacao:z.object({tipo:z.enum(["mp4","webm","gif","lottie","css","screenshots"]),src:z.string(),poster:z.string().optional(),descricao:z.string()}).nullable(),plataformas:z.array(z.string()),compatibilidade:z.array(z.string()),versao:z.string(),dataDeLancamento:z.string().nullable(),dataDeAtualizacao:z.string(),
 funcionalidades:z.array(z.string()),beneficios:z.array(z.string()),problemasQueResolve:z.array(z.string()),diferenciais:z.array(z.string()),casosDeUso:z.array(z.string()),requisitos:z.array(z.string()),planos:z.array(planSchema),precoInicial:z.number().nonnegative().nullable(),moeda:z.string(),modalidadeDeCobranca:z.enum(billings),possuiTeste:z.boolean(),possuiDemonstracao:z.boolean(),possuiCompraOnline:z.boolean(),
 linkDeCompra:url,linkDeDemonstracao:url,linkDoSistema:url,linkDoWhatsApp:url,linkDeSuporte:url,documentacao:url,perguntasFrequentes:z.array(z.object({pergunta:z.string(),resposta:z.string()})),depoimentos:z.array(z.object({autor:z.string(),cargo:z.string(),texto:z.string()})),metricas:z.array(z.object({valor:z.string(),rotulo:z.string()})),tags:z.array(z.string()),palavrasChaveSEO:z.array(z.string()),metaTitle:z.string(),metaDescription:z.string(),openGraphImage:z.string(),ativo:z.boolean(),visivelNoCatalogo:z.boolean(),criadoEm:z.string(),atualizadoEm:z.string(),relacionados:z.array(z.string()).optional()
});
export const catalogSchema=z.array(productSchema);
export type Product=z.infer<typeof productSchema>;
export type Plan=z.infer<typeof planSchema>;
