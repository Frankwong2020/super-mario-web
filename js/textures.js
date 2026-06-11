// ============================================================
// textures.js - 代码生成全部像素美术（FC 红白机风格，原创绘制）
// 每个精灵用 ASCII 像素图 + 调色板定义，启动时绘制到 Canvas 纹理
// ============================================================

/* eslint-disable */

// ---------- 通用调色板 ----------
const PAL = {
  '.': null,            // 透明
  'K': '#000000',       // 黑
  'W': '#ffffff',       // 白
  'R': '#d82800',       // 英雄红
  'r': '#a81000',       // 暗红
  'S': '#fcb888',       // 皮肤
  'H': '#7c4a00',       // 头发/鞋 棕
  'B': '#2038ec',       // 背带裤蓝
  'Y': '#fcc000',       // 金黄
  'y': '#a86800',       // 暗金
  'G': '#00a800',       // 草绿
  'g': '#80d010',       // 亮绿
  'd': '#005800',       // 深绿
  'N': '#c84c0c',       // 板栗棕
  'n': '#883400',       // 深板栗
  'E': '#fce0a8',       // 米色
  'O': '#e09038',       // 地面橙
  'o': '#a04000',       // 地面暗橙
  'P': '#f8c890',       // 地面亮
  'T': '#00a8a8',       // 地下青
  't': '#005c5c',       // 地下暗青
  'A': '#b0b0b0',       // 石灰
  'a': '#686868',       // 石暗
  'L': '#f83800',       // 岩浆红
  'l': '#fca044',       // 岩浆橙
  'C': '#3cbcfc',       // 天空蓝
  'F': '#f87858',       // 火焰橙红
  'Q': '#fc6848',       // 亮红高光（帽顶）
  's': '#e09058',       // 皮肤阴影
  'h': '#4a2c00',       // 深棕（鞋帮/胡子）
  'b': '#1830b8',       // 深蓝阴影
};

function colorOf(ch, overrides) {
  if (overrides && ch in overrides) return overrides[ch];
  return PAL[ch] !== undefined ? PAL[ch] : null;
}

// 把 ASCII 像素图绘制成纹理
function makeTex(scene, key, rows, overrides) {
  const h = rows.length, w = rows[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = colorOf(rows[y][x], overrides);
      if (c) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); }
    }
  }
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, canvas);
}

function mirror(rows) {
  return rows.map(r => r.split('').reverse().join(''));
}

// 玩家纹理：像素图 + 可选自定义人脸覆盖（导入照片功能）
// 高精度立绘共用头部，脸部区域 16x11（帽子保留）
const FACE_SMALL = { x: 8, y: 8, w: 16, h: 11 };
const FACE_BIG = { x: 8, y: 8, w: 16, h: 11 };

function makePlayerTex(scene, key, rows, overrides, faceRect) {
  const h = rows.length, w = rows[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = colorOf(rows[y][x], overrides);
      if (c) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); }
    }
  }
  if (AVATAR.faceCanvas && faceRect) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(AVATAR.faceCanvas, faceRect.x, faceRect.y, faceRect.w, faceRect.h);
  }
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, canvas);
}

