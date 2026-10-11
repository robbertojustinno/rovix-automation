import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {createApp} from './server.mjs';
import {defaults} from './engine.mjs';
test('challenge, signatures, duplicate delivery, human handoff and wrong phone',async()=>{
 const sent=[];const env={META_APP_SECRET:'test-secret',WHATSAPP_VERIFY_TOKEN:'test-verify',WHATSAPP_ACCESS_TOKEN:'test-access',WHATSAPP_PHONE_NUMBER_ID:'12345',BOT_ENABLED:'true',BOT_CONFIG_JSON:JSON.stringify(defaults)};
 const app=createApp(env,async(url,options)=>{sent.push(JSON.parse(options.body));return new Response('{}',{status:200});});
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+app.address().port;
 try{
  assert.equal(await(await fetch(base+'/webhook?hub.mode=subscribe&hub.verify_token=test-verify&hub.challenge=42')).text(),'42');
  assert.equal((await fetch(base+'/webhook?hub.mode=subscribe&hub.verify_token=bad')).status,403);
  const payload=(id,text,phone='12345')=>({object:'whatsapp_business_account',entry:[{changes:[{field:'messages',value:{metadata:{phone_number_id:phone},messages:[{id,from:'5521000000000',timestamp:String(Math.floor(Date.now()/1000)),type:'text',text:{body:text}}]}}]}]});
  const post=async(p,valid=true)=>{const body=JSON.stringify(p);return fetch(base+'/webhook',{method:'POST',headers:{'X-Hub-Signature-256':valid?'sha256='+createHmac('sha256',env.META_APP_SECRET).update(body).digest('hex'):'sha256=bad'},body});};
  assert.equal((await post(payload('a','oi'),false)).status,403);assert.equal(sent.length,0);
  assert.equal((await post(payload('a','oi'))).status,200);assert.equal(sent.length,1);
  await post(payload('a','oi'));assert.equal(sent.length,1);
  await post(payload('b','3'));assert.equal(sent.length,2);assert.equal(sent[1].text.body,defaults.handoff);
  await post(payload('c','oi'));assert.equal(sent.length,2);
  await post(payload('d','oi','987'));assert.equal(sent.length,2);
  assert.equal((await fetch(base+'/oauth/meta/callback?code=do-not-use')).status,503);
 }finally{await new Promise(resolve=>app.close(resolve));}
});
test('server readiness never implies messages validated',async()=>{
 const app=createApp({});await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 try{const base='http://127.0.0.1:'+app.address().port;const r=await(await fetch(base+'/health')).json();assert.equal(r.whatsapp,'pending_configuration');assert.equal((await fetch(base+'/webhook',{method:'POST',body:'{}'})).status,503);}finally{await new Promise(resolve=>app.close(resolve));}
});
