// ============================================================
// BootScene - 恢复自定义头像 → 生成全部纹理与动画
// ============================================================

/* eslint-disable */

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    AVATAR.load(() => {
      TextureFactory.generateAll(this);
      TextureFactory.createAnims(this);
      this.registry.set('touch', {});
      this.scene.start('MenuScene', { mode: 'title' });
    });
  }
}
