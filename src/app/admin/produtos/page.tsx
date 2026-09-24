"use client";
import{useEffect,useState}from"react";
import{useRouter}from"next/navigation";
import{authRest,getValidSession}from"@/services/rovix-auth";

type Product={id:string;slug:string;name:string;description:string;price:number;currency:string;is_free:boolean;is_active:boolean;latest_version?:string|null};

export default function RovixAdminProdutos(){
  const router=useRouter();
  const[allowed,setAllowed]=useState(false);
  const[products,setProducts]=useState<Product[]>([]);
  const[msg,setMsg]=useState("");
  const[busy,setBusy]=useState(false);
  const[name,setName]=useState("");
  const[slug,setSlug]=useState("");
  const[description,setDescription]=useState("");
  const[price,setPrice]=useState("0");
  const[version,setVersion]=useState("");
  const[isFree,setIsFree]=useState(false);

  async function load(){
    try{
      const s=await getValidSession();
      if(!s){router.replace("/login");return}
      const profile=await authRest("rovix_profiles?select=role");
      if(!profile?.[0]||profile[0].role!=="admin"){router.replace("/minha-conta");return}
      setAllowed(true);
      const rows=await authRest("rovix_products?select=id,slug,name,description,price,currency,is_free,is_active,latest_version&order=created_at.desc");
      setProducts(Array.isArray(rows)?rows:[]);
    }catch{router.replace("/minha-conta")}
  }

  useEffect(()=>{load()},[]);

  async function createProduct(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMsg("");
    try{
      const value=Number(price.replace(",","."));
      if(!name.trim()||!slug.trim())throw new Error("Nome e slug são obrigatórios.");
      if(!isFree&&(!Number.isFinite(value)||value<0))throw new Error("Preço inválido.");
      await authRest("rovix_products",{method:"POST",body:JSON.stringify({
        name:name.trim(),
        slug:slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g,"-"),
        description:description.trim(),
        price:isFree?0:value,
        currency:"BRL",
        is_free:isFree,
        is_active:true,
        latest_version:version.trim()||null
      })});
      setName("");setSlug("");setDescription("");setPrice("0");setVersion("");setIsFree(false);
      setMsg("Produto criado.");
      await load();
    }catch(e){setMsg(e instanceof Error?e.message:"Falha ao criar produto.")}
    finally{setBusy(false)}
  }

  async function toggle(product:Product){
    setBusy(true);setMsg("");
    try{
      await authRest("rovix_products?id=eq."+product.id,{method:"PATCH",body:JSON.stringify({is_active:!product.is_active})});
      await load();
    }catch(e){setMsg(e instanceof Error?e.message:"Falha ao atualizar produto.")}
    finally{setBusy(false)}
  }

  if(!allowed)return <section className="loginBox"><p>Validando acesso...</p></section>;

  return <><section className="portalHero"><span className="kicker">Admin ROVIX</span><h1>Produtos da loja.</h1><p>Cadastre e gerencie os produtos que aparecerão na ROVIX Store.</p></section>
  <section className="adminProductLayout">
    <form className="adminProductForm" onSubmit={createProduct}>
      <h2>Novo produto</h2>
      <label>Nome</label><input value={name} onChange={e=>{setName(e.target.value);if(!slug)setSlug(e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""))}}/>
      <label>Slug</label><input value={slug} onChange={e=>setSlug(e.target.value)}/>
      <label>Descrição</label><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4}/>
      <label>Versão</label><input value={version} onChange={e=>setVersion(e.target.value)} placeholder="ex.: 1.0.0"/>
      <label>Preço (R$)</label><input value={price} onChange={e=>setPrice(e.target.value)} disabled={isFree}/>
      <label className="checkLine"><input type="checkbox" checked={isFree} onChange={e=>setIsFree(e.target.checked)}/> Produto gratuito</label>
      <button className="button" type="submit" disabled={busy}>{busy?"Salvando...":"Criar produto"}</button>
      {msg&&<p className="portalMessage">{msg}</p>}
    </form>
    <div className="adminProductList">
      <h2>Produtos cadastrados</h2>
      {products.length===0?<p className="muted">Nenhum produto cadastrado.</p>:products.map(p=><article className="adminProductItem" key={p.id}>
        <div><strong>{p.name}</strong><small>{p.slug} · {p.is_free?"Grátis":new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(p.price))}</small></div>
        <button className="button secondary" type="button" onClick={()=>toggle(p)} disabled={busy}>{p.is_active?"Desativar":"Ativar"}</button>
      </article>)}
    </div>
  </section></>
}