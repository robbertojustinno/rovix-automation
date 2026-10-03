import crypto from 'node:crypto';
export const STRATEGY_POLICY=Object.freeze({id:'orpheus-strategy-v1',immutable:true,rule:'Cada publicação precisa de objetivo, hipótese e utilidade para o público.',windowDays:30,formats:['Imagem com legenda','Roteiro de Reel'],metrics:['views','reach','likes','comments','saved','shares','profile_visits','follows','retention'],sources:['Postagens_pre_aprovadas'],canonRule:'Textos promocionais; nenhuma citação ou acontecimento do livro é inventado. Personagens e trechos exigem fonte conferida.'});
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const subjects=[
 {id:'arquivos',theme:'Arquivos e segredos',topic:'O que você procura em um dossiê?',audience:'Leitores de mistério e espionagem',pain:'Desejo de descobrir pistas sem receber spoilers',facts:['Um nome, uma data, uma informação ausente: qual detalhe chama sua atenção?','Imagine um arquivo classificado. Por onde você começaria a investigação?','Use a imagem como inspiração e deixe sua hipótese nos comentários.'],solution:'Entre no clima de CIPHER — Protocolo Orpheus, de Roberto Justino.',projectId:'cipher'},
 {id:'vigilancia',theme:'Vigilância e suspense',topic:'Quem observa também deixa pistas?',audience:'Leitores de suspense tecnológico',pain:'Curiosidade sobre informação, vigilância e confiança',facts:['Em uma história de espionagem, confiar pode ser uma decisão difícil.','O que cria mais tensão para você: uma ameaça visível ou uma dúvida?','Conte qual detalhe de uma cena faz você desconfiar.'],solution:'Conheça a proposta de espionagem e suspense de CIPHER.',projectId:'cipher'},
 {id:'enigmas',theme:'Enigmas e hipóteses',topic:'Qual seria sua primeira hipótese?',audience:'Leitores que gostam de investigar e resolver enigmas',pain:'Vontade de participar da descoberta',facts:['Observe a imagem antes de escolher uma interpretação.','Que pergunta você faria para investigar melhor?','Deixe uma hipótese e explique qual detalhe chamou sua atenção.'],solution:'Explore o universo CIPHER e a experiência companion ORPHEUS.',projectId:'orpheus'},
 {id:'leitura',theme:'Experiência de leitura',topic:'O que prende você em um thriller?',audience:'Pessoas procurando sua próxima leitura',pain:'Escolher uma história que combine com seu gosto',facts:['Mistério, espionagem e suspense tecnológico: qual desses temas atrai você?','Você prefere formular teorias durante a leitura ou descobrir junto com a narrativa?','Compartilhe o que faz você querer virar a próxima página.'],solution:'Descubra CIPHER — Protocolo Orpheus, de Roberto Justino.',projectId:'cipher'},
 {id:'universo',theme:'Universo ORPHEUS',topic:'A investigação continua além da leitura',audience:'Leitores interessados em experiências interativas',pain:'Desejo de explorar mais o universo da obra',facts:['ORPHEUS é a experiência companion do universo CIPHER.','Terminal, enigmas, missões e dossiês fazem parte da proposta.','Que tipo de experiência você gostaria de explorar primeiro?'],solution:'Conheça a experiência ORPHEUS pelo perfil oficial.',projectId:'orpheus'}
];
export function subjectFor(file,seed=0){return subjects[Math.abs(seed)%subjects.length];}
const angles=['Pergunta ao leitor','Convite à investigação','Detalhe e interpretação','Descoberta do universo','Preferência de leitura','Atmosfera de suspense','Conversa com leitores'];
const thematicHooks={
 arquivos:['O que um arquivo deixa de contar?','Um nome. Uma data. Muitas perguntas.','Qual detalhe você investigaria primeiro?','Todo segredo precisa de um guardião?','O silêncio de um documento intriga você?','O que torna uma pista convincente?','Imagine abrir um arquivo classificado.'],
 vigilancia:['Quem observa também pode ser observado.','Você confiaria nessa informação?','Quando a dúvida vira suspense?','O perigo precisa ser visível?','Uma sombra basta para levantar suspeitas?','Quem merece sua confiança?','Que detalhe faria você desconfiar?'],
 enigmas:['Toda hipótese começa com uma pista.','Qual seria sua primeira pergunta?','Observe. Questione. Formule sua hipótese.','Duas pessoas podem ver pistas diferentes.','O que você percebeu primeiro?','Uma interpretação pode abrir outro caminho.','Você gosta de investigar enquanto lê?'],
 leitura:['Qual mistério seria sua próxima leitura?','O que faz você virar a página?','Espionagem ou suspense tecnológico?','Você lê para descobrir ou para teorizar?','Uma boa pergunta pode prender sua atenção.','Que tipo de thriller combina com você?','Sua próxima leitura começa com curiosidade.'],
 universo:['A curiosidade continua além das páginas.','Você exploraria um terminal de investigação?','Livro e experiência: por onde começar?','Dossiês, enigmas ou missões?','Que parte do universo você exploraria?','ORPHEUS: um convite à investigação.','Sua hipótese pode continuar fora do livro.']
};
const hooks=s=>thematicHooks[s.id];
const scenes=['Preservar a imagem aprovada'];
function recent(posts){const since=Date.now()-STRATEGY_POLICY.windowDays*86400000;return posts.filter(p=>Date.parse(p.createdAt||p.publishedAt)>since&&p.strategy);}
export function assertCreativeUnique(candidate,posts){
 const others=recent(posts).filter(p=>p.id!==candidate.id);
 if(others.some(p=>p.strategy.signature===candidate.strategy.signature||norm(p.caption)===norm(candidate.caption)))throw new Error('Conceito repetido nos últimos 30 dias. Regenerar antes de aprovar.');
}
export function composeStrategy(file,posts=[],seed=0){
 const s=subjectFor(file,seed),allHooks=hooks(s),history=recent(posts);
 const learning=learnFromPosts(posts).find(x=>x.subject===s.id&&x.status==='observação');
 const best=learning?.comparisons.find(c=>c.variants.length>=2&&c.variants.every(v=>v.count>=2))?.variants[0];
 for(let offset=0;offset<35;offset++){
  const n=seed+offset,preferred=best&&seed%3===0&&offset===0?angles.indexOf(best.variant):-1,index=preferred>=0?preferred:n%angles.length,angle=angles[index],hook=allHooks[index],cta=['Salve para lembrar da sua próxima leitura.','Compartilhe com quem gosta de mistério e espionagem.','Conte sua hipótese nos comentários.','Conheça CIPHER pelo link na bio do perfil oficial.','Qual pergunta você faria primeiro?'][n%5];
  const primaryMetric=['saved','shares','comments','profile_visits','comments'][n%5],objective={saved:'Gerar salvamentos',shares:'Estimular compartilhamentos',comments:'Estimular conversa',profile_visits:'Incentivar descoberta pelo perfil'}[primaryMetric];
  const signature=hash([s.id,angle,hook,cta,file.id].join('|'));
  if(history.some(p=>p.strategy.signature===signature))continue;
  const strategy={version:1,subject:s.id,theme:s.theme,topic:s.topic,audience:s.audience,objective,pain:s.pain,angle,format:'Imagem com legenda',hook,hooks:allHooks,cta,primaryMetric,hypothesis:'O gancho e o convite desta proposta podem '+objective.toLowerCase()+' entre '+s.audience.toLowerCase()+'. Avaliar '+primaryMetric+' em relação ao alcance.',visual:{source:'Imagem pré-aprovada',fileId:file.id,fileName:file.name,scene:scenes[0],composition:'Imagem completa acima da faixa editorial; conferir coerência na prévia',style:'CIPHER / ORPHEUS cinematográfico',classification:'Revisão humana: nomes de arquivo não identificam personagens',sourceKey:file.object_key},signature,experiment:{variable:'tipo de gancho',variant:angle,group:s.id},learningUsed:learning?.summary||null};
  const numbered=s.facts.map((f,i)=>(i+1)+'. '+f).join('\n');
  strategy.reel=[{time:'0–2 s',text:hook},{time:'2–6 s',text:s.pain},{time:'6–12 s',text:s.facts[0]},{time:'12–18 s',text:s.facts[1]},{time:'18–23 s',text:s.solution},{time:'23–27 s',text:cta}];
  const caption=hook+'\n\n'+numbered+'\n\n'+s.solution+'\n\n'+cta+'\n\n#CIPHER #ProtocoloOrpheus #Espionagem #Suspense #RobertoJustino';
  const candidate={title:s.topic,caption,strategy,projectId:s.projectId};
  try{assertCreativeUnique(candidate,posts);return candidate}catch{}
 }
 throw new Error('As propostas disponíveis para essa imagem se repetem. Selecione outra imagem ou edite a proposta.');
}
export function createWeeklyPlan(files,posts,startDate,count=3){
 const eligible=files.filter(f=>/^image\/(png|jpeg|webp)$/.test(f.mime_type||'')&&f.object_key);if(!eligible.length)throw new Error('Inclua imagens na pasta autorizada antes de gerar o plano.');
 const active=new Set(posts.filter(p=>!['deleted','rejected','published'].includes(p.status)).map(p=>p.sourceImageKey));
 const usable=eligible.filter(f=>!active.has(f.object_key));if(!usable.length)throw new Error('Todas as imagens estão reservadas em postagens pendentes.');
 const ranked=usable.map(file=>({file,uses:posts.filter(p=>p.sourceImageKey===file.object_key||p.strategy?.visual.fileId===file.id).length}));
 const entries=[],virtual=[...posts];
 for(let day=0;day<7;day++)for(let slot=0;slot<count;slot++){
  const date=new Date(startDate+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+day);
  const ordered=[...ranked].sort((a,b)=>a.uses-b.uses||a.file.name.localeCompare(b.file.name));
  let content,file;for(let attempt=0;attempt<ordered.length;attempt++){file=ordered[attempt].file;try{content=composeStrategy(file,virtual,day*count+slot);ordered[attempt].uses++;break}catch{}}
  if(!content)throw new Error('Sem propostas suficientemente diferentes para completar a semana. Adicione outras imagens.');
  const entry={id:crypto.randomUUID(),date:date.toISOString().slice(0,10),slot,sourceFileId:file.id,...content};entries.push(entry);virtual.push({...entry,createdAt:new Date().toISOString()});
 }
 return{id:crypto.randomUUID(),createdAt:new Date().toISOString(),startDate,entries};
}
export function learnFromPosts(posts){
 const groups=new Map();for(const p of posts){if(p.status!=='published'||!p.strategy||!p.performance)continue;const m=p.strategy.primaryMetric,raw=p.performance.metrics?.[m],reach=p.performance.metrics?.reach;if(!Number.isFinite(raw)||!Number.isFinite(reach)||reach<=0)continue;const k=p.strategy.subject;const rows=groups.get(k)||[];rows.push({variant:p.strategy.experiment?.variant||p.strategy.angle,metric:m,value:raw/reach,postId:p.id});groups.set(k,rows);}
 return [...groups].map(([subject,rows])=>{const metrics=[...new Set(rows.map(r=>r.metric))];const comparisons=metrics.map(metric=>{const subset=rows.filter(r=>r.metric===metric),variants=[...new Set(subset.map(r=>r.variant))];return{metric,variants:variants.map(variant=>{const r=subset.filter(x=>x.variant===variant);return{variant,count:r.length,rate:r.reduce((a,b)=>a+b.value,0)/r.length};}).sort((a,b)=>b.rate-a.rate)};});const comparable=comparisons.find(c=>c.variants.length>=2&&c.variants.every(v=>v.count>=2));return{subject,samples:rows.length,status:comparable?'observação':'dados insuficientes',comparisons,summary:comparable?'Maior taxa observada de '+comparable.metric+': '+comparable.variants[0].variant+'. Comparação exploratória; não comprova causalidade.':'Aguardando ao menos duas publicações por variante com a mesma métrica e alcance.'};});
}
export function validateMetrics(input){const result={};for(const k of STRATEGY_POLICY.metrics){if(input[k]===null||input[k]===undefined||input[k]===''){result[k]=null;continue}const n=Number(input[k]);if(!Number.isFinite(n)||n<0||(k==='retention'&&n>100))throw new Error('Métrica inválida: '+k);result[k]=n;}return result;}

