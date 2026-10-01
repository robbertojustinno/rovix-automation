import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {selectConcept,fingerprint,renderScene,repairQueue,RECENT_WINDOW} from '../orpheus-visual.mjs';

test('120 consecutive concepts respect the recent window and adjacent subject guard',()=>{
  const posts=[];
  for(let i=0;i<120;i++){
    const c=selectConcept(posts,'post-'+i);
    assert(!posts.slice(-RECENT_WINDOW).some(p=>fingerprint(p.visualConcept)===fingerprint(c)));
    assert(!posts.slice(-5).some(p=>['character','setting','action'].every(k=>p.visualConcept[k]===c[k])));
    posts.push({visualConcept:c});
  }
  assert.equal(new Set(posts.map(p=>p.visualConcept.scene)).size,12);
});
test('15 queue artworks have different actual JPEG bytes and scenes',async()=>{
  const posts=[],hashes=new Set();
  for(let i=0;i<15;i++){
    const c=selectConcept(posts,'queue-'+i),bytes=await renderScene(c);
    hashes.add(crypto.createHash('sha256').update(bytes).digest('hex'));
    posts.push({visualConcept:c});
  }
  assert.equal(hashes.size,15);
  assert(new Set(posts.map(p=>p.visualConcept.scene)).size>=10);
});
test('repair replaces queue, restores editorial cancellations and stays idempotent',()=>{
  const db={projects:[{id:'cipher',active:true,name:'CIPHER'},{id:'orpheus',active:true,name:'ORPHEUS'}],posts:[
    {id:'published',projectId:'cipher',generatedDate:'2026-10-01',generatedBy:'agent',status:'published',imageKey:'keep'},
    {id:'cancelled',projectId:'cipher',generatedDate:'2026-10-02',generatedBy:'agent',status:'deleted',lastError:'Agendamento cancelado por decisão editorial'},
    {id:'approved',projectId:'orpheus',generatedDate:'2026-10-03',generatedBy:'agent',status:'approved',imageKey:'old'},
    {id:'user-deleted',projectId:'cipher',generatedDate:'2026-10-04',generatedBy:'agent',status:'deleted'},
  ],settings:{enabled:false,postsPerDay:3,approvalMode:'auto'},meta:{pauseGenerationUntil:'2026-10-05'}};
  let i=0;const options={today:'2026-10-01',now:new Date('2026-10-01T22:00:00Z'),schedule:d=>d+'T23:00:00Z',makeId:()=>String(i++)};
  assert(repairQueue(db,options).changed);
  assert(db.settings.enabled);assert(!db.meta.pauseGenerationUntil);
  assert.equal(db.posts.find(p=>p.id==='published').imageKey,'keep');
  assert.equal(db.posts.find(p=>p.id==='cancelled').status,'approved');
  assert.equal(db.posts.find(p=>p.id==='user-deleted').status,'deleted');
  for(let day=1;day<=5;day++)assert.equal(db.posts.filter(p=>p.generatedDate==='2026-10-0'+day&&p.status!=='deleted').length,3);
  assert.equal(repairQueue(db,options).changed,false);
});
