// ============================================================
// BootScene - 生成全部纹理与动画（无外部资源，瞬时完成）
// ============================================================

/* eslint-disable */

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    TextureFactory.generateAll(this);
    TextureFactory.createAnims(this);
    this.registry.set('touch', {});
    this.scene.start('MenuScene', { mode: 'title' });
  }
}
