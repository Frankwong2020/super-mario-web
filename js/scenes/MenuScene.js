// ============================================================
// MenuScene - 标题画面 / 游戏结束 / 通关画面
// ============================================================

/* eslint-disable */

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create(data) {
    const mode = data.mode || 'title';
    const W = this.scale.gameSize.width, H = this.scale.gameSize.height;
    this.cameras.main.setBackgroundColor(mode === 'title' ? '#3cbcfc' : '#000000');

    if (mode === 'title') this.buildTitle(W, H);
    else if (mode === 'gameover') this.buildEnd(W, H, 'GAME OVER', '#d82800', data.score);
    else this.buildEnd(W, H, '🎉 恭喜通关！🎉', '#fcc000', data.score);

    // 任意键 / 点击开始
    this.input.keyboard.once('keydown', () => this.go(mode));
    this.input.once('pointerdown', () => this.go(mode));
  }

  buildTitle(W, H) {
    // 地面装饰
    for (let c = 0; c < W / 32 + 1; c++) {
      this.add.image(c * 32 + 16, H - 16, 'ground').setScale(2);
      this.add.image(c * 32 + 16, H - 48, 'ground').setScale(2);
    }
    this.add.image(150, H - 88, 'hill').setScale(1.5);
    this.add.image(820, 100, 'cloud').setScale(2);
    this.add.image(250, 70, 'cloud').setScale(1.5);
    this.add.image(600, H - 80, 'bush').setScale(1.5);

    // 标题牌
    const panel = this.add.rectangle(W / 2, 150, 560, 150, 0xd82800).setStrokeStyle(6, 0x7c1800);
    this.add.text(W / 2, 128, '超级小红帽', {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '64px', fontStyle: 'bold',
      color: '#ffffff', stroke: '#000000', strokeThickness: 8,
    }).setOrigin(0.5);
    this.add.text(W / 2, 190, '- 像 素 大 冒 险 -', {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '22px', color: '#fcc000',
    }).setOrigin(0.5);

    // 主角和敌人展示
    this.add.image(W / 2 - 180, H - 96, 'pb-idle').setScale(3);
    this.add.image(W / 2 + 150, H - 88, 'goomba0').setScale(2.5);
    this.add.image(W / 2 + 230, H - 92, 'koopa0').setScale(2.5);
    this.add.image(W / 2 - 60, H - 130, 'coin0').setScale(2);
    this.add.image(W / 2 + 20, H - 150, 'mushroom').setScale(2);

    const hint = this.add.text(W / 2, 290, '点击屏幕 或 按任意键 开始游戏', {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '26px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5);
    this.tweens.add({ targets: hint, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

    this.add.text(W / 2, 340, '⌨ 方向键/WASD 移动 · 空格/↑ 跳跃 · X/J 发射火球 · M 静音', {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '17px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);
    this.add.text(W / 2, 368, '📱 手机可用屏幕虚拟按键操作', {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '15px', color: '#e0f0ff',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);
  }

  buildEnd(W, H, title, color, score) {
    this.add.text(W / 2, H / 2 - 70, title, {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '56px', fontStyle: 'bold',
      color, stroke: '#ffffff', strokeThickness: 4,
    }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 10, `最终得分：${score || 0}`, {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '30px', color: '#ffffff',
    }).setOrigin(0.5);
    const hint = this.add.text(W / 2, H / 2 + 80, '点击 或 按任意键 返回标题', {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '22px', color: '#aaaaaa',
    }).setOrigin(0.5);
    this.tweens.add({ targets: hint, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
  }

  go(mode) {
    AUDIO.init();
    if (mode === 'title') {
      this.registry.set('score', 0);
      this.registry.set('coins', 0);
      this.registry.set('lives', 3);
      this.registry.set('form', 0);
      this.scene.start('GameScene', { level: 0 });
    } else {
      this.scene.start('MenuScene', { mode: 'title' });
    }
  }
}