// ============================================================
// 主角（高精度立绘：小形态 32x32 / 大形态 32x48，共用 20 行头部）
// 大头身设计：脸部区域 16x11，导入照片清晰可辨
// ============================================================
const HEAD32 = [
  '............KKKKKKKK............',
  '..........KKQQQQQQRRKK..........',
  '.........KQQQQQQQRRRRRK.........',
  '........KQQQQQQRRRRRRRRK........',
  '........KQQQRRRRRRRRRRRK........',
  '.......KRRRRRRRRRRRRRRRRKKKK....',
  '.......KRRRRRRRRRRRRRRRRRRRRK...',
  '........KKKKKKKKKKKKKKKKKKKK....',
  '........KHHHSSSSSSSSSSSK........',
  '.......KHHSSSSSSSSSSSSSSK.......',
  '......KHHSSSSSSSWWKSSSSSK.......',
  '......KHHSSSSSSSWKKSSSSSK.......',
  '......KHHSSSSSSSWWKSSSSSSK......',
  '......KHSSSSSSSSSSSSsSSSSK......',
  '......KHSSSSSSSSSSSssSSSSK......',
  '.......KSSSsssSSSSSssSSSK.......',
  '.......KSShhhhhhhSSSSSSK........',
  '........KShhhhhhhSSSSsK.........',
  '.........KSSSSSSSSSssK..........',
  '..........KKSSSSSSKKK...........',
];
const SB_IDLE = [
  '........KKRRKKKKKKRRKK..........',
  '......KRRRRRRRRRRRRRRRK.........',
  '.....KRRSSKBBRRRRBBKSSRRK.......',
  '.....KSSSSKBBBBBBBBKSSSSK.......',
  '.....KSSSSBBYBBBBYBBSSSSK.......',
  '......KKKBBBBBBBBBBBBKKK........',
  '........KBBBBBBBBBBBK...........',
  '........KBBBBKKBBBBBK...........',
  '........KBBBK..KBBBK............',
  '.......KhHHHK..KhHHHK...........',
  '......KhHHHHK..KhHHHHK..........',
  '.......KKKKK....KKKKK...........',
];
const SB_WALK = [
  '........KKRRKKKKKKRRKK..........',
  '......KRRRRRRRRRRRRRRRK.........',
  '.....KRRSSKBBRRRRBBKSSRRK.......',
  '.....KSSSSKBBBBBBBBKSSSSK.......',
  '.....KSSSSBBYBBBBYBBSSSSK.......',
  '......KKKBBBBBBBBBBBBKKK........',
  '.......KBBBBBBBBBBBBK...........',
  '......KBBBBBKKKBBBBBK...........',
  '.....KBBBK....KBBBBBBK..........',
  '....KhHHHK.....KBBBKK...........',
  '...KhHHHHK....KhHHHHK...........',
  '....KKKKK......KKKKKK...........',
];
const SB_JUMP = [
  '........KKRRKKKKKKRRKK..........',
  '......KRRRRRRRRRRRRRRRK.........',
  '.....KRRSSKBBRRRRBBKSSRRK.......',
  '.....KSSSSKBBBBBBBBKSSSSK.......',
  '.....KSSSSBBYBBBBYBBSSSSK.......',
  '......KKKBBBBBBBBBBBBKKK........',
  '.......KBBBBBBBBBBBBBK..........',
  '......KBBBBBKKKKBBBBBBK.........',
  '.....KBBBBK......KBBBBBK........',
  '....KhHHHK........KhHHHK........',
  '...KhHHHHK........KhHHHHK.......',
  '....KKKKK..........KKKKK........',
];
const BB_IDLE = [
  '........KKRRKKKKKKRRKK..........',
  '......KKRRRRRRRRRRRRRRKK........',
  '.....KRRRRRRRRRRRRRRRRRRK.......',
  '....KRRRRRBRRRRRRRRBRRRRK.......',
  '....KRRRRKBBRRRRRRBBKRRRRK......',
  '...KRRRRRKBBRRRRRRBBKRRRRRK.....',
  '...KRRRRRKBBBBBBBBBBKRRRRRK.....',
  '...KRRSSKBYBBBBBBYBBBKSSRRK.....',
  '...KSSSSKBBYBBBBBBYBBKSSSSK.....',
  '...KSSSSKBBBBBBBBBBBBKSSSSK.....',
  '...KSSSSBBBBBBBBBBBBBBSSSSK.....',
  '....KKKBBBBBBBBBBBBBBBKKK.......',
  '......KBBBBBBBBBBBBBBBK.........',
  '......KBBBBBBBBBBBBBBBK.........',
  '......KBBBBBBBBBBBBBBK..........',
  '......KBBBBBBKKBBBBBBK..........',
  '......KBBBBBK..KBBBBBK..........',
  '......KBBBBK....KBBBBK..........',
  '......KBBBBK....KBBBBK..........',
  '......KBBBBK....KBBBBK..........',
  '......KBBBBK....KBBBBK..........',
  '.....KhHHHHK....KhHHHHK.........',
  '....KhHHHHHK....KhHHHHHK........',
  '....KhHHHHHK....KhHHHHHK........',
  '....KhHHHHHHK...KhHHHHHHK.......',
  '....KhHHHHHHK...KhHHHHHHK.......',
  '.....KKKKKKK.....KKKKKKK........',
  '................................',
];
const BB_WALK = [
  '........KKRRKKKKKKRRKK..........',
  '......KKRRRRRRRRRRRRRRKK........',
  '.....KRRRRRRRRRRRRRRRRRRK.......',
  '....KRRRRRBRRRRRRRRBRRRRK.......',
  '....KRRRRKBBRRRRRRBBKRRRRK......',
  '...KRRRRRKBBRRRRRRBBKRRRRRK.....',
  '...KRRRRRKBBBBBBBBBBKRRRRRK.....',
  '...KRRSSKBYBBBBBBYBBBKSSRRK.....',
  '...KSSSSKBBYBBBBBBYBBKSSSSK.....',
  '...KSSSSKBBBBBBBBBBBBKSSSSK.....',
  '...KSSSSBBBBBBBBBBBBBBSSSSK.....',
  '....KKKBBBBBBBBBBBBBBBKKK.......',
  '......KBBBBBBBBBBBBBBBK.........',
  '......KBBBBBBBBBBBBBBBK.........',
  '......KBBBBBBBBBBBBBBK..........',
  '......KBBBBBKKKKBBBBBK..........',
  '......KBBBBK....KBBBBBK.........',
  '.....KBBBBK......KBBBBK.........',
  '.....KBBBK........KBBBK.........',
  '....KBBBBK.......KBBBBK.........',
  '...KhHHHHK.......KhHHHK.........',
  '..KhHHHHHK......KhHHHHHK........',
  '..KhHHHHK.......KhHHHHHK........',
  '..KhHHHHK......KhHHHHHHK........',
  '..KhHHHHHK.....KhHHHHHHK........',
  '...KKKKKK.......KKKKKKK.........',
  '................................',
  '................................',
];
const BB_JUMP = [
  '........KKRRKKKKKKRRKK..........',
  '......KKRRRRRRRRRRRRRRKK........',
  '.....KRRRRRRRRRRRRRRRRRRK.......',
  '....KRRRRRBRRRRRRRRBRRRRK.......',
  '....KRRRRKBBRRRRRRBBKRRRRK......',
  '...KRRRRRKBBRRRRRRBBKRRRRRK.....',
  '...KRRRRRKBBBBBBBBBBKRRRRRK.....',
  '...KRRSSKBYBBBBBBYBBBKSSRRK.....',
  '...KSSSSKBBYBBBBBBYBBKSSSSK.....',
  '...KSSSSKBBBBBBBBBBBBKSSSSK.....',
  '...KSSSSBBBBBBBBBBBBBBSSSSK.....',
  '....KKKBBBBBBBBBBBBBBBKKK.......',
  '......KBBBBBBBBBBBBBBBK.........',
  '......KBBBBBBBBBBBBBBBK.........',
  '......KBBBBBKKKKBBBBBK..........',
  '......KBBBBK....KBBBBK..........',
  '.....KBBBBK......KBBBBK.........',
  '....KBBBBK........KBBBK.........',
  '...KhHHHHK.......KhHHHK.........',
  '..KhHHHHHK......KhHHHHHK........',
  '..KhHHHHK.......KhHHHHHK........',
  '...KKKKK.........KKKKKK.........',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
];
const PS_IDLE = [...HEAD32, ...SB_IDLE];
const PS_WALK = [...HEAD32, ...SB_WALK];
const PS_JUMP = [...HEAD32, ...SB_JUMP];
const PB_IDLE = [...HEAD32, ...BB_IDLE];
const PB_WALK = [...HEAD32, ...BB_WALK];
const PB_JUMP = [...HEAD32, ...BB_JUMP];

