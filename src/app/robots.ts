import type {MetadataRoute} from "next";
export const dynamic="force-static";
const base=process.env.NEXT_PUBLIC_SITE_URL??"https://www.rovixautomation.com.br";
export default function robots():MetadataRoute.Robots{return{rules:{userAgent:"*",allow:"/",disallow:["/api/","/admin/","/cliente/","/intranet/","/frontend/"]},sitemap:`${base}/sitemap.xml`,host:base}}
