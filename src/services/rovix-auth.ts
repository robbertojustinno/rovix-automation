"use client";

export type RovixSession={
  access_token:string;
  refresh_token:string;
  expires_at:number;
  user:{id:string;email?:string};
};

const STORAGE_KEY="rovix_session";
const base=process.env.NEXT_PUBLIC_SUPABASE_URL;
const apiKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function requireConfig(){
  if(!base||!apiKey) throw new Error("Configuração do Supabase ausente.");
}
function makeHeaders(token?:string){
  requireConfig();
  return {
    apikey:apiKey!,
    Authorization:"Bearer "+(token??apiKey),
    "Content-Type":"application/json"
  };
}
function saveSession(raw:any):RovixSession{
  const session:RovixSession={
    access_token:raw.access_token,
    refresh_token:raw.refresh_token,
    expires_at:Math.floor(Date.now()/1000)+(raw.expires_in??3600),
    user:raw.user
  };
  localStorage.setItem(STORAGE_KEY,JSON.stringify(session));
  return session;
}
export function clearSession(){if(typeof window!=="undefined")localStorage.removeItem(STORAGE_KEY);}
export function readSession():RovixSession|null{
  if(typeof window==="undefined")return null;
  const raw=localStorage.getItem(STORAGE_KEY);
  if(!raw)return null;
  try{return JSON.parse(raw) as RovixSession}catch{clearSession();return null}
}
export async function refreshSession(session:RovixSession){
  requireConfig();
  const r=await fetch(base+"/auth/v1/token?grant_type=refresh_token",{
    method:"POST",headers:makeHeaders(),body:JSON.stringify({refresh_token:session.refresh_token})
  });
  if(!r.ok){clearSession();throw new Error("Sua sessão expirou. Entre novamente.");}
  return saveSession(await r.json());
}
export async function getValidSession(){
  const session=readSession();
  if(!session)return null;
  if(session.expires_at-Date.now()/1000>90)return session;
  return refreshSession(session);
}
export async function signIn(email:string,password:string){
  requireConfig();
  const r=await fetch(base+"/auth/v1/token?grant_type=password",{
    method:"POST",headers:makeHeaders(),body:JSON.stringify({email,password})
  });
  const body=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(body.error_description||body.msg||body.message||"Não foi possível entrar.");
  return saveSession(body);
}
export async function signUp(email:string,password:string){
  requireConfig();
  const r=await fetch(base+"/auth/v1/signup",{
    method:"POST",headers:makeHeaders(),body:JSON.stringify({email,password})
  });
  const body=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(body.msg||body.message||"Não foi possível criar a conta.");
  if(body.access_token)return saveSession(body);
  return null;
}
export async function signOut(){
  const session=readSession();
  try{
    if(session)await fetch(base+"/auth/v1/logout",{method:"POST",headers:makeHeaders(session.access_token)});
  }finally{clearSession();}
}
export async function authRest(path:string,init:RequestInit={}){
  const session=await getValidSession();
  if(!session)throw new Error("AUTH_REQUIRED");
  const r=await fetch(base+"/rest/v1/"+path,{
    ...init,
    headers:{...makeHeaders(session.access_token),Prefer:"return=representation",...(init.headers||{})}
  });
  if(r.status===401){clearSession();throw new Error("AUTH_REQUIRED");}
  if(!r.ok){
    const body=await r.json().catch(()=>({}));
    throw new Error(body.message||body.hint||"Falha ao acessar os dados.");
  }
  const text=await r.text();
  return text?JSON.parse(text):null;
}
export async function ensureRovixProfile(){
  const session=await getValidSession();
  if(!session)throw new Error("AUTH_REQUIRED");
  const existing=await authRest("rovix_profiles?user_id=eq."+session.user.id+"&select=user_id");
  if(Array.isArray(existing)&&existing.length)return;
  await authRest("rovix_profiles",{method:"POST",body:JSON.stringify({user_id:session.user.id})});
}