// 火焰形态 = 大形态换色（红→白、蓝→红）
const FIRE_SWAP = {
  'R': '#fcfcfc', 'Q': '#ffffff', 'r': '#d8d8d8',
  'B': '#d82800', 'b': '#a81000', 'Y': '#fcc000',
};

// ============================================================
// 板栗仔 Goomba（16x16）
// ============================================================
const GOOMBA = [
  '......KKKK......',
  '....KKNNNNKK....',
  '...KNNNNNNNNK...',
  '..KNNNNNNNNNNK..',
  '..KNWWKNNKWWNK..',
  '.KNNWKKNNKKWNNK.',
  '.KNNNNNNNNNNNNK.',
  '.KNNNNNNNNNNNNK.',
  '.KNNNNNNNNNNNNK.',
  '..KNNNNNNNNNNK..',
  '...KEEEEEEEEK...',
  '..KEEKKKKKKEEK..',
  '..KEEEEEEEEEEK..',
  '..KKHHK..KHHKK..',
  '.KHHHHK..KHHHHK.',
  '..KKKK....KKKK..',
];
const GOOMBA_FLAT = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '....KKKKKKKK....',
  '..KKNNNNNNNNKK..',
  '.KNNWKNNNNKWNNK.',
  '.KNNNNNNNNNNNNK.',
  '..KEEEEEEEEEEK..',
  '.KHHHKKKKKKHHHK.',
  '..KKK......KKK..',
];

// ============================================================
// 乌龟 Koopa（16x22）/ 龟壳（16x14）
// ============================================================
const KOOPA0 = [
  '......ggggg.....',
  '.....ggggggg....',
  '.....gWKgggg....',
  '.....gWKgggg....',
  '.....ggggggg....',
  '.....EEEEgg.....',
  '....EEEE........',
  '...dGGGGGd......',
  '..dGgGGgGGd.....',
  '.dGGgGGgGGGd....',
  '.dGgggggggGd....',
  '.dGGgGGgGGGd....',
  '.dGgGGgGGGGd....',
  '.dGGgggggGGd....',
  '..dGGGGGGGd.....',
  '...ddddddd......',
  '...EEE..EEE.....',
  '..EEEE..EEEE....',
  '..EEE....EEE....',
  '..EE......EE....',
  '.EEEE....EEEE...',
  '.EEEE....EEEE...',
];
const KOOPA1 = [
  '......ggggg.....',
  '.....ggggggg....',
  '.....gWKgggg....',
  '.....gWKgggg....',
  '.....ggggggg....',
  '.....EEEEgg.....',
  '....EEEE........',
  '...dGGGGGd......',
  '..dGgGGgGGd.....',
  '.dGGgGGgGGGd....',
  '.dGgggggggGd....',
  '.dGGgGGgGGGd....',
  '.dGgGGgGGGGd....',
  '.dGGgggggGGd....',
  '..dGGGGGGGd.....',
  '...ddddddd......',
  '....EEEEEE......',
  '...EEEEEEE......',
  '...EEE.EEE......',
  '...EE..EEE......',
  '..EEEE.EEEE.....',
  '.......EEEE.....',
];
const SHELL = [
  '....dddddddd....',
  '..ddGGGGGGGGdd..',
  '.dGGgGGggGGgGGd.',
  '.dGgGGgGGgGGgGd.',
  'dGGgGGgGGgGGgGGd',
  'dGgggggggggggGGd',
  'dGGgGGgGGgGGgGGd',
  'dGgGGgGGgGGgGGGd',
  '.dGGgGGggGGgGGd.',
  '.dGGGGGGGGGGGGd.',
  '..ddddddddddd...',
  '.EEdddddddddEE..',
  '.EEE........EEE.',
  '................',
];

// ============================================================
// 食人花（16x24，两帧 嘴开/嘴合）
// ============================================================
const PIRANHA0 = [
  '....WW....WW....',
  '...WRRW..WRRW...',
  '..WRRRRWWRRRRW..',
  '..WRRRRRRRRRRW..',
  '.WRRWWRRRRWWRRW.',
  '.WRRWWRRRRWWRRW.',
  '.WRRRRRRRRRRRRW.',
  '..WRRRRRRRRRRW..',
  '..KWWWWWWWWWWK..',
  '...KWWWWWWWWK...',
  '....KKKKKKKK....',
  '......dGGd......',
  '..gg..dGGd..gg..',
  '.gggg.dGGd.gggg.',
  '.ggggggGGgggggg.',
  '..gg..dGGd..gg..',
  '......dGGd......',
  '......dGGd......',
  '......dGGd......',
  '......dGGd......',
  '......dGGd......',
  '......dGGd......',
  '......dGGd......',
  '......dGGd......',
];
const PIRANHA1 = [
  '................',
  '................',
  '....WWWWWWWW....',
  '..WWRRRRRRRRWW..',
  '.WRRRRRRRRRRRRW.',
  '.WRRWWRRRRWWRRW.',
  '.WRRWWRRRRWWRRW.',
  '.WRRRRRRRRRRRRW.',
  '..WRRRRRRRRRRW..',
  '...KWWWWWWWWK...',
  '....KKKKKKKK....',
  '......dGGd......',
  '..gg..dGGd..gg..',
  '.gggg.dGGd.gggg.',
  '.ggggggGGgggggg.',
  '..gg..dGGd..gg..',
  '......dGGd......',
  '......dGGd......',
  '......dGGd......',
  '......dGGd......',
  '......dGGd......',
  '......dGGd......',
  '......dGGd......',
  '......dGGd......',
];

