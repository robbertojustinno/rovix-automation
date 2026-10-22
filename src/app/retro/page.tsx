"use client";
import {useEffect,useRef,useState} from "react";

type System = "megadrive"|"snes"|"arcade"|"atari2600";
const systems:{id:System;title:string;subtitle:string;core:string;accept:string}[]=[
{id:"megadrive",title:"Mega Drive",subtitle:"16-bit · Sega Genesis",core:"segaMD",accept:".bin,.gen,.md,.zip"},
{id:"snes",title:"Super Nintendo",subtitle:"16-bit · SNES",core:"snes",accept:".sfc,.smc,.zip"},
{id:"arcade",title:"Arcade",subtitle:"Arcade · ROM sets compatíveis",core:"arcade",accept:".zip"},
{id:"atari2600",title:"Atari 2600",subtitle:"Atari · Seaquest e outros",core:"atari2600",accept:".a26,.bin,.zip"}
];
declare global {interface Window {EJS_player?:string;EJS_core?:string;EJS_gameUrl?:string;EJS_pathtodata?:string;EJS_startOnLoaded?:boolean;EJS_Buttons?:Record<string,boolean>;EJS_controlScheme?:string;EJS_browserMode?:string;EJS_onGameStart?:()=>void;}}
export default function RetroPage(){
 const [system,setSystem]=useState<System>("megadrive");
 const [rom,setRom]=useState<File|null>(null);
 const [status,setStatus]=useState("Selecione o console correto e uma ROM que você tenha direito de utilizar.");
 const [sensitivity,setSensitivity]=useState(50);
 const [playerKey,setPlayerKey]=useState(0);
 const playerRef=useRef<HTMLDivElement|null>(null);
 const urlRef=useRef<string|null>(null);
 const current=systems.find(x=>x.id===system)!;
 useEffect(()=>()=>{if(urlRef.current)URL.revokeObjectURL(urlRef.current);},[]);
 function start(){
   if(!rom){setStatus("Selecione uma ROM primeiro.");return;}
   if(urlRef.current)URL.revokeObjectURL(urlRef.current);
   const url=URL.createObjectURL(rom);
   urlRef.current=url;
   setStatus("Iniciando emulador. No celular, toque em Start no controle virtual para começar.");
   setPlayerKey(k=>k+1);
 }
 useEffect(()=>{
  if(!playerKey||!playerRef.current||!rom)return;
  playerRef.current.innerHTML="";
  const player=document.createElement("div"); player.id="rovix-emulator";player.style.cssText="width:100%;height:100%;min-height:600px";
  playerRef.current.appendChild(player);
  window.EJS_player="#rovix-emulator";window.EJS_core=current.core;
  window.EJS_controlScheme=current.core;
  window.EJS_browserMode=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)?"mobile":"desktop";
  window.EJS_onGameStart=()=>setStatus("Jogo iniciado! Toque em Start no controle e use as setas para movimentar.");
  window.EJS_gameUrl=urlRef.current??undefined;
  window.EJS_pathtodata="https://cdn.emulatorjs.org/stable/data/";
  window.EJS_startOnLoaded=true;
  const script=document.createElement("script");
  script.src="https://cdn.emulatorjs.org/stable/data/loader.js";
  script.async=true;
  script.onerror=()=>setStatus("Não foi possível carregar o emulador. Verifique sua conexão e as proteções do navegador.");
  document.body.appendChild(script);
  return ()=>{script.remove();};
 // Player is intentionally remounted only when a new game is started
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[playerKey]);
 return <div style={{background:"radial-gradient(ellipse at top,#2c1755 0%,#0a0c18 65%)",minHeight:"100vh",color:"#f5f2ff",padding:"36px max(18px,5vw) 80px"}}>
 <div style={{maxWidth:1160,margin:"auto"}}>
 <p style={{letterSpacing:3,color:"#b8a4ff",fontWeight:800,fontSize:12}}>ROVIX AUTOMATION · ARCADE</p>
 <h1 style={{fontSize:"clamp(32px,6vw,64px)",lineHeight:1.1,margin:"12px 0"}}>ROVIX <span style={{color:"#e68bfd"}}>Retro Games</span></h1>
 <p style={{color:"#c6c0d7",maxWidth:680}}>Sua central retrô no navegador. Selecione o sistema correto para a ROM (Seaquest original: Atari 2600), depois toque em Jogar e Start. Versão experimental.</p>
 <section style={{margin:"24px 0",border:"1px solid #694998",borderRadius:18,padding:18,background:"#171229"}}>
 <h2 style={{fontSize:23,margin:"0 0 6px"}}>🎮 Biblioteca RETRO GAMES</h2>
 <p style={{color:"#bdb4d4",margin:"0 0 14px"}}>Atalhos para os jogos ROVIX. Ou escolha um console e carregue uma ROM local abaixo.</p>
 <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
 {[{label:"Seaquest",href:"/seaquest/"},{label:"Mamono Hunter Youko",href:"/youko/"},{label:"Dangerous Dave",href:"/dave/"},{label:"Jogos casuais ROVIX",href:"/retrogames/"}].map(game=><a key={game.href} href={game.href} style={{padding:"12px 16px",background:"#32204e",border:"1px solid #8862ac",borderRadius:12,color:"#fff",fontWeight:700,textDecoration:"none"}}>{game.label} ↗</a>)}
 </div></section>
 <div style={{display:"flex",gap:12,flexWrap:"wrap",margin:"26px 0"}}>
 {systems.map(s=><button key={s.id} onClick={()=>{setSystem(s.id);setRom(null);setStatus("Selecione uma ROM compatível.");}} style={{background:system===s.id?"#7342cd":"#1b1a2c",color:"white",border:"1px solid #614879",borderRadius:14,padding:"16px 22px",cursor:"pointer",textAlign:"left",minWidth:170}}><strong style={{display:"block",fontSize:17}}>{s.title}</strong><small>{s.subtitle}</small></button>)}
 </div>
 <section style={{border:"1px solid #4b385b",borderRadius:20,background:"#151323",padding:22}}>
 <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12,alignItems:"center"}}>
 <div><h2 style={{fontSize:24,margin:0}}>{current.title}</h2><small style={{color:"#c6c0d7"}}>Importe uma ROM local autorizada para uso</small></div>
 <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
 <label style={{cursor:"pointer",border:"1px solid #82669a",borderRadius:9,padding:"11px 14px"}}>Selecionar ROM <input type="file" accept={current.accept} style={{display:"none"}} onChange={e=>{setRom(e.target.files?.[0]??null);setStatus(e.target.files?.[0]?.name??"Nenhum arquivo selecionado");}}/></label>
 <button onClick={start} disabled={!rom} style={{background:"#df89fb",color:"#1d102b",border:0,borderRadius:9,padding:"12px 24px",fontWeight:800,cursor:rom?"pointer":"not-allowed",opacity:rom?1:.5}}>▶ Jogar</button>
 </div>
 </div>
 <p aria-live="polite" style={{color:"#c7b6dc",fontSize:13,marginTop:13}}>{status}</p>
 <div ref={playerRef} style={{marginTop:14,borderRadius:12,overflow:"hidden",minHeight:600,background:"#080911",display:"flex",alignItems:"center",justifyContent:"center"}}>
 {!playerKey&&<div style={{textAlign:"center",color:"#aaa1bb",padding:28}}><div style={{fontSize:55}}>🎮</div>O jogo aparecerá aqui depois de selecionar a ROM.</div>}
 </div>
 <div style={{display:"flex",gap:15,flexWrap:"wrap",alignItems:"center",marginTop:22}}>
 <label htmlFor="retroSensitivity">Sensibilidade do controle: {sensitivity}%</label>
 <input id="retroSensitivity" type="range" min="10" max="100" value={sensitivity} onChange={e=>setSensitivity(Number(e.target.value))}/>
 <small style={{color:"#b4a9c9"}}>O ajuste de sensibilidade ainda não altera o direcional do emulador. Use inicialmente os controles virtuais nativos.</small>
 </div>
 </section>
 <section style={{marginTop:24,display:"grid",gap:12,gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))"}}>
 <div style={{background:"#191629",padding:20,borderRadius:14}}><h3>🕹️ Controles</h3><p>No celular, toque em Start para iniciar. Use o direcional da esquerda para mover e os botões da direita para agir. Caso não responda, verifique se selecionou o console correspondente à ROM.</p></div>
 <div style={{background:"#191629",padding:20,borderRadius:14}}><h3>💾 Salvar progresso</h3><p>Quando o núcleo suportar, utilize os save states do emulador. Faça backup das partidas importantes.</p></div>
 <div style={{background:"#191629",padding:20,borderRadius:14}}><h3>☁️ Biblioteca no Drive</h3><p>Integração autenticada com o ROVIX Drive é uma próxima etapa. Esta versão lê arquivos selecionados no dispositivo, sem publicá-los.</p></div>
 </section>
 <p style={{fontSize:12,color:"#a7a0b7",marginTop:26}}>Use somente jogos e ROMs para os quais você tenha direitos ou autorização. Compatibilidade de arcade e som varia conforme o conjunto de ROMs, navegador e núcleo.</p>
 </div></div>;
}
