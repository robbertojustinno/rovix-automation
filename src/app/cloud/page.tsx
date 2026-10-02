"use client";
import{ArrowLeft,CheckSquare,Download,FileText,Folder,HardDrive,Image as ImageIcon,Share2,Square,Upload}from"lucide-react";
import{useEffect,useMemo,useRef,useState}from"react";
import{useRouter}from"next/navigation";
import{authRest,getValidSession}from"@/services/rovix-auth";

type Item={
  id:string;
  kind:"file"|"folder";
  name:string;
  size_bytes:number;
  updated_at:string;
  parent_id?:string|null;
  mime_type?:string|null
};
type Usage={used_bytes:number;max_bytes:number;remaining_bytes:number};

const API=process.env.NEXT_PUBLIC_ROVIX_DRIVE_API||"";

export default function Cloud(){
  const router=useRouter();
  const inputRef=useRef<HTMLInputElement>(null);
  const folderInputRef=useRef<HTMLInputElement>(null);
  const[items,setItems]=useState<Item[]>([]);
  const[usage,setUsage]=useState<Usage>({used_bytes:0,max_bytes:10*1024*1024*1024,remaining_bytes:10*1024*1024*1024});
  const[loading,setLoading]=useState(true);
  const[busy,setBusy]=useState(false);
  const[msg,setMsg]=useState("");
  const[currentFolder,setCurrentFolder]=useState<string|null>(null);
  const[folderStack,setFolderStack]=useState<Item[]>([]);
  const[selected,setSelected]=useState<Set<string>>(new Set());
  const[thumbs,setThumbs]=useState<Record<string,string>>({});
  const[shareItem,setShareItem]=useState<Item|null>(null);
  const[shareHours,setShareHours]=useState(24);
  const[shareUrl,setShareUrl]=useState("");

  async function api(path:string,init:RequestInit={}){
    const s=await getValidSession();
    if(!s)throw new Error("AUTH_REQUIRED");
    if(!API)throw new Error("API_NOT_CONFIGURED");
    const r=await fetch(API+path,{
      ...init,
      headers:{
        Authorization:"Bearer "+s.access_token,
        "Content-Type":"application/json",
        ...(init.headers||{})
      }
    });
    const body=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(body.error||"Falha no ROVIX Drive.");
    return body;
  }

  async function load(){
    setLoading(true);setMsg("");
    try{
      const s=await getValidSession();
      if(!s){router.replace("/login");return}
      const profile=await authRest("rovix_profiles?select=role");
      if(profile?.[0]?.role!=="admin"){router.replace("/minha-conta");return}
      const parent=currentFolder?"parent_id=eq."+currentFolder:"parent_id=is.null";
      const data=await authRest("rovix_files?select=id,kind,name,size_bytes,updated_at,parent_id,mime_type&"+parent+"&order=kind.desc,name.asc");
      const list=Array.isArray(data)?data as Item[]:[];
      setItems(list);
      setSelected(new Set());
      setThumbs({});
      if(API){
        const u=await api("/usage");
        setUsage(u);
        const images=list.filter(i=>i.kind==="file"&&String(i.mime_type||"").startsWith("image/"));
        const pairs=await Promise.all(images.map(async item=>{
          try{
            const p=await api("/preview-url",{method:"POST",body:JSON.stringify({file_id:item.id})});
            return [item.id,p.preview_url] as const;
          }catch{return null}
        }));
        const map:Record<string,string>={};
        for(const pair of pairs)if(pair)map[pair[0]]=pair[1];
        setThumbs(map);
      }
    }catch(e){
      if(e instanceof Error&&e.message==="AUTH_REQUIRED"){router.replace("/login");return}
      setMsg(e instanceof Error?e.message:"Falha ao carregar o Drive.");
    }finally{setLoading(false)}
  }

  useEffect(()=>{load()},[currentFolder]);
  const usedGb=usage.used_bytes/1073741824;
  const pct=useMemo(()=>Math.min(100,usage.used_bytes/usage.max_bytes*100),[usage]);
  const selectedItems=useMemo(()=>items.filter(i=>selected.has(i.id)),[items,selected]);
  const allSelected=items.length>0&&selected.size===items.length;

  function openFolder(item:Item){
    setFolderStack(s=>[...s,item]);
    setCurrentFolder(item.id);
  }
  function goUp(){
    if(!currentFolder)return;
    setFolderStack(s=>{
      const next=s.slice(0,-1);
      setCurrentFolder(next.length?next[next.length-1].id:null);
      return next;
    });
  }
  function goToCrumb(index:number){
    if(index<0){setFolderStack([]);setCurrentFolder(null);return}
    setFolderStack(s=>{
      const next=s.slice(0,index+1);
      setCurrentFolder(next[index]?.id||null);
      return next;
    });
  }
  function toggleSelected(id:string){
    setSelected(prev=>{
      const next=new Set(prev);
      if(next.has(id))next.delete(id);else next.add(id);
      return next;
    });
  }
  function toggleAll(){
    setSelected(allSelected?new Set():new Set(items.map(i=>i.id)));
  }

  async function createFolder(){
    const name=window.prompt("Nome da nova pasta:");
    if(!name)return;
    setBusy(true);setMsg("");
    try{
      await api("/folders",{method:"POST",body:JSON.stringify({name,parent_id:currentFolder})});
      await load();
    }catch(e){setMsg(e instanceof Error?e.message:"Falha ao criar pasta.")}
    finally{setBusy(false)}
  }

  async function createFolderAt(name:string,parentId:string|null){
    const r=await api("/folders",{method:"POST",body:JSON.stringify({name,parent_id:parentId})});
    return r.item as Item;
  }

  async function uploadOne(file:File,parentId:string|null=currentFolder){
    const u=await api("/upload-url",{method:"POST",body:JSON.stringify({
      name:file.name,size:file.size,mime_type:file.type||"application/octet-stream",parent_id:parentId
    })});
    const put=await fetch(u.upload_url,{
      method:"PUT",
      headers:{"Content-Type":file.type||"application/octet-stream"},
      body:file
    });
    if(!put.ok)throw new Error('Falha ao enviar "'+file.name+'" para o armazenamento.');
    await api("/complete-upload",{method:"POST",body:JSON.stringify({
      name:file.name,size:file.size,mime_type:file.type||"application/octet-stream",
      parent_id:parentId,object_key:u.object_key
    })});
  }

  async function uploadFiles(files:FileList|File[]){
    const selectedFiles=Array.from(files);
    if(!selectedFiles.length)return;
    setBusy(true);setMsg("");
    let sent=0;
    const failed:string[]=[];
    try{
      for(let i=0;i<selectedFiles.length;i++){
        const file=selectedFiles[i];
        setMsg(`Enviando ${i+1} de ${selectedFiles.length}: ${file.name}`);
        try{await uploadOne(file);sent++}
        catch(e){
          failed.push(file.name);
          if(e instanceof Error&&/quota|limit|exceed|storage/i.test(e.message))break;
        }
      }
      setMsg(failed.length===0
        ?`${sent} arquivo${sent===1?"":"s"} enviado${sent===1?"":"s"} com sucesso.`
        :`${sent} enviado${sent===1?"":"s"}; ${failed.length} falhou/falharam: ${failed.join(", ")}`);
      await load();
    }catch(e){setMsg(e instanceof Error?e.message:"Falha no upload.")}
    finally{setBusy(false);if(inputRef.current)inputRef.current.value=""}
  }

  async function uploadFolder(files:FileList){
    const selectedFiles=Array.from(files);
    if(!selectedFiles.length)return;
    setBusy(true);setMsg("");
    const folderCache=new Map<string,string|null>();
    folderCache.set("",currentFolder);
    let sent=0;
    const failed:string[]=[];
    try{
      for(let i=0;i<selectedFiles.length;i++){
        const file=selectedFiles[i] as File & {webkitRelativePath?:string};
        const rel=file.webkitRelativePath||file.name;
        const parts=rel.split("/").filter(Boolean);
        const fileName=parts.pop()||file.name;
        let path="";
        let parentId=currentFolder;
        for(const part of parts){
          const nextPath=path?path+"/"+part:part;
          if(folderCache.has(nextPath)){
            parentId=folderCache.get(nextPath)??currentFolder;
          }else{
            const folder=await createFolderAt(part,parentId);
            parentId=folder.id;
            folderCache.set(nextPath,parentId);
          }
          path=nextPath;
        }
        setMsg("Enviando pasta: "+(i+1)+" de "+selectedFiles.length+" — "+rel);
        try{
          const renamed=new File([file],fileName,{type:file.type,lastModified:file.lastModified});
          await uploadOne(renamed,parentId);
          sent++;
        }catch{failed.push(rel)}
      }
      setMsg(failed.length?sent+" arquivos enviados; "+failed.length+" falharam.":"Pasta enviada com sucesso: "+sent+" arquivos.");
      await load();
    }catch(e){setMsg(e instanceof Error?e.message:"Falha ao enviar a pasta.")}
    finally{setBusy(false);if(folderInputRef.current)folderInputRef.current.value=""}
  }

  async function pickTarget(excludedIds:Set<string>){
    const folders=await authRest("rovix_files?kind=eq.folder&select=id,name,parent_id&order=name.asc") as Item[];
    const filtered=folders.filter(f=>!excludedIds.has(f.id));
    const options=["0 - Raiz",...filtered.map((f,i)=>(i+1)+" - "+f.name)];
    const answer=window.prompt("Escolha a pasta de destino:\n\n"+options.join("\n")+"\n\nDigite o número do destino:","0");
    if(answer===null)return undefined;
    const n=Number(answer);
    if(!Number.isInteger(n)||n<0||n>filtered.length)throw new Error("Destino inválido.");
    return n===0?null:filtered[n-1].id;
  }

  async function chooseTarget(item:Item,mode:"move"|"copy"){
    setBusy(true);setMsg("");
    try{
      const target=await pickTarget(new Set([item.id]));
      if(target===undefined)return;
      await api(mode==="move"?"/move":"/copy",{method:"POST",body:JSON.stringify({item_id:item.id,target_parent_id:target})});
      setMsg(mode==="move"?"Item movido.":"Cópia criada.");
      await load();
    }catch(e){setMsg(e instanceof Error?e.message:"Operação não concluída.")}
    finally{setBusy(false)}
  }

  async function bulkTarget(mode:"move"|"copy"){
    if(!selectedItems.length)return;
    setBusy(true);setMsg("");
    try{
      const target=await pickTarget(new Set(selectedItems.map(i=>i.id)));
      if(target===undefined)return;
      for(const item of selectedItems){
        await api(mode==="move"?"/move":"/copy",{method:"POST",body:JSON.stringify({item_id:item.id,target_parent_id:target})});
      }
      setMsg(`${selectedItems.length} itens ${mode==="move"?"movidos":"copiados"}.`);
      await load();
    }catch(e){setMsg(e instanceof Error?e.message:"Operação em lote não concluída.")}
    finally{setBusy(false)}
  }

  async function bulkDelete(){
    if(!selectedItems.length)return;
    if(!window.confirm(`Excluir ${selectedItems.length} itens selecionados?`))return;
    setBusy(true);setMsg("");
    try{
      for(const item of selectedItems){
        await api("/files/"+encodeURIComponent(item.id),{method:"DELETE"});
      }
      setMsg(`${selectedItems.length} itens excluídos.`);
      await load();
    }catch(e){setMsg(e instanceof Error?e.message:"Falha ao excluir itens.")}
    finally{setBusy(false)}
  }

  async function download(item:Item){
    setBusy(true);setMsg("");
    try{
      const d=await api("/download-url",{method:"POST",body:JSON.stringify({file_id:item.id})});
      window.location.href=d.download_url;
    }catch(e){setMsg(e instanceof Error?e.message:"Falha no download.")}
    finally{setBusy(false)}
  }

  async function generateShare(){
    if(!shareItem)return;
    setBusy(true);setMsg("");setShareUrl("");
    try{
      const d=await api("/share-url",{method:"POST",body:JSON.stringify({file_id:shareItem.id,hours:shareHours})});
      setShareUrl(d.share_url);
    }catch(e){setMsg(e instanceof Error?e.message:"Falha ao compartilhar.")}
    finally{setBusy(false)}
  }

  async function copyShare(){
    if(!shareUrl)return;
    try{await navigator.clipboard.writeText(shareUrl);setMsg("Link de compartilhamento copiado.")}
    catch{setMsg("Não foi possível copiar o link.")}
  }

  async function rename(item:Item){
    const name=window.prompt("Novo nome:",item.name);
    if(!name||name===item.name)return;
    setBusy(true);setMsg("");
    try{await api("/files",{method:"PATCH",body:JSON.stringify({id:item.id,name})});await load()}
    catch(e){setMsg(e instanceof Error?e.message:"Falha ao renomear.")}
    finally{setBusy(false)}
  }

  async function remove(item:Item){
    if(!window.confirm('Excluir "'+item.name+'"?'))return;
    setBusy(true);setMsg("");
    try{await api("/files/"+encodeURIComponent(item.id),{method:"DELETE"});await load()}
    catch(e){setMsg(e instanceof Error?e.message:"Falha ao excluir.")}
    finally{setBusy(false)}
  }

  function actions(item:Item){
    if(item.kind==="folder"){
      return <div className="fileActions">
        <button onClick={()=>openFolder(item)}>Abrir</button>
        <button onClick={()=>chooseTarget(item,"copy")}>Copiar</button>
        <button onClick={()=>chooseTarget(item,"move")}>Mover</button>
        <button onClick={()=>rename(item)}>Renomear</button>
        <button onClick={()=>remove(item)}>Excluir</button>
      </div>
    }
    return <div className="fileActions">
      <button onClick={()=>download(item)}><Download size={16}/> Baixar</button>
      <button onClick={()=>{setShareItem(item);setShareHours(24);setShareUrl("")}}><Share2 size={16}/> Compartilhar</button>
      <button onClick={()=>chooseTarget(item,"copy")}>Copiar</button>
      <button onClick={()=>chooseTarget(item,"move")}>Mover</button>
      <button onClick={()=>rename(item)}>Renomear</button>
      <button onClick={()=>remove(item)}>Excluir</button>
    </div>
  }

  return <><section className="portalHero"><span className="kicker">ROVIX Drive</span><h1>Seus arquivos na nuvem.</h1><p>Área privada para documentos, manuais, projetos, backups e arquivos pessoais — sem precisar deixar um computador ligado.</p></section>

  <div className="portalToolbar">
    <input ref={inputRef} type="file" multiple hidden onChange={e=>{if(e.target.files?.length)uploadFiles(e.target.files)}}/>
    <input ref={el=>{folderInputRef.current=el;if(el)el.setAttribute("webkitdirectory","")}} type="file" multiple hidden onChange={e=>{if(e.target.files?.length)uploadFolder(e.target.files)}}/>
    <button className="button" type="button" disabled={busy||!API} onClick={()=>inputRef.current?.click()}><Upload/> Enviar arquivos</button>
    <button className="button secondary" type="button" disabled={busy||!API} onClick={()=>folderInputRef.current?.click()}><Upload/> Enviar pasta</button>
    <button className="button secondary" type="button" disabled={busy||!API} onClick={createFolder}>Nova pasta</button>
    <span className="portalBadge"><HardDrive/> {usedGb.toFixed(2)} GB de 10 GB</span>
  </div>

  <section className="fileTable">
    <div className="driveNav">
      <button className="driveBack" type="button" onClick={goUp} disabled={!currentFolder} title="Voltar um diretório acima"><ArrowLeft size={18}/></button>
      <div className="driveBreadcrumb">
        <button type="button" onClick={()=>goToCrumb(-1)}>Meu Drive</button>
        {folderStack.map((f,i)=><span key={f.id}>› <button type="button" onClick={()=>goToCrumb(i)}>{f.name}</button></span>)}
      </div>
    </div>
    <div className="storageBar" aria-label="Uso do armazenamento"><i style={{width:pct+"%"}}/></div>
    {msg&&<p className="portalMessage">{msg}</p>}

    {selected.size>0&&<div className="bulkBar">
      <strong>{selected.size} item{selected.size===1?"":"s"} selecionado{selected.size===1?"":"s"}</strong>
      <div>
        <button type="button" onClick={()=>bulkTarget("copy")} disabled={busy}>Copiar</button>
        <button type="button" onClick={()=>bulkTarget("move")} disabled={busy}>Mover</button>
        <button type="button" onClick={bulkDelete} disabled={busy}>Excluir</button>
        <button type="button" onClick={()=>setSelected(new Set())}>Limpar seleção</button>
      </div>
    </div>}

    <div className="fileRow header">
      <button className="selectBox" type="button" onClick={toggleAll} title={allSelected?"Desmarcar todos":"Selecionar todos"}>
        {allSelected?<CheckSquare size={18}/>:<Square size={18}/>}
      </button>
      <span>Nome</span><span>Tamanho</span><span>Modificado</span><span>Ações</span>
    </div>

    {loading?<div className="fileRow loadingRow"><span/><div className="fileName"><FileText/><span>Carregando...</span></div></div>:
    items.length===0?<div className="fileRow emptyRow"><span/><div className="fileName"><Folder/><span>Esta pasta está vazia.</span></div><span>—</span><span>—</span><span>Privado</span></div>:
    items.map(item=><div className={"fileRow "+(selected.has(item.id)?"selected":"")} key={item.id}>
      <button className="selectBox" type="button" onClick={()=>toggleSelected(item.id)} aria-label={"Selecionar "+item.name}>
        {selected.has(item.id)?<CheckSquare size={18}/>:<Square size={18}/>}
      </button>
      <div className="fileName">
        <span className="fileThumb">
          {item.kind==="folder"?<Folder/>:thumbs[item.id]?<img src={thumbs[item.id]} alt=""/>:String(item.mime_type||"").startsWith("image/")?<ImageIcon/>:<FileText/>}
        </span>
        <button className="fileTitle" type="button" onDoubleClick={()=>item.kind==="folder"&&openFolder(item)}>{item.name}</button>
      </div>
      <span>{item.kind==="folder"?"—":formatBytes(item.size_bytes)}</span>
      <span>{new Date(item.updated_at).toLocaleDateString("pt-BR")}</span>
      <span>{actions(item)}</span>
    </div>)}
  </section>

  {shareItem&&<div className="shareOverlay" role="dialog" aria-modal="true">
    <div className="shareDialog">
      <div className="shareHead"><div><span className="kicker">Compartilhar arquivo</span><h2>{shareItem.name}</h2></div><button className="shareClose" type="button" onClick={()=>{setShareItem(null);setShareUrl("")}}>×</button></div>
      <p className="muted">O arquivo continua privado. O link deixa de funcionar automaticamente quando expirar.</p>
      <div className="shareChoices">
        {[1,24,168].map(h=><button key={h} className={shareHours===h?"shareChoice active":"shareChoice"} type="button" onClick={()=>{setShareHours(h);setShareUrl("")}}>{h===1?"1 hora":h===24?"24 horas":"7 dias"}</button>)}
      </div>
      {!shareUrl?<button className="button" type="button" disabled={busy} onClick={generateShare}><Share2/> {busy?"Gerando...":"Gerar link"}</button>:
      <div className="shareResult"><input readOnly value={shareUrl}/><button className="button" type="button" onClick={copyShare}>Copiar link</button></div>}
    </div>
  </div>}
  <p className="portalNote">{API?"ROVIX Drive pronto para uso.":"Backend do ROVIX Drive ainda não configurado."}</p></>
}
function formatBytes(n:number){if(n<1024)return n+" B";if(n<1048576)return (n/1024).toFixed(1)+" KB";if(n<1073741824)return (n/1048576).toFixed(1)+" MB";return (n/1073741824).toFixed(2)+" GB"}
