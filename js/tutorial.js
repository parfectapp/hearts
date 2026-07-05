/* HEARTS — tutorial de primer usuario: te lleva a abrir tu primer cofre GRATIS */
(function(){
const $=s=>document.querySelector(s);
let step=0, bubble=null;

const st=()=>DATA.state();
const active=()=>step>0&&step<99;

function ensureBubble(){
  if(bubble) return bubble;
  bubble=document.createElement('div');
  bubble.id='tut-bubble';
  bubble.innerHTML='<div id="tut-text"></div><button id="tut-skip">saltar tutorial</button>';
  document.body.appendChild(bubble);
  bubble.querySelector('#tut-skip').addEventListener('click',finishTut);
  return bubble;
}
function say(txt,targetSel){
  ensureBubble();
  bubble.querySelector('#tut-text').innerHTML=txt;
  bubble.classList.add('show');
  document.querySelectorAll('.tut-glow').forEach(el=>el.classList.remove('tut-glow'));
  if(targetSel){ const el=$(targetSel); if(el) el.classList.add('tut-glow'); }
}
function hide(){
  if(bubble) bubble.classList.remove('show');
  document.querySelectorAll('.tut-glow').forEach(el=>el.classList.remove('tut-glow'));
}
function finishTut(){
  step=99;
  st().tut=true; DATA.save();
  hide();
}

// ---- ganchos desde la UI ----
function onLobby(){
  const s=st();
  if(s.tut){ step=99; return; }
  if(Object.keys(s.owned).length>0 && step===0){ s.tut=true; DATA.save(); step=99; return; }
  if(step===0){
    step=1;
    say('<b>¡Bienvenido a HEARTS!</b> Te regalamos tu <b>primer cofre GRATIS</b>.<br>Ábrelo desde tu <b>WALLET</b> (arriba a la derecha).','#wallet-chip');
  } else if(step===4){
    step=5;
    say('<b>¡Ese es tu guerrero!</b> Ya es tuyo.<br>Ahora dale <b>JUGAR</b>: se trata de <b>SOBREVIVIR</b> — el primero en caer pierde 1 ♥. ¡No seas tú!','#btn-ranked');
  }
}
function onWalletOpen(){
  if(step===1){ step=2; say('Dale al botón <b>ABRIR COFRES</b>.','#btn-chests'); }
}
function onChestsOpen(){
  if(step===2){ step=3; say('Tu <b>COFRE DE MADERA</b> es <b>GRATIS</b>. ¡Ábrelo para sacar tu primer guerrero!','#chest-grid .chest-card:first-child .chest-buy'); }
}
function onChestOpened(){
  if(step===3){ step=4; say('✦ <b>¡Tuyo!</b> Dale <b>GUARDAR</b> y regresa al <b>LOBBY</b>.','#reveal-close'); }
}
function onRanked(){ if(active()) finishTut(); }

// no-ops (compat con llamadas viejas del market)
function noop(){}
window.TUT={ onLobby, onWalletOpen, onChestsOpen, onChestOpened, onRanked, finishTut,
  onMarketOpen:noop, onBuyModal:noop, onBought:noop };
})();
