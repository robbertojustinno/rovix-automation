import http from "node:http";
import crypto from "node:crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
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
      try{resolve(JSON.parse(data))}catch(reject)
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
  return t?JSON.parse(t):null;
}
async function usedBytes(token){
  const rows=await supa("rovix_files?select=size_bytes&kind=eq.file",token);
  return (rows||[]).reduce((n,x)=>n+Number(x.size_bytes||0),0);
}
function safeName(v){
  return String(v||"").replace(/[\\/\0]/g,"_").trim().slice(0,180);
}

const server=http.createServer(async(req,res)=>{
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
      const used=await usedBytes(token);
      return reply(res,200,{used_bytes:used,max_bytes:MAX_BYTES,remaining_bytes:Math.max(0,MAX_BYTES-used)},origin);
    }

    if(req.method==="POST"&&req.url==="/folders"){
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

    if(req.method==="PATCH"&&req.url==="/files"){
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

    if(req.method==="DELETE"&&req.url?.startsWith("/files/")){
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
