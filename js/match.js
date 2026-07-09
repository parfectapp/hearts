/* HEARTS — match: battle royale de corazones (8 jugadores, 4 ecosistemas) + kit compartido */
(function(){
const $=s=>document.querySelector(s);

// ---------- KIT compartido ----------
const keys=new Set(), taps=new Set();
window.addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
  if(!keys.has(e.code)) taps.add(e.code);
  keys.add(e.code);
});
window.addEventListener('keyup',e=>keys.delete(e.code));
let shakeMag=0;
window.KIT={
  keys,
  tap(code){ if(taps.has(code)){ taps.delete(code); return true; } return false; },
  press(code){ if(!keys.has(code)) taps.add(code); keys.add(code); },   // controles TÁCTILES: simula keydown
  release(code){ keys.delete(code); },                                   // simula keyup
  shake(m){ shakeMag=Math.max(shakeMag,m); },
  applyShake(ctx){
    if(shakeMag>0.2){
      ctx.translate((Math.random()-.5)*shakeMag,(Math.random()-.5)*shakeMag);
      shakeMag*=0.88;
    }
  },
  particles(){
    const list=[];
    return {
      spawn(x,y,color,n,spd){
        for(let i=0;i<n;i++){
          const a=Math.random()*Math.PI*2, v=spd*(0.4+Math.random()*0.8);
          list.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-60,t:0.5+Math.random()*0.4,color,s:2+Math.random()*3});
        }
      },
      update(dt){
        for(let i=list.length-1;i>=0;i--){
          const p=list[i]; p.t-=dt;
          if(p.t<=0){ list.splice(i,1); continue; }
          p.vy+=500*dt; p.x+=p.vx*dt; p.y+=p.vy*dt;
        }
      },
      draw(ctx){ list.forEach(p=>{ ctx.globalAlpha=Math.min(1,p.t*2); ctx.fillStyle=p.color; ctx.fillRect(p.x-p.s/2,p.y-p.s/2,p.s,p.s); }); ctx.globalAlpha=1; }
    };
  },
  updateHudPlayers(players, isAlive){
    const el=$('#hud-players'); el.innerHTML='';
    const alive=players.filter(p=>isAlive(p)&&!p.elim);
    if(players.length>10){   // battle royale grande: contador de vivos + tú
      const c=document.createElement('div'); c.className='hud-p';
      c.innerHTML=`<span class="dot" style="background:#e8c11e"></span>VIVOS ${alive.length}/${players.length}`;
      el.appendChild(c);
      const me=players.find(p=>!p.bot);
      if(me){ const m=document.createElement('div'); m.className='hud-p'+((isAlive(me)&&!me.elim)?'':' dead');
        m.innerHTML=`<span class="dot" style="background:${me.color}"></span>TÚ <b class="hud-hp">♥${me.hp}</b>`; el.appendChild(m); }
      return;
    }
    players.forEach(p=>{
      const d=document.createElement('div');
      d.className='hud-p'+(isAlive(p)&&!p.elim?'':' dead');
      d.innerHTML=`<span class="dot" style="background:${p.color}"></span>${p.bot?p.name:'TÚ'} <b class="hud-hp">♥${p.hp}</b>`;
      el.appendChild(d);
    });
  }
};

// ---------- MATCH: battle royale de corazones ----------
const COLORS=['#e8c11e','#ff5a4d','#4dd2ff','#9dff8a','#c77dff','#ffa64d','#4dffd2','#ff7dc9'];
const ECOS=[
  {id:'selva',   name:'JUNGLE'},
  {id:'desierto',name:'DESERT'},
  {id:'nieve',   name:'NORTH'},
  {id:'volcan',  name:'VOLCANIC'},
  {id:'japon',   name:'SAKURA'},
  {id:'tokyo',   name:'NEO-TOKYO'},
  {id:'egipto',  name:'GIZA'},
  {id:'grecia',  name:'OLYMPUS'},
  {id:'china',   name:'DRAGON'},
];
// RANKED: por ahora SOLO TowerFall (ciclando los 5 mundos). Bomberman y Battle Royale (Showdown)
// están FUERA temporalmente mientras los perfeccionamos — se regresan descomentándolos.
const MODE_ROT=[
  {name:'TOWERFALL', obj:()=>window.TOWERFALL},
  // {name:'BOMBERMAN', obj:()=>window.BOMBERMAN},
  // {name:'SHOWDOWN',  obj:()=>window.SHOWDOWN},
];
let current=null;

