let fullMapOpen=false;
let lastBoardViewportRowCount=5;
let boardResizeTimer=null;
let boardMeasureRaf=null;
let moveAnimationTimer=null;
let moveAnimationFrames=[];
let moveAnimationFrameIndex=0;

function displayTeamPosition(i){
 const visual=moveVisualPositions?.[i];
 return Number.isFinite(visual)?visual:state.teams[i].pos;
}
function displayTeamPositions(){return state.teams.map((_,i)=>displayTeamPosition(i))}
function scoresHtml(){
 const finish=finishPosition();
 return `<div class="scoreRow teams-${state.teams.length}">${state.teams.map((t,i)=>{
  const pos=displayTeamPosition(i);
  const active=i===state.current;
  return `<div class="score ${active?'active':''}" title="${esc(t.name)}" ${active?`style="--active-team-color:${teamColor(i)}"`:''}>
   <strong>${esc(t.name)}</strong><span>${pos>=finish?'CILJ':`${Math.min(pos,activeBoardFields())}/${activeBoardFields()}`}</span>
  </div>`;
 }).join('')}</div>`;
}
function boardCell(pos){
 if(pos===null||pos===undefined)return `<div class="cell boardSpacer" aria-hidden="true"></div>`;
 const finish=finishPosition();
 const isStart=pos===0,isFinish=pos===finish;
 const mode=isFinish?null:modeForPosition(pos),meta=mode?modeMeta(mode):null;
 const occupants=state.teams.map((t,i)=>displayTeamPosition(i)===pos?{team:t,index:i}:null).filter(Boolean);
 const currentHere=state.teams[state.current] && displayTeamPosition(state.current)===pos;
 const landingHere=moveAnimationHighlight?.type==='move'&&moveAnimationHighlight.pos===pos;
 const bumpedHere=moveAnimationHighlight?.type==='bump'&&moveAnimationHighlight.pos===pos;
 const cellClasses=[
  'cell',
  isStart?'start':'',
  isFinish?'finish':'',
  meta?meta.cls:'',
  occupants.length?'occupied':'',
  currentHere?'activeSpot':'',
  landingHere?'moveLand':'',
  bumpedHere?'moveBump':''
 ].filter(Boolean).join(' ');
 const pawns=occupants.length
  ? `<div class="pawns ${occupants.length===1?'single':''}" aria-label="${occupants.map(o=>`${o.team.name} na polju ${isFinish?'cilj':pos}`).join(', ')}">
      ${occupants.map(o=>{
       const moved=moveAnimationHighlight?.type==='move'&&moveAnimationHighlight.team===o.index;
       const bumped=moveAnimationHighlight?.type==='bump'&&moveAnimationHighlight.team===o.index;
       return `<span class="pawn ${o.index===state.current?'active':''} ${moved?'movedPawn':''} ${bumped?'bumpedPawn':''}" title="${esc(o.team.name)}" style="background:${teamColor(o.index)};--active-team-color:${teamColor(o.index)}">${o.index+1}</span>`;
      }).join('')}
     </div>`
  : '';
 const label=isStart?'START':isFinish?'CILJ':pos;
 return `<div class="${cellClasses}" ${currentHere?`style="--active-team-color:${teamColor(state.current)}"`:''}>
   <small>${label}</small>
   ${meta?`<span class="cellMode" aria-label="${mode}">${meta.icon}</span>`:''}
   ${pawns}
  </div>`;
}
function logicalBoardRows(){
 const positions=[0];
 for(let pos=1;pos<=activeBoardFields();pos++)positions.push(pos);
 positions.push(finishPosition());
 const rows=[];
 for(let i=0;i<positions.length;i+=5){
  let row=positions.slice(i,i+5);
  while(row.length<5)row.push(null);
  if(rows.length%2===1)row=row.reverse();
  rows.push(row);
 }
 return rows;
}
function responsiveBoardRowCountFromSpace(availableHeight,boardWidth,rowGap=4,totalRows=logicalBoardRows().length){
 const height=Math.max(0,Number(availableHeight)||0);
 const width=Math.max(0,Number(boardWidth)||0);
 const gap=Math.max(0,Number(rowGap)||0);
 const rows=Math.max(1,Number(totalRows)||1);
 const cellWidth=Math.max(0,(width-gap*4)/5);
 const comfortableRowHeight=clamp(cellWidth*.82,56,72);
 const fitted=Math.floor((height+gap)/(comfortableRowHeight+gap));
 return Math.max(1,Math.min(rows,clamp(fitted,3,rows)));
}
function measureResponsiveBoardRowCount(){
 if(typeof document==='undefined'||typeof document.querySelector!=='function')return null;
 const board=document.querySelector('.boardViewportCard .board');
 if(!board)return null;
 let gap=4;
 if(typeof getComputedStyle==='function'){
  const styles=getComputedStyle(board);
  gap=parseFloat(styles.rowGap||styles.gap)||4;
 }
 return responsiveBoardRowCountFromSpace(board.clientHeight,board.clientWidth,gap,logicalBoardRows().length);
}
function syncResponsiveBoardRows(){
 if(state.screen!=='board'||fullMapOpen)return;
 const next=measureResponsiveBoardRowCount();
 if(!Number.isInteger(next)||next===lastBoardViewportRowCount)return;
 lastBoardViewportRowCount=next;
 render();
}
function scheduleResponsiveBoardMeasure(){
 if(typeof requestAnimationFrame!=='function')return;
 if(boardMeasureRaf&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(boardMeasureRaf);
 boardMeasureRaf=requestAnimationFrame(()=>{
  boardMeasureRaf=null;
  syncResponsiveBoardRows();
 });
}
function visibleBoardRowIndexes(positions,desiredRows=lastBoardViewportRowCount||5){
 const rows=logicalBoardRows();
 const safePositions=(Array.isArray(positions)&&positions.length?positions:[0]).map(pos=>clamp(pos,0,finishPosition()));
 const lastPosition=Math.min(...safePositions);
 const bottomRow=Math.min(rows.length-1,Math.floor(lastPosition/5));
 const count=Math.max(1,Math.min(clamp(desiredRows,1,rows.length),rows.length-bottomRow));
 const indexes=[];
 for(let row=bottomRow+count-1;row>=bottomRow;row--)indexes.push(row);
 return indexes;
}
function viewportBoardRows(desiredRows=lastBoardViewportRowCount||5){
 const rows=logicalBoardRows();
 return visibleBoardRowIndexes(displayTeamPositions(),desiredRows).map(index=>rows[index]);
}
function fullBoardRows(){return logicalBoardRows().slice().reverse()}
function modeLegendHtml(){
 return `<div class="modeLegend">
  <span class="legendItem"><span class="legendMark" style="background:var(--explain)"></span>💬 Razloži</span>
  <span class="legendItem"><span class="legendMark" style="background:var(--draw)"></span>✏️ Nariši</span>
  <span class="legendItem"><span class="legendMark" style="background:var(--act)"></span>🙌 Pokaži</span>
 </div>`;
}
function boardHtml(rows,{legend=true,full=false}={}){
 return `<div class="board ${full?'fullBoard':''}" style="--board-row-count:${rows.length}">${rows.map(r=>`<div class="boardRow">${r.map(boardCell).join('')}</div>`).join('')}</div>${legend?modeLegendHtml():''}`;
}
function fullMapHtml(){
 return `<div class="fullMapOverlay" id="fullMapOverlay" role="dialog" aria-modal="true" aria-labelledby="fullMapTitle" onclick="closeFullMapOnBackdrop(event)">
  <div class="fullMapPanel">
   <div class="fullMapHeader">
    <div><div class="fullMapEyebrow">AKCIJA · ${gameLengthLabel().toUpperCase()}</div><strong id="fullMapTitle">Celotna mapa · ${activeBoardFields()} polj</strong></div>
    <button class="secondary small" id="fullMapClose" onclick="closeFullMap()" aria-label="Zapri celotno mapo">Zapri</button>
   </div>
   <div class="fullMapBoard">${boardHtml(fullBoardRows(),{legend:false,full:true})}</div>
   ${modeLegendHtml()}
  </div>
 </div>`;
}
function openFullMap(){
 if(moveAnimationRunning||moveAnimations.length)return;
 fullMapOpen=true;render();
 requestAnimationFrame(()=>document.getElementById('fullMapClose')?.focus());
}
function closeFullMap(){
 fullMapOpen=false;render();
 requestAnimationFrame(()=>document.getElementById('openFullMap')?.focus());
}
function closeFullMapOnBackdrop(event){if(event.target?.id==='fullMapOverlay')closeFullMap()}

function prepareMoveAnimation(){
 if(moveAnimationRunning||moveVisualPositions||!moveAnimations.length)return;
 moveVisualPositions=state.teams.map(t=>t.pos);
 moveAnimationFrames=[];
 moveAnimationFrameIndex=0;
 for(const animation of moveAnimations){
  moveVisualPositions[animation.team]=animation.from;
  for(const bump of animation.bumpedDetails||[])moveVisualPositions[bump.team]=bump.from;
 }
 for(const animation of moveAnimations){
  for(let pos=animation.from+1;pos<=animation.pos;pos++){
   moveAnimationFrames.push({type:'move',team:animation.team,pos});
  }
  for(const bump of animation.bumpedDetails||[]){
   moveAnimationFrames.push({type:'bump',team:bump.team,pos:bump.pos});
  }
 }
}
function startPreparedMoveAnimation(){
 if(moveAnimationRunning||!moveAnimationFrames.length){
  if(!moveAnimationFrames.length&&moveAnimations.length)finishMoveAnimation();
  return;
 }
 moveAnimationRunning=true;
 const step=()=>{
  if(moveAnimationFrameIndex>=moveAnimationFrames.length){finishMoveAnimation();return;}
  const frame=moveAnimationFrames[moveAnimationFrameIndex++];
  moveVisualPositions[frame.team]=frame.pos;
  moveAnimationHighlight=frame;
  render();
  const delay=frame.type==='bump'?220:120;
  moveAnimationTimer=setTimeout(step,delay);
 };
 moveAnimationTimer=setTimeout(step,90);
}
function finishMoveAnimation(){
 clearTimeout(moveAnimationTimer);
 moveAnimationRunning=false;
 moveAnimationFrames=[];
 moveAnimationFrameIndex=0;
 moveAnimationHighlight=null;
 moveVisualPositions=null;
 moveAnimations=[];
 if(state.winner!==null&&state.teams[state.winner]?.pos>=finishPosition()){
  state.screen='winner';save();render();return;
 }
 render();
}

function renderBoard(app){
 app.className='app gameBoardApp';
 if(moveAnimations.length&&!moveAnimationRunning&&!moveVisualPositions)prepareMoveAnimation();
 const t=state.teams[state.current],presenter=teamPresenter(t);
 const mode=modeForPosition(displayTeamPosition(state.current)),meta=modeMeta(mode);
 const visibleRows=viewportBoardRows(lastBoardViewportRowCount||5);
 const animating=moveAnimationRunning||moveAnimations.length>0||Boolean(moveVisualPositions);
 app.innerHTML=`<div class="gameBoardScreen">
 ${gameTopbar(`<button class="secondary small" onclick="resetConfirm()" ${animating?'disabled':''}>Nova igra</button>`)}
 ${scoresHtml()}
 ${state.lastMove?`<div class="compactNotice">${esc(state.lastMove)}</div>`:''}
 ${undoResultHtml(animating)}
 <section class="card boardViewportCard">
  <div class="boardToolbar">
   <span>${gameLengthLabel()} · ${activeBoardFields()} polj</span>
   <button class="secondary mapButton" id="openFullMap" onclick="openFullMap()" aria-label="Prikaži celotno igralno mapo" ${animating?'disabled':''}>Celotna mapa</button>
  </div>
  ${boardHtml(visibleRows)}
 </section>
 <section class="card turnCard" style="--active-team-color:${teamColor(state.current)}">
  <div class="turnSummary">
   <div><span class="turnLabel">${animating?'Premik poteka':'Na potezi'}</span><strong>${esc(t.name)}</strong>${presenter?`<span class="presenterLine">Podaja: ${esc(presenter)}</span>`:''}</div>
   <div class="badge">${meta.icon} ${mode}</div>
  </div>
  <button class="primary turnAction" onclick="prepareRound()" ${animating?'disabled':''}>${animating?'PREMIK ...':'IZBERI TEŽAVNOST'}</button>
 </section>
 ${fullMapOpen?fullMapHtml():''}
 </div>`;
 if(moveVisualPositions&&!moveAnimationRunning&&moveAnimationFrames.length){
  requestAnimationFrame(startPreparedMoveAnimation);
 }
 if(!fullMapOpen)scheduleResponsiveBoardMeasure();
 scheduleUndoExpiry();
}
function prepareRound(){
 if(moveAnimationRunning||moveAnimations.length)return;
 clearResultUndo();
 challengeTermSeen=false;
 state.termSwapUsed=false;
 fullMapOpen=false;state.lastMove=null;state.roundDifficulty=null;state.challenge=null;state.openRound=false;state.screen='prep';save();render();
}

function handleBoardViewportResize(){
 if(state.screen!=='board'||fullMapOpen)return;
 clearTimeout(boardResizeTimer);
 boardResizeTimer=setTimeout(scheduleResponsiveBoardMeasure,80);
}
if(typeof window!=='undefined'&&window.addEventListener){
 window.addEventListener('resize',handleBoardViewportResize);
 window.visualViewport?.addEventListener?.('resize',handleBoardViewportResize);
}
