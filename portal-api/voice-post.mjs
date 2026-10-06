// Only the explicit authenticated voice command uses this immediate publish flow.
export async function publishVoicePost(deps, db, requestId) {
  if (!/^[a-zA-Z0-9-]{8,100}$/.test(requestId || '')) throw new Error('Identificador de comando inválido');
  const existing = db.posts.find(p => p.voiceRequestId === requestId);
  if (existing) {
    if (existing.status === 'published') return existing;
    throw new Error(existing.lastError || 'Este comando já foi processado. Confira a publicação antes de tentar novamente.');
  }
  await deps.preflight(db);
  const entry = await deps.generate(db);
  if (!entry.imageKey || !entry.caption || entry.artStatus !== 'ready') throw new Error('A postagem precisa de imagem final e legenda.');
  const post = {...entry, generatedBy:'voice', voiceRequestId:requestId, scheduledAt:'', status:'publishing', publishStartedAt:new Date().toISOString()};
  db.posts.unshift(post);
  await deps.saveDb(db);
  try {
    const result = await deps.publish(post);
    if (!result.id) throw new Error('A rede social não confirmou o ID da publicação');
    Object.assign(post, deps.network === 'linkedin' ? {linkedinPostId:result.id,linkedinPostUrl:result.url} : {metaMediaId:result.id,metaContainerId:result.containerId});
    post.status = 'published'; post.publishedAt = new Date().toISOString(); post.lastError = '';
  } catch (e) {
    post.status = 'publication_uncertain'; post.lastError = e.message;
    deps.onError?.(db,e); await deps.saveDb(db);
    throw new Error('A postagem foi salva, mas a publicação não foi confirmada: ' + e.message);
  }
  await deps.saveDb(db);
  return post;
}

export async function generateVoiceEntry(deps, db) {
  const catalog = await deps.loadCatalog();
  if (catalog.folderId !== deps.folderId || catalog.ownerId !== deps.ownerId) throw new Error('Pasta de imagens diferente do acervo autorizado para esta plataforma');
  const history = db.meta.manualPreviewHistory || [];
  const all = [...db.posts, ...history];
  const active = db.posts.filter(p => !['deleted','rejected','published','cancelled'].includes(p.status));
  const key = p => p.sourceImageKey || p.driveFileId;
  const uses = f => all.filter(p => key(p) === (deps.kind === 'orpheus' ? f.object_key : f.id)).length;
  const files = (catalog.files || []).filter(f => /^image\/(png|jpeg|webp)$/.test(f.mime_type) && f.object_key?.startsWith(deps.ownerId + '/') && !active.some(p => key(p) === (deps.kind === 'orpheus' ? f.object_key : f.id))).sort((a,b) => uses(a)-uses(b) || a.name.localeCompare(b.name));
  if (!files.length) throw new Error('Não há uma imagem livre no acervo desta plataforma');
  let entry, selected, blockedImages = 0;
  for (const file of files) {
    let proposal;
    try { proposal = deps.compose(file, all, db.posts.length + history.length); } catch { continue; }
    const project = db.projects.find(p => p.id === proposal.projectId && p.active);
    if (!project) continue;
    const candidate = {id:deps.id('voice-post'), ...proposal, projectName:project.name, sourceImageKey:deps.kind === 'orpheus' ? file.object_key : undefined, driveFileId:deps.kind === 'rovix' ? file.id : undefined, createdAt:new Date().toISOString(), scheduledAt:'',status:'draft'};
    try {
      await deps.prepare(candidate, db, catalog, file, project);
    } catch (e) {
      const message = String(e.message || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (!/imagem bloqueada:.*(igual|semelhante|fundo ja utilizado)/i.test(message)) throw e;
      blockedImages++;
      continue;
    }
    entry = candidate; selected = file;
    break;
  }
  if (!entry && blockedImages) throw new Error('Nenhuma imagem disponível passou pelo bloqueio de repetição. Adicione novas imagens ao acervo.');
  if (!entry || !selected) throw new Error('Não há uma proposta disponível para os projetos ativos');
  return entry;
}

export async function prepareRovixVoiceArtwork(deps, post, db, file, project) {
  post.strategy = structuredClone(post.strategy);
  Object.assign(post.strategy.visual, {fileId:file.id,fileName:file.name});
  Object.assign(post, {driveFileId:file.id,driveFileName:file.name,driveFolder:'Meu Drive → ROVIX_IMAGENS_PRONTAS_45',visualSource:'rovix-drive://' + file.id,driveHasExistingText:deps.driveContent(file,0).hasExistingText});
  const bytes = await deps.readImage(file.object_key);
  const final = await deps.render(post,project,bytes);
  post.visualFingerprint = await deps.fingerprint(final);
  await deps.assertUnique(post,db);
  post.imageKey = await deps.storeImage(post.id,final);
  post.imageUrl = ''; post.artStatus = 'ready'; post.artGeneratedAt = new Date().toISOString();
}
