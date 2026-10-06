// One explicit voice request creates and publishes exactly one Instagram post.
// Persist the request before calling Meta; retries never create a second post.
export async function publishVoicePost(deps, db, requestId) {
  if (!/^[a-zA-Z0-9-]{8,100}$/.test(requestId || '')) throw new Error('Identificador de comando inválido');
  const existing = db.posts.find(p => p.voiceRequestId === requestId);
  if (existing) {
    if (existing.status === 'published') return existing;
    throw new Error(existing.lastError || 'Este comando já foi processado. Confira a postagem na fila antes de tentar novamente.');
  }
  await deps.preflight(db);
  const batch = await deps.generate(db);
  if (batch.entries?.length !== 1 || !batch.entries[0].imageKey || !batch.entries[0].caption) throw new Error('A postagem precisa de imagem final e legenda.');
  const post = {...batch.entries[0], id:deps.id('voice-post'), generatedBy:'voice', voiceRequestId:requestId, scheduledAt:'', status:'publishing', publishStartedAt:new Date().toISOString()};
  db.posts.unshift(post);
  await deps.saveDb(db);
  try {
    const result = await deps.publish(post);
    post.status = 'published'; post.metaMediaId = result.id; post.metaContainerId = result.containerId;
    post.publishedAt = new Date().toISOString(); post.lastError = '';
  } catch (e) {
    post.status = 'error'; post.lastError = e.message;
    deps.onError?.(db,e);
    await deps.saveDb(db);
    throw new Error('A postagem foi salva, mas a publicação não foi confirmada: ' + e.message);
  }
  await deps.saveDb(db);
  return post;
}
