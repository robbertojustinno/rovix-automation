"use client";
import{Download,FileText,Folder,HardDrive,MoreVertical,Upload}from"lucide-react";
import{useEffect,useMemo,useRef,useState}from"react";
import{useRouter}from"next/navigation";
import{authRest,getValidSession}from"@/services/rovix-auth";

type Item={id:string;kind:"file"|"folder";name:string;size_bytes:number;updated_at:string;parent_id?:string|null};
type Usage={used_bytes:number;max_bytes:number;remaining_bytes:number};

const API=process.env.NEXT_PUBLIC_ROVIX_DRIVE_API||"";

export default function Cloud(){
  const router=useRouter();
  const inputRef=useRef<HTMLInputElement>(null);
  const[items,setItems]=useState<Item[]>([]);
  const[usage,setUsage]=useState<Usage>({used_bytes:0,max_bytes:10*1024*1024*1024,remaining_bytes:10*1024*1024*1024});
  const[loading,setLoading]=useState(true);
  const[busy,setBusy]=useState(false);
  const[msg,setMsg]=useState("");
  const[currentFolder,setCurrentFolder]=useState<string|null>(null);

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
      const data=await authRest("rovix_files?select=id,kind,name,size_bytes,updated_at,parent_id&"+parent+"&order=kind.desc,name.asc");
      setItems(Array.isArray(data)?data:[]);
      if(API){
        const u=await api("/usage");
        setUsage(u);
      }
    }catch(e){
      if(e instanceof Error&&e.message==="AUTH_REQUIRED"){router.replace("/login");return}
      setMsg(e instanceof Error?e.message:"Falha ao carregar o Drive.");
    }finally{setLoading(false)}
  }

  useEffect(()=>{load()},[currentFolder]);
  const usedGb=usage.used_bytes/1073741824;
  const pct=useMemo(()=>Math.min(100,usage.used_bytes/usage.max_bytes*100),[usage]);

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

  async function uploadFile(file:File){
    setBusy(true);setMsg("Preparando upload...");
    try{
      const u=await api("/upload-url",{method:"POST",body:JSON.stringify({
        name:file.name,size:file.size,mime_type:file.type||"application/octet-stream",parent_id:currentFolder
      })});
      const put=await fetch(u.upload_url,{
        method:"PUT",
        headers:{"Content-Type":file.type||"application/octet-stream"},
        body:file
      });
      if(!put.ok)throw new Error("Falha ao enviar o arquivo para o armazenamento.");
      await api("/complete-upload",{method:"POST",body:JSON.stringify({
        name:file.name,size:file.size,mime_type:file.type||"application/octet-stream",
        parent_id:currentFolder,object_key:u.object_key
      })});
      setMsg("Upload concluído.");
      await load();
    }catch(e){setMsg(e instanceof Error?e.message:"Falha no upload.")}
    finally{setBusy(false);if(inputRef.current)inputRef.current.value=""}
  }

  async function download(item:Item){
    setBusy(true);setMsg("");
    try{
      const d=await api("/download-url",{method:"POST",body:JSON.stringify({file_id:item.id})});
      window.location.href=d.download_url;
    }catch(e){setMsg(e instanceof Error?e.message:"Falha no download.")}
    finally{setBusy(false)}
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
        <button onClick={()=>setCurrentFolder(item.id)}>Abrir</button>
        <button onClick={()=>rename(item)}>Renomear</button>
        <button onClick={()=>remove(item)}>Excluir</button>
      </div>
    }
    return <div className="fileActions">
      <button onClick={()=>download(item)}><Download size={16}/> Baixar</button>
      <button onClick={()=>rename(item)}>Renomear</button>
      <button onClick={()=>remove(item)}>Excluir</button>
    </div>
  }

  return <><section className="portalHero"><span className="kicker">ROVIX Drive</span><h1>Seus arquivos na nuvem.</h1><p>Área privada para documentos, manuais, projetos, backups e arquivos pessoais — sem precisar deixar um computador ligado.</p></section>
  <div className="portalToolbar">
    <input ref={inputRef} type="file" hidden onChange={e=>{const f=e.target.files?.[0];if(f)uploadFile(f)}}/>
    <button className="button" type="button" disabled={busy||!API} onClick={()=>inputRef.current?.click()}><Upload/> Enviar arquivo</button>
    <button className="button secondary" type="button" disabled={busy||!API} onClick={createFolder}>Nova pasta</button>
    {currentFolder&&<button className="button secondary" type="button" onClick={()=>setCurrentFolder(null)}>Voltar à raiz</button>}
    <span className="portalBadge"><HardDrive/> {usedGb.toFixed(2)} GB de 10 GB</span>
  </div>
  <section className="fileTable">
    <div className="storageBar" aria-label="Uso do armazenamento"><i style={{width:pct+"%"}}/></div>
    {msg&&<p className="portalMessage">{msg}</p>}
    <div className="fileRow header"><span>Nome</span><span>Tamanho</span><span>Modificado</span><span>Ações</span></div>
    {loading?<div className="fileRow"><div className="fileName"><FileText/><span>Carregando...</span></div></div>:
    items.length===0?<div className="fileRow"><div className="fileName"><Folder/><span>Esta pasta está vazia.</span></div><span>—</span><span>—</span><span>Privado</span></div>:
    items.map(item=><div className="fileRow" key={item.id}>
      <div className="fileName">{item.kind==="folder"?<Folder/>:<FileText/>}<span>{item.name}</span></div>
      <span>{item.kind==="folder"?"—":formatBytes(item.size_bytes)}</span>
      <span>{new Date(item.updated_at).toLocaleDateString("pt-BR")}</span>
      <span>{actions(item)}</span>
    </div>)}
  </section>
  <p className="portalNote">{API?"ROVIX Drive pronto para uso assim que as credenciais privadas do R2 forem configuradas no backend.":"Backend do ROVIX Drive ainda não configurado."}</p></>
}
function formatBytes(n:number){if(n<1024)return n+" B";if(n<1048576)return (n/1024).toFixed(1)+" KB";if(n<1073741824)return (n/1048576).toFixed(1)+" MB";return (n/1073741824).toFixed(2)+" GB"}