function startRanked(){
  if(window.TUT) TUT.onRanked();
  const st=DATA.state();
  let an=DATA.byId[st.selected];
  // NUNCA se bloquea el jugar: si tu mono está agotado, entras con el RATÓN (gratis e infinito)
  if(!an || DATA.isSpent(an.id)){
    const spentName=an?an.name:null;
    st.selected=DATA.FREE_STARTER; DATA.save(); an=DATA.byId[st.selected];
    if(spentName) UI.toast('☠ '+spentName+' está agotado — juegas con RATÓN (recárgalo en CARTAS)');
  }
  st.matches++; DATA.save(); UI.updateHearts();   // VERSUS estilo TowerFall: rondas de eliminación

  const myLvl=DATA.cardLevel(an.id);
  const players=[{name:st.name||'TÚ', animal:an, bot:false, color:COLORS[0], weapon:DATA.equipped(), cardLvl:myLvl}];
  const WPOOL=DATA.WEAPONS;
  DATA.randomBots(DATA.ECON.PLAYERS-1, an.id).forEach((b,i)=>players.push({...b, color:COLORS[(i+1)%COLORS.length],
    weapon:WPOOL[Math.floor(Math.random()*WPOOL.length)],
    cardLvl:Math.max(1, myLvl + (Math.random()<0.4?0:(Math.random()<0.5?-1:1))) }));  // rivales de TU nivel (±1)
  players.forEach(p=>{ p.hp=DATA.ECON.LIVES; p.elim=false; p.koRound=false; });

  current={ players, round:0, ecoStart:Math.floor(Math.random()*ECOS.length) };
  $('#hud-pot').textContent=DATA.ECON.LIVES;                 // vidas con las que entra cada quien
  const lbl=document.querySelector('.hud-pot-label'); if(lbl) lbl.textContent='VIDAS';
  KIT.updateHudPlayers(players,()=>true);
  $('#results').classList.remove('show');
  $('#scoreboard').classList.remove('show');
  UI.show('#screen-game');
  showMatchmaking(players, runRound);                        // "BUSCANDO RIVALES…" → arranca
}

// MATCHMAKING (se siente en línea): busca rivales y los va encontrando por nombre
function showMatchmaking(players, done){
  const mm=$('#matchmaking'); if(!mm){ done(); return; }
  const list=$('#mm-list'); list.innerHTML='';
  mm.classList.add('show'); SFX.phase();
  const rows=players.map((p,i)=>{
    const r=document.createElement('div'); r.className='mm-row'+(p.bot?'':' me');
    r.innerHTML='<span class="dot" style="background:'+p.color+'"></span>'+(p.bot?'···':(p.name+' (TÚ)'));
    list.appendChild(r); return r;
  });
  players.forEach((p,i)=>{ if(!p.bot) return;
    setTimeout(()=>{ rows[i].innerHTML='<span class="dot" style="background:'+p.color+'"></span>'+p.name+' <em>🏆 '+(Math.max(0,(DATA.state().cups|0)+Math.floor(Math.random()*41)-20))+'</em>'; SFX.count(); }, 350+i*380);
  });
  setTimeout(()=>{ mm.classList.remove('show'); done(); }, 350+players.length*380+500);
}

// PARTY con amigos: partida CASUAL (sin apuesta). members[i]={name,animal,me/bot}
function startParty(members){
  if(window.TUT && TUT.onRanked) TUT.onRanked();
  const st=DATA.state();
  const players=members.slice(0,4).map((mm,i)=>({ name:mm.name, animal:mm.animal, bot:!mm.me,
    color:COLORS[i%COLORS.length], weapon:mm.me?DATA.equipped():DATA.byWeapon['bow_wood'] }));
  players.forEach(p=>{ p.hp=DATA.ECON.LIVES; p.elim=false; p.koRound=false; });
  st.matches++; DATA.save();
  current={ players, round:0, party:true };
  $('#hud-pot').textContent='AMIGOS';
  KIT.updateHudPlayers(players,()=>true);
  $('#results').classList.remove('show');
  $('#scoreboard').classList.remove('show');
  UI.show('#screen-game');
  runRound();
}

// ===== SUPERVIVENCIA: tu animal vs SUS DEPREDADORES en oleadas (aguanta lo más que puedas) =====
const SURV_MODE={id:'surv', name:'SUPERVIVENCIA', icon:'🌊', color:'#ff7a3c', respawn:1.4, dur:600, teams:true,
  blurb:'tus depredadores llegan en OLEADAS — cada una más rápida'};
function startSurvival(){
  const st=DATA.state();
  let an=DATA.byId[st.selected];
  if(!an || DATA.isSpent(an.id)){ st.selected=DATA.FREE_STARTER; DATA.save(); an=DATA.byId[st.selected]; }
  st.matches++; DATA.save(); UI.updateHearts();
  const preds=DATA.predatorsOf(an.id);
  const players=[{name:st.name||'TÚ', animal:an, bot:false, team:0, color:COLORS[0],
                  weapon:DATA.equipped(), cardLvl:DATA.cardLevel(an.id)}];
  preds.forEach((pid,i)=>{ const pa=DATA.byId[pid]||DATA.byId.wolf;
    players.push({name:pa.name, animal:pa, bot:true, enemy:true, team:1,
                  color:['#ff5a4d','#ff8a3c','#c0392b'][i%3], weapon:DATA.byWeapon['bow_wood']}); });
  players.forEach(p=>{ p.hp=p.enemy?1:3; p.elim=false; p.koRound=false; p.kills=0; p.skulls=0; p.score=0; });
  current={ players, mode:SURV_MODE };
  $('#hud-pot').textContent='3';
  const lbl=document.querySelector('.hud-pot-label'); if(lbl) lbl.textContent='VIDAS';
  KIT.updateHudPlayers(players,()=>true);
  $('#results').classList.remove('show'); $('#scoreboard').classList.remove('show');
  UI.show('#screen-game');
  const eco=ECOS[Math.floor(Math.random()*ECOS.length)];
  $('#hud-phase').textContent='SUPERVIVENCIA · '+eco.name;
  const intro=$('#phase-intro'), pv=$('#map-preview');
  $('#intro-kicker').textContent='🌊 SUPERVIVENCIA';
  $('#intro-name').textContent=an.name+' vs DEPREDADORES';
  $('#intro-desc').textContent='te cazan: '+preds.map(p=>DATA.byId[p].name).join(' · ')+' — cada oleada más rápida';
  intro.classList.add('show'); SFX.phase();
  if(pv){ pv.style.display=''; pv.classList.remove('zoom'); drawMapPreview(pv, eco.id); void pv.offsetWidth; pv.classList.add('zoom'); }
  if(window.MUSIC) MUSIC.battle(2);
  let n=3; $('#intro-go').textContent=n; SFX.count();
  const iv=setInterval(()=>{ n--;
    if(n>0){ $('#intro-go').textContent=n; SFX.count(); }
    else{ clearInterval(iv); $('#intro-go').textContent='GO!'; SFX.go();
      setTimeout(()=>{ intro.classList.remove('show');
        window.TOWERFALL.start($('#game-canvas'), players, {duration:600, gameMode:SURV_MODE, variant:Math.floor(Math.random()*3)}, onModeEnd, eco.id);
      },350); }
  },650);
}

