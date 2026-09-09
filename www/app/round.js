function renderPrep(app){
 app.className='app stageApp';
 const t=state.teams[state.current],mode=modeForPosition(t.pos),meta=modeMeta(mode);
 app.innerHTML=`
 ${gameTopbar(`<span class="badge compactModeBadge">${meta.icon} ${mode}</span>`)}
 <section class="card center stageCard difficultyCard">
  <div class="stageEyebrow">Na potezi</div>
  <h1>${esc(t.name)}</h1>
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
 challengeTermSeen=false;
 state.roundDifficulty=Number(diff);
 state.openRound=nextOpenFlag();
 const team=state.teams[state.current],mode=modeForPosition(team.pos);
 state.challenge={...pickTerm(diff,mode),mode};
 state.screen='challenge';save();render();
}
function markChallengeTermSeen(){
 if(challengeTermSeen)return;
 challengeTermSeen=true;
 const startButton=document.getElementById('startRoundButton');
 if(startButton){startButton.disabled=false;startButton.removeAttribute('aria-disabled')}
 const hint=document.getElementById('termSeenHint');
 if(hint)hint.textContent='Pojem viden ✓';
}
function revealTerm(show,event){
 const word=document.getElementById('secretWord');
 const button=document.getElementById('revealTermButton');
 if(!word||!button)return;
 if(show){
  markChallengeTermSeen();
  if(event?.pointerId!==undefined){
   try{button.setPointerCapture(event.pointerId)}catch(e){}
  }
 }
 word.hidden=!show;
 button.classList.toggle('holding',show);
 button.setAttribute('aria-pressed',show?'true':'false');
 button.textContent=show?'SPUSTI, DA SKRIJEŠ POJEM':'PRITISNI IN DRŽI ZA POJEM';
}
function termRevealKey(event,show){
 if(![' ','Enter'].includes(event.key))return;
 event.preventDefault();
 revealTerm(show,event);
}
function renderChallenge(app){
 app.className='app challengeApp';
 const c=state.challenge,meta=modeMeta(c.mode),team=state.teams[state.current];
 const pointsLabel=`${c.difficulty} ${c.difficulty===5?'TOČK':'TOČKE'}`;
 app.innerHTML=`
 ${gameTopbar(state.openRound?`<span class="badge openBadge">OPEN RUNDA</span>`:'')}
 <section class="card center challengeCard">
  <div class="challengeMeta">${esc(team.name)} · ${meta.icon} ${c.mode} · ${pointsLabel}</div>
  ${state.openRound?`<div class="badge openBadge challengeOpen">UGIBAJO VSE EKIPE</div>`:''}
  <div class="secretTermBox">
   <div class="secretHint">Telefon naj gleda samo podajalec.</div>
   <div class="word secretWord" id="secretWord" hidden aria-live="polite">${esc(c.text)}</div>
   <button
    class="secondary revealTermButton"
    id="revealTermButton"
    aria-pressed="false"
    oncontextmenu="return false"
    onpointerdown="revealTerm(true,event)"
    onpointerup="revealTerm(false,event)"
    onpointercancel="revealTerm(false,event)"
    onpointerleave="revealTerm(false,event)"
    onkeydown="termRevealKey(event,true)"
    onkeyup="termRevealKey(event,false)"
   >PRITISNI IN DRŽI ZA POJEM</button>
   <div class="termSeenHint" id="termSeenHint">Najprej si oglej pojem</div>
  </div>
  <p class="muted challengeRule">${meta.help}</p>
  <button class="primary challengeStart" id="startRoundButton" style="width:100%" onclick="startRound()" ${challengeTermSeen?'':'disabled aria-disabled="true"'}>ZAČNI RUNDO</button>
 </section>`;
}

function initAudio(){
 if(!state.sound)return;
 try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}catch(e){}
}
function beep(freq=760,duration=.07){
 if(!state.sound)return;
 try{
  if(!audioCtx)return;
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.frequency.value=freq;g.gain.value=.04;o.connect(g);g.connect(audioCtx.destination);
  o.start();o.stop(audioCtx.currentTime+duration);
 }catch(e){}
}
function startRound(){
 if(!challengeTermSeen)return;
 initAudio();lastBeepSecond=null;
 state.timerEnd=Date.now()+state.duration*1000;state.remaining=state.duration;
 state.screen=state.challenge.mode==='NARIŠI'?'draw':'timer';save();render();
}
function renderTimer(app){
 app.className='app stageApp timerStageApp';
 const c=state.challenge,meta=modeMeta(c.mode);
 const remaining=state.remaining??state.duration;
 const progress=Math.max(0,Math.min(1,remaining/state.duration));
 app.innerHTML=`
 ${gameTopbar(state.openRound?`<span class="badge openBadge">OPEN</span>`:`<span class="badge compactModeBadge">${meta.icon} ${c.mode}</span>`)}
 <section class="card center stageCard timerCard">
  <div class="stageEyebrow">${state.openRound?'Vse ekipe ugibajo':esc(state.teams[state.current].name)}</div>
  <div class="timerRing ${remaining<=10?'low':''} ${remaining<=5?'urgent':''}" id="timerRing" style="--timer-progress:${progress*360}deg">
   <div class="timer" id="timer">${remaining}</div>
  </div>
  <h2>Pojem je skrit</h2>
  <p class="muted timerRule">${meta.help}</p>
  <button class="secondary timerFinish" style="width:100%" onclick="finishTimer()">ZAKLJUČI PREJ</button>
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
 const ring=document.getElementById('timerRing');
 if(ring){
  const progress=Math.max(0,Math.min(1,remaining/state.duration));
  ring.style.setProperty('--timer-progress',`${progress*360}deg`);
  ring.classList.toggle('low',remaining<=10);
  ring.classList.toggle('urgent',remaining<=5);
 }
 if(remaining!==lastBeepSecond&&(remaining===10||(remaining<=5&&remaining>0))){
  lastBeepSecond=remaining;beep(remaining===10?650:820,.06);
  if(remaining<=3)safeVibrate(35);
 }
 if(remaining<=0){
  clearInterval(timerHandle);beep(420,.16);safeVibrate([160,80,160]);
  state.screen='result';state.timerEnd=null;save();render();
 }
}
function finishTimer(){clearInterval(timerHandle);state.screen='result';state.timerEnd=null;save();render()}
