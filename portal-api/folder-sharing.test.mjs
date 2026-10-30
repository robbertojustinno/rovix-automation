import {test} from 'node:test';
import assert from 'node:assert/strict';
import {collectFolderFiles,handleFolderSharing,serveFolderShare,shareKey} from './folder-sharing.mjs';

const root={id:'root',name:'Projetos',kind:'folder',owner_id:'owner'};
const child=(id,parent_id,kind='file',owner_id='owner')=>({id,parent_id,kind,owner_id,name:id,object_key:'private/'+id,size_bytes:42});
test('only traverses selected owner subtree including nested files',async()=>{
  const tree={root:[child('sub','root','folder'),child('one','root'),child('foreign','root','folder','other')],sub:[child('two','sub'),child('outside','unrelated')]};
  const files=await collectFolderFiles(root,'owner',async id=>tree[id]||[]);
  assert.deepEqual(files.map(f=>f.path),['one','sub/two']);
  await assert.rejects(collectFolderFiles(root,'other',async()=>[]),/folder_not_found/);
});
test('rejects cycles rather than following them indefinitely',async()=>{
  await assert.rejects(collectFolderFiles(root,'owner',async()=>[child('root','root','folder')]),/invalid_folder_tree/);
});
test('share creation paginates, signs only subtree and persists opaque expiring snapshot',async()=>{
  const calls=[],objects=[];
  class Command{constructor(input){this.input=input}}
  const supa=async path=>{
    calls.push(path);
    if(path.includes('kind=eq.folder'))return [root];
    if(path.includes('offset=0'))return Array.from({length:500},(_,i)=>child('file'+i,'root'));
    return [child('last','root')];
  };
  let result;
  await handleFolderSharing({}, {},{user:{id:'owner'},token:'session',body:{file_id:'root',hours:1},supa,s3:()=>({send:async command=>objects.push(command.input)}),GetObjectCommand:Command,PutObjectCommand:Command,getSignedUrl:async(_client,command,options)=>{assert.equal(options.expiresIn,3600);return 'https://storage.test/'+command.input.Key},bucket:'bucket',reply:(_res,status,body)=>{assert.equal(status,200);result=body},origin:'https://drive.test'});
  assert.ok(calls.some(path=>path.includes('offset=500')));
  assert.match(result.share_url,/^\/shared\/folders\/[a-f0-9]{64}$/);
  const snapshot=JSON.parse(objects[0].Body);
  assert.equal(snapshot.entries.length,501);
  assert.equal(snapshot.entries[500].path,'last');
  assert.ok(Date.parse(snapshot.expiresAt)>Date.now());
  assert.ok(!objects[0].Body.includes('session'));
});
test('missing or foreign root cannot produce a share',async()=>{
  let status;
  await handleFolderSharing({}, {},{user:{id:'owner'},token:'session',body:{file_id:'foreign'},supa:async path=>{assert.ok(path.includes('owner_id=eq.owner'));return []},reply:(_res,s)=>status=s});
  assert.equal(status,404);
});
function response(){return {writeHead(status,headers){this.status=status;this.headers=headers},end(body){this.body=body}}}
const token='a'.repeat(64);
test('public view enforces expiry and hides metadata from invalid tokens',async()=>{
  const res=response();
  await serveFolderShare({url:'/shared/folders/'+token,method:'GET'},res,{s3:()=>({send:async()=>({Body:{transformToString:async()=>JSON.stringify({expiresAt:new Date(0).toISOString(),entries:[]})}})}),GetObjectCommand:class{},bucket:'bucket'});
  assert.equal(res.status,410);
  const invalid=response();
  await serveFolderShare({url:'/shared/folders/guess',method:'GET'},invalid,{});
  assert.equal(invalid.status,404);
  assert.equal(shareKey('../secret'),null);
});
test('public folder page escapes names and URLs and forbids caching and embedding',async()=>{
  const res=response();
  const share={name:'<script>alert(1)</script>',expiresAt:new Date(Date.now()+60000).toISOString(),entries:[{path:'<img src=x>',url:'https://storage.test/file?a=1&b=2'}]};
  await serveFolderShare({url:'/shared/folders/'+token,method:'GET'},res,{s3:()=>({send:async()=>({Body:{transformToString:async()=>JSON.stringify(share)}})}),GetObjectCommand:class{},bucket:'bucket'});
  assert.equal(res.status,200);
  assert.ok(!res.body.includes('<script>'));
  assert.ok(res.body.includes('&lt;img src=x&gt;'));
  assert.ok(res.body.includes('a=1&amp;b=2'));
  assert.equal(res.headers['Cache-Control'],'no-store');
  assert.equal(res.headers['Referrer-Policy'],'no-referrer');
  assert.ok(res.headers['Content-Security-Policy'].includes("frame-ancestors 'none'"));
});
