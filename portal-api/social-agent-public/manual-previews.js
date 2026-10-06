window.manualPostPreset=window.manualPostPreset||null;
let manualPreviewState={entries:[]},manualPreviewUrls=[];

function releaseManualPreviewUrls(){
  manualPreviewUrls.forEach(url=>URL.revokeObjectURL(url));
  manualPreviewUrls=[];
}

async function manualPreviews(){
  title("Prévias manuais");
  $("#app").innerHTML='<div class="panel">Carregando prévias…</div>';
  try{
    manualPreviewState=await api("/manual-previews");
    drawManualPreviews();
  }catch(e){
    $("#app").innerHTML='<div class="panel warn">'+esc(e.message)+'</div>';
  }
}

function drawManualPreviews(){
  releaseManualPreviewUrls();
  const cards=(manualPreviewState.entries||[]).map((p,i)=>{
    const hook=p.strategy?.hook||"";
    return '<article class="strategy-card manual-preview-card">'+
      '<span class="pill">Prévia '+(i+1)+'</span>'+
      '<label>Título<input data-manual-title="'+esc(p.id)+'" value="'+esc(p.title)+'"></label>'+
      '<div class="manual-hook"><span class="k">GANCHO</span><p>'+esc(hook)+'</p></div>'+
      '<button class="manual-image-button" data-manual-open="'+esc(p.id)+'" type="button" aria-label="Ampliar imagem">'+
        '<img class="manual-preview-image" data-manual-image="'+esc(p.id)+'" alt="Carregando imagem">'+
      '</button>'+
      '<p class="muted">Imagem: '+esc(p.driveFileName||p.sourceImageName||"")+'</p>'+
      '<label>Legenda<textarea rows="10" data-manual-caption="'+esc(p.id)+'">'+esc(p.caption)+'</textarea></label>'+
      '<div class="strategy-actions">'+
        '<button class="primary" data-manual-copy="'+esc(p.id)+'">Copiar legenda</button>'+
        '<button class="secondary" data-manual-download="'+esc(p.id)+'">Baixar JPG 1080×1350</button>'+
        '<button class="secondary" data-manual-use="'+esc(p.id)+'">Usar em Criar Post</button>'+
      '</div>'+
    '</article>';
  }).join("");

  $("#app").innerHTML='<section class="panel">'+
    '<span class="k">PRÉVIAS MANUAIS</span>'+
    '<h2>Três propostas prontas para publicação manual</h2>'+
    '<p>O agente combina imagens de <b>ROVIX_IMAGENS_PRONTAS_45</b> com título, gancho e legenda. As prévias ficam separadas da agenda e da fila de aprovação.</p>'+
    '<button class="primary" id="generateManualPreviews">Gerar 3 prévias para postar manualmente</button>'+
    '<p class="muted">Gerar prévias não agenda, não publica e não consome a quantidade diária da automação. Você pode gerar outro trio quando quiser.</p>'+
    '<p id="manualPreviewFeedback" role="status" aria-live="polite"></p>'+
    '<div class="manual-preview-grid" id="manualPreviewCards">'+cards+'</div>'+
  '</section>';

  $("#generateManualPreviews").onclick=async()=>{
    const b=$("#generateManualPreviews");
    b.disabled=true;b.textContent="Preparando as 3 imagens…";
    try{
      manualPreviewState=await api("/manual-previews/generate",{method:"POST"});
      drawManualPreviews();
      $("#manualPreviewFeedback").textContent="Três prévias prontas. Confira as imagens e as legendas.";
    }catch(e){
      $("#manualPreviewFeedback").textContent=e.message;
      b.disabled=false;b.textContent="Gerar 3 prévias para postar manualmente";
    }
  };

  document.querySelectorAll("[data-manual-image]").forEach(async img=>{
    try{
      const blob=await manualPreviewImage(img.dataset.manualImage);
      if(!img.isConnected)return;
      const url=URL.createObjectURL(blob);
      manualPreviewUrls.push(url);
      img.src=url;
      img.alt="Prévia completa da imagem; clique para ampliar";
      const button=img.closest("[data-manual-open]");
      if(button)button.onclick=()=>openManualPreviewImage(url);
    }catch(e){
      img.alt="Imagem indisponível: "+e.message;
    }
  });

  document.querySelectorAll("[data-manual-copy]").forEach(b=>b.onclick=async()=>{
    const input=manualCaptionInput(b.dataset.manualCopy);
    try{
      await navigator.clipboard.writeText(input.value);
      $("#manualPreviewFeedback").textContent="Legenda copiada.";
    }catch{
      input.focus();input.select();
      $("#manualPreviewFeedback").textContent="Texto selecionado. Pressione Ctrl+C para copiar.";
    }
  });

  document.querySelectorAll("[data-manual-download]").forEach(b=>b.onclick=async()=>{
    b.disabled=true;
    try{
      const blob=await manualPreviewImage(b.dataset.manualDownload,true);
      const url=URL.createObjectURL(blob),a=document.createElement("a");
      a.href=url;a.download="ROVIX-"+b.dataset.manualDownload+".jpg";
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),30000);
      $("#manualPreviewFeedback").textContent="Imagem JPG 1080×1350 enviada para download.";
    }catch(e){
      $("#manualPreviewFeedback").textContent=e.message;
    }finally{b.disabled=false}
  });

  document.querySelectorAll("[data-manual-use]").forEach(b=>b.onclick=()=>{
    const p=(manualPreviewState.entries||[]).find(x=>x.id===b.dataset.manualUse);
    if(!p)return;
    const caption=manualCaptionInput(p.id).value;
    const titleInput=manualTitleInput(p.id);
    window.manualPostPreset={
      imageKey:p.imageKey,
      driveFileId:p.driveFileId,
      projectId:p.projectId,
      title:titleInput?.value||p.title,
      caption
    };
    view("create");
  });
}

function manualCaptionInput(id){
  return [...document.querySelectorAll("[data-manual-caption]")].find(x=>x.dataset.manualCaption===id);
}
function manualTitleInput(id){
  return [...document.querySelectorAll("[data-manual-title]")].find(x=>x.dataset.manualTitle===id);
}
async function manualPreviewImage(id,download=false){
  const r=await fetch(A+"/manual-previews/"+encodeURIComponent(id)+"/image"+(download?"?download=1":""),{credentials:"same-origin",headers:authHeaders()});
  if(!r.ok){let d={};try{d=await r.json()}catch{}throw new Error(d.error||"Não foi possível carregar a imagem.")}
  return r.blob();
}
function openManualPreviewImage(url){
  const old=document.getElementById("previewModal");if(old)old.remove();
  const modal=document.createElement("div");
  modal.id="previewModal";modal.className="preview-modal";
  modal.innerHTML='<div class="preview-card manual-preview-modal"><button class="preview-close" aria-label="Fechar">×</button><img alt="Prévia completa"></div>';
  modal.querySelector("img").src=url;
  modal.querySelector("button").onclick=()=>modal.remove();
  modal.onclick=e=>{if(e.target===modal)modal.remove()};
  document.body.appendChild(modal);
}
