/* HEARTS — UI: pantallas, marketplace, wallet, leaderboard */
(function(){
const $ = s=>document.querySelector(s);

function show(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  $(id).classList.add('active');
}
function toast(msg){
  const t=$('#toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),2200);
}

// ---------- login ----------
function renderRosters(){
  const preds = DATA.ANIMALS.filter(a=>a.side==='pred');
  const preys = DATA.ANIMALS.filter(a=>a.side==='prey');
  // el canvas del cache es compartido: clonamos dibujando en uno nuevo
  function cloneCanvas(a){
    const src=Sprites.spriteCanvas(a);
    const cv=document.createElement('canvas'); cv.width=src.width; cv.height=src.height;
    cv.getContext('2d').drawImage(src,0,0);
    return cv;
  }
  const put=(el,list)=>{
    el.innerHTML='';
    list.forEach(a=>el.appendChild(cloneCanvas(a)));
  };
  put($('#roster-red'),preds.slice(0,12));   // showcase del login (no todos, para no saturar)
  put($('#roster-blue'),preys.slice(0,12));
}

function initLogin(){
  const input=$('#login-name');
  const st=DATA.state();
  if(st.name){ input.value=st.name; $('#login-user-title').textContent='*'+st.name.toUpperCase()+'*'; }
  // si compraste un monito en la tienda de la landing, ya te espera aquí
  if(st.name && st.selected && DATA.byId[st.selected]){
    const sub=document.querySelector('.login-sub');
    if(sub) sub.innerHTML='✦ tu monito <b>'+DATA.byId[st.selected].name+'</b> te espera · dale ENTER';
  }
  input.addEventListener('input',()=>{
    $('#login-user-title').textContent = input.value.trim()? '*'+input.value.trim().toUpperCase()+'*' : '*USUARIO*';
  });
  const enter=()=>{
    const name=input.value.trim()||'USUARIO';
    st.name=name; DATA.save(); SFX.click();
    if(!st.onboarded) showOnboarding();   // usuario nuevo: pantallas de bienvenida + cofre
    else enterLobby();                    // pantalla principal (fondo = tu arena)
  };
  $('#btn-enter').addEventListener('click',enter);
  input.addEventListener('keydown',e=>{ if(e.key==='Enter') enter(); });
  $('#login-pass').addEventListener('keydown',e=>{ if(e.key==='Enter') enter(); });
}

// ---------- lobby ----------
function enterLobby(){
  const st=DATA.state();
  $('#lobby-username').textContent='*'+(st.name||'USUARIO').toUpperCase()+'*';
  const r6=DATA.playerRankCups();
  $('#lobby-lvl').innerHTML='<b style="color:'+r6.tier.c1+'">'+r6.name+'</b> · '+(st.cups|0)+' 🏆';
  $('#xp-fill').style.width=(DATA.levelProgress()*100).toFixed(0)+'%';
  updateHearts();
  const an=DATA.byId[st.selected];
  const cv=$('#lobby-avatar'), c=cv.getContext('2d');
  c.clearRect(0,0,cv.width,cv.height);
  if(an){
    const sp=Sprites.spriteCanvas(an);
    c.imageSmoothingEnabled=false;                    // pixel-art nítido
    // ajusta al marco respetando el aspecto del sticker
    const k=Math.min(340/sp.height, 300/sp.width);
    const w=sp.width*k, h=sp.height*k;
    c.drawImage(sp,(cv.width-w)/2,cv.height-h-6,w,h);
    $('#avatar-name').textContent=an.name;
    $('#avatar-token').textContent='NFT '+(st.owned[an.id]||'#—');
    // stats de carta (como el mockup)
    const p=DATA.statPips(an);
    [['#sc-dif',p.dif],['#sc-spd',p.spd],['#sc-hp',p.hp],['#sc-r',p.r]].forEach(([sel,n])=>{
      const el=$(sel); el.innerHTML='';
      for(let i=0;i<n;i++) el.appendChild(document.createElement('i'));
    });
    $('#stats-card').style.display='';
    const rc=DATA.RARITY[an.rarity]||DATA.RARITY.common, pw=DATA.POWERS[an.power];
    $('#avatar-name').style.color=rc.color;
    $('#avatar-value').innerHTML='<span style="color:'+rc.color+';font-weight:900">'+rc.name+'</span> · PODER: <b style="color:'+(pw?pw.color:'#fff')+'">'+(pw?pw.name:'—')+'</b>'
      +(pw&&pw.ult?'<br><span style="opacity:.8">R · '+pw.ult+'</span>':'');
  } else {
    $('#avatar-name').textContent='SIN GUERRERO';
    $('#avatar-token').textContent='—';
    $('#stats-card').style.display='none';
    $('#avatar-value').innerHTML='Consigue tu guerrero:<br><a href="landing.html" style="color:#ffd34d;font-weight:900;text-decoration:underline">COMPRA UN COFRE EN LA LANDING →</a>';
  }
  // selector rápido de tus guerreros
  const row=$('#own-row'); row.innerHTML='';
  const ids=Object.keys(st.owned);
  if(ids.length>1){
    ids.forEach(id=>{
      const a2=DATA.byId[id]; if(!a2) return;
      const src=Sprites.spriteCanvas(a2);
      const mini=document.createElement('canvas');
      mini.width=src.width; mini.height=src.height;
      mini.getContext('2d').drawImage(src,0,0);
      if(st.selected===id) mini.classList.add('sel');
      mini.title=a2.name;
      mini.addEventListener('click',()=>{ st.selected=id; DATA.save(); SFX.click(); enterLobby(); });
      row.appendChild(mini);
    });
  }
  const wr=st.matches?Math.round(st.wins/st.matches*100):0;
  $('#lobby-record').innerHTML=`PARTIDAS ${st.matches}<br>VICTORIAS ${st.wins} (${wr}%)<br>🏆 GANADAS ${st.cupsWon|0}`;
  if(window.MUSIC) MUSIC.lobby();
  show('#screen-lobby');
  startLobbyBG();
  renderArena();
  if(window.TUT) TUT.onLobby();
}

// ---------- ONBOARDING: pantallas de bienvenida (copas/rangos + cómo jugar) ----------
// Los guerreros se consiguen SOLO comprando cofres en la landing — ya no hay cofre ni ratón de arranque.
function showOnboarding(){
  const st=DATA.state();
  const ov=$('#onboarding'), card=$('#onb-card');
  if(!ov||!card){ st.onboarded=true; DATA.save(); enterLobby(); return; }
  const slides=[
    {t:'GANA COPAS · SUBE DE ARENA', b:'Ganas partidas → ganas <b>COPAS 🏆</b>. Entre más copas, mejor tu <b>rango</b> y tu <b>ARENA</b> (hay 8). Si pierdes, bajas copas — como Clash Royale.', ladder:true, btn:'SIGUIENTE'},
    {t:'CÓMO SE JUEGA', b:'En la partida tienes <b>3 ♥ vidas</b>. Muévete, salta y dispara. <b>Sobrevive</b>: el último en pie gana. ¡No pierdas tus ♥!<br><br>Empiezas con el <b>RATÓN</b> 🐭. Consigue <b>mejores guerreros</b> comprando cofres en la <b>landing</b>.', keys:true, btn:'ENTRAR'}
  ];
  let i=0;
  function finish(){ st.onboarded=true; DATA.save(); ov.classList.remove('show'); enterLobby(); }
  function render(){
    const s=slides[i]; let mid='';
    if(s.ladder){ mid='<div class="onb-ladder">'+DATA.RANK_TIERS.map((t,idx)=>
      '<div class="onb-rung" style="border-color:'+t.c1+'66"><span style="color:'+t.c1+'">ARENA '+(idx+1)+' · '+t.name+'</span><em>'+t.hmin+' 🏆</em></div>').join('')+'</div>'; }
    else if(s.keys){ mid='<div class="onb-keys"><span>← →</span><span>SALTO</span><span>DISPARA</span><span>C ESQUIVA</span><span>♥ ♥ ♥</span></div>'; }
    card.innerHTML='<div class="onb-step">'+(i+1)+' / '+slides.length+'</div><h3>'+s.t+'</h3><p>'+s.b+'</p>'+mid
      +'<button class="btn-flat onb-next" id="onb-next">'+s.btn+'</button>';
    $('#onb-next').onclick=()=>{ SFX.click(); if(i<slides.length-1){ i++; render(); } else { finish(); } };
  }
  ov.classList.add('show'); render();
}
function updateHearts(){
  const st=DATA.state();
  { const el=$('#wallet-hearts'); if(el) el.textContent=st.cups|0; }   // monedero del lobby = COPAS 🏆
  { const el=$('#market-hearts'); if(el) el.textContent=st.coins|0; }   // mercado = ORO 🪙 (compras monitos)
  { const el=$('#chests-hearts'); if(el) el.textContent=st.coins|0; }
}
function popHeart(){
  const h=$('#wallet-heart'); if(!h) return; h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop');
}

// ---------- ANIMALES (galería: ver los 50 monitos y sus tarjetas) ----------
let buyTarget=null;
function renderMarket(){
  const st=DATA.state();
  const make=(a)=>{
    const rc=DATA.RARITY[a.rarity]||DATA.RARITY.common;
    const card=document.createElement('div');
    card.className='market-card'+(st.owned[a.id]?' owned':'')+(st.selected===a.id?' selected':'');
    card.style.setProperty('--rc',rc.color);
    const src=Sprites.spriteCanvas(a);
    const cv=document.createElement('canvas'); cv.width=src.width; cv.height=src.height;
    cv.getContext('2d').drawImage(src,0,0);
    card.appendChild(cv);
    const nm=document.createElement('div'); nm.className='mc-name'; nm.textContent=a.name;
    const pr=document.createElement('div'); pr.className='mc-rar';
    pr.textContent = rc.name + (st.owned[a.id]?' · TUYO':'');
    pr.style.color=rc.color;
    card.appendChild(nm); card.appendChild(pr);
    card.addEventListener('click',()=>openBuy(a));
    return card;
  };
  const red=$('#market-red'), blue=$('#market-blue');
  red.innerHTML=''; blue.innerHTML='';
  DATA.ANIMALS.forEach(a=>{ (a.side==='pred'?red:blue).appendChild(make(a)); });
  updateHearts();
}
function openBuy(a){    // "ver tarjeta" estilo mockup: header HEARTS · pips · podio · nombre · ULT
  SFX.click();
  buyTarget=a;
  const st=DATA.state();
  const owned=!!st.owned[a.id];
  const rc=DATA.RARITY[a.rarity]||DATA.RARITY.common, pw=DATA.POWERS[a.power];
  // fondo de la carta según el lado (rojo depredador / azul presa)
  $('#buy-card').classList.toggle('pred', a.side==='pred');
  // sprite del animal sobre el podio
  const cv=$('#buy-canvas'), c=cv.getContext('2d');
  c.clearRect(0,0,cv.width,cv.height);
  const sp=Sprites.spriteCanvas(a);
  c.imageSmoothingEnabled=false;                      // pixel-art nítido
  const k=Math.min(230/sp.height, 220/sp.width);
  const w=sp.width*k, h=sp.height*k;
  c.drawImage(sp,(cv.width-w)/2,(cv.height-h)/2,w,h);
  // el corazón de arriba muestra con cuántos ♥ VIENE el monito
  $('#buy-price').textContent=DATA.animalHearts(a);
  $('#buy-name').textContent=a.name;
  $('#buy-side').textContent=owned?((a.side==='pred'?'DEPREDADOR':'PRESA')+' · '+rc.name+' · TUYO')
    :((a.side==='pred'?'DEPREDADOR':'PRESA')+' · '+rc.name+' · viene con '+DATA.animalHearts(a)+' ♥');
  // PIPS (puntos rellenos, como el mockup)
  const pp=DATA.statPips(a);
  const setPips=(sel,n)=>{ const el=$(sel); el.innerHTML=''; for(let i=0;i<Math.max(1,n);i++) el.appendChild(document.createElement('i')); };
  setPips('#buy-dif',pp.dif); setPips('#buy-spd',pp.spd); setPips('#buy-hp',pp.hp);
  setPips('#buy-r', Math.min(5,(rc.rank||0)+2));   // R = fuerza del ultimate (por rareza)
  // ULTIMATE del animal (tecla R), personalizado
  $('#buy-ult').innerHTML = (pw&&pw.ult) ? ('<b>R · '+pw.ult+'</b> — '+(pw.ultDesc||pw.blurb)) : (pw?pw.blurb:'');
  $('#btn-buy-select').style.display = owned&&st.selected!==a.id?'':'none';
  // COMPRAR visible si NO lo tienes: precio en ORO. Se desactiva si no te alcanza.
  const bb=$('#btn-buy-buy');
  if(owned){ bb.style.display='none'; }
  else { bb.style.display=''; const g=DATA.animalGold(a), can=(st.coins|0)>=g;
    bb.textContent=(can?'COMPRAR · ':'FALTA ORO · ')+g+' 🪙';
    bb.disabled=!can; bb.style.opacity=can?1:.55; bb.style.cursor=can?'pointer':'not-allowed'; }
  $('#modal-buy').classList.add('show');
  if(window.TUT) TUT.onBuyModal();
}
function closeBuy(){ $('#modal-buy').classList.remove('show'); }

function initMarket(){
  $('#btn-market').addEventListener('click',()=>{ SFX.click(); renderMarket(); show('#screen-market'); if(window.TUT)TUT.onMarketOpen(); });
  $('#btn-market-back').addEventListener('click',()=>{ SFX.click(); enterLobby(); });
  $('#btn-buy-cancel').addEventListener('click',()=>{ SFX.click(); closeBuy(); });
  $('#btn-buy-select').addEventListener('click',()=>{
    const st=DATA.state();
    if(!st.owned[buyTarget.id]){ SFX.deny(); return; }
    st.selected=buyTarget.id; DATA.save();
    SFX.click(); toast(buyTarget.name+' equipado'); closeBuy(); renderMarket();
  });
  $('#btn-buy-buy').addEventListener('click',()=>{         // COMPRAR el monito con ORO
    const r=DATA.buyAnimal(buyTarget.id);
    if(!r || r.already){ SFX.deny(); return; }
    if(r.ok===false){ SFX.deny(); toast('Necesitas '+r.need+' 🪙 — gana partidas para juntar oro'); return; }
    SFX.coin(); updateHearts();
    toast('¡'+r.animal.name+' es TUYO! (−'+r.cost+' 🪙)');
    renderMarket(); openBuy(buyTarget);                    // re-abre la carta ya como TUYO
    if(window.TUT && TUT.onBought) TUT.onBought();
  });
}

// ---------- wallet ----------
function initHelp(){
  const bh=$('#btn-help'); if(bh) bh.addEventListener('click',()=>{ SFX.click(); $('#modal-help').classList.add('show'); });
  $('#btn-help-close').addEventListener('click',()=>{ SFX.click(); $('#modal-help').classList.remove('show'); });
}

function initMute(){
  const b=$('#btn-mute');
  if(!b) return;
  const paint=()=>{ b.textContent=MUSIC.isMuted()?'SONIDO OFF':'SONIDO ON'; };
  paint();
  b.addEventListener('click',()=>{ MUSIC.toggleMute(); paint(); });
}

// insignia de escudo con el metal del tier + corazón (estrella si CAMPEÓN)
function rankBadgeSVG(tier, isMax){
  const id='rg'+Math.random().toString(36).slice(2,7);
  return '<svg viewBox="0 0 100 118" xmlns="http://www.w3.org/2000/svg">'
    +'<defs><linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+tier.c1+'"/><stop offset="1" stop-color="'+tier.c2+'"/></linearGradient>'
    +'<linearGradient id="'+id+'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,255,255,.6)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></linearGradient></defs>'
    +'<path d="M50 6 L90 20 L90 58 Q90 92 50 112 Q10 92 10 58 L10 20 Z" fill="url(#'+id+')" stroke="rgba(0,0,0,.4)" stroke-width="2.5"/>'
    +'<path d="M50 17 L80 28 L80 57 Q80 84 50 99 Q20 84 20 57 L20 28 Z" fill="rgba(0,0,0,.26)"/>'
    +'<path d="M50 50 C50 44 44 38 37 38 C28 38 23 45 23 53 C23 65 35 75 50 88 C65 75 77 65 77 53 C77 45 72 38 63 38 C56 38 50 44 50 50 Z" fill="'+tier.c1+'" stroke="rgba(255,255,255,.55)" stroke-width="1.5"/>'
    +'<path d="M50 6 L90 20 L90 38 Q50 28 10 38 L10 20 Z" fill="url(#'+id+'g)" opacity=".55"/>'
    +(isMax?'<path d="M50 1 l3.4 6.9 7.6 1.1 -5.5 5.4 1.3 7.6 -6.8 -3.6 -6.8 3.6 1.3 -7.6 -5.5 -5.4 7.6 -1.1 z" fill="#fff2b0" stroke="#c99a17" stroke-width="1"/>':'')
    +'</svg>';
}
function fillProfile(){   // TU RANGO por COPAS: insignia + tier + progreso al siguiente
  const st=DATA.state(), rk=DATA.playerRankCups();
  $('#modal-hearts').textContent=st.cups|0;
  $('#wal-lvl').textContent=DATA.level();
  $('#rank-badge').innerHTML=rankBadgeSVG(rk.tier, rk.isMax);
  const rt=$('#rank-tier'); rt.textContent=rk.name; rt.style.color=rk.tier.c2;
  const rf=$('#rp-fill'); rf.style.width=(rk.progress*100).toFixed(0)+'%'; rf.style.background='linear-gradient(90deg,'+rk.tier.c2+','+rk.tier.c1+')';
  $('#rank-next').textContent = rk.isMax ? '¡rango MÁXIMO — eres CAMPEÓN!' : ('faltan '+rk.toNext+' 🏆 para '+rk.next.name);
}
// ---- TIENDA: paquetes de corazones (compra simulada, sin dinero real) ----
function renderPacks(){
  const grid=$('#pack-grid'); if(!grid) return; grid.innerHTML='';
  DATA.HEART_PACKS.forEach(p=>{
    const card=document.createElement('div'); card.className='pack'+(p.popular?' pop':'');
    card.innerHTML=(p.popular?'<div class="pk-tag">MÁS POPULAR</div>':'')
      +'<div class="pk-h">'+p.label+'</div>'
      +'<div class="pk-amt">'+p.hearts.toLocaleString()+' ♥</div>'
      +'<div class="pk-bonus">'+(p.bonus||'')+'</div>'
      +'<button class="pk-buy">$'+p.usd.toFixed(2)+'</button>';
    card.querySelector('.pk-buy').onclick=()=>{
      SFX.coin(); const r=DATA.buyPack(p.id); popHeart(); updateHearts(); fillProfile();
      toast('+'+r.hearts.toLocaleString()+' ♥ (compra demo)');
    };
    grid.appendChild(card);
  });
}
function openStore(){ renderPacks(); $('#modal-store').classList.add('show'); SFX.click(); }

// ---- PARTY: jugar con amigos (sala + código; online real = servidor, por ahora bots cubren) ----
let party=null;
function genCode(){ const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<4;i++) s+=a[Math.floor(Math.random()*a.length)]; return 'HRT-'+s; }
function randAnimal(){ return DATA.ANIMALS[Math.floor(Math.random()*DATA.ANIMALS.length)]; }
function botName(){ return DATA.BOT_NAMES[Math.floor(Math.random()*DATA.BOT_NAMES.length)]; }
function openParty(){
  $('#party-start').style.display=''; $('#party-room').style.display='none';
  $('#party-code-in').value='';
  party=null;
  $('#modal-party').classList.add('show'); SFX.click();
}
function myAnimalOr(){ const an=DATA.byId[DATA.state().selected]; return an; }
function partyRoom(){
  $('#party-start').style.display='none'; $('#party-room').style.display='';
  $('#party-code').textContent=party.code;
  renderPartySlots();
}
function createParty(){
  const an=myAnimalOr(); if(!an){ SFX.deny(); toast('Primero saca un guerrero (abre un cofre).'); return; }
  party={ code:genCode(), members:[{me:true, name:DATA.state().name||'TÚ', animal:an}] };
  partyRoom();
}
function joinParty(){
  const code=($('#party-code-in').value||'').trim().toUpperCase();
  if(code.replace(/[^A-Z0-9]/g,'').length<3){ SFX.deny(); toast('Escribe el código de tu amigo.'); return; }
  const an=myAnimalOr(); if(!an){ SFX.deny(); toast('Primero saca un guerrero (abre un cofre).'); return; }
  // simulado: entras a la party de un "host"
  party={ code:code.indexOf('HRT-')===0?code:('HRT-'+code), members:[
    {name:botName(), animal:randAnimal(), bot:true},
    {me:true, name:DATA.state().name||'TÚ', animal:an}
  ]};
  partyRoom();
}
function renderPartySlots(){
  const wrap=$('#party-slots'); wrap.innerHTML='';
  for(let i=0;i<4;i++){
    const m=party.members[i], slot=document.createElement('div');
    if(m){
      slot.className='pslot'+(m.me?' me':'');
      const cv=document.createElement('canvas'); cv.width=cv.height=40;
      const src=Sprites.spriteCanvas(m.animal), c=cv.getContext('2d');
      const k=Math.min(40/src.height,40/src.width); c.imageSmoothingEnabled=false;
      c.drawImage(src,(40-src.width*k)/2,(40-src.height*k)/2,src.width*k,src.height*k);
      slot.appendChild(cv);
      const nm=document.createElement('div'); nm.className='pn';
      nm.innerHTML=(m.me?'★ ':'')+m.name+(m.bot?' <span style="opacity:.55;font-weight:400">(bot)</span>':'');
      slot.appendChild(nm);
    } else {
      slot.className='pslot empty';
      slot.innerHTML='<span class="pn">esperando amigo…</span>';
      const add=document.createElement('button'); add.className='add'; add.textContent='+ BOT';
      add.onclick=()=>{ SFX.click(); party.members.push({name:botName(), animal:randAnimal(), bot:true}); renderPartySlots(); };
      slot.appendChild(add);
    }
    wrap.appendChild(slot);
  }
}
function copyPartyCode(){
  const t=party.code;
  if(navigator.clipboard) navigator.clipboard.writeText(t).catch(()=>{});
  toast('Código copiado: '+t+' — compártelo con tu amigo');
}
function startPartyGame(){
  if(!party){ return; }
  while(party.members.length<4) party.members.push({name:botName(), animal:randAnimal(), bot:true});
  $('#modal-party').classList.remove('show');
  MATCH.startParty(party.members.slice(0,4));
}
function initParty(){
  $('#btn-party').addEventListener('click',()=>{ SFX.click(); openParty(); });
  $('#btn-party-create').addEventListener('click',()=>{ SFX.click(); createParty(); });
  $('#btn-party-join').addEventListener('click',()=>{ SFX.click(); joinParty(); });
  $('#btn-party-copy').addEventListener('click',()=>{ SFX.click(); copyPartyCode(); });
  $('#btn-party-start').addEventListener('click',()=>{ SFX.click(); startPartyGame(); });
  $('#btn-party-leave').addEventListener('click',()=>{ SFX.click(); openParty(); });
  $('#btn-party-close').addEventListener('click',()=>$('#modal-party').classList.remove('show'));
  $('#modal-party').addEventListener('click',(e)=>{ if(e.target.id==='modal-party') $('#modal-party').classList.remove('show'); });
}
function initWallet(){
  $('#wallet-chip').addEventListener('click',()=>{
    const st=DATA.state();
    fillProfile();
    const today=new Date().toDateString();
    $('#btn-daily').disabled = st.lastDaily===today;
    $('#btn-daily').style.opacity = st.lastDaily===today?.5:1;
    $('#modal-wallet').classList.add('show');
    SFX.click();
    if(window.TUT) TUT.onWalletOpen();
  });
  $('#btn-wallet-close').addEventListener('click',()=>$('#modal-wallet').classList.remove('show'));
  $('#btn-daily').addEventListener('click',()=>{
    const st=DATA.state(), today=new Date().toDateString();
    if(st.lastDaily===today){ SFX.deny(); return; }
    st.lastDaily=today; st.hearts+=5; DATA.save();
    SFX.coin(); popHeart(); updateHearts(); fillProfile();
    toast('+5 ♥ bonus diario');
  });
  $('#btn-buy-hearts').addEventListener('click',()=>{ SFX.click(); openStore(); });
  $('#btn-store-close').addEventListener('click',()=>$('#modal-store').classList.remove('show'));
  $('#modal-store').addEventListener('click',(e)=>{ if(e.target.id==='modal-store') $('#modal-store').classList.remove('show'); });
}

// ---------- armería (tienda de armas) ----------
function renderWeapons(){
  const st=DATA.state();
  const make=(w)=>{
    const owned=st.weapons.includes(w.id), eq=st.weapon===w.id;
    const card=document.createElement('div');
    card.className='weap-card'+(owned?' owned':'')+(eq?' equipped':'');
    const src=WEAP.canvas(w.id);
    const icon=document.createElement('canvas');
    icon.width=src.width; icon.height=src.height; icon.getContext('2d').drawImage(src,0,0);
    icon.className='weap-icon';
    const stat = w.kind==='bow'
      ? (w.ammo+' flechas · vel '+Math.round(w.arrowSpeed/100))
      : ('alcance '+Math.round(w.range)+' · empuje '+Math.round(w.knock/100));
    const label = eq?'EQUIPADA' : owned?'EQUIPAR' : (w.price+' 🪙');
    const info=document.createElement('div'); info.className='weap-info';
    info.innerHTML=`<div class="weap-name">${w.name}</div>
      <div class="weap-blurb">${w.blurb}</div>
      <div class="weap-stat">${stat}</div>`;
    const btn=document.createElement('button');
    btn.className='weap-btn '+(eq?'is-eq':owned?'is-own':'is-buy');
    btn.textContent = eq?'EQUIPADA' : owned?'EQUIPAR' : (w.price+' MONEDAS');
    btn.addEventListener('click',()=>{
      if(eq) return;
      if(owned){ DATA.equipWeapon(w.id); SFX.click(); toast('Equipaste '+w.name); }
      else{
        const r=DATA.buyWeapon(w.id);
        if(!r.ok){ SFX.deny(); toast(r.msg); return; }
        SFX.coin(); popHeart(); toast('¡Compraste '+w.name+'!');
      }
      updateHearts(); renderWeapons();
    });
    info.appendChild(btn);
    card.appendChild(icon); card.appendChild(info);
    return card;
  };
  const bows=$('#weap-bows'), swords=$('#weap-swords');
  bows.innerHTML=''; swords.innerHTML='';
  DATA.WEAPONS.forEach(w=>{ (w.kind==='bow'?bows:swords).appendChild(make(w)); });
}
function initWeapons(){
  $('#btn-armory').addEventListener('click',()=>{ SFX.click(); renderWeapons(); updateHearts(); show('#screen-weapons'); });
  $('#btn-armory-back').addEventListener('click',()=>{ SFX.click(); enterLobby(); });
}

// ---------- cofres (gacha) ----------
function chestSVG(col){
  return `<svg viewBox="0 0 80 70" width="76" height="66">
    <ellipse cx="40" cy="64" rx="30" ry="5" fill="rgba(0,0,0,.35)"/>
    <rect x="12" y="30" width="56" height="30" rx="5" fill="${col}"/>
    <rect x="12" y="30" width="56" height="8" fill="rgba(0,0,0,.18)"/>
    <path d="M12 30 q28 -22 56 0 v6 h-56 z" fill="${col}"/>
    <path d="M12 30 q28 -22 56 0" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2"/>
    <rect x="34" y="34" width="12" height="16" rx="2" fill="#3a2a10"/>
    <circle cx="40" cy="42" r="3" fill="#ffe58a"/>
    <rect x="12" y="46" width="56" height="3" fill="rgba(255,255,255,.18)"/>
  </svg>`;
}
function drawChestIcon(c,x,y,col,s){
  c.save(); c.translate(x,y); c.scale(s,s);
  c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0,42,34,7,0,0,7); c.fill();
  c.fillStyle=col; c.fillRect(-32,4,64,34);
  c.beginPath(); c.moveTo(-32,4); c.quadraticCurveTo(0,-24,32,4); c.lineTo(32,10); c.lineTo(-32,10); c.closePath(); c.fill();
  c.fillStyle='rgba(0,0,0,.2)'; c.fillRect(-32,4,64,7);
  c.fillStyle='#3a2a10'; c.fillRect(-7,10,14,18);
  c.fillStyle='#ffe58a'; c.beginPath(); c.arc(0,19,4,0,7); c.fill();
  c.restore();
}
let revealRaf=null, lastChest=null;
const chestImgs={};
DATA.CHESTS.forEach(ch=>{ const im=new Image(); im.onload=()=>chestImgs[ch.id]=im; im.src='assets/chests/'+ch.id+'.png?v=1'; });
function hx2(n){ n=Math.max(0,Math.min(255,n|0)); return n.toString(16).padStart(2,'0'); }
function drawRays(c,cx,cy,color,rot,len,alpha){
  c.save(); c.translate(cx,cy); c.rotate(rot); c.globalAlpha=alpha; c.fillStyle=color;
  for(let i=0;i<12;i++){ c.rotate(Math.PI/6); c.beginPath(); c.moveTo(0,0); c.lineTo(len,-10); c.lineTo(len,10); c.closePath(); c.fill(); }
  c.restore(); c.globalAlpha=1;
}
function drawChest(c,id,x,y,h,col){
  const im=chestImgs[id];
  if(im&&im.width){ const k=h/im.height, w=im.width*k; c.imageSmoothingEnabled=true; c.imageSmoothingQuality='high'; c.drawImage(im,x-w/2,y-h/2,w,h); }
  else drawChestIcon(c,x,y,col,1.7);
}
function playReveal(res){
  lastChest=res.chest.id;
  $('#chest-reveal').classList.add('show');
  const rc=DATA.RARITY[res.rarity], pw=DATA.POWERS[res.animal.power];
  const rr=$('#reveal-rarity'); rr.textContent=rc.name; rr.style.color=rc.color;
  $('#reveal-name').textContent=res.animal.name;
  $('#reveal-power').innerHTML='PODER · <b style="color:'+pw.color+'">'+pw.name+'</b><br><span>'+pw.blurb+'</span>';
  $('#reveal-note').textContent=res.dupe?('Repetido · te devolvemos +'+res.refund+' ♥'):('¡Nuevo! Acuñado '+res.token);
  const stage=$('.reveal-inner'); stage.classList.remove('done');
  const cv=$('#reveal-canvas'), c=cv.getContext('2d'), Wc=cv.width, Hc=cv.height, cx=Wc/2, cy=Hc/2;
  const sp=Sprites.spriteCanvas(res.animal);
  const t0=performance.now(); let snd=false, burst=false, tick=0;
  cancelAnimationFrame(revealRaf);
  const OPEN=1.4;   // momento en que estalla
  function fr(now){
    const t=(now-t0)/1000; c.clearRect(0,0,Wc,Hc);
    const gl=Math.min(1,t*0.7);
    const g=c.createRadialGradient(cx,cy,10,cx,cy,195);
    g.addColorStop(0,rc.color+hx2(70*gl)); g.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=g; c.fillRect(0,0,Wc,Hc);
    if(t<OPEN){
      // ANTICIPACIÓN: el cofre tiembla cada vez más fuerte (estilo Clash Royale)
      const build=t/OPEN;
      const shake=Math.sin(t*(9+build*46))*build*11;
      const bob=Math.sin(t*4)*4 - build*6;
      drawRays(c,cx,cy,rc.color,t*1.4,60+build*40,0.10*build);
      drawChest(c,res.chest.id,cx+shake,cy+bob,168,res.chest.color);
      if(build>0.55){ for(let i=0;i<3;i++){ const a=t*7+i*2.1; c.fillStyle='rgba(255,255,255,'+(0.25+0.4*build)+')';
        c.fillRect(cx+Math.cos(a)*72,cy+Math.sin(a)*60,2+build*2,2+build*2); } }
      if(t-tick>0.16){ tick=t; if(window.SFX&&SFX.count)SFX.count(); }
    } else {
      if(!burst){ burst=true; stage.classList.add('done');
        if(window.SFX){ (res.rarity==='legendary'||res.rarity==='epic')?(SFX.win&&SFX.win()):(SFX.powerup&&SFX.powerup()); } }
      const k=Math.min(1,(t-OPEN)/0.5);
      if(t<OPEN+0.16){ c.fillStyle='rgba(255,255,255,'+(1-(t-OPEN)/0.16)+')'; c.fillRect(0,0,Wc,Hc); }
      drawRays(c,cx,cy,rc.color,t*1.1,155,0.30-0.12*k);
      if(k<1){ c.globalAlpha=1-k; drawChest(c,res.chest.id,cx,cy+k*40,168,res.chest.color); c.globalAlpha=1; }
      c.save(); c.globalAlpha=0.55*(1-k*0.6); c.strokeStyle=rc.color; c.lineWidth=6;
      c.beginPath(); c.arc(cx,cy,26+k*115,0,7); c.stroke(); c.restore();
      const bounce=(1-Math.pow(1-k,3))*(1+0.14*Math.sin(k*Math.PI));   // rebote
      const scale=Math.min((Hc*0.72)/sp.height,(Wc*0.72)/sp.width)*bounce;
      c.imageSmoothingEnabled=false;                  // pixel-art nítido
      const w=sp.width*scale, h=sp.height*scale;
      c.drawImage(sp,cx-w/2,cy-h/2+6,w,h);
      if(res.rarity==='legendary'){ for(let i=0;i<5;i++){ const a=t*2+i*1.3; c.fillStyle='#fff';
        c.fillRect(cx+Math.cos(a)*(90+i*12),cy+Math.sin(a*1.15)*(90+i*9),3,3); } }
    }
    revealRaf=requestAnimationFrame(fr);
  }
  revealRaf=requestAnimationFrame(fr);
}
function openChestFlow(chestId){
  const res=DATA.openTreasure(chestId);
  if(!res.ok){ SFX.deny(); toast(res.msg); return; }
  updateHearts(); playReveal(res);
  if(window.TUT) TUT.onChestOpened();
}
function renderChests(){
  const st=DATA.state();
  const grid=$('#chest-grid'); grid.innerHTML='';
  DATA.CHESTS.forEach(ch=>{
    const isFree = st.freeChest && ch.id==='wood';
    const card=document.createElement('div'); card.className='chest-card'+(isFree?' free':''); card.style.setProperty('--cc',ch.color);
    card.innerHTML=`<div class="chest-vis"><img src="assets/chests/${ch.id}.png?v=1" alt="${ch.name}"></div>
      <div class="chest-name">${ch.name}</div>
      <div class="chest-odds"><span class="od-e">ÉPICO ${ch.odds.epic}%</span> · <span class="od-l">LEG ${ch.odds.legendary}%</span></div>
      <button class="chest-buy">${isFree?'GRATIS':(ch.price+' ♥')}</button>`;
    card.querySelector('.chest-buy').addEventListener('click',()=>openChestFlow(ch.id));
    grid.appendChild(card);
  });
}
function initChests(){
  $('#btn-chests').addEventListener('click',()=>{ SFX.click(); $('#modal-wallet').classList.remove('show'); renderChests(); updateHearts(); show('#screen-chests'); if(window.TUT) TUT.onChestsOpen(); });
  $('#btn-chests-back').addEventListener('click',()=>{ SFX.click(); enterLobby(); });
  $('#reveal-again').addEventListener('click',()=>{ SFX.click(); cancelAnimationFrame(revealRaf); if(lastChest) openChestFlow(lastChest); });
  $('#reveal-close').addEventListener('click',()=>{ SFX.click(); cancelAnimationFrame(revealRaf); $('#chest-reveal').classList.remove('show'); renderChests(); updateHearts(); });
}

// ---------- leaderboard ----------
function renderBoard(){
  const st=DATA.state();
  const board=DATA.leaderboard().slice();
  board.push({name:st.name||'TÚ', animal:st.selected||'mouse', hearts:st.heartsWon, me:true});
  board.sort((a,b)=>b.hearts-a.hearts);
  const list=$('#board-list'); list.innerHTML='';
  board.forEach((r,i)=>{
    const an=DATA.byId[r.animal];
    const row=document.createElement('div');
    row.className='board-row'+(r.me?' me':'');
    row.innerHTML=`<span class="br-rank">${i+1}</span><span class="br-name">${r.me?'★ ':''}${r.name}</span>
      <span class="br-animal">${an?an.name:''}</span><span class="br-hearts">${r.hearts} ♥</span>`;
    list.appendChild(row);
  });
}
function initBoard(){
  const bl=$('#btn-leaderboard'); if(bl) bl.addEventListener('click',()=>{ SFX.click(); renderBoard(); show('#screen-leaderboard'); });
  $('#btn-board-back').addEventListener('click',()=>{ SFX.click(); enterLobby(); });
}

// ---------- CONTROLES TÁCTILES (celular): los botones simulan teclas vía KIT.press/release ----------
function initTouch(){
  const body=document.body;
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints>0;
  const pref = localStorage.getItem('hearts-touch');           // '1' / '0' / null → que ESCOJA el usuario
  let on = pref!==null ? pref==='1' : isTouch;                  // por defecto ON en celular
  const apply=()=>body.classList.toggle('touch-on', on);
  apply();
  const tog=$('#touch-toggle');
  if(tog) tog.addEventListener('click',()=>{ on=!on; localStorage.setItem('hearts-touch', on?'1':'0'); apply(); if(window.SFX)SFX.click(); toast(on?'Controles táctiles ON':'Controles táctiles OFF'); });
  document.querySelectorAll('#touch-controls .tc-btn').forEach(btn=>{
    const k=btn.getAttribute('data-k');
    const down=ev=>{ ev.preventDefault(); btn.classList.add('on'); if(window.KIT)KIT.press(k); };
    const up  =ev=>{ if(ev&&ev.preventDefault)ev.preventDefault(); btn.classList.remove('on'); if(window.KIT)KIT.release(k); };
    btn.addEventListener('touchstart',down,{passive:false});
    btn.addEventListener('touchend',up,{passive:false});
    btn.addEventListener('touchcancel',up,{passive:false});
    btn.addEventListener('mousedown',down);
    btn.addEventListener('mouseup',up);
    btn.addEventListener('mouseleave',()=>{ if(btn.classList.contains('on')) up(); });
  });
}

// ---------- MENÚ PRINCIPAL (hub estilo arcade) ----------
// ---------- FONDO VIVO (paisajes que ciclan: nieve/desierto/volcán/bosque + monitos) ----------
// reutilizable: se le pasa el canvas y la pantalla (menú o lobby). Cada canvas guarda su instancia en cv.__bg
// nombres de las 8 arenas (una por rango COBRE→CAMPEÓN) — estilo Clash Royale
const ARENA_NAMES=['BOSQUE INICIAL','SELVA PERDIDA','MAR DE DUNAS','ARENAS DORADAS','PICOS HELADOS','JARDÍN SAKURA','TEMPLO DE CRISTAL','TRONO DE LAVA'];
function startBiomeBG(cv, menu){
  if(!cv||!menu) return;
  const ctx=cv.getContext('2d');
  if(cv.__bg){ cv.__bg.run(); return; }              // ya construido: solo reanuda el loop
  const S={ W:0,H:0,t:0,on:false,raf:0,runners:[],arrows:[],parts:[], cur:0,next:0,fade:0,hold:0, locked:false };
  const visible=()=>menu.classList.contains('active');
  const HOLD=10, FADE=2.2;                           // seg por bioma / duración del cruce

  // ---- helpers de paisaje ----
  function ridge(c,W,H,topY,rough,color,snow,seed){  // cordillera de picos
    const step=W/9, pts=[];
    c.fillStyle=color; c.beginPath(); c.moveTo(0,H);
    for(let i=0;i*step<=W+step;i++){ const x=i*step;
      const n=Math.sin((i+seed)*1.7)*0.5+Math.sin((i+seed)*0.9+1)*0.5;
      const y=topY-n*rough; if(i===0)c.lineTo(0,y); c.lineTo(x,y); pts.push([x,y]); }
    c.lineTo(W,H); c.closePath(); c.fill();
    if(snow){ c.fillStyle=snow; for(const [x,y] of pts){ c.beginPath(); c.moveTo(x-16,y+22); c.lineTo(x,y-2); c.lineTo(x+16,y+22); c.closePath(); c.fill(); } }
  }
  function dune(c,W,H,baseY,amp,color,seed){         // duna de arena
    c.fillStyle=color; c.beginPath(); c.moveTo(0,H); c.lineTo(0,baseY);
    for(let x=0;x<=W;x+=10){ c.lineTo(x, baseY+Math.sin(x*0.007+seed)*amp+Math.sin(x*0.02+seed*2)*amp*0.35); }
    c.lineTo(W,H); c.closePath(); c.fill();
  }
  function treeline(c,W,H,baseY,hgt,color,seed){     // hilera de árboles (bosque)
    c.fillStyle=color; const step=W/22;
    for(let i=0;i*step<W+step;i++){ const x=i*step+((seed*13)%step);
      const h=hgt*(0.6+0.6*(Math.sin((i+seed)*2.3)*.5+.5));
      c.beginPath(); c.moveTo(x-step*0.62,baseY); c.lineTo(x,baseY-h); c.lineTo(x+step*0.62,baseY); c.closePath(); c.fill(); }
    c.fillRect(0,baseY,W,H-baseY);
  }
  function canopy(c,W,H,baseY,hgt,color,seed){       // copa de selva (blobs redondos)
    c.fillStyle=color; const step=W/12;
    for(let i=0;i*step<W+step;i++){ const x=i*step+((seed*7)%step);
      const r=hgt*(0.7+0.5*(Math.sin((i+seed)*1.9)*.5+.5));
      c.beginPath(); c.arc(x,baseY,r,Math.PI,2*Math.PI); c.fill(); c.fillRect(x-r,baseY,2*r,H-baseY); }
  }

  const SCENES=[
    // 0 · COBRE — BOSQUE INICIAL
    { part:'firefly', draw(c,W,H,t){
        const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#08160f'); g.addColorStop(.55,'#123122'); g.addColorStop(1,'#1e4a30');
        c.fillStyle=g; c.fillRect(0,0,W,H);
        c.fillStyle='rgba(200,255,210,.10)'; c.beginPath(); c.arc(W*0.24,H*0.26,60,0,6.28); c.fill();
        c.fillStyle='rgba(214,255,224,.55)'; c.beginPath(); c.arc(W*0.24,H*0.26,22,0,6.28); c.fill();
        treeline(c,W,H,H*0.56,H*0.14,'#0f2b1c',1);
        c.fillStyle='rgba(150,200,170,.05)'; c.fillRect(0,H*0.5,W,H*0.12);
        treeline(c,W,H,H*0.66,H*0.20,'#0a2015',3);
        treeline(c,W,H,H*0.8,H*0.26,'#05130c',6);
      }},
    // 1 · BRONCE — SELVA PERDIDA (ruina escalonada + copa densa)
    { part:'firefly', draw(c,W,H,t){
        const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#0a1f18'); g.addColorStop(.5,'#134026'); g.addColorStop(1,'#256b3e');
        c.fillStyle=g; c.fillRect(0,0,W,H);
        c.fillStyle='rgba(180,255,200,.08)'; c.beginPath(); c.arc(W*0.72,H*0.24,64,0,6.28); c.fill();
        c.fillStyle='#0c2417'; const px=W*0.5, pw=W*0.26, py=H*0.44, ph=H*0.36;
        for(let s=0;s<5;s++){ const f=1-s/6; c.fillRect(px-pw*f/2, py+ph*s/5, pw*f, ph/5+1); }
        canopy(c,W,H,H*0.58,H*0.09,'#0f3020',1);
        canopy(c,W,H,H*0.7,H*0.13,'#0a2417',4);
        canopy(c,W,H,H*0.84,H*0.16,'#061a10',9);
      }},
    // 2 · PLATA — MAR DE DUNAS
    { part:'dust', draw(c,W,H,t){
        const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#3a1e3a'); g.addColorStop(.5,'#8a4030'); g.addColorStop(.8,'#c9743a'); g.addColorStop(1,'#e0a35a');
        c.fillStyle=g; c.fillRect(0,0,W,H);
        c.fillStyle='rgba(255,210,130,.14)'; c.beginPath(); c.arc(W*0.3,H*0.42,70,0,6.28); c.fill();
        c.fillStyle='rgba(255,226,150,.92)'; c.beginPath(); c.arc(W*0.3,H*0.42,34,0,6.28); c.fill();
        c.fillStyle='#7a3a26'; c.fillRect(W*0.62,H*0.5,W*0.14,H*0.12); c.fillRect(W*0.6,H*0.56,W*0.2,H*0.05);
        dune(c,W,H,H*0.6,H*0.05,'#b45f2e',0.5);
        dune(c,W,H,H*0.68,H*0.06,'#93481f',1.7);
        dune(c,W,H,H*0.78,H*0.07,'#6d3416',3.1);
      }},
    // 3 · ORO — ARENAS DORADAS (pirámides)
    { part:'dust', draw(c,W,H,t){
        const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#2a1636'); g.addColorStop(.45,'#7a3a2e'); g.addColorStop(.8,'#d08a3a'); g.addColorStop(1,'#e8b95e');
        c.fillStyle=g; c.fillRect(0,0,W,H);
        c.fillStyle='rgba(255,220,150,.16)'; c.beginPath(); c.arc(W*0.5,H*0.5,90,0,6.28); c.fill();
        c.fillStyle='rgba(255,232,170,.95)'; c.beginPath(); c.arc(W*0.5,H*0.5,40,0,6.28); c.fill();
        const pyr=(cx,base,w,col)=>{ c.fillStyle=col; c.beginPath(); c.moveTo(cx,base-w*0.95); c.lineTo(cx-w,base); c.lineTo(cx+w,base); c.closePath(); c.fill(); };
        pyr(W*0.3,H*0.74,W*0.15,'#6e3c1f'); pyr(W*0.7,H*0.74,W*0.19,'#5a3018'); pyr(W*0.5,H*0.8,W*0.26,'#43230f');
        c.fillStyle='#43230f'; c.fillRect(0,H*0.8,W,H*0.2);
      }},
    // 4 · PLATINO — PICOS HELADOS
    { part:'snow', draw(c,W,H,t){
        const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#0b1430'); g.addColorStop(.55,'#1b2c52'); g.addColorStop(1,'#32507e');
        c.fillStyle=g; c.fillRect(0,0,W,H);
        c.fillStyle='rgba(210,226,255,.12)'; c.beginPath(); c.arc(W*0.8,H*0.22,52,0,6.28); c.fill();
        c.fillStyle='rgba(228,238,255,.92)'; c.beginPath(); c.arc(W*0.8,H*0.22,26,0,6.28); c.fill();
        for(let i=0;i<44;i++){ const x=(i*127.3)%W, y=(i*71.7)%(H*0.55), tw=Math.sin(t*2+i)*.5+.5; c.fillStyle='rgba(255,255,255,'+(0.25+0.5*tw)+')'; c.fillRect(x,y,1.6,1.6); }
        ridge(c,W,H,H*0.52,H*0.16,'#243a63',null,1);
        ridge(c,W,H,H*0.60,H*0.20,'#182b4c','rgba(236,244,255,.85)',5);
        ridge(c,W,H,H*0.72,H*0.16,'#0f1d38','rgba(220,232,250,.7)',11);
      }},
    // 5 · ESMERALDA — JARDÍN SAKURA
    { part:'petal', draw(c,W,H,t){
        const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#241132'); g.addColorStop(.5,'#54244a'); g.addColorStop(1,'#8a4a5e');
        c.fillStyle=g; c.fillRect(0,0,W,H);
        c.fillStyle='rgba(255,225,235,.14)'; c.beginPath(); c.arc(W*0.5,H*0.28,80,0,6.28); c.fill();
        c.fillStyle='rgba(255,236,242,.95)'; c.beginPath(); c.arc(W*0.5,H*0.28,44,0,6.28); c.fill();
        ridge(c,W,H,H*0.64,H*0.12,'#3a1e3e',null,3);
        const tree=(x,base,s)=>{ c.strokeStyle='#2a1418'; c.lineWidth=6*s; c.lineCap='round';
          c.beginPath(); c.moveTo(x,base); c.lineTo(x,base-40*s); c.moveTo(x,base-24*s); c.lineTo(x-20*s,base-48*s); c.moveTo(x,base-30*s); c.lineTo(x+22*s,base-52*s); c.stroke();
          c.fillStyle='rgba(255,170,200,.9)'; [[0,-58],[-24,-50],[24,-54],[-12,-66],[14,-64]].forEach(([dx,dy])=>{ c.beginPath(); c.arc(x+dx*s,base+dy*s,18*s,0,6.28); c.fill(); }); };
        c.fillStyle='#3a1c2a'; c.fillRect(0,H*0.82,W,H*0.18);
        tree(W*0.15,H*0.86,1.5); tree(W*0.85,H*0.85,1.7);
      }},
    // 6 · DIAMANTE — TEMPLO DE CRISTAL
    { part:'spark', draw(c,W,H,t){
        const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#0a1030'); g.addColorStop(.5,'#1a2a5e'); g.addColorStop(1,'#2e4a86');
        c.fillStyle=g; c.fillRect(0,0,W,H);
        const gl=c.createRadialGradient(W*0.5,H*0.2,10,W*0.5,H*0.2,H*0.6); gl.addColorStop(0,'rgba(120,200,255,.22)'); gl.addColorStop(1,'rgba(120,200,255,0)');
        c.fillStyle=gl; c.fillRect(0,0,W,H);
        const cr=(x,base,w,h2,col)=>{ c.fillStyle=col; c.beginPath(); c.moveTo(x,base-h2); c.lineTo(x-w,base-h2*0.42); c.lineTo(x-w*0.6,base); c.lineTo(x+w*0.6,base); c.lineTo(x+w,base-h2*0.42); c.closePath(); c.fill(); };
        cr(W*0.2,H*0.82,W*0.05,H*0.42,'#20407a'); cr(W*0.8,H*0.82,W*0.055,H*0.46,'#1a3568'); cr(W*0.5,H*0.84,W*0.08,H*0.52,'#152a58');
        c.strokeStyle='rgba(150,220,255,.5)'; c.lineWidth=2; c.beginPath(); c.moveTo(W*0.5,H*0.32); c.lineTo(W*0.43,H*0.6); c.stroke();
        c.fillStyle='#0f1f44'; c.fillRect(0,H*0.82,W,H*0.18);
      }},
    // 7 · CAMPEÓN — TRONO DE LAVA
    { part:'ember', draw(c,W,H,t){
        const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#160607'); g.addColorStop(.5,'#3a0f0c'); g.addColorStop(1,'#651c10');
        c.fillStyle=g; c.fillRect(0,0,W,H);
        const gl=c.createRadialGradient(W*0.5,H*0.36,4,W*0.5,H*0.36,H*0.42); gl.addColorStop(0,'rgba(255,140,40,.5)'); gl.addColorStop(1,'rgba(255,80,20,0)');
        c.fillStyle=gl; c.fillRect(0,0,W,H);
        ridge(c,W,H,H*0.6,H*0.14,'#2a0d0a',null,7);
        c.fillStyle='#1a0806'; c.beginPath(); c.moveTo(W*0.5,H*0.28); c.lineTo(W*0.2,H*0.84); c.lineTo(W*0.8,H*0.84); c.closePath(); c.fill();
        c.strokeStyle='rgba(255,130,40,.85)'; c.lineWidth=3; c.lineCap='round';
        c.beginPath(); c.moveTo(W*0.5,H*0.3); c.lineTo(W*0.46,H*0.5); c.lineTo(W*0.5,H*0.66); c.lineTo(W*0.44,H*0.82); c.stroke();
        c.beginPath(); c.moveTo(W*0.5,H*0.3); c.lineTo(W*0.55,H*0.52); c.lineTo(W*0.52,H*0.74); c.stroke();
        c.fillStyle='rgba(255,180,80,.9)'; c.beginPath(); c.ellipse(W*0.5,H*0.29,W*0.05,H*0.015,0,0,6.28); c.fill();
      }}
  ];

  function initParts(mode){
    S.parts=[]; const n=Math.round(S.W/22);
    for(let i=0;i<n;i++){ const p={x:Math.random()*S.W,y:Math.random()*S.H,ph:Math.random()*6.28,mode};
      if(mode==='snow'){ p.vy=18+Math.random()*24; p.vx=-8-Math.random()*10; p.r=1+Math.random()*1.8; }
      else if(mode==='dust'){ p.vy=-2+Math.random()*4; p.vx=14+Math.random()*22; p.r=.7+Math.random()*1.3; }
      else if(mode==='ember'){ p.vy=-(14+Math.random()*26); p.vx=0; p.r=.8+Math.random()*1.8; }
      else if(mode==='petal'){ p.vy=14+Math.random()*18; p.vx=-6-Math.random()*12; p.r=1.4+Math.random()*2.2; }  // pétalos sakura
      else if(mode==='spark'){ p.vy=-(2+Math.random()*6); p.vx=0; p.r=.7+Math.random()*1.5; }                    // destellos cristal
      else { p.vy=-(4+Math.random()*8); p.vx=0; p.r=1+Math.random()*1.6; }               // firefly
      S.parts.push(p); }
  }
  function drawParts(dt){
    for(const p of S.parts){
      p.x+=(p.vx+Math.sin(S.t*0.7+p.ph)*6)*dt; p.y+=p.vy*dt;
      if(p.y<-8){ p.y=S.H+8; p.x=Math.random()*S.W; } else if(p.y>S.H+8){ p.y=-8; p.x=Math.random()*S.W; }
      if(p.x<-8) p.x=S.W+8; else if(p.x>S.W+8) p.x=-8;
      let col;
      if(p.mode==='snow') col='rgba(235,245,255,.85)';
      else if(p.mode==='dust') col='rgba(230,200,150,.4)';
      else if(p.mode==='ember') col='rgba(255,150,70,'+(0.4+0.5*Math.abs(Math.sin(S.t*2+p.ph)))+')';
      else if(p.mode==='petal') col='rgba(255,190,215,.85)';
      else if(p.mode==='spark') col='rgba(205,240,255,'+(0.3+0.7*Math.abs(Math.sin(S.t*3+p.ph)))+')';
      else col='rgba(190,255,150,'+(0.2+0.65*Math.abs(Math.sin(S.t*2.2+p.ph)))+')';       // firefly
      ctx.fillStyle=col; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.28); ctx.fill();
    }
  }

  function fit(){
    if(!visible() && S.W) return;
    const r=cv.getBoundingClientRect();
    S.W=Math.max(360,Math.round(r.width||menu.clientWidth||960));
    S.H=Math.max(280,Math.round(r.height||menu.clientHeight||660));
    cv.width=S.W; cv.height=S.H; buildRunners(); initParts(SCENES[S.cur].part);
  }
  function buildRunners(){
    const W=S.W,H=S.H, A=(window.DATA&&DATA.ANIMALS)||[];
    S.runners=[]; S.arrows=[]; if(!A.length) return;
    const nRun=Math.min(5,Math.max(3,Math.round(W/260)));
    for(let i=0;i<nRun;i++){ const depth=Math.random();
      S.runners.push({ an:A[(Math.random()*A.length)|0], h:40+depth*34, top:H*(0.9+depth*0.055), x:Math.random()*W,
        dir:Math.random()<.5?-1:1, spd:22+depth*28, run:Math.random()*6.28, shoot:0, shootCD:2+Math.random()*4, depth }); }
    S.runners.sort((a,b)=>a.depth-b.depth);
  }
  function drawBiome(bi,a){ ctx.save(); ctx.globalAlpha=a; SCENES[bi].draw(ctx,S.W,S.H,S.t); ctx.restore(); }
  function setArena(i){                               // fija la arena (según tu rango): sin ciclar
    i=((i%SCENES.length)+SCENES.length)%SCENES.length;
    if(S.locked && S.cur===i && S.fade===0) return;
    S.cur=i; S.next=i; S.fade=0; S.locked=true; if(S.W) initParts(SCENES[i].part);
  }

  function draw(dt){
    const W=S.W,H=S.H; S.t+=dt; ctx.clearRect(0,0,W,H);
    // ciclo entre escenas con cruce suave (solo si NO está fijada a una arena)
    if(!S.locked){
      if(S.fade>0){ S.fade-=dt/FADE; if(S.fade<=0){ S.fade=0; S.cur=S.next; } }
      else { S.hold-=dt; if(S.hold<=0){ S.next=(S.cur+1)%SCENES.length; S.fade=1; S.hold=HOLD; initParts(SCENES[S.next].part); } }
    }
    drawBiome(S.cur,1);
    if(S.fade>0) drawBiome(S.next,1-S.fade);
    // suelo en primer plano (silueta oscura común a todos los biomas)
    const gy=H*0.88; ctx.fillStyle='rgba(6,4,8,.92)'; ctx.fillRect(0,gy,W,H-gy);
    ctx.fillStyle='rgba(255,180,120,.06)'; ctx.fillRect(0,gy,W,2);
    // monitos corriendo / disparando (esfuerzo de brazos), con profundidad
    for(const r of S.runners){
      if(r.shoot>0){ r.shoot-=dt; }
      else{ r.x+=r.dir*r.spd*dt; r.run+=dt*r.spd*0.16;
        if(r.x<-50)r.x=W+50; else if(r.x>W+50)r.x=-50;
        r.shootCD-=dt; if(r.shootCD<=0){ r.shoot=0.9; r.shootCD=3+Math.random()*5;
          S.arrows.push({x:r.x+(r.dir>0?r.h*0.4:-r.h*0.4),y:r.top-r.h*0.55,vx:r.dir*(220+Math.random()*80),life:1}); } }
      const pose=r.shoot>0?{idle:true,t:S.t,draw:Math.min(1,(0.9-r.shoot)/0.35)}:{moving:true,run:r.run};
      ctx.save(); ctx.globalAlpha=0.5+r.depth*0.35;
      if(window.Sprites&&Sprites.drawAnimal) Sprites.drawAnimal(ctx,r.an,r.x,r.top,r.h,r.dir<0,pose);
      ctx.restore();
    }
    ctx.strokeStyle='rgba(240,180,110,.5)'; ctx.lineWidth=2; ctx.lineCap='round';
    for(let i=S.arrows.length-1;i>=0;i--){ const a=S.arrows[i]; a.x+=a.vx*dt; a.life-=dt*0.8;
      if(a.life<=0||a.x<-60||a.x>W+60){ S.arrows.splice(i,1); continue; }
      ctx.globalAlpha=Math.min(.5,a.life); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(a.x-Math.sign(a.vx)*14,a.y); ctx.stroke(); }
    ctx.globalAlpha=1;
    drawParts(dt);
  }
  let last=0;
  function frame(now){ if(!visible()){ S.on=false; return; } if(!last) last=now;
    const dt=Math.min(0.05,(now-last)/1000); last=now; draw(dt); S.raf=requestAnimationFrame(frame); }
  function run(){ if(S.on) return; S.on=true; last=0; S.raf=requestAnimationFrame(frame); }
  fit();
  window.addEventListener('resize',()=>{ clearTimeout(S._rz); S._rz=setTimeout(fit,180); });
  cv.__bg={run,fit,setArena}; run();
}
function startMenuBG(){ startBiomeBG($('#menu-bg'), $('#screen-menu')); }
function startLobbyBG(){
  const cv=$('#lobby-bg'); startBiomeBG(cv, $('#screen-lobby'));
  const idx=(window.DATA&&DATA.playerRankCups)?DATA.playerRankCups().idx:0;
  if(cv && cv.__bg && cv.__bg.setArena) cv.__bg.setArena(idx);   // fondo = TU arena actual (por copas)
}
// ---------- ARENAS estilo Clash Royale (banner + escalera, por COPAS) ----------
function renderArena(){
  const r=DATA.playerRankCups(), idx=r.idx;
  const num=$('#ab-num'), nm=$('#ab-name'), banner=$('#arena-banner');
  if(num) num.textContent='ARENA '+(idx+1)+' / '+ARENA_NAMES.length;
  if(nm){ nm.textContent=ARENA_NAMES[idx]||'ARENA'; nm.style.color=r.tier.c1; }
  if(banner && !banner.__wired){ banner.__wired=true;
    const openLadder=()=>{ SFX.click(); renderArenaLadder(); $('#modal-arenas').classList.add('show'); };
    banner.addEventListener('click',openLadder);
    const ba=$('#btn-arenas'); if(ba) ba.addEventListener('click',openLadder);   // botón ARENAS del menú
    const cl=$('#btn-arenas-close'); if(cl) cl.addEventListener('click',()=>{ SFX.click(); $('#modal-arenas').classList.remove('show'); });
    const mb=$('#modal-arenas'); if(mb) mb.addEventListener('click',e=>{ if(e.target.id==='modal-arenas') mb.classList.remove('show'); });
  }
}
function renderArenaLadder(){
  const box=$('#arena-ladder'); if(!box) return;
  const you=DATA.playerRankCups().idx, h=DATA.state().cups|0, T=DATA.RANK_TIERS;
  box.innerHTML='';
  for(let i=T.length-1;i>=0;i--){                   // de la más alta a la más baja (se sube)
    const t=T[i], st=i===you?'current':(i<you?'done':'locked');
    const row=document.createElement('div'); row.className='arena-row '+st;
    row.style.borderLeftColor=t.c1;
    const right = st==='done' ? '✓ superada'
                : st==='current' ? 'AQUÍ · '+h+' 🏆'
                : 'faltan '+Math.max(0,t.hmin-h)+' 🏆';
    row.innerHTML='<span class="ar-num" style="background:'+t.c1+'22;color:'+t.c1+'">'+(i+1)+'</span>'
      +'<span class="ar-name">'+(ARENA_NAMES[i]||'')+'<b style="color:'+t.c1+'">'+t.name+'</b></span>'
      +'<span class="ar-req">'+right+'</span>';
    box.appendChild(row);
  }
}

