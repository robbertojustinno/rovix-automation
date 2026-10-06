(function () {
  'use strict';
  function parseCommand(raw) {
    const t = String(raw || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    if (/\b(nao|cancelar|cancele|pare|parar)\b/.test(t)) return {action:'cancel'};
    if (/^(lia |orpheus |por favor )*(faca|faz|crie|criar|gere|gerar) (uma |1 )?(postagem|publicacao|post) manual( agora| por favor)?$/.test(t)) return {action:'publish'};
    if (/\b(ajuda|comandos)\b/.test(t)) return {action:'help'};
    const targets = [
      ['manualPreviews', /\b(previas|previa)\b/], ['queue', /\b(aprovacoes|aprovacao)\b/],
      ['calendar', /\b(calendario|agenda)\b/], ['automation', /\b(automacao)\b/],
      ['strategy', /\b(estrategia)\b/], ['projects', /\b(projetos)\b/],
      ['policies', /\b(politicas)\b/], ['linkedin', /\b(linkedin)\b/],
      ['create', /\b(criar post|novo post)\b/], ['dash', /\b(painel|visao geral|inicio)\b/]
    ];
    if (/\b(abrir|abra|mostrar|mostre|ver|ir|va)\b/.test(t)) {
      const target = targets.find(([, re]) => re.test(t));
      if (target) return {action:'view',view:target[0]};
    }
    return {action:'unknown'};
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = {parseCommand}; return; }
  const panel = document.getElementById('voiceCommander');
  if (!panel) return;
  const mic = document.getElementById('voiceMic'), input = document.getElementById('voiceText');
  const status = document.getElementById('voiceStatus'), submit = document.getElementById('voiceSend');
  const help = 'Diga: “faça uma postagem manual” para criar e publicar no LinkedIn conectado. Outros comandos: “abrir aprovações”, “abrir calendário”, “abrir automação” ou “abrir criar post”.';
  const report = text => { status.textContent = text; };
  let recognition = null, listening = false, busy = false, heard = false;
  function resetMic() { listening = false; mic.textContent = '🎙 Falar comando'; mic.setAttribute('aria-pressed','false'); }
  function stopListening() { if (recognition && listening) recognition.abort(); resetMic(); }
  async function execute(raw, fromVoice = false) {
    if (busy) return;
    if (!document.body.classList.contains('logged-in')) { report('Faça login para executar comandos.'); return; }
    const command = parseCommand(raw);
    if (command.action === 'cancel') { stopListening(); report('Comando cancelado.'); return; }
    if (command.action === 'help') { report(help); return; }
    if (command.action === 'unknown') { report('Não reconheci esse comando. ' + help); return; }
    stopListening(); busy = true; mic.disabled = true; submit.disabled = true;
    try {
      report((fromVoice ? 'Comando de voz recebido. Executando automaticamente: ' : 'Executando texto: ') + raw);
      if (command.action === 'publish') {
        report((fromVoice ? 'Comando de voz recebido. ' : '') + 'Criando imagem e legenda para publicar no LinkedIn…');
        const requestId = window.crypto.randomUUID();
        const result = await api('/voice/publish', {method:'POST',body:JSON.stringify({requestId})});
        S.posts = await api('/posts'); window.view('dash');
        report('Postagem publicada no LinkedIn. ID: ' + (result.post.linkedinPostId || result.post.metaMediaId));
      }
      if (command.action === 'view') { window.view(command.view); report('Tela aberta.'); }

    } catch (e) { report('Não foi possível executar: ' + e.message); }
    finally { busy = false; mic.disabled = false; submit.disabled = false; }
  }
  document.getElementById('voiceForm').onsubmit = e => { e.preventDefault(); execute(input.value); };
  document.getElementById('voiceHelp').onclick = () => report(help);
  mic.onclick = () => {
    if (listening) { recognition.stop(); return; }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { report('Este navegador não oferece reconhecimento de voz. Abra o site no Chrome e permita o microfone, ou digite o comando abaixo.'); return; }
    if (!window.isSecureContext) { report('Abra o endereço HTTPS para usar o microfone.'); return; }
    recognition = new Recognition(); recognition.lang = 'pt-BR'; recognition.continuous = false; recognition.interimResults = false; recognition.maxAlternatives = 1;
    heard = false;
    recognition.onstart = () => { listening = true; mic.textContent = '⏹ Parar de ouvir'; mic.setAttribute('aria-pressed','true'); report('Ouvindo… fale um comando.'); };
    recognition.onresult = event => {
      if (!document.body.classList.contains('logged-in') || document.hidden) return;
      const result = event.results[event.resultIndex]; if (!result?.isFinal || heard) return;
      heard = true; input.value = result[0].transcript; execute(input.value, true);
    };
    recognition.onerror = event => {
      resetMic();
      if (event.error === 'aborted') return;
      const messages = {'not-allowed':'Permita o acesso ao microfone nas configurações do navegador.', 'service-not-allowed':'O navegador bloqueou a voz. Abra o endereço no Chrome.', 'audio-capture':'Microfone indisponível. Verifique se outro aplicativo está usando.', 'no-speech':'Não ouvi uma fala. Toque no microfone e tente novamente.', network:'Falha na conexão do reconhecimento de voz. Tente novamente ou digite o comando.'};
      report(messages[event.error] || 'Não foi possível reconhecer a fala. Tente novamente ou digite o comando.');
    };
    recognition.onend = () => { resetMic(); if (!heard && status.textContent.startsWith('Ouvindo')) report('Nenhum comando reconhecido. Toque para tentar novamente.'); };
    try { recognition.start(); } catch (e) { resetMic(); report('Não foi possível iniciar o microfone: ' + e.message); }
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopListening(); });
  new MutationObserver(() => { if (!document.body.classList.contains('logged-in')) stopListening(); }).observe(document.body, {attributes:true,attributeFilter:['class']});
})();
