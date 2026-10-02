import http from "node:http";
import {handleSocialAgent} from "./social-agent.mjs";
import crypto from "node:crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand
} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

const PORT=Number(process.env.PORT||10000);
const SUPABASE_URL=process.env.SUPABASE_URL||"";
const SUPABASE_PUBLISHABLE_KEY=process.env.SUPABASE_PUBLISHABLE_KEY||"";
const R2_ENDPOINT=process.env.R2_ENDPOINT||"";
const R2_ACCESS_KEY_ID=process.env.R2_ACCESS_KEY_ID||"";
const R2_SECRET_ACCESS_KEY=process.env.R2_SECRET_ACCESS_KEY||"";
const R2_BUCKET=process.env.R2_BUCKET||"rovix-drive";
const MAX_BYTES=10*1024*1024*1024;
const ALLOWED_ORIGINS=(process.env.ALLOWED_ORIGINS||"https://rovix-drive-preview.onrender.com,https://www.rovixautomation.com.br,https://rovixautomation.com.br")
  .split(",").map(x=>x.trim()).filter(Boolean);

function corsOrigin(req){
  const origin=req.headers.origin||"";
  return ALLOWED_ORIGINS.includes(origin)?origin:"";
}
function reply(res,status,body,origin=""){
  res.writeHead(status,{
    "Content-Type":"application/json; charset=utf-8",
    "Access-Control-Allow-Origin":origin,
    "Access-Control-Allow-Headers":"Authorization, Content-Type",
    "Access-Control-Allow-Methods":"GET,POST,PATCH,DELETE,OPTIONS",
    "Vary":"Origin"
  });
  res.end(JSON.stringify(body));
}
function bearer(req){
  const h=req.headers.authorization||"";
  return h.startsWith("Bearer ")?h.slice(7):"";
}
async function readBody(req){
  return await new Promise((resolve,reject)=>{
    let data="";
    req.on("data",chunk=>{
      data+=chunk;
      if(data.length>1024*1024)reject(new Error("BODY_TOO_LARGE"));
    });
    req.on("end",()=>{
      if(!data)return resolve({});
      try{resolve(JSON.parse(data))}catch(err){reject(err)}
    });
    req.on("error",reject);
  });
}
function requireConfig(){
  if(!SUPABASE_URL||!SUPABASE_PUBLISHABLE_KEY)throw Object.assign(new Error("SUPABASE_NOT_CONFIGURED"),{status:503});
}
function requireR2(){
  if(!R2_ENDPOINT||!R2_ACCESS_KEY_ID||!R2_SECRET_ACCESS_KEY)throw Object.assign(new Error("R2_NOT_CONFIGURED"),{status:503});
}
function s3(){
  requireR2();
  return new S3Client({
    region:"auto",
    endpoint:R2_ENDPOINT,
    credentials:{accessKeyId:R2_ACCESS_KEY_ID,secretAccessKey:R2_SECRET_ACCESS_KEY}
  });
}
async function requireUser(req){
  requireConfig();
  const token=bearer(req);
  if(!token)throw Object.assign(new Error("UNAUTHORIZED"),{status:401});
  const r=await fetch(SUPABASE_URL+"/auth/v1/user",{
    headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:"Bearer "+token}
  });
  if(!r.ok)throw Object.assign(new Error("UNAUTHORIZED"),{status:401});
  return {token,user:await r.json()};
}
async function supa(path,token,init={}){
  const r=await fetch(SUPABASE_URL+"/rest/v1/"+path,{
    ...init,
    headers:{
      apikey:SUPABASE_PUBLISHABLE_KEY,
      Authorization:"Bearer "+token,
      "Content-Type":"application/json",
      Prefer:"return=representation",
      ...(init.headers||{})
    }
  });
  if(!r.ok){
    const t=await r.text();
    throw Object.assign(new Error(t||"SUPABASE_ERROR"),{status:r.status});
  }
  const t=await r.text();
  const result=t?JSON.parse(t):null;
  if(path.startsWith("rovix_files")&&["POST","PATCH","DELETE"].includes(init.method)){
    try{await syncOrpheusCatalog(token)}catch(e){console.error("ORPHEUS catalog sync failed",e.message)}
  }
  return result;
}
async function syncOrpheusCatalog(token){
  const folderId="080b03b1-8429-44a1-9ae2-2dcaf086a4f7",ownerId="c926b386-69e0-4fbb-be99-6aa1a7872d86";
  const folders=await supa("rovix_files?id=eq."+folderId+"&owner_id=eq."+ownerId+"&kind=eq.folder&select=id",token);
  if(!folders?.length)return;
  const files=[];let offset=0;
  while(true){
    const page=await supa("rovix_files?parent_id=eq."+folderId+"&owner_id=eq."+ownerId+"&kind=eq.file&select=id,name,object_key,mime_type,size_bytes&order=id&limit=500&offset="+offset,token);
    files.push(...(page||[]));if(!page||page.length<500)break;offset+=500;
  }
  await s3().send(new PutObjectCommand({Bucket:R2_BUCKET,Key:"orpheus-agent/preapproved-catalog.json",Body:JSON.stringify({folderId,ownerId,files,updatedAt:new Date().toISOString()}),ContentType:"application/json"}));
}
async function requireAdmin(token){
  const rows=await supa("rovix_profiles?select=role",token);
  if(rows?.[0]?.role!=="admin")throw Object.assign(new Error("ADMIN_REQUIRED"),{status:403});
}
async function usedBytes(token){
  const rows=await supa("rovix_files?select=size_bytes&kind=eq.file",token);
  return (rows||[]).reduce((n,x)=>n+Number(x.size_bytes||0),0);
}
function safeName(v){
  return String(v||"").replace(/[\\/\0]/g,"_").trim().slice(0,180);
}

