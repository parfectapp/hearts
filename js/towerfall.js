/* HEARTS FALL — arqueros battle royale: mueres y sueltas tus corazones */
(function(){
let W=832,H=640;               // dimensiones del MUNDO (CUADRADO: 2×2 pantallas — se fijan en start)
let VW=832,VH=640,camX=0,camY=0;   // dimensiones de la VISTA (el canvas) + cámara que sigue al jugador
const GRAV=1500, RUN=265, JUMP=-565;
// tipos de flecha especiales (se consiguen en cofres)
const ARROW_TYPES={
  bomba:  {tint:'#ff6a3d', label:'FLECHAS BOMBA 💥'},
  laser:  {tint:'#4de1ff', label:'FLECHAS LÁSER (rebotan)'},
  bramble:{tint:'#8adf4a', label:'FLECHAS ESPINA 🌵'},
};

// fondos de arena (estilo TowerFall) por ecosistema
const BACKDROPS={};
['selva','desierto','nieve','volcan','japon','tokyo','egipto','grecia','china'].forEach(e=>{ const im=new Image(); im.onload=()=>BACKDROPS[e]=im; im.src='assets/maps/'+e+'.png?v=4'; });

function start(canvas, players, cfg, onEnd, eco){
  const ctx=canvas.getContext('2d');
  const K=window.KIT;
  const M=window.MAPART;
  // MAPA 4 VECES MÁS GRANDE y CUADRADO (estilo Hunger Games): 2×2 pantallas,
  // un jugador en cada ESQUINA y una CORNUCOPIA con botín en el CENTRO.
  let cols=16, rows=12;
  { const stEl=canvas.parentElement;
    const sw=(stEl&&stEl.clientWidth)||window.innerWidth||screen.width||0;
    const sh=(stEl&&stEl.clientHeight)||window.innerHeight||screen.height||0;
    let vc=16;
    if(sw>0&&sh>0) vc=Math.max(16, Math.min(28, Math.round((640*(sw/sh))/52)));
    canvas.width=vc*52; canvas.height=640;
    VW=canvas.width; VH=canvas.height;         // vista = tu pantalla
    cols=Math.min(56, vc*2); rows=24;          // mundo = 2 pantallas de ancho × 2 de alto (cuadrado)
    if(cfg&&cfg.forceCols){ cols=cfg.forceCols; rows=cfg.forceRows||24; }   // ONLINE: el host dicta el mundo
    W=cols*52; H=rows*52+32;
    camX=Math.max(0,(W-VW)/2); camY=Math.max(0,(H-VH)/2); }
  const layout=THEMES.getFallLayout(eco||'selva',(cfg&&cfg.variant)||0, cols, rows);
  // UNO EN CADA ESQUINA: los primeros 4 spawns son los más cercanos a cada esquina del mundo
  if(layout.spawns && layout.spawns.length>=4){
    const corners=[[50,50],[W-50,50],[50,H-60],[W-50,H-60]];
    const pool=layout.spawns.slice(), picked=[];
    corners.forEach(cn=>{ let bi=0,bd=Infinity;
      pool.forEach((s,i)=>{ const d=(s[0]-cn[0])*(s[0]-cn[0])+(s[1]-cn[1])*(s[1]-cn[1]); if(d<bd){bd=d;bi=i;} });
      picked.push(pool.splice(bi,1)[0]); });
    layout.spawns=picked.concat(pool);
  }
  const PLATS=layout.plats;
  const tf=THEMES.makeTFRender(layout.arena||'selva',layout);
  const parts=K.particles();
  const WRAP=!!layout.wrap, WRAPY=true;   // WRAP TOTAL (túneles): sales por abajo→apareces arriba, por un lado→el otro (como TowerFall)
  function wrapEnt(o){
    if(!WRAP) return;
    if(o.x<-10) o.x+=W+20; else if(o.x>W+10) o.x-=W+20;
    if(WRAPY){ if(o.y>H+24) o.y-=H+48; else if(o.y<-24) o.y+=H+48; }
  }
  const GM=cfg.gameMode||{id:'lms',respawn:0};
  const GMID=GM.id, TEAMS=!!GM.teams, RESPAWN=GM.respawn||0;
  const DUR=cfg.duration||GM.dur||60, MIN=cfg.minAlive||2;
  const skulls=[], targets=[];               // HEADHUNTERS calaveras · TRIALS blancos
  const flags=[]; let caps=[0,0];            // 🚩 CAPTURA LA BANDERA (por equipos)
  const result={mode:GMID}; let wave=1, questDone=false, questLost=false, targetT=0;

  const ents=players.map((p,i)=>{
    const st=p.animal.stats;
    const sp=layout.spawns[i%layout.spawns.length];
    p.koRound=false;
    const wd=(p.weapon&&p.weapon.kind)?p.weapon:DATA.byWeapon['bow_wood'];
    const pw=p.animal.power||'';
    let spd=RUN*(1+(st.vel-5)*0.05);
    if(pw==='dash') spd*=1.32;
    spd*=1+((p.cardLvl||1)-1)*0.05;      // NIVEL de carta (estilo CR): +5% velocidad por nivel
    const jit = i>=layout.spawns.length ? (Math.random()-0.5)*80 : 0;  // evita apilar cuando hay muchos
    const sz = p.animal.size || 1;                                     // tamaño según el animal
    return { p, x:sp[0]+jit, y:sp[1], vx:0, vy:0, w:(pw==='slippery'?24:30)*sz, h:42*sz, sz,
      onG:false, jumps:1, face:i%2?-1:1,
      weap:wd, ammo: wd.kind==='bow'? wd.ammo : 0, cd:0, swing:0, drawT:0, kx:0,
      pow:pw, dj:pw==='doublejump', healT:0,
      jumpMul:0.86+(st.vel-3)*0.035, gravMul:0.9+(st.def-3)*0.03,  // ligeros saltan/flotan, pesados caen
      dead:false, shield:pw==='shield', wings:false, boots:false,
      spd, think:Math.random()*0.3, mvx:0, wantJump:false, wantShootDir:null,
      inv:1.2, runPh:Math.random()*6, landT:0, crouch:false, crouchT:0,
      dodgeT:0, dodgeCd:0, ddx:0, ddy:0, dropT:0,
      ultCd:2, rageT:0, phaseT:0, blitzT:0, skyfall:false, ultFlash:0,  // ULTIMATE (R) por animal
      team:(p.team!=null?p.team:i), enemy:!!p.enemy, respawnT:0 };       // MODOS: equipo / enemigo / respawn
  });
  function respawnEnt(e){
    const sp=layout.spawns[Math.floor(Math.random()*layout.spawns.length)];
    e.x=sp[0]+(Math.random()-.5)*30; e.y=sp[1]-4; e.vx=0; e.vy=0;
    e.dead=false; e.p.koRound=false; e.inv=1.5; e.respawnT=0;
    e.ammo=e.weap.kind==='bow'?e.weap.ammo:0; e.shield=(e.pow==='shield'); e.wings=false; e.boots=false; e.special=null;
    parts.spawn(e.x,e.y-e.h/2,'#ffffff',18,240);
  }
  // 🚩 CTF: base de cada equipo = el spawn de un jugador suyo, lo MÁS LEJOS posible del rival
  if(GMID==='ctf'){
    const t0=ents.filter(e=>e.team===0), t1=ents.filter(e=>e.team===1);
    if(t0.length&&t1.length){
      const b0=t0[0];
      const b1=t1.slice().sort((a,b)=>Math.hypot(b.x-b0.x,b.y-b0.y)-Math.hypot(a.x-b0.x,a.y-b0.y))[0];
      flags.push({team:0, hx:b0.x, hy:b0.y-6, x:b0.x, y:b0.y-6, carrier:null});
      flags.push({team:1, hx:b1.x, hy:b1.y-6, x:b1.x, y:b1.y-6, carrier:null});
    }
  }
  const espd=e=>{ let s=(e.pow==='berserk'&&e.p.hp<=1)?e.spd*1.4:e.spd; if(e.rageT>0)s*=1.5; if(e.phaseT>0)s*=1.25; return s; };
  const MAXA=6;
  const arrows=[], hearts=[], chests=[], floats=[], stuck=[], corpses=[], brambles=[];
  // cuerpo que se cae con la inercia de la flecha, se acuesta y se desvanece
  function addCorpse(e,dir,by){
    let kx = dir ? dir.vx*0.32 : (by? Math.sign(e.x-by.x)*260 : (Math.random()-.5)*200);
    kx=Math.max(-460,Math.min(460,kx));
    corpses.push({a:e.p.animal, x:e.x, y:e.y, vx:kx, vy:-205-Math.random()*70,
      rot:0, spin:(kx>=0?1:-1)*(4+Math.random()*3), face:e.face, t:0.9, land:false});
  }
  function stickArrow(x,y,ang){
    stuck.push({x,y,ang:ang||0});
    if(stuck.length>14) stuck.shift();
  }
  let time=0, over=false, endTimer=0, raf=null, sudden=0, chestT=4;
  // CORNUCOPIA (Hunger Games): botín inicial amontonado en el CENTRO del mundo
  { const cx=W/2, cy=H/2;
    const near=PLATS.slice().sort((a,b)=>{
      const da=(a.x+a.w/2-cx)*(a.x+a.w/2-cx)+(a.y-cy)*(a.y-cy);
      const db=(b.x+b.w/2-cx)*(b.x+b.w/2-cx)+(b.y-cy)*(b.y-cy); return da-db; })[0];
    if(near){ const bx=near.x+near.w/2;
      [-38,0,38].forEach(off=>chests.push({x:bx+off, y:near.y, t:Math.random()})); } }
  function spawnChest(){
    if(chests.length>=2) return;
    const sp=layout.spawns[Math.floor(Math.random()*layout.spawns.length)];
    if(living().some(e=>Math.abs(e.x-sp[0])<80&&Math.abs(e.y-sp[1])<80)) return;
    if(chests.some(ch=>Math.abs(ch.x-sp[0])<40)) return;
    chests.push({x:sp[0],y:sp[1],t:0});
  }
  function say(x,y,txt,col){ floats.push({x,y,txt,col:col||'#ffd34d',t:1.2}); }
  function openChest(ch,e){
    chests.splice(chests.indexOf(ch),1);
    SFX.powerup(); parts.spawn(ch.x,ch.y-10,'#ffd34d',14,200);
    const pool=['escudo','alas','botas','carcaj','bomba','laser','bramble'];   // sin '+♥' (nadie suma corazones)
    const fx=pool[Math.floor(Math.random()*pool.length)];
    if(fx==='escudo'){ e.shield=true; say(ch.x,ch.y-24,'ESCUDO','#9ce8ff'); }
    else if(fx==='alas'){ e.wings=true; say(ch.x,ch.y-24,'ALAS','#f2ede2'); }
    else if(fx==='botas'){ e.boots=true; say(ch.x,ch.y-24,'BOTAS DE SALTO','#9dff8a'); }
    else if(ARROW_TYPES[fx]&&e.weap.kind==='bow'){   // FLECHAS ESPECIALES (bomba/láser/espina)
      e.special={type:fx,count:4}; e.ammo=Math.min(MAXA,Math.max(e.ammo,4));
      say(ch.x,ch.y-24,ARROW_TYPES[fx].label,ARROW_TYPES[fx].tint); SFX.powerup();
    }
    else { e.shield=true; say(ch.x,ch.y-24,'ESCUDO','#9ce8ff'); }
  }
  // tormenta: los corazones cobrados llueven como botín
  for(let i=0;i<(cfg.rain||0);i++){
    hearts.push({x:60+(i/(cfg.rain))* (W-120)+Math.random()*30, y:-20-Math.random()*160,
      vx:(Math.random()-.5)*60, vy:40, onG:false, t:Math.random()*6});
  }

  function hudRefresh(){ K.updateHudPlayers(players, p=>!p.koRound); }
  function dropHearts(x,y,n){
    for(let i=0;i<n;i++){
      hearts.push({x:x+(Math.random()-.5)*20, y:y-30,
        vx:(Math.random()-.5)*340, vy:-200-Math.random()*180, onG:false, t:Math.random()*6});
    }
  }
  function kill(e,by,dir){
    if(e.dead||e.inv>0) return;
    if(TEAMS && by && by!==e && by.team===e.team) return;   // FUEGO AMIGO OFF en equipos/co-op
    if(e.shield){
      e.shield=false; e.inv=1.2;
      parts.spawn(e.x,e.y-e.h/2,'#9ce8ff',18,240);
      say(e.x,e.y-e.h-14,'¡ESCUDO ROTO!','#9ce8ff');
      SFX.hit(); return;
    }
    parts.spawn(e.x,e.y-e.h/2,'#ff5a4d',24,280);
    SFX.ko(); K.shake(10);
    // sueltas tus flechas al piso (recuperables) y pierdes tus poderes
    for(let i=0;i<e.ammo;i++) stickArrow(e.x+(Math.random()-.5)*50, e.y-4, Math.PI/2);
    e.ammo=0; e.wings=false; e.boots=false;
    // MODOS: cuenta la kill + suelta CALAVERA (headhunters)
    if(by && by!==e && by.p){ by.p.kills=(by.p.kills||0)+1; }
    if(GMID==='hunt'){ skulls.push({x:e.x,y:e.y-8,vx:(Math.random()-.5)*160,vy:-230,onG:false,t:0}); }
    addCorpse(e,dir,by);   // el mono sale volando con la flecha y se acuesta
    e.dead=true; e.p.koRound=true; SFX.die();
    // vidas / RESPAWN según el modo
    if(GMID==='lms'||GMID==='surv'||GMID==='camp'){ if(e.p.hp>0) e.p.hp--;
      // CAMPAÑA: el JEFE también revive mientras le queden vidas; en surv/lms solo el jugador
      e.respawnT=(e.p.hp>0 && (!e.enemy||GMID==='camp'))?RESPAWN:0; }   // sin vidas = out
    else if(e.enemy){ e.respawnT=0; }                                            // enemigos de QUEST no reviven
    else if(RESPAWN>0){ e.respawnT=RESPAWN; }                                    // reapareces
    hudRefresh();
  }
  function shoot(e,dx,dy){
    if(e.weap.kind!=='bow') return;
    if(e.ammo<=0||e.cd>0) return;
    e.ammo--; e.cd=e.weap.cd; e.drawT=0.16;
    let sp=e.weap.arrowSpeed||720, n=Math.hypot(dx,dy)||1, tint=e.weap.tint, type=null;
    if(e.special&&e.special.count>0){        // flecha ESPECIAL del cofre
      type=e.special.type; tint=ARROW_TYPES[type].tint; e.special.count--;
      if(type==='laser') sp*=1.5;            // el láser vuela rapidísimo
      if(e.special.count<=0) e.special=null;
    }
    const ox=e.x+dx/n*22, oy=e.y-e.h*0.55+dy/n*22;
    const spread=(e.pow==='triple')?[-0.2,0,0.2]:[0];   // TRIPLE FLECHA: abanico de 3
    spread.forEach(a=>{
      const cs=Math.cos(a), sn=Math.sin(a);
      const vx=(dx/n)*cs-(dy/n)*sn, vy=(dx/n)*sn+(dy/n)*cs;
      arrows.push({x:ox,y:oy,vx:vx*sp,vy:vy*sp,owner:e,t:type==='laser'?2:3,grace:0.09,tint,type,bounces:type==='laser'?3:0});
    });
    SFX.arrow();
  }
  // espada: golpe cuerpo a cuerpo al frente
  function melee(e){
    if(e.weap.kind!=='sword'||e.cd>0) return;
    e.cd=e.weap.cd; e.swing=0.24; SFX.arrow(); K.shake(4);
    const rng=e.weap.range||60;
    parts.spawn(e.x+e.face*rng*0.6, e.y-e.h*0.55, e.weap.tint, 10, 220);
    living().forEach(o=>{
      if(o===e||o.dead) return;
      const dx=o.x-e.x;
      if(Math.sign(dx)!==e.face && Math.abs(dx)>16) return;
      const d=Math.hypot(dx,(o.y-o.h/2)-(e.y-e.h/2));
      if(d<=rng){ o.kx=e.face*(e.weap.knock||300); o.vy=-160; kill(o,e); }
    });
  }
  const active=()=>ents.filter(e=>!e.dead);
  const living=active;
  // ---- MARCADORES por modo ----
  const topSkulls=()=>ents.reduce((m,e)=>Math.max(m,e.p.skulls||0),0);
  const teamKills=t=>ents.filter(e=>e.team===t).reduce((s,e)=>s+(e.p.kills||0),0);
  function computeResult(){
    if(GMID==='surv'){ const meS=ents.find(e=>!e.p.bot);
      result.wave=wave; result.kills=(meS&&meS.p.kills)||0; result.win=wave>=6; return; }
    if(GMID==='camp'){ const meC=ents.find(e=>!e.p.bot); const CG=GM.camp||{goal:'kills',n:3};
      result.kills=(meC&&meC.p.kills)||0; result.time=Math.round(time);
      if(result.win==null){ // se acabó el tiempo o caíste
        if(CG.goal==='time') result.win=!!(meC&&meC.p.hp>0);          // AGUANTA: sobrevivir el reloj = victoria
        else result.win=false;                                        // kills/boss sin cumplir = derrota
      }
      return; }
    const me=ents.find(e=>!e.p.bot);
    result.time=Math.round(time);
    if(GMID==='lms'){ const al=ents.filter(e=>e.p.hp>0); result.winner=(al[0]||ents[0]); result.win=!!(me&&me.p.hp>0); }
    else if(GMID==='hunt'){ const rk=ents.slice().sort((a,b)=>(b.p.skulls||0)-(a.p.skulls||0));
      result.winner=rk[0]; result.ranking=rk.slice(0,4).map(e=>({name:e.p.name,skulls:e.p.skulls||0})); result.win=!!(me&&rk[0]&&rk[0].p===me.p); }
    else if(GMID==='tdm'){ const a=teamKills(0),b=teamKills(1); result.t0=a; result.t1=b; result.winTeam=(a>=b?0:1); result.win=!!(me&&me.team===result.winTeam); }
    else if(GMID==='quest'){ result.win=questDone; result.wave=Math.min(wave,GM.waves||3); result.kills=me?(me.p.kills||0):0; }
    else if(GMID==='trials'){ result.score=me?(me.p.score||0):0; result.win=result.score>=(GM.goal||20); }
    else if(GMID==='ctf'){ const a=caps[0], b=caps[1];
      result.c0=a; result.c1=b;
      result.winTeam = (a===b) ? (teamKills(0)>=teamKills(1)?0:1) : (a>b?0:1);   // empate: derribos del equipo
      result.win=!!(me&&me.team===result.winTeam); }
  }

  // DODGE estilo TowerFall: dash con invencibilidad en 8 direcciones; atrapa flechas al esquivar
  const DODGE_DUR=0.26, DODGE_CD=0.6, DODGE_SPD=440;
  function startDodge(e,dx,dy){
    if(e.dodgeT>0||e.dodgeCd>0||e.dead) return;
    const n=Math.hypot(dx,dy)||1; e.ddx=dx/n; e.ddy=dy/n;
    e.dodgeT=DODGE_DUR; e.dodgeCd=DODGE_CD; e.inv=Math.max(e.inv,DODGE_DUR+0.02);
    if(dx) e.face=dx<0?-1:1;
    SFX.jump(); parts.spawn(e.x,e.y-e.h*0.5,'#f2ede2',9,200);
  }
  // explosión de la flecha BOMBA
  function boom(x,y,by){
    K.shake(13); SFX.ko(); parts.spawn(x,y,'#ff8a3d',30,340); parts.spawn(x,y,'#ffd34d',18,220);
    living().forEach(o=>{ if(o.dead||o.inv>0||o.dodgeT>0) return;
      const d=Math.hypot(o.x-x,(o.y-o.h*0.5)-y); if(d<74){ o.kx=(Math.sign(o.x-x)||1)*420; o.vy=-260; kill(o,by,{vx:o.kx,vy:-260}); } });
  }

  // ---- ULTIMATES (tecla R): cada animal tiene la SUYA según su PODER ----
  const ULTCD={lifesteal:11,berserk:12,triple:10,shield:10,heal:12,dash:9,slippery:11,doublejump:10};
  function ultReady(e){ return !e.dead && !!ULTCD[e.pow] && (e.ultCd||0)<=0; }
  function pulseKO(x,y,rad,by){ K.shake(11); parts.spawn(x,y,'#ff8a3d',26,320); parts.spawn(x,y,'#ffd34d',14,200);
    living().forEach(o=>{ if(o===by||o.dead||o.inv>0||o.dodgeT>0) return;
      if(Math.hypot(o.x-x,(o.y-o.h*0.5)-y)<rad){ o.kx=(Math.sign(o.x-x)||1)*400; o.vy=-250; kill(o,by,{vx:o.kx,vy:-250}); } }); }
  function shove(e,f){ K.shake(6); parts.spawn(e.x,e.y-e.h/2,'#9ce8ff',20,240);
    living().forEach(o=>{ if(o===e||o.dead) return; const dx=o.x-e.x, d=Math.hypot(dx,(o.y-o.h/2)-(e.y-e.h/2));
      if(d<130){ o.kx=(Math.sign(dx)||1)*f; o.vy=-190; } }); }
  function ultVolley(e){ const face=e.face;
    [-0.55,-0.37,-0.19,0,0.19,0.37,0.55].forEach(a=>{ const cs=Math.cos(a),sn=Math.sin(a);
      arrows.push({x:e.x+face*20,y:e.y-e.h*0.55,vx:face*cs*760,vy:face*sn*760,owner:e,t:3,grace:0.08,tint:'#ffd34d',type:null,bounces:0}); });
    SFX.arrow(); }
  function useUlt(e){
    if(!ultReady(e)) return;
    const U=(DATA.POWERS&&DATA.POWERS[e.pow])||{}, col=U.color||'#ffd34d';
    e.ultCd=ULTCD[e.pow]; e.ultFlash=0.55;
    say(e.x,e.y-e.h-20,(U.ult||'ULT')+'!',col); parts.spawn(e.x,e.y-e.h*0.5,col,28,320); SFX.powerup();
    switch(e.pow){
      case 'lifesteal': pulseKO(e.x,e.y-e.h*0.4,66,e); break;   // onda letal (sin sumar ♥)
      case 'berserk':   e.rageT=4; e.inv=Math.max(e.inv,0.8); e.special={type:'bomba',count:5}; e.ammo=Math.max(e.ammo,5); break;
      case 'triple':    ultVolley(e); break;
      case 'shield':    e.shield=true; shove(e,150); break;
      case 'heal':      e.shield=true; e.inv=Math.max(e.inv,1.2); break;   // escudo protector (sin sumar ♥)
      case 'dash':      e.ddx=e.face; e.ddy=0; e.dodgeT=0.55; e.dodgeCd=0.7; e.blitzT=0.55; e.inv=Math.max(e.inv,0.6); e.vx=e.face*DODGE_SPD*1.7; break;
      case 'slippery':  e.phaseT=4; e.inv=Math.max(e.inv,0.4); break;
      case 'doublejump':e.vy=-JUMP*1.8; e.onG=false; e.skyfall=true; break;
    }
  }

  const jumpV=e=>JUMP*(e.boots?1.24:1)*(e.jumpMul||1);
  function physics(e,dt){
    if(e.dodgeT<=0) e.vy+=GRAV*(e.gravMul||1)*dt;   // sin gravedad durante el dash del dodge
    if(e.wings&&e.vy>300) e.vy=300; // planeo con alas
    e.vx=e.mvx+(e.kx||0);
    e.kx=(e.kx||0)*Math.pow(0.02,dt);   // el empuje de espada se disipa
    if(Math.abs(e.kx)<8) e.kx=0;
    const oy=e.y;
    e.x+=e.vx*dt; e.y+=e.vy*dt;
    wrapEnt(e);
    e.onG=false;
    PLATS.forEach(pl=>{
      const L=e.x-e.w/2,R=e.x+e.w/2,T=e.y-e.h,B=e.y;
      if(R<pl.x||L>pl.x+pl.w||B<pl.y||T>pl.y+pl.h) return;
      if(pl.solid&&pl.wall){
        const px1=pl.x+pl.w-L, px2=R-pl.x, py1=pl.y+pl.h-T, py2=B-pl.y;
        const m=Math.min(px1,px2,py1,py2);
        if(m===px1)e.x=pl.x+pl.w+e.w/2;
        else if(m===px2)e.x=pl.x-e.w/2;
        else if(m===py1){e.y=pl.y+pl.h+e.h;e.vy=Math.max(0,e.vy);}
        else {e.y=pl.y;e.vy=0;e.onG=true;}
      } else {
        if(e.vy>=0 && oy<=pl.y+2 && e.dropT<=0){ e.y=pl.y; e.vy=0; e.onG=true; }   // dropT>0 = te sueltas
      }
    });
    if(e.onG) e.jumps=(e.wings||e.dj)?2:1;
    if(!WRAPY&&e.y>H+60) kill(e,null);
  }
  function heartPhysics(h,dt){
    h.t+=dt;
    if(!h.onG){
      h.vy+=900*dt;
      h.x+=h.vx*dt; h.y+=h.vy*dt;
      if(h.x<20){h.x=20;h.vx*=-0.5;} if(h.x>W-20){h.x=W-20;h.vx*=-0.5;}
      for(const pl of PLATS){
        if(h.vy>0&&h.x>pl.x&&h.x<pl.x+pl.w&&h.y>pl.y&&h.y<pl.y+pl.h+10){
          h.y=pl.y;
          if(Math.abs(h.vy)>140){ h.vy*=-0.4; h.vx*=0.6; }
          else { h.vy=0; h.onG=true; }
          break;
        }
      }
      if(WRAP){ if(h.x<-8)h.x+=W+16; else if(h.x>W+8)h.x-=W+16; }
      if(h.y>H+20){ if(WRAPY){h.y-=H+40;} else {h.y=30;h.vy=100;h.x=100+Math.random()*(W-200);} }
    }
  }

  function botThink(e){
    const foes=living().filter(o=>o!==e && o.phaseT<=0 && (!TEAMS || o.team!==e.team));   // FANTASMA no; ni tu equipo
    // ULTIMATE del bot: si hay rival cerca (o está en peligro), suelta su R
    if(ultReady(e)){
      const near=foes.reduce((m,o)=>Math.min(m,Math.abs(o.x-e.x)),1e9);
      if((near<210||e.p.hp<=1)&&Math.random()<0.05) useUlt(e);
    }
    // corazón cercano: prioridad de botín
    let heartT=null,hd=260;
    hearts.forEach(h=>{ const d=Math.abs(h.x-e.x)+Math.abs(h.y-(e.y-20))*0.6; if(d<hd){hd=d;heartT=h;} });
    chests.forEach(ch=>{ const d=Math.abs(ch.x-e.x)+Math.abs(ch.y-(e.y-20))*0.6; if(d<hd+60){hd=d;heartT=ch;} });
    if(e.weap.kind==='bow'&&e.ammo===0){ // sin munición: prioridad total a recuperar flechas
      let sd=1e9,st=null;
      stuck.forEach(sa=>{ const d=Math.abs(sa.x-e.x)+Math.abs(sa.y-(e.y-20))*0.6; if(d<sd){sd=d;st=sa;} });
      if(st){ hd=0; heartT=st; }
    }
    const tg=foes.length?foes.reduce((a,b)=>Math.abs(a.x-e.x)<Math.abs(b.x-e.x)?a:b):null;
    const inc=arrows.find(a=>a.owner!==e&&Math.hypot(a.x-e.x,a.y-(e.y-e.h/2))<130&&Math.sign(a.vx)===Math.sign(e.x-a.x));
    if(inc){
      if(e.dodgeCd<=0 && Math.random()<0.5){        // DODGE del bot (a veces atrapa la flecha)
        const tx=Math.sign(inc.x-e.x)||e.face;
        if(Math.random()<0.5) startDodge(e, tx, Math.random()<0.4?-1:0);   // hacia la flecha = atrapar
        else startDodge(e, (Math.random()<0.5?-tx:tx), -1);                // esquiva vertical
      } else if(e.onG){ const r=Math.random(); if(r<0.45) e.wantJump=true; else if(r<0.8) e.crouchT=0.35; }
    }
    const hunter=((GMID==='surv'||GMID==='camp')&&e.enemy);  // DEPREDADOR: caza al jugador SIN miedo, no huye ni saquea
    // 🚩 CTF: prioridad de bandera — llévala a casa / persigue al ladrón / regresa la tuya / ve por la enemiga
    let ctfGoal=null;
    if(GMID==='ctf'&&flags.length===2){
      const my=flags[e.team], en=flags[1-e.team];
      if(en.carrier===e) ctfGoal={x:my.hx,y:my.hy,h:20};
      else if(my.carrier) ctfGoal={x:my.carrier.x,y:my.carrier.y,h:42};
      else if((my.x!==my.hx||my.y!==my.hy)&&Math.random()<0.8) ctfGoal={x:my.x,y:my.y,h:20};
      else if(!en.carrier&&Math.random()<0.75) ctfGoal={x:en.x,y:en.y,h:20};
    }
    const scared=!hunter&&!ctfGoal&&e.p.hp<=1; // último corazón: sobrevive y saquea
    if(scared&&tg&&Math.abs(tg.x-e.x)<150&&!heartT){ e.mvx=-Math.sign(tg.x-e.x)*espd(e); e.face=tg.x<e.x?-1:1; return; }
    const goHeart = !ctfGoal&&heartT&&(hunter ? (e.weap.kind==='bow'&&e.ammo===0) : (scared||(e.weap.kind==='bow'&&Math.random()<0.65)||!tg));
    const target = ctfGoal || (goHeart ? {x:heartT.x,y:heartT.y-10,h:20} : tg);
    if(!target){ e.mvx=0; return; }
    const dx=target.x-e.x, dy=(target.y-(target.h||42)/2)-(e.y-e.h/2);
    if(Math.abs(dx)>40) e.mvx=Math.sign(dx)*espd(e)*(hunter?1:0.85);
    else if(Math.random()<0.35) e.mvx=(Math.random()<0.5?-1:1)*espd(e)*0.6;
    else e.mvx=0;
    if(dy<-60&&e.onG&&Math.random()<0.6) e.wantJump=true;
    if(dy<-60&&!e.onG&&e.vy>80&&e.jumps>0&&Math.random()<0.5) e.wantJump=true;
    if(Math.random()<0.08&&e.onG) e.wantJump=true;
    e.face=dx<0?-1:1;
    if(tg&&e.ammo>0&&e.cd<=0&&Math.random()<0.3){
      const fdx=tg.x-e.x, fdy=(tg.y-tg.h/2)-(e.y-e.h/2);
      if(Math.abs(fdy)<38) e.wantShootDir=[Math.sign(fdx)||1,(Math.random()-.5)*0.4];
      else if(Math.abs(fdx)<38) e.wantShootDir=[(Math.random()-.5)*0.4,Math.sign(fdy)||1];
    }
  }

  let last=performance.now();
  function frame(now){
    const dt=Math.max(0,Math.min(0.03,(now-last)/1000)); last=now; time+=dt;
    const me=ents.find(e=>!e.p.bot);

    if(!over){
      // aplica un paquete de controles a un ent (sirve para el humano local Y para amigos ONLINE)
      const applyInput=(e,IN)=>{
        const msp=espd(e);
        e.mvx=0;
        if(IN.l){e.mvx=-msp;e.face=-1;}
        if(IN.r){e.mvx=msp;e.face=1;}
        const dn=!!IN.d;
        e.crouch = dn && e.onG;
        if(e.crouch) e.mvx*=0.25;
        if(IN.jump){
          if(dn && e.onG){ e.dropT=0.16; e.onG=false; e.vy=60; }   // ABAJO+SALTO: soltarse por la plataforma
          else if(e.onG||e.jumps>0){ if(!e.onG)e.jumps--; e.vy=jumpV(e); SFX.jump(); }
        }
        if(IN.dodge){
          let dx=(IN.r?1:0)-(IN.l?1:0), dy=(dn?1:0)-(IN.u?1:0);
          if(dx===0&&dy===0) dx=e.face;
          startDodge(e,dx,dy);
        }
        if(IN.shoot){
          if(e.weap.kind==='sword') melee(e);
          else {
            let ax=(IN.r?1:0)-(IN.l?1:0), ay=(dn?1:0)-(IN.u?1:0);   // PUNTERÍA 8 DIRECCIONES
            if(ax===0&&ay===0) ax=e.face;
            shoot(e, ax, ay);
          }
        }
        if(IN.ult) useUlt(e);
      };
      if(me&&!me.dead){
        applyInput(me,{
          l:K.keys.has('ArrowLeft')||K.keys.has('KeyA'),
          r:K.keys.has('ArrowRight')||K.keys.has('KeyD'),
          u:K.keys.has('ArrowUp')||K.keys.has('KeyW'),
          d:K.keys.has('ArrowDown')||K.keys.has('KeyS'),
          jump:K.tap('Space')||K.tap('KeyZ')||K.tap('KeyK'),
          dodge:K.tap('KeyC')||K.tap('ShiftLeft')||K.tap('ShiftRight')||K.tap('KeyL'),
          shoot:K.tap('KeyX')||K.tap('KeyJ'),
          ult:K.tap('KeyR')
        });
      }
      // AMIGOS ONLINE: cada ent remoto aplica los controles que llegaron por la red
      ents.forEach(e=>{
        if(e.dead||!e.p.remote||!e.p.net) return;
        const n=e.p.net;
        applyInput(e,{ l:n.l, r:n.r, u:n.u, d:n.d,
          jump:n.jump>0&&(n.jump--,true), dodge:n.dodge>0&&(n.dodge--,true),
          shoot:n.shoot>0&&(n.shoot--,true), ult:n.ult>0&&(n.ult--,true) });
      });
      ents.forEach(e=>{
        if(e.dead||!e.p.bot) return;
        e.think-=dt;
        if(e.think<=0){ e.think=0.18+Math.random()*0.12; botThink(e); }
        if(e.wantJump){ e.wantJump=false;
          if(e.onG||e.jumps>0){ if(!e.onG)e.jumps--; e.vy=jumpV(e); } }
        if(e.weap.kind==='sword'){
          if(e.cd<=0){
            const foe=living().find(o=>o!==e && Math.sign(o.x-e.x)===e.face && Math.hypot(o.x-e.x,(o.y-o.h/2)-(e.y-e.h/2))<(e.weap.range+8));
            if(foe) melee(e);
          }
        } else if(e.wantShootDir){ shoot(e,e.wantShootDir[0],e.wantShootDir[1]); e.wantShootDir=null; }
      });
      ents.forEach(e=>{
        if(e.dead){ if(e.respawnT>0){ e.respawnT-=dt; if(e.respawnT<=0) respawnEnt(e); } return; }
        e.inv=Math.max(0,e.inv-dt); e.cd=Math.max(0,e.cd-dt);
        e.swing=Math.max(0,e.swing-dt); e.drawT=Math.max(0,e.drawT-dt);
        e.crouchT=Math.max(0,e.crouchT-dt); e.dodgeCd=Math.max(0,e.dodgeCd-dt); e.dropT=Math.max(0,e.dropT-dt);
        e.ultCd=Math.max(0,(e.ultCd||0)-dt); e.rageT=Math.max(0,(e.rageT||0)-dt);
        e.phaseT=Math.max(0,(e.phaseT||0)-dt); e.ultFlash=Math.max(0,(e.ultFlash||0)-dt);
        if(e.blitzT>0){ e.blitzT-=dt;   // EMBESTIDA: mata a quien toques durante el dash invencible
          living().forEach(o=>{ if(o===e||o.dead||o.inv>0||o.dodgeT>0) return;
            if(Math.abs(o.x-e.x)<e.w/2+o.w/2+8 && Math.abs((o.y-o.h/2)-(e.y-e.h/2))<Math.max(e.h,o.h)*0.65){
              o.kx=e.face*420; o.vy=-220; kill(o,e,{vx:o.kx,vy:-220}); } }); }
        if(e.dodgeT>0){ e.dodgeT-=dt; e.mvx=e.ddx*DODGE_SPD; e.vy=e.ddy*DODGE_SPD; e.crouch=false; } // dash del dodge
        // (sin regeneración: nadie suma corazones, máximo 3)
        // recuperar flechas clavadas (como en TowerFall)
        for(let i=stuck.length-1;i>=0;i--){
          const sa=stuck[i];
          if(e.ammo<MAXA&&Math.abs(sa.x-e.x)<22&&sa.y>e.y-e.h-10&&sa.y<e.y+12){
            stuck.splice(i,1); e.ammo++; SFX.click();
            parts.spawn(sa.x,sa.y,'#ffd34d',4,80);
          }
        }
        if(e.p.bot) e.crouch=e.crouchT>0&&e.onG;
        if(e.crouch&&e.p.bot) e.mvx*=0.25;
        const wasG=e.onG;
        physics(e,dt);
        e.landT=Math.max(0,e.landT-dt);
        if(e.onG&&!wasG){ e.landT=0.14; parts.spawn(e.x,e.y,'#c9c2b8',5,90); }
        if(e.skyfall&&e.onG){ e.skyfall=false; pulseKO(e.x,e.y,76,e); K.shake(14); }  // METEORO: pisotón al aterrizar
        if(e.onG&&Math.abs(e.vx)>30){
          e.runPh+=dt*12;
          if(Math.random()<dt*5) parts.spawn(e.x-e.face*10,e.y-2,'#a89e90',1,45);
        }
        // abrir cofres
        for(let i=chests.length-1;i>=0;i--){
          const ch=chests[i];
          if(Math.abs(ch.x-e.x)<26&&ch.y>e.y-e.h-14&&ch.y<e.y+12){ openChest(ch,e); }
        }
        // (sin corazones en el piso para recoger: nadie suma)
      });
      // stomps
      ents.forEach(a=>{ if(a.dead)return;
        ents.forEach(b=>{
          if(a===b||b.dead) return;
          const bh=b.crouch?b.h*0.62:b.h;
          if(a.vy>180 && Math.abs(a.x-b.x)<26 && a.y>b.y-bh-6 && a.y<b.y-bh+18){
            kill(b,a); a.vy=JUMP*0.7;
          }
        });
      });
      for(let i=arrows.length-1;i>=0;i--){
        const a=arrows[i];
        a.t-=dt; a.grace-=dt;
        a.vy+=(Math.abs(a.vx)>Math.abs(a.vy)?260:0)*dt;
        a.x+=a.vx*dt; a.y+=a.vy*dt;
        if(WRAP){ if(a.x<-8)a.x+=W+16; else if(a.x>W+8)a.x-=W+16;
          if(WRAPY){ if(a.y>H+8)a.y-=H+16; else if(a.y<-8)a.y+=H+16; } }
        let dead=a.t<=0||(!WRAP&&(a.x<10||a.x>W-10))||(!WRAPY&&a.y<6);
        let stuckNow=false;
        if(!dead) for(const pl of PLATS){
          if(a.x>pl.x&&a.x<pl.x+pl.w&&a.y>pl.y&&a.y<pl.y+pl.h){
            if(a.type==='laser'&&a.bounces>0){ // LÁSER: rebota en las plataformas
              a.bounces--;
              if(Math.abs(a.vy)>=Math.abs(a.vx)){ a.vy=-a.vy; a.y=a.vy<0?pl.y-3:pl.y+pl.h+3; }
              else { a.vx=-a.vx; a.x=a.vx<0?pl.x-3:pl.x+pl.w+3; }
              parts.spawn(a.x,a.y,a.tint,5,150);
            } else { dead=true; stuckNow=true; }
            break;
          }
        }
        if(!dead) for(const e of ents){
          if(e.dead) continue;
          if(e===a.owner&&a.grace>0) continue;
          const eh=e.crouch?e.h*0.62:e.h;
          if(Math.abs(a.x-e.x)<e.w/2+4 && a.y>e.y-eh-4 && a.y<e.y+4){
            const dodging=e.dodgeT>0;
            if((dodging||e.crouch)&&e.ammo<MAXA){ // ¡ATRAPAR flecha! (esquivando o agachado)
              e.ammo++; say(e.x,e.y-e.h-16,'¡ATRAPADA!','#ffd34d');
              SFX.powerup(); parts.spawn(a.x,a.y,'#ffd34d',10,160); dead=true; break;
            } else if(dodging||e.inv>0){ // invencible: la flecha rebota, no mata
              say(e.x,e.y-e.h-16,'¡ESQUIVE!','#9ce8ff'); parts.spawn(a.x,a.y,'#9ce8ff',6,140); dead=true; break;
            } else if(a.type==='laser'){   // el LÁSER ATRAVIESA (mata y sigue)
              kill(e,a.owner,{vx:a.vx,vy:a.vy}); parts.spawn(a.x,a.y,a.tint,6,150);   // sin dead: sigue de largo
            } else {
              kill(e,a.owner,{vx:a.vx,vy:a.vy});   // se cae con la comba de la flecha
              dead=true; break;
            }
          }
        }
        if(dead){
          if(a.type==='bomba') boom(a.x,a.y,a.owner);                 // BOMBA: explota
          else if(a.type==='bramble') brambles.push({x:a.x,y:a.y,t:4}); // ESPINA: deja púas
          else if(stuckNow&&a.owner) stickArrow(a.x,a.y,Math.atan2(a.vy,a.vx));
          else parts.spawn(a.x,a.y,a.tint||'#ffd34d',5,120);
          arrows.splice(i,1);
        }
      }
      // ESPINAS (bramble): matan a quien las toca durante unos segundos
      for(let i=brambles.length-1;i>=0;i--){ const b=brambles[i]; b.t-=dt;
        if(b.t<=0){ brambles.splice(i,1); continue; }
        living().forEach(o=>{ if(o.dead||o.inv>0||o.dodgeT>0) return;
          if(Math.abs(o.x-b.x)<20 && Math.abs((o.y-6)-b.y)<26){ kill(o,null); } });
      }
      hearts.forEach(h=>heartPhysics(h,dt));
      // cuerpos: vuelan con la inercia de la flecha, aterrizan y se acuestan
      for(let i=corpses.length-1;i>=0;i--){ const c=corpses[i]; c.t-=dt;
        if(c.t<=0){ corpses.splice(i,1); continue; }
        if(!c.land){
          c.vy+=GRAV*dt; c.x+=c.vx*dt; c.y+=c.vy*dt; c.vx*=Math.pow(0.06,dt); c.rot+=c.spin*dt;
          if(WRAP){ if(c.x<-12)c.x+=W+24; else if(c.x>W+12)c.x-=W+24; }
          for(const pl of PLATS){ if(c.vy>0&&c.x>pl.x&&c.x<pl.x+pl.w&&c.y>=pl.y-2&&c.y<pl.y+26){ c.y=pl.y; c.land=true; break; } }
          if(c.y>H-6){ c.y=H-6; c.land=true; }
          if(c.land) parts.spawn(c.x,c.y,'#c9c2b8',6,90);
        } else { const tgt=(c.spin>=0?1:-1)*Math.PI/2; c.rot+=(tgt-c.rot)*Math.min(1,dt*12); }
      }
      chestT-=dt; if(chestT<=0){ chestT=9; spawnChest(); }
      // HEADHUNTERS: las calaveras caen y cualquiera las recoge
      for(let i=skulls.length-1;i>=0;i--){ const s=skulls[i];
        if(!s.onG){ s.vy+=GRAV*dt; s.x+=s.vx*dt; s.y+=s.vy*dt; s.vx*=Math.pow(0.1,dt);
          for(const pl of PLATS){ if(s.vy>0&&s.x>pl.x&&s.x<pl.x+pl.w&&s.y>=pl.y-2&&s.y<pl.y+22){ s.y=pl.y-8; s.onG=true; break; } }
          if(s.y>H-14){ s.y=H-14; s.onG=true; } }
        s.t+=dt; if(s.t>14){ skulls.splice(i,1); continue; }
        for(const e of ents){ if(e.dead) continue;
          if(Math.abs(s.x-e.x)<26 && Math.abs((e.y-e.h*0.5)-s.y)<34){ e.p.skulls=(e.p.skulls||0)+1; SFX.coin();
            parts.spawn(s.x,s.y,'#c77dff',10,170); say(e.x,e.y-e.h-12,'+1 💀','#c77dff'); skulls.splice(i,1); break; } }
      }
      // TRIALS: aparecen blancos flotantes; al flecharlos suman puntos
      if(GMID==='trials'){ targetT-=dt;
        if(targetT<=0 && targets.length<4){ targetT=0.7; targets.push({x:60+Math.random()*(W-120), y:70+Math.random()*(H-280), r:20, vy:(Math.random()<.5?1:-1)*(30+Math.random()*45)}); }
        for(const tg of targets){ tg.y+=tg.vy*dt; if(tg.y<55||tg.y>H-150) tg.vy*=-1; }
        for(let ai=arrows.length-1;ai>=0;ai--){ const a=arrows[ai]; let hit=false;
          for(let ti=targets.length-1;ti>=0;ti--){ const tg=targets[ti];
            if(Math.hypot(a.x-tg.x,a.y-tg.y)<tg.r+6){ targets.splice(ti,1); const me=ents[0]; if(me)me.p.score=(me.p.score||0)+1; SFX.coin(); parts.spawn(tg.x,tg.y,'#ff9e3c',16,240); hit=true; break; } }
          if(hit) arrows.splice(ai,1);
        }
      }
      // QUEST: la oleada avanza con las kills del equipo; ganas al llegar a la meta
      if(GMID==='quest'){ const g=GM.questGoal||18, ws=GM.waves||3, k=teamKills(0);
        wave=Math.min(ws, Math.floor(k/(g/ws))+1); if(k>=g) questDone=true; }
      // MUERTE SÚBITA (solo LMS): al final del tiempo llueven flechas
      if(GMID==='lms' && time>DUR-15){
        sudden-=dt;
        if(sudden<=0){ sudden=1.6; const l=living(); const tg=l[Math.floor(Math.random()*l.length)];
          if(tg) arrows.push({x:tg.x+(Math.random()-.5)*60,y:24,vx:0,vy:520,owner:null,t:4,grace:0}); }
      }
      // 🚩 CTF: recoger / robar / regresar / CAPTURAR
      if(GMID==='ctf'&&flags.length){
        flags.forEach(f=>{
          if(f.carrier){
            if(f.carrier.dead){ f.carrier=null; f.y=Math.min(f.y,H-60); }        // el portador cayó: la bandera queda ahí
            else { f.x=f.carrier.x; f.y=f.carrier.y-f.carrier.h-8; }
          }
        });
        for(const e of living()){
          const en=flags[1-e.team], my=flags[e.team];
          if(!en||!my) break;
          const dEn=Math.hypot(e.x-en.x,(e.y-e.h/2)-en.y);
          const dMy=Math.hypot(e.x-my.x,(e.y-e.h/2)-my.y);
          if(!en.carrier && dEn<36){ en.carrier=e; SFX.coin(); parts.spawn(en.x,en.y,e.team===0?'#4d9fff':'#ff5a4d',16,240); }
          if(!my.carrier && (my.x!==my.hx||my.y!==my.hy) && dMy<36){ my.x=my.hx; my.y=my.hy; SFX.phase(); parts.spawn(my.hx,my.hy,'#ffffff',12,200); }
          if(en.carrier===e){
            const dHome=Math.hypot(e.x-my.hx,(e.y-e.h/2)-my.hy);
            const myHome=(!my.carrier && my.x===my.hx && my.y===my.hy);           // solo capturas con TU bandera en casa
            if(dHome<48 && myHome){
              caps[e.team]++; e.p.score=(e.p.score||0)+1;
              en.carrier=null; en.x=en.hx; en.y=en.hy;
              SFX.win&&SFX.win(); K.shake(9); parts.spawn(my.hx,my.hy,'#ffd34d',30,320);
              say(my.hx,my.hy-40,'¡CAPTURA!');
              hudRefresh();
            }
          }
        }
      }
      // FIN según el MODO
      let endNow=false;
      if(GMID==='lms'){
        if(cfg.minAlive){ if(ents.filter(e=>!e.dead).length<=cfg.minAlive) endNow=true; }  // TORNEO: cae el 1º → fin de ronda
        else if(ents.filter(e=>e.p.hp>0).length<=1) endNow=true;                            // LMS suelto: último con vidas
      }
      else if(GMID==='hunt'){ if(topSkulls()>=(GM.goal||10)) endNow=true; }
      else if(GMID==='tdm'){ if(teamKills(0)>=(GM.goal||15)||teamKills(1)>=(GM.goal||15)) endNow=true; }
      else if(GMID==='quest'){ if(questDone||questLost) endNow=true; }
      else if(GMID==='surv'){
        // OLEADA superada → los depredadores REGRESAN más rápidos y la cuenta sube
        const en=ents.filter(e=>e.enemy);
        if(en.length&&en.every(e=>e.dead)){
          wave++; SFX.phase();
          en.forEach(e=>{ e.p.hp=1; e.spd*=1.08; respawnEnt(e); });
        }
        const meS=ents.find(e=>!e.p.bot);
        if(!meS || (meS.dead&&meS.p.hp<=0)) endNow=true;   // caíste: fin de la supervivencia
      }
      else if(GMID==='camp'){
        // CAMPAÑA: objetivo por nivel — kills (derrota N) · time (aguanta) · boss (véncelo)
        const CG=GM.camp||{goal:'kills',n:3};
        const en=ents.filter(e=>e.enemy);
        const meC2=ents.find(e=>!e.p.bot);
        const kC=meC2?(meC2.p.kills||0):0;
        if(CG.goal==='boss'){
          if(en.length&&en.every(e=>e.dead&&e.p.hp<=0)){ result.win=true; endNow=true; }
        } else {
          // los enemigos vuelven en oleadas (un poco más rápidos) hasta cumplir el objetivo
          if(en.length&&en.every(e=>e.dead&&e.p.hp<=0)){ wave++; SFX.phase(); en.forEach(e=>{ e.p.hp=1; e.spd*=1.05; respawnEnt(e); }); }
          if(CG.goal==='kills'&&kC>=CG.n){ result.win=true; endNow=true; }
        }
        if(!meC2 || (meC2.dead&&meC2.p.hp<=0)) endNow=true;   // te cazaron
      }
      else if(GMID==='trials'){ if((ents[0]&&(ents[0].p.score||0)>=(GM.goal||20))) endNow=true; }
      else if(GMID==='ctf'){ if(caps[0]>=(GM.goal||2)||caps[1]>=(GM.goal||2)) endNow=true; }
      if(time>DUR) endNow=true;
      if(endNow){ over=true; endTimer=1.1; }
    } else {
      endTimer-=dt;
      if(endTimer<=0){ cancelAnimationFrame(raf); computeResult(); onEnd(result); return; }
    }

    // CÁMARA: sigue a tu monito (o al líder vivo si caíste), con suavizado, en ambos ejes
    { const meC=ents.find(e=>!e.p.bot&&!e.dead) || living()[0] || ents[0];
      if(meC){ const tx=Math.max(0, Math.min(W-VW, meC.x-VW/2));
        const ty=Math.max(0, Math.min(H-VH, meC.y-VH/2));
        camX += (tx-camX)*Math.min(1, dt*5);
        camY += (ty-camY)*Math.min(1, dt*5); } }
    // ONLINE (host): manda el estado del mundo a los amigos ~15 veces/seg
    if(cfg.net&&cfg.net.emit){
      cfg.net._t=(cfg.net._t||0)-dt;
      if(cfg.net._t<=0){ cfg.net._t=0.066;
        cfg.net.emit({t:'snap', gt:Math.round((DUR-time)*10)/10,
          e:ents.map(x=>[Math.round(x.x),Math.round(x.y),x.face,x.dead?1:0,x.p.hp|0,Math.abs(x.mvx)>10?1:0]),
          a:arrows.map(a=>[Math.round(a.x),Math.round(a.y),Math.round(Math.atan2(a.vy,a.vx)*100)/100]),
          c:chests.map(ch=>[Math.round(ch.x),Math.round(ch.y)]) });
      }
    }
    parts.update(dt);
    draw();
    raf=requestAnimationFrame(frame);
  }

  function draw(){
    ctx.save(); K.applyShake(ctx);
    const bd=BACKDROPS[eco||'selva'];
    if(bd){   // fondo atmosférico en la VISTA (parallax suave contra el mundo, ambos ejes)
      const s=Math.max(VW/bd.width,VH/bd.height)*1.14, bw=bd.width*s, bh=bd.height*s;
      const px=(W>VW)?(camX/(W-VW)):(0.5), py=(H>VH)?(camY/(H-VH)):(0.5);
      ctx.drawImage(bd,(VW-bw)*px,(VH-bh)*py,bw,bh);
      ctx.fillStyle='rgba(6,8,16,.18)'; ctx.fillRect(0,0,VW,VH); // apenas oscurece: deja lucir el arte pixel
    }
    ctx.save(); ctx.translate(-camX,-camY);                      // ===== MUNDO (con cámara) =====
    // CORNUCOPIA: faro dorado al centro del mundo (ahí está el botín, como Hunger Games)
    { const pu=0.5+0.5*Math.sin(time*2);
      const gl=ctx.createLinearGradient(0,0,0,H);
      gl.addColorStop(0,'rgba(255,211,77,0)'); gl.addColorStop(.45,'rgba(255,211,77,'+(0.05+0.07*pu)+')'); gl.addColorStop(.55,'rgba(255,211,77,'+(0.05+0.07*pu)+')'); gl.addColorStop(1,'rgba(255,211,77,0)');
      ctx.fillStyle=gl; ctx.fillRect(W/2-46,0,92,H); }
    if(!bd) tf.bg(ctx,time);
    tf.blocks(ctx,time);
    // 🚩 CTF: bases (anillo del equipo) + banderas ondeando (la cargada va sobre la cabeza)
    if(GMID==='ctf') flags.forEach(f=>{
      const col=f.team===0?'#4d9fff':'#ff5a4d';
      const pu=0.5+0.5*Math.sin(time*3+f.team*2);
      ctx.save();
      ctx.strokeStyle=col; ctx.globalAlpha=0.35+0.25*pu; ctx.lineWidth=3;
      ctx.beginPath(); ctx.arc(f.hx,f.hy+4,24,0,7); ctx.stroke();               // la BASE siempre marcada
      ctx.globalAlpha=1;
      const fx=f.x, fy=f.y;                                                     // asta + bandera (donde esté)
      ctx.fillStyle='#d8cdb4'; ctx.fillRect(fx-2,fy-40,4,40);
      const wav=Math.sin(time*5+f.team)*4;
      ctx.fillStyle=col;
      ctx.beginPath(); ctx.moveTo(fx+2,fy-40); ctx.lineTo(fx+30,fy-33+wav); ctx.lineTo(fx+2,fy-24); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.35)'; ctx.fillRect(fx+2,fy-40,10,3);
      ctx.restore();
    });
    // cofres del tesoro (estilo TowerFall)
    chests.forEach(ch=>{
      ch.t+=0.016;
      const gl=0.5+0.5*Math.sin(ch.t*3);
      M.shadow(ctx,ch.x,ch.y+2,14);
      ctx.fillStyle='#8a5a1a'; ctx.fillRect(ch.x-13,ch.y-18,26,18);
      ctx.fillStyle='#ffd34d'; ctx.fillRect(ch.x-13,ch.y-18,26,7);
      ctx.fillStyle='#c9952a'; ctx.fillRect(ch.x-13,ch.y-11,26,2);
      ctx.fillStyle='#5a3a10'; ctx.fillRect(ch.x-2,ch.y-12,5,6);
      ctx.fillStyle=`rgba(255,240,150,${0.5*gl})`; ctx.fillRect(ch.x-13,ch.y-18,26,3);
      if(gl>0.85){ ctx.fillStyle='#fff'; ctx.fillRect(ch.x+6,ch.y-22,3,3); }
    });
    // flechas clavadas (recógelas para recargar)
    stuck.forEach(sa=>{
      ctx.save(); ctx.translate(sa.x,sa.y); ctx.rotate(sa.ang);
      ctx.strokeStyle='#c9b890'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(-12,0); ctx.lineTo(6,0); ctx.stroke();
      ctx.fillStyle='#ffd34d';
      ctx.beginPath(); ctx.moveTo(11,0); ctx.lineTo(4,-4); ctx.lineTo(4,4); ctx.fill();
      ctx.restore();
      const gl=0.4+0.3*Math.sin(time*4+sa.x);
      ctx.fillStyle=`rgba(255,211,77,${gl*0.4})`;
      ctx.beginPath(); ctx.arc(sa.x,sa.y,8,0,7); ctx.fill();
    });
    // ESPINAS (bramble): matorral de púas verdes que mata al tocar
    brambles.forEach(b=>{
      const fade=b.t<0.8?b.t/0.8:1;
      ctx.save(); ctx.globalAlpha=fade;
      for(let k=0;k<7;k++){ const a=-1.57+(k-3)*0.42, ln=12+((k*7)%7);
        ctx.strokeStyle='#4e7a26'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(b.x,b.y+5); ctx.lineTo(b.x+Math.cos(a)*ln,b.y+5+Math.sin(a)*ln); ctx.stroke();
        ctx.fillStyle='#8adf4a'; ctx.fillRect(b.x+Math.cos(a)*ln-1.5,b.y+5+Math.sin(a)*ln-1.5,3,3); }
      ctx.restore();
    });
    // corazones sueltos
    hearts.forEach(h=>M.drawHeart(ctx,h.x,h.y-8,1.1,time+h.t));
    // CALAVERAS (headhunters)
    skulls.forEach(s=>{ ctx.save(); ctx.translate(s.x,s.y+Math.sin(time*4+s.x)*2);
      ctx.font='22px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.shadowColor='#c77dff'; ctx.shadowBlur=10; ctx.fillText('💀',0,0); ctx.restore(); });
    ctx.textBaseline='alphabetic'; ctx.shadowBlur=0;
    // BLANCOS (trials)
    targets.forEach(tg=>{ ctx.save(); ctx.translate(tg.x,tg.y);
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(0,0,tg.r,0,7); ctx.fill();
      ctx.fillStyle='#ff5a4d'; ctx.beginPath(); ctx.arc(0,0,tg.r*0.66,0,7); ctx.fill();
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(0,0,tg.r*0.33,0,7); ctx.fill(); ctx.restore(); });
    // flechas
    arrows.forEach(a=>{
      const ang=Math.atan2(a.vy,a.vx);
      const col=a.tint||(a.owner?'#ffd34d':'#9ce8ff');
      ctx.save(); ctx.translate(a.x,a.y); ctx.rotate(ang);
      ctx.strokeStyle=a.owner?'#e8d9b0':'#9ce8ff'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(-14,0); ctx.lineTo(8,0); ctx.stroke();
      ctx.fillStyle=col;
      ctx.beginPath(); ctx.moveTo(14,0); ctx.lineTo(6,-4); ctx.lineTo(6,4); ctx.fill();
      ctx.restore();
    });
    // cuerpos caídos (animación de muerte: vuelan, se acuestan y se desvanecen)
    corpses.forEach(c=>{
      ctx.save(); ctx.globalAlpha=Math.min(1,c.t*2.2);
      if(c.land) M.shadow(ctx,c.x,c.y+2,14);
      ctx.translate(c.x,c.y-18); ctx.rotate(c.rot);
      Sprites.drawAnimal(ctx,c.a,0,18,56*(c.a.size||1),c.face<0,{air:!c.land,vy:c.land?0:180,t:0,spawn:0});
      ctx.restore(); ctx.globalAlpha=1;
    });
    // personajes
    ents.forEach(e=>{
      if(e.dead) return;
      if(e.onG) M.shadow(ctx,e.x,e.y+2,15);
      if(e.dodgeT>0){ // rastro/estela del esquive + aura de invencibilidad
        for(let k=1;k<=4;k++){ ctx.globalAlpha=0.14*(1-k/5);
          ctx.fillStyle=e.p.color; const tx=e.x-e.ddx*k*9, ty=e.y-e.h/2-e.ddy*k*9;
          ctx.beginPath(); ctx.ellipse(tx,ty,e.w*0.5,e.h*0.5,0,0,7); ctx.fill(); }
        ctx.globalAlpha=1;
        ctx.strokeStyle='rgba(210,244,255,.8)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(e.x,e.y-e.h/2,e.h*0.55,0,7); ctx.stroke();
      }
      const recoil=Math.max(0,(e.cd-0.2)/0.12);
      if(e.shield){
        ctx.fillStyle='rgba(156,232,255,.18)';
        ctx.beginPath(); ctx.arc(e.x,e.y-e.h/2,32,0,7); ctx.fill();
        ctx.strokeStyle='rgba(200,244,255,.7)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(e.x,e.y-e.h/2,32,0,7); ctx.stroke();
      }
      if(ultReady(e)){   // aura pulsante = ULTIMATE lista (color del poder del animal)
        const uc=((DATA.POWERS&&DATA.POWERS[e.pow])||{}).color||'#ffd34d';
        const pu=0.5+Math.sin(time*6)*0.5;
        ctx.save(); ctx.globalAlpha=0.28+pu*0.4; ctx.strokeStyle=uc; ctx.lineWidth=2.5;
        ctx.beginPath(); ctx.arc(e.x,e.y-e.h/2,e.h*0.62+pu*3,0,7); ctx.stroke(); ctx.restore();
      }
      if(e.rageT>0){ ctx.save(); ctx.globalAlpha=0.6; ctx.strokeStyle='#ff7a3c'; ctx.lineWidth=3;
        ctx.beginPath(); ctx.arc(e.x,e.y-e.h/2,e.h*0.58,0,7); ctx.stroke(); ctx.restore(); }
      if(e.ultFlash>0){ ctx.save(); const uf=((DATA.POWERS&&DATA.POWERS[e.pow])||{}).color||'#fff';
        ctx.globalAlpha=Math.min(1,e.ultFlash*1.6); ctx.strokeStyle=uf; ctx.lineWidth=4;
        ctx.beginPath(); ctx.arc(e.x,e.y-e.h/2,(0.55-e.ultFlash)*130+18,0,7); ctx.stroke(); ctx.restore(); }
      if(e.wings){ // alitas que aletean
        const fl=e.onG?0.2:Math.sin(time*18)*0.55;
        ctx.fillStyle='rgba(242,237,226,.9)';
        ctx.save(); ctx.translate(e.x,e.y-e.h*0.62);
        ctx.save(); ctx.rotate(-0.5-fl);
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-17,-7); ctx.lineTo(-13,3); ctx.fill(); ctx.restore();
        ctx.save(); ctx.rotate(0.5+fl); ctx.scale(-1,1);
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-17,-7); ctx.lineTo(-13,3); ctx.fill(); ctx.restore();
        ctx.restore();
      }
      if(e.boots&&e.onG){ ctx.fillStyle='rgba(157,255,138,.7)';
        ctx.fillRect(e.x-9,e.y-3,6,3); ctx.fillRect(e.x+3,e.y-3,6,3); }
      const _phase=e.phaseT>0; if(_phase) ctx.globalAlpha=0.4;   // FANTASMA: casi invisible
      Sprites.drawAnimal(ctx,e.p.animal,e.x,e.y,56*(e.sz||1),e.face<0,
        {moving:e.onG&&Math.abs(e.vx)>30, run:e.runPh, air:!e.onG, vy:e.vy,
         idle:e.onG&&Math.abs(e.vx)<=30, t:time+e.runPh,
         crouch:e.crouch, land:e.landT/0.14, atk:-recoil*0.6,
         draw:Math.min(1,(e.drawT||0)/0.16),           // ESFUERZO al disparar (jala/suelta)
         spawn:e.inv>0?e.inv/1.5:0});
      if(_phase) ctx.globalAlpha=1;
      // arma equipada en la mano
      if(window.WEAP && WEAP.ready(e.weap.id) && e.inv<0.9){
        const hy=e.y-e.h*0.5-(e.crouch?e.h*0.18:0);
        if(e.weap.kind==='bow'){
          const pull=e.drawT>0?e.drawT/0.16:0;               // retroceso al disparar
          WEAP.draw(ctx,e.weap.id, e.x+e.face*(12-pull*3), hy, 30, e.face<0, 0);
        } else {
          const sw=e.swing>0 ? 1-(e.swing/0.24) : 0;         // 0→1 progreso del tajo
          const rest=-0.5, ang=e.swing>0 ? (-1.3+sw*2.6) : rest;
          WEAP.draw(ctx,e.weap.id, e.x+e.face*(15+sw*6), hy-3, 36, e.face<0, e.face<0?-ang:ang);
        }
      }
      // (sin etiqueta ♥N sobre el jugador — la vida se ve en el HUD de arriba)
      const spc=(e.special&&e.special.count>0)?ARROW_TYPES[e.special.type].tint:null;   // flechas especiales = barritas de color
      for(let i=0;i<Math.min(6,e.ammo);i++){ ctx.fillStyle=(spc&&i<e.special.count)?spc:'#ffd34d'; ctx.fillRect(e.x-21+i*8,e.y-e.h-8,5,3); }
    });
    parts.draw(ctx);
    // textos flotantes de los cofres
    for(let i=floats.length-1;i>=0;i--){
      const f=floats[i]; f.t-=0.016; f.y-=0.7;
      if(f.t<=0){ floats.splice(i,1); continue; }
      ctx.globalAlpha=Math.min(1,f.t*2);
      ctx.fillStyle=f.col; ctx.font='bold 12px "Space Mono"'; ctx.textAlign='center';
      ctx.strokeStyle='rgba(0,0,0,.7)'; ctx.lineWidth=3;
      ctx.strokeText(f.txt,f.x,f.y); ctx.fillText(f.txt,f.x,f.y);
      ctx.globalAlpha=1;
    }
    ctx.restore();                                               // ===== fin del MUNDO =====
    // ===== UI en pantalla (fija) =====
    // timer
    ctx.fillStyle='rgba(20,25,35,.75)'; ctx.fillRect(VW/2-40,4,80,26);
    ctx.fillStyle=time>DUR-15?'#ff8a80':'#e8f2f8';
    ctx.font='bold 14px "Space Mono"'; ctx.textAlign='center';
    ctx.fillText(GMID==='surv'?('OLA '+wave):(Math.max(0,Math.ceil(DUR-time))+'s'),VW/2,22);
    // MARCADOR del modo
    ctx.font='900 14px "Space Mono"'; ctx.textAlign='center';
    if(GMID==='hunt'){ const me=ents.find(e=>!e.p.bot);
      ctx.fillStyle='#d9a6ff'; ctx.fillText('💀 '+(me?(me.p.skulls||0):0)+' / '+(GM.goal||10)+'  · líder '+topSkulls(),VW/2,48); }
    else if(GMID==='tdm'){ ctx.fillStyle='#7fd0ff'; ctx.fillText('AZUL '+teamKills(0)+'  —  '+teamKills(1)+' ROJO  (meta '+(GM.goal||15)+')',VW/2,48); }
    else if(GMID==='quest'){ ctx.fillStyle='#7fe0a0'; ctx.fillText('OLEADA '+wave+'/'+(GM.waves||3)+'  ·  kills '+teamKills(0)+'/'+(GM.questGoal||18),VW/2,48); }
    else if(GMID==='trials'){ const me=ents[0]; ctx.fillStyle='#ffc078'; ctx.fillText('🎯 BLANCOS '+(me?(me.p.score||0):0)+' / '+(GM.goal||20),VW/2,48); }
    else if(GMID==='surv'){ ctx.fillStyle='#ffb36b'; ctx.fillText('🌊 OLEADA '+wave+'  ·  derribados '+((ents.find(e=>!e.p.bot)||{p:{}}).p.kills||0),VW/2,48); }
    else if(GMID==='ctf'){ ctx.fillStyle='#7fd0ff';
      ctx.fillText('🚩 AZUL '+caps[0]+'  —  '+caps[1]+' ROJO  ·  primera a '+(GM.goal||2)+' capturas',VW/2,48); }
    else if(GMID==='camp'){ const CG=GM.camp||{}; const kH=((ents.find(e=>!e.p.bot)||{p:{}}).p.kills||0);
      ctx.fillStyle='#ffd34d';
      if(CG.goal==='boss'){ const bl=ents.filter(e=>e.enemy).reduce((s,e)=>s+Math.max(0,e.p.hp|0),0);
        ctx.fillText('👑 VENCE AL JEFE  ·  vidas del jefe: '+bl,VW/2,48); }
      else if(CG.goal==='time') ctx.fillText('⏱ AGUANTA HASTA QUE ACABE EL RELOJ  ·  derribados '+kH,VW/2,48);
      else ctx.fillText('🎯 DERROTA '+kH+' / '+(CG.n||3),VW/2,48); }
    else if(GMID==='lms'&&time>DUR-15){ ctx.fillStyle='#ff8a80'; ctx.font='bold 13px "Space Mono"'; ctx.fillText('¡MUERTE SÚBITA!',VW/2,48); }
    const meE=ents.find(e=>!e.p.bot);
    if(meE&&meE.dead&&!over){
      ctx.fillStyle='rgba(10,10,14,.55)'; ctx.fillRect(0,72,VW,54);
      ctx.fillStyle='#f2ede2'; ctx.font='900 22px Archivo, sans-serif'; ctx.textAlign='center';
      ctx.fillText('CAÍSTE — REGRESAS LA SIGUIENTE RONDA',VW/2,100);
      ctx.fillStyle='#b7b1a4'; ctx.font='bold 11px "Space Mono"';
      ctx.fillText('viendo el final de la ronda · te quedan ♥'+meE.p.hp,VW/2,120);
    }
    // ===== MINIMAPA: todo el mapa CUADRADO en pequeño (abajo al centro) =====
    { const mw=Math.min(170, VW*0.16), mh=mw*(H/W), mx=(VW-mw)/2, my=VH-mh-10, k=mw/W, ky=mh/H;
      ctx.fillStyle='rgba(8,10,16,.68)'; ctx.fillRect(mx-3,my-3,mw+6,mh+6);
      ctx.strokeStyle='rgba(255,255,255,.28)'; ctx.lineWidth=1.5; ctx.strokeRect(mx-3,my-3,mw+6,mh+6);
      ctx.fillStyle='rgba(255,255,255,.30)';
      PLATS.forEach(p=>ctx.fillRect(mx+p.x*k, my+p.y*ky, Math.max(2,p.w*k), 1.5));
      // la cornucopia (centro) marcada en dorado
      ctx.fillStyle='rgba(255,211,77,.9)'; ctx.fillRect(mx+mw/2-2, my+mh/2-2, 4, 4);
      // 🚩 CTF: banderas en el minimapa (azul/rojo)
      if(GMID==='ctf') flags.forEach(f=>{ ctx.fillStyle=f.team===0?'#4d9fff':'#ff5a4d'; ctx.fillRect(mx+f.x*k-2.5, my+f.y*ky-2.5, 5, 5); });
      ents.forEach(e=>{ if(e.dead) return;
        ctx.fillStyle=e.p.color||'#fff';
        ctx.beginPath(); ctx.arc(mx+e.x*k, my+e.y*ky, e.p.bot?2.5:3.5, 0, 7); ctx.fill();
        if(!e.p.bot){ ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.stroke(); } });
      ctx.strokeStyle='rgba(255,211,77,.85)'; ctx.lineWidth=1.5;
      ctx.strokeRect(mx+camX*k, my+camY*ky, VW*k, VH*ky);        // lo que estás viendo
    }
    if(meE&&!meE.dead&&ULTCD[meE.pow]){   // MEDIDOR de ULTIMATE del jugador (tecla R)
      const U=(DATA.POWERS&&DATA.POWERS[meE.pow])||{}, uc=U.color||'#ffd34d';
      const cd=ULTCD[meE.pow], ready=ultReady(meE), frac=ready?1:1-Math.min(1,(meE.ultCd||0)/cd);
      const bx=16, by=VH-26, bw=162, bh=13;
      ctx.textAlign='left';
      ctx.fillStyle='rgba(8,10,16,.62)'; ctx.fillRect(bx-7,by-20,bw+14,35);
      ctx.fillStyle=ready?uc:'#cdc6ba'; ctx.font='900 11px "Space Mono"';
      ctx.fillText('R · '+(U.ult||'ULT')+(ready?'  ¡LISTA!':''), bx, by-6);
      ctx.fillStyle='rgba(255,255,255,.16)'; ctx.fillRect(bx,by,bw,bh);
      ctx.fillStyle=ready?uc:'rgba(220,220,225,.5)'; ctx.fillRect(bx,by,bw*frac,bh);
      if(ready){ const pu=0.5+Math.sin(time*6)*0.5; ctx.save(); ctx.strokeStyle=uc; ctx.globalAlpha=0.5+pu*0.5; ctx.lineWidth=2; ctx.strokeRect(bx-1,by-1,bw+2,bh+2); ctx.restore(); }
      ctx.textAlign='center';
    }
    ctx.restore();
  }

  raf=requestAnimationFrame(frame);
  // hook de debug/balance (solo lectura): window.__tf.ents / .wave / .flags / .caps
  window.__tf={ get ents(){ return ents; }, get wave(){ return wave; }, get mode(){ return GMID; },
    get flags(){ return flags; }, get caps(){ return caps; } };
  return { stop(){ cancelAnimationFrame(raf); } };
}

window.TOWERFALL={ start, backdrops:BACKDROPS,
  title:'HEARTS FALL',
  mapNames:{selva:'THORNWOOD',desierto:'MIRAGE',nieve:'FROSTFANG KEEP',volcan:'TOWERFORGE'},
  desc:'3 flechas (recupéralas). ESQUIVA (C/SHIFT) para ATRAPAR flechas. Apunta en 8 direcciones. Pisotón en la cabeza. Cada animal tiene su ULTIMATE con la tecla R. Cofres dan flechas BOMBA💥/LÁSER (rebotan)/ESPINA🌵 + alas/botas/escudo. ABAJO+SALTO te suelta por la plataforma.',
  controls:'FLECHAS/WASD mover · ESPACIO saltar · X/J disparar (8 dir) · C/SHIFT ESQUIVAR/atrapar · R ULTIMATE · cabeza = pisotón' };
})();
