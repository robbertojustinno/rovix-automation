import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createWeeklyPlan,validateMetrics,learnFromPosts} from './orpheus-strategy.mjs';
import {createStrategyApi} from './orpheus-strategy-routes.mjs';
const files=Array.from({length:100},(_,i)=>({id:'file'+i,name:'ORPHEUS_'+String(i).padStart(3,'0')+'.png',object_key:'owner/file'+i,mime_type:'image/png'}));
test('week varies content, reserves active sources and exhausts unused images first',()=>{
 const posts=[{id:'old',sourceImageKey:files[0].object_key,status:'approved'}];
 const plan=createWeeklyPlan(files,posts,'2099-10-03',3);
 assert.equal(plan.entries.length,21);assert.equal(new Set(plan.entries.map(e=>e.caption)).size,21);
 assert.equal(new Set(plan.entries.map(e=>e.sourceFileId)).size,21);
 assert.equal(new Set(plan.entries.map(e=>e.strategy.subject)).size,5);
 assert.ok(plan.entries.every(e=>e.sourceFileId!=='file0'&&['cipher','orpheus'].includes(e.projectId)));
 assert.ok(plan.entries.every(e=>!e.caption.includes('ROVIX')&&e.strategy.visual.sourceKey));
 assert.equal(plan.entries.at(-1).date,'2099-10-09');
 assert.equal(createWeeklyPlan(files,[],'2099-10-03',12).entries.length,84);
});
function harness(){
 const db={meta:{},settings:{postsPerDay:1},projects:[{id:'cipher',name:'CIPHER',active:true},{id:'orpheus',name:'ORPHEUS',active:true}],posts:[]};let saved=0,rendered=0,fail=false;
 const api=createStrategyApi({json:(_,status,data)=>({status,data}),body:async req=>req.data||{},saoDate:()=> '2099-10-03',loadDriveCatalog:async()=>({files}),saveDb:async()=>{saved++},scheduleFor:(date)=>date+'T21:30:00-03:00',id:()=> 'new'+rendered,attachPreapproved:async(_,post)=>{rendered++;if(fail)return {made:0,error:'render failed'};post.imageKey='unique/'+post.id;post.artStatus='review_pending';return {made:1}},sourceUrl:async id=>'https://example.com/'+id,refreshMetrics:async()=>{}});
 return {db,call:(path,method='GET',data)=>api({method,data},{},new URL('http://localhost/orpheus-api/strategy'+path),db),stats:()=>({saved,rendered}),setFail:()=>{fail=true}};
}
test('generation leaves agenda intact; draft renders once and requires approval',async()=>{
 const h=harness();await h.call('/generate','POST',{date:'2099-10-03'});assert.equal(h.db.posts.length,0);
 const entry=h.db.meta.orpheusContentPlan.entries[0];
 const source=await h.call('/entries/'+entry.id+'/source');assert.match(source.data.url,/file/);
 const created=await h.call('/entries/'+entry.id+'/draft','POST');assert.equal(created.status,201);assert.equal(created.data.status,'draft');assert.equal(created.data.artStatus,'review_pending');assert.equal(created.data.sourceImageKey,entry.strategy.visual.sourceKey);
 await h.call('/entries/'+entry.id+'/draft','POST');assert.equal(h.db.posts.length,1);assert.equal(h.stats().rendered,1);
});
test('schedule collisions and failed artwork leave no new posts',async()=>{
 const h=harness();await h.call('/generate','POST',{date:'2099-10-03'});const e=h.db.meta.orpheusContentPlan.entries[0];
 h.db.posts.push({id:'manual',scheduledAt:'2099-10-03T21:30:00-03:00',status:'approved'});
 await assert.rejects(h.call('/entries/'+e.id+'/draft','POST'),/ocupado/);assert.equal(h.stats().rendered,0);
 h.db.posts=[];h.setFail();await assert.rejects(h.call('/entries/'+e.id+'/draft','POST'),/render failed/);assert.equal(h.db.posts.length,0);assert.equal(e.postId,undefined);
});
test('edit, regenerate and manual metrics routes work without publishing',async()=>{
 const h=harness();await h.call('/generate','POST',{date:'2099-10-03'});const e=h.db.meta.orpheusContentPlan.entries[0],caption=e.caption;
 await h.call('/entries/'+e.id+'/regenerate','POST');assert.notEqual(e.caption,caption);
 await h.call('/entries/'+e.id+'/edit','POST',{title:'Título conferido',caption:'Legenda conferida',hook:'Gancho conferido',date:'2099-10-04'});assert.equal(e.date,'2099-10-04');assert.equal(e.strategy.reel[0].text,'Gancho conferido');
 h.db.posts.push({id:'pub',status:'published',strategy:e.strategy});await h.call('/posts/pub/metrics','PUT',{reach:100,comments:0});assert.equal(h.db.posts[0].performance.metrics.comments,0);assert.equal(h.db.posts[0].performance.metrics.saved,null);
 await assert.rejects(h.call('/generate','POST',{date:'2099-02-30'}),/válida/);
});
test('unavailable metrics remain null, zero counts and minimum samples are enforced',()=>{
 assert.equal(validateMetrics({reach:0}).reach,0);assert.equal(validateMetrics({}).reach,null);assert.throws(()=>validateMetrics({likes:-1}));
 const rows=[];for(const variant of ['A','B'])for(let n=0;n<2;n++)rows.push({id:variant+n,status:'published',strategy:{subject:'leitura',primaryMetric:'comments',angle:variant},performance:{metrics:{reach:100,comments:variant==='A'?0:2}}});
 assert.equal(learnFromPosts(rows.slice(0,3))[0].status,'dados insuficientes');assert.equal(learnFromPosts(rows)[0].status,'observação');
});
test('all strategy tabs and editing screens render with original-image previews',async()=>{
 const nodes=new Map(),node=s=>{if(!nodes.has(s))nodes.set(s,{innerHTML:'',value:'',querySelector:()=>({disabled:false})});return nodes.get(s)};
 const context=vm.createContext({Intl,Date,JSON,encodeURIComponent,alert:()=>{throw new Error('Unexpected alert')},S:{posts:[]},title:()=>{},view:()=>{},$:node,esc:x=>String(x??''),document:{querySelectorAll:()=>[]},api:async()=>({})});
 vm.runInContext(fs.readFileSync(new URL('./orpheus-agent-public/strategy.js',import.meta.url),'utf8'),context);
 context.data={policy:{rule:'test'},plan:createWeeklyPlan(files,[],'2099-10-03',1),learnings:[],results:[]};
 for(const tab of ['plan','ideas','reels','tests','results','learning']){vm.runInContext('strategyState=data;strategyTab='+JSON.stringify(tab)+';drawStrategy()',context);assert.ok(node('#app').innerHTML.includes('CIPHER / ORPHEUS'));assert.ok(node('#strategyBody').innerHTML.length);}
 vm.runInContext('editStrategy(data.plan.entries[0].id)',context);assert.match(node('#strategyBody').innerHTML,/strategyEntryDate/);
});