// ============================================================
// Boss 库王（32x32）
// ============================================================
const BOSS0 = [
  '........gg......gg..............',
  '.......gWWg....gWWg.............',
  '.......gWWg....gWWg.............',
  '......ggggggggggggg.............',
  '.....gEEEEEEEEEEEEg.............',
  '....gEEWWKEEEEWWKEEg............',
  '....gEEWWKEEEEWWKEEg............',
  '....gEEEEEEEEEEEEEEg............',
  '...gEEEEEEEEEEEEEEEEg...........',
  '...gEEKKKKKKKKKKKKEEg...........',
  '...gEKWWWWWWWWWWWWKEg...........',
  '...gEKWKWWKWWKWWKWKEg...........',
  '...gEEKKKKKKKKKKKKEEg...........',
  '....gEEEEEEEEEEEEEEg............',
  '.....ggEEEEEEEEEEgg.............',
  '....ddGGGGGGGGGGdd..............',
  '...dGGgKgGGgKgGGGGd.............',
  '..dGGgKKKgKKKgGGGGGd............',
  '..dGGGgKgGGgKgGGGGGd..EE........',
  '..dGGGGGGGGGGGGGGGGd.EEE........',
  '..dGGgKgGGgKgGGGGGGdEEE.........',
  '..dGgKKKgKKKgGGGGGGdEE..........',
  '..dGGgKgGGgKgGGGGGdEE...........',
  '...dGGGGGGGGGGGGGdEE............',
  '....ddGGGGGGGGGdd...............',
  '...EEEddddddddEEE...............',
  '..EEEEE......EEEEE..............',
  '..EEEE........EEEE..............',
  '..EEE..........EEE..............',
  '.EEEEE........EEEEE.............',
  '.EEEEEE......EEEEEE.............',
  '..KKKK........KKKK..............',
];
// ============================================================
// 道具（16x16）
// ============================================================
const MUSHROOM = [
  '.....KKKKKK.....',
  '...KKRRRRRRKK...',
  '..KRRWWRRRRRRK..',
  '..KRWWWWRRWWRK..',
  '.KRRWWWWRRWWWRK.',
  '.KRWWWWRRRRWWRK.',
  '.KRRWWRRRRRRRRK.',
  '.KRRRRRRWWWWRRK.',
  '.KKRRRRRWWWWRKK.',
  '..KKKKKKKKKKKK..',
  '..KEEEKEEKEEEK..',
  '.KEEEEKEEKEEEEK.',
  '.KEEEEEEEEEEEEK.',
  '.KEEEEEEEEEEEEK.',
  '..KEEEEEEEEEEK..',
  '...KKKKKKKKKK...',
];
const FLOWER0 = [
  '....KKKKKKKK....',
  '...KFFFFFFFFK...',
  '..KFWWFFFFWWFK..',
  '..KFWWFFFFWWFK..',
  '..KFFFWWWWFFFK..',
  '...KFFWYYWFFK...',
  '...KFFWYYWFFK...',
  '..KFFFWWWWFFFK..',
  '..KFWWFFFFWWFK..',
  '...KFFFFFFFFK...',
  '....KKKKKKKK....',
  '......dGd.......',
  '.ggg..dGd..ggg..',
  '.gggggdGdggggg..',
  '..ggg.dGd.ggg...',
  '......dGd.......',
];
const STAR = [
  '.......KK.......',
  '......KYYK......',
  '......KYYK......',
  '.....KYYYYK.....',
  '.KKKKKYYYYKKKKK.',
  'KYYYYYYYYYYYYYYK',
  '.KYYYYYYYYYYYYK.',
  '..KYYKYYYYKYYK..',
  '...KYYKYYKYYK...',
  '...KYYYYYYYYK...',
  '..KYYYYYYYYYYK..',
  '..KYYYKYYKYYYK..',
  '.KYYYK.KK.KYYYK.',
  '.KYYK......KYYK.',
  '.KYK........KYK.',
  '..K..........K..',
];
const COIN0 = [
  '.....KKKKKK.....',
  '....KYYYYYYK....',
  '...KYYWWYYYYK...',
  '..KYYWWYYYYYYK..',
  '..KYWWYYYYYYyK..',
  '..KYWWYYYYYyyK..',
  '..KYWWYYYYYyyK..',
  '..KYWWYYYYYyyK..',
  '..KYWWYYYYYyyK..',
  '..KYWWYYYYYyyK..',
  '..KYWWYYYYYyyK..',
  '..KYYWYYYYYyyK..',
  '...KYYYYYYyyK...',
  '....KYYYYyyK....',
  '.....KKKKKK.....',
  '................',
];
const COIN1 = [
  '......KKKK......',
  '.....KYYYYK.....',
  '.....KYWYyK.....',
  '....KYWWYyyK....',
  '....KYWYYyyK....',
  '....KYWYYyyK....',
  '....KYWYYyyK....',
  '....KYWYYyyK....',
  '....KYWYYyyK....',
  '....KYWYYyyK....',
  '....KYWYYyyK....',
  '....KYWYyyyK....',
  '.....KYYYyK.....',
  '.....KYYyyK.....',
  '......KKKK......',
  '................',
];
const COIN2 = [
  '.......KK.......',
  '......KYYK......',
  '......KYyK......',
  '......KYyK......',
  '......KYyK......',
  '......KYyK......',
  '......KYyK......',
  '......KYyK......',
  '......KYyK......',
  '......KYyK......',
  '......KYyK......',
  '......KYyK......',
  '......KYyK......',
  '......KYyK......',
  '.......KK.......',
  '................',
];
const FIREBALL0 = [
  '..KFF...',
  '.KFFFL..',
  'KFFLLLL.',
  'KFLLWWL.',
  '.FLLWWLL',
  '.LLLLLL.',
  '..LLLL..',
  '........',
];
const FIREBALL1 = [
  '..LLLL..',
  '.LLLLLL.',
  'LLWWLLF.',
  'LWWLLFK.',
  '.LLLFFK.',
  '.LFFFK..',
  '..FFK...',
  '........',
];
const BOSSFIRE = [
  '......KFFFLLLLll',
  '..KKFFFLLWWLLLll',
  'KFFFFLLLWWWWLLll',
  '..KKFFFLLWWLLLll',
  '......KFFFLLLLll',
  '................',
];

