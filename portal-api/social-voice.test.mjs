import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {publishVoicePost} from './social-voice.mjs';
const {parseCommand}=createRequire(import.meta.url)('./social-agent-public/voice.js');
test('the exact Portuguese command publishes; negation and unrelated requests do not',()=>{
  assert.equal(parseCommand('Faça uma postagem manual').action,'publish');
  assert.equal(parseCommand('Lia, faça uma postagem manual agora').action,'publish');
  assert.equal(parseCommand('Não faça uma postagem manual').action,'cancel');
  assert.equal(parseCommand('Gerar três prévias').action,'previews');
  assert.equal(parseCommand('Abra aprovações').view,'queue');
  assert.equal(parseCommand('exclua todos os posts').action,'unknown');
});
const setup=()=>{
 const db={meta:{},posts:[]},calls=[];
 const deps={id:()=> 'post-1',saveDb:async()=>calls.push('save'),preflight:async()=>calls.push('check'),generate:async()=>{calls.push('generate');return {entries:[{imageKey:'art.jpg',caption:'Legenda',title:'Título'}]};},publish:async()=>{calls.push('publish');return{id:'instagram-1',containerId:'container-1'};}};
 return {db,calls,deps};
};
test('creates exactly one post, saves before publication, and deduplicates retries',async()=>{
 const {db,calls,deps}=setup();const p=await publishVoicePost(deps,db,'command-123');
 assert.equal(p.status,'published');assert.equal(db.posts.length,1);assert.deepEqual(calls,['check','generate','save','publish','save']);
 await publishVoicePost(deps,db,'command-123');assert.equal(calls.filter(x=>x==='publish').length,1);
});
test('blocked connection creates no content',async()=>{
 const {db,calls,deps}=setup();deps.preflight=async()=>{throw new Error('Meta bloqueada')};
 await assert.rejects(publishVoicePost(deps,db,'command-123'),/Meta bloqueada/);assert.equal(db.posts.length,0);assert.equal(calls.length,0);
});
test('failed publication remains visible and a repeated request does not publish again',async()=>{
 const {db,calls,deps}=setup();deps.publish=async()=>{calls.push('publish');throw new Error('timeout')};
 await assert.rejects(publishVoicePost(deps,db,'command-123'),/não foi confirmada/);
 assert.equal(db.posts[0].status,'error');await assert.rejects(publishVoicePost(deps,db,'command-123'),/timeout/);
 assert.equal(db.posts.length,1);assert.equal(calls.filter(x=>x==='publish').length,1);
});
