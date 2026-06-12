// ============================================================
// GameScene - 通用关卡播放器：解析地图、物理、玩法逻辑
// ============================================================

/* eslint-disable */

const TILE = 32;

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.levelIndex = data.level ?? 0;
  }

  create() {
    const level = LEVELS[this.levelIndex];
    const theme = THEMES[level.theme];
    const map = level.map;
    const worldW = map[0].length * TILE;
    const worldH = ROWS * TILE;

    this.levelClearing = false;
    this.flagZone = null;
    this.flagSprite = null;
    this.cameras.main.setBackgroundColor(theme.sky);
    this.physics.world.setBounds(0, 0, worldW, worldH + 200);
    this.physics.world.setBoundsCollision(true, true, false, false);

    // 渐变天空 / 太阳：世界对象，update 里跟随镜头中心（zoom 下 scrollFactor 0 不可靠）
    const skyTex = { overworld: 'sky-day', underground: 'sky-cave', castle: 'sky-castle' }[level.theme];
    this.skyImg = this.add.image(512, worldH / 2, skyTex)
      .setDisplaySize(VIEW_W + 8, worldH).setDepth(-10);
    this.sunImg = null;
    if (theme.deco) {
      this.sunImg = this.add.image(880, 84, 'sun').setScale(1.3).setDepth(-9);
      this.buildDeco(worldW);
    }

    // 物理分组
    this.solids = this.physics.add.staticGroup();
    this.blocks = this.physics.add.staticGroup();
    this.coinsGroup = this.physics.add.staticGroup();
    this.lavaGroup = this.physics.add.staticGroup();
    this.enemies = this.add.group();
    this.items = this.add.group();
    this.fireballs = this.add.group();
    this.bossFires = this.add.group();

    this.parseMap(map, theme);

    // 玩家
    this.player = new Player(this, 80, worldH - 3.5 * TILE);
    this.player.setCollideWorldBounds(true);

    this.setupColliders();

    // 摄像机（zoom = 超采样倍数，渲染更清晰）
    this.cameras.main.setZoom(RENDER_SCALE);
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.1);

    // HUD
    this.registry.set('world', level.name);
    this.timeLeft = level.time;
    this.registry.set('time', this.timeLeft);
    if (this.scene.isActive('UIScene')) this.scene.bringToTop('UIScene');
    else this.scene.launch('UIScene');

    this.timerEvent = this.time.addEvent({
      delay: 1000, loop: true,
      callback: () => {
        if (this.levelClearing || this.player.dying || this.introActive) return;
        this.timeLeft--;
        this.registry.set('time', this.timeLeft);
        if (this.timeLeft <= 0) this.player.die();
      },
    });

    this.input.keyboard.on('keydown-M', this.onMuteKey, this);
    this.showIntro(level);

    // 场景关闭/重启时统一清理（音乐定时器、全局键监听、计时器）
    this.events.once('shutdown', () => {
      AUDIO.stopMusic();
      this.input.keyboard.off('keydown-M', this.onMuteKey, this);
      if (this.timerEvent) this.timerEvent.remove();
    });
  }

  onMuteKey() {
    AUDIO.toggleMute();
  }

  // ---------- 背景装饰（草原主题，多层视差） ----------
  // 缩放摄像机下 scrollFactor<1 的层会整体偏移 (canvas-view)/2*f，需按系数补偿位置
  buildDeco(worldW) {
    // 渲染公式 screen = zoom*(pos - scroll*f) - offset，基础滚动为负半幅，
    // 故 sf<1 层需加 (1-f)*半幅 补偿（x 以镜头停在最左时对齐）
    const ox = (VIEW_W * RENDER_SCALE - VIEW_W) / 2;   // 512
    const oy = (VIEW_H * RENDER_SCALE - VIEW_H) / 2;   // 240
    const deco = (x, y, tex, f, scale, alpha, depth) => {
      this.add.image(x + ox * (1 - f), y + oy * (1 - f), tex)
        .setScale(scale).setAlpha(alpha).setScrollFactor(f).setDepth(depth);
    };
    for (let x = 150; x < worldW / 0.25 + 400; x += 560) {
      deco(x, 13 * TILE - 38, 'mountain', 0.25, 1.5, 0.75, -4);
    }
    for (let x = 100; x < worldW / 0.4; x += 380) {
      deco(x, 70 + (x / 380 % 3) * 35, 'cloud', 0.4, 1.5 + (x / 380 % 2) * 0.7, 1, -2);
    }
    for (let x = 60; x < worldW / 0.7; x += 520) {
      deco(x, 13 * TILE - 28, 'hill', 0.7, 1.6, 1, -2);
      deco(x + 260, 13 * TILE - 11, 'bush', 0.7, 1.4, 1, -2);
    }
  }

  // ---------- 开关过场卡片（经典 "世界 x-x" 黑屏，关卡开头镜头固定在 512,240） ----------
  showIntro(level) {
    this.introActive = true;
    this.physics.pause();
    const cover = this.add.rectangle(512, 240, VIEW_W + 8, VIEW_H + 8, 0x000000)
      .setDepth(99);
    const t1 = this.add.text(512, 195, level.name, {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '40px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5).setDepth(100);
    const t2 = this.add.text(0, 262, `${PROFILE.name} × ${this.registry.get('lives')}`, {
      fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '26px', color: '#ffffff',
    }).setOrigin(0, 0.5).setDepth(100);
    // 图标 + 文本整体居中
    const icon = this.add.image(0, 262, 'ps-idle').setScale(1).setDepth(100);
    const total = 40 + t2.width;
    icon.x = 512 - total / 2 + 16;
    t2.x = icon.x + 24;
    this.time.delayedCall(1500, () => {
      [cover, t1, icon, t2].forEach(o => o.destroy());
      this.physics.resume();
      this.introActive = false;
      AUDIO.playMusic(level.music);
    });
  }

  // ---------- 地图解析 ----------
  parseMap(map, theme) {
    const addStatic = (group, c, r, tex, depth) => {
      const s = group.create(c * TILE + 16, r * TILE + 16, tex).setScale(2);
      s.refreshBody();
      if (depth !== undefined) s.setDepth(depth);
      return s;
    };

    for (let r = 0; r < map.length; r++) {
      for (let c = 0; c < map[r].length; c++) {
        const ch = map[r][c];
        const x = c * TILE + 16, y = r * TILE + 16;
        switch (ch) {
          case '#': addStatic(this.solids, c, r, theme.ground); break;
          case '=': addStatic(this.solids, c, r, theme.block); break;
          case '{': addStatic(this.solids, c, r, 'pipeTL', 3); break;
          case '}': addStatic(this.solids, c, r, 'pipeTR', 3); break;
          case '[': addStatic(this.solids, c, r, 'pipeBL', 3); break;
          case ']': addStatic(this.solids, c, r, 'pipeBR', 3); break;
          case 'B': addStatic(this.blocks, c, r, theme.brick).blockType = 'brick'; break;
          case '?': addStatic(this.blocks, c, r, 'question').blockType = 'qcoin'; break;
          case 'M': addStatic(this.blocks, c, r, 'question').blockType = 'qpower'; break;
          case '!': addStatic(this.blocks, c, r, theme.brick).blockType = 'qstar'; break;
          case 'C':
            addStatic(this.coinsGroup, c, r, 'coin0').anims.play('coin-spin');
            break;
          case 'L':
            addStatic(this.lavaGroup, c, r, 'lava0').anims.play('lava-bubble');
            break;
          case 'g': new Goomba(this, x, y).setCollideWorldBounds(true); break;
          case 'k': new Koopa(this, x, y).setCollideWorldBounds(true); break;
          case 'p': new Piranha(this, c * TILE + 32, (r + 1) * TILE - 24); break;
          case 'X': new Boss(this, x, y).setCollideWorldBounds(true); break;
          case 'F': this.buildFlag(c, r); break;
          case 'A':
            this.add.image(c * TILE + 40, 13 * TILE - 40, 'castle').setDepth(-1);
            break;
        }
      }
    }
  }

  buildFlag(c, r) {
    const x = c * TILE + 16;
    for (let pr = r; pr > r - 7; pr--) {
      this.add.image(x, pr * TILE + 16, 'pole').setScale(2).setDepth(1);
    }
    this.add.image(x, (r - 7) * TILE + 16, 'poletop').setScale(2).setDepth(1);
    this.flagSprite = this.add.image(x - 16, (r - 6) * TILE + 8, 'flag').setScale(2).setDepth(1);
    const zone = this.add.zone(x, (r - 3) * TILE, 8, TILE * 8);
    this.physics.add.existing(zone, true);
    this.flagZone = zone;
  }

  // ---------- 碰撞设置 ----------
  setupColliders() {
    const P = this.physics;
    const notPiranha = (enemy) => enemy.kind !== 'piranha';

    P.add.collider(this.player, this.solids);
    P.add.collider(this.player, this.blocks);
    P.add.collider(this.enemies, this.solids, null, notPiranha);
    P.add.collider(this.enemies, this.blocks, null, notPiranha);
    P.add.collider(this.items, this.solids);
    P.add.collider(this.items, this.blocks);
    P.add.collider(this.fireballs, this.solids);
    P.add.collider(this.fireballs, this.blocks);

    P.add.overlap(this.player, this.enemies, (player, enemy) => this.onPlayerEnemy(player, enemy));
    P.add.overlap(this.fireballs, this.enemies, (fb, enemy) => this.onFireballEnemy(fb, enemy));
    P.add.overlap(this.enemies, this.enemies, (a, b) => this.onEnemyEnemy(a, b));
    P.add.overlap(this.player, this.items, (player, item) => {
      player.collectPowerUp(item.kind);
      item.destroy();
    });
    P.add.overlap(this.player, this.coinsGroup, (player, coin) => {
      coinSparkle(this, coin.x, coin.y);
      coin.destroy();
      this.collectCoin();
    });
    P.add.overlap(this.player, this.lavaGroup, (player) => {
      if (!player.dying) player.die();
    });
    P.add.overlap(this.player, this.bossFires, (player, fire) => {
      fire.destroy();
      player.hurt();
    });

    this.events.once('bossDefeated', () => {
      this.levelClearing = true;
      this.timerEvent.paused = true;
      this.time.delayedCall(3000, () => {
        this.scene.stop('UIScene');
        this.scene.start('MenuScene', { mode: 'win', score: this.registry.get('score') });
      });
    });
  }

  // ---------- 顶砖块 ----------
  bumpBlock(block) {
    const now = this.time.now;
    if (block.lastBump && now - block.lastBump < 250) return;
    block.lastBump = now;

    const bounce = () => this.tweens.add({
      targets: block, y: block.y - 10, duration: 80, yoyo: true,
    });
    const toUsed = () => {
      block.blockType = 'used';
      block.setTexture('qempty');
      bounce();
    };

    switch (block.blockType) {
      case 'brick':
        if (this.player.form > 0) {
          AUDIO.sfx('break');
          brickBurst(this, block.x, block.y);
          this.addScore(block.x, block.y - 30, 50);
          block.destroy();
        } else {
          AUDIO.sfx('bump');
          bounce();
        }
        break;
      case 'qcoin':
        AUDIO.sfx('coin');
        coinPop(this, block.x, block.y - 32);
        this.collectCoin(true);
        this.addScore(block.x, block.y - 50, 200);
        toUsed();
        break;
      case 'qpower':
        new PowerUp(this, block.x, block.y, this.player.form === 0 ? 'mushroom' : 'flower');
        toUsed();
        break;
      case 'qstar':
        new PowerUp(this, block.x, block.y, 'star');
        toUsed();
        break;
      default:
        AUDIO.sfx('bump');
    }
  }

  // ---------- 玩家 vs 敌人 ----------
  onPlayerEnemy(player, enemy) {
    if (enemy.dead || player.dying || this.levelClearing) return;
    const now = this.time.now;

    if (enemy.kind === 'boss') {
      const stomping = player.body.velocity.y > 0 && player.body.bottom < enemy.body.top + 26;
      if (stomping) {
        if (enemy.hit(now)) {
          player.setVelocityY(-460);
          this.addScore(enemy.x, enemy.y - 70, 500);
        }
      } else if (player.hasStar) {
        enemy.hit(now);
      } else {
        player.hurt();
      }
      return;
    }

    if (player.hasStar) {
      AUDIO.sfx('kick');
      knockOut(enemy, player.x);
      this.addScore(enemy.x, enemy.y - 30, 200);
      return;
    }
    if (enemy.kind === 'piranha') { player.hurt(); return; }

    const stomping = player.body.velocity.y > 0 && player.body.bottom < enemy.body.top + 16;
    if (stomping) {
      player.setVelocityY(-380);
      AUDIO.sfx('stomp');
      this.addScore(enemy.x, enemy.y - 30, 100);
      enemy.stomp(player);
    } else if (enemy.kind === 'koopa' && enemy.state === 'shell') {
      enemy.kick(player.x);
    } else {
      player.hurt();
    }
  }

  onFireballEnemy(fb, enemy) {
    if (enemy.dead) return;
    fb.pop();
    if (enemy.kind === 'boss') {
      enemy.hit(this.time.now);
    } else {
      knockOut(enemy, fb.x);
      this.addScore(enemy.x, enemy.y - 30, 200);
    }
  }

  onEnemyEnemy(a, b) {
    const spinning = (e) => e.kind === 'koopa' && e.state === 'spinning' && !e.dead;
    if (spinning(a) && !b.dead && !spinning(b) && b.kind !== 'boss') {
      knockOut(b, a.x);
      this.addScore(b.x, b.y - 30, 200);
    } else if (spinning(b) && !a.dead && !spinning(a) && a.kind !== 'boss') {
      knockOut(a, b.x);
      this.addScore(a.x, a.y - 30, 200);
    }
  }

  // ---------- 计分 ----------
  addScore(x, y, points) {
    this.registry.set('score', (this.registry.get('score') || 0) + points);
    scorePopup(this, x, y, String(points));
  }

  collectCoin(silent) {
    if (!silent) AUDIO.sfx('coin');
    let coins = (this.registry.get('coins') || 0) + 1;
    this.registry.set('score', (this.registry.get('score') || 0) + 200);
    if (coins >= 100) {
      coins -= 100;
      this.registry.set('lives', (this.registry.get('lives') || 0) + 1);
      AUDIO.sfx('1up');
    }
    this.registry.set('coins', coins);
  }

  // ---------- 过关（碰旗杆） ----------
  hitFlag() {
    if (this.levelClearing || this.player.dying) return;
    this.levelClearing = true;
    this.timerEvent.paused = true;
    AUDIO.stopMusic();
    AUDIO.sfx('flag');

    const player = this.player;
    player.frozen = true;
    player.setVelocity(0, 0);
    player.body.setAllowGravity(false);

    const bonus = Math.max(0, this.timeLeft) * 10 + 2000;
    this.registry.set('score', (this.registry.get('score') || 0) + bonus);
    scorePopup(this, this.flagZone.x + 40, player.y - 60, String(bonus));

    // 旗子降下 + 玩家滑到杆底
    this.tweens.add({ targets: this.flagSprite, y: 11.5 * TILE, duration: 700 });
    this.tweens.add({
      targets: player, x: this.flagZone.x - 6, y: 12 * TILE, duration: 700,
      onComplete: () => {
        player.body.setAllowGravity(true);
        player.setFlipX(false);
        player.play(FORM_PREFIX[player.form] + '-run', true);
        AUDIO.sfx('clear');
        this.tweens.add({ targets: player, x: player.x + 150, duration: 1100 });
        this.time.delayedCall(2300, () => {
          const next = this.levelIndex + 1;
          if (next < LEVELS.length) this.scene.restart({ level: next });
          else {
            this.scene.stop('UIScene');
            this.scene.start('MenuScene', { mode: 'win', score: this.registry.get('score') });
          }
        });
      },
    });
  }

  // ---------- 玩家死亡 ----------
  onPlayerDeath() {
    this.timerEvent.paused = true;
    AUDIO.stopMusic();
    const lives = (this.registry.get('lives') || 1) - 1;
    this.registry.set('lives', lives);
    this.registry.set('form', 0);
    this.time.delayedCall(2200, () => {
      if (lives > 0) {
        this.scene.restart({ level: this.levelIndex });
      } else {
        AUDIO.sfx('gameover');
        this.scene.stop('UIScene');
        this.scene.start('MenuScene', { mode: 'gameover', score: this.registry.get('score') });
      }
    });
  }

  update(time, delta) {
    // 顶砖：上升被顶住时按几何关系找头顶的砖。不能依赖碰撞回调——撞砖排时
    // 邻砖可能先完成垂直分离，正上方那块就不再相交、收不到回调，导致问号撞不开
    const pb = this.player.body;
    if (pb.blocked.up && !this.player.dying) {
      let best = null, bestOv = 4;   // 至少 4px 水平重叠，纯擦角不算
      this.blocks.getChildren().forEach(b => {
        if (Math.abs(pb.top - b.body.bottom) > 4) return;   // 只看贴着头顶的
        const ov = Math.min(pb.right, b.body.right) - Math.max(pb.left, b.body.left);
        if (ov > bestOv) { bestOv = ov; best = b; }
      });
      if (best) this.bumpBlock(best);
    }

    this.player.update(time, delta);

    // 天空与太阳跟随镜头（视觉上等同屏幕固定）
    const mid = this.cameras.main.midPoint;
    this.skyImg.setPosition(mid.x, mid.y);
    if (this.sunImg) this.sunImg.setPosition(mid.x + 368, mid.y - 156);

    // 掉坑死亡
    if (!this.player.dying && this.player.y > ROWS * TILE + 80) this.player.die();

    // 碰旗杆
    if (this.flagZone && !this.levelClearing
        && this.physics.overlap(this.player, this.flagZone)) {
      this.hitFlag();
    }
  }
}
