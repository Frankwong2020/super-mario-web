// ============================================================
// player.js - 主角：小形态 / 大形态 / 火焰形态
// ============================================================

/* eslint-disable */

const FORM_SMALL = 0, FORM_BIG = 1, FORM_FIRE = 2;
const FORM_PREFIX = ['ps', 'pb', 'pf'];

class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'ps-idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(1).setDepth(10);   // 高精度立绘为原生像素尺寸
    this.setCollideWorldBounds(false);

    this.form = scene.registry.get('form') ?? FORM_SMALL;
    this.invulnUntil = 0;
    this.starUntil = 0;
    this.dying = false;
    this.frozen = false;        // 过关动画时锁输入
    this.fireCooldown = 0;
    this.applyForm();

    // 键盘
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = scene.input.keyboard.addKeys({
      left: K.LEFT, right: K.RIGHT, up: K.UP, down: K.DOWN,
      a: K.A, d: K.D, w: K.W,
      space: K.SPACE, fire: K.X, fire2: K.J,
    });
  }

  applyForm() {
    const prefix = FORM_PREFIX[this.form];
    this.setTexture(prefix + '-idle');
    if (this.form === FORM_SMALL) {
      this.body.setSize(22, 30).setOffset(5, 2);     // 32x32 立绘
    } else {
      this.body.setSize(22, 44).setOffset(5, 2);     // 32x48 立绘
    }
  }

  get touch() { return this.scene.registry.get('touch') || {}; }

  update(time) {
    if (this.dying || !this.body) return;
    if (this.frozen) { this.setVelocityX(0); return; }

    const k = this.keys, t = this.touch;
    const left = k.left.isDown || k.a.isDown || t.left;
    const right = k.right.isDown || k.d.isDown || t.right;
    const jump = k.up.isDown || k.w.isDown || k.space.isDown || t.jump;
    const fire = k.fire.isDown || k.fire2.isDown || t.fire;
    const onFloor = this.body.blocked.down;
    const prefix = FORM_PREFIX[this.form];

    // 水平移动
    const speed = 210;
    if (left) { this.setVelocityX(-speed); this.setFlipX(true); }
    else if (right) { this.setVelocityX(speed); this.setFlipX(false); }
    else this.setVelocityX(0);

    // 落地烟尘
    if (onFloor && !this.wasOnFloor && this.peakFallSpeed > 380) {
      spawnDust(this.scene, this.x, this.body.bottom);
    }
    this.peakFallSpeed = onFloor ? 0 : Math.max(this.peakFallSpeed || 0, this.body.velocity.y);
    this.wasOnFloor = onFloor;

    // 跳跃（可变高度）
    if (jump && onFloor && !this.jumpHeld) {
      this.setVelocityY(-560);
      AUDIO.sfx('jump');
    }
    if (!jump && this.body.velocity.y < -200) this.setVelocityY(-200);
    this.jumpHeld = jump;

    // 火球
    if (fire && this.form === FORM_FIRE && time > this.fireCooldown
        && this.scene.fireballs.countActive(true) < 2) {
      this.fireCooldown = time + 350;
      const dir = this.flipX ? -1 : 1;
      new Fireball(this.scene, this.x + dir * 20, this.y - 6, dir);
    }

    // 动画
    if (!onFloor) {
      this.anims.stop();
      this.setTexture(prefix + '-jump');
    } else if (left || right) {
      this.play(prefix + '-run', true);
    } else {
      this.anims.stop();
      this.setTexture(prefix + '-idle');
    }

    // 无敌星彩虹闪烁
    if (time < this.starUntil) {
      const hue = (time / 60) % 360;
      this.setTint(Phaser.Display.Color.HSLToColor(hue / 360, 1, 0.7).color);
      if (this.starUntil - time < 1500 && Math.floor(time / 150) % 2) this.clearTint();
    } else if (time < this.invulnUntil) {
      this.setAlpha(Math.floor(time / 80) % 2 ? 0.3 : 1);
    } else {
      this.clearTint();
      this.setAlpha(1);
    }
  }

  get hasStar() { return this.scene.time.now < this.starUntil; }

  collectPowerUp(kind) {
    const scene = this.scene;
    if (kind === 'star') {
      this.starUntil = scene.time.now + 9000;
      AUDIO.sfx('powerup');
      scene.addScore(this.x, this.y - 30, 1000);
      return;
    }
    AUDIO.sfx('powerup');
    scene.addScore(this.x, this.y - 30, 1000);
    if (kind === 'mushroom' && this.form === FORM_SMALL) this.setForm(FORM_BIG);
    else if (kind === 'flower') this.setForm(FORM_FIRE);
  }

  setForm(form) {
    if (form === this.form) return;
    const grow = form > this.form;
    this.form = form;
    this.scene.registry.set('form', form);
    // 变身时短暂闪白
    const bottom = this.body.bottom;
    this.applyForm();
    this.body.reset(this.x, bottom - this.body.height / 2 - 1);
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(150, () => { if (this.scene) this.clearTint(); });
    if (!grow) this.invulnUntil = this.scene.time.now + 2000;
  }

  hurt() {
    const time = this.scene.time.now;
    if (this.dying || this.hasStar || time < this.invulnUntil) return;
    if (this.form !== FORM_SMALL) {
      AUDIO.sfx('hurt');
      this.setForm(this.form - 1);   // 火焰→大→小，逐级降
    } else {
      this.die();
    }
  }

  die() {
    if (this.dying) return;
    this.dying = true;
    AUDIO.sfx('die');
    this.anims.stop();
    this.setTexture('ps-jump');
    this.setTint(0x8888ff);
    this.body.checkCollision.none = true;
    this.setVelocity(0, -500);
    this.setDepth(30);
    this.scene.onPlayerDeath();
  }
}
