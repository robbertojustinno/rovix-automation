import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {createManualPreviewApi} from "./social-manual-previews.mjs";

function response(){
  return {status:0,headers:{},body:null,writeHead(status,headers){this.status=status;this.headers=headers||{}},end(body){this.body=body}};
}
function json(res,status,data,extra={}){res.writeHead(status,{"Content-Type":"application/json",...extra});res.end(JSON.stringify(data));return data}

test("gera 3 prévias isoladas da agenda e da fila",async()=>{
  const db={
    projects:[{id:"rovix",active:true}],
    posts:[{id:"pending",status:"draft",driveFileId:"used-active"}],
    meta:{manualPreviewHistory:[{driveFileId:"used-history"}]}
  };
  const files=[
    {id:"used-active",name:"reservada.jpg",object_key:"owner/a.jpg"},
    {id:"a",name:"a.jpg",object_key:"owner/a1.jpg"},
    {id:"b",name:"b.jpg",object_key:"owner/b.jpg"},
    {id:"c",name:"c.jpg",object_key:"owner/c.jpg"},
    {id:"used-history",name:"z.jpg",object_key:"owner/z.jpg"}
  ];
  let saved=0,seq=0;
  const api=createManualPreviewApi({
    json,
    loadDriveCatalog:async()=>({files}),
    prepareManualArtwork:async({file,id})=>({id:id("manual-preview"),projectId:"rovix",title:"Título "+file.id,caption:"Legenda "+file.id,strategy:{hook:"Gancho "+file.id},driveFileId:file.id,driveFileName:file.name,imageKey:"preview/"+file.id+".jpg",createdAt:new Date().toISOString(),scheduledAt:"",status:"manual_preview"}),
    readManualImage:async()=>Buffer.from([1,2,3]),
    saveDb:async()=>{saved++},
    id:p=>p+"-"+(++seq)
  });
  const before=JSON.stringify(db.posts);
  const res=response();
  await api({method:"POST"},res,new URL("http://local/social-api/manual-previews/generate"),db);
  assert.equal(res.status,201);
  assert.equal(db.meta.manualPreviewBatch.entries.length,3);
  assert.equal(JSON.stringify(db.posts),before,"não pode criar nem alterar postagens agendadas");
  assert.ok(db.meta.manualPreviewBatch.entries.every(e=>e.status==="manual_preview"&&e.scheduledAt===""));
  assert.ok(!db.meta.manualPreviewBatch.entries.some(e=>e.driveFileId==="used-active"),"imagem reservada por postagem pendente não pode ser usada");
  assert.equal(saved,1);
});

test("download manual retorna JPG como anexo",async()=>{
  const db={meta:{manualPreviewBatch:{entries:[{id:"p1",imageKey:"x.jpg"}]}}};
  const api=createManualPreviewApi({
    json,
    loadDriveCatalog:async()=>({files:[]}),
    prepareManualArtwork:async()=>null,
    readManualImage:async()=>Buffer.from([255,216,255]),
    saveDb:async()=>{},
    id:x=>x
  });
  const res=response();
  await api({method:"GET"},res,new URL("http://local/social-api/manual-previews/p1/image?download=1"),db);
  assert.equal(res.status,200);
  assert.equal(res.headers["Content-Type"],"image/jpeg");
  assert.match(res.headers["Content-Disposition"],/attachment; filename="ROVIX-p1\.jpg"/);
});

test("implementação preserva 1080x1350 e ações do frontend",()=>{
  const backend=fs.readFileSync(new URL("./social-agent.mjs",import.meta.url),"utf8");
  const frontend=fs.readFileSync(new URL("./social-agent-public/manual-previews.js",import.meta.url),"utf8");
  const app=fs.readFileSync(new URL("./social-agent-public/app.js",import.meta.url),"utf8");
  assert.match(backend,/resize\(1080,1350/);
  assert.match(frontend,/navigator\.clipboard\.writeText/);
  assert.match(frontend,/Baixar JPG 1080×1350/);
  assert.match(frontend,/window\.manualPostPreset/);
  assert.match(app,/preset\?\.imageKey/);
});