// ============================================================
// 地形瓦片（16x16）
// ============================================================
const GROUND = [
  'PPPPPPPPPPPPPPPo',
  'POOOOOOOPOOOOOOo',
  'POOOOOOOPOOOOOOo',
  'POOOOOOOPOOOOOOo',
  'POOOOOOOPOOOOOOo',
  'POOOOOOOPOOOOOOo',
  'POOOOOOOPOOOOOOo',
  'oooooooooooooooo',
  'PPPPPPPoPPPPPPPP',
  'OOOOOOPoPOOOOOOO',
  'OOOOOOPoPOOOOOOO',
  'OOOOOOPoPOOOOOOO',
  'OOOOOOPoPOOOOOOO',
  'OOOOOOPoPOOOOOOO',
  'OOOOOOPoPOOOOOOO',
  'oooooooooooooooo',
];
const BRICK = [
  'PPPPPPPPPPPPPPPP',
  'OOOOOOOOOOOOOOOO',
  'OOOOOOOOOOOOOOOO',
  'KKKKKKKKKKKKKKKK',
  'OOOOOOOKOOOOOOOO',
  'OOOOOOOKOOOOOOOO',
  'OOOOOOOKOOOOOOOO',
  'KKKKKKKKKKKKKKKK',
  'OOOKOOOOOOOKOOOO',
  'OOOKOOOOOOOKOOOO',
  'OOOKOOOOOOOKOOOO',
  'KKKKKKKKKKKKKKKK',
  'OOOOOOOKOOOOOOOO',
  'OOOOOOOKOOOOOOOO',
  'OOOOOOOKOOOOOOOO',
  'KKKKKKKKKKKKKKKK',
];
const QUESTION = [
  'KKKKKKKKKKKKKKKK',
  'KWYYYYYYYYYYYYWK',
  'KYKYYYYYYYYYYKYK',
  'KYYYYKKKKKYYYYYK',
  'KYYYKKYYYKKYYYYK',
  'KYYYKKYYYKKYYYYK',
  'KYYYYYYYKKYYYYYK',
  'KYYYYYYKKYYYYYYK',
  'KYYYYYYKKYYYYYYK',
  'KYYYYYYKKYYYYYYK',
  'KYYYYYYYYYYYYYYK',
  'KYYYYYYKKYYYYYYK',
  'KYYYYYYKKYYYYYYK',
  'KYYYYYYYYYYYYYYK',
  'KWYYYYYYYYYYYYWK',
  'KKKKKKKKKKKKKKKK',
];
const QEMPTY = [
  'KKKKKKKKKKKKKKKK',
  'KPOOOOOOOOOOOOPK',
  'KOKOOOOOOOOOOKOK',
  'KOOOOOOOOOOOOOOK',
  'KOOOOOOOOOOOOOOK',
  'KOOOOOOOOOOOOOOK',
  'KOOOOOOOOOOOOOOK',
  'KOOOOOOOOOOOOOOK',
  'KOOOOOOOOOOOOOOK',
  'KOOOOOOOOOOOOOOK',
  'KOOOOOOOOOOOOOOK',
  'KOOOOOOOOOOOOOOK',
  'KOOOOOOOOOOOOOOK',
  'KOOOOOOOOOOOOOOK',
  'KPOOOOOOOOOOOOPK',
  'KKKKKKKKKKKKKKKK',
];
const BLOCK = [
  'PPPPPPPPPPPPPPPK',
  'POOOOOOOOOOOOOoK',
  'POOOOOOOOOOOOOoK',
  'POOOOOOOOOOOOOoK',
  'POOOOOOOOOOOOOoK',
  'POOOOOOOOOOOOOoK',
  'POOOOOOOOOOOOOoK',
  'POOOOOOOOOOOOOoK',
  'POOOOOOOOOOOOOoK',
  'POOOOOOOOOOOOOoK',
  'POOOOOOOOOOOOOoK',
  'POOOOOOOOOOOOOoK',
  'POOOOOOOOOOOOOoK',
  'POOOOOOOOOOOOOoK',
  'PoooooooooooooooK',
  'KKKKKKKKKKKKKKKK',
].map(r => r.slice(0, 16));
const CASTLEBRICK = [
  'AAAAAAAAAAAAAAAA',
  'AaaaaaaaKaaaaaaa',
  'AaaaaaaaKaaaaaaa',
  'KKKKKKKKKKKKKKKK',
  'AaaaKaaaaaaaKaaa',
  'AaaaKaaaaaaaKaaa',
  'AaaaKaaaaaaaKaaa',
  'KKKKKKKKKKKKKKKK',
  'AaaaaaaaKaaaaaaa',
  'AaaaaaaaKaaaaaaa',
  'AaaaaaaaKaaaaaaa',
  'KKKKKKKKKKKKKKKK',
  'AaaaKaaaaaaaKaaa',
  'AaaaKaaaaaaaKaaa',
  'AaaaKaaaaaaaKaaa',
  'KKKKKKKKKKKKKKKK',
];
const LAVA0 = [
  'lLlLLlLlLLlLlLLl',
  'LlLLlLlLLlLlLLlL',
  'LLLLLLLLLLLLLLLL',
  'LLLlLLLLlLLLLlLL',
  'LLLLLLLLLLLLLLLL',
  'LLLLLlLLLLLlLLLL',
  'LLLLLLLLLLLLLLLL',
  'LLlLLLLlLLLLLLlL',
  'LLLLLLLLLLLLLLLL',
  'LLLLlLLLLLlLLLLL',
  'LLLLLLLLLLLLLLLL',
  'LLlLLLLlLLLLlLLL',
  'LLLLLLLLLLLLLLLL',
  'LLLLLlLLLLLLLlLL',
  'LLLLLLLLLLLLLLLL',
  'LLLLLLLLLLLLLLLL',
];
const LAVA1 = [
  'LlLLlLlLLlLlLLlL',
  'lLlLLlLlLLlLlLLl',
  'LLLLLLLLLLLLLLLL',
  'LLLLlLLLLLlLLLLL',
  'LLLLLLLLLLLLLLLL',
  'LLlLLLLlLLLLlLLL',
  'LLLLLLLLLLLLLLLL',
  'LLLLLlLLLLLLLlLL',
  'LLLLLLLLLLLLLLLL',
  'LLLlLLLLlLLLLlLL',
  'LLLLLLLLLLLLLLLL',
  'LLLLLlLLLLLlLLLL',
  'LLLLLLLLLLLLLLLL',
  'LLlLLLLlLLLLLLlL',
  'LLLLLLLLLLLLLLLL',
  'LLLLLLLLLLLLLLLL',
];
// 水管（左半 / 右半 / 管口加宽边）
const PIPE_TL = [
  'KKKKKKKKKKKKKKKK',
  'KggGGGGGGGGGGGGG',
  'KggGGGGGGGGGGGGG',
  'KggGGGGGGGGGGGGG',
  'KggGGGGGGGGGGGGG',
  'KggGGGGGGGGGGGGG',
  'KggGGGGGGGGGGGGG',
  'KggGGGGGGGGGGGGG',
  'KggGGGGGGGGGGGGG',
  'KggGGGGGGGGGGGGG',
  'KggGGGGGGGGGGGGG',
  'KggGGGGGGGGGGGGG',
  'KggGGGGGGGGGGGGG',
  'KggGGGGGGGGGGGGG',
  'KKKKKKKKKKKKKKKK',
  '..KggGGGGGGGGGGG',
];
const PIPE_TR = [
  'KKKKKKKKKKKKKKKK',
  'GGGGGGGGdddddddK',
  'GGGGGGGGdddddddK',
  'GGGGGGGGdddddddK',
  'GGGGGGGGdddddddK',
  'GGGGGGGGdddddddK',
  'GGGGGGGGdddddddK',
  'GGGGGGGGdddddddK',
  'GGGGGGGGdddddddK',
  'GGGGGGGGdddddddK',
  'GGGGGGGGdddddddK',
  'GGGGGGGGdddddddK',
  'GGGGGGGGdddddddK',
  'GGGGGGGGdddddddK',
  'KKKKKKKKKKKKKKKK',
  'GGGGGGGGdddddK..',
];
const PIPE_BL = [
  '..KggGGGGGGGGGGG',
  '..KggGGGGGGGGGGG',
  '..KggGGGGGGGGGGG',
  '..KggGGGGGGGGGGG',
  '..KggGGGGGGGGGGG',
  '..KggGGGGGGGGGGG',
  '..KggGGGGGGGGGGG',
  '..KggGGGGGGGGGGG',
  '..KggGGGGGGGGGGG',
  '..KggGGGGGGGGGGG',
  '..KggGGGGGGGGGGG',
  '..KggGGGGGGGGGGG',
  '..KggGGGGGGGGGGG',
  '..KggGGGGGGGGGGG',
  '..KggGGGGGGGGGGG',
  '..KggGGGGGGGGGGG',
];
const PIPE_BR = [
  'GGGGGGGGdddddK..',
  'GGGGGGGGdddddK..',
  'GGGGGGGGdddddK..',
  'GGGGGGGGdddddK..',
  'GGGGGGGGdddddK..',
  'GGGGGGGGdddddK..',
  'GGGGGGGGdddddK..',
  'GGGGGGGGdddddK..',
  'GGGGGGGGdddddK..',
  'GGGGGGGGdddddK..',
  'GGGGGGGGdddddK..',
  'GGGGGGGGdddddK..',
  'GGGGGGGGdddddK..',
  'GGGGGGGGdddddK..',
  'GGGGGGGGdddddK..',
  'GGGGGGGGdddddK..',
];
const POLE = [
  '.......aA.......',
  '.......aA.......',
  '.......aA.......',
  '.......aA.......',
  '.......aA.......',
  '.......aA.......',
  '.......aA.......',
  '.......aA.......',
  '.......aA.......',
  '.......aA.......',
  '.......aA.......',
  '.......aA.......',
  '.......aA.......',
  '.......aA.......',
  '.......aA.......',
  '.......aA.......',
];
const POLETOP = [
  '......gGGg......',
  '.....gGGGGg.....',
  '.....GGGGGG.....',
  '.....GGGGGG.....',
  '.....gGGGGg.....',
  '......gGGg......',
  '.......aA.......',
  '.......aA.......',
  '.......aA.......',
  '.......aA.......',
  '.......aA.......',
  '.......aA.......',
  '.......aA.......',
  '.......aA.......',
  '.......aA.......',
  '.......aA.......',
];
const FLAG = [
  'GGGGGGGGGGGGGG..',
  'GWWGGGGGGGGG....',
  'GWWWWGGGGGG.....',
  'GGGWWWWGGG......',
  'GGGGGWWG........',
  'GGGGGGG.........',
  'GGGGG...........',
  'GGG.............',
  'G...............',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
];
const FRAG = [
  'PPOO....',
  'POOO....',
  'OOOo....',
  'Oooo....',
  '........',
  '........',
  '........',
  '........',
];

