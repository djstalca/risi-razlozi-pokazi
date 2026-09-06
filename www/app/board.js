function scoresHtml(){
 return `<div class="scoreRow">${state.teams.map((t,i)=>`
  <div class="score ${i===state.current?'active':''}">
   <strong>${esc(t.name)}</strong><span>${t.pos===FINISH?'CILJ':`${t.pos} / ${BOARD_FIELDS}`}</span>
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
function boardHtml(){
 const rows=[];
 for(let start=0;start<50;start+=5){
  let row=[start,start+1,start+2,start+3,start+4];
  if((start/5)%2===1)row=row.reverse();
  rows.push(row);
 }
 rows.reverse();
 return `<div class="board">${rows.map(r=>`<div class="boardRow">${r.map(boardCell).join('')}</div>`).join('')}</div>
 <div class="modeLegend">
  <span class="legendItem"><span class="legendMark" style="background:var(--explain)"></span>💬 Razloži</span>
  <span class="legendItem"><span class="legendMark" style="background:var(--draw)"></span>✏️ Nariši</span>
  <span class="legendItem"><span class="legendMark" style="background:var(--act)"></span>🙌 Pokaži</span>
 </div>`;
}
function renderBoard(app){
 const t=state.teams[state.current];
 const mode=modeForPosition(t.pos),meta=modeMeta(mode);
 app.innerHTML=`
 ${topbar(`<button class="secondary small" onclick="resetConfirm()">Nova igra</button>`)}
 ${scoresHtml()}
 ${state.lastMove?`<div class="notice ok" style="margin:12px 0">${esc(state.lastMove)}</div>`:''}
 <section class="card">${boardHtml()}</section>
 <section class="card center">
  <div class="badge">Na potezi</div>
  <h2 style="font-size:32px;margin:12px 0">${esc(t.name)}</h2>
  <div class="badge">${meta.icon} ${mode}</div>
  <p class="muted">Številka na figurici pomeni ekipo. Aktivna ekipa ima poudarjeno polje in pulzirajočo figurico.</p>
  <button class="primary" style="width:100%" onclick="prepareRound()">IZBERI TEŽAVNOST</button>
 </section>`;
}
function prepareRound(){
 state.lastMove=null;state.roundDifficulty=null;state.challenge=null;state.openRound=false;state.screen='prep';save();render();
}
