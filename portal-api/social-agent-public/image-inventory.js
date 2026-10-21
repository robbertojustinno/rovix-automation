(function(){
  const panel=document.createElement('section');
  panel.className='panel';panel.id='imageInventory';
  panel.setAttribute('aria-label','Estoque de imagens');
  panel.innerHTML='<div class="row"><h2>Estoque de imagens</h2><button type="button" id="refreshImageInventory">Atualizar contador</button></div><div id="imageInventoryCards" class="cards" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr))"></div><p id="imageInventoryNote" class="muted" role="status">Carregando contador…</p>';
  document.getElementById('voiceCommander').before(panel);
  let busy=false,timer;
  async function refresh(){
    if(busy||!document.body.classList.contains('logged-in'))return;
    busy=true;
    const button=document.getElementById('refreshImageInventory');button.disabled=true;
    try{
      const stats=await api('/image-inventory');
      document.getElementById('imageInventoryCards').innerHTML=[
        ['Total na pasta',stats.total],['Já usadas',stats.used],['Reservadas',stats.reserved],['Restantes livres',stats.remaining]
      ].map(([label,value])=>'<div class="card"><div class="n">'+Number(value)+'</div><div class="muted">'+label+'</div></div>').join('');
      const note=document.getElementById('imageInventoryNote');
      note.textContent=(stats.remaining===0?'Sem imagens inéditas livres. Adicione novas imagens à pasta aprovada. ':'')+'Reservadas: postagens pendentes e prévias atuais. Usadas: publicações e imagens guardadas no histórico.';
      note.className=stats.remaining===0?'warn':'muted';
    }catch(e){document.getElementById('imageInventoryNote').textContent='Não foi possível atualizar o contador. '+e.message}
    finally{busy=false;button.disabled=false}
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(refresh,400)}
  document.getElementById('refreshImageInventory').onclick=refresh;
  const originalApi=api;
  api=async function(path,options={}){
    const result=await originalApi(path,options);
    if(['POST','PUT','DELETE'].includes(String(options.method||'GET').toUpperCase()))schedule();
    return result;
  };
  new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
  setInterval(()=>{if(!document.hidden)refresh()},60000);
  refresh();
})();
