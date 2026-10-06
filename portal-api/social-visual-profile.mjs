import crypto from 'node:crypto';
export const VISUAL_PROFILE_DEFAULT = Object.freeze({
  brandName:'ROVIX Automation',segment:'Automação industrial e software',
  audience:'Profissionais de indústria, manutenção e tecnologia',
  products:'Soluções ROVIX descritas no projeto selecionado',
  style:'Premium cinematic 3D advertising, physically grounded materials, brushed metal, sophisticated lighting',
  palette:['#071426','#C0C8D2','#EF3340'],
  references:'Cenas profissionais com um assunto principal e ação plausível',
  restrictions:'Não inventar produtos, interfaces legíveis ou funcionalidades; evitar robôs sem relação com o tema',
  logoKey:'',enabled:false,version:1
});
export function validateVisualProfile(input,previous=VISUAL_PROFILE_DEFAULT){
  const out={};
  for(const key of ['brandName','segment','audience','products','style','references','restrictions']){
    const value=String(input[key]??previous[key]??'').trim();
    if(value.length>1000)throw new Error('Campo visual muito longo: '+key);
    if(['brandName','segment','products','style'].includes(key)&&!value)throw new Error('Preencha '+key);
    out[key]=value;
  }
  out.palette=input.palette??previous.palette;
  if(!Array.isArray(out.palette)||out.palette.length<1||out.palette.length>5||out.palette.some(c=>!/^#[0-9a-f]{6}$/i.test(c)))throw new Error('Use de 1 a 5 cores no formato #RRGGBB');
  out.logoKey=String(input.logoKey??previous.logoKey??'');
  if(out.logoKey&&!/^social-agent\/media\/[a-zA-Z0-9.-]+$/.test(out.logoKey))throw new Error('Envie o logotipo pelo upload da plataforma');
  out.version=Number(previous.version||0)+1;
  out.enabled=false;
  return out;
}
export function profileSignature(profile){
  const {enabled,version,approvedPreviewId,approvedAt,...visual}=profile;
  return crypto.createHash('sha256').update(JSON.stringify(visual)).digest('hex');
}
export function applyVisualProfile(plan,profile,post,project){
  const signature=profileSignature(profile);
  const subject=profile.brandName==="ROVIX Automation"?plan.subject:`${project.name||profile.products}: ${post.title}, directly illustrating ${profile.products}`;
  const prompt=`Professional advertising image for brand ${profile.brandName}. Business: ${profile.segment}. Audience: ${profile.audience}. Actual products: ${profile.products}. THIS post subject: ${post.title}. Product facts: ${project.description||project.name}. Scene suggestion: ${subject}. Camera: ${plan.camera}. Lighting: ${plan.light}. Visual style: ${profile.style}. Brand palette: ${profile.palette.join(', ')}. Approved visual guidance: ${profile.references}. Restrictions: ${profile.restrictions}. One clear relevant hero subject, plausible proportions and meaningful action. Original composition. Main subject in upper two thirds, leave bottom area for a caption. No text, lettering, logos or watermarks; branding will be composited separately. ### blurry, low quality, unrelated subjects, distorted machinery, duplicate objects, malformed hands, watermark, letters, illegible interfaces`;
  return {...plan,prompt,profileSignature:signature,conceptKey:crypto.createHash('sha256').update(plan.conceptKey+signature).digest('hex')};
}
