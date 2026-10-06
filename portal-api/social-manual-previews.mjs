export async function generateManualPreviewBatch({loadDriveCatalog,prepareManualArtwork,saveDb,id},db,count=3){
  const catalog=await loadDriveCatalog();
  const history=db.meta.manualPreviewHistory||[];
  const activeDriveIds=new Set(
    db.posts
      .filter(p=>!["deleted","rejected","published","cancelled"].includes(p.status))
      .map(p=>p.driveFileId||p.strategy?.visual?.fileId)
      .filter(Boolean)
  );
  const usedCount=fileId=>
    db.posts.filter(p=>(p.driveFileId||p.strategy?.visual?.fileId)===fileId).length+
    history.filter(h=>h.driveFileId===fileId).length;

  const files=(catalog.files||[])
    .filter(f=>f.object_key&&!activeDriveIds.has(f.id))
    .sort((a,b)=>usedCount(a.id)-usedCount(b.id)||String(a.name).localeCompare(String(b.name)));

  if(files.length<count)throw new Error("São necessárias imagens livres na pasta Postagens_pre_aprovadas.");

  const entries=[];
  const virtual=[...db.posts,...history];
  const seed=Number(db.meta.manualPreviewSequence||0);

  for(let index=0;index<count;index++){
    let entry=null;
    for(const file of files.filter(f=>!entries.some(e=>e.driveFileId===f.id))){
      try{
        entry=await prepareManualArtwork({db,catalog,file,virtual,seed:seed+index,id});
        break;
      }catch{}
    }
    if(!entry)throw new Error("Não foi possível criar três propostas diferentes com imagens livres e coerentes.");
    entries.push(entry);
    virtual.push({...entry,createdAt:entry.createdAt});
  }

  db.meta.manualPreviewSequence=seed+count;
  db.meta.manualPreviewBatch={id:id("manual-batch"),createdAt:new Date().toISOString(),entries};
  db.meta.manualPreviewHistory=[
    ...history,
    ...entries.map(e=>({
      id:e.id,
      projectId:e.projectId,
      title:e.title,
      caption:e.caption,
      strategy:e.strategy,
      driveFileId:e.driveFileId,
      driveFileName:e.driveFileName,
      createdAt:e.createdAt
    }))
  ].slice(-120);

  await saveDb(db);
  return db.meta.manualPreviewBatch;
}

export function createManualPreviewApi({json,loadDriveCatalog,prepareManualArtwork,readManualImage,saveDb,id}){
  const deps={loadDriveCatalog,prepareManualArtwork,saveDb,id};
  return async function(req,res,u,db){
    const base="/social-api/manual-previews";
    if(req.method==="GET"&&u.pathname===base)return json(res,200,db.meta.manualPreviewBatch||{entries:[]});

    if(req.method==="POST"&&u.pathname===base+"/generate"){
      return json(res,201,await generateManualPreviewBatch(deps,db));
    }

    const image=u.pathname.match(/^\/social-api\/manual-previews\/([^/]+)\/image$/);
    if(req.method==="GET"&&image){
      const entry=db.meta.manualPreviewBatch?.entries?.find(e=>e.id===image[1]);
      if(!entry)return json(res,404,{error:"Prévia não encontrada; gere um novo trio."});
      if(!entry.imageKey)return json(res,409,{error:"Imagem da prévia ainda não está pronta."});
      const bytes=await readManualImage(entry);
      res.writeHead(200,{
        "Content-Type":"image/jpeg",
        "Content-Length":bytes.length,
        "Cache-Control":"private, no-store",
        ...(u.searchParams.get("download")==="1"?{"Content-Disposition":`attachment; filename="ROVIX-${entry.id}.jpg"`}:{})
      });
      res.end(bytes);
      return;
    }

    return json(res,404,{error:"Rota de prévias não encontrada"});
  };
}
