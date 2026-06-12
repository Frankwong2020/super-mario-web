// ============================================================
// profile.js - 玩家个性化档案：昵称 + 最高纪录
// 存储在 localStorage，跨会话保留
// ============================================================

/* eslint-disable */

const PROFILE = {
  KEY: 'mario-profile-v1',
  data: { name: '', best: 0 },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) this.data = { ...this.data, ...JSON.parse(raw) };
    } catch (e) { /* file:// 受限或数据损坏时忽略 */ }
  },

  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* 忽略 */ }
  },

  setName(n) {
    this.data = { ...this.data, name: String(n || '').trim().slice(0, 8) };
    this.save();
  },

  // 返回是否破纪录
  recordScore(score) {
    if (!(score > this.data.best)) return false;
    this.data = { ...this.data, best: score };
    this.save();
    return true;
  },

  get name() { return this.data.name || '小英雄'; },
  get best() { return this.data.best || 0; },
};

PROFILE.load();
