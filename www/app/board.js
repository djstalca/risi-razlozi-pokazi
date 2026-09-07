let fullMapOpen=false;
let lastBoardViewportRowCount=null;
let boardResizeTimer=null;

function scoresHtml(){
 return `<div class="scoreRow">${state.teams.map((t,i)=>`
  <div class="score ${i===state.current?'active':''}" title="${esc(t.name)}">
   <strong>${esc(t.name)}</strong><span>${t.pos===FINISH?'CILJ':`${t.pos}/${BOARD_FIELDS}`}</span>
  </div>`).join('')}</div>`;
}
function boardCell(pos){
 const isStart=pos===0,isFinish=pos===FINISH;
 const mode=isFinish?null:modeForPosition(pos),meta=mode?modeMeta(mode):null;
 const occupants=state.teams.map((t,i)=>t.pos===pos?{team:t,index:i}:null).filter(Boolean);
 const currentHere=state.teams[state.current] && state.teams[state.current].pos===pos;
 const cellClasses=[
  'cell',
  isStart?'start':'',
  isFinish?'finish':'',
  meta?meta.cls:'',
  occupants.length?'occupied':'',
  currentHere?'activeSpot':''
 ].filter(Boolean).join(' ');
 const pawns=occupants.length
  ? `<div class="pawns ${occupants.length===1?'single':''}" aria-label="${occupants.map(o=>`${o.team.name} na polju ${pos===FINISH?'cilj':pos}`).join(', ')}">
      ${occupants.map(o=>`<span class="pawn ${o.index===state.current?'active':''}" title="${esc(o.team.name)}" style="background:${teamColor(o.index)}">${o.index+1}</span>`).join('')}
     </div>`
  : '';
 const label=isStart?'START':isFinish?'CILJ':pos;
 return `<div class="${cellClasses}">
   <small>${label}</small>
   ${meta?`<span class="cellMode" aria-label="${mode}">${meta.icon}</span>`:''}
   ${pawns}
  </div>`;
}
function logicalBoardRows(){
 const rows=[];
 for(let start=0;start<50;start+=5){
  let row=[start,start+1,start+2,start+3,start+4];
  if((start/5)%2===1)row=row.reverse();
  rows.push(row);
 }
 return rows;
}
function desiredBoardViewportRows(){
 const height=Number(window.innerHeight)||800;
 return height<740?4:5;
}
function visibleBoardRowIndexes(positions,desiredRows=5){
 const safePositions=(Array.isArray(positions)&&positions.length?positions:[0]).map(pos=>clamp(pos,0,FINISH));
 const lastPosition=Math.min(...safePositions);
 const bottomRow=Math.floor(lastPosition/5);
 const count=Math.max(1,Math.min(clamp(desiredRows,1,5),10-bottomRow));
 const indexes=[];
 for(let row=bottomRow+count-1;row>=bottomRow;row--)indexes.push(row);
 return indexes;
}
function viewportBoardRows(desiredRows=desiredBoardViewportRows()){
 const rows=logicalBoardRows();
 return visibleBoardRowIndexes(state.teams.map(t=>t.pos),desiredRows).map(index=>rows[index]);
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
 return `<div class="board ${full?'fullBoard':''}">${rows.map(r=>`<div class="boardRow">${r.map(boardCell).join('')}</div>`).join('')}</div>${legend?modeLegendHtml():''}`;
}
function fullMapHtml(){
 return `<div class="fullMapOverlay" id="fullMapOverlay" role="dialog" aria-modal="true" aria-labelledby="fullMapTitle" onclick="closeFullMapOnBackdrop(event)">
  <div class="fullMapPanel">
   <div class="fullMapHeader">
    <div><div class="fullMapEyebrow">AKCIJA</div><strong id="fullMapTitle">Celotna mapa</strong></div>
    <button class="secondary small" id="fullMapClose" onclick="closeFullMap()" aria-label="Zapri celotno mapo">Zapri</button>
   </div>
   <div class="fullMapBoard">${boardHtml(fullBoardRows(),{legend:false,full:true})}</div>
   ${modeLegendHtml()}
  </div>
 </div>`;
}
function openFullMap(){
 fullMapOpen=true;render();
 requestAnimationFrame(()=>document.getElementById('fullMapClose')?.focus());
}
function closeFullMap(){
 fullMapOpen=false;render();
 requestAnimationFrame(()=>document.getElementById('openFullMap')?.focus());
}
function closeFullMapOnBackdrop(event){if(event.target?.id==='fullMapOverlay')closeFullMap()}
function renderBoard(app){
 app.className='app gameBoardApp';
 const t=state.teams[state.current];
 const mode=modeForPosition(t.pos),meta=modeMeta(mode);
 const desiredRows=desiredBoardViewportRows();
 lastBoardViewportRowCount=desiredRows;
 const visibleRows=viewportBoardRows(desiredRows);
 app.innerHTML=`<div class="gameBoardScreen">
 ${topbar(`<button class="secondary small" onclick="resetConfirm()">Nova igra</button>`)}
 ${scoresHtml()}
 ${state.lastMove?`<div class="compactNotice">${esc(state.lastMove)}</div>`:''}
 <section class="card boardViewportCard">
  <div class="boardToolbar">
   <span>Pot proti cilju</span>
   <button class="secondary mapButton" id="openFullMap" onclick="openFullMap()" aria-label="Prikaži celotno igralno mapo">Celotna mapa</button>
  </div>
  ${boardHtml(visibleRows)}
 </section>
 <section class="card turnCard">
  <div class="turnSummary">
   <div><span class="turnLabel">Na potezi</span><strong>${esc(t.name)}</strong></div>
   <div class="badge">${meta.icon} ${mode}</div>
  </div>
  <button class="primary turnAction" onclick="prepareRound()">IZBERI TEŽAVNOST</button>
 </section>
 ${fullMapOpen?fullMapHtml():''}
 </div>`;
}
function prepareRound(){
 fullMapOpen=false;state.lastMove=null;state.roundDifficulty=null;state.challenge=null;state.openRound=false;state.screen='prep';save();render();
}

if(typeof window!=='undefined'&&window.addEventListener){
 window.addEventListener('resize',()=>{
  if(state.screen!=='board'||fullMapOpen)return;
  clearTimeout(boardResizeTimer);
  boardResizeTimer=setTimeout(()=>{
   const next=desiredBoardViewportRows();
   if(next!==lastBoardViewportRowCount)render();
  },100);
 });
}