const server=http.createServer(async(req,res)=>{
  if(await handleSocialAgent(req,res))return;
  const origin=corsOrigin(req);
  if(req.method==="OPTIONS"){
    if(!origin)return reply(res,403,{error:"origin_not_allowed"});
    return reply(res,204,{},origin);
  }
  if(req.url==="/health")return reply(res,200,{ok:true,service:"rovix-drive-api",r2_configured:Boolean(R2_ENDPOINT&&R2_ACCESS_KEY_ID&&R2_SECRET_ACCESS_KEY)},origin);
  if(!origin)return reply(res,403,{error:"origin_not_allowed"});
  try{
    const {token,user}=await requireUser(req);

    if(req.method==="GET"&&req.url==="/usage"){
      await requireAdmin(token);
      const used=await usedBytes(token);
      return reply(res,200,{used_bytes:used,max_bytes:MAX_BYTES,remaining_bytes:Math.max(0,MAX_BYTES-used)},origin);
    }

    if(req.method==="POST"&&req.url==="/folders"){
      await requireAdmin(token);
      const body=await readBody(req);
      const name=safeName(body.name);
      if(!name)return reply(res,400,{error:"invalid_name"},origin);
      const rows=await supa("rovix_files",token,{
        method:"POST",
        body:JSON.stringify({owner_id:user.id,parent_id:body.parent_id||null,kind:"folder",name,size_bytes:0})
      });
      return reply(res,201,{item:rows?.[0]||null},origin);
    }

    if(req.method==="POST"&&req.url==="/upload-url"){
      await requireAdmin(token);
      const body=await readBody(req);
      const name=safeName(body.name);
      const size=Number(body.size||0);
      if(!name||!Number.isFinite(size)||size<=0)return reply(res,400,{error:"invalid_file"},origin);
      const used=await usedBytes(token);
      if(used+size>MAX_BYTES)return reply(res,413,{error:"storage_limit",used_bytes:used,max_bytes:MAX_BYTES},origin);
      const objectKey=user.id+"/"+crypto.randomUUID()+"/"+name;
      const cmd=new PutObjectCommand({
        Bucket:R2_BUCKET,
        Key:objectKey,
        ContentType:body.mime_type||"application/octet-stream"
      });
      const uploadUrl=await getSignedUrl(s3(),cmd,{expiresIn:600});
      return reply(res,200,{upload_url:uploadUrl,object_key:objectKey,expires_in:600},origin);
    }

    if(req.method==="POST"&&req.url==="/complete-upload"){
      await requireAdmin(token);
      const body=await readBody(req);
      const name=safeName(body.name);
      const size=Number(body.size||0);
      if(!name||!body.object_key||size<=0)return reply(res,400,{error:"invalid_file"},origin);
      if(!String(body.object_key).startsWith(user.id+"/"))return reply(res,403,{error:"invalid_object_key"},origin);
      const rows=await supa("rovix_files",token,{
        method:"POST",
        body:JSON.stringify({
          owner_id:user.id,
          parent_id:body.parent_id||null,
          kind:"file",
          name,
          bucket:R2_BUCKET,
          object_key:body.object_key,
          mime_type:body.mime_type||null,
          size_bytes:size,
          sha256:body.sha256||null
        })
      });
      return reply(res,201,{item:rows?.[0]||null},origin);
    }

    if(req.method==="POST"&&req.url==="/download-url"){
      await requireAdmin(token);
      const body=await readBody(req);
      const rows=await supa("rovix_files?id=eq."+encodeURIComponent(body.file_id)+"&kind=eq.file&select=id,name,object_key",token);
      const file=rows?.[0];
      if(!file)return reply(res,404,{error:"file_not_found"},origin);
      const cmd=new GetObjectCommand({
        Bucket:R2_BUCKET,
        Key:file.object_key,
        ResponseContentDisposition:'attachment; filename="'+String(file.name).replace(/"/g,"")+'"'
      });
      const downloadUrl=await getSignedUrl(s3(),cmd,{expiresIn:300});
      return reply(res,200,{download_url:downloadUrl,expires_in:300},origin);
    }

    if(req.method==="POST"&&req.url==="/share-url"){
      await requireAdmin(token);
      const body=await readBody(req);
      const hours=Number(body.hours||24);
      if(![1,24,168].includes(hours))return reply(res,400,{error:"invalid_expiration"},origin);
      const rows=await supa("rovix_files?id=eq."+encodeURIComponent(body.file_id)+"&kind=eq.file&select=id,name,object_key",token);
      const file=rows?.[0];
      if(!file)return reply(res,404,{error:"file_not_found"},origin);
      const expiresIn=hours*3600;
      const cmd=new GetObjectCommand({
        Bucket:R2_BUCKET,
        Key:file.object_key,
        ResponseContentDisposition:'attachment; filename="'+String(file.name).replace(/"/g,"")+'"'
      });
      const shareUrl=await getSignedUrl(s3(),cmd,{expiresIn});
      const expiresAt=new Date(Date.now()+expiresIn*1000).toISOString();
      await supa("rovix_shares",token,{
        method:"POST",
        body:JSON.stringify({user_id:user.id,file_id:file.id,expires_at:expiresAt})
      });
      return reply(res,200,{share_url:shareUrl,expires_in:expiresIn,expires_at:expiresAt,file_name:file.name},origin);
    }

    if(req.method==="PATCH"&&req.url==="/files"){
      await requireAdmin(token);
      const body=await readBody(req);
      if(!body.id)return reply(res,400,{error:"missing_id"},origin);
      const patch={};
      if(body.name!==undefined){
        const name=safeName(body.name);
        if(!name)return reply(res,400,{error:"invalid_name"},origin);
        patch.name=name;
      }
      if(body.parent_id!==undefined)patch.parent_id=body.parent_id||null;
      const rows=await supa("rovix_files?id=eq."+encodeURIComponent(body.id),token,{
        method:"PATCH",
        body:JSON.stringify(patch)
      });
      return reply(res,200,{item:rows?.[0]||null},origin);
    }


    if(req.method==="POST"&&req.url==="/copy"){
      await requireAdmin(token);
      const body=await readBody(req);
      if(!body.item_id)return reply(res,400,{error:"missing_item_id"},origin);
      const targetParent=body.target_parent_id||null;

      const rootRows=await supa("rovix_files?id=eq."+encodeURIComponent(body.item_id)+"&select=*",token);
      const root=rootRows?.[0];
      if(!root)return reply(res,404,{error:"not_found"},origin);

      const all=await supa("rovix_files?select=*",token);
      const byParent=new Map();
      for(const item of all||[]){
        const key=item.parent_id||"ROOT";
        if(!byParent.has(key))byParent.set(key,[]);
        byParent.get(key).push(item);
      }

      const collect=(item,out=[])=>{
        out.push(item);
        if(item.kind==="folder"){
          for(const child of byParent.get(item.id)||[])collect(child,out);
        }
        return out;
      };
      const subtree=collect(root,[]);
      const bytes=subtree.filter(x=>x.kind==="file").reduce((n,x)=>n+Number(x.size_bytes||0),0);
      const used=await usedBytes(token);
      if(used+bytes>MAX_BYTES)return reply(res,413,{error:"storage_limit",used_bytes:used,max_bytes:MAX_BYTES},origin);

      const copySource=key=>R2_BUCKET+"/"+encodeURIComponent(key).replace(/%2F/g,"/");
      const idMap=new Map();

      for(const item of subtree){
        const parentId=item.id===root.id?targetParent:(idMap.get(item.parent_id)||targetParent);
        if(item.kind==="folder"){
          const rows=await supa("rovix_files",token,{
            method:"POST",
            body:JSON.stringify({
              owner_id:user.id,parent_id:parentId,kind:"folder",
              name:item.id===root.id?safeName(item.name+" - cópia"):item.name,
              size_bytes:0
            })
          });
          idMap.set(item.id,rows?.[0]?.id);
        }else{
          const newKey=user.id+"/"+crypto.randomUUID()+"/"+safeName(item.name);
          await s3().send(new CopyObjectCommand({
            Bucket:R2_BUCKET,
            Key:newKey,
            CopySource:copySource(item.object_key)
          }));
          const rows=await supa("rovix_files",token,{
            method:"POST",
            body:JSON.stringify({
              owner_id:user.id,parent_id:parentId,kind:"file",
              name:item.id===root.id?safeName(item.name.replace(/(\.[^.]*)?$/, " - cópia$1")):item.name,
              bucket:R2_BUCKET,object_key:newKey,mime_type:item.mime_type||null,
              size_bytes:Number(item.size_bytes||0),sha256:item.sha256||null,
              is_product_asset:false,product_id:null
            })
          });
          idMap.set(item.id,rows?.[0]?.id);
        }
      }
      return reply(res,201,{ok:true,copied_items:subtree.length},origin);
    }

    if(req.method==="POST"&&req.url==="/move"){
      await requireAdmin(token);
      const body=await readBody(req);
      if(!body.item_id)return reply(res,400,{error:"missing_item_id"},origin);
      const targetParent=body.target_parent_id||null;

      const rootRows=await supa("rovix_files?id=eq."+encodeURIComponent(body.item_id)+"&select=id,kind,parent_id",token);
      const root=rootRows?.[0];
      if(!root)return reply(res,404,{error:"not_found"},origin);
      if(targetParent===root.id)return reply(res,400,{error:"invalid_target"},origin);

      if(root.kind==="folder"&&targetParent){
        let cursor=targetParent;
        const visited=new Set();
        while(cursor){
          if(cursor===root.id)return reply(res,400,{error:"cannot_move_into_descendant"},origin);
          if(visited.has(cursor))break;
          visited.add(cursor);
          const rows=await supa("rovix_files?id=eq."+encodeURIComponent(cursor)+"&select=id,parent_id,kind",token);
          const node=rows?.[0];
          if(!node||node.kind!=="folder")return reply(res,400,{error:"invalid_target"},origin);
          cursor=node.parent_id||null;
        }
      }

      const rows=await supa("rovix_files?id=eq."+encodeURIComponent(root.id),token,{
        method:"PATCH",
        body:JSON.stringify({parent_id:targetParent})
      });
      return reply(res,200,{item:rows?.[0]||null},origin);
    }

    if(req.method==="POST"&&req.url==="/orders/start"){
      const body=await readBody(req);
      if(!body.product_id)return reply(res,400,{error:"missing_product_id"},origin);
      const products=await supa("rovix_products?id=eq."+encodeURIComponent(body.product_id)+"&is_active=eq.true&select=id,name,price,currency,is_free",token);
      const product=products?.[0];
      if(!product)return reply(res,404,{error:"product_not_found"},origin);

      if(product.is_free){
        const entitlement=await supa("rovix_entitlements",token,{
          method:"POST",
          headers:{Prefer:"resolution=merge-duplicates,return=representation"},
          body:JSON.stringify({
            user_id:user.id,
            product_id:product.id,
            status:"active"
          })
        });
        return reply(res,200,{status:"granted",entitlement:entitlement?.[0]||null},origin);
      }

      const order=await supa("rovix_orders",token,{
        method:"POST",
        body:JSON.stringify({
          user_id:user.id,
          product_id:product.id,
          status:"pending",
          amount:Number(product.price||0),
          currency:product.currency||"BRL",
          payment_provider:"pending"
        })
      });
      return reply(res,201,{
        status:"payment_pending",
        order:order?.[0]||null,
        checkout_url:null
      },origin);
    }

    if(req.method==="POST"&&req.url==="/product-download-url"){
      const body=await readBody(req);
      if(!body.product_id)return reply(res,400,{error:"missing_product_id"},origin);
      const ent=await supa("rovix_entitlements?product_id=eq."+encodeURIComponent(body.product_id)+"&status=eq.active&select=id,expires_at",token);
      const active=(ent||[]).find(e=>!e.expires_at||new Date(e.expires_at).getTime()>Date.now());
      if(!active)return reply(res,403,{error:"product_not_entitled"},origin);
      const rows=await supa("rovix_files?product_id=eq."+encodeURIComponent(body.product_id)+"&is_product_asset=eq.true&kind=eq.file&select=id,name,object_key",token);
      const file=rows?.[0];
      if(!file)return reply(res,404,{error:"product_file_not_found"},origin);
      const cmd=new GetObjectCommand({
        Bucket:R2_BUCKET,
        Key:file.object_key,
        ResponseContentDisposition:'attachment; filename="'+String(file.name).replace(/"/g,"")+'"'
      });
      const downloadUrl=await getSignedUrl(s3(),cmd,{expiresIn:300});
      return reply(res,200,{download_url:downloadUrl,expires_in:300,file_name:file.name},origin);
    }

    if(req.method==="DELETE"&&req.url?.startsWith("/files/")){
      await requireAdmin(token);
      const id=req.url.slice("/files/".length);
      const rows=await supa("rovix_files?id=eq."+encodeURIComponent(id)+"&select=id,kind,object_key",token);
      const file=rows?.[0];
      if(!file)return reply(res,404,{error:"not_found"},origin);
      if(file.kind==="file"&&file.object_key){
        await s3().send(new DeleteObjectCommand({Bucket:R2_BUCKET,Key:file.object_key}));
      }
      await supa("rovix_files?id=eq."+encodeURIComponent(id),token,{method:"DELETE"});
      return reply(res,200,{ok:true},origin);
    }

    return reply(res,404,{error:"not_found"},origin);
  }catch(err){
    return reply(res,err?.status||500,{error:err?.message||"internal_error"},origin);
  }
});

server.listen(PORT,"0.0.0.0",()=>console.log("ROVIX Drive API listening on",PORT));
