function renderHome(app){
 app.innerHTML=`
 ${topbar()}
 <section class="card hero">
  <div class="badge">Družabna igra · Riši, razloži, pokaži</div>
  <h1>AKCIJA</h1>
  <p>Razloži. Nariši. Pokaži. Izberi 3, 4 ali 5 točk in pripelji svojo ekipo čez 48 igralnih polj do cilja.</p>
  <div class="actions">
   <button class="primary" onclick="startSetup()">NOVA IGRA</button>
   <button class="secondary" onclick="setScreen('rules')">PRAVILA</button>
  </div>
 </section>
 <section class="card">
  <strong>450 ročno izbranih slovenskih pojmov</strong>
  <p class="muted">150 lahkih, 150 srednjih in 150 težkih. Brez umetno ustvarjenih nizov podobnih izrazov.</p>
 </section>
 <div class="footerNote">Samostojna digitalna igra z originalno vsebino in oblikovanjem.</div>`;
}
function renderRules(app){
 app.innerHTML=`
 ${topbar(`<button class="secondary small" onclick="setScreen('home')">Nazaj</button>`)}
 <section class="card">
  <h2>Pravila</h2>
  <ol class="ruleList">
   <li><strong>Način</strong> določa polje, na katerem stoji ekipa: razloži, nariši ali pokaži.</li>
   <li><strong>Pred vsako rundo</strong> izbereš 3, 4 ali 5 točk. Višja vrednost pomeni težji pojem.</li>
   <li><strong>Pred začetkom</strong> si podajalec pojem zapomni in ga skrije. Nato začne teči čas.</li>
   <li><strong>OPEN runda</strong>: ugibajo vsi. Če ugane aktivna ekipa, dobi 6 polj. Če ugane druga ekipa, dobi 4 polja, aktivna pa 2.</li>
   <li><strong>Izbijanje</strong> lahko pred igro vključiš ali izključiš. Ko je vključeno, uspešen običajni premik na nasprotnikovo polje nasprotnika pomakne eno polje nazaj.</li>
   <li><strong>Zmaga</strong>: prva ekipa, ki doseže ali preseže cilj, zmaga.</li>
  </ol>
 </section>`;
}
function startSetup(){state=freshState();state.screen='setup';save();render()}

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
      <input aria-label="Ime ekipe ${i+1}" value="${esc(t.name)}" oninput="renameTeam(${i},this.value)">
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
 const n=Number(v);
 while(state.teams.length<n)state.teams.push({name:`Ekipa ${state.teams.length+1}`,pos:0});
 state.teams=state.teams.slice(0,n);save();render();
}
function renameTeam(i,v){state.teams[i].name=v.trim()||`Ekipa ${i+1}`;save()}
function beginGame(){
 state.current=0;state.teams.forEach(t=>t.pos=0);
 state.used={"3":[],"4":[],"5":[]};state.challenge=null;state.openBag=[];state.lastMove=null;
 state.screen='board';save();render();
}
