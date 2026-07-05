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
  INTRO.play(document.querySelector('#intro-canvas'), ()=>UI.show('#screen-login'));
});
})();
