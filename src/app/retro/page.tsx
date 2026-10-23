"use client";
import {useEffect,useRef,useState} from "react";
import {authRest,getValidSession} from "@/services/rovix-auth";
type System="megadrive"|"snes"|"atari2600"|"arcade";
type Entry={id:string;name:string;kind:"file"|"folder";parent_id:string|null;size_bytes?:number};
type Game={id:string;name:string;system:System;size:number};
const systems:{id:System;name:string;core:string}[]=[
{id:"megadrive",name:"Mega Drive",core:"segaMD"},
{id:"snes",name:"Super Nintendo",core:"snes"},
{id:"atari2600",name:"Atari 2600",core:"atari2600"},
{id:"arcade",name:"Arcade / WinKawaks",core:"arcade"}
];
const DRIVE_API=process.env.NEXT_PUBLIC_ROVIX_DRIVE_API||"https://rovix-drive-api.onrender.com";
function detect(name:string):System|null{
 const n=name.toLowerCase();
 if(n.includes("megadrive")||n.includes("mega drive")||n.includes("genesis"))return "megadrive";
 if(n.includes("snes")||n.includes("super nintendo"))return "snes";
 if(n.includes("atari"))return "atari2600";
 if(n.includes("arcade")||n.includes("kawaks")||n.includes("cps")||n.includes("neogeo"))return "arcade";
 return null;
}
function supported(name:string,s:System):boolean{
 const ext=name.slice(name.lastIndexOf(".")).toLowerCase();
 if(s==="megadrive")return [".bin",".md",".gen",".smd",".zip"].includes(ext);
 if(s==="snes")return [".sfc",".smc",".zip"].includes(ext);
 if(s==="atari2600")return [".a26",".bin",".zip"].includes(ext);
 return ext===".zip";
}
declare global {interface Window {
 EJS_player?:string; EJS_core?:string; EJS_gameUrl?:File; EJS_pathtodata?:string;
 EJS_startOnLoaded?:boolean;EJS_controlScheme?:string;EJS_Buttons?:Record<string,boolean>;
 EJS_defaultOptions?:Record<string,string>;EJS_onGameStart?:(...args:unknown[])=>void;
 EJS_volume?:number; EJS_threads?:boolean;
}}
export default function RetroDrive(){
 const [games,setGames]=useState<Game[]>([]);
 const [system,setSystem]=useState<System>("megadrive");
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState<string|null>(null);
 const [status,setStatus]=useState("Buscando suas ROMs no ROVIX Drive…");
 const [needsLogin,setNeedsLogin]=useState(false);
 const [playerKey,setPlayerKey]=useState(0);
 const playerRef=useRef<HTMLDivElement|null>(null);
 const romRef=useRef<File|null>(null);
 const coreRef=useRef("segaMD");
 const filesRef=useRef<Entry[]>([]);
 const aliveRef=useRef(true);
 useEffect(()=>{aliveRef.current=true;return()=>{aliveRef.current=false}},[]);
 async function load(){
  setLoading(true);setNeedsLogin(false);setStatus("Lendo Games-Retro no ROVIX Drive…");
  try{
   const session=await getValidSession();
   if(!session){setNeedsLogin(true);setStatus("Entre na sua conta ROVIX para visualizar as ROMs privadas.");return}
   const result=await authRest("rovix_files?select=id,name,kind,parent_id,size_bytes&order=name.asc&limit=2000");
   const items=Array.isArray(result)?result as Entry[]:[];
   filesRef.current=items;
   const roots=items.filter(x=>x.kind==="folder"&&x.name.toLowerCase()==="games-retro");
   if(!roots.length){setGames([]);setStatus("Pasta Games-Retro não encontrada nesta conta. Confira o ROVIX Drive.");return;}
   const groups=new Map<string,System>();
   for(const root of roots){
    const children=items.filter(x=>x.parent_id===root.id&&x.kind==="folder");
    for(const folder of children){const s=detect(folder.name);if(s)groups.set(folder.id,s)}
   }
   const found:Game[]=[];
   for(const item of items){
    if(item.kind!=="file")continue;
    let parent=item.parent_id;const visited=new Set<string>();let matched:System|null=null;let inside=false;
    while(parent&&!visited.has(parent)){
     visited.add(parent);if(groups.has(parent)){matched=groups.get(parent)!;inside=true;break}
     const folder=items.find(x=>x.id===parent&&x.kind==="folder");
     if(!folder)break;
     if(roots.some(x=>x.id===folder.id)){inside=true;break}
     parent=folder.parent_id;
    }
    if(!inside)continue;
    const ext=item.name.slice(item.name.lastIndexOf(".")).toLowerCase();
    const sys=matched||([".sfc",".smc"].includes(ext)?"snes":[".a26"].includes(ext)?"atari2600":[".md",".gen",".smd"].includes(ext)?"megadrive":null);
    if(sys&&supported(item.name,sys))found.push({id:item.id,name:item.name,system:sys,size:Number(item.size_bytes||0)});
   }
   setGames(found);
   setStatus(found.length?`${found.length} ROM(s) encontrada(s). Selecione um console e toque em Jogar.`:"Nenhuma ROM compatível encontrada nas pastas.");
  }catch(e){const message=e instanceof Error?e.message:String(e);setNeedsLogin(message==="AUTH_REQUIRED");setStatus(message==="AUTH_REQUIRED"?"Sua sessão expirou. Entre novamente.":"Erro ao listar os arquivos: "+message)}
  finally{setLoading(false)}
 }
 useEffect(()=>{void load()},[]);
 async function api(path:string,body:Record<string,string>){
  const session=await getValidSession();if(!session)throw new Error("AUTH_REQUIRED");
  const response=await fetch(DRIVE_API+path,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},body:JSON.stringify(body)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||"Falha ao acessar o arquivo no Drive");
  return data;
 }
 async function play(game:Game){
  if(busy)return;
  setBusy(game.id);setStatus("Preparando "+game.name+"…");
  try{
   const signed=await api("/download-url",{file_id:game.id});
   if(!signed.download_url)throw new Error("Link temporário indisponível.");
   const response=await fetch(signed.download_url,{cache:"no-store"});
   if(!response.ok)throw new Error("Download da ROM falhou: HTTP "+response.status);
   const bytes=await response.blob();
   if(!bytes.size)throw new Error("O arquivo retornou vazio.");
   romRef.current=new File([bytes],game.name,{type:"application/octet-stream"});
   coreRef.current=systems.find(s=>s.id===game.system)!.core;
   setSystem(game.system);
   setStatus("Inicializando "+game.name+". Toque em Start dentro do emulador.");
   setPlayerKey(k=>k+1);
  }catch(e){setStatus("Não foi possível abrir "+game.name+": "+(e instanceof Error?e.message:String(e)));}
  finally{setBusy(null)}
 }
 useEffect(()=>{
  if(!playerKey||!playerRef.current||!romRef.current)return;
  playerRef.current.innerHTML="";
  const mount=document.createElement("div");mount.id="rovix-drive-player";mount.style.cssText="width:100%;min-height:560px;height:100%";
  playerRef.current.appendChild(mount);
  window.EJS_player="#rovix-drive-player";
  window.EJS_core=coreRef.current;
  window.EJS_controlScheme=coreRef.current;
  window.EJS_gameUrl=romRef.current;
  window.EJS_pathtodata="https://cdn.emulatorjs.org/4.2.3/data/";
  window.EJS_startOnLoaded=true;window.EJS_volume=.6;window.EJS_threads=false;
  window.EJS_defaultOptions={"save-state-location":"download"};
  window.EJS_Buttons={playPause:true,restart:true,mute:true,settings:true,volume:true,saveState:true,loadState:true,gamepad:true,fullscreen:true};
  window.EJS_onGameStart=()=>setStatus("Jogo iniciado! Verifique o som e use os comandos na tela.");
  const script=document.createElement("script");script.src=window.EJS_pathtodata+"loader.js";script.async=true;
  script.onerror=()=>setStatus("Falha ao carregar o emulador. Confira a conexão.");
  document.body.appendChild(script);
  return()=>{script.remove()};
 },[playerKey]);
 return <main style={{minHeight:"100vh",background:"linear-gradient(160deg,#151025,#090d19)",color:"#f9f4ff",padding:"32px 16px 70px"}}>
 <div style={{maxWidth:1100,margin:"auto"}}>
 <p style={{fontSize:12,letterSpacing:3,color:"#ba9ded"}}>ROVIX AUTOMATION · BIBLIOTECA PRIVADA</p>
 <h1 style={{fontSize:"clamp(34px,6vw,56px)",margin:"10px 0"}}>🎮 RETRO GAMES</h1>
 <p style={{color:"#cfc4dd"}}>Seus jogos são listados diretamente das pastas do ROVIX Drive. Não é necessário enviar novamente.</p>
 <nav style={{display:"flex",flexWrap:"wrap",gap:10,margin:"20px 0"}}>
 <a href="/cloud" style={{color:"#d1b4ff"}}>Abrir meu Drive ↗</a>
 <a href="https://rovixautomation.com.br/retro/audio-test/" style={{color:"#d1b4ff"}}>🔊 Testar som</a>
 <button type="button" onClick={()=>void load()} disabled={loading} style={{background:"#322447",color:"white",border:"1px solid #9476b7",borderRadius:10,padding:"9px 15px",cursor:"pointer"}}>↻ Atualizar lista</button>
 </nav>
 {needsLogin&&<p style={{padding:15,background:"#30203e",borderRadius:12}}><a href="/login" style={{color:"#e6bcff",fontWeight:800}}>Entrar na conta ROVIX</a> e depois voltar à biblioteca.</p>}
 <p role="status" style={{color:"#d1c0ec",minHeight:24}}>{status}</p>
 <section aria-label="Consoles" style={{display:"flex",gap:10,flexWrap:"wrap",margin:"20px 0"}}>
 {systems.map(s=><button key={s.id} onClick={()=>setSystem(s.id)} type="button" style={{background:system===s.id?"#8a4ee8":"#231a34",color:"white",border:"1px solid #77539c",borderRadius:12,padding:"13px 17px",cursor:"pointer"}}>{s.name} ({games.filter(g=>g.system===s.id).length})</button>)}
 </section>
 <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12,marginBottom:25}} aria-label="Jogos do Drive">
 {games.filter(x=>x.system===system).map(g=><article key={g.id} style={{background:"#1f192e",border:"1px solid #4b3a61",padding:18,borderRadius:15}}>
 <div style={{fontSize:28}}>🕹️</div><strong style={{display:"block",overflowWrap:"anywhere",minHeight:45}}>{g.name.replace(/\.(zip|bin|gen|md|smd|smc|sfc|a26)$/i,"")}</strong>
 <small style={{color:"#bcb0d0"}}>{g.size? (g.size/1024/1024).toFixed(2)+" MB":"ROM do Drive"}</small>
 <button disabled={Boolean(busy)} onClick={()=>void play(g)} type="button" style={{display:"block",width:"100%",background:"#d890fa",color:"#1c0d27",border:0,borderRadius:10,padding:"12px 16px",marginTop:16,fontWeight:800,cursor:"pointer"}}>{busy===g.id?"Carregando…":"▶ Jogar"}</button>
 </article>)}
 {!loading&&games.filter(x=>x.system===system).length===0&&<p style={{color:"#afa6c0"}}>Nenhum jogo encontrado nesta categoria.</p>}
 </section>
 <section style={{background:"#11101d",border:"1px solid #51405f",padding:16,borderRadius:16}}>
 <h2 style={{fontSize:20,margin:"0 0 10px"}}>Tela do jogo</h2>
 <div ref={playerRef} style={{minHeight:560,width:"100%",background:"#050509",borderRadius:10,overflow:"hidden",display:"grid",placeItems:"center"}}>
 {!playerKey&&<p style={{textAlign:"center",padding:20,color:"#aaa"}}>Selecione um jogo acima para iniciar.</p>}
 </div>
 </section>
 <p style={{fontSize:12,color:"#a79caf",marginTop:20}}>Sua biblioteca é privada e exige login. Use ROMs para as quais você tenha autorização. Alguns conjuntos WinKawaks podem não ser compatíveis com o núcleo Arcade. Controles e som precisam ser validados em cada sistema.</p>
 </div></main>;
}
