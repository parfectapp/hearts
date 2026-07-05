/* HEARTS — intro: el corazón late… y se parte en 8 */
(function(){
const W=832,H=640;
let done=false, raf=null, cb=null;

function finish(){
  if(done) return;
  done=true;
  cancelAnimationFrame(raf);
  window.removeEventListener('keydown',finish);
  window.removeEventListener('pointerdown',finish);
  if(cb) cb();
}

const CAST=['darkpanda','chameleon','vulture','monkey','orca','pigeon','lion']; // 7 guerreros; arriba flota el corazón

function play(canvas, onDone){
  done=false;
  cb=onDone;
  const ctx=canvas.getContext('2d');
  const animals=CAST.map(id=>DATA.byId[id]);
  let t0=performance.now();
  let lastThump=-1, shattered=false, coins=0;
  // fragmentos: anillo de 8 posiciones — la de arriba es del corazón flotante
  const CX=W/2, CY=H/2-40, R=235;
  const N=animals.length;
  const frags=animals.map((a,i)=>{
    const ang=-Math.PI/2 + (i+1)*(Math.PI*2/(N+1));
    return {a, ang, tx:CX+Math.cos(ang)*R, ty:CY+Math.sin(ang)*R*0.78};
  });
  const heartSlot={tx:CX, ty:CY-R*0.78};
  window.addEventListener('keydown',finish);
  window.addEventListener('pointerdown',finish);

  function frame(now){
    if(done) return;
    const t=(now-t0)/1000;

    // fondo negro con brasa roja creciente
    ctx.fillStyle='#050508'; ctx.fillRect(0,0,W,H);
    const glow=Math.min(0.5,t*0.12);
    const bg=ctx.createRadialGradient(CX,CY,20,CX,CY,420);
    bg.addColorStop(0,`rgba(232,40,30,${glow})`); bg.addColorStop(1,'rgba(232,40,30,0)');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

    if(t<2.7){
      // el corazón late, cada vez más rápido
      const rate=1.1+t*1.1;
      if(t-lastThump>1/rate){ lastThump=t; if(window.SFX&&SFX.thump)SFX.thump(); }
      const beat=1+0.10*Math.max(0,Math.sin((t*rate)*Math.PI*2))*(1+t*0.35);
      if(window.MAPART) MAPART.drawHeart(ctx,CX,CY,(7+t*0.8)*beat,0);
      // grietas al final
      if(t>2.2){
        ctx.strokeStyle='rgba(10,5,8,.9)'; ctx.lineWidth=3;
        ctx.beginPath(); ctx.moveTo(CX-8,CY-52); ctx.lineTo(CX+6,CY-10); ctx.lineTo(CX-10,CY+30); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(CX+30,CY-30); ctx.lineTo(CX+8,CY+6); ctx.stroke();
      }
    } else if(t<4.6){
      if(!shattered){ shattered=true; if(window.SFX){SFX.ko();} }
      const k=Math.min(1,(t-2.7)/0.7);           // vuelo de fragmentos
      const ease=1-Math.pow(1-k,3);
      if(k<0.15){ ctx.fillStyle=`rgba(255,255,255,${1-k*6})`; ctx.fillRect(0,0,W,H); }
      frags.forEach((f,i)=>{
        const x=CX+(f.tx-CX)*ease, y=CY+(f.ty-CY)*ease;
        if(window.MAPART) MAPART.drawHeart(ctx,x,y,1.6,t+i);
        // el fragmento se convierte en guerrero (mirando hacia el centro)
        const ak=Math.max(0,Math.min(1,(t-3.3-i*0.09)/0.35));
        if(ak>0){
          if(ak<0.2&&coins<=i){ coins=i+1; if(window.SFX)SFX.coin(); }
          Sprites.drawAnimal(ctx,f.a,x,y+42,96*ak,f.tx>CX,{spawn:1-ak,smooth:true});
        }
      });
      // el octavo fragmento sube y se queda como corazón flotante
      const hx=CX+(heartSlot.tx-CX)*ease, hy=CY+(heartSlot.ty-CY)*ease;
      if(window.MAPART) MAPART.drawHeart(ctx,hx,hy,2.2,t);
    } else {
      // 8 guerreros en círculo + título latiendo
      const k=Math.min(1,(t-4.6)/0.6);
      frags.forEach((f,i)=>{
        const bob=Math.sin(t*2.4+i)*5;
        Sprites.drawAnimal(ctx,f.a,f.tx,f.ty+42+bob,96,f.tx>CX,{idle:true,t:t+i,smooth:true});
      });
      // el corazón flotante corona el anillo
      const hbob=Math.sin(t*2)*8;
      if(window.MAPART) MAPART.drawHeart(ctx,heartSlot.tx,heartSlot.ty+hbob,3.4*(1+0.06*Math.sin(t*6)),t);
      const beat=1+0.05*Math.sin(t*6);
      ctx.save();
      ctx.globalAlpha=k;
      ctx.fillStyle='#f2ede2';
      ctx.font='900 84px Archivo, sans-serif'; ctx.textAlign='center';
      ctx.fillText('HEARTS',CX,CY+12);
      ctx.font='bold 17px "Space Mono"'; ctx.fillStyle='#e8281e';
      ctx.fillText('BATTLE ROYALE',CX,CY+54);
      ctx.font='bold 12px "Space Mono"'; ctx.fillStyle='#8b867b';
      ctx.globalAlpha=k*(0.5+0.5*Math.sin(t*3));
      ctx.fillText('PRESIONA ENTER',CX,CY+120);
      ctx.restore();
      if(t>14) finish();
    }
    if(t<4.6){
      ctx.fillStyle='rgba(139,134,123,.6)'; ctx.font='10px "Space Mono"'; ctx.textAlign='right';
      ctx.fillText('clic para saltar',W-18,H-14);
    }
    raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
}

window.INTRO={ play };
})();
