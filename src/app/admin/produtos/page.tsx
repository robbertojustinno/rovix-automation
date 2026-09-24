"use client";
import{useEffect,useMemo,useState}from"react";
import{useRouter}from"next/navigation";
import{authRest,getValidSession}from"@/services/rovix-auth";

type Product={id:string;slug:string;name:string;description:string;price:number;currency:string;is_free:boolean;is_active:boolean;latest_version?:string|null};
type FileItem={id:string;name:string;size_bytes:number;product_id?:string|null;is_product_asset:boolean};

export default function RovixAdminProdutos(){
  const router=useRouter();
  const[allowed,setAllowed]=useState(false);
  const[products,setProducts]=useState<Product[]>([]);
  const[files,setFiles]=useState<FileItem[]>([]);
  const[msg,setMsg]=useState("");
  const[busy,setBusy]=useState(false);
  const[editingId,setEditingId]=useState<string|null>(null);
  const[name,setName]=useState("");
  const[slug,setSlug]=useState("");
  const[description,setDescription]=useState("");
  const[price,setPrice]=useState("0");
  const[version,setVersion]=useState("");
  const[isFree,setIsFree]=useState(false);
  const[fileId,setFileId]=useState("");

  const editing=useMemo(()=>products.find(p=>p.id===editingId)||null,[products,editingId]);

  async function load(){
    try{
      const s=await getValidSession();
      if(!s){router.replace("/login");return}
      const profile=await authRest("rovix_profiles?select=role");
      if(!profile?.[0]||profile[0].role!=="admin"){router.replace("/minha-conta");return}
      setAllowed(true);
      const [rows,fileRows]=await Promise.all([
        authRest("rovix_products?select=id,slug,name,description,price,currency,is_free,is_active,latest_version&order=created_at.desc"),
        authRest("rovix_files?kind=eq.file&select=id,name,size_bytes,product_id,is_product_asset&order=created_at.desc")
      ]);
      setProducts(Array.isArray(rows)?rows:[]);
      setFiles(Array.isArray(fileRows)?fileRows:[]);
    }catch{router.replace("/minha-conta")}
  }

  useEffect(()=>{load()},[]);

  function resetForm(){
    setEditingId(null);setName("");setSlug("");setDescription("");setPrice("0");setVersion("");setIsFree(false);setFileId("");
  }

  function startEdit(p:Product){
    setEditingId(p.id);setName(p.name);setSlug(p.slug);setDescription(p.description||"");setPrice(String(p.price??0));setVersion(p.latest_version||"");setIsFree(Boolean(p.is_free));
    const linked=files.find(f=>f.product_id===p.id&&f.is_product_asset);setFileId(linked?.id||"");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  async function saveProduct(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMsg("");
    try{
      const value=Number(price.replace(",","."));
      if(!name.trim()||!slug.trim())throw new Error("Nome e slug são obrigatórios.");
      if(!isFree&&(!Number.isFinite(value)||value<0))throw new Error("Preço inválido.");
      const payload={
        name:name.trim(),
        slug:slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g,"-"),
        description:description.trim(),
        price:isFree?0:value,
        currency:"BRL",
        is_free:isFree,
        is_active:true,
        latest_version:version.trim()||null
      };

      let productId=editingId;
      if(editingId){
        await authRest("rovix_products?id=eq."+editingId,{method:"PATCH",body:JSON.stringify(payload)});
        await authRest("rovix_files?product_id=eq."+editingId,{method:"PATCH",body:JSON.stringify({product_id:null,is_product_asset:false})});
      }else{
        const created=await authRest("rovix_products",{method:"POST",body:JSON.stringify(payload)});
        productId=created?.[0]?.id;
      }

      if(productId&&fileId){
        await authRest("rovix_files?id=eq."+fileId,{method:"PATCH",body:JSON.stringify({product_id:productId,is_product_asset:true})});
      }

      setMsg(editingId?"Produto atualizado.":"Produto criado.");
      resetForm();
      await load();
    }catch(e){setMsg(e instanceof Error?e.message:"Falha ao salvar produto.")}
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

  return <><section className="portalHero adminHero"><span className="kicker">Admin ROVIX</span><h1>Produtos da loja.</h1><p>Cadastre produtos e associe o arquivo privado que será liberado após a compra.</p></section>
  <section className="adminProductLayout">
    <form className="adminProductForm compactAdminForm" onSubmit={saveProduct}>
      <div className="adminFormHead"><h2>{editing?"Editar produto":"Novo produto"}</h2>{editing&&<button className="textButton inlineTextButton" type="button" onClick={resetForm}>Cancelar</button>}</div>
      <div className="adminFormGrid">
        <div><label>Nome</label><input value={name} onChange={e=>{setName(e.target.value);if(!slug&&!editingId)setSlug(e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""))}}/></div>
        <div><label>Slug</label><input value={slug} onChange={e=>setSlug(e.target.value)}/></div>
        <div><label>Versão</label><input value={version} onChange={e=>setVersion(e.target.value)} placeholder="1.0.0"/></div>
        <div><label>Preço (R$)</label><input value={price} onChange={e=>setPrice(e.target.value)} disabled={isFree}/></div>
      </div>
      <label>Descrição</label><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3}/>
      <label>Arquivo do produto</label>
      <select value={fileId} onChange={e=>setFileId(e.target.value)}>
        <option value="">Nenhum arquivo associado</option>
        {files.map(f=><option key={f.id} value={f.id}>{f.name} · {formatBytes(f.size_bytes)}</option>)}
      </select>
      <label className="checkLine"><input type="checkbox" checked={isFree} onChange={e=>setIsFree(e.target.checked)}/> Produto gratuito</label>
      <button className="button" type="submit" disabled={busy}>{busy?"Salvando...":editing?"Salvar alterações":"Criar produto"}</button>
      {msg&&<p className="portalMessage">{msg}</p>}
    </form>
    <div className="adminProductList">
      <h2>Produtos cadastrados</h2>
      {products.length===0?<p className="muted">Nenhum produto cadastrado.</p>:products.map(p=>{
        const linked=files.find(f=>f.product_id===p.id&&f.is_product_asset);
        return <article className="adminProductItem" key={p.id}>
          <div><strong>{p.name}</strong><small>{p.slug} · {p.is_free?"Grátis":new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(p.price))}</small>{linked&&<small>Arquivo: {linked.name}</small>}</div>
          <div className="adminItemActions"><button className="button secondary" type="button" onClick={()=>startEdit(p)} disabled={busy}>Editar</button><button className="button secondary" type="button" onClick={()=>toggle(p)} disabled={busy}>{p.is_active?"Desativar":"Ativar"}</button></div>
        </article>
      })}
    </div>
  </section></>
}
function formatBytes(n:number){if(n<1024)return n+" B";if(n<1048576)return (n/1024).toFixed(1)+" KB";if(n<1073741824)return (n/1048576).toFixed(1)+" MB";return (n/1073741824).toFixed(2)+" GB"}