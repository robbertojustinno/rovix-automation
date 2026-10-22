/* ROVIX Seaquest: independent browser implementation, no ROM or external runtime. */
(function(root){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const hit=(a,b)=>Math.abs(a.x-b.x)<(a.w+b.w)/2&&Math.abs(a.y-b.y)<(a.h+b.h)/2;
class Seaquest {
 constructor(random=Math.random){this.random=random;this.state='ready';this.events=[];this.reset();this.state='ready';}
 reset(mode='normal'){this.mode=mode;this.score=0;this.wave=1;this.lives=3;this.saved=0;this.oxygen=100;this.time=0;this.enemies=[];this.divers=[];this.bullets=[];this.shots=[];this.particles=[];this.spawn=1;this.diverSpawn=.8;this.cooldown=0;this.surface=false;this.events=[];this.player={x:320,y:150,w:32,h:16,dir:1,inv:2};this.state='playing';}
 event(name){this.events.push(name);}
 lose(){if(this.player.inv>0||this.state!=='playing')return;this.lives--;this.event('hit');if(this.lives<=0){this.state='over';return;}this.player={x:320,y:110,w:32,h:16,dir:1,inv:2.5};this.oxygen=100;this.saved=0;this.enemies=[];this.shots=[];this.bullets=[];this.surface=false;}
 update(dt,keys={}){
 if(this.state!=='playing')return;
 dt=clamp(dt,0,.05);this.time+=dt;const p=this.player,calm=this.mode==='calm',difficulty=Math.min(this.wave,12);
 p.inv=Math.max(0,p.inv-dt);this.cooldown-=dt;
 let dx=clamp(((keys.right?1:0)-(keys.left?1:0))+(keys.axisX||0),-1,1),dy=clamp(((keys.down?1:0)-(keys.up?1:0))+(keys.axisY||0),-1,1);let norm=1/Math.max(1,Math.hypot(dx,dy));
 if(dx)p.dir=dx>0?1:-1;p.x=clamp(p.x+dx*175*dt*norm,20,620);p.y=clamp(p.y+dy*145*dt*norm,77,303);
 if(keys.fire&&this.cooldown<=0){this.bullets.push({x:p.x+p.dir*22,y:p.y,w:10,h:3,v:p.dir*360});this.cooldown=.23;this.event('fire');}
 const atSurface=p.y<=80;
 if(atSurface){this.oxygen=Math.min(100,this.oxygen+65*dt);if(!this.surface){if(this.saved===6){this.score+=1000+Math.floor(this.oxygen)*10;this.wave++;this.saved=0;this.event('rescue');}else if(this.saved>0){this.saved--;this.event('partial');}}}
 else this.oxygen=Math.max(0,this.oxygen-dt*(calm?1.4:2.5));
 this.surface=atSurface;
 if(this.oxygen<=0){p.inv=0;this.lose();if(this.state==='over')return;}
 this.spawn-=dt;this.diverSpawn-=dt;
 if(this.spawn<=0){const dir=this.random()<.5?1:-1;this.enemies.push({x:dir===1?-28:668,y:108+Math.floor(this.random()*5)*38,w:32,h:16,dir,kind:this.random()<.38?'sub':'shark',v:(calm?48:65)+difficulty*8,shot:1.8+this.random()*2});this.spawn=(calm?1.65:1.1)/Math.min(2,1+difficulty*.07);}
 if(this.diverSpawn<=0){if(this.divers.length<4){const dir=this.random()<.5?1:-1;this.divers.push({x:dir===1?-12:652,y:146+Math.floor(this.random()*4)*40,w:16,h:16,dir});}this.diverSpawn=calm?2.2:2.8;}
 for(const b of this.bullets)b.x+=b.v*dt;
 for(const b of this.shots)b.x+=b.v*dt;
 for(const e of this.enemies){e.x+=e.dir*e.v*dt;e.shot-=dt;if(e.kind==='sub'&&e.shot<0&&!calm){this.shots.push({x:e.x,y:e.y,w:7,h:3,v:e.dir*175});e.shot=3;}}
 for(const d of this.divers){d.x+=d.dir*32*dt;if(this.saved<6&&hit(p,d)){d.dead=true;this.saved++;this.score+=50;this.event('pickup');}}
 for(const b of this.bullets){for(const e of this.enemies){if(!e.dead&&!b.dead&&hit(b,e)){e.dead=true;b.dead=true;this.score+=e.kind==='sub'?150:100;this.event('destroy');for(let i=0;i<8;i++)this.particles.push({x:e.x,y:e.y,vx:(this.random()-.5)*100,vy:(this.random()-.5)*100,t:.4});}}}
 for(const e of [...this.enemies,...this.shots])if(!e.dead&&hit(p,e)){this.lose();break;}
 this.enemies=this.enemies.filter(e=>!e.dead&&e.x>-55&&e.x<695);this.divers=this.divers.filter(d=>!d.dead&&d.x>-30&&d.x<670);this.bullets=this.bullets.filter(b=>!b.dead&&b.x>0&&b.x<640);this.shots=this.shots.filter(b=>b.x>0&&b.x<640);
 for(const b of this.particles){b.x+=b.vx*dt;b.y+=b.vy*dt;b.t-=dt;}this.particles=this.particles.filter(b=>b.t>0);
 }
}
if(typeof module!=='undefined'&&module.exports)module.exports={Seaquest,hit};
if(typeof document==='undefined')return;
const $=id=>document.getElementById(id),canvas=$('game'),c=canvas.getContext('2d'),g=new Seaquest(),keys={};
let best=0,sound=false,ac,last=0;try{best=Number(localStorage.getItem('rovix-seaquest-best'))||0;}catch{}
const sprites={sub:['0000111000000000','0000101000000000','0111111111111100','1111111111111110','1111001100111111','0111111111111100','0001111111100000'],shark:['0000001000000000','0000011100000001','0011111111110011','1111111111111111','0111111111110011','0000011110000001','0000000100000000'],diver:['000001100000','000001100000','001111111000','111001000110','000011100000','000110110000','001100011100']};
function sprite(name,x,y,dir,color,scale=2){c.save();c.translate(Math.round(x),Math.round(y));c.scale(dir,1);c.fillStyle=color;const rows=sprites[name];for(let yy=0;yy<rows.length;yy++)for(let xx=0;xx<rows[yy].length;xx++)if(rows[yy][xx]==='1')c.fillRect(xx*scale-rows[0].length*scale/2,yy*scale-rows.length*scale/2,scale,scale);if(name==='sub'){c.fillStyle='#072b40';c.fillRect(7*scale-16*scale/2,3*scale-7*scale/2,2*scale,scale);}c.restore();}
function text(t,x,y,size=12,color='#b9e5e0',align='left'){c.fillStyle=color;c.font=`bold ${size}px monospace`;c.textAlign=align;c.fillText(t,x,y);}
function draw(){
 c.fillStyle='#063a50';c.fillRect(0,0,640,360);
 for(let i=0;i<5;i++){c.fillStyle=['#07506a','#07465f','#073e57','#07374e','#082f46'][i];c.fillRect(0,86+i*46,640,46);}
 c.fillStyle='#123746';c.fillRect(0,0,640,56);text('PONTOS',18,18,9,'#82b3bb');text(String(g.score).padStart(6,'0'),18,39,19,'#f4cc74');text('RECORDE',320,18,9,'#82b3bb','center');text(String(Math.max(best,g.score)).padStart(6,'0'),320,37,16,'#f4cc74','center');text('MISSÃO '+String(g.wave).padStart(2,'0'),622,20,11,'#c7e5df','right');text('VIDAS '+ '♥'.repeat(g.lives),622,39,14,'#f0a074','right');
 c.fillStyle='#46adad';c.fillRect(0,64,640,3);for(let i=0;i<40;i++){c.fillStyle='#6bd2c0';c.fillRect((i*23+g.time*16)%660-20,66+Math.sin(i+g.time*2)*2,12,2);}
 for(let i=0;i<24;i++){c.strokeStyle='#72cbcf28';c.strokeRect((i*113)%640,88+((i*37-g.time*(12+i%7))%216+216)%216,2+i%2,3);}
 c.fillStyle='#0b2437';for(let i=0;i<32;i++)c.fillRect(i*22,306-(i*13%16),22,30);c.fillStyle='#29536a';for(let i=0;i<15;i++)c.fillRect(i*49+8,307-(i*7%17),3,15);
 for(const d of g.divers)sprite('diver',d.x,d.y,d.dir,'#91eac7',1.5);
 for(const e of g.enemies)sprite(e.kind,e.x,e.y,e.dir,e.kind==='sub'?'#e58b69':'#c5d8dd');
 c.fillStyle='#ffdf80';for(const b of g.bullets)c.fillRect(b.x-5,b.y-1,10,3);c.fillStyle='#ff8b70';for(const b of g.shots)c.fillRect(b.x-4,b.y-1,8,3);
 for(const b of g.particles){c.fillStyle=b.t>.2?'#fff1b2':'#f0a36b';c.fillRect(b.x,b.y,3,3);}
 if(g.player.inv<=0||Math.floor(g.time*10)%2===0||g.state==='ready')sprite('sub',g.player.x,g.player.y,g.player.dir,'#f5cc67');
 c.fillStyle='#081b2a';c.fillRect(0,322,640,38);text('O₂',16,344,14,g.oxygen<25?'#ff9a7d':'#83d5c5');c.fillStyle='#233d4b';c.fillRect(45,333,220,12);c.fillStyle=g.oxygen<25?'#ef865e':'#59d3b1';c.fillRect(45,333,220*g.oxygen/100,12);text(Math.ceil(g.oxygen)+'%',276,344,11);text('RESGATE',376,344,10);for(let i=0;i<6;i++){c.fillStyle=i<g.saved?'#f4cb74':'#29414d';c.fillRect(442+i*29,332,18,14);}
 if(g.state==='playing'&&g.saved===6)text('6 A BORDO — VOLTE À SUPERFÍCIE ↑',320,98,12,'#ffe39a','center');
 else if(g.state==='playing'&&g.oxygen<25)text('OXIGÊNIO BAIXO — SUBA ↑',320,98,12,'#ffa688','center');
}
function tone(freq,duration=.08){if(!sound||!ac)return;const o=ac.createOscillator(),v=ac.createGain();o.type='square';o.frequency.value=freq;v.gain.setValueAtTime(.035,ac.currentTime);v.gain.exponentialRampToValueAtTime(.001,ac.currentTime+duration);o.connect(v);v.connect(ac.destination);o.start();o.stop(ac.currentTime+duration);}
function audio(){if(!ac){const C=window.AudioContext||window.webkitAudioContext;if(C)ac=new C();}if(ac&&ac.state==='suspended')ac.resume().catch(()=>{});}
function overlay(title,message,hint){$('overlay').hidden=false;$('heading').textContent=title;$('message').textContent=message;$('hint').textContent=hint;}
const sensitivityLevels=[{label:'Baixa',gain:.6},{label:'Normal',gain:1},{label:'Alta',gain:1.6}];
let sensitivityIndex=1;
try{const saved=localStorage.getItem('rovix-seaquest-sensitivity');if(saved!==null&&['0','1','2'].includes(saved))sensitivityIndex=Number(saved);}catch{}
function showSensitivity(){const label=sensitivityLevels[sensitivityIndex].label;$('sensitivity').textContent='Sensibilidade: '+label;$('sensitivity').setAttribute('aria-label','Sensibilidade do analógico: '+label+'. Toque para alterar.');}
showSensitivity();
$('sensitivity').onclick=()=>{sensitivityIndex=(sensitivityIndex+1)%sensitivityLevels.length;resetStick();showSensitivity();try{localStorage.setItem('rovix-seaquest-sensitivity',String(sensitivityIndex));}catch{}$('notice').textContent='Sensibilidade '+sensitivityLevels[sensitivityIndex].label.toLowerCase()+': '+(sensitivityIndex===0?'movimento mais suave.':sensitivityIndex===2?'resposta rápida com menos deslocamento.':'resposta padrão.');};
let stickPointer=null;
function resetStick(){stickPointer=null;keys.axisX=0;keys.axisY=0;$('stick').style.transform='translate(0px,0px)';}
function clearKeys(){resetStick();for(const k in keys)delete keys[k];document.querySelectorAll('.held').forEach(b=>b.classList.remove('held'));}
function pause(){if(g.state==='playing'){g.state='paused';clearKeys();$('pause').textContent='Continuar';$('mobile-pause').textContent='▶ VOLTAR';overlay('PAUSADO','Respire. Sua missão espera por você.','Toque em Continuar ou pressione P');}else if(g.state==='paused'){g.state='playing';$('pause').textContent='Pausar';$('mobile-pause').textContent='Ⅱ PAUSA';$('overlay').hidden=true;}}
$('start').onclick=()=>{if(g.state==='playing'&&!confirm('Reiniciar a missão atual?'))return;audio();clearKeys();g.reset($('mode').value);$('overlay').hidden=true;$('start').textContent='↻ Reiniciar';$('pause').disabled=false;$('mobile-pause').disabled=false;$('pause').textContent='Pausar';$('mobile-pause').textContent='Ⅱ PAUSA';$('mode').disabled=true;$('start').blur();};
$('pause').onclick=pause;$('mobile-pause').onclick=pause;
$('sound').onclick=()=>{sound=!sound;audio();$('sound').textContent='Som: '+(sound?'ligado':'desligado');$('sound').setAttribute('aria-pressed',String(sound));tone(440);};
$('full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('screen').requestFullscreen)await $('screen').requestFullscreen();else $('notice').textContent='Tela cheia não disponível neste navegador. Vire o celular para ampliar.';}catch{$('notice').textContent='Não foi possível abrir a tela cheia neste navegador.';}};
const mapping={ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',' ':'fire'};
window.addEventListener('keydown',e=>{if(['SELECT','INPUT'].includes(e.target.tagName))return;const key=mapping[e.key]||mapping[e.key.toLowerCase()];if(key){e.preventDefault();keys[key]=true;}if(e.key.toLowerCase()==='p'&&!e.repeat)pause();});
window.addEventListener('keyup',e=>{const key=mapping[e.key]||mapping[e.key.toLowerCase()];if(key){e.preventDefault();keys[key]=false;}});
const joystick=$('joystick');
function moveStick(e){if(e.pointerId!==stickPointer)return;const r=joystick.getBoundingClientRect(),radius=r.width*.32;let x=(e.clientX-r.left-r.width/2)/radius,y=(e.clientY-r.top-r.height/2)/radius;const distance=Math.hypot(x,y),scale=1/Math.max(1,distance);x*=scale;y*=scale;const strength=Math.min(1,Math.max(0,(Math.min(1,distance)-.12)/.88)*sensitivityLevels[sensitivityIndex].gain),angle=Math.atan2(y,x);keys.axisX=Math.cos(angle)*strength;keys.axisY=Math.sin(angle)*strength;$('stick').style.transform='translate('+x*radius+'px,'+y*radius+'px)';}
joystick.addEventListener('pointerdown',e=>{if(stickPointer!==null)return;e.preventDefault();stickPointer=e.pointerId;joystick.setPointerCapture(e.pointerId);moveStick(e);});
joystick.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer){e.preventDefault();moveStick(e);}});
for(const type of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(type,e=>{if(e.pointerId===stickPointer)resetStick();});
for(const b of document.querySelectorAll('[data-key]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[b.dataset.key]=true;b.classList.add('held');});const release=()=>{keys[b.dataset.key]=false;b.classList.remove('held');};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);}
window.addEventListener('blur',()=>{clearKeys();if(g.state==='playing')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearKeys();if(g.state==='playing')pause();}});
function frame(t){const dt=last?Math.min((t-last)/1000,.05):0;last=t;const was=g.state;g.update(dt,keys);for(const event of g.events.splice(0)){tone({fire:190,pickup:740,rescue:1000,partial:180,hit:70,destroy:100}[event],event==='rescue'?.35:.08);if(event==='partial')$('notice').textContent='Oxigênio renovado. Um mergulhador perdido por voltar com equipe incompleta.';if(event==='rescue')$('notice').textContent='Equipe resgatada! Nova missão liberada.';}
 if(g.state==='over'&&was!=='over'){best=Math.max(best,g.score);try{localStorage.setItem('rovix-seaquest-best',String(best));}catch{}overlay('FIM DE MISSÃO',`Você fez ${g.score} pontos. Recorde: ${best}.`,'Toque em Reiniciar para tentar novamente');$('pause').disabled=true;$('mobile-pause').disabled=true;$('mode').disabled=false;}
 draw();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
})(typeof globalThis!=='undefined'?globalThis:this);
