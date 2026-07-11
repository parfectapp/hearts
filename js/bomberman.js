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
  const isSelva=false;   // tablero SBR limpio: sin calaveras ni antorchas
  const DUR=cfg.duration||60, MIN=cfg.minAlive||2;
  // ---- mapa ----
  const map=[];
  for(let y=0;y<ROWS;y++){ map.push([]);
    for(let x=0;x<COLS;x++){
      map[y].push((x%2===1&&y%2===1)?1:0);
    }
  }
  // (sin muro central: el tablero clásico de Bomberman deja el centro LIBRE —
  //  solo los pilares fijos en (impar,impar). El "muro en medio" estorbaba las bombas.)
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
    // en la celda donde el jugador ESTÁ (si va a medio paso, la más cercana a su posición visual)
    const gx=e.moving?Math.round(e.fx):e.gx, gy=e.moving?Math.round(e.fy):e.gy;
    if(gx<0||gx>=COLS||gy<0||gy>=ROWS||map[gy][gx]!==0) return;
    if(e.bombsOut>=e.bombN || cellBomb(gx,gy)) return;
    bombs.push({gx,gy,t:2.1,range:e.range,owner:e,under:e});
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
          // ÚNICO power-up: la "P" — bombas INFINITAS + fuego de alcance 3
          if(Math.random()<0.30) pups.push({x,y,type:'P'});
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
            pups.splice(pi,1);
            e.bombN=99; e.range=3;                 // "P": bombas INFINITAS + fuego de 3
            SFX.powerup();
            parts.spawn(OX+(e.gx+.5)*TILE,OY+(e.gy+.5)*TILE,'#9dff8a',12,200);
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
            // al tragar una bomba, LIBERA el contador de su dueño (si no, no podía volver a poner bombas)
            const bi=bombs.findIndex(b=>b.gx===x&&b.gy===y);
            if(bi>=0){ const sb=bombs[bi]; if(sb.owner) sb.owner.bombsOut=Math.max(0,sb.owner.bombsOut-1); bombs.splice(bi,1); }
            const pi=pups.findIndex(p=>p.x===x&&p.y===y); if(pi>=0)pups.splice(pi,1);
            // mata a quien esté EN la celda O yendo HACIA ella (si no, quedaba incrustado dentro del muro)
            ents.forEach(e=>{ if(e.out||e.dead) return;
              const onIt=Math.round(e.fx)===x&&Math.round(e.fy)===y;
              const intoIt=e.moving&&e.tx===x&&e.ty===y;
              if(onIt||intoIt){ e.shield=false; e.inv=0; e.moving=false; e.gx=Math.round(e.fx); e.gy=Math.round(e.fy); kill(e); } });
            const hI=heartCells.findIndex(h=>h.x===x&&h.y===y); if(hI>=0)heartCells.splice(hI,1);
            parts.spawn(OX+(x+.5)*TILE,OY+(y+.5)*TILE,'#bcd6e8',6,120);
          }
        }
      }
      // LAST MAN STANDING: la ronda sigue hasta que quede UNO (si caes, ves el final)
      if(time>DUR || active().length<=MIN){
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
    const pulse=1+Math.sin((2.1-b.t)*14)*0.09;                 // late más rápido cuando va a estallar
    const r=15*pulse;
    M.shadow(ctx,px,py+15,14);
    // cuerpo negro esférico (procedural — la imagen vieja traía una "pared" pegada)
    const g=ctx.createRadialGradient(px-r*0.35,py-r*0.4,r*0.2, px,py,r);
    g.addColorStop(0,'#5a5f68'); g.addColorStop(0.5,'#23262c'); g.addColorStop(1,'#0d0f13');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(px,py,r,0,7); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(px-r*0.35,py-r*0.4,r*0.22,0,7); ctx.fill();  // brillo
    // tapa metálica arriba
    ctx.fillStyle='#3a3f47'; ctx.fillRect(px-4,py-r-4,8,5);
    // mecha curva con chispa que titila
    ctx.strokeStyle='#caa46a'; ctx.lineWidth=3; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(px+1,py-r-3);
    ctx.quadraticCurveTo(px+10,py-r-11, px+7+Math.sin(time*12)*2, py-r-16);
    ctx.stroke();
    const sf=0.6+0.4*Math.sin(time*22);
    ctx.fillStyle='#ffd34d'; ctx.globalAlpha=sf;
    ctx.beginPath(); ctx.arc(px+7,py-r-17,3.4+sf*1.6,0,7); ctx.fill();
    ctx.fillStyle='#fff7cc'; ctx.beginPath(); ctx.arc(px+7,py-r-17,1.6,0,7); ctx.fill();
    ctx.globalAlpha=1;
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
    // exterior: el ARTE del mundo (mismos fondos que TowerFall: Sakura, Neo-Tokyo, Giza…)
    const bd=window.TOWERFALL&&TOWERFALL.backdrops&&TOWERFALL.backdrops[eco];
    if(bd){
      const s=Math.max(832/bd.width,640/bd.height)*1.02, bw=bd.width*s, bh=bd.height*s;
      ctx.drawImage(bd,(832-bw)/2,(640-bh)/2,bw,bh);
      ctx.fillStyle='rgba(6,8,16,.45)'; ctx.fillRect(0,0,832,640);   // oscurece para que el tablero LEA
    } else if(KIT.corner){
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
    // REMACHES del marco de acero (estilo Super Bomberman R)
    { const rivet=(rx,ry)=>{ ctx.beginPath(); ctx.arc(rx,ry,4,0,7); ctx.fillStyle='#69727e'; ctx.fill();
        ctx.beginPath(); ctx.arc(rx-1,ry-1.2,1.8,0,7); ctx.fillStyle='#e4e8ee'; ctx.fill(); };
      const by0=OY-FW/2, by1=OY+ROWS*TILE+FW/2, bx0=OX-FW/2, bx1=OX+COLS*TILE+FW/2;
      for(let x=0;x<=COLS;x++){ rivet(OX+x*TILE, by0); rivet(OX+x*TILE, by1); }
      for(let y=0;y<=ROWS;y++){ rivet(bx0, OY+y*TILE); rivet(bx1, OY+y*TILE); }
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
    // (SBR: sin calaveras ni antorchas — tablero limpio)
    // power-up ÚNICO: la "P" (bombas infinitas + fuego 3) — cápsula dorada que flota y brilla
    pups.forEach(p=>{
      const cx=OX+(p.x+.5)*TILE, cy=OY+(p.y+.5)*TILE+Math.sin(time*5+p.x)*3;
      const pu=0.6+0.4*Math.sin(time*6+p.x);
      M.shadow(ctx,cx,OY+p.y*TILE+TILE-6,12);
      const g=ctx.createRadialGradient(cx,cy,2,cx,cy,20);
      g.addColorStop(0,`rgba(255,211,77,${0.5*pu})`); g.addColorStop(1,'rgba(255,211,77,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,20,0,7); ctx.fill();
      ctx.fillStyle='#f5a623'; ctx.beginPath(); ctx.arc(cx,cy,13,0,7); ctx.fill();
      ctx.fillStyle='#ffd34d'; ctx.beginPath(); ctx.arc(cx,cy-1,11,0,7); ctx.fill();
      ctx.fillStyle='#7a4a08'; ctx.font='bold 15px "Archivo Black","Space Mono"'; ctx.textAlign='center';
      ctx.fillText('P',cx,cy+5);
    });
    // corazones sueltos en el tablero
    heartCells.forEach(h=>M.drawHeart(ctx,OX+(h.x+.5)*TILE,OY+(h.y+.5)*TILE,1.15,time+h.t));
    // PROFUNDIDAD CORRECTA: bombas y monitos se ordenan JUNTOS por su fila Y
    // (antes se partían en 2 pasadas por una línea fija → la bomba salía delante/detrás de quien no debía)
    const drawables=[];
    ents.filter(e=>!e.out&&!e.dead).forEach(e=>drawables.push({y:e.fy+0.5, z:1, d:()=>drawEnt(e)}));
    bombs.forEach(b=>drawables.push({y:b.gy+0.5, z:0, d:()=>drawBomb(b)}));   // la bomba, en su celda, detrás del que está en la misma fila
    drawables.sort((a,b)=>(a.y-b.y)||(a.z-b.z));
    drawables.forEach(o=>o.d());
    blasts.forEach(bl=>drawBlastCells(bl,()=>true));   // el fuego siempre encima
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
