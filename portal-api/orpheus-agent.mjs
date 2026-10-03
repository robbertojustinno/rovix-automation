import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import zlib from "node:zlib";
import {fileURLToPath} from "node:url";
import {S3Client,PutObjectCommand,GetObjectCommand,ListObjectsV2Command,DeleteObjectsCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import {PROVIDER,selectScene,generate,duplicateImage,publishable} from "./orpheus-flux.mjs";
import {createStrategyApi} from "./orpheus-strategy-routes.mjs";
const ENGINE="preapproved-drive";

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const PUBLIC=path.join(__dirname,"orpheus-agent-public");
const R2_ENDPOINT=process.env.R2_ENDPOINT||"";
const R2_ACCESS_KEY_ID=process.env.R2_ACCESS_KEY_ID||"";
const R2_SECRET_ACCESS_KEY=process.env.R2_SECRET_ACCESS_KEY||"";
const R2_BUCKET=process.env.R2_BUCKET||"rovix-drive";
const DB_KEY="orpheus-agent/db.json";
const OFFICIAL_LOGIN_ART_KEY="c926b386-69e0-4fbb-be99-6aa1a7872d86/a847b178-f23d-4c1f-a657-82fb34df624c/Imagem do ChatGPT 25 de set. de 2026, 18_43_13-4.png";
const OFFICIAL_CIPHER_ASSETS=Object.freeze({
  general:OFFICIAL_LOGIN_ART_KEY,
  blake:"c926b386-69e0-4fbb-be99-6aa1a7872d86/a307a8b8-431e-457c-a0c5-67777ae73ac6/blake.png",
  lara:"c926b386-69e0-4fbb-be99-6aa1a7872d86/fb4914b3-3c7a-4147-8064-33e1a59c5c46/Lara.png",
  evelyn:"c926b386-69e0-4fbb-be99-6aa1a7872d86/df658c63-0c14-4134-b3bd-23e20ff38080/Evelyn Cross.png",
  gordon:"c926b386-69e0-4fbb-be99-6aa1a7872d86/8a82ef1a-61a9-4ed8-8d0b-437c68320fbd/Gordon Sullivan.png",
  badge:"c926b386-69e0-4fbb-be99-6aa1a7872d86/76c52bd0-44cb-4601-bd9c-8b8c05cd23d4/distintivo_cipher_operador_validado.png"
});
const ADMIN_USER=process.env.ORPHEUS_ADMIN_USER||"admin";
const ADMIN_PASSWORD_HASH=process.env.ORPHEUS_ADMIN_PASSWORD_HASH||"";
const SESSION_SECRET=process.env.ORPHEUS_SESSION_SECRET||"";
const ORPHEUS_PUBLIC_BASE=(process.env.ORPHEUS_PUBLIC_BASE||"https://orpheus-social-agent.onrender.com/orpheus-agent").replace(/\/$/,"");
const TARGET_INSTAGRAM="@Protocoloorpheus";
const ALLOWED_UNIVERSE_PROJECTS=new Set(["cipher","orpheus"]);
const VISUAL_ENGINE=ENGINE;
const MAX_FAST_IMAGES_PER_RUN=12;
const EMBLEM_PNG=fs.readFileSync(path.join(__dirname,"..","public","intranet","public","cards","orpheus.svg"));
const DEFAULT_SETTINGS={enabled:true,postsPerDay:3,approvalMode:"manual",scheduleMode:"interval",startHour:9,endHour:19,postTimes:["09:00","14:00","19:00"],timezone:"America/Sao_Paulo"};
const POSTING_POLICY=Object.freeze({
  id:"orpheus-cinematic-photoreal-20261001",
  immutable:true,
  image:{
    approvedStandard:"cinematic-photoreal-20261001",
    promptTemplate:"Official artworks in the user's Drive/R2 define the mandatory visual quality and cinematic photographic identity. Match their finish, realism and character consistency. The approved dossier is one scene, not a repeating template. Do not rotate through a fixed catalogue or recycle images and compositions periodically. Revisiting a character or theme requires a materially new situation, environment, action and camera composition, not different colors, crops or mirroring. Other established characters from the CIPHER story, including supporting characters, may appear; do not limit the cast to Blake, Lara, Evelyn and Gordon. Use canonical information and official references where available; do not invent identities or unsupported story events. Use case: ads-marketing. Create one premium cinematic espionage thriller Instagram promotional artwork for the novel CIPHER — Protocolo Orpheus by Roberto Justino. Scene/backdrop: {{setting}}. Subject and action: {{character}} / {{action}}. Composition/framing: {{framing}} / {{composition}}. Sophisticated contemporary film-poster art direction, photorealistic photography, physically convincing materials, textured surfaces, rich shadow detail, selective focus, dramatic practical lighting, exceptionally polished finish and narrative intrigue rather than generic sci-fi. Dark navy and muted silver with restrained red warning light, adapted naturally to the scene. Preserve official character identity using official references when a named character appears. Official Drive/R2 assets are reference and fallback only. Integrate only the exact supplied publication text in clean legible typography in the lower quarter, with the smaller footer 'CIPHER — PROTOCOLO ORPHEUS'. Vary character, environment, action, camera angle, composition, props and lighting between publications. Never copy the previous scene, merely recolor it or mirror it. No geometric cartoon figures, no flat vector illustration, no crude procedural drawings, no collages, no diagram, no stock watermarks. The image must tell a coherent espionage story.",
    approvedExample:"No people: a tense, atmospheric clandestine intelligence archive at night, photorealistic macro foreground of a worn classified dossier partially open on a dark metal desk, a tiny encrypted USB device, a redacted document, an old photograph turned face-down, rain reflections from a Venetian-blind window, deep background glimpses of a secure server room and a subtly illuminated ORPHEUS terminal. Text: 'ALGUNS ARQUIVOS' / 'NUNCA DEVERIAM SER ABERTOS.' Footer: 'CIPHER — PROTOCOLO ORPHEUS'.",
    approvedSceneExamples:[
      {concept:"vigilancia-ferroviaria",scene:"Estacao ferroviaria sob chuva a meia-noite; agente anonimo distante com maleta; camera de vigilancia em primeiro plano",framing:"plano amplo diagonal elevado",composition:"profundidade dos trilhos e personagem pequeno",text:"VOCE NAO ESTA SOZINHO."},
      {concept:"escuta-em-relogio",scene:"Mecanismo de relogio analogico aberto com dispositivo de escuta oculto; pinca de precisao",framing:"macro obliquo com foco seletivo",composition:"objeto dominante e fundo desfocado",text:"O PERIGO ESTA NOS DETALHES."}
    ],
    approvedExamplesAreQualityReferencesOnly:true,
    minWidth:1080,
    minHeight:1080,
    preferredFormats:["1080x1080","1080x1350"],
    style:["thriller-de-espionagem","cinematografico","classificado","noturno","CIPHER"],
    palette:["azul-escuro","vermelho","prata","grafite","preto"],
    requirements:[
      "PADRAO APROVADO: fotografia cinematografica premium de espionagem, materiais fisicamente convincentes, luz pratica dramatica, profundidade e acabamento profissional",
      "exemplos aprovados de estacao e relogio definem qualidade; nunca se tornam modelos de cena repetidos",
      "variar personagem, cenario, acao, enquadramento e composicao; trocar apenas cor, texto, corte ou espelhamento nao constitui nova arte",
      "alternar planos amplos, medios e macros, cenas com personagens canonicos e cenas sem pessoas, objetos, pistas e tecnologia",
      "paleta adaptada a cena permite luz ambar e tons naturais; nao impor sempre o mesmo esquema azul/vermelho",
      "tipografia portuguesa correta, legivel e com margens seguras; nenhuma marca dagua",
      "PADRAO OBRIGATORIO: qualidade, realismo e identidade cinematografica das artes oficiais do Drive/R2",
      "nao repetir imagens ou cenas por rotacao periodica de um catalogo fixo",
      "retomar personagem ou tema somente em uma situacao visual materialmente nova",
      "permitir outros personagens canonicos da historia, inclusive secundarios; nao limitar elenco aos quatro protagonistas",
      "usar informacoes canonicas; nao inventar identidades ou acontecimentos",
      "marca ORPHEUS/CIPHER integrada sem distorcao",
      "composicao cinematografica coerente com CIPHER",
      "tipografia forte e legivel",
      "coerencia visual com o produto",
      "criar cenas originais coerentes com CIPHER; artes oficiais sao referencias e fallback",
      "bloquear repeticao recente de personagem, cenario, acao, enquadramento e composicao",
      "acabamento fotografico de poster cinematografico; materiais realistas e iluminacao dramatica",
      "proibidos bonecos geometricos, vetores planos e desenhos procedurais simplificados",
      "sem placeholder em publicacao final"
    ]
  },
  categories:[
    "Universo CIPHER",
    "Livro / edição",
    "ORPHEUS / tecnologia",
    "Dossiês / arquivos classificados",
    "Enigmas / missões",
    "Personagens / trechos / pistas"
  ],
  publication:{
    universe:"CIPHER",
    automaticPostingScope:["cipher","orpheus"],
    blockOutsideUniverse:true,
    defaultPostsPerDay:3,
    requiresFinalArtwork:true,
    allowPlaceholderPublish:false,
    keepBrandFamily:true,
    avoidRepeatedThemes:true,
    visualEngine:"ORPHEUS Classified Visual Engine (FREE)",
    defaultVisualLevel:"rapido"
  }
});
const TOPICS={
  cipher:["Protocolo Orpheus","Blake Langmere","Lara Langmere","Evelyn Cross","Gordon Sullivan","Mistério e espionagem","Tecnologia e conspiração","Universo CIPHER","Suspense tecnológico","Arquivos classificados","Trechos e pistas"],
  orpheus:["Terminal ORPHEUS","Enigmas e missões","Dossiês classificados","Experiência interativa de leitura","Arquivos secretos","Ponto Cego","Operações e inteligência"]
};

const BASE_PROJECTS=[
  {id:"cipher",name:"CIPHER — Protocolo Orpheus",active:true,frequency:5,tone:"thriller, mistério, espionagem e suspense tecnológico",cta:"Descubra CIPHER",description:"Thriller de espionagem de Roberto Justino e porta de entrada para o universo ORPHEUS.",projectStatus:"PUBLICADO",category:"CIPHER",topics:TOPICS.cipher},
  {id:"orpheus",name:"ORPHEUS",active:true,frequency:4,tone:"classificado, tecnológico, enigmático e cinematográfico",cta:"Entre no Protocolo Orpheus",description:"Experiência companion de CIPHER com terminal, enigmas, missões e dossiês.",projectStatus:"ATIVO",category:"CIPHER",topics:TOPICS.orpheus}
];

function s3(){if(!R2_ENDPOINT||!R2_ACCESS_KEY_ID||!R2_SECRET_ACCESS_KEY)throw new Error("R2_NOT_CONFIGURED");return new S3Client({region:"auto",endpoint:R2_ENDPOINT,credentials:{accessKeyId:R2_ACCESS_KEY_ID,secretAccessKey:R2_SECRET_ACCESS_KEY}})}
async function readStream(stream){return await stream.transformToString()}
async function saveDb(db){await s3().send(new PutObjectCommand({Bucket:R2_BUCKET,Key:DB_KEY,Body:JSON.stringify(db,null,2),ContentType:"application/json"}))}

async function purgeRejectedArtwork(db){
  const marker=db.meta.rejectedProceduralCleanup20261001;
  if(marker?.complete)return;
  let cleared=0;
  for(const p of db.posts){
    if(!String(p.imageKey||"").startsWith("orpheus-agent/v6/")&&!String(p.visualSource||"").startsWith("local-procedural://"))continue;
    p.imageKey="";p.imageUrl="";p.artStatus="awaiting_generator";p.visualEngine="";
    p.artError="A arte rejeitada foi removida. Aguardando uma nova arte no padrão cinematográfico aprovado.";
    delete p.artHash;delete p.visualSource;delete p.visualLicense;
    cleared++;
  }
  db.meta.rejectedProceduralCleanup20261001={...(marker||{}),startedAt:marker?.startedAt||new Date().toISOString(),cleared:Number(marker?.cleared||0)+cleared,complete:false};
  await saveDb(db);
  let token,deleted=Number(marker?.deletedObjects||0);
  do{
    const page=await s3().send(new ListObjectsV2Command({Bucket:R2_BUCKET,Prefix:"orpheus-agent/v6/",ContinuationToken:token}));
    const objects=(page.Contents||[]).filter(x=>/^orpheus-agent\/v6\/[a-f0-9]{64}\.jpg$/.test(x.Key)).map(x=>({Key:x.Key}));
    if(objects.length){
      const result=await s3().send(new DeleteObjectsCommand({Bucket:R2_BUCKET,Delete:{Objects:objects,Quiet:true}}));
      if(result.Errors?.length)throw new Error("Falha ao excluir artes rejeitadas do R2");
      deleted+=objects.length;
      db.meta.rejectedProceduralCleanup20261001.deletedObjects=deleted;await saveDb(db);
    }
    token=page.IsTruncated?page.NextContinuationToken:undefined;
  }while(token);
  db.meta.rejectedProceduralCleanup20261001.complete=true;
  db.meta.rejectedProceduralCleanup20261001.completedAt=new Date().toISOString();
  await saveDb(db);
  console.log("[ORPHEUS Cleanup]",JSON.stringify({clearedPosts:db.meta.rejectedProceduralCleanup20261001.cleared,deletedObjects:deleted,queuePreserved:true,automationEnabled:db.settings.enabled}));
}

async function loadDb(){
  let db,changed=false;
  try{const r=await s3().send(new GetObjectCommand({Bucket:R2_BUCKET,Key:DB_KEY}));db=JSON.parse(await readStream(r.Body))}
  catch(e){if(e?.name==="NoSuchKey"||e?.$metadata?.httpStatusCode===404){db={projects:[],posts:[]};changed=true}else throw e}
  db.projects=db.projects||[];db.posts=db.posts||[];db.settings={...DEFAULT_SETTINGS,...(db.settings||{})};db.meta=db.meta||{};
  for(const p of BASE_PROJECTS){
    const existing=db.projects.find(x=>x.id===p.id);
    if(!existing){db.projects.push({...p});changed=true}
    else for(const key of ["description","projectStatus","category","topics"])if(p[key]!==undefined&&JSON.stringify(existing[key])!==JSON.stringify(p[key])){existing[key]=p[key];changed=true}
  }
  db.meta.artHistory=db.meta.artHistory||[];
  for(const p of db.posts){
    if(p.artStatus==='generating'&&Date.now()-Date.parse(p.artStartedAt||0)>10*60000){p.artStatus='error';p.artError='Geração interrompida; nova tentativa após 30 minutos';p.artRetryAt=new Date(Date.now()+30*60000).toISOString();changed=true;}
    if(!['published','publishing','deleted','rejected'].includes(p.status)&&p.artStatus==='ready'&&!p.artValidation){p.artStatus='review_pending';changed=true;}
  }
  if(changed)await saveDb(db);
  await purgeRejectedArtwork(db);return db;
}
function json(res,status,data,extra={}){res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...extra});res.end(JSON.stringify(data))}
function text(res,status,data,type="text/plain; charset=utf-8"){res.writeHead(status,{"Content-Type":type,"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});res.end(data)}
function mime(p){return({".html":"text/html; charset=utf-8",".js":"application/javascript; charset=utf-8",".css":"text/css; charset=utf-8"})[path.extname(p)]||"application/octet-stream"}
function body(req,limit=12*1024*1024){return new Promise((resolve,reject)=>{let raw="";req.on("data",c=>{raw+=c;if(raw.length>limit){reject(new Error("Payload muito grande"));req.destroy()}});req.on("end",()=>{if(!raw)return resolve({});try{resolve(JSON.parse(raw))}catch{reject(new Error("JSON inválido"))}});req.on("error",reject)})}
function cookies(req){return Object.fromEntries(String(req.headers.cookie||"").split(";").map(v=>v.trim()).filter(Boolean).map(v=>{const i=v.indexOf("=");return[decodeURIComponent(v.slice(0,i)),decodeURIComponent(v.slice(i+1))]}))}
function verifyPassword(pass){if(!ADMIN_PASSWORD_HASH)return false;const [salt,expected]=ADMIN_PASSWORD_HASH.split(":");if(!salt||!expected)return false;const got=crypto.scryptSync(String(pass),Buffer.from(salt,"hex"),32).toString("hex");return crypto.timingSafeEqual(Buffer.from(got),Buffer.from(expected))}
function makeSession(){const exp=Date.now()+12*60*60*1000,payload=ADMIN_USER+"|"+exp,sig=crypto.createHmac("sha256",SESSION_SECRET).update(payload).digest("hex");return Buffer.from(payload+"|"+sig).toString("base64url")}
function validSession(t){try{if(!SESSION_SECRET||!t)return false;const [user,exp,sig]=Buffer.from(t,"base64url").toString().split("|"),payload=user+"|"+exp,calc=crypto.createHmac("sha256",SESSION_SECRET).update(payload).digest("hex");return user===ADMIN_USER&&Number(exp)>Date.now()&&sig?.length===calc.length&&crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(calc))}catch{return false}}
function authed(req){const bearer=String(req.headers.authorization||"").startsWith("Bearer ")?String(req.headers.authorization).slice(7):"";return validSession(bearer)||validSession(cookies(req).orpheus_social_session)}
function sessionCookie(token,maxAge=43200){return "orpheus_social_session="+token+"; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age="+maxAge}
function metaCfg(){return{token:process.env.ORPHEUS_META_ACCESS_TOKEN||"",ig:process.env.ORPHEUS_META_IG_USER_ID||"",version:process.env.ORPHEUS_META_GRAPH_VERSION||"v26.0",host:process.env.ORPHEUS_META_API_HOST||"graph.instagram.com"}}
function metaConfigured(){const c=metaCfg();return!!(c.token&&c.ig&&c.version&&c.host)}
async function metaFetch(route,{method="GET",params={}}={}){const c=metaCfg();if(!metaConfigured())throw new Error("Instagram não configurado no servidor");const u=new URL("https://"+c.host+"/"+encodeURIComponent(c.version)+"/"+String(route).replace(/^\//,""));const headers={Authorization:"Bearer "+c.token,"User-Agent":"ORPHEUS-Social-Agent/0.3"};const init={method,headers};if(method==="GET")Object.entries(params).forEach(([k,v])=>v!==""&&v!=null&&u.searchParams.set(k,String(v)));else{headers["Content-Type"]="application/x-www-form-urlencoded";init.body=new URLSearchParams(Object.entries(params).filter(([,v])=>v!==""&&v!=null)).toString()}const r=await fetch(u,init),raw=await r.text();let d;try{d=JSON.parse(raw)}catch{d={raw}};if(!r.ok||d.error){const e=new Error(d?.error?.message||("Erro HTTP "+r.status));e.metaCode=d?.error?.code;e.metaSubcode=d?.error?.error_subcode;e.httpStatus=r.status;e.retryAfter=r.headers.get("retry-after");throw e}return d}
export function isMetaActionLimit(e){return [4,9,17,32,613].includes(Number(e?.metaCode))||/too many actions|rate limit|request limit|limite de (ações|requisições)/i.test(e?.message||"")}
function cooldownDate(e){const retry=Number(e?.retryAfter),minutes=Number.isFinite(retry)&&retry>0?Math.max(60,Math.ceil(retry/60)):60;return new Date(Date.now()+Math.min(minutes,24*60)*60*1000).toISOString()}
function cooldownMessage(until){return "A Meta limitou temporariamente as ações desta conta. Publicações pausadas até "+new Date(until).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"})+". Tente novamente após esse horário."}
function activeCooldown(db){return db.meta?.publishCooldownUntil&&new Date(db.meta.publishCooldownUntil).getTime()>Date.now()?db.meta.publishCooldownUntil:null}
const analyticsCache=new Map();
async function accountAnalytics(days=7){
  const cached=analyticsCache.get(days);
  if(cached&&Date.now()-cached.at<300000)return cached.promise;
  const promise=(async()=>{
    const c=metaCfg(),until=Math.floor(Date.now()/1000),since=until-days*86400;
    const result={days,since:new Date(since*1000).toISOString(),until:new Date(until*1000).toISOString(),updatedAt:new Date().toISOString(),followers:null,publications:null,views:null,reach:null,interactions:null,errors:[]};
    if(!metaConfigured()){result.errors.push("Instagram ainda não configurado");return result}
    const [profile,insights]=await Promise.allSettled([
      metaFetch(c.ig,{params:{fields:"id,username,followers_count,media_count"}}),
      metaFetch(c.ig+"/insights",{params:{metric:"views,reach,total_interactions",period:"day",metric_type:"total_value",since,until}})
    ]);
    const number=v=>typeof v==="number"&&Number.isFinite(v)?v:null;
    if(profile.status==="fulfilled"){
      result.username=profile.value.username||null;
      result.followers=number(profile.value.followers_count);
      result.publications=number(profile.value.media_count);
    }else result.errors.push("Dados do perfil: "+profile.reason.message);
    if(insights.status==="fulfilled"){
      for(const metric of insights.value.data||[]){
        const key={views:"views",reach:"reach",total_interactions:"interactions"}[metric.name];
        if(key)result[key]=number(metric.total_value?.value);
      }
      if(["views","reach","interactions"].some(k=>result[k]===null))result.errors.push("A Meta não retornou todas as métricas para este período.");
    }else result.errors.push("Estatísticas: "+insights.reason.message+". Verifique a permissão de leitura de insights na conexão do Instagram.");
    return result;
  })();
  analyticsCache.set(days,{at:Date.now(),promise});
  return promise;
}
async function testMeta(){const c=metaCfg(),d=await metaFetch(c.ig,{params:{fields:"id,username,account_type"}});return{connected:true,id:d.id||c.ig,username:d.username||null,accountType:d.account_type||null,apiHost:c.host,apiVersion:c.version}}
async function mediaUrl(post){if(!["ready","review_pending"].includes(post.artStatus))throw new Error(post.artError||"Arte ainda sem prévia; geração pendente");if(post.imageKey)return await getSignedUrl(s3(),new GetObjectCommand({Bucket:R2_BUCKET,Key:post.imageKey}),{expiresIn:900});if(/\/logo\.jpg(?:$|\?)/i.test(post.imageUrl||""))return ORPHEUS_PUBLIC_BASE+"/brand.png";if(/^https:\/\//i.test(post.imageUrl||""))return post.imageUrl;return ORPHEUS_PUBLIC_BASE+"/brand.png"}
async function waitContainer(id){for(let i=0;i<12;i++){const d=await metaFetch(id,{params:{fields:"status_code,status"}}),s=String(d.status_code||"").toUpperCase();if(!s||s==="FINISHED")return;if(s==="ERROR"||s==="EXPIRED")throw new Error(d.status||("Container "+s));await new Promise(r=>setTimeout(r,1800))}throw new Error("A mídia ainda não ficou pronta para publicação")}
async function publish(post){if(!publishable(post))throw new Error("Arte final precisa estar pronta e validada na prévia");const c=metaCfg(),url=await mediaUrl(post);const created=await metaFetch(c.ig+"/media",{method:"POST",params:{image_url:url,caption:post.caption||""}});if(!created.id)throw new Error("A Meta não retornou o ID do container");await waitContainer(created.id);const pub=await metaFetch(c.ig+"/media_publish",{method:"POST",params:{creation_id:created.id}});if(!pub.id)throw new Error("A Meta não retornou o ID da publicação");return{...pub,containerId:created.id}}
async function uploadImage(data){const m=String(data.dataUrl||"").match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);if(!m)throw new Error("Imagem inválida. Use JPG, PNG ou WEBP");const b=Buffer.from(m[2],"base64");if(b.length>8*1024*1024)throw new Error("Imagem maior que 8 MB");const pixelHash=crypto.createHash("sha256").update(await sharp(b).rotate().raw().toBuffer()).digest("hex");const ext=m[1]==="image/jpeg"?"jpg":m[1].split("/")[1],key="orpheus-agent/media/"+pixelHash+"."+ext;await s3().send(new PutObjectCommand({Bucket:R2_BUCKET,Key:key,Body:b,ContentType:m[1]}));return key}
function id(p="id"){return p+"-"+Date.now()+"-"+crypto.randomBytes(3).toString("hex")}
function saoDate(){return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())}
function scheduleFor(date,index,count,settings){
      if(settings.scheduleMode==="exact"&&Array.isArray(settings.postTimes)&&settings.postTimes[index]){
        const t=String(settings.postTimes[index]).match(/^([01]\d|2[0-3]):([0-5]\d)$/);
        if(t)return new Date(date+"T"+t[1]+":"+t[2]+":00-03:00").toISOString();
      }
      const start=Math.max(0,Math.min(23,Number(settings.startHour)||9)),end=Math.max(start,Math.min(23,Number(settings.endHour)||19));
      const startMin=start*60,endMin=end*60,total=Math.max(0,endMin-startMin);
      const minute=count<=1?startMin:Math.round(startMin+(total*(index/(count-1))));
      const h=Math.floor(minute/60),m=minute%60;
      return new Date(date+"T"+String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")+":00-03:00").toISOString()
    }
function escapeXml(s=""){return String(s).replace(/[<>&'"]/g,m=>({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"}[m]))}
function officialAssetName(post,project){
  const t=(String(post?.title||"")+" "+String(post?.caption||"")+" "+String(project?.name||"")).toLowerCase();
  if(t.includes("blake"))return"blake";
  if(t.includes("lara"))return"lara";
  if(t.includes("evelyn"))return"evelyn";
  if(t.includes("gordon"))return"gordon";
  if(t.includes("operador")||t.includes("distintivo"))return"badge";
  return"general";
}
async function officialAssetBuffer(post,project){
  const name=officialAssetName(post,project),key=OFFICIAL_CIPHER_ASSETS[name]||OFFICIAL_CIPHER_ASSETS.general;
  const r=await s3().send(new GetObjectCommand({Bucket:R2_BUCKET,Key:key}));
  return{name,key,buffer:Buffer.from(await r.Body.transformToByteArray())};
}
function titleLines(value){
  const words=String(value||"ORPHEUS").trim().split(/\s+/),lines=[""];
  for(const word of words){
    const index=lines.length-1;
    if((lines[index]+" "+word).trim().length>24&&lines[index]&&lines.length<2)lines.push(word);
    else lines[index]=(lines[index]+" "+word).trim();
  }
  if(lines[1]?.length>27)lines[1]=lines[1].slice(0,26).trimEnd()+"…";
  return lines;
}
const PREAPPROVED_KEY="orpheus-agent/preapproved-catalog.json";
async function loadDriveCatalog(){
 const r=await s3().send(new GetObjectCommand({Bucket:R2_BUCKET,Key:PREAPPROVED_KEY}));const c=JSON.parse(await r.Body.transformToString());
 if(c.folderId!=="080b03b1-8429-44a1-9ae2-2dcaf086a4f7"||c.ownerId!=="c926b386-69e0-4fbb-be99-6aa1a7872d86")throw new Error('Catálogo ORPHEUS inválido');
 c.files=(c.files||[]).filter(f=>/^image\/(png|jpeg|webp)$/.test(f.mime_type)&&f.object_key?.startsWith(c.ownerId+'/'));return c;
}
async function sourceUrl(fileId){const c=await loadDriveCatalog(),f=c.files.find(x=>x.id===fileId);if(!f)throw new Error('Imagem removida');return getSignedUrl(s3(),new GetObjectCommand({Bucket:R2_BUCKET,Key:f.object_key}),{expiresIn:900});}
async function refreshStrategyMetrics(post){
 const metrics=Object.fromEntries(['views','reach','likes','comments','saved','shares','profile_visits','follows','retention'].map(k=>[k,null]));
 const errors=[];
 for(const metric of Object.keys(metrics).filter(k=>k!=='retention')){try{const d=await metaFetch(post.metaMediaId+'/insights',{params:{metric}});const row=d.data?.find(r=>r.name===metric),value=row?.total_value?.value??row?.values?.[0]?.value;if(Number.isFinite(value))metrics[metric]=value}catch(e){errors.push(metric+': '+e.message)}}
 const prior=post.performance,manual=prior?.source==='manual'?prior.metrics:prior?.manual,sources={};
 for(const key of Object.keys(metrics)){sources[key]=metrics[key]===null?null:'instagram';if(metrics[key]===null&&Number.isFinite(manual?.[key])){metrics[key]=manual[key];sources[key]='manual'}}
 post.performance={metrics,sources,source:manual?'instagram e manual':'instagram',manual:manual||null,updatedAt:new Date().toISOString(),errors};
}
const strategyApi=createStrategyApi({json,body,saoDate,loadDriveCatalog,saveDb,scheduleFor,id,refreshMetrics:refreshStrategyMetrics,attachPreapproved,sourceUrl});
export async function attachPreapproved(db,post){
  try{
    const response=await s3().send(new GetObjectCommand({Bucket:R2_BUCKET,Key:PREAPPROVED_KEY}));
    const catalog=JSON.parse(await response.Body.transformToString());
    const files=(catalog.files||[]).filter(f=>/^image\/(png|jpeg|webp)$/.test(f.mime_type)&&f.object_key?.startsWith(catalog.ownerId+"/"));
    if(!files.length)throw new Error("A pasta Postagens_pre_aprovadas está vazia");
    db.meta=db.meta||{};const history=db.meta.preapprovedHistory||=[];
    const active=new Set(db.posts.filter(p=>p.id!==post.id&&!['deleted','rejected','published'].includes(p.status)).map(p=>p.sourceImageKey));
    const available=files.filter(f=>!active.has(f.object_key));
    if(!available.length)throw new Error("Todas as imagens já estão reservadas para posts pendentes");
    const lastUsed=key=>history.filter(h=>h.key===key).at(-1)?.at||'';
    available.sort((a,b)=>lastUsed(a.object_key).localeCompare(lastUsed(b.object_key))||a.name.localeCompare(b.name));
    const chosen=available.find(f=>f.object_key===post.sourceImageKey)||available[0];
    const r=await s3().send(new GetObjectCommand({Bucket:R2_BUCKET,Key:chosen.object_key}));
    const original=Buffer.from(await r.Body.transformToByteArray());
    const escape=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
    const topic=String(post.title||'CIPHER').toLowerCase();
    const hook=post.strategy?.hook|| (topic.includes('cego')?'O perigo também está no que você não vê.':/escuta|sinal|silêncio/.test(topic)?'Uma informação pode mudar tudo.':/arquivo|documento|dossiê/.test(topic)?'Alguns segredos nunca deveriam ser revelados.':/vigilância|sombra|perseguição/.test(topic)?'Quem observa também pode estar sendo observado.':'Cada detalhe pode ser uma pista — ou uma armadilha.');
    const draw=async(value,font,width=920)=>sharp({text:{text:'<span foreground="white">'+escape(value)+'</span>',font,width,dpi:72,align:'left',rgba:true}}).png().toBuffer();
    const label=await draw('ARQUIVO CIPHER  /  ACESSO RESTRITO','DejaVu Sans Bold 21');
    const title=await sharp(await draw(String(post.title||'CIPHER').slice(0,120),'DejaVu Sans Bold 52')).resize(920,110,{fit:'inside',withoutEnlargement:true}).png().toBuffer();
    const phrase=await sharp(await draw(hook,'DejaVu Sans 32')).resize(920,85,{fit:'inside',withoutEnlargement:true}).png().toBuffer();
    const detail=await draw('Espionagem, vigilância e segredos.\nCIPHER — Protocolo Orpheus | Roberto Justino','DejaVu Sans 24');
    const ctaText=post.strategy?.cta||'CONHEÇA O LIVRO  →  LINK NA BIO';
    const cta=await sharp(await draw(ctaText,'DejaVu Sans Bold 25')).resize(920,45,{fit:'inside',withoutEnlargement:true}).png().toBuffer();
    const band=await sharp({create:{width:1080,height:430,channels:4,background:{r:3,g:8,b:18,alpha:0.94}}}).png().toBuffer();
    const base=post.strategy?await sharp({create:{width:1080,height:1350,channels:3,background:'#050a12'}}).composite([{input:await sharp(original).rotate().resize(1080,900,{fit:'contain',background:'#050a12'}).toBuffer(),top:0,left:0}]).png().toBuffer():original;
    const artwork=await sharp(base).rotate().resize(1080,1350,{fit:'contain',background:'#050a12'}).composite([{input:band,left:0,top:920},{input:label,left:80,top:949},{input:title,left:80,top:998},{input:phrase,left:80,top:1118},{input:detail,left:80,top:1200},{input:cta,left:80,top:1288}]).jpeg({quality:94}).toBuffer();
    post.artCopy={hook,cta:ctaText,kind:'promotional',version:2};
    const hash=crypto.createHash('sha256').update(artwork).digest('hex');
    const key='orpheus-agent/preapproved/'+post.id+'-'+hash+'.jpg';
    await s3().send(new PutObjectCommand({Bucket:R2_BUCKET,Key:key,Body:artwork,ContentType:'image/jpeg'}));
    const check=await s3().send(new GetObjectCommand({Bucket:R2_BUCKET,Key:key}));
    if(crypto.createHash('sha256').update(Buffer.from(await check.Body.transformToByteArray())).digest('hex')!==hash)throw new Error('Falha ao verificar arte armazenada');
    Object.assign(post,{imageKey:key,imageUrl:'',artHash:hash,sourceImageKey:chosen.object_key,sourceImageName:chosen.name,artStatus:'review_pending',artError:'',artProvider:'preapproved-drive',artCompletedAt:new Date().toISOString()});
    delete post.artValidation;delete post.artPreviewViewedAt;delete post.artRetryAt;
    history.push({key:chosen.object_key,postId:post.id,at:new Date().toISOString()});
    return {made:1,reviewPending:1,image:chosen.name};
  }catch(e){post.artStatus='error';post.artError=e.message;return {made:0,error:e.message};}
}
async function prepareArtworkForQueue(){
  const db=await loadDb();
  const queue=db.posts.filter(p=>!['published','publishing','deleted','rejected'].includes(p.status)&&p.scheduledAt&&new Date(p.scheduledAt)>new Date(Date.now()-3600000)).sort((a,b)=>new Date(a.scheduledAt)-new Date(b.scheduledAt));
  const post=queue.find(p=>['placeholder','awaiting_generator','error'].includes(p.artStatus)&&Date.parse(p.artRetryAt||0)<=Date.now());
  console.log('[ORPHEUS Artwork Queue]',JSON.stringify({provider:PROVIDER,allPosts:db.posts.filter(p=>postDate(p)>=saoDate()).slice(0,30).map(p=>({id:p.id,date:p.generatedDate||p.scheduledAt,status:p.status,artStatus:p.artStatus,origin:p.generatedBy||'manual'})),queue:queue.map(p=>({id:p.id,date:p.generatedDate||p.scheduledAt,status:p.artStatus})),ready:queue.filter(p=>publishable(p)).length,review:queue.filter(p=>p.artStatus==='review_pending').length}));
  if(!post)return {made:0};
  const result=await attachPreapproved(db,post);await saveDb(db);return result;
}

function postDate(p){return p.scheduledAt?new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(p.scheduledAt)):p.generatedDate;}

function buildCaption(project,topic,i){
  const cipher=[
    topic+" faz parte do universo CIPHER — Protocolo Orpheus. Arquivos, pistas e personagens se cruzam em uma história de espionagem, vigilância e segredos.",
    "ARQUIVO EM ANÁLISE // "+topic+"\n\nNo universo CIPHER, nenhuma informação aparece por acaso. Cada detalhe pode ser uma pista — ou uma armadilha.",
    topic+"\n\nO Protocolo Orpheus continua ativo. Dossiês, operações clandestinas e sinais do passado começam a convergir."
  ];
  const orpheus=[
    topic+"\n\nAcesso restrito ao universo CIPHER. O terminal ORPHEUS reúne dossiês, enigmas, missões e fragmentos ligados ao Protocolo.",
    "ORPHEUS // "+topic+"\n\nNem todos os arquivos deveriam ser abertos. Nem todas as operações deveriam ter sobrevivido.",
    topic+"\n\nConteúdo classificado do universo CIPHER. Observe os detalhes. Algumas respostas aparecem apenas para quem sabe onde procurar."
  ];
  const base=(project.id==="cipher"?cipher:orpheus)[i%3];
  return base+"\n\n"+project.cta+".\n\n#CIPHER #ProtocoloOrpheus #ORPHEUS #Thriller #Espionagem #Suspense";
}
async function ensureDailyContent(force=false,requestedDate=""){
  const db=await loadDb(),s=db.settings;
  if(!s.enabled&&!force)return{created:0,target:0,day:saoDate(),reason:"disabled"};
  const day=requestedDate||saoDate();
  const target=Math.max(1,Math.min(12,Number(s.postsPerDay)||3));
  const existingPosts=db.posts.filter(p=>postDate(p)===day&&ALLOWED_UNIVERSE_PROJECTS.has(p.projectId)&&!["deleted","rejected"].includes(p.status));
  const existing=existingPosts.length;
  if(existing>=target)return{created:0,target,day,existing,reason:"daily_target_already_met",existingPosts:existingPosts.map(p=>({id:p.id,title:p.title,status:p.status,scheduledAt:p.scheduledAt}))};
  const startIndex=existing;
  let created=0;
  for(let i=startIndex;i<target;i++){
    const active=db.projects.filter(p=>p.active&&ALLOWED_UNIVERSE_PROJECTS.has(p.id));if(!active.length)break;
    const p=active[(Number(db.meta.topicCursor||0)+i)%active.length],topics=p.topics||TOPICS[p.id]||TOPICS.rovix;
    const topic=topics[(Number(db.meta.topicCursor||0)+i)%topics.length];
    const status=s.approvalMode==="auto"?"approved":s.approvalMode==="hybrid"&&i===0?"approved":"draft";
    let scheduledAt=scheduleFor(day,i,target,s);
    if(new Date(scheduledAt)<=new Date())scheduledAt=new Date(Date.now()+(created+1)*60*60*1000).toISOString();
    db.posts.unshift({id:id("agent"),projectId:p.id,projectName:p.name,title:topic,caption:buildCaption(p,topic,i),imageUrl:ORPHEUS_PUBLIC_BASE+"/brand.png",scheduledAt,status,createdAt:new Date().toISOString(),generatedBy:"agent",generatedDate:day,forcedBatch:force,visualPolicy:POSTING_POLICY.id,visualEngine:VISUAL_ENGINE,visualLevel:"rapido",artStatus:"placeholder"});
    created++;
  }
  db.meta.topicCursor=Number(db.meta.topicCursor||0)+created;
  if(created)await saveDb(db);
  return{created,target,day,existing,forced:force}
}
async function publishDue(){
  if(publishingBusy)return [];
  publishingBusy=true;
  try{return await publishDueLocked()}finally{publishingBusy=false}
}
let publishingBusy=false;
async function publishDueLocked(){
  const db=await loadDb();
  if(activeCooldown(db)||db.meta.apiAccessBlocked)return [];
  const now=new Date(),due=db.posts.filter(p=>p.status==="approved"&&publishable(p)&&p.scheduledAt&&new Date(p.scheduledAt)<=now&&(!p.nextRetryAt||new Date(p.nextRetryAt)<=now)).slice(0,10),results=[];
  if(due.length)console.log("[ORPHEUS Agent] Publicações vencidas:",due.length,now.toISOString());
  for(const p of due){
    p.status="publishing";p.publishStartedAt=new Date().toISOString();
    await saveDb(db);
    try{
      const r=await publish(p);
      p.status="published";p.metaMediaId=r.id;p.metaContainerId=r.containerId;p.publishedAt=new Date().toISOString();p.lastError="";
      p.publishAttempts=Number(p.publishAttempts||0)+1;delete p.nextRetryAt;
      results.push({id:p.id,ok:true});console.log("[ORPHEUS Agent] Publicado:",p.id,r.id);
    }catch(e){
      p.publishAttempts=Number(p.publishAttempts||0)+1;
      if(isMetaActionLimit(e)){
        db.meta.publishCooldownUntil=cooldownDate(e);
        p.status="error";p.lastError=cooldownMessage(db.meta.publishCooldownUntil);delete p.nextRetryAt;
        results.push({id:p.id,ok:false,error:p.lastError});
        console.error("[ORPHEUS Agent] Conta Meta em pausa:",p.id,e.metaCode||"",e.message);
        break;
      }
      if(/API access blocked/i.test(e.message||"")){db.meta.apiAccessBlocked={at:new Date().toISOString(),code:e.metaCode||null};p.status="error";p.lastError="A Meta bloqueou o acesso à API. Publicações pausadas até um teste de conexão bem-sucedido.";delete p.nextRetryAt;results.push({id:p.id,ok:false,error:p.lastError});console.error("[ORPHEUS Agent] API Meta bloqueada:",e.metaCode||"",e.message);break}
      p.lastError=e.message;
      const transient=/Media ID is not available|temporar|try again|timeout/i.test(e.message||"");
      if(transient&&p.publishAttempts<4){p.status="approved";p.nextRetryAt=new Date(Date.now()+Math.min(30,2**p.publishAttempts)*60*1000).toISOString()}
      else{p.status="error";delete p.nextRetryAt}
      results.push({id:p.id,ok:false,error:e.message,retry:!!p.nextRetryAt});
      console.error("[ORPHEUS Agent] Falha ao publicar",p.id,e.message);
    }
  }
  if(due.length)await saveDb(db);
  return results;
}
let operationTail=Promise.resolve();
function serialOperation(fn){const result=operationTail.then(fn);operationTail=result.catch(()=>{});return result}
let busy=false;
async function automationTick(){if(busy)return;busy=true;try{await serialOperation(async()=>{const tomorrow=new Date(Date.parse(saoDate()+"T12:00:00Z")+86400000).toISOString().slice(0,10);
    for(let day=tomorrow;day<= (tomorrow<='2026-10-05'?'2026-10-05':tomorrow);day=new Date(Date.parse(day+'T12:00:00Z')+86400000).toISOString().slice(0,10))await ensureDailyContent(false,day);
    await prepareArtworkForQueue();
    const db=await loadDb();
    if(!db.meta.connectionRecheck20261001&&metaConfigured()){
      try{const result=await testMeta();delete db.meta.apiAccessBlocked;console.log('[ORPHEUS Meta] Conectado',result.username)}
      catch(e){console.error('[ORPHEUS Meta] Conexao pendente',e.message)}
      db.meta.connectionRecheck20261001=new Date().toISOString();await saveDb(db);
    }
    await publishDue()})}catch(e){console.error("Social Agent:",e.message)}finally{busy=false}}
if(process.env.ORPHEUS_DISABLE_AUTOMATION!=="1"){
  setTimeout(()=>automationTick(),5000);setInterval(()=>automationTick(),60*1000);
}

function crc32(buf){let c=0xffffffff;for(const b of buf){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0}
function pngChunk(type,data){const t=Buffer.from(type),len=Buffer.alloc(4),crc=Buffer.alloc(4);len.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([len,t,data,crc])}
const MINI_FONT={R:["11110","10001","10001","11110","10100","10010","10001"],O:["01110","10001","10001","10001","10001","10001","01110"],V:["10001","10001","10001","10001","10001","01010","00100"],I:["11111","00100","00100","00100","00100","00100","11111"],X:["10001","10001","01010","00100","01010","10001","10001"],A:["01110","10001","10001","11111","10001","10001","10001"],U:["10001","10001","10001","10001","10001","10001","01110"],T:["11111","00100","00100","00100","00100","00100","00100"],M:["10001","11011","10101","10101","10001","10001","10001"],N:["10001","11001","10101","10011","10001","10001","10001"]," ":["00000","00000","00000","00000","00000","00000","00000"]};
function brandPng(){const w=1080,h=1080,row=w*4+1,raw=Buffer.alloc(row*h);for(let y=0;y<h;y++){const o=y*row;raw[o]=0;for(let x=0;x<w;x++){const i=o+1+x*4;raw[i]=5;raw[i+1]=10;raw[i+2]=18;raw[i+3]=255}}const rect=(x1,y1,x2,y2,r,g,b)=>{for(let y=y1;y<y2;y++)for(let x=x1;x<x2;x++){const i=y*row+1+x*4;raw[i]=r;raw[i+1]=g;raw[i+2]=b;raw[i+3]=255}};const text=(s,x,y,sc,r,g,b)=>{let cx=x;for(const ch of s){const p=MINI_FONT[ch]||MINI_FONT[" "];for(let yy=0;yy<7;yy++)for(let xx=0;xx<5;xx++)if(p[yy][xx]==="1")rect(cx+xx*sc,y+yy*sc,cx+(xx+1)*sc,y+(yy+1)*sc,r,g,b);cx+=6*sc}};rect(70,70,1010,74,31,48,72);rect(70,1006,1010,1010,31,48,72);text("ROVIX",170,300,28,235,241,248);text("AUTOMATION",200,610,12,48,216,197);rect(170,790,910,800,220,35,48);const sig=Buffer.from([137,80,78,71,13,10,26,10]),ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;return Buffer.concat([sig,pngChunk("IHDR",ih),pngChunk("IDAT",zlib.deflateSync(raw,{level:9})),pngChunk("IEND",Buffer.alloc(0))])}

async function api(req,res,u){
  if(u.pathname==="/orpheus-api/auth/status")return json(res,200,{authenticated:authed(req),user:authed(req)?ADMIN_USER:null});
  if(req.method==="POST"&&u.pathname==="/orpheus-api/auth/login"){const d=await body(req);if(d.user!==ADMIN_USER||!verifyPassword(d.password))return json(res,401,{error:"Usuário ou senha inválidos"});const token=makeSession();return json(res,200,{ok:true,user:ADMIN_USER,sessionToken:token},{"Set-Cookie":sessionCookie(token)})}
  if(req.method==="POST"&&u.pathname==="/orpheus-api/auth/logout")return json(res,200,{ok:true},{"Set-Cookie":sessionCookie("",0)});
  if(!authed(req))return json(res,401,{error:"Autenticação obrigatória"});

  const db=await loadDb();
  if(u.pathname.startsWith('/orpheus-api/strategy'))return strategyApi(req,res,u,db);
  if(req.method==="GET"&&u.pathname==="/orpheus-api/status")return json(res,200,{app:"ORPHEUS Social Agent",targetInstagram:TARGET_INSTAGRAM,universe:"CIPHER",automaticScope:["cipher","orpheus"],version:"0.9.0",online:true,metaConfigured:metaConfigured(),apiAccessBlocked:Boolean(db.meta.apiAccessBlocked),imageGenerationConfigured:true,generator:{provider:ENGINE,retryAt:null,error:null,measurements:db.meta.generatorMeasurements||[],reviewRequired:true},visualEngine:VISUAL_ENGINE,visualCost:"free",visualStyle:"Acervo aprovado do Drive; revisão da composição obrigatória",storage:"R2",projects:db.projects.length,posts:db.posts.length,settings:db.settings,publishCooldownUntil:activeCooldown(db)});
  if(req.method==="GET"&&u.pathname==="/orpheus-api/meta/test"){if(!metaConfigured())return json(res,200,{connected:false,error:"Credenciais Meta ainda não configuradas"});try{const result=await testMeta();if(db.meta.apiAccessBlocked){delete db.meta.apiAccessBlocked;await saveDb(db)}return json(res,200,result)}catch(e){console.error("[ORPHEUS Agent] Teste Meta:",e.httpStatus||"",e.metaCode||"",e.metaSubcode||"",e.message);if(/API access blocked/i.test(e.message||"")&&!db.meta.apiAccessBlocked){db.meta.apiAccessBlocked={at:new Date().toISOString(),code:e.metaCode||null};await saveDb(db)}return json(res,200,{connected:false,error:e.message,httpStatus:e.httpStatus||null,metaCode:e.metaCode||null,metaSubcode:e.metaSubcode||null})}}
  if(req.method==="GET"&&u.pathname==="/orpheus-api/meta/analytics"){const days=Number(u.searchParams.get("days")||7);if(![7,30].includes(days))return json(res,400,{error:"Período inválido"});return json(res,200,await accountAnalytics(days))}
  if(req.method==="GET"&&u.pathname==="/orpheus-api/projects")return json(res,200,db.projects);
  if(req.method==="GET"&&u.pathname==="/orpheus-api/posts")return json(res,200,db.posts.filter(p=>p.status!=="deleted"));
  const imgUrlMatch=u.pathname.match(/^\/orpheus-api\/posts\/([^/]+)\/image-url$/);
  if(req.method==="GET"&&imgUrlMatch){const p=db.posts.find(x=>x.id===imgUrlMatch[1]);if(!p)return json(res,404,{error:"Post não encontrado"});try{const url=await mediaUrl(p);return json(res,200,{url})}catch(e){return json(res,400,{error:e.message})}}
  const viewed=u.pathname.match(/^\/orpheus-api\/posts\/([^/]+)\/preview-viewed$/);
  if(req.method==='POST'&&viewed){const p=db.posts.find(x=>x.id===viewed[1]);if(!p||!['ready','review_pending'].includes(p.artStatus))return json(res,409,{error:'Prévia não disponível'});p.artPreviewViewedAt=new Date().toISOString();await saveDb(db);return json(res,200,{ok:true});}
  const imgMatch=u.pathname.match(/^\/orpheus-api\/posts\/([^/]+)\/image$/);
  if(req.method==="GET"&&imgMatch){const p=db.posts.find(x=>x.id===imgMatch[1]);if(!p)return json(res,404,{error:"Post não encontrado"});try{const loc=await mediaUrl(p);res.writeHead(302,{Location:loc,"Cache-Control":"no-store"});res.end();return}catch(e){return json(res,400,{error:e.message})}}
  if(req.method==="GET"&&u.pathname==="/orpheus-api/settings")return json(res,200,db.settings);
  if(req.method==="GET"&&u.pathname==="/orpheus-api/policies")return json(res,200,POSTING_POLICY);
  if(req.method==="PUT"&&u.pathname==="/orpheus-api/settings"){const d=await body(req);const postsPerDay=Math.max(1,Math.min(12,Number(d.postsPerDay)||3));const incomingTimes=Array.isArray(d.postTimes)?d.postTimes.map(x=>String(x)).filter(x=>/^([01]\d|2[0-3]):([0-5]\d)$/.test(x)).slice(0,postsPerDay):[];db.settings={...db.settings,enabled:Boolean(d.enabled),postsPerDay,approvalMode:["manual","auto","hybrid"].includes(d.approvalMode)?d.approvalMode:"manual",scheduleMode:["interval","exact"].includes(d.scheduleMode)?d.scheduleMode:"interval",startHour:Math.max(0,Math.min(23,Number(d.startHour)||9)),endHour:Math.max(0,Math.min(23,Number(d.endHour)||19)),postTimes:incomingTimes};await saveDb(db);return json(res,200,db.settings)}
  if(req.method==="POST"&&u.pathname==="/orpheus-api/agent/run"){const d=await body(req),day=String(d.date||saoDate());if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day+"T00:00:00Z"))||new Date(day+"T00:00:00Z").toISOString().slice(0,10)!==day||day<saoDate())return json(res,400,{error:"Selecione uma data válida, a partir de hoje"});const a=await ensureDailyContent(true,day),art=await prepareArtworkForQueue();return json(res,200,{...a,art})}
  if(req.method==="POST"&&u.pathname==="/orpheus-api/uploads"){try{return json(res,201,{imageKey:await uploadImage(await body(req))})}catch(e){return json(res,400,{error:e.message})}}
  if(req.method==="POST"&&u.pathname==="/orpheus-api/posts"){const d=await body(req),pr=db.projects.find(x=>x.id===d.projectId);if(!pr)return json(res,400,{error:"Projeto inválido"});const p={id:id("post"),projectId:pr.id,projectName:pr.name,title:String(d.title||"Novo post"),caption:String(d.caption||""),imageKey:String(d.imageKey||""),imageUrl:String(d.imageUrl||ORPHEUS_PUBLIC_BASE+"/brand.png"),artStatus:d.imageKey||d.imageUrl?"review_pending":"placeholder",scheduledAt:String(d.scheduledAt||""),status:"draft",createdAt:new Date().toISOString()};db.posts.unshift(p);if(!d.imageKey&&!d.imageUrl)await attachPreapproved(db,p);await saveDb(db);return json(res,201,p)}
  const edit=u.pathname.match(/^\/orpheus-api\/posts\/([^/]+)$/);
  if(edit&&(req.method==="PUT"||req.method==="DELETE")){
    const p=db.posts.find(x=>x.id===edit[1]&&x.status!=="deleted");if(!p)return json(res,404,{error:"Post não encontrado"});
    if(p.status==="publishing"||publishingBusy)return json(res,409,{error:"Aguarde a publicação em andamento"});
    if(req.method==="DELETE"){p.status="deleted";p.deletedAt=new Date().toISOString();await saveDb(db);return json(res,200,{ok:true,instagramUnchanged:Boolean(p.metaMediaId)})}
    if(p.status==="published")return json(res,409,{error:"Uma postagem já publicada não pode ser editada por aqui"});
    const d=await body(req),pr=db.projects.find(x=>x.id===d.projectId);
    if(!pr)return json(res,400,{error:"Projeto inválido"});
    const title=String(d.title||"").trim(),caption=String(d.caption||"").trim();
    if(!title||!caption)return json(res,400,{error:"Informe título e legenda"});
    if(d.scheduledAt&&isNaN(new Date(d.scheduledAt).getTime()))return json(res,400,{error:"Data de agendamento inválida"});
    Object.assign(p,{projectId:pr.id,projectName:pr.name,title,caption,scheduledAt:String(d.scheduledAt||""),updatedAt:new Date().toISOString()});
    if(d.imageKey){p.imageKey=String(d.imageKey);p.imageUrl="";p.artStatus="review_pending";delete p.artValidation;delete p.artPreviewViewedAt}
    else if(d.imageUrl){p.imageKey="";p.imageUrl=String(d.imageUrl);p.artStatus="review_pending";delete p.artValidation;delete p.artPreviewViewedAt}
    if(!d.imageKey&&!d.imageUrl&&(p.sourceImageKey||!["ready","review_pending"].includes(p.artStatus)))await attachPreapproved(db,p);
    await saveDb(db);return json(res,200,p);
  }
  const m=u.pathname.match(/^\/orpheus-api\/posts\/([^/]+)\/(approve|reject|publish)$/);if(req.method==="POST"&&m){const p=db.posts.find(x=>x.id===m[1]);if(!p)return json(res,404,{error:"Post não encontrado"});if(p.status==="publishing"||p.status==="published")return json(res,409,{error:"Publicação já iniciada ou concluída; confira o Instagram antes de tentar novamente"});if(m[2]==="approve"){if(!["ready","review_pending"].includes(p.artStatus)||!(p.imageKey||p.imageUrl))return json(res,409,{error:"Confira a arte final antes de aprovar"});if(!p.artPreviewViewedAt)return json(res,409,{error:"Abra a prévia real antes de validar a arte"});if(db.posts.some(x=>x.id!==p.id&&x.status!=="deleted"&&((p.artHash&&x.artHash===p.artHash)||(p.imageKey&&x.imageKey===p.imageKey)||(!p.imageKey&&p.imageUrl&&x.imageUrl===p.imageUrl))))return json(res,409,{error:"Esta imagem já está associada a outra postagem; envie uma arte diferente"});p.artStatus="ready";p.artValidation={approvedAt:new Date().toISOString(),reviewer:ADMIN_USER,hash:p.artHash||p.imageKey||p.imageUrl};p.status="approved";p.lastError=""}else if(m[2]==="reject")p.status="rejected";else{if(!publishable(p))return json(res,409,{error:"Arte final precisa estar pronta e validada na prévia"});if(db.meta.apiAccessBlocked)return json(res,429,{error:"Acesso à API da Meta bloqueado. Execute um teste de conexão depois que a Meta liberar o acesso."});if(publishingBusy)return json(res,409,{error:"Há outra publicação em andamento. Tente novamente em instantes"});const until=activeCooldown(db);if(until)return json(res,429,{error:cooldownMessage(until),retryAt:until});publishingBusy=true;try{p.status="publishing";p.publishStartedAt=new Date().toISOString();await saveDb(db);const r=await publish(p);p.status="published";p.metaMediaId=r.id;p.metaContainerId=r.containerId;p.publishedAt=new Date().toISOString();p.lastError="";delete p.nextRetryAt}catch(e){if(p.status==="publishing"){p.status="error";if(isMetaActionLimit(e)){db.meta.publishCooldownUntil=cooldownDate(e);p.lastError=cooldownMessage(db.meta.publishCooldownUntil)}else if(/API access blocked/i.test(e.message||"")){db.meta.apiAccessBlocked={at:new Date().toISOString(),code:e.metaCode||null};p.lastError="A Meta bloqueou o acesso à API. Publicações pausadas até um teste de conexão bem-sucedido."}else p.lastError=e.message;await saveDb(db)}return json(res,isMetaActionLimit(e)||db.meta.apiAccessBlocked?429:400,{error:p.lastError||e.message,retryAt:activeCooldown(db)})}finally{publishingBusy=false}}await saveDb(db);return json(res,200,p)}
  return json(res,404,{error:"Rota social não encontrada"});
}

export async function handleOrpheusAgent(req,res){
  const u=new URL(req.url,"http://localhost");
  if(u.pathname.startsWith("/orpheus-api/")){await serialOperation(()=>api(req,res,u));return true}
  const preview=u.pathname.match(/^\/orpheus-agent\/preview\/([a-f0-9]{64})\.jpg$/);
  if(preview){text(res,404,"Arte rejeitada removida");return true}
  if(u.pathname==="/orpheus-agent/login-art.png"){try{const r=await s3().send(new GetObjectCommand({Bucket:R2_BUCKET,Key:OFFICIAL_LOGIN_ART_KEY}));const b=Buffer.from(await r.Body.transformToByteArray());res.writeHead(200,{"Content-Type":"image/png","Cache-Control":"public, max-age=3600"});res.end(b)}catch(e){console.error("[ORPHEUS Agent] Falha ao carregar arte oficial",e.message);res.writeHead(302,{Location:"/orpheus-agent/emblem.png"});res.end()}return true}
  if(u.pathname==="/orpheus-agent/emblem.png"){res.writeHead(200,{"Content-Type":"image/svg+xml","Cache-Control":"public, max-age=86400"});res.end(EMBLEM_PNG);return true}
  if(u.pathname==="/orpheus-agent/brand.png"){res.writeHead(200,{"Content-Type":"image/png","Cache-Control":"public, max-age=86400"});res.end(brandPng());return true}
  if(u.pathname==="/orpheus-agent"){res.writeHead(302,{Location:"/orpheus-agent/"});res.end();return true}
  if(u.pathname.startsWith("/orpheus-agent/")){const rel=u.pathname.slice("/orpheus-agent/".length)||"index.html",safe=rel.replace(/\.\./g,""),file=path.join(PUBLIC,safe);if(!file.startsWith(PUBLIC)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){text(res,404,"Não encontrado");return true}text(res,200,fs.readFileSync(file),mime(file));return true}
  return false;
}


setTimeout(()=>serialOperation(async()=>{
  const db=await loadDb();if(db.meta.preapprovedIntegrationVerified?.version===2)return;
  for(const p of db.posts.filter(p=>p.sourceImageKey&&!['published','publishing','deleted','rejected'].includes(p.status))){const result=await attachPreapproved(db,p);if(result.made)p.status='draft';await saveDb(db);}
  const test={id:'integration-preview',title:'Ponto Cego',status:'draft'};
  const result=await attachPreapproved({posts:[],meta:{}},test);
  if(result.made){db.meta.preapprovedIntegrationVerified={version:2,at:new Date().toISOString(),imageKey:test.imageKey,source:test.sourceImageName,hash:test.artHash};await saveDb(db);}
  console.log('[ORPHEUS Preapproved Verification]',JSON.stringify({...result,previewKey:test.imageKey,hash:test.artHash}));
}).catch(e=>console.error('[ORPHEUS Preapproved Verification]',e.message)),3000);
