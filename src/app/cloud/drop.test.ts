import{describe,it,expect}from"vitest";
import{readDrop}from"./drop";

const file=(name:string)=>new File([name],name);
function leaf(name:string){return {name,isFile:true,isDirectory:false,file:(success:(value:File)=>void)=>success(file(name))}}
function directory(name:string,batches:unknown[][]){return {name,isFile:false,isDirectory:true,createReader:()=>{let i=0;return{readEntries:(success:(value:unknown[])=>void)=>success(batches[i++]||[])}}}}
function transfer(entries:unknown[],files:File[]=[]){return {items:entries.map(entry=>({kind:"file",webkitGetAsEntry:()=>entry,getAsFile:()=>null})),files} as unknown as DataTransfer}

describe("Drive drop reader",()=>{
  it("preserves hierarchy and empty folders across every directory batch",async()=>{
    const folder=directory("Projetos",[[leaf("a.pdf"),directory("Vazia",[])],[directory("Sub",[[leaf("b.txt")]])]]);
    const result=await readDrop(transfer([folder,leaf("solto.txt")]));
    expect(result.directories).toEqual(["Projetos","Projetos/Vazia","Projetos/Sub"]);
    expect(result.files.map(item=>item.path)).toEqual(["Projetos/a.pdf","Projetos/Sub/b.txt","solto.txt"]);
  });
  it("captures all browser entries before asynchronous traversal",async()=>{
    const data=transfer([directory("Pasta",[[leaf("dentro.txt")]]),leaf("fora.txt")]);
    const pending=readDrop(data);
    Object.defineProperty(data,"items",{value:[]});
    expect((await pending).files.map(item=>item.path)).toEqual(["Pasta/dentro.txt","fora.txt"]);
  });
  it("falls back to regular files when the directory API is unavailable",async()=>{
    const one=file("um.txt"),two=file("dois.pdf");
    const data={items:[{kind:"file",getAsFile:()=>one},{kind:"file",getAsFile:()=>two}],files:[one,two]} as unknown as DataTransfer;
    expect((await readDrop(data)).files.map(item=>item.path)).toEqual(["um.txt","dois.pdf"]);
    expect((await readDrop({files:[one]} as unknown as DataTransfer)).files[0].file).toBe(one);
  });
  it("rejects unreadable entries without silently skipping files",async()=>{
    const entry={name:"negado",isFile:true,file:(_success:unknown,error:(reason:Error)=>void)=>error(new Error("Acesso negado"))};
    await expect(readDrop(transfer([entry]))).rejects.toThrow("Acesso negado");
  });
  it("ignores dragged text and links",async()=>{
    const data={items:[{kind:"string"}],files:[]} as unknown as DataTransfer;
    expect(await readDrop(data)).toEqual({files:[],directories:[]});
  });
});
