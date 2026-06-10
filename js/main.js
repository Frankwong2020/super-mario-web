// ============================================================
// main.js - 游戏配置与启动
// ============================================================

/* eslint-disable */

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1024,
  height: 480,
  pixelArt: true,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1150 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: { activePointers: 4 },
  scene: [BootScene, MenuScene, GameScene, UIScene],
};

window.addEventListener('load', () => {
  window.game = new Phaser.Game(config);
});
