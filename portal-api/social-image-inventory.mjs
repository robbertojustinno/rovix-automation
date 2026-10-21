const pending=new Set(['draft','approved','publishing','error','manual_preview']);
function fileId(entry){
  return entry.driveFileId||entry.strategy?.visual?.fileId||
    (String(entry.visualSource||'').startsWith('rovix-drive://')?entry.visualSource.slice(14):null);
}
export function imageInventory(catalog,db){
  const files=new Set((catalog.files||[]).filter(f=>f.id&&f.object_key).map(f=>f.id));
  const used=new Set(),reserved=new Set();
  for(const post of db.posts||[]){
    const key=fileId(post);if(!files.has(key))continue;
    if(post.status==='published'||post.publishedAt||post.metaMediaId||!pending.has(post.status))used.add(key);
    else reserved.add(key);
  }
  for(const preview of db.meta?.manualPreviewBatch?.entries||[]){
    const key=fileId(preview);if(files.has(key))reserved.add(key);
  }
  for(const key of used)reserved.delete(key);
  return {total:files.size,used:used.size,reserved:reserved.size,remaining:files.size-used.size-reserved.size};
}
