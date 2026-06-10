// ============================================================
// enemies.js - 敌人实体：板栗仔/乌龟/食人花/Boss
// ============================================================

/* eslint-disable */

// 敌人通用：被火球/龟壳/无敌星击杀时翻面飞出
function knockOut(enemy, fromX) {
  const scene = enemy.scene;
  if (!scene) return;
  enemy.dead = true;
  enemy.setFlipY(true);
  if (enemy.body) {
    enemy.body.checkCollision.none = true;
    enemy.setVelocity(enemy.x < fromX ? -120 : 120, -300);
    enemy.body.setAllowGravity(true);
  }
  scene.time.delayedCall(1200, () => { if (enemy.scene) enemy.destroy(); });
}

// ---------- 板栗仔 ----------
class Goomba extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'goomba0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    scene.enemies.add(this);
    this.setScale(2).setDepth(4);
    this.play('goomba-walk');
    this.body.setSize(13, 14).setOffset(1.5, 2);
    this.kind = 'goomba';
    this.activated = false;
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.dead || !this.body) return;
    // 进入镜头范围才开始活动（经典行为）
    if (!this.activated) {
      const cam = this.scene.cameras.main;
      if (this.x > cam.scrollX + cam.width + 64) return;
      this.activated = true;
      this.setVelocityX(-45);
    }
    if (this.body.blocked.left) this.setVelocityX(45);
    if (this.body.blocked.right) this.setVelocityX(-45);
    if (this.y > this.scene.physics.world.bounds.height + 64) this.destroy();
  }

  stomp() {
    this.dead = true;
    this.setTexture('goomba-flat');
    this.anims.stop();
    this.setVelocity(0, 0);
    this.body.checkCollision.none = true;
    this.body.setAllowGravity(false);
    this.scene.time.delayedCall(500, () => { if (this.scene) this.destroy(); });
  }
}

// ---------- 乌龟（踩→龟壳→踢出） ----------
class Koopa extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y - 6, 'koopa0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    scene.enemies.add(this);
    this.setScale(2).setDepth(4);
    this.play('koopa-walk');
    this.body.setSize(12, 18).setOffset(2, 4);
    this.kind = 'koopa';
    this.state = 'walk';   // walk | shell | spinning
    this.activated = false;
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.dead || !this.body) return;
    if (!this.activated) {
      const cam = this.scene.cameras.main;
      if (this.x > cam.scrollX + cam.width + 64) return;
      this.activated = true;
      this.setVelocityX(-40);
    }
    const speed = this.state === 'spinning' ? 340 : this.state === 'shell' ? 0 : 40;
    if (this.body.blocked.left) this.setVelocityX(speed);
    if (this.body.blocked.right) this.setVelocityX(-speed);
    this.setFlipX(this.body.velocity.x > 0);
    if (this.y > this.scene.physics.world.bounds.height + 64) this.destroy();
  }

  stomp(player) {
    if (this.state === 'walk') {
      this.state = 'shell';
      this.anims.stop();
      this.setTexture('shell');
      this.body.setSize(14, 11).setOffset(1, 2);
      this.setVelocityX(0);
    } else if (this.state === 'spinning') {
      this.state = 'shell';
      this.setVelocityX(0);
    } else {
      this.kick(player.x);
    }
  }

  kick(fromX) {
    this.state = 'spinning';
    this.setVelocityX(this.x < fromX ? -340 : 340);
    AUDIO.sfx('kick');
  }
}

// ---------- 食人花（从水管伸出） ----------
class Piranha extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'piranha0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    scene.enemies.add(this);
    this.setScale(2).setDepth(2);           // 藏在水管后面
    this.play('piranha-chomp');
    this.body.setAllowGravity(false);
    this.body.setSize(12, 20).setOffset(2, 2);
    this.body.checkCollision.none = false;
    this.kind = 'piranha';
    this.baseY = y;
    this.hideY = y + 52;
    this.y = this.hideY;

    // 循环伸出/缩回
    scene.tweens.add({
      targets: this,
      y: { from: this.hideY, to: this.baseY },
      duration: 900,
      hold: 1400,
      yoyo: true,
      repeat: -1,
      repeatDelay: 1600,
    });
  }
}

// ---------- 魔王 Boss ----------
class Boss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y - 16, 'boss0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    scene.enemies.add(this);
    this.setScale(2).setDepth(6);
    this.body.setSize(20, 26).setOffset(3, 6);
    this.kind = 'boss';
    this.hp = 6;
    this.maxHp = 6;
    this.phase = 0;
    this.nextFire = 0;
    this.nextJump = 0;
    this.hurtUntil = 0;

    // 血条
    this.hpBar = scene.add.rectangle(x, y - 70, 96, 10, 0xd82800).setDepth(20);
    this.hpBarBg = scene.add.rectangle(x, y - 70, 100, 14, 0x000000).setDepth(19);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.dead || !this.body) return;
    const player = this.scene.player;
    if (!player || player.dying) return;
    const dist = Math.abs(player.x - this.x);
    if (dist > 700) return;   // 玩家未靠近时待机

    const dir = player.x < this.x ? -1 : 1;
    this.setFlipX(dir > 0);

    // 缓慢逼近
    if (this.body.blocked.down) {
      const speed = this.hp <= 2 ? 70 : 40;
      this.setVelocityX(dir * speed);
    }
    // 周期跳跃
    if (time > this.nextJump && this.body.blocked.down) {
      this.setVelocityY(-420);
      this.nextJump = time + (this.hp <= 3 ? 1800 : 2800);
    }
    // 喷火
    if (time > this.nextFire) {
      new BossFire(this.scene, this.x + dir * 40, this.y - 10, dir);
      this.nextFire = time + (this.hp <= 3 ? 1300 : 2200);
    }
    // 血条跟随
    this.hpBar.setPosition(this.x, this.y - 70).setSize(96 * this.hp / this.maxHp, 10);
    this.hpBarBg.setPosition(this.x, this.y - 70);
  }

  hit(time) {
    if (this.dead || time < this.hurtUntil) return false;
    this.hurtUntil = time + 600;
    this.hp--;
    AUDIO.sfx('bosshit');
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(120, () => { if (this.scene) this.clearTint(); });
    if (this.hp <= 0) this.die();
    return true;
  }

  die() {
    this.dead = true;
    AUDIO.sfx('bossdie');
    this.hpBar.destroy(); this.hpBarBg.destroy();
    this.setFlipY(true);
    this.body.checkCollision.none = true;
    this.setVelocity(0, -200);
    this.scene.cameras.main.shake(400, 0.01);
    this.scene.events.emit('bossDefeated');
  }
}
