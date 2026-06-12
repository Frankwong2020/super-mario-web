// ============================================================
// UIScene - HUD（分数/金币/生命/时间）+ 手机虚拟按键
// ============================================================

/* eslint-disable */

class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  create() {
    const W = VIEW_W;
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(VIEW_W / 2, VIEW_H / 2);
    // HUD 半透明面板条
    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.35);
    panel.fillRoundedRect(8, 6, W - 16, 40, 10);
    panel.lineStyle(2, 0xffffff, 0.15);
    panel.strokeRoundedRect(8, 6, W - 16, 40, 10);

    const style = {
      fontFamily: '"Microsoft YaHei", monospace', fontSize: '20px',
      color: '#ffffff', stroke: '#000000', strokeThickness: 4,
    };
    this.scoreText = this.add.text(24, 14, '', style);
    this.coinText = this.add.text(280, 14, '', style);
    this.worldText = this.add.text(450, 14, '', style).setOrigin(0, 0);
    this.timeText = this.add.text(680, 14, '', style);
    this.livesText = this.add.text(850, 14, '', style);

    // 静音按钮
    this.muteBtn = this.add.text(W - 50, 12, '🔊', { fontSize: '24px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', (p, x, y, e) => {
        const muted = AUDIO.toggleMute();
        this.muteBtn.setText(muted ? '🔇' : '🔊');
        if (e) e.stopPropagation();
      });

    // 暂停按钮 + ESC/P 快捷键
    this.pauseOpen = false;
    this.add.text(W - 96, 12, '⏸', { fontSize: '24px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', (p, x, y, e) => {
        this.togglePause();
        if (e) e.stopPropagation();
      });
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard.on('keydown-P', () => this.togglePause());

    if (this.isTouchDevice()) this.buildTouchControls();
  }

  // ---------- 暂停菜单 ----------
  togglePause() {
    if (this.pauseOpen) this.closePause();
    else this.openPause();
  }

  openPause() {
    const gs = this.scene.get('GameScene');
    if (this.pauseOpen || !gs.scene.isActive()) return;
    this.pauseOpen = true;
    this.pausedSong = AUDIO.currentSong;
    AUDIO.stopMusic();
    this.scene.pause('GameScene');

    const W = 1024, H = 480;
    const c = this.add.container(0, 0).setDepth(200);
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setInteractive();
    const g = this.add.graphics();
    g.fillStyle(0x1c2438, 0.96); g.fillRoundedRect(W / 2 - 175, 78, 350, 324, 18);
    g.lineStyle(3, 0xffffff, 0.25); g.strokeRoundedRect(W / 2 - 175, 78, 350, 324, 18);
    const title = this.add.text(W / 2, 124, '⏸ 暂 停', {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '34px', fontStyle: 'bold',
      color: '#ffffff', stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5);
    c.add([dim, g, title]);

    this.menuButton(c, W / 2, 190, '▶ 继续游戏', 0x00a800, 0x005800, () => this.closePause());
    this.menuButton(c, W / 2, 258, '↺ 重新开始本关', 0x2068e8, 0x103880, () => this.restartLevel());
    this.menuButton(c, W / 2, 326, '🏠 返回主菜单', 0x9a3030, 0x501414, () => this.backToMenu());
    const hint = this.add.text(W / 2, 378, 'ESC / P 继续', {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '14px', color: '#8898b8',
    }).setOrigin(0.5);
    c.add(hint);
    this.pausePanel = c;
  }

  menuButton(container, x, y, label, color, edge, onClick) {
    const w = 270, h = 52;
    const g = this.add.graphics();
    const draw = (fill) => {
      g.clear();
      g.fillStyle(0x000000, 0.3); g.fillRoundedRect(x - w / 2 + 3, y - h / 2 + 4, w, h, 13);
      g.fillStyle(fill, 1); g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 13);
      g.lineStyle(3, edge, 1); g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 13);
    };
    draw(color);
    const txt = this.add.text(x, y, label, {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '21px', fontStyle: 'bold',
      color: '#ffffff', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);
    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    const lighten = Phaser.Display.Color.IntegerToColor(color).brighten(18).color;
    zone.on('pointerover', () => draw(lighten));
    zone.on('pointerout', () => draw(color));
    zone.on('pointerdown', () => draw(edge));
    zone.on('pointerup', () => { draw(color); onClick(); });
    container.add([g, txt, zone]);
  }

  destroyPausePanel() {
    if (this.pausePanel) { this.pausePanel.destroy(); this.pausePanel = null; }
    this.pauseOpen = false;
  }

  closePause() {
    if (!this.pauseOpen) return;
    this.destroyPausePanel();
    this.scene.resume('GameScene');
    if (this.pausedSong) AUDIO.playMusic(this.pausedSong);
  }

  restartLevel() {
    const gs = this.scene.get('GameScene');
    const level = gs.levelIndex;
    this.destroyPausePanel();
    this.registry.set('touch', {});
    gs.scene.resume();
    gs.scene.restart({ level });
  }

  backToMenu() {
    this.destroyPausePanel();
    AUDIO.stopMusic();
    this.registry.set('touch', {});
    this.scene.stop('GameScene');
    this.scene.start('MenuScene', { mode: 'title' });
  }

  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  setTouchFlag(key, val) {
    const touch = this.registry.get('touch') || {};
    this.registry.set('touch', { ...touch, [key]: val });
  }

  makeButton(x, y, r, label, key) {
    // 注意不能设 setScrollFactor(0)：本场景相机 zoom+centerOn 带隐式滚动，
    // scrollFactor 0 会让圆圈和点击热区整体位移到画面中部，与文字标签错位
    const zone = this.add.circle(x, y, r, 0xffffff, 0.22)
      .setStrokeStyle(3, 0xffffff, 0.5)
      .setDepth(50)
      .setInteractive();
    const txt = this.add.text(x, y, label, {
      fontFamily: 'sans-serif', fontSize: `${r}px`, color: '#ffffff',
    }).setOrigin(0.5).setDepth(51).setAlpha(0.8);
    const press = (on) => {
      this.setTouchFlag(key, on);
      zone.setFillStyle(0xffffff, on ? 0.45 : 0.22);
      zone.setScale(on ? 1.12 : 1);
      txt.setScale(on ? 1.12 : 1);
    };
    zone.on('pointerdown', () => press(true));
    zone.on('pointerover', (p) => { if (p.isDown) press(true); });
    zone.on('pointerup', () => press(false));
    zone.on('pointerout', () => press(false));
  }

  buildTouchControls() {
    const H = VIEW_H;   // 多点触控数量已在 main.js 的 activePointers 配置
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
