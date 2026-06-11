// ============================================================
// levels.js - 关卡数据（用构建器按列生成 15 行网格）
// 网格字符: '#'地面 '='硬块 'B'砖 '?'金币问号 'M'道具问号 '!'星星砖
//   'C'金币 '{'/'}'管口 '['/']'管身 'p'食人花 'g'板栗仔 'k'乌龟
//   'F'旗杆 'X'Boss 'L'岩浆 'A'城堡装饰
// ============================================================

/* eslint-disable */

const ROWS = 15;          // 视野高 15 格（每格 32px = 480px）
const GROUND_ROW = 13;    // 地面顶行

// 逻辑分辨率（所有游戏坐标基于此）与渲染超采样倍数
const VIEW_W = 1024;
const VIEW_H = 480;
const RENDER_SCALE = 2;   // 画布实际 2048x960，摄像机 zoom 2 渲染，更清晰

class LevelBuilder {
  constructor(cols) {
    this.cols = cols;
    this.grid = Array.from({ length: ROWS }, () => Array(cols).fill(' '));
  }
  set(c, r, ch) {
    if (r >= 0 && r < ROWS && c >= 0 && c < this.cols) this.grid[r][c] = ch;
  }
  fill(c0, c1, r0, r1, ch) {
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) this.set(c, r, ch);
  }
  ground(c0, c1) { this.fill(c0, c1, GROUND_ROW, ROWS - 1, '#'); }
  row(r, c0, c1, ch) { this.fill(c0, c1, r, r, ch); }
  pipe(c, h, piranha) {
    const top = GROUND_ROW - h;
    this.set(c, top, '{'); this.set(c + 1, top, '}');
    for (let r = top + 1; r < GROUND_ROW; r++) { this.set(c, r, '['); this.set(c + 1, r, ']'); }
    if (piranha) this.set(c, top - 1, 'p');
  }
  stairsUp(c, h) {   // 从 c 开始向右逐级升高，最高 h 级
    for (let i = 0; i < h; i++)
      for (let r = GROUND_ROW - 1 - i; r < GROUND_ROW; r++) this.set(c + i, r, '=');
  }
  stairsDown(c, h) { // 从 c 开始向右逐级降低
    for (let i = 0; i < h; i++)
      for (let r = GROUND_ROW - h + i; r < GROUND_ROW; r++) this.set(c + i, r, '=');
  }
  coins(c0, c1, r) { for (let c = c0; c <= c1; c++) this.set(c, r, 'C'); }
  enemy(c, ch) { this.set(c, GROUND_ROW - 1, ch); }
  flag(c) { this.set(c, GROUND_ROW - 1, 'F'); }
  castle(c) { this.set(c, GROUND_ROW - 1, 'A'); }
  lava(c0, c1) { this.fill(c0, c1, ROWS - 1, ROWS - 1, 'L'); }
  toRows() { return this.grid.map(r => r.join('')); }
}

// ---------- 1-1 草原入门 ----------
function buildW11() {
  const b = new LevelBuilder(165);
  b.ground(0, 68); b.ground(72, 85); b.ground(89, 164);
  b.set(16, 9, '?');
  b.row(9, 20, 24, 'B'); b.set(21, 9, '?'); b.set(23, 9, 'M');
  b.row(5, 21, 23, 'C');
  b.pipe(29, 2); b.pipe(37, 3); b.pipe(46, 4, true);
  b.enemy(22, 'g'); b.enemy(26, 'g'); b.enemy(41, 'g'); b.enemy(42, 'g');
  b.coins(60, 63, 8);
  b.row(9, 60, 63, 'B'); b.set(61, 9, '!');
  b.enemy(57, 'k');
  b.row(9, 77, 80, 'B'); b.set(78, 9, 'M');
  b.coins(76, 81, 5);
  b.enemy(79, 'g'); b.enemy(81, 'g');
  b.pipe(95, 2, true);
  b.row(9, 100, 104, 'B'); b.set(102, 9, '?');
  b.enemy(103, 'g'); b.enemy(105, 'g'); b.enemy(110, 'k');
  b.coins(108, 111, 9);
  b.stairsUp(118, 4); b.stairsDown(124, 4);
  b.enemy(122, 'g');
  b.stairsUp(132, 5);
  b.coins(133, 136, 6);
  b.flag(148); b.castle(155);
  return b.toRows();
}