// ===== ONLINE (host): partida REAL con amigos — LMS de una arena, 3 vidas c/u =====
function startNetHost(roster, net){
  const st=DATA.state();
  const players=[];
  roster.forEach((r,i)=>{
    const an=DATA.byId[r.animal]||DATA.byId[DATA.FREE_STARTER];
    const p={name:r.name, animal:an, bot:false, color:COLORS[i%COLORS.length],
             weapon:DATA.equipped(), cardLvl:r.cardLvl||1};
    if(!r.host){ p.remote=true; p.net={l:false,r:false,u:false,d:false,jump:0,dodge:0,shoot:0,ult:0}; r.p=p; }
    players.push(p);
  });
  DATA.randomBots(Math.max(0,4-players.length), players[0].animal.id)
    .forEach(b=>players.push({...b, color:COLORS[players.length%COLORS.length], weapon:DATA.byWeapon['bow_wood']}));
  const mode=DATA.byMode['lms'];
  players.forEach(p=>{ p.hp=mode.lives||3; p.elim=false; p.koRound=false; p.kills=0; p.skulls=0; p.score=0; });
  current={ players, mode, netGame:true };
  st.matches++; DATA.save();
  // el HOST dicta el mundo (mismo cálculo que el motor)
  const stage=$('#game-canvas').parentElement;
  const sw=(stage&&stage.clientWidth)||window.innerWidth||screen.width||1280;
  const sh=(stage&&stage.clientHeight)||window.innerHeight||screen.height||800;
  const vc=Math.max(16,Math.min(28,Math.round((640*(sw/sh))/52)));
  const cols=Math.min(56,vc*2), rows=24;
  const eco=ECOS[Math.floor(Math.random()*ECOS.length)], variant=Math.floor(Math.random()*3);
  $('#hud-pot').textContent=mode.lives||3;
  const lbl=document.querySelector('.hud-pot-label'); if(lbl) lbl.textContent='VIDAS';
  KIT.updateHudPlayers(players,()=>true);
  $('#results').classList.remove('show'); $('#scoreboard').classList.remove('show');
  document.querySelectorAll('.modal-back.show').forEach(x=>x.classList.remove('show'));
  UI.show('#screen-game');
  $('#hud-phase').textContent='ONLINE · '+eco.name;
  const cfg={ duration:120, gameMode:mode, variant, forceCols:cols, forceRows:rows, net:{emit:net.emit} };
  setTimeout(()=>{ window.TOWERFALL.start($('#game-canvas'), players, cfg, (result)=>{
    const wEnt=result&&result.winner;
    const wIdx=wEnt?players.indexOf(wEnt.p):0;
    net.end({t:'end', wIdx:wIdx<0?0:wIdx, winner:(wEnt&&wEnt.p&&wEnt.p.name)||''});
    showModeResult(result||{mode:'lms'});          // el host usa su pantalla normal (copas/oro/vidas/cofre)
  }, eco.id); }, 400);
  return {t:'start', eco:eco.id, ecoName:eco.name, variant, cols, rows, dur:120,
          players:players.map(p=>({name:p.name, animal:p.animal.id, color:p.color}))};
}

const aliveList=()=>current.players.filter(p=>!p.elim);

// asigna lugares a los recién eliminados (peor lugar primero)
function eliminate(list){
  const m=current;
  let place=aliveList().length;
  list.forEach(p=>{ if(!p.elim){ p.elim=true; p.place=place--; } });
}

// pantalla de selección de mapa: muestra SOLO EL FONDO del mapa (el arte del escenario)
const MAP_PREVIEWS={};
function drawMapPreview(cv, ecoId){
  // bitmap = tamaño real en pantalla (pantalla completa, nítido)
  const cw=cv.clientWidth||832, ch=cv.clientHeight||640;
  if(cv.width!==cw||cv.height!==ch){ cv.width=cw; cv.height=ch; }
  const c=cv.getContext('2d'), W=cv.width, H=cv.height;
  cv.dataset.eco=ecoId;
  const paint=im=>{ const s=Math.max(W/im.width,H/im.height), w=im.width*s, h=im.height*s;
    c.drawImage(im,(W-w)/2,(H-h)/2,w,h); };
  let im=MAP_PREVIEWS[ecoId];
  if(im && im.complete && im.naturalWidth){ paint(im); return; }
  // mientras carga: degradado con la paleta del mundo (sigue siendo solo fondo)
  const a=(THEMES.TF_ARENAS && (THEMES.TF_ARENAS[ecoId]||THEMES.TF_ARENAS.selva))||null;
  const pal=a?a.pal:{bg1:'#08110c',bg2:'#17301e'};
  const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,pal.bg1); g.addColorStop(1,pal.bg2);
  c.fillStyle=g; c.fillRect(0,0,W,H);
  if(!im){ im=new Image(); MAP_PREVIEWS[ecoId]=im; im.src='assets/maps/'+ecoId+'.png?v=4'; }
  im.onload=()=>{ if(cv.dataset.eco===ecoId) paint(im); };
}

