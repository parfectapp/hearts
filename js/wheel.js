// ============================================================
// 🎡 LA RUEDA DE LA FORTUNA de HEARTS — decide el MODO y el MAPA
// de cada ronda de ¡Batalla!. Foquitos de casino, gajos tachados
// (los modos que ya salieron NO se repiten), confeti al caer.
// ============================================================
(function(){
const $=s=>document.querySelector(s);

// spin(title, items, winIdx, opts) → Promise. items: {icon,label,color,used}
function spin(title, items, winIdx, opts={}){
  return new Promise(res=>{
    const back=$('#wheel-back'), box=$('#wheel-box'), wheel=$('#wheel');
    $('#wheel-title').textContent=title;
    $('#wheel-sub').textContent=opts.sub||'';
    $('#wheel-result').textContent='';
    $('#wheel-result').classList.remove('pop');
    const n=items.length, seg=360/n;
    // gajos: los usados se apagan a gris (ya no pueden tocar)
    const stops=items.map((it,i)=>(it.used?'#31435c':it.color)+' '+(i*seg)+'deg '+((i+1)*seg)+'deg').join(', ');
    wheel.style.transition='none';
    wheel.style.transform='rotate(0deg)';
    wheel.style.background='conic-gradient('+stops+')';
    wheel.innerHTML=items.map((it,i)=>
      '<div class="wl'+(it.used?' used':'')+'" style="transform:rotate('+((i+0.5)*seg)+'deg)">'+
      '<span><i>'+it.icon+'</i><b>'+it.label+'</b>'+(it.used?'<u>✖ YA SALIÓ</u>':'')+'</span></div>'
    ).join('')+'<div class="wheel-hub">🎡</div>';
    // foquitos de casino alrededor
    let lights=''; for(let i=0;i<16;i++) lights+='<i class="wlight'+(i%2?' odd':'')+'" style="transform:rotate('+(i*22.5)+'deg) translateY(-158px)"></i>';
    $('#wheel-lights').innerHTML=lights;
    box.classList.add('spinning'); box.classList.remove('landed');
    back.classList.add('show');
    // 5 vueltas y cae en el CENTRO del gajo ganador (con tantito azar visual)
    const jitter=(Math.random()-0.5)*seg*0.5;
    const target=5*360 - ((winIdx+0.5)*seg) + jitter;
    setTimeout(()=>{ wheel.style.transition='transform 2.5s cubic-bezier(.12,.8,.15,1)';
      wheel.style.transform='rotate('+target+'deg)'; },40);
    // tic-tic-tic que se va frenando
    [90,160,240,330,440,580,760,1000,1320,1720,2220].forEach(t=>setTimeout(()=>SFX.count&&SFX.count(),t));
    setTimeout(()=>{
      box.classList.remove('spinning'); box.classList.add('landed');
      const rs=$('#wheel-result');
      rs.textContent=items[winIdx].icon+' ¡'+items[winIdx].label+'!';
      void rs.offsetWidth; rs.classList.add('pop');
      confettiBurst(box);
      SFX.win&&SFX.win();
      setTimeout(()=>{ back.classList.remove('show'); res(); },1000);
    },2750);
  });
}
// ráfaga de confeti al caer (piezas DOM, se limpian solas)
function confettiBurst(box){
  const colors=['#ffd34d','#ff5a4d','#4dd2ff','#9dff8a','#c77dff','#ff8ac2'];
  for(let i=0;i<26;i++){
    const c=document.createElement('i'); c.className='wconf';
    c.style.background=colors[i%colors.length];
    c.style.left=(50+(Math.random()-0.5)*30)+'%';
    c.style.setProperty('--dx',((Math.random()-0.5)*260)+'px');
    c.style.setProperty('--rot',(Math.random()*720-360)+'deg');
    c.style.animationDelay=(Math.random()*0.15)+'s';
    box.appendChild(c);
    setTimeout(()=>c.remove(),1400);
  }
}
window.WHEEL={ spin };
})();
