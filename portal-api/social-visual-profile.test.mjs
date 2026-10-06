import test from 'node:test';
import assert from 'node:assert/strict';
import {VISUAL_PROFILE_DEFAULT,validateVisualProfile,profileSignature,applyVisualProfile} from './social-visual-profile.mjs';
test('profile changes revoke automatic generation approval',()=>{
 const profile=validateVisualProfile({brandName:'Empresa Teste'}, {...VISUAL_PROFILE_DEFAULT,enabled:true,approvedPreviewId:'old'});
 assert.equal(profile.enabled,false);
 assert.equal(profile.approvedPreviewId,undefined);
 assert.equal(profile.brandName,'Empresa Teste');
 assert.notEqual(profileSignature(profile),profileSignature(VISUAL_PROFILE_DEFAULT));
});
test('format checks block untrusted palette and storage keys',()=>{
 assert.throws(()=>validateVisualProfile({palette:['red</svg>']}),/cores/);
 assert.throws(()=>validateVisualProfile({logoKey:'other-customer/logo.png'}),/logotipo/);
 assert.doesNotThrow(()=>validateVisualProfile({logoKey:'social-agent/media/123-abc.png'}));
});
test('prompt follows selected brand, product facts and theme',()=>{
 const plan={subject:'technician inspecting a gauge',camera:'wide view',light:'soft light',conceptKey:'abc'};
 const profile=validateVisualProfile({brandName:'Fábrica Aurora',products:'Sensores de pressão',palette:['#000000']});
 const result=applyVisualProfile(plan,profile,{title:'Inspeção de sensores'},{description:'Sensores com identificação QR'});
 assert.match(result.prompt,/Fábrica Aurora/);
 assert.match(result.prompt,/Sensores com identificação QR/);
 assert.match(result.prompt,/Inspeção de sensores/);
 assert.notEqual(result.conceptKey,applyVisualProfile(plan,VISUAL_PROFILE_DEFAULT,{title:'a'},{name:'b'}).conceptKey);
});
test('approval and version metadata do not change visual signature',()=>{
 assert.equal(profileSignature(VISUAL_PROFILE_DEFAULT),profileSignature({...VISUAL_PROFILE_DEFAULT,enabled:true,version:3,approvedAt:'now',approvedPreviewId:'id'}));
});