// ===== RANKED con RULETA: cada ronda la RUEDA DE LA FORTUNA decide el MODO
// (sin repetir hasta que salgan todos) y el MAPA. La ronda solo decide QUIÉN
// cae — el torneo administra los ♥ (snapshot antes, −1 al perdedor después).
const RANKED_MODES=[
  {id:'flechas', icon:'🏹', name:'FLECHAS',   color:'#d8a13c', desc:'duelo TowerFall — el primero en CAER pierde 1 ♥'},
  {id:'bombas',  icon:'💣', name:'BOMBAS',    color:'#ef7d1c', desc:'bomberman — el primero en VOLAR pierde 1 ♥'},
  {id:'smash',   icon:'🥊', name:'SMASH',     color:'#7e46e0', desc:'sácalos del stage — el primero FUERA pierde 1 ♥'},
  {id:'hunt',    icon:'💀', name:'CALAVERAS', color:'#9d4fd8', desc:'cacería de calaveras — el que junte MENOS pierde 1 ♥'},
];
const ECOS4=['selva','desierto','nieve','volcan'];       // bomber/bros: los 4 mundos con arte
const ECO_WHEEL={
  selva:   ['🌿','SELVA','#2e8b57'],   desierto:['🏜️','DESIERTO','#c8922e'],
  nieve:   ['❄️','NIEVE','#5f9fc8'],   volcan:  ['🌋','VOLCÁN','#c8442e'],
  japon:   ['🌸','SAKURA','#c86a94'],  tokyo:   ['🌃','NEO-TOKYO','#7e5fd8'],
  egipto:  ['🐫','GIZA','#b8a04f'],    grecia:  ['🏛️','OLIMPO','#6f8fb0'],
  china:   ['🐉','DRAGÓN','#b83a3a'],
};
function classic832(){ const cv=$('#game-canvas'); cv.width=832; cv.height=640; return cv; }

async function runRound(){
  const m=current;
  const parts=aliveList();
  // 🎡 GIRO 1: el MODO — los que ya salieron NO se repiten (hasta agotar los 4)
  if(!m.used) m.used=[];
  let pool=RANKED_MODES.filter(md=>!m.used.includes(md.id));
  if(!pool.length){ m.used=[]; pool=RANKED_MODES.slice(); }
  const mode=pool[Math.floor(Math.random()*pool.length)];
  m.used.push(mode.id);
  const ecoPool=(mode.id==='bombas'||mode.id==='smash')?ECOS4:ECOS.map(e=>e.id);
  const ecoId=ecoPool[Math.floor(Math.random()*ecoPool.length)];
  if(window.WHEEL){
    await WHEEL.spin('🎡 RONDA '+(m.round+1)+' — ¿QUÉ MODO TOCA?',
      RANKED_MODES.map(md=>({icon:md.icon,label:md.name,color:md.color,used:m.used.includes(md.id)&&md.id!==mode.id})),
      RANKED_MODES.indexOf(mode), {sub:'los modos que YA SALIERON no se repiten'});
    await WHEEL.spin('🗺️ ¿EN QUÉ MAPA?',
      ecoPool.map(id=>({icon:ECO_WHEEL[id][0],label:ECO_WHEEL[id][1],color:ECO_WHEEL[id][2]})),
      ecoPool.indexOf(ecoId));
  }
  // snapshot de ♥: los motores mueven vidas a su manera — aquí se restauran y
  // SOLO el perdedor de la ronda baja 1 (supervivencia pura, nadie suma)
  const snap=new Map(parts.map(p=>[p,p.hp]));
  const entry={flechas:null, bombas:1, smash:1, hunt:null}[mode.id];
  if(entry!=null) parts.forEach(p=>p.hp=entry);
  parts.forEach(p=>{ p.koRound=false; p.skulls=0; p.kills=0; });
  const done=()=>{
    let loser=null;
    if(mode.id==='hunt'){                                    // menos calaveras pierde (empate: menos kills)
      const rk=parts.slice().sort((a,b)=>((b.skulls||0)-(a.skulls||0)) || ((b.kills||0)-(a.kills||0)));
      loser=rk[rk.length-1];
    } else {
      loser=parts.find(p=>p.koRound) || parts.find(p=>p.hp<(entry!=null?entry:snap.get(p)))
        || parts[Math.floor(Math.random()*parts.length)];
    }
    parts.forEach(p=>{ p.hp=snap.get(p); p.koRound=false; });
    loser.hp=Math.max(0,loser.hp-1); loser.koRound=true;
    onRoundEnd();
  };
  const variant=Math.floor(Math.random()*3);
  const minA=Math.max(1,parts.length-1);
  // SELECCIÓN DE MAPA: el mapa a pantalla completa con zoom mientras corre el 3·2·1
  const intro=$('#phase-intro'), pv=$('#map-preview');
  $('#intro-kicker').textContent='RONDA '+(m.round+1)+' · '+parts.length+' EN PIE';
  $('#intro-name').textContent=mode.icon+' '+mode.name;
  $('#intro-desc').textContent=ECO_WHEEL[ecoId][1]+' · '+mode.desc;
  $('#hud-phase').textContent='RONDA '+(m.round+1)+' · '+mode.name+' · '+ECO_WHEEL[ecoId][1];
  $('#game-controls').textContent=(mode.id==='bombas'?BOMBERMAN.controls : mode.id==='smash'?BROS.controls : TOWERFALL.controls);
  intro.classList.add('show'); SFX.phase();                  // primero visible (para medir la pantalla)
  if(pv){ pv.style.display=''; pv.classList.remove('zoom'); drawMapPreview(pv, ecoId); }
  if(window.MUSIC) MUSIC.battle(m.round);
  if(pv){ void pv.offsetWidth; pv.classList.add('zoom'); }  // arranca el acercamiento
  let n=3; $('#intro-go').textContent=n; SFX.count();
  const iv2=setInterval(()=>{ n--;
    if(n>0){ $('#intro-go').textContent=n; SFX.count(); }
    else{
      clearInterval(iv2);
      $('#intro-go').textContent='GO!'; SFX.go();
      setTimeout(()=>{ intro.classList.remove('show');
        if(mode.id==='bombas') BOMBERMAN.start(classic832(), parts, {duration:75, minAlive:minA}, done, ecoId);
        else if(mode.id==='smash') BROS.start(classic832(), parts, {duration:90, minAlive:minA}, done, ecoId);
        else if(mode.id==='hunt') TOWERFALL.start($('#game-canvas'), parts, {duration:60, gameMode:DATA.byMode['hunt'], variant}, done, ecoId);
        else TOWERFALL.start($('#game-canvas'), parts, {duration:60, minAlive:minA, rain:0, variant}, done, ecoId);
      },350);
    }
  },650);
}

