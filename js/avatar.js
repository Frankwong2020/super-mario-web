// ============================================================
// avatar.js - 自定义头像：导入照片 → 像素化成主角的脸
// 存储在 localStorage，跨会话保留
// ============================================================

/* eslint-disable */

const AVATAR = {
  KEY: 'mario-avatar-v1',
  faceCanvas: null,        // 10x7 像素化人脸，null = 默认像素脸

  // 启动时从 localStorage 恢复（异步，完成后回调）
  load(cb) {
    let data = null;
    try { data = localStorage.getItem(this.KEY); } catch (e) { /* file:// 受限时忽略 */ }
    if (!data) { cb(); return; }
    const img = new Image();
    img.onload = () => { this.faceCanvas = this.pixelate(img); cb(); };
    img.onerror = () => cb();
    img.src = data;
  },

  // 居中裁出 16:11 区域（略偏上，人脸通常在上半部），缩成 16x11 像素
  pixelate(img) {
    const FW = 16, FH = 11;
    const ratio = FW / FH;
    let sw, sh;
    if (img.width / img.height > ratio) { sh = img.height; sw = sh * ratio; }
    else { sw = img.width; sh = sw / ratio; }
    const sx = (img.width - sw) / 2;
    const sy = (img.height - sh) * 0.25;
    const c = document.createElement('canvas');
    c.width = FW; c.height = FH;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, FW, FH);
    return c;
  },

  // 打开文件选择框导入照片（必须由用户手势触发）
  importFromFile(onDone) {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.onchange = () => {
      const file = inp.files && inp.files[0];
      if (!file) { onDone(false); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          this.faceCanvas = this.pixelate(img);
          this.save();
          onDone(true);
        };
        img.onerror = () => onDone(false);
        img.src = reader.result;
      };
      reader.onerror = () => onDone(false);
      reader.readAsDataURL(file);
    };
    inp.click();
  },

  // 只存放大后的小图（≈1KB），避免照片原图撑爆 localStorage
  save() {
    if (!this.faceCanvas) return;
    const c = document.createElement('canvas');
    c.width = 64; c.height = 44;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.faceCanvas, 0, 0, 64, 44);
    try { localStorage.setItem(this.KEY, c.toDataURL()); } catch (e) { /* 忽略 */ }
  },

  clear() {
    this.faceCanvas = null;
    try { localStorage.removeItem(this.KEY); } catch (e) { /* 忽略 */ }
  },
};
