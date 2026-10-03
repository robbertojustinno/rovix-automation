import http from "node:http";
import {handleOrpheusAgent} from "./linkedin-orpheus-agent.mjs";
const PORT=Number(process.env.PORT||10000);
const server=http.createServer(async(req,res)=>{
  try{if(await handleOrpheusAgent(req,res))return}catch(e){console.error("[ORPHEUS Request]",e.message);if(!res.headersSent){res.writeHead(500,{"Content-Type":"application/json"});res.end(JSON.stringify({error:"Falha temporária no servidor"}))}else res.end();return}
  if(req.url==="/health"){
    res.writeHead(200,{"Content-Type":"application/json; charset=utf-8"});
    res.end(JSON.stringify({ok:true,service:"linkedin-orpheus-social-agent",version:"0.8.0",visualEngine:"linkedin-orpheus-v3.3-original-scenes-free"}));
    return;
  }
  res.writeHead(404,{"Content-Type":"application/json; charset=utf-8"});
  res.end(JSON.stringify({error:"not_found"}));
});
server.listen(PORT,"0.0.0.0",()=>console.log("ORPHEUS LinkedIn Agent listening on",PORT));