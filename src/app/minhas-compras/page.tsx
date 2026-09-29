"use client";
import{Download,LockKeyhole}from"lucide-react";
import{useEffect,useState}from"react";
import{useRouter}from"next/navigation";
import{authRest,getValidSession}from"@/services/rovix-auth";

type Entitlement={id:string;product_id:string;status:string;granted_at:string};
type Product={id:string;name:string;latest_version?:string|null};
const API=process.env.NEXT_PUBLIC_ROVIX_DRIVE_API||"";

export default function MinhasCompras(){
  const router=useRouter();
  const[rows,setRows]=useState<Array<Entitlement&{product?:Product}>>([]);
  const[loading,setLoading]=useState(true);
  const[busyId,setBusyId]=useState("");
  const[msg,setMsg]=useState("");

  useEffect(()=>{(async()=>{try{
    const s=await getValidSession();
    if(!s){router.replace("/login");return}
    const ent=await authRest("rovix_entitlements?select=id,product_id,status,granted_at&status=eq.active&order=granted_at.desc") as Entitlement[];
    const products=await authRest("rovix_products?select=id,name,latest_version") as Product[];
    const map=new Map(products.map(p=>[p.id,p]));
    setRows((ent||[]).map(x=>({...x,product:map.get(x.product_id)})));
  }catch(e){
    if(e instanceof Error&&e.message==="AUTH_REQUIRED")router.replace("/login");
    else setMsg(e instanceof Error?e.message:"Falha ao carregar compras.");
  }finally{setLoading(false)}})()},[router]);

  async function download(row:Entitlement&{product?:Product}){
    setBusyId(row.id);setMsg("");
    try{
      const s=await getValidSession();
      if(!s){router.replace("/login");return}
      if(!API)throw new Error("Backend de downloads não configurado.");
      const r=await fetch(API+"/product-download-url",{
        method:"POST",
        headers:{Authorization:"Bearer "+s.access_token,"Content-Type":"application/json"},
        body:JSON.stringify({product_id:row.product_id})
      });
      const body=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(body.error||"Não foi possível liberar o download.");
      window.location.href=body.download_url;
    }catch(e){setMsg(e instanceof Error?e.message:"Falha no download.")}
    finally{setBusyId("")}
  }

  return <><section className="portalHero"><span className="kicker">Área do cliente</span><h1>Minhas compras</h1><p>Somente produtos associados à sua conta aparecem aqui.</p></section>
  {msg&&<div className="portalToolbar"><p className="portalMessage">{msg}</p></div>}
  <section className="portalGrid">
    {loading?<article className="portalCard"><p>Carregando...</p></article>:
    rows.length===0?<article className="portalCard"><LockKeyhole/><span className="purchaseStatus">Nenhum produto liberado</span><h2>Downloads protegidos</h2><p>Quando um pagamento for confirmado, o produto aparecerá nesta tela.</p></article>:
    rows.map(row=><article className="portalCard" key={row.id}><LockKeyhole/><span className="purchaseStatus">Licença ativa</span><h2>{row.product?.name??"Produto ROVIX"}</h2><p>Versão {row.product?.latest_version??"atual"} · liberado em {new Date(row.granted_at).toLocaleDateString("pt-BR")}</p><button className="button" type="button" disabled={busyId===row.id} onClick={()=>download(row)}><Download/> {busyId===row.id?"Liberando...":"Baixar"}</button></article>)}
  </section><p className="portalNote">O download é privado e recebe uma URL temporária somente para a conta que possui o produto.</p></>}