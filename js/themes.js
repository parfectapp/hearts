/* HEARTS — themes: 4 ecosistemas (selva/desierto/nieve/volcán)
   Tiles procedurales, escenarios con profundidad y layouts de los 12 mapas.
   Guiado por el arte de referencia de André, dibujado desde cero. */
(function(){

// ---------- paletas ----------
const T={
  selva:{
    name:'SELVA',
    skyA:'#152e1e', skyB:'#2b4a33', sil:'#0f2417', sil2:'#1a3323',
    deckTop:'#8a6234', deck:'#6b4a26', deckDark:'#523618',
    fallA:'#cfeef0', fallB:'#8fd0d8', glow:'#ffb050',
    floor1:'#3f7d3a', floor2:'#356b31', spot:'#4f9448',
    crateA:'#5da24f', crateB:'#3f7d3a', crateC:'#2c5a28',
    solidA:'#8f9a92', solidB:'#6d7a72', solidC:'#4d5a52',
    frameA:'#7a8480', frameB:'#5a6460', frameC:'#454e4a',
    ambient:'fireflies',
  },
  desierto:{
    name:'DESIERTO',
    skyA:'#e8a860', skyB:'#b06432', sil:'#8a4a22', sil2:'#a05828',
    deckTop:'#e0b070', deck:'#b8874a', deckDark:'#8a5e2e',
    fallA:'#f2d9a8', fallB:'#d9ae6a', glow:'#ffc060',
    floor1:'#d9a95e', floor2:'#c99850', spot:'#e8c078',
    crateA:'#c98a4a', crateB:'#a86c34', crateC:'#7a4a20',
    solidA:'#d9b878', solidB:'#b08a4e', solidC:'#7d5c2e',
    frameA:'#c99858', frameB:'#a87840', frameC:'#7a5528',
    ambient:'dust',
  },
  nieve:{
    name:'NIEVE',
    skyA:'#20415c', skyB:'#3b6a8a', sil:'#183246', sil2:'#24465e',
    deckTop:'#eaf8ff', deck:'#9fcbe0', deckDark:'#6d9db8',
    fallA:'#eafaff', fallB:'#a8d8ec', glow:'#8fd8ff',
    floor1:'#cfe6f2', floor2:'#b8d6e8', spot:'#e8f6fc',
    crateA:'#d8effa', crateB:'#a8cfe4', crateC:'#7aa8c4',
    solidA:'#bcd8e8', solidB:'#8cb4cc', solidC:'#5e88a4',
    frameA:'#a8c8dc', frameB:'#7ea6c0', frameC:'#587e98',
    ambient:'snow',
  },
  volcan:{
    name:'VOLCÁN',
    skyA:'#1c090d', skyB:'#4a141a', sil:'#160608', sil2:'#2a0d10',
    deckTop:'#6a4048', deck:'#4a3038', deckDark:'#331f26',
    fallA:'#ffd34d', fallB:'#ff8a2a', glow:'#ff8a3d',
    floor1:'#4a3a40', floor2:'#3e3036', spot:'#5c464e',
    crateA:'#5c4048', crateB:'#463038', crateC:'#2e1c22',
    solidA:'#584850', solidB:'#403038', solidC:'#282026',
    frameA:'#4a3a42', frameB:'#362a30', frameC:'#241a20',
    ambient:'embers',
  },
  japon:{
    name:'SAKURA',
    skyA:'#3a2440', skyB:'#5e3a58', sil:'#241830', sil2:'#3a2444',
    deckTop:'#8a5a3a', deck:'#6b4530', deckDark:'#4a2e20',
    fallA:'#ffd6e6', fallB:'#f0a8c8', glow:'#ff9ac0',
    floor1:'#7a9a4a', floor2:'#6f8f42', spot:'#c98ab0',
    crateA:'#8a6450', crateB:'#6b4a3a', crateC:'#472e24',
    solidA:'#9a9088', solidB:'#6e665e', solidC:'#4a4038',
    frameA:'#8a6450', frameB:'#6b4a3a', frameC:'#472e24',
    ambient:'petals',
  },
  tokyo:{
    name:'NEO-TOKYO',
    skyA:'#0e1424', skyB:'#1c2a44', sil:'#0a1020', sil2:'#141e34',
    deckTop:'#3a4a66', deck:'#28344a', deckDark:'#171f30',
    fallA:'#c0f8ff', fallB:'#26e6ff', glow:'#26e6ff',
    floor1:'#1e2636', floor2:'#182030', spot:'#ff3ea5',
    crateA:'#38445c', crateB:'#28344a', crateC:'#171f30',
    solidA:'#3a4560', solidB:'#28344a', solidC:'#161d2c',
    frameA:'#2e3a52', frameB:'#20293c', frameC:'#12182c',
    ambient:'neon',
  },
  egipto:{
    name:'GIZA',
    skyA:'#e8a860', skyB:'#b0642e', sil:'#7a4a1e', sil2:'#9a5e24',
    deckTop:'#e6c078', deck:'#c99a52', deckDark:'#8a6a34',
    fallA:'#ffe8b0', fallB:'#ffcf7a', glow:'#ffcf6a',
    floor1:'#d9a95e', floor2:'#c99850', spot:'#ffd97a',
    crateA:'#d9a95e', crateB:'#a8814a', crateC:'#75561f',
    solidA:'#d9b878', solidB:'#a8814a', solidC:'#75561f',
    frameA:'#c99858', frameB:'#a87840', frameC:'#7a5528',
    ambient:'dust',
  },
  grecia:{
    name:'OLYMPUS',
    skyA:'#f0a06a', skyB:'#8a6aa0', sil:'#3a4a6a', sil2:'#5a6a8a',
    deckTop:'#eef0f4', deck:'#cdd0d6', deckDark:'#8f949e',
    fallA:'#eafaff', fallB:'#a8d8ec', glow:'#8fd8ff',
    floor1:'#d7d3c6', floor2:'#c9c5b8', spot:'#5ab0e0',
    crateA:'#dcd8cc', crateB:'#b8b4a8', crateC:'#7e7a70',
    solidA:'#cdd0d6', solidB:'#9aa0aa', solidC:'#6e737e',
    frameA:'#c2c6cc', frameB:'#9aa0aa', frameC:'#6e737e',
    ambient:'dust',
  },
  china:{
    name:'DRAGON',
    skyA:'#e8b060', skyB:'#8a3a2a', sil:'#3a2418', sil2:'#5a3020',
    deckTop:'#c99a2a', deck:'#7a2e2a', deckDark:'#4a1a18',
    fallA:'#ffe8a0', fallB:'#ffce4a', glow:'#ffce4a',
    floor1:'#6a2e2a', floor2:'#5a2622', spot:'#ffce4a',
    crateA:'#9a4038', crateB:'#7a2e2a', crateC:'#4a1a18',
    solidA:'#8a4038', solidB:'#6a2e2a', solidC:'#3e1614',
    frameA:'#7a2e2a', frameB:'#5a2622', frameC:'#3a1614',
    ambient:'petals',
  },
};

// ---------- helpers ----------
function rng(seed){ let s=seed>>>0; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
function cv(w,h,fn){ const c=document.createElement('canvas'); c.width=w; c.height=h; fn(c.getContext('2d')); return c; }

function floorTile(base,spot,seed){
  return cv(44,44,g=>{
    g.fillStyle=base; g.fillRect(0,0,44,44);
    const r=rng(seed);
    for(let i=0;i<9;i++){ g.fillStyle=spot; g.globalAlpha=0.35+r()*0.4;
      g.fillRect(2+Math.floor(r()*39),2+Math.floor(r()*39),2+Math.floor(r()*3),2); }
    g.globalAlpha=1;
    g.fillStyle='rgba(255,255,255,.08)'; g.fillRect(0,0,44,2);
    g.fillStyle='rgba(0,0,0,.12)'; g.fillRect(0,42,44,2);
    g.strokeStyle='rgba(0,0,0,.10)'; g.strokeRect(0.5,0.5,43,43);
  });
}
function blockTile(a,b,c,seed,motif){
  // bloque con bisel (crate/sólido) — motif: 'x' tablones, 'rock' grietas, 'ice' brillo
  return cv(44,44,g=>{
    const r=rng(seed);
    g.fillStyle=b; g.fillRect(2,2,40,40);
    g.fillStyle=a; g.fillRect(2,2,40,7);        // bisel superior
    g.fillRect(2,2,5,40);
    g.fillStyle=c; g.fillRect(2,36,40,6);       // sombra inferior
    g.fillRect(38,2,4,40);
    if(motif==='x'){ g.strokeStyle=c; g.lineWidth=2;
      g.beginPath(); g.moveTo(6,6); g.lineTo(38,38); g.moveTo(38,6); g.lineTo(6,38); g.stroke();
      g.strokeStyle=a; g.strokeRect(6,6,32,32);
    } else if(motif==='rock'){
      g.strokeStyle=c; g.lineWidth=2;
      g.beginPath(); g.moveTo(10,8); g.lineTo(18,20); g.lineTo(12,34); g.moveTo(30,10); g.lineTo(26,24); g.lineTo(34,36); g.stroke();
      for(let i=0;i<4;i++){ g.fillStyle=a; g.fillRect(8+Math.floor(r()*28),8+Math.floor(r()*26),3,2); }
    } else if(motif==='ice'){
      g.fillStyle='rgba(255,255,255,.5)';
      g.beginPath(); g.moveTo(8,20); g.lineTo(20,8); g.lineTo(26,8); g.lineTo(8,26); g.fill();
      g.fillStyle='rgba(255,255,255,.3)'; g.fillRect(28,22,6,12);
    } else if(motif==='glyph'){
      g.fillStyle=c;
      g.fillRect(12,10,6,6); g.fillRect(26,10,6,6); g.fillRect(14,24,16,3); g.fillRect(19,30,6,6);
    } else if(motif==='lava'){
      g.strokeStyle='#ff7a2a'; g.lineWidth=2;
      g.beginPath(); g.moveTo(8,30); g.lineTo(16,22); g.lineTo(22,30); g.lineTo(30,18); g.stroke();
      g.fillStyle='#ffd34d'; g.fillRect(15,22,3,3); g.fillRect(28,19,3,3);
    }
    g.strokeStyle='rgba(0,0,0,.35)'; g.strokeRect(2.5,2.5,39,39);
  });
}
function brickTile(a,b,c,seed){
  return cv(44,44,g=>{
    g.fillStyle=b; g.fillRect(0,0,44,44);
    g.fillStyle=c;
    for(let row=0;row<3;row++){
      const off=(row%2)*11;
      for(let col=-1;col<3;col++) g.strokeStyle=c, g.strokeRect(col*22+off+0.5,row*15+0.5,22,15);
    }
    g.fillStyle=a; g.globalAlpha=.25;
    const r=rng(seed);
    for(let i=0;i<6;i++) g.fillRect(Math.floor(r()*40),Math.floor(r()*40),4,2);
    g.globalAlpha=1;
  });
}
// ===== SISTEMA DE TEXTURAS UNIFICADO estilo TowerFall (MISMO lenguaje en todo el juego) =====
// material por ecosistema: cuerpo (base/hi/lo/edge) + copete temático (top/topHi/topLo)
const TFMAT={
  selva:   {base:'#61704a',hi:'#7f9058',lo:'#41492e',edge:'#28301e', top:'#57a83c',topHi:'#84d15c',topLo:'#37701f'},
  desierto:{base:'#c0954f',hi:'#ddb972',lo:'#8c6a36',edge:'#5c4422', top:'#e8c86e',topHi:'#f8e6aa',topLo:'#b0863c'},
  nieve:   {base:'#89a9c1',hi:'#b6d2e4',lo:'#5c7c93',edge:'#3a566c', top:'#eef8ff',topHi:'#ffffff',topLo:'#c0dcee'},
  volcan:  {base:'#52413a',hi:'#6f5448',lo:'#312422',edge:'#180f0e', top:'#ca4f28',topHi:'#ff8a3a',topLo:'#7a2c14'},
  japon:   {base:'#6b4a3a',hi:'#8a6450',lo:'#472e24',edge:'#2a1a14', top:'#ec93b2',topHi:'#ffc6d8',topLo:'#c96f90'},
  tokyo:   {base:'#2b3242',hi:'#3f4a60',lo:'#191e2a',edge:'#0c0f16', top:'#26e6ff',topHi:'#c4f8ff',topLo:'#0a9fc4'},
  egipto:  {base:'#c99a52',hi:'#e6c078',lo:'#8a6a34',edge:'#5a4420', top:'#ffd97a',topHi:'#fff0c0',topLo:'#c99a44'},
  grecia:  {base:'#cdd0d6',hi:'#eef0f4',lo:'#8f949e',edge:'#5e636e', top:'#5ab0e0',topHi:'#bfe6ff',topLo:'#3a86b8'},
  china:   {base:'#7a2e2a',hi:'#9a4038',lo:'#4a1a18',edge:'#2a0e0c', top:'#ffce4a',topHi:'#fff0a8',topLo:'#c99a2a'},
};
// CONCRETO gris: material de los bloques DESTRUCTIBLES de Bomberman (distinto de los muros temáticos)
const CONCRETE={base:'#93938a',hi:'#b4b4a8',lo:'#5e5e57',edge:'#3a3a35', top:'#93938a',topHi:'#b4b4a8',topLo:'#5e5e57'};
// bloque sólido chunky estilo TowerFall (para plataformas TowerFall Y bloques de Bomberman)
function tfBlock(S,m,seed,soft){
  return cv(S,S,g=>{
    const r=rng(((seed||0)*2654435761+11)>>>0);
    g.fillStyle=soft? m.hi : m.base; g.fillRect(0,0,S,S);
    for(let i=0;i<(S*S/22)|0;i++){ g.fillStyle=r()<0.5?m.hi:m.lo; g.globalAlpha=.45; g.fillRect((r()*S)|0,(r()*S)|0,2,2); }
    g.globalAlpha=1;
    g.strokeStyle=m.lo; g.lineWidth=2; g.beginPath();          // vetas de piedra
    g.moveTo((S*0.22)|0,(S*0.28)|0); g.lineTo((S*0.34)|0,(S*0.52)|0);
    g.moveTo((S*0.72)|0,(S*0.26)|0); g.lineTo((S*0.60)|0,(S*0.50)|0); g.stroke();
    g.fillStyle=m.hi;   g.fillRect(0,0,S,3); g.fillRect(0,0,3,S);           // bisel: luz arriba/izq
    g.fillStyle=m.lo;   g.fillRect(0,S-4,S,4); g.fillRect(S-4,0,4,S);       //        sombra abajo/der
    g.fillStyle=m.edge; g.fillRect(0,S-2,S,2); g.fillRect(S-2,0,2,S);
    g.fillStyle=m.hi;   g.fillRect(4,4,3,2); g.fillRect(4,4,2,3);           // destello de esquina
    if(soft){ // CONCRETO agrietado: grietas gruesas ramificadas + chips = "esto SÍ se rompe"
      g.strokeStyle=m.edge; g.lineWidth=2.5; g.beginPath();
      g.moveTo(S*0.5,4); g.lineTo(S*0.42,S*0.4); g.lineTo(S*0.56,S*0.62); g.lineTo(S*0.46,S-4);
      g.moveTo(S*0.42,S*0.4); g.lineTo(S*0.22,S*0.5);
      g.moveTo(S*0.56,S*0.62); g.lineTo(S*0.78,S*0.7); g.stroke();
      g.fillStyle=m.edge; g.fillRect((S*0.7)|0,(S*0.2)|0,4,4); g.fillRect((S*0.2)|0,(S*0.72)|0,4,3); }
    g.strokeStyle='rgba(0,0,0,.22)'; g.lineWidth=1; g.strokeRect(0.5,0.5,S-1,S-1);
  });
}
// suelo hundido (para el piso de Bomberman) — mismo material, más oscuro
function tfGround(S,m,seed){
  return cv(S,S,g=>{
    const r=rng(((seed||0)*40503+7)>>>0);
    g.fillStyle=m.lo; g.fillRect(0,0,S,S);
    for(let i=0;i<(S*S/16)|0;i++){ g.fillStyle=r()<0.5?m.base:m.edge; g.globalAlpha=.4; g.fillRect((r()*S)|0,(r()*S)|0,2,2); }
    g.globalAlpha=1;
    g.fillStyle=m.edge; g.fillRect(0,0,S,2); g.fillRect(0,0,2,S);           // junta hundida
    g.fillStyle='rgba(255,255,255,.05)'; g.fillRect(0,S-2,S,2);
  });
}
// copete temático sobre el borde superior de una plataforma (firma TowerFall: pasto/nieve/lava)
function tfTopCap(ctx,x,y,w,eco,time,c){
  const m=TFMAT[eco]||TFMAT.selva;
  ctx.fillStyle=m.topLo; ctx.fillRect(x,y-6,w,7);
  ctx.fillStyle=m.top;   ctx.fillRect(x,y-6,w,4);
  ctx.fillStyle=m.topHi; ctx.fillRect(x,y-6,w,2);
  if(eco==='volcan'){ const p=0.5+0.5*Math.sin((time||0)*2.5+(c||0)*1.3);
    ctx.fillStyle=`rgba(255,150,60,${0.4+0.4*p})`; ctx.fillRect(x,y-7,w,2); }
  ctx.fillStyle=m.topLo;                                                    // mechones colgando
  for(let i=4;i<w-4;i+=9){ const hh=3+(((i*7+x)|0)%4); ctx.fillRect(x+i,y+1,3,hh); }
  if(eco==='nieve'){ ctx.fillStyle=m.topHi; for(let i=8;i<w-4;i+=13) ctx.fillRect(x+i,y+1,2,5+(i%3)); }
}
// tile de plataforma TowerFall (52x52) — usa el sistema unificado
function arenaTile(eco,pal,seed){
  return tfBlock(52, TFMAT[eco]||TFMAT.selva, (eco.length*97+(seed||0)*31)|0, false);
}

// ---------- kit de bomberman por ecosistema ----------
function bomberKit(id){
  const th=T[id], m=TFMAT[id]||TFMAT.selva;
  const MI=window.MAPART?window.MAPART.img:{};
  const S=44;
  const kit={ th, glow:th.glow };
  // MISMO sistema unificado que TowerFall en TODOS los mundos (uniforme, no "cereal")
  kit.floorA=[0,1,2].map(i=>tfGround(S,m,id.length*31+i));                                // piso oscuro
  kit.floorB=[0,1,2].map(i=>tfGround(S,{lo:m.base,base:m.hi,edge:m.lo},id.length*77+i));  // piso claro (ajedrez)
  kit.crate=[0,1].map(i=>tfBlock(S,CONCRETE,900+i,true)); // DESTRUCTIBLE = concreto gris agrietado (se nota)
  kit.solid=[0,1].map(i=>tfBlock(S,m,300+i,false));       // SÓLIDO permanente = piedra temática del mundo
  const frame=tfBlock(S,{base:m.lo,hi:m.base,lo:m.edge,edge:m.edge},50,false);            // marco oscuro
  kit.frameH=frame; kit.frameV=frame; kit.corner=frame; kit.gold=null;
  kit.torchImg=MI.torch;
  kit.center = CENTERPIECES[id];
  return kit;
}

// pieza central 3x3: MISMA pirámide pixel-art en TODOS los mundos, sólo tintada por ecosistema
// (uniforme: "el mismo diseño en todas como la de la jungla"). Se genera una vez y se cachea.
const _pyCache={};
const PY_FILT={
  desierto:'none',                                         // oro/arenisca original
  selva:   'hue-rotate(55deg) saturate(1.2)',              // piedra con musgo verdoso
  nieve:   'hue-rotate(172deg) saturate(0.55) brightness(1.4)', // hielo azul-blanco
  volcan:  'hue-rotate(-32deg) saturate(1.6) brightness(0.72)', // obsidiana rojiza
  japon:   'hue-rotate(295deg) saturate(1.25) brightness(1.05)', // rosa cerezo
  tokyo:   'hue-rotate(150deg) saturate(1.6) brightness(1.15)',  // neón cyan
  egipto:  'none',                                               // oro/arenisca (perfecto para Giza)
  grecia:  'saturate(0.32) brightness(1.42)',                    // mármol pálido
  china:   'hue-rotate(-22deg) saturate(1.5) brightness(0.96)',  // laca roja + oro
};
function pyramidFor(eco){
  const MI=window.MAPART?window.MAPART.img:{};
  const img=MI.pyramid; if(!img) return null;
  if(_pyCache[eco]) return _pyCache[eco];
  const filt=PY_FILT[eco]||'none';
  const c=cv(img.width,img.height,g=>{ if(filt!=='none') g.filter=filt; g.imageSmoothingEnabled=false; g.drawImage(img,0,0); });
  _pyCache[eco]=c; return c;
}
function drawPyramid(ctx,cx,by,eco,time){
  const p=pyramidFor(eco);
  if(!p){ // respaldo simple si aún no carga la imagen
    ctx.fillStyle='#8a6a34'; ctx.fillRect(cx-70,by-40,140,40); return; }
  const pw=176, ph=pw*(p.height/p.width);
  const sm=ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled=false;
  ctx.drawImage(p,cx-pw/2,by-ph,pw,ph);
  if(eco==='volcan'){ // brillo de lava latiendo en la cima
    const g=0.4+0.3*Math.sin((time||0)*2.4);
    ctx.fillStyle=`rgba(255,140,50,${g})`; ctx.fillRect(cx-20,by-ph+6,40,6); }
  ctx.imageSmoothingEnabled=sm;
}
const CENTERPIECES={
  selva:   (ctx,cx,by,time)=>drawPyramid(ctx,cx,by,'selva',time),
  desierto:(ctx,cx,by,time)=>drawPyramid(ctx,cx,by,'desierto',time),
  nieve:   (ctx,cx,by,time)=>drawPyramid(ctx,cx,by,'nieve',time),
  volcan:  (ctx,cx,by,time)=>drawPyramid(ctx,cx,by,'volcan',time),
  japon:   (ctx,cx,by,time)=>drawPyramid(ctx,cx,by,'japon',time),
  tokyo:   (ctx,cx,by,time)=>drawPyramid(ctx,cx,by,'tokyo',time),
  egipto:  (ctx,cx,by,time)=>drawPyramid(ctx,cx,by,'egipto',time),
  grecia:  (ctx,cx,by,time)=>drawPyramid(ctx,cx,by,'grecia',time),
  china:   (ctx,cx,by,time)=>drawPyramid(ctx,cx,by,'china',time),
};

// ---------- ARENAS TOWERFALL (layouts reales del juego, grid 16x12 @52px) ----------
const CELL=52, GRID_OY=16;
const TF_ARENAS={
  selva:{ name:'THORNWOOD', wrapY:false,
    pal:{block:'#3e5d3a',mortar:'#243a20',top:'#6d9a5e',bg1:'#08110c',bg2:'#17301e',moon:'#bce8c4',amb:'fireflies'},
    grids:[[
      '................',
      '................',
      '..##........##..',
      '................',
      '......####......',
      '##............##',
      '................',
      '....##....##....',
      '................',
      '.######..######.',
      '................',
      '################'],[
      '................',
      '.....#....#.....',
      '.....#....#.....',
      '................',
      '.##..........##.',
      '................',
      '......####......',
      '................',
      '.###........###.',
      '................',
      '........##......',
      '################'],[
      '................',
      '................',
      '....##....##....',
      '................',
      '.##..........##.',
      '.......##.......',
      '................',
      '..###......###..',
      '................',
      '......####......',
      '................',
      '################']]},
  desierto:{ name:'MIRAGE', wrapY:true,
    pal:{block:'#6a4a26',mortar:'#3a2a12',top:'#ffd34d',bg1:'#140c05',bg2:'#3a1c0a',moon:'#ffcf7a',amb:'dust'},
    grids:[[
      '................',
      '......####......',
      '................',
      '###..........###',
      '................',
      '.....######.....',
      '##............##',
      '................',
      '...###....###...',
      '................',
      '#####......#####',
      '######....######'],[
      '................',
      '..###......###..',
      '................',
      '........##......',
      '.....##.........',
      '###..........###',
      '................',
      '......####......',
      '................',
      '.###........###.',
      '................',
      '#####......#####'],[
      '................',
      '.......##.......',
      '................',
      '.##...####...##.',
      '................',
      '................',
      '#####......#####',
      '................',
      '...##......##...',
      '................',
      '......####......',
      '###..........###']]},
  nieve:{ name:'FROSTFANG KEEP', wrapY:false,
    pal:{block:'#54788f',mortar:'#2f4a60',top:'#a8d0e8',bg1:'#070d14',bg2:'#14283a',moon:'#d4ecff',amb:'snow'},
    grids:[[
      '................',
      '.....######.....',
      '................',
      '.###........###.',
      '................',
      '......####......',
      '#.....####.....#',
      '................',
      '..###......###..',
      '................',
      '................',
      '################'],[
      '................',
      '................',
      '.####......####.',
      '................',
      '.......##.......',
      '....########....',
      '................',
      '.##..........##.',
      '................',
      '....##....##....',
      '................',
      '################'],[
      '................',
      '......####......',
      '................',
      '..##........##..',
      '................',
      '#....##..##....#',
      '................',
      '......####......',
      '................',
      '.###........###.',
      '................',
      '################']]},
  volcan:{ name:'TOWERFORGE', wrapY:true,
    pal:{block:'#5c3a34',mortar:'#331e1a',top:'#9a5c4a',bg1:'#0f0606',bg2:'#2e1010',moon:'#ff9a5e',amb:'embers'},
    grids:[[
      '................',
      '..##........##..',
      '................',
      '.......##.......',
      '....##....##....',
      '................',
      '##....####....##',
      '................',
      '...##......##...',
      '......####......',
      '................',
      '#######..#######'],[
      '................',
      '....##....##....',
      '................',
      '.......##.......',
      '##............##',
      '................',
      '...##......##...',
      '................',
      '......####......',
      '.##..........##.',
      '................',
      '######....######'],[
      '................',
      '.##..........##.',
      '......####......',
      '................',
      '................',
      '....##....##....',
      '#......##......#',
      '................',
      '..##........##..',
      '................',
      '.....######.....',
      '#####......#####']]},
};
// JAPÓN (Sakura): mismas rejillas que la selva, paleta cerezo. Fondo/piso propios (assets).
TF_ARENAS.japon={ name:'SAKURA', wrapY:false,
  pal:{block:'#6b4a3a',mortar:'#3a2820',top:'#ec93b2',bg1:'#2a1a2e',bg2:'#4a2a3e',moon:'#ffd6e6',amb:'petals'},
  grids:TF_ARENAS.selva.grids };
// NEO-TOKYO (cyberpunk neón): rejillas de la selva, paleta neón. Fondo/piso propios (assets).
TF_ARENAS.tokyo={ name:'NEO-TOKYO', wrapY:false,
  pal:{block:'#2b3242',mortar:'#12182c',top:'#26e6ff',bg1:'#0a0f1c',bg2:'#16233c',moon:'#c4f8ff',amb:'neon'},
  grids:TF_ARENAS.selva.grids };
TF_ARENAS.egipto={ name:'GIZA', wrapY:false,
  pal:{block:'#c99a52',mortar:'#5a4420',top:'#ffd97a',bg1:'#2e1c0a',bg2:'#5a3a12',moon:'#ffe0a0',amb:'dust'},
  grids:TF_ARENAS.selva.grids };
TF_ARENAS.grecia={ name:'OLYMPUS', wrapY:false,
  pal:{block:'#cdd0d6',mortar:'#5e636e',top:'#5ab0e0',bg1:'#14243a',bg2:'#2a4a6a',moon:'#eaf6ff',amb:'dust'},
  grids:TF_ARENAS.selva.grids };
TF_ARENAS.china={ name:'DRAGON', wrapY:false,
  pal:{block:'#7a2e2a',mortar:'#2a0e0c',top:'#ffce4a',bg1:'#241010',bg2:'#4a1a16',moon:'#ffe0a0',amb:'petals'},
  grids:TF_ARENAS.selva.grids };
// compila un grid a rects sólidos + antorchas + spawns automáticos
function compileArena(a,gi){
  const grid=a.grids[gi||0];
  const plats=[], torches=[];
  grid.forEach((row,r)=>{
    let c=0;
    while(c<16){
      if(row[c]==='#'){
        let c2=c;
        while(c2<16&&row[c2]==='#') c2++;
        // plataformas DELGADAS tipo puente/tronco flotante (18px), de un solo sentido
        // (aterrizas encima, saltas por debajo) — ya no bloques macizos de 52px
        plats.push({x:c*CELL,y:GRID_OY+r*CELL,w:(c2-c)*CELL,h:18,solid:true,wall:false});
        if(c2-c>=4&&r<11) torches.push([(c+(c2-c)/2)*CELL,GRID_OY+r*CELL]);
        c=c2;
      } else c++;
    }
  });
  // spawns: puntos parados sobre bloques, elegidos maximizando separación
  const spots=[];
  for(let r=0;r<11;r++)for(let c=0;c<16;c++){
    if(grid[r][c]==='.'&&grid[r+1][c]==='#') spots.push([c*CELL+CELL/2, GRID_OY+(r+1)*CELL]);
  }
  const spawns=[];
  if(spots.length){
    spawns.push(spots[0]);
    while(spawns.length<8&&spawns.length<spots.length){
      let best=null,bd=-1;
      for(const p of spots){
        let mind=1e9;
        for(const q of spawns){ const d=(p[0]-q[0])**2+(p[1]-q[1])**2; if(d<mind)mind=d; }
        if(mind>bd){bd=mind;best=p;}
      }
      spawns.push(best);
    }
    while(spawns.length<8) spawns.push(spots[spawns.length%spots.length]);
  }
  return {plats,torches,spawns,grid};
}
// layout de una arena concreta (eco + variante 0-2)
// (Modo arte-colisión DESACTIVADO: las plataformas dibujadas en el arte "hacían finta".
//  Volvemos a las estructuras propias del juego (grid+tiles) sobre fondo escénico limpio.)
const TF_ART={};
const ALL_DOTS=Array.from({length:12},()=>'................');
function getFallLayout(eco,variant){
  const art=TF_ART[eco];
  if(art){
    return { mapName:(TF_ARENAS[eco]||TF_ARENAS.selva).name, arena:eco, variant:0, art:true,
      wrap:true, wrapY:!!art.wrapY, grid:ALL_DOTS, torches:[],
      plats: art.P.map(p=>({x:p[0],y:p[1],w:p[2],h:p[3],solid:true,wall:true})),
      spawns: art.P.map(p=>[p[0]+p[2]/2, p[1]]) };
  }
  const a=TF_ARENAS[eco]||TF_ARENAS.selva;
  const comp=compileArena(a,variant);
  return { mapName:a.name, arena:eco, variant:variant||0, wrap:true, wrapY:a.wrapY,
    plats:comp.plats, spawns:comp.spawns, grid:comp.grid, torches:comp.torches };
}
// render estilo TowerFall: marcos, murales, antorchas, cadenas, lianas, nieve, lava
function makeTFRender(eco,layout){
  const a=TF_ARENAS[eco]||TF_ARENAS.selva, pal=a.pal;
  if(!layout) layout=getFallLayout(eco,0);
  const g=layout.grid;
  const at=(c,r)=>r>=0&&r<12&&c>=0&&c<16&&g[r][c]==='#';
  const stars=[]; const r=rng(eco.length*131+(layout.variant||0)*17);
  for(let i=0;i<50;i++) stars.push([r()*832,r()*500,r()]);
  const bgBricks=[]; for(let i=0;i<26;i++) bgBricks.push([r()*800,r()*600,30+r()*40]);
  const amb=makeAmbient(pal.amb,832,640);
  const hash=(c,r2,n)=>((c*7+r2*13+(layout.variant||0)*5)%n+n)%n;
  const blockImg=arenaTile(eco,pal,layout.variant);   // tile pixel-art de los bloques

  // corridas horizontales de bloques
  const runs=[];
  for(let r2=0;r2<12;r2++){
    let c=0;
    while(c<16){
      if(at(c,r2)&&!at(c-1,r2)){
        let c2=c; while(at(c2,r2)) c2++;
        runs.push({c0:c,c1:c2-1,r:r2});
        c=c2;
      } else c++;
    }
  }
  // colgantes bajo bloques (cadenas volcán / lianas selva / carámbanos nieve)
  const hangs=[];
  runs.forEach(run=>{
    for(let c=run.c0;c<=run.c1;c++){
      if(at(c,run.r+1)) continue;
      if(hash(c,run.r,3)===0){
        let len=1;
        while(run.r+1+len<12&&!at(c,run.r+1+len)&&len<3) len++;
        hangs.push({x:c*CELL+CELL/2, y:GRID_OY+(run.r+1)*CELL, len:len*CELL*0.6, seed:c*3+run.r});
      }
    }
  });
  // caídas de lava (volcán): columnas largas vacías bajo bloques
  const lavaFalls=[];
  if(eco==='volcan'){
    runs.forEach(run=>{
      const c=run.c0+Math.floor((run.c1-run.c0)/2);
      if(at(c,run.r+1)||run.r>=10) return;
      let end=run.r+1;
      while(end<12&&!at(c,end)) end++;
      if(end-run.r>=3&&lavaFalls.length<2&&hash(c,run.r,2)===0)
        lavaFalls.push({x:c*CELL+CELL/2, y0:GRID_OY+(run.r+1)*CELL, y1:GRID_OY+end*CELL});
    });
  }
  // antorchas laterales en extremos de corridas
  const torches=[];
  runs.forEach(run=>{
    if(run.r>=11) return;
    if(!at(run.c0-1,run.r)) torches.push([run.c0*CELL+7, GRID_OY+run.r*CELL+16]);
    if(!at(run.c1+1,run.r)) torches.push([run.c1*CELL+CELL-7, GRID_OY+run.r*CELL+16]);
  });

  function bg(ctx,time){
    const gr=ctx.createLinearGradient(0,0,0,640);
    gr.addColorStop(0,pal.bg1); gr.addColorStop(1,pal.bg2);
    ctx.fillStyle=gr; ctx.fillRect(0,0,832,640);
    // textura de mazmorra al fondo
    bgBricks.forEach(([x,y,w])=>{ ctx.fillStyle='rgba(0,0,0,.16)'; ctx.fillRect(x,y,w,18); });
    stars.forEach(([x,y,s2])=>{
      ctx.fillStyle=`rgba(255,255,255,${0.10+0.28*s2*Math.abs(Math.sin(time*0.7+s2*9))})`;
      ctx.fillRect(x,y,s2>0.85?3:2,s2>0.85?3:2);
    });
    // MURALES por ecosistema
    if(eco==='nieve'){
      // calaveras heladas gigantes
      [[180,300],[652,300]].forEach(([x,y])=>{
        ctx.fillStyle='rgba(10,24,40,.55)';
        ctx.beginPath(); ctx.arc(x,y,74,0,7); ctx.fill();
        ctx.fillRect(x-46,y+40,92,52);
        ctx.fillStyle='rgba(90,160,210,.20)';
        ctx.beginPath(); ctx.arc(x-26,y-8,17,0,7); ctx.arc(x+26,y-8,17,0,7); ctx.fill();
        ctx.fillRect(x-7,y+16,14,20);
      });
    } else if(eco==='selva'){
      // troncos gigantes con luz entre el dosel
      [[120,0.9],[416,1.15],[712,0.9]].forEach(([x,k])=>{
        ctx.fillStyle='rgba(10,28,12,.6)';
        ctx.fillRect(x-34*k,0,68*k,640);
        ctx.fillStyle='rgba(30,64,26,.5)';
        ctx.fillRect(x-34*k,0,12*k,640);
        for(let b=0;b<4;b++){ const by=90+b*150+((x*7)%40);
          ctx.fillRect(x+20*k,by,40,10); ctx.fillRect(x-60*k,by+70,44,10); }
      });
      const sh=ctx.createLinearGradient(0,0,0,400);
      sh.addColorStop(0,'rgba(214,255,140,.10)'); sh.addColorStop(1,'rgba(214,255,140,0)');
      ctx.fillStyle=sh;
      ctx.beginPath(); ctx.moveTo(300,0); ctx.lineTo(390,0); ctx.lineTo(500,640); ctx.lineTo(380,640); ctx.fill();
    } else if(eco==='volcan'){
      // estatuas guardianas en la penumbra
      [[300,330],[532,330]].forEach(([x,y])=>{
        ctx.fillStyle='rgba(120,110,100,.16)';
        ctx.beginPath(); ctx.arc(x,y-70,26,0,7); ctx.fill();
        ctx.fillRect(x-34,y-52,68,120);
        ctx.fillRect(x-48,y-40,14,60); ctx.fillRect(x+34,y-40,14,60);
      });
      const lg=ctx.createLinearGradient(0,540,0,640);
      lg.addColorStop(0,'rgba(255,110,30,0)'); lg.addColorStop(1,'rgba(255,110,30,.20)');
      ctx.fillStyle=lg; ctx.fillRect(0,540,832,100);
    } else if(eco==='desierto'){
      // parches de atardecer + rostros de glifo
      [[140,150,110],[620,340,130],[330,480,100]].forEach(([x,y,w])=>{
        ctx.fillStyle='rgba(255,120,40,.14)';
        ctx.fillRect(x,y,w,70);
      });
      [[240,240],[600,140]].forEach(([x,y])=>{
        ctx.fillStyle='rgba(90,40,20,.35)';
        ctx.fillRect(x-24,y-24,48,48);
        ctx.fillStyle='rgba(255,90,60,.30)';
        ctx.fillRect(x-14,y-10,9,9); ctx.fillRect(x+5,y-10,9,9); ctx.fillRect(x-10,y+8,20,5);
      });
    }
    // luna / brasa central
    const mg=ctx.createRadialGradient(416,110,10,416,110,110);
    mg.addColorStop(0,pal.moon+'44'); mg.addColorStop(1,pal.moon+'00');
    ctx.fillStyle=mg; ctx.beginPath(); ctx.arc(416,110,110,0,7); ctx.fill();
    ctx.fillStyle=pal.moon; ctx.globalAlpha=.8;
    ctx.beginPath(); ctx.arc(416,110,38,0,7); ctx.fill();
    ctx.globalAlpha=.25; ctx.fillStyle=pal.bg1;
    ctx.beginPath(); ctx.arc(428,102,30,0,7); ctx.fill();
    ctx.globalAlpha=1;
    // caídas de lava del mural
    lavaFalls.forEach(f=>{
      ctx.fillStyle='rgba(255,122,42,.75)';
      ctx.fillRect(f.x-4,f.y0,8,f.y1-f.y0);
      ctx.fillStyle='rgba(255,211,77,.9)';
      const seg=18;
      for(let y=f.y0;y<f.y1;y+=seg){
        const off=((time*140+y)%(f.y1-f.y0));
        ctx.fillRect(f.x-2,f.y0+off,4,10);
      }
    });
    // neblina baja
    const fg=ctx.createLinearGradient(0,520,0,640);
    fg.addColorStop(0,pal.bg2+'00'); fg.addColorStop(1,pal.moon+'1e');
    ctx.fillStyle=fg; ctx.fillRect(0,520,832,120);
  }

  function flame(ctx,x,y,time,i,col1,col2){
    const f=Math.sin(time*10+i*2.7);
    ctx.fillStyle=col1;
    ctx.beginPath(); ctx.ellipse(x,y-6+f,5,8+f*1.5,0,0,7); ctx.fill();
    ctx.fillStyle=col2;
    ctx.beginPath(); ctx.ellipse(x,y-8+f,2.5,4,0,0,7); ctx.fill();
  }

  function blocks(ctx,time){
    const M=window.MAPART;
    // MODO ARTE: el fondo pixel ya trae plataformas/antorchas/marco. Solo marcamos el piso
    // con una sombra sutil bajo cada colisión (para que se lea dónde te paras) + ambiente.
    if(layout.art){
      ctx.save();
      layout.plats.forEach(pl=>{
        ctx.fillStyle='rgba(0,0,0,.28)'; ctx.fillRect(pl.x, pl.y+pl.h-1, pl.w, 5);
        ctx.fillStyle='rgba(255,255,255,.06)'; ctx.fillRect(pl.x, pl.y, pl.w, 2);
      });
      ctx.restore();
      amb.draw(ctx,time);
      if(M) M.vignette(ctx,832,640);
      return;
    }
    // marco del escenario (anillo decorado)
    ctx.fillStyle=pal.mortar;
    ctx.fillRect(0,0,832,10); ctx.fillRect(0,630,832,10);
    ctx.fillRect(0,0,10,640); ctx.fillRect(822,0,10,640);
    ctx.fillStyle=pal.block;
    for(let x=0;x<832;x+=52){ ctx.fillRect(x+4,2,44,6); ctx.fillRect(x+4,632,44,6); }
    for(let y=0;y<640;y+=52){ ctx.fillRect(2,y+4,6,44); ctx.fillRect(824,y+4,6,44); }
    if(eco==='desierto'){ ctx.fillStyle='#c92a2a';
      for(let x=26;x<832;x+=104){ ctx.beginPath(); ctx.arc(x,5,4,0,7); ctx.arc(x,635,4,0,7); ctx.fill(); } }

    // colgantes DETRÁS de los bloques
    hangs.forEach(h=>{
      if(eco==='selva'){
        const sway=Math.sin(time*1.4+h.seed)*6;
        ctx.strokeStyle='#2e5a24'; ctx.lineWidth=3;
        ctx.beginPath(); ctx.moveTo(h.x,h.y);
        ctx.quadraticCurveTo(h.x+sway,h.y+h.len*0.6,h.x+sway*1.4,h.y+h.len); ctx.stroke();
        ctx.fillStyle='#3f7d3a';
        ctx.fillRect(h.x+sway*1.4-3,h.y+h.len-2,7,5);
        ctx.fillRect(h.x+sway*0.6-3,h.y+h.len*0.55,6,4);
      } else if(eco==='volcan'){
        ctx.strokeStyle='#3a2620'; ctx.lineWidth=2;
        for(let y=0;y<h.len;y+=8){
          ctx.strokeRect(h.x-3,h.y+y,6,7);
        }
      } else if(eco==='nieve'){
        ctx.fillStyle='rgba(200,235,255,.85)';
        ctx.beginPath(); ctx.moveTo(h.x-5,h.y); ctx.lineTo(h.x+5,h.y); ctx.lineTo(h.x,h.y+14+((h.seed%3)*5)); ctx.fill();
      } else {
        ctx.strokeStyle='#8a6a2a'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(h.x,h.y); ctx.lineTo(h.x,h.y+h.len*0.5); ctx.stroke();
        ctx.fillStyle='#c92a2a'; ctx.beginPath(); ctx.arc(h.x,h.y+h.len*0.5,4,0,7); ctx.fill();
      }
    });

    // PUENTES / TRONCOS flotantes delgados (18px) — ya no bloques macizos de 52px
    for(let r2=0;r2<12;r2++)for(let c=0;c<16;c++){
      if(!at(c,r2)) continue;
      const x=c*CELL, y=GRID_OY+r2*CELL, H=18;
      const left=!at(c-1,r2), right=!at(c+1,r2);
      ctx.fillStyle='rgba(0,0,0,.22)'; ctx.fillRect(x,y+H,CELL,3);          // sombra proyectada
      ctx.fillStyle='#5f3e1e'; ctx.fillRect(x,y,CELL,H);                    // madera oscura
      ctx.fillStyle='#835832'; ctx.fillRect(x,y+2,CELL,H-4);               // tabla
      ctx.fillStyle='rgba(0,0,0,.16)'; ctx.fillRect(x,y+9,CELL,1);         // veta
      ctx.fillStyle='rgba(0,0,0,.24)';                                     // divisiones de tablas
      for(let i=x+13;i<x+CELL;i+=13) ctx.fillRect(i,y+1,1,H-2);
      ctx.fillStyle='#a67c40'; ctx.fillRect(x,y,CELL,2);                   // filo iluminado
      ctx.fillStyle='rgba(0,0,0,.22)'; ctx.fillRect(x,y+H-2,CELL,2);       // filo inferior
      if(left)  { ctx.fillStyle='#4a3016'; ctx.fillRect(x,y-1,3,H+2); }    // poste/tope izq
      if(right) { ctx.fillStyle='#4a3016'; ctx.fillRect(x+CELL-3,y-1,3,H+2); } // poste/tope der
      ctx.fillStyle='#3a2410'; ctx.fillRect(x+5,y+4,2,2); ctx.fillRect(x+CELL-7,y+4,2,2); // clavos
      // copete temático delgado (pasto/nieve/arena/lava) donde te paras
      if(!at(c,r2-1)) tfTopCap(ctx,x,y,CELL,eco,time,c);
    }
    // antorchas laterales con flama viva
    torches.forEach(([tx,ty],i)=>{
      ctx.fillStyle='#3a2a18'; ctx.fillRect(tx-3,ty-4,6,12);
      ctx.fillStyle='#5a4428'; ctx.fillRect(tx-5,ty-6,10,4);
      const cold=eco==='nieve';
      flame(ctx,tx,ty-8,time,i, cold?'#6ec8ff':'#ff8a3d', cold?'#d8f4ff':'#ffd34d');
      if(M) M.torchGlow(ctx,tx,ty-10,time,i,24);
    });
    amb.draw(ctx,time);
    if(M) M.vignette(ctx,832,640);
  }
  return {bg,blocks};
}

// ---------- layouts ----------
const WALLS=[
  {x:0,y:602,w:832,h:38,solid:true},
  {x:0,y:0,w:16,h:640,solid:true,wall:true},
  {x:816,y:0,w:16,h:640,solid:true,wall:true},
  {x:0,y:0,w:832,h:14,solid:true,wall:true},
];
// FALL = arenas reales de TowerFall (variante 0 por defecto)
const FALL_LAYOUTS={};
Object.keys(TF_ARENAS).forEach(eco=>{ FALL_LAYOUTS[eco]=getFallLayout(eco,0); });

// BROS = geometrías reales de stages de Smash
const BROS_LAYOUTS={
  selva:{ mapName:'BATTLEFIELD', smash:true, plats:[
    {x:216,y:438,w:400,h:18,main:true},
    {x:262,y:328,w:118,h:12},{x:452,y:328,w:118,h:12},{x:357,y:220,w:118,h:12}],
    spawns:[[266,438],[566,438],[321,328],[511,328],[416,220],[380,438],[452,438],[416,438]],
    stageL:216, stageR:616, box:[0,1,2,3] },
  desierto:{ mapName:'FINAL DESTINATION', smash:true, plats:[
    {x:186,y:428,w:460,h:20,main:true}],
    spawns:[[236,428],[596,428],[316,428],[516,428],[416,428],[276,428],[556,428],[456,428]],
    stageL:186, stageR:646, box:[0] },
  nieve:{ mapName:'DREAMLAND', smash:true, plats:[
    {x:206,y:445,w:420,h:18,main:true},
    {x:253,y:340,w:114,h:12},{x:465,y:340,w:114,h:12},{x:358,y:232,w:116,h:12}],
    spawns:[[256,445],[576,445],[310,340],[522,340],[416,232],[366,445],[466,445],[416,445]],
    stageL:206, stageR:626, box:[0,1,2,3] },
  volcan:{ mapName:'NORFAIR', smash:true, lava:true, plats:[
    {x:366,y:286,w:100,h:12,main:true},
    {x:206,y:352,w:110,h:12},{x:516,y:352,w:110,h:12},
    {x:286,y:442,w:110,h:12},{x:436,y:442,w:110,h:12}],
    spawns:[[416,286],[261,352],[571,352],[341,442],[491,442],[230,352],[600,352],[380,442]],
    stageL:206, stageR:626, box:[0,1,2,3,4] },
};

// ---------- ambiente (partículas por ecosistema) ----------
function makeAmbient(kind,W,H){
  const n=kind==='snow'?40:kind==='petals'?34:kind==='neon'?30:kind==='embers'?26:kind==='dust'?22:14;
  const list=[];
  for(let i=0;i<n;i++) list.push({x:Math.random()*W,y:Math.random()*H,s:Math.random()*6.3,v:0.4+Math.random()});
  return {
    draw(ctx,time){
      list.forEach((p,i)=>{
        let x=p.x,y=p.y,a,c,sz=2;
        if(kind==='snow'){ y=(p.y+time*22*p.v)%H; x=p.x+Math.sin(time*0.8+p.s)*18; a=0.5+0.3*Math.sin(time+p.s); c='240,248,255'; }
        else if(kind==='embers'){ y=H-((p.y+time*30*p.v)%H); x=p.x+Math.sin(time*1.4+p.s)*14; a=0.4+0.4*Math.sin(time*3+p.s); c='255,150,60'; }
        else if(kind==='dust'){ x=(p.x+time*14*p.v)%W; y=p.y+Math.sin(time*0.6+p.s)*10; a=0.18+0.12*Math.sin(time+p.s); c='240,214,160'; sz=2; }
        else if(kind==='petals'){ y=(p.y+time*18*p.v)%H; x=p.x+Math.sin(time*0.9+p.s)*26; a=0.5+0.3*Math.sin(time+p.s); c='255,190,214'; sz=3; }
        else if(kind==='neon'){ y=H-((p.y+time*24*p.v)%H); x=p.x+Math.sin(time*1.1+p.s)*10; a=0.4+0.4*Math.sin(time*3+p.s); c=(i%2)?'38,230,255':'255,62,165'; sz=2; }
        else { x=p.x+Math.sin(time*0.5+p.s)*22; y=p.y+Math.sin(time*0.33+p.s*2)*16; a=0.25+0.25*Math.sin(time*2.2+p.s); c='190,255,150'; }
        ctx.fillStyle=`rgba(${c},${a})`; ctx.fillRect(x,y,sz,sz);
      });
    }
  };
}

// ---------- escenas (fondo + plataformas) para FALL y BROS ----------
function makeScene(id,mode){
  const th=T[id];
  const W=832,H=640;
  const M=window.MAPART;
  const amb=makeAmbient(th.ambient,W,H);
  const r=rng(id.length*997+(mode==='bros'?7:1));
  // siluetas de parallax precalculadas
  const bumps=[]; for(let i=0;i<10;i++) bumps.push([r()*W,60+r()*60,60+r()*90]);
  const hangs=[]; for(let i=0;i<7;i++) hangs.push([40+r()*(W-80),30+r()*70]);
  // grano de textura global (profundidad, mata lo plano)
  const grains=[]; for(let i=0;i<120;i++) grains.push([r()*W,r()*H,r()<0.45]);

  function bg(ctx,time){
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,th.skyA); g.addColorStop(1,th.skyB);
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

    if(id==='selva'){
      ctx.fillStyle=th.sil;  bumps.forEach(([x,y,rr],i)=>{ if(i%2){ctx.beginPath();ctx.arc(x,20,rr,0,7);ctx.fill();} });
      ctx.fillStyle=th.sil2; bumps.forEach(([x,y,rr],i)=>{ if(!(i%2)){ctx.beginPath();ctx.arc(x,-8,rr,0,7);ctx.fill();} });
      // troncos laterales
      ctx.fillStyle=th.sil; ctx.fillRect(0,0,54,H); ctx.fillRect(W-54,0,54,H);
      ctx.fillStyle=th.sil2; ctx.fillRect(54,120,16,H); ctx.fillRect(W-70,80,16,H);
      hangs.forEach(([x,l])=>{ ctx.strokeStyle=th.sil2; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,l); ctx.stroke();
        ctx.fillStyle='#2f5a38'; ctx.fillRect(x-2,l,5,4); });
      waterCol(ctx,time,376,80,80,H-80,th.fallA,th.fallB);
    }
    else if(id==='desierto'){
      if(mode==='bros'){
        // tumba: muro con jeroglíficos + grieta + haz de luz
        ctx.fillStyle='#caa25e'; ctx.fillRect(20,20,W-40,H-40);
        ctx.fillStyle='rgba(122,85,40,.5)';
        for(let gy=44;gy<H-60;gy+=44)for(let gx=44;gx<W-60;gx+=52){
          const k=((gx*7+gy*13)%5);
          if(k===0)ctx.fillRect(gx,gy,10,16); else if(k===1)ctx.fillRect(gx,gy+4,16,4);
          else if(k===2){ctx.fillRect(gx,gy,6,6);ctx.fillRect(gx+9,gy,6,6);}
          else if(k===3)ctx.fillRect(gx+4,gy,4,18); else ctx.fillRect(gx,gy+8,14,3);
        }
        ctx.strokeStyle='rgba(70,45,18,.6)'; ctx.lineWidth=3;
        ctx.beginPath(); ctx.moveTo(W*0.55,30); ctx.lineTo(W*0.5,150); ctx.lineTo(W*0.56,260); ctx.stroke();
        const sh=ctx.createLinearGradient(300,0,560,H);
        sh.addColorStop(0,'rgba(255,240,190,.30)'); sh.addColorStop(1,'rgba(255,240,190,0)');
        ctx.fillStyle=sh; ctx.beginPath();
        ctx.moveTo(330,0); ctx.lineTo(470,0); ctx.lineTo(640,H); ctx.lineTo(430,H); ctx.fill();
      } else {
        // cañón: cielo arriba, cara del fondo con gradiente y paredes en bandas dentadas
        ctx.fillStyle='#bfe4ea'; ctx.fillRect(220,0,392,110);
        ctx.fillStyle='rgba(255,244,214,.85)'; ctx.beginPath(); ctx.arc(416,30,26,0,7); ctx.fill();
        const face=ctx.createLinearGradient(0,90,0,H);
        face.addColorStop(0,'#cf9450'); face.addColorStop(1,'#8f5526');
        ctx.fillStyle=face;
        ctx.beginPath(); ctx.moveTo(280,110); ctx.lineTo(552,110); ctx.lineTo(640,H); ctx.lineTo(190,H); ctx.fill();
        for(let y=0;y<H;y+=26){
          const t=Math.min(1,y/220);
          const w=245-85*t+((y*13)%3)*9;
          ctx.fillStyle=(Math.floor(y/26))%2?'#a05828':'#8f4c22';
          ctx.fillRect(0,y,w,26); ctx.fillRect(W-w,y,w,26);
          ctx.fillStyle='rgba(255,214,150,.14)'; ctx.fillRect(0,y,w,4); ctx.fillRect(W-w,y,w,4);
          ctx.fillStyle='rgba(50,24,8,.4)'; ctx.fillRect(w-6,y,6,26); ctx.fillRect(W-w,y,6,26);
        }
        // grietas y huecos en las paredes
        ctx.fillStyle='rgba(50,24,8,.35)';
        [[60,180],[140,340],[80,470],[W-100,220],[W-150,400],[W-70,520]].forEach(([x,y])=>{
          ctx.fillRect(x,y,26,10); ctx.fillRect(x+6,y+10,12,8);
        });
        // cactus y huesos al pie
        [[70,H-52],[W-90,H-60],[150,H-44],[W-170,H-46]].forEach(([x,y])=>{
          ctx.fillStyle='#3f7d3a'; ctx.fillRect(x,y-26,10,26); ctx.fillRect(x-8,y-18,8,5); ctx.fillRect(x+10,y-14,8,5);
          ctx.fillStyle='#5da24f'; ctx.fillRect(x+2,y-26,3,26);
        });
        ctx.fillStyle='#e8dcc8'; ctx.fillRect(300,H-46,18,4); ctx.fillRect(304,H-50,4,8);
      }
    }
    else if(id==='nieve'){
      // montañas lejanas + aurora + estalactitas
      ctx.fillStyle=th.sil2;
      ctx.beginPath(); ctx.moveTo(0,300); ctx.lineTo(180,120); ctx.lineTo(340,300); ctx.fill();
      ctx.beginPath(); ctx.moveTo(W,320); ctx.lineTo(W-200,110); ctx.lineTo(W-380,320); ctx.fill();
      ctx.fillStyle='#e8f4fa';
      ctx.beginPath(); ctx.moveTo(150,152); ctx.lineTo(180,120); ctx.lineTo(212,152); ctx.lineTo(180,166); ctx.fill();
      const au=ctx.createLinearGradient(0,60,0,150);
      au.addColorStop(0,'rgba(120,255,190,0)'); au.addColorStop(.5,`rgba(120,255,190,${0.12+0.06*Math.sin(time)})`); au.addColorStop(1,'rgba(120,255,190,0)');
      ctx.fillStyle=au;
      ctx.beginPath(); ctx.moveTo(0,80);
      for(let x=0;x<=W;x+=40) ctx.lineTo(x,80+Math.sin(x*0.02+time*0.7)*26);
      for(let x=W;x>=0;x-=40) ctx.lineTo(x,160+Math.sin(x*0.02+time*0.7)*26);
      ctx.fill();
      ctx.fillStyle=th.sil;
      bumps.forEach(([x,,rr])=>{ ctx.beginPath(); ctx.moveTo(x-rr*0.3,0); ctx.lineTo(x,rr*0.7); ctx.lineTo(x+rr*0.3,0); ctx.fill(); });
      if(mode==='fall') waterCol(ctx,time*0.35,386,60,60,H-60,'#eafaff','#b8e0f2');
    }
    else if(id==='volcan'){
      // volcanes con cráter encendido + rocas flotantes
      [[150,1.0],[640,0.8]].forEach(([vx,s],i)=>{
        ctx.fillStyle='#3a1216';
        ctx.beginPath(); ctx.moveTo(vx-180*s,H); ctx.lineTo(vx,168); ctx.lineTo(vx+180*s,H); ctx.fill();
        ctx.fillStyle='#2a0d10';
        ctx.beginPath(); ctx.moveTo(vx-70*s,H); ctx.lineTo(vx+8,215); ctx.lineTo(vx+180*s,H); ctx.fill();
        const p=0.6+0.4*Math.sin(time*2+i*2);
        ctx.fillStyle=`rgba(255,122,42,${0.85*p})`; ctx.fillRect(vx-24*s,168,48*s,8);
        ctx.fillStyle=`rgba(255,211,77,${0.7*p})`; ctx.fillRect(vx-10*s,168,20*s,4);
        ctx.strokeStyle=`rgba(255,140,50,${0.55*p})`; ctx.lineWidth=3;
        ctx.beginPath(); ctx.moveTo(vx-4,178); ctx.lineTo(vx-34*s,290); ctx.lineTo(vx-20*s,378); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(vx+10,180); ctx.lineTo(vx+42*s,320); ctx.stroke();
      });
      bumps.slice(0,5).forEach(([x,y,rr],i)=>{
        const fy=y+40+Math.sin(time*0.7+i)*8;
        ctx.fillStyle=th.sil; ctx.beginPath(); ctx.ellipse(x,fy,rr*0.3,rr*0.14,0,0,7); ctx.fill();
      });
      if(mode==='fall') waterCol(ctx,time*1.4,386,60,60,H-60,th.fallA,th.fallB);
      else {
        // portal morado gigante de fondo (ref de André)
        for(let i=0;i<4;i++){
          ctx.strokeStyle=`rgba(168,90,255,${0.30-i*0.06})`; ctx.lineWidth=6-i;
          ctx.beginPath(); ctx.ellipse(416,210,60+i*22,42+i*15,0,time*1.5+i,time*1.5+i+4.6); ctx.stroke();
        }
      }
    }
  }

  // columna de agua/arena/lava animada
  function waterCol(ctx,time,x,y,w,h,cA,cB){
    ctx.fillStyle=cB; ctx.globalAlpha=.7; ctx.fillRect(x,y,w,h); ctx.globalAlpha=1;
    ctx.fillStyle=cA;
    for(let i=0;i<7;i++){
      const sx=x+((i*0.143+0.05)%1)*w;
      const len=30+(i%3)*16;
      const sy=y+((time*(190+i*23)+i*83)%(h+len))-len;
      ctx.globalAlpha=.5; ctx.fillRect(sx,Math.max(y,sy),3,Math.min(len,y+h-sy));
    }
    ctx.globalAlpha=1;
  }

  // props decorativos por plataforma (deterministas)
  function props(ctx,pl,time){
    const seed=Math.abs((pl.x*7+pl.y*13)|0)%97;
    if(pl.w<60) return;
    const px=pl.x+14+(seed%(pl.w-40)), py=pl.y;
    if(id==='selva'){
      ctx.fillStyle='#3f7d3a'; ctx.fillRect(px,py-7,3,7); ctx.fillRect(px+4,py-5,3,5);
      if(seed%2){ ctx.fillStyle='#d23b2a'; ctx.fillRect(px+1,py-10,4,4); }
    } else if(id==='desierto'){
      if(seed%3===0){ ctx.fillStyle='#3f7d3a'; ctx.fillRect(px,py-12,5,12); ctx.fillRect(px-4,py-8,4,3); }
      else if(seed%3===1){ ctx.fillStyle='#c9452a'; ctx.fillRect(px,py-6,4,4); ctx.fillRect(px+6,py-5,3,3);
        ctx.fillStyle='#3f7d3a'; ctx.fillRect(px+1,py-2,2,2); ctx.fillRect(px+7,py-2,2,2); }
      else { ctx.fillStyle='#8a5e2e'; ctx.fillRect(px,py-8,9,8); ctx.fillStyle='#b8874a'; ctx.fillRect(px+2,py-8,5,3); }
    } else if(id==='nieve'){
      ctx.fillStyle='#f2f8fc'; ctx.fillRect(px,py-3,14,3); ctx.fillRect(px+3,py-5,7,2);
      if(seed%2){ const a=0.6+0.3*Math.sin(time*3+seed);
        ctx.fillStyle=`rgba(140,230,255,${a})`;
        ctx.beginPath(); ctx.moveTo(px+22,py-12); ctx.lineTo(px+26,py); ctx.lineTo(px+18,py); ctx.fill(); }
    } else if(id==='volcan'){
      const a=0.5+0.5*Math.sin(time*4+seed);
      ctx.fillStyle='#2e1c22'; ctx.fillRect(px,py-6,8,6);
      ctx.fillStyle=`rgba(255,150,60,${a})`; ctx.fillRect(px+2,py-4,3,2);
    }
  }
  function plat(ctx,pl,time){
    if(pl.wall) return; // los bordes los pinta el bg
    if(pl.solid){ // suelo
      ctx.fillStyle=th.deckDark; ctx.fillRect(pl.x,pl.y,pl.w,pl.h);
      ctx.fillStyle=th.deckTop; ctx.fillRect(pl.x,pl.y,pl.w,5);
      ctx.fillStyle=th.deck;
      for(let i=6;i<pl.w-10;i+=34) ctx.fillRect(pl.x+i,pl.y+9,24,pl.h-12);
      props(ctx,pl,time);
      return;
    }
    ctx.fillStyle=th.deck; ctx.fillRect(pl.x,pl.y,pl.w,pl.h);
    ctx.fillStyle=th.deckTop; ctx.fillRect(pl.x,pl.y,pl.w,4);
    ctx.fillStyle=th.deckDark;
    for(let i=6;i<pl.w-6;i+=26) ctx.fillRect(pl.x+i,pl.y+5,3,pl.h-6);
    if(id==='nieve'){ // carámbanos colgando
      ctx.fillStyle='rgba(230,248,255,.85)';
      for(let i=10;i<pl.w-10;i+=34){
        ctx.beginPath(); ctx.moveTo(pl.x+i,pl.y+pl.h); ctx.lineTo(pl.x+i+4,pl.y+pl.h+9); ctx.lineTo(pl.x+i+8,pl.y+pl.h); ctx.fill();
      }
    } else if(id==='volcan'){ // grietas de lava + brillo flotante
      const p=0.5+0.5*Math.sin(time*3+pl.x);
      ctx.fillStyle=`rgba(255,122,42,${0.5*p})`;
      for(let i=12;i<pl.w-12;i+=40) ctx.fillRect(pl.x+i,pl.y+pl.h-4,16,2);
      ctx.fillStyle=`rgba(255,150,60,${0.12*p})`;
      ctx.beginPath(); ctx.ellipse(pl.x+pl.w/2,pl.y+pl.h+8,pl.w*0.4,7,0,0,7); ctx.fill();
    } else { // cuerdas colgantes (selva/desierto)
      ctx.strokeStyle=th.deckDark; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(pl.x+3,pl.y+pl.h);
      ctx.quadraticCurveTo(pl.x+16,pl.y+pl.h+16,pl.x+28,pl.y+pl.h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pl.x+pl.w-3,pl.y+pl.h);
      ctx.quadraticCurveTo(pl.x+pl.w-16,pl.y+pl.h+16,pl.x+pl.w-28,pl.y+pl.h); ctx.stroke();
    }
    props(ctx,pl,time);
  }

  function fx(ctx,time){
    // grano de textura
    grains.forEach(([x,y,l])=>{
      ctx.fillStyle=l?'rgba(255,255,255,.05)':'rgba(0,0,10,.09)';
      ctx.fillRect(x,y,3,3);
    });
    amb.draw(ctx,time);
    if(M) M.vignette(ctx,W,H);
  }
  return { bg, plat, fx, glowColor:th.glow };
}

window.THEMES={ T, bomberKit, makeScene, FALL_LAYOUTS, BROS_LAYOUTS, CENTERPIECES, TF_ARENAS, makeTFRender, getFallLayout };
})();
