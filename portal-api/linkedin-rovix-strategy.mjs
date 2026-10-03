import crypto from 'node:crypto';
export const STRATEGY_POLICY=Object.freeze({id:'rovix-strategy-v1',immutable:true,rule:'Cada publicação precisa de objetivo, hipótese e utilidade para o público.',windowDays:30,formats:['Imagem com legenda','Roteiro de Reel'],metrics:['views','reach','likes','comments','saved','shares','profile_visits','follows','retention'],sources:['Imagens pré-aprovadas','Composições com imagens existentes','Novas artes quando houver gerador disponível']});
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const subjects=[
 {id:'metrologia',match:/calibr|manomet|microm|medidor|medicao|instrumento|inspecao|termica/,theme:'Instrumentação e metrologia',topic:'Resolução e adequação do instrumento',audience:'Instrumentistas e equipes de qualidade',pain:'Confundir graduação da escala com adequação à medição',facts:['Identifique a menor divisão da escala ou incremento indicado.','Confira a faixa e o erro máximo admissível para a aplicação.','Consulte os resultados da calibração antes de decidir a adequação.'],solution:'Organize identificação, critérios e registros de cada instrumento.',projectId:'tagcheck'},
 {id:'redes',match:/plc|clp|rs485|modbus|can|switch|fibra|conexao|integracao/,theme:'Automação industrial',topic:'Diagnóstico de comunicação industrial',audience:'Técnicos de manutenção e integradores',pain:'Equipamento acessível na rede sem comunicação da aplicação',facts:['Ping testa conectividade IP, mas não confirma o serviço Modbus.','Confira o endereço IP, a porta configurada e o caminho de rede.','Verifique função, endereço de registro e identificação do dispositivo na aplicação.'],solution:'Registre as configurações e isole uma variável por vez no diagnóstico.',projectId:'uap-studio'},
 {id:'robotica',match:/robo|robot|garra|paletizador|soldagem|cnc/,theme:'Tecnologia e inovação',topic:'Repetibilidade na automação',audience:'Engenheiros e responsáveis pela produção',pain:'Automatizar sem definir critérios do processo',facts:['Defina tarefa, tolerâncias e condições do processo.','Avalie ferramenta, fixação e repetibilidade requerida.','Inclua avaliação de riscos e validação da aplicação.'],solution:'Comece pelos requisitos do processo antes de escolher a tecnologia.',projectId:'rovix'},
 {id:'seguranca',match:/cibern|cofre|nuvem|segur|dados/,theme:'Cibersegurança e software',topic:'Acesso e organização de arquivos',audience:'Equipes que compartilham arquivos e projetos',pain:'Perder controle de versões e acessos',facts:['Defina quem precisa acessar cada arquivo.','Identifique a versão e organize o histórico.','Mantenha cópias de segurança e verifique a recuperação.'],solution:'Trate organização e acesso como parte do trabalho diário.',projectId:'rovix-drive'},
 {id:'supervisao',match:/scada|supervis|painel/,theme:'Software e supervisão',topic:'Dados úteis para a operação',audience:'Operadores e equipes de manutenção',pain:'Ter dados sem contexto para agir',facts:['Identifique origem, unidade e faixa de cada variável.','Verifique se os dados estão atualizados.','Defina quais desvios precisam de ação e registre o contexto.'],solution:'Apresente informações que ajudem a equipe a decidir.',projectId:'rovix'},
 {id:'processos',match:/.*/,theme:'Institucional ROVIX',topic:'Engenharia aplicada ao processo',audience:'Profissionais de automação e tecnologia',pain:'Escolher ferramentas sem entender a necessidade',facts:['Mapeie a tarefa e os pontos de retrabalho.','Defina um critério para avaliar a melhoria.','Documente o teste antes de ampliar a solução.'],solution:'Transforme uma necessidade real em um teste de engenharia.',projectId:'rovix'}
];
export function subjectFor(file){return subjects.find(s=>s.match.test(norm(file.name)));}
const angles=['Problema técnico','Curiosidade','Checklist','Produto e aplicação','Antes e depois do processo','Bastidores de engenharia','História e propósito'];
const hooks=(s)=>['O que conferir antes de avançar em '+s.topic.toLowerCase()+'?','Um detalhe que muda a análise: '+s.topic+'.','Salve estas 3 verificações: '+s.topic+'.','Como organizar '+s.topic.toLowerCase()+' no dia a dia?','Do improviso ao procedimento: '+s.topic+'.','Por trás de uma boa decisão: '+s.topic+'.','Por que começamos pelo processo em '+s.topic.toLowerCase()+'?'];
const scenes=['Plano aberto do ambiente','Detalhe do equipamento','Equipamento e contexto','Operação em primeiro plano','Visão lateral da aplicação','Perspectiva de engenharia','Cena geral com identidade ROVIX'];
function recent(posts){const since=Date.now()-STRATEGY_POLICY.windowDays*86400000;return posts.filter(p=>Date.parse(p.createdAt||p.publishedAt)>since&&p.strategy);}
export function assertCreativeUnique(candidate,posts){
 const others=recent(posts).filter(p=>p.id!==candidate.id);
 if(others.some(p=>p.strategy.signature===candidate.strategy.signature||norm(p.caption)===norm(candidate.caption)))throw new Error('Conceito repetido nos últimos 30 dias. Regenerar antes de aprovar.');
}
export function composeStrategy(file,posts=[],seed=0){
 const s=subjectFor(file),allHooks=hooks(s),history=recent(posts);
 const learning=learnFromPosts(posts).find(x=>x.subject===s.id&&x.status==='observação');
 const best=learning?.comparisons.find(c=>c.variants.length>=2&&c.variants.every(v=>v.count>=2))?.variants[0];
 for(let offset=0;offset<35;offset++){
  const n=seed+offset,preferred=best&&seed%3===0&&offset===0?angles.indexOf(best.variant):-1,index=preferred>=0?preferred:n%angles.length,angle=angles[index],hook=allHooks[index],cta=['Salve este checklist para consultar depois.','Compartilhe com a equipe que trabalha com esse processo.','Qual dessas verificações faz parte da sua rotina?','Conheça os projetos: https://rovixautomation.com.br','Conte qual etapa merece mais atenção na sua operação.'][Math.floor(n/7)%5];
  const signature=hash([s.id,angle,hook,cta,file.id].join('|'));
  if(history.some(p=>p.strategy.signature===signature))continue;
  const strategy={version:1,subject:s.id,theme:s.theme,topic:s.topic,audience:s.audience,objective:n%3===0?'Gerar salvamentos':n%3===1?'Estimular compartilhamentos':'Estimular conversa',pain:s.pain,angle,format:'Imagem com legenda',hook,hooks:allHooks,cta,primaryMetric:n%3===0?'saved':n%3===1?'shares':'comments',hypothesis:'Conteúdo útil sobre '+s.topic.toLowerCase()+' pode estimular '+(n%3===0?'salvamentos':n%3===1?'compartilhamentos':'comentários')+' entre '+s.audience.toLowerCase()+'.',visual:{source:'Imagem pré-aprovada',fileId:file.id,fileName:file.name,scene:scenes[n%7],composition:'Preservar o assunto da imagem; título curto sem cobrir o equipamento',style:'ROVIX cinematográfico metálico'},signature,experiment:{variable:'tipo de gancho',variant:angle,group:s.id},learningUsed:learning?.summary||null};
  const numbered=s.facts.map((f,i)=>(i+1)+'. '+f).join('\n');
  strategy.reel=[{time:'0–2 s',text:hook},{time:'2–6 s',text:s.pain},{time:'6–12 s',text:s.facts[0]},{time:'12–18 s',text:s.facts[1]},{time:'18–23 s',text:s.solution},{time:'23–27 s',text:cta}];
  const caption=hook+'\n\n'+numbered+'\n\n'+s.solution+'\n\n'+cta+'\n\n#ROVIX #AutomacaoIndustrial #Tecnologia';
  const candidate={title:s.topic,caption,strategy,projectId:s.projectId};
  try{assertCreativeUnique(candidate,posts);return candidate}catch{}
 }
 throw new Error('As propostas disponíveis para essa imagem se repetem. Selecione outra imagem ou edite a proposta.');
}
export function createWeeklyPlan(files,posts,startDate,count=3){
 const eligible=files.filter(f=>/^image\/(png|jpeg|webp)$/.test(f.mime_type||'')&&f.object_key);if(!eligible.length)throw new Error('Inclua imagens na pasta autorizada antes de gerar o plano.');
 const ranked=eligible.map(file=>({file,uses:posts.filter(p=>p.driveFileId===file.id).length}));
 const entries=[],virtual=[...posts];
 for(let day=0;day<7;day++)for(let slot=0;slot<count;slot++){
  const date=new Date(startDate+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+day);
  const ordered=[...ranked].sort((a,b)=>a.uses-b.uses||entries.filter(e=>e.strategy.subject===subjectFor(a.file).id).length-entries.filter(e=>e.strategy.subject===subjectFor(b.file).id).length||a.file.name.localeCompare(b.file.name));
  let content,file;for(let attempt=0;attempt<ordered.length;attempt++){file=ordered[attempt].file;try{content=composeStrategy(file,virtual,day+slot*7);ordered[attempt].uses++;break}catch{}}
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
