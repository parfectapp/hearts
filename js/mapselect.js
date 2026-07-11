// ============================================================
// 🗺️ SELECTOR DE MAPA — reemplaza la ruleta: muestra un MAPA DEL MUNDO
// con las 9 arenas como islas; el azar SALTA entre ellas (desacelerando),
// CAE en una y hace ZOOM hacia ese mapa → arranca la ronda ahí.
// ============================================================
(function(){
const $=s=>document.querySelector(s);
const META={selva:['🌿','SELVA'],desierto:['🏜️','DESIERTO'],nieve:['❄️','NIEVE'],volcan:['🌋','VOLCÁN'],
  japon:['🌸','SAKURA'],tokyo:['🌃','NEO-TOKYO'],egipto:['🐫','GIZA'],grecia:['🏛️','OLIMPO'],china:['🐉','DRAGÓN'],
  submarino:['🐠','ABISMO'],espacio:['🪐','COSMOS'],pantano:['🧪','CIÉNAGA']};
// disposición tipo mapa-mundo (4×3 con jitter suave)
const GRID=[['nieve','egipto','japon'],['grecia','volcan','tokyo'],['selva','desierto','china'],['submarino','espacio','pantano']];
const ROWS=GRID.length, COLS=3, R=42;
const CW=720, CH=110+ROWS*112;
const POS={};
(function(){ const mx=150,my=66,gx=(CW-2*mx)/(COLS-1),gy=(CH-2*my)/(ROWS-1);
  const jt=[[6,-4],[-5,5],[4,6],[-6,-3],[0,0],[6,-5],[-4,7],[5,-6],[-6,4],[5,4],[-6,-4],[4,-6]];
  let k=0; for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){ const j=jt[k++%jt.length]; POS[GRID[r][c]]=[mx+c*gx+j[0], my+r*gy+j[1]]; } })();
const imgs={};
function load(e){ if(!imgs[e]){ const im=new Image(); im.src='assets/maps/'+e+'.png?v=4'; imgs[e]=im; } return imgs[e]; }
const tick=()=>{ if(window.SFX){ if(SFX.tick)SFX.tick(); else if(SFX.count)SFX.count(); } };

function draw(ctx, ecos, hi){
  ctx.clearRect(0,0,CW,CH);
  const og=ctx.createLinearGradient(0,0,0,CH); og.addColorStop(0,'#134079'); og.addColorStop(1,'#081c40');
  ctx.fillStyle=og; ctx.fillRect(0,0,CW,CH);
  ctx.strokeStyle='rgba(255,255,255,.045)'; ctx.lineWidth=1;                       // olas
  for(let y=18;y<CH;y+=24){ ctx.beginPath(); for(let x=0;x<=CW;x+=10){ ctx.lineTo(x, y+Math.sin((x+y)/20)*3); } ctx.stroke(); }
  ctx.strokeStyle='rgba(255,235,150,.22)'; ctx.setLineDash([3,7]); ctx.lineWidth=2.5;   // rutas punteadas
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){ const a=POS[GRID[r][c]];
    if(c<COLS-1){ const b=POS[GRID[r][c+1]]; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); }
    if(r<ROWS-1){ const b=POS[GRID[r+1][c]]; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); } }
  ctx.setLineDash([]);
  ecos.forEach((e,i)=>{ const p=POS[e]; if(!p) return; const x=p[0],y=p[1], sel=(i===hi);
    ctx.beginPath(); ctx.ellipse(x,y+R*0.86,R*0.92,R*0.28,0,0,7); ctx.fillStyle='rgba(0,0,0,.30)'; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(x,y,R,0,7); ctx.clip();
    const im=imgs[e]; if(im&&im.complete&&im.naturalWidth){ const s=Math.max(2*R/im.width,2*R/im.height);
      ctx.drawImage(im,x-im.width*s/2,y-im.height*s/2,im.width*s,im.height*s); }
    else { ctx.fillStyle='#20482a'; ctx.fillRect(x-R,y-R,2*R,2*R); }
    ctx.restore();
    if(sel){ ctx.beginPath(); ctx.arc(x,y,R+7,0,7); ctx.lineWidth=3; ctx.strokeStyle='rgba(255,211,77,.55)'; ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x,y,R,0,7); ctx.lineWidth=sel?6:4; ctx.strokeStyle=sel?'#ffd34d':'rgba(255,255,255,.55)'; ctx.stroke();
    ctx.font='900 12px "Space Mono",monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.lineWidth=3; ctx.strokeStyle='rgba(0,0,0,.75)'; ctx.fillStyle=sel?'#ffd34d':'#eaf2ff';
    ctx.strokeText(META[e][1],x,y+R+13); ctx.fillText(META[e][1],x,y+R+13);
  });
}

// pick(ecos, winner, opts) → Promise (resuelve tras el zoom)
function pick(ecos, winner, opts={}){
  return new Promise(res=>{
    const back=$('#ms-back'), cv=$('#ms-canvas'), ctx=cv.getContext('2d');
    cv.width=CW; cv.height=CH;
    $('#ms-mode').textContent=opts.mode||'';
    $('#ms-title').textContent=opts.title||'🗺️ ¿EN QUÉ MAPA?';
    $('#ms-result').textContent='';
    cv.style.transition='none'; cv.style.transform='none';
    back.classList.remove('zooming'); back.classList.add('show');
    ecos.forEach(load);
    const winI=Math.max(0, ecos.indexOf(winner));
    // saltos que se van espaciando (desaceleración) y terminan en el ganador
    const seq=[]; let cur=Math.floor(Math.random()*ecos.length);
    const N=15+Math.floor(Math.random()*5);
    for(let s=0;s<N;s++){ cur=(cur+1)%ecos.length; seq.push(cur); }
    seq[seq.length-1]=winI;
    draw(ctx,ecos,-1);
    let t=140, gap=55;
    seq.forEach(h=>{ const tt=t; setTimeout(()=>{ draw(ctx,ecos,h); tick(); }, tt); t+=gap; gap*=1.14; });
    setTimeout(()=>{
      draw(ctx,ecos,winI);
      $('#ms-result').textContent=META[winner][0]+'  ¡'+META[winner][1]+'!';
      if(window.SFX&&SFX.win) SFX.win();
      const p=POS[winner]||[CW/2,CH/2];
      setTimeout(()=>{                                       // ZOOM hacia la isla ganadora
        cv.style.transformOrigin=(p[0]/CW*100)+'% '+(p[1]/CH*100)+'%';
        cv.style.transition='transform 1.15s cubic-bezier(.5,0,.72,1)';
        cv.style.transform='scale(6)';
        back.classList.add('zooming');
        setTimeout(()=>{ back.classList.remove('show','zooming'); cv.style.transition='none'; cv.style.transform='none'; res(); }, 1200);
      }, 640);
    }, t+40);
  });
}
window.MAPSELECT={ pick };
})();