function onRoundEnd(){
  const m=current;
  // sin corazones = eliminado del torneo (battle royale hasta que quede 1)
  const outs=m.players.filter(p=>!p.elim&&p.hp<=0).sort((a,b)=>a.hp-b.hp);
  eliminate(outs);
  const me=m.players[0];
  const alive=aliveList();
  const done = me.elim || alive.length<=1;
  showScoreboard(done);
}

function showScoreboard(final){
  const m=current;
  const alive=aliveList();
  let head = final?'FINAL':'🎡 LA RUEDA DECIDE LA RONDA '+(m.round+2)+'…';
  if(!final&&alive.length===2) head='🎡 ¡DUELO 1v1! — la rueda decide dónde…';
  $('#sb-eco').textContent = head;
  const rows=$('#sb-rows'); rows.innerHTML='';
  const ranked=m.players.slice().sort((a,b)=>(b.elim?-1:b.hp)-(a.elim?-1:a.hp));
  let list=ranked;
  if(ranked.length>12){                      // muchos jugadores: top 11 + tú
    const top=ranked.slice(0,11);
    const me=ranked.find(p=>!p.bot);
    if(me&&top.indexOf(me)<0) top.push(me);
    list=top;
  }
  list.forEach(p=>{
    const r=document.createElement('div');
    r.className='sb-row'+(p.elim?' out':'');
    const icons=Math.min(8,p.hp);
    r.innerHTML=`<span class="sb-name">${p.bot?p.name:'★ '+p.name}</span>
      <span class="sb-count">${p.hp}</span>
      <span class="sb-hearts">${'<i class="sb-heart"></i>'.repeat(icons)}${p.hp>8?'<b>+'+(p.hp-8)+'</b>':''}</span>`;
    rows.appendChild(r);
  });
  $('#scoreboard').classList.add('show');
  SFX.phase();
  setTimeout(()=>{
    $('#scoreboard').classList.remove('show');
    if(final) finishMatch();
    else { m.round++; runRound(); }
  },2400);
}