// ============================================================
// 程序化绘制的背景元素
// ============================================================
function makeCloud(scene) {
  const c = document.createElement('canvas');
  c.width = 48; c.height = 24;
  const x = c.getContext('2d');
  x.fillStyle = '#ffffff';
  x.beginPath();
  x.arc(12, 16, 8, 0, 7); x.arc(24, 12, 10, 0, 7); x.arc(36, 16, 8, 0, 7);
  x.fill();
  x.fillRect(8, 16, 32, 8);
  scene.textures.addCanvas('cloud', c);
}
function makeBush(scene) {
  const c = document.createElement('canvas');
  c.width = 48; c.height = 16;
  const x = c.getContext('2d');
  x.fillStyle = '#80d010';
  x.beginPath();
  x.arc(10, 12, 8, 0, 7); x.arc(24, 8, 10, 0, 7); x.arc(38, 12, 8, 0, 7);
  x.fill();
  x.fillRect(6, 10, 36, 6);
  scene.textures.addCanvas('bush', c);
}
function makeHill(scene) {
  const c = document.createElement('canvas');
  c.width = 80; c.height = 40;
  const x = c.getContext('2d');
  x.fillStyle = '#00a800';
  x.beginPath();
  x.moveTo(0, 40); x.lineTo(40, 0); x.lineTo(80, 40);
  x.closePath(); x.fill();
  x.fillStyle = '#005800';
  x.fillRect(20, 20, 3, 3); x.fillRect(50, 26, 3, 3); x.fillRect(36, 12, 3, 3);
  scene.textures.addCanvas('hill', c);
}
function makeGradient(scene, key, stops) {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 480;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 480);
  stops.forEach(([pos, color]) => g.addColorStop(pos, color));
  x.fillStyle = g;
  x.fillRect(0, 0, 32, 480);
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, c);
}
function makeSun(scene) {
  const c = document.createElement('canvas');
  c.width = 96; c.height = 96;
  const x = c.getContext('2d');
  const glow = x.createRadialGradient(48, 48, 18, 48, 48, 48);
  glow.addColorStop(0, 'rgba(255,250,200,0.95)');
  glow.addColorStop(0.5, 'rgba(255,240,160,0.35)');
  glow.addColorStop(1, 'rgba(255,240,160,0)');
  x.fillStyle = glow;
  x.fillRect(0, 0, 96, 96);
  x.fillStyle = '#fff8d0';
  x.beginPath(); x.arc(48, 48, 20, 0, 7); x.fill();
  scene.textures.addCanvas('sun', c);
}
function makeMountain(scene) {
  const c = document.createElement('canvas');
  c.width = 192; c.height = 80;
  const x = c.getContext('2d');
  x.fillStyle = '#2e7d4f';
  x.beginPath(); x.moveTo(0, 80); x.lineTo(64, 8); x.lineTo(128, 80); x.closePath(); x.fill();
  x.fillStyle = '#256b42';
  x.beginPath(); x.moveTo(72, 80); x.lineTo(140, 24); x.lineTo(192, 80); x.closePath(); x.fill();
  x.fillStyle = '#e8f4ff';
  x.beginPath(); x.moveTo(56, 17); x.lineTo(64, 8); x.lineTo(72, 17); x.lineTo(64, 22); x.closePath(); x.fill();
  scene.textures.addCanvas('mountain', c);
}
function makeSpark(scene) {
  const c = document.createElement('canvas');
  c.width = 9; c.height = 9;
  const x = c.getContext('2d');
  x.fillStyle = '#fff6b0';
  x.fillRect(4, 0, 1, 9); x.fillRect(0, 4, 9, 1);
  x.fillStyle = '#ffffff';
  x.fillRect(4, 3, 1, 3); x.fillRect(3, 4, 3, 1);
  scene.textures.addCanvas('spark', c);
}
function makeDust(scene) {
  const c = document.createElement('canvas');
  c.width = 8; c.height = 8;
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(240,235,220,0.9)';
  x.beginPath(); x.arc(4, 4, 3, 0, 7); x.fill();
  scene.textures.addCanvas('dust', c);
}

