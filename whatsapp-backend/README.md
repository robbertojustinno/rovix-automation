# ROVIX Bot — backend WhatsApp

Serviço separado do painel Sites. `/health` distingue servidor online de integração validada. O processamento fica pausado até `BOT_ENABLED=true` e todas as credenciais/configuração estarem presentes.

Variáveis: `META_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `META_API_VERSION` (v26.0), `BOT_CONFIG_JSON` (config exportada do painel, objeto `config`), `BOT_ENABLED` (false inicialmente).

Configure segredos apenas no ambiente do Render. Nunca publique tokens no código, prints, URLs ou logs. `/webhook` valida desafio GET e assinatura HMAC sobre o corpo original POST. Processa apenas mensagens textuais do número configurado; ignora eventos de status/histórico/eco e duplicatas recentes. Usa o mesmo motor de regras do painel; pausa respostas após encaminhamento humano.

## Limites desta primeira implantação

- Sem credenciais da Meta, não envia nem recebe mensagens reais.
- Callback OAuth bloqueado com 503 intencionalmente: NÃO cadastrar a rota no Cadastro Incorporado até implementar sessão/state, troca do código e armazenamento durável criptografado.
- Configuração do painel ainda não sincroniza automaticamente. Exportar e configurar BOT_CONFIG_JSON para teste controlado.
- Deduplicação, etapa da conversa e pausa humana são em memória. Reinícios apagam esses dados. Exige armazenamento durável antes de uso de produção, além da política de licenciamento do painel.
- Verificação empresarial, análise/publicação do app, coexistência e inscrições WABA continuam pendentes.
- Resposta 200 da API de mensagens indica aceitação, não entrega; validar os eventos de status e o aparelho destinatário.
