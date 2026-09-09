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
 if(!success){nextTurn();return}
 const mover=state.current;
 const result=applyMove(mover,state.challenge.difficulty,true);
 queueMoveAnimation(mover,result);
 announceMove(mover,state.challenge.difficulty,result);
 if(result.winner){showWinningMove(mover);return}
 nextTurn();
}
function resolveOpen(idx){
 moveAnimations=[];
 if(idx<0){state.lastMove='OPEN runda: nihče ni uganil.';nextTurn();return}
 const active=state.current;
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
 state.challenge=null;state.roundDifficulty=null;state.openRound=false;state.remaining=null;state.timerEnd=null;
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
  <div class="stack">
   <button class="primary" style="width:100%" onclick="replaySameTeams()">PONOVI Z ISTIMI EKIPAMI</button>
   <button class="secondary" style="width:100%" onclick="editCurrentSetup()">SPREMENI NASTAVITVE</button>
  </div>
 </section>`;
}
function resetConfirm(){if(confirm('Začnem novo igro? Trenutna igra bo izbrisana.'))newGameSetup()}
