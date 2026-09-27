import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import zlib from "node:zlib";
import {fileURLToPath} from "node:url";
import {S3Client,PutObjectCommand,GetObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const PUBLIC=path.join(__dirname,"social-agent-public");
const R2_ENDPOINT=process.env.R2_ENDPOINT||"";
const R2_ACCESS_KEY_ID=process.env.R2_ACCESS_KEY_ID||"";
const R2_SECRET_ACCESS_KEY=process.env.R2_SECRET_ACCESS_KEY||"";
const R2_BUCKET=process.env.R2_BUCKET||"rovix-drive";
const DB_KEY="social-agent/db.json";
const ADMIN_KEY=process.env.SOCIAL_ADMIN_KEY||"";
const CRON_SECRET=process.env.SOCIAL_CRON_SECRET||"";
const SOCIAL_PUBLIC_BASE=(process.env.SOCIAL_PUBLIC_BASE||"https://rovix-drive-api.onrender.com/social-agent").replace(/\/$/,"");

const DEFAULT_DB={
  projects:[
    {id:"tagcheck",name:"TagCheck",active:true,frequency:3,tone:"técnico, profissional e comercial",cta:"Conheça o TagCheck"},
    {id:"rovix-drive",name:"ROVIX Drive",active:true,frequency:2,tone:"direto, tecnológico e acessível",cta:"Conheça o ROVIX Drive"},
    {id:"uap-studio",name:"UAP Studio",active:true,frequency:2,tone:"engenharia, automação e inovação",cta:"Acompanhe o desenvolvimento do UAP Studio"},
    {id:"cipher",name:"CIPHER — Protocolo Orpheus",active:true,frequency:2,tone:"thriller, mistério e espionagem",cta:"Descubra CIPHER — Protocolo Orpheus"}
  ],posts:[]
};

function s3(){
  if(!R2_ENDPOINT||!R2_ACCESS_KEY_ID||!R2_SECRET_ACCESS_KEY)throw new Error("R2_NOT_CONFIGURED");
  return new S3Client({region:"auto",endpoint:R2_ENDPOINT,credentials:{accessKeyId:R2_ACCESS_KEY_ID,secretAccessKey:R2_SECRET_ACCESS_KEY}});
}
async function readStream(stream){return await stream.transformToString()}
async function loadDb(){
  try{
    const r=await s3().send(new GetObjectCommand({Bucket:R2_BUCKET,Key:DB_KEY}));
    const db=JSON.parse(await readStream(r.Body));
    db.meta=db.meta||{};
    if(!db.meta.seededInstitutionalPost){
      db.posts=db.posts||[];
      db.posts.unshift({
        id:"seed-institucional-001",
        projectId:"rovix-drive",
        projectName:"ROVIX Automation",
        title:"Tecnologia aplicada ao mundo real",
        caption:"A ROVIX une automação, software e inovação para transformar processos em soluções práticas.\n\nDo chão de fábrica ao ambiente digital, seguimos desenvolvendo ferramentas para organizar, conectar e automatizar operações.\n\nAcompanhe os próximos projetos e lançamentos da ROVIX.\n\n#ROVIX #AutomacaoIndustrial #Tecnologia #Industria40 #Software #Inovacao",
        imageKey:"",
        imageUrl:SOCIAL_PUBLIC_BASE+"/brand.png",
        scheduledAt:"",
        status:"draft",
        createdAt:new Date().toISOString()
      });
      db.meta.seededInstitutionalPost=true;
      await saveDb(db);
    }
    return db;
  }catch(e){
    if(e?.name==="NoSuchKey"||e?.$metadata?.httpStatusCode===404){
      const db=structuredClone(DEFAULT_DB);
      db.meta={seededInstitutionalPost:true};
      db.posts=[{
        id:"seed-institucional-001",
        projectId:"rovix-drive",
        projectName:"ROVIX Automation",
        title:"Tecnologia aplicada ao mundo real",
        caption:"A ROVIX une automação, software e inovação para transformar processos em soluções práticas.\n\nDo chão de fábrica ao ambiente digital, seguimos desenvolvendo ferramentas para organizar, conectar e automatizar operações.\n\nAcompanhe os próximos projetos e lançamentos da ROVIX.\n\n#ROVIX #AutomacaoIndustrial #Tecnologia #Industria40 #Software #Inovacao",
        imageKey:"",
        imageUrl:SOCIAL_PUBLIC_BASE+"/brand.png",
        scheduledAt:"",
        status:"draft",
        createdAt:new Date().toISOString()
      }];
      await saveDb(db);return db
    }
    throw e;
  }
}
async function saveDb(db){await s3().send(new PutObjectCommand({Bucket:R2_BUCKET,Key:DB_KEY,Body:JSON.stringify(db,null,2),ContentType:"application/json"}))}
function json(res,status,data){res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});res.end(JSON.stringify(data))}
function text(res,status,data,type="text/plain; charset=utf-8"){res.writeHead(status,{"Content-Type":type,"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});res.end(data)}
function mime(p){return({".html":"text/html; charset=utf-8",".js":"application/javascript; charset=utf-8",".css":"text/css; charset=utf-8"})[path.extname(p)]||"application/octet-stream"}
function body(req,limit=12*1024*1024){return new Promise((resolve,reject)=>{let raw="";req.on("data",c=>{raw+=c;if(raw.length>limit){reject(new Error("Payload muito grande"));req.destroy()}});req.on("end",()=>{if(!raw)return resolve({});try{resolve(JSON.parse(raw))}catch{reject(new Error("JSON inválido"))}});req.on("error",reject)})}
function auth(req){return !ADMIN_KEY||req.headers["x-social-key"]===ADMIN_KEY}
function metaCfg(){return{token:process.env.META_ACCESS_TOKEN||"",ig:process.env.META_IG_USER_ID||"",version:process.env.META_GRAPH_VERSION||"v26.0",host:process.env.META_API_HOST||"graph.instagram.com"}}
function metaConfigured(){const c=metaCfg();return!!(c.token&&c.ig&&c.version&&c.host)}
async function metaFetch(route,{method="GET",params={}}={}){
  const c=metaCfg();if(!metaConfigured())throw new Error("Instagram não configurado no servidor");
  const u=new URL("https://"+c.host+"/"+encodeURIComponent(c.version)+"/"+String(route).replace(/^\//,""));
  const headers={Authorization:"Bearer "+c.token,"User-Agent":"ROVIX-Social-Agent/0.2"};
  const init={method,headers};
  if(method==="GET")Object.entries(params).forEach(([k,v])=>v!==""&&v!=null&&u.searchParams.set(k,String(v)));
  else{headers["Content-Type"]="application/x-www-form-urlencoded";init.body=new URLSearchParams(Object.entries(params).filter(([,v])=>v!==""&&v!=null)).toString()}
  const r=await fetch(u,init),raw=await r.text();let d;try{d=JSON.parse(raw)}catch{d={raw}};
  if(!r.ok||d.error)throw new Error(d?.error?.message||("Erro HTTP "+r.status));return d;
}
async function testMeta(){
  const c=metaCfg(),d=await metaFetch(c.ig,{params:{fields:"id,username,account_type"}});
  return{connected:true,id:d.id||c.ig,username:d.username||null,accountType:d.account_type||null,apiHost:c.host,apiVersion:c.version};
}
async function mediaUrl(post){
  if(post.imageKey){
    return await getSignedUrl(s3(),new GetObjectCommand({Bucket:R2_BUCKET,Key:post.imageKey}),{expiresIn:900});
  }
  if(/^https:\/\//i.test(post.imageUrl||""))return post.imageUrl;
  throw new Error("Adicione uma imagem antes de publicar");
}
async function waitContainer(id){
  for(let i=0;i<12;i++){const d=await metaFetch(id,{params:{fields:"status_code,status"}}),s=String(d.status_code||"").toUpperCase();if(!s||s==="FINISHED")return;if(s==="ERROR"||s==="EXPIRED")throw new Error(d.status||("Container "+s));await new Promise(r=>setTimeout(r,1800))}
  throw new Error("A mídia ainda não ficou pronta para publicação");
}
async function publish(post){
  const c=metaCfg(),url=await mediaUrl(post);
  const created=await metaFetch(c.ig+"/media",{method:"POST",params:{image_url:url,caption:post.caption||""}});
  if(!created.id)throw new Error("A Meta não retornou o ID do container");
  await waitContainer(created.id);
  const pub=await metaFetch(c.ig+"/media_publish",{method:"POST",params:{creation_id:created.id}});
  if(!pub.id)throw new Error("A Meta não retornou o ID da publicação");
  return{...pub,containerId:created.id};
}
async function uploadImage(data){
  const m=String(data.dataUrl||"").match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if(!m)throw new Error("Imagem inválida. Use JPG, PNG ou WEBP");
  const b=Buffer.from(m[2],"base64");if(b.length>8*1024*1024)throw new Error("Imagem maior que 8 MB");
  const ext=m[1]==="image/jpeg"?"jpg":m[1].split("/")[1],key="social-agent/media/"+Date.now()+"-"+crypto.randomBytes(6).toString("hex")+"."+ext;
  await s3().send(new PutObjectCommand({Bucket:R2_BUCKET,Key:key,Body:b,ContentType:m[1]}));return key;
}
function id(p="id"){return p+"-"+Date.now()+"-"+crypto.randomBytes(3).toString("hex")}

function crc32(buf){
  let c=0xffffffff;
  for(const b of buf){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}
  return (c^0xffffffff)>>>0;
}
function pngChunk(type,data){
  const t=Buffer.from(type),len=Buffer.alloc(4),crc=Buffer.alloc(4);
  len.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));
  return Buffer.concat([len,t,data,crc]);
}
const FONT={
R:["11110","10001","10001","11110","10100","10010","10001"],
O:["01110","10001","10001","10001","10001","10001","01110"],
V:["10001","10001","10001","10001","10001","01010","00100"],
I:["11111","00100","00100","00100","00100","00100","11111"],
X:["10001","10001","01010","00100","01010","10001","10001"],
A:["01110","10001","10001","11111","10001","10001","10001"],
U:["10001","10001","10001","10001","10001","10001","01110"],
T:["11111","00100","00100","00100","00100","00100","00100"],
M:["10001","11011","10101","10101","10001","10001","10001"],
N:["10001","11001","10101","10011","10001","10001","10001"],
C:["01111","10000","10000","10000","10000","10000","01111"],
E:["11111","10000","10000","11110","10000","10000","11111"],
L:["10000","10000","10000","10000","10000","10000","11111"],
G:["01111","10000","10000","10111","10001","10001","01111"],
P:["11110","10001","10001","11110","10000","10000","10000"],
D:["11110","10001","10001","10001","10001","10001","11110"],
S:["01111","10000","10000","01110","00001","00001","11110"],
F:["11111","10000","10000","11110","10000","10000","10000"],
B:["11110","10001","10001","11110","10001","10001","11110"],
" ":["00000","00000","00000","00000","00000","00000","00000"]
};
function brandPng(){
  const w=1080,h=1080,row=w*4+1,raw=Buffer.alloc(row*h);
  for(let y=0;y<h;y++){const off=y*row;raw[off]=0;for(let x=0;x<w;x++){const i=off+1+x*4;raw[i]=6;raw[i+1]=11;raw[i+2]=18;raw[i+3]=255}}
  const px=(x,y,r,g,b,a=255)=>{if(x<0||y<0||x>=w||y>=h)return;const i=y*row+1+x*4;raw[i]=r;raw[i+1]=g;raw[i+2]=b;raw[i+3]=a};
  const rect=(x1,y1,x2,y2,r,g,b)=>{for(let y=y1;y<y2;y++)for(let x=x1;x<x2;x++)px(x,y,r,g,b)};
  const outline=(x1,y1,x2,y2,t,r,g,b)=>{rect(x1,y1,x2,y1+t,r,g,b);rect(x1,y2-t,x2,y2,r,g,b);rect(x1,y1,x1+t,y2,r,g,b);rect(x2-t,y1,x2,y2,r,g,b)};
  const drawText=(text,x,y,scale,r,g,b)=>{let cx=x;for(const ch of text){const p=FONT[ch]||FONT[" "];for(let yy=0;yy<7;yy++)for(let xx=0;xx<5;xx++)if(p[yy][xx]==="1")rect(cx+xx*scale,y+yy*scale,cx+(xx+1)*scale,y+(yy+1)*scale,r,g,b);cx+=6*scale}};
  outline(68,68,1012,1012,4,28,48,68);
  outline(92,98,220,240,4,48,216,197);
  drawText("R",120,125,14,48,216,197);
  drawText("ROVIX",270,118,15,244,247,251);
  drawText("AUTOMATION",274,240,6,142,163,187);
  drawText("AUTOMACAO",96,420,12,244,247,251);
  drawText("SOFTWARE",96,540,12,244,247,251);
  drawText("INOVACAO",96,660,12,244,247,251);
  rect(96,840,984,944,10,29,39);outline(96,840,984,944,3,31,107,99);
  drawText("TECNOLOGIA APLICADA",128,872,6,48,216,197);
  const sig=Buffer.from([137,80,78,71,13,10,26,10]),ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;ih[10]=0;ih[11]=0;ih[12]=0;
  return Buffer.concat([sig,pngChunk("IHDR",ih),pngChunk("IDAT",zlib.deflateSync(raw,{level:9})),pngChunk("IEND",Buffer.alloc(0))]);
}

async function api(req,res,u){
  if(req.method!=="GET"&&!auth(req))return json(res,401,{error:"Não autorizado"});
  const db=await loadDb();

  if(req.method==="GET"&&u.pathname==="/social-api/status")return json(res,200,{app:"ROVIX Social Agent",version:"0.2.0",online:true,metaConfigured:metaConfigured(),storage:"R2",projects:db.projects.length,posts:db.posts.length});
  if(req.method==="GET"&&u.pathname==="/social-api/meta/test"){if(!metaConfigured())return json(res,200,{connected:false,error:"Credenciais Meta ainda não configuradas"});try{return json(res,200,await testMeta())}catch(e){return json(res,200,{connected:false,error:e.message,apiHost:metaCfg().host,apiVersion:metaCfg().version})}}
  if(req.method==="GET"&&u.pathname==="/social-api/projects")return json(res,200,db.projects);
  if(req.method==="GET"&&u.pathname==="/social-api/posts")return json(res,200,db.posts);

  if(req.method==="POST"&&u.pathname==="/social-api/uploads"){try{return json(res,201,{imageKey:await uploadImage(await body(req))})}catch(e){return json(res,400,{error:e.message})}}
  if(req.method==="POST"&&u.pathname==="/social-api/posts"){
    const d=await body(req),pr=db.projects.find(x=>x.id===d.projectId);if(!pr)return json(res,400,{error:"Projeto inválido"});
    const p={id:id("post"),projectId:pr.id,projectName:pr.name,title:String(d.title||"Novo post"),caption:String(d.caption||""),imageKey:String(d.imageKey||""),imageUrl:String(d.imageUrl||""),scheduledAt:String(d.scheduledAt||""),status:"draft",createdAt:new Date().toISOString()};
    db.posts.unshift(p);await saveDb(db);return json(res,201,p);
  }
  const m=u.pathname.match(/^\/social-api\/posts\/([^/]+)\/(approve|reject|publish)$/);
  if(req.method==="POST"&&m){
    const p=db.posts.find(x=>x.id===m[1]);if(!p)return json(res,404,{error:"Post não encontrado"});
    if(m[2]==="approve"){p.status="approved";p.lastError=""}
    else if(m[2]==="reject")p.status="rejected";
    else{
      try{const r=await publish(p);p.status="published";p.metaMediaId=r.id;p.metaContainerId=r.containerId;p.publishedAt=new Date().toISOString();p.lastError=""}
      catch(e){p.status="error";p.lastError=e.message;await saveDb(db);return json(res,400,{error:e.message})}
    }
    await saveDb(db);return json(res,200,p);
  }
  if(req.method==="GET"&&u.pathname==="/social-api/cron/publish-due"){
    const key=u.searchParams.get("key")||req.headers["x-cron-secret"]||"";if(CRON_SECRET&&key!==CRON_SECRET)return json(res,401,{error:"Não autorizado"});
    const due=db.posts.filter(p=>p.status==="approved"&&p.scheduledAt&&new Date(p.scheduledAt)<=new Date()).slice(0,10),results=[];
    for(const p of due){try{const r=await publish(p);p.status="published";p.metaMediaId=r.id;p.publishedAt=new Date().toISOString();p.lastError="";results.push({id:p.id,ok:true})}catch(e){p.status="error";p.lastError=e.message;results.push({id:p.id,ok:false,error:e.message})}}
    await saveDb(db);return json(res,200,{processed:results.length,results});
  }
  return json(res,404,{error:"Rota social não encontrada"});
}

export async function handleSocialAgent(req,res){
  const u=new URL(req.url,"http://localhost");
  if(u.pathname.startsWith("/social-api/")){await api(req,res,u);return true}
  if(u.pathname==="/social-agent/brand.png"){res.writeHead(200,{"Content-Type":"image/png","Cache-Control":"public, max-age=3600"});res.end(brandPng());return true}
  if(u.pathname==="/social-agent"){res.writeHead(302,{Location:"/social-agent/"});res.end();return true}
  if(u.pathname.startsWith("/social-agent/")){
    const rel=u.pathname.slice("/social-agent/".length)||"index.html";
    const safe=rel.replace(/\.\./g,""),file=path.join(PUBLIC,safe);
    if(!file.startsWith(PUBLIC)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){text(res,404,"Não encontrado");return true}
    text(res,200,fs.readFileSync(file),mime(file));return true;
  }
  return false;
}
