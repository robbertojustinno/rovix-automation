import test from 'node:test';
import assert from 'node:assert/strict';
import {publishVoicePost,generateVoiceEntry,prepareRovixVoiceArtwork} from './voice-post.mjs';
const imageSelectionFixture = prepare => ({
  db:{posts:[],meta:{},projects:[{id:'rovix',active:true,name:'ROVIX'}]},
  deps:{kind:'rovix',folderId:'approved-folder',ownerId:'owner',id:()=> 'candidate',
    loadCatalog:async()=>({folderId:'approved-folder',ownerId:'owner',files:['A','B','C'].map(id=>({id,name:id,mime_type:'image/png',object_key:'owner/'+id}))}),
    compose:file=>({projectId:'rovix',title:file.name,caption:'Legenda '+file.name}),prepare}
});
test('skips visually duplicated candidates and uses the next valid image',async()=>{
  const tried=[];
  const {db,deps}=imageSelectionFixture(async(p,db,c,file)=>{
    tried.push(file.id);
    if(file.id==='A')throw new Error('Imagem bloqueada: igual ou visualmente semelhante a outra postagem. Crie uma cena original.');
    p.imageKey='ready-'+file.id;p.artStatus='ready';
  });
  const entry=await generateVoiceEntry(deps,db);
  assert.deepEqual(tried,['A','B']);assert.equal(entry.driveFileId,'B');assert.equal(entry.imageKey,'ready-B');assert.equal(db.posts.length,0);
});
test('all blocked images produce no post and request new artwork',async()=>{
  const tried=[];
  const {db,deps}=imageSelectionFixture(async(p,db,c,file)=>{tried.push(file.id);throw new Error('Imagem bloqueada: fundo já utilizado em outra postagem.');});
  await assert.rejects(generateVoiceEntry(deps,db),/Adicione novas imagens/);
  assert.deepEqual(tried,['A','B','C']);assert.equal(db.posts.length,0);
});
test('storage and connection errors are not treated as duplicate images',async()=>{
  const tried=[];
  const {db,deps}=imageSelectionFixture(async(p,db,c,file)=>{tried.push(file.id);throw new Error('AccessDenied');});
  await assert.rejects(generateVoiceEntry(deps,db),/AccessDenied/);assert.deepEqual(tried,['A']);
});
const setup=network=>{
 const db={meta:{},posts:[],settings:{enabled:true}},calls=[];
 const deps={network,saveDb:async()=>calls.push('save'),preflight:async()=>calls.push('check'),generate:async()=>{calls.push('generate');return {id:'voice-1',imageKey:'approved.jpg',artStatus:'ready',caption:'Legenda',title:'Título'}},publish:async()=>{calls.push('publish');return{id:'remote-1',containerId:'container',url:'https://www.linkedin.com/feed/update/remote-1'}}};
 return {db,calls,deps};
};
for(const network of ['instagram','linkedin'])test(network+': publishes one post and deduplicates the same request',async()=>{
 const {db,calls,deps}=setup(network);const p=await publishVoicePost(deps,db,'request-123');
 assert.equal(p.status,'published');assert.equal(p.scheduledAt,'');assert.equal(p.generatedBy,'voice');assert.equal(db.posts.length,1);
 assert.equal(network==='linkedin'?p.linkedinPostId:p.metaMediaId,'remote-1');
 assert.deepEqual(calls,['check','generate','save','publish','save']);assert.equal(db.settings.enabled,true);
 await publishVoicePost(deps,db,'request-123');assert.equal(calls.filter(x=>x==='publish').length,1);
});
test('uncertain publication is retained and not repeated',async()=>{
 const {db,calls,deps}=setup('linkedin');deps.publish=async()=>{calls.push('publish');throw new Error('timeout')};
 await assert.rejects(publishVoicePost(deps,db,'request-123'),/não foi confirmada/);
 assert.equal(db.posts[0].status,'publication_uncertain');await assert.rejects(publishVoicePost(deps,db,'request-123'),/timeout/);
 assert.equal(calls.filter(x=>x==='publish').length,1);
});
test('blocked account generates no content',async()=>{
 const {db,calls,deps}=setup('instagram');deps.preflight=async()=>{throw new Error('blocked')};
 await assert.rejects(publishVoicePost(deps,db,'request-123'),/blocked/);assert.equal(db.posts.length,0);assert.equal(calls.length,0);
});
test('one free image is sufficient; existing batches, queue and settings are preserved',async()=>{
 const db={posts:[{id:'pending',driveFileId:'reserved',status:'draft'}],projects:[{id:'rovix',active:true,name:'ROVIX'}],meta:{manualPreviewBatch:{id:'existing'},manualPreviewSequence:9},settings:{enabled:true}};
 const before=structuredClone(db),prepared=[];
 const entry=await generateVoiceEntry({kind:'rovix',folderId:'folder-r',ownerId:'owner-r',id:()=> 'voice-r',loadCatalog:async()=>({folderId:'folder-r',ownerId:'owner-r',files:[{id:'reserved',name:'Reserved',mime_type:'image/png',object_key:'owner-r/1'},{id:'free',name:'Free',mime_type:'image/png',object_key:'owner-r/2'}]}),compose:()=>({projectId:'rovix',caption:'Caption',title:'Title'}),prepare:async(p,db,c,f)=>{prepared.push(f.id);p.artStatus='ready';p.imageKey='ready.jpg'}},db);
 assert.equal(entry.id,'voice-r');assert.deepEqual(prepared,['free']);assert.deepEqual(db,before);
});
test('another campaign or owner cannot supply the voice artwork',async()=>{
 const db={posts:[],meta:{},projects:[]};
 await assert.rejects(generateVoiceEntry({folderId:'orpheus-folder',ownerId:'owner',loadCatalog:async()=>({folderId:'rovix-folder',ownerId:'owner',files:[]})},db),/diferente do acervo autorizado/);
});
test('LinkedIn ROVIX voice artwork retains identity and checks duplicates before upload',async()=>{
 const steps=[],p={id:'p',strategy:{visual:{}}},file={id:'file',name:'Sensor.png'},project={id:'rovix'};
 await prepareRovixVoiceArtwork({driveContent:()=>({hasExistingText:true}),readImage:async()=>{steps.push('read');return Buffer.from('source')},render:async(post,pr)=>{assert.equal(pr,project);assert.equal(post.driveHasExistingText,true);steps.push('render');return Buffer.from('final')},fingerprint:async()=> 'fp',assertUnique:async()=>steps.push('unique'),storeImage:async()=>{steps.push('store');return 'voice/p.jpg'}},p,{posts:[]},file,project);
 assert.deepEqual(steps,['read','render','unique','store']);assert.equal(p.artStatus,'ready');assert.equal(p.imageKey,'voice/p.jpg');
});