function finishMatch(){
  const m=current, st=DATA.state();
  const me=m.players[0];
  const ranked=m.players.slice().sort((a,b)=>(b.elim?-1:b.hp)-(a.elim?-1:a.hp));
  const alive=aliveList();
  const winner = alive.length? alive.sort((a,b)=>b.hp-a.hp)[0] : ranked[0];
  const win = winner===me;
  const place = win ? 1 : (me.place || Math.max(2, ranked.indexOf(me)+1));

  // NO se le agregan/quitan ♥ al player (su balance de cuenta no cambia). Solo se juega por sobrevivir.
  const isParty = !!m.party;
  const xp = DATA.ECON.XP_REWARD[place] || 12;
  if(win) st.wins++;
  const dcups=win?30:-20;                                  // COPAS: ganas +30, pierdes −20 (Clash Royale)
  const b4=DATA.playerRankCups().idx; DATA.gainCups(dcups); const af=DATA.playerRankCups().idx;
  const dgold=win?60:20; DATA.gainGold(dgold);             // ORO para subir cartas
  // VIDAS DEL MONITO: solo se gastan al PERDER (ganar nunca castiga — regla Supercell)
  let livesLine='';
  if(!isParty && me && me.animal && me.animal.id!==DATA.FREE_STARTER){
    if(!win){
      const lost=Math.max(1, DATA.ECON.LIVES - Math.max(0, me.hp|0));
      const left=DATA.spendLives(me.animal.id, lost);
      livesLine = '−'+lost+' ♥ de '+me.animal.name+' · le quedan '+left+' ♥'
        + (left<=0 ? '  ☠ ¡SE AGOTÓ! compra otro' : '');
    } else {
      livesLine = '¡victoria! '+me.animal.name+' no gastó vidas · '+DATA.animalLives(me.animal.id)+' ♥';
    }
  }
  // COFRE por VICTORIA (estilo CR): entra a un slot; si están llenos, no cabe
  let chestLine='';
  if(win && !isParty){
    const cid=DATA.rollVictoryChest(), slot=DATA.awardChest(cid);
    chestLine = slot>=0 ? ('🎁 ¡GANASTE UN '+DATA.byChest[cid].name+'! → slot '+(slot+1))
                        : '🎁 cofre ganado PERDIDO — slots llenos (abre tus cofres)';
  }
  const lu = DATA.gainXP(xp);            // XP → nivel (regala cofres)
  DATA.save(); UI.updateHearts();

  // pantalla de resultado estilo CLASH (coronas + rayos al ganar / derrota oscura)
  $('#results').classList.remove('win','lose');
  $('#results').classList.add(win?'win':'lose');
  $('#results-title').textContent = win ? '¡VICTORIA!' : '¡DERROTA!';
  $('#results-place').textContent = isParty ? (win?'PARTIDA CON AMIGOS':'CASUAL') : (win?'ÚLTIMO EN PIE':place+'º LUGAR · ELIMINADO');
  $('#results-name').textContent = winner.name+'  ·  '+winner.animal.name;
  $('#results-hearts').textContent = win ? '¡sobreviviste!' : (place+'º de '+m.players.length);
  $('#results-cash').className=''; $('#results-cash').style.color = win?'#57d977':'#b7b1a4';
  $('#results-cash').textContent = win ? 'quedaste como el último en pie' : 'caíste — inténtalo de nuevo';
  $('#results-xp').innerHTML = '<b style="color:'+(dcups>=0?'#ffd34d':'#ff8a7a')+'">'+(dcups>=0?'+':'')+dcups+' 🏆 · '+(st.cups|0)+' total'
    +(af>b4?'  ↑ ¡SUBISTE DE ARENA!':(af<b4?'  ↓ bajaste de arena':''))+'</b>'
    +(chestLine?'<br><span style="color:#7fe0a0;font-weight:900">'+chestLine+'</span>':'')
    +(livesLine?'<br><span style="color:'+(livesLine.indexOf('AGOTÓ')>=0?'#ff8a7a':'#ffb3ad')+'">'+livesLine+'</span>':'')
    +'<br><span style="color:#ffcf5a">+'+dgold+' 🪙 oro</span>'
    +'<br><span style="opacity:.7">+'+xp+' XP · Nivel '+DATA.level()+'</span>';
  if(win) SFX.win(); else SFX.lose();
  const cvs=$('#results-sprite'), c=cvs.getContext('2d');
  c.clearRect(0,0,cvs.width,cvs.height);
  const sp=Sprites.spriteCanvas(winner.animal);
  c.imageSmoothingEnabled=true; c.imageSmoothingQuality='high';
  const k=Math.min(150/sp.height,130/sp.width);
  c.drawImage(sp,(cvs.width-sp.width*k)/2,(cvs.height-sp.height*k)/2,sp.width*k,sp.height*k);
  $('#results').classList.add('show');
  if(window.MUSIC){ if(win) MUSIC.winner(); else MUSIC.lobby(); }
  if(win){ SFX.win(); UI.popHeart(); confetti(); } else SFX.lose();
}

// CONFETI de victoria: llueve confeti sobre la pantalla de resultados
function confetti(){
  const cv=$('#confetti-canvas'); if(!cv) return;
  const c=cv.getContext('2d');
  const W=cv.width=(window.innerWidth||document.documentElement.clientWidth||screen.width||800),
        H=cv.height=(window.innerHeight||document.documentElement.clientHeight||screen.height||600);
  const cols=['#e8c11e','#ff5a4d','#4dd2ff','#57d977','#c77dff','#ff9e3c','#ffffff'];
  const P=[];
  for(let i=0;i<200;i++){
    P.push({ x:Math.random()*W, y:-20-Math.random()*H,
      vx:(Math.random()-.5)*3, vy:2+Math.random()*4.5,
      w:6+Math.random()*7, h:9+Math.random()*9,
      rot:Math.random()*6.28, vr:(Math.random()-.5)*0.35,
      col:cols[i%cols.length], sway:Math.random()*6.28 });
  }
  let t=0;
  (function frame(){
    t++; c.clearRect(0,0,W,H); let alive=false;
    for(const p of P){
      p.x += p.vx + Math.sin(t*0.05+p.sway)*0.9;
      p.y += p.vy; p.vy += 0.03; p.rot += p.vr;
      if(p.y < H+40) alive=true;
      c.save(); c.translate(p.x,p.y); c.rotate(p.rot);
      c.fillStyle=p.col; c.fillRect(-p.w/2,-p.h/2,p.w,p.h);
      c.restore();
    }
    if(alive && t<700 && $('#results').classList.contains('show')) requestAnimationFrame(frame);
    else c.clearRect(0,0,W,H);
  })();
}

