/* HEARTS — datos: roster (los 28 stickers), economía, estado persistente */
(function(){

const ANIMALS = [
  // ---- DEPREDADORES (rojo) ----
  {id:'shark',    name:'TIBURÓN',     side:'pred', price:45, stats:{vel:6,pow:9,def:6}},
  {id:'orca',     name:'ORCA',        side:'pred', price:60, stats:{vel:7,pow:9,def:7}},
  {id:'croc',     name:'COCODRILO',   side:'pred', price:40, stats:{vel:4,pow:8,def:9}},
  {id:'vulture',  name:'BUITRE',      side:'pred', price:28, stats:{vel:7,pow:5,def:4}},
  {id:'lion',     name:'LEÓN',        side:'pred', price:55, stats:{vel:6,pow:8,def:7}},
  {id:'tiger',    name:'TIGRE',       side:'pred', price:50, stats:{vel:8,pow:8,def:5}},
  {id:'wolf',     name:'LOBO',        side:'pred', price:35, stats:{vel:8,pow:7,def:5}},
  {id:'hippo',    name:'HIPOPÓTAMO',  side:'pred', price:44, stats:{vel:3,pow:9,def:9}},
  {id:'bear',     name:'OSO',         side:'pred', price:38, stats:{vel:4,pow:9,def:8}},
  {id:'darkpanda',name:'PANDA NEGRO', side:'pred', price:48, stats:{vel:5,pow:8,def:8}},
  {id:'eagle',    name:'ÁGUILA',      side:'pred', price:42, stats:{vel:9,pow:7,def:4}},
  {id:'otter',    name:'NUTRIA',      side:'pred', price:30, stats:{vel:8,pow:5,def:4}},
  {id:'snake',    name:'SERPIENTE',   side:'pred', price:36, stats:{vel:7,pow:7,def:3}},
  {id:'leopard',  name:'LEOPARDO',    side:'pred', price:58, stats:{vel:9,pow:8,def:5}},
  // ---- PRESAS (azul) ----
  {id:'penguin',  name:'PINGÜINO',    side:'prey', price:15, stats:{vel:5,pow:4,def:6}},
  {id:'seal',     name:'FOCA',        side:'prey', price:16, stats:{vel:4,pow:5,def:7}},
  {id:'toucan',   name:'TUCÁN',       side:'prey', price:22, stats:{vel:7,pow:5,def:4}},
  {id:'chameleon',name:'CAMALEÓN',    side:'prey', price:24, stats:{vel:6,pow:5,def:5}},
  {id:'monkey',   name:'CHANGO',      side:'prey', price:20, stats:{vel:8,pow:5,def:4}},
  {id:'dog',      name:'PERRO',       side:'prey', price:26, stats:{vel:7,pow:6,def:5}},
  {id:'pigeon',   name:'PALOMA',      side:'prey', price:14, stats:{vel:8,pow:3,def:3}},
  {id:'cat',      name:'GATO',        side:'prey', price:28, stats:{vel:8,pow:6,def:4}},
  {id:'mouse',    name:'RATÓN',       side:'prey', price:10, stats:{vel:9,pow:3,def:3}},
  {id:'panda',    name:'PANDA',       side:'prey', price:30, stats:{vel:3,pow:7,def:9}},
  {id:'giraffe',  name:'JIRAFA',      side:'prey', price:18, stats:{vel:6,pow:5,def:5}},
  {id:'elephant', name:'ELEFANTE',    side:'prey', price:32, stats:{vel:3,pow:8,def:9}},
  {id:'platypus', name:'ORNITORRINCO',side:'prey', price:25, stats:{vel:5,pow:5,def:6}},
  {id:'goose',    name:'GANSO',       side:'prey', price:12, stats:{vel:6,pow:4,def:4}},
];

const byId = {}; ANIMALS.forEach(a=>byId[a.id]=a);

// ---- RAREZA + PODER de cada animal (gacha estilo crypto) ----
const RARITY = {
  common:   {key:'common',   name:'COMÚN',      color:'#b8b2a6', rank:0},
  rare:     {key:'rare',     name:'RARO',       color:'#4dd2ff', rank:1},
  epic:     {key:'epic',     name:'ÉPICO',      color:'#c77dff', rank:2},
  legendary:{key:'legendary',name:'LEGENDARIO', color:'#ffd34d', rank:3},
};
// poderes: se activan en el gameplay
// cada poder es también un ULTIMATE activo con la tecla R (ult = nombre, ultDesc = qué hace)
const POWERS = {
  lifesteal:  {name:'ROBAVIDAS',    blurb:'Cada kill te da +1 ♥', color:'#ff5a4d',
    ult:'FRENESÍ',   ultDesc:'R: +1 ♥ al instante y una ONDA que revienta a los de cerca'},
  berserk:    {name:'FURIA',        blurb:'Más rápido con 1 ♥ (última vida)', color:'#ff7a3c',
    ult:'FURIA',     ultDesc:'R: 4s velocísimo + tus flechas se vuelven BOMBA'},
  triple:     {name:'TRIPLE FLECHA',blurb:'El arco dispara 3 flechas', color:'#ffd34d',
    ult:'LLUVIA',    ultDesc:'R: dispara un ABANICO de 7 flechas de golpe'},
  shield:     {name:'CAPARAZÓN',    blurb:'Empiezas cada ronda con escudo', color:'#9ce8ff',
    ult:'BASTIÓN',   ultDesc:'R: escudo al instante + un EMPUJÓN que avienta a todos'},
  heal:       {name:'REGENERACIÓN', blurb:'Recuperas ♥ con el tiempo', color:'#9dff8a',
    ult:'CURACIÓN',  ultDesc:'R: recupera +2 ♥ al momento'},
  dash:       {name:'VELOCIDAD',    blurb:'Corres mucho más rápido', color:'#4dd2ff',
    ult:'EMBESTIDA', ultDesc:'R: dash INVENCIBLE que mata a quien toque'},
  slippery:   {name:'ESCURRIDIZO',  blurb:'Más chico: difícil de golpear', color:'#c9c2b8',
    ult:'FANTASMA',  ultDesc:'R: 4s invisible/inatrapable y más veloz'},
  doublejump: {name:'DOBLE SALTO',  blurb:'Saltas dos veces siempre', color:'#f2ede2',
    ult:'METEORO',   ultDesc:'R: salta al cielo y CAE con pisotón en área'},
};
// asignación por animal (rareza, poder)
const META = {
  orca:{rarity:'legendary',power:'lifesteal'}, lion:{rarity:'legendary',power:'lifesteal'}, eagle:{rarity:'legendary',power:'triple'},
  shark:{rarity:'epic',power:'lifesteal'}, tiger:{rarity:'epic',power:'dash'}, bear:{rarity:'epic',power:'heal'},
  darkpanda:{rarity:'epic',power:'shield'}, leopard:{rarity:'epic',power:'dash'},
  croc:{rarity:'rare',power:'berserk'}, vulture:{rarity:'rare',power:'triple'}, wolf:{rarity:'rare',power:'berserk'},
  hippo:{rarity:'rare',power:'shield'}, snake:{rarity:'rare',power:'slippery'}, chameleon:{rarity:'rare',power:'slippery'},
  cat:{rarity:'rare',power:'dash'}, panda:{rarity:'rare',power:'heal'}, elephant:{rarity:'rare',power:'shield'},
  otter:{rarity:'common',power:'dash'}, penguin:{rarity:'common',power:'shield'}, seal:{rarity:'common',power:'heal'},
  toucan:{rarity:'common',power:'doublejump'}, monkey:{rarity:'common',power:'doublejump'}, dog:{rarity:'common',power:'dash'},
  pigeon:{rarity:'common',power:'doublejump'}, mouse:{rarity:'common',power:'slippery'}, giraffe:{rarity:'common',power:'shield'},
  platypus:{rarity:'common',power:'heal'}, goose:{rarity:'common',power:'doublejump'},
};
ANIMALS.forEach(a=>{ const m=META[a.id]||{rarity:'common',power:'dash'}; a.rarity=m.rarity; a.power=m.power; });
const byRarity=(r)=>ANIMALS.filter(a=>a.rarity===r);

// ---- TAMAÑO físico por animal (multiplicador del sprite + hitbox) — según qué animal ES.
// Los grandes (elefante/hipopótamo/oso) son más grandes y fáciles de pegarle; los chicos
// (ratón/paloma/gato) son diminutos y difíciles de golpear = ventaja/desventaja REAL. ----
const SIZE = {
  elephant:1.34, hippo:1.28, giraffe:1.26,
  bear:1.20, orca:1.20, croc:1.16, shark:1.16, darkpanda:1.12, panda:1.12,
  lion:1.08, tiger:1.04, leopard:1.02, wolf:1.0, snake:1.0, seal:1.0, platypus:0.96,
  vulture:0.98, eagle:0.98, dog:0.94, chameleon:0.92, penguin:0.92, goose:0.9, otter:0.9,
  toucan:0.86, monkey:0.84, cat:0.84, pigeon:0.78, mouse:0.7,
};
ANIMALS.forEach(a=>{ a.size = SIZE[a.id] || 1; });

// ---- SUPERVIVENCIA: los DEPREDADORES naturales de cada animal (llegan en oleadas) ----
const PREDATORS_OF={
  mouse:['cat','snake','eagle'],      pigeon:['cat','eagle','vulture'],   goose:['wolf','croc','eagle'],
  penguin:['orca','seal','shark'],    seal:['orca','shark','bear'],       toucan:['eagle','snake','cat'],
  chameleon:['snake','vulture','cat'],monkey:['leopard','eagle','snake'], dog:['wolf','croc','bear'],
  cat:['wolf','croc','eagle'],        panda:['tiger','leopard','bear'],   giraffe:['lion','croc','leopard'],
  elephant:['lion','tiger','croc'],   platypus:['croc','eagle','snake'],
  shark:['orca','croc','shark'],      orca:['orca','shark','croc'],       croc:['hippo','lion','croc'],
  vulture:['eagle','lion','wolf'],    lion:['tiger','hippo','croc'],      tiger:['lion','bear','wolf'],
  wolf:['bear','tiger','lion'],       hippo:['lion','croc','elephant'],   bear:['tiger','wolf','lion'],
  darkpanda:['tiger','bear','leopard'],eagle:['eagle','vulture','leopard'],otter:['croc','eagle','wolf'],
  snake:['eagle','vulture','hippo'],  leopard:['lion','tiger','bear'],
};
function predatorsOf(id){ return (PREDATORS_OF[id]||['wolf','eagle','croc']).slice(0,3); }

// ---- CLANES (locales por ahora; los lugares los llenan miembros de relleno hasta que haya servidor) ----
const CLAN_BADGES=['🛡️','🐾','🔥','❄️','⚡','🌵'];
function fakeClanMembers(n){
  const out=[], used={};
  for(let i=0;i<n;i++){ let nm, guard=0;
    do{ nm=BOT_NAMES[Math.floor(Math.random()*BOT_NAMES.length)]; }while(used[nm]&&guard++<30);
    used[nm]=1; out.push({name:nm, cups:20+Math.floor(Math.random()*900)}); }
  return out.sort((a,b)=>b.cups-a.cups);
}
function suggestedClans(){ return [
  {name:'GARRAS MX',        badge:'🐾', members:fakeClanMembers(9)},
  {name:'REYES DEL VOLCÁN', badge:'🔥', members:fakeClanMembers(12)},
  {name:'HIELO ETERNO',     badge:'❄️', members:fakeClanMembers(7)},
]; }
function createClan(name,badge){
  name=String(name||'').trim().slice(0,18); if(name.length<3) return null;
  S.clan={name, badge:badge||'🛡️', members:fakeClanMembers(5+Math.floor(Math.random()*6)), mine:true};
  save(); return S.clan;
}
function joinClan(c){ if(!c) return null; S.clan={name:c.name, badge:c.badge, members:c.members, mine:false}; save(); return S.clan; }
function leaveClan(){ S.clan=null; save(); }

// ---- COFRES (gacha): entre más caro, mejores probabilidades ----
// los cofres cuestan DINERO real (compra demo, sin pago de verdad); el duplicado se convierte en ORO
const CHESTS = [
  {id:'wood',   name:'COFRE DE MADERA', usd:0.99,  color:'#b07b3a', odds:{common:82,rare:16,epic:2, legendary:0}},
  {id:'silver', name:'COFRE DE PLATA',  usd:2.99,  color:'#c7ccd6', odds:{common:52,rare:34,epic:11,legendary:3}},
  {id:'gold',   name:'COFRE DE ORO',    usd:6.99,  color:'#ffd34d', odds:{common:26,rare:38,epic:27,legendary:9}},
  {id:'diamond',name:'COFRE DIAMANTE',  usd:14.99, color:'#7ef0ff', odds:{common:6, rare:30,epic:42,legendary:22}},
];
const byChest={}; CHESTS.forEach(c=>byChest[c.id]=c);
function rollRarity(odds){
  const total=Object.values(odds).reduce((a,b)=>a+b,0);
  let r=Math.random()*total;
  for(const k of ['legendary','epic','rare','common']){ r-=(odds[k]||0); if(r<0) return k; }
  return 'common';
}
// abre un cofre: compra DEMO en dinero (no cobra de verdad); saca un animal random según rareza
function openTreasure(chestId){
  const ch=byChest[chestId]; const st=S;
  if(!ch) return {ok:false,msg:'Cofre inválido'};
  const free = st.freeChest && chestId==='wood';   // primer cofre de madera GRATIS (bienvenida)
  if(free) st.freeChest=false;                     // el resto: compra demo en $ (sin pago real)
  let rarity=rollRarity(ch.odds);
  let pool=byRarity(rarity);
  while(pool.length===0 && rarity!=='common'){ rarity=({legendary:'epic',epic:'rare',rare:'common'})[rarity]; pool=byRarity(rarity); }
  const animal=pool[Math.floor(Math.random()*pool.length)];
  const dupe=!!st.owned[animal.id];
  const token=mint(animal.id);        // acuña / re-acuña
  if(!st.selected) st.selected=animal.id;
  let refund=0;
  if(dupe){ refund=Math.round((ECON.RARITY_GOLD[animal.rarity]||40)/2); S.coins+=refund; }  // duplicado → ORO (estilo CR)
  save();
  return {ok:true, animal, rarity, token, dupe, refund, chest:ch, free};
}

// ================== MODELO CLASH ROYALE (free-to-play que PICA) ==================
// COFRES por VICTORIA → 4 SLOTS con TIEMPO de desbloqueo → cartas (copias) + oro.
// COPIAS + ORO → SUBIR DE NIVEL las cartas. GEMAS 💎 = prisa/cofres (se "compran" con $ demo).
// COFRE GRATIS cada rato + OFERTAS del día + CAMINO DE COPAS con premios reclamables.
const CHEST_META={   // t = segundos de desbloqueo (escalar CUESTA: tiempos más largos)
  wood:   {t:120,  gold:[15,30],   stacks:2},
  silver: {t:480,  gold:[40,80],   stacks:3},
  gold:   {t:1200, gold:[100,200], stacks:4},
  diamond:{t:2700, gold:[250,500], stacks:5},
};
const CHEST_GEMS={wood:10, silver:25, gold:60, diamond:140};      // comprar cofre YA con gemas
const GEM_PACKS=[
  {id:'g1', gems:80,   usd:1.99},
  {id:'g2', gems:500,  usd:9.99,  popular:true},
  {id:'g3', gems:1200, usd:19.99},
];
const UPGRADE={ copies:[0,2,4,10,20], gold:[0,50,120,300,800] };  // de nivel L a L+1 (máx 5) — curva de montaña
const MAXLVL=5;
const COPIES_BY_RARITY={common:[3,6], rare:[2,3], epic:[1,2], legendary:[1,1]};
const FREE_EVERY=600;                                             // seg entre cofres gratis (10 min)
const ROAD_REWARDS=[ {gold:80},{gems:15},{gold:250},{chest:'gold'},{gems:30},{gold:800},{gems:60},{gold:2000} ];

function cardOf(id){ if(!S.cards) S.cards={}; if(!S.cards[id]) S.cards[id]={copies:0, level:1}; return S.cards[id]; }
function cardLevel(id){ return (S.cards&&S.cards[id])?S.cards[id].level:1; }
function addCopies(id,n){
  const c=cardOf(id);
  const isNew=!S.owned[id];
  if(isNew){ mint(id); if(!S.selected) S.selected=id; livesMap()[id]=maxLivesOf(byId[id]); }  // nuevo = vidas llenas
  else refillLives(id, 2*n);                        // copia repetida = +2 VIDAS por copia (recarga)
  c.copies+=n; save();
  return isNew;
}
function canUpgrade(id){
  const c=cardOf(id); if(c.level>=MAXLVL) return false;
  return c.copies>=UPGRADE.copies[c.level] && (S.coins|0)>=UPGRADE.gold[c.level];
}
function upgradeCard(id){
  const c=cardOf(id); if(!canUpgrade(id)) return null;
  S.coins-=UPGRADE.gold[c.level]; c.copies-=UPGRADE.copies[c.level]; c.level++;
  save(); return c.level;
}
// --- SLOTS de cofres (se ganan JUGANDO; se desbloquean con tiempo, uno a la vez) ---
function slots(){ if(!Array.isArray(S.slots)||S.slots.length!==4) S.slots=[null,null,null,null]; return S.slots; }
function awardChest(chestId){
  const sl=slots(); const i=sl.findIndex(s=>!s);
  if(i<0) return -1;                                   // slots llenos (como CR)
  sl[i]={chest:chestId, state:'idle', endsAt:0}; save(); return i;
}
function startUnlock(i){
  const sl=slots(); const s=sl[i]; if(!s||s.state!=='idle') return false;
  if(sl.some(x=>x&&x.state==='unlocking')) return false;   // solo UNO a la vez (como CR)
  s.state='unlocking'; s.endsAt=Date.now()+(CHEST_META[s.chest].t*1000); save(); return true;
}
function unlockLeft(i){ const s=slots()[i]; if(!s||s.state!=='unlocking') return Infinity;
  return Math.max(0, Math.ceil((s.endsAt-Date.now())/1000)); }
function skipCost(i){ return Math.max(1, Math.ceil(unlockLeft(i)/60)); }   // ~1💎 por minuto
function skipUnlock(i){
  const s=slots()[i]; if(!s||s.state!=='unlocking') return false;
  const cost=skipCost(i); if((S.gems|0)<cost) return false;
  S.gems-=cost; s.endsAt=Date.now(); save(); return true;
}
function rollChestRewards(chestId){
  const ch=byChest[chestId], meta=CHEST_META[chestId]; if(!ch||!meta) return null;
  const gold=meta.gold[0]+Math.floor(Math.random()*(meta.gold[1]-meta.gold[0]+1));
  const stacks=[];
  for(let k=0;k<meta.stacks;k++){
    let rar=rollRarity(ch.odds);
    if(chestId==='diamond'&&k===0&&(rar==='common'||rar==='rare')) rar='epic';   // diamante garantiza épico+
    let pool=byRarity(rar);
    while(pool.length===0&&rar!=='common'){ rar=({legendary:'epic',epic:'rare',rare:'common'})[rar]; pool=byRarity(rar); }
    // ESCALAR CUESTA: 65% de las veces el cofre da COPIAS de un animal que YA tienes
    const owned=pool.filter(a=>S.owned[a.id]);
    if(owned.length && Math.random()<0.65) pool=owned;
    const an=pool[Math.floor(Math.random()*pool.length)];
    const [c0,c1]=COPIES_BY_RARITY[rar]; const copies=c0+Math.floor(Math.random()*(c1-c0+1));
    const isNew=addCopies(an.id,copies);
    stacks.push({animal:an, rarity:rar, copies, isNew});
  }
  S.coins=(S.coins|0)+gold; save();
  return {chest:ch, gold, stacks};
}
function openSlot(i){
  const s=slots()[i]; if(!s||s.state!=='unlocking'||unlockLeft(i)>0) return null;
  const r=rollChestRewards(s.chest); slots()[i]=null; save(); return r;
}
function buyChestGems(chestId){
  const cost=CHEST_GEMS[chestId]; if((S.gems|0)<cost) return null;
  S.gems-=cost; return rollChestRewards(chestId);       // instantáneo (como comprar en CR)
}
function freeLeft(){ return Math.max(0, Math.ceil(((S.freeAt||0)-Date.now())/1000)); }
function claimFree(){
  if(freeLeft()>0) return null;
  S.freeAt=Date.now()+FREE_EVERY*1000; return rollChestRewards('wood');
}
function buyGems(packId){ const p=GEM_PACKS.find(x=>x.id===packId); if(!p) return null;
  S.gems=(S.gems|0)+p.gems; save(); return p; }          // compra DEMO (sin pago real)
// --- OFERTAS DEL DÍA (3 cartas por oro, rotan diario) ---
function getDeals(){
  const today=new Date().toDateString();
  if(S.shopDay!==today||!Array.isArray(S.shopDeals)){
    const pick=r=>{ const pool=byRarity(r); return pool[Math.floor(Math.random()*pool.length)].id; };
    S.shopDeals=[
      {id:pick('common'),    copies:3, gold:120, bought:false},
      {id:pick('rare'),      copies:2, gold:350, bought:false},
      {id:pick('epic'),      copies:1, gold:900, bought:false},
    ];
    S.shopDay=today; save();
  }
  return S.shopDeals;
}
function buyDeal(i){
  const d=getDeals()[i]; if(!d||d.bought) return null;
  if((S.coins|0)<d.gold) return {ok:false, need:d.gold};
  S.coins-=d.gold; d.bought=true; const isNew=addCopies(d.id,d.copies); save();
  return {ok:true, animal:byId[d.id], copies:d.copies, isNew};
}
// --- CAMINO DE COPAS: premio reclamable por cada arena alcanzada ---
function roadClaimable(idx){
  if(!S.roadClaimed) S.roadClaimed={};
  return (S.cups|0)>=RANK_TIERS[idx].hmin && !S.roadClaimed[idx] && !!ROAD_REWARDS[idx];
}
function claimRoad(idx){
  if(!roadClaimable(idx)) return null;
  const r=ROAD_REWARDS[idx]; S.roadClaimed[idx]=true;
  if(r.gold) S.coins=(S.coins|0)+r.gold;
  if(r.gems) S.gems=(S.gems|0)+r.gems;
  if(r.chest){ if(awardChest(r.chest)<0){ S.coins=(S.coins|0)+200; r._full=true; } }  // slots llenos → oro
  save(); return r;
}
// cofre que GANAS por victoria (mejor arena = mejores cofres)
function rollVictoryChest(){
  const idx=playerRankCups().idx, r=Math.random();
  if(r<0.02+idx*0.006) return 'diamond';
  if(r<0.10+idx*0.015) return 'gold';
  if(r<0.42) return 'silver';
  return 'wood';
}

// ---- armas: arcos (rango) y espadas (melee); se compran con MONEDAS ----
const WEAPONS = [
  // arco por default (único). Sin espadas ni armería.
  {id:'bow_wood',  name:'ARCO',  kind:'bow',  price:0,  ammo:3, arrowSpeed:720, cd:0.32, tint:'#e8d9b0', blurb:'Tu arco.'},
];
const byWeapon = {}; WEAPONS.forEach(w=>byWeapon[w.id]=w);

// ---- MODOS DE JUEGO (estilo TowerFall) — la única forma de jugar ----
const MODES = [
  {id:'lms',    name:'LAST MAN STANDING', icon:'☠', color:'#e8c11e', players:4, lives:3, respawn:1.2, dur:120,
    blurb:'Última vida. El último en pie GANA.'},
  {id:'hunt',   name:'HEADHUNTERS',       icon:'💀', color:'#c77dff', players:4, respawn:1.4, dur:75, goal:10,
    blurb:'Mata para soltar CALAVERAS. Junta más y ganas.'},
  {id:'tdm',    name:'TEAM DEATHMATCH',   icon:'⚔', color:'#4dd2ff', players:4, teams:true, respawn:1.4, dur:90, goal:15,
    blurb:'2 vs 2. El equipo con más kills gana.'},
  {id:'quest',  name:'QUEST',             icon:'🛡', color:'#57d977', players:2, coop:true, teams:true, respawn:1.6, dur:150, waves:3, questGoal:18,
    blurb:'Cooperativo: sobrevive OLEADAS de enemigos.'},
  {id:'trials', name:'TRIALS',            icon:'🎯', color:'#ff9e3c', players:1, solo:true, respawn:0.6, dur:45, goal:20,
    blurb:'Solo. Rompe BLANCOS contra el reloj.'},
];
const byMode={}; MODES.forEach(m=>byMode[m.id]=m);

// ---- economía: COMPRAS un monito (trae ciertos ♥) y su misión es SUBIR de corazones jugando ----
const ECON = {
  PLAYERS: 4,
  LIVES: 3,                              // vidas en la arena
  PLACE_HEARTS: {1:3, 2:1, 3:0, 4:-1},   // ♥ que sube/baja tu mono según su lugar (el 1º sube, el último cae)
  XP_REWARD: {1:80, 2:45, 3:30, 4:20},   // XP por lugar (nivel del monito)
  START_HEARTS: 100,      // balance de cuenta (wallet/rango); en el ARENA todos entran con sus 3 vidas
  START_COINS: 60,
  COIN_REWARD: {1:60,2:35,3:22,4:14},
  RARITY_HEARTS: {common:25, rare:50, epic:90, legendary:150}, // ♥ con los que VIENE el monito según rareza
  RARITY_PRICE:  {common:0.99, rare:2.99, epic:6.99, legendary:14.99}, // (cofres) precio en dinero real (demo)
  RARITY_GOLD:   {common:150, rare:450, epic:1200, legendary:3000}, // ORO: precio del monito — conseguir más CUESTA
};
function animalHearts(a){ return (ECON.RARITY_HEARTS[a.rarity]||25); }
function animalPrice(a){ return (ECON.RARITY_PRICE[a.rarity]||0.99); }
function animalGold(a){ return (ECON.RARITY_GOLD[a.rarity]||40); }   // precio en ORO
// ---- VIDAS del monito: cada mono que compras VIENE con X vidas; PERDER las gasta.
// A 0 vidas el mono queda AGOTADO y tienes que comprar otro (o recargar con copias de cofre: +2 c/u).
// REGLA SUPERCELL: el juego NUNCA se bloquea — el RATÓN inicial es GRATIS e INFINITO.
const FREE_STARTER='mouse';
const RARITY_LIVES={common:5, rare:8, epic:12, legendary:18};
function maxLivesOf(a){ return a.id===FREE_STARTER?Infinity:(RARITY_LIVES[a.rarity]||5); }
function livesMap(){ if(!S.lives||typeof S.lives!=='object') S.lives={}; return S.lives; }
function animalLives(id){ if(id===FREE_STARTER) return Infinity; const m=livesMap(); return (m[id]==null)?0:(m[id]|0); }
function isSpent(id){ if(id===FREE_STARTER) return false; return !!S.owned[id] && animalLives(id)<=0; }
function spendLives(id,n){
  if(id===FREE_STARTER) return Infinity;             // el ratón nunca se gasta
  const m=livesMap(); m[id]=Math.max(0,(m[id]|0)-(n|0)); save(); return m[id];
}
function refillLives(id,n){       // copias de cofre / recarga: suma vidas con tope
  const a=byId[id]; if(!a) return 0;
  const m=livesMap(); m[id]=Math.min(maxLivesOf(a), (m[id]|0)+(n|0)); save(); return m[id];
}
// COMPRAR un monito con ORO: nuevo = lo posees con vidas LLENAS; agotado = compras OTRO (vidas llenas)
function buyAnimal(id){
  const a=byId[id]; if(!a) return null;
  const owned=!!S.owned[id];
  if(owned && animalLives(id)>0) return {already:true, animal:a};   // vivo: no hay nada que comprar
  const cost=animalGold(a);
  if((S.coins|0) < cost) return {ok:false, need:cost, have:S.coins|0, animal:a};   // no te alcanza el oro
  S.coins -= cost;
  if(!owned){ mint(id); if(!S.selected) S.selected=id; }
  livesMap()[id]=maxLivesOf(a);                                     // monito nuevo = vidas llenas
  save();
  return {ok:true, animal:a, cost:cost, revived:owned};
}
function gainGold(n){ S.coins=Math.max(0,(S.coins|0)+(n|0)); save(); return S.coins; }

// ---- PAQUETES DE CORAZONES (tienda) — compra simulada (demo, sin pago real) ----
const HEART_PACKS = [
  {id:'p1', hearts:100,  usd:0.99,  label:'PUÑADO',  bonus:''},
  {id:'p2', hearts:600,  usd:4.99,  label:'BOLSA',   bonus:'+20%'},
  {id:'p3', hearts:1400, usd:9.99,  label:'COFRE',   bonus:'+40%', popular:true},
  {id:'p4', hearts:3200, usd:19.99, label:'BAÚL',    bonus:'+60%'},
];
function buyPack(id){ const p=HEART_PACKS.find(x=>x.id===id); if(!p) return null; S.hearts+=p.hearts; save(); return p; }

// ---- MESAS: cada una con su STACK (entrada). Entras con tu stack, el ganador se lleva la BOLSA (4× entrada). ----
const RANKS = [
  {id:'t1', name:'CASUAL', entry:10,   color:'#6b8f5a'},
  {id:'t2', name:'BRONCE', entry:50,   color:'#b5772e'},
  {id:'t3', name:'PLATA',  entry:150,  color:'#727b88'},
  {id:'t4', name:'ORO',    entry:500,  color:'#c99a17'},
  {id:'t5', name:'VIP',    entry:1500, color:'#9b4dd6'},
  {id:'t6', name:'ALTA',   entry:5000, color:'#c0392b'},
];
function rankAt(i){
  i=Math.max(0,Math.min(RANKS.length-1, i|0));
  const r=RANKS[i], pot=r.entry*ECON.PLAYERS;
  return {idx:i, id:r.id, name:r.name, color:r.color, entry:r.entry, pot, prize:pot};   // ganador se lleva la bolsa
}
function curRank(){ return rankAt(S.rank||0); }
function setRank(i){ S.rank=Math.max(0,Math.min(RANKS.length-1,i|0)); save(); return curRank(); }
function mesaPlayable(i){ return S.hearts>=rankAt(i).entry; }              // solo necesitas el stack
function maxAffordableRank(){ let m=0; for(let i=0;i<RANKS.length;i++){ if(mesaPlayable(i)) m=i; } return m; }

// ---- estado ----
const DEFAULT = ()=>({
  name:null,
  hearts:ECON.START_HEARTS,
  cups:0,             // COPAS: puntos de RANGO estilo Clash Royale — el nuevo usuario empieza en 0
  coins:ECON.START_COINS,
  gems:30,            // GEMAS 💎 de arranque (como CR regala las primeras)
  slots:[null,null,null,null],   // 4 SLOTS de cofres (se ganan jugando, desbloqueo por tiempo)
  cards:{},           // {animalId:{copies,level}} — colección estilo CR (copias → subir nivel)
  lives:{},           // {animalId: vidas restantes} — cada mono VIENE con X vidas; a 0 = comprar otro
  freeAt:0,           // timestamp del próximo COFRE GRATIS
  roadClaimed:{},     // premios del camino de copas ya reclamados
  shopDay:null, shopDeals:null,  // ofertas del día (3 cartas por oro)
  ftueSeen:false,     // ¿ya pasó la primera batalla guiada?
  clan:null,          // {name,badge,members[],mine} — clanes locales (demo) hasta que haya servidor
  owned:{mouse:'#0000'},  // arranca SOLO con el RATÓN (gratis); los mejores se compran en la landing
  weapons:['bow_wood'],   // armas que posees
  weapon:'bow_wood',      // arma equipada
  selected:'mouse',
  xp:0,
  wins:0, matches:0, heartsWon:0, cupsWon:0,
  rp:0,               // RANK POINTS (ranked estilo R6): COBRE V → CAMPEÓN
  rank:0,             // (mesas diferidas) índice en RANKS
  houseHearts:0,      // TESORERÍA: ganancia acumulada de la casa (rake de cada partida)
  lastDaily:null,
  mintCount:0,
  tut:false,
  onboarded:false,  // ¿ya vio las pantallas de bienvenida (copas/rangos/cómo jugar)?
  freeChest:true,   // cofre de bienvenida GRATIS para el nuevo usuario
});
let S = DEFAULT();
// ===== CUENTAS POR USUARIO (progreso guardado por cuenta, en este navegador) =====
const ACC_KEY='hearts-accounts', SES_KEY='hearts-user';
function accounts(){ try{ return JSON.parse(localStorage.getItem(ACC_KEY))||{}; }catch(e){ return {}; } }
function saveAccounts(a){ try{ localStorage.setItem(ACC_KEY, JSON.stringify(a)); }catch(e){} }
function session(){ try{ return localStorage.getItem(SES_KEY)||null; }catch(e){ return null; } }
function logout(){ try{ localStorage.removeItem(SES_KEY); }catch(e){} }
// entra o CREA la cuenta: si el usuario no existe se crea con esa contraseña; si existe, se valida
function loginOrCreate(name, pass){
  name=String(name||'').trim().slice(0,14);
  if(name.length<2) return {ok:false, err:'Escribe un nombre (2+ letras)'};
  const key=name.toUpperCase(), acc=accounts();
  if(acc[key]){
    if(String(acc[key].pass||'')!==String(pass||'')) return {ok:false, err:'Contraseña incorrecta para '+name};
    S=Object.assign(DEFAULT(), acc[key].save||{}); S.name=acc[key].save&&acc[key].save.name||name;
    try{ localStorage.setItem(SES_KEY,key); }catch(e){}
    normalize(); save();
    return {ok:true, created:false};
  }
  // cuenta NUEVA: si hay un save viejo con este mismo nombre, se adopta (migración amable)
  let base=null;
  try{ const raw=localStorage.getItem('hearts-save'); if(raw){ const old=JSON.parse(raw);
    if(String(old.name||'').toUpperCase()===key) base=old; } }catch(e){}
  S=base?Object.assign(DEFAULT(),base):DEFAULT(); S.name=name;
  acc[key]={pass:String(pass||''), save:S};
  saveAccounts(acc);
  try{ localStorage.setItem(SES_KEY,key); }catch(e){}
  normalize(); save();
  return {ok:true, created:true};
}
function load(){
  const key=session(), acc=accounts();
  if(key && acc[key]) S=Object.assign(DEFAULT(), acc[key].save||{});
  else { try{ const raw=localStorage.getItem('hearts-save'); if(raw) S=Object.assign(DEFAULT(),JSON.parse(raw)); }catch(e){} }
  normalize();
  return S;
}
function normalize(){
  // limpia animales que ya no existan en el roster
  Object.keys(S.owned).forEach(id=>{ if(!byId[id]) delete S.owned[id]; });
  if(S.selected && !byId[S.selected]) S.selected=Object.keys(S.owned)[0]||null;
  // armas: siempre posees el arco básico y hay una equipada válida
  if(!Array.isArray(S.weapons)) S.weapons=['bow_wood'];
  if(!S.weapons.includes('bow_wood')) S.weapons.unshift('bow_wood');
  S.weapons=S.weapons.filter(id=>byWeapon[id]);
  if(!byWeapon[S.weapon] || !S.weapons.includes(S.weapon)) S.weapon='bow_wood';
  if(typeof S.coins!=='number') S.coins=ECON.START_COINS;
  if(typeof S.gems!=='number') S.gems=30;
  if(!Array.isArray(S.slots)||S.slots.length!==4) S.slots=[null,null,null,null];
  if(!S.cards||typeof S.cards!=='object') S.cards={};
  if(!S.roadClaimed||typeof S.roadClaimed!=='object') S.roadClaimed={};
  // los animales que ya posees siempre tienen carta (nivel 1 mínimo)
  Object.keys(S.owned).forEach(id=>{ if(!S.cards[id]) S.cards[id]={copies:0,level:1}; });
  // vidas: saves viejos sin registro → vidas llenas (no castigar migración)
  if(!S.lives||typeof S.lives!=='object') S.lives={};
  Object.keys(S.owned).forEach(id=>{ if(S.lives[id]==null && byId[id] && id!==FREE_STARTER) S.lives[id]=maxLivesOf(byId[id]); });
  // el RATÓN inicial SIEMPRE existe (aunque el save venga de la landing): jugar nunca se bloquea
  if(!S.owned[FREE_STARTER]){ S.owned[FREE_STARTER]='#0000'; if(!S.cards[FREE_STARTER]) S.cards[FREE_STARTER]={copies:0,level:1}; }
  if(!S.selected || !byId[S.selected]) S.selected=FREE_STARTER;
  if(typeof S.rank!=='number' || S.rank<0 || S.rank>=RANKS.length) S.rank=0;   // rango válido
}
// ---- armas: comprar / equipar ----
function buyWeapon(id){
  const w=byWeapon[id]; if(!w) return {ok:false,msg:'Arma inválida'};
  if(S.weapons.includes(id)) return {ok:false,msg:'Ya la tienes'};
  if(S.coins<w.price) return {ok:false,msg:'No te alcanzan las monedas'};
  S.coins-=w.price; S.weapons.push(id); S.weapon=id; save();
  return {ok:true};
}
function equipWeapon(id){ if(S.weapons.includes(id)&&byWeapon[id]){ S.weapon=id; save(); return true; } return false; }
function equipped(){ return byWeapon[S.weapon]||byWeapon['bow_wood']; }
function save(){
  try{ localStorage.setItem('hearts-save',JSON.stringify(S)); }catch(e){}
  const key=session();
  if(key){ const a=accounts(); if(a[key]){ a[key].save=S; saveAccounts(a); } }
}
function reset(){ S=DEFAULT(); save(); }

function level(){ return Math.floor(Math.sqrt(S.xp/40))+1; }
function xpForLevel(l){ return 40*(l-1)*(l-1); }
function levelProgress(){
  const l=level();
  const a=xpForLevel(l), b=xpForLevel(l+1);
  return (S.xp-a)/(b-a);
}

// ---- ASCENSO DEL MONITO: rango de jugador por nivel (el gancho de progreso) ----
const TITLES = [
  {lvl:1,  name:'NOVATO',     color:'#b8b2a6'},
  {lvl:3,  name:'APRENDIZ',   color:'#8fb56a'},
  {lvl:6,  name:'CAZADOR',    color:'#c08a4a'},
  {lvl:10, name:'VETERANO',   color:'#8fa0b5'},
  {lvl:15, name:'ÉLITE',      color:'#4dd2ff'},
  {lvl:22, name:'MAESTRO',    color:'#e8c11e'},
  {lvl:30, name:'CAMPEÓN',    color:'#ff7a3c'},
  {lvl:40, name:'LEYENDA',    color:'#c77dff'},
];
function playerRank(){ let r=TITLES[0]; for(const t of TITLES){ if(level()>=t.lvl) r=t; } return r; }
function nextRank(){ const l=level(); for(const t of TITLES){ if(t.lvl>l) return t; } return null; }
// suma XP → sube de nivel. NADIE SUMA CORAZONES; el nivel solo regala COFRES (animales).
function gainXP(n){
  const before=level(), beforeRank=playerRank().name;
  S.xp += n;
  const after=level(), afterRank=playerRank().name;
  const up = after>before;
  let chest=false, ranked=beforeRank!==afterRank;
  if(up){
    for(let l=before+1; l<=after; l++){ if(l%3===0) chest=true; }   // cofre gratis cada 3 niveles
    if(chest) S.freeChest=true;
  }
  save();
  return { up, level:after, reward:0, chest, ranked, rankName:afterRank };
}

// ---- RANGO por CORAZONES: entre más ♥ tienes, mayor rango (COBRE→CAMPEÓN) ----
const RANK_TIERS = [
  {id:'copper',  name:'COBRE',    c1:'#c07a45', c2:'#7a4a26', hmin:0},
  {id:'bronze',  name:'BRONCE',   c1:'#d29a55', c2:'#8f5f2a', hmin:60},
  {id:'silver',  name:'PLATA',    c1:'#d7dde5', c2:'#8b95a3', hmin:150},
  {id:'gold',    name:'ORO',      c1:'#f3ce5b', c2:'#c2960f', hmin:350},
  {id:'platinum',name:'PLATINO',  c1:'#5fe0da', c2:'#279ea6', hmin:700},
  {id:'emerald', name:'ESMERALDA',c1:'#57e07f', c2:'#1f9a55', hmin:1200},
  {id:'diamond', name:'DIAMANTE', c1:'#9fd0ff', c2:'#5a7fe6', hmin:2500},
  {id:'champion',name:'CAMPEÓN',  c1:'#ecb6ff', c2:'#b25fe6', hmin:5000},
];
// rango según cuántos ♥ tienes
function rankFromHearts(h){
  h=Math.max(0,h|0);
  let ti=0; for(let i=0;i<RANK_TIERS.length;i++){ if(h>=RANK_TIERS[i].hmin) ti=i; }
  const t=RANK_TIERS[ti], next=RANK_TIERS[ti+1]||null, span=next?(next.hmin-t.hmin):1;
  return { tier:t, name:t.name, color:t.c1, idx:ti, hearts:h, next,
    toNext: next?Math.max(0,next.hmin-h):0, progress: next?Math.min(1,Math.max(0,(h-t.hmin)/span)):1, isMax:!next };
}
function playerRankHearts(){ return rankFromHearts(S.hearts); }
// COPAS (ranking estilo Clash Royale): mismos umbrales que los rangos, medidos en copas
function rankFromCups(c){ return rankFromHearts(c); }
function playerRankCups(){ return rankFromHearts(S.cups|0); }
function gainCups(n){ S.cups=Math.max(0,(S.cups|0)+(n|0)); if(n>0) S.cupsWon=(S.cupsWon|0)+n; save(); return S.cups; }
const RP_PER_DIV = 120, DIVS = 5;                 // 5 divisiones (V..I) por tier · 600 RP por tier
const TIER_RP = RP_PER_DIV*DIVS;
const CHAMP_RP = (RANK_TIERS.length-1)*TIER_RP;   // 7*600 = 4200 → CAMPEÓN
function rankFromRP(rp){
  rp=Math.max(0, rp|0);
  if(rp>=CHAMP_RP){ const t=RANK_TIERS[7];
    return {tier:t, name:'CAMPEÓN', div:0, roman:'', color:t.c1, rp, rpInto:rp-CHAMP_RP, rpNext:0, progress:1, isChamp:true, idx:35}; }
  const ti=Math.min(6, Math.floor(rp/TIER_RP)), t=RANK_TIERS[ti];
  const into=rp-ti*TIER_RP, di=Math.floor(into/RP_PER_DIV);   // 0..4
  const div=DIVS-di, roman=['I','II','III','IV','V'][div-1];
  return {tier:t, name:t.name+' '+roman, div, roman, color:t.c1, rp,
    rpInto:into-di*RP_PER_DIV, rpNext:RP_PER_DIV, progress:(into-di*RP_PER_DIV)/RP_PER_DIV, isChamp:false, idx:ti*DIVS+di};
}
function playerRankR6(){ return rankFromRP(S.rp||0); }
const RP_REWARD = {1:45, 2:16, 3:4, 4:-14};       // ganas RP al ganar, pierdes al perder (como R6)
function gainRP(place){
  const before=rankFromRP(S.rp||0), delta=RP_REWARD[place]||0;
  S.rp=Math.max(0,(S.rp||0)+delta);
  const after=rankFromRP(S.rp); save();
  return { delta, before, after, promoted:after.idx>before.idx, demoted:after.idx<before.idx,
    tierUp:after.tier.id!==before.tier.id && after.idx>before.idx };
}

function mint(id){
  S.mintCount++;
  const token='#'+String(1000+Math.floor(Math.random()*9000));
  S.owned[id]=token;
  if(!S.selected) S.selected=id;
  save();
  return token;
}

// ---- bots ----
const BOT_NAMES = ['DarkFang99','LaBestiaMX','K1LLERBEE','TlacuacheKing','Sr.Colmillo','NoScopeNina',
  'ElPatron777','GARRAS_DE_ACERO','xX_Cazador_Xx','MorelosGG','DonDepredador','FuriaSalvaje',
  'PixelPuma','ReyDelPantano','Lady_Zarpa','ColmilloNorte','BravoLobo','CACERIA_MX'];
function randomBots(n, excludeAnimal){
  const pool = ANIMALS.filter(a=>a.id!==excludeAnimal);
  const names = BOT_NAMES.slice();
  const bots=[];
  for(let i=0;i<n;i++){
    const a = pool[Math.floor(Math.random()*pool.length)];   // permite repetidos si hay muchos jugadores
    const nm = names.length ? names.splice(Math.floor(Math.random()*names.length),1)[0] : ('Rival'+(i+1));
    bots.push({name:nm, animal:a, bot:true});
  }
  return bots;
}

// leaderboard persistente (generado una vez)
function leaderboard(){
  let board;
  try{ board=JSON.parse(localStorage.getItem('hearts-board')); }catch(e){}
  if(!board){
    board = BOT_NAMES.map(n=>({name:n, animal:ANIMALS[Math.floor(Math.random()*ANIMALS.length)].id,
      hearts: 10+Math.floor(Math.random()*220)})).sort((a,b)=>b.hearts-a.hearts);
    localStorage.setItem('hearts-board',JSON.stringify(board));
  }
  return board;
}

// stats en puntitos (1-5) estilo carta: los DEPREDADORES tienen R más alta que las presas
function statPips(a){
  const clamp=v=>Math.max(1,Math.min(5,v));
  const dif=clamp(Math.round(a.stats.pow/2));
  const spd=clamp(Math.round(a.stats.vel/2));
  const hp =clamp(Math.round(a.stats.def/2));
  const base=clamp(Math.ceil(a.price/12));
  const r = a.side==='pred' ? clamp(base+1) : clamp(base);
  return {dif,spd,hp,r};
}

window.DATA = { ANIMALS, byId, WEAPONS, byWeapon, ECON, MODES, byMode, HEART_PACKS, buyPack, animalHearts, animalPrice, animalGold, gainGold, buyAnimal, RANKS, rankAt, curRank, setRank, maxAffordableRank, mesaPlayable,
  RARITY, POWERS, CHESTS, byChest, byRarity, openTreasure,
  state:()=>S, load, save, reset, level, levelProgress, TITLES, playerRank, nextRank, gainXP,
  RANK_TIERS, rankFromRP, playerRankR6, gainRP, rankFromHearts, playerRankHearts, rankFromCups, playerRankCups, gainCups, mint, randomBots, leaderboard, BOT_NAMES, statPips, buyWeapon, equipWeapon, equipped,
  // modelo CLASH ROYALE
  CHEST_META, CHEST_GEMS, GEM_PACKS, UPGRADE, MAXLVL, ROAD_REWARDS, FREE_EVERY,
  cardOf, cardLevel, canUpgrade, upgradeCard, slots, awardChest, startUnlock, unlockLeft, skipCost, skipUnlock,
  openSlot, buyChestGems, freeLeft, claimFree, buyGems, getDeals, buyDeal, roadClaimable, claimRoad, rollVictoryChest,
  RARITY_LIVES, FREE_STARTER, maxLivesOf, animalLives, isSpent, spendLives, refillLives,
  loginOrCreate, logout, session, predatorsOf,
  CLAN_BADGES, suggestedClans, createClan, joinClan, leaveClan };
})();
