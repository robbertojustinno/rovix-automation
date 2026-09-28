import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import zlib from "node:zlib";
import {fileURLToPath} from "node:url";
import {S3Client,PutObjectCommand,GetObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const PUBLIC=path.join(__dirname,"social-agent-public");
const R2_ENDPOINT=process.env.R2_ENDPOINT||"";
const R2_ACCESS_KEY_ID=process.env.R2_ACCESS_KEY_ID||"";
const R2_SECRET_ACCESS_KEY=process.env.R2_SECRET_ACCESS_KEY||"";
const R2_BUCKET=process.env.R2_BUCKET||"rovix-drive";
const DB_KEY="social-agent/db.json";
const ADMIN_USER=process.env.SOCIAL_ADMIN_USER||"admin";
const ADMIN_PASSWORD_HASH=process.env.SOCIAL_ADMIN_PASSWORD_HASH||"";
const SESSION_SECRET=process.env.SOCIAL_SESSION_SECRET||"";
const SOCIAL_PUBLIC_BASE=(process.env.SOCIAL_PUBLIC_BASE||"https://rovix-drive-api.onrender.com/social-agent").replace(/\/$/,"");
const OFFICIAL_LOGO_URL=process.env.ROVIX_LOGO_URL||"https://www.rovixautomation.com.br/logo.png";
const VISUAL_ENGINE="rovix-v3-animated-free";
const MAX_FAST_IMAGES_PER_RUN=12;
const LOGO_JPG=Buffer.from("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","base64");
const DEFAULT_SETTINGS={enabled:true,postsPerDay:3,approvalMode:"manual",scheduleMode:"interval",startHour:9,endHour:19,postTimes:["09:00","14:00","19:00"],timezone:"America/Sao_Paulo"};
const POSTING_POLICY=Object.freeze({
  id:"rovix-v3-animated-free",
  immutable:true,
  image:{
    minWidth:1080,
    minHeight:1080,
    preferredFormats:["1080x1080","1080x1350"],
    style:["3d-animado","premium","industrial","tecnologico","padrao-rapido"],
    palette:["azul-escuro","vermelho","prata","grafite","preto"],
    requirements:[
      "logo ROVIX integrada sem distorcao",
      "composicao publicitaria profissional",
      "tipografia forte e legivel",
      "coerencia visual com o produto",
      "variacao suficiente para evitar repeticao",
      "sem placeholder em publicacao final"
    ]
  },
  categories:[
    "Institucional ROVIX",
    "Produto / solucao",
    "Tecnologia / inovacao",
    "Automacao industrial",
    "Ciberseguranca / software",
    "TagCheck / ROVIX Drive / UAP / CIPHER"
  ],
  publication:{
    defaultPostsPerDay:3,
    requiresFinalArtwork:true,
    allowPlaceholderPublish:false,
    keepBrandFamily:true,
    avoidRepeatedThemes:true,
    visualEngine:"ROVIX V3 Animated Visual Engine (FREE)",
    defaultVisualLevel:"rapido"
  }
});
const TOPICS={
  rovix:["Automação que resolve","Tecnologia aplicada","Integração de sistemas","Produtividade industrial","Engenharia e software","Inovação prática"],
  tagcheck:["Inspeções sem papel","Rastreabilidade de ativos","Organização das inspeções","Histórico e evidências","Padronização de campo","Gestão digital de ativos"],
  "rovix-drive":["Arquivos da ROVIX na nuvem","Distribuição segura de arquivos","Downloads organizados","Central de produtos digitais","Compartilhamento simples","Acesso online aos projetos"],
  "uap-studio":["Integração industrial","Comunicação entre equipamentos","Ferramentas de diagnóstico","RS-485, CAN e TCP","Automação conectada","Engenharia de protocolo"],
  cipher:["Protocolo Orpheus","Blake Langmere","Mistério e espionagem","Tecnologia e conspiração","Universo CIPHER","Suspense tecnológico"]
};

const BASE_PROJECTS=[
  {id:"rovix",name:"ROVIX Automation",active:true,frequency:7,tone:"tecnológico, industrial e profissional",cta:"Acompanhe a ROVIX"},
  {id:"tagcheck",name:"TagCheck",active:true,frequency:3,tone:"técnico, profissional e comercial",cta:"Conheça o TagCheck"},
  {id:"rovix-drive",name:"ROVIX Drive",active:true,frequency:2,tone:"direto, tecnológico e acessível",cta:"Conheça o ROVIX Drive"},
  {id:"uap-studio",name:"UAP Studio",active:true,frequency:2,tone:"engenharia, automação e inovação",cta:"Acompanhe o UAP Studio"},
  {id:"cipher",name:"CIPHER — Protocolo Orpheus",active:true,frequency:2,tone:"thriller, mistério e espionagem",cta:"Descubra CIPHER"}
];

function s3(){if(!R2_ENDPOINT||!R2_ACCESS_KEY_ID||!R2_SECRET_ACCESS_KEY)throw new Error("R2_NOT_CONFIGURED");return new S3Client({region:"auto",endpoint:R2_ENDPOINT,credentials:{accessKeyId:R2_ACCESS_KEY_ID,secretAccessKey:R2_SECRET_ACCESS_KEY}})}
async function readStream(stream){return await stream.transformToString()}
async function saveDb(db){await s3().send(new PutObjectCommand({Bucket:R2_BUCKET,Key:DB_KEY,Body:JSON.stringify(db,null,2),ContentType:"application/json"}))}
async function loadDb(){
  let db;
  try{const r=await s3().send(new GetObjectCommand({Bucket:R2_BUCKET,Key:DB_KEY}));db=JSON.parse(await readStream(r.Body))}
  catch(e){if(e?.name==="NoSuchKey"||e?.$metadata?.httpStatusCode===404)db={projects:[],posts:[]};else throw e}
  db.projects=db.projects||[];db.posts=db.posts||[];db.settings={...DEFAULT_SETTINGS,...(db.settings||{})};db.meta=db.meta||{};
  if(!db.meta.purgedUnpublished20260927){
    const before=db.posts.length;
    db.posts=db.posts.filter(p=>p.status==="published");
    db.meta.purgedUnpublished20260927={at:new Date().toISOString(),removed:before-db.posts.length};
  }
  for(const p of BASE_PROJECTS)if(!db.projects.some(x=>x.id===p.id))db.projects.push(p);
  if(!db.meta.seededInstitutionalPost){
    db.posts.unshift({id:"seed-institucional-001",projectId:"rovix",projectName:"ROVIX Automation",title:"Tecnologia aplicada ao mundo real",caption:"A ROVIX une automação, software e inovação para transformar processos em soluções práticas.\n\nDo chão de fábrica ao ambiente digital, seguimos desenvolvendo ferramentas para organizar, conectar e automatizar operações.\n\nAcompanhe os próximos projetos e lançamentos da ROVIX.\n\n#ROVIX #AutomacaoIndustrial #Tecnologia #Industria40 #Software #Inovacao",imageUrl:SOCIAL_PUBLIC_BASE+"/brand.png",scheduledAt:"",status:"draft",createdAt:new Date().toISOString(),generatedBy:"agent"});
    db.meta.seededInstitutionalPost=true;
  }
  await saveDb(db);return db;
}
function json(res,status,data,extra={}){res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...extra});res.end(JSON.stringify(data))}
function text(res,status,data,type="text/plain; charset=utf-8"){res.writeHead(status,{"Content-Type":type,"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});res.end(data)}
function mime(p){return({".html":"text/html; charset=utf-8",".js":"application/javascript; charset=utf-8",".css":"text/css; charset=utf-8"})[path.extname(p)]||"application/octet-stream"}
function body(req,limit=12*1024*1024){return new Promise((resolve,reject)=>{let raw="";req.on("data",c=>{raw+=c;if(raw.length>limit){reject(new Error("Payload muito grande"));req.destroy()}});req.on("end",()=>{if(!raw)return resolve({});try{resolve(JSON.parse(raw))}catch{reject(new Error("JSON inválido"))}});req.on("error",reject)})}
function cookies(req){return Object.fromEntries(String(req.headers.cookie||"").split(";").map(v=>v.trim()).filter(Boolean).map(v=>{const i=v.indexOf("=");return[decodeURIComponent(v.slice(0,i)),decodeURIComponent(v.slice(i+1))]}))}
function verifyPassword(pass){if(!ADMIN_PASSWORD_HASH)return false;const [salt,expected]=ADMIN_PASSWORD_HASH.split(":");if(!salt||!expected)return false;const got=crypto.scryptSync(String(pass),Buffer.from(salt,"hex"),32).toString("hex");return crypto.timingSafeEqual(Buffer.from(got),Buffer.from(expected))}
function makeSession(){const exp=Date.now()+12*60*60*1000,payload=ADMIN_USER+"|"+exp,sig=crypto.createHmac("sha256",SESSION_SECRET).update(payload).digest("hex");return Buffer.from(payload+"|"+sig).toString("base64url")}
function validSession(t){try{if(!SESSION_SECRET||!t)return false;const [user,exp,sig]=Buffer.from(t,"base64url").toString().split("|"),payload=user+"|"+exp,calc=crypto.createHmac("sha256",SESSION_SECRET).update(payload).digest("hex");return user===ADMIN_USER&&Number(exp)>Date.now()&&sig?.length===calc.length&&crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(calc))}catch{return false}}
function authed(req){const bearer=String(req.headers.authorization||"").startsWith("Bearer ")?String(req.headers.authorization).slice(7):"";return validSession(bearer)||validSession(cookies(req).rovix_social_session)}
function sessionCookie(token,maxAge=43200){return "rovix_social_session="+token+"; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age="+maxAge}
function metaCfg(){return{token:process.env.META_ACCESS_TOKEN||"",ig:process.env.META_IG_USER_ID||"",version:process.env.META_GRAPH_VERSION||"v26.0",host:process.env.META_API_HOST||"graph.instagram.com"}}
function metaConfigured(){const c=metaCfg();return!!(c.token&&c.ig&&c.version&&c.host)}
async function metaFetch(route,{method="GET",params={}}={}){const c=metaCfg();if(!metaConfigured())throw new Error("Instagram não configurado no servidor");const u=new URL("https://"+c.host+"/"+encodeURIComponent(c.version)+"/"+String(route).replace(/^\//,""));const headers={Authorization:"Bearer "+c.token,"User-Agent":"ROVIX-Social-Agent/0.3"};const init={method,headers};if(method==="GET")Object.entries(params).forEach(([k,v])=>v!==""&&v!=null&&u.searchParams.set(k,String(v)));else{headers["Content-Type"]="application/x-www-form-urlencoded";init.body=new URLSearchParams(Object.entries(params).filter(([,v])=>v!==""&&v!=null)).toString()}const r=await fetch(u,init),raw=await r.text();let d;try{d=JSON.parse(raw)}catch{d={raw}};if(!r.ok||d.error)throw new Error(d?.error?.message||("Erro HTTP "+r.status));return d}
async function testMeta(){const c=metaCfg(),d=await metaFetch(c.ig,{params:{fields:"id,username,account_type"}});return{connected:true,id:d.id||c.ig,username:d.username||null,accountType:d.account_type||null,apiHost:c.host,apiVersion:c.version}}
async function mediaUrl(post){if(post.imageKey)return await getSignedUrl(s3(),new GetObjectCommand({Bucket:R2_BUCKET,Key:post.imageKey}),{expiresIn:900});if(/\/logo\.jpg(?:$|\?)/i.test(post.imageUrl||""))return SOCIAL_PUBLIC_BASE+"/brand.png";if(/^https:\/\//i.test(post.imageUrl||""))return post.imageUrl;return SOCIAL_PUBLIC_BASE+"/brand.png"}
async function waitContainer(id){for(let i=0;i<12;i++){const d=await metaFetch(id,{params:{fields:"status_code,status"}}),s=String(d.status_code||"").toUpperCase();if(!s||s==="FINISHED")return;if(s==="ERROR"||s==="EXPIRED")throw new Error(d.status||("Container "+s));await new Promise(r=>setTimeout(r,1800))}throw new Error("A mídia ainda não ficou pronta para publicação")}
async function publish(post){if(post.artStatus&&post.artStatus!=="ready")throw new Error("Arte final ainda não está pronta");const c=metaCfg(),url=await mediaUrl(post);const created=await metaFetch(c.ig+"/media",{method:"POST",params:{image_url:url,caption:post.caption||""}});if(!created.id)throw new Error("A Meta não retornou o ID do container");await waitContainer(created.id);const pub=await metaFetch(c.ig+"/media_publish",{method:"POST",params:{creation_id:created.id}});if(!pub.id)throw new Error("A Meta não retornou o ID da publicação");return{...pub,containerId:created.id}}
async function uploadImage(data){const m=String(data.dataUrl||"").match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);if(!m)throw new Error("Imagem inválida. Use JPG, PNG ou WEBP");const b=Buffer.from(m[2],"base64");if(b.length>8*1024*1024)throw new Error("Imagem maior que 8 MB");const ext=m[1]==="image/jpeg"?"jpg":m[1].split("/")[1],key="social-agent/media/"+Date.now()+"-"+crypto.randomBytes(6).toString("hex")+"."+ext;await s3().send(new PutObjectCommand({Bucket:R2_BUCKET,Key:key,Body:b,ContentType:m[1]}));return key}
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
let cachedLogo=null;
async function getOfficialLogo(){
  if(cachedLogo)return cachedLogo;
  const r=await fetch(OFFICIAL_LOGO_URL,{redirect:"follow"});if(!r.ok)throw new Error("Falha ao carregar logo oficial");
  cachedLogo=Buffer.from(await r.arrayBuffer());return cachedLogo;
}
function visualHash(s=""){let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function sceneType(project){if(project.id==="rovix-drive")return"servers";if(project.id==="cipher")return"cyber";if(project.id==="tagcheck")return"inspection";if(project.id==="uap-studio")return"network";return"robot"}
function sceneSvg(project,variant){
  const type=sceneType(project),v=variant%4,accent=v%2?"#e32435":"#28d9c7";
  const defs=`<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#06101d"/><stop offset=".52" stop-color="#10263d"/><stop offset="1" stop-color="#030711"/></linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f6f8fb"/><stop offset=".35" stop-color="#7b8da3"/><stop offset=".65" stop-color="#eef3f8"/><stop offset="1" stop-color="#536476"/></linearGradient>
    <linearGradient id="red" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ff3545"/><stop offset="1" stop-color="#8d0714"/></linearGradient>
    <linearGradient id="blue" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#39a6ff"/><stop offset="1" stop-color="#123e91"/></linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="shadow"><feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#000" flood-opacity=".55"/></filter>
  </defs>`;
  const grid=`<g opacity=".16" stroke="#6fa9d6" stroke-width="2">${Array.from({length:11},(_,i)=>`<path d="M0 ${120+i*86} H1080"/>`).join("")}${Array.from({length:11},(_,i)=>`<path d="M${60+i*96} 0 V1080"/>`).join("")}</g>`;
  let scene="";
  if(type==="robot") scene=`
    <g filter="url(#shadow)" transform="translate(${v*18-20} ${v*8})">
      <rect x="0" y="760" width="1080" height="250" fill="#07111c"/>
      <g stroke="#294a68" stroke-width="7" fill="none" opacity=".8"><path d="M80 860 H1000"/><path d="M120 930 H960"/></g>
      <g transform="translate(555 205)">
        <circle cx="170" cy="165" r="88" fill="url(#metal)" stroke="#cfd8e3" stroke-width="8"/>
        <rect x="115" y="128" width="112" height="78" rx="24" fill="#101923" stroke="#e32435" stroke-width="6"/>
        <g transform="rotate(-24 170 165)">
          <rect x="-210" y="118" width="385" height="92" rx="45" fill="url(#red)" stroke="#ff6b75" stroke-width="7"/>
          <circle cx="-205" cy="164" r="67" fill="url(#metal)" stroke="#1d2b3c" stroke-width="12"/>
        </g>
        <g transform="rotate(38 168 164)">
          <rect x="154" y="126" width="265" height="78" rx="38" fill="url(#metal)" stroke="#e32435" stroke-width="7"/>
          <circle cx="410" cy="164" r="52" fill="#121b26" stroke="#e32435" stroke-width="8"/>
        </g>
        <path d="M525 430 l95 35 -30 122 -105 -42z" fill="#151f2b" stroke="#e32435" stroke-width="8"/>
        <path d="M535 548 l-18 120 M585 555 l22 112" stroke="#d9e3ed" stroke-width="18" stroke-linecap="round"/>
      </g>
      <g opacity=".9"><rect x="70" y="165" width="330" height="420" rx="28" fill="#081421" stroke="#31557a" stroke-width="5"/><rect x="105" y="205" width="260" height="180" rx="16" fill="#0c2a45"/><path d="M130 340 L180 292 L228 315 L295 240 L340 268" fill="none" stroke="${accent}" stroke-width="8" filter="url(#glow)"/><g fill="#7ea9cc">${[0,1,2,3].map(i=>`<rect x="110" y="${430+i*32}" width="${180-i*18}" height="12" rx="6"/>`).join("")}</g></g>
    </g>`;
  else if(type==="servers") scene=`
    <g filter="url(#shadow)">
      <g transform="translate(90 120)">${[0,1,2].map((r)=>`<g transform="translate(${r*300} 0)"><rect width="245" height="610" rx="22" fill="#0a1522" stroke="#45617e" stroke-width="6"/>${Array.from({length:8},(_,i)=>`<rect x="24" y="${36+i*66}" width="197" height="44" rx="8" fill="#17283a" stroke="#37506a" stroke-width="3"/><circle cx="190" cy="${58+i*66}" r="7" fill="${i%2?"#28d9c7":"#e32435"}" filter="url(#glow)"/>`).join("")}</g>`).join("")}</g>
      <path d="M180 780 C350 650 720 650 900 780" fill="none" stroke="${accent}" stroke-width="12" opacity=".75" filter="url(#glow)"/>
      <g transform="translate(770 170)"><circle cx="105" cy="105" r="96" fill="#091624" stroke="#2a4765" stroke-width="7"/><path d="M45 115 q20-60 60-25 q30-70 80-15 q52 0 45 52 q-6 42-55 42H82q-55 0-48-54z" fill="url(#blue)" stroke="#8bc8ff" stroke-width="6"/></g>
    </g>`;
  else if(type==="inspection") scene=`
    <g filter="url(#shadow)">
      <rect x="85" y="155" width="520" height="520" rx="42" fill="#0c1724" stroke="#334f6c" stroke-width="7"/>
      <g transform="translate(575 155)"><circle cx="155" cy="125" r="76" fill="url(#metal)"/><path d="M90 220 q65-52 130 0 l38 300H48z" fill="#11243a" stroke="#294e73" stroke-width="7"/><rect x="76" y="285" width="165" height="220" rx="18" fill="#091522" stroke="#28d9c7" stroke-width="7"/><rect x="95" y="312" width="126" height="140" rx="10" fill="#0b2c43"/><path d="M112 405 l35 35 70-85" fill="none" stroke="#28d9c7" stroke-width="12" stroke-linecap="round"/></g>
      <g transform="translate(130 205)"><rect width="420" height="320" rx="24" fill="#101f30"/><circle cx="115" cy="110" r="55" fill="#1e3b55"/><path d="M80 110h70M115 75v70" stroke="#e32435" stroke-width="13"/><g fill="#6f92b1">${[0,1,2,3].map(i=>`<rect x="205" y="${72+i*52}" width="${160-i*12}" height="16" rx="8"/>`).join("")}</g></g>
    </g>`;
  else if(type==="network") scene=`
    <g filter="url(#shadow)">
      <rect x="90" y="150" width="900" height="560" rx="40" fill="#091522" stroke="#2c4c6d" stroke-width="7"/>
      <g stroke="#28d9c7" stroke-width="7" opacity=".65" filter="url(#glow)"><path d="M180 300 H430 L520 220 H830"/><path d="M180 470 H370 L500 570 H830"/><path d="M360 300 V470"/><path d="M620 220 V570"/></g>
      ${[[180,300],[430,300],[520,220],[830,220],[180,470],[370,470],[500,570],[830,570],[620,395]].map(([x,y],i)=>`<g transform="translate(${x} ${y})"><circle r="${i===8?48:30}" fill="${i%2?"#e32435":"#123e91"}" stroke="#e6eef6" stroke-width="5"/><circle r="11" fill="#fff"/></g>`).join("")}
      <g transform="translate(350 735)"><rect width="380" height="120" rx="24" fill="#111e2b" stroke="#52677d" stroke-width="5"/><rect x="30" y="30" width="80" height="60" rx="10" fill="#24384c"/><rect x="135" y="30" width="215" height="18" rx="9" fill="#28d9c7"/><rect x="135" y="65" width="155" height="15" rx="7" fill="#607c97"/></g>
    </g>`;
  else scene=`
    <g filter="url(#shadow)">
      <rect x="75" y="145" width="930" height="600" rx="42" fill="#07111d" stroke="#2c4968" stroke-width="7"/>
      <g opacity=".8" stroke="#28d9c7" stroke-width="5">${Array.from({length:9},(_,i)=>`<path d="M130 ${210+i*52} H${310+(i%3)*110}"/>`).join("")}</g>
      <g transform="translate(610 205)"><circle cx="150" cy="150" r="125" fill="#0e2032" stroke="#e32435" stroke-width="8"/><path d="M95 105 h110 v90 H95z" fill="#020711" stroke="#a7bdd2" stroke-width="6"/><path d="M120 130 l30 30 45-55" fill="none" stroke="#28d9c7" stroke-width="10"/></g>
      <path d="M220 780 Q540 610 860 780" fill="none" stroke="#e32435" stroke-width="10" filter="url(#glow)"/>
      <g transform="translate(300 560)"><path d="M0 160 q120-160 240 0 q120-160 240 0 v170H0z" fill="#101a27" stroke="#6c8096" stroke-width="6"/><path d="M240 0 v325" stroke="#e32435" stroke-width="6"/></g>
    </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080">${defs}<rect width="1080" height="1080" fill="url(#bg)"/>${grid}${scene}</svg>`;
}
async function roundLogoBadge(){
  const logo=await sharp(await getOfficialLogo()).resize({width:170,height:170,fit:"contain",background:{r:3,g:8,b:15,alpha:1}}).jpeg({quality:92}).toBuffer();
  const mask=Buffer.from('<svg width="170" height="170"><circle cx="85" cy="85" r="82" fill="white"/></svg>');
  const clipped=await sharp(logo).composite([{input:mask,blend:"dest-in"}]).png().toBuffer();
  const frame=Buffer.from('<svg width="220" height="220" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="m" x1="0" x2="1"><stop stop-color="#ff2538"/><stop offset=".32" stop-color="#f4f7fb"/><stop offset=".68" stop-color="#245db3"/><stop offset="1" stop-color="#e32435"/></linearGradient><filter id="s"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-opacity=".55"/></filter></defs><circle cx="110" cy="110" r="102" fill="#050b13" stroke="url(#m)" stroke-width="12" filter="url(#s)"/><circle cx="110" cy="110" r="90" fill="none" stroke="#d7e0ea" stroke-width="3"/></svg>');
  return await sharp(frame).composite([{input:clipped,left:25,top:25}]).png().toBuffer();
}
async function createFastArtwork(post,project){
  const variant=visualHash(post.id+post.title)%4;
  const bg=await sharp(Buffer.from(sceneSvg(project,variant))).png().toBuffer();
  const badge=await roundLogoBadge();
  const title=escapeXml((post.title||project.name).slice(0,34)),subtitle=escapeXml(project.name);
  const accent=variant%2?"#e32435":"#28d9c7";
  const overlay=Buffer.from(`<svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="48%" stop-color="#020711" stop-opacity="0"/><stop offset="100%" stop-color="#020711" stop-opacity=".94"/></linearGradient></defs>
    <rect width="1080" height="1080" fill="url(#shade)"/>
    <rect x="44" y="730" width="992" height="300" rx="28" fill="#06101c" fill-opacity=".88" stroke="#2c4662" stroke-width="3"/>
    <rect x="44" y="730" width="10" height="300" fill="${accent}"/>
    <text x="88" y="820" font-family="Arial,Helvetica,sans-serif" font-size="59" font-weight="800" fill="#f7f9fc">${title}</text>
    <text x="88" y="881" font-family="Arial,Helvetica,sans-serif" font-size="32" font-weight="800" fill="${accent}">${subtitle}</text>
    <text x="88" y="937" font-family="Arial,Helvetica,sans-serif" font-size="24" font-weight="600" fill="#d7e0e9">AUTOMAÇÃO  •  SOFTWARE  •  INOVAÇÃO</text>
    <rect x="88" y="976" width="555" height="6" rx="3" fill="#e32435"/>
  </svg>`);
  const final=await sharp(bg).resize(1080,1080).composite([{input:overlay,top:0,left:0},{input:badge,top:34,left:820}]).jpeg({quality:94,mozjpeg:true}).toBuffer();
  const key="social-agent/v3/"+Date.now()+"-"+crypto.randomBytes(6).toString("hex")+".jpg";
  await s3().send(new PutObjectCommand({Bucket:R2_BUCKET,Key:key,Body:final,ContentType:"image/jpeg"}));
  return{key,asset:{url:"procedural://rovix-v3",license:"ROVIX procedural artwork"}};
}
async function prepareArtworkForQueue(){
  const db=await loadDb();let made=0;
  const candidates=db.posts.filter(p=>["draft","approved","error"].includes(p.status)&&p.artStatus!=="ready").slice().reverse().slice(0,MAX_FAST_IMAGES_PER_RUN);
  for(const p of candidates){
    const project=db.projects.find(x=>x.id===p.projectId)||{id:"rovix",name:"ROVIX Automation"};
    try{
      const art=await createFastArtwork(p,project);
      p.imageKey=art.key;p.imageUrl="";p.artStatus="ready";p.visualPolicy=POSTING_POLICY.id;p.visualEngine=VISUAL_ENGINE;p.visualLevel="rapido";p.visualSource=art.asset.url;p.visualLicense=art.asset.license;p.artGeneratedAt=new Date().toISOString();p.lastError="";delete p.artError;
      if(p.status==="error")p.status=db.settings.approvalMode==="auto"?"approved":"draft";
      made++;
    }catch(e){p.artStatus="error";p.artError=e.message;console.error("[Social Agent] Falha na arte",p.id,e.message)}
  }
  if(candidates.length)await saveDb(db);return{made,engine:VISUAL_ENGINE,level:"rapido"}
}
function buildCaption(project,topic,i){const variants=[
  topic+" não precisa ser complicado. A "+project.name+" foi pensada para transformar tarefas do dia a dia em um fluxo mais organizado, rastreável e eficiente.",
  "Quando tecnologia e operação trabalham juntas, o resultado aparece no processo. "+topic+" é um dos pontos em que a "+project.name+" busca reduzir retrabalho e dar mais visibilidade ao que acontece.",
  "Mais controle, menos improviso. "+topic+" faz parte da proposta da "+project.name+": aplicar tecnologia de forma prática onde ela realmente gera valor.",
  "A evolução industrial também passa por ferramentas simples de usar e fáceis de integrar. Hoje o destaque é: "+topic+"."
];return variants[i%variants.length]+"\n\n"+project.cta+".\n\n#ROVIX #Automacao #Tecnologia #Industria40 #Inovacao"}
async function ensureDailyContent(force=false){
  const db=await loadDb(),s=db.settings;
  if(!s.enabled&&!force)return{created:0,target:0,day:saoDate(),reason:"disabled"};
  const day=saoDate(),target=Math.max(1,Math.min(12,Number(s.postsPerDay)||3));
  const existing=db.posts.filter(p=>p.generatedDate===day&&p.generatedBy==="agent").length;
  if(!force&&existing>=target)return{created:0,target,day,existing,reason:"daily_target_already_met"};
  const startIndex=force?0:existing;
  let created=0;
  for(let i=startIndex;i<target;i++){
    const active=db.projects.filter(p=>p.active);if(!active.length)break;
    const p=active[(Number(db.meta.topicCursor||0)+i)%active.length],topics=TOPICS[p.id]||TOPICS.rovix;
    const topic=topics[(Number(db.meta.topicCursor||0)+i)%topics.length];
    const status=s.approvalMode==="auto"?"approved":s.approvalMode==="hybrid"&&i===0?"approved":"draft";
    let scheduledAt=scheduleFor(day,i,target,s);
    if(force&&new Date(scheduledAt)<=new Date())scheduledAt=new Date(Date.now()+(created+1)*2*60*1000).toISOString();
    db.posts.unshift({id:id("agent"),projectId:p.id,projectName:p.name,title:topic,caption:buildCaption(p,topic,i),imageUrl:SOCIAL_PUBLIC_BASE+"/brand.png",scheduledAt,status,createdAt:new Date().toISOString(),generatedBy:"agent",generatedDate:day,forcedBatch:force,visualPolicy:POSTING_POLICY.id,visualEngine:VISUAL_ENGINE,visualLevel:"rapido",artStatus:"placeholder"});
    created++;
  }
  db.meta.topicCursor=Number(db.meta.topicCursor||0)+created;
  if(created)await saveDb(db);
  return{created,target,day,existing,forced:force}
}
async function publishDue(){const db=await loadDb(),now=new Date(),due=db.posts.filter(p=>p.status==="approved"&&p.scheduledAt&&new Date(p.scheduledAt)<=now&&(!p.nextRetryAt||new Date(p.nextRetryAt)<=now)).slice(0,10),results=[];if(due.length)console.log("[Social Agent] Publicações vencidas:",due.length,now.toISOString());for(const p of due){try{const r=await publish(p);p.status="published";p.metaMediaId=r.id;p.metaContainerId=r.containerId;p.publishedAt=new Date().toISOString();p.lastError="";p.publishAttempts=Number(p.publishAttempts||0)+1;delete p.nextRetryAt;results.push({id:p.id,ok:true});console.log("[Social Agent] Publicado:",p.id,r.id)}catch(e){p.publishAttempts=Number(p.publishAttempts||0)+1;p.lastError=e.message;const transient=/Media ID is not available|temporar|try again|timeout|rate/i.test(e.message||"");if(transient&&p.publishAttempts<4){p.status="approved";p.nextRetryAt=new Date(Date.now()+2*60*1000).toISOString()}else p.status="error";results.push({id:p.id,ok:false,error:e.message,retry:!!p.nextRetryAt});console.error("[Social Agent] Falha ao publicar",p.id,e.message)}}if(due.length)await saveDb(db);return results}
let busy=false;async function automationTick(){if(busy)return;busy=true;try{await ensureDailyContent(false);await prepareArtworkForQueue();await publishDue()}catch(e){console.error("Social Agent:",e.message)}finally{busy=false}}
setTimeout(()=>automationTick(),5000);setInterval(()=>automationTick(),60*1000);

function crc32(buf){let c=0xffffffff;for(const b of buf){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0}
function pngChunk(type,data){const t=Buffer.from(type),len=Buffer.alloc(4),crc=Buffer.alloc(4);len.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([len,t,data,crc])}
const MINI_FONT={R:["11110","10001","10001","11110","10100","10010","10001"],O:["01110","10001","10001","10001","10001","10001","01110"],V:["10001","10001","10001","10001","10001","01010","00100"],I:["11111","00100","00100","00100","00100","00100","11111"],X:["10001","10001","01010","00100","01010","10001","10001"],A:["01110","10001","10001","11111","10001","10001","10001"],U:["10001","10001","10001","10001","10001","10001","01110"],T:["11111","00100","00100","00100","00100","00100","00100"],M:["10001","11011","10101","10101","10001","10001","10001"],N:["10001","11001","10101","10011","10001","10001","10001"]," ":["00000","00000","00000","00000","00000","00000","00000"]};
function brandPng(){const w=1080,h=1080,row=w*4+1,raw=Buffer.alloc(row*h);for(let y=0;y<h;y++){const o=y*row;raw[o]=0;for(let x=0;x<w;x++){const i=o+1+x*4;raw[i]=5;raw[i+1]=10;raw[i+2]=18;raw[i+3]=255}}const rect=(x1,y1,x2,y2,r,g,b)=>{for(let y=y1;y<y2;y++)for(let x=x1;x<x2;x++){const i=y*row+1+x*4;raw[i]=r;raw[i+1]=g;raw[i+2]=b;raw[i+3]=255}};const text=(s,x,y,sc,r,g,b)=>{let cx=x;for(const ch of s){const p=MINI_FONT[ch]||MINI_FONT[" "];for(let yy=0;yy<7;yy++)for(let xx=0;xx<5;xx++)if(p[yy][xx]==="1")rect(cx+xx*sc,y+yy*sc,cx+(xx+1)*sc,y+(yy+1)*sc,r,g,b);cx+=6*sc}};rect(70,70,1010,74,31,48,72);rect(70,1006,1010,1010,31,48,72);text("ROVIX",170,300,28,235,241,248);text("AUTOMATION",200,610,12,48,216,197);rect(170,790,910,800,220,35,48);const sig=Buffer.from([137,80,78,71,13,10,26,10]),ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;return Buffer.concat([sig,pngChunk("IHDR",ih),pngChunk("IDAT",zlib.deflateSync(raw,{level:9})),pngChunk("IEND",Buffer.alloc(0))])}

async function api(req,res,u){
  if(u.pathname==="/social-api/auth/status")return json(res,200,{authenticated:authed(req),user:authed(req)?ADMIN_USER:null});
  if(req.method==="POST"&&u.pathname==="/social-api/auth/login"){const d=await body(req);if(d.user!==ADMIN_USER||!verifyPassword(d.password))return json(res,401,{error:"Usuário ou senha inválidos"});const token=makeSession();return json(res,200,{ok:true,user:ADMIN_USER,sessionToken:token},{"Set-Cookie":sessionCookie(token)})}
  if(req.method==="POST"&&u.pathname==="/social-api/auth/logout")return json(res,200,{ok:true},{"Set-Cookie":sessionCookie("",0)});
  if(!authed(req))return json(res,401,{error:"Autenticação obrigatória"});

  const db=await loadDb();
  if(req.method==="GET"&&u.pathname==="/social-api/status")return json(res,200,{app:"ROVIX Social Agent",version:"0.6.0",online:true,metaConfigured:metaConfigured(),imageGenerationConfigured:true,visualEngine:VISUAL_ENGINE,visualCost:"free",visualStyle:"3D animado premium",storage:"R2",projects:db.projects.length,posts:db.posts.length,settings:db.settings});
  if(req.method==="GET"&&u.pathname==="/social-api/meta/test"){if(!metaConfigured())return json(res,200,{connected:false,error:"Credenciais Meta ainda não configuradas"});try{return json(res,200,await testMeta())}catch(e){return json(res,200,{connected:false,error:e.message})}}
  if(req.method==="GET"&&u.pathname==="/social-api/projects")return json(res,200,db.projects);
  if(req.method==="GET"&&u.pathname==="/social-api/posts")return json(res,200,db.posts);
  const imgUrlMatch=u.pathname.match(/^\/social-api\/posts\/([^/]+)\/image-url$/);
  if(req.method==="GET"&&imgUrlMatch){const p=db.posts.find(x=>x.id===imgUrlMatch[1]);if(!p)return json(res,404,{error:"Post não encontrado"});try{return json(res,200,{url:await mediaUrl(p)})}catch(e){return json(res,400,{error:e.message})}}
  const imgMatch=u.pathname.match(/^\/social-api\/posts\/([^/]+)\/image$/);
  if(req.method==="GET"&&imgMatch){const p=db.posts.find(x=>x.id===imgMatch[1]);if(!p)return json(res,404,{error:"Post não encontrado"});try{const loc=await mediaUrl(p);res.writeHead(302,{Location:loc,"Cache-Control":"no-store"});res.end();return}catch(e){return json(res,400,{error:e.message})}}
  if(req.method==="GET"&&u.pathname==="/social-api/settings")return json(res,200,db.settings);
  if(req.method==="GET"&&u.pathname==="/social-api/policies")return json(res,200,POSTING_POLICY);
  if(req.method==="PUT"&&u.pathname==="/social-api/settings"){const d=await body(req);const postsPerDay=Math.max(1,Math.min(12,Number(d.postsPerDay)||3));const incomingTimes=Array.isArray(d.postTimes)?d.postTimes.map(x=>String(x)).filter(x=>/^([01]\d|2[0-3]):([0-5]\d)$/.test(x)).slice(0,postsPerDay):[];db.settings={...db.settings,enabled:Boolean(d.enabled),postsPerDay,approvalMode:["manual","auto","hybrid"].includes(d.approvalMode)?d.approvalMode:"manual",scheduleMode:["interval","exact"].includes(d.scheduleMode)?d.scheduleMode:"interval",startHour:Math.max(0,Math.min(23,Number(d.startHour)||9)),endHour:Math.max(0,Math.min(23,Number(d.endHour)||19)),postTimes:incomingTimes};await saveDb(db);return json(res,200,db.settings)}
  if(req.method==="POST"&&u.pathname==="/social-api/agent/run"){const a=await ensureDailyContent(true),art=await prepareArtworkForQueue(),r=await publishDue();return json(res,200,{...a,art,published:r})}
  if(req.method==="POST"&&u.pathname==="/social-api/uploads"){try{return json(res,201,{imageKey:await uploadImage(await body(req))})}catch(e){return json(res,400,{error:e.message})}}
  if(req.method==="POST"&&u.pathname==="/social-api/posts"){const d=await body(req),pr=db.projects.find(x=>x.id===d.projectId);if(!pr)return json(res,400,{error:"Projeto inválido"});const p={id:id("post"),projectId:pr.id,projectName:pr.name,title:String(d.title||"Novo post"),caption:String(d.caption||""),imageKey:String(d.imageKey||""),imageUrl:String(d.imageUrl||SOCIAL_PUBLIC_BASE+"/brand.png"),scheduledAt:String(d.scheduledAt||""),status:"draft",createdAt:new Date().toISOString()};db.posts.unshift(p);await saveDb(db);return json(res,201,p)}
  const m=u.pathname.match(/^\/social-api\/posts\/([^/]+)\/(approve|reject|publish)$/);if(req.method==="POST"&&m){const p=db.posts.find(x=>x.id===m[1]);if(!p)return json(res,404,{error:"Post não encontrado"});if(m[2]==="approve"){p.status="approved";p.lastError=""}else if(m[2]==="reject")p.status="rejected";else{try{const r=await publish(p);p.status="published";p.metaMediaId=r.id;p.metaContainerId=r.containerId;p.publishedAt=new Date().toISOString();p.lastError=""}catch(e){p.status="error";p.lastError=e.message;await saveDb(db);return json(res,400,{error:e.message})}}await saveDb(db);return json(res,200,p)}
  return json(res,404,{error:"Rota social não encontrada"});
}

export async function handleSocialAgent(req,res){
  const u=new URL(req.url,"http://localhost");
  if(u.pathname.startsWith("/social-api/")){await api(req,res,u);return true}
  if(u.pathname==="/social-agent/logo.jpg"){res.writeHead(200,{"Content-Type":"image/jpeg","Cache-Control":"public, max-age=86400"});res.end(LOGO_JPG);return true}
  if(u.pathname==="/social-agent/brand.png"){res.writeHead(200,{"Content-Type":"image/png","Cache-Control":"public, max-age=86400"});res.end(brandPng());return true}
  if(u.pathname==="/social-agent"){res.writeHead(302,{Location:"/social-agent/"});res.end();return true}
  if(u.pathname.startsWith("/social-agent/")){const rel=u.pathname.slice("/social-agent/".length)||"index.html",safe=rel.replace(/\.\./g,""),file=path.join(PUBLIC,safe);if(!file.startsWith(PUBLIC)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){text(res,404,"Não encontrado");return true}text(res,200,fs.readFileSync(file),mime(file));return true}
  return false;
}