// ---- SELECTOR DE MESAS: cada una con su STACK. Entras con tu stack, el ganador se lleva la bolsa. ----
function openRanks(){
  const st=DATA.state();
  $('#ranks-bal').textContent=st.hearts;
  const list=$('#ranks-list'); list.className='mesa-scroll'; list.innerHTML='';
  DATA.RANKS.forEach((_,i)=>{
    const r=DATA.rankAt(i), afford=st.hearts>=r.entry, cur=(st.rank===i);
    const card=document.createElement('div');
    card.className='mesa-card'+((cur&&afford)?' cur':'');
    card.innerHTML=
      '<div class="mc-top" style="background:'+r.color+'">MESA<br>'+r.name+'</div>'+
      '<div class="mc-body">'+
        '<div class="mc-entry">STACK<br><b>'+r.entry+' ♥</b></div>'+
        '<div class="mc-prize">'+r.pot+' ♥<span>bolsa (ganador)</span></div>'+
        '<button class="mc-btn'+(afford?' play':'')+'">'+(afford?(cur?'▶ JUGAR':'JUGAR'):'COMPRAR ♥')+'</button>'+
      '</div>';
    const btn=card.querySelector('.mc-btn');
    if(afford){ btn.onclick=()=>{ SFX.click(); DATA.setRank(i); $('#modal-ranks').classList.remove('show'); startRanked(); }; }
    else { btn.onclick=()=>{ SFX.click(); $('#modal-ranks').classList.remove('show'); if(window.UI&&UI.openStore) UI.openStore(); }; }
    list.appendChild(card);
  });
  const best=DATA.maxAffordableRank(), bc=list.children[best];
  if(bc) list.scrollLeft = Math.max(0, bc.offsetLeft - (list.clientWidth-bc.clientWidth)/2);
  $('#modal-ranks').classList.add('show');
  SFX.click();
}

