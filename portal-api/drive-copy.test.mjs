import {test} from "node:test";
import assert from "node:assert/strict";
import {copyDriveItem} from "./drive-copy.mjs";

class CopyObjectCommand{constructor(input){this.input=input}}
class DeleteObjectCommand{constructor(input){this.input=input}}

function fixture(failAt){
  const rows=[
    {id:"root",kind:"folder",name:"Projeto"},
    {id:"nested",kind:"folder",parent_id:"root",name:"Subpasta"},
    ...Array.from({length:1000},(_,i)=>({id:"unrelated-"+i,kind:"file"})),
    {id:"video",kind:"file",parent_id:"nested",name:"Aula 01.mp4",object_key:"owner/antigo/Aula 01.mp4",mime_type:"video/mp4",size_bytes:42},
    {id:"manual",kind:"file",parent_id:"root",name:"Manual.pdf",object_key:"owner/antigo/Manual.pdf",size_bytes:12}
  ];
  const calls=[];
  const options={
    user:{id:"owner"},token:"session",body:{item_id:"root"},
    maxBytes:1000,usedBytes:async()=>0,bucket:"drive",
    CopyObjectCommand,DeleteObjectCommand,safeName:name=>name,
    s3:()=>({send:async command=>{
      calls.push(command);
      if(failAt==="storage"&&command instanceof CopyObjectCommand&&command.input.CopySource.endsWith("Aula%2001.mp4"))throw new Error("missing");
    }}),
    supa:async (path,token,init)=>{
      assert.equal(token,"session");
      if(init?.method==="POST"){
        calls.push(JSON.parse(init.body));
        if(failAt==="metadata")throw Object.assign(new Error("rejected"),{status:400});
        return;
      }
      assert.match(path,/owner_id=eq.owner.*order=id.asc&limit=500/);
      const offset=Number(path.split("offset=").at(-1));
      return rows.slice(offset,offset+500);
    }
  };
  return {options,calls};
}

test("copies files found beyond the first 1000 rows and preserves nesting",async()=>{
  const {options,calls}=fixture();
  const result=await copyDriveItem(options);
  assert.equal(result.status,201);
  assert.equal(result.body.copied_items,4);
  const copied=calls.filter(call=>call instanceof CopyObjectCommand);
  assert.equal(copied.length,2);
  assert.ok(copied.some(call=>call.input.CopySource==="drive/owner/antigo/Aula%2001.mp4"));
  const records=calls.at(-1);
  const [root,nested]=records;
  const video=records.find(row=>row.name==="Aula 01.mp4");
  assert.equal(root.name,"Projeto - cópia");
  assert.equal(nested.parent_id,root.id);
  assert.equal(video.parent_id,nested.id);
  assert.equal(video.mime_type,"video/mp4");
  assert.ok(copied.some(call=>call.input.Key===video.object_key));
});

test("a failed object copy leaves no visible folders and cleans staged objects",async()=>{
  const {options,calls}=fixture("storage");
  assert.equal((await copyDriveItem(options)).status,502);
  assert.equal(calls.filter(Array.isArray).length,0);
  assert.equal(calls.filter(call=>call instanceof DeleteObjectCommand).length,2);
});

test("a rejected metadata insert cleans the staged objects",async()=>{
  const {options,calls}=fixture("metadata");
  assert.equal((await copyDriveItem(options)).status,502);
  assert.equal(calls.filter(Array.isArray).length,1);
  assert.equal(calls.filter(call=>call instanceof DeleteObjectCommand).length,2);
});
