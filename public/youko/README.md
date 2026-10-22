# Mamono Hunter Youko — navegador

O ZIP enviado pelo usuário é conservado em partes Base64. `manifest.json` registra tamanho e SHA-256; a página reconstrói o arquivo e verifica sua integridade em HTTPS antes de carregar o emulador.

Emulador: EmulatorJS 4.2.3 / Genesis Plus GX, carregado pelo CDN oficial. A execução depende de acesso ao CDN. Créditos e licenças: https://github.com/EmulatorJS/EmulatorJS e https://github.com/ekeeke/Genesis-Plus-GX.

Controles de toque enviam eventos de teclado ao contêiner do emulador. Analógico: direcional digital com limiar ajustável; A/B/C: Z/X/C; START: Enter. Liberação em pointerup/cancel e ao perder foco. Salvamento/carregamento pelo menu do EmulatorJS.

Verificação: ZIP reconstruído e SHA-256 iguais ao arquivo enviado, assinatura SEGA validada, sintaxe conferida. O navegador de QA não oferece WebGL (1 ou 2), portanto não foi possível validar uma partida nesse ambiente. A página detecta essa ausência e mostra uma explicação antes de carregar o emulador. Validar partida em dispositivo com WebGL.
