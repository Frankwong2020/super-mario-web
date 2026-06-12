// ============================================================
// MenuScene - 标题画面（含头像导入）/ 游戏结束 / 通关画面
// ============================================================

/* eslint-disable */

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create(data) {
    const mode = data.mode || 'title';
    this.started = false;
    const W = VIEW_W, H = VIEW_H;
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(W / 2, H / 2);

    if (mode === 'title') {
      this.buildTitle(W, H);
      this.input.keyboard.once('keydown', () => this.go(mode));
    } else {
      this.buildEnd(W, H, mode, data.score);
      this.input.keyboard.once('keydown', () => this.go(mode));
      this.input.once('pointerdown', () => this.go(mode));
    }
  }

  // ---------- 标题画面 ----------
  buildTitle(W, H) {
    // 天空 / 太阳 / 云 / 远山
    this.add.image(W / 2, H / 2, 'sky-day').setDisplaySize(W, H);
    this.add.image(W - 140, 90, 'sun').setScale(1.4);
    this.add.image(250, 70, 'cloud').setScale(1.6).setAlpha(0.95);
    this.add.image(700, 110, 'cloud').setScale(2.2).setAlpha(0.9);
    this.add.image(80, 130, 'cloud').setScale(1.2).setAlpha(0.8);
    this.add.image(180, H - 104, 'mountain').setScale(1.3).setAlpha(0.85);
    this.add.image(840, H - 100, 'mountain').setAlpha(0.8);
    this.add.image(560, H - 92, 'hill').setScale(1.6);
    this.add.image(330, H - 75, 'bush').setScale(1.4);

    // 地面
    for (let c = 0; c < W / 32 + 1; c++) {
      this.add.image(c * 32 + 16, H - 16, 'ground').setScale(2);
      this.add.image(c * 32 + 16, H - 48, 'ground').setScale(2);
    }

    // 行进的敌人队列（循环）
    const parade = [
      this.add.image(0, H - 80, 'goomba0').setScale(2),
      this.add.image(0, H - 84, 'koopa0').setScale(2),
      this.add.image(0, H - 80, 'goomba1').setScale(2),
    ];
    parade.forEach((spr, i) => {
      spr.x = W + 60 + i * 90;
      this.tweens.add({
        targets: spr, x: -80, duration: 14000, delay: i * 600,
        repeat: -1, repeatDelay: 3000,
      });
    });

    // 标题牌（圆角面板 + 阴影）
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25); g.fillRoundedRect(W / 2 - 282, 62, 572, 158, 18);
    g.fillStyle(0xd82800, 1); g.fillRoundedRect(W / 2 - 288, 54, 572, 158, 18);
    g.lineStyle(5, 0x7c1800, 1); g.strokeRoundedRect(W / 2 - 288, 54, 572, 158, 18);
    g.lineStyle(2, 0xffd9a0, 0.8); g.strokeRoundedRect(W / 2 - 280, 62, 556, 142, 14);
    this.add.text(W / 2, 116, '超级小红帽', {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '62px', fontStyle: 'bold',
      color: '#ffffff', stroke: '#000000', strokeThickness: 8,
      shadow: { offsetX: 0, offsetY: 5, color: '#7c1800', blur: 0, fill: true },
    }).setOrigin(0.5);
    this.add.text(W / 2, 178, '— 像 素 大 冒 险 —', {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '22px', color: '#ffe9a0',
    }).setOrigin(0.5);

    // 主角预览（带头像效果）
    const pv = this.add.container(W / 2 - 330, 320);
    const pvBg = this.add.graphics();
    pvBg.fillStyle(0xffffff, 0.25); pvBg.fillRoundedRect(-58, -78, 116, 150, 12);
    pvBg.lineStyle(3, 0xffffff, 0.6); pvBg.strokeRoundedRect(-58, -78, 116, 150, 12);
    pv.add(pvBg);
    this.previewImg = this.add.image(0, -14, 'pb-idle').setScale(2.4);
    pv.add(this.previewImg);
    pv.add(this.add.text(0, 52, '当前主角', {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '15px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5));

    // 个性化名牌：昵称 + 最高纪录（与左侧主角预览对称）
    const pn = this.add.container(W / 2 + 330, 320);
    const pnBg = this.add.graphics();
    pnBg.fillStyle(0xffffff, 0.25); pnBg.fillRoundedRect(-58, -78, 116, 150, 12);
    pnBg.lineStyle(3, 0xffffff, 0.6); pnBg.strokeRoundedRect(-58, -78, 116, 150, 12);
    pn.add(pnBg);
    const small = (y, txt, size, color) => pn.add(this.add.text(0, y, txt, {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize: size, color,
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5));
    small(-58, '🏆 最高纪录', '14px', '#ffffff');
    small(-34, String(PROFILE.best).padStart(6, '0'), '20px', '#ffe066');
    small(-4, PROFILE.name, '19px', '#ffffff');
    this.makeButton(W / 2 + 330, 42 + 320, 96, 34, '✏️ 改名', 0x9a6020, 0x553410, '15px',
      () => this.renameHero());

    // 开始按钮 + 头像按钮
    this.makeButton(W / 2, 290, 300, 62, '▶  开 始 游 戏', 0x00a800, 0x005800, '26px',
      () => this.go('title'));
    this.makeButton(W / 2, 362, 230, 44, '📷 导入照片做主角', 0x2068e8, 0x103880, '17px',
      () => this.importAvatar());
    if (AVATAR.faceCanvas) {
      this.makeButton(W / 2, 414, 230, 40, '↺ 恢复默认主角', 0x707070, 0x383838, '16px',
        () => {
          AVATAR.clear();
          this.previewImg.destroy();           // 先销毁预览，再重建纹理，避免悬空帧
          TextureFactory.generatePlayers(this);
          this.scene.restart({ mode: 'title' });
        });
    }

    // 操作说明
    this.add.text(W / 2, H - 22, '⌨ 方向键/WASD 移动 · 空格/↑ 跳跃 · X/J 点按发火球·按住助跑 · ESC 暂停 · M 静音', {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '15px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(5);
  }

  // ---------- 圆角按钮 ----------
  makeButton(x, y, w, h, label, color, edge, fontSize, onClick) {
    const g = this.add.graphics();
    const draw = (fill) => {
      g.clear();
      g.fillStyle(0x000000, 0.3); g.fillRoundedRect(x - w / 2 + 3, y - h / 2 + 4, w, h, h / 4);
      g.fillStyle(fill, 1); g.fillRoundedRect(x - w / 2, y - h / 2, w, h, h / 4);
      g.lineStyle(3, edge, 1); g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, h / 4);
    };
    draw(color);
    const txt = this.add.text(x, y, label, {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize, fontStyle: 'bold',
      color: '#ffffff', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);
    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    const lighten = Phaser.Display.Color.IntegerToColor(color).brighten(18).color;
    zone.on('pointerover', () => draw(lighten));
    zone.on('pointerout', () => draw(color));
    zone.on('pointerdown', () => { draw(edge); });
    zone.on('pointerup', () => { draw(color); onClick(); });
    return zone;
  }

  renameHero() {
    const n = window.prompt('给主角起个名字（最多 8 个字）', PROFILE.data.name || '');
    if (n === null) return;
    PROFILE.setName(n);
    this.scene.restart({ mode: 'title' });
  }

  importAvatar() {
    AVATAR.importFromFile((ok) => {
      if (!ok) return;
      this.previewImg.destroy();               // 先销毁预览，再重建纹理，避免悬空帧
      TextureFactory.generatePlayers(this);
      this.scene.restart({ mode: 'title' });   // 重建预览
    });
  }

  // ---------- 结算画面 ----------
  buildEnd(W, H, mode, score) {
    const win = mode === 'win';
    this.add.image(W / 2, H / 2, win ? 'sky-day' : 'sky-castle').setDisplaySize(W, H);
    if (win) {
      this.add.image(W - 140, 90, 'sun').setScale(1.4);
      // 烟花式星星
      for (let i = 0; i < 14; i++) {
        const star = this.add.image(80 + Math.random() * (W - 160), 50 + Math.random() * 220, 'spark')
          .setScale(1 + Math.random() * 2).setAlpha(0);
        this.tweens.add({
          targets: star, alpha: { from: 0, to: 1 }, angle: 180,
          duration: 500 + Math.random() * 700, yoyo: true, repeat: -1, delay: Math.random() * 1200,
        });
      }
    }
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.55); g.fillRoundedRect(W / 2 - 300, H / 2 - 130, 600, 250, 20);
    g.lineStyle(4, win ? 0xfcc000 : 0xd82800, 1); g.strokeRoundedRect(W / 2 - 300, H / 2 - 130, 600, 250, 20);

    // 个性化语录 + 最高纪录
    const isNewBest = PROFILE.recordScore(score || 0);
    const name = PROFILE.name;
    const quotes = win
      ? [`${name} 拯救了世界，城堡恢复和平！`, `不愧是 ${name}，连魔王都甘拜下风！`, `${name} 的冒险传说将永远流传！`]
      : [`${name} 别灰心，英雄都是摔出来的！`, `就差一点点，${name} 再来一次！`, `魔王还在嘚瑟，${name} 快去教训它！`];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    this.add.text(W / 2, H / 2 - 75, win ? '🎉 恭喜通关！🎉' : 'GAME OVER', {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '54px', fontStyle: 'bold',
      color: win ? '#fcc000' : '#d82800', stroke: '#ffffff', strokeThickness: 4,
    }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 22, quote, {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '20px', color: '#ffe9a0',
    }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 18, `最终得分：${score || 0}`, {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '30px', color: '#ffffff',
    }).setOrigin(0.5);
    const record = this.add.text(W / 2, H / 2 + 58,
      isNewBest ? '🏆 新纪录！' : `🏆 最高纪录 ${PROFILE.best}`, {
        fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '19px',
        color: isNewBest ? '#ffe066' : '#aaaaaa', fontStyle: isNewBest ? 'bold' : 'normal',
      }).setOrigin(0.5);
    if (isNewBest) {
      this.tweens.add({ targets: record, scale: 1.25, duration: 400, yoyo: true, repeat: -1 });
    }
    const hint = this.add.text(W / 2, H / 2 + 95, '点击 或 按任意键 返回标题', {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '20px', color: '#cccccc',
    }).setOrigin(0.5);
    this.tweens.add({ targets: hint, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
  }

  go(mode) {
    if (this.started) return;
    this.started = true;
    AUDIO.init();
    if (mode === 'title') {
      this.registry.set('score', 0);
      this.registry.set('coins', 0);
      this.registry.set('lives', 3);
      this.registry.set('form', 0);
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(320, () => this.scene.start('GameScene', { level: 0 }));
    } else {
      this.scene.start('MenuScene', { mode: 'title' });
    }
  }
}
