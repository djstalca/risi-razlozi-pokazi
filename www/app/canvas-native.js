let canvasResizeTimer=null;

function configureCanvasContext(c){
 const dpr=Math.max(1,window.devicePixelRatio||1);
 const ctx=c.getContext('2d');
 ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.lineWidth=5;
 ctx.lineCap='round';
 ctx.lineJoin='round';
 ctx.strokeStyle='#111';
 return {ctx,dpr};
}
function resizeCanvasPreserve(){
 const c=document.getElementById('drawCanvas');if(!c)return;
 const old=document.createElement('canvas');
 old.width=c.width;old.height=c.height;
 if(old.width&&old.height)old.getContext('2d').drawImage(c,0,0);
 const rect=c.getBoundingClientRect(),dpr=Math.max(1,window.devicePixelRatio||1);
 const nextW=Math.max(1,Math.floor(rect.width*dpr)),nextH=Math.max(1,Math.floor(rect.height*dpr));
 if(nextW===c.width&&nextH===c.height)return;
 c.width=nextW;c.height=nextH;
 const {ctx}=configureCanvasContext(c);
 if(old.width&&old.height){
  ctx.save();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.drawImage(old,0,0,old.width,old.height,0,0,c.width,c.height);
  ctx.restore();
  configureCanvasContext(c);
 }
}
function initCanvas(){
 const c=document.getElementById('drawCanvas');if(!c)return;
 resizeCanvasPreserve();
 const ctx=c.getContext('2d');
 canvasHistory=[];
 let drawing=false;
 const point=e=>{const r=c.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
 c.addEventListener('pointerdown',e=>{
  e.preventDefault();canvasHistory.push(c.toDataURL());drawing=true;
  try{c.setPointerCapture(e.pointerId)}catch(_){}
  const[x,y]=point(e);ctx.beginPath();ctx.moveTo(x,y);
 });
 c.addEventListener('pointermove',e=>{
  if(!drawing)return;e.preventDefault();const[x,y]=point(e);ctx.lineTo(x,y);ctx.stroke();
 });
 const end=e=>{if(!drawing)return;drawing=false;ctx.closePath();try{c.releasePointerCapture(e.pointerId)}catch(_){}};
 c.addEventListener('pointerup',end);c.addEventListener('pointercancel',end);
}
function clearCanvas(){
 const c=document.getElementById('drawCanvas');if(!c)return;
 canvasHistory.push(c.toDataURL());const ctx=c.getContext('2d');
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,c.width,c.height);ctx.restore();
 configureCanvasContext(c);
}
function undoCanvas(){
 const c=document.getElementById('drawCanvas');if(!c||!canvasHistory.length)return;
 const data=canvasHistory.pop(),img=new Image();
 img.onload=()=>{
  const ctx=c.getContext('2d');ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,c.width,c.height);ctx.restore();
  configureCanvasContext(c);
 };
 img.src=data;
}

async function setupNativeIntegration(){
 try{
  const appPlugin=window.Capacitor?.Plugins?.App;
  if(!appPlugin?.addListener)return;
  await appPlugin.addListener('backButton', async ()=>{
   if(state.screen==='home'){
    if(confirm('Zaprem igro?'))await appPlugin.exitApp();
    return;
   }
   if(state.screen==='privacy'){
    state.screen='settings';save();render();return;
   }
   if(state.screen==='rules'||state.screen==='settings'||state.screen==='setup'){
    state.screen='home';save();render();return;
   }
   if(state.screen==='board'){
    if(typeof fullMapOpen!=='undefined'&&fullMapOpen){closeFullMap();return;}
    pendingResumeScreen='board';state.screen='home';save();render();return;
   }
   if(state.screen==='countdown'){
    clearInterval(timerHandle);
    state.countdownEnd=null;
    challengeTermSeen=true;
    state.screen='challenge';
    save();render();return;
   }
   if(state.screen==='timer'||state.screen==='draw'){
    if(confirm('Končam trenutno rundo in pokažem rezultat?'))finishTimer();
    return;
   }
   if(state.screen==='winner'){
    pendingResumeScreen=null;state.screen='home';save();render();return;
   }
   state.challenge=null;
   state.roundDifficulty=null;
   state.openRound=false;
   state.countdownEnd=null;
   state.remaining=null;
   state.timerEnd=null;
   state.screen='board';
   save();render();
  });
 }catch(e){
  console.warn('Native back integration unavailable',e);
 }
}

document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});
window.addEventListener('pagehide',save);
window.addEventListener('resize',()=>{
 if(state.screen!=='draw')return;
 clearTimeout(canvasResizeTimer);
 canvasResizeTimer=setTimeout(resizeCanvasPreserve,120);
});

async function bootstrapApp(){
 await hydrateNativeState();
 await setupNativeIntegration();
 render();
}
bootstrapApp();
