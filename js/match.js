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
  const an=DATA.byId[st.selected];
  if(!an){ SFX.deny(); UI.toast('Consigue tu guerrero: compra un cofre en la LANDING'); return; }
  st.matches++; DATA.save(); UI.updateHearts();   // VERSUS estilo TowerFall: rondas de eliminación

  const players=[{name:st.name||'TÚ', animal:an, bot:false, color:COLORS[0], weapon:DATA.equipped()}];
  const WPOOL=DATA.WEAPONS;
  DATA.randomBots(DATA.ECON.PLAYERS-1, an.id).forEach((b,i)=>players.push({...b, color:COLORS[(i+1)%COLORS.length], weapon:WPOOL[Math.floor(Math.random()*WPOOL.length)]}));
  players.forEach(p=>{ p.hp=DATA.ECON.LIVES; p.elim=false; p.koRound=false; });

  current={ players, round:0, ecoStart:Math.floor(Math.random()*ECOS.length) };
  $('#hud-pot').textContent=DATA.ECON.LIVES;                 // vidas con las que entra cada quien
  const lbl=document.querySelector('.hud-pot-label'); if(lbl) lbl.textContent='VIDAS';
  KIT.updateHudPlayers(players,()=>true);
  $('#results').classList.remove('show');
  $('#scoreboard').classList.remove('show');
  UI.show('#screen-game');
  runRound();
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

function runRound(){
  const m=current;
  const eco=ECOS[((m.ecoStart||0)+m.round)%ECOS.length]; // cada ronda cambia de mundo
  const parts=aliveList();
  // ESTILO TOWERFALL: la ronda acaba en cuanto CAE el primero — ese pierde 1 ♥
  const variant=Math.floor(Math.random()*3);
  const cfg={ duration:60, minAlive:Math.max(1,parts.length-1), rain:0, variant };
  const MODE=window.TOWERFALL, tower=MODE.mapNames[eco.id]||eco.name;

  // SELECCIÓN DE MAPA: te sale el mapa y la cámara se ACERCA a la arena (zoom) mientras corre el 3·2·1
  const intro=$('#phase-intro'), pv=$('#map-preview');
  $('#intro-kicker').textContent='RONDA '+(m.round+1)+' · '+parts.length+' EN PIE';
  $('#intro-name').textContent=tower;
  $('#intro-desc').textContent=eco.name+' · el primero en caer pierde 1 ♥';
  $('#hud-phase').textContent='RONDA '+(m.round+1)+' · '+eco.name;
  $('#game-controls').textContent=MODE.controls;
  intro.classList.add('show'); SFX.phase();                  // primero visible (para medir la pantalla)
  if(pv){ pv.style.display=''; pv.classList.remove('zoom'); drawMapPreview(pv, eco.id); }
  if(window.MUSIC) MUSIC.battle(m.round);
  if(pv){ void pv.offsetWidth; pv.classList.add('zoom'); }  // arranca el acercamiento
  let n=3; $('#intro-go').textContent=n; SFX.count();
  const iv2=setInterval(()=>{ n--;
    if(n>0){ $('#intro-go').textContent=n; SFX.count(); }
    else{
      clearInterval(iv2);
      $('#intro-go').textContent='GO!'; SFX.go();
      setTimeout(()=>{ intro.classList.remove('show');
        MODE.start($('#game-canvas'), parts, cfg, onRoundEnd, eco.id);
      },350);
    }
  },800);
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
  const nextEco = final?null:ECOS[((m.ecoStart||0)+m.round+1)%ECOS.length];
  const alive=aliveList();
  let head = final?'FINAL':nextEco.name;
  if(!final&&alive.length===2) head=nextEco.name+' · ¡DUELO 1v1!';
  else if(!final&&m.round+1>=4) head=nextEco.name+' · ⛈';
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
  },3400);
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
  const dgold=win?60:20; DATA.gainGold(dgold);             // ORO para el mercado
  const lu = DATA.gainXP(xp);            // XP → nivel (regala cofres)
  DATA.save(); UI.updateHearts();

  // pantalla de resultado
  $('#results-title').textContent = win ? '¡GANASTE!' : (place+'º LUGAR');
  $('#results-place').textContent = isParty ? (win?'PARTIDA CON AMIGOS':'CASUAL') : (win?'ÚLTIMO EN PIE':'ELIMINADO');
  $('#results-name').textContent = winner.name+'  ·  '+winner.animal.name;
  $('#results-hearts').textContent = win ? '¡sobreviviste!' : (place+'º de '+m.players.length);
  $('#results-cash').className=''; $('#results-cash').style.color = win?'#57d977':'#b7b1a4';
  $('#results-cash').textContent = win ? 'quedaste como el último en pie' : 'caíste — inténtalo de nuevo';
  $('#results-xp').innerHTML = '<b style="color:'+(dcups>=0?'#ffd34d':'#ff8a7a')+'">'+(dcups>=0?'+':'')+dcups+' 🏆 · '+(st.cups|0)+' total'
    +(af>b4?'  ↑ ¡SUBISTE DE ARENA!':(af<b4?'  ↓ bajaste de arena':''))+'</b>'
    +'<br><span style="color:#ffcf5a">+'+dgold+' 🪙 oro</span>'
    +'<br><span style="opacity:.7">+'+xp+' XP · Nivel '+DATA.level()+(lu.up?('  ★ ¡NIVEL '+lu.level+'! + COFRE'):'')+'</span>';
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
  },800);
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
  $('#results-title').textContent = win?'¡GANASTE!':(mode.id==='trials'?'¡TIEMPO!':'FIN');
  $('#results-place').textContent = mode.icon+' '+mode.name;
  $('#results-name').textContent = me?(me.name+' · '+me.animal.name):'—';
  let s1='', s2='';
  if(mode.id==='lms'){ s1=win?'ÚLTIMO EN PIE':'eliminado'; s2=win?'sobreviviste a todos':'te ganaron'; }
  else if(mode.id==='hunt'){ s1='💀 '+((r.ranking&&r.ranking[0])?r.ranking[0].skulls:0)+' calaveras (líder)'; s2=win?'¡juntaste más!':'te faltaron'; }
  else if(mode.id==='tdm'){ s1='AZUL '+(r.t0||0)+'  —  '+(r.t1||0)+' ROJO'; s2=win?'¡tu equipo ganó!':'perdió tu equipo'; }
  else if(mode.id==='quest'){ s1='oleada '+(r.wave||1)+' / '+(mode.waves||3); s2=win?'¡oleadas superadas!':'no aguantaron'; }
  else if(mode.id==='trials'){ s1='🎯 '+(r.score||0)+' / '+(mode.goal||20)+' blancos'; s2=win?'¡meta cumplida!':'sigue practicando'; }
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
  $('#btn-modes-close').addEventListener('click',()=>{ SFX.click(); $('#modal-modes').classList.remove('show'); });
  $('#modal-modes').addEventListener('click',(e)=>{ if(e.target.id==='modal-modes') $('#modal-modes').classList.remove('show'); });
  $('#btn-results-lobby').addEventListener('click',()=>{ SFX.click(); $('#results').classList.remove('show'); UI.enterLobby(); });
}

window.MATCH={ init, openModes, startMode, startRanked, openRanks, startParty };
})();
