(function(root){
'use strict';
const normalize=v=>String(v||'').trim().toUpperCase();
const code=(v,label)=>{const s=normalize(v);if(!/^[A-Z0-9_-]{1,20}$/.test(s))throw Error(label+': use até 20 letras sem acentos, números, hífen ou sublinhado.');return s;};
const tag=v=>{const s=normalize(v);if(!/^[A-Z0-9_-]{1,80}$/.test(s))throw Error('Identificação inválida (máximo de 80 caracteres).');return s;};
const types={R:'Reator / misturador',TK:'Tanque',B:'Bomba',COMP:'Compressor',EQ:'Outro equipamento'};
const quantities={P:'Pressão',T:'Temperatura',F:'Vazão',L:'Nível'};
const functions={I:'Indicação',T:'Transmissão',C:'Controle',IC:'Indicação e controle',IA:'Indicação e alarme'};
function addWorkshop(state,d,id){
 const value=code(d.code,'Código da oficina');
 if(!String(d.name||'').trim())throw Error('Informe o nome da oficina.');
 if(state.workshops.some(x=>x.code===value))throw Error('Essa oficina já existe.');
 return {...state,workshops:[...state.workshops,{id,code:value,name:d.name.trim(),tag:value}]};
}
function addSubsection(state,d,id){
 const workshop=state.workshops.find(x=>x.id===d.workshopId);if(!workshop)throw Error('Selecione a oficina.');
 const value=code(d.code,'Código da subseção');
 if(!String(d.name||'').trim())throw Error('Informe o nome da subseção.');
 if(state.subsections.some(x=>x.workshopId===workshop.id&&x.code===value))throw Error('Essa subseção já existe nesta oficina.');
 return {...state,subsections:[...state.subsections,{id,workshopId:workshop.id,code:value,name:d.name.trim(),tag:workshop.code+'-'+value}]};
}
function equipmentTag(state,d){
 const sub=state.subsections.find(x=>x.id===d.subsectionId);if(!sub)throw Error('Cadastre e selecione primeiro a subseção.');
 if(!types[d.type])throw Error('Selecione o tipo de equipamento.');
 const prefix=sub.tag+'-'+d.type;let n=1;
 const used=new Set(state.equipments.map(x=>x.tag));
 while(used.has(prefix+String(n).padStart(3,'0')))n++;
 return tag(prefix+String(n).padStart(3,'0'));
}
function unique(state,company,value){if([...state.equipments,...state.instruments].some(x=>normalize(x.company)===normalize(company)&&normalize(x.tag)===value))throw Error('Essa tag já existe nesta empresa.');}
function addEquipment(state,d,id){
 if(!String(d.name||'').trim())throw Error('Informe o nome do equipamento.');
 const sub=state.subsections.find(x=>x.id===d.subsectionId);
 const value=equipmentTag(state,d);unique(state,'LOCAL',value);
 return {...state,equipments:[...state.equipments,{...d,company:'LOCAL',unit:sub.tag,area:sub.code,workshopId:sub.workshopId,tag:value,id,createdAt:new Date().toISOString()}]};
}
function nextLoop(state,company){let n=1;const used=new Set(state.instruments.filter(x=>normalize(x.company)===normalize(company)).map(x=>Number(x.loop)));while(used.has(n))n++;return String(n).padStart(3,'0');}
function instrumentTag(state,d){
 const eq=state.equipments.find(x=>x.id===d.equipmentId);if(!eq)throw Error('Cadastre e selecione primeiro o equipamento.');
 if(!quantities[d.quantity]||!functions[d.function])throw Error('Selecione grandeza e função.');
 const loop=d.loopMode==='existing'?String(d.loop||'').trim():nextLoop({...state,instruments:state.instruments.filter(x=>x.equipmentId===eq.id)},eq.company);
 if(!/^[0-9]{1,6}$/.test(loop))throw Error('Informe uma malha de 1 a 6 algarismos.');
 if(d.loopMode==='existing'&&!state.instruments.some(x=>x.equipmentId===eq.id&&x.quantity===d.quantity&&x.loop===loop))throw Error('Selecione uma malha existente da mesma grandeza.');
 return {tag:tag(eq.tag+'-'+d.quantity+d.function+loop.padStart(3,'0')),loop,eq};
}
function addInstrument(state,d,id){
 if(!String(d.description||'').trim())throw Error('Informe a descrição do instrumento.');
 const proposed=instrumentTag(state,d);unique(state,proposed.eq.company,proposed.tag);
 const {company,unit,area}=proposed.eq;
 return {...state,instruments:[...state.instruments,{...d,id,tag:proposed.tag,loop:proposed.loop,company,unit,area,parent:proposed.eq.tag,createdAt:new Date().toISOString()}]};
}
function migrate(old){const state={version:2,equipments:[],instruments:[]};for(const r of old){let eq=state.equipments.find(x=>x.tag===normalize(r.parent)&&x.unit===normalize(r.unit)&&x.area===normalize(r.area));if(!eq){eq={id:'legacy-eq-'+state.equipments.length,company:'LEGADO',unit:normalize(r.unit),area:normalize(r.area),name:r.equipment,tag:normalize(r.parent),type:'EQ'};state.equipments.push(eq);}state.instruments.push({...r,company:'LEGADO',equipmentId:eq.id});}return state;}
function csv(state){const fields=['tipo','empresa','unidade','area','tag','descricao','equipamento_id','tag_equipamento','grandeza','funcao','malha'];const rows=[...state.equipments.map(e=>['Equipamento',e.company,e.unit,e.area,e.tag,e.name,e.id,'','','','']),...state.instruments.map(i=>['Instrumento',i.company,i.unit,i.area,i.tag,i.description,i.equipmentId,i.parent,i.quantity,i.function,i.loop])];const q=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';return '\uFEFF'+[fields,...rows].map(r=>r.map(q).join(';')).join('\r\n');}
const api={addWorkshop,addSubsection,normalize,types,quantities,functions,equipmentTag,addEquipment,nextLoop,instrumentTag,addInstrument,migrate,csv};if(typeof module!=='undefined')module.exports=api;else root.Tagging=api;
})(globalThis);
