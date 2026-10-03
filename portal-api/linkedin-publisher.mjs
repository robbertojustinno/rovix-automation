const API='https://api.linkedin.com';
export function linkedInConfigured(){return Boolean(process.env.LINKEDIN_ACCESS_TOKEN&&/^urn:li:(person|organization):[\w-]+$/.test(process.env.LINKEDIN_AUTHOR_URN||''))}
function headers(){return {Authorization:`Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,'LinkedIn-Version':process.env.LINKEDIN_API_VERSION||'202606','X-Restli-Protocol-Version':'2.0.0','Content-Type':'application/json'}}
async function request(route,options={}){
 if(!linkedInConfigured())throw new Error('Configure a conexão LinkedIn do servidor; a conexão do ChatGPT é independente.');
 const response=await fetch(API+route,{...options,headers:{...headers(),...options.headers},signal:AbortSignal.timeout(45000)});
 const raw=await response.text();let data={};try{data=raw?JSON.parse(raw):{}}catch{}
 if(!response.ok){const error=new Error(data.message||`LinkedIn retornou HTTP ${response.status}`);error.httpStatus=response.status;error.retryAfter=response.headers.get('retry-after');throw error}
 return {data,response};
}
export async function testLinkedIn(){const {data}=await request('/v2/userinfo');const author=process.env.LINKEDIN_AUTHOR_URN;if(author.startsWith('urn:li:person:')&&author!==`urn:li:person:${data.sub}`)throw new Error('O perfil configurado não corresponde ao token autorizado.');return {connected:true,id:data.sub,username:data.name,platform:'linkedin',author}}
export async function publishLinkedIn(post,imageUrl){
 const commentary=String(post.caption||'').trim();if(!commentary||commentary.length>3000)throw new Error('O texto deve ter entre 1 e 3000 caracteres.');
 if(!linkedInConfigured())throw new Error('Conexão LinkedIn do servidor ainda não configurada.');
 const author=process.env.LINKEDIN_AUTHOR_URN;let image;
 if(imageUrl){
  const u=new URL(imageUrl);const allowed=(process.env.LINKEDIN_IMAGE_ALLOWED_HOSTS||'').split(',').filter(Boolean);if(process.env.R2_ENDPOINT)allowed.push(new URL(process.env.R2_ENDPOINT).hostname);
  if(u.protocol!=='https:'||!allowed.includes(u.hostname))throw new Error('Imagem deve vir do acervo autorizado; configure LINKEDIN_IMAGE_ALLOWED_HOSTS.');
  const downloaded=await fetch(imageUrl,{redirect:'error',signal:AbortSignal.timeout(30000)});if(!downloaded.ok)throw new Error('Não foi possível baixar a imagem final.');
  const contentType=downloaded.headers.get('content-type')||'';if(!/^image\/(jpeg|png|webp)/i.test(contentType))throw new Error('Formato da imagem inválido.');
  if(Number(downloaded.headers.get('content-length'))>8*1024*1024)throw new Error('Imagem maior que 8 MB.');
  const chunks=[];let size=0;for await(const chunk of downloaded.body){size+=chunk.length;if(size>8*1024*1024)throw new Error('Imagem maior que 8 MB.');chunks.push(chunk)}const bytes=Buffer.concat(chunks);
  const {data}=await request('/rest/images?action=initializeUpload',{method:'POST',body:JSON.stringify({initializeUploadRequest:{owner:author}})});
  const upload=data.value;if(!upload?.uploadUrl||!/^urn:li:image:/.test(upload.image||''))throw new Error('LinkedIn não retornou o upload da imagem.');
  const uploadUrl=new URL(upload.uploadUrl);if(uploadUrl.protocol!=='https:'||!/(^|\.)linkedin\.com$/.test(uploadUrl.hostname))throw new Error('URL de upload inválida.');
  const result=await fetch(upload.uploadUrl,{method:'PUT',headers:{Authorization:headers().Authorization,'Content-Type':contentType},body:bytes,redirect:'error',signal:AbortSignal.timeout(45000)});if(!result.ok)throw new Error(`Falha no upload LinkedIn: HTTP ${result.status}`);image=upload.image;
 }
 const payload={author,commentary,visibility:'PUBLIC',distribution:{feedDistribution:'MAIN_FEED',targetEntities:[],thirdPartyDistributionChannels:[]},lifecycleState:'PUBLISHED',isReshareDisabledByAuthor:false};
 if(image)payload.content={media:{id:image,altText:String(post.title||'').slice(0,4086)}};
 // Publication is never automatically retried: a lost response may already have created a post.
 const {data,response}=await request('/rest/posts',{method:'POST',body:JSON.stringify(payload)});const id=response.headers.get('x-restli-id')||data.id;if(!/^urn:li:(share|ugcPost):/.test(id||''))throw new Error('LinkedIn aceitou a requisição sem retornar um identificador. Confira o perfil antes de repetir.');
 return {id,containerId:image||null,platform:'linkedin',url:`https://www.linkedin.com/feed/update/${id}/`};
}
