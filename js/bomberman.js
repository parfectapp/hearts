/* HEARTS MAN — bomberman por ecosistema (selva/desierto/nieve/volcán) */
(function(){
const COLS=13, ROWS=11, TILE=44;
const OX=(832-COLS*TILE)/2, OY=(640-ROWS*TILE)/2;
const WALK_T=0.21; // seg por celda (base)
// celdas: 0 piso, 1 sólido, 2 destructible, 3 pieza central, 4 muro de cierre
const SOLID=v=>v===1||v===3||v===4;

function start(canvas, players, cfg, onEnd, eco){
  const ctx=canvas.getContext('2d');
  const K=window.KIT;
  const KIT=THEMES.bomberKit(eco||'selva');
  const isSelva=!!KIT.torchImg;
  const DUR=cfg.duration||60, MIN=cfg.minAlive||2;
  // ---- mapa ----
  const map=[];
  for(let y=0;y<ROWS;y++){ map.push([]);
    for(let x=0;x<COLS;x++){
      map[y].push((x%2===1&&y%2===1)?1:0);
    }
  }
  // pieza central 3x3 (pirámide/montaña/zigurat/cráter)
  for(let y=4;y<=6;y++)for(let x=5;x<=7;x++) map[y][x]=3;
  const spawns=[[0,0],[COLS-1,0],[0,ROWS-1],[COLS-1,ROWS-1],[6,0],[6,ROWS-1],[0,5],[COLS-1,5]].slice(0,players.length);
  const safe=new Set();
  spawns.forEach(([sx,sy])=>{
    safe.add(sx+','+sy);
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{
      const nx=sx+dx, ny=sy+dy;
      if(nx>=0&&nx<COLS&&ny>=0&&ny<ROWS) safe.add(nx+','+ny);
    });
  });
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    if(map[y][x]===0 && !safe.has(x+','+y) && Math.random()<0.62) map[y][x]=2;
  }
  // decor: calaveras (solo selva, arte de André)
  const skulls=[];
  while(isSelva&&skulls.length<3){
    const x=1+Math.floor(Math.random()*(COLS-2)), y=1+Math.floor(Math.random()*(ROWS-2));
    if(map[y][x]===0&&!safe.has(x+','+y)) skulls.push([x,y]);
  }

  // ---- entidades ----
  const ents=players.map((p,i)=>{
    const st=p.animal.stats;
    p.koRound=false;
    return { p, gx:spawns[i][0], gy:spawns[i][1], fx:spawns[i][0], fy:spawns[i][1],
      moving:false, tx:0, ty:0, t:0, dir:1, seed:i*1.9,
      speed:1+ (st.vel-5)*0.06, bombN:1, range:2, bombsOut:0,
      shield:false, out:false, dead:false, respT:0, inv:1.2,
      think:Math.random()*0.3, spawnT:0.7 };
  });
  const heartCells=[];
  const bombs=[], blasts=[], pups=[], parts=K.particles();
  let time=0, over=false, endTimer=0, shrinkIdx=0, shrinkT=0, raf=null;
  const SHRINK_AT=DUR-25;
  const active=()=>ents.filter(e=>!e.out);
  function hudRefresh(){ K.updateHudPlayers(players, p=>!p.koRound); }
  // suelta n corazones en celdas libres alrededor de (gx,gy)
  function dropHearts(gx,gy,n){
    const seen=new Set(), q=[[gx,gy]], cells=[];
    while(q.length&&cells.length<n){
      const [x,y]=q.shift();
      const k=x+','+y;
      if(seen.has(k))continue; seen.add(k);
      if(x<0||x>=COLS||y<0||y>=ROWS)continue;
      if(map[y][x]===0&&!heartCells.some(h=>h.x===x&&h.y===y)) cells.push([x,y]);
      [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]].forEach(([dx,dy])=>q.push([x+dx,y+dy]));
    }
    cells.forEach(([x,y])=>heartCells.push({x,y,t:Math.random()*6}));
  }

  // espiral de cierre
  const spiral=[];
  { let l=0,r=COLS-1,t=0,b=ROWS-1;
    while(l<=r&&t<=b){
      for(let x=l;x<=r;x++)spiral.push([x,t]);
      for(let y=t+1;y<=b;y++)spiral.push([r,y]);
      for(let x=r-1;x>=l;x--)spiral.push([x,b]);
      for(let y=b-1;y>t;y--)spiral.push([l,y]);
      l++;r--;t++;b--;
    }
  }

  const cellBomb=(x,y)=>bombs.find(b=>b.gx===x&&b.gy===y);
  function walkable(x,y,ent){
    if(x<0||x>=COLS||y<0||y>=ROWS) return false;
    if(map[y][x]!==0) return false;
    const b=cellBomb(x,y);
    if(b && !(ent&&b.under===ent)) return false;
    return true;
  }

  // ---- bombas ----
  function placeBomb(e){
    if(e.bombsOut>=e.bombN || cellBomb(e.gx,e.gy)) return;
    bombs.push({gx:e.gx,gy:e.gy,t:2.1,range:e.range,owner:e,under:e});
    e.bombsOut++; SFX.bomb();
  }
  function explode(b){
    bombs.splice(bombs.indexOf(b),1);
    b.owner.bombsOut=Math.max(0,b.owner.bombsOut-1);
    const cells=[[b.gx,b.gy]];
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{
      for(let i=1;i<=b.range;i++){
        const x=b.gx+dx*i, y=b.gy+dy*i;
        if(x<0||x>=COLS||y<0||y>=ROWS) break;
        if(SOLID(map[y][x])) break;
        cells.push([x,y]);
        if(map[y][x]===2){
          map[y][x]=0;
          if(Math.random()<0.32){
            const types=['range','speed','bomb','shield'];
            pups.push({x,y,type:types[Math.floor(Math.random()*types.length)]});
          }
          break;
        }
        const ob=cellBomb(x,y);
        if(ob){ ob.t=Math.min(ob.t,0.06); break; }
      }
    });
    blasts.push({cells,t:0.42});
    cells.forEach(([x,y])=>parts.spawn(OX+(x+.5)*TILE,OY+(y+.5)*TILE,'#ffd34d',8,190));
    SFX.boom(); K.shake(8);
  }
  function inBlast(x,y){
    return blasts.some(bl=>bl.t>0.08 && bl.cells.some(([cx,cy])=>cx===x&&cy===y));
  }

  // ---- peligro / IA ----
  function dangerMap(){
    const d=new Set();
    bombs.forEach(b=>{
      d.add(b.gx+','+b.gy);
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{
        for(let i=1;i<=b.range;i++){
          const x=b.gx+dx*i,y=b.gy+dy*i;
          if(x<0||x>=COLS||y<0||y>=ROWS||SOLID(map[y][x])) break;
          d.add(x+','+y);
          if(map[y][x]===2) break;
        }
      });
    });
    blasts.forEach(bl=>bl.cells.forEach(([x,y])=>d.add(x+','+y)));
    return d;
  }
  function bfs(sx,sy,goal,ent,avoid){
    const prev={}, q=[[sx,sy]], seen=new Set([sx+','+sy]);
    while(q.length){
      const [x,y]=q.shift();
      if(goal(x,y)&&!(x===sx&&y===sy)){
        let cx=x,cy=y;
        while(prev[cx+','+cy] && !(prev[cx+','+cy][0]===sx&&prev[cx+','+cy][1]===sy)){
          [cx,cy]=prev[cx+','+cy];
        }
        return [cx-sx,cy-sy];
      }
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx,ny=y+dy,k=nx+','+ny;
        if(seen.has(k)||!walkable(nx,ny,ent)) continue;
        if(avoid&&avoid.has(k)) continue;
        seen.add(k); prev[k]=[x,y]; q.push([nx,ny]);
      }
    }
    return null;
  }
  function botThink(e,danger){
    const here=e.gx+','+e.gy;
    if(danger.has(here)){
      let step=bfs(e.gx,e.gy,(x,y)=>!danger.has(x+','+y),e,danger)
            || bfs(e.gx,e.gy,(x,y)=>!danger.has(x+','+y),e,null);
      if(step) return {move:step};
      return {move:null};
    }
    const enemies=ents.filter(o=>o!==e&&!o.out&&!o.dead);
    const nearEnemy=enemies.some(o=>Math.abs(o.gx-e.gx)+Math.abs(o.gy-e.gy)<=2);
    const nearCrate=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{
      const x=e.gx+dx,y=e.gy+dy; return x>=0&&x<COLS&&y>=0&&y<ROWS&&map[y][x]===2;
    });
    if(e.p.hp>0 && e.bombsOut<e.bombN && (nearEnemy||nearCrate) && Math.random()<0.75){
      const simDanger=new Set(danger);
      simDanger.add(e.gx+','+e.gy);
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{
        for(let i=1;i<=e.range;i++){
          const x=e.gx+dx*i,y=e.gy+dy*i;
          if(x<0||x>=COLS||y<0||y>=ROWS||map[y][x]!==0) break;
          simDanger.add(x+','+y);
        }
      });
      const esc=bfs(e.gx,e.gy,(x,y)=>!simDanger.has(x+','+y),e,null);
      if(esc) return {bomb:true, move:esc};
    }
    let step=bfs(e.gx,e.gy,(x,y)=>heartCells.some(h=>h.x===x&&h.y===y),e,danger);
    if(!step) step=bfs(e.gx,e.gy,(x,y)=>pups.some(p=>p.x===x&&p.y===y),e,danger);
    if(!step && enemies.length){
      const tg=enemies[0];
      step=bfs(e.gx,e.gy,(x,y)=>Math.abs(x-tg.gx)+Math.abs(y-tg.gy)<=1,e,danger);
    }
    if(!step){
      const dirs=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>walkable(e.gx+dx,e.gy+dy,e)&&!danger.has((e.gx+dx)+','+(e.gy+dy)));
      if(dirs.length) step=dirs[Math.floor(Math.random()*dirs.length)];
    }
    return {move:step};
  }

  // ---- muerte: suelta TODOS tus corazones ----
  function kill(e){
    if(e.out||e.dead||e.inv>0) return;
    if(e.shield){ e.shield=false; SFX.hit(); parts.spawn(OX+(e.fx+.5)*TILE,OY+(e.fy+.5)*TILE,'#7de8ff',14,220); return; }
    parts.spawn(OX+(e.fx+.5)*TILE,OY+(e.fy+.5)*TILE,'#ff5a4d',22,260);
    SFX.ko(); K.shake(10);
    // UNA sola vida: mueres = fuera hasta la siguiente ronda (igual que TowerFall/Showdown,
    // sin respawn). Sueltas 1 ♥ como los demás modos.
    if(e.p.hp>0){ e.p.hp--; dropHearts(Math.round(e.fx),Math.round(e.fy),1); }
    e.out=true; e.p.koRound=true; e.moving=false; SFX.die();
    hudRefresh();
  }
  function respawn(e){
    const opts=spawns.filter(([x,y])=>walkable(x,y,null));
    const [sx,sy]=opts.length?opts[Math.floor(Math.random()*opts.length)]:[6,5];
    e.gx=sx; e.gy=sy; e.fx=sx; e.fy=sy; e.moving=false; e.dead=false;
    e.inv=1.5; e.spawnT=0.7;
  }

  // ---- loop ----
  let last=performance.now();
  function frame(now){
    const dt=Math.max(0,Math.min(0.033,(now-last)/1000)); last=now; time+=dt;

    if(!over){
      const me=ents.find(e=>!e.p.bot);
      if(me&&!me.out&&!me.dead){
        if(!me.moving){
          let d=null;
          if(K.keys.has('ArrowLeft')||K.keys.has('KeyA'))d=[-1,0];
          else if(K.keys.has('ArrowRight')||K.keys.has('KeyD'))d=[1,0];
          else if(K.keys.has('ArrowUp')||K.keys.has('KeyW'))d=[0,-1];
          else if(K.keys.has('ArrowDown')||K.keys.has('KeyS'))d=[0,1];
          if(d&&walkable(me.gx+d[0],me.gy+d[1],me)) startMove(me,d);
        }
        if(K.tap('Space')||K.tap('KeyZ')||K.tap('KeyJ')) placeBomb(me);
      }
      const danger=dangerMap();
      ents.forEach(e=>{
        if(e.out||e.dead||!e.p.bot) return;
        e.think-=dt;
        if(!e.moving&&e.think<=0){
          e.think=0.12+Math.random()*0.1;
          const act=botThink(e,danger);
          if(act.bomb) placeBomb(e);
          if(act.move&&walkable(e.gx+act.move[0],e.gy+act.move[1],e)) startMove(e,act.move);
        }
      });
      ents.forEach(e=>{
        e.spawnT=Math.max(0,e.spawnT-dt);
        if(e.out) return;
        e.inv=Math.max(0,e.inv-dt);
        if(e.dead){ e.respT-=dt; if(e.respT<=0) respawn(e); return; }
        if(!e.moving) return;
        e.t+=dt/(WALK_T/e.speed);
        if(e.t>=1){
          e.moving=false; e.gx=e.tx; e.gy=e.ty; e.fx=e.gx; e.fy=e.gy;
          const hi=heartCells.findIndex(h=>h.x===e.gx&&h.y===e.gy);
          if(hi>=0){
            heartCells.splice(hi,1); e.p.hp++;
            SFX.coin(); parts.spawn(OX+(e.gx+.5)*TILE,OY+(e.gy+.5)*TILE,'#ff8a80',8,150);
            hudRefresh();
          }
          const pi=pups.findIndex(p=>p.x===e.gx&&p.y===e.gy);
          if(pi>=0){
            const p=pups.splice(pi,1)[0];
            if(p.type==='range')e.range=Math.min(6,e.range+1);
            if(p.type==='speed')e.speed=Math.min(1.8,e.speed+0.15);
            if(p.type==='bomb')e.bombN=Math.min(4,e.bombN+1);
            if(p.type==='shield')e.shield=true;
            SFX.powerup();
            parts.spawn(OX+(e.gx+.5)*TILE,OY+(e.gy+.5)*TILE,'#9dff8a',10,180);
          }
        } else {
          e.fx=e.gx+(e.tx-e.gx)*e.t; e.fy=e.gy+(e.ty-e.gy)*e.t;
        }
      });
      for(let i=bombs.length-1;i>=0;i--){
        const b=bombs[i]; b.t-=dt;
        if(b.under && (b.under.gx!==b.gx||b.under.gy!==b.gy)) b.under=null;
        if(b.t<=0) explode(b);
      }
      for(let i=blasts.length-1;i>=0;i--){ blasts[i].t-=dt; if(blasts[i].t<=0)blasts.splice(i,1); }
      ents.forEach(e=>{
        if(e.out||e.dead) return;
        const cx=Math.round(e.fx), cy=Math.round(e.fy);
        if(inBlast(cx,cy)) kill(e);
      });
      if(time>SHRINK_AT && shrinkIdx<spiral.length-9){
        shrinkT-=dt;
        if(shrinkT<=0){
          shrinkT=0.32;
          const [x,y]=spiral[shrinkIdx++];
          if(map[y][x]!==3){
            map[y][x]=4;
            const bi=bombs.findIndex(b=>b.gx===x&&b.gy===y); if(bi>=0)bombs.splice(bi,1);
            const pi=pups.findIndex(p=>p.x===x&&p.y===y); if(pi>=0)pups.splice(pi,1);
            ents.forEach(e=>{ if(!e.out&&!e.dead&&Math.round(e.fx)===x&&Math.round(e.fy)===y){e.shield=false;e.inv=0;kill(e);} });
            const hI=heartCells.findIndex(h=>h.x===x&&h.y===y); if(hI>=0)heartCells.splice(hI,1);
            parts.spawn(OX+(x+.5)*TILE,OY+(y+.5)*TILE,'#bcd6e8',6,120);
          }
        }
      }
      if(time>DUR || active().length<=MIN || (me&&me.out)){
        over=true; endTimer=1.1;
      }
    } else {
      endTimer-=dt;
      if(endTimer<=0){
        const act=active();
        while(heartCells.length&&act.length){
          for(const e of act){ if(!heartCells.length)break; heartCells.pop(); e.p.hp++; }
        }
        hudRefresh();
        cancelAnimationFrame(raf);
        onEnd();
        return;
      }
    }

    parts.update(dt);
    draw();
    raf=requestAnimationFrame(frame);
  }
  function startMove(e,d){
    e.moving=true; e.t=0; e.tx=e.gx+d[0]; e.ty=e.gy+d[1];
    e.dir=d[0]!==0?d[0]:e.dir;
  }

  // ---- render con el kit del ecosistema ----
  const M=window.MAPART, MI=M.img;
  const hashCell=(x,y,n)=>((x*7+y*13+((x*x+y)|0))%n+n)%n;
  const pick=(arr,x,y)=>arr[hashCell(x,y,arr.length)];
  function drawTile(im,px,py,w,h){ if(im) ctx.drawImage(im,px,py,w||TILE,h||TILE); }
  function drawEnt(e){
    if(e.out||e.dead) return;
    const px=OX+(e.fx+.5)*TILE, py=OY+(e.fy+1)*TILE-4;
    M.shadow(ctx,px,py-2,16);
    if(e.shield){ ctx.strokeStyle='rgba(157,255,138,.8)'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.arc(px,py-24,28,0,7); ctx.stroke(); }
    const pose=e.moving?{moving:true,run:time*13+e.seed}:{idle:true,t:time+e.seed};
    if(e.spawnT>0) pose.spawn=e.spawnT/0.7;
    Sprites.drawAnimal(ctx,e.p.animal,px,py,50*(e.p.animal.size||1),e.dir<0,pose);
    ctx.fillStyle=e.p.color; ctx.font='bold 10px "Space Mono"'; ctx.textAlign='center';
    ctx.strokeStyle='rgba(0,0,0,.6)'; ctx.lineWidth=3;
    const nm=(e.p.bot?e.p.name:'TÚ');   // sin ♥N (la vida se ve en el HUD)
    ctx.strokeText(nm,px,py-52); ctx.fillText(nm,px,py-52);
  }
  function drawBomb(b){
    const px=OX+(b.gx+.5)*TILE, py=OY+(b.gy+.5)*TILE;
    const pulse=1+Math.sin((2.1-b.t)*14)*0.08;
    const s=40*pulse;
    M.shadow(ctx,px,py+14,13);
    drawTile(MI.bomb,px-s/2,py-s/2,s,s);
    if(Math.floor(time*10)%2){ ctx.fillStyle='#ffd34d'; ctx.fillRect(px+7,py-22,5,5); }
  }
  function drawBlastCells(bl,filter){
    const a=Math.min(1,bl.t/0.42);
    const grow=1.15+(1-a)*0.35;
    bl.cells.forEach(([x,y],i)=>{
      if(!filter(y)) return;
      const px=OX+(x+.5)*TILE, py=OY+(y+.5)*TILE;
      ctx.save();
      ctx.globalAlpha=a;
      ctx.globalCompositeOperation='lighter';
      ctx.translate(px,py);
      ctx.rotate(((x*3+y*5)%4)*Math.PI/2);
      const s=TILE*(i===0?grow*1.35:grow);
      if(MI.boom) ctx.drawImage(MI.boom,-s/2,-s/2,s,s);
      ctx.restore();
    });
  }
  function drawTorch(tx,ty,i){
    if(KIT.torchImg) drawTile(KIT.torchImg,tx-15,ty-21,30,42);
    else{
      ctx.fillStyle=KIT.th.deckDark; ctx.fillRect(tx-2,ty-10,5,20);
      ctx.fillStyle=KIT.glow; ctx.fillRect(tx-4,ty-18,9,9);
      ctx.fillStyle='#fff'; ctx.globalAlpha=.7; ctx.fillRect(tx-1,ty-16,3,4); ctx.globalAlpha=1;
    }
    const f=0.75+0.25*Math.sin(time*9+i*2.7);
    const g=ctx.createRadialGradient(tx,ty-12,2,tx,ty-12,30*f);
    g.addColorStop(0,KIT.glow+'66'); g.addColorStop(1,KIT.glow+'00');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(tx,ty-12,30*f,0,7); ctx.fill();
  }
  function draw(){
    ctx.save();
    K.applyShake(ctx);
    // exterior en piedra oscura
    if(KIT.corner){
      for(let px=0;px<832;px+=TILE)for(let py=0;py<640;py+=TILE) ctx.drawImage(KIT.corner,px,py,TILE,TILE);
      ctx.fillStyle='rgba(6,10,14,.55)'; ctx.fillRect(0,0,832,640);
    } else { ctx.fillStyle='#22282e'; ctx.fillRect(0,0,832,640); }
    // marco
    const FW=TILE;
    drawTile(KIT.frameH,OX,OY-FW,COLS*TILE,FW);
    drawTile(KIT.frameH,OX,OY+ROWS*TILE,COLS*TILE,FW);
    drawTile(KIT.frameV,OX-FW,OY,FW,ROWS*TILE);
    drawTile(KIT.frameV,OX+COLS*TILE,OY,FW,ROWS*TILE);
    drawTile(KIT.corner,OX-FW,OY-FW,FW,FW);
    drawTile(KIT.corner,OX+COLS*TILE,OY-FW,FW,FW);
    drawTile(KIT.corner,OX-FW,OY+ROWS*TILE,FW,FW);
    drawTile(KIT.corner,OX+COLS*TILE,OY+ROWS*TILE,FW,FW);
    if(KIT.gold){
      drawTile(KIT.gold,OX+COLS*TILE/2-51,OY-FW,102,FW);
      drawTile(KIT.gold,OX+COLS*TILE/2-51,OY+ROWS*TILE,102,FW);
    }
    // celdas
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
      const px=OX+x*TILE, py=OY+y*TILE;
      drawTile(pick((x+y)%2?KIT.floorB:KIT.floorA,x,y),px,py);
      if(map[y][x]===1){
        drawTile(pick(KIT.solid,x,y),px,py-6,TILE,TILE+6);
      } else if(map[y][x]===2){
        drawTile(pick(KIT.crate,x,y),px,py);
      } else if(map[y][x]===4){
        drawTile(KIT.corner,px,py);
        ctx.fillStyle='rgba(10,14,20,.28)'; ctx.fillRect(px,py,TILE,TILE);
      }
    }
    skulls.forEach(([x,y])=>{ if(map[y][x]===0) drawTile(MI.skull,OX+x*TILE+5,OY+y*TILE+5,34,32); });
    // antorchas
    [[OX+2.5*TILE,OY-FW/2],[OX+10.5*TILE,OY-FW/2],[OX+2.5*TILE,OY+ROWS*TILE+FW/2],[OX+10.5*TILE,OY+ROWS*TILE+FW/2]]
      .forEach(([tx,ty],i)=>drawTorch(tx,ty,i));
    // powerups
    pups.forEach(p=>{
      const px=OX+p.x*TILE, py=OY+p.y*TILE;
      const bob=Math.sin(time*5+p.x)*3;
      M.shadow(ctx,px+TILE/2,py+TILE-6,12);
      drawTile(MI.crate,px+6,py+4+bob,TILE-12,TILE-12);
      ctx.fillStyle='#fff'; ctx.font='bold 13px "Space Mono"'; ctx.textAlign='center';
      ctx.strokeStyle='rgba(0,0,0,.7)'; ctx.lineWidth=3;
      const ch={range:'R',speed:'S',bomb:'B',shield:'♥'}[p.type];
      ctx.strokeText(ch,px+TILE/2,py+TILE/2+3+bob); ctx.fillText(ch,px+TILE/2,py+TILE/2+3+bob);
    });
    // corazones sueltos en el tablero
    heartCells.forEach(h=>M.drawHeart(ctx,OX+(h.x+.5)*TILE,OY+(h.y+.5)*TILE,1.15,time+h.t));
    // capa detrás de la pieza central
    const sorted=ents.filter(e=>!e.out&&!e.dead).sort((a,b)=>a.fy-b.fy);
    bombs.filter(b=>b.gy<3.5).forEach(drawBomb);
    sorted.filter(e=>e.fy<3.5).forEach(drawEnt);
    blasts.forEach(bl=>drawBlastCells(bl,y=>y<3.5));
    // PIEZA CENTRAL del ecosistema
    const pcx=OX+6.5*TILE, pby=OY+7*TILE+3;
    M.shadow(ctx,pcx,pby-4,92);
    KIT.center(ctx,pcx,pby,time);
    // capa delante
    bombs.filter(b=>b.gy>=3.5).forEach(drawBomb);
    sorted.filter(e=>e.fy>=3.5).forEach(drawEnt);
    blasts.forEach(bl=>drawBlastCells(bl,y=>y>=3.5));
    parts.draw(ctx);
    M.vignette(ctx,832,640);
    // timer
    ctx.fillStyle='rgba(20,25,35,.75)'; ctx.fillRect(376,4,80,26);
    ctx.fillStyle=time>SHRINK_AT?'#ff8a80':'#e8f2f8';
    ctx.font='bold 14px "Space Mono"'; ctx.textAlign='center';
    ctx.fillText(Math.max(0,Math.ceil(DUR-time))+'s',416,22);
    ctx.restore();
  }

  raf=requestAnimationFrame(frame);
  return { stop(){ cancelAnimationFrame(raf); } };
}

window.BOMBERMAN={ start,
  title:'HEARTS MAN',
  mapNames:{selva:'JUNGLE ZONE',desierto:'DESERT ZONE',nieve:'BLIZZARD ZONE',volcan:'MAGMA ZONE'},
  desc:'Vuela rivales: sueltan TODOS sus corazones en el piso. ¡El muro se cierra!',
  controls:'FLECHAS / WASD mover · ESPACIO poner bomba · R rango · S velocidad · B +bomba · ♥ escudo' };
})();
