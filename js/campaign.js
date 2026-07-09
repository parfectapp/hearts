// ============================================================
// CAMPAÑA "EL CORAZÓN DORADO" — modo historia estilo Mario Bros:
// mapa de 4 reinos, 12 niveles (3 por reino, el último es JEFE),
// mismos mecanismos de pelea (TowerFall) con objetivos por nivel.
// El TUTORIAL del juego ES el nivel 1-1.
// ============================================================
(function(){
const $=s=>document.querySelector(s);

const PROLOGUE='Una noche, los DEPREDADORES robaron el CORAZÓN DORADO que mantenía la paz entre los animales. '+
  'Los cuatro reinos cayeron en la cacería eterna. Nadie se atrevió a enfrentarlos… excepto el más pequeño de todos.';
const EPILOGUE='El CORAZÓN DORADO vuelve a latir y los cuatro reinos respiran en paz… por ahora. — FIN DEL CAPÍTULO 1';

const WORLDS=[
  {eco:'selva',    name:'EL REINO VERDE',    blurb:'La selva esconde la primera esquirla.'},
  {eco:'desierto', name:'LAS DUNAS DORADAS', blurb:'La arena entierra la segunda esquirla.'},
  {eco:'nieve',    name:'EL REINO HELADO',   blurb:'El hielo congela la tercera esquirla.'},
  {eco:'volcan',   name:'EL TRONO DE FUEGO', blurb:'El LEÓN guarda el corazón en su trono.'},
];
// goal: 'kills' derrota N · 'time' aguanta el reloj · 'boss' vence al jefe
const LEVELS=[
  {w:0,name:'PRIMEROS PASOS',  goal:'kills',n:2, dur:120, foes:[{id:'cat',hp:1,lvl:1}],
   story:'El RATÓN sale de su madriguera por primera vez. Un GATO explorador vigila el sendero. Aprende a pelear: derríbalo 2 veces.',
   tut:true, reward:{gold:60}},
  {w:0,name:'LA EMBOSCADA',    goal:'kills',n:4, dur:150, foes:[{id:'cat',hp:1,lvl:1},{id:'snake',hp:1,lvl:1}],
   story:'Los espías del LEOPARDO te tendieron una trampa entre las lianas. No dejes que te rodeen.', reward:{gold:60}},
  {w:0,name:'EL LEOPARDO DE LAS SOMBRAS', goal:'boss', dur:180, boss:true,
   foes:[{id:'leopard',hp:3,lvl:3,size:1.3}],
   story:'El guardián de la selva esconde la primera ESQUIRLA del corazón. Sus manchas se mueven entre la niebla… véncelo 3 veces.',
   reward:{gold:150,gems:5,chest:'silver'}},
  {w:1,name:'TORMENTA DE ARENA', goal:'time',n:45, dur:45, foes:[{id:'snake',hp:1,lvl:2},{id:'vulture',hp:1,lvl:2}],
   story:'Cruza las dunas mientras la tormenta ruge y los colmillos te buscan. AGUANTA hasta que pase.', reward:{gold:70}},
  {w:1,name:'LOS CARROÑEROS',  goal:'kills',n:6, dur:180, foes:[{id:'vulture',hp:1,lvl:2},{id:'snake',hp:1,lvl:2},{id:'eagle',hp:1,lvl:2}],
   story:'Los buitres huelen tu rastro desde las nubes. Derriba a la parvada antes de que te alcancen.', reward:{gold:80}},
  {w:1,name:'LA SERPIENTE REAL', goal:'boss', dur:200, boss:true,
   foes:[{id:'snake',hp:3,lvl:4,size:1.35}],
   story:'Bajo la pirámide duerme la reina de las dunas, enroscada en la segunda ESQUIRLA. Despiértala… y véncela.',
   reward:{gold:180,gems:5,chest:'silver'}},
  {w:2,name:'EL VENTISQUERO',  goal:'time',n:60, dur:60, foes:[{id:'wolf',hp:1,lvl:3},{id:'eagle',hp:1,lvl:3}],
   story:'El frío muerde y los aullidos se acercan entre la nieve. AGUANTA la ventisca completa.', reward:{gold:90}},
  {w:2,name:'LA JAURÍA',       goal:'kills',n:8, dur:210, foes:[{id:'wolf',hp:1,lvl:3},{id:'wolf',hp:1,lvl:3},{id:'bear',hp:1,lvl:3}],
   story:'La jauría del OSO te rodea entre los pinos helados. Ocho colmillos deben caer.', reward:{gold:100}},
  {w:2,name:'EL OSO DEL GLACIAR', goal:'boss', dur:220, boss:true,
   foes:[{id:'bear',hp:3,lvl:4,size:1.35}],
   story:'El coloso del hielo guarda la tercera ESQUIRLA en su cueva de cristal. Cada zarpazo parte el glaciar.',
   reward:{gold:220,gems:8,chest:'gold'}},
  {w:3,name:'EL ASCENSO',      goal:'kills',n:10, dur:240, foes:[{id:'tiger',hp:1,lvl:4},{id:'leopard',hp:1,lvl:4},{id:'eagle',hp:1,lvl:4}],
   story:'La ladera del volcán arde y la guardia real del LEÓN te cierra el paso. Ábrete camino al trono.', reward:{gold:120}},
  {w:3,name:'LLUVIA DE FUEGO', goal:'time',n:90, dur:90, foes:[{id:'tiger',hp:1,lvl:4},{id:'wolf',hp:1,lvl:4},{id:'vulture',hp:1,lvl:4}],
   story:'El cielo llueve ceniza. AGUANTA la última noche antes de ver al rey a los ojos.', reward:{gold:140}},
  {w:3,name:'EL REY DE LOS DEPREDADORES', goal:'boss', dur:260, boss:true, final:true,
   foes:[{id:'lion',hp:4,lvl:5,size:1.4},{id:'tiger',hp:1,lvl:4}],
   story:'EL LEÓN te espera en su trono de lava con el CORAZÓN DORADO entre sus garras. Su escolta ataca primero. Todo termina aquí.',
   reward:{gold:400,gems:25,chest:'diamond'}},
];
const TUT_CONTROLS='FLECHAS/WASD mover · ESPACIO saltar · X disparar · C esquivar · R ultimate';

// ---------- progreso ----------
const prog=()=>DATA.state().campaign;
const isDone=i=>!!prog().done[i];
const isOpen=i=>i===0||isDone(i-1);
const doneCount=()=>LEVELS.reduce((s,_,i)=>s+(isDone(i)?1:0),0);

// ---------- MAPA de la campaña (estilo mapa de mundos de Mario) ----------
function renderMap(){
  $('#camp-progress-n').textContent=doneCount()+' / '+LEVELS.length;
  const box=$('#camp-worlds'); box.innerHTML='';
  WORLDS.forEach((w,wi)=>{
    const band=document.createElement('div'); band.className='camp-world';
    band.style.backgroundImage="linear-gradient(180deg,rgba(7,16,32,.72),rgba(7,16,32,.86)), url('assets/maps/"+w.eco+".png')";
    band.insertAdjacentHTML('beforeend',
      '<div class="cw-head"><span class="cw-num">MUNDO '+(wi+1)+'</span><b>'+w.name+'</b><small>'+w.blurb+'</small></div>');
    const path=document.createElement('div'); path.className='cw-path';
    LEVELS.forEach((lv,i)=>{
      if(lv.w!==wi) return;
      const open=isOpen(i), done=isDone(i);
      const node=document.createElement('button');
      node.className='camp-node'+(done?' done':'')+(open&&!done?' cur':'')+(!open?' locked':'')+(lv.boss?' boss':'');
      const nInWorld=LEVELS.filter((l,j)=>l.w===wi&&j<=i).length;
      node.innerHTML='<span class="cn-ico">'+(!open?'🔒':done?'⭐':lv.boss?'👑':(wi+1)+'-'+nInWorld)+'</span>'+
        '<span class="cn-name">'+lv.name+'</span>';
      if(open) node.addEventListener('click',()=>{ SFX.click(); openLevel(i); });
      else node.addEventListener('click',()=>{ SFX.deny&&SFX.deny(); UI.toast('Supera el nivel anterior para abrir este'); });
      path.appendChild(node);
    });
    band.appendChild(path);
    box.appendChild(band);
  });
}
function open(){ renderMap(); UI.show('#screen-campaign'); }

// ---------- ficha del nivel (historia + objetivo) ----------
let selLvl=0;
function goalText(lv){
  if(lv.goal==='boss') return '👑 VENCE AL JEFE ('+(lv.foes[0].hp)+' vidas)';
  if(lv.goal==='time') return '⏱ AGUANTA '+lv.n+' SEGUNDOS';
  return '🎯 DERROTA '+lv.n+' ENEMIGOS';
}
function openLevel(i){
  selLvl=i; const lv=LEVELS[i], w=WORLDS[lv.w];
  $('#camp-kicker').textContent='MUNDO '+(lv.w+1)+' · '+w.name;
  $('#camp-name').textContent=lv.name;
  $('#camp-story').textContent=lv.story;
  $('#camp-goal').textContent=goalText(lv);
  $('#camp-tut').style.display=lv.tut?'':'none';
  $('#camp-tut').textContent='🎮 '+TUT_CONTROLS;
  const fr=$('#camp-foes'); fr.innerHTML='';
  lv.foes.forEach(f=>{ const a=DATA.byId[f.id]; if(!a) return;
    const src=Sprites.spriteCanvas(a);
    const cv=document.createElement('canvas'); cv.width=src.width; cv.height=src.height;
    cv.getContext('2d').drawImage(src,0,0); fr.appendChild(cv); });
  $('#camp-reward').textContent='premio: '+lv.reward.gold+' 🪙'+(lv.reward.gems?' + '+lv.reward.gems+' 💎':'')+
    (lv.reward.chest?' + '+DATA.CHEST_META[lv.reward.chest].name:'')+(isDone(i)?' · YA COBRADO':'');
  $('#modal-camp').classList.add('show');
}

// ---------- jugar un nivel ----------
function play(i){
  selLvl=i; const lv=LEVELS[i], w=WORLDS[lv.w];
  $('#modal-camp').classList.remove('show');
  $('#camp-end').classList.remove('show');
  const st=DATA.state();
  let an=DATA.byId[st.selected];
  if(!an || DATA.isSpent(an.id)){ st.selected=DATA.FREE_STARTER; DATA.save(); an=DATA.byId[st.selected]; }
  const players=[{name:st.name||'TÚ', animal:an, bot:false, team:0, color:'#e8c11e',
                  weapon:DATA.equipped(), cardLvl:DATA.cardLevel(an.id)}];
  players[0].hp=3;
  lv.foes.forEach((f,fi)=>{ const pa=DATA.byId[f.id]; if(!pa) return;
    const animal=f.size?Object.assign({},pa,{size:(pa.size||1)*f.size}):pa;   // el JEFE es más GRANDE
    players.push({name:pa.name, animal, bot:true, enemy:true, team:1, cardLvl:f.lvl||1, hp:f.hp||1,
                  color:['#ff5a4d','#ff8a3c','#c0392b'][fi%3], weapon:DATA.byWeapon['bow_wood']}); });
  players.forEach(p=>{ p.elim=false; p.koRound=false; p.kills=0; p.skulls=0; p.score=0; });
  $('#hud-pot').textContent='3';
  const lbl=document.querySelector('.hud-pot-label'); if(lbl) lbl.textContent='VIDAS';
  KIT.updateHudPlayers(players,()=>true);
  $('#results').classList.remove('show'); $('#scoreboard').classList.remove('show');
  UI.show('#screen-game');
  $('#hud-phase').textContent='CAMPAÑA · MUNDO '+(lv.w+1)+' · '+lv.name;
  const intro=$('#phase-intro'), pv=$('#map-preview');
  $('#intro-kicker').textContent='📜 MUNDO '+(lv.w+1)+' — '+w.name;
  $('#intro-name').textContent=lv.name;
  $('#intro-desc').textContent=goalText(lv)+(lv.tut?'  ·  '+TUT_CONTROLS:'');
  if(pv) pv.style.display='none';                        // la historia ya te contó dónde estás
  intro.classList.add('show'); SFX.phase();
  if(window.MUSIC) MUSIC.battle(lv.boss?2:lv.w);
  let n=3; $('#intro-go').textContent=n; SFX.count();
  const iv=setInterval(()=>{ n--;
    if(n>0){ $('#intro-go').textContent=n; SFX.count(); }
    else{ clearInterval(iv); $('#intro-go').textContent='GO!'; SFX.go();
      setTimeout(()=>{ intro.classList.remove('show');
        window.TOWERFALL.start($('#game-canvas'), players,
          {duration:lv.dur, variant:i%3,
           gameMode:{id:'camp', name:'CAMPAÑA', teams:true, respawn:1.6, camp:{goal:lv.goal, n:lv.n||0}}},
          r=>onLevelEnd(i,r), w.eco);
      },350); }
  },650);
}

// ---------- fin del nivel: recompensa + pantalla de resultado ----------
function onLevelEnd(i,r){
  const lv=LEVELS[i], win=!!r.win, first=win&&!isDone(i);
  const st=DATA.state();
  let rwTxt='';
  if(first){
    prog().done[i]=true;
    st.coins=(st.coins|0)+lv.reward.gold;
    rwTxt='+'+lv.reward.gold+' 🪙';
    if(lv.reward.gems){ st.gems=(st.gems|0)+lv.reward.gems; rwTxt+='  ·  +'+lv.reward.gems+' 💎'; }
    if(lv.reward.chest){ const slot=DATA.awardChest(lv.reward.chest);
      rwTxt+=slot>=0 ? '  ·  📦 '+DATA.CHEST_META[lv.reward.chest].name : '  ·  📦 (slots de cofre llenos)'; }
    DATA.save(); UI.updateHearts();
  } else if(win){ rwTxt='premio ya cobrado — nivel repetido'; }
  if(window.MUSIC){ if(win) MUSIC.winner(); else MUSIC.lobby(); }
  const end=$('#camp-end');
  end.classList.toggle('lose',!win);
  $('#ce-title').textContent = !win ? 'TE CAZARON' : lv.final ? '👑 ¡EL CORAZÓN DORADO ES TUYO!' : '⭐ ¡NIVEL SUPERADO!';
  $('#ce-sub').textContent = !win
    ? (lv.goal==='time'?'no aguantaste el reloj':lv.goal==='boss'?'el jefe sigue en pie':'te faltaron enemigos por derribar')+' — inténtalo otra vez'
    : lv.final ? EPILOGUE
    : 'derribados: '+(r.kills||0)+(lv.goal==='time'?' · aguantaste la tormenta completa':'');
  $('#ce-reward').textContent=rwTxt;
  const nx=$('#btn-ce-next');
  nx.style.display = win && !lv.final && LEVELS[i+1] ? '' : 'none';
  nx.textContent='SIGUIENTE NIVEL ▶';
  $('#btn-ce-retry').style.display = win ? 'none' : '';
  end.classList.add('show');
  if(win) SFX.win&&SFX.win();
}

// ---------- wiring ----------
function init(){
  const b=$('#btn-camp'); if(!b||b.__wired) return; b.__wired=true;
  b.addEventListener('click',()=>{ SFX.click(); open(); });
  $('#btn-camp-back').addEventListener('click',()=>{ SFX.click(); UI.enterLobby(); });
  $('#btn-camp-play').addEventListener('click',()=>{ play(selLvl); });
  $('#btn-camp-close').addEventListener('click',()=>{ SFX.click(); $('#modal-camp').classList.remove('show'); });
  $('#modal-camp').addEventListener('click',e=>{ if(e.target.id==='modal-camp') $('#modal-camp').classList.remove('show'); });
  $('#btn-ce-next').addEventListener('click',()=>{ SFX.click(); play(selLvl+1); });
  $('#btn-ce-retry').addEventListener('click',()=>{ SFX.click(); play(selLvl); });
  $('#btn-ce-map').addEventListener('click',()=>{ SFX.click(); $('#camp-end').classList.remove('show'); open(); });
}

window.CAMPAIGN={ init, open, play, PROLOGUE };
})();
