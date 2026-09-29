"use client";
import Link from"next/link";
import{useState}from"react";
import{useRouter}from"next/navigation";
import{ensureRovixProfile,signIn,signUp}from"@/services/rovix-auth";

export default function Login(){
  const router=useRouter();
  const[mode,setMode]=useState<"login"|"signup">("login");
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[busy,setBusy]=useState(false);
  const[msg,setMsg]=useState("");

  async function submit(e:React.FormEvent){
    e.preventDefault();
    setBusy(true);setMsg("");
    try{
      if(mode==="login"){
        await signIn(email,password);
        await ensureRovixProfile();
        router.push("/minha-conta");
        return;
      }
      const session=await signUp(email,password);
      if(session){
        await ensureRovixProfile();
        router.push("/minha-conta");
      }else{
        setMsg("Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar.");
      }
    }catch(err){
      setMsg(err instanceof Error?err.message:"Falha na autenticação.");
    }finally{setBusy(false)}
  }

  return <section className="loginBox">
    <span className="kicker">Conta ROVIX</span>
    <h1>{mode==="login"?"Entrar":"Criar conta"}</h1>
    <p className="muted">Acesso ao ROVIX Drive, compras, licenças e downloads privados.</p>
    <form onSubmit={submit}>
      <label htmlFor="email">E-mail</label>
      <input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/>
      <label htmlFor="password">Senha</label>
      <input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} autoComplete={mode==="login"?"current-password":"new-password"}/>
      <button className="button" type="submit" disabled={busy}>{busy?"Aguarde...":mode==="login"?"Entrar":"Criar conta"}</button>
    </form>
    {msg&&<p className="portalMessage">{msg}</p>}
    <button className="textButton" type="button" onClick={()=>{setMode(mode==="login"?"signup":"login");setMsg("")}}>
      {mode==="login"?"Ainda não tem conta? Criar conta":"Já tem conta? Entrar"}
    </button>
    <Link className="textLink" href="/">Voltar ao site</Link>
  </section>
}