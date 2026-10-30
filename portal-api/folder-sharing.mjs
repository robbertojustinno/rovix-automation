import crypto from 'node:crypto';

const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const shareKey = token => /^[a-f0-9]{64}$/.test(token) ? `folder-shares/${token}.json` : null;

// Traverse only the selected owner's subtree; never follow a foreign child.
export async function collectFolderFiles(root, ownerId, children) {
  if(root.kind !== 'folder' || root.owner_id !== ownerId) throw new Error('folder_not_found');
  const queue = [{id:root.id,path:'',depth:0}], seen = new Set([root.id]), files = [];
  for(let i=0;i<queue.length;i++) {
    if(queue.length > 2000) throw new Error('folder_too_large');
    const parent = queue[i];
    for(const item of await children(parent.id)) {
      if(item.owner_id !== ownerId || item.parent_id !== parent.id) continue;
      if(seen.has(item.id) || parent.depth >= 80) throw new Error('invalid_folder_tree');
      seen.add(item.id);
      const path = parent.path + String(item.name).replace(/[\\/\0]/g,'_');
      if(item.kind === 'folder') queue.push({id:item.id,path:path+'/',depth:parent.depth+1});
      else if(item.kind === 'file' && item.object_key) files.push({...item,path});
      if(seen.size > 10000) throw new Error('folder_too_large');
    }
  }
  return files;
}

export async function handleFolderSharing(req,res,{user,token,body,supa,s3,GetObjectCommand,PutObjectCommand,getSignedUrl,bucket,reply,origin}) {
  const rows = await supa('rovix_files?id=eq.'+encodeURIComponent(body.file_id)+'&owner_id=eq.'+encodeURIComponent(user.id)+'&kind=eq.folder&select=id,name,kind,owner_id',token);
  const root = rows?.[0];
  if(!root) return reply(res,404,{error:'folder_not_found'},origin);
  const hours = Number(body.hours || 24);
  if(![1,24,168].includes(hours)) return reply(res,400,{error:'invalid_expiration'},origin);
  const files = await collectFolderFiles(root,user.id,async parentId => {
    // Explicit pagination avoids silently truncating the Supabase row limit.
    const all = [];
    for(let offset=0;;offset+=500) {
      const page = await supa('rovix_files?owner_id=eq.'+encodeURIComponent(user.id)+'&parent_id=eq.'+encodeURIComponent(parentId)+'&select=id,name,kind,owner_id,parent_id,object_key,size_bytes&order=id.asc&limit=500&offset='+offset,token);
      all.push(...page);
      if(all.length > 10000) throw new Error('folder_too_large');
      if(page.length < 500) return all;
    }
  });
  const client = s3(), expiresIn = hours*3600;
  const expiresAt = new Date(Date.now()+expiresIn*1000).toISOString();
  const entries = [];
  for(const file of files) {
    const url = await getSignedUrl(client,new GetObjectCommand({Bucket:bucket,Key:file.object_key,ResponseContentDisposition:"attachment; filename*=UTF-8''"+encodeURIComponent(file.name)}),{expiresIn});
    entries.push({path:file.path,size:file.size_bytes,url});
  }
  const shareToken = crypto.randomBytes(32).toString('hex');
  await client.send(new PutObjectCommand({Bucket:bucket,Key:shareKey(shareToken),Body:JSON.stringify({name:root.name,expiresAt,entries}),ContentType:'application/json'}));
  // Relative API URL is resolved against the configured API origin in the client.
  return reply(res,200,{share_url:'/shared/folders/'+shareToken,expires_at:expiresAt,expires_in:expiresIn,file_count:entries.length},origin);
}

export async function serveFolderShare(req,res,{s3,GetObjectCommand,bucket}) {
  const match = /^\/shared\/folders\/([a-f0-9]{64})$/.exec(req.url || '');
  const headers = {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"};
  const fail = status => {res.writeHead(status,headers);res.end('Link de pasta indisponível ou expirado.');};
  if(!match || req.method !== 'GET') return fail(404);
  let share;
  try {
    const object = await s3().send(new GetObjectCommand({Bucket:bucket,Key:shareKey(match[1])}));
    share = JSON.parse(await object.Body.transformToString());
  } catch(error) {
    return fail(error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404 ? 404 : 503);
  }
  if(!Number.isFinite(Date.parse(share.expiresAt)) || Date.parse(share.expiresAt) <= Date.now()) return fail(410);
  const entries = share.entries.map(file => `<li><span>${escapeHtml(file.path)}</span> <a rel="noreferrer" href="${escapeHtml(file.url)}">Baixar</a></li>`).join('');
  res.writeHead(200,headers);
  res.end(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(share.name)} · ROVIX Drive</title><style>body{margin:0;background:#080f20;color:#e8efff;font:16px system-ui}main{max-width:900px;margin:6vh auto;padding:24px}h1,li{overflow-wrap:anywhere}small,p{color:#aebdd8}ul{padding:0;list-style:none}li{display:flex;justify-content:space-between;gap:24px;padding:18px 0;border-bottom:1px solid #263651}a{color:#88baff;flex-shrink:0}header{color:#88baff}</style><main><header>ROVIX DRIVE · PASTA COMPARTILHADA</header><h1>${escapeHtml(share.name)}</h1><p>Acesso somente para leitura e download. ${share.entries.length} arquivo(s).</p><p>Conteúdo registrado ao gerar o link. Expira em ${escapeHtml(new Date(share.expiresAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}))} (Brasília).</p><ul>${entries || '<li>Esta pasta está vazia.</li>'}</ul></main></html>`);
}
