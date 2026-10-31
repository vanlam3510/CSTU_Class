const {test}=require('node:test');
const assert=require('node:assert/strict');
const {io}=require('socket.io-client');
const {createGame}=require('../server');
const once=(socket,event,predicate=()=>true)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{socket.off(event,handler);reject(new Error('Timed out waiting for '+event));},3000);function handler(value){if(!predicate(value))return;clearTimeout(timer);socket.off(event,handler);resolve(value);}socket.on(event,handler);});
test('two devices: lobby, permissions, drawing, secret, scores, rematch and host transfer',async t=>{
 const game=createGame({breakMs:20});await new Promise(r=>game.server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+game.server.address().port;const a=io(url,{forceNew:true}),b=io(url,{forceNew:true});t.after(async()=>{a.disconnect();b.disconnect();await game.close();});await Promise.all([once(a,'connect'),once(b,'connect')]);
 const response=await fetch(url);assert.equal(response.status,200);assert.match(await response.text(),/How to play/);
 let next=once(a,'state');a.emit('join',{create:true,name:'Artist',avatar:0});let state=await next;const code=state.code;
 next=once(b,'state');b.emit('join',{code,name:'Guesser',avatar:1});await next;
 // Non-host cannot start a match.
 let unauthorized=false;const detect=v=>{if(v.phase==='drawing')unauthorized=true;};a.on('state',detect);b.emit('start');await new Promise(r=>setTimeout(r,80));assert.equal(unauthorized,false);a.off('state',detect);
 let startedA=once(a,'state',s=>s.phase==='drawing'),startedB=once(b,'state',s=>s.phase==='drawing');a.emit('start');let [sa,sb]=await Promise.all([startedA,startedB]);assert.ok(sa.word);assert.equal(sb.word,undefined);assert.equal(sa.drawer,a.id);
 const stroke={x:.4,y:.4,px:.2,py:.2,size:5,color:'#000000'};next=once(b,'stroke');a.emit('stroke',stroke);assert.deepEqual(await next,stroke);
 let badStroke=false;a.on('stroke',()=>badStroke=true);b.emit('stroke',stroke);await new Promise(r=>setTimeout(r,80));assert.equal(badStroke,false);
 next=once(b,'state',s=>s.phase==='break');b.emit('guess',sa.word);state=await next;assert.equal(state.players.find(p=>p.id===a.id).score,25);assert.equal(state.players.find(p=>p.id===b.id).score,100);assert.equal(state.answer,sa.word);
 next=once(b,'state',s=>s.phase==='drawing');state=await next;assert.equal(state.drawer,b.id);assert.ok(state.word);
 next=once(b,'state',s=>s.phase==='break');a.disconnect();state=await next;assert.equal(state.players.length,1);assert.equal(state.players[0].host,true);
 next=once(b,'state',s=>s.phase==='lobby');await next;
});
test('round timer ends unanswered rounds',async t=>{const game=createGame({roundSeconds:1,breakMs:5000});await new Promise(r=>game.server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+game.server.address().port;const a=io(url),b=io(url);t.after(async()=>{a.disconnect();b.disconnect();await game.close();});await Promise.all([once(a,'connect'),once(b,'connect')]);let next=once(a,'state');a.emit('join',{create:true,name:'A'});const state=await next;next=once(b,'state');b.emit('join',{code:state.code,name:'B'});await next;next=once(b,'state',v=>v.phase==='break');a.emit('start');const ended=await next;assert.equal(ended.players.every(p=>p.score===0),true);assert.ok(ended.answer);});
test('complete match reaches 600 points and host can rematch',async t=>{
 const game=createGame({breakMs:450});await new Promise(r=>game.server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+game.server.address().port;const a=io(url),b=io(url);t.after(async()=>{a.disconnect();b.disconnect();await game.close();});await Promise.all([once(a,'connect'),once(b,'connect')]);let next=once(a,'state');a.emit('join',{create:true,name:'A'});const initial=await next;next=once(b,'state');b.emit('join',{code:initial.code,name:'B'});await next;
 let sa,sb;const collect=()=>Promise.all([once(a,'state',s=>s.phase==='drawing'),once(b,'state',s=>s.phase==='drawing')]);let started=collect();a.emit('start');[sa,sb]=await started;
 for(let round=0;round<12;round++){
 const drawer=sa.drawer===a.id?a:b,guesser=drawer===a?b:a,secret=drawer===a?sa.word:sb.word;
 next=once(a,'state',s=>s.phase==='break'||s.phase==='finished');guesser.emit('guess',secret);const ended=await next;
 if(ended.phase==='finished'){assert.equal(ended.players.some(p=>p.score>=600),true);started=collect();a.emit('start');const rematch=await started;assert.equal(rematch[0].players.every(p=>p.score===0),true);return;}
 started=collect();[sa,sb]=await started;
 }
 assert.fail('Match did not finish');
});
