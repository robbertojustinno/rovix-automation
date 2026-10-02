import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {selectScene,generate,duplicateImage,publishable,DIMENSIONS} from '../orpheus-flux.mjs';
test('persistent diversity rejects recent combinations and alternates people',()=>{
 const history=[];
 for(let i=0;i<150;i++){const c=selectScene(history);assert.ok(!history.slice(-60).some(h=>DIMENSIONS.filter(k=>h[k]===c[k]).length>=4));if(history.length)assert.notEqual(c.character==='none',history.at(-1).character==='none');history.push(c);}
 assert.throws(()=>selectScene(history,{title:'Blake Langmere'}),/CHARACTER_REFERENCE_REQUIRED/);
});
test('same bytes and perceptually similar images are blocked',()=>{
 const r={hash:'a',perceptual:Buffer.alloc(256,100).toString('base64')};assert.equal(duplicateImage(r,[{hash:'a'}]),true);assert.equal(duplicateImage(r,[{hash:'b',perceptual:Buffer.alloc(256,102).toString('base64')}]),true);assert.equal(duplicateImage(r,[{hash:'b',perceptual:Buffer.alloc(256,200).toString('base64')}]),false);
});
test('ready flag without quality review never publishes',()=>{
 assert.equal(publishable({artStatus:'ready',imageKey:'x'}),false);assert.equal(publishable({artStatus:'review_pending',imageKey:'x',artValidation:{approvedAt:'now'}}),false);assert.equal(publishable({artStatus:'ready',imageUrl:'https://x/brand.png',artValidation:{approvedAt:'now'}}),false);assert.equal(publishable({artStatus:'ready',imageKey:'x',artValidation:{approvedAt:'now'}}),true);
});
const parameters=['prompt','seed','randomize_seed','width','height','num_inference_steps'].map(parameter_name=>({parameter_name}));
test('Gradio schema, SSE and raster typography work end to end',async()=>{
 const source=await sharp({create:{width:1088,height:1360,channels:3,background:'#183442'}}).webp().toBuffer();let calls=0;
 const fetcher=async(url,options)=>{calls++;if(url.endsWith('/info'))return Response.json({named_endpoints:{'/infer':{parameters}}});if(options.method==='POST'){assert.deepEqual(JSON.parse(options.body).data.slice(2),[false,1088,1360,4]);return Response.json({event_id:'a'.repeat(32)});}if(url.includes('/file='))return new Response(source);return new Response('event: heartbeat\ndata: null\n\nevent: complete\ndata: [{"url":"https://black-forest-labs-flux-1-schnell.hf.space/gradio_api/file=/tmp/x.webp"}]\n\n');};
 const r=await generate(selectScene([]),fetcher);assert.equal(calls,4);assert.equal((await sharp(r.buffer).metadata()).width,1088);assert.equal(Buffer.from(r.perceptual,'base64').length,256);
});
test('quota errors and changed schema remain errors without another provider',async()=>{
 await assert.rejects(()=>generate(selectScene([]),async()=>Response.json({named_endpoints:{}})),/HF_SCHEMA_CHANGED/);
 const fetcher=async(url,options)=>url.endsWith('/info')?Response.json({named_endpoints:{'/infer':{parameters}}}):options.method==='POST'?Response.json({event_id:'a'.repeat(32)}):new Response('event: error\ndata: "GPU quota exceeded"\n\n');
 await assert.rejects(()=>generate(selectScene([]),fetcher),/quota exceeded/);
});
test('configured token cannot silently use a paid tier',async()=>{
 const prior=process.env.HF_TOKEN;process.env.HF_TOKEN='test-only';
 try{let calls=0;await assert.rejects(()=>generate(selectScene([]),async()=>{calls++;return Response.json({isPro:true});}),/HF_FREE_ACCOUNT_REQUIRED/);assert.equal(calls,1);}finally{if(prior===undefined)delete process.env.HF_TOKEN;else process.env.HF_TOKEN=prior;}
});
