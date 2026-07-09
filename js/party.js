// ============================================================
// MODOS EXTRA: 💣 BOMBAS (HEARTS MAN / bomberman) · 🥊 SMASH
// (HEARTS BROS / % de daño y knockback) · 🎉 FIESTA (estilo
// Mario Party: 3 minijuegos sorpresa con puntos y podio).
// Casual: dan ORO al ganar — sin copas ni gasto de vidas.
// ============================================================
(function(){
const $=s=>document.querySelector(s);
const COLORS=['#e8c11e','#ff5a4d','#4dd2ff','#9dff8a'];
const ECOS4=['selva','desierto','nieve','volcan'];   // los 4 con arte de bomber/bros

// ---------- armado de jugadores (tú + bots casuales) ----------
function makePlayers(n){
  const st=DATA.state();
  let an=DATA.byId[st.selected];
  if(!an || DATA.isSpent(an.id)){ st.selected=DATA.FREE_STARTER; DATA.save(); an=DATA.byId[st.selected]; }
  const players=[{name:st.name||'TÚ', animal:an, bot:false, color:COLORS[0], weapon:DATA.equipped(), cardLvl:DATA.cardLevel(an.id)}];
  DATA.randomBots(n-1, an.id).forEach((b,i)=>players.push({...b, color:COLORS[(i+1)%COLORS.length],
    weapon:DATA.byWeapon['bow_wood'], cardLvl:1}));
  return players;
}
function resetRound(players, hp){
  players.forEach(p=>{ p.hp=hp; p.elim=false; p.koRound=false; p.kills=0; p.skulls=0; p.score=0; });
}
function prepScreen(players, phaseTxt, lives){
  $('#hud-pot').textContent=String(lives);
  const lbl=document.querySelector('.hud-pot-label'); if(lbl) lbl.textContent='VIDAS';
  KIT.updateHudPlayers(players,()=>true);
  $('#results').classList.remove('show'); $('#scoreboard').classList.remove('show');
  $('#party-end').classList.remove('show');
  UI.show('#screen-game');
  $('#hud-phase').textContent=phaseTxt;
}
// intro con cuenta regresiva (mismo ritmo que campaña/supervivencia)
function runIntro(kicker, name, desc, cb){
  const intro=$('#phase-intro'), pv=$('#map-preview');
  $('#intro-kicker').textContent=kicker;
  $('#intro-name').textContent=name;
  $('#intro-desc').textContent=desc;
  if(pv) pv.style.display='none';
  intro.classList.add('show'); SFX.phase();
  let n=3; $('#intro-go').textContent=n; SFX.count();
  const iv=setInterval(()=>{ n--;
    if(n>0){ $('#intro-go').textContent=n; SFX.count(); }
    else{ clearInterval(iv); $('#intro-go').textContent='GO!'; SFX.go();
      setTimeout(()=>{ intro.classList.remove('show'); cb(); },350); }
  },650);
}
// los motores viejos (bomber/bros) son de lienzo FIJO 832×640
function classicCanvas(){ const cv=$('#game-canvas'); cv.width=832; cv.height=640; return cv; }

// ---------- overlay de resultado / marcador (compartido) ----------
let onAgain=null, onNext=null;
function showBoard({title, sub, standings, reward, again, next, lose}){
  const end=$('#party-end');
  end.classList.toggle('lose', !!lose);
  $('#pe-title').textContent=title;
  $('#pe-sub').textContent=sub||'';
  $('#pe-reward').textContent=reward||'';
  const box=$('#pe-standings'); box.innerHTML='';
  (standings||[]).forEach((s,i)=>{
    const row=document.createElement('div'); row.className='clan-row'+(s.me?' me':'');
    row.innerHTML='<span class="cb">'+(i+1)+'</span><span class="cn2">'+(s.me?'★ ':'')+s.name+'<small>'+s.animal+'</small></span>'+
      '<span class="cm-cups">'+s.pts+' pts</span>';
    box.appendChild(row);
  });
  const bA=$('#btn-pe-again'), bN=$('#btn-pe-next');
  bA.style.display=again?'':'none'; if(again) bA.textContent=again;
  bN.style.display=next?'':'none';  if(next)  bN.textContent=next;
  end.classList.add('show');
}

// ============================================================
// 💣 BOMBAS — bomberman clásico: 1 vida, el último en pie gana
// ============================================================
function startBomber(){
  const players=makePlayers(4);
  resetRound(players,1);
  const eco=ECOS4[Math.floor(Math.random()*ECOS4.length)];
  prepScreen(players,'💣 BOMBAS · '+eco.toUpperCase(),1);
  if(window.MUSIC) MUSIC.battle(0);
  runIntro('💣 BOMBAS','HEARTS MAN', '1 VIDA — el último en pie gana · '+BOMBERMAN.controls, ()=>{
    BOMBERMAN.start(classicCanvas(), players, {duration:90, minAlive:1}, ()=>{
      const win=!players[0].koRound;
      if(win) DATA.gainGold(40);
      if(window.MUSIC){ if(win) MUSIC.winner(); else MUSIC.lobby(); }
      const alive=players.filter(p=>!p.koRound).map(p=>p.name).join(' · ');
      showBoard({ title:win?'💣 ¡GANASTE!':'💥 TE VOLARON', lose:!win,
        sub:win?'el último en pie eres tú':'sobrevivió: '+(alive||'nadie'),
        reward:win?'+40 🪙':'', again:'OTRA VEZ', });
      onAgain=startBomber;
      UI.updateHearts();
    }, eco);
  });
}

// ============================================================
// 🥊 SMASH — HEARTS BROS: % de daño + knockback, sueltas tus ♥
// ============================================================
function startBros(){
  const players=makePlayers(4);
  resetRound(players,3);
  const eco=ECOS4[Math.floor(Math.random()*ECOS4.length)];
  prepScreen(players,'🥊 SMASH · '+eco.toUpperCase(),3);
  if(window.MUSIC) MUSIC.battle(1);
  runIntro('🥊 SMASH','HEARTS BROS', 'sácalos del stage: entre más daño %, más lejos vuelan · '+BROS.controls, ()=>{
    BROS.start(classicCanvas(), players, {duration:120, minAlive:1}, ()=>{
      const win=!players[0].koRound;
      if(win) DATA.gainGold(40);
      if(window.MUSIC){ if(win) MUSIC.winner(); else MUSIC.lobby(); }
      const alive=players.filter(p=>!p.koRound).map(p=>p.name).join(' · ');
      showBoard({ title:win?'🥊 ¡GANASTE!':'🌀 FUERA DEL STAGE', lose:!win,
        sub:win?'limpiaste el escenario':'sobrevivió: '+(alive||'nadie'),
        reward:win?'+40 🪙':'', again:'OTRA VEZ', });
      onAgain=startBros;
      UI.updateHearts();
    }, eco);
  });
}

// ============================================================
// 🎉 FIESTA — estilo Mario Party: 3 minijuegos sorpresa,
// puntos por ronda (+5 sobrevivir/ganar · +1 participar) y podio
// ============================================================
const MINIGAMES=[
  {id:'bombas', icon:'💣', name:'BOMBAS',     blurb:'1 vida · el último en pie +5'},
  {id:'smash',  icon:'🥊', name:'SMASH',      blurb:'sácalos del stage · sobrevivir +5'},
  {id:'lms',    icon:'☠',  name:'ÚLTIMA VIDA',blurb:'duelo de flechas · el último +5'},
  {id:'hunt',   icon:'💀', name:'CALAVERAS',  blurb:'junta calaveras · +5/+3/+2/+1'},
];
let fiesta=null;
function startFiesta(){
  const players=makePlayers(4);
  players.forEach(p=>p.pts=0);
  const pool=MINIGAMES.slice().sort(()=>Math.random()-0.5).slice(0,3);
  fiesta={players, games:pool, idx:0};
  fiestaIntro();
}
function fiestaIntro(){
  const g=fiesta.games[fiesta.idx];
  const players=fiesta.players;
  const hp=(g.id==='bombas')?1:(g.id==='smash')?3:2;
  resetRound(players,hp);
  const eco=ECOS4[Math.floor(Math.random()*ECOS4.length)];
  prepScreen(players,'🎉 FIESTA · MINIJUEGO '+(fiesta.idx+1)+'/'+fiesta.games.length+' · '+g.name, hp);
  if(window.MUSIC) MUSIC.battle(fiesta.idx);
  runIntro('🎉 FIESTA · MINIJUEGO '+(fiesta.idx+1)+' DE '+fiesta.games.length, g.icon+' '+g.name, g.blurb, ()=>{
    const done=r=>fiestaScore(g,r);
    if(g.id==='bombas') BOMBERMAN.start(classicCanvas(), players, {duration:75, minAlive:1}, done, eco);
    else if(g.id==='smash') BROS.start(classicCanvas(), players, {duration:90, minAlive:1}, done, eco);
    else if(g.id==='lms') TOWERFALL.start($('#game-canvas'), players,
      {duration:75, gameMode:DATA.byMode['lms'], variant:Math.floor(Math.random()*3)}, done, eco);
    else TOWERFALL.start($('#game-canvas'), players,
      {duration:60, gameMode:DATA.byMode['hunt'], variant:Math.floor(Math.random()*3)}, done, eco);
  });
}
function fiestaScore(g,r){
  const players=fiesta.players;
  if(g.id==='hunt' && r && r.ranking){                      // ranking real por calaveras
    const ptsByPlace=[5,3,2,1];
    r.ranking.forEach((row,i)=>{ const p=players.find(x=>x.name===row.name); if(p) p.pts+=(ptsByPlace[i]||1); });
    players.forEach(p=>{ if(!r.ranking.some(row=>row.name===p.name)) p.pts+=1; });
  } else if(g.id==='lms' && r && r.winner){                  // ganador del duelo
    players.forEach(p=>p.pts += (r.winner.p===p ? 5 : 1));
  } else {                                                   // bomber/smash: sobrevivir = +5
    players.forEach(p=>p.pts += (p.koRound ? 1 : 5));
  }
  const standings=players.slice().sort((a,b)=>b.pts-a.pts)
    .map(p=>({name:p.name, animal:p.animal.name, pts:p.pts, me:!p.bot}));
  fiesta.idx++;
  if(fiesta.idx<fiesta.games.length){
    const nx=fiesta.games[fiesta.idx];
    showBoard({ title:'🎉 MARCADOR', sub:'siguiente: '+nx.icon+' '+nx.name+' — '+nx.blurb,
      standings, next:'▶ MINIJUEGO '+(fiesta.idx+1) });
    onNext=fiestaIntro;
  } else {
    const myPlace=standings.findIndex(s=>s.me)+1;
    const gold=myPlace===1?80:myPlace===2?30:10;
    DATA.gainGold(gold); UI.updateHearts();
    if(window.MUSIC){ if(myPlace===1) MUSIC.winner(); else MUSIC.lobby(); }
    showBoard({ title:myPlace===1?'👑 ¡CAMPEÓN DE LA FIESTA!':'🎉 FIN DE LA FIESTA', lose:myPlace>1,
      sub:myPlace===1?'dominaste los minijuegos':'quedaste en el lugar '+myPlace,
      standings, reward:'+'+gold+' 🪙', again:'OTRA FIESTA' });
    onAgain=startFiesta;
  }
}

// ---------- wiring ----------
function init(){
  const b=$('#btn-bomber'); if(!b||b.__wired) return; b.__wired=true;
  b.addEventListener('click',()=>{ SFX.click(); startBomber(); });
  $('#btn-bros').addEventListener('click',()=>{ SFX.click(); startBros(); });
  $('#btn-fiesta').addEventListener('click',()=>{ SFX.click(); startFiesta(); });
  $('#btn-pe-again').addEventListener('click',()=>{ SFX.click(); $('#party-end').classList.remove('show'); if(onAgain) onAgain(); });
  $('#btn-pe-next').addEventListener('click',()=>{ SFX.click(); $('#party-end').classList.remove('show'); if(onNext) onNext(); });
  $('#btn-pe-lobby').addEventListener('click',()=>{ SFX.click(); $('#party-end').classList.remove('show'); if(window.MUSIC) MUSIC.lobby(); UI.enterLobby(); });
}

window.FIESTA={ init, startBomber, startBros, startFiesta };
})();
