const RESULT_UNDO_MS=8000;
function renderResult(app){
 app.className='app stageApp resultStageApp';
 const c=state.challenge;
 if(state.openRound){
  app.innerHTML=`
  ${gameTopbar(`<span class="badge openBadge">OPEN RUNDA</span>`)}
  <section class="card center stageCard resultCard">
   <div class="word resultWord">${esc(c.text)}</div>
   <h2>Kdo je uganil?</h2>
   <div class="resultTeam">
    ${state.teams.map((t,i)=>i===state.current
      ?`<button class="success" onclick="resolveOpen(${i})">${esc(t.name)} · +6</button>`
      :`<button class="secondary" onclick="resolveOpen(${i})">${esc(t.name)} · +4 <span class="muted">(aktivna +2)</span></button>`
    ).join('')}
    <button class="danger" onclick="resolveOpen(-1)">NIHČE</button>
   </div>
  </section>`;
 }else{
  app.innerHTML=`
  ${gameTopbar()}
  <section class="card center stageCard resultCard">
   <div class="badge">${esc(state.teams[state.current].name)} · ${c.difficulty} ${c.difficulty===5?'TOČK':'TOČKE'}</div>
   <div class="word resultWord">${esc(c.text)}</div>
   <h2>Je uspelo?</h2>
   <div class="actions resultActions">
    <button class="success" onclick="resolveNormal(true)">USPELO</button>
    <button class="danger" onclick="resolveNormal(false)">NI USPELO</button>
   </div>
  </section>`;
 }
}
function resultUndoAvailable(){
 return Boolean(state.undoResult&&Number(state.undoResult.expiresAt)>Date.now()&&state.undoResult.snapshot);
}
function armResultUndo(){
 clearTimeout(undoExpiryTimer);
 state.undoResult={
  expiresAt:Date.now()+RESULT_UNDO_MS,
  snapshot:{
   teams:JSON.parse(JSON.stringify(state.teams)),
   current:state.current,
   challenge:state.challenge?JSON.parse(JSON.stringify(state.challenge)):null,
   roundDifficulty:state.roundDifficulty,
   openRound:state.openRound,
   termSwapUsed:state.termSwapUsed,
   stats:JSON.parse(JSON.stringify(state.stats)),
   lastMove:state.lastMove,
   winner:state.winner
  }
 };
}
function clearResultUndo(){
 clearTimeout(undoExpiryTimer);
 undoExpiryTimer=null;
 state.undoResult=null;
}
function undoResultHtml(disabled=false){
 if(!resultUndoAvailable())return '';
 return `<div class="undoResultBar">
  <span>Napačen rezultat?</span>
  <button class="secondary small" onclick="undoLastResult()" ${disabled?'disabled':''}>RAZVELJAVI</button>
 </div>`;
}
function scheduleUndoExpiry(){
 clearTimeout(undoExpiryTimer);
 if(!resultUndoAvailable()){
  if(state.undoResult){state.undoResult=null;save()}
  return;
 }
 const wait=Math.max(20,state.undoResult.expiresAt-Date.now()+30);
 undoExpiryTimer=setTimeout(()=>{
  if(resultUndoAvailable())return;
  state.undoResult=null;save();
  if(state.screen==='board'||state.screen==='winner')render();
 },wait);
}
function undoLastResult(){
 if(!resultUndoAvailable()){clearResultUndo();save();render();return}
 const snapshot=state.undoResult.snapshot;
 clearResultUndo();
 state.teams=JSON.parse(JSON.stringify(snapshot.teams));
 state.current=clamp(snapshot.current,0,state.teams.length-1);
 state.challenge=snapshot.challenge?JSON.parse(JSON.stringify(snapshot.challenge)):null;
 state.roundDifficulty=snapshot.roundDifficulty;
 state.openRound=Boolean(snapshot.openRound);
 state.termSwapUsed=Boolean(snapshot.termSwapUsed);
 state.stats=normalizeStats(snapshot.stats,state.teams.length);
 state.lastMove=snapshot.lastMove??null;
 state.winner=snapshot.winner??null;
 state.countdownEnd=null;
 state.timerEnd=null;
 state.remaining=0;
 state.screen='result';
 moveAnimations=[];
 moveVisualPositions=null;
 moveAnimationRunning=false;
 moveAnimationHighlight=null;
 moveAnimationFrames=[];
 moveAnimationFrameIndex=0;
 clearTimeout(moveAnimationTimer);
 challengeTermSeen=true;
 save();render();
}

