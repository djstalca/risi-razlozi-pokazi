const MODES = ['RAZLOŽI','NARIŠI','POKAŽI'];
const COLORS = ['var(--team1)','var(--team2)','var(--team3)','var(--team4)'];
const STORAGE_KEY = 'akcija-game-v6';
const BOARD_FIELDS = 48;
const FINISH = 49;

let state = load() || freshState();
let timerHandle = null;
let canvasHistory = [];
let lastBeepSecond = null;
let audioCtx = null;

function freshState(){
 return {
  screen:'home',
  teams:[{name:'Ekipa 1',pos:0},{name:'Ekipa 2',pos:0}],
  current:0,
  duration:60,
  bumping:true,
  used:{"3":[],"4":[],"5":[]},
  challenge:null,
  roundDifficulty:null,
  openRound:false,
  openBag:[],
  timerEnd:null,
  remaining:null,
  winner:null,
  lastMove:null
 };
}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function load(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))}catch(e){return null}}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function teamColor(i){return COLORS[i%COLORS.length]}
function modeForPosition(pos){if(pos<=0)return 'RAZLOŽI';return MODES[(pos-1)%3]}
function modeMeta(mode){
 if(mode==='NARIŠI')return {icon:'✏️',cls:'draw',help:'Riši brez črk in številk. Ne govori in ne gestikuliraj.'};
 if(mode==='POKAŽI')return {icon:'🙌',cls:'act',help:'Brez govora, zvokov in predmetov. Na svoje dele telesa lahko pokažeš.'};
 return {icon:'💬',cls:'explain',help:'Opisuj z besedami, vendar ne uporabi pojma, njegovih delov ali izpeljank.'};
}
function difficultyLabel(d){return d===3?'LAHKA':d===4?'SREDNJA':'TEŽKA'}
function topbar(extra=''){return `<div class="topbar"><div class="logo">AKCIJA</div>${extra}</div>`}
function setScreen(screen){state.screen=screen;save();render()}

function render(){
 clearInterval(timerHandle);
 const app=document.getElementById('app');
 app.className=state.screen==='draw'?'':'app';
 if(state.screen==='home')return renderHome(app);
 if(state.screen==='rules')return renderRules(app);
 if(state.screen==='setup')return renderSetup(app);
 if(state.screen==='board')return renderBoard(app);
 if(state.screen==='prep')return renderPrep(app);
 if(state.screen==='challenge')return renderChallenge(app);
 if(state.screen==='timer')return renderTimer(app);
 if(state.screen==='draw')return renderDraw(app);
 if(state.screen==='result')return renderResult(app);
 if(state.screen==='winner')return renderWinner(app);
}
