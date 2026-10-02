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
const VISUAL_ENGINE="rovix-v5-ai-original-scenes";
const MAX_FAST_IMAGES_PER_RUN=12;
const DIVERSITY_POLICY="unique-art-v1";
const HORDE_BASE="https://aihorde.net/api/v2";
const HORDE_KEY=process.env.SOCIAL_HORDE_API_KEY||"0000000000";
const MAX_IMAGE_JOBS=2;
const EMBLEM_PNG=fs.readFileSync(path.join(__dirname,"social-agent-assets","rovix-emblem.png"));
const DEFAULT_SETTINGS={enabled:true,postsPerDay:3,approvalMode:"manual",scheduleMode:"interval",startHour:9,endHour:19,postTimes:["09:00","14:00","19:00"],timezone:"America/Sao_Paulo"};
const POSTING_POLICY=Object.freeze({
  id:"rovix-cinematic-metallic-20261001",
  immutable:true,
  approvedReference:"/social-agent/reference-rovix-cinematic.jpg",
  approvedAt:"2026-10-01",
  referenceTitle:"Precisão que move o futuro",
  image:{
    minWidth:1080,
    minHeight:1080,
    preferredFormats:["1080x1080","1080x1350"],
    style:["3D cinematográfico","acabamento metálico premium","tecnologia aplicada","cenas com propósito","referência visual aprovada"],
    palette:["azul-escuro","vermelho","prata","grafite","preto"],
    requirements:[
      "Referência obrigatória: arte aprovada Precisão que move o futuro; preservar acabamento, iluminação, profundidade e impacto visual",
      "Metal escovado, titânio, prata e grafite com textura detalhada; azul profundo e ciano, com vermelho discreto na identidade ROVIX",
      "Iluminação cinematográfica, contraste controlado e profundidade; protagonista visual claro e composição publicitária marcante",
      "Representar a função real de cada produto em uma cena compreensível; máquinas, sensores e operações tecnicamente plausíveis",
      "Variar assunto, ação, cenário, enquadramento e composição; não transformar toda postagem no mesmo robô ou reutilizar esta imagem",
      "Proibidos cenários genéricos sem relação com o conteúdo, objetos aleatórios, imagens pobres e mecânica deformada",
      "Resolução e ausência de repetição não substituem avaliação da qualidade e da coerência visual",
      "logo ROVIX integrada sem distorcao",
      "composicao publicitaria profissional",
      "tipografia forte e legivel",
      "coerencia visual com o produto",
      "variacao suficiente para evitar repeticao",
      "bloquear fundo reutilizado mesmo com texto, cor ou corte diferentes",
      "comparar imagens com o historico antes de aprovar e publicar",
      "se a imagem for semelhante, gerar outra cena automaticamente com nova composicao",
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
    visualEngine:"ROVIX V5 Original AI Scenes (FREE)",
    defaultVisualLevel:"cinematografico"
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
  {id:"cipher",name:"CIPHER — Protocolo Orpheus",active:true,frequency:2,tone:"thriller, mistério e espionagem",cta:"Descubra CIPHER"},
  {"id": "rovix-social-agent", "name": "ROVIX Social Agent", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de ROVIX Social Agent", "description": "Agente de mídia da ROVIX para criação, aprovação, agendamento e publicação automática de conteúdo no Instagram.", "projectStatus": "PRODUÇÃO", "category": "ROVIX", "topics": ["Conteúdo com identidade ROVIX", "Aprovação antes de publicar", "Agendamento no Instagram", "Métricas da conta"]},
  {"id": "rovix-store", "name": "ROVIX Store", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de ROVIX Store", "description": "Catálogo e venda de produtos digitais, softwares e arquivos ROVIX.", "projectStatus": "PREVIEW", "category": "ROVIX", "topics": ["Produtos digitais ROVIX", "Conheça o catálogo", "Software e arquivos digitais"]},
  {"id": "rovix-store-admin", "name": "ROVIX Store Admin", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de ROVIX Store Admin", "description": "Área administrativa para cadastrar produtos, preços, versões e arquivos associados.", "projectStatus": "PREVIEW", "category": "ROVIX", "topics": ["Cadastro de produtos", "Organização de versões", "Arquivos associados aos produtos"]},
  {"id": "rovix-projects", "name": "ROVIX Projects", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de ROVIX Projects", "description": "Central pública para apresentar projetos, ferramentas, versões e downloads liberados.", "projectStatus": "PREVIEW", "category": "ROVIX", "topics": ["Conheça os projetos ROVIX", "Ferramentas em evolução", "Versões e downloads"]},
  {"id": "rovix-setup", "name": "ROVIX Setup / System Center", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de ROVIX Setup / System Center", "description": "Ferramenta Windows para instalação, configuração, diagnóstico e manutenção de computadores.", "projectStatus": "LOCAL", "category": "ROVIX", "topics": ["Diagnóstico de computadores", "Configuração do Windows", "Manutenção de computadores"]},
  {"id": "rovix-screensaver", "name": "ROVIX Screensaver / Cyber Command Center", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de ROVIX Screensaver / Cyber Command Center", "description": "Projeto visual e operacional ROVIX para Windows, incluindo screensaver e Cyber Command Center.", "projectStatus": "LOCAL", "category": "ROVIX", "topics": ["Identidade visual no desktop", "Cyber Command Center", "Experiência visual ROVIX"]},
  {"id": "rovix-osint", "name": "ROVIX OSINT", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de ROVIX OSINT", "description": "Plataforma ROVIX de inteligência e investigação OSINT.", "projectStatus": "LOCAL", "category": "ROVIX", "topics": ["Pesquisa em fontes abertas", "Organização de informações", "Inteligência e investigação"]},
  {"id": "rovix-guardian", "name": "ROVIX Guardian", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de ROVIX Guardian", "description": "Plataforma modular ROVIX baseada em Python para ferramentas, plugins e operações internas.", "projectStatus": "LOCAL", "category": "ROVIX", "topics": ["Ferramentas em módulos", "Plugins para operações", "Inteligência local"]},
  {"id": "rovix-vote", "name": "ROVIX Vote", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de ROVIX Vote", "description": "Sistema eletrônico de votação e treinamento eleitoral desenvolvido em Electron/React.", "projectStatus": "LOCAL", "category": "ROVIX", "topics": ["Treinamento eleitoral", "Experiência de votação", "Simulação de processos eleitorais"]},
  {"id": "rovix-market", "name": "ROVIX Market", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de ROVIX Market", "description": "Aplicação ROVIX desenvolvida em React, TypeScript, PWA e Capacitor.", "projectStatus": "LOCAL", "category": "ROVIX", "topics": ["Listas de compras", "Planejamento do orçamento", "Organização das compras"]},
  {"id": "rovix-ai-os", "name": "ROVIX AI OS", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de ROVIX AI OS", "description": "Plataforma experimental ROVIX de inteligência artificial baseada em Python/FastAPI.", "projectStatus": "DESENVOLVIMENTO", "category": "ROVIX", "topics": ["Inteligência artificial experimental", "Ferramentas de IA", "Evolução do laboratório ROVIX"]},
  {"id": "rovix-uap", "name": "ROVIX UAP", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de ROVIX UAP", "description": "Universal Automation Protocol — Protocolo de comunicação industrial desenvolvido pela ROVIX para integração entre equipamentos e redes industriais.", "projectStatus": "DESENVOLVIMENTO", "category": "AUTOMAÇÃO INDUSTRIAL", "topics": ["Protocolo de comunicação industrial", "Integração entre equipamentos", "Redes industriais"]},
  {"id": "balanca-urano", "name": "Balança Urano", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de Balança Urano", "description": "Projeto Arduino para integração e leitura de balança industrial Urano via comunicação serial.", "projectStatus": "DESENVOLVIMENTO", "category": "AUTOMAÇÃO INDUSTRIAL", "topics": ["Pesagem via comunicação serial", "Integração de balança com Arduino", "Leitura de peso"]},
  {"id": "tagcheck-campo", "name": "TAGCheck Campo", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de TAGCheck Campo", "description": "Aplicativo de campo do ecossistema TAGCheck para consulta e operação em dispositivos móveis.", "projectStatus": "PRODUÇÃO", "category": "TAGCHECK / GESTÃO INDUSTRIAL", "topics": ["Consulta em campo", "Informações no dispositivo móvel", "Equipamentos identificados"]},
  {"id": "tagcheck-v2", "name": "TAGCheck Fase 2", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de TAGCheck Fase 2", "description": "Nova arquitetura multiempresa do TAGCheck com usuários, empresas, unidades e controle de acesso.", "projectStatus": "DESENVOLVIMENTO", "category": "TAGCHECK / GESTÃO INDUSTRIAL", "topics": ["Gestão multiempresa", "Empresas e unidades", "Controle de acesso"]},
  {"id": "tagcheck-desktop", "name": "TAGCheck Desktop", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de TAGCheck Desktop", "description": "Cliente desktop do TAGCheck com suporte offline, sincronização e Viewer integrado.", "projectStatus": "DESENVOLVIMENTO", "category": "TAGCHECK / GESTÃO INDUSTRIAL", "topics": ["Consulta pelo desktop", "Suporte offline", "Sincronização de registros"]},
  {"id": "almox", "name": "ALMOX / ALMOX DVAPRO", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de ALMOX / ALMOX DVAPRO", "description": "Sistema de controle e gestão de almoxarifado desenvolvido em Python/FastAPI.", "projectStatus": "LOCAL", "category": "TAGCHECK / GESTÃO INDUSTRIAL", "topics": ["Entradas e saídas de materiais", "Visibilidade do estoque", "Gestão de almoxarifado"]},
  {"id": "amigopet", "name": "AmigoPet", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de AmigoPet", "description": "Plataforma para serviços e gestão de cuidados com animais.", "projectStatus": "PRODUÇÃO", "category": "APLICATIVOS", "topics": ["Cuidados com animais", "Conexão entre tutores e serviços", "Organização dos cuidados pet"]},
  {"id": "driverbel", "name": "Driverbel", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de Driverbel", "description": "Plataforma interna de transporte de funcionários inspirada em serviços de mobilidade.", "projectStatus": "LOCAL", "category": "APLICATIVOS", "topics": ["Transporte de funcionários", "Organização das solicitações", "Mobilidade interna"]},
  {"id": "presentecerto", "name": "PresenteCerto", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de PresenteCerto", "description": "Plataforma para criação e compartilhamento de listas e sugestões de presentes.", "projectStatus": "DESENVOLVIMENTO", "category": "APLICATIVOS", "topics": ["Listas de presentes", "Sugestões para presentear", "Compartilhamento de listas"]},
  {"id": "bola-de-gude", "name": "Bola de Gude", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de Bola de Gude", "description": "Jogo 3D para Android desenvolvido em Unity.", "projectStatus": "DESENVOLVIMENTO", "category": "APLICATIVOS", "topics": ["Bola de Gude em 3D", "Desenvolvimento de jogo Android", "Diversão e tecnologia"]},
  {"id": "meu-status", "name": "Meu Status", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de Meu Status", "description": "Aplicativo mobile desenvolvido em React, Vite e Capacitor.", "projectStatus": "DESENVOLVIMENTO", "category": "APLICATIVOS", "topics": ["Experiência mobile", "Desenvolvimento do Meu Status", "Aplicativos da ROVIX"]},
  {"id": "crismaj", "name": "CrisMaj / Mahjong Bíblico", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de CrisMaj / Mahjong Bíblico", "description": "Jogo inspirado em Mahjong com temática cristã e versão Android.", "projectStatus": "DESENVOLVIMENTO", "category": "APLICATIVOS", "topics": ["Mahjong com temática cristã", "Jogo para Android", "Conheça o CrisMaj"]},
  {"id": "orpheus", "name": "ORPHEUS", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de ORPHEUS", "description": "Aplicativo companion de CIPHER com terminal, enigmas, missões e conteúdo interativo.", "projectStatus": "DESENVOLVIMENTO", "category": "CIPHER", "topics": ["Terminal e enigmas", "Missões no universo CIPHER", "Experiência interativa de leitura"]},
  {"id": "cosmos", "name": "COSMOS", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de COSMOS", "description": "Projeto experimental desktop baseado em Electron e tecnologias web.", "projectStatus": "LOCAL", "category": "LABORATÓRIO", "topics": ["Inteligência artificial local", "Automações por áudio", "Experiência multitela"]},
  {"id": "matrix", "name": "MATRIX", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de MATRIX", "description": "Projeto experimental desenvolvido com protótipos HTML/JavaScript e Python.", "projectStatus": "DESENVOLVIMENTO", "category": "LABORATÓRIO", "topics": ["Protótipos do laboratório", "Experimentação de software", "Evolução do MATRIX"]},
  {"id": "rovix-os", "name": "ROVIX OS / OS Max", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de ROVIX OS / OS Max", "description": "Projeto de ambiente de inicialização e sistema personalizado com a identidade ROVIX.", "projectStatus": "DESENVOLVIMENTO", "category": "SISTEMAS", "topics": ["Sistema com identidade ROVIX", "Ambiente de inicialização", "Conheça o ROVIX OS"]},
  {"id": "rovix-machine-watch", "name": "ROVIX Machine Watch", "active": true, "frequency": 1, "tone": "claro, profissional e informativo", "cta": "Acompanhe as novidades de ROVIX Machine Watch", "description": "Ferramenta para monitoramento de processos, eventos USB e hardkey, arquivos e DLLs.", "projectStatus": "DESENVOLVIMENTO", "category": "DIAGNÓSTICO", "topics": ["Monitoramento de processos", "Eventos USB e hardkey", "Registros de arquivos e DLLs"]}
];

function s3(){if(!R2_ENDPOINT||!R2_ACCESS_KEY_ID||!R2_SECRET_ACCESS_KEY)throw new Error("R2_NOT_CONFIGURED");return new S3Client({region:"auto",endpoint:R2_ENDPOINT,credentials:{accessKeyId:R2_ACCESS_KEY_ID,secretAccessKey:R2_SECRET_ACCESS_KEY}})}
async function readStream(stream){return await stream.transformToString()}
export function rebuildCancelledPosts(db){
  if(db.meta.rebuildRepeatedArt20261001)return false;
  const replaced=[];
  for(const oldId of db.meta.cancelScheduledThrough20261005?.ids||[]){
    const old=db.posts.find(p=>p.id===oldId);
    if(!old||old.status!=="cancelled"||old.metaMediaId)continue;
    const replacementId="original-"+old.id;
    if(db.posts.some(p=>p.id===replacementId))continue;
    const p={...old,id:replacementId,replacesPostId:old.id,status:db.settings.approvalMode==="auto"?"approved":"draft",imageKey:"",imageUrl:"",artStatus:"pending",visualEngine:VISUAL_ENGINE,createdAt:new Date().toISOString(),lastError:""};
    for(const key of ["cancelledAt","cancelReason","visualFingerprint","visualSource","artGeneratedAt","artError","nextRetryAt","publishStartedAt","publishAttempts","metaContainerId"])delete p[key];
    // Future slots stay exactly as scheduled; past slots enter the normal queue.
    const seed=db.meta.preparedOriginalJobs?.[replacementId];if(seed)Object.assign(p,seed);
    db.posts.unshift(p);replaced.push({old:old.id,replacement:replacementId});
  }
  db.meta.rebuildRepeatedArt20261001={at:new Date().toISOString(),count:replaced.length,replacements:replaced};
  console.log("[Social Agent] Posts recriados com novas cenas:",replaced.length);
  return true;
}
async function saveDb(db){await s3().send(new PutObjectCommand({Bucket:R2_BUCKET,Key:DB_KEY,Body:JSON.stringify(db,null,2),ContentType:"application/json"}))}
async function loadDb(){
  let db,changed=false;
  try{const r=await s3().send(new GetObjectCommand({Bucket:R2_BUCKET,Key:DB_KEY}));db=JSON.parse(await readStream(r.Body))}
  catch(e){if(e?.name==="NoSuchKey"||e?.$metadata?.httpStatusCode===404){db={projects:[],posts:[]};changed=true}else throw e}
  db.projects=db.projects||[];db.posts=db.posts||[];db.settings={...DEFAULT_SETTINGS,...(db.settings||{})};db.meta=db.meta||{};
  if(!db.meta.apiBlockMigration20260929){db.meta.apiAccessBlocked={at:new Date().toISOString(),code:200};db.meta.apiBlockMigration20260929=true;changed=true}
  if(!db.meta.rateLimitRecovery20260928&&db.posts.some(p=>p.status==="error"&&/User is performing too many actions/i.test(p.lastError||""))){db.meta.publishCooldownUntil=new Date(Date.now()+60*60*1000).toISOString();db.meta.rateLimitRecovery20260928=true;changed=true}
  if(!db.meta.purgedUnpublished20260927){
    const before=db.posts.length;
    db.posts=db.posts.filter(p=>p.status==="published");
    db.meta.purgedUnpublished20260927={at:new Date().toISOString(),removed:before-db.posts.length};
    changed=true;
  }
  for(const p of BASE_PROJECTS){
    const existing=db.projects.find(x=>x.id===p.id);
    if(!existing){db.projects.push({...p});changed=true}
    else for(const key of ["description","projectStatus","category","topics"])if(p[key]!==undefined&&JSON.stringify(existing[key])!==JSON.stringify(p[key])){existing[key]=p[key];changed=true}
  }
  if(!db.meta.seededInstitutionalPost){
    db.posts.unshift({id:"seed-institucional-001",projectId:"rovix",projectName:"ROVIX Automation",title:"Tecnologia aplicada ao mundo real",caption:"A ROVIX une automação, software e inovação para transformar processos em soluções práticas.\n\nDo chão de fábrica ao ambiente digital, seguimos desenvolvendo ferramentas para organizar, conectar e automatizar operações.\n\nAcompanhe os próximos projetos e lançamentos da ROVIX.\n\n#ROVIX #AutomacaoIndustrial #Tecnologia #Industria40 #Software #Inovacao",imageUrl:SOCIAL_PUBLIC_BASE+"/brand.png",scheduledAt:"",status:"draft",createdAt:new Date().toISOString(),generatedBy:"agent"});
    db.meta.seededInstitutionalPost=true;
    changed=true;
  }
  if(rebuildCancelledPosts(db))changed=true;
  if(changed)await saveDb(db);return db;
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
async function metaFetch(route,{method="GET",params={}}={}){const c=metaCfg();if(!metaConfigured())throw new Error("Instagram não configurado no servidor");const u=new URL("https://"+c.host+"/"+encodeURIComponent(c.version)+"/"+String(route).replace(/^\//,""));const headers={Authorization:"Bearer "+c.token,"User-Agent":"ROVIX-Social-Agent/0.3"};const init={method,headers};if(method==="GET")Object.entries(params).forEach(([k,v])=>v!==""&&v!=null&&u.searchParams.set(k,String(v)));else{headers["Content-Type"]="application/x-www-form-urlencoded";init.body=new URLSearchParams(Object.entries(params).filter(([,v])=>v!==""&&v!=null)).toString()}const r=await fetch(u,init),raw=await r.text();let d;try{d=JSON.parse(raw)}catch{d={raw}};if(!r.ok||d.error){const e=new Error(d?.error?.message||("Erro HTTP "+r.status));e.metaCode=d?.error?.code;e.metaSubcode=d?.error?.error_subcode;e.httpStatus=r.status;e.retryAfter=r.headers.get("retry-after");throw e}return d}
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
async function mediaUrl(post){if(post.imageKey)return await getSignedUrl(s3(),new GetObjectCommand({Bucket:R2_BUCKET,Key:post.imageKey}),{expiresIn:900});if(/\/logo\.jpg(?:$|\?)/i.test(post.imageUrl||""))return SOCIAL_PUBLIC_BASE+"/brand.png";if(/^https:\/\//i.test(post.imageUrl||""))return post.imageUrl;return SOCIAL_PUBLIC_BASE+"/brand.png"}
async function waitContainer(id){for(let i=0;i<12;i++){const d=await metaFetch(id,{params:{fields:"status_code,status"}}),s=String(d.status_code||"").toUpperCase();if(!s||s==="FINISHED")return;if(s==="ERROR"||s==="EXPIRED")throw new Error(d.status||("Container "+s));await new Promise(r=>setTimeout(r,1800))}throw new Error("A mídia ainda não ficou pronta para publicação")}
export function visuallySimilar(a,b){
  if(a.sha===b.sha)return true;
  let bits=0;for(let i=0;i<a.dhash.length;i++){let n=parseInt(a.dhash[i],16)^parseInt(b.dhash[i],16);while(n){bits+=n&1;n>>=1}}
  const mae=a.tone.reduce((sum,n,i)=>sum+Math.abs(n-b.tone[i]),0)/a.tone.length;
  return (bits<=8&&mae<=24)||mae<=6;
}
async function imageFingerprint(buffer){
  const normalized=await sharp(buffer).rotate().resize(1080,1080,{fit:"cover"}).png().toBuffer();
  // Compare the illustration, excluding the title/footer and fixed logo.
  const scene=sharp(normalized).extract({left:0,top:0,width:820,height:700});
  const pixels=await scene.clone().resize(9,8,{fit:"fill"}).greyscale().raw().toBuffer();
  let hash=0n;for(let y=0;y<8;y++)for(let x=0;x<8;x++)hash=(hash<<1n)|BigInt(pixels[y*9+x]>pixels[y*9+x+1]);
  const tone=[...await scene.clone().resize(16,16,{fit:"fill"}).greyscale().raw().toBuffer()];
  return{sha:crypto.createHash("sha256").update(normalized).digest("hex"),dhash:hash.toString(16).padStart(16,"0"),tone};
}
async function artworkBytes(post){
  if(post.imageKey){const r=await s3().send(new GetObjectCommand({Bucket:R2_BUCKET,Key:post.imageKey}));return Buffer.from(await r.Body.transformToByteArray())}
  if(!post.imageUrl||/\/(brand\.png|logo\.jpg)(?:$|\?)/i.test(post.imageUrl))throw new Error("Uma arte original e obrigatoria; logo ou placeholder nao pode ser publicado.");
  const r=await fetch(post.imageUrl,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error("Nao foi possivel validar a imagem");
  return Buffer.from(await r.arrayBuffer());
}
async function assertUniqueArtwork(post,db){
  const fingerprint=post.visualFingerprint||await imageFingerprint(await artworkBytes(post));
  for(const other of db.posts){
    if(other.id===post.id||(!other.imageKey&&!other.imageUrl)||/\/(brand\.png|logo\.jpg)(?:$|\?)/i.test(other.imageUrl||""))continue;
    if(post.visualSource&&post.visualSource===other.visualSource)throw new Error("Imagem bloqueada: fundo ja utilizado em outra postagem.");
    // Keep published and previously generated artwork in the history, including cancelled posts.
    if(!other.imageKey&&other.status!=="published")continue;
    try{other.visualFingerprint=other.visualFingerprint||await imageFingerprint(await artworkBytes(other))}
    catch{throw new Error("Historico visual indisponivel; publicacao bloqueada ate validar as imagens anteriores.")}
    if(visuallySimilar(fingerprint,other.visualFingerprint))throw new Error("Imagem bloqueada: igual ou visualmente semelhante a outra postagem. Crie uma cena original.");
  }
  post.visualFingerprint=fingerprint;post.diversityPolicy=DIVERSITY_POLICY;
  return fingerprint;
}
async function publish(post){
  if(["cancelled","deleted","rejected"].includes(post.status))throw new Error("Postagem cancelada ou rejeitada");
  if(post.artStatus&&!["ready","uploaded"].includes(post.artStatus))throw new Error("Arte final ainda não está pronta");
  const db=await loadDb();await assertUniqueArtwork(post,db);await saveDb(db);
  const c=metaCfg(),url=await mediaUrl(post);const created=await metaFetch(c.ig+"/media",{method:"POST",params:{image_url:url,caption:post.caption||""}});if(!created.id)throw new Error("A Meta não retornou o ID do container");await waitContainer(created.id);const pub=await metaFetch(c.ig+"/media_publish",{method:"POST",params:{creation_id:created.id}});if(!pub.id)throw new Error("A Meta não retornou o ID da publicação");return{...pub,containerId:created.id}
}
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
function titleLines(value){
  const words=String(value||"ROVIX Automation").trim().split(/\s+/),lines=[""];
  for(const word of words){
    const index=lines.length-1;
    if((lines[index]+" "+word).trim().length>25&&lines[index]&&lines.length<2)lines.push(word);
    else lines[index]=(lines[index]+" "+word).trim();
  }
  if(lines[1]?.length>28)lines[1]=lines[1].slice(0,27).trimEnd()+"…";
  return lines;
}
export async function renderArtworkBuffer(post,project,bg){
  if(!bg)throw new Error("Uma cena original gerada para esta postagem e obrigatoria");
  const lines=titleLines(post.title||project.name);
  const titleSize=lines.some(x=>x.length>23)?53:60;
  const heading=lines.map((line,i)=>`<text x="82" y="${818+i*69}" font-family="Arial,Helvetica,sans-serif" font-size="${titleSize}" font-weight="800" fill="#ffffff">${escapeXml(line)}</text>`).join("");
  const subtitleY=lines.length===2?959:890;
  const overlay=Buffer.from(`<svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="53%" stop-color="#020714" stop-opacity="0"/><stop offset="77%" stop-color="#020714" stop-opacity=".65"/><stop offset="100%" stop-color="#020714" stop-opacity=".96"/></linearGradient></defs>
    <rect width="1080" height="1080" fill="url(#shade)"/>
    <rect x="80" y="736" width="94" height="8" rx="4" fill="#f3263c"/>
    ${heading}
    <text x="84" y="${subtitleY}" font-family="Arial,Helvetica,sans-serif" font-size="29" font-weight="700" fill="#c5daf0">${escapeXml(project.name.slice(0,40))}</text>
    <rect x="82" y="1010" width="916" height="2" fill="#5d7596" fill-opacity=".65"/>
    <text x="84" y="1045" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" letter-spacing="3" fill="#e1e7ef">ROVIX AUTOMATION</text>
  </svg>`);
  const badge=await sharp(EMBLEM_PNG).resize(196,196,{fit:"contain"}).png().toBuffer();
  return sharp(bg).resize(1080,1080).composite([{input:overlay,left:0,top:0},{input:badge,left:846,top:32}]).jpeg({quality:93,mozjpeg:true}).toBuffer();
}
const ORIGINAL_SUBJECTS=Object.freeze({
  rovix:["engineers connecting a conveyor control panel","precision robotic gripper assembling a metal gear","technician studying a factory digital twin","industrial sensor network around a working production line"],
  tagcheck:["technician scanning a QR tag on a pressure gauge with a tablet","calibration bench with precision instruments and digital checklist","field inspector checking a tagged industrial valve","organized instrument storage with visible equipment tags"],
  "tagcheck-campo":["field technician scanning equipment with a smartphone","mobile inspection beside industrial piping","maintenance worker consulting a tablet at a pump","portable measuring instruments on a service trolley"],
  "tagcheck-v2":["separate industrial plants connected to their own secure digital workspaces","factory manager comparing instrument records on a dashboard","distinct company workspaces represented by separate glass rooms","instrumentation team coordinating inspection across factory units"],
  "tagcheck-desktop":["laptop showing instrument records beside measuring tools","offline field workstation beside tagged equipment","desktop synchronization with a tablet of inspection records","calibration specialist consulting a desktop asset viewer"],
  "rovix-drive":["floating file folders moving into a luminous cloud vault","organized digital documents inside transparent storage shelves","laptop downloading a product archive from a cloud","secure file sharing between two distant workspaces"],
  "uap-studio":["technician diagnosing a programmable logic controller on a workbench","RS485 interface linking industrial controllers","CAN bus modules connected around a test bench","industrial ethernet network with cables and diagnostic instruments"],
  "rovix-uap":["distinct industrial controllers linked by protocol gateways","RS485 connector and CAN interface on a testing station","industrial network gateway connecting different machines","diagnostic laptop beside programmable controllers"],
  cipher:["middle-aged intelligence operative entering a rain-soaked train station","woman discovering a classified document in a home study","covert exchange of a sealed envelope in a crowded cafe","cybersecurity analyst tracing a conspiracy in a dim operations room"],
  orpheus:["classified puzzle dossier beside a vintage terminal","encrypted mission map on an investigator desk","locked evidence box with clues and a computer terminal","interactive espionage terminal revealing a hidden code"],
  "rovix-social-agent":["creative studio arranging different social media storyboards","analytics screens beside a campaign planner","content designer comparing original campaign illustrations","calendar showing distinct visual campaign cards"],
  "rovix-store":["digital product showcase with software packages on display plinths","customer browsing software products on a tablet","illuminated digital storefront with downloadable product boxes","organized software catalog on a desktop workspace"],
  "rovix-store-admin":["administrator organizing software versions on transparent shelves","digital catalog management desk with distinct product packages","software release packages sorted into numbered archive drawers","product manager arranging versioned software release cards"],
  "rovix-projects":["project exhibition with separate technological prototypes","engineering portfolio displayed as individual model stations","visitor exploring a digital project gallery","developer presenting different prototypes on workbenches"],
  "rovix-setup":["computer repair bench with diagnostic laptop and tools","technician installing software on a workstation","organized system recovery tools beside a desktop tower","technician checking computer components with a diagnostic screen"],
  "rovix-screensaver":["futuristic command center with panoramic monitors","ambient technological desktop display in a studio","digital command console illuminating an operator desk","geometric cyber landscape displayed on a desktop monitor"],
  "rovix-osint":["investigator connecting public information clues on a corkboard","open-source researcher reviewing maps and public documents","intelligence analyst arranging verified digital evidence","research desk with geographic maps and browser windows"],
  "rovix-guardian":["modular software tools represented as interlocking secure workspaces","developer assembling plugin modules on a desktop","organized diagnostic modules around a secure workstation","operator selecting distinct tools on a control dashboard"],
  "rovix-vote":["electronic voting training terminal in a civic classroom","citizen practicing a ballot on a simulated voting machine","training instructor beside an electronic ballot station","secure ballot simulation with accessible touchscreen"],
  "rovix-market":["family organizing grocery shopping beside a budget tablet","shopping basket and itemized budget on a kitchen table","person comparing a grocery list at a supermarket aisle","organized pantry and shopping list on a smartphone"],
  "rovix-ai-os":["experimental AI research workstation with abstract neural structures","developer testing an AI prototype in a laboratory","software experiment on a desk with translucent neural modules","research lab comparing AI tool prototypes"],
  "balanca-urano":["industrial weighing scale connected to an Arduino and LCD","serial adapter linking a precision scale to a test laptop","electronic weighing integration on an engineering bench","technician testing scale measurements with calibrated weights"],
  almox:["warehouse clerk scanning labeled storage bins","organized industrial parts on warehouse racks","warehouse inventory station beside material boxes","stockroom technician checking incoming materials with a tablet"],
  amigopet:["veterinarian caring for a dog beside a digital care planner","pet owner arranging a cat care schedule","dog and cat in a bright veterinary waiting room","pet service professional consulting appointment records"],
  driverbel:["employee shuttle stopping at a factory entrance","transport dispatcher coordinating a fleet on a map","workers boarding a commuter minibus","company transport requests on a tablet beside a shuttle"],
  presentecerto:["person arranging a gift wishlist beside colorful packages","family selecting gifts using a digital shared list","carefully wrapped presents and a gift planning tablet","friends comparing gift suggestions in a cozy room"],
  "bola-de-gude":["colorful glass marbles rolling through a miniature game arena","close-up glass marble on a playful three-dimensional track","mobile gaming scene with a spiral marble course","marbles competing on a sunlit sculpted playing board"],
  "meu-status":["smartphone displaying distinct illustrated status cards","mobile creator arranging a colorful visual update board","person sharing a mobile status update at a cafe","smartphone surrounded by different expressive social cards"],
  crismaj:["mahjong tile game with biblical olive branch and ark motifs","tabletop mahjong puzzle with a dove and illuminated manuscript","family-friendly biblical tile game beside an open book","colorful mahjong tiles with fish and olive branch symbols"],
  cosmos:["multiscreen workstation with voice automation microphone","operator coordinating distinct displays at a curved desk","experimental desktop assistant workspace with audio tools","creative control room with multiple screens and a microphone"],
  matrix:["software laboratory testing different prototype interfaces","developer assembling a digital prototype on a glass workbench","experimental software modules in a design studio","technology lab with different code prototypes on separate screens"],
  "rovix-os":["bootable USB drive beside a laptop starting a custom system","system recovery workstation with a boot menu monitor","portable operating system toolkit on a technician desk","computer startup environment with a branded USB device"],
  "rovix-machine-watch":["technician analyzing USB activity on a computer workbench","hardware key connected beside a process monitoring screen","software process inspection station with diagnostic equipment","computer forensic workstation tracking files and modules"]
});
export function buildOriginalScene(post,project,serial){
  const subjects=ORIGINAL_SUBJECTS[project.id]||["software engineer testing a prototype workstation","technician integrating electronic equipment","product developer presenting a practical software tool","engineering team comparing technical prototypes"];
  const cameras=["wide environmental view","close-up with shallow depth of field","high-angle view","isometric composition","low-angle cinematic view","over-the-shoulder view","three-quarter perspective","top-down tabletop view"];
  const lights=["cinematic cool key light with warm rim light","dramatic side lighting and subtle volumetric blue light","controlled high-contrast studio lighting","moody practical lights with crisp metal reflections","cinematic diffused skylight and rim lighting","dramatic backlight with clear readable subject"];
  const palettes=["deep navy, titanium silver and restrained cyan","graphite and brushed steel with subtle red accents","dark cobalt and chrome with cyan accents","charcoal and silver with restrained red accents","deep blue and brushed metal","navy, steel and subtle warm highlights"];
  const digest=crypto.createHash("sha256").update(post.id+":"+serial).digest();
  const subject=subjects[serial%subjects.length],camera=cameras[digest[0]%cameras.length],light=lights[digest[1]%lights.length],palette=palettes[digest[2]%palettes.length];
  const focus=35+digest[3]%70,seed=digest.readUInt32BE(4);
  const conceptKey=crypto.createHash("sha256").update(JSON.stringify({project:project.id,subject,camera,light,palette,focus})).digest("hex");
  const prompt=`Spectacular premium cinematic 3D advertising artwork for ROVIX Automation, extraordinary polished detail and visual storytelling, high-end animated film finish with physically grounded materials. Scene: ${subject}. This exact product function must be unmistakable: ${project.description||project.name}. Theme: ${post.title}. ${camera}, ${focus}mm lens perspective. ${light}. Carefully modeled brushed titanium, polished steel, graphite and glass where appropriate to the product; crisp material microtexture and sophisticated reflections. Palette: ${palette}. One strong meaningful hero subject doing a plausible useful action, mechanically coherent connections and proportions, believable working environment, cinematic depth and asymmetrical composition. Make this composition original; vary subject, action, setting and camera instead of repeating one robot. Square campaign composition, main subject in upper two thirds with room for caption at bottom. Preserve approved ROVIX cinematic metallic quality while representing THIS product, not an unrelated industrial robot for every product. No text, no typography, no logos; real branding is added separately. ### generic office, empty workstation, unrelated appliance, random props, meaningless holograms, flat lighting, poor composition, blurry, distorted machinery, low quality, letters, watermark, duplicated objects, malformed hands, generic humanoid robot, illegible interfaces`;
  return{subject,camera,light,palette,focus,seed,conceptKey,prompt,serial};
}
async function hordeFetch(route,options={}){
  const r=await fetch(HORDE_BASE+route,{...options,headers:{"Content-Type":"application/json","apikey":HORDE_KEY,"Client-Agent":"ROVIX-Social-Agent:0.8:contato.rovix@gmail.com",...(options.headers||{})},signal:AbortSignal.timeout(20000)});
  const d=await r.json();if(!r.ok){const e=new Error(d.message||"Gerador gratuito temporariamente indisponivel");e.httpStatus=r.status;throw e}return d;
}
async function chooseImageModel(){
  const preferred=["AlbedoBase XL 3.1","AlbedoBase XL (SDXL)","DreamShaper XL","Cheyenne"];
  try{const models=await hordeFetch("/status/models?type=image");const live=models.filter(m=>preferred.includes(m.name)&&m.count>0&&m.performance>0).sort((a,b)=>a.eta-b.eta);if(live.length)return live[0].name}catch{}
  return "AlbedoBase XL 3.1";
}
async function startOriginalArtwork(post,project,db){
  db.meta.sceneCursors=db.meta.sceneCursors||{};
  let serial=Number(db.meta.sceneCursors[project.id]||0),plan;
  do{plan=buildOriginalScene(post,project,serial++)}while(db.posts.some(p=>p.id!==post.id&&p.scenePlan?.conceptKey===plan.conceptKey));
  db.meta.sceneCursors[project.id]=serial;
  const model=await chooseImageModel();
  const job=await hordeFetch("/generate/async",{method:"POST",body:JSON.stringify({prompt:plan.prompt,params:{width:1024,height:1024,steps:20,cfg_scale:7,sampler_name:"k_euler",n:1,seed:String(plan.seed)},models:[model],nsfw:false,censor_nsfw:true,trusted_workers:true,r2:true,allow_downgrade:true})});
  if(!job.id)throw new Error("O gerador nao retornou um identificador");
  post.scenePlan=plan;post.artJobId=job.id;post.artJobStartedAt=new Date().toISOString();post.artStatus="generating";post.visualEngine=VISUAL_ENGINE;post.artAttempts=Number(post.artAttempts||0)+1;post.lastError="";delete post.artError;delete post.nextArtRetryAt;
  console.log("[Social Agent] Cena original na fila:",post.id,job.id,model);
}
async function finishOriginalArtwork(post,project,db){
  const state=await hordeFetch("/generate/check/"+post.artJobId);
  post.artQueuePosition=state.queue_position;post.artWaitSeconds=state.wait_time;
  if(!state.done&&Date.now()-Date.parse(post.artJobStartedAt)>2*60*60*1000){
    await hordeFetch("/generate/status/"+post.artJobId,{method:"DELETE"});
    throw new Error("O gerador perdeu a solicitacao; sera criada outra cena");
  }
  if(state.faulted)throw new Error("O gerador perdeu a solicitacao; sera criada outra cena");
  if(!state.done)return false;
  const result=await hordeFetch("/generate/status/"+post.artJobId),g=result.generations?.find(x=>!x.censored&&x.img);
  if(!g)throw new Error("Nenhuma imagem valida recebida; sera criada outra cena");
  let raw;
  if(/^https:\/\//.test(g.img)){const r=await fetch(g.img,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error("Falha ao baixar a nova cena");raw=Buffer.from(await r.arrayBuffer())}
  else raw=Buffer.from(g.img,"base64");
  const meta=await sharp(raw).metadata();if(!meta.width||!meta.height||meta.width<512||meta.height<512)throw new Error("Gerador retornou uma imagem sem resolucao suficiente");
  const final=await renderArtworkBuffer(post,project,raw),fingerprint=await imageFingerprint(final);
  const source="ai-horde://"+post.artJobId;
  await assertUniqueArtwork({...post,visualSource:source,visualFingerprint:fingerprint},db);
  const key="social-agent/v5/"+post.id+"-"+crypto.randomBytes(6).toString("hex")+".jpg";
  await s3().send(new PutObjectCommand({Bucket:R2_BUCKET,Key:key,Body:final,ContentType:"image/jpeg"}));
  Object.assign(post,{imageKey:key,imageUrl:"",artStatus:"ready",visualPolicy:POSTING_POLICY.id,visualEngine:VISUAL_ENGINE,visualSource:source,visualModel:g.model,visualSeed:g.seed,visualFingerprint:fingerprint,diversityPolicy:DIVERSITY_POLICY,artGeneratedAt:new Date().toISOString(),lastError:""});
  post.completedArtJobId=post.artJobId;delete post.artJobId;delete post.artError;delete post.nextArtRetryAt;
  console.log("[Social Agent] Nova arte validada:",post.id,g.model);
  return true;
}
async function prepareArtworkForQueue(){
  const db=await loadDb();let made=0,queued=0;
  const candidates=db.posts.filter(p=>p.generatedBy==="agent"&&p.artStatus!=="uploaded"&&["draft","approved","error"].includes(p.status)&&(p.artStatus!=="ready"||p.visualEngine!==VISUAL_ENGINE)).sort((a,b)=>Date.parse(a.scheduledAt||a.createdAt)-Date.parse(b.scheduledAt||b.createdAt));
  let changed=false;
  for(const p of candidates.filter(p=>p.artJobId&&(!p.nextArtRetryAt||Date.parse(p.nextArtRetryAt)<=Date.now())).slice(0,MAX_IMAGE_JOBS)){
    const project=db.projects.find(x=>x.id===p.projectId)||{id:"rovix",name:"ROVIX Automation"};
    try{if(await finishOriginalArtwork(p,project,db))made++;changed=true}
    catch(e){
      if(/igual|semelhante|ja utilizado/.test(e.message)){p.artStatus="pending";delete p.artJobId;p.artError="Imagem semelhante detectada. Criando outra cena automaticamente.";p.nextArtRetryAt=new Date(Date.now()+60000).toISOString();console.log("[Social Agent] Repeticao evitada; gerando outra cena:",p.id)}
      else if(e.httpStatus===404||/perdeu|Nenhuma imagem|resolucao/.test(e.message)){p.artStatus="pending";delete p.artJobId;p.artError=e.message;p.nextArtRetryAt=new Date(Date.now()+120000).toISOString()}
      else{p.artError=e.message;p.nextArtRetryAt=new Date(Date.now()+120000).toISOString()}
      changed=true;
    }
  }
  let inFlight=db.posts.filter(p=>p.artJobId&&["draft","approved","error"].includes(p.status)).length;
  for(const p of candidates.filter(p=>!p.artJobId&&(p.artStatus!=="ready"||p.visualEngine!==VISUAL_ENGINE)&&(!p.nextArtRetryAt||Date.parse(p.nextArtRetryAt)<=Date.now())).slice(0,MAX_FAST_IMAGES_PER_RUN)){
    if(inFlight>=MAX_IMAGE_JOBS)break;
    const project=db.projects.find(x=>x.id===p.projectId)||{id:"rovix",name:"ROVIX Automation"};
    try{await startOriginalArtwork(p,project,db);inFlight++;queued++;changed=true}
    catch(e){p.artStatus="pending";p.artError=e.message;p.nextArtRetryAt=new Date(Date.now()+5*60000).toISOString();changed=true;if(e.httpStatus===429)break}
  }
  if(changed)await saveDb(db);
  return{made,queued,generating:inFlight,engine:VISUAL_ENGINE,level:"original",cost:"free"};
}
function buildCaption(project,topic,i){
  if(project.description){
    const stage=project.projectStatus==="PRODUÇÃO"?"":project.projectStatus==="PREVIEW"?"\n\nProjeto em prévia: acompanhe a evolução.":"\n\nProjeto em evolução: acompanhe as novidades e a disponibilidade.";
    return topic+"\n\n"+project.description+stage+"\n\n"+project.cta+".\n\n#ROVIX #Tecnologia #Inovacao";
  }
  const variants=[
  topic+" não precisa ser complicado. A "+project.name+" foi pensada para transformar tarefas do dia a dia em um fluxo mais organizado, rastreável e eficiente.",
  "Quando tecnologia e operação trabalham juntas, o resultado aparece no processo. "+topic+" é um dos pontos em que a "+project.name+" busca reduzir retrabalho e dar mais visibilidade ao que acontece.",
  "Mais controle, menos improviso. "+topic+" faz parte da proposta da "+project.name+": aplicar tecnologia de forma prática onde ela realmente gera valor.",
  "A evolução industrial também passa por ferramentas simples de usar e fáceis de integrar. Hoje o destaque é: "+topic+"."
];return variants[i%variants.length]+"\n\n"+project.cta+".\n\n#ROVIX #Automacao #Tecnologia #Industria40 #Inovacao"}
async function ensureDailyContent(force=false,requestedDate=""){
  const db=await loadDb(),s=db.settings;
  if(!s.enabled&&!force)return{created:0,target:0,day:saoDate(),reason:"disabled"};
  const day=requestedDate||saoDate(),target=Math.max(1,Math.min(12,Number(s.postsPerDay)||3));
  const existing=db.posts.filter(p=>p.generatedDate===day&&p.generatedBy==="agent"&&!["cancelled","deleted","rejected"].includes(p.status)).length;
  if(existing>=target)return{created:0,target,day,existing,reason:"daily_target_already_met"};
  const startIndex=existing;
  let created=0;
  for(let i=startIndex;i<target;i++){
    const active=db.projects.filter(p=>p.active);if(!active.length)break;
    const p=active[(Number(db.meta.topicCursor||0)+i)%active.length],topics=p.topics||TOPICS[p.id]||TOPICS.rovix;
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
async function publishDue(){
  if(publishingBusy)return [];
  publishingBusy=true;
  try{return await publishDueLocked()}finally{publishingBusy=false}
}
let publishingBusy=false;
async function publishDueLocked(){
  const db=await loadDb();
  if(activeCooldown(db)||db.meta.apiAccessBlocked)return [];
  const lastPublished=Math.max(0,...db.posts.filter(p=>p.status==="published").map(p=>Date.parse(p.publishedAt)||0));
  if(Date.now()-lastPublished<60*60000)return [];
  const now=new Date(),due=db.posts.filter(p=>p.status==="approved"&&(["ready","uploaded"].includes(p.artStatus)||(!p.generatedBy&&p.imageKey))&&p.scheduledAt&&new Date(p.scheduledAt)<=now&&(!p.nextRetryAt||new Date(p.nextRetryAt)<=now)).sort((a,b)=>Date.parse(a.scheduledAt)-Date.parse(b.scheduledAt)).slice(0,1),results=[];
  if(due.length)console.log("[Social Agent] Publicações vencidas:",due.length,now.toISOString());
  for(const p of due){
    p.status="publishing";p.publishStartedAt=new Date().toISOString();
    await saveDb(db);
    try{
      const r=await publish(p);
      p.status="published";p.metaMediaId=r.id;p.metaContainerId=r.containerId;p.publishedAt=new Date().toISOString();p.lastError="";
      p.publishAttempts=Number(p.publishAttempts||0)+1;delete p.nextRetryAt;
      results.push({id:p.id,ok:true});console.log("[Social Agent] Publicado:",p.id,r.id);
    }catch(e){
      p.publishAttempts=Number(p.publishAttempts||0)+1;
      if(isMetaActionLimit(e)){
        db.meta.publishCooldownUntil=cooldownDate(e);
        p.status="error";p.lastError=cooldownMessage(db.meta.publishCooldownUntil);delete p.nextRetryAt;
        results.push({id:p.id,ok:false,error:p.lastError});
        console.error("[Social Agent] Conta Meta em pausa:",p.id,e.metaCode||"",e.message);
        break;
      }
      if(/API access blocked/i.test(e.message||"")){db.meta.apiAccessBlocked={at:new Date().toISOString(),code:e.metaCode||null};p.status="error";p.lastError="A Meta bloqueou o acesso à API. Publicações pausadas até um teste de conexão bem-sucedido.";delete p.nextRetryAt;results.push({id:p.id,ok:false,error:p.lastError});console.error("[Social Agent] API Meta bloqueada:",e.metaCode||"",e.message);break}
      p.lastError=e.message;
      const transient=/Media ID is not available|temporar|try again|timeout/i.test(e.message||"");
      if(transient&&p.publishAttempts<4){p.status="approved";p.nextRetryAt=new Date(Date.now()+Math.min(30,2**p.publishAttempts)*60*1000).toISOString()}
      else{p.status="error";delete p.nextRetryAt}
      results.push({id:p.id,ok:false,error:e.message,retry:!!p.nextRetryAt});
      console.error("[Social Agent] Falha ao publicar",p.id,e.message);
    }
  }
  if(due.length)await saveDb(db);
  return results;
}
let dbOperation=Promise.resolve();
function withSocialDbLock(fn){const task=dbOperation.then(fn,fn);dbOperation=task.catch(()=>{});return task}
let busy=false;async function automationTick(){if(busy)return;busy=true;try{await withSocialDbLock(async()=>{await ensureDailyContent(false);await prepareArtworkForQueue();await publishDue()})}catch(e){console.error("Social Agent:",e.message)}finally{busy=false}}
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
  if(req.method==="GET"&&u.pathname==="/social-api/status")return json(res,200,{app:"ROVIX Social Agent",version:"0.8.0",diversityPolicy:DIVERSITY_POLICY,cancellation:db.meta.cancelScheduledThrough20261005,online:true,metaConfigured:metaConfigured(),apiAccessBlocked:Boolean(db.meta.apiAccessBlocked),imageGenerationConfigured:true,visualEngine:VISUAL_ENGINE,visualCost:"free",visualStyle:"Cenas originais geradas por IA, sem biblioteca fixa",imageProvider:"AI Horde",imageQueue:db.posts.filter(p=>p.artJobId).length,replacements:db.meta.rebuildRepeatedArt20261001,storage:"R2",projects:db.projects.length,posts:db.posts.length,settings:db.settings,publishCooldownUntil:activeCooldown(db)});
  if(req.method==="GET"&&u.pathname==="/social-api/meta/test"){if(!metaConfigured())return json(res,200,{connected:false,error:"Credenciais Meta ainda não configuradas"});try{const result=await testMeta();if(db.meta.apiAccessBlocked){delete db.meta.apiAccessBlocked;await saveDb(db)}return json(res,200,result)}catch(e){console.error("[Social Agent] Teste Meta:",e.httpStatus||"",e.metaCode||"",e.metaSubcode||"",e.message);if(/API access blocked/i.test(e.message||"")&&!db.meta.apiAccessBlocked){db.meta.apiAccessBlocked={at:new Date().toISOString(),code:e.metaCode||null};await saveDb(db)}return json(res,200,{connected:false,error:e.message,httpStatus:e.httpStatus||null,metaCode:e.metaCode||null,metaSubcode:e.metaSubcode||null})}}
  if(req.method==="GET"&&u.pathname==="/social-api/meta/analytics"){const days=Number(u.searchParams.get("days")||7);if(![7,30].includes(days))return json(res,400,{error:"Período inválido"});return json(res,200,await accountAnalytics(days))}
  if(req.method==="GET"&&u.pathname==="/social-api/projects")return json(res,200,db.projects);
  if(req.method==="GET"&&u.pathname==="/social-api/posts")return json(res,200,db.posts.filter(p=>p.status!=="deleted"));
  const imgUrlMatch=u.pathname.match(/^\/social-api\/posts\/([^/]+)\/image-url$/);
  if(req.method==="GET"&&imgUrlMatch){const p=db.posts.find(x=>x.id===imgUrlMatch[1]);if(!p)return json(res,404,{error:"Post não encontrado"});if(p.generatedBy==="agent"&&!["ready","uploaded"].includes(p.artStatus))return json(res,409,{error:"Imagem original em geracao; a previa aparecera automaticamente"});try{return json(res,200,{url:await mediaUrl(p)})}catch(e){return json(res,400,{error:e.message})}}
  const imageDataMatch=u.pathname.match(/^\/social-api\/posts\/([^/]+)\/image-data$/);
  if(req.method==="GET"&&imageDataMatch){
    const p=db.posts.find(x=>x.id===imageDataMatch[1]);
    if(!p)return json(res,404,{error:"Post não encontrado"});
    if(p.generatedBy==="agent"&&!["ready","uploaded"].includes(p.artStatus))return json(res,409,{error:"Imagem original em geração",artStatus:p.artStatus||"pending",queuePosition:p.artQueuePosition||null});
    try{const bytes=await artworkBytes(p);res.writeHead(200,{"Content-Type":p.imageKey?.endsWith(".png")?"image/png":p.imageKey?.endsWith(".webp")?"image/webp":"image/jpeg","Content-Length":bytes.length,"Cache-Control":"private, no-store"});res.end(bytes);return}catch(e){return json(res,502,{error:"Não foi possível carregar a imagem. Tentaremos novamente automaticamente."})}
  }
  const imgMatch=u.pathname.match(/^\/social-api\/posts\/([^/]+)\/image$/);
  if(req.method==="GET"&&imgMatch){const p=db.posts.find(x=>x.id===imgMatch[1]);if(!p)return json(res,404,{error:"Post não encontrado"});if(p.generatedBy==="agent"&&!["ready","uploaded"].includes(p.artStatus))return json(res,409,{error:"Imagem original em geracao; a previa aparecera automaticamente"});try{const loc=await mediaUrl(p);res.writeHead(302,{Location:loc,"Cache-Control":"no-store"});res.end();return}catch(e){return json(res,400,{error:e.message})}}
  if(req.method==="GET"&&u.pathname==="/social-api/settings")return json(res,200,db.settings);
  if(req.method==="GET"&&u.pathname==="/social-api/policies")return json(res,200,POSTING_POLICY);
  if(req.method==="PUT"&&u.pathname==="/social-api/settings"){const d=await body(req);const postsPerDay=Math.max(1,Math.min(12,Number(d.postsPerDay)||3));const incomingTimes=Array.isArray(d.postTimes)?d.postTimes.map(x=>String(x)).filter(x=>/^([01]\d|2[0-3]):([0-5]\d)$/.test(x)).slice(0,postsPerDay):[];db.settings={...db.settings,enabled:Boolean(d.enabled),postsPerDay,approvalMode:["manual","auto","hybrid"].includes(d.approvalMode)?d.approvalMode:"manual",scheduleMode:["interval","exact"].includes(d.scheduleMode)?d.scheduleMode:"interval",startHour:Math.max(0,Math.min(23,Number(d.startHour)||9)),endHour:Math.max(0,Math.min(23,Number(d.endHour)||19)),postTimes:incomingTimes};await saveDb(db);return json(res,200,db.settings)}
  if(req.method==="POST"&&u.pathname==="/social-api/agent/run"){const d=await body(req),day=String(d.date||saoDate());if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day+"T00:00:00Z"))||new Date(day+"T00:00:00Z").toISOString().slice(0,10)!==day||day<saoDate())return json(res,400,{error:"Selecione uma data válida, a partir de hoje"});const a=await ensureDailyContent(true,day),art=await prepareArtworkForQueue();return json(res,200,{...a,art})}
  if(req.method==="POST"&&u.pathname==="/social-api/uploads"){try{return json(res,201,{imageKey:await uploadImage(await body(req))})}catch(e){return json(res,400,{error:e.message})}}
  if(req.method==="POST"&&u.pathname==="/social-api/posts"){const d=await body(req),pr=db.projects.find(x=>x.id===d.projectId);if(!pr)return json(res,400,{error:"Projeto inválido"});const p={id:id("post"),projectId:pr.id,projectName:pr.name,title:String(d.title||"Novo post"),caption:String(d.caption||""),imageKey:String(d.imageKey||""),imageUrl:String(d.imageUrl||SOCIAL_PUBLIC_BASE+"/brand.png"),scheduledAt:String(d.scheduledAt||""),status:"draft",createdAt:new Date().toISOString()};db.posts.unshift(p);await saveDb(db);return json(res,201,p)}
  const edit=u.pathname.match(/^\/social-api\/posts\/([^/]+)$/);
  if(edit&&(req.method==="PUT"||req.method==="DELETE")){
    const p=db.posts.find(x=>x.id===edit[1]&&x.status!=="deleted");if(!p)return json(res,404,{error:"Post não encontrado"});
    if(p.status==="publishing"||publishingBusy)return json(res,409,{error:"Aguarde a publicação em andamento"});
    if(req.method==="DELETE"){p.status="deleted";p.deletedAt=new Date().toISOString();await saveDb(db);return json(res,200,{ok:true,instagramUnchanged:Boolean(p.metaMediaId)})}
    if(["published","cancelled"].includes(p.status))return json(res,409,{error:"Uma postagem já publicada não pode ser editada por aqui"});
    const d=await body(req),pr=db.projects.find(x=>x.id===d.projectId);
    if(!pr)return json(res,400,{error:"Projeto inválido"});
    const title=String(d.title||"").trim(),caption=String(d.caption||"").trim();
    if(!title||!caption)return json(res,400,{error:"Informe título e legenda"});
    if(d.scheduledAt&&isNaN(new Date(d.scheduledAt).getTime()))return json(res,400,{error:"Data de agendamento inválida"});
    Object.assign(p,{projectId:pr.id,projectName:pr.name,title,caption,scheduledAt:String(d.scheduledAt||""),updatedAt:new Date().toISOString()});
    if(d.imageKey){p.imageKey=String(d.imageKey);p.imageUrl="";p.artStatus="uploaded";delete p.visualFingerprint;delete p.visualSource;delete p.diversityPolicy;p.status="draft"}
    else if(d.imageUrl){p.imageKey="";p.imageUrl=String(d.imageUrl);p.artStatus="uploaded";delete p.visualFingerprint;delete p.visualSource;delete p.diversityPolicy;p.status="draft"}
    await saveDb(db);return json(res,200,p);
  }
  const m=u.pathname.match(/^\/social-api\/posts\/([^/]+)\/(approve|reject|publish)$/);if(req.method==="POST"&&m){const p=db.posts.find(x=>x.id===m[1]);if(!p)return json(res,404,{error:"Post não encontrado"});if(["publishing","published","cancelled","deleted"].includes(p.status))return json(res,409,{error:"Postagem publicada, em andamento ou cancelada; nao pode ser reaprovada"});if(m[2]==="approve"){try{await assertUniqueArtwork(p,db)}catch(e){p.artError=e.message;p.lastError=e.message;await saveDb(db);return json(res,409,{error:e.message})}p.status="approved";p.lastError=""}else if(m[2]==="reject")p.status="rejected";else{if(db.meta.apiAccessBlocked)return json(res,429,{error:"Acesso à API da Meta bloqueado. Execute um teste de conexão depois que a Meta liberar o acesso."});if(publishingBusy)return json(res,409,{error:"Há outra publicação em andamento. Tente novamente em instantes"});const until=activeCooldown(db);if(until)return json(res,429,{error:cooldownMessage(until),retryAt:until});publishingBusy=true;try{p.status="publishing";p.publishStartedAt=new Date().toISOString();await saveDb(db);const r=await publish(p);p.status="published";p.metaMediaId=r.id;p.metaContainerId=r.containerId;p.publishedAt=new Date().toISOString();p.lastError="";delete p.nextRetryAt}catch(e){if(p.status==="publishing"){p.status="error";if(isMetaActionLimit(e)){db.meta.publishCooldownUntil=cooldownDate(e);p.lastError=cooldownMessage(db.meta.publishCooldownUntil)}else if(/API access blocked/i.test(e.message||"")){db.meta.apiAccessBlocked={at:new Date().toISOString(),code:e.metaCode||null};p.lastError="A Meta bloqueou o acesso à API. Publicações pausadas até um teste de conexão bem-sucedido."}else p.lastError=e.message;await saveDb(db)}return json(res,isMetaActionLimit(e)||db.meta.apiAccessBlocked?429:400,{error:p.lastError||e.message,retryAt:activeCooldown(db)})}finally{publishingBusy=false}}await saveDb(db);return json(res,200,p)}
  return json(res,404,{error:"Rota social não encontrada"});
}

export async function handleSocialAgent(req,res){
  const u=new URL(req.url,"http://localhost");
  if(u.pathname.startsWith("/social-api/")){if(u.pathname==="/social-api/auth/status")await api(req,res,u);else await withSocialDbLock(()=>api(req,res,u));return true}
  if(u.pathname==="/social-agent/emblem.png"){res.writeHead(200,{"Content-Type":"image/png","Cache-Control":"public, max-age=86400"});res.end(EMBLEM_PNG);return true}
  if(u.pathname==="/social-agent/brand.png"){res.writeHead(200,{"Content-Type":"image/png","Cache-Control":"public, max-age=86400"});res.end(brandPng());return true}
  if(u.pathname==="/social-agent"){res.writeHead(302,{Location:"/social-agent/"});res.end();return true}
  if(u.pathname.startsWith("/social-agent/")){const rel=u.pathname.slice("/social-agent/".length)||"index.html",safe=rel.replace(/\.\./g,""),file=path.join(PUBLIC,safe);if(!file.startsWith(PUBLIC)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){text(res,404,"Não encontrado");return true}text(res,200,fs.readFileSync(file),mime(file));return true}
  return false;
}