function makeCastleFlagTex(scene) {
  // 终点城堡 80x80
  const c = document.createElement('canvas');
  c.width = 80; c.height = 80;
  const x = c.getContext('2d');
  x.fillStyle = '#b0b0b0';
  x.fillRect(16, 32, 48, 48);   // 主体
  x.fillRect(0, 56, 80, 24);    // 底座
  x.fillStyle = '#686868';
  for (let i = 0; i < 5; i++) x.fillRect(16 + i * 10, 32, 5, 6);  // 城垛
  for (let i = 0; i < 8; i++) x.fillRect(i * 10, 56, 5, 6);
  x.fillStyle = '#000000';
  x.fillRect(34, 56, 12, 24);   // 门
  x.beginPath(); x.arc(40, 56, 6, Math.PI, 0); x.fill();
  x.fillStyle = '#686868';
  x.fillRect(24, 44, 8, 8); x.fillRect(48, 44, 8, 8);  // 窗
  scene.textures.addCanvas('castle', c);
}

// ============================================================
// 入口：生成全部纹理 + 动画
// ============================================================
const TextureFactory = {
  // 主角纹理单独生成，导入头像后可在线重建
  generatePlayers(scene) {
    makePlayerTex(scene, 'ps-idle', PS_IDLE, null, FACE_SMALL);
    makePlayerTex(scene, 'ps-walk', PS_WALK, null, FACE_SMALL);
    makePlayerTex(scene, 'ps-jump', PS_JUMP, null, FACE_SMALL);
    makePlayerTex(scene, 'pb-idle', PB_IDLE, null, FACE_BIG);
    makePlayerTex(scene, 'pb-walk', PB_WALK, null, FACE_BIG);
    makePlayerTex(scene, 'pb-jump', PB_JUMP, null, FACE_BIG);
    makePlayerTex(scene, 'pf-idle', PB_IDLE, FIRE_SWAP, FACE_BIG);
    makePlayerTex(scene, 'pf-walk', PB_WALK, FIRE_SWAP, FACE_BIG);
    makePlayerTex(scene, 'pf-jump', PB_JUMP, FIRE_SWAP, FACE_BIG);
  },

  generateAll(scene) {
    this.generatePlayers(scene);
    // 敌人
    makeTex(scene, 'goomba0', GOOMBA);
    makeTex(scene, 'goomba1', mirror(GOOMBA));
    makeTex(scene, 'goomba-flat', GOOMBA_FLAT);
    makeTex(scene, 'koopa0', KOOPA0);
    makeTex(scene, 'koopa1', KOOPA1);
    makeTex(scene, 'shell', SHELL);
    makeTex(scene, 'piranha0', PIRANHA0);
    makeTex(scene, 'piranha1', PIRANHA1);
    makeTex(scene, 'boss0', BOSS0);
    makeTex(scene, 'boss1', mirror(BOSS0));
    // 道具
    makeTex(scene, 'mushroom', MUSHROOM);
    makeTex(scene, 'flower0', FLOWER0);
    makeTex(scene, 'flower1', FLOWER0, { 'F': '#fcc000', 'Y': '#d82800' });
    makeTex(scene, 'star', STAR);
    makeTex(scene, 'coin0', COIN0);
    makeTex(scene, 'coin1', COIN1);
    makeTex(scene, 'coin2', COIN2);
    makeTex(scene, 'fireball0', FIREBALL0);
    makeTex(scene, 'fireball1', FIREBALL1);
    makeTex(scene, 'bossfire', BOSSFIRE);
    // 地形
    makeTex(scene, 'ground', GROUND);
    makeTex(scene, 'groundU', GROUND, { 'P': '#88d8d8', 'O': '#00a8a8', 'o': '#004858' });
    makeTex(scene, 'brick', BRICK);
    makeTex(scene, 'brickU', BRICK, { 'P': '#88d8d8', 'O': '#00a8a8', 'o': '#004858' });
    makeTex(scene, 'question', QUESTION);
    makeTex(scene, 'qempty', QEMPTY);
    makeTex(scene, 'block', BLOCK);
    makeTex(scene, 'blockU', BLOCK, { 'P': '#88d8d8', 'O': '#00a8a8', 'o': '#004858' });
    makeTex(scene, 'castlebrick', CASTLEBRICK);
    makeTex(scene, 'lava0', LAVA0);
    makeTex(scene, 'lava1', LAVA1);
    makeTex(scene, 'pipeTL', PIPE_TL);
    makeTex(scene, 'pipeTR', PIPE_TR);
    makeTex(scene, 'pipeBL', PIPE_BL);
    makeTex(scene, 'pipeBR', PIPE_BR);
    makeTex(scene, 'pole', POLE);
    makeTex(scene, 'poletop', POLETOP);
    makeTex(scene, 'flag', FLAG);
    makeTex(scene, 'frag', FRAG);
    // 背景
    makeCloud(scene);
    makeBush(scene);
    makeHill(scene);
    makeCastleFlagTex(scene);
    // 氛围与特效
    makeGradient(scene, 'sky-day', [[0, '#5ab0f8'], [0.55, '#8fd0ff'], [1, '#cfeeff']]);
    makeGradient(scene, 'sky-cave', [[0, '#05051a'], [0.6, '#10103a'], [1, '#1c1c50']]);
    makeGradient(scene, 'sky-castle', [[0, '#16090b'], [0.6, '#2a1014'], [1, '#3c1418']]);
    makeSun(scene);
    makeMountain(scene);
    makeSpark(scene);
    makeDust(scene);
  },

  createAnims(scene) {
    const A = scene.anims;
    const mk = (key, frames, rate, repeat) => {
      if (A.exists(key)) return;
      A.create({ key, frames: frames.map(f => ({ key: f })), frameRate: rate, repeat });
    };
    mk('ps-run', ['ps-idle', 'ps-walk'], 10, -1);
    mk('pb-run', ['pb-idle', 'pb-walk'], 10, -1);
    mk('pf-run', ['pf-idle', 'pf-walk'], 10, -1);
    mk('goomba-walk', ['goomba0', 'goomba1'], 5, -1);
    mk('koopa-walk', ['koopa0', 'koopa1'], 5, -1);
    mk('piranha-chomp', ['piranha0', 'piranha1'], 3, -1);
    mk('boss-walk', ['boss0', 'boss1'], 4, -1);
    mk('coin-spin', ['coin0', 'coin1', 'coin2', 'coin1'], 8, -1);
    mk('fireball-spin', ['fireball0', 'fireball1'], 10, -1);
    mk('flower-glow', ['flower0', 'flower1'], 4, -1);
    mk('lava-bubble', ['lava0', 'lava1'], 3, -1);
  },
};