function recordHardestGuess(teamIndex,challenge=state.challenge){
 const stats=teamStats(teamIndex);
 if(!challenge||![3,4,5].includes(Number(challenge.difficulty)))return;
 if(!stats.hardest||Number(challenge.difficulty)>Number(stats.hardest.difficulty)){
  stats.hardest={
   text:String(challenge.text||'').slice(0,120),
   difficulty:Number(challenge.difficulty),
   mode:challenge.mode
  };
 }
}
function recordNormalRoundStats(teamIndex,success){
 if(!state.stats)state.stats=freshStats(state.teams.length);
 state.stats.rounds+=1;
 const stats=teamStats(teamIndex);
 stats.rounds+=1;
 if(!success)return;
 const diff=Number(state.challenge?.difficulty);
 stats.normalWins+=1;
 if([3,4,5].includes(diff))stats.difficultyWins[diff]+=1;
 stats.pointsEarned+=diff||0;
 recordHardestGuess(teamIndex);
}
function recordOpenRoundStats(active,guesser){
 if(!state.stats)state.stats=freshStats(state.teams.length);
 state.stats.rounds+=1;
 state.stats.openRounds+=1;
 teamStats(active).rounds+=1;
 if(guesser<0)return;
 const guesserStats=teamStats(guesser);
 guesserStats.openGuesses+=1;
 recordHardestGuess(guesser);
 if(guesser===active){
  guesserStats.pointsEarned+=6;
 }else{
  guesserStats.pointsEarned+=4;
  teamStats(active).pointsEarned+=2;
 }
}
function gameSummaryHtml(ranking){
 const summary=normalizeStats(state.stats,state.teams.length);
 return `<section class="gameSummary">
  <div class="gameSummaryHeader">
   <div><span class="stageEyebrow">Povzetek igre</span><strong>${summary.rounds} rund</strong></div>
   <span class="badge">OPEN: ${summary.openRounds}</span>
  </div>
  <div class="gameSummaryGrid">
   ${ranking.map(t=>{
    const stats=summary.teams[t.i]||freshTeamStats();
    const hardest=stats.hardest
     ?`<div class="summaryHardest"><span>Najtežji zadetek</span><strong>${stats.hardest.difficulty} · ${esc(stats.hardest.text)}</strong></div>`
     :`<div class="summaryHardest"><span>Najtežji zadetek</span><strong>—</strong></div>`;
    return `<div class="summaryTeamCard" style="--team-color:${teamColor(t.i)}">
     <div class="summaryTeamTitle"><strong>${esc(t.name)}</strong><span>${stats.pointsEarned} točk</span></div>
     <div class="summaryMetrics">
      <span>Runde <b>${stats.rounds}</b></span>
      <span>Uspelo <b>${stats.normalWins}</b></span>
      <span>OPEN <b>${stats.openGuesses}</b></span>
      <span>3 / 4 / 5 <b>${stats.difficultyWins[3]} / ${stats.difficultyWins[4]} / ${stats.difficultyWins[5]}</b></span>
     </div>
     ${hardest}
    </div>`;
   }).join('')}
  </div>
 </section>`;
}
function applyMove(idx,points,allowBump){
 const finish=finishPosition();
 const team=state.teams[idx],old=team.pos;
 team.pos=Math.min(finish,team.pos+points);
 const bumped=[];
 const bumpedDetails=[];
 if(state.bumping&&allowBump&&team.pos>0&&team.pos<finish){
  state.teams.forEach((other,j)=>{
   if(j!==idx&&other.pos===team.pos){
    const from=other.pos;
    other.pos=Math.max(0,other.pos-1);
    bumped.push(j);
    bumpedDetails.push({team:j,from,pos:other.pos});
   }
  });
 }
 return {old,pos:team.pos,bumped,bumpedDetails,winner:team.pos>=finish};
}
function queueMoveAnimation(idx,result){
 moveAnimations.push({
  team:idx,
  from:result.old,
  pos:result.pos,
  bumped:result.bumped.slice(),
  bumpedDetails:result.bumpedDetails.map(b=>({...b})),
  createdAt:Date.now()
 });
}
function announceMove(idx,points,result){
 const finish=finishPosition();
 const from=Math.min(result.old,activeBoardFields());
 const to=result.pos>=finish?'CILJ':Math.min(result.pos,activeBoardFields());
 let text=`${state.teams[idx].name}: ${from} → ${to} (+${points}).`;
 if(result.bumped.length){
  text+=` Izbijanje: ${result.bumped.map(j=>state.teams[j].name).join(', ')} gre 1 polje nazaj.`;
 }
 state.lastMove=text;
}
function showWinningMove(idx){
 state.winner=idx;
 state.screen='board';
 save();render();
}
function resolveNormal(success){
 moveAnimations=[];
 armResultUndo();
 const mover=state.current;
 recordNormalRoundStats(mover,success);
 advancePresenter(mover);
 if(!success){
  state.lastMove=`${state.teams[mover].name}: brez premika.`;
  nextTurn();return;
 }
 const result=applyMove(mover,state.challenge.difficulty,true);
 queueMoveAnimation(mover,result);
 announceMove(mover,state.challenge.difficulty,result);
 if(result.winner){showWinningMove(mover);return}
 nextTurn();
}
function resolveOpen(idx){
 moveAnimations=[];
 armResultUndo();
 const active=state.current;
 recordOpenRoundStats(active,idx);
 advancePresenter(active);
 if(idx<0){state.lastMove='OPEN runda: nihče ni uganil.';nextTurn();return}
 if(idx===active){
  const result=applyMove(active,6,true);
  queueMoveAnimation(active,result);
  announceMove(active,6,result);
  if(result.winner){showWinningMove(active);return}
 }else{
  const guesserResult=applyMove(idx,4,false);
  const activeResult=applyMove(active,2,false);
  queueMoveAnimation(idx,guesserResult);
  queueMoveAnimation(active,activeResult);
  const guesserTo=guesserResult.pos>=finishPosition()?'CILJ':Math.min(guesserResult.pos,activeBoardFields());
  const activeTo=activeResult.pos>=finishPosition()?'CILJ':Math.min(activeResult.pos,activeBoardFields());
  state.lastMove=`OPEN: ${state.teams[idx].name} ${guesserResult.old} → ${guesserTo} (+4), ${state.teams[active].name} ${activeResult.old} → ${activeTo} (+2).`;
  if(guesserResult.winner){showWinningMove(idx);return}
  if(activeResult.winner){showWinningMove(active);return}
 }
 nextTurn();
}
function nextTurn(){
 challengeTermSeen=false;
 state.current=(state.current+1)%state.teams.length;
 state.challenge=null;state.roundDifficulty=null;state.openRound=false;state.termSwapUsed=false;state.countdownEnd=null;state.remaining=null;state.timerEnd=null;
 state.screen='board';save();render();
}
function finishGame(idx){state.winner=idx;state.screen='winner';save();render()}
function renderWinner(app){
 app.className='app winnerApp';
 const ranking=state.teams.map((t,i)=>({...t,i})).sort((a,b)=>b.pos-a.pos);
 const finish=finishPosition();
 app.innerHTML=`
 ${gameTopbar()}
 <section class="card center hero winnerCard">
  <div class="confetti">★ ★ ★</div>
  <div class="badge">ZMAGOVALEC</div>
  <h1>${esc(state.teams[state.winner].name)}</h1>
  <div class="stack winnerRanking">
   ${ranking.map((t,i)=>`<div class="score"><strong>${i+1}. ${esc(t.name)}</strong><span>${t.pos>=finish?'CILJ':`${t.pos} / ${activeBoardFields()}`}</span></div>`).join('')}
  </div>
  ${gameSummaryHtml(ranking)}
  ${undoResultHtml()}
  <div class="stack">
   <button class="primary" style="width:100%" onclick="replaySameTeams()">PONOVI Z ISTIMI EKIPAMI</button>
   <button class="secondary" style="width:100%" onclick="editCurrentSetup()">SPREMENI NASTAVITVE</button>
  </div>
 </section>`;
 scheduleUndoExpiry();
}
function resetConfirm(){if(confirm('Začnem novo igro? Trenutna igra bo izbrisana.'))newGameSetup()}
