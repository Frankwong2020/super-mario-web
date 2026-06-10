// ============================================================
// UIScene - HUD（分数/金币/生命/时间）+ 手机虚拟按键
// ============================================================

/* eslint-disable */

class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  create() {
    const W = this.scale.gameSize.width;
    const style = {
      fontFamily: '"Microsoft YaHei", monospace', fontSize: '20px',
      color: '#ffffff', stroke: '#000000', strokeThickness: 4,
    };
    this.scoreText = this.add.text(20, 12, '', style);
    this.coinText = this.add.text(280, 12, '', style);
    this.worldText = this.add.text(450, 12, '', style).setOrigin(0, 0);
    this.timeText = this.add.text(680, 12, '', style);
    this.livesText = this.add.text(850, 12, '', style);

    // 静音按钮
    this.muteBtn = this.add.text(W - 50, 12, '🔊', { fontSize: '24px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', (p, x, y, e) => {
        const muted = AUDIO.toggleMute();
        this.muteBtn.setText(muted ? '🔇' : '🔊');
        if (e) e.stopPropagation();
      });

    if (this.isTouchDevice()) this.buildTouchControls();
  }

  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  setTouchFlag(key, val) {
    const touch = this.registry.get('touch') || {};
    this.registry.set('touch', { ...touch, [key]: val });
  }

  makeButton(x, y, r, label, key) {
    const zone = this.add.circle(x, y, r, 0xffffff, 0.25)
      .setStrokeStyle(3, 0xffffff, 0.5)
      .setScrollFactor(0).setDepth(50)
      .setInteractive();
    this.add.text(x, y, label, {
      fontFamily: 'sans-serif', fontSize: `${r}px`, color: '#ffffff',
    }).setOrigin(0.5).setDepth(51).setAlpha(0.8);
    zone.on('pointerdown', () => this.setTouchFlag(key, true));
    zone.on('pointerover', (p) => { if (p.isDown) this.setTouchFlag(key, true); });
    zone.on('pointerup', () => this.setTouchFlag(key, false));
    zone.on('pointerout', () => this.setTouchFlag(key, false));
  }

  buildTouchControls() {
    const H = this.scale.gameSize.height;   // 多点触控数量已在 main.js 的 activePointers 配置
    this.makeButton(80, H - 70, 42, '◀', 'left');
    this.makeButton(190, H - 70, 42, '▶', 'right');
    this.makeButton(944, H - 60, 46, 'A', 'jump');
    this.makeButton(840, H - 110, 38, 'B', 'fire');
  }

  update() {
    const r = this.registry;
    // 脏检查：仅在数值变化时更新文本，避免每帧字符串分配
    const set = (text, key, fmt) => {
      const v = r.get(key);
      if (text._last !== v) { text._last = v; text.setText(fmt(v)); }
    };
    set(this.scoreText, 'score', v => `分数 ${String(v || 0).padStart(6, '0')}`);
    set(this.coinText, 'coins', v => `🪙×${String(v || 0).padStart(2, '0')}`);
    set(this.worldText, 'world', v => v || '');
    set(this.timeText, 'time', v => `时间 ${v ?? ''}`);
    set(this.livesText, 'lives', v => `❤×${v ?? 3}`);
  }
}
