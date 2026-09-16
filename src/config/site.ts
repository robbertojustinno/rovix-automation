const siteUrl=process.env.NEXT_PUBLIC_SITE_URL??"https://www.rovixautomation.com.br";
const email=process.env.NEXT_PUBLIC_ROVIX_EMAIL??"contato.rovix@gmail.com";
const whatsapp=process.env.NEXT_PUBLIC_ROVIX_WHATSAPP??"5521998835257";
const whatsappMessage="Olá! Vim pelo site da Rovix Automation e gostaria de mais informações.";
export const siteConfig={name:"ROVIX Automation",siteUrl,email,whatsapp,whatsappMessage,emailUrl:`mailto:${email}`,whatsappUrl:`https://wa.me/${whatsapp}?text=${encodeURIComponent(whatsappMessage)}`,formAction:`https://formsubmit.co/${email}`};
