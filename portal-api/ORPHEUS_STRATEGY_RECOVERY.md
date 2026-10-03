# ORPHEUS: recuperação e estratégia de conteúdo

Estado anterior preservado em 03/10/2026 UTC (02/10 em São Paulo).

- Branch GitHub: `backup/orpheus-before-strategy-20261003`.
- Commit anterior: `5a0c3739cc21a119eb45d571f75124a531d8ff1b`.
- Serviço Render ORPHEUS: `srv-dau458vlot8c739jgq1g`.
- Backup R2, bucket `rovix-drive`: `orpheus-agent/backups/before-strategy-20261003-0138/db.json` e `preapproved-catalog.json`.
- Cópias verificadas por SHA-256. Nenhuma credencial incluída neste arquivo.

Para desfazer somente o código, use rollback no Render para o deploy anterior ou reverta o commit de estratégia na branch `feature/orpheus-social-agent-v1`. Isso preserva publicações e decisões feitas depois do backup.

Restaurar o banco inteiro substitui alterações posteriores, inclusive aprovações e registros de publicação. Antes de uma restauração de dados, faça outra cópia do banco atual e confira o Instagram para impedir republicação de conteúdo já enviado. Copie o backup para `orpheus-agent/db.json` somente se a restauração completa dos dados for necessária e autorizada. O catálogo também pode ser restaurado separadamente.

## Primeira versão

Painel com plano de 7 dias, ganchos, roteiros, testes exploratórios, resultados e aprendizados. Gerar plano só grava propostas. Preparar proposta verifica agenda e reserva de imagem, cria arte e rascunho; a prévia precisa ser carregada e aprovada antes da publicação.

Usa somente a pasta ORPHEUS autorizada `080b03b1-8429-44a1-9ae2-2dcaf086a4f7`. Agenda, configurações, autenticação e postagens existentes são preservadas. Não há migração na inicialização.

As propostas usam uma biblioteca editorial promocional. Não há leitura semântica automática das fotos nem extração de trechos do livro. Personagens, acontecimentos, citações e símbolos específicos exigem fonte oficial e revisão humana. A imagem completa fica acima da faixa editorial. Links de compra e app não são criados; o convite aponta ao perfil/link na bio ou à conversa.

Métricas indisponíveis ficam nulas, zero permanece zero e retenção não é preenchida para imagens. Comparações exigem pelo menos duas publicações por variante com mesma métrica e alcance; os resultados são observacionais e não demonstram causalidade.

Validação: `node --test portal-api/orpheus-strategy.test.mjs portal-api/tests/orpheus-flux.test.mjs` e verificação sintática dos arquivos modificados. A composição foi conferida com uma imagem real do acervo aprovado.
