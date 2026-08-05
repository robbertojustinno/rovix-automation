import type { Product } from "@/domain/product";
export type CommercialAction={kind:"checkout"|"demo"|"waitlist"|"quote"|"whatsapp"|"unavailable";label:string;href:string};
export function purchaseAction(p:Product):CommercialAction{
 if(p.possuiCompraOnline&&p.linkDeCompra)return{kind:"checkout",label:"Comprar agora",href:p.linkDeCompra};
 if(p.status==="Lista de espera")return{kind:"waitlist",label:"Entrar na lista",href:p.linkDoWhatsApp};
 if(p.modalidadeDeCobranca==="orçamento")return{kind:"quote",label:"Solicitar orçamento",href:p.linkDoWhatsApp};
 if(p.possuiDemonstracao&&p.linkDeDemonstracao)return{kind:"demo",label:"Ver demonstração",href:p.linkDeDemonstracao};
 return p.linkDoWhatsApp?{kind:"whatsapp",label:"Falar com especialista",href:p.linkDoWhatsApp}:{kind:"unavailable",label:"Em breve",href:""};
}
export const analytics={track(event:string,properties:Record<string,unknown>={}){if(typeof window!=="undefined"){window.dispatchEvent(new CustomEvent("rovix:analytics",{detail:{event,properties}}));}}};
