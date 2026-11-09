import crypto from "node:crypto";

export async function listDriveRows(supa, path, token){
  const rows=[];
  for(let offset=0;;offset+=500){
    const page=await supa(path+"&order=id.asc&limit=500&offset="+offset,token);
    rows.push(...page);
    if(page.length<500)return rows;
  }
}

export async function copyDriveItem({
  user,token,body,supa,usedBytes,maxBytes,bucket,s3,CopyObjectCommand,DeleteObjectCommand,safeName
}){
  const fail=(status,error)=>({status,body:{error}});
  if(!body.item_id)return fail(400,"missing_item_id");
  const target=body.target_parent_id||null;
  const ownerFilter="owner_id=eq."+encodeURIComponent(user.id);
  const all=await listDriveRows(supa,"rovix_files?"+ownerFilter+"&select=id,parent_id,kind,name,object_key,mime_type,size_bytes,sha256",token);
  const byId=new Map(all.map(item=>[item.id,item]));
  const root=byId.get(body.item_id);
  if(!root)return fail(404,"not_found");
  if(target&&(target===root.id||byId.get(target)?.kind!=="folder"))return fail(400,"invalid_target");

  const children=new Map();
  for(const item of all){
    const siblings=children.get(item.parent_id)||[];
    siblings.push(item);
    children.set(item.parent_id,siblings);
  }
  const subtree=[root];
  const seen=new Set();
  let bytes=0;
  for(const item of subtree){
    if(seen.has(item.id))return fail(409,"Estrutura de pastas inválida.");
    seen.add(item.id);
    if(item.kind==="folder")subtree.push(...(children.get(item.id)||[]));
    else {
      if(!item.object_key)return fail(409,"Arquivo sem conteúdo no armazenamento.");
      bytes+=Number(item.size_bytes||0);
    }
  }
  const used=await usedBytes(token);
  if(used+bytes>maxBytes)return {status:413,body:{error:"storage_limit",used_bytes:used,max_bytes:maxBytes}};

  const ids=new Map(subtree.map(item=>[item.id,crypto.randomUUID()]));
  const records=subtree.map(item=>{
    const isFile=item.kind==="file";
    const id=ids.get(item.id);
    const name=item.id!==root.id?item.name:isFile
      ?safeName(item.name.replace(/(\.[^.]*)?$/, " - cópia$1"))
      :safeName(item.name+" - cópia");
    return {
      id,owner_id:user.id,parent_id:item.id===root.id?target:ids.get(item.parent_id),
      kind:item.kind,name,bucket,object_key:isFile?user.id+"/"+id+"/"+safeName(item.name):null,
      mime_type:isFile?item.mime_type||null:null,size_bytes:isFile?Number(item.size_bytes||0):0,
      sha256:isFile?item.sha256||null:null,is_product_asset:false,product_id:null
    };
  });

  const objects=[];
  let client;
  let inserting=false;
  try{
    for(const [index,item] of subtree.entries()){
      const key=records[index].object_key;
      if(!key)continue;
      client??=s3();
      objects.push(key);
      const source=item.object_key.split("/").map(encodeURIComponent).join("/");
      await client.send(new CopyObjectCommand({Bucket:bucket,Key:key,CopySource:bucket+"/"+source}));
    }
    inserting=true;
    await supa("rovix_files",token,{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(records)});
  }catch(error){
    // A transport failure during the database request can leave its outcome unknown.
    // Preserve objects in that case so any committed rows still point to valid files.
    if(!inserting||(error?.status>=400&&error.status<500)){
      await Promise.allSettled(objects.map(Key=>client.send(new DeleteObjectCommand({Bucket:bucket,Key}))));
    }
    console.error("Drive copy failed",inserting?"metadata":"storage",error?.name,error?.status);
    return fail(502,"Não foi possível concluir a cópia. Atualize o destino antes de tentar novamente.");
  }
  return {status:201,body:{ok:true,copied_items:records.length}};
}
