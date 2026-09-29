import http from "node:http";
import {handleOrpheusAgent} from "./orpheus-agent.mjs";
const PORT=Number(process.env.PORT||10000);
const server=http.createServer(async(req,res)=>{
  if(await handleOrpheusAgent(req,res))return;
  if(req.url==="/health"){
    res.writeHead(200,{"Content-Type":"application/json; charset=utf-8"});
    res.end(JSON.stringify({ok:true,service:"orpheus-social-agent"}));
    return;
  }
  res.writeHead(404,{"Content-Type":"application/json; charset=utf-8"});
  res.end(JSON.stringify({error:"not_found"}));
});
server.listen(PORT,"0.0.0.0",()=>console.log("ORPHEUS Social Agent listening on",PORT));