// ---------- 1-2 地下水道 ----------
function buildW12() {
  const b = new LevelBuilder(150);
  b.row(0, 0, 149, 'B');                       // 天花板
  b.ground(0, 40); b.ground(44, 78); b.ground(82, 110); b.ground(114, 149);
  b.row(9, 8, 12, 'B'); b.set(10, 9, 'M');
  b.coins(9, 11, 6);
  b.enemy(14, 'g'); b.enemy(17, 'g');
  b.fill(22, 24, 10, 12, 'B');                 // 砖塔
  b.coins(22, 24, 8);
  b.enemy(28, 'k');
  b.row(9, 30, 36, 'B'); b.set(33, 9, '?');
  b.enemy(33, 'g'); b.enemy(35, 'g');
  b.coins(45, 48, 9);
  b.fill(52, 54, 8, 12, 'B');
  b.coins(52, 54, 5);
  b.pipe(60, 2, true);
  b.enemy(66, 'g'); b.enemy(68, 'g'); b.enemy(70, 'k');
  b.row(9, 70, 75, 'B'); b.set(72, 9, '!');
  b.coins(84, 88, 9); b.coins(86, 90, 5);
  b.fill(92, 94, 9, 12, 'B');
  b.enemy(98, 'g'); b.enemy(100, 'g'); b.enemy(102, 'g');
  b.pipe(104, 3, true);
  b.row(9, 116, 121, 'B'); b.set(118, 9, 'M');
  b.enemy(124, 'k'); b.enemy(127, 'g');
  b.stairsUp(132, 5);
  b.flag(141); b.castle(146);
  return b.toRows();
}

// ---------- 2-1 险峻草原 ----------
function buildW21() {
  const b = new LevelBuilder(175);
  b.ground(0, 22); b.ground(26, 45); b.ground(50, 70); b.ground(75, 99);
  b.ground(104, 128); b.ground(133, 174);
  b.set(10, 9, '?'); b.set(12, 9, 'M');
  b.enemy(14, 'g'); b.enemy(16, 'g');
  b.pipe(19, 3, true);
  b.coins(23, 25, 8);                          // 跨坑金币
  b.row(9, 30, 34, 'B'); b.set(32, 9, '?');
  b.enemy(31, 'k'); b.enemy(34, 'g'); b.enemy(36, 'g');
  b.pipe(41, 4, true);
  b.coins(46, 49, 7);
  b.row(8, 54, 58, '='); b.coins(54, 58, 6);   // 浮空平台
  b.enemy(56, 'g'); b.enemy(60, 'g'); b.enemy(62, 'k');
  b.pipe(66, 2, true);
  b.coins(71, 74, 7);
  b.row(9, 78, 84, 'B'); b.set(80, 9, 'M'); b.set(83, 9, '!');
  b.enemy(82, 'g'); b.enemy(85, 'g'); b.enemy(88, 'k'); b.enemy(91, 'g');
  b.stairsUp(94, 4);
  b.coins(100, 103, 8);
  b.row(7, 108, 112, '='); b.coins(108, 112, 5);
  b.enemy(110, 'g'); b.enemy(113, 'g');
  b.pipe(118, 3, true);
  b.enemy(124, 'k'); b.enemy(126, 'k');
  b.coins(129, 132, 7);
  b.row(9, 136, 141, 'B'); b.set(138, 9, '?'); b.set(140, 9, '?');
  b.enemy(139, 'g'); b.enemy(142, 'g'); b.enemy(145, 'g');
  b.stairsUp(150, 6);
  b.coins(151, 155, 5);
  b.flag(162); b.castle(169);
  return b.toRows();
}

