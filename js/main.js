/* HEARTS — arranque */
(function(){
DATA.load();
Promise.all([Sprites.load(DATA.ANIMALS), MAPART.load(), WEAP.load()]).then(()=>{
  UI.renderRosters();
  UI.initLogin();
  UI.initMarket();
  UI.initWallet();
  UI.initBoard();
  UI.initMute();
  UI.initHelp();
  UI.initChests();
  UI.initParty();
  UI.initTouch();
  UI.initMenu();
  MATCH.init();
  // ENTRADA: si ya tienes SESIÓN, directo a tu cuenta (progreso guardado);
  // si no, la pantalla de LOG IN (roja/azul) — crea tu cuenta o entra.
  if(DATA.session()){ UI.enterLobby(); }
  else UI.show('#screen-login');
});
})();
