import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from './server.mjs';
test('bridge preserves signed bytes, serializes delivery and propagates failures',async()=>{
 const calls=[];let active=0,maximum=0,fail=false;
 const env={WHATSAPP_SITE_ACCESS_TOKEN:'service-test',WHATSAPP_BRIDGE_KEY:'bridge-test',WHATSAPP_VERIFY_TOKEN:'verify-test'};
 const app=createApp(env,async(url,options)=>{active++;maximum=Math.max(active,maximum);calls.push({url,options});await new Promise(r=>setTimeout(r,10));active--;return new Response('{}',{status:fail?503:200})});
 await new Promise(r=>app.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.address().port;
 try{
  assert.equal((await(await fetch(base+'/health')).json()).whatsapp,'connection_available_real_test_pending');
  assert.equal(await(await fetch(base+'/webhook?hub.mode=subscribe&hub.verify_token=verify-test&hub.challenge=17')).text(),'17');
  const post=()=>fetch(base+'/webhook',{method:'POST',headers:{'X-Hub-Signature-256':'sha256='+'a'.repeat(64)},body:'{ "signed": true }'});
  assert.equal((await fetch(base+'/webhook',{method:'POST',body:'{}'})).status,403);assert.equal(calls.length,0);
  const responses=await Promise.all([post(),post()]);assert(responses.every(r=>r.status===200));assert.equal(maximum,1);
  assert.equal(calls[0].options.body.toString(),'{ "signed": true }');assert.equal(calls[0].options.headers['OAI-Sites-Authorization'],'Bearer service-test');assert.equal(calls[0].options.redirect,'error');
  fail=true;assert.equal((await post()).status,502);
 }finally{await new Promise(r=>app.close(r))}
});
