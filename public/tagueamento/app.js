'use strict';
const $=id=>document.getElementById(id), key='tagcheck-tagging-prototype-v1';
let records=[];
try{const saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved)&&saved.every(r=>r&&typeof r.tag==='string'&&typeof r.id==='string'))records=saved;}catch{$('message').textContent='Não foi possível recuperar os dados locais. Exporte seus registros antes de fechar a página.';}
function data(){return Object.fromEntries(['unit','area','equipment','parent','description','quantity','function','loop','existing'].map(k=>[k,$(k).value.trim()]));}
function preview(){try{$('preview').textContent='Tag proposta: '+Tagging.suggest(data());}catch(e){$('preview').textContent=e.message;}}
function render(){
 $('count').textContent=records.length+' instrumento(s)';
 $('records').replaceChildren();
 for(const r of records){const card=document.createElement('article');const title=document.createElement('h3');title.textContent=r.tag;const text=document.createElement('p');text.textContent=r.description+' · '+r.equipment+' ('+r.parent+')';const remove=document.createElement('button');remove.className='secondary';remove.textContent='Remover';remove.onclick=()=>{if(!confirm('Remover '+r.tag+'?'))return;const next=records.filter(x=>x.id!==r.id);try{localStorage.setItem(key,JSON.stringify(next));records=next;render();}catch{$('message').textContent='Não foi possível salvar a remoção.';}};card.append(title,text,remove);$('records').append(card);}
}
document.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',preview));
$('form').onsubmit=e=>{e.preventDefault();try{const next=Tagging.add(records,data(),crypto.randomUUID());localStorage.setItem(key,JSON.stringify(next));records=next;render();$('message').textContent='Instrumento salvo neste navegador.';}catch(err){$('message').textContent=err.message;}};
$('export').onclick=()=>{if(!records.length){$('message').textContent='Cadastre um instrumento antes de exportar.';return;}const url=URL.createObjectURL(new Blob([Tagging.csv(records)],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='tagcheck-tagueamento.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('theme').onclick=()=>document.body.classList.toggle('light');
preview();render();
