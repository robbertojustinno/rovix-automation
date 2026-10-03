# LinkedIn Social Agent

Cópias independentes dos agentes ROVIX e ORPHEUS, com login, criação, prévias, aprovação, estratégia e calendário. Entrada: `/`; campanhas: `/linkedin-rovix-agent/` e `/linkedin-orpheus-agent/`.

## Fontes preservadas

ORPHEUS: commit 38c45028875119969ffd42f5a7c713c496287d46.
ROVIX: commit c230241dd0af2ad4dfd26f89bf604ed521e3598e, versão de recuperação anterior às prévias manuais. As prévias manuais ROVIX foram adicionadas nesta cópia. Esta versão não deve ser apresentada como uma cópia comprovada do código ROVIX mais recente em produção.

Os módulos originais permanecem intactos. Bancos novos: `linkedin-rovix-agent/db.json` e `linkedin-orpheus-agent/db.json`. Imagens finais ficam em prefixos independentes. Catálogos originais são apenas fontes de leitura. Nenhuma fila ou postagem do Instagram é importada. A automação começa desativada; ative depois de validar imagens e conexão.

## Deploy

Node 20+, repositório `robbertojustinno/rovix-automation`, branch `linkedin-social-agent-v1`.
Build: `npm ci --prefix portal-api`
Start: `node portal-api/linkedin-server.mjs`
Health: `/health`.
Plano: free. Configure as variáveis de `LINKEDIN_ENV.example` no servidor. O R2 conserva os bancos no plano gratuito, sem depender do disco efêmero.

A conexão Composio autorizada dentro do ChatGPT funciona para as ferramentas deste chat. Ela não fornece um token OAuth ao servidor Render. A publicação independente implementada aqui requer um token LinkedIn com permissão de publicação e o autor correspondente à aplicação que emitiu esse token. Não reutilize o identificador de membro do Composio com um token de outra aplicação: os identificadores são vinculados à aplicação. Outra opção futura é integrar o servidor a um projeto Composio próprio, com chave de API e conexão pertencentes a esse projeto.

Não foram configuradas credenciais LinkedIn no Render, nem validada uma postagem com imagem em uma conta real. Métricas de perfil ficam indisponíveis, com registro manual de resultados. Login no agente e autorização LinkedIn são etapas distintas.

## Validação

`node --test portal-api/linkedin-publisher.test.mjs portal-api/linkedin-rovix-strategy.test.mjs`
Testes do publisher usam respostas simuladas para validar publicação de texto, upload binário seguido de mídia, bloqueio de imagem não autorizada, identidade e ausência de retry em resposta incerta. Para homologação, verificar no perfil um post com imagem e um agendamento real antes de habilitar a geração automática.

Documentação da API: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/images-api?view=li-lms-2026-06
