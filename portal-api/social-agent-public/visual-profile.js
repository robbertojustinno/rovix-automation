async function visualProfile(){
  title('Identidade e imagens IA');
  const app=$('#app');
  app.innerHTML='<div class="panel">Carregando perfil visual…</div>';
  try{
    const data=await api('/visual-profile'),p=data.profile;
    const fields={brandName:'Nome da marca',segment:'Segmento',audience:'Público',products:'Produtos e serviços reais',style:'Estilo visual',references:'Descrição das referências aprovadas',restrictions:'O que evitar'};
    app.innerHTML='<div class="panel"><span class="k">GERAÇÃO ORIGINAL</span><h2>Identidade visual da empresa</h2><p>O gerador usa este perfil e o tema da postagem para criar uma imagem nova. O logotipo e o título são aplicados depois.</p><p class="muted">'+esc(data.notice)+'</p><p id="visualMode">'+(p.enabled?'IA ativa para novos posts automáticos.':'IA ainda não ativa. O fluxo atual usa o Drive.')+'</p><form id="visualForm" class="grid">'+Object.entries(fields).map(([k,label])=>'<label class="wide">'+label+'<textarea id="vp-'+k+'" maxlength="1000" rows="2">'+esc(p[k])+'</textarea></label>').join('')+'<label class="wide">Cores (separe por vírgula)<input id="vp-palette" value="'+esc(p.palette.join(', '))+'"></label><label class="wide">Logotipo da empresa (opcional)<input id="vp-logo" type="file" accept="image/png,image/jpeg,image/webp"><small>Na marca ROVIX, o emblema atual é usado por padrão.</small></label><div class="wide"><button class="primary">Salvar perfil</button><p>Salvar alterações desativa a IA até uma nova prévia ser aprovada.</p></div></form></div><div class="panel"><h2>Teste antes de ativar</h2><label>Projeto<select id="vp-project">'+S.projects.filter(x=>x.active).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('')+'</select></label><label>Tema da imagem<input id="vp-theme" maxlength="150" placeholder="Ex.: inspeção de instrumentos com QR Code"></label><button id="vp-generate" class="primary">Gerar imagem de teste</button><button id="vp-disable">Usar Drive nos novos posts</button><p id="vp-message" role="status"></p><div id="vp-preview"></div></div>';
    let current=p,previewId='';
    const message=t=>$('#vp-message')&&($('#vp-message').textContent=t);
    $('#visualForm').onsubmit=async e=>{
      e.preventDefault();
      try{
        const values=Object.fromEntries(Object.keys(fields).map(k=>[k,$('#vp-'+k).value]));
        values.palette=$('#vp-palette').value.split(',').map(c=>c.trim()).filter(Boolean);
        const logo=$('#vp-logo').files[0];
        if(logo)values.logoKey=(await api('/uploads',{method:'POST',body:JSON.stringify({dataUrl:await fileData(logo)})})).imageKey;
        current=(await api('/visual-profile',{method:'PUT',body:JSON.stringify(values)})).profile;
        previewId='';$('#vp-preview').innerHTML='';$('#visualMode').textContent='Perfil salvo. Gere uma prévia para aprovar.';message('Perfil salvo.');
      }catch(e){message(e.message)}
    };
    async function showPreview(post){
      if(!$('#vp-preview'))return;
      if(post.artStatus==='ready'){
        previewId=post.id;
        $('#vp-preview').innerHTML='<img style="max-width:100%;width:360px" data-post-image="'+esc(post.id)+'" alt="Imagem gerada para avaliação"><p>'+esc(post.caption)+'</p><p>Confira a relação com o tema, detalhes, marca e qualidade. Esta imagem de teste não tem publicação agendada.</p><button id="vp-activate" class="primary">Aprovar padrão e usar IA na automação</button>';
        hydratePostImages($('#vp-preview'));
        $('#vp-activate').onclick=async()=>{try{current=(await api('/visual-profile/activate',{method:'POST',body:JSON.stringify({enabled:true,previewId})})).profile;$('#visualMode').textContent='IA ativa para novos posts automáticos.';message('Perfil aprovado. Os próximos posts automáticos usarão imagens novas.')}catch(e){message(e.message)}};
        message('Prévia pronta para avaliação.');return;
      }
      message(post.artError||('Gerando imagem. Posição na fila: '+(post.artQueuePosition??'aguardando')+'.'));
      if(post.artStatus==='failed'){return}
      setTimeout(async()=>{if(!$('#vp-preview'))return;try{const rows=await api('/posts'),updated=rows.find(x=>x.id===post.id);if(updated)showPreview(updated)}catch(e){message(e.message)}},15000);
    }
    $('#vp-generate').onclick=async()=>{
      const button=$('#vp-generate');button.disabled=true;
      try{message('Enviando tema ao gerador gratuito…');const post=await api('/visual-profile/preview',{method:'POST',body:JSON.stringify({projectId:$('#vp-project').value,title:$('#vp-theme').value})});showPreview(post)}catch(e){message(e.message)}finally{button.disabled=false}
    };
    $('#vp-disable').onclick=async()=>{try{await api('/visual-profile/activate',{method:'POST',body:JSON.stringify({enabled:false})});$('#visualMode').textContent='Drive ativo para novos posts.';message('Novos posts usarão o Drive. Imagens já enfileiradas continuam em processamento.')}catch(e){message(e.message)}};
    const previous=(await api('/posts')).find(x=>x.isVisualPreview&&x.visualProfile?.version===p.version);
    if(previous)showPreview(previous);
  }catch(e){app.innerHTML='<div class="panel">'+esc(e.message)+'</div>'}
}
