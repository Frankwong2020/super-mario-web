// ============================================================
// items.js - 道具实体：蘑菇/火焰花/星星/火球
// ============================================================

/* eslint-disable */

// 从问号块里冒出的道具
class PowerUp extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, kind) {
    const tex = kind === 'mushroom' ? 'mushroom' : kind === 'star' ? 'star' : 'flower0';
    super(scene, x, y, tex);
    this.kind = kind;
    scene.add.existing(this);
    this.setScale(2).setDepth(4);

    // 出土动画：先无物理，升起后激活
    AUDIO.sfx('sprout');
    scene.tweens.add({
      targets: this, y: y - 32, duration: 500,
      onComplete: () => this.activate(scene),
    });
  }

  activate(scene) {
    if (!this.scene) return;
    scene.physics.add.existing(this);
    this.body.setSize(14, 14).setOffset(1, 1);
    scene.items.add(this);
    if (this.kind === 'mushroom') {
      this.setVelocityX(70);
      this.body.setBounceX(1);
    } else if (this.kind === 'star') {
      this.setVelocityX(110);
      this.body.setBounce(1, 0);
      this.bouncing = true;
    } else {
      this.body.setAllowGravity(true);
      this.play('flower-glow');
    }
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.body) return;
    if (this.bouncing && this.body.blocked.down) this.setVelocityY(-380);
    if (this.kind === 'mushroom') {
      if (this.body.blocked.left) this.setVelocityX(70);
      if (this.body.blocked.right) this.setVelocityX(-70);
    }
    if (this.y > this.scene.physics.world.bounds.height + 64) this.destroy();
  }
}

// 玩家发射的火球
class Fireball extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, dir) {
    super(scene, x, y, 'fireball0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    scene.fireballs.add(this);
    this.setScale(2).setDepth(5);
    this.play('fireball-spin');
    this.body.setSize(6, 6).setOffset(1, 1);
    this.setVelocity(320 * dir, 100);
    this.body.setBounceY(1);
    this.born = scene.time.now;
    AUDIO.sfx('fireball');
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.body) return;
    // 弹跳行进；撞墙或超时即消失
    if (this.body.blocked.down) this.setVelocityY(-260);
    if (this.body.blocked.left || this.body.blocked.right || time - this.born > 3000
        || this.y > this.scene.physics.world.bounds.height + 64) {
      this.pop();
    }
  }

  pop() {
    if (!this.scene) return;
    const puff = this.scene.add.circle(this.x, this.y, 8, 0xfca044).setDepth(5);
    this.scene.tweens.add({ targets: puff, alpha: 0, scale: 2, duration: 150, onComplete: () => puff.destroy() });
    this.destroy();
  }
}

// Boss 喷出的火焰
class BossFire extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, dir) {
    super(scene, x, y, 'bossfire');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    scene.bossFires.add(this);
    this.setScale(2).setDepth(5);
    this.setFlipX(dir > 0);
    this.body.setAllowGravity(false);
    this.body.setSize(14, 4).setOffset(1, 1);
    this.setVelocityX(220 * dir);
    scene.time.delayedCall(4000, () => { if (this.scene) this.destroy(); });
  }
}

// 飘分特效
function scorePopup(scene, x, y, text) {
  const t = scene.add.text(x, y, text, {
    fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', stroke: '#000000', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(20);
  scene.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 700, onComplete: () => t.destroy() });
}

// 砖块碎裂特效
function brickBurst(scene, x, y) {
  for (const [vx, vy] of [[-120, -350], [120, -350], [-80, -200], [80, -200]]) {
    const f = scene.physics.add.sprite(x, y, 'frag').setScale(2).setDepth(15);
    f.setVelocity(vx, vy);
    f.body.setAllowGravity(true);
    f.body.checkCollision.none = true;
    scene.tweens.add({ targets: f, angle: 360, alpha: 0, duration: 800, onComplete: () => f.destroy() });
  }
}

// 块里弹出的金币特效
function coinPop(scene, x, y) {
  const c = scene.add.sprite(x, y, 'coin0').setScale(2).setDepth(15);
  c.play('coin-spin');
  scene.tweens.add({
    targets: c, y: y - 64, duration: 250, yoyo: true, ease: 'Quad.easeOut',
    onComplete: () => c.destroy(),
  });
}
