// ============================================================
// audio.js - Web Audio 芯片音乐引擎（原创 8-bit 旋律 + 音效）
// 无需任何音频文件，实时合成
// ============================================================

/* eslint-disable */

// 音名转频率：'C4' 'F#5' 'Eb3'，'-' 表示休止
function noteFreq(name) {
  if (!name || name === '-') return 0;
  const m = name.match(/^([A-G])([#b]?)(\d)$/);
  if (!m) return 0;
  const idx = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]]
    + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const oct = parseInt(m[3], 10);
  return 440 * Math.pow(2, (idx - 9) / 12 + (oct - 4));
}

// ---------- 原创曲目（[音名, 拍数] 序列，melody=方波 bass=三角波） ----------
const SONGS = {
  overworld: {
    bpm: 152,
    melody: [
      ['E5',.5],['E5',.5],['-',.5],['E5',.5],['-',.5],['C5',.5],['E5',1],
      ['G5',1],['-',1],['G4',1],['-',1],
      ['C5',1],['-',.5],['G4',1],['-',.5],['E4',1],
      ['-',.5],['A4',.5],['B4',.5],['Bb4',.5],['A4',1],
      ['G4',.66],['E5',.66],['G5',.66],['A5',1],['F5',.5],['G5',.5],
      ['-',.5],['E5',1],['C5',.5],['D5',.5],['B4',1],['-',1],
      ['C5',.5],['E5',.5],['G5',.5],['C6',.5],['A5',.5],['G5',.5],['E5',.5],['C5',.5],
      ['D5',.5],['F5',.5],['A5',.5],['G5',1],['E5',.5],['C5',1],
    ],
    bass: [
      ['C3',1],['G3',1],['C3',1],['G3',1],
      ['C3',1],['G3',1],['C3',1],['G3',1],
      ['F3',1],['C3',1],['F3',1],['C3',1],
      ['G3',1],['D3',1],['G3',1],['G2',1],
      ['C3',1],['G3',1],['A3',1],['F3',1],
      ['C3',1],['G3',1],['B2',1],['G2',1],
      ['C3',1],['E3',1],['G3',1],['C4',1],
      ['F3',1],['G3',1],['C3',1],['C3',1],
    ],
  },
  underground: {
    bpm: 120,
    melody: [
      ['C4',.5],['C5',.5],['A3',.5],['A4',.5],['Bb3',.5],['Bb4',.5],['-',1],
      ['-',2],
      ['C4',.5],['C5',.5],['A3',.5],['A4',.5],['Bb3',.5],['Bb4',.5],['-',1],
      ['-',2],
      ['F3',.5],['F4',.5],['D3',.5],['D4',.5],['Eb3',.5],['Eb4',.5],['-',1],
      ['-',2],
      ['Eb4',.5],['D4',.5],['Db4',.5],['C4',.5],['B3',.5],['Bb3',.5],['A3',.5],['Ab3',.5],
      ['G3',1],['-',3],
    ],
    bass: [
      ['C2',2],['-',2],['C2',2],['-',2],
      ['C2',2],['-',2],['C2',2],['-',2],
      ['F2',2],['-',2],['F2',2],['-',2],
      ['G2',2],['-',2],['C2',2],['-',2],
    ],
  },
  boss: {
    bpm: 168,
    melody: [
      ['E4',.5],['E4',.5],['G4',.5],['E4',.5],['B4',.5],['A4',.5],['G4',.5],['E4',.5],
      ['F4',.5],['F4',.5],['A4',.5],['F4',.5],['C5',.5],['B4',.5],['A4',.5],['F4',.5],
      ['E4',.5],['E4',.5],['G4',.5],['E4',.5],['B4',.5],['C5',.5],['D5',.5],['B4',.5],
      ['C5',.5],['B4',.5],['A4',.5],['G4',.5],['F#4',.5],['G4',.5],['A4',.5],['B4',.5],
    ],
    bass: [
      ['E2',.5],['E2',.5],['E3',.5],['E2',.5],['E2',.5],['E3',.5],['E2',.5],['E3',.5],
      ['F2',.5],['F2',.5],['F3',.5],['F2',.5],['F2',.5],['F3',.5],['F2',.5],['F3',.5],
      ['E2',.5],['E2',.5],['E3',.5],['E2',.5],['E2',.5],['E3',.5],['E2',.5],['E3',.5],
      ['A2',.5],['A2',.5],['D2',.5],['D2',.5],['B2',.5],['B2',.5],['E2',.5],['E2',.5],
    ],
  },
};

class ChipAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.musicTimer = null;
    this.currentSong = null;
    this.muted = false;
  }

  // 必须在用户首次交互后调用
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.6;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 1.0;
    this.musicGain.connect(this.master);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.6;
    return this.muted;
  }

  // ---------- 基础发声 ----------
  tone(freq, start, dur, type, vol, dest, slideTo) {
    if (!this.ctx || !freq) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.linearRampToValueAtTime(slideTo, start + dur);
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(g); g.connect(dest || this.master);
    osc.start(start); osc.stop(start + dur + 0.02);
  }

  noise(start, dur, vol) {
    if (!this.ctx) return;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.buffer = buf;
    src.connect(g); g.connect(this.master);
    src.start(start);
  }

  // ---------- 音效 ----------
  sfx(name) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'jump':
        this.tone(260, t, 0.18, 'square', 0.12, null, 760);
        break;
      case 'coin':
        this.tone(noteFreq('B5'), t, 0.08, 'square', 0.12);
        this.tone(noteFreq('E6'), t + 0.08, 0.28, 'square', 0.12);
        break;
      case 'stomp':
        this.tone(300, t, 0.12, 'square', 0.14, null, 90);
        break;
      case 'kick':
        this.tone(400, t, 0.1, 'square', 0.14, null, 160);
        break;
      case 'bump':
        this.tone(120, t, 0.1, 'square', 0.14, null, 70);
        break;
      case 'break':
        this.noise(t, 0.25, 0.3);
        this.tone(180, t, 0.15, 'square', 0.1, null, 60);
        break;
      case 'powerup':
        [['C5',0],['E5',1],['G5',2],['C6',3],['E6',4],['G6',5]].forEach(([n, i]) =>
          this.tone(noteFreq(n), t + i * 0.07, 0.09, 'square', 0.11));
        break;
      case 'sprout':
        this.tone(200, t, 0.4, 'square', 0.1, null, 900);
        break;
      case 'fireball':
        this.tone(800, t, 0.12, 'square', 0.1, null, 250);
        break;
      case 'hurt':
        [['G5',0],['E5',1],['C5',2],['G4',3]].forEach(([n, i]) =>
          this.tone(noteFreq(n), t + i * 0.08, 0.1, 'square', 0.12));
        break;
      case 'die':
        this.stopMusic();
        [['C5',0],['B4',1],['Bb4',2],['A4',3],['G4',5],['E4',6],['C4',7]].forEach(([n, i]) =>
          this.tone(noteFreq(n), t + 0.1 + i * 0.13, 0.16, 'square', 0.13));
        break;
      case 'flag':
        [['C4',0],['E4',1],['G4',2],['C5',3],['E5',4],['G5',5],['C6',6]].forEach(([n, i]) =>
          this.tone(noteFreq(n), t + i * 0.1, 0.14, 'square', 0.12));
        break;
      case 'clear':
        this.stopMusic();
        [['G4',0],['C5',1],['E5',2],['G5',3],['E5',4],['G5',5],['C6',7]].forEach(([n, i]) =>
          this.tone(noteFreq(n), t + i * 0.14, 0.2, 'square', 0.12));
        break;
      case '1up':
        [['E5',0],['G5',1],['E6',2],['C6',3],['D6',4],['G6',5]].forEach(([n, i]) =>
          this.tone(noteFreq(n), t + i * 0.09, 0.11, 'square', 0.11));
        break;
      case 'bosshit':
        this.noise(t, 0.2, 0.25);
        this.tone(150, t, 0.25, 'sawtooth', 0.15, null, 50);
        break;
      case 'bossdie':
        this.stopMusic();
        this.noise(t, 0.5, 0.3);
        [['C3',0],['G2',1],['E2',2],['C2',3]].forEach(([n, i]) =>
          this.tone(noteFreq(n), t + i * 0.2, 0.3, 'sawtooth', 0.15));
        break;
      case 'gameover':
        this.stopMusic();
        [['C5',0],['G4',2],['E4',4],['A4',6],['B4',7],['A4',8],['Ab4',9],['Bb4',10],['Ab4',11],['G4',13],['F4',14],['G4',15]].forEach(([n, i]) =>
          this.tone(noteFreq(n), t + i * 0.16, 0.2, 'square', 0.12));
        break;
    }
  }

  // ---------- 背景音乐循环 ----------
  playMusic(name) {
    if (!this.ctx) return;
    if (this.currentSong === name && this.musicTimer) return;
    this.stopMusic();
    const song = SONGS[name];
    if (!song) return;
    this.currentSong = name;
    const beatSec = 60 / song.bpm;
    const loopDur = song.melody.reduce((s, n) => s + n[1], 0) * beatSec;

    const scheduleLoop = (startTime) => {
      let tm = startTime;
      for (const [n, beats] of song.melody) {
        const d = beats * beatSec;
        if (n !== '-') this.tone(noteFreq(n), tm, Math.min(d * 0.9, 0.5), 'square', 0.07, this.musicGain);
        tm += d;
      }
      let tb = startTime;
      for (const [n, beats] of song.bass) {
        const d = beats * beatSec;
        if (n !== '-') this.tone(noteFreq(n), tb, d * 0.85, 'triangle', 0.13, this.musicGain);
        tb += d;
      }
    };

    let nextLoop = this.ctx.currentTime + 0.05;
    scheduleLoop(nextLoop);
    nextLoop += loopDur;
    this.musicTimer = setInterval(() => {
      if (this.ctx.currentTime > nextLoop - 0.3) {
        scheduleLoop(nextLoop);
        nextLoop += loopDur;
      }
    }, 100);
  }

  stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
    this.currentSong = null;
  }
}

const AUDIO = new ChipAudio();
