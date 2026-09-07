function renderHome(app){
 app.innerHTML=`
 ${topbar(`<button class="secondary small" onclick="setScreen('settings')">Nastavitve</button>`)}
 <section class="card hero homeHero">
  <div class="badge">Slovenska družabna igra</div>
  <div class="homeBrand">AKCIJA</div>
  <h1>Riši, razloži, pokaži</h1>
  <p>Izberi 3, 4 ali 5 točk in pripelji svojo ekipo čez 48 igralnih polj do cilja.</p>
  <div class="actions">
   ${pendingResumeScreen?`<button class="success" onclick="continueGame()">NADALJUJ IGRO</button>`:''}
   <button class="primary" onclick="newGameFromHome()">NOVA IGRA</button>
   <button class="secondary" onclick="setScreen('rules')">PRAVILA</button>
  </div>
 </section>
 <section class="card">
  <strong>450 ročno izbranih slovenskih pojmov</strong>
  <p class="muted">150 lahkih, 150 srednjih in 150 težkih. Brez umetno ustvarjenih nizov podobnih izrazov.</p>
 </section>
 <div class="footerNote">Samostojna slovenska družabna igra z originalno vsebino in oblikovanjem.</div>`;
}
function continueGame(){
 if(!pendingResumeScreen)return;
 state.screen=pendingResumeScreen;pendingResumeScreen=null;save();render();
}
function userPreferences(){
 return {duration:state.duration,bumping:state.bumping,sound:state.sound,vibration:state.vibration};
}
function newGameSetup(){
 const prefs=userPreferences();
 pendingResumeScreen=null;
 state=freshState();
 Object.assign(state,prefs);
 state.screen='setup';
 save();render();
}
function newGameFromHome(){
 if(pendingResumeScreen&&!confirm('Začnem novo igro? Trenutna igra bo izbrisana.'))return;
 newGameSetup();
}
function renderRules(app){
 app.innerHTML=`
 ${topbar(`<button class="secondary small" onclick="setScreen('home')">Nazaj</button>`)}
 <section class="card">
  <h2>Pravila</h2>
  <ol class="ruleList">
   <li><strong>Način</strong> določa polje, na katerem stoji ekipa: razloži, nariši ali pokaži.</li>
   <li><strong>Pred vsako rundo</strong> izbereš 3, 4 ali 5 točk. Višja vrednost pomeni težji pojem.</li>
   <li><strong>Pred začetkom</strong> podajalec pritisne in drži za prikaz pojma, si ga zapomni in nato začne rundo.</li>
   <li><strong>OPEN runda</strong>: ugibajo vsi. Če ugane aktivna ekipa, dobi 6 polj. Če ugane druga ekipa, dobi 4 polja, aktivna pa 2.</li>
   <li><strong>Izbijanje</strong> lahko pred igro vključiš ali izključiš. Ko je vključeno, uspešen običajni premik na nasprotnikovo polje nasprotnika pomakne eno polje nazaj.</li>
   <li><strong>Zmaga</strong>: prva ekipa, ki doseže ali preseže cilj, zmaga.</li>
  </ol>
 </section>`;
}
function renderSettings(app){
 app.innerHTML=`
 ${topbar(`<button class="secondary small" onclick="setScreen('home')">Nazaj</button>`)}
 <section class="card">
  <h2>Nastavitve</h2>
  <div class="stack">
   <label>Zvok odštevanja
    <select onchange="state.sound=this.value==='on';save()">
     <option value="on" ${state.sound?'selected':''}>Vključen</option>
     <option value="off" ${!state.sound?'selected':''}>Izključen</option>
    </select>
   </label>
   <label>Vibriranje
    <select onchange="state.vibration=this.value==='on';save()">
     <option value="on" ${state.vibration?'selected':''}>Vključeno</option>
     <option value="off" ${!state.vibration?'selected':''}>Izključeno</option>
    </select>
   </label>
   <label>Privzeti čas runde
    <select onchange="state.duration=Number(this.value);save()">
     ${[30,45,60,90].map(n=>`<option value="${n}" ${state.duration===n?'selected':''}>${n} s</option>`).join('')}
    </select>
   </label>
   <div class="notice">Nastavitve se shranijo na tej napravi in veljajo tudi za naslednjo igro.</div>
  </div>
 </section>`;
}

function renderSetup(app){
 app.innerHTML=`
 ${topbar(`<button class="secondary small" onclick="setScreen('home')">Nazaj</button>`)}
 <section class="card">
  <h2>Nastavitev igre</h2>
  <div class="stack">
   <label>Število ekip
    <select onchange="changeTeamCount(this.value)">
     ${[2,3,4].map(n=>`<option value="${n}" ${state.teams.length===n?'selected':''}>${n}</option>`).join('')}
    </select>
   </label>
   <div class="stack">
    ${state.teams.map((t,i)=>`
     <div class="teamRow">
      <div class="teamDot" style="background:${teamColor(i)}">${i+1}</div>
      <input maxlength="40" autocomplete="off" aria-label="Ime ekipe ${i+1}" value="${esc(t.name)}" oninput="renameTeam(${i},this.value)">
     </div>`).join('')}
   </div>
   <div class="grid2">
    <label>Čas runde
     <select onchange="state.duration=Number(this.value);save()">
      ${[30,45,60,90].map(n=>`<option value="${n}" ${state.duration===n?'selected':''}>${n} s</option>`).join('')}
     </select>
    </label>
    <label>Izbijanje nasprotnikov
     <select onchange="state.bumping=this.value==='on';save()">
      <option value="on" ${state.bumping?'selected':''}>Vključeno</option>
      <option value="off" ${!state.bumping?'selected':''}>Izključeno</option>
     </select>
    </label>
   </div>
   <div class="notice"><strong>3 / 4 / 5</strong> izbereš pred vsako rundo. Plošča ima vedno 48 igralnih polj.</div>
   <button class="primary" onclick="beginGame()">ZAČNI IGRO</button>
  </div>
 </section>`;
}
function changeTeamCount(v){
 const n=Math.min(4,Math.max(2,Number(v)||2));
 while(state.teams.length<n)state.teams.push({name:`Ekipa ${state.teams.length+1}`,pos:0});
 state.teams=state.teams.slice(0,n);save();render();
}
function renameTeam(i,v){state.teams[i].name=String(v).trim().slice(0,40)||`Ekipa ${i+1}`;save()}
function resetRoundData(){
 state.current=0;
 state.teams.forEach(t=>t.pos=0);
 state.used={};
 state.challenge=null;
 state.roundDifficulty=null;
 state.openRound=false;
 state.openBag=[];
 state.timerEnd=null;
 state.remaining=null;
 state.lastMove=null;
 state.winner=null;
 moveAnimations=[];
}
function beginGame(){
 pendingResumeScreen=null;
 resetRoundData();
 state.screen='board';save();render();
}
function replaySameTeams(){
 pendingResumeScreen=null;
 resetRoundData();
 state.screen='board';save();render();
}
function editCurrentSetup(){
 pendingResumeScreen=null;
 resetRoundData();
 state.screen='setup';save();render();
}