function enterMenu(){
  const st=DATA.state();
  $('#menu-hearts').textContent=st.hearts;
  const b=$('#btn-mute-menu'); if(b&&window.MUSIC) b.textContent=MUSIC.isMuted()?'SOUND OFF':'SOUND ON';
  show('#screen-menu');
  startMenuBG();
}
function initMenu(){
  const go=fn=>()=>{ SFX.click(); fn(); };
  $('#mm-versus').addEventListener('click', go(()=>MATCH.openModes()));
  $('#mm-coop').addEventListener('click', go(()=>MATCH.startMode(DATA.byMode['quest'])));
  $('#mm-animals').addEventListener('click', go(()=>{ renderMarket(); show('#screen-market'); }));
  $('#mm-store').addEventListener('click', go(()=>{ renderChests(); updateHearts(); show('#screen-chests'); }));
  $('#mm-friends').addEventListener('click', go(()=>openParty()));
  $('#mm-monito').addEventListener('click', go(()=>enterLobby()));
  $('#wallet-menu').addEventListener('click',()=>{ const st=DATA.state(); fillProfile();
    const today=new Date().toDateString(); $('#btn-daily').disabled=st.lastDaily===today; $('#btn-daily').style.opacity=st.lastDaily===today?.5:1;
    $('#modal-wallet').classList.add('show'); SFX.click(); });
  const mb=$('#btn-mute-menu'); if(mb) mb.addEventListener('click',()=>{ if(window.MUSIC){ MUSIC.toggleMute(); mb.textContent=MUSIC.isMuted()?'SOUND OFF':'SOUND ON'; } });
  const back=$('#btn-lobby-menu'); if(back) back.addEventListener('click',()=>{ SFX.click(); enterMenu(); });
}

window.UI = { show, toast, enterLobby, enterMenu, updateHearts, popHeart, renderRosters, initLogin, initMarket, initWallet, initBoard, initMute, initHelp, initChests, initParty, initTouch, initMenu, openStore };
})();
