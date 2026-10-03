export const DRIVE_IMAGE_POLICY=Object.freeze({
  id:'rovix-drive-images-20261002',immutable:true,
  folderId:'b60d4a33-f1f9-4fa0-9530-1e79e77dc0fb',ownerId:'c926b386-69e0-4fbb-be99-6aa1a7872d86',
  path:'Meu Drive → ROVIX LinkedIn Agent → Imagens',
  authorized:true,source:'ROVIX Drive',
  rules:['As imagens desta pasta estão disponíveis e autorizadas para uso nas postagens ROVIX.',
    'Selecionar arquivos reais; priorizar imagens ainda não utilizadas; registrar arquivo e ciclo de uso.',
    'Reutilizar somente depois que todas as imagens disponíveis tiverem sido usadas, com texto novo.',
    'Criar título curto na arte e legenda em português relacionada ao assunto da imagem, com chamada para ação e hashtags.',
    'Preservar proporção e equipamento principal; não sobrepor texto em artes que já contenham texto.',
    'Não inventar resultados, especificações ou funcionalidades; usar rovixautomation.com.br.',
    'Aplicar as mesmas regras à criação manual pelo agente e à automação; manter após reinicializações e deploys.']
});
const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function driveContent(file,cycle=0){
 const n=normalize(file.name);let projectId='rovix',topic='Tecnologia aplicada',explanation='Automação começa com processos bem definidos, equipamentos adequados e informação acessível.',hashtags='#AutomacaoIndustrial #Tecnologia';
 if(/calibr|manomet|microm|sensor laser|medidor|medicao|termica|instrumento|inspecao/.test(n)){
  topic='Precisão em cada medição';explanation='Medições confiáveis exigem instrumentos adequados, procedimentos definidos e registros organizados. O acompanhamento de cada instrumento ajuda a planejar inspeções e calibrações.';hashtags='#Instrumentacao #Metrologia #Calibracao';
  if(/qr/.test(n)){projectId='tagcheck';topic='Rastreabilidade em campo';explanation='Identificar instrumentos e organizar seus registros facilita a consulta em campo. Conheça o TagCheck e acompanhe a evolução da gestão digital de ativos ROVIX.';hashtags+=' #TagCheck';}
 }else if(/plc|rs485|can|fibra|switch|conexao|integracao/.test(n)){
  topic='Conexões que movem a indústria';explanation='A comunicação entre controladores, sensores e sistemas de supervisão depende de uma rede bem planejada. Cabeamento, configuração e diagnóstico fazem parte de uma integração confiável.';hashtags='#RedesIndustriais #CLP #Integracao';
 }else if(/robo|robot|garra|paletizador|soldagem|cnc/.test(n)){
  topic='Precisão em movimento';explanation='A robótica industrial combina movimento controlado, ferramentas adequadas e integração com o processo. Cada aplicação precisa considerar a tarefa, a segurança e a qualidade esperada.';hashtags='#Robotica #AutomacaoIndustrial #Industria40';
 }else if(/cibern|cofre|nuvem/.test(n)){
  topic='Tecnologia com proteção';explanation='Organizar acessos, proteger informações e acompanhar os sistemas são cuidados essenciais em operações conectadas. A tecnologia deve caminhar junto com a segurança.';hashtags='#Ciberseguranca #Tecnologia #Dados';
 }else if(/scada/.test(n)){
  topic='Informação para decidir';explanation='A supervisão industrial reúne informações do processo para apoiar o acompanhamento da operação. Dados claros ajudam a equipe a reconhecer desvios e agir com mais contexto.';hashtags='#SCADA #Supervisao #AutomacaoIndustrial';
 }else if(/envase|mistura|pneumatico|triagem|elevador|servo/.test(n)){
  topic='Controle em cada etapa';explanation='Sensores, atuadores e controladores trabalham juntos para coordenar cada etapa da produção. Um processo bem integrado começa pela compreensão da operação e dos seus requisitos.';
 }
 const original=file.name.replace(/\.(png|jpe?g|webp)$/i,'');
 const titles=[topic,'Engenharia aplicada', 'Tecnologia que conecta', 'Processos sob controle'];
 const title=cycle===0?topic:titles[cycle%titles.length];
 return{projectId,title,sceneTitle:original,caption:original+'\n\n'+explanation+'\n\n'+(cycle?'Uma nova perspectiva sobre tecnologia aplicada à operação.\n\n':'')+'Conheça os projetos da ROVIX: https://rovixautomation.com.br\n\n#ROVIX '+hashtags,
   hasExistingText:/emblema|precisao que move|tecnologia aplicada ao mundo real|automacao industrial com robo rovix/.test(n)};
}
export function chooseDriveFile(files,posts){
 const eligible=files.filter(f=>/^image\/(png|jpeg|webp)$/.test(f.mime_type||'')&&f.object_key);
 if(!eligible.length)throw new Error('A pasta de imagens ROVIX está vazia ou ainda não foi sincronizada.');
 const ranked=eligible.map(file=>({file,uses:posts.filter(p=>p.driveFileId===file.id).length})).sort((a,b)=>a.uses-b.uses||a.file.name.localeCompare(b.file.name,'pt-BR'));
 return{file:ranked[0].file,cycle:ranked[0].uses};
}
