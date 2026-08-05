import { productsData } from "@/data/products";
import { catalogSchema,type Product } from "@/domain/product";
export interface ProductRepository{findAll():Promise<Product[]>;findCatalog():Promise<Product[]>;findBySlug(slug:string):Promise<Product|null>;findRelated(product:Product,limit?:number):Promise<Product[]>}
export class LocalProductRepository implements ProductRepository{
 private products=catalogSchema.parse(productsData);
 async findAll(){return [...this.products].sort((a,b)=>a.ordemDeExibicao-b.ordemDeExibicao)}
 async findCatalog(){return (await this.findAll()).filter(p=>p.ativo&&p.visivelNoCatalogo&&p.status!=="Oculto")}
 async findBySlug(slug:string){return this.products.find(p=>p.slug===slug&&p.ativo&&p.status!=="Oculto")??null}
 async findRelated(product:Product,limit=3){const list=(await this.findCatalog()).filter(p=>p.id!==product.id);return list.sort((a,b)=>score(b,product)-score(a,product)).slice(0,limit)}
}
const score=(a:Product,b:Product)=>(a.categoria===b.categoria?3:0)+a.tags.filter(t=>b.tags.includes(t)).length;
export const productRepository:ProductRepository=new LocalProductRepository();
