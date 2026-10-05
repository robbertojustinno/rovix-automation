import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createManualPreviewApi} from './orpheus-manual-previews.mjs';
function harness(){
 let seq=0,saved=0,fail=false;const files=Array.from({length:20},(_,i)=>({id:'file'+i,name:'ORPHEUS_'+i+'.png',object_key:'owner/file'+i,mime_type:'image/png'}));
 const db={meta:{},settings:{postsPerDay:1},projects:[{id:'cipher',active:true},{id:'orpheus',active:true}],posts:[{id:'scheduled',status:'approved',sourceImageKey:files[0].object_key,scheduledAt:'2026-10-03T21:30:00-03:00'}]};
 const handler=createManualPreviewApi({json:(_,status,data)=>({status,data}),id:prefix=>prefix+'-'+(++seq),loadDriveCatalog:async()=>({files}),saveDb:async()=>{saved++},body:async req=>req.data||{},sendImage:async(_,entry,download)=>({image:entry.imageKey,download}),attachPreapproved:async(db,entry)=>{if(fail)return{made:0,error:'Artwork unavailable'};entry.imageKey='previews/'+entry.id+'.jpg';entry.sourceImageName='approved.png';(db.meta.preapprovedHistory||=[]).push({key:entry.sourceImageKey});return{made:1}}});
 return{db,call:(path='',method='GET',data)=>handler({method,data},{},new URL('http://localhost/orpheus-api/manual-previews'+path),db),stats:()=>saved,setFail:()=>{fail=true}};
}
test('three actual previews are independent of daily quota, agenda and approval queue',async()=>{
 const h=harness(),before=structuredClone(h.db.posts),settings=structuredClone(h.db.settings);
 const batch=await h.call('/generate','POST');assert.equal(batch.status,201);assert.equal(batch.data.entries.length,3);
 assert.deepEqual(h.db.posts,before);assert.deepEqual(h.db.settings,settings);
 assert.equal(new Set(batch.data.entries.map(p=>p.sourceImageKey)).size,3);
 assert.ok(batch.data.entries.every(p=>p.imageKey&&p.caption&&!p.scheduledAt&&p.status==='manual_preview'&&p.sourceImageKey!=='owner/file0'));
 const entry=batch.data.entries[0],image=await h.call('/'+entry.id+'/image?download=1');assert.equal(image.download,true);assert.equal(image.image,entry.imageKey);
 const get=await h.call();assert.equal(get.data.id,batch.data.id);
});
test('another trio prioritizes unused images and different captions',async()=>{
 const h=harness(),first=(await h.call('/generate','POST')).data,second=(await h.call('/generate','POST')).data;
 assert.ok(second.entries.every(p=>!first.entries.some(x=>x.sourceImageKey===p.sourceImageKey||x.caption===p.caption)));
 assert.equal(h.db.meta.manualPreviewHistory.length,6);assert.equal(h.stats(),2);
 assert.equal((await h.call('/'+first.entries[0].id+'/image')).status,404);
});
test('failed generation preserves previous batch and does not save or create posts',async()=>{
 const h=harness();await h.call('/generate','POST');const before=structuredClone(h.db.meta.manualPreviewBatch);h.setFail();
 await assert.rejects(h.call('/generate','POST'),/Artwork unavailable/);assert.deepEqual(h.db.meta.manualPreviewBatch,before);assert.equal(h.db.posts.length,1);assert.equal(h.stats(),1);
});
test('manual preview UI exposes three captions, copy, download and manual creation',()=>{
 const nodes=new Map(),node=s=>{if(!nodes.has(s))nodes.set(s,{innerHTML:'',textContent:''});return nodes.get(s)};
 const context=vm.createContext({title:()=>{},$:node,esc:x=>String(x??''),URL:{revokeObjectURL:()=>{}},document:{querySelectorAll:()=>[]}});
 vm.runInContext(fs.readFileSync(new URL('./orpheus-agent-public/manual-previews.js',import.meta.url),'utf8'),context);
 vm.runInContext("manualPreviewState={entries:[1,2,3].map(i=>({id:'p'+i,title:'Title '+i,caption:'Caption '+i,sourceImageName:'Approved.png'}))};drawManualPreviews()",context);
 const html=node('#app').innerHTML;
 for(const selector of ['data-manual-copy=','data-manual-download=','data-manual-use='])assert.equal(html.split(selector).length-1,3);
 assert.match(html,/Gerar 3 prévias para postar manualmente/);
 const app=fs.readFileSync(new URL('./orpheus-agent-public/app.js',import.meta.url),'utf8');assert.match(app,/manualPostPreset\?\.imageKey/);assert.match(app,/function create\(\)\{manualPostPreset=null/);
});

test('publishing preparation preserves edited caption and creates only one unscheduled draft',async()=>{
 const h=harness();const batch=(await h.call('/generate','POST')).data,entry=batch.entries[0];
 const before=structuredClone(h.db.posts[0]);
 const first=await h.call('/'+entry.id+'/draft','POST',{caption:'Legenda revisada para publicar'});
 assert.equal(first.data.caption,'Legenda revisada para publicar');assert.equal(first.data.imageKey,entry.imageKey);assert.equal(first.data.status,'draft');assert.equal(first.data.scheduledAt,'');
 const second=await h.call('/'+entry.id+'/draft','POST',{caption:first.data.caption});assert.equal(second.data.id,first.data.id);assert.equal(h.db.posts.length,2);assert.deepEqual(h.db.posts[1],before);
 first.data.status='published';first.data.metaMediaId='existing-instagram-publication';
 const again=await h.call('/'+entry.id+'/draft','POST',{caption:'Outra legenda'});assert.equal(again.data.status,'published');assert.equal(again.data.caption,'Legenda revisada para publicar');assert.equal(h.db.posts.length,2);
 assert.equal((await h.call()).data.entries[0].postStatus,'published');
});
test('invalid caption cannot create a draft for publication',async()=>{
 const h=harness(),entry=(await h.call('/generate','POST')).data.entries[0];
 await assert.rejects(h.call('/'+entry.id+'/draft','POST',{caption:''}),/legenda/);assert.equal(h.db.posts.length,1);
});
