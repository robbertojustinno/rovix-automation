export type DroppedFile={file:File;path:string};
export type DroppedContent={files:DroppedFile[];directories:string[]};
type Entry={name:string;isFile:boolean;isDirectory:boolean;file:(success:(file:File)=>void,error:(error:DOMException)=>void)=>void;createReader:()=>{readEntries:(success:(entries:Entry[])=>void,error:(error:DOMException)=>void)=>void}};

// Capture entries synchronously: the browser clears DataTransfer after drop returns.
export function readDrop(data:DataTransfer):Promise<DroppedContent>{
  const entries=Array.from(data.items||[]).filter(item=>item.kind==="file").map(item=>({
    entry:(item as unknown as {webkitGetAsEntry?:()=>Entry|null}).webkitGetAsEntry?.(),
    file:item.getAsFile()
  }));
  const fallback=Array.from(data.files||[]);
  return (async()=>{
    const result:DroppedContent={files:[],directories:[]};
    let count=0;
    async function visit(entry:Entry,prefix="",depth=0):Promise<void>{
      if(++count>10000||depth>80)throw new Error("Selecione até 10 mil itens e no máximo 80 níveis de pastas.");
      const path=prefix+entry.name;
      if(entry.isFile){
        const file=await new Promise<File>((resolve,reject)=>entry.file(resolve,reject));
        result.files.push({file,path});
      }else if(entry.isDirectory){
        result.directories.push(path);
        const reader=entry.createReader();
        // Chromium returns directory children in batches, often of 100 entries.
        for(;;){
          const batch=await new Promise<Entry[]>((resolve,reject)=>reader.readEntries(resolve,reject));
          if(!batch.length)break;
          for(const child of batch)await visit(child,path+"/",depth+1);
        }
      }
    }
    if(entries.length){
      for(const {entry,file} of entries){
        if(entry)await visit(entry);
        else if(file)result.files.push({file,path:file.name});
        else throw new Error("Não foi possível ler este item. Use Enviar pasta ou Enviar arquivos.");
      }
    }else for(const file of fallback)result.files.push({file,path:file.webkitRelativePath||file.name});
    return result;
  })();
}
