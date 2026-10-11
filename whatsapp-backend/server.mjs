import http from 'node:http';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {defaults,validate,respond} from './engine.mjs';

const equal=(a,b)=>{const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&timingSafeEqual(x,y);};
export function validSignature(raw,signature,secret){return !!secret&&equal(signature,'sha256='+createHmac('sha256',secret).update(raw).digest('hex'));}
export function createApp(env=process.env,graphFetch=fetch){
 const states=new Map(),seen=new Map(); let chain=Promise.resolve();
 const config=env.BOT_CONFIG_JSON?validate(JSON.parse(env.BOT_CONFIG_JSON)):defaults;
 const ready=()=>env.BOT_ENABLED==='true'&&!!env.WHATSAPP_ACCESS_TOKEN&&!!env.WHATSAPP_PHONE_NUMBER_ID&&!!env.META_APP_SECRET&&!!env.BOT_CONFIG_JSON;
 function clean(){const cutoff=Date.now()-86400000;for(const [id,v] of seen)if(v<cutoff)seen.delete(id);for(const [id,v] of states)if(v.at<cutoff)states.delete(id);}
 async function processPayload(payload){
  clean();if(!ready()||!config.enabled)return;
  for(const entry of payload.entry||[])for(const change of entry.changes||[]){
   if(change.field!=='messages')continue;
   const value=change.value||{};
   if(value.metadata?.phone_number_id!==env.WHATSAPP_PHONE_NUMBER_ID)continue;
   for(const m of value.messages||[]){
    if(m.type!=='text'||!m.text?.body||!m.id||!/^\d{5,20}$/.test(m.from||''))continue;
    if(!Number.isFinite(Number(m.timestamp))||Date.now()/1000-Number(m.timestamp)>86400)continue;
    if(seen.has(m.id))continue;
    const state=states.get(m.from)?.state||{};
    if(state.paused)continue;
    const result=respond(config,m.text.body,state);
    const body=result.reply+(result.url?'\n'+result.url:'');
    if(!body)continue;
    const version=env.META_API_VERSION||'v26.0';
    if(!/^v\d+\.\d+$/.test(version)||!/^\d+$/.test(env.WHATSAPP_PHONE_NUMBER_ID))throw Error('invalid_configuration');
    const r=await graphFetch(`https://graph.facebook.com/${version}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,{method:'POST',headers:{Authorization:`Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',recipient_type:'individual',to:m.from,type:'text',text:{body:body.slice(0,4096)}}),signal:AbortSignal.timeout(10000)});
    if(!r.ok){let code='unknown';try{code=(await r.json()).error?.code||code;}catch{};console.error('Meta send failed',r.status,code);throw Error('meta_send_failed');}
    seen.set(m.id,Date.now());states.set(m.from,{state:result.state,at:Date.now()});
   }
  }
 }
 return http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  const reply=(status,data,type='application/json')=>{res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'});res.end(type==='application/json'?JSON.stringify(data):data);};
  try{
   if(req.method==='GET'&&url.pathname==='/health')return reply(200,{ok:true,service:'ROVIX Bot',whatsapp:ready()?'configured_not_validated':'pending_configuration'});
   if(req.method==='GET'&&url.pathname==='/')return reply(200,'<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ROVIX Bot</title><body style="font:18px system-ui;max-width:700px;margin:60px auto;padding:20px"><h1>ROVIX Bot</h1><p>Servidor de integração online.</p><p>WhatsApp: '+(ready()?'credenciais configuradas; teste real pendente.':'configuração pendente.')+'</p><p>O painel de regras continua no <a href="https://rovix-bot.norcrj.chatgpt.site">ROVIX Bot</a>.</p></body></html>','text/html;charset=utf-8');
   if(req.method==='GET'&&url.pathname==='/webhook'){
    if(!env.WHATSAPP_VERIFY_TOKEN)return reply(503,{error:'verification_not_configured'});
    if(url.searchParams.get('hub.mode')!=='subscribe'||!equal(url.searchParams.get('hub.verify_token'),env.WHATSAPP_VERIFY_TOKEN))return reply(403,{error:'verification_failed'});
    return reply(200,url.searchParams.get('hub.challenge')||'','text/plain');
   }
   if(req.method==='POST'&&url.pathname==='/webhook'){
    if(!env.META_APP_SECRET)return reply(503,{error:'signature_secret_not_configured'});
    const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>1000000)return reply(413,{error:'payload_too_large'});chunks.push(chunk);}
    const raw=Buffer.concat(chunks);
    if(!validSignature(raw,req.headers['x-hub-signature-256'],env.META_APP_SECRET))return reply(403,{error:'invalid_signature'});
    let payload;try{payload=JSON.parse(raw);}catch{return reply(400,{error:'invalid_json'});}
    if(payload.object!=='whatsapp_business_account'||!Array.isArray(payload.entry))return reply(400,{error:'invalid_payload'});
    // Process before acknowledgement so a failed send is eligible for Meta retry.
    const task=chain.then(()=>processPayload(payload));chain=task.catch(()=>{});await task;
    return reply(200,{received:true,automation:ready()?'configured':'paused'});
   }
   if(url.pathname==='/oauth/meta/callback')return reply(503,{error:'oauth_not_configured',message:'O Cadastro Incorporado ainda precisa de implementação e armazenamento seguro das credenciais. Não inicie a autorização por esta rota.'});
   return reply(404,{error:'not_found'});
  }catch{return reply(502,{error:'processing_failed'});}
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const app=createApp();app.listen(Number(process.env.PORT||10000),'0.0.0.0',()=>console.log('ROVIX WhatsApp backend online'));}
