import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
import {VISUAL_PROFILE_DEFAULT} from './social-visual-profile.mjs';
const source=fs.readFileSync(new URL('./social-agent.mjs',import.meta.url),'utf8');
function extract(name,next,ctx){
 const code=source.slice(source.indexOf('async function '+name+'('),source.indexOf(next,source.indexOf('async function '+name+'(')));
 return new Function('ctx','with(ctx){'+code+';return '+name+'}')(ctx);
}
function queueContext(posts){
 const state={posts,meta:{visualProfile:{...VISUAL_PROFILE_DEFAULT,enabled:true}},projects:[{id:'rovix',name:'ROVIX'}]};
 const calls={catalog:0,drive:0,start:0,finish:0,save:0};
 return {state,calls,ctx:{loadDb:async()=>state,loadDriveCatalog:async()=>{calls.catalog++;return{files:[]}},prepareDriveArtwork:async p=>{calls.drive++;p.artStatus='ready'},startOriginalArtwork:async p=>{calls.start++;p.artJobId='job';p.artStatus='generating'},finishOriginalArtwork:async p=>{calls.finish++;p.artStatus='ready';delete p.artJobId;return true},saveDb:async()=>calls.save++,MAX_FAST_IMAGES_PER_RUN:12,MAX_IMAGE_JOBS:2,VISUAL_ENGINE:'drive',VISUAL_PROFILE_DEFAULT,structuredClone,Date,console,DRIVE_IMAGE_POLICY:{path:'drive'}}};
}
test('AI generation and completion operate without Drive access',async()=>{
 const q=queueContext([{id:'new',projectId:'rovix',generatedBy:'agent',status:'draft',artStatus:'pending',imageProvider:'ai-horde',createdAt:'2026-10-06'}]);
 const run=extract('prepareArtworkForQueue','const GROQ_API_KEY',q.ctx);
 assert.equal((await run()).queued,1);
 assert.equal(q.calls.catalog,0);
 assert.equal(q.calls.save,2);
 assert.equal((await run()).made,1);
 assert.equal(q.calls.finish,1);
 assert.equal(q.calls.drive,0);
});
test('existing Drive drafts keep their original provider after AI activation',async()=>{
 const q=queueContext([{id:'old',projectId:'rovix',generatedBy:'agent',status:'draft',artStatus:'pending',createdAt:'2026-10-01'}]);
 await extract('prepareArtworkForQueue','const GROQ_API_KEY',q.ctx)();
 assert.equal(q.calls.drive,1);
 assert.equal(q.calls.start,0);
});
test('running AI jobs receive priority above an older Drive backlog',async()=>{
 const old=Array.from({length:15},(_,i)=>({id:'old'+i,projectId:'rovix',generatedBy:'agent',status:'draft',artStatus:'pending',createdAt:'2026-10-01'}));
 const q=queueContext([...old,{id:'new',projectId:'rovix',generatedBy:'agent',status:'draft',artStatus:'generating',imageProvider:'ai-horde',artJobId:'job',createdAt:'2026-10-06'}]);
 await extract('prepareArtworkForQueue','const GROQ_API_KEY',q.ctx)();
 assert.equal(q.calls.finish,1);
});
test('branded output renders to 1080x1350 JPEG without requiring ROVIX branding',async()=>{
 const render=extract('renderProfileArtwork','async function hordeFetch',{sharp,VISUAL_PROFILE_DEFAULT,titleLines:x=>[x],escapeXml:x=>x,Buffer});
 const raw=await sharp({create:{width:1024,height:1024,channels:3,background:'#334455'}}).png().toBuffer();
 const image=await render({title:'Sensores de pressão',visualProfile:{...VISUAL_PROFILE_DEFAULT,brandName:'Aurora',palette:['#124578']}},{name:'Aurora'},raw);
 const meta=await sharp(image).metadata();
 assert.equal(meta.width,1080);assert.equal(meta.height,1350);assert.equal(meta.format,'jpeg');
});
