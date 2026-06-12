// ============================================================
// profile.js - 玩家个性化档案：昵称 + 最高纪录
// 存储在 localStorage，跨会话保留
// ============================================================

/* eslint-disable */

const PROFILE = {
  KEY: 'mario-profile-v1',
  data: { name: '', best: 0, color: 'red', times: {} },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) this.data = { ...this.data, ...JSON.parse(raw) };
    } catch (e) { /* file:// 受限或数据损坏时忽略 */ }
  },

  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* 忽略 */ }
    // 云端档案同步（cloud.js 未配置/未加载时静默跳过）
    if (typeof CLOUD !== 'undefined' && CLOUD.enabled) CLOUD.scheduleSync();
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

  setColor(c) {
    this.data = { ...this.data, color: c };
    this.save();
  },

  // 记录某关最快通关用时（秒），返回是否破纪录
  recordTime(level, sec) {
    const times = { ...(this.data.times || {}) };
    if (times[level] !== undefined && times[level] <= sec) return false;
    times[level] = sec;
    this.data = { ...this.data, times };
    this.save();
    return true;
  },

  bestTime(level) { return (this.data.times || {})[level]; },

  get name() { return this.data.name || '小英雄'; },
  get best() { return this.data.best || 0; },
  get color() { return this.data.color || 'red'; },
};

PROFILE.load();
