const MODES = ['RAZLOŽI','NARIŠI','POKAŽI'];
const COLORS = ['var(--team1)','var(--team2)','var(--team3)','var(--team4)'];
const STORAGE_KEY = 'risi-razlozi-pokazi-game-v1';
const DAILY_TERMS_KEY = 'risi-razlozi-pokazi-daily-terms-v1';
const LEGACY_STORAGE_KEYS = ['akcija-game-v6'];
const MAX_BOARD_FIELDS = 48;
const VALID_GAME_LENGTHS = new Set([30,40,48]);
const VALID_SCREENS = new Set(['home','rules','settings','setup','board','prep','challenge','timer','draw','result','winner']);
const RESUMABLE_SCREENS = new Set(['board','prep','challenge','timer','draw','result','winner']);
const PASSIVE_SCREENS = new Set(['home','rules','settings']);
const VALID_DURATIONS = new Set([30,45,60,90]);

let pendingResumeScreen = null;
let timerHandle = null;
let canvasHistory = [];
let lastBeepSecond = null;
let audioCtx = null;
let moveAnimations = [];
let moveVisualPositions = null;
let moveAnimationRunning = false;
let moveAnimationHighlight = null;
let challengeTermSeen = false;

function freshState(){
 return {
  version:1,
  screen:'home',
  teams:[{name:'Ekipa 1',pos:0},{name:'Ekipa 2',pos:0}],
  current:0,
  duration:60,
  gameLength:48,
  bumping:true,
  sound:true,
  vibration:true,
  used:{},
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
function clamp(n,min,max){return Math.min(max,Math.max(min,Number.isFinite(Number(n))?Number(n):min))}
function activeBoardFields(){return VALID_GAME_LENGTHS.has(Number(state?.gameLength))?Number(state.gameLength):48}
function finishPosition(){return activeBoardFields()+1}
function gameLengthLabel(length=activeBoardFields()){
 const n=Number(length);
 return n===30?'Hitra':n===40?'Klasična':'Dolga';
}
function normalizeState(raw){
 const base=freshState();
 if(!raw||typeof raw!=='object')return base;
 const next={...base,...raw,version:1};
 next.gameLength=VALID_GAME_LENGTHS.has(Number(raw.gameLength))?Number(raw.gameLength):48;
 const finish=next.gameLength+1;
 next.teams=Array.isArray(raw.teams)?raw.teams.slice(0,4).map((t,i)=>({
  name:String(t?.name||`Ekipa ${i+1}`).trim().slice(0,40)||`Ekipa ${i+1}`,
  pos:clamp(t?.pos,0,finish)
 })):base.teams;
 while(next.teams.length<2)next.teams.push({name:`Ekipa ${next.teams.length+1}`,pos:0});
 next.current=clamp(raw.current,0,next.teams.length-1);
 next.duration=VALID_DURATIONS.has(Number(raw.duration))?Number(raw.duration):60;
 next.bumping=raw.bumping!==false;
 next.sound=raw.sound!==false;
 next.vibration=raw.vibration!==false;
 next.used=raw.used&&typeof raw.used==='object'&&!Array.isArray(raw.used)?raw.used:{};
 next.openBag=Array.isArray(raw.openBag)?raw.openBag.filter(v=>typeof v==='boolean').slice(0,6):[];
 next.openRound=Boolean(raw.openRound);
 next.roundDifficulty=[3,4,5].includes(Number(raw.roundDifficulty))?Number(raw.roundDifficulty):null;
 next.winner=Number.isInteger(raw.winner)&&raw.winner>=0&&raw.winner<next.teams.length?raw.winner:null;
 next.lastMove=typeof raw.lastMove==='string'?raw.lastMove.slice(0,240):null;
 next.screen=VALID_SCREENS.has(raw.screen)?raw.screen:'home';
 if(next.challenge){
  const c=next.challenge;
  if(!c||typeof c.text!=='string'||![3,4,5].includes(Number(c.difficulty))||!MODES.includes(c.mode))next.challenge=null;
 }
 if((next.screen==='timer'||next.screen==='draw')&&(!Number.isFinite(Number(next.timerEnd))||Number(next.timerEnd)<=Date.now())){
  next.screen=next.challenge?'result':'board';
  next.timerEnd=null;next.remaining=null;
 }
 if(next.winner!==null&&next.teams[next.winner]?.pos>=finish&&next.screen==='board')next.screen='winner';
 return next;
}
function readCachedState(){
 for(const key of [STORAGE_KEY,...LEGACY_STORAGE_KEYS]){
  try{
   const value=localStorage.getItem(key);
   if(!value)continue;
   const parsed=normalizeState(JSON.parse(value));
   if(key!==STORAGE_KEY)localStorage.setItem(STORAGE_KEY,JSON.stringify(parsed));
   return parsed;
  }catch(e){}
 }
 return null;
}
function localDayKey(date=new Date()){
 const year=date.getFullYear();
 const month=String(date.getMonth()+1).padStart(2,'0');
 const day=String(date.getDate()).padStart(2,'0');
 return `${year}-${month}-${day}`;
}
function dailyTermKey(text){return String(text||'').trim().toLocaleLowerCase('sl')}
function normalizeDailyTermsState(raw){
 const today=localDayKey();
 if(!raw||typeof raw!=='object'||raw.date!==today)return {date:today,terms:[]};
 const terms=Array.isArray(raw.terms)?raw.terms.map(dailyTermKey).filter(Boolean):[];
 return {date:today,terms:[...new Set(terms)].slice(0,720)};
}
function readDailyTermsState(){
 try{
  const value=localStorage.getItem(DAILY_TERMS_KEY);
  return normalizeDailyTermsState(value?JSON.parse(value):null);
 }catch(e){return normalizeDailyTermsState(null)}
}
let dailyTermsState=readDailyTermsState();
function dailyTermsUsed(){
 const normalized=normalizeDailyTermsState(dailyTermsState);
 if(normalized.date!==dailyTermsState.date||normalized.terms.length!==dailyTermsState.terms.length){
  dailyTermsState=normalized;
  saveDailyTermsState();
 }
 return new Set(dailyTermsState.terms);
}
function saveDailyTermsState(){
 dailyTermsState=normalizeDailyTermsState(dailyTermsState);
 const payload=JSON.stringify(dailyTermsState);
 try{localStorage.setItem(DAILY_TERMS_KEY,payload)}catch(e){}
 const prefs=preferencesPlugin();
 if(prefs?.set)prefs.set({key:DAILY_TERMS_KEY,value:payload}).catch(()=>{});
}
function rememberDailyTerm(text){
 const key=dailyTermKey(text);
 if(!key)return;
 dailyTermsState=normalizeDailyTermsState(dailyTermsState);
 if(dailyTermsState.terms.includes(key))return;
 dailyTermsState.terms.push(key);
 saveDailyTermsState();
}

function prepareLoadedState(loaded){
 const normalized=normalizeState(loaded);
 pendingResumeScreen=RESUMABLE_SCREENS.has(normalized.screen)?normalized.screen:null;
 if(pendingResumeScreen)normalized.screen='home';
 return normalized;
}
let state=prepareLoadedState(readCachedState()||freshState());

function storageSnapshot(){
 const snapshot=JSON.parse(JSON.stringify(state));
 if(pendingResumeScreen&&PASSIVE_SCREENS.has(snapshot.screen))snapshot.screen=pendingResumeScreen;
 return snapshot;
}
function preferencesPlugin(){return window.Capacitor?.Plugins?.Preferences||null}
function save(){
 const payload=JSON.stringify(storageSnapshot());
 try{localStorage.setItem(STORAGE_KEY,payload)}catch(e){}
 const prefs=preferencesPlugin();
 if(prefs?.set)prefs.set({key:STORAGE_KEY,value:payload}).catch(()=>{});
}
async function hydrateNativeState(){
 const prefs=preferencesPlugin();
 if(!prefs?.get)return;
 try{
  const [gameResult,dailyResult]=await Promise.all([
   prefs.get({key:STORAGE_KEY}),
   prefs.get({key:DAILY_TERMS_KEY})
  ]);
  if(gameResult?.value){
   state=prepareLoadedState(JSON.parse(gameResult.value));
   localStorage.setItem(STORAGE_KEY,JSON.stringify(storageSnapshot()));
  }
  if(dailyResult?.value){
   const nativeDaily=normalizeDailyTermsState(JSON.parse(dailyResult.value));
   const localDaily=normalizeDailyTermsState(dailyTermsState);
   dailyTermsState={
    date:localDayKey(),
    terms:[...new Set([...localDaily.terms,...nativeDaily.terms])].slice(0,720)
   };
   saveDailyTermsState();
  }
 }catch(e){console.warn('Native state restore skipped',e)}
}
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
function gameTopbar(extra=''){return `<div class="topbar inGameTopbar"><div class="logo">AKCIJA</div>${extra}</div>`}
function setScreen(screen){state.screen=screen;save();render()}
function safeVibrate(pattern){
 if(!state.vibration||!navigator.vibrate)return;
 try{navigator.vibrate(pattern)}catch(e){}
}

function render(){
 clearInterval(timerHandle);
 const app=document.getElementById('app');
 if(!app)return;
 app.className=state.screen==='draw'?'':'app';
 if(state.screen==='home')return renderHome(app);
 if(state.screen==='rules')return renderRules(app);
 if(state.screen==='settings')return renderSettings(app);
 if(state.screen==='setup')return renderSetup(app);
 if(state.screen==='board')return renderBoard(app);
 if(state.screen==='prep')return renderPrep(app);
 if(state.screen==='challenge')return renderChallenge(app);
 if(state.screen==='timer')return renderTimer(app);
 if(state.screen==='draw')return renderDraw(app);
 if(state.screen==='result')return renderResult(app);
 if(state.screen==='winner')return renderWinner(app);
}
