import crypto from 'node:crypto';
import sharp from 'sharp';

export const ENGINE = 'orpheus-v3-original-scenes-free';
export const DIMENSIONS = ['character','setting','action','framing','composition'];
export const RECENT_WINDOW = 30;
const scenes = [
  ['blake','rainy-city','surveillance','wide','diagonal','VIGILÂNCIA','Uma presença na cidade','city'],
  ['evelyn','archive','investigation','overhead','radial','ARQUIVO RESTRITO','Uma pista entre documentos','archive'],
  ['none','server-room','signal-tracing','perspective','vanishing-point','SINAL ORPHEUS','Um sinal no escuro','servers'],
  ['gordon','station','clandestine-meeting','long-shot','horizontal','PONTO DE CONTATO','Um encontro sob vigilância','station'],
  ['none','desk','decoding','macro','scattered','CÓDIGO OCULTO','O detalhe que muda a leitura','documents'],
  ['blake','rooftop','observation','low-angle','silhouette-left','OPERAÇÃO NOTURNA','A cidade guarda segredos','roof'],
  ['lara','safe-house','reading-clue','medium','light-right','O PASSADO','O passado não cabe mais numa caixa','house'],
  ['none','control-room','monitoring','close-up','screen-grid','ACESSO ORPHEUS','Observe antes de responder','monitors'],
  ['evelyn','alley','pursuit','dynamic','off-center','RASTRO INVISÍVEL','Quem observa também deixa pistas','alley'],
  ['none','evidence-board','connecting-clues','frontal','network','CONEXÕES','Nenhuma informação aparece por acaso','board'],
  ['gordon','harbor','reconnaissance','establishing','horizon-low','ZONA DE SILÊNCIO','O silêncio também é uma pista','harbor'],
  ['none','locked-vault','discovery','detail','concentric','PASTA CLASSIFICADA','Alguns arquivos deveriam permanecer fechados','vault'],
];
const palettes=[['#081828','#2e718e','#edb86a'],['#191523','#70506a','#e68f67'],['#061e20','#3b8278','#a4cfbf'],['#171c30','#53618f','#e8a8a5']];
export function fingerprint(c){return DIMENSIONS.map(k=>c[k]).join('|');}
export function selectConcept(posts, seed=crypto.randomBytes(8).toString('hex')){
  const history=posts.filter(p=>p.visualConcept).slice(-RECENT_WINDOW).map(p=>p.visualConcept);
  const options=[];
  for(let i=0;i<scenes.length;i++)for(let variant=0;variant<8;variant++){
    const [character,setting,action,framing,composition,label,hook,scene]=scenes[i];
    const c={character,setting,action,framing:variant%2?framing+'-reverse':framing,composition:composition+'-'+variant,scene,label,hook,variant,palette:variant%4,seed};
    if(history.some(h=>fingerprint(h)===fingerprint(c)))continue;
    // Even a changed frame cannot disguise the same subject, location and action in adjacent posts.
    const triple=h=>['character','setting','action'].every(k=>h[k]===c[k]);
    if(history.slice(-5).some(triple))continue;
    let score=history.reduce((n,h,j)=>n+DIMENSIONS.reduce((s,k)=>s+(h[k]===c[k]?1:0),0)*(j+1),0);
    const lastScene=history.findLastIndex(h=>h.scene===c.scene);
    score+=lastScene<0?-1000000:100000*(lastScene+1);
    score+=parseInt(crypto.createHash('sha256').update(seed+fingerprint(c)).digest('hex').slice(0,6),16)/0xffffff;
    options.push({c,score});
  }
  options.sort((a,b)=>a.score-b.score);
  if(!options.length)throw new Error('Nenhum conceito diverso disponível; ampliar repertório antes de publicar');
  return {...options[0].c,fingerprint:fingerprint(options[0].c)};
}
const esc=s=>String(s).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
const rect=(x,y,w,h,fill,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const line=(x,y,a,b,color,width=3)=>`<path d="M${x} ${y} L${a} ${b}" stroke="${color}" stroke-width="${width}" fill="none"/>`;
function figure(x,y,scale,character){
  const hair=character==='lara'?'#725143':character==='evelyn'?'#262332':'#625b57';
  return `<g transform="translate(${x} ${y}) scale(${scale})"><ellipse cx="0" cy="242" rx="64" ry="15" fill="#000" opacity=".5"/><path d="M-35 80 L-54 190 L-22 191 L-17 242 L-1 242 L9 179 L23 242 L40 242 L33 160 L39 92 Z" fill="#111c29" stroke="#608191" stroke-width="2"/><path d="M-35 80 L-73 140 L-63 151 L-16 110 M35 86 L75 124 L68 139 L20 116" fill="#182738"/><ellipse cy="39" rx="27" ry="35" fill="#ad8974"/><path d="M-29 43 Q-39 -10 0 -2 Q40 -6 29 55 L19 20 L-14 15 Z" fill="${hair}"/><path d="M-22 70 L0 93 L23 70" fill="#bac2c9"/><path d="M0 93 L-10 122 L0 131 L10 118 Z" fill="#354a5b"/></g>`;
}
export function sceneSvg(c){
  const [bg,accent,light]=palettes[c.palette];let s='';
  const randomBytes=crypto.createHash('sha256').update(c.seed).digest();
  const offset=randomBytes[0]%70-35;
  const buildingSeed=randomBytes[1];
  const buildings=()=>Array.from({length:12},(_,i)=>{
    const x=i*95-20,h=130+(i*83+c.variant*37+buildingSeed)%310,y=640-h;
    return rect(x,y,80,h,'#0b1421')+Array.from({length:6},(_,j)=>rect(x+12+(j%3)*22,y+30+Math.floor(j/3)*48,8,18,accent,'opacity=".65"')).join('');
  }).join('');
  const paper=(x,y,a=0)=>`<g transform="translate(${x} ${y}) rotate(${a})">${rect(0,0,240,300,'#c7c0aa')}<text x="20" y="40" fill="#8e3036" font-size="17" font-family="sans-serif">CLASSIFICADO</text>${Array.from({length:8},(_,i)=>rect(20,65+i*22,100+(i*31)%90,6,'#545a5f')).join('')}${rect(18,238,170,20,'#202b38')}</g>`;
  switch(c.scene){
    case 'city':s=buildings()+`<path d="M0 700 L1080 650 L1080 820 L0 820 Z" fill="#243342"/>`+Array.from({length:18},(_,i)=>line(i*67,160,i*67-100,820,accent,1)).join('')+figure(710,405,1.45,c.character)+`<path d="M100 675 Q110 620 240 620 L330 675 L340 742 L70 742 Z" fill="#151b29" stroke="${accent}"/><circle cx="125" cy="738" r="28" fill="#060b12"/><circle cx="290" cy="738" r="28" fill="#060b12"/>`;break;
    case 'archive':s=Array.from({length:5},(_,i)=>rect(30+i*215,190,185,530,'#172c36')+Array.from({length:9},(_,j)=>rect(40+i*215,210+j*53,165,36,j%3===0?'#665b50':'#39484a')).join('')).join('')+paper(180,370,-17)+paper(500,410,12)+figure(855,430,1.2,c.character);break;
    case 'servers':s=Array.from({length:6},(_,i)=>`<g transform="translate(${40+i*180} ${200+Math.abs(i-2)*30})">${rect(0,0,145,520,'#101c27',`stroke="${accent}"`)}${Array.from({length:10},(_,j)=>rect(12,18+j*48,120,30,'#1d313b')+rect(110,28+j*48,7,7,light)).join('')}</g>`).join('')+line(0,815,540,680,accent,3)+line(1080,815,540,680,accent,3);break;
    case 'station':s=Array.from({length:7},(_,i)=>line(i*170,190,i*170,690,accent,12)).join('')+rect(0,260,1080,52,'#334750')+rect(90,400,920,220,'#263946')+Array.from({length:7},(_,i)=>rect(115+i*128,427,95,90,'#92a9ae')).join('')+figure(750,490,1.1,c.character)+line(0,800,1080,730,light,5);break;
    case 'documents':s=rect(0,180,1080,640,'#403d3c')+paper(80,300,-12)+paper(400,215,15)+`<circle cx="810" cy="520" r="120" fill="#112732" stroke="${light}" stroke-width="15"/><circle cx="810" cy="520" r="92" fill="${accent}" opacity=".7"/>`+line(886,610,1015,770,light,24)+rect(70,725,350,30,'#171d25')+rect(715,248,185,60,'#171d25');break;
    case 'roof':s=buildings()+`<circle cx="790" cy="270" r="80" fill="${light}" opacity=".65"/>`+rect(0,680,1080,145,'#0b1119')+line(0,650,1080,650,accent,12)+figure(300,400,1.4,c.character)+line(600,480,600,655,light,5)+line(540,490,660,490,light,4);break;
    case 'house':s=rect(70,200,550,430,'#29404a',`stroke="${light}" stroke-width="10"`)+line(345,200,345,630,light,10)+line(70,420,620,420,light,10)+rect(650,270,360,280,'#423c41')+figure(730,435,1.3,c.character)+paper(360,530,-9)+`<path d="M210 340 L130 470 L290 470 Z" fill="${light}"/>`+line(210,470,210,670,light,7);break;
    case 'monitors':s=Array.from({length:6},(_,i)=>`<g transform="translate(${60+i%3*335} ${220+Math.floor(i/3)*250})">${rect(0,0,300,210,'#101923',`stroke="${accent}" stroke-width="8"`)}${rect(15,15,270,178,'#193f49')}<path d="M25 100 L65 90 L85 135 L120 45 L160 100 L245 60" stroke="${light}" stroke-width="3" fill="none"/><text x="25" y="175" fill="${light}" font-size="19" font-family="monospace">ORPHEUS // 0${i+1}</text></g>`).join('');break;
    case 'alley':s=`<path d="M0 190 L430 430 L430 820 L0 820 Z" fill="#203442"/><path d="M1080 190 L620 430 L620 820 L1080 820 Z" fill="#28303f"/><path d="M430 430 L620 430 L800 820 L270 820 Z" fill="#43505a"/>`+Array.from({length:7},(_,i)=>line(0,250+i*78,430,440+i*40,accent,3)).join('')+figure(510,440,1.3,c.character)+figure(670,440,.6,'blake');break;
    case 'board':s=rect(60,200,960,580,'#544a40',`stroke="${accent}" stroke-width="15"`)+Array.from({length:8},(_,i)=>{const x=110+i%4*230,y=250+Math.floor(i/4)*280;return line(x+75,y+70,500,500,'#c9494f',4)+rect(x,y,150,200,'#b3b4ac')+rect(x+20,y+20,110,80,'#2f4752')+Array.from({length:3},(_,j)=>rect(x+16,y+120+j*18,117,5,'#5c6261')).join('');}).join('');break;
    case 'harbor':s=buildings()+rect(0,640,1080,180,'#254752')+`<path d="M80 510 L710 510 L640 640 L155 640 Z" fill="#101f2d"/>`+rect(270,350,220,160,'#344652')+line(570,220,570,510,light,7)+line(570,225,850,430,light,5)+figure(875,450,1.3,c.character);break;
    case 'vault':s=rect(90,180,900,630,'#36404a',`stroke="${accent}" stroke-width="18"`)+`<circle cx="720" cy="480" r="205" fill="#1b2835" stroke="${light}" stroke-width="12"/><circle cx="720" cy="480" r="115" fill="#303c48" stroke="${accent}" stroke-width="16"/>`+Array.from({length:6},(_,i)=>line(720,480,720+170*Math.cos(i*Math.PI/3),480+170*Math.sin(i*Math.PI/3),light,12)).join('')+paper(150,400,-10);break;
  }
  const flip=c.variant%2?`translate(1080 0) scale(-1 1)`:'';
  const zoom=c.variant>=4?`translate(-54 -35) scale(1.1)`:`translate(${c.variant*3} 0)`;
  const flipped=flip+' '+zoom+` translate(${offset} 0)`;
  // Each publication gets independently placed ambient light, texture and clues, not a recycled bitmap.
  s+=Array.from({length:18},(_,i)=>{const x=(randomBytes[i%32]*13+i*37)%1080,y=210+(randomBytes[(i+7)%32]*7)%560;return `<circle cx="${x}" cy="${y}" r="${1+randomBytes[(i+9)%32]%3}" fill="${light}" opacity=".18"/>`;}).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080"><defs><radialGradient id="glow"><stop stop-color="${accent}"/><stop offset="1" stop-color="${bg}"/></radialGradient><linearGradient id="shade" x2="0" y2="1"><stop stop-color="${bg}" stop-opacity="0"/><stop offset="1" stop-color="${bg}"/></linearGradient></defs>${rect(0,0,1080,1080,'url(#glow)')}<g transform="${flipped}">${s}</g>${rect(0,720,1080,360,'url(#shade)')}<text x="64" y="105" font-family="sans-serif" font-size="24" letter-spacing="6" fill="${light}">CIPHER / VISÃO DO UNIVERSO</text><text x="64" y="915" font-family="sans-serif" font-size="48" font-weight="bold" fill="#fff">${esc(c.label)}</text><text x="64" y="964" font-family="sans-serif" font-size="25" fill="${light}">${esc(c.hook)}</text><text x="64" y="1030" font-family="sans-serif" font-size="20" letter-spacing="4" fill="#fff">PROTOCOLO ORPHEUS • ROBERTO JUSTINO</text></svg>`;
}
export async function renderScene(c){return sharp(Buffer.from(sceneSvg(c))).jpeg({quality:94,mozjpeg:true}).toBuffer();}
export function repairQueue(db,{today,now=new Date(),schedule,makeId}){
  if(db.meta.visualDiversityRepair20261001)return {changed:false};
  delete db.meta.pauseGenerationUntil;
  db.settings.enabled=true;
  const repaired=[];
  for(const p of db.posts){
    const day=p.generatedDate||String(p.scheduledAt||'').slice(0,10);
    if(day<today||day>'2026-10-05'||!['cipher','orpheus'].includes(p.projectId)||['published','publishing','rejected'].includes(p.status))continue;
    if(p.status==='deleted'&&!/cancelad[oa]|Fila antiga removida/i.test(p.lastError||''))continue;
    p.replacedArtwork={imageKey:p.imageKey||'',visualEngine:p.visualEngine||'',at:now.toISOString()};
    p.status=p.status==='approved'?'approved':db.settings.approvalMode==='auto'?'approved':'draft';
    p.artStatus='placeholder';p.visualEngine='';delete p.visualConcept;delete p.deletedAt;
    delete p.nextRetryAt;p.lastError='';p.generatedDate=day;repaired.push(p.id);
  }
  const target=Math.max(1,Math.min(12,Number(db.settings.postsPerDay)||3));
  for(let day=today;day<='2026-10-05';day=new Date(Date.parse(day+'T12:00:00Z')+86400000).toISOString().slice(0,10)){
    const valid=db.posts.filter(p=>p.generatedDate===day&&p.generatedBy==='agent'&&!['deleted','rejected'].includes(p.status));
    for(let i=valid.length;i<target;i++){
      const project=db.projects.find(p=>p.active&&p.id===(i%2?'orpheus':'cipher'))||db.projects.find(p=>p.active&&['cipher','orpheus'].includes(p.id));
      if(!project)continue;
      let scheduledAt=schedule(day,i,target,db.settings);
      if(new Date(scheduledAt)<=now)scheduledAt=new Date(now.getTime()+(i+1)*3600000).toISOString();
      const p={id:makeId('repair'),projectId:project.id,projectName:project.name,title:'Universo CIPHER',caption:'',scheduledAt,status:db.settings.approvalMode==='auto'||db.settings.approvalMode==='hybrid'&&i===0?'approved':'draft',createdAt:now.toISOString(),generatedBy:'agent',generatedDate:day,artStatus:'placeholder'};
      db.posts.push(p);repaired.push(p.id);
    }
  }
  db.meta.visualDiversityRepair20261001={at:now.toISOString(),through:'2026-10-05',repaired,complete:false};
  return {changed:true,repaired};
}
