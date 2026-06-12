// ============================================================
// cloud.js - 云端档案：匿名登录 + 世界排行 + Google 账号绑定
// Firebase SDK 按需动态加载（未配置时零开销）
// 数据模型 players/{uid}: { name, best, t0..t15, updatedAt }
// ============================================================

/* eslint-disable */

const CLOUD = {
  enabled: false,
  user: null,
  auth: null,
  db: null,
  ready: null,
  _timer: null,
  _started: false,

  init() {
    if (typeof FIREBASE_CONFIG === 'undefined' || !FIREBASE_CONFIG || this._started) return;
    this._started = true;
    const V = '10.12.2';
    const load = (m) => new Promise((ok, bad) => {
      const s = document.createElement('script');
      s.src = `https://www.gstatic.com/firebasejs/${V}/firebase-${m}-compat.js`;
      s.onload = ok; s.onerror = bad;
      document.head.appendChild(s);
    });
    this.ready = load('app')
      .then(() => Promise.all([load('auth'), load('firestore')]))
      .then(() => {
        firebase.initializeApp(FIREBASE_CONFIG);
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.enabled = true;
        this.auth.onAuthStateChanged((u) => {
          this.user = u;
          if (u) this.pullMerge();
        });
        // 绑定 Google 走 redirect 回来时，处理“该 Google 账号已有档案”的情况：直接切换登录
        this.auth.getRedirectResult().catch((e) => {
          if (e && e.code === 'auth/credential-already-in-use' && e.credential) {
            this.auth.signInWithCredential(e.credential).catch(() => {});
          }
        });
        return this.auth.signInAnonymously().catch(() => {});
      })
      .catch(() => { this.enabled = false; });
  },

  isGoogle() {
    return !!(this.user && this.user.providerData
      && this.user.providerData.some((p) => p && p.providerId === 'google.com'));
  },

  // 拉取云端档案并与本地合并：分数取大、用时取小、本地未起名时采用云端名字
  async pullMerge() {
    try {
      const snap = await this.db.collection('players').doc(this.user.uid).get();
      if (snap.exists) {
        const d = snap.data() || {};
        if (typeof d.best === 'number' && d.best > PROFILE.best) {
          PROFILE.data = { ...PROFILE.data, best: d.best };
        }
        const times = { ...(PROFILE.data.times || {}) };
        for (let i = 0; i < 16; i++) {
          const v = d['t' + i];
          if (typeof v === 'number' && (times[i] === undefined || v < times[i])) times[i] = v;
        }
        PROFILE.data = { ...PROFILE.data, times };
        if (!PROFILE.data.name && typeof d.name === 'string' && d.name) {
          PROFILE.data = { ...PROFILE.data, name: d.name.slice(0, 8) };
        }
        PROFILE.save();
      }
    } catch (e) { /* 离线/被墙时静默降级 */ }
    this.scheduleSync();
  },

  // 本地档案变化后延迟上传（合并 1.5 秒内的连续变化）
  scheduleSync() {
    if (!this.enabled || !this.user) return;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.push(), 1500);
  },

  push() {
    if (!this.enabled || !this.user) return;
    const doc = {
      name: PROFILE.name,
      best: PROFILE.best,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    const times = PROFILE.data.times || {};
    Object.keys(times).forEach((k) => { doc['t' + k] = times[k]; });
    this.db.collection('players').doc(this.user.uid).set(doc, { merge: true }).catch(() => {});
  },

  // 世界总分排行 Top N
  async fetchTop(n) {
    if (!this.enabled) return null;
    try {
      const q = await this.db.collection('players')
        .orderBy('best', 'desc').limit(n || 10).get();
      return q.docs.map((d) => ({
        uid: d.id,
        name: (d.data().name || '???').slice(0, 8),
        best: d.data().best || 0,
      }));
    } catch (e) { return null; }
  },

  // 绑定 Google：匿名账号原地升级（uid 不变，纪录保留）
  async signInGoogle(onDone) {
    if (!this.enabled || !this.user) { onDone(false); return; }
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      if (this.user.isAnonymous) await this.user.linkWithPopup(provider);
      else await this.auth.signInWithPopup(provider);
      this.user = this.auth.currentUser;
      this.scheduleSync();
      onDone(true);
    } catch (e) {
      const code = e && e.code;
      if (code === 'auth/credential-already-in-use' && e.credential) {
        // 该 Google 账号已有档案：切换登录，onAuthStateChanged 里会做合并
        try { await this.auth.signInWithCredential(e.credential); onDone(true); return; }
        catch (e2) { onDone(false); return; }
      }
      if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user'
          || code === 'auth/cancelled-popup-request' || code === 'auth/operation-not-supported-in-this-environment') {
        // 移动端弹窗被拦截 → 整页跳转方式
        try {
          if (this.user.isAnonymous) await this.user.linkWithRedirect(provider);
          else await this.auth.signInWithRedirect(provider);
          return;   // 页面即将跳转，不回调
        } catch (e3) { onDone(false); return; }
      }
      onDone(false);
    }
  },
};

CLOUD.init();
