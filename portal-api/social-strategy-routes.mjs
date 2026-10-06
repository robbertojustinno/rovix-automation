import crypto from 'node:crypto';
import {STRATEGY_POLICY,composeStrategy,createWeeklyPlan,assertCreativeUnique,learnFromPosts,validateMetrics} from './social-strategy.mjs';
export function createStrategyApi({json,body,saoDate,loadDriveCatalog,saveDb,scheduleFor,id,refreshMetrics}){
 const validDate=day=>/^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(Date.parse(day+'T12:00:00Z'))&&new Date(day+'T12:00:00Z').toISOString().slice(0,10)===day&&day>=saoDate();
 return async function(req,res,u,db){
  const base='/social-api/strategy';
  if(req.method==='GET'&&u.pathname===base)return json(res,200,{policy:STRATEGY_POLICY,plan:db.meta.contentPlan||null,learnings:learnFromPosts(db.posts),results:db.posts.filter(p=>p.strategy&&p.status==='published').map(p=>({id:p.id,title:p.title,publishedAt:p.publishedAt,strategy:p.strategy,performance:p.performance||null}))});
  if(req.method==='POST'&&u.pathname===base+'/generate'){
   const d=await body(req),day=String(d.date||saoDate());if(!validDate(day))throw new Error('Selecione uma data válida, a partir de hoje.');
   const catalog=await loadDriveCatalog(),count=Math.max(1,Math.min(12,Number(db.settings.postsPerDay)||3));
   db.meta.contentPlan=createWeeklyPlan(catalog.files||[],db.posts,day,count);await saveDb(db);return json(res,201,db.meta.contentPlan);
  }
  const match=u.pathname.match(/^\/social-api\/strategy\/entries\/([^/]+)\/(draft|regenerate|edit)$/);
  if(req.method==='POST'&&match){
   const plan=db.meta.contentPlan,entry=plan?.entries.find(e=>e.id===match[1]);if(!entry)throw new Error('Proposta não encontrada.');
   if(entry.postId){const linked=db.posts.find(p=>p.id===entry.postId);if(linked&&linked.status!=='deleted')return match[2]==='draft'?json(res,200,linked):json(res,409,{error:'Edite a postagem pela fila de Aprovações.'});}
   if(!validDate(entry.date))throw new Error('A data da proposta já passou. Gere um novo plano.');
   if(match[2]==='regenerate'){
    const catalog=await loadDriveCatalog(),file=catalog.files.find(f=>f.id===entry.sourceFileId);if(!file)throw new Error('Imagem removida; gere um novo plano.');
    const virtual=[...db.posts,...plan.entries.map(e=>({...e,createdAt:plan.createdAt}))];
    const content=composeStrategy(file,virtual,Number(entry.revisions||0)+1);Object.assign(entry,content,{revisions:Number(entry.revisions||0)+1});await saveDb(db);return json(res,200,entry);
   }
   if(match[2]==='edit'){
    const d=await body(req),copy=structuredClone(entry);
    for(const k of ['title','caption']){if(!String(d[k]||'').trim()||String(d[k]).length>2200)throw new Error('Informe título e legenda válidos.');copy[k]=String(d[k]).trim();}
    copy.strategy.hook=String(d.hook||copy.strategy.hook).slice(0,250);copy.strategy.hypothesis=String(d.hypothesis||copy.strategy.hypothesis).slice(0,600);
    copy.strategy.signature=crypto.createHash('sha256').update(copy.title+'|'+copy.caption).digest('hex');assertCreativeUnique(copy,db.posts);Object.assign(entry,copy);await saveDb(db);return json(res,200,entry);
   }
   assertCreativeUnique(entry,db.posts);
   const project=db.projects.find(p=>p.id===entry.projectId)||db.projects.find(p=>p.id==='rovix');
   const scheduledAt=scheduleFor(entry.date,entry.slot,Math.max(1,Number(db.settings.postsPerDay)||3),db.settings);
   if(Date.parse(scheduledAt)<=Date.now())throw new Error('O horário planejado já passou. Gere o plano a partir de amanhã.');
   const post={id:id('strategy'),projectId:project.id,projectName:project.name,title:entry.title,caption:entry.caption,strategy:structuredClone(entry.strategy),status:'draft',scheduledAt,generatedDate:entry.date,generatedBy:'agent',createdAt:new Date().toISOString(),artStatus:'pending',planEntryId:entry.id};
   if(db.meta.visualProfile?.enabled){post.imageProvider='ai-horde';post.visualProfile=structuredClone(db.meta.visualProfile);post.visualEngine='rovix-v7-profile-ai';}
   db.posts.unshift(post);entry.postId=post.id;await saveDb(db);return json(res,201,post);
  }
  const metrics=u.pathname.match(/^\/social-api\/strategy\/posts\/([^/]+)\/metrics$/);
  if(req.method==='POST'&&u.pathname===base+'/refresh-metrics'){const rows=db.posts.filter(p=>p.strategy&&p.status==='published'&&p.metaMediaId).slice(0,10);for(const post of rows)await refreshMetrics(post);await saveDb(db);return json(res,200,{updated:rows.length,results:rows.map(p=>({id:p.id,performance:p.performance}))});}
  if(req.method==='PUT'&&metrics){const post=db.posts.find(p=>p.id===metrics[1]&&p.status==='published');if(!post)throw new Error('Selecione uma postagem publicada.');const d=await body(req);post.performance={metrics:validateMetrics(d),source:'manual',updatedAt:new Date().toISOString()};await saveDb(db);return json(res,200,post.performance);}
  return json(res,404,{error:'Rota de estratégia não encontrada'});
 };
}

