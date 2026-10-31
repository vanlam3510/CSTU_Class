const express = require('express');
const {createServer} = require('node:http');
const {Server} = require('socket.io');
const {randomUUID} = require('node:crypto');
const {nextWord} = require('./words');
function createGame({roundSeconds=60, breakMs=5000}={}) {
 const app=express(), server=createServer(app), io=new Server(server,{maxHttpBufferSize:16000});
 app.use(express.static(require('node:path').join(__dirname,'public')));
 app.get('/health',(_,res)=>res.json({ok:true}));
 const rooms=new Map();
 const floor=score=>Math.min(5,1+Math.floor(score/150));
 const players=r=>r.players.map(p=>({id:p.id,name:p.name,avatar:p.avatar,score:p.score,floor:floor(p.score),host:p.id===r.host}));
 function broadcast(r){for(const p of r.players) io.to(p.id).emit('state',{code:r.code,players:players(r),phase:r.phase,drawer:r.drawer,word:p.id===r.drawer?r.word:undefined,length:r.word.length,remaining:r.deadline?Math.max(0,Math.ceil((r.deadline-Date.now())/1000)):0,strokes:r.strokes,guessed:[...r.guessed],answer:r.phase==='break'||r.phase==='finished'?r.word:undefined,winner:r.winner});}
 function finish(r){if(r.phase!=='drawing')return; clearInterval(r.timer);r.timer=null; const d=r.players.find(p=>p.id===r.drawer);if(d)d.score+=25*r.guessed.size; const winner=[...r.players].sort((a,b)=>b.score-a.score).find(p=>p.score>=600);r.winner=winner?.name;r.phase=winner?'finished':'break';r.deadline=null;broadcast(r);if(!winner)r.next=setTimeout(()=>{if(r.players.length>=2)start(r);else {r.phase='lobby';broadcast(r);}},breakMs);}
 function start(r){clearTimeout(r.next);clearInterval(r.timer); const prev=r.players.findIndex(p=>p.id===r.drawer);r.drawer=r.players[(prev+1)%r.players.length].id;r.word=nextWord(r);r.phase='drawing';r.strokes=[];r.guessed=new Set();r.deadline=Date.now()+roundSeconds*1000;broadcast(r);r.timer=setInterval(()=>{if(Date.now()>=r.deadline)finish(r);else io.to(r.code).emit('tick',Math.max(0,Math.ceil((r.deadline-Date.now())/1000)));},250);}
 io.on('connection',s=>{
  let room;let lastGuess=0;let drawCount=0,drawWindow=Date.now();
  const error=message=>s.emit('notice',message);
  s.on('join',data=>{if(room)return error('You are already in a room.');if(!data||typeof data.name!=='string')return error('Enter a nickname.');const name=data.name.trim().slice(0,20);if(!name)return error('Enter a nickname.');let r;if(data.create){let code;do{code=randomUUID().slice(0,5).toUpperCase();}while(rooms.has(code));r={code,players:[],host:s.id,phase:'lobby',drawer:null,word:'',strokes:[],guessed:new Set()};rooms.set(code,r);}else{r=rooms.get(String(data.code||'').trim().toUpperCase());if(!r)return error('Room not found. Check the code.');if(r.players.length>=8)return error('This room is full.');if(!['lobby','finished'].includes(r.phase))return error('This game has started. Join when the match ends.');}room=r;s.join(r.code);r.players.push({id:s.id,name,avatar:['🦊','🐸','🐱','🤖','🦉','🐙'][Math.max(0,Number(data.avatar)||0)%6],score:0});broadcast(r);});
  s.on('start',()=>{if(!room||room.host!==s.id||!['lobby','finished'].includes(room.phase))return;if(room.players.length<2)return error('Invite at least one friend first.');room.players.forEach(p=>p.score=0);room.winner=null;start(room);});
  s.on('stroke',v=>{if(!room||room.phase!=='drawing'||room.drawer!==s.id)return;if(Date.now()-drawWindow>1000){drawWindow=Date.now();drawCount=0;}if(++drawCount>150||room.strokes.length>=15000)return;if(!v||![v.x,v.y,v.px,v.py,v.size].every(Number.isFinite)||[v.x,v.y,v.px,v.py].some(n=>n<0||n>1)||!/^#[0-9a-f]{6}$/i.test(v.color))return;const stroke={x:v.x,y:v.y,px:v.px,py:v.py,size:Math.max(1,Math.min(24,v.size)),color:v.color};room.strokes.push(stroke);s.to(room.code).emit('stroke',stroke);});
  s.on('clear',()=>{if(room?.phase==='drawing'&&room.drawer===s.id){room.strokes=[];io.to(room.code).emit('clear');}});
  s.on('guess',text=>{if(!room||room.phase!=='drawing'||room.drawer===s.id||room.guessed.has(s.id)||typeof text!=='string'||Date.now()-lastGuess<400)return;lastGuess=Date.now();text=text.trim().slice(0,100);if(!text)return;const p=room.players.find(p=>p.id===s.id);if(text.toUpperCase()===room.word){room.guessed.add(s.id);p.score+=room.guessed.size===1?100:room.guessed.size===2?75:50;io.to(room.code).emit('chat',{name:p.name,text:'guessed correctly! ✨'});if(room.guessed.size===room.players.length-1)finish(room);else broadcast(room);}else io.to(room.code).emit('chat',{name:p.name,text});});
  s.on('disconnect',()=>{if(!room)return;const r=room;r.players=r.players.filter(p=>p.id!==s.id);r.guessed.delete(s.id);if(!r.players.length){clearInterval(r.timer);clearTimeout(r.next);rooms.delete(r.code);return;}if(r.host===s.id)r.host=r.players[0].id;if(r.phase==='drawing'&&(r.drawer===s.id||r.players.length<2||r.guessed.size>=r.players.length-1))finish(r);else broadcast(r);});
 });
 return {server,io,close:()=>{for(const r of rooms.values()){clearInterval(r.timer);clearTimeout(r.next);}return new Promise(resolve=>io.close(resolve));}};
}
module.exports={createGame};
if(require.main===module){const {server}=createGame();server.listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('Doodle Ladder ready on port '+(process.env.PORT||3000)));}
