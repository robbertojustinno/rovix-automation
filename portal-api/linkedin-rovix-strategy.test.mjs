import test from 'node:test';
import assert from 'node:assert/strict';
import {createWeeklyPlan,composeStrategy,assertCreativeUnique,learnFromPosts,validateMetrics} from './linkedin-rovix-strategy.mjs';
import {createStrategyApi} from './linkedin-rovix-strategy-routes.mjs';
const files=Array.from({length:100},(_,i)=>({id:String(i),name:['manometro','plc','robo','nuvem','scada'][i%5]+i+'.png',mime_type:'image/png',object_key:'owner/'+i}));
test('weekly plan covers seven dates with distinct images and captions and diverse subjects',()=>{
 const p=createWeeklyPlan(files,[],'2026-10-03',3);
 assert.equal(p.entries.length,21);assert.equal(new Set(p.entries.map(e=>e.date)).size,7);
 assert.equal(new Set(p.entries.map(e=>e.sourceFileId)).size,21);
 assert.equal(new Set(p.entries.map(e=>e.caption)).size,21);
 assert.equal(new Set(p.entries.map(e=>e.strategy.subject)).size,5);
 assert.equal(p.entries.at(-1).date,'2026-10-09');
 assert.ok(p.entries.every(e=>e.strategy.hypothesis&&e.strategy.reel.length===6));
});
test('exhausted images and exact creative duplicates fail explicitly',()=>{
 assert.throws(()=>createWeeklyPlan([],[],'2026-10-03'),/imagens/);
 const p=composeStrategy(files[0]);assert.throws(()=>assertCreativeUnique(p,[{...p,id:'old',createdAt:new Date().toISOString()}]),/repetido/);
 const next=composeStrategy(files[0],[{...p,createdAt:new Date().toISOString()}]);assert.notEqual(p.caption,next.caption);
});
test('unavailable metrics stay null; zeros preserved; invalid values rejected',()=>{
 const m=validateMetrics({saved:0,reach:100});assert.equal(m.saved,0);assert.equal(m.views,null);
 assert.throws(()=>validateMetrics({reach:-1}),/inválida/);assert.throws(()=>validateMetrics({retention:101}),/inválida/);
});
test('learning requires comparable observations and ignores drafts',()=>{
 const base=composeStrategy(files[0]);const posts=Array.from({length:4},(_,i)=>({...base,id:String(i),status:'published',strategy:{...base.strategy,primaryMetric:'saved',experiment:{variant:i<2?'Checklist':'Curiosidade'}},performance:{metrics:{reach:100,saved:i<2?10:1}}}));
 assert.equal(learnFromPosts(posts.slice(0,2))[0].status,'dados insuficientes');
 assert.equal(learnFromPosts(posts)[0].status,'observação');
 assert.match(learnFromPosts(posts)[0].summary,/Checklist/);
 assert.equal(learnFromPosts(posts.map(p=>({...p,status:'draft'}))).length,0);
});
test('strategy routes persist plans and create idempotent approval drafts without publishing',async()=>{
 const db={settings:{postsPerDay:3},meta:{},projects:[{id:'rovix',name:'ROVIX'},{id:'tagcheck',name:'TagCheck'},{id:'uap-studio',name:'UAP'},{id:'rovix-drive',name:'Drive'}],posts:[]};let saves=0,n=0;
 const api=createStrategyApi({json:(_,status,data)=>({status,data}),body:async req=>req.data||{},saoDate:()=> '2026-10-03',loadDriveCatalog:async()=>({files}),saveDb:async()=>{saves++},scheduleFor:(date,slot)=>date+'T'+String(9+slot).padStart(2,'0')+':00:00-03:00',id:()=>String(++n),refreshMetrics:async()=>{}});
 const call=(method,path,data)=>api({method,data},null,new URL('http://local/linkedin-rovix-api/strategy'+path),db);
 await assert.rejects(()=>call('POST','/generate',{date:'2026-02-30'}),/válida/);
 const p=await call('POST','/generate',{date:'2026-10-04'});assert.equal(p.status,201);
 const entry=p.data.entries[0],draft=await call('POST','/entries/'+entry.id+'/draft');
 assert.equal(draft.data.status,'draft');assert.equal(draft.data.artStatus,'pending');assert.equal(draft.data.strategy.visual.fileId,entry.sourceFileId);
 await call('POST','/entries/'+entry.id+'/draft');assert.equal(db.posts.length,1);assert.equal(saves,2);
 await assert.rejects(()=>call('PUT','/posts/'+draft.data.id+'/metrics',{reach:100}),/publicada/);
 const next=p.data.entries[1],original=next.caption;await call('POST','/entries/'+next.id+'/regenerate');assert.notEqual(next.caption,original);
});
