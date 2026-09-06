function renderPrep(app){
 const t=state.teams[state.current],mode=modeForPosition(t.pos),meta=modeMeta(mode);
 app.innerHTML=`
 ${topbar()}
 <section class="card center">
  <div class="badge">${meta.icon} ${mode}</div>
  <h1 style="font-size:42px;margin:18px 0">${esc(t.name)}</h1>
  <p class="muted">Koliko tvegate v tej rundi?</p>
  <div class="difficultyGrid">
   <button class="success diffButton" onclick="chooseDifficulty(3)"><b>3</b><span>LAHKA</span></button>
   <button class="primary diffButton" onclick="chooseDifficulty(4)"><b>4</b><span>SREDNJA</span></button>
   <button class="danger diffButton" onclick="chooseDifficulty(5)"><b>5</b><span>TEŽKA</span></button>
  </div>
 </section>`;
}
function nextOpenFlag(){
 if(!Array.isArray(state.openBag)||state.openBag.length===0)state.openBag=shuffle([true,false,false,false,false,false]);
 return state.openBag.pop();
}
function pickTerm(diff,mode){
 const key=`${diff}:${mode}`,pool=TERMS.filter(t=>t.difficulty===Number(diff)&&t.mode===mode);
 if(!state.used[key])state.used[key]=[];
 let used=state.used[key];
 let available=pool.filter(t=>!used.includes(t.text));
 if(!available.length){used=[];state.used[key]=used;available=pool.slice()}
 const term=available[Math.floor(Math.random()*available.length)];
 state.used[key].push(term.text);return term;
}
function chooseDifficulty(diff){
 state.roundDifficulty=Number(diff);
 state.openRound=nextOpenFlag();
 const team=state.teams[state.current],mode=modeForPosition(team.pos);
 state.challenge={...pickTerm(diff,mode),mode};
 state.screen='challenge';save();render();
}
function renderChallenge(app){
 const c=state.challenge,meta=modeMeta(c.mode);
 app.innerHTML=`
 ${topbar(state.openRound?`<span class="badge openBadge">OPEN RUNDA</span>`:'')}
 <section class="card center">
  <div class="mode">${meta.icon} ${c.mode}</div>
  ${state.openRound?`<div class="badge openBadge">UGIBAJO VSE EKIPE</div>`:''}
  <div class="word">${esc(c.text)}</div>
  <div class="badge">${difficultyLabel(c.difficulty)} · ${c.difficulty} ${c.difficulty===5?'TOČK':'TOČKE'}</div>
  <p class="muted">${meta.help}</p>
  <div class="notice"><strong>Zapomni si pojem.</strong> Zaslon nato skrij pred ostalimi in začni rundo.</div>
  <button class="primary" style="width:100%;margin-top:14px" onclick="startRound()">SKRIJ IN ZAČNI</button>
 </section>`;
}

function initAudio(){try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}catch(e){}}
function beep(freq=760,duration=.07){
 try{
  if(!audioCtx)return;
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.frequency.value=freq;g.gain.value=.04;o.connect(g);g.connect(audioCtx.destination);
  o.start();o.stop(audioCtx.currentTime+duration);
 }catch(e){}
}
function startRound(){
 initAudio();lastBeepSecond=null;
 state.timerEnd=Date.now()+state.duration*1000;state.remaining=state.duration;
 state.screen=state.challenge.mode==='NARIŠI'?'draw':'timer';save();render();
}
function renderTimer(app){
 const c=state.challenge,meta=modeMeta(c.mode);
 app.innerHTML=`
 ${topbar(state.openRound?`<span class="badge openBadge">OPEN</span>`:`<span class="badge">${meta.icon} ${c.mode}</span>`)}
 <section class="card center">
  <div class="muted">${state.openRound?'Vse ekipe ugibajo':esc(state.teams[state.current].name)}</div>
  <div class="timer" id="timer">${state.remaining??state.duration}</div>
  <h2>Pojem je skrit</h2>
  <p class="muted">${meta.help}</p>
  <button class="secondary" style="width:100%" onclick="finishTimer()">ZAKLJUČI PREJ</button>
 </section>`;
 startClock();
}
function renderDraw(app){
 app.innerHTML=`
 <div class="canvasScreen">
  <div class="canvasBar">
   <span class="badge ${state.openRound?'openBadge':''}">✏️ ${state.openRound?'OPEN · NARIŠI':'NARIŠI'}</span>
   <button class="secondary small" onclick="undoCanvas()">Razveljavi</button>
   <button class="secondary small" onclick="clearCanvas()">Počisti</button>
   <button class="secondary small" onclick="finishTimer()">Končaj</button>
   <span class="canvasTimer" id="drawTimer">${state.remaining??state.duration}</span>
  </div>
  <canvas id="drawCanvas" aria-label="Risalna površina"></canvas>
 </div>`;
 requestAnimationFrame(()=>{initCanvas();startClock()});
}
function startClock(){tick();timerHandle=setInterval(tick,250)}
function tick(){
 const remaining=Math.max(0,Math.ceil((state.timerEnd-Date.now())/1000));
 state.remaining=remaining;
 const timer=document.getElementById('timer')||document.getElementById('drawTimer');
 if(timer){timer.textContent=remaining;timer.classList.toggle('low',remaining<=10)}
 if(remaining!==lastBeepSecond&&(remaining===10||(remaining<=5&&remaining>0))){
  lastBeepSecond=remaining;beep(remaining===10?650:820,.06);
  if(navigator.vibrate&&remaining<=3)navigator.vibrate(35);
 }
 if(remaining<=0){
  clearInterval(timerHandle);beep(420,.16);if(navigator.vibrate)navigator.vibrate([160,80,160]);
  state.screen='result';state.timerEnd=null;save();render();
 }
}
function finishTimer(){clearInterval(timerHandle);state.screen='result';state.timerEnd=null;save();render()}
