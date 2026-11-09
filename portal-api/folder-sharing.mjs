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

async function findFolder(supa, ownerId, folderId, token) {
  const rows = await supa('rovix_files?id=eq.'+encodeURIComponent(folderId)+'&owner_id=eq.'+encodeURIComponent(ownerId)+'&kind=eq.folder&select=id,name,kind,owner_id',token);
  return rows?.[0];
}

async function listFolderFiles(root, supa, token) {
  return collectFolderFiles(root,root.owner_id,async parentId => {
    const all = [];
    for(let offset=0;;offset+=500) {
      const page = await supa('rovix_files?owner_id=eq.'+encodeURIComponent(root.owner_id)+'&parent_id=eq.'+encodeURIComponent(parentId)+'&select=id,name,kind,owner_id,parent_id,object_key,size_bytes&order=id.asc&limit=500&offset='+offset,token);
      all.push(...page);
      if(all.length > 10000) throw new Error('folder_too_large');
      if(page.length < 500) return all;
    }
  });
}

export async function handleFolderSharing(req,res,{user,token,body,supa,s3,GetObjectCommand,PutObjectCommand,getSignedUrl,bucket,reply,origin,liveEnabled}) {
  const root = await findFolder(supa,user.id,body.file_id,token);
  if(!root) return reply(res,404,{error:'folder_not_found'},origin);
  if(body.live === true) {
    if(!liveEnabled) return reply(res,503,{error:'live_folder_share_not_configured'},origin);
    const shareToken = crypto.randomBytes(32).toString('hex');
    await s3().send(new PutObjectCommand({Bucket:bucket,Key:shareKey(shareToken),Body:JSON.stringify({mode:'live',folderId:root.id,ownerId:user.id}),ContentType:'application/json'}));
    return reply(res,200,{share_url:'/shared/folders/'+shareToken},origin);
  }
  const hours = Number(body.hours || 24);
  if(![1,24,168].includes(hours)) return reply(res,400,{error:'invalid_expiration'},origin);
  const files = await listFolderFiles(root,supa,token);
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

async function readShare(client, GetObjectCommand, bucket, key) {
  const object = await client.send(new GetObjectCommand({Bucket:bucket,Key:key}));
  return JSON.parse(await object.Body.transformToString());
}

function missingShare(error) {
  return error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404;
}

export async function revokeFolderShare(res,{user,body,s3,GetObjectCommand,DeleteObjectCommand,bucket,reply,origin}) {
  const key = shareKey(String(body.share_token || ''));
  if(!key) return reply(res,400,{error:'invalid_folder_share'},origin);
  const client = s3();
  let share;
  try {
    share = await readShare(client,GetObjectCommand,bucket,key);
  } catch(error) {
    if(missingShare(error)) return reply(res,404,{error:'folder_share_not_found'},origin);
    throw error;
  }
  if(share.mode !== 'live' || share.ownerId !== user.id || share.folderId !== body.file_id) {
    return reply(res,404,{error:'folder_share_not_found'},origin);
  }
  await client.send(new DeleteObjectCommand({Bucket:bucket,Key:key}));
  return reply(res,200,{ok:true},origin);
}

const videoTypes = new Map(Object.entries({mp4:'video/mp4',m4v:'video/mp4',webm:'video/webm',ogv:'video/ogg'}));

async function liveEntries(files,client,{GetObjectCommand,bucket,getSignedUrl}) {
  return Promise.all(files.map(async file => {
    const sign = (disposition, contentType) => getSignedUrl(client,new GetObjectCommand({
      Bucket:bucket,Key:file.object_key,ResponseContentDisposition:disposition,
      ...(contentType ? {ResponseContentType:contentType} : {})
    }),{expiresIn:900});
    const filename = encodeURIComponent(file.name).replace(/'/g,'%27');
    const type = videoTypes.get(file.name.split('.').pop().toLowerCase());
    const url = await sign("attachment; filename*=UTF-8''"+filename);
    const preview = type ? await sign('inline',type) : null;
    return {path:file.path,url,preview};
  }));
}

export async function serveFolderShare(req,res,{s3,GetObjectCommand,bucket,readLiveFiles,getSignedUrl,mediaOrigin}) {
  const match = /^\/shared\/folders\/([a-f0-9]{64})$/.exec(req.url || '');
  const headers = {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; media-src "+(mediaOrigin || "'none'")+"; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"};
  const fail = status => {res.writeHead(status,headers);res.end('Link de pasta indisponível ou expirado.');};
  if(!match || req.method !== 'GET') return fail(404);
  let share, files, name, description;
  try {
    const client = s3();
    share = await readShare(client,GetObjectCommand,bucket,shareKey(match[1]));
    if(share.mode === 'live') {
      if(!readLiveFiles) return fail(503);
      const root = await findFolder(readLiveFiles,share.ownerId,share.folderId);
      if(!root) return fail(404);
      name = root.name;
      files = await liveEntries(await listFolderFiles(root,readLiveFiles),client,{GetObjectCommand,bucket,getSignedUrl});
      description = 'A pasta mostra os arquivos atuais. Atualize a página para ver alterações.';
    } else {
      if(!Number.isFinite(Date.parse(share.expiresAt)) || Date.parse(share.expiresAt) <= Date.now()) return fail(410);
      name = share.name;
      files = share.entries;
      description = 'Conteúdo registrado ao gerar o link. Expira em '+new Date(share.expiresAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})+' (Brasília).';
    }
  } catch(error) {
    return fail(missingShare(error) ? 404 : 503);
  }
  const entries = files.map(file => `<li><div><span>${escapeHtml(file.path)}</span> <a rel="noreferrer" href="${escapeHtml(file.url)}">Baixar</a></div>${file.preview ? `<video controls playsinline preload="none" src="${escapeHtml(file.preview)}" aria-label="${escapeHtml(file.path)}"></video>` : ''}</li>`).join('');
  res.writeHead(200,headers);
  res.end(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(name)} · ROVIX Drive</title><style>body{margin:0;background:#080f20;color:#e8efff;font:16px system-ui}main{max-width:900px;margin:6vh auto;padding:24px}h1,li{overflow-wrap:anywhere}p{color:#aebdd8}ul{padding:0;list-style:none}li{padding:18px 0;border-bottom:1px solid #263651}li div{display:flex;justify-content:space-between;gap:24px}a,header{color:#88baff}footer{margin-top:24px;font-size:11px;color:#aebdd8;text-align:right}video{display:block;width:100%;max-height:70vh;margin-top:12px;background:#000}</style><main><header>ROVIX DRIVE · PASTA COMPARTILHADA</header><h1>${escapeHtml(name)}</h1><p>Acesso somente para visualização e download. ${files.length} arquivo(s).</p><p>${escapeHtml(description)}</p><ul>${entries || '<li>Esta pasta está vazia.</li>'}</ul>${name === 'SEAU' ? '<footer>ROVIX Drive · Por Roberto Justino</footer>' : ''}</main></html>`);
}
