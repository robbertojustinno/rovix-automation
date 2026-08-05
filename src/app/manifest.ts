import type {MetadataRoute} from "next";
export const dynamic="force-static";
export default function manifest():MetadataRoute.Manifest{return{name:"ROVIX Automation",short_name:"ROVIX",description:"Tecnologia, automação, aplicativos e soluções digitais.",start_url:"/",display:"standalone",background_color:"#070a12",theme_color:"#070a12",lang:"pt-BR",icons:[{src:"/favicon.png",sizes:"512x512",type:"image/png"}]}}
