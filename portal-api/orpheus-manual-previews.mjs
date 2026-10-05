import {composeStrategy} from './orpheus-strategy.mjs';

export function createManualPreviewApi({json,loadDriveCatalog,attachPreapproved,saveDb,id,sendImage,body}){
 return async function(req,res,u,db){
  const base='/orpheus-api/manual-previews';
  if(req.method==='GET'&&u.pathname===base)return json(res,200,{...(db.meta.manualPreviewBatch||{}),entries:(db.meta.manualPreviewBatch?.entries||[]).map(e=>({...e,postStatus:db.posts.find(p=>p.id===e.postId)?.status||null}))});
  if(req.method==='POST'&&u.pathname===base+'/generate'){
   const catalog=await loadDriveCatalog(),history=db.meta.manualPreviewHistory||[],artHistory=db.meta.preapprovedHistory||[];
   const active=new Set(db.posts.filter(p=>!['deleted','rejected','published'].includes(p.status)).map(p=>p.sourceImageKey));
   const uses=key=>artHistory.filter(h=>h.key===key).length;
   const files=catalog.files.filter(f=>!active.has(f.object_key)).sort((a,b)=>uses(a.object_key)-uses(b.object_key)||a.name.localeCompare(b.name));
   if(files.length<3)throw new Error('São necessárias três imagens livres na pasta Postagens_pre_aprovadas.');
   const entries=[],virtual=[...db.posts,...history],seed=Number(db.meta.manualPreviewSequence||0);
   for(let index=0;index<3;index++){
    let content,file;
    for(const candidate of files.filter(f=>!entries.some(e=>e.sourceImageKey===f.object_key))){
     try{const proposal=composeStrategy(candidate,virtual,seed+index);if(!db.projects.some(p=>p.id===proposal.projectId&&p.active))continue;content=proposal;file=candidate;break}catch{}
    }
    if(!content)throw new Error('Não foi possível criar três ideias diferentes para os projetos ativos.');
    const entry={id:id('manual-preview'),...content,sourceImageKey:file.object_key,createdAt:new Date().toISOString(),scheduledAt:'',status:'manual_preview'};
    const art=await attachPreapproved(db,entry);if(!art.made)throw new Error(art.error||'Falha ao preparar prévia');
    entries.push(entry);virtual.push(entry);
   }
   db.meta.manualPreviewSequence=seed+3;
   db.meta.manualPreviewBatch={id:id('manual-batch'),createdAt:new Date().toISOString(),entries};
   db.meta.manualPreviewHistory=[...history,...entries.map(e=>({id:e.id,title:e.title,caption:e.caption,strategy:e.strategy,createdAt:e.createdAt}))].slice(-90);
   await saveDb(db);return json(res,201,db.meta.manualPreviewBatch);
  }
  const draft=u.pathname.match(/^\/orpheus-api\/manual-previews\/([^/]+)\/draft$/);
  if(req.method==='POST'&&draft){
   const entry=db.meta.manualPreviewBatch?.entries.find(e=>e.id===draft[1]);if(!entry)throw new Error('Prévia não encontrada; atualize o painel.');
   const d=await body(req),caption=String(d.caption??entry.caption).trim();if(!caption||caption.length>2200)throw new Error('A legenda deve ter entre 1 e 2200 caracteres.');
   let post=db.posts.find(p=>p.id===entry.postId)||db.posts.find(p=>p.imageKey===entry.imageKey&&p.status!=='deleted');
   if(post&&['published','publishing'].includes(post.status)){entry.postId=post.id;await saveDb(db);return json(res,200,post);}
   if(!post||post.status==='deleted'){
    const project=db.projects.find(p=>p.id===entry.projectId&&p.active);if(!project)throw new Error('Projeto indisponível.');
    post={...structuredClone(entry),id:id('manual-post'),projectName:project.name,status:'draft',scheduledAt:'',generatedBy:'manual-preview',createdAt:new Date().toISOString(),manualPreviewId:entry.id};delete post.postId;
    db.posts.unshift(post);entry.postId=post.id;
   }
   if(post.caption!==caption){post.caption=caption;post.status='draft';delete post.artValidation;delete post.artPreviewViewedAt;post.artStatus='review_pending';}
   await saveDb(db);return json(res,200,post);
  }
  const image=u.pathname.match(/^\/orpheus-api\/manual-previews\/([^/]+)\/image$/);
  if(req.method==='GET'&&image){const entry=db.meta.manualPreviewBatch?.entries.find(e=>e.id===image[1]);if(!entry)return json(res,404,{error:'Prévia não encontrada; atualize o painel.'});return sendImage(res,entry,u.searchParams.get('download')==='1');}
  return json(res,404,{error:'Rota de prévias não encontrada'});
 };
}
