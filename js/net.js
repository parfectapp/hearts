/* HEARTS — NET: jugar ONLINE con amigos (WebRTC vía PeerJS, host autoritativo).
   El HOST corre el juego real; los amigos mandan sus CONTROLES y reciben el MUNDO (snapshots). */
(function(){
const $=s=>document.querySelector(s);
let peer=null, conns=[], hostConn=null, isHost=false, code=null;
let roster=[];            // host: [{name,animal,cardLvl,host?,conn?,p?}]
let onRoster=null;
const guest={running:false, snap:null, layout:null, tfr:null, players:null, myIdx:0, raf:0, send:0,
             eco:'selva', bd:null, W:832, H:640, VW:832, VH:640, camX:0, camY:0, dur:120};

function myInfo(){
  const st=DATA.state(); const an=DATA.byId[st.selected]||DATA.byId[DATA.FREE_STARTER];
  return {name:(st.name||'JUGADOR').slice(0,14), animal:an.id, cardLvl:DATA.cardLevel(an.id)};
}
function genCode(){ const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<4;i++) s+=A[Math.floor(Math.random()*A.length)]; return s; }
function ready(){ return typeof Peer!=='undefined'; }
function cleanup(){
  try{ if(peer) peer.destroy(); }catch(e){}
  peer=null; conns=[]; hostConn=null; isHost=false; code=null; roster=[]; guestStop();
}
function pushRoster(list){ if(onRoster) onRoster(list); }
function hostRosterList(){ return roster.map((r,i)=>({name:r.name, animal:r.animal, host:i===0})); }
function syncRoster(){ const m={t:'roster', list:hostRosterList()}; conns.forEach(c=>{ try{c.send(m);}catch(e){} }); pushRoster(hostRosterList()); }

// ================= HOST =================
function host(cb){
  if(!ready()){ cb&&cb(null); return; }
  cleanup(); isHost=true; code=genCode();
  peer=new Peer('hearts-mx-'+code);
  peer.on('open',()=>{ roster=[Object.assign(myInfo(),{host:true})]; syncRoster(); cb&&cb(code); });
  peer.on('connection',c=>{
    c.on('data',m=>hostMsg(c,m));
    c.on('close',()=>{ conns=conns.filter(x=>x!==c); roster=roster.filter(r=>r.conn!==c); syncRoster(); });
  });
  peer.on('error',e=>{ if(e.type==='unavailable-id'){ code=genCode(); } UI.toast('Red: '+e.type); });
}
function hostMsg(c,m){
  if(!m||typeof m!=='object') return;
  if(m.t==='hello'){
    if(conns.length>=3){ try{c.send({t:'full'});}catch(e){} return; }
    conns.push(c);
    roster.push({name:String(m.name||'AMIGO').slice(0,14), animal:DATA.byId[m.animal]?m.animal:'mouse', cardLvl:Math.max(1,Math.min(5,m.cardLvl|0||1)), conn:c});
    syncRoster();
  } else if(m.t==='in'){
    const r=roster.find(r=>r.conn===c);
    if(r&&r.p&&r.p.net){ const n=r.p.net;
      n.l=!!m.l; n.r=!!m.r; n.u=!!m.u; n.d=!!m.d;
      n.jump+=m.j|0; n.dodge+=m.dg|0; n.shoot+=m.s|0; n.ult+=m.ul|0; }
  }
}
function startGame(){
  if(!isHost) return;
  const info=MATCH.startNetHost(roster, {
    emit(snap){ conns.forEach(c=>{ try{c.send(snap);}catch(e){} }); },
    end(res){ conns.forEach(c=>{ try{c.send(res);}catch(e){} }); }
  });
  if(!info) return;
  conns.forEach(c=>{
    const idx=roster.findIndex(r=>r.conn===c);
    try{ c.send(Object.assign({you:idx}, info)); }catch(e){}
  });
}

// ================= GUEST =================
function join(codeIn, cb){
  if(!ready()){ cb&&cb(false); return; }
  cleanup(); isHost=false; code=String(codeIn||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(-4);
  peer=new Peer();
  peer.on('open',()=>{
    hostConn=peer.connect('hearts-mx-'+code,{reliable:true});
    hostConn.on('open',()=>{ hostConn.send(Object.assign({t:'hello'},myInfo())); cb&&cb(true); });
    hostConn.on('data',guestMsg);
    hostConn.on('close',()=>{ UI.toast('Se cayó la conexión con el host'); guestStop(); UI.enterLobby(); });
  });
  peer.on('error',e=>{
    UI.toast(e.type==='peer-unavailable' ? ('No existe la party '+code) : ('Red: '+e.type));
    cb&&cb(false);
  });
}
function guestMsg(m){
  if(!m||typeof m!=='object') return;
  if(m.t==='roster') pushRoster(m.list||[]);
  else if(m.t==='start') guestStart(m);
  else if(m.t==='snap') guest.snap=m;
  else if(m.t==='end') guestEnd(m);
  else if(m.t==='full') UI.toast('La party está llena (4 máx)');
}
// renderer del invitado: dibuja el mundo que manda el host y regresa tus controles
function guestStart(m){
  guest.running=true; guest.myIdx=m.you|0; guest.players=m.players||[]; guest.snap=null;
  guest.eco=m.eco||'selva'; guest.dur=m.dur||120;
  document.querySelectorAll('.modal-back.show').forEach(x=>x.classList.remove('show'));
  $('#results').classList.remove('show'); $('#scoreboard').classList.remove('show');
  UI.show('#screen-game');
  const cv=$('#game-canvas'), ctx=cv.getContext('2d');
  // vista propia; MUNDO del host
  const stEl=cv.parentElement;
  const sw=(stEl&&stEl.clientWidth)||window.innerWidth||screen.width||1280;
  const sh=(stEl&&stEl.clientHeight)||window.innerHeight||screen.height||800;
  const vc=Math.max(16,Math.min(28,Math.round((640*(sw/sh))/52)));
  cv.width=vc*52; cv.height=640;
  guest.VW=cv.width; guest.VH=cv.height;
  guest.W=(m.cols||32)*52; guest.H=(m.rows||24)*52+32;
  guest.camX=Math.max(0,(guest.W-guest.VW)/2); guest.camY=Math.max(0,(guest.H-guest.VH)/2);
  guest.layout=THEMES.getFallLayout(guest.eco, m.variant||0, m.cols||32, m.rows||24);
  guest.tfr=THEMES.makeTFRender(guest.eco, guest.layout);
  guest.bd=new Image(); guest.bd.src='assets/maps/'+guest.eco+'.png?v=4';
  $('#hud-phase').textContent='ONLINE · '+(m.ecoName||guest.eco).toUpperCase();
  if(window.KIT&&KIT.setLives) KIT.setLives(3,3);
  $('#game-controls').textContent='FLECHAS/WASD mover · ESPACIO saltar · X/J disparar · C esquivar · R ulti · ONLINE BETA';
  if(window.MUSIC) MUSIC.battle(0);
  let last=0;
  const K=window.KIT;
  function frame(now){
    if(!guest.running) return;
    if(!last) last=now; const dt=Math.min(0.05,(now-last)/1000); last=now;
    // mandar controles ~30/s (estados + toques)
    guest.send-=dt;
    if(guest.send<=0){ guest.send=0.033;
      const msg={t:'in',
        l:K.keys.has('ArrowLeft')||K.keys.has('KeyA'), r:K.keys.has('ArrowRight')||K.keys.has('KeyD'),
        u:K.keys.has('ArrowUp')||K.keys.has('KeyW'),  d:K.keys.has('ArrowDown')||K.keys.has('KeyS'),
        j:(K.tap('Space')||K.tap('KeyZ')||K.tap('KeyK'))?1:0,
        dg:(K.tap('KeyC')||K.tap('ShiftLeft')||K.tap('ShiftRight')||K.tap('KeyL'))?1:0,
        s:(K.tap('KeyX')||K.tap('KeyJ'))?1:0,
        ul:K.tap('KeyR')?1:0 };
      try{ hostConn&&hostConn.send(msg); }catch(e){}
    }
    draw(dt,now/1000);
    guest.raf=requestAnimationFrame(frame);
  }
  function draw(dt,t){
    const s=guest.snap, W=guest.W, H=guest.H, VW=guest.VW, VH=guest.VH;
    // cámara sigue TU punto del snapshot
    if(s&&s.e&&s.e[guest.myIdx]){
      const me=s.e[guest.myIdx];
      const tx=Math.max(0,Math.min(W-VW, me[0]-VW/2)), ty=Math.max(0,Math.min(H-VH, me[1]-VH/2));
      guest.camX+=(tx-guest.camX)*Math.min(1,dt*5); guest.camY+=(ty-guest.camY)*Math.min(1,dt*5);
    }
    ctx.clearRect(0,0,VW,VH);
    if(guest.bd&&guest.bd.complete&&guest.bd.naturalWidth){
      const sc=Math.max(VW/guest.bd.width,VH/guest.bd.height)*1.14, bw=guest.bd.width*sc, bh=guest.bd.height*sc;
      const px=(W>VW)?(guest.camX/(W-VW)):0.5, py=(H>VH)?(guest.camY/(H-VH)):0.5;
      ctx.drawImage(guest.bd,(VW-bw)*px,(VH-bh)*py,bw,bh);
      ctx.fillStyle='rgba(6,8,16,.18)'; ctx.fillRect(0,0,VW,VH);
    }
    ctx.save(); ctx.translate(-guest.camX,-guest.camY);
    guest.tfr.blocks(ctx,t);
    if(s){
      // cofres
      (s.c||[]).forEach(ch=>{ ctx.fillStyle='#8a5a1a'; ctx.fillRect(ch[0]-13,ch[1]-18,26,18);
        ctx.fillStyle='#ffd34d'; ctx.fillRect(ch[0]-13,ch[1]-18,26,7); });
      // flechas
      ctx.strokeStyle='#c9b890'; ctx.lineWidth=3; ctx.lineCap='round';
      (s.a||[]).forEach(a=>{ ctx.save(); ctx.translate(a[0],a[1]); ctx.rotate(a[2]||0);
        ctx.beginPath(); ctx.moveTo(-12,0); ctx.lineTo(8,0); ctx.stroke(); ctx.restore(); });
      // monitos
      (s.e||[]).forEach((e,i)=>{
        if(e[3]) return;                          // muerto
        const pl=guest.players[i]; if(!pl) return;
        const an=DATA.byId[pl.animal]; if(!an) return;
        const h=56*(an.size||1);
        const pose=e[5]?{moving:true,run:t*9+i}:{idle:true,t:t};
        Sprites.drawAnimal(ctx,an,e[0],e[1],h,e[2]<0,pose);
        if(i===guest.myIdx){ ctx.strokeStyle='rgba(255,255,255,.75)'; ctx.lineWidth=2;
          ctx.beginPath(); ctx.arc(e[0],e[1]-h/2,h*0.62,0,7); ctx.stroke(); }
      });
    }
    ctx.restore();
    // UI fija: timer + minimapa
    if(s){
      ctx.fillStyle='rgba(20,25,35,.75)'; ctx.fillRect(VW/2-40,4,80,26);
      ctx.fillStyle='#e8f2f8'; ctx.font='bold 14px "Space Mono"'; ctx.textAlign='center';
      ctx.fillText(Math.max(0,Math.ceil(s.gt||0))+'s',VW/2,22);
      const mw=Math.min(170,VW*0.16), mh=mw*(H/W), mx=(VW-mw)/2, my=VH-mh-10, k=mw/W, ky=mh/H;
      ctx.fillStyle='rgba(8,10,16,.68)'; ctx.fillRect(mx-3,my-3,mw+6,mh+6);
      ctx.strokeStyle='rgba(255,255,255,.28)'; ctx.lineWidth=1.5; ctx.strokeRect(mx-3,my-3,mw+6,mh+6);
      ctx.fillStyle='rgba(255,255,255,.30)';
      guest.layout.plats.forEach(p=>ctx.fillRect(mx+p.x*k,my+p.y*ky,Math.max(2,p.w*k),1.5));
      (s.e||[]).forEach((e,i)=>{ if(e[3])return;
        ctx.fillStyle=(guest.players[i]&&guest.players[i].color)||'#fff';
        ctx.beginPath(); ctx.arc(mx+e[0]*k,my+e[1]*ky,i===guest.myIdx?3.5:2.5,0,7); ctx.fill(); });
      ctx.strokeStyle='rgba(255,211,77,.85)'; ctx.lineWidth=1.5;
      ctx.strokeRect(mx+guest.camX*k,my+guest.camY*ky,VW*k,VH*ky);
      // HUD superior con las vidas que manda el host
      KIT.updateHudPlayers(guest.players.map((p,i)=>({name:p.name,color:p.color,bot:i!==guest.myIdx,hp:(s.e[i]?s.e[i][4]:0),elim:false})), p=>p.hp>0);
    }
  }
  guest.raf=requestAnimationFrame(frame);
}
function guestStop(){ guest.running=false; if(guest.raf) cancelAnimationFrame(guest.raf); }
function guestEnd(m){
  guestStop();
  const win=(m.wIdx|0)===guest.myIdx;
  // recompensas del lado del invitado (copas/oro; vidas solo al perder)
  const st=DATA.state();
  DATA.gainCups(win?30:-20); DATA.gainGold(win?60:20); DATA.gainXP(win?60:25);
  const an=DATA.byId[st.selected];
  let livesTxt='';
  if(!win&&an&&an.id!==DATA.FREE_STARTER){ const left=DATA.spendLives(an.id,1); livesTxt='−1 ♥ de '+an.name+' · quedan '+left; }
  DATA.save(); UI.updateHearts();
  const r=$('#results'); r.classList.remove('win','lose'); r.classList.add('show', win?'win':'lose');
  $('#results-title').textContent=win?'¡VICTORIA!':'¡DERROTA!';
  $('#results-place').textContent='PARTIDA ONLINE';
  $('#results-name').textContent=(m.winner||'')+' ganó';
  $('#results-hearts').textContent='';
  $('#results-cash').textContent=win?'¡les ganaste a tus amigos!':'tu amigo fue mejor esta vez';
  $('#results-xp').innerHTML='<b style="color:'+(win?'#ffd34d':'#ff8a7a')+'">'+(win?'+30':'−20')+' 🏆</b>'
    +(livesTxt?'<br><span style="color:#ffb3ad">'+livesTxt+'</span>':'')
    +'<br><span style="color:#ffcf5a">+'+(win?60:20)+' 🪙 oro</span>';
  const cvs=$('#results-sprite'); if(cvs&&an){ const c2=cvs.getContext('2d'); c2.clearRect(0,0,cvs.width,cvs.height);
    const sp=Sprites.spriteCanvas(an); c2.imageSmoothingEnabled=true;
    const k=Math.min(150/sp.height,130/sp.width);
    c2.drawImage(sp,(cvs.width-sp.width*k)/2,(cvs.height-sp.height*k)/2,sp.width*k,sp.height*k); }
  if(window.MUSIC){ if(win) MUSIC.winner(); else MUSIC.lobby(); }
}

window.NET={ ready, host, join, startGame, leave:cleanup,
  isHost:()=>isHost, code:()=>code, inRoom:()=>!!peer&&!peer.destroyed,
  setOnRoster(f){ onRoster=f; } };
})();