// ---------- 2-2 幽深洞窟 ----------
function buildW22() {
  const b = new LevelBuilder(160);
  b.row(0, 0, 159, 'B');
  b.ground(0, 18); b.ground(23, 40); b.ground(45, 60); b.ground(64, 82);
  b.ground(86, 105); b.ground(110, 130); b.ground(134, 159);
  b.row(9, 6, 10, 'B'); b.set(8, 9, 'M');
  b.enemy(12, 'g'); b.enemy(14, 'g');
  b.coins(19, 22, 8);
  b.fill(26, 28, 9, 12, 'B'); b.coins(26, 28, 6);
  b.enemy(31, 'k'); b.enemy(34, 'g');
  b.pipe(37, 2, true);
  b.coins(41, 44, 8);
  b.row(8, 48, 52, 'B'); b.set(50, 8, '?');
  b.enemy(50, 'g'); b.enemy(52, 'g'); b.enemy(54, 'k');
  b.coins(61, 63, 7);
  b.fill(67, 69, 8, 12, 'B'); b.coins(67, 69, 5);
  b.pipe(74, 3, true);
  b.enemy(78, 'g'); b.enemy(80, 'g');
  b.coins(83, 85, 8);
  b.row(9, 88, 94, 'B'); b.set(90, 9, '!'); b.set(93, 9, '?');
  b.enemy(92, 'k'); b.enemy(95, 'g'); b.enemy(97, 'g');
  b.coins(106, 109, 7);
  b.fill(112, 114, 9, 12, 'B');
  b.enemy(118, 'g'); b.enemy(120, 'g'); b.enemy(122, 'k'); b.enemy(124, 'g');
  b.pipe(126, 2, true);
  b.coins(131, 133, 8);
  b.row(9, 136, 141, 'B'); b.set(138, 9, 'M');
  b.enemy(144, 'k'); b.enemy(146, 'g');
  b.stairsUp(149, 5);
  b.flag(155); // 地下关无城堡
  return b.toRows();
}

// ---------- 城堡 Boss 战 ----------
function buildCastle() {
  const b = new LevelBuilder(90);
  b.row(0, 0, 89, '#'); b.row(1, 0, 89, '#');  // 城堡天花板
  b.ground(0, 19); b.ground(24, 35); b.ground(40, 51); b.ground(56, 89);
  b.lava(20, 23); b.lava(36, 39); b.lava(52, 55);
  b.row(9, 8, 11, 'B'); b.set(9, 9, 'M');
  b.row(8, 20, 23, '=');                       // 岩浆上平台
  b.coins(20, 23, 6);
  b.enemy(27, 'k');
  b.row(8, 36, 39, '='); b.coins(36, 39, 6);
  b.enemy(44, 'g'); b.enemy(46, 'g');
  b.row(8, 52, 55, '='); b.coins(52, 55, 6);
  b.set(70, GROUND_ROW - 1, 'X');              // Boss
  return b.toRows();
}

const LEVELS = [
  { name: '世界 1-1', theme: 'overworld',  music: 'overworld',  time: 300, map: buildW11() },
  { name: '世界 1-2', theme: 'underground', music: 'underground', time: 300, map: buildW12() },
  { name: '世界 2-1', theme: 'overworld',  music: 'overworld',  time: 300, map: buildW21() },
  { name: '世界 2-2', theme: 'underground', music: 'underground', time: 300, map: buildW22() },
  { name: '魔王城堡', theme: 'castle',     music: 'boss',       time: 300, map: buildCastle() },
];

const THEMES = {
  overworld:  { sky: 0x3cbcfc, ground: 'ground',  brick: 'brick',  block: 'block',  deco: true },
  underground:{ sky: 0x101030, ground: 'groundU', brick: 'brickU', block: 'blockU', deco: false },
  castle:     { sky: 0x282828, ground: 'castlebrick', brick: 'brick', block: 'castlebrick', deco: false },
};
