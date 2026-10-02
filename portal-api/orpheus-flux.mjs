import crypto from 'node:crypto';
import sharp from 'sharp';
export const PROVIDER='huggingface-space/black-forest-labs/FLUX.1-schnell';
const BASE='https://black-forest-labs-flux-1-schnell.hf.space';
export const DIMENSIONS=['character','setting','action','framing','composition'];
const settings=['rain-soaked railway concourse','abandoned intelligence archive','underground parking garage','harbor customs warehouse','hotel corridor','nighttime communications room','airport observation gallery','maintenance workshop','empty embassy waiting room','secure document vault','foggy pedestrian bridge','rooftop service entrance'];
const actions=['inspection of a concealed transmitter','tracing an intercepted signal','examination of a redacted document','surveillance of an empty entrance','search for a hidden compartment','analysis of an encrypted storage device','inspection of a tampered lock','recording of a distant security camera feed'];
const frames=['extreme macro oblique detail','high angle wide shot','low angle medium shot','overhead close shot','long lens through a window','eye-level deep focus wide shot'];
const compositions=['foreground object with distant vanishing point','strong diagonal with negative space on left','layered depth with subject in right third','central focal point surrounded by shadow','frame within a doorway','reflection in glass with asymmetrical balance'];
const props=['brass key','sealed envelope','reel tape recorder','mechanical watch','encrypted USB device','folded street map','analog radio','microfilm cartridge','leather briefcase','precision tweezers','unmarked access card','redacted dossier'];
const pick=a=>a[crypto.randomInt(a.length)];
export function selectScene(history=[],post={}){
  if(/\b(blake|lara|evelyn|gordon)\b/i.test(post.title||''))throw new Error('CHARACTER_REFERENCE_REQUIRED: este gerador não aceita referências de identidade; envie uma arte canônica nova para este personagem.');
  const recent=history.slice(-60),last=recent.at(-1);
  for(let i=0;i<1000;i++){
    const character=last?.character==='none'?'anonymous distant operative, face not visible':'none';
    const c={character,setting:pick(settings),action:pick(actions),framing:pick(frames),composition:pick(compositions),prop:pick(props),lighting:pick(['warm practical desk lamp with deep shadow','cold moonlight and subtle amber practical light','soft dawn through rain-streaked glass','single overhead fluorescent practical light']),seed:crypto.randomInt(2147483647),nonce:crypto.randomUUID()};
    const triple=h=>['character','setting','action'].every(k=>h[k]===c[k]);
    if(recent.some(h=>triple(h)||DIMENSIONS.filter(k=>h[k]===c[k]).length>=4)||recent.slice(-6).some(h=>h.setting===c.setting&&h.action===c.action))continue;
    c.fingerprint=DIMENSIONS.map(k=>c[k]).join('|');return c;
  }
  throw new Error('DIVERSITY_EXHAUSTED: ampliar repertório antes de gerar; nenhuma rotação de catálogo será usada.');
}
export function promptFor(c){return `Premium cinematic espionage thriller promotional photograph inspired by the atmosphere of CIPHER — Protocolo Orpheus. This is an evocative promotional concept, not a depiction of a claimed canonical event. Location: ${c.setting}. Subject: ${c.character==='none'?'no people':c.character}. Visual action conveyed by objects: ${c.action}. Distinctive prop: ${c.prop}. Camera: ${c.framing}. Composition: ${c.composition}. Lighting: ${c.lighting}. Photorealism, physically convincing materials, textured surfaces, dramatic practical lighting, rich shadow detail, selective focus, polished premium photographic finish, narrative intrigue. Leave unobtrusive negative space at bottom for publication typography. No letters, no captions, no watermark, no logos, no illustration, no collage, no vector shapes. Never invent identities or plot events.`;}
const headers=()=>({...process.env.HF_TOKEN?{Authorization:`Bearer ${process.env.HF_TOKEN}`}:{}});
async function response(url,options={},fetcher=fetch){const r=await fetcher(url,{...options,signal:AbortSignal.timeout(180000)});if(!r.ok)throw new Error(`HF_HTTP_${r.status}: ${String(await r.text()).slice(0,300)}`);return r;}
export async function generate(c,fetcher=fetch){
  const started=Date.now();
  const schema=await (await response(BASE+'/gradio_api/info',{headers:headers()},fetcher)).json();
  const params=schema.named_endpoints?.['/infer']?.parameters?.map(p=>p.parameter_name);
  if(JSON.stringify(params)!==JSON.stringify(['prompt','seed','randomize_seed','width','height','num_inference_steps']))throw new Error('HF_SCHEMA_CHANGED');
  const call=await (await response(BASE+'/gradio_api/call/infer',{method:'POST',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify({data:[promptFor(c),c.seed,false,1088,1360,4]})},fetcher)).json();
  if(!/^[a-f0-9]{32}$/.test(call.event_id||''))throw new Error('HF_INVALID_EVENT');
  const r=await response(BASE+'/gradio_api/call/infer/'+call.event_id,{headers:headers()},fetcher),reader=r.body.getReader();let buffer='',size=0,url;
  const deadline=setTimeout(()=>reader.cancel(),180000);
  try{outer:while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1000000)throw new Error('HF_SSE_TOO_LARGE');buffer+=Buffer.from(value).toString('utf8').replace(/\r/g,'');let end;while((end=buffer.indexOf('\n\n'))!==-1){const event=buffer.slice(0,end).replace(/\r/g,'');buffer=buffer.slice(end+2);const kind=event.match(/^event: (.+)$/m)?.[1],data=event.split('\n').filter(l=>l.startsWith('data: ')).map(l=>l.slice(6)).join('\n');if(kind==='error')throw new Error('HF_GENERATION_ERROR: '+data.slice(0,300));if(kind==='complete'){url=JSON.parse(data)?.[0]?.url;break outer;}}}}finally{clearTimeout(deadline);await reader.cancel().catch(()=>{});}
  const parsed=new URL(url||BASE);if(parsed.origin!==BASE||!parsed.pathname.startsWith('/gradio_api/file='))throw new Error('HF_INVALID_IMAGE_URL');
  const img=await response(parsed.href,{headers:headers(),redirect:'error'},fetcher);
  const chunks=[];let bytes=0;for await(const chunk of img.body){bytes+=chunk.length;if(bytes>16000000)throw new Error('HF_IMAGE_TOO_LARGE');chunks.push(chunk);}
  const raw=Buffer.concat(chunks),meta=await sharp(raw).metadata();if(meta.width<1080||meta.height<1350)throw new Error('HF_IMAGE_TOO_SMALL');
  const output=await sharp(raw).resize(1088,1360).composite([{input:{text:{text:'<span foreground="white">CIPHER — PROTOCOLO ORPHEUS\nRoberto Justino</span>',font:'sans 32',width:920,align:'center',rgba:true}},top:1220,left:84}]).jpeg({quality:94}).toBuffer();
  const pixels=await sharp(raw).resize(16,16,{fit:'fill'}).greyscale().raw().toBuffer();
  return {buffer:output,hash:crypto.createHash('sha256').update(raw).digest('hex'),perceptual:pixels.toString('base64'),elapsedMs:Date.now()-started,width:1088,height:1360};
}
export function duplicateImage(result,history){return history.some(h=>{if(h.hash===result.hash)return true;if(!h.perceptual)return false;const a=Buffer.from(h.perceptual,'base64'),b=Buffer.from(result.perceptual,'base64');return a.length===b.length&&a.reduce((n,v,i)=>n+Math.abs(v-b[i]),0)/a.length<6;});}
export function publishable(p){return p.artStatus==='ready'&&Boolean(p.imageKey||(/^https:\/\//.test(p.imageUrl||'')&&!/\/(brand\.png|logo\.jpg)/.test(p.imageUrl)))&&Boolean(p.artValidation?.approvedAt);}
