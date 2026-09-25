"use client";
import Link from"next/link";
import{LockKeyhole,ShoppingCart}from"lucide-react";
import{useEffect,useState}from"react";
import{getValidSession}from"@/services/rovix-auth";

type Product={
  id:string;
  slug:string;
  name:string;
  description:string;
  price:number;
  currency:string;
  is_free:boolean;
  latest_version?:string|null;
};

const SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL||"";
const SUPABASE_KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||"";
const API=process.env.NEXT_PUBLIC_ROVIX_DRIVE_API||"";

export default function Produtos(){
  const[products,setProducts]=useState<Product[]>([]);
  const[loading,setLoading]=useState(true);
  const[msg,setMsg]=useState("");
  const[busyId,setBusyId]=useState("");

  useEffect(()=>{(async()=>{
    try{
      if(!SUPABASE_URL||!SUPABASE_KEY)throw new Error("Catálogo não configurado.");
      const r=await fetch(SUPABASE_URL+"/rest/v1/rovix_products?select=id,slug,name,description,price,currency,is_free,latest_version&is_active=eq.true&order=name.asc",{
        headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+SUPABASE_KEY}
      });
      if(!r.ok)throw new Error("Falha ao carregar produtos.");
      setProducts(await r.json());
    }catch(e){setMsg(e instanceof Error?e.message:"Falha ao carregar produtos.")}
    finally{setLoading(false)}
  })()},[]);

  async function buy(product:Product){
    setMsg("");
    const session=await getValidSession();
    if(!session){window.location.href="/login";return}
    if(!API){setMsg("Checkout ainda não configurado.");return}
    setBusyId(product.id);
    try{
      const r=await fetch(API+"/orders/start",{
        method:"POST",
        headers:{Authorization:"Bearer "+session.access_token,"Content-Type":"application/json"},
        body:JSON.stringify({product_id:product.id})
      });
      const body=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(body.error||"Não foi possível iniciar a compra.");
      if(body.checkout_url){window.location.href=body.checkout_url;return}
      setMsg("Pedido criado. A etapa de pagamento será conectada ao gateway.");
    }catch(e){setMsg(e instanceof Error?e.message:"Falha ao iniciar compra.")}
    finally{setBusyId("")}
  }

  return <><section className="portalHero">
    <span className="kicker">ROVIX Store</span>
    <h1>Produtos digitais com acesso protegido.</h1>
    <p>Produtos pagos são liberados somente para a conta que tiver o pagamento confirmado.</p>
  </section>

  {msg&&<div className="portalToolbar"><p className="portalMessage">{msg}</p></div>}

  <section className="portalGrid">
    {loading?<article className="portalCard"><p>Carregando catálogo...</p></article>:
    products.length===0?<article className="portalCard"><ShoppingCart/><h2>Catálogo em preparação</h2><p>A estrutura da loja está pronta. Os produtos serão adicionados ao catálogo antes da publicação oficial.</p></article>:
    products.map(p=><article className="portalCard" key={p.id}>
      <ShoppingCart/>
      <h2>{p.name}</h2>
      <p>{p.description||"Produto digital ROVIX."}</p>
      {p.latest_version&&<span className="portalBadge">Versão {p.latest_version}</span>}
      <div className="price">{p.is_free?"Grátis":formatMoney(Number(p.price),p.currency)}</div>
      <button className="button" type="button" disabled={busyId===p.id} onClick={()=>buy(p)}>
        {busyId===p.id?"Aguarde...":p.is_free?"Obter":"Comprar"}
      </button>
    </article>)}
    <article className="portalCard"><LockKeyhole/><h2>Downloads protegidos</h2><p>Após a confirmação do pagamento, o produto aparece em <strong>Minhas compras</strong> e o download é temporário.</p><Link className="button secondary" href="/minhas-compras">Minhas compras</Link></article>
  </section></>
}
function formatMoney(value:number,currency:string){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:currency||"BRL"}).format(value)}