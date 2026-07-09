/* HEARTS BROS — smash battle royale: mueres y sueltas tus corazones */
(function(){
const W=832,H=640;
const GRAV=1700, RUN=290, JUMP=-620;

function start(canvas, players, cfg, onEnd, eco){
  const ctx=canvas.getContext('2d');
  const K=window.KIT;
  const M=window.MAPART;
  // stage: si el mundo no tiene layout propio (Sakura/Neo-Tokyo/…), toma uno de los 4 clásicos
  const layout=THEMES.BROS_LAYOUTS[eco||'selva'] ||
    THEMES.BROS_LAYOUTS[['selva','desierto','nieve','volcan'][(eco||'').length%4]];
  const PLATS=layout.plats;
  const scene=THEMES.makeScene(eco||'selva','bros');
  const th=THEMES.T[eco||'selva'];
  const parts=K.particles();
  const DUR=cfg.duration||60, MIN=cfg.minAlive||2;

  const ents=players.map((p,i)=>{
    const st=p.animal.stats;
    const sp=layout.spawns[i%layout.spawns.length];
    p.koRound=false;
    return { p, x:sp[0], y:sp[1], vx:0, vy:0, w:30, h:46, face:sp[0]>W/2?-1:1,
      dmg:0, onG:false, jumps:1, cd:0, atkT:0, stun:0, inv:1.4,
      out:false, dead:false, respT:0,
      spd:RUN*(1+(st.vel-5)*0.05), pow:1+(st.pow-5)*0.06, def:1-(st.def-5)*0.04,
      buffPow:false, buffSpd:0, think:Math.random()*0.2, vxDes:0,
      runPh:Math.random()*6, landT:0, crouch:false, crouchT:0 };
  });
  let box=null, boxTimer=6;
  const heartsFloor=[];
  let time=0, over=false, endTimer=0, raf=null, hitstop=0, koText=0, sudden=0;

  const active=()=>ents.filter(e=>!e.out);
  const living=()=>ents.filter(e=>!e.out&&!e.dead);
  function hudRefresh(){ K.updateHudPlayers(players, p=>!p.koRound); }
  function dropHearts(x,y,n){
    const cx=Math.max(40,Math.min(W-40,x)), cy=Math.max(40,Math.min(H-120,y));
    for(let i=0;i<n;i++){
      heartsFloor.push({x:cx+(Math.random()-.5)*24, y:cy-20,
        vx:(Math.random()-.5)*380, vy:-240-Math.random()*200, onG:false, t:Math.random()*6});
    }
  }
  function die(e){
    if(e.out||e.dead) return;
    SFX.ko(); K.shake(14); koText=0.9;
    parts.spawn(Math.max(30,Math.min(W-30,e.x)),Math.max(30,Math.min(H-30,e.y)),'#ffd34d',30,380);
    const drop=e.p.hp;
    if(drop>0){
      dropHearts(e.x,e.y,drop);
      e.p.hp=0;
      e.dead=true; e.respT=2.2;
    } else {
      e.out=true; e.p.koRound=true; SFX.die();
    }
    hudRefresh();
  }
  function respawn(e){
    e.x=416; e.y=120; e.vx=0; e.vy=0; e.dmg=0; e.inv=2; e.jumps=1; e.stun=0; e.dead=false;
  }
  function attack(a){
    if(a.cd>0||a.stun>0) return;
    a.cd=0.42; a.atkT=0.13; SFX.hit();
    const hx=a.x+a.face*26, hy=a.y-a.h/2;
    ents.forEach(b=>{
      if(b===a||b.out||b.dead||b.inv>0) return;
      if(Math.abs(b.x-hx)<34&&Math.abs((b.y-b.h/2)-hy)<38){
        const base=a.buffPow?16:9;
        let add=Math.round(base*a.pow*b.def);
        if(b.crouch) add=Math.round(add*0.7);
        b.dmg=Math.min(300,b.dmg+add);
        let kb=(170+b.dmg*6.2)*(a.buffPow?1.4:1);
        if(b.crouch) kb*=0.45;
        b.vx=a.face*kb; b.vy=-200-b.dmg*(b.crouch?1.1:2.2);
        b.stun=0.16+b.dmg*0.0035;
        hitstop=0.07; K.shake(6+Math.min(10,b.dmg*0.04));
        parts.spawn(b.x,b.y-b.h/2,b.crouch?'#9ce8ff':'#ff8a4d',12,260);
        SFX.hit();
      }
    });
    a.buffPow=false;
    if(box&&Math.abs(box.x-hx)<38&&Math.abs(box.y-hy)<40){
      const fx=['heal','power','speed'][Math.floor(Math.random()*3)];
      if(fx==='heal'){ a.dmg=Math.max(0,a.dmg-45); parts.spawn(box.x,box.y,'#9dff8a',14,220); }
      if(fx==='power'){ a.buffPow=true; parts.spawn(box.x,box.y,'#ff8a4d',14,220); }
      if(fx==='speed'){ a.buffSpd=6; parts.spawn(box.x,box.y,'#4dd2ff',14,220); }
      SFX.powerup(); box=null; boxTimer=9;
    }
  }
  function physics(e,dt){
    e.vy+=GRAV*dt;
    if(e.stun>0) e.vx*=Math.pow(0.2,dt);
    e.x+=e.vx*dt; e.y+=e.vy*dt;
    e.onG=false;
    const oy=e.y-e.vy*dt;
    PLATS.forEach(pl=>{
      if(e.vy>=0 && oy<=pl.y+4 && e.x>pl.x-e.w/3 && e.x<pl.x+pl.w+e.w/3 && e.y>=pl.y && e.y<pl.y+pl.h+18){
        e.y=pl.y; e.vy=0; e.onG=true;
      }
    });
    if(e.onG){ e.jumps=1; }
    if(e.x<-70||e.x>W+70||e.y>H+90||e.y<-150) die(e);
  }
  function heartPhysics(h,dt){
    h.t+=dt;
    if(!h.onG){
      h.vy+=900*dt;
      h.x+=h.vx*dt; h.y+=h.vy*dt;
      if(h.x<16){h.x=16;h.vx*=-0.5;} if(h.x>W-16){h.x=W-16;h.vx*=-0.5;}
      for(const pl of PLATS){
        if(h.vy>0&&h.x>pl.x&&h.x<pl.x+pl.w&&h.y>pl.y&&h.y<pl.y+pl.h+10){
          h.y=pl.y;
          if(Math.abs(h.vy)>140){ h.vy*=-0.4; h.vx*=0.6; }
          else { h.vy=0; h.onG=true; }
          break;
        }
      }
      if(h.y>H+30){ // cayó al vacío: reaparece arriba del centro
        h.y=-10; h.vy=60; h.vx=0; h.x=W/2+(Math.random()-.5)*160;
      }
    }
  }
  function nearestFoe(e){
    let best=null,bd=1e9;
    living().forEach(o=>{ if(o!==e){ const d=Math.abs(o.x-e.x)+Math.abs(o.y-e.y)*0.5; if(d<bd){bd=d;best=o;} } });
    return best;
  }
  function botThink(e){
    e.think=0.13+Math.random()*0.1;
    const offL=e.x<layout.stageL, offR=e.x>layout.stageR;
    if((offL||offR)&&e.y>PLATS[0].y-60){
      e.vxDes=(offL?1:-1)*e.spd;
      if(e.vy>0&&e.jumps>0&&Math.random()<0.8){ e.jumps--; e.vy=JUMP; }
      return;
    }
    const foe=nearestFoe(e);
    let heartT=null,hd=240;
    heartsFloor.forEach(h=>{ const d=Math.abs(h.x-e.x)+Math.abs(h.y-e.y)*0.5; if(d<hd){hd=d;heartT=h;} });
    const scared=e.p.hp===0;
    let tx = foe?foe.x:W/2;
    if(heartT&&(scared||Math.random()<0.6||!foe)) tx=heartT.x;
    else if(scared&&foe&&Math.abs(foe.x-e.x)<150) tx=e.x-Math.sign(foe.x-e.x)*200;
    else if(box&&Math.random()<0.3) tx=box.x;
    const dx=tx-e.x;
    e.face=dx<0?-1:1;
    e.vxDes=Math.abs(dx)>36?Math.sign(dx)*e.spd*(0.75+Math.random()*0.25):0;
    if(foe){
      const dy=(foe.y-foe.h/2)-(e.y-e.h/2);
      if(dy<-50&&e.onG&&Math.random()<0.5){ e.vy=JUMP; }
      if(dy<-50&&!e.onG&&e.vy>60&&e.jumps>0&&Math.random()<0.6){ e.jumps--; e.vy=JUMP*0.92; }
      if(Math.abs(foe.x-e.x)<54&&Math.abs(dy)<44&&Math.random()<0.65) attack(e);
      if(foe.atkT>0&&Math.abs(foe.x-e.x)<72&&e.onG&&Math.random()<0.45) e.crouchT=0.3;
    }
    if(Math.random()<0.05&&e.onG) e.vy=JUMP;
  }

  let last=performance.now();
  function frame(now){
    const dt0=Math.max(0,Math.min(0.03,(now-last)/1000)); last=now;
    let dt=dt0;
    if(hitstop>0){ hitstop-=dt0; dt=0; } else time+=dt;

    if(!over&&dt>0){
      const me=ents.find(e=>!e.p.bot);
      if(me&&!me.out&&!me.dead&&me.stun<=0){
        const sp=me.spd*(me.buffSpd>0?1.4:1);
        me.vx=0;
        if(K.keys.has('ArrowLeft')||K.keys.has('KeyA')){me.vx=-sp;me.face=-1;}
        if(K.keys.has('ArrowRight')||K.keys.has('KeyD')){me.vx=sp;me.face=1;}
        me.crouch=(K.keys.has('ArrowDown')||K.keys.has('KeyS'))&&me.onG;
        if(me.crouch) me.vx*=0.2;
        if(K.tap('Space')||K.tap('KeyZ')||K.tap('KeyK')){
          if(me.onG){ me.vy=JUMP; SFX.jump(); }
          else if(me.jumps>0){ me.jumps--; me.vy=JUMP*0.92; SFX.jump(); }
        }
        if(K.tap('KeyX')||K.tap('KeyJ')) attack(me);
      }
      ents.forEach(e=>{
        if(e.out) return;
        if(e.dead){ e.respT-=dt; if(e.respT<=0) respawn(e); return; }
        if(e.p.bot){
          e.think-=dt;
          if(e.think<=0&&e.stun<=0) botThink(e);
          e.crouchT=Math.max(0,e.crouchT-dt);
          e.crouch=e.crouchT>0&&e.onG;
          if(e.stun<=0) e.vx=(e.vxDes||0)*(e.crouch?0.2:1);
        }
        e.cd=Math.max(0,e.cd-dt); e.atkT=Math.max(0,e.atkT-dt);
        e.stun=Math.max(0,e.stun-dt); e.inv=Math.max(0,e.inv-dt);
        e.buffSpd=Math.max(0,e.buffSpd-dt);
        const wasG=e.onG;
        physics(e,dt);
        e.landT=Math.max(0,e.landT-dt);
        if(e.onG&&!wasG){ e.landT=0.14; parts.spawn(e.x,e.y,'#c9c2b8',6,100); }
        if(e.onG&&Math.abs(e.vx)>40&&e.stun<=0){
          e.runPh+=dt*12;
          if(Math.random()<dt*5) parts.spawn(e.x-e.face*10,e.y-2,'#a89e90',1,45);
        }
        for(let i=heartsFloor.length-1;i>=0;i--){
          const h=heartsFloor[i];
          if(Math.abs(h.x-e.x)<24&&h.y>e.y-e.h-14&&h.y<e.y+12){
            heartsFloor.splice(i,1); e.p.hp++;
            SFX.coin(); parts.spawn(h.x,h.y,'#ff8a80',8,140);
            hudRefresh();
          }
        }
      });
      heartsFloor.forEach(h=>heartPhysics(h,dt));
      if(!box){ boxTimer-=dt; if(boxTimer<=0){ box={x:220+Math.random()*400,y:-20,vy:0}; } }
      else { box.vy+=800*dt; box.y+=box.vy*dt;
        for(const bi of layout.box){
          const pl=PLATS[bi];
          if(box.y>pl.y-16&&box.y<pl.y+30&&box.x>pl.x&&box.x<pl.x+pl.w){box.y=pl.y-16;box.vy=0;break;}
        }
        if(box.y>H+40){ box=null; boxTimer=7; } }
      // tormenta final
      if(time>DUR-15){
        sudden-=dt;
        if(sudden<=0){
          sudden=2.4;
          living().forEach(e=>{
            e.dmg=Math.min(300,e.dmg+12);
            e.vx=(Math.random()<0.5?-1:1)*(200+e.dmg*4);
            e.vy=-320; e.stun=0.25;
            parts.spawn(e.x,e.y-e.h,'#9ce8ff',10,220);
          });
          SFX.hit(); K.shake(6);
        }
      }
      const me2=ents.find(e=>!e.p.bot);
      // LAST MAN STANDING: la ronda sigue hasta que quede UNO (si caes, ves el final)
      if(time>DUR || active().length<=MIN){ over=true; endTimer=1.3; }
    }
    if(over&&dt0>0){
      endTimer-=dt0;
      if(endTimer<=0){
        const act=active();
        while(heartsFloor.length&&act.length){
          for(const e of act){ if(!heartsFloor.length)break; heartsFloor.pop(); e.p.hp++; }
        }
        hudRefresh();
        cancelAnimationFrame(raf); onEnd(); return;
      }
    }
    koText=Math.max(0,koText-dt0);
    parts.update(dt0);
    draw();
    raf=requestAnimationFrame(frame);
  }

  function draw(){
    ctx.save(); K.applyShake(ctx);
    // fondo: el ARTE del mundo (mismos fondos que TowerFall: Sakura, Neo-Tokyo, Giza…)
    const bd=window.TOWERFALL&&TOWERFALL.backdrops&&TOWERFALL.backdrops[eco];
    if(bd){
      const s=Math.max(W/bd.width,H/bd.height)*1.02, bw=bd.width*s, bh=bd.height*s;
      ctx.drawImage(bd,(W-bw)/2,(H-bh)/2,bw,bh);
      ctx.fillStyle='rgba(6,8,16,.28)'; ctx.fillRect(0,0,W,H);   // sutil: que luzca el arte
    } else scene.bg(ctx,time);
    // lava de Norfair
    if(layout.lava){
      const p=0.6+0.4*Math.sin(time*2.2);
      const lg=ctx.createLinearGradient(0,560,0,640);
      lg.addColorStop(0,'rgba(255,122,42,0)'); lg.addColorStop(1,`rgba(255,150,60,${0.55*p})`);
      ctx.fillStyle=lg; ctx.fillRect(0,560,W,80);
      ctx.fillStyle=`rgba(255,180,80,${0.8*p})`;
      for(let x=0;x<W;x+=26) ctx.fillRect(x,628+Math.sin(time*3+x*0.05)*5,14,12);
    }
    // stages estilo Smash (flotantes)
    PLATS.forEach(pl=>{
      if(pl.main){
        ctx.fillStyle=th.deckTop; ctx.fillRect(pl.x,pl.y,pl.w,6);
        ctx.fillStyle=th.deck; ctx.fillRect(pl.x,pl.y+6,pl.w,pl.h-6);
        // panza angulada estilo Battlefield
        ctx.fillStyle=th.deckDark;
        ctx.beginPath();
        ctx.moveTo(pl.x,pl.y+pl.h); ctx.lineTo(pl.x+pl.w,pl.y+pl.h);
        ctx.lineTo(pl.x+pl.w*0.62,pl.y+pl.h+46); ctx.lineTo(pl.x+pl.w*0.38,pl.y+pl.h+46);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle='rgba(0,0,0,.25)';
        ctx.beginPath();
        ctx.moveTo(pl.x+pl.w*0.5,pl.y+pl.h+46); ctx.lineTo(pl.x+pl.w*0.62,pl.y+pl.h+46);
        ctx.lineTo(pl.x+pl.w*0.56,pl.y+pl.h+110); ctx.lineTo(pl.x+pl.w*0.5,pl.y+pl.h+110);
        ctx.closePath(); ctx.fill();
        // luces de borde
        const p2=0.6+0.4*Math.sin(time*3);
        ctx.fillStyle=`rgba(255,255,255,${0.35*p2})`;
        ctx.fillRect(pl.x,pl.y,5,6); ctx.fillRect(pl.x+pl.w-5,pl.y,5,6);
      } else {
        ctx.fillStyle=th.deckTop; ctx.fillRect(pl.x,pl.y,pl.w,4);
        ctx.fillStyle=th.deck; ctx.fillRect(pl.x,pl.y+4,pl.w,pl.h-4);
        ctx.fillStyle='rgba(255,255,255,.18)';
        ctx.fillRect(pl.x,pl.y,3,pl.h); ctx.fillRect(pl.x+pl.w-3,pl.y,3,pl.h);
      }
      if(layout.lava){ // borde de brasa en Norfair
        const p3=0.6+0.4*Math.sin(time*3+pl.x);
        ctx.fillStyle=`rgba(255,150,60,${0.55*p3})`;
        ctx.fillRect(pl.x,pl.y,pl.w,2);
        ctx.fillRect(pl.x,pl.y+pl.h-1,pl.w,2);
      }
    });
    heartsFloor.forEach(h=>M.drawHeart(ctx,h.x,h.y-8,1.1,time+h.t));
    if(box){
      ctx.save(); ctx.translate(box.x,box.y);
      ctx.rotate(Math.sin(time*3)*0.1);
      ctx.fillStyle='#2e7dd2'; ctx.fillRect(-16,-16,32,32);
      ctx.fillStyle='#5aa4e8'; ctx.fillRect(-16,-16,32,8);
      ctx.fillStyle='#fff'; ctx.font='bold 20px "Space Mono"'; ctx.textAlign='center';
      ctx.fillText('?',0,8); ctx.restore();
    }
    ents.forEach(e=>{
      if(e.out||e.dead) return;
      if(e.onG) M.shadow(ctx,e.x,e.y+2,16);
      if(e.inv>0&&e.stun<=0&&Math.floor(performance.now()/70)%2) return;
      if(e.buffPow){ ctx.fillStyle='rgba(255,138,77,.35)'; ctx.beginPath(); ctx.arc(e.x,e.y-e.h/2,34,0,7); ctx.fill(); }
      if(e.crouch){ ctx.strokeStyle='rgba(156,232,255,.6)'; ctx.lineWidth=3;
        ctx.beginPath(); ctx.arc(e.x,e.y-16,26,0,7); ctx.stroke(); }
      Sprites.drawAnimal(ctx,e.p.animal,e.x,e.y,52*(e.p.animal.size||1),e.face<0,
        {moving:e.onG&&Math.abs(e.vx)>40&&e.stun<=0, run:e.runPh, air:!e.onG, vy:e.vy,
         idle:e.onG&&Math.abs(e.vx)<=40&&e.stun<=0, t:time+e.runPh,
         crouch:e.crouch, land:e.landT/0.14,
         atk:e.atkT/0.13, flash:e.stun>0?Math.min(1,e.stun*4):0,
         spawn:e.inv>1?(e.inv-1):0});
      if(e.atkT>0){
        ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=5;
        ctx.beginPath();
        ctx.arc(e.x+e.face*18,e.y-e.h/2, 26, e.face>0?-1.1:Math.PI-1.1, e.face>0?1.1:Math.PI+1.1);
        ctx.stroke();
      }
      ctx.fillStyle=e.p.color; ctx.font='bold 10px "Space Mono"'; ctx.textAlign='center';
      ctx.strokeStyle='rgba(0,0,0,.6)'; ctx.lineWidth=3;
      const nm=(e.p.bot?e.p.name:'TÚ');   // sin ♥N (la vida se ve en el HUD)
      ctx.strokeText(nm,e.x,e.y-e.h-14); ctx.fillText(nm,e.x,e.y-e.h-14);
      // % de daño chico bajo el nombre
      const hue=Math.max(0,120-e.dmg*1.2);
      ctx.fillStyle=`hsl(${hue},80%,60%)`; ctx.font='bold 9px "Space Mono"';
      ctx.fillText(e.dmg+'%',e.x,e.y+14);
    });
    parts.draw(ctx);
    scene.fx(ctx,time);
    if(koText>0){
      ctx.fillStyle='#fff'; ctx.font='900 72px Archivo, sans-serif'; ctx.textAlign='center';
      ctx.fillText('¡KO!',W/2,H/2-60);
    }
    // timer
    ctx.fillStyle='rgba(20,25,35,.75)'; ctx.fillRect(376,4,80,26);
    ctx.fillStyle=time>DUR-15?'#ff8a80':'#e8f2f8';
    ctx.font='bold 14px "Space Mono"'; ctx.textAlign='center';
    ctx.fillText(Math.max(0,Math.ceil(DUR-time))+'s',416,22);
    if(time>DUR-15){
      ctx.fillStyle='#ff8a80'; ctx.font='bold 13px "Space Mono"';
      ctx.fillText('¡MUERTE SÚBITA!',W/2,48);
    }
    ctx.restore();
  }

  raf=requestAnimationFrame(frame);
  return { stop(){ cancelAnimationFrame(raf); } };
}

window.BROS={ start,
  title:'HEARTS BROS',
  mapNames:{selva:'BATTLEFIELD',desierto:'FINAL DESTINATION',nieve:'DREAMLAND',volcan:'NORFAIR'},
  desc:'Stages de Smash: sácalos del escenario y roba los corazones que sueltan.',
  controls:'FLECHAS / WASD mover · ESPACIO saltar (doble) · X/J golpear · ABAJO bloquear · pega al cubo ?' };
})();
