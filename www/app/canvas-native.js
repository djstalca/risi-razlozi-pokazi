function initCanvas(){
 const c=document.getElementById('drawCanvas');if(!c)return;
 const ctx=c.getContext('2d'),dpr=Math.max(1,window.devicePixelRatio||1);
 const rect=c.getBoundingClientRect();
 c.width=Math.max(1,Math.floor(rect.width*dpr));c.height=Math.max(1,Math.floor(rect.height*dpr));
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#111';
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
}
function undoCanvas(){
 const c=document.getElementById('drawCanvas');if(!c||!canvasHistory.length)return;
 const data=canvasHistory.pop(),img=new Image();
 img.onload=()=>{
  const ctx=c.getContext('2d');ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,c.width,c.height);ctx.restore();
 };
 img.src=data;
}

if((state.screen==='timer'||state.screen==='draw')&&(!state.timerEnd||state.timerEnd<=Date.now())){
 state.screen='result';state.timerEnd=null;save();
}
async function setupNativeIntegration(){
 try{
  const appPlugin=window.Capacitor?.Plugins?.App;
  if(!appPlugin?.addListener)return;
  await appPlugin.addListener('backButton', async ()=>{
   if(state.screen==='home'){
    if(confirm('Zaprem igro?')) await appPlugin.exitApp();
    return;
   }
   if(state.screen==='rules'||state.screen==='setup'){
    state.screen='home';save();render();return;
   }
   if(state.screen==='timer'||state.screen==='draw'){
    if(confirm('Končam trenutno rundo in se vrnem na rezultat?'))finishTimer();
    return;
   }
   if(state.screen==='winner'){
    state.screen='home';save();render();return;
   }
   state.challenge=null;
   state.roundDifficulty=null;
   state.openRound=false;
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

setupNativeIntegration();
render();
