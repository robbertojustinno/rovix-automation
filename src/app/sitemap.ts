import type {MetadataRoute} from "next";
import {productRepository} from "@/repositories/products";
export const dynamic="force-static";
const base=process.env.NEXT_PUBLIC_SITE_URL??"https://www.rovixautomation.com.br";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const products=await productRepository.findCatalog();const pages=[{url:`${base}/`,priority:1},{url:`${base}/apps/`,priority:.95},{url:`${base}/sobre/`,priority:.7},{url:`${base}/contato/`,priority:.7}];return[...pages.map(x=>({...x,lastModified:new Date(),changeFrequency:"weekly" as const})),...products.filter(p=>p.status!=="Descontinuado").map(p=>({url:`${base}/apps/${p.slug}/`,lastModified:new Date(p.atualizadoEm),changeFrequency:"monthly" as const,priority:p.destaque?.9:.7}))]}
