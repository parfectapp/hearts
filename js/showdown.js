/* HEARTS — SHOWDOWN: battle royale TOP-DOWN estilo Brawl Stars (gas venenoso + auto-aim) */
(function(){
const W=832,H=640;
const PAL={
  selva:   {f1:'#2b5a33',f2:'#256a2f', wall:'#5f6b45',wallD:'#3b4530',cap:'#8a9a66', bush:'#2f6a32',bushD:'#1e4a22',bushL:'#57a04f'},
  desierto:{f1:'#d69a4c',f2:'#c98e42', wall:'#b0863f',wallD:'#7a5a28',cap:'#e6c46a', bush:'#9a8438',bushD:'#6e5e28',bushL:'#c2b05e'},
  nieve:   {f1:'#bcdcec',f2:'#a9cfe0', wall:'#8aa6bd',wallD:'#566f84',cap:'#dcecf5', bush:'#5a949a',bushD:'#3c6266',bushL:'#8fc9cc'},
  volcan:  {f1:'#3a1c14',f2:'#2e1512', wall:'#6a4436',wallD:'#3e261c',cap:'#c9704a', bush:'#5a3a2a',bushD:'#3c261a',bushL:'#8a5a3a'},
  japon:   {f1:'#7a9a4a',f2:'#6f8f42', wall:'#8f8880',wallD:'#5c564e',cap:'#b8b0a4', bush:'#4a7a44',bushD:'#2f5a30',bushL:'#7bb85e'},
  tokyo:   {f1:'#1a2030',f2:'#141a28', wall:'#2e3648',wallD:'#181f2c',cap:'#26e6ff', bush:'#1f6a5e',bushD:'#123a34',bushL:'#2fd6b6'},
  egipto:  {f1:'#d9a95e',f2:'#c99850', wall:'#a8814a',wallD:'#75561f',cap:'#ffd97a', bush:'#7a8a3a',bushD:'#5a6a28',bushL:'#a8b85c'},
  grecia:  {f1:'#d7d3c6',f2:'#c9c5b8', wall:'#b0aca0',wallD:'#7e7a70',cap:'#eef0f4', bush:'#5a8a4a',bushD:'#3c6a30',bushL:'#7bb85e'},
  china:   {f1:'#6a2e2a',f2:'#5a2622', wall:'#8a4038',wallD:'#4a1a18',cap:'#ffce4a', bush:'#3a6a34',bushD:'#244a24',bushL:'#5aa04a'},
};
// pisos top-down pixel-art (uno por ecosistema)
const FLOORS={};
['selva','desierto','nieve','volcan','japon','tokyo','egipto','grecia','china'].forEach(e=>{ const im=new Image(); im.onload=()=>FLOORS[e]=im; im.src='assets/showdown/'+e+'.png?v=1'; });
function start(canvas, players, cfg, onEnd, eco){
  const ctx=canvas.getContext('2d');
  const K=window.KIT, M=window.MAPART;
  const pal=PAL[eco]||PAL.selva;
  const DUR=cfg.duration||55, MIN=cfg.minAlive||1;
  const parts=K.particles();
  const rnd=Math.random;

  // ---- terreno: AGUA (no se pisa) + PUENTES para cruzarla + obstáculos + arbustos + cajas ----
  const water=[ {x:66,y:246,w:132,h:150}, {x:W-198,y:246,w:132,h:150} ];   // 2 estanques laterales
  const bridges=[ {x:110,y:242,w:44,h:158}, {x:W-154,y:242,w:44,h:158} ]; // puente VERTICAL cruza cada laguna
  const onWater=(x,y,pad)=>water.some(w=>x>w.x-(pad||0)&&x<w.x+w.w+(pad||0)&&y>w.y-(pad||0)&&y<w.y+w.h+(pad||0));

  const walls=[];   // obstáculos de piedra (cobertura)
  [[150,120],[682,120],[150,522],[682,522],[416,110],[416,532],[300,300],[532,300],[416,300],[416,206],[416,420]]
    .forEach(([x,y],i)=>{ if(i<3||rnd()<0.78) walls.push({x:x-28,y:y-28,w:56,h:56}); });
  const bushes=[]; { let g=0; while(bushes.length<8&&g++<300){ const x=90+rnd()*(W-180),y=90+rnd()*(H-180); if(onWater(x,y,22))continue; bushes.push({x,y,r:36+rnd()*16,seed:rnd()*7}); } }
  const boxes=[];  { let g=0; while(boxes.length<4&&g++<300){ const x=150+rnd()*(W-300),y=150+rnd()*(H-300); if(onWater(x,y,26))continue; boxes.push({x,y,hp:2}); } }

  const spawnPts=[[70,70],[W-70,70],[70,H-70],[W-70,H-70],[W/2,58],[W/2,H-58],[58,H/2],[W-58,H/2]];
  const ents=players.map((p,i)=>{
    p.koRound=false;
    const sp=spawnPts[i%spawnPts.length], st=p.animal.stats;
    return { p, x:sp[0], y:sp[1], vx:0,vy:0, r:15, rh:5, maxrh:5, cd:0, face:1, ammo:3,
      out:false, inv:1.2, spawnT:0.7, think:rnd()*0.3, speed:148+(st.vel-5)*8, moving:false, runPh:rnd()*6 };
  });
  const shots=[], hearts=[], cubes=[];
  // FLECHAS: NO hay munición infinita. Empiezas con pocas; consigues más de cajas, COFRES y
  // recogiendo las flechas caídas (como TowerFall).
  const arrows=[]; { let g=0; while(arrows.length<5&&g++<300){ const x=120+rnd()*(W-240),y=120+rnd()*(H-240); if(onWater(x,y,14))continue; arrows.push({x,y,t:rnd()*6,n:2}); } }
  const chests=[]; [[W*0.5,H*0.28],[W*0.26,H*0.7],[W*0.74,H*0.7]].forEach(xy=>chests.push({x:xy[0],y:xy[1],t:0,opened:false}));
  let time=0, over=false, endTimer=0, raf=null;
  const GAS_START=14;
  const active=()=>ents.filter(e=>!e.out);
  function hudRefresh(){ K.updateHudPlayers(players,p=>!p.koRound); }

  function safeRect(){
    if(time<GAS_START) return {x0:0,y0:0,x1:W,y1:H,on:false};
    const p=Math.min(1,(time-GAS_START)/(DUR-GAS_START-1));
    return {x0:p*W*0.40, y0:p*H*0.40, x1:W-p*W*0.40, y1:H-p*H*0.40, on:true};
  }
  function dropHearts(x,y,n){ for(let i=0;i<n;i++) hearts.push({x:x+(rnd()-.5)*22,y:y+(rnd()-.5)*22,t:rnd()*6}); }
  function kill(e){
    if(e.out||e.inv>0) return;
    parts.spawn(e.x,e.y,'#ff5a4d',24,250); K.shake(8); SFX.ko();
    if(e.p.hp>0){ e.p.hp--; dropHearts(e.x,e.y,1); }
    for(let i=0;i<2;i++) cubes.push({x:e.x+(rnd()-.5)*30,y:e.y+(rnd()-.5)*30,t:0});
    e.out=true; e.p.koRound=true; SFX.die(); hudRefresh();
  }
  function shoot(e,tx,ty){
    if(e.cd>0||e.ammo<=0) return; e.cd=0.55; e.ammo--; e.revealT=1.2;   // gasta 1 flecha + te delata
    const dx=tx-e.x, dy=ty-e.y, n=Math.hypot(dx,dy)||1, sp=440;
    e.face=dx<0?-1:1;
    shots.push({x:e.x+dx/n*18,y:e.y-8+dy/n*18,vx:dx/n*sp,vy:dy/n*sp,owner:e,t:1.5,dmg:1,col:e.p.color});
    SFX.arrow();
    if(e.ammo===0 && !e.p.bot) SFX.deny&&SFX.deny();          // se te acabaron
  }
  function dropArrows(x,y,n){ arrows.push({x:x+(rnd()-.5)*16,y:y+(rnd()-.5)*16,t:0,n}); }
  const isHidden=o=>inBush(o)&&(o.revealT||0)<=0;   // en arbusto y sin haber disparado = escondido
  function nearestFoe(e){ let b=null,bd=1e9; active().forEach(o=>{ if(o===e)return;
    const d=Math.hypot(o.x-e.x,o.y-e.y);
    if(isHidden(o)&&d>60) return;                    // no ves a un rival escondido si está lejos
    if(d<bd){bd=d;b=o;} }); return {foe:b,dist:bd}; }
  function pushOut(e,r){ const cx=Math.max(r.x,Math.min(e.x,r.x+r.w)), cy=Math.max(r.y,Math.min(e.y,r.y+r.h));
    const dx=e.x-cx, dy=e.y-cy, d=Math.hypot(dx,dy); if(d<e.r&&d>0){ e.x=cx+dx/d*e.r; e.y=cy+dy/d*e.r; } }
  const onBridge=e=>bridges.some(b=>e.x>b.x&&e.x<b.x+b.w&&e.y>b.y-6&&e.y<b.y+b.h+6);
  function collide(e){
    walls.forEach(w=>pushOut(e,w));                  // obstáculos
    if(!onBridge(e)) water.forEach(w=>pushOut(e,w));  // agua bloquea (salvo sobre puente)
    e.x=Math.max(e.r+8,Math.min(W-e.r-8,e.x)); e.y=Math.max(e.r+8,Math.min(H-e.r-8,e.y));
  }
  const inBush=e=>bushes.some(b=>Math.hypot(b.x-e.x,b.y-e.y)<b.r-4);

  function nearestLoot(e){ // flecha suelta, cofre sin abrir o caja más cercana (para rearmarse)
    let b=null,bd=1e9;
    const consider=(x,y)=>{ const d=Math.hypot(x-e.x,y-e.y); if(d<bd){bd=d;b={x,y};} };
    arrows.forEach(a=>consider(a.x,a.y));
    chests.forEach(c=>{ if(!c.opened) consider(c.x,c.y); });
    boxes.forEach(bx=>consider(bx.x,bx.y));
    return b;
  }
  function botThink(e){
    const {foe,dist}=nearestFoe(e);
    const sr=safeRect();
    let mx=0,my=0;
    // huir del gas: ir al centro de la zona segura
    if(sr.on){ const cx=(sr.x0+sr.x1)/2, cy=(sr.y0+sr.y1)/2;
      if(e.x<sr.x0+40||e.x>sr.x1-40||e.y<sr.y0+40||e.y>sr.y1-40){ mx=cx-e.x; my=cy-e.y; }
    }
    // SIN FLECHAS: ir por munición (cofre/caja/flecha del suelo)
    if(!mx&&!my && e.ammo<=0){ const l=nearestLoot(e); if(l){ mx=l.x-e.x; my=l.y-e.y; } }
    if(foe){
      if(!mx&&!my){
        if(dist>220){ mx=foe.x-e.x; my=foe.y-e.y; }         // acércate
        else if(dist<110){ mx=-(foe.x-e.x); my=-(foe.y-e.y); } // toma distancia
        else { mx=-(foe.y-e.y); my=(foe.x-e.x); }             // orbita
        if(rnd()<0.3){ mx+=(rnd()-.5)*200; my+=(rnd()-.5)*200; }
      }
      if(dist<300 && e.cd<=0 && e.ammo>0 && rnd()<0.7) shoot(e,foe.x,foe.y);
    }
    const n=Math.hypot(mx,my)||1; e.mvx=mx/n; e.mvy=my/n;
  }

  let last=performance.now();
  function frame(now){
    if(over&&endTimer<=0){ cancelAnimationFrame(raf); onEnd(); return; }
    const dt=Math.max(0,Math.min(0.03,(now-last)/1000)); last=now; time+=dt;
    const me=ents.find(e=>!e.p.bot);
    const sr=safeRect();

    if(!over){
      // input humano
      if(me&&!me.out){
        let mx=0,my=0;
        if(K.keys.has('ArrowLeft')||K.keys.has('KeyA')) mx-=1;
        if(K.keys.has('ArrowRight')||K.keys.has('KeyD')) mx+=1;
        if(K.keys.has('ArrowUp')||K.keys.has('KeyW')) my-=1;
        if(K.keys.has('ArrowDown')||K.keys.has('KeyS')) my+=1;
        const n=Math.hypot(mx,my)||1; me.mvx=mx/n; me.mvy=my/n;
        if(K.tap('Space')||K.tap('KeyX')||K.tap('KeyJ')||K.tap('KeyK')){
          const {foe}=nearestFoe(me); if(foe) shoot(me,foe.x,foe.y); else shoot(me,me.x+me.face*100,me.y);
        }
      }
      // bots
      ents.forEach(e=>{ if(e.out||!e.p.bot) return; e.think-=dt;
        if(e.think<=0){ e.think=0.15+rnd()*0.12; botThink(e); } });
      // mover + colisión
      ents.forEach(e=>{ if(e.out) return;
        e.inv=Math.max(0,e.inv-dt); e.cd=Math.max(0,e.cd-dt); e.spawnT=Math.max(0,e.spawnT-dt); e.revealT=Math.max(0,(e.revealT||0)-dt);
        const spd=e.speed*(inBush(e)?0.9:1);
        e.moving=(e.mvx||e.mvy)?true:false;
        e.x+=(e.mvx||0)*spd*dt; e.y+=(e.mvy||0)*spd*dt;
        if(e.mvx) e.face=e.mvx<0?-1:1;
        if(e.moving) e.runPh+=dt*12;
        collide(e);
        // gas venenoso
        if(sr.on && (e.x<sr.x0||e.x>sr.x1||e.y<sr.y0||e.y>sr.y1)){
          e.gasT=(e.gasT||0)+dt; if(e.gasT>=0.8){ e.gasT=0; e.rh-=1; parts.spawn(e.x,e.y-10,'#c77dff',5,80); if(e.rh<=0) kill(e); }
        }
        // recoger corazones y cubos
        for(let i=hearts.length-1;i>=0;i--){ const h=hearts[i]; if(Math.hypot(h.x-e.x,h.y-e.y)<e.r+8){ hearts.splice(i,1); e.p.hp++; SFX.coin(); hudRefresh(); } }
        for(let i=cubes.length-1;i>=0;i--){ const c=cubes[i]; if(Math.hypot(c.x-e.x,c.y-e.y)<e.r+10){ cubes.splice(i,1); e.rh=Math.min(e.maxrh+3,e.rh+1); e.maxrh++; SFX.powerup(); parts.spawn(c.x,c.y,'#ffd34d',8,120); } }
        // recoger FLECHAS del suelo
        for(let i=arrows.length-1;i>=0;i--){ const a=arrows[i]; if(Math.hypot(a.x-e.x,a.y-e.y)<e.r+11){ e.ammo+=a.n; arrows.splice(i,1); SFX.coin&&SFX.coin(); parts.spawn(a.x,a.y,'#ffe08a',6,110); } }
        // abrir COFRES (dan una aljaba de flechas + poder)
        chests.forEach(ch=>{ if(!ch.opened && Math.hypot(ch.x-e.x,ch.y-e.y)<e.r+16){ ch.opened=true; dropArrows(ch.x,ch.y,6); cubes.push({x:ch.x,y:ch.y-6,t:0}); SFX.powerup(); parts.spawn(ch.x,ch.y-8,'#ffd34d',16,200); K.shake&&K.shake(5); } });
      });
      // proyectiles
      for(let i=shots.length-1;i>=0;i--){ const s=shots[i]; s.t-=dt; s.x+=s.vx*dt; s.y+=s.vy*dt;
        let dead=s.t<=0||s.x<6||s.x>W-6||s.y<6||s.y>H-6, hitEnt=false;
        if(!dead) for(const w of walls){ if(s.x>w.x&&s.x<w.x+w.w&&s.y>w.y&&s.y<w.y+w.h){ dead=true; break; } }
        if(!dead) for(const b of boxes){ if(Math.abs(s.x-b.x)<22&&Math.abs(s.y-b.y)<22){ b.hp-=s.dmg; dead=true;
          if(b.hp<=0){ boxes.splice(boxes.indexOf(b),1); dropArrows(b.x,b.y,3); cubes.push({x:b.x,y:b.y,t:0}); parts.spawn(b.x,b.y,'#c9952a',12,160); SFX.hit(); } break; } }
        if(!dead) for(const e of ents){ if(e.out||e===s.owner||e.inv>0) continue;
          if(Math.hypot(s.x-e.x,s.y-(e.y-10))<e.r+4){ e.rh-=s.dmg; parts.spawn(s.x,s.y,'#ffd34d',6,120); SFX.hit(); dead=true; hitEnt=true; if(e.rh<=0) kill(e); break; } }
        if(dead){ parts.spawn(s.x,s.y,s.col||'#ffd34d',3,80);
          if(!hitEnt && s.x>10&&s.x<W-10&&s.y>10&&s.y<H-10) dropArrows(s.x,s.y,1);  // flecha caída = recuperable
          shots.splice(i,1); }
      }
      hearts.forEach(h=>h.t+=dt); cubes.forEach(c=>c.t+=dt); arrows.forEach(a=>a.t+=dt); chests.forEach(c=>c.t+=dt);
      if(time>DUR || active().length<=MIN){ over=true; endTimer=1.0;
        const act=active(); while(hearts.length&&act.length){ for(const e of act){ if(!hearts.length)break; hearts.pop(); e.p.hp++; } } hudRefresh(); }
    } else { endTimer-=dt; }

    parts.update(dt); draw(sr); raf=requestAnimationFrame(frame);
  }

  function draw(sr){
    ctx.save(); K.applyShake(ctx);
    // PISO: arte top-down pixel (cover). Fallback: relleno liso.
    const fl=FLOORS[eco];
    if(fl){ const s=Math.max(W/fl.width,H/fl.height), bw=fl.width*s, bh=fl.height*s;
      ctx.imageSmoothingEnabled=true; ctx.drawImage(fl,(W-bw)/2,(H-bh)/2,bw,bh);
    } else { ctx.fillStyle=pal.f1; ctx.fillRect(0,0,W,H); }
    // AGUA (nivel del suelo): azul con ondas, borde hundido
    water.forEach(wa=>{
      ctx.fillStyle='#245e86'; ctx.fillRect(wa.x,wa.y,wa.w,wa.h);
      ctx.fillStyle='#3a86bb'; ctx.fillRect(wa.x+3,wa.y+3,wa.w-6,wa.h-6);
      ctx.strokeStyle='rgba(255,255,255,.16)'; ctx.lineWidth=2;
      for(let yy=wa.y+10;yy<wa.y+wa.h-6;yy+=13){ ctx.beginPath();
        for(let xx=wa.x+5;xx<wa.x+wa.w-3;xx+=7){ ctx.lineTo(xx,yy+Math.sin(xx*0.2+time*2.2+yy)*2); } ctx.stroke(); }
      ctx.fillStyle='rgba(180,225,245,.35)'; for(let k=0;k<5;k++){ const px=wa.x+8+((k*53+time*18)%(wa.w-16)); ctx.fillRect(px,wa.y+12+((k*37)%(wa.h-24)),3,2); }
      ctx.strokeStyle='rgba(0,0,0,.3)'; ctx.lineWidth=3; ctx.strokeRect(wa.x+1.5,wa.y+1.5,wa.w-3,wa.h-3);
    });
    // PUENTES VERTICALES de madera sobre el agua (se camina encima)
    bridges.forEach(b=>{
      ctx.fillStyle='rgba(0,0,0,.28)'; ctx.fillRect(b.x+b.w,b.y,5,b.h);           // sombra al costado
      ctx.fillStyle='#5f3e1e'; ctx.fillRect(b.x,b.y,b.w,b.h);
      ctx.fillStyle='#835832'; ctx.fillRect(b.x+3,b.y,b.w-6,b.h);
      ctx.fillStyle='rgba(0,0,0,.22)'; for(let i=b.y+3;i<b.y+b.h;i+=12) ctx.fillRect(b.x,i,b.w,2);   // tablones (peldaños)
      ctx.fillStyle='#a67c40'; ctx.fillRect(b.x,b.y,2,b.h); ctx.fillStyle='rgba(0,0,0,.22)'; ctx.fillRect(b.x+b.w-2,b.y,2,b.h); // barandales
      ctx.fillStyle='#4a3016'; ctx.fillRect(b.x-3,b.y-2,b.w+6,4); ctx.fillRect(b.x-3,b.y+b.h-2,b.w+6,4); // topes arriba/abajo
    });
    // ===== RENDER 2.5D con PROFUNDIDAD (estilo Brawl Stars): objetos con ALTURA + orden por Y =====
    const drawBush=b=>{
      ctx.fillStyle='rgba(0,0,0,.24)'; ctx.beginPath(); ctx.ellipse(b.x,b.y+b.r*0.5,b.r*0.9,b.r*0.32,0,0,7); ctx.fill();
      const sh=[pal.bushD,pal.bush,pal.bushL];
      for(let t=0;t<3;t++){ ctx.fillStyle=sh[t]; const rr=b.r*(1-t*0.16);
        for(let k=0;k<8;k++){ const a=k/8*6.283+b.seed; const rx=b.x+Math.cos(a)*b.r*0.46, ry=b.y+Math.sin(a)*b.r*0.30-t*4-8;
          ctx.beginPath(); ctx.arc(rx,ry,rr*0.5,0,7); ctx.fill(); }
        ctx.beginPath(); ctx.arc(b.x,b.y-t*4-10,rr*0.6,0,7); ctx.fill(); }
      ctx.fillStyle=pal.bushL; for(let k=0;k<6;k++){ const a=k/6*6.283+b.seed*1.7; ctx.fillRect((b.x+Math.cos(a)*b.r*0.42)|0,(b.y+Math.sin(a)*b.r*0.26-18)|0,3,3); }
    };
    const drawBox=b=>{ const EH=26,x=b.x-18,y=b.y-18,w=36,h=36,yB=b.y+18;
      ctx.fillStyle='rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(b.x,yB+2,22,8,0,0,7); ctx.fill();
      ctx.fillStyle='#5a3a18'; ctx.fillRect(x,y-EH+h,w,EH);                        // cara frontal
      ctx.strokeStyle='rgba(0,0,0,.32)'; ctx.lineWidth=2; ctx.beginPath();
      ctx.moveTo(x,y-EH+h+9); ctx.lineTo(x+w,y-EH+h+9); ctx.moveTo(x,y-EH+h+18); ctx.lineTo(x+w,y-EH+h+18); ctx.stroke();
      ctx.fillStyle='#8a5a28'; ctx.fillRect(x,y-EH,w,h);                           // techo
      ctx.fillStyle='rgba(255,235,200,.22)'; ctx.fillRect(x,y-EH,w,3);
      ctx.strokeStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.moveTo(x,y-EH+h/2);ctx.lineTo(x+w,y-EH+h/2);ctx.moveTo(x+w/2,y-EH);ctx.lineTo(x+w/2,y-EH+h);ctx.moveTo(x,y-EH+h);ctx.lineTo(x+w,y-EH); ctx.stroke();
      ctx.fillStyle='#c9952a'; [[x,y-EH],[x+w-8,y-EH],[x,y-EH+h-8],[x+w-8,y-EH+h-8]].forEach(c=>ctx.fillRect(c[0],c[1],8,8));
      ctx.strokeStyle='rgba(0,0,0,.4)'; ctx.lineWidth=2; ctx.strokeRect(x+.5,y-EH+.5,w-1,h-1);
    };
    const drawWall=w=>{ const EH=30,yB=w.y+w.h;
      ctx.fillStyle='rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(w.x+w.w/2,yB+3,w.w*0.55,9,0,0,7); ctx.fill();
      ctx.fillStyle=pal.wallD; ctx.fillRect(w.x,w.y-EH+w.h,w.w,EH);                // cara frontal
      ctx.fillStyle='rgba(0,0,0,.16)'; ctx.fillRect(w.x,yB-4,w.w,4);
      ctx.fillStyle=pal.wall; ctx.fillRect(w.x,w.y-EH,w.w,w.h);                    // techo
      ctx.fillStyle=pal.cap;  ctx.fillRect(w.x,w.y-EH,w.w,3);
      ctx.strokeStyle='rgba(0,0,0,.22)'; ctx.lineWidth=1.5; ctx.strokeRect(w.x+1.5,w.y-EH+1.5,w.w-3,w.h-3);
      ctx.beginPath(); ctx.moveTo(w.x+w.w*0.5,w.y-EH+w.h); ctx.lineTo(w.x+w.w*0.5,yB);
      ctx.moveTo(w.x+w.w*0.28,w.y-EH+w.h+8); ctx.lineTo(w.x+w.w*0.28,yB); ctx.stroke();
    };
    const drawCube=c=>{ const s=9+Math.sin(c.t*6)*1.5, fy=6+Math.sin(c.t*3)*2;
      ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(c.x,c.y+4,10,4,0,0,7); ctx.fill();
      ctx.fillStyle='rgba(255,211,77,.28)'; ctx.beginPath(); ctx.arc(c.x,c.y-fy,16,0,7); ctx.fill();
      ctx.save(); ctx.translate(c.x,c.y-fy); ctx.rotate(0.5);
      ctx.fillStyle='#ffd34d'; ctx.fillRect(-s/2,-s/2,s,s);
      ctx.fillStyle='#fff6c8'; ctx.fillRect(-s/2,-s/2,s,3);
      ctx.fillStyle='rgba(150,100,20,.6)'; ctx.fillRect(-s/2,s/2-3,s,3);
      ctx.restore(); ctx.fillStyle='#fff'; ctx.fillRect(c.x-2,c.y-5-fy,2,2); };
    const drawArrow=a=>{ const fy=Math.sin(a.t*3)*2;
      ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(a.x,a.y+5,9,3,0,0,7); ctx.fill();
      ctx.fillStyle='rgba(255,224,138,.3)'; ctx.beginPath(); ctx.arc(a.x,a.y-fy,12,0,7); ctx.fill();  // brillo
      ctx.save(); ctx.translate(a.x,a.y-fy); ctx.rotate(-0.5);
      ctx.strokeStyle='#c9b890'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-9,0); ctx.lineTo(7,0); ctx.stroke();
      ctx.fillStyle='#e8e2d2'; ctx.beginPath(); ctx.moveTo(12,0); ctx.lineTo(6,-4); ctx.lineTo(6,4); ctx.fill();      // punta
      ctx.strokeStyle='#ff5a4d'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-9,-3); ctx.lineTo(-6,0); ctx.lineTo(-9,3); ctx.stroke(); // plumas
      ctx.restore();
      if(a.n>1){ ctx.fillStyle='#fff'; ctx.font='bold 9px "Space Mono"'; ctx.textAlign='center'; ctx.fillText('x'+a.n,a.x,a.y-14-fy); } };
    const drawChest=c=>{ const op=c.opened;
      ctx.fillStyle='rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(c.x,c.y+12,20,7,0,0,7); ctx.fill();
      ctx.fillStyle='#7a4e22'; ctx.fillRect(c.x-16,c.y-4,32,16);
      ctx.fillStyle='#8f5e2c'; ctx.fillRect(c.x-14,c.y-2,28,12);
      ctx.fillStyle='#c9952a'; ctx.fillRect(c.x-16,c.y-4,32,3); ctx.fillRect(c.x-16,c.y+9,32,3);
      if(op){ ctx.fillStyle='#3a2410'; ctx.fillRect(c.x-13,c.y-14,26,10); ctx.fillStyle='#5a3a18'; ctx.fillRect(c.x-15,c.y-18,30,5); }
      else { ctx.fillStyle='#9a6a30'; ctx.fillRect(c.x-16,c.y-12,32,9); ctx.fillStyle='#c9952a'; ctx.fillRect(c.x-16,c.y-12,32,2);
        ctx.fillStyle='#e8c04a'; ctx.fillRect(c.x-2,c.y-6,4,7);
        const g=0.5+0.5*Math.sin(c.t*3); ctx.fillStyle='rgba(255,240,150,'+(0.45*g)+')'; ctx.fillRect(c.x-16,c.y-13,32,2); }
      ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=1.5; ctx.strokeRect(c.x-16,c.y-4,32,16); };
    const drawPlayer=e=>{
      ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(e.x,e.y+16,17,6,0,0,7); ctx.fill();
      const hidden=isHidden(e); ctx.globalAlpha=hidden?0.4:1;   // escondido en arbusto = tenue (todos)
      const pose=e.moving?{moving:true,run:e.runPh}:{idle:true,t:time+e.runPh}; if(e.spawnT>0) pose.spawn=e.spawnT/0.7;
      Sprites.drawAnimal(ctx,e.p.animal,e.x,e.y+14,52*(e.p.animal.size||1),e.face<0,pose);
      ctx.globalAlpha=1;
      const bw=34, hp=Math.max(0,e.rh)/e.maxrh;
      ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(e.x-bw/2-1,e.y-e.r-34,bw+2,6);
      ctx.fillStyle=hp>0.5?'#7dff8a':hp>0.25?'#ffd34d':'#ff5a4d'; ctx.fillRect(e.x-bw/2,e.y-e.r-33,bw*hp,4);
      ctx.fillStyle=e.p.color; ctx.fillRect(e.x-bw/2,e.y-e.r-40,6,4);
    };
    // ordena por Y de contacto: lo de ABAJO tapa lo de ARRIBA = profundidad real
    const zl=[];
    bushes.forEach(b=>zl.push({y:b.y+b.r*0.5, f:()=>drawBush(b)}));
    boxes.forEach(b=>zl.push({y:b.y+18, f:()=>drawBox(b)}));
    walls.forEach(w=>zl.push({y:w.y+w.h, f:()=>drawWall(w)}));
    cubes.forEach(c=>zl.push({y:c.y, f:()=>drawCube(c)}));
    hearts.forEach(h=>zl.push({y:h.y, f:()=>{ if(M) M.drawHeart(ctx,h.x,h.y,1.0,time+h.t); }}));
    arrows.forEach(a=>zl.push({y:a.y, f:()=>drawArrow(a)}));
    chests.forEach(c=>zl.push({y:c.y+12, f:()=>drawChest(c)}));
    ents.forEach(e=>{ if(!e.out) zl.push({y:e.y+16, f:()=>drawPlayer(e)}); });
    zl.sort((a,b)=>a.y-b.y); zl.forEach(o=>o.f());
    // proyectiles (vuelan por encima de todo)
    shots.forEach(s=>{ ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(Math.atan2(s.vy,s.vx));
      ctx.fillStyle=s.col||'#ffd34d'; ctx.fillRect(-8,-2,16,4); ctx.fillStyle='#fff'; ctx.fillRect(4,-1,4,2); ctx.restore(); });
    parts.draw(ctx);
    // VIÑETA: oscurece los bordes = profundidad/foco (sensación 3D premium)
    const vg=ctx.createRadialGradient(W/2,H/2,H*0.32,W/2,H/2,H*0.78);
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.34)');
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    // GAS venenoso fuera de la zona segura
    if(sr.on){
      const a=0.30+0.05*Math.sin(time*3);
      ctx.fillStyle=`rgba(140,50,190,${a})`;
      ctx.fillRect(0,0,W,sr.y0); ctx.fillRect(0,sr.y1,W,H-sr.y1);
      ctx.fillRect(0,sr.y0,sr.x0,sr.y1-sr.y0); ctx.fillRect(sr.x1,sr.y0,W-sr.x1,sr.y1-sr.y0);
      // brumas que se arremolinan en el borde
      ctx.fillStyle=`rgba(180,90,220,${a*0.5})`;
      for(let k=0;k<10;k++){ const ph=time*0.8+k*2.2; const bx=sr.x0+ (k%2? -18: sr.x1-sr.x0+18) + Math.sin(ph)*10; const by=sr.y0+((k*97)%(sr.y1-sr.y0));
        ctx.beginPath(); ctx.arc((k%2?sr.x0-14:sr.x1+14)+Math.sin(ph)*8, sr.y0+40+((k*83)%Math.max(1,(sr.y1-sr.y0-80))), 18,0,7); ctx.fill(); }
      ctx.strokeStyle=`rgba(225,150,255,${0.7+0.3*Math.sin(time*5)})`; ctx.lineWidth=4;
      ctx.strokeRect(sr.x0,sr.y0,sr.x1-sr.x0,sr.y1-sr.y0);
      ctx.strokeStyle='rgba(255,225,255,.22)'; ctx.lineWidth=1;
      ctx.strokeRect(sr.x0+2,sr.y0+2,sr.x1-sr.x0-4,sr.y1-sr.y0-4);
    }
    // timer
    ctx.fillStyle='rgba(20,25,35,.75)'; ctx.fillRect(376,4,80,26);
    ctx.fillStyle=sr.on?'#d28aff':'#e8f2f8'; ctx.font='bold 14px "Space Mono"'; ctx.textAlign='center';
    ctx.fillText(Math.max(0,Math.ceil(DUR-time))+'s',416,22);
    if(sr.on){ ctx.fillStyle='#d28aff'; ctx.font='bold 12px "Space Mono"'; ctx.fillText('☣ GAS VENENOSO',W/2,46); }
    const meE=ents.find(e=>!e.p.bot);
    if(meE&&meE.out&&!over){ ctx.fillStyle='rgba(10,10,14,.55)'; ctx.fillRect(0,72,W,50);
      ctx.fillStyle='#f2ede2'; ctx.font='900 22px Archivo, sans-serif'; ctx.textAlign='center';
      ctx.fillText('CAÍSTE — REGRESAS LA SIGUIENTE RONDA',W/2,102); }
    // HUD de FLECHAS (no hay munición infinita)
    if(meE && !meE.out){
      const ax=W/2, ay=H-28, outA=meE.ammo<=0;
      ctx.fillStyle='rgba(20,25,35,.82)'; ctx.fillRect(ax-54,ay-15,108,26);
      ctx.strokeStyle='rgba(255,255,255,.12)'; ctx.lineWidth=1; ctx.strokeRect(ax-54,ay-15,108,26);
      ctx.strokeStyle='#c9b890'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(ax-32,ay-2,9,-1.15,1.15); ctx.stroke(); // arco
      ctx.beginPath(); ctx.moveTo(ax-25,ay-11); ctx.lineTo(ax-25,ay+7); ctx.stroke();                             // cuerda
      ctx.fillStyle=outA?'#ff5a4d':'#ffe08a'; ctx.font='bold 18px "Space Mono"'; ctx.textAlign='left';
      ctx.fillText('× '+meE.ammo, ax-10, ay+4);
      if(outA){ ctx.fillStyle='#ff5a4d'; ctx.font='bold 12px "Space Mono"'; ctx.textAlign='center';
        ctx.fillText('¡SIN FLECHAS! abre cofres y cajas', W/2, ay-24); }
    }
    ctx.restore();
  }

  raf=requestAnimationFrame(frame);
  return { stop(){ cancelAnimationFrame(raf); } };
}

window.SHOWDOWN={ start,
  title:'SHOWDOWN',
  mapNames:{selva:'JUNGLE ARENA',desierto:'DESERT ARENA',nieve:'FROZEN ARENA',volcan:'MAGMA ARENA'},
  desc:'Top-down: FLECHAS limitadas (cofres/cajas). Escóndete en los ARBUSTOS 🌿, cruza el AGUA por los PUENTES. El GAS ☣ encoge la zona. ¡Último vivo gana!',
  controls:'FLECHAS / WASD mover · ESPACIO / X disparar · escóndete en arbustos · cruza por puentes' };
})();
