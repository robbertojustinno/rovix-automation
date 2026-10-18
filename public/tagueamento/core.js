(function(root){
'use strict';
const normalize = value => String(value || '').trim().toUpperCase();
function suggest(data){
 const unit=normalize(data.unit), area=normalize(data.area), loop=String(data.loop||'').trim();
 if(!/^[A-Z0-9_-]{1,20}$/.test(unit)||!/^[A-Z0-9_-]{1,20}$/.test(area)) throw Error('Preencha unidade e área usando letras sem acentos, números, hífen ou sublinhado.');
 if(!/^[0-9]{1,6}$/.test(loop)) throw Error('Informe uma malha com 1 a 6 algarismos.');
 if(!['P','T','F','L'].includes(data.quantity)||!['I','T','C'].includes(data.function)) throw Error('Selecione grandeza e função.');
 const tag=normalize(data.existing)||[unit,area,data.quantity+data.function,loop].join('-');
 if(!/^[A-Z0-9_-]{1,80}$/.test(tag)) throw Error('A tag deve ter até 80 caracteres: letras sem acentos, números, hífen ou sublinhado.');
 return tag;
}
function add(records,data,id){
 const tag=suggest(data);
 if(!String(data.equipment||'').trim()||!normalize(data.parent)||!String(data.description||'').trim()) throw Error('Preencha equipamento, tag do equipamento e descrição do instrumento.');
 if(tag===normalize(data.parent)||records.some(r=>normalize(r.tag)===tag||normalize(r.parent)===tag||normalize(r.tag)===normalize(data.parent))) throw Error('Identificação duplicada entre equipamentos ou instrumentos.');
 return [...records,{...data,tag,parent:normalize(data.parent),id,createdAt:new Date().toISOString()}];
}
function csv(records){
 const fields=['tag','unit','area','equipment','parent','description','quantity','function','loop'];
 const quote=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';
 return '\uFEFF'+[fields,...records.map(r=>fields.map(k=>r[k]))].map(row=>row.map(quote).join(';')).join('\r\n');
}
const api={normalize,suggest,add,csv};if(typeof module!=='undefined')module.exports=api;else root.Tagging=api;
})(globalThis);
