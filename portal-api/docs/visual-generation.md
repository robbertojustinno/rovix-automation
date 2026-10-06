# Identidade e imagens IA

Esta versão integra o AI Horde gratuito à criação de imagens do ROVIX Social Agent. A fila depende de trabalhadores voluntários e pode levar vários minutos. A qualidade estética não é garantida pelo serviço.

## Botões e uso

| Controle | Resultado |
| --- | --- |
| Identidade e imagens IA | Abre o perfil da empresa e as imagens de teste. |
| Salvar perfil | Salva marca, público, produtos, estilo, cores, referências descritas, restrições e logotipo. Alterações desativam a IA até aprovar uma nova prévia. |
| Gerar imagem de teste | Envia um tema do projeto selecionado para o gerador. A imagem é um rascunho sem publicação agendada. |
| Aprovar padrão e usar IA na automação | Ativa a geração para novos posts automáticos após avaliar uma prévia do perfil atual. |
| Usar Drive nos novos posts | Desativa a geração para novos posts; solicitações já iniciadas continuam. |

Na instalação da atualização, um perfil ROVIX e uma prévia de teste são preparados uma única vez. A automação por IA fica desativada até a aprovação visual.

As imagens finalizadas têm 1080 × 1350 pixels. A resolução original mínima é 1024 × 1024. Imagens censuradas e duplicadas são rejeitadas. O logotipo e a tipografia são aplicados pelo servidor depois da geração. As verificações técnicas não substituem a avaliação da relevância, anatomia, detalhes ou qualidade estética.

Os rascunhos anteriores mantêm sua origem. A voz e as prévias manuais existentes continuam no fluxo atual do Drive. O plano editorial de sete dias continua usando o catálogo atual para seus temas; a ativação da IA altera a origem da imagem de novos rascunhos desse plano.

O perfil visual é da instalação atual, autenticada pelo administrador. Esta atualização não cria contas isoladas para clientes. Antes de comercializar como serviço para várias empresas, é necessário vincular perfis, projetos, arquivos e credenciais ao cliente autenticado.

## Verificação

Execute no diretório portal-api:

`node --test social-manual-previews.test.mjs social-visual-profile.test.mjs social-image-pipeline.test.mjs`

O teste externo da API verificou que uma solicitação anônima de 1024 × 1024 é aceita. A aprovação do padrão depende da revisão da imagem concluída.