// ================= MODOS DE JUEGO (la ÚNICA forma de jugar) =================
function openModes(){
  // sin guerrero no se puede jugar — se consigue comprando un cofre en la landing
  if(!DATA.byId[DATA.state().selected]){ UI.toast('Consigue tu guerrero: compra un cofre en la LANDING'); return; }
  const grid=$('#modes-list'); if(!grid) return; grid.innerHTML='';
  DATA.MODES.forEach(m=>{
    const card=document.createElement('div'); card.className='mode-card';
    card.innerHTML='<div class="mc-ic" style="background:'+m.color+'">'+m.icon+'</div>'+
      '<div class="mc-info"><div class="mc-nm" style="color:'+m.color+'">'+m.name+'</div>'+
      '<div class="mc-bl">'+m.blurb+'</div></div>'+
      '<button class="mode-go btn-flat">JUGAR</button>';
    card.querySelector('.mode-go').onclick=()=>{ SFX.click(); $('#modal-modes').classList.remove('show'); startMode(m); };
    grid.appendChild(card);
  });
  $('#modal-modes').classList.add('show'); SFX.click();
}
function startMode(mode){
  if(window.TUT) TUT.onRanked();
  const st=DATA.state(), an=DATA.byId[st.selected];
  if(!an){ SFX.deny(); UI.toast('Necesitas un guerrero. Compra tu monito en la tienda.'); return; }
  st.matches++; DATA.save();
  const me={name:st.name||'TÚ', animal:an, bot:false, weapon:DATA.equipped()};
  const bots=DATA.randomBots(3, an.id);
  let players;
  if(mode.id==='trials'){ players=[Object.assign(me,{team:0,color:COLORS[0]})]; }
  else if(mode.id==='tdm'){
    players=[ Object.assign({},me,{team:0,color:'#4dd2ff'}),
              Object.assign({},bots[0],{team:0,color:'#7fd0ff'}),
              Object.assign({},bots[1],{team:1,color:'#ff5a4d'}),
              Object.assign({},bots[2],{team:1,color:'#ff9e7a'}) ];
  }
  else if(mode.id==='quest'){
    players=[ Object.assign({},me,{team:0,color:'#57d977'}),
              Object.assign({},bots[0],{team:0,color:'#9dff8a'}),
              Object.assign({},bots[1],{team:1,color:'#ff5a4d',enemy:true}),
              Object.assign({},bots[2],{team:1,color:'#c0392b',enemy:true}) ];
  }
  else { // lms, hunt
    players=[Object.assign({},me,{team:0,color:COLORS[0]})];
    bots.forEach((b,i)=>players.push(Object.assign({},b,{team:i+1,color:COLORS[(i+1)%COLORS.length]})));
  }
  players.forEach(p=>{ p.hp=(mode.id==='lms'?(mode.lives||3):1); p.elim=false; p.koRound=false; p.kills=0; p.skulls=0; p.score=0; if(!p.weapon)p.weapon=DATA.byWeapon['bow_wood']; });
  current={ players, mode };
  $('#results').classList.remove('show'); $('#scoreboard').classList.remove('show');
  UI.show('#screen-game'); launchArena();
}
function launchArena(){
  const m=current, mode=m.mode, eco=ECOS[Math.floor(Math.random()*ECOS.length)];
  $('#hud-pot').textContent=mode.icon; const lbl=document.querySelector('.hud-pot-label'); if(lbl)lbl.textContent=mode.id.toUpperCase();
  KIT.updateHudPlayers(m.players, p=>!p.koRound);
  const intro=$('#phase-intro'), MODE=window.TOWERFALL, world=(MODE.mapNames[eco.id]||eco.name);
  const pv=$('#map-preview'); if(pv) pv.style.display='none';   // el preview del mapa es del VERSUS
  $('#intro-kicker').textContent=mode.icon+'  '+mode.name;
  $('#intro-name').textContent=mode.name+' · '+world;
  $('#intro-desc').textContent=mode.blurb;
  $('#hud-phase').textContent=mode.name+' · '+eco.name;
  $('#game-controls').textContent=MODE.controls;
  intro.classList.add('show'); SFX.phase(); if(window.MUSIC)MUSIC.battle(0);
  let n=3; $('#intro-go').textContent=n; SFX.go();
  const iv=setInterval(()=>{ n--;
    if(n>0){ $('#intro-go').textContent=n; SFX.count(); }
    else { clearInterval(iv); $('#intro-go').textContent='GO!'; SFX.go();
      setTimeout(()=>{ intro.classList.remove('show');
        const cfg={ duration:mode.dur, gameMode:mode, minAlive:1, variant:Math.floor(Math.random()*3), rain:0 };
        MODE.start($('#game-canvas'), m.players, cfg, onModeEnd, eco.id);
      },350);
    }
  },650);
}
function onModeEnd(result){ showModeResult(result||{mode:current.mode.id}); }
function showModeResult(r){
  const mode=current.mode, st=DATA.state(), win=!!r.win, me=current.players[0];
  st.matches++;
  if(win) st.wins++;
  const dcups = win?30:-20;                 // COPAS estilo Clash Royale: ganas +, pierdes −
  const beforeIdx=DATA.playerRankCups().idx;
  DATA.gainCups(dcups);
  const afterIdx=DATA.playerRankCups().idx;
  const dgold = win?60:20; DATA.gainGold(dgold);   // ORO: para comprar monitos en el mercado
  const xp=win?60:25, lu=DATA.gainXP(xp); DATA.save(); UI.updateHearts();
  $('#results').classList.remove('win','lose');
  $('#results').classList.add(win?'win':'lose');
  $('#results-title').textContent = win?'¡VICTORIA!':(mode.id==='trials'?'¡TIEMPO!':'¡DERROTA!');
  $('#results-place').textContent = mode.icon+' '+mode.name;
  $('#results-name').textContent = me?(me.name+' · '+me.animal.name):'—';
  let s1='', s2='';
  if(mode.id==='lms'){ s1=win?'ÚLTIMO EN PIE':'eliminado'; s2=win?'sobreviviste a todos':'te ganaron'; }
  else if(mode.id==='hunt'){ s1='💀 '+((r.ranking&&r.ranking[0])?r.ranking[0].skulls:0)+' calaveras (líder)'; s2=win?'¡juntaste más!':'te faltaron'; }
  else if(mode.id==='tdm'){ s1='AZUL '+(r.t0||0)+'  —  '+(r.t1||0)+' ROJO'; s2=win?'¡tu equipo ganó!':'perdió tu equipo'; }
  else if(mode.id==='quest'){ s1='oleada '+(r.wave||1)+' / '+(mode.waves||3); s2=win?'¡oleadas superadas!':'no aguantaron'; }
  else if(mode.id==='trials'){ s1='🎯 '+(r.score||0)+' / '+(mode.goal||20)+' blancos'; s2=win?'¡meta cumplida!':'sigue practicando'; }
  else if(mode.id==='surv'){ s1='🌊 aguantaste '+(r.wave||1)+' oleadas · '+(r.kills||0)+' derribados'; s2=win?'¡sobreviviste a la cacería!':'te cazaron — llega a la oleada 6'; }
  $('#results-hearts').textContent=s1;
  $('#results-cash').className=''; $('#results-cash').style.color=win?'#57d977':'#b7b1a4'; $('#results-cash').textContent=s2;
  const cupTxt=(dcups>=0?'+':'')+dcups+' 🏆 · '+(st.cups|0)+' 🏆 total'
    + (afterIdx>beforeIdx?'  ↑ ¡SUBISTE DE ARENA!':(afterIdx<beforeIdx?'  ↓ bajaste de arena':''));
  $('#results-xp').innerHTML='<b style="color:'+(dcups>=0?'#ffd34d':'#ff8a7a')+'">'+cupTxt+'</b><br><span style="opacity:.85;color:#ffcf5a">+'+dgold+' 🪙 oro · '+(st.coins|0)+' 🪙 total</span><br><span style="opacity:.7">+'+xp+' XP · Nivel '+DATA.level()+(lu.up?'  ★ ¡NIVEL '+lu.level+'!':'')+'</span>';
  const cvs=$('#results-sprite'), c=cvs.getContext('2d'); c.clearRect(0,0,cvs.width,cvs.height);
  if(me){ const sp=Sprites.spriteCanvas(me.animal); c.imageSmoothingEnabled=true; const k=Math.min(150/sp.height,130/sp.width); c.drawImage(sp,(cvs.width-sp.width*k)/2,(cvs.height-sp.height*k)/2,sp.width*k,sp.height*k); }
  $('#results').classList.add('show');
  if(window.MUSIC){ if(win)MUSIC.winner(); else MUSIC.lobby(); }
  if(win){ SFX.win(); UI.popHeart(); confetti(); } else SFX.lose();
}

function init(){
  $('#btn-ranked').addEventListener('click',()=>{ SFX.click(); startRanked(); }); // JUGAR → VERSUS estilo TowerFall (rondas + eliminación)
  const bs=$('#btn-surv'); if(bs) bs.addEventListener('click',()=>{ SFX.click(); startSurvival(); });
  $('#btn-modes-close').addEventListener('click',()=>{ SFX.click(); $('#modal-modes').classList.remove('show'); });
  $('#modal-modes').addEventListener('click',(e)=>{ if(e.target.id==='modal-modes') $('#modal-modes').classList.remove('show'); });
  $('#btn-results-lobby').addEventListener('click',()=>{ SFX.click(); $('#results').classList.remove('show'); UI.enterLobby(); });
}

window.MATCH={ init, openModes, startMode, startRanked, openRanks, startParty, startNetHost, startSurvival };
})();
