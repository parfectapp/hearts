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
  if(!an){ SFX.deny(); UI.toast('Necesitas un guerrero. Abre un cofre GRATIS en tu WALLET.'); return; }
  if(st.hearts<=0){ SFX.deny(); UI.toast('Te quedaste sin ♥. Compra corazones o reclama tu bonus diario.'); return; }
  st.matches++; DATA.save(); UI.updateHearts();   // SIN apuesta: se trata de SOBREVIVIR, no de apostar

  const players=[{name:st.name||'TÚ', animal:an, bot:false, color:COLORS[0], weapon:DATA.equipped()}];
  const WPOOL=DATA.WEAPONS;
  DATA.randomBots(DATA.ECON.PLAYERS-1, an.id).forEach((b,i)=>players.push({...b, color:COLORS[(i+1)%COLORS.length], weapon:WPOOL[Math.floor(Math.random()*WPOOL.length)]}));
  players.forEach(p=>{ p.hp=DATA.ECON.LIVES; p.elim=false; p.koRound=false; });

  current={ players, round:0 };
  $('#hud-pot').textContent=st.hearts;                       // tus ♥ (lo que proteges)
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

function runRound(){
  const m=current;
  const rot=MODE_ROT[m.round%MODE_ROT.length];        // (por ahora solo TowerFall)
  const eco=ECOS[Math.floor(m.round/MODE_ROT.length)%ECOS.length]; // cada ronda cambia de mundo
  const parts=aliveList();
  // SOLO UNO pierde ♥ por ronda: la ronda acaba en cuanto CAE el primero (todos empiezan con sus 3)
  const rain=0, tax=0;
  const cfg={ duration:60, minAlive: Math.max(1, parts.length-1), rain };

  const intro=$('#phase-intro');
  const MODE=rot.obj();
  const tower=MODE.mapNames[eco.id];
  cfg.variant=Math.floor(Math.random()*3);
  $('#intro-kicker').textContent='RONDA '+(m.round+1)+' · '+eco.name+(tax?' · ⛈ TORMENTA −'+tax+'♥':'');
  $('#intro-desc').textContent='girando el modo...';
  $('#intro-go').textContent='?';
  intro.classList.add('show');
  SFX.phase();
  if(window.MUSIC) MUSIC.battle(m.round);

  // ruleta: cicla los 3 modos y aterriza en el de esta ronda
  let spins=10+Math.floor(Math.random()*3), i=Math.floor(Math.random()*MODE_ROT.length);
  const cv=$('#game-canvas');
  const iv=setInterval(()=>{
    $('#intro-name').textContent=MODE_ROT[i%MODE_ROT.length].name+' · '+eco.name; i++;
    SFX.count();
    spins--;
    if(spins<=0){
      clearInterval(iv);
      $('#intro-name').textContent=rot.name+' · '+tower;
      $('#intro-desc').textContent=MODE.desc;
      $('#hud-phase').textContent='RONDA '+(m.round+1)+' · '+rot.name+' · '+eco.name+(rain?' ⛈':'');
      $('#game-controls').textContent=MODE.controls;
      SFX.go();
      let n=3;
      $('#intro-go').textContent=n;
      const iv2=setInterval(()=>{
        n--;
        if(n>0){ $('#intro-go').textContent=n; SFX.count(); }
        else{
          clearInterval(iv2);
          $('#intro-go').textContent='GO!'; SFX.go();
          setTimeout(()=>{
            intro.classList.remove('show');
            MODE.start(cv, parts, cfg, onRoundEnd, eco.id);
          },350);
        }
      },800);
    }
  },110);
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
  const nextEco = final?null:ECOS[(m.round+1)%ECOS.length];
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
  const lu = DATA.gainXP(xp);            // XP → nivel (regala cofres)
  DATA.save(); UI.updateHearts();

  // pantalla de resultado
  $('#results-title').textContent = win ? '¡GANASTE!' : (place+'º LUGAR');
  $('#results-place').textContent = isParty ? (win?'PARTIDA CON AMIGOS':'CASUAL') : (win?'ÚLTIMO EN PIE':'ELIMINADO');
  $('#results-name').textContent = winner.name+'  ·  '+winner.animal.name;
  $('#results-hearts').textContent = win ? '¡sobreviviste!' : (place+'º de '+m.players.length);
  $('#results-cash').className=''; $('#results-cash').style.color = win?'#57d977':'#b7b1a4';
  $('#results-cash').textContent = win ? 'quedaste como el último en pie' : 'caíste — inténtalo de nuevo';
  $('#results-xp').textContent = '+'+xp+' XP · Nivel '+DATA.level()+(lu.up?('  ★ ¡NIVEL '+lu.level+'! + COFRE'):'');
  if(win) SFX.win(); else SFX.lose();
  const cvs=$('#results-sprite'), c=cvs.getContext('2d');
  c.clearRect(0,0,cvs.width,cvs.height);
  const sp=Sprites.spriteCanvas(winner.animal);
  c.imageSmoothingEnabled=true; c.imageSmoothingQuality='high';
  const k=Math.min(150/sp.height,130/sp.width);
  c.drawImage(sp,(cvs.width-sp.width*k)/2,(cvs.height-sp.height*k)/2,sp.width*k,sp.height*k);
  $('#results').classList.add('show');
  if(window.MUSIC){ if(win) MUSIC.winner(); else MUSIC.lobby(); }
  if(win){ SFX.win(); UI.popHeart(); } else SFX.lose();
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

function init(){
  $('#btn-ranked').addEventListener('click',()=>{ SFX.click(); startRanked(); });   // JUGAR directo: sobrevive, no pierdas ♥
  $('#btn-ranks-close').addEventListener('click',()=>{ SFX.click(); $('#modal-ranks').classList.remove('show'); });
  $('#modal-ranks').addEventListener('click',(e)=>{ if(e.target.id==='modal-ranks') $('#modal-ranks').classList.remove('show'); });
  $('#btn-results-lobby').addEventListener('click',()=>{ SFX.click(); $('#results').classList.remove('show'); UI.enterLobby(); });
}

window.MATCH={ init, startRanked, openRanks, startParty };
